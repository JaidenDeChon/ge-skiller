import { Types } from 'mongoose';
import { skillTreeSlugs } from '$lib/constants/skill-tree-pages';
import { MAX_ITEM_TREE_DEPTH } from '$lib/constants/item-tree';
import { OsrsboxItemModel, type OsrsboxItemDocument } from '$lib/models/mongo-schemas/osrsbox-db-item-schema';
import type { IOsrsboxItemWithMeta } from '$lib/models/osrsbox-db-item';

type GameItemDoc = OsrsboxItemDocument & {
    _id: Types.ObjectId;
    creationCost?: number | null;
    creationProfit?: number | null;
};
const MAX_INGREDIENT_DEPTH = MAX_ITEM_TREE_DEPTH;

export type GameItemFilter = 'all' | 'members' | 'f2p' | 'equipable' | 'stackable' | 'quest' | 'nonquest';
export type GameItemSortOrder = 'asc' | 'desc' | 'profit-desc';
export type PlayerSkillLevels = Record<string, number>;
export type PlayerSupplies = Record<string, number>;

export type PaginatedGameItems = {
    items: GameItemDoc[];
    total: number;
    page: number;
    perPage: number;
};

/**
 * Populates nested ingredient trees so the frontend can render a full org chart.
 */
export async function populateIngredientsTree(itemId: string): Promise<IOsrsboxItemWithMeta | null> {
    const trimmedId = itemId.trim();
    const numericId = Number(trimmedId);
    const query: Record<string, unknown> = {};

    if (Number.isFinite(numericId)) {
        query.id = numericId;
    } else if (Types.ObjectId.isValid(trimmedId)) {
        query._id = new Types.ObjectId(trimmedId);
    } else {
        query.id = trimmedId;
    }

    const root = await OsrsboxItemModel.findOne(query)
        .lean<IOsrsboxItemWithMeta & { _id: Types.ObjectId }>()
        .exec();
    if (!root) return null;

    // Cache results so we don't refetch the same ingredient multiple times
    const cache = new Map<string, IOsrsboxItemWithMeta>();
    await populateIngredientsRecursive(root, cache, 0);

    return root;
}

/**
 * Returns a lightweight item document for item details pages.
 */
export async function getGameItemById(itemId: string): Promise<IOsrsboxItemWithMeta | null> {
    const numericId = Number(itemId);
    const id = Number.isNaN(numericId) ? itemId : numericId;

    return OsrsboxItemModel.findOne({ id })
        .select({
            id: 1,
            name: 1,
            icon: 1,
            examine: 1,
            members: 1,
            highPrice: 1,
            highTime: 1,
            lowPrice: 1,
            lowTime: 1,
            highalch: 1,
            lowalch: 1,
            cost: 1,
            buy_limit: 1,
            wiki_name: 1,
            wiki_url: 1,
        })
        .lean<IOsrsboxItemWithMeta>()
        .exec();
}

/**
 * Grabs every GameItem from database. Top-level only; no ingredients.
 * @returns A list of GameItemDoc objects
 */
export async function getGameItems(ids?: string[]): Promise<GameItemDoc[]> {
    if (!ids || !ids.length) {
        // Only grab first 32 items for performance reasons
        return OsrsboxItemModel.find({}).limit(32).lean<GameItemDoc[]>().exec();
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
export async function getPaginatedGameItems(params?: {
    page?: number;
    perPage?: number;
    filter?: GameItemFilter;
    sortOrder?: GameItemSortOrder;
    skillLevels?: PlayerSkillLevels | null;
    skill?: string | null;
    supplies?: PlayerSupplies | null;
    suppliesActive?: boolean;
    profitMode?: boolean;
}): Promise<PaginatedGameItems> {
    const page = Math.max(1, params?.page ?? 1);
    const perPage = Math.max(1, Math.min(200, params?.perPage ?? 12));
    const skip = (page - 1) * perPage;
    const filter = normalizeFilter(params?.filter);
    const sortOrder = normalizeSortOrder(params?.sortOrder);
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    const profitSort = sortOrder === 'profit-desc';
    const profitMode = Boolean(params?.profitMode);
    const baseFilterQuery = getFilterQuery(filter);
    const skillQuery = getSkillMatchQuery(params?.skill);
    const filterQuery = mergeQueries(baseFilterQuery, skillQuery, {
        placeholder: false,
        noted: false,
        stacked: null,
        tradeable_on_ge: true,
        ...getValidPriceQuery(),
    });
    const skillLevels = normalizeSkillLevels(params?.skillLevels);
    const suppliesActive = Boolean(params?.suppliesActive);
    const supplies = normalizeSupplies(params?.supplies);
    const supplyMap = supplies ?? (suppliesActive ? {} : null);

    if (!skillLevels && !profitSort && !profitMode && !suppliesActive && !supplies) {
        const [items, total] = await Promise.all([
            OsrsboxItemModel.find(filterQuery)
                .sort({ highPrice: sortDirection, cost: sortDirection, name: 1 })
                .skip(skip)
                .limit(perPage)
                .lean<GameItemDoc[]>()
                .exec(),
            OsrsboxItemModel.countDocuments(filterQuery).exec(),
        ]);

        return { items, total, page, perPage };
    }

    const suppliesFilterActive = suppliesActive || Boolean(supplyMap);
    const shouldComputeProfit = profitSort || profitMode;
    const profitStages = shouldComputeProfit
        ? buildProfitPipeline(supplyMap, profitSort, profitSort && suppliesFilterActive)
        : [];
    const supplyStages = !profitSort && suppliesFilterActive ? buildSuppliesFilterPipeline(supplyMap) : [];
    const sortStage = profitSort
        ? { creationProfit: sortDirection, highPrice: -1, cost: -1, name: 1 }
        : { highPrice: sortDirection, cost: sortDirection, name: 1 };

    const [{ items, total = 0 } = { items: [], total: 0 }] = await OsrsboxItemModel.aggregate<{
        items: GameItemDoc[];
        total: number;
    }>([
        { $match: filterQuery },
        ...(skillLevels ? [{ $match: { $expr: buildPlayerSkillMatchExpression(skillLevels) } }] : []),
        ...supplyStages,
        ...profitStages,
        { $sort: sortStage },
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
    const baseFilter = {
        placeholder: false,
        noted: false,
        stacked: null,
        tradeable_on_ge: true,
        ...getValidPriceQuery(),
    };

    async function fetchAndAppend(filter: Record<string, unknown>) {
        if (results.length >= limitCap) return;
        const docs = await OsrsboxItemModel.find({ ...baseFilter, ...filter })
            .sort({ name: 1 })
            .limit(limitCap * 3)
            .lean<GameItemDoc[]>()
            .exec();

        const alphabetized = docs.sort((a, b) =>
            (a.name ?? '').localeCompare(b.name ?? '', 'en', { sensitivity: 'base' }),
        );

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

function normalizeSortOrder(sortOrder?: GameItemSortOrder): GameItemSortOrder {
    const allowed: GameItemSortOrder[] = ['asc', 'desc', 'profit-desc'];
    if (!sortOrder) return 'desc';
    return allowed.includes(sortOrder) ? sortOrder : 'desc';
}

function normalizeFilter(filter?: GameItemFilter): GameItemFilter {
    const allowed: GameItemFilter[] = ['all', 'members', 'f2p', 'equipable', 'stackable', 'quest', 'nonquest'];
    if (!filter) return 'all';
    return allowed.includes(filter) ? filter : 'all';
}

function getValidPriceQuery(): Record<string, unknown> {
    return {
        $or: [{ highPrice: { $gt: 0 } }, { lowPrice: { $gt: 0 } }],
    };
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

function normalizeSupplies(supplies?: PlayerSupplies | null): PlayerSupplies | null {
    if (!supplies || typeof supplies !== 'object') return null;

    const entries = Object.entries(supplies)
        .map(([id, quantity]) => [String(id), Math.floor(Number(quantity))] as const)
        .filter(([, quantity]) => Number.isFinite(quantity) && quantity > 0);

    if (!entries.length) return null;
    return Object.fromEntries(entries);
}

function buildProfitPipeline(
    supplies?: PlayerSupplies | null,
    filterMissingProfit: boolean = false,
    enforceSupplies: boolean = false,
): Record<string, unknown>[] {
    const supplyMap = supplies ?? normalizeSupplies(supplies);
    const hasSupplies = enforceSupplies || Boolean(supplyMap);
    const primarySpecExpr = buildPrimarySpecExpression();
    const supplyQtyExpr = hasSupplies
        ? {
              $ifNull: [
                  {
                      $getField: {
                          field: { $toString: '$$matched.id' },
                          input: { $literal: supplyMap },
                      },
                  },
                  0,
              ],
          }
        : 0;
    const neededExpr = hasSupplies
        ? { $max: [0, { $subtract: ['$$amount', '$$supplyQty'] }] }
        : '$$amount';
    const unitPriceExpr = { $ifNull: ['$$matched.highPrice', { $ifNull: ['$$matched.lowPrice', '$$matched.cost'] }] };
    const outputPriceExpr = { $ifNull: ['$highPrice', { $ifNull: ['$lowPrice', '$cost'] }] };
    const ingredientCostRowsExpr = {
        $map: {
            input: '$consumedIngredients',
            as: 'ing',
            in: {
                $let: {
                    vars: {
                        matched: {
                            $first: {
                                $filter: {
                                    input: '$ingredientItems',
                                    as: 'item',
                                    cond: { $eq: ['$$item._id', '$$ing.item'] },
                                },
                            },
                        },
                        amount: { $ifNull: ['$$ing.amount', 1] },
                    },
                    in: {
                        $let: {
                            vars: {
                                unitPrice: unitPriceExpr,
                                supplyQty: supplyQtyExpr,
                            },
                            in: {
                                itemId: '$$matched.id',
                                amount: '$$amount',
                                unitPrice: '$$unitPrice',
                                supplyQty: '$$supplyQty',
                                needed: neededExpr,
                                total: {
                                    $let: {
                                        vars: { needed: neededExpr },
                                        in: {
                                            $cond: [
                                                { $lte: ['$$needed', 0] },
                                                0,
                                                {
                                                    $cond: [
                                                        { $gt: ['$$unitPrice', 0] },
                                                        { $multiply: ['$$unitPrice', '$$needed'] },
                                                        null,
                                                    ],
                                                },
                                            ],
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    };

    const costKnownExpr = {
        $allElementsTrue: {
            $map: {
                input: '$ingredientCostRows',
                as: 'row',
                in: { $ne: ['$$row.total', null] },
            },
        },
    };
    const suppliesSatisfiedExpr = hasSupplies
        ? {
              $eq: [
                  {
                      $size: {
                          $filter: {
                              input: '$ingredientCostRows',
                              as: 'row',
                              cond: { $gt: ['$$row.needed', 0] },
                          },
                      },
                  },
                  0,
              ],
          }
        : true;

    const pipeline: Record<string, unknown>[] = [
        { $set: { primarySpec: primarySpecExpr } },
        {
            $set: {
                consumedIngredients: {
                    $filter: {
                        input: { $ifNull: ['$primarySpec.ingredients', []] },
                        as: 'ing',
                        cond: { $ne: ['$$ing.consumedDuringCreation', false] },
                    },
                },
            },
        },
        {
            $lookup: {
                from: 'items',
                let: {
                    ingredientIds: {
                        $map: { input: '$consumedIngredients', as: 'ing', in: '$$ing.item' },
                    },
                },
                pipeline: [
                    { $match: { $expr: { $in: ['$_id', '$$ingredientIds'] } } },
                    { $project: { _id: 1, id: 1, highPrice: 1, lowPrice: 1, cost: 1 } },
                ],
                as: 'ingredientItems',
            },
        },
        { $set: { ingredientCostRows: ingredientCostRowsExpr } },
        { $set: { costKnown: costKnownExpr, outputPrice: outputPriceExpr } },
        {
            $set: {
                creationCost: {
                    $cond: ['$costKnown', { $sum: '$ingredientCostRows.total' }, null],
                },
            },
        },
        {
            $set: {
                creationProfit: {
                    $cond: [
                        {
                            $and: [
                                { $gt: ['$outputPrice', 0] },
                                { $ne: ['$creationCost', null] },
                            ],
                        },
                        { $subtract: ['$outputPrice', '$creationCost'] },
                        null,
                    ],
                },
            },
        },
    ];

    if (filterMissingProfit) {
        pipeline.push({ $match: { creationProfit: { $ne: null } } });
    }

    if (enforceSupplies && hasSupplies) {
        pipeline.push({ $match: { $expr: suppliesSatisfiedExpr } });
    }

    pipeline.push({
        $unset: [
            'primarySpec',
            'consumedIngredients',
            'ingredientItems',
            'ingredientCostRows',
            'costKnown',
            'outputPrice',
        ],
    });

    return pipeline;
}

function buildSuppliesFilterPipeline(supplies?: PlayerSupplies | null): Record<string, unknown>[] {
    const supplyMap = supplies ?? normalizeSupplies(supplies) ?? {};

    const primarySpecExpr = buildPrimarySpecExpression();
    const supplyQtyExpr = {
        $ifNull: [
            {
                $getField: {
                    field: { $toString: { $ifNull: ['$$matched.id', ''] } },
                    input: { $literal: supplyMap },
                },
            },
            0,
        ],
    };

    const requiredSuppliesExpr = {
        $map: {
            input: '$requiredIngredients',
            as: 'ing',
            in: {
                $let: {
                    vars: {
                        matched: {
                            $first: {
                                $filter: {
                                    input: '$ingredientItems',
                                    as: 'item',
                                    cond: { $eq: ['$$item._id', '$$ing.item'] },
                                },
                            },
                        },
                        amount: { $ifNull: ['$$ing.amount', 1] },
                    },
                    in: {
                        $let: {
                            vars: { supplyQty: supplyQtyExpr },
                            in: {
                                supplyQty: '$$supplyQty',
                                amount: '$$amount',
                                sufficient: { $gte: ['$$supplyQty', '$$amount'] },
                            },
                        },
                    },
                },
            },
        },
    };

    return [
        { $set: { primarySpec: primarySpecExpr } },
        { $set: { requiredIngredients: { $ifNull: ['$primarySpec.ingredients', []] } } },
        { $match: { $expr: { $gt: [{ $size: '$requiredIngredients' }, 0] } } },
        {
            $lookup: {
                from: 'items',
                let: {
                    ingredientIds: {
                        $map: { input: '$requiredIngredients', as: 'ing', in: '$$ing.item' },
                    },
                },
                pipeline: [
                    { $match: { $expr: { $in: ['$_id', '$$ingredientIds'] } } },
                    { $project: { _id: 1, id: 1 } },
                ],
                as: 'ingredientItems',
            },
        },
        { $set: { supplyRows: requiredSuppliesExpr } },
        {
            $set: {
                suppliesSatisfied: {
                    $allElementsTrue: {
                        $map: {
                            input: '$supplyRows',
                            as: 'row',
                            in: '$$row.sufficient',
                        },
                    },
                },
            },
        },
        { $match: { suppliesSatisfied: true } },
        { $unset: ['primarySpec', 'requiredIngredients', 'ingredientItems', 'supplyRows', 'suppliesSatisfied'] },
    ];
}

function buildPrimarySpecExpression() {
    return {
        $let: {
            vars: { specs: { $ifNull: ['$creationSpecs', []] } },
            in: {
                $let: {
                    vars: {
                        withIngredients: {
                            $filter: {
                                input: '$$specs',
                                as: 'spec',
                                cond: {
                                    $gt: [{ $size: { $ifNull: ['$$spec.ingredients', []] } }, 0],
                                },
                            },
                        },
                    },
                    in: { $ifNull: [{ $first: '$$withIngredients' }, { $first: '$$specs' }] },
                },
            },
        },
    };
}

function getSkillMatchQuery(skill?: string | null): Record<string, unknown> | null {
    const normalized = normalizeSkillFilter(skill);
    if (!normalized) return null;

    const skillRegex = new RegExp(`^${escapeRegex(normalized)}$`, 'i');

    return {
        creationSpecs: {
            $elemMatch: {
                $or: [{ 'requiredSkills.skillName': skillRegex }, { 'experienceGranted.skillName': skillRegex }],
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
                                    // Require that the spec has either skill requirements, XP information, or tree requirements.
                                    $gt: [
                                        {
                                            $add: [
                                                { $size: { $ifNull: ['$$spec.requiredSkills', []] } },
                                                { $size: { $ifNull: ['$$spec.experienceGranted', []] } },
                                                {
                                                    $size: {
                                                        $objectToArray: { $ifNull: ['$$spec.treeMinSkills', {}] },
                                                    },
                                                },
                                            ],
                                        },
                                        0,
                                    ],
                                },
                                {
                                    // Prefer treeMinSkills if available; otherwise fall back to direct requiredSkills.
                                    $let: {
                                        vars: {
                                            treeEntries: {
                                                $objectToArray: { $ifNull: ['$$spec.treeMinSkills', {}] },
                                            },
                                        },
                                        in: {
                                            $cond: [
                                                { $gt: [{ $size: '$$treeEntries' }, 0] },
                                                {
                                                    $eq: [
                                                        {
                                                            $size: {
                                                                $filter: {
                                                                    input: '$$treeEntries',
                                                                    as: 'req',
                                                                    cond: {
                                                                        $gt: [
                                                                            '$$req.v',
                                                                            {
                                                                                $ifNull: [
                                                                                    {
                                                                                        $getField: {
                                                                                            field: {
                                                                                                $toLower: '$$req.k',
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
                                                {
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
                                                                                                    $ifNull: [
                                                                                                        '$$req.skillName',
                                                                                                        '',
                                                                                                    ],
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
