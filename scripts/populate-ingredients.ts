import mongoose from 'mongoose';
import fs from 'node:fs';
import path from 'node:path';
import {
  OsrsboxItemModel,
  type OsrsboxItemDocument,
} from '../src/lib/models/mongo-schemas/osrsbox-db-item-schema';
import {
  getCreationMethodsForItem,
  type CreationMethod as WikiCreationMethod,
  type CreationRequirement as WikiRequirement,
} from './osrs-wiki-creation';
import logUpdate from 'log-update';
import type {
  GameItemCreationSpecs,
  GameItemCreationExperienceGranted,
  GameItemCreationIngredient,
  SkillLevelDesignation,
} from '../src/lib/models/osrsbox-db-item';

/**
 * ====================================================================================================================
 * Variable setup.
 * ====================================================================================================================
 */

const user = process.env.VITE_MONGO_USERNAME;
const pw = process.env.VITE_MONGO_PASSWORD;
const cluster = process.env.VITE_MONGO_DB_CLUSTER_NAME;
const host = process.env.VITE_MONGO_DB_HOST;
const dbName = process.env.VITE_MONGO_DB_DB_NAME || 'osrsbox';
const prepend = 'mongodb+srv';
const append = '?retryWrites=true&w=majority';
const connectionString = `${prepend}://${user}:${pw}@${cluster}.${host}/${dbName}${append}`;
const BATCH_FETCH_LIMIT = 250;
let lastProcessedIdForResume: string | null = null;
const progressState = {
  processed: 0,
  total: 0,
  active: false,
  startedAt: null as number | null,
  processedOffset: 0,
  recentRequests: [] as number[],
};
let isShuttingDown = false;
const originalConsole = {
  log: console.log.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
};

function recordAtlasRequest(timestamp: number = Date.now()) {
  progressState.recentRequests.push(timestamp);
  const cutoff = timestamp - 60_000;
  progressState.recentRequests = progressState.recentRequests.filter((ts) => ts >= cutoff);
}

function logWithProgress(method: 'log' | 'warn' | 'error', message?: unknown, ...args: unknown[]) {
  if (progressState.active) logUpdate.clear();
  originalConsole[method](message as any, ...args);
  if (progressState.active) renderProgressLine(progressState.processed, progressState.total);
}

console.log = (...args: unknown[]) => logWithProgress('log', ...args);
console.warn = (...args: unknown[]) => logWithProgress('warn', ...args);
console.error = (...args: unknown[]) => logWithProgress('error', ...args);

async function performCleanup(params?: { reason?: string; exitCode?: number; exitAfter?: boolean }) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  const { reason, exitCode = 0, exitAfter = true } = params ?? {};

  if (reason) logWithProgress('log', `[creation-importer] Shutting down (${reason})...`);

  try {
    writeErrorReport();
  } catch (reportErr) {
    logWithProgress('error', '🚨 [creation-importer] Failed to write error report:', reportErr);
  }

  try {
    await mongoose.disconnect();
  } catch (disconnectErr) {
    logWithProgress('error', '🚨 [creation-importer] Error disconnecting from MongoDB:', disconnectErr);
  }

  logUpdate.done();
  progressState.active = false;

  if (exitAfter) process.exit(exitCode);
}

process.once('SIGINT', () => {
  void performCleanup({ reason: 'SIGINT', exitCode: 0 });
});

function formatDuration(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function renderProgressLine(processed: number, total: number) {
  progressState.processed = processed;
  progressState.total = total;
  progressState.active = total > 0;
  if (!progressState.startedAt && total > 0) {
    progressState.startedAt = Date.now();
  }

  if (!total) {
    logUpdate('ℹ️ [creation-importer] Progress: no items to process.');
    return;
  }

  const percentage = Math.min(100, (processed / total) * 100);
  const barLength = 30;
  const filledLength = Math.min(barLength, Math.round((processed / total) * barLength));
  const bar = `${'█'.repeat(filledLength)}${'░'.repeat(barLength - filledLength)}`;
  const percentText = percentage.toFixed(2).padStart(6, ' ');
  const lastHint = lastProcessedIdForResume ? ` | last _id=${lastProcessedIdForResume}` : '';

  const elapsedMs = progressState.startedAt ? Date.now() - progressState.startedAt : 0;
  const processedSinceStart = Math.max(0, processed - progressState.processedOffset);
  const avgMsPerItem = processedSinceStart > 0 ? elapsedMs / processedSinceStart : 0;
  const remaining = Math.max(0, total - processed);
  const etaMs = processed > 0 ? avgMsPerItem * remaining : 0;
  const etaText = processed > 0 ? ` | ETA ~${formatDuration(etaMs)}` : '';
  const now = Date.now();
  progressState.recentRequests = progressState.recentRequests.filter((ts) => now - ts <= 60_000);
  const rpm = progressState.recentRequests.length;
  const rpmText = ` | ~${rpm} req/min (limited to 500 by Atlas free tier)`;

  logUpdate(
    `⏳ [creation-importer] Progress ${processed}/${total} ${bar} ${percentText}%${etaText}${rpmText}${lastHint}`,
  );
}

/**
 * ====================================================================================================================
 * Error tracking
 * ====================================================================================================================
 */

const ownerNotFoundErrors: string[] = [];
const noWikiMethodsErrors: string[] = [];
const creationSpecsEmptyErrors: string[] = [];
const unresolvedIngredientErrors: string[] = [];

function logOwnerNotFound(identifier: string) {
  ownerNotFoundErrors.push(`identifier="${identifier}"`);
}

function logNoWikiMethods(owner: OsrsboxItemDocument, identifier: string, normalizedTitle: string) {
  noWikiMethodsErrors.push(
    `_id=${owner._id.toString()} | name="${owner.name}" | wiki_name="${owner.wiki_name}" | identifier="${identifier}" | normalizedTitle="${normalizedTitle}"`,
  );
}

function logCreationSpecsEmpty(owner: OsrsboxItemDocument, identifier: string) {
  creationSpecsEmptyErrors.push(
    `_id=${owner._id.toString()} | name="${owner.name}" | wiki_name="${owner.wiki_name}" | identifier="${identifier}"`,
  );
}

function logUnresolvedIngredient(owner: OsrsboxItemDocument, ingredientName: string) {
  unresolvedIngredientErrors.push(
    `_id=${owner._id.toString()} | name="${owner.name}" | ingredient="${ingredientName}"`,
  );
}

/**
 * Write all collected errors to a log file in the same directory as this script.
 */
function writeErrorReport() {
  const errorLogPath = path.join(__dirname, 'creation-import-errors-2.log');
  const lines: string[] = [];
  const timestamp = new Date().toISOString();

  lines.push('# Creation import unresolved ingredient report');
  lines.push(`# Generated at ${timestamp}`);
  lines.push('');

  if (!unresolvedIngredientErrors.length) {
    lines.push('No unresolved ingredient names recorded.');
  } else {
    lines.push('## Unresolved ingredient names (could not map to OsrsboxItem):');
    for (const e of unresolvedIngredientErrors) lines.push(`- ${e}`);
    lines.push('');
  }

  fs.writeFileSync(errorLogPath, lines.join('\n'), 'utf8');
  logWithProgress('log', `[creation-importer] Error report written to ${errorLogPath}`);
}

/**
 * ====================================================================================================================
 * Utility functions and types.
 * ====================================================================================================================
 */

function normalizeTitleForLookup(title: string): string {
  // Strip dose-style suffixes: "Prayer potion(4)" -> "Prayer potion"
  const doseMatch = title.match(/^(.*?)(\(\d+\))$/);
  if (doseMatch) {
    return doseMatch[1].trim();
  }
  return title.trim();
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isCursorNotFoundError(err: unknown): boolean {
  return Boolean(
    err &&
      typeof err === 'object' &&
      'code' in err &&
      // Mongo cursor-not-found error code
      (err as { code?: unknown }).code === 43,
  );
}

type ImportOptions = {
  /**
   * When true, items that already have creationSpecs will be skipped.
   * Default is false so existing records get refreshed with the latest data.
   */
  skipExisting?: boolean;
  /**
   * Resume after the given Mongo ObjectId (string). Any items before or matching this id will be skipped.
   */
  resumeFromId?: string;
};

/**
 * Find an OsrsboxItem by wiki_name or name, with some lenient matching.
 */
async function findItemByDisplayName(name: string): Promise<OsrsboxItemDocument | null> {
  const trimmed = name.trim();

  // 1) Exact wiki_name
  let doc = await OsrsboxItemModel.findOne({ wiki_name: trimmed }).exec();
  if (doc) return doc;

  // 2) Exact in-game name
  doc = await OsrsboxItemModel.findOne({ name: trimmed }).exec();
  if (doc) return doc;

  // 3) Case-insensitive wiki_name
  doc = await OsrsboxItemModel.findOne({
    wiki_name: { $regex: new RegExp(`^${escapeRegex(trimmed)}$`, 'i') },
  }).exec();
  if (doc) return doc;

  // 4) Case-insensitive name
  doc = await OsrsboxItemModel.findOne({
    name: { $regex: new RegExp(`^${escapeRegex(trimmed)}$`, 'i') },
  }).exec();
  if (doc) return doc;

  return null;
}

/**
 * Resolve an item name from the wiki parser to an OsrsboxItemDocument._id,
 * with a small cache to avoid repeated lookups.
 */
async function resolveItemIdForName(
  name: string,
  owner: OsrsboxItemDocument,
  cache: Map<string, mongoose.Types.ObjectId>,
): Promise<mongoose.Types.ObjectId | null> {
  const key = name.trim();

  // Use cache if possible
  const cached = cache.get(key);
  if (cached) return cached;

  // If this is clearly the same as the owner, short-circuit
  const normName = key.toLowerCase();
  const ownerNames = [
    owner.name?.toLowerCase(),
    owner.wiki_name?.toLowerCase(),
  ].filter(Boolean) as string[];

  if (ownerNames.includes(normName)) {
    cache.set(key, owner._id);
    return owner._id;
  }

  const doc = await findItemByDisplayName(key);
  if (!doc) {
    logWithProgress('warn', `🚨 [creation-importer] Could not resolve item name -> document: "${name}"`);
    logUnresolvedIngredient(owner, name);
    return null;
  }

  cache.set(key, doc._id);
  return doc._id;
}

// ----- mapping wiki -> DB shapes -----

/**
 * Extract required skills / experience from wiki requirements, ignoring
 * non-skill rows such as Members/Ticks/Tools/Facilities.
 */
function extractSkillRequirements(
  wikiReqs: WikiRequirement[],
): {
  requiredSkills: SkillLevelDesignation[];
  experienceGranted: GameItemCreationExperienceGranted[];
} {
  const requiredSkills: SkillLevelDesignation[] = [];
  const experienceGranted: GameItemCreationExperienceGranted[] = [];

  for (const r of wikiReqs) {
    // Only care about rows that actually have a skill name
    if (!r.skill) continue;

    if (typeof r.level === 'number') {
      requiredSkills.push({
        skillName: r.skill,
        skillLevel: r.level,
      });
    }

    // xp property isn’t in the WikiRequirement type, but we added it to our parser
    const xp = (r as { xp?: number }).xp;
    if (typeof xp === 'number') {
      experienceGranted.push({
        skillName: r.skill,
        experienceAmount: xp,
      });
    }
  }

  return { requiredSkills, experienceGranted };
}

async function mapWikiMethodToCreationSpecs(
  wikiMethod: WikiCreationMethod,
  owner: OsrsboxItemDocument,
  cache: Map<string, mongoose.Types.ObjectId>,
): Promise<GameItemCreationSpecs> {
  const { requiredSkills, experienceGranted } = extractSkillRequirements(
    wikiMethod.requirements,
  );

  const ingredients: GameItemCreationIngredient[] = [];

  // 1) Normal materials (consumed = true/false based on wiki data)
  for (const m of wikiMethod.materials) {
    const itemId = await resolveItemIdForName(m.item.name, owner, cache);
    if (!itemId) continue;

    ingredients.push({
      consumedDuringCreation: m.consumed,
      amount: m.quantity,
      item: itemId,
    });
  }

  // 2) Tools from requirements (consumed = false)
  for (const r of wikiMethod.requirements) {
    const desc = (r.description ?? '').trim();
    if (!desc) continue;

    // Look for rows like "Tools: Hammer" or "Tools: Saw, Hammer"
    if (!desc.toLowerCase().startsWith('tools')) continue;

    const afterColon = desc.split(':', 2)[1] ?? '';
    const toolNames = afterColon
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean);

    for (const toolName of toolNames) {
      const itemId = await resolveItemIdForName(toolName, owner, cache);
      if (!itemId) continue;

      ingredients.push({
        consumedDuringCreation: false,
        amount: 1,
        item: itemId,
      });
    }
  }

  return {
    requiredSkills,
    experienceGranted,
    ingredients,
  };
}

// ----- public API -----

function looksLikeObjectId(value: string): boolean {
  return /^[0-9a-fA-F]{24}$/.test(value);
}

/**
 * Import creation methods for a single item, given a CLI identifier.
 * The identifier can be:
 *   - a MongoDB ObjectId string, or
 *   - the exact in-game / wiki item name.
 *
 * Flow:
 *   - resolve the owning OsrsboxItem from Mongo
 *   - call the wiki scraper (with normalized title + fallbacks)
 *   - map results into creationSpecs
 *   - save them on the item doc
 */
export async function importCreationForItemTitle(
  identifier: string,
  options: ImportOptions = {},
): Promise<void> {
  let owner: OsrsboxItemDocument | null = null;

  // 1) If it looks like an ObjectId, try that first
  if (looksLikeObjectId(identifier)) {
    owner = await OsrsboxItemModel.findById(identifier).exec();
  }

  // 2) If not found by id (or not an id), try exact matches on name/wiki_name
  if (!owner) {
    owner =
      (await OsrsboxItemModel.findOne({ name: identifier }).exec()) ||
      (await OsrsboxItemModel.findOne({ wiki_name: identifier }).exec());
  }

  // 3) As a last resort, use the lenient finder (case-insensitive, etc.)
  if (!owner) {
    owner = await findItemByDisplayName(identifier);
  }

  if (!owner) {
    logWithProgress(
      'warn',
      `[creation-importer] No OsrsboxItem found for identifier "${identifier}"`,
    );
    logOwnerNotFound(identifier);
    return;
  }

  if (options.skipExisting && owner.creationSpecs?.length) {
    logWithProgress(
      'log',
      `[creation-importer] Skipping "${identifier}" because creation specs already exist (use without --skip-existing to refresh).`,
    );
    return;
  }

  // Decide what title to use for the wiki: prefer wiki_name, then name
  const baseTitle = owner.wiki_name ?? owner.name;
  const normalizedTitle = normalizeTitleForLookup(baseTitle);

  // Try normalized wiki title first (e.g. strip dose), then fall back to raw
  let wikiMethods = await getCreationMethodsForItem(normalizedTitle);

  if (!wikiMethods.length && normalizedTitle !== baseTitle) {
    wikiMethods = await getCreationMethodsForItem(baseTitle);
  }

  // As a final fallback, if the CLI identifier differs from baseTitle, try that too
  if (!wikiMethods.length && identifier !== baseTitle && identifier !== normalizedTitle) {
    wikiMethods = await getCreationMethodsForItem(identifier);
  }

  if (!wikiMethods.length) {
    logWithProgress(
      'warn',
      `⚠️ [creation-importer] No creation methods from wiki for "${normalizedTitle}" (base="${baseTitle}", identifier="${identifier}")`,
    );
    logNoWikiMethods(owner, identifier, normalizedTitle);
    return;
  }

  const cache = new Map<string, mongoose.Types.ObjectId>();
  const creationSpecs: GameItemCreationSpecs[] = [];

  for (const m of wikiMethods) {
    const specs = await mapWikiMethodToCreationSpecs(m, owner, cache);

    // If a method has no skills and no ingredients, it's probably junk – skip it.
    const hasSkills =
      specs.requiredSkills.length > 0 || specs.experienceGranted.length > 0;
    const hasIngredients = specs.ingredients.length > 0;

    if (!hasSkills && !hasIngredients) {
      logWithProgress(
        'warn',
        `[creation-importer] Skipping method for "${identifier}" with no skills or ingredients (methodName="${m.methodName}")`,
      );
      continue;
    }

    creationSpecs.push(specs);
  }

  if (!creationSpecs.length) {
    logWithProgress(
      'warn',
      `[creation-importer] No valid creationSpecs built for "${identifier}" after filtering.`,
    );
    logCreationSpecsEmpty(owner, identifier);
    return;
  }

  const hadExistingSpecs = owner.creationSpecs?.length ?? 0;

  owner.creationSpecs = creationSpecs;
  await owner.save();

  const action = hadExistingSpecs ? 'Updated' : 'Saved';

  logWithProgress(
    'log',
    `✅ [creation-importer] ${action} ${creationSpecs.length} creation spec(s) for "${
      owner.wiki_name ?? owner.name
    }".`,
  );
}

/**
 * Batch importer:
 *   - Iterate over every item in the DB
 *   - Fetch & store creation specs for each.
 */
export async function importCreationForAllItems(options: ImportOptions = {}): Promise<void> {
  let resumeObjectId: mongoose.Types.ObjectId | null = null;

  if (options.resumeFromId) {
    try {
      resumeObjectId = new mongoose.Types.ObjectId(options.resumeFromId);
    } catch {
      logWithProgress(
        'warn',
        `⚠️ [creation-importer] --resume-from "${options.resumeFromId}" is not a valid ObjectId; ignoring.`,
      );
      resumeObjectId = null;
    }
  }

  const resumeIdFound = resumeObjectId
    ? Boolean(await OsrsboxItemModel.exists({ _id: resumeObjectId }))
    : false;

  const baseFilter: Record<string, unknown> = {};

  if (options.skipExisting) {
    baseFilter.$or = [
      { creationSpecs: { $exists: false } },
      { creationSpecs: { $size: 0 } },
    ];
  }

  const totalToProcess = await OsrsboxItemModel.countDocuments(baseFilter).exec();
  recordAtlasRequest();

  const processedStart = resumeObjectId
    ? await OsrsboxItemModel.countDocuments({
        ...baseFilter,
      _id: { $lte: resumeObjectId },
      }).exec()
    : 0;
  recordAtlasRequest();

  let processed = processedStart;
  let skippedExisting = 0;
  let lastId: mongoose.Types.ObjectId | null = resumeObjectId;
  if (resumeObjectId) lastProcessedIdForResume = resumeObjectId.toString();
  progressState.startedAt = null;
  progressState.processedOffset = processedStart;
  renderProgressLine(processed, totalToProcess);

  try {
    while (true) {
      const query = {
        ...baseFilter,
        ...(lastId ? { _id: { $gt: lastId } } : {}),
      };

      const docs = await OsrsboxItemModel.find(query, { _id: 1, creationSpecs: 1 })
        .sort({ _id: 1 })
        .limit(BATCH_FETCH_LIMIT)
        .lean<{ _id: mongoose.Types.ObjectId; creationSpecs?: unknown[] }[]>()
        .exec();
      recordAtlasRequest();
      progressState.recentRequests.push(Date.now());

      if (!docs.length) break;

      for (const doc of docs) {
        const idStr = doc._id.toString();

        const hasCreationSpecs =
          Array.isArray((doc as OsrsboxItemDocument).creationSpecs) &&
          !!(doc as OsrsboxItemDocument).creationSpecs?.length;

        if (options.skipExisting && hasCreationSpecs) {
          skippedExisting++;
          continue;
        }

        try {
          await importCreationForItemTitle(idStr, options);
        } catch (err) {
          logWithProgress(
            'error',
            `🚨 [creation-importer] Error importing creation methods for _id=${idStr}:`,
            err,
          );
          logOwnerNotFound(`${idStr} (exception during import)`);
        } finally {
          recordAtlasRequest();
          processed++;
          lastProcessedIdForResume = idStr;
          renderProgressLine(processed, totalToProcess);
          if (processed % 100 === 0) {
            logWithProgress('log', `ℹ️ [creation-importer] Processed ${processed} items...`);
          }
        }
      }

      lastId = docs[docs.length - 1]._id;
    }
  } catch (err) {
    if (isCursorNotFoundError(err)) {
      logWithProgress(
        'error',
        '🚨 [creation-importer] Mongo cursor was lost (code 43 CursorNotFound). This can happen if the connection idles or is interrupted. Rerun to continue.',
      );
    } else {
      logWithProgress('error', '🚨 [creation-importer] Unexpected error while iterating cursor:', err);
    }
    throw err;
  } finally {
    logUpdate.done();
    progressState.active = false;
  }

  if (options.resumeFromId && !resumeIdFound) {
    logWithProgress(
      'warn',
      `⚠️ [creation-importer] --resume-from id "${options.resumeFromId}" was not found; processed items from the start of the collection.`,
    );
  }

  const skippedText = options.skipExisting
    ? ` Skipped ${skippedExisting} item(s) that already had creation specs.`
    : '';

  logWithProgress('log', `[creation-importer] Finished processing ${processed} items.${skippedText}`);
}

/**
 * ====================================================================================================================
 * CLI entrypoint.
 * ====================================================================================================================
 */

async function main() {
  const args = process.argv.slice(2);
  let skipExisting = false;
  let resumeFromId: string | undefined;
  const positionalArgs: string[] = [];
  lastProcessedIdForResume = null;
  progressState.startedAt = null;
  progressState.processedOffset = 0;
  progressState.recentRequests = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '--skip-existing') {
      skipExisting = true;
      continue;
    }

    if (arg === '--resume-from') {
      resumeFromId = args[i + 1];
      i++; // skip value
      continue;
    }

    if (arg.startsWith('--resume-from=')) {
      resumeFromId = arg.split('=')[1];
      continue;
    }

    positionalArgs.push(arg);
  }

  const arg = positionalArgs[0];

  if (!user || !pw || !cluster || !host) {
    logWithProgress('error', '[creation-importer] Missing MongoDB env vars.');
    process.exit(1);
  }

  logWithProgress('log', `[creation-importer] Connecting to MongoDB...`);
  await mongoose.connect(connectionString);

  try {
    if (skipExisting) {
      logWithProgress('log', '[creation-importer] Will skip items that already have creation specs (--skip-existing).');
    } else {
      logWithProgress('log', '[creation-importer] Existing creation specs will be refreshed if wiki data is available.');
    }

    if (resumeFromId) {
      logWithProgress('log', `[creation-importer] Will resume after _id=${resumeFromId} (skipping it and anything before it).`);
    }

    if (!arg || arg === '--all') {
      logWithProgress('log', '[creation-importer] Running in batch mode over all items...');
      await importCreationForAllItems({ skipExisting, resumeFromId });
    } else {
      logWithProgress('log', `[creation-importer] Importing creation specs for "${arg}"...`);
      await importCreationForItemTitle(arg, { skipExisting });
    }
  } catch (err) {
    logWithProgress('error', '🚨 [creation-importer] Unhandled error:', err);
    if (lastProcessedIdForResume) {
      logWithProgress(
        'log',
        `ℹ️ [creation-importer] To resume after the last successful item, run with --resume-from ${lastProcessedIdForResume}`,
      );
    }
  } finally {
    await performCleanup({ reason: 'normal completion', exitAfter: false });
    process.exit(0);
  }
}

// Only run main when executed directly, not when imported as a module
if (require.main === module) {
  void main();
}
