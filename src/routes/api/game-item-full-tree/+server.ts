import { error } from '@sveltejs/kit';
import { populateIngredientsTree } from '$lib/services/game-item-mongo-service.server';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ url }) => {
    const id = url.searchParams.get('id');
    if (!id) {
        console.error('id was null');
        error(404);
    }

    const gameItems = await populateIngredientsTree(id);
    return new Response(JSON.stringify(gameItems));
}
