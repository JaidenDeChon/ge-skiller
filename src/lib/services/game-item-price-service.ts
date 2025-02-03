import type { AnyBulkWriteOperation } from 'mongoose';
import { GameItemModel } from '$lib/models/mongo-schemas/game-item-schema';
import { GameItemPricingModel } from '$lib/models/mongo-schemas/game-item-pricing-schema';
import { CollectionMetadataModel } from '$lib/models/mongo-schemas/collection-metadata-schema';
import { geDataCombined } from '$lib/services/grand-exchange-api-service';

/**
 * Updates the prices of all GameItems in the database.
 */
export async function updateAllGameItemPricesInMongo(): Promise<void> {
    const prices = await geDataCombined();
    const gameItems = await GameItemModel.find();

    const bulkOperations: AnyBulkWriteOperation[] = [];

    // For every item in gameItems, find the matching item in GameItemPricingModel and update its prices.
    for (const item of gameItems) {
        const pricing = prices[item.id];
        if (!pricing) continue;

        bulkOperations.push({
            updateOne: {
                filter: { associatedGameItemDocId: item._id},
                update: {
                    highPrice: pricing.highPrice,
                    highTime: pricing.highTime,
                    lowPrice: pricing.lowPrice,
                    lowTime: pricing.lowTime,
                },
                upsert: true,
            }
        });
    }

    // Update the data to the database.
    await GameItemPricingModel.bulkWrite(bulkOperations);

    // Update the collection metadata.
    let collectionMetadata = await CollectionMetadataModel.findOne({ collectionName: 'game-item-pricing'});
    if (!collectionMetadata) {
        collectionMetadata = new CollectionMetadataModel({ collectionName: 'game-item-pricing' });
    }
    collectionMetadata.lastUpdated = Date.now();
    await collectionMetadata.save();
}

/**
 * Checks the age of the cached game item prices. If they are older than 5 minutes, updates them.
 */
export async function updatePricesIfNeeded(): Promise<void> {
    const collectionMetadata = await CollectionMetadataModel.findOne({ collectionName: 'game-item-pricing' });
    const lastUpdated = collectionMetadata?.lastUpdated ?? 0;

    // If the last update was more than 5 minutes ago, update the prices.
    if (Date.now() - lastUpdated > 300_000) {
        await updateAllGameItemPricesInMongo();
    }
}
