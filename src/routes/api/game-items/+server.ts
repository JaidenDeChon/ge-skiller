import type { RequestHandler } from '@sveltejs/kit';
import {
    getGameItems,
    getPaginatedGameItems,
    type GameItemFilter,
    type GameItemSortOrder,
    type PlayerSupplies,
    type PlayerSkillLevels,
} from '$lib/services/game-item-mongo-service.server';

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
    const normalizedOrder = orderParam === 'profit-asc' ? 'profit-desc' : orderParam;
    const sortOrder: GameItemSortOrder =
        normalizedOrder === 'asc' || normalizedOrder === 'desc' || normalizedOrder === 'profit-desc'
            ? normalizedOrder
            : 'desc';
    const skill = url.searchParams.get('skill');
    const skillLevelsParam = url.searchParams.get('skillLevels');
    let skillLevels: PlayerSkillLevels | undefined;
    const suppliesParam = url.searchParams.get('supplies');
    let supplies: PlayerSupplies | undefined;
    const suppliesActive = url.searchParams.get('suppliesActive') === '1';
    const profitMode = url.searchParams.get('profitMode') === '1';

    if (skillLevelsParam) {
        try {
            const parsed = JSON.parse(skillLevelsParam) as PlayerSkillLevels;
            if (parsed && typeof parsed === 'object') {
                skillLevels = Object.fromEntries(
                    Object.entries(parsed)
                        .map(([skill, level]) => [skill, Number(level)])
                        .filter(([, level]) => Number.isFinite(level)),
                );
            }
        } catch (error) {
            console.warn('Failed to parse skillLevels query param', error);
        }
    }

    if (suppliesParam) {
        try {
            const parsed = JSON.parse(suppliesParam) as PlayerSupplies;
            if (parsed && typeof parsed === 'object') {
                const entries = Object.entries(parsed)
                    .map(([id, quantity]) => [String(id), Math.floor(Number(quantity))])
                    .filter(([, quantity]) => Number.isFinite(quantity) && quantity > 0);
                if (entries.length) supplies = Object.fromEntries(entries);
            }
        } catch (error) {
            console.warn('Failed to parse supplies query param', error);
        }
    }

    const paginated = await getPaginatedGameItems({
        page,
        perPage,
        filter,
        sortOrder,
        skillLevels,
        skill,
        supplies,
        suppliesActive,
        profitMode,
    });
    return new Response(JSON.stringify(paginated));
};
