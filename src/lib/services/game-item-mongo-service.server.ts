import { Types } from 'mongoose';
import { OsrsboxItemModel, type OsrsboxItemDocument } from '$lib/models/mongo-schemas/osrsbox-db-item-schema';
import type { IOsrsboxItemWithMeta } from '$lib/models/osrsbox-db-item';

type GameItemDoc = OsrsboxItemDocument & { _id: Types.ObjectId };
const MAX_INGREDIENT_DEPTH = 5;

export type GameItemFilter = 'all' | 'members' | 'f2p' | 'equipable' | 'stackable' | 'quest';
export type GameItemSortOrder = 'asc' | 'desc';

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
    params?: { page?: number; perPage?: number; filter?: GameItemFilter; sortOrder?: GameItemSortOrder },
): Promise<PaginatedGameItems> {
    const page = Math.max(1, params?.page ?? 1);
    const perPage = Math.max(1, Math.min(200, params?.perPage ?? 12));
    const skip = (page - 1) * perPage;
    const filter = normalizeFilter(params?.filter);
    const sortDirection = params?.sortOrder === 'asc' ? 1 : -1;
    const filterQuery = getFilterQuery(filter);

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
    const allowed: GameItemFilter[] = ['all', 'members', 'f2p', 'equipable', 'stackable', 'quest'];
    if (!filter) return 'all';
    return allowed.includes(filter) ? filter : 'all';
}

function getFilterQuery(filter: GameItemFilter): Record<string, unknown> {
    switch (filter) {
        case 'members':
            return { members: true };
        case 'f2p':
            return { members: false };
        case 'equipable':
            return { equipable_by_player: true };
        case 'stackable':
            return { stackable: true };
        case 'quest':
            return { quest_item: true };
        default:
            return {};
    }
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
                    if (cached) ingredient.item = cached;
                }),
            );
        }),
    );
}
