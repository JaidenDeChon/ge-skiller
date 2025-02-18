<script lang="ts">
    import { get } from 'svelte/store';
    import { toast } from 'svelte-sonner';
    import ItemCard from '$lib/components/global/item-card.svelte';
    import { favoritesStore } from '$lib/stores/favorites-store';
    import type { PageData } from './$types';
    import type { GameItem } from '$lib/models/game-item';

    const { data }: { data: PageData } = $props();

    const sortedItems = $derived.by(() =>
        data.gameItems.slice().sort((a, b) => (b.highPrice ?? 0) - (a.highPrice ?? 0)),
    );

    function handleFavorite(item: GameItem) {
        let favorites = get(favoritesStore).favorites; // Get current favorites array
        let updatedFavorites;

        if (favorites.includes(item.id)) updatedFavorites = favorites.filter((id) => id !== item.id);
        else updatedFavorites = [...favorites, item.id];

        favoritesStore.set({ favorites: updatedFavorites });
        toast.success(`Item ${item.name} has been ${favorites.includes(item.id) ? 'unfavorited' : 'favorited'}.`);
    }
</script>

<h2 class="text-3xl font-bold mb-4">Dashboard</h2>

<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
    {#each sortedItems as item}
        <ItemCard {item} handleFavoriteClick={() => handleFavorite(item)} />
    {/each}
</div>
