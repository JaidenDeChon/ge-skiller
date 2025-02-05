import type { RequestHandler } from '@sveltejs/kit';
import { getItemsBySkill } from '$lib/services/game-item-cache-service';

export const GET: RequestHandler = async ({ url }) => {
    const skillName = url.searchParams.get('skillName');

    const itemsByCategory = skillName
        ? await getItemsBySkill(skillName)
        : await getItemsBySkill();

    return new Response(JSON.stringify(itemsByCategory));
};
