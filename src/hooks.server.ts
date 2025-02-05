import { startMongo } from '$db/mongo';
import { updatePricesIfNeeded } from '$lib/services/game-item-price-service';
import { populateGameItemCache } from '$lib/services/game-item-cache-service';
import type { Handle } from '@sveltejs/kit';

// Establish MongoDB connection.
await startMongo().then(() => console.info('MongoDB connection established.'));

// Check age of cached prices every minute. (Only updates if older than 5 minutes)
await updatePricesIfNeeded();
setInterval(updatePricesIfNeeded, 60_000);

// Update cached game items every minute.
await populateGameItemCache();
setInterval(populateGameItemCache, 60_000);

// Set up preloading etc.
export const handle: Handle = async ({ event, resolve }) => {
    return resolve(event, {
        preload: ({type, path}) => {
            // Preload ttf fonts. (osrs font)
            return type === 'font' || path.endsWith('.ttf');
        }
    });
};
