import type { RequestHandler } from '@sveltejs/kit';
import { getAllGameItems } from '$lib/services/game-item-cache-service';

export const GET: RequestHandler = async ({ url }) => {
    const gameItems = await getAllGameItems();
    return new Response(JSON.stringify(gameItems));
}
