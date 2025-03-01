import { getGameItemsByPrice } from '$lib/helpers/game-items';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async () => {
    const gameItems = await getGameItemsByPrice();
    return new Response(JSON.stringify(gameItems));
}
