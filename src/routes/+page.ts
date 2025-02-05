import type { PageLoad } from './$types';
import type { GameItemsBySkill } from '$lib/models/game-item';

export const load: PageLoad = async ({ fetch, url }) => {
    const response = await fetch('/api/game-items-by-skill');
    const gameItemsBySkill: GameItemsBySkill[] = await response.json();
    return { gameItemsBySkill, pathname: url };
};
