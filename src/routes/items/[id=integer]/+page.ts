import { NATURE_RUNE_ITEM_ID } from '$lib/constants/alchemy';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, params }) => {
    // The nature rune's price is fetched alongside the item because every alchemy figure shown to an
    // Ironman is net of the rune the cast burns. Reading it live beats a hardcoded gp figure, which
    // would go stale the moment the market moves.
    const [response, natureRuneResponse] = await Promise.all([
        fetch(`/api/game-item?id=${params.id}`),
        fetch(`/api/game-item?id=${NATURE_RUNE_ITEM_ID}`),
    ]);

    // A failed nature rune lookup is not worth failing the page over; the alchemy helper falls back
    // to a documented default so the number is slightly stale rather than absent.
    const natureRunePrice = natureRuneResponse.ok ? ((await natureRuneResponse.json())?.highPrice ?? null) : null;

    if (!response.ok) {
        return { gameItem: null, natureRunePrice };
    }

    const gameItem = await response.json();
    return { gameItem, natureRunePrice };
};
