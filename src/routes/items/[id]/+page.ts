import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, params }) => {
    const response = await fetch(`/api/game-item-full-tree/?id=${params.id}`);

    if (!response.ok) {
        return { gameItem: null };
    }

    const gameItem = await response.json();
    return { gameItem };
};
