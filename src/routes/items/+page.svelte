<script lang="ts">
    import { get } from 'svelte/store';
    import { toast } from 'svelte-sonner';
    import ItemCard from '$lib/components/global/item-card.svelte';
    import { favoritesStore } from '$lib/stores/favorites-store';
    import type { PageData } from './$types';
    import type { GameItem } from '$lib/models/game-item';

    const { data }: { data: PageData } = $props();

    const items = $derived.by(() => data.gameItems);

    function handleFavorite(item: GameItem) {
        let favorites = get(favoritesStore).favorites;
        let updatedFavorites;

        const isFavorited = favorites.includes(item.id);

        if (isFavorited) updatedFavorites = favorites.filter((id) => id !== item.id);
        else updatedFavorites = [...favorites, item.id];

        favoritesStore.set({ favorites: updatedFavorites });
        toast.success(`"${item.name}" has been ${isFavorited ? 'unfavorited' : 'favorited'}.`);
    }
</script>

<h2 class="text-3xl font-bold mb-4">Browse items</h2>

<h3 class="text-2xl font-bold mb-4">Featured</h3>

<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
    {#each items as item}
        <ItemCard {item} handleFavoriteClick={() => handleFavorite(item)} />
    {/each}
</div>
