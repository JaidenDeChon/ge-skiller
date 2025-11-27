import { Types } from 'mongoose';
import { OsrsboxItemModel, type OsrsboxItemDocument } from '$lib/models/mongo-schemas/osrsbox-db-item-schema';
import type { IOsrsboxItem } from '$lib/models/osrsbox-db-item';

type GameItemDoc = OsrsboxItemDocument & { _id: Types.ObjectId };

export type PaginatedGameItems = {
    items: GameItemDoc[];
    total: number;
    page: number;
    perPage: number;
};

/**
 * Fetch a single GameItem by id from the OSRSBox-backed collection.
 * Creation trees are not available in this dataset, so this returns the raw item.
 */
export async function populateIngredientsTree(itemId: string): Promise<IOsrsboxItem | null> {
    const numericId = Number(itemId);
    const id = Number.isNaN(numericId) ? itemId : numericId;
    return OsrsboxItemModel.findOne({ id }).exec();
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
 * Returns a paginated list of game items sorted by high price (desc).
 */
export async function getPaginatedGameItems(params?: { page?: number; perPage?: number }): Promise<PaginatedGameItems> {
    const page = Math.max(1, params?.page ?? 1);
    const perPage = Math.max(1, Math.min(200, params?.perPage ?? 12));
    const skip = (page - 1) * perPage;

    const [items, total] = await Promise.all([
        OsrsboxItemModel.find({})
            .sort({ highPrice: -1 })
            .skip(skip)
            .limit(perPage)
            .lean<GameItemDoc[]>()
            .exec(),
        OsrsboxItemModel.countDocuments().exec()
    ]);

    return { items, total, page, perPage };
}

/**
 * Performs a simple text search across name and examine fields.
 */
export async function searchGameItems(query: string, limit: number = 10): Promise<GameItemDoc[]> {
    const sanitizedQuery = query.trim();
    if (!sanitizedQuery) return [];

    const regex = new RegExp(sanitizedQuery, 'i');
    return OsrsboxItemModel.find({
        $or: [{ name: regex }, { examine: regex }]
    })
        .sort({ highPrice: -1 })
        .limit(Math.min(Math.max(limit, 1), 50))
        .lean<GameItemDoc[]>()
        .exec();
}
