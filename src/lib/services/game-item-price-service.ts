import _ from 'lodash';
import { GameItemModel } from '$lib/models/mongo-schemas/game-item-schema';
import { CollectionMetadataModel } from '$lib/models/mongo-schemas/collection-metadata-schema';
import { geDataCombined } from '$lib/services/grand-exchange-api-service';
import type { AnyBulkWriteOperation } from 'mongoose';

/**
 * Updates the prices of all GameItems in the database.
 */
export async function updateAllGameItemPricesInMongo(): Promise<void> {
    const updatedGameItems = await geDataCombined();
    const gameItemsInMongo = await GameItemModel.find();

    const bulkOperations: AnyBulkWriteOperation[] = [];
    
    // Update the price of every game item in MongoDB.
    for (const item of gameItemsInMongo) {
        const fullItemData = updatedGameItems[item.id];
        if (!fullItemData) continue;

        // If this doesn't fix 'Magic logs', I guess just hard-code a list of items whose icons are gifs and use that
        const iconFileExtension = fullItemData.icon.split('.').pop() || 'png';
        fullItemData.icon = `${_.kebabCase(fullItemData.name)}.${iconFileExtension}`;

        bulkOperations.push({
            updateOne: {
                filter: { _id: item._id },
                update: fullItemData,
                upsert: true,
            },
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
