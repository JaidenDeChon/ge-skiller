import { OsrsboxItemModel } from '../models/mongo-schemas/osrsbox-db-item-schema';
import { CollectionMetadataModel } from '../models/mongo-schemas/collection-metadata-schema';
import { geDataCombined } from './grand-exchange-api-service';
import type { AnyBulkWriteOperation } from 'mongoose';

/**
 * Updates the prices of all GameItems in the database.
 */
export async function updateAllGameItemPricesInMongo(): Promise<void> {
    const updatedGameItems = await geDataCombined();
    const gameItemsInMongo = await OsrsboxItemModel.find();

    const bulkOperations: AnyBulkWriteOperation[] = [];
    
    // Update the price of every game item in MongoDB.
    for (const item of gameItemsInMongo) {
        const fullItemData = updatedGameItems[item.id];
        if (!fullItemData) continue;

        const priceUpdate = {
            highPrice: fullItemData.highPrice,
            highTime: fullItemData.highTime,
            lowPrice: fullItemData.lowPrice,
            lowTime: fullItemData.lowTime,
        };

        bulkOperations.push({
            updateOne: {
                filter: { _id: item._id },
                update: { $set: priceUpdate },
                upsert: true,
            },
        });
    }

    // Update the data to the database.
    await OsrsboxItemModel.bulkWrite(bulkOperations);

    const collectionName = 'items';
    const lastUpdated = Date.now();

    // Update the collection metadata.
    await CollectionMetadataModel
        .findOneAndUpdate({ collectionName }, { lastUpdated, collectionName }, { upsert: true })
        .exec();
}
