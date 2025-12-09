import { startMongo } from '../../src/db/mongo';
import { updateAllGameItemPricesInMongo } from '../../src/lib/services/game-item-price-service';

(async function doThing() {
    console.info('Attempting item prices update');

    try {
        await startMongo();
        console.info('MongoDB connection established. Updating all game item prices...');
        await updateAllGameItemPricesInMongo();
        console.info('All game item prices updated.');
    } catch (error) {
        console.error('Error updating item prices:', error);
        throw error;
    } finally {
        // const { next_run } = await req.json();
        // console.info('Next run:', next_run);
    }
})();
