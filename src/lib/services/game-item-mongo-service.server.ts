import { Types } from 'mongoose';
import { skillTreeSlugs } from '$lib/constants/skill-tree-pages';
import { OsrsboxItemModel, type OsrsboxItemDocument } from '$lib/models/mongo-schemas/osrsbox-db-item-schema';
import type { IOsrsboxItemWithMeta } from '$lib/models/osrsbox-db-item';

type GameItemDoc = OsrsboxItemDocument & { _id: Types.ObjectId };
const MAX_INGREDIENT_DEPTH = 5;

export type GameItemFilter = 'all' | 'members' | 'f2p' | 'equipable' | 'stackable' | 'quest' | 'nonquest';
export type GameItemSortOrder = 'asc' | 'desc';
export type PlayerSkillLevels = Record<string, number>;

export type PaginatedGameItems = {
    items: GameItemDoc[];
    total: number;
    page: number;
    perPage: number;
};

/**
 * Fetch a single GameItem by id from the OSRSBox-backed collection.
 * Populates nested ingredient trees so the frontend can render a full org chart.
 */
export async function populateIngredientsTree(itemId: string): Promise<IOsrsboxItemWithMeta | null> {
    const numericId = Number(itemId);
    const id = Number.isNaN(numericId) ? itemId : numericId;

    const root = await OsrsboxItemModel.findOne({ id }).lean<IOsrsboxItemWithMeta & { _id: Types.ObjectId }>().exec();
    if (!root) return null;

    // Cache results so we don't refetch the same ingredient multiple times
    const cache = new Map<string, IOsrsboxItemWithMeta>();
    await populateIngredientsRecursive(root, cache, 0);

    return root;
}

/**
 * Grabs every GameItem from database. Top-level only; no ingredients.
 * @returns A list of GameItemDoc objects
 */
export async function getGameItems(ids?: string[]): Promise<GameItemDoc[]> {
    if (!ids || !ids.length) {
        // Only grab first 32 items for performance reasons
        return OsrsboxItemModel.find({})
            .limit(32)
            .lean<GameItemDoc[]>()
            .exec();
    }

    const normalizedIds = ids.map((rawId) => {
        const numericId = Number(rawId);
        return Number.isNaN(numericId) ? rawId : numericId;
    });

    return OsrsboxItemModel.find({ id: { $in: normalizedIds } })
        .lean<GameItemDoc[]>()
        .exec();
}

/**
 * Returns a paginated list of game items with optional filtering and sort order (defaults high price desc).
 */
export async function getPaginatedGameItems(
    params?: {
        page?: number;
        perPage?: number;
        filter?: GameItemFilter;
        sortOrder?: GameItemSortOrder;
        skillLevels?: PlayerSkillLevels | null;
        skill?: string | null;
    },
): Promise<PaginatedGameItems> {
    const page = Math.max(1, params?.page ?? 1);
    const perPage = Math.max(1, Math.min(200, params?.perPage ?? 12));
    const skip = (page - 1) * perPage;
    const filter = normalizeFilter(params?.filter);
    const sortDirection = params?.sortOrder === 'asc' ? 1 : -1;
    const baseFilterQuery = getFilterQuery(filter);
    const skillQuery = getSkillMatchQuery(params?.skill);
    const filterQuery = mergeQueries(baseFilterQuery, skillQuery);
    const skillLevels = normalizeSkillLevels(params?.skillLevels);

    if (!skillLevels) {
        const [items, total] = await Promise.all([
            OsrsboxItemModel.find(filterQuery)
                .sort({ highPrice: sortDirection, cost: sortDirection, name: 1 })
                .skip(skip)
                .limit(perPage)
                .lean<GameItemDoc[]>()
                .exec(),
            OsrsboxItemModel.countDocuments(filterQuery).exec()
        ]);

        return { items, total, page, perPage };
    }

    const [{ items, total = 0 } = { items: [], total: 0 }] = await OsrsboxItemModel.aggregate<{
        items: GameItemDoc[];
        total: number;
    }>([
        { $match: filterQuery },
        { $match: { $expr: buildPlayerSkillMatchExpression(skillLevels) } },
        { $sort: { highPrice: sortDirection, cost: sortDirection, name: 1 } },
        {
            $facet: {
                items: [{ $skip: skip }, { $limit: perPage }],
                totalDocs: [{ $count: 'count' }],
            },
        },
        {
            $project: {
                items: 1,
                total: { $ifNull: [{ $first: '$totalDocs.count' }, 0] },
            },
        },
    ]).allowDiskUse(true);

    return { items, total, page, perPage };
}

/**
 * Performs a simple text search across name and examine fields.
 */
export async function searchGameItems(query: string, limit: number = 10): Promise<GameItemDoc[]> {
    const sanitizedQuery = query.trim();
    if (!sanitizedQuery) return [];

    const safeQuery = escapeRegex(sanitizedQuery);
    const startsWithRegex = new RegExp(`^${safeQuery}`, 'i');
    const containsRegex = new RegExp(safeQuery, 'i');
    const limitCap = Math.min(Math.max(limit, 1), 150);
    const results: GameItemDoc[] = [];
    const seenIds = new Set<string>();
    const seenNames = new Set<string>();

    async function fetchAndAppend(filter: Record<string, unknown>) {
        if (results.length >= limitCap) return;
        const docs = await OsrsboxItemModel.find(filter)
            .sort({ name: 1 })
            .limit(limitCap * 3)
            .lean<GameItemDoc[]>()
            .exec();

        const alphabetized = docs.sort((a, b) => (a.name ?? '').localeCompare(b.name ?? '', 'en', { sensitivity: 'base' }));

        for (const doc of alphabetized) {
            const key = doc.id?.toString() ?? (doc as unknown as { _id?: Types.ObjectId })._id?.toString();
            const nameKey = (doc.name ?? '').trim().toLowerCase();

            if (!key || seenIds.has(key) || (nameKey && seenNames.has(nameKey))) continue;

            seenIds.add(key);
            if (nameKey) seenNames.add(nameKey);
            results.push(doc);
            if (results.length >= limitCap) break;
        }
    }

    // Priority: name starts with query > name contains query > description contains query
    await fetchAndAppend({ name: startsWithRegex });
    await fetchAndAppend({ name: containsRegex });
    await fetchAndAppend({ examine: containsRegex });

    return results;
}

function escapeRegex(value: string) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeFilter(filter?: GameItemFilter): GameItemFilter {
    const allowed: GameItemFilter[] = ['all', 'members', 'f2p', 'equipable', 'stackable', 'quest', 'nonquest'];
    if (!filter) return 'all';
    return allowed.includes(filter) ? filter : 'all';
}

function getFilterQuery(filter: GameItemFilter): Record<string, unknown> {
    const base = { 'creationSpecs.0': { $exists: true } }; // Only items that have creation specs

    switch (filter) {
        case 'members':
            return { ...base, members: true };
        case 'f2p':
            return { ...base, members: false };
        case 'equipable':
            return { ...base, equipable_by_player: true };
        case 'stackable':
            return { ...base, stackable: true };
        case 'quest':
            return { ...base, quest_item: true };
        case 'nonquest':
            return { ...base, quest_item: false };
        default:
            return base;
    }
}

function getSkillMatchQuery(skill?: string | null): Record<string, unknown> | null {
    const normalized = normalizeSkillFilter(skill);
    if (!normalized) return null;

    const skillRegex = new RegExp(`^${escapeRegex(normalized)}$`, 'i');

    return {
        creationSpecs: {
            $elemMatch: {
                $or: [
                    { 'requiredSkills.skillName': skillRegex },
                    { 'experienceGranted.skillName': skillRegex },
                ],
            },
        },
    };
}

function mergeQueries(...queries: (Record<string, unknown> | null)[]): Record<string, unknown> {
    const valid = queries.filter(Boolean) as Record<string, unknown>[];
    if (!valid.length) return {};
    if (valid.length === 1) return valid[0];
    return { $and: valid };
}

/**
 * Normalizes incoming skill level data to a lowercase map of finite numbers.
 */
function normalizeSkillLevels(skillLevels?: PlayerSkillLevels | null): PlayerSkillLevels | null {
    if (!skillLevels || typeof skillLevels !== 'object') return null;

    const normalizedEntries = Object.entries(skillLevels).reduce<[string, number][]>((acc, [skill, level]) => {
        const numericLevel = Math.max(0, Math.floor(Number(level)));
        if (!Number.isFinite(numericLevel)) return acc;
        acc.push([skill.toLowerCase(), numericLevel]);
        return acc;
    }, []);

    if (!normalizedEntries.length) return null;
    return Object.fromEntries(normalizedEntries);
}

function normalizeSkillFilter(skill?: string | null): string | null {
    if (!skill) return null;
    const normalized = skill.trim().toLowerCase();
    return skillTreeSlugs.includes(normalized) ? normalized : null;
}

/**
 * Builds an expression that matches items where at least one creation spec's required skills are satisfied by the
 * provided player skill levels.
 */
function buildPlayerSkillMatchExpression(skillLevels: PlayerSkillLevels) {
    return {
        $gt: [
            {
                $size: {
                    $filter: {
                        input: { $ifNull: ['$creationSpecs', []] },
                        as: 'spec',
                        cond: {
                            $and: [
                                {
                                    // Require that the spec has either skill requirements or XP information.
                                    $gt: [
                                        {
                                            $add: [
                                                { $size: { $ifNull: ['$$spec.requiredSkills', []] } },
                                                { $size: { $ifNull: ['$$spec.experienceGranted', []] } },
                                            ],
                                        },
                                        0,
                                    ],
                                },
                                {
                                    // Ensure no required skills exceed the player's levels.
                                    $eq: [
                                        {
                                            $size: {
                                                $filter: {
                                                    input: { $ifNull: ['$$spec.requiredSkills', []] },
                                                    as: 'req',
                                                    cond: {
                                                        $gt: [
                                                            { $ifNull: ['$$req.skillLevel', 0] },
                                                            {
                                                                $ifNull: [
                                                                    {
                                                                        $getField: {
                                                                            field: {
                                                                                $toLower: {
                                                                                    $ifNull: ['$$req.skillName', ''],
                                                                                },
                                                                            },
                                                                            input: { $literal: skillLevels },
                                                                        },
                                                                    },
                                                                    0,
                                                                ],
                                                            },
                                                        ],
                                                    },
                                                },
                                            },
                                        },
                                        0,
                                    ],
                                },
                            ],
                        },
                    },
                },
            },
            0,
        ],
    };
}

async function populateIngredientsRecursive(
    item: IOsrsboxItemWithMeta & { _id?: Types.ObjectId },
    cache: Map<string, IOsrsboxItemWithMeta>,
    depth: number,
): Promise<void> {
    if (depth >= MAX_INGREDIENT_DEPTH) return;
    const specs = Array.isArray(item.creationSpecs) ? item.creationSpecs : [];
    if (!specs.length) return;

    await Promise.all(
        specs.map(async (spec) => {
            if (!spec.ingredients?.length) return;

            await Promise.all(
                spec.ingredients.map(async (ingredient) => {
                    const ingredientId = ingredient.item as unknown as Types.ObjectId | undefined;
                    if (!ingredientId) return;

                    const key = ingredientId.toString();
                    if (!cache.has(key)) {
                        const populated = await OsrsboxItemModel.findById(ingredientId)
                            .lean<IOsrsboxItemWithMeta & { _id: Types.ObjectId }>()
                            .exec();
                        if (!populated) return;

                        cache.set(key, populated);
                        await populateIngredientsRecursive(populated, cache, depth + 1);
                    }

                    const cached = cache.get(key);
                    if (cached) {
                        // Clone to prevent shared object graphs that JSON.stringify treats as circular.
                        ingredient.item = structuredClone(cached);
                    }
                }),
            );
        }),
    );
}
