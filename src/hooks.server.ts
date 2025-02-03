import type { Handle } from '@sveltejs/kit';
import { startMongo } from '$db/mongo';
import { updatePricesIfNeeded } from '$lib/services/game-item-price-service';

// Establish MongoDB connection.
await startMongo().then(() => console.info('MongoDB connection established.'));

// Check age of cached prices every minute. (Only updates if older than 5 minutes)
await updatePricesIfNeeded();
setInterval(updatePricesIfNeeded, 60_000);

export const handle: Handle = async ({ event, resolve }) => {
    return resolve(event, {
        preload: ({type, path}) => {
            return type === 'font' || path.endsWith('.ttf');
        }
    });
};
