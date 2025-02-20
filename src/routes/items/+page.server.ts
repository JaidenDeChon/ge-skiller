import type { GameItem } from '$lib/models/game-item';

export const load = async ({ fetch, url }) => {
    const pathname = url.pathname;

    const response = await fetch('/api/game-items-by-price');
    const gameItems: GameItem[] = await response.json();

    return { gameItems, pathname };
};
