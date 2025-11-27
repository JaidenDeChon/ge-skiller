import type { RequestHandler } from '@sveltejs/kit';
import { searchGameItems } from '$lib/services/game-item-mongo-service.server';

export const GET: RequestHandler = async ({ url }) => {
    const q = url.searchParams.get('q') ?? '';
    const limit = Number(url.searchParams.get('limit')) || 10;

    const results = await searchGameItems(q, limit);
    return new Response(JSON.stringify(results));
};
