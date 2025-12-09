import { OsrsboxItemModel } from '../models/mongo-schemas/osrsbox-db-item-schema';
import { CollectionMetadataModel } from '../models/mongo-schemas/collection-metadata-schema';
import { geDataCombined } from './grand-exchange-api-service';
import consola from 'consola';
import type { AnyBulkWriteOperation } from 'mongoose';

const logger = consola.create({ defaults: { tag: 'price-sync' } });

/**
 * Updates the prices of all GameItems in the database.
 */
export async function updateAllGameItemPricesInMongo(): Promise<void> {
    const updatedGameItems = await geDataCombined();
    const gameItemsInMongo = await OsrsboxItemModel.find();

    const bulkOperations: AnyBulkWriteOperation[] = [];
    const missingData: number[] = [];

    // Update the price of every game item in MongoDB.
    for (const item of gameItemsInMongo) {
        const fullItemData = updatedGameItems[item.id];
        if (!fullItemData) {
            missingData.push(item.id);
            continue;
        }

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

    logger.info(
        `Prepared ${bulkOperations.length} price updates out of ${gameItemsInMongo.length} items (${missingData.length} missing data).`,
    );

    // Update the data to the database.
    const bulkResult = await OsrsboxItemModel.bulkWrite(bulkOperations);

    logger.success(
        `Bulk write complete | matched=${bulkResult.matchedCount} modified=${bulkResult.modifiedCount} upserted=${bulkResult.upsertedCount}`,
    );
    if (missingData.length) {
        const sample = missingData.slice(0, 10).join(', ');
        logger.warn(
            `Missing GE data for ${missingData.length} items; first few ids: ${sample}${missingData.length > 10 ? '…' : ''}`,
        );
    }

    const collectionName = 'items';
    const lastUpdated = Date.now();

    // Update the collection metadata.
    await CollectionMetadataModel.findOneAndUpdate(
        { collectionName },
        { lastUpdated, collectionName },
        { upsert: true },
    ).exec();

    logger.info(`Collection metadata updated for "${collectionName}" at ${new Date(lastUpdated).toISOString()}`);

    return;
}
