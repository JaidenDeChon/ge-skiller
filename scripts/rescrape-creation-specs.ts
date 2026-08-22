// rescrape-creation-specs.ts
//
// Runs the full creation-spec rebuild and reports on the result.
//
// The wiki scrape is normally reached through `update-db`, which also re-imports the
// OSRSBox dataset and recomputes tree skills. This runner is the narrower job: rebuild
// `creationSpecs` from the wiki, repoint the ingredient links, and say whether the
// outcome looks sound. It exists because the scrape now produces materially different
// data than the specs already in the database, so a re-run is a migration rather than a
// refresh:
//
//   - methods are narrowed to the item's own infobox version, instead of every variant
//     on the page landing on every variant of the item
//   - recipe tables split on the `Total cost` row, so the product row stops being read
//     as an ingredient
//   - nothing is stored as its own ingredient
//
// A full pass is ~22,000 items and several hours; the wiki is the bottleneck, and a dry
// run costs the same because the expense is the scraping, not the write. `--versioned-only`
// is the ~8,400-item subset carrying an infobox version, which is where the corrections
// above almost all land.
//
// Run with:
//   bun run rescrape-creation-specs                      # full pass on the master DB
//   bun run rescrape-creation-specs -- --versioned-only  # the versioned subset only
//   bun run rescrape-creation-specs -- --dry-run         # report, write nothing
//   bun run rescrape-creation-specs -- --db=osrsbox-dev
//   bun run rescrape-creation-specs -- --resume-from=<objectid>
//   bun run rescrape-creation-specs -- --verify-only     # skip the scrape, just report

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';

const args = process.argv.slice(2);
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const dbName =
    args.find((arg) => arg.startsWith('--db='))?.split('=')[1] || process.env.VITE_MONGO_DB_DB_NAME || 'osrsbox';
const dryRun = args.includes('--dry-run');
const versionedOnly = args.includes('--versioned-only');
const verifyOnly = args.includes('--verify-only');
const resumeFrom = args.find((arg) => arg.startsWith('--resume-from='))?.split('=')[1];

const user = process.env.VITE_MONGO_USERNAME;
const pw = process.env.VITE_MONGO_PASSWORD;
const cluster = process.env.VITE_MONGO_DB_CLUSTER_NAME;
const host = process.env.VITE_MONGO_DB_HOST;

/**
 * Runs one script as a child process with the target database pinned.
 *
 * Each step connects to Mongo itself, so pinning happens through the environment rather
 * than a shared connection.
 * @param name - Label for the log line.
 * @param script - Path to the script, relative to the repo root.
 * @param scriptArgs - Arguments to forward.
 */
async function runStep(name: string, script: string, scriptArgs: string[]): Promise<void> {
    console.log(`\n[rescrape] ── ${name} ${scriptArgs.join(' ')}`);

    const proc = Bun.spawn({
        cmd: ['bun', 'run', script, ...scriptArgs],
        cwd: repoRoot,
        env: { ...process.env, VITE_MONGO_DB_DB_NAME: dbName },
        stdout: 'inherit',
        stderr: 'inherit',
    });

    const exitCode = await proc.exited;
    if (exitCode !== 0) throw new Error(`[rescrape] ${name} failed with exit code ${exitCode}.`);
}

/**
 * Counts the defects the rescrape is meant to remove.
 *
 * Read-only, so it is worth running before and after to see the delta. Multi-spec
 * versioned items should fall a long way and self-references should reach zero; neither
 * is expected to be exactly zero for unversioned items, which legitimately have several
 * recipes.
 * @returns The measured counts.
 */
async function verify(): Promise<Record<string, number>> {
    const connectionString = `mongodb+srv://${user}:${pw}@${cluster}.${host}/${dbName}?retryWrites=true&w=majority`;
    await mongoose.connect(connectionString, { dbName });

    try {
        const items = mongoose.connection.db!.collection('items');

        const [total, withSpecs, versionedMultiSpec, selfReferential] = await Promise.all([
            items.countDocuments({}),
            items.countDocuments({ 'creationSpecs.0': { $exists: true } }),
            items.countDocuments({ wiki_version: { $ne: null }, 'creationSpecs.1': { $exists: true } }),
            items
                .aggregate([
                    { $match: { 'creationSpecs.0': { $exists: true } } },
                    {
                        $project: {
                            self: {
                                $filter: {
                                    input: {
                                        $reduce: {
                                            input: '$creationSpecs.ingredients',
                                            initialValue: [],
                                            in: { $concatArrays: ['$$value', { $ifNull: ['$$this', []] }] },
                                        },
                                    },
                                    as: 'ingredient',
                                    cond: { $eq: ['$$ingredient.item', '$_id'] },
                                },
                            },
                        },
                    },
                    { $match: { 'self.0': { $exists: true } } },
                    { $count: 'n' },
                ])
                .toArray()
                .then((rows) => (rows[0]?.n as number) ?? 0),
        ]);

        return { total, withSpecs, versionedMultiSpec, selfReferential };
    } finally {
        await mongoose.disconnect();
    }
}

/**
 * Prints a labelled count block.
 * @param label - Heading for the block.
 * @param counts - The counts to print.
 */
function report(label: string, counts: Record<string, number>): void {
    console.log(
        [
            `\n[rescrape] ${label}`,
            `  Items ............................... ${counts.total}`,
            `  With creation specs ................. ${counts.withSpecs}`,
            `  Versioned items with >1 spec ........ ${counts.versionedMultiSpec}`,
            `  Items listing themselves ............ ${counts.selfReferential}`,
        ].join('\n'),
    );
}

async function main() {
    if (!user || !pw || !cluster || !host) {
        console.error('[rescrape] Missing MongoDB env vars.');
        process.exit(1);
    }

    console.log(`[rescrape] Target DB: ${dbName}`);
    if (dryRun) console.log('[rescrape] Dry run — nothing will be written.');
    if (versionedOnly) console.log('[rescrape] Scoped to items carrying an infobox version.');

    report('Before', await verify());

    if (!verifyOnly) {
        const scrapeArgs = ['--all'];
        if (dryRun) scrapeArgs.push('--dry-run');
        if (versionedOnly) scrapeArgs.push('--versioned-only');
        if (resumeFrom) scrapeArgs.push(`--resume-from=${resumeFrom}`);

        await runStep('populate-ingredients', 'scripts/populate-ingredients.ts', scrapeArgs);

        // The scrape writes fresh ingredient links, so the canonical repair runs after it
        // rather than before.
        await runStep('repair-ingredient-links', 'scripts/repair-ingredient-links.ts', dryRun ? ['--dry-run'] : []);
    }

    report('After', await verify());

    console.log(
        [
            '\n[rescrape] Next steps are deliberately not automated:',
            '  - find-ingredient-cycles removes whole creationSpecs entries to break a cycle.',
            '    Run it with --dry-run and read the report before letting it write.',
            '  - compute-creation-tree-skills recomputes the per-item skill ranges.',
            '  - promotion is copy-osrsbox-to-dev, then copy-osrsbox-dev-to-prod.',
            '    Follow the prod copy with update-item-prices: the copy replaces the',
            '    collection wholesale and prod carries fresher prices than the master DB.',
        ].join('\n'),
    );
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
