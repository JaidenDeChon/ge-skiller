
import type { RequestHandler } from '@sveltejs/kit';
import { getAllGameItems, getItemById } from '$lib/services/game-item-cache-service';

export const GET: RequestHandler = async ({ url }) => {
    // Get a single game item by id if id is provided in the query string.
    const id = url.searchParams.get('id');

    if (id) {
        const gameItem = await getItemById(id);
        return new Response(JSON.stringify(gameItem));
    }

    // Otherwise, get all game items.
    const gameItems = await getAllGameItems();
    return new Response(JSON.stringify(gameItems));
}
