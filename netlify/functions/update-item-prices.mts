import { startMongo } from '../../src/db/mongo';
import { updateAllGameItemPricesInMongo } from '../../src/lib/services/game-item-price-service';

// Establish MongoDB connection.
await startMongo();
console.info('MongoDB connection established. Updating all game item prices...');

try {
    // Update all game item prices in the database.
    await updateAllGameItemPricesInMongo();
} catch (error) {
    console.error('Error updating game item prices:', error);
    throw error;
}
