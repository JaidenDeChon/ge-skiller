import type { RequestHandler } from '@sveltejs/kit';
import { getGameItems, getPaginatedGameItems, type GameItemFilter, type GameItemSortOrder } from '$lib/services/game-item-mongo-service.server';

export const GET: RequestHandler = async ({ url }) => {
    // Get all "id" parameters from the query string (supports multiple IDs).
    const ids = url.searchParams.getAll('id');

    if (ids.length > 0) {
        // Fetch all requested items concurrently.
        const gameItems = await getGameItems(ids);
        return new Response(JSON.stringify(gameItems));
    }

    const page = Number(url.searchParams.get('page')) || 1;
    const perPage = Number(url.searchParams.get('perPage')) || 50;
    const filter = (url.searchParams.get('filter') ?? undefined) as GameItemFilter | undefined;
    const orderParam = url.searchParams.get('order');
    const sortOrder: GameItemSortOrder = orderParam === 'asc' ? 'asc' : 'desc';

    const paginated = await getPaginatedGameItems({ page, perPage, filter, sortOrder });
    return new Response(JSON.stringify(paginated));
};
