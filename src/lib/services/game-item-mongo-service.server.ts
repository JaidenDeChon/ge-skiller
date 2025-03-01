import { Types, type Document } from 'mongoose';
import { GameItemModel } from '$lib/models/mongo-schemas/game-item-schema';
import type { IGameItem } from '$lib/models/game-item';

type GameItemDoc = Document<unknown, object, IGameItem> & IGameItem & { _id: Types.ObjectId };

/**
 * Recursively builds the populate options for the ingredients tree.
 * @param depth - The current depth of recursion.
 * @returns The populate options for the ingredients tree.
 */
function buildMongoosePopulateObject(depth: number): any {
    if (depth === 0) {
        return null;
    }
    return {
        path: 'creationSpecs.ingredients.item',
        populate: buildMongoosePopulateObject(depth - 1)
    };
}

/**
 * Populates the recursive ingredients tree of a GameItem with a given id.
 * @param itemId - The id of the GameItem to populate.
 * @param depth - The depth of recursion for populating ingredients.
 * @returns The populated GameItem document.
 */
export async function populateIngredientsTree(itemId: string, depth: number = 5): Promise<IGameItem | null> {
    const populateOptions = buildMongoosePopulateObject(depth);
    const gameItem = await GameItemModel.findOne({ id: itemId })
        .populate(populateOptions)
        .exec();

    return gameItem;
}

/**
 * Grabs every GameItem from database. Top-level only; no ingredients.
 * @returns A list of GameItemDoc objects
 */
export async function getGameItems(ids?: string[]): Promise<GameItemDoc[]> {
    // If no ids were given, get the data for all items. Otherwise, just the for the ids given.
    if (!ids || !ids.length) return GameItemModel.find().exec();
    return GameItemModel.find({ id: { $in: ids } }).exec();
}
