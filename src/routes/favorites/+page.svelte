<script lang="ts">
    import { onMount } from 'svelte';
    import { favoritesStore } from '$lib/stores/favorites-store';
    import ItemCard from '$lib/components/global/item-card.svelte';
    import type { IGameItem } from '$lib/models/game-item';

    let loading = $state(true);

    let favorites = $derived($favoritesStore.favorites);
    let completeFavorites = $state([] as IGameItem[]);

    onMount(async () => {
        loading = true;
        const params = favorites.join('&id=');
        const response = await fetch(`/api/game-items?id=${params}`);
        const result: IGameItem[] = await response.json();
        completeFavorites = result;
        loading = false;
    });
</script>

<h1 class="text-3xl font-bold mb-4">Favorites</h1>

<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
    {#if loading}
        {#each Array.from({ length: 5 }, (_, i) => i) as index (index)}
            <ItemCard {loading} />
        {/each}
    {:else}
        {#each completeFavorites as item}
            <ItemCard {item} linkToItemPage />
        {/each}
    {/if}
</div>
