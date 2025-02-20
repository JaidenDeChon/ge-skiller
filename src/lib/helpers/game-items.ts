import { GameItemModel, type IGameItem } from '$lib/models/mongo-schemas/game-item-schema';
import { GameItemPricingModel, type IGameItemPricing } from '$lib/models/mongo-schemas/game-item-pricing-schema';
import type { Document, Types } from 'mongoose';
import type { GameItem } from '$lib/models/game-item';
import type { GameItemCreationIngredient } from '$lib/models/game-item';

type GameItemDoc = Document<unknown, object, IGameItem> & IGameItem & { _id: Types.ObjectId };
type GameItemPricingDoc = Document<unknown, object, IGameItemPricing> & IGameItemPricing & { _id: Types.ObjectId };

/**
 * Retrieves one GameItem object using the given ID.
 * @param id {GameItem['id']} The ID of the game item to retrieve.
 * @returns The game item with the given ID.
 */
export async function getGameItemById(id: GameItem['id']): Promise<GameItem> {
    const gameItem = await GameItemModel.findOne({ id }).exec();
    if (!gameItem || !gameItem._id) throw new Error(`Game item with ID ${id} not found.`);

    const pricing = await GameItemPricingModel.findById(gameItem?._id).exec();
    if (!pricing || !pricing._id) throw new Error(`Game item pricing with ID ${gameItem._id} not found.`);

    const ingredients: GameItemCreationIngredient[] = [];
    const finishedGameItem = constructGameItemObject(gameItem, pricing, ingredients);
    return finishedGameItem;
}

/**
 * Gets the top X amount of game items by price.
 * @param quantity {number} The amount of items to retrieve. Must be between 1 and 100.
 * @returns The top X amount of game items by price.
 */
export async function getGameItemsByPrice(quantity: number = 100): Promise<GameItem[]> {
    if (quantity < 1) throw new Error('Quantity must be greater than 0.');
    if (quantity > 100) throw new Error('Quantity must be less than or equal to 100.');

    // Get top x highest item prices.
    const highestPrices = await GameItemPricingModel.find().sort({ highPrice: -1 }).limit(quantity).exec();
    const highestPriceIds = highestPrices.map(price => price.associatedGameItemDocId);

    // Grab the GameItem documents for the highest priced items.
    const gameItems = await GameItemModel.find({ _id: { $in: highestPriceIds } }).exec();

    if (!gameItems || !gameItems.length) throw new Error('No game items found.');
    if (gameItems.length !== highestPrices.length) throw new Error('Mismatch between game items and prices.');

    // Construct the GameItem objects.
    const finishedGameItems: GameItem[] = [];
    for (let i = 0; i < gameItems.length; i++) {
        const pricing = highestPrices.find(price => price.associatedGameItemDocId.equals(gameItems[i]._id));
        if (!pricing) throw new Error('Pricing not found for item.');

        const ingredients: GameItemCreationIngredient[] = [];
        const finishedGameItem = constructGameItemObject(gameItems[i], pricing, ingredients);
        finishedGameItems.push(finishedGameItem);
    }

    // Sort the items again before returning them.
    finishedGameItems.sort((a, b) => (b.highPrice ?? 0) - (a.highPrice ?? 0));
    return finishedGameItems;
}

/**
 * Constructs a GameItem object. Separated into its own function for readability and to avoid code duplication.
 * @param item {GameItemDoc} The GameItemDocument to build.
 * @param pricing {GameItemPricingDoc | undefined} The GameItemPricingDoc obj to use for pricing.
 * @param ingredients {GameItemCreationIngredient[]} The GameItemCreationIngredients obj to use for ingredients.
 * @returns A fully built GameItem.
 */
function constructGameItemObject(
    item: GameItemDoc,
    pricing: GameItemPricingDoc | undefined,
    ingredients: GameItemCreationIngredient[],
): GameItem {
    return {
        id: item.id,
        name: item.name,
        examineText: item.examineText,
        image: item.image,
        highAlch: item.highAlch,
        lowAlch: item.lowAlch,
        highPrice: pricing?.highPrice,
        lowPrice: pricing?.lowPrice,
        highTime: pricing?.highTime,
        lowTime: pricing?.lowTime,
        creationSpecs: {
            experienceGranted: item.creationSpecs?.experienceGranted ?? [],
            requiredSkills: item.creationSpecs?.requiredSkills ?? [],
            ingredients,
        }
    };
}
