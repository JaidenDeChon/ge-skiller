import type { RequestHandler } from '@sveltejs/kit';
import { getGameItemsByPrice } from '$lib/helpers/game-items';

export const GET: RequestHandler = async () => {
    const gameItems = await getGameItemsByPrice(10);
    return new Response(JSON.stringify(gameItems));
}
