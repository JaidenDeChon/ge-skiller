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
