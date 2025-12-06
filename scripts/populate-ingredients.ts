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
  const errorLogPath = path.join(__dirname, 'creation-import-errors.log');
  const lines: string[] = [];
  const timestamp = new Date().toISOString();

  lines.push('# Creation import error report');
  lines.push(`# Generated at ${timestamp}`);
  lines.push('');

  if (
    !ownerNotFoundErrors.length &&
    !noWikiMethodsErrors.length &&
    !creationSpecsEmptyErrors.length &&
    !unresolvedIngredientErrors.length
  ) {
    lines.push('No errors recorded.');
  } else {
    if (ownerNotFoundErrors.length) {
      lines.push('## Owner not found for identifier(s):');
      for (const e of ownerNotFoundErrors) lines.push(`- ${e}`);
      lines.push('');
    }

    if (noWikiMethodsErrors.length) {
      lines.push('## Items with no wiki creation methods:');
      for (const e of noWikiMethodsErrors) lines.push(`- ${e}`);
      lines.push('');
    }

    if (creationSpecsEmptyErrors.length) {
      lines.push('## Items with wiki methods but no valid creationSpecs (no skills/ingredients):');
      for (const e of creationSpecsEmptyErrors) lines.push(`- ${e}`);
      lines.push('');
    }

    if (unresolvedIngredientErrors.length) {
      lines.push('## Unresolved ingredient names (could not map to OsrsboxItem):');
      for (const e of unresolvedIngredientErrors) lines.push(`- ${e}`);
      lines.push('');
    }
  }

  fs.writeFileSync(errorLogPath, lines.join('\n'), 'utf8');
  console.log(`[creation-importer] Error report written to ${errorLogPath}`);
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
    console.warn(`[creation-importer] Could not resolve item name -> document: "${name}"`);
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
    const xp = (r as any).xp;
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
      item: itemId as unknown as any,
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
        item: itemId as unknown as any,
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
export async function importCreationForItemTitle(identifier: string): Promise<void> {
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
    console.warn(
      `[creation-importer] No OsrsboxItem found for identifier "${identifier}"`,
    );
    logOwnerNotFound(identifier);
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
    console.log(
      `[creation-importer] No creation methods from wiki for "${normalizedTitle}" (base="${baseTitle}", identifier="${identifier}")`,
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
      console.warn(
        `[creation-importer] Skipping method for "${identifier}" with no skills or ingredients (methodName="${m.methodName}")`,
      );
      continue;
    }

    creationSpecs.push(specs);
  }

  if (!creationSpecs.length) {
    console.log(
      `[creation-importer] No valid creationSpecs built for "${identifier}" after filtering.`,
    );
    logCreationSpecsEmpty(owner, identifier);
    return;
  }

  owner.creationSpecs = creationSpecs;
  await owner.save();

  console.log(
    `[creation-importer] Saved ${creationSpecs.length} creation spec(s) for "${
      owner.wiki_name ?? owner.name
    }".`,
  );
}

/**
 * Batch importer:
 *   - Iterate over every item in the DB
 *   - Fetch & store creation specs for each.
 */
export async function importCreationForAllItems(): Promise<void> {
  const cursor = OsrsboxItemModel.find({}, { _id: 1 }).cursor();
  let processed = 0;

  for await (const doc of cursor) {
    const idStr = doc._id.toString();
    try {
      await importCreationForItemTitle(idStr);
      processed++;
      if (processed % 100 === 0) {
        console.log(`[creation-importer] Processed ${processed} items...`);
      }
    } catch (err) {
      console.error(
        `[creation-importer] Error importing creation methods for _id=${idStr}:`,
        err,
      );
      logOwnerNotFound(`${idStr} (exception during import)`);
    }
  }

  console.log(`[creation-importer] Finished processing ${processed} items.`);
}

/**
 * ====================================================================================================================
 * CLI entrypoint.
 * ====================================================================================================================
 */

async function main() {
  const arg = process.argv[2];

  if (!user || !pw || !cluster || !host) {
    console.error('[creation-importer] Missing MongoDB env vars.');
    process.exit(1);
  }

  console.log(`[creation-importer] Connecting to MongoDB...`);
  await mongoose.connect(connectionString);

  try {
    if (!arg || arg === '--all') {
      console.log('[creation-importer] Running in batch mode over all items...');
      await importCreationForAllItems();
    } else {
      console.log(`[creation-importer] Importing creation specs for "${arg}"...`);
      await importCreationForItemTitle(arg);
    }

    // After any run (single or batch), write error report
    writeErrorReport();
  } catch (err) {
    console.error('[creation-importer] Unhandled error:', err);
  } finally {
    await mongoose.disconnect();
    console.log('[creation-importer] Disconnected. Exiting.');
    process.exit(0);
  }
}

// Only run main when executed directly, not when imported as a module
if (require.main === module) {
  void main();
}