import type { RequestHandler } from '@sveltejs/kit';
import { getGameItems } from '$lib/services/game-item-mongo-service.server';

export const GET: RequestHandler = async ({ url }) => {
    // Get all "id" parameters from the query string (supports multiple IDs).
    const ids = url.searchParams.getAll('id');

    if (ids.length > 0) {
        // Fetch all requested items concurrently.
        const gameItems = await getGameItems(ids);
        return new Response(JSON.stringify(gameItems));
    }

    // Otherwise, get all game items.
    const gameItems = await getGameItems();
    return new Response(JSON.stringify(gameItems));
};
