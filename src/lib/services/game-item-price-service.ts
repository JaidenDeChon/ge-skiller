import type { AnyBulkWriteOperation } from 'mongoose';
import { GameItemModel } from '$lib/models/mongo-schemas/game-item-schema';
import { CollectionMetadataModel, type ICollectionMetadata } from '$lib/models/mongo-schemas/collection-metadata-schema';
import { geDataCombined } from '$lib/services/grand-exchange-api-service';

/**
 * Updates the prices of all GameItems in the database.
 */
export async function updateAllGameItemPricesInMongo(): Promise<void> {
    const prices = await geDataCombined();
    const gameItems = await GameItemModel.find();

    const bulkOperations: AnyBulkWriteOperation[] = [];

    // Update the price of every game item.
    for (const item of gameItems) {
        const pricing = prices[item.id];
        if (!pricing) continue;

        bulkOperations.push({
            updateOne: {
                filter: { _id: item._id },
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
    await GameItemModel.bulkWrite(bulkOperations);

    const collectionName = 'game-item';
    const lastUpdated = Date.now();

    // Update the collection metadata.
    await CollectionMetadataModel
        .findOneAndUpdate({ collectionName }, { lastUpdated, collectionName }, { upsert: true })
        .exec();
}
