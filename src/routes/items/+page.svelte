<script lang="ts">
    import { onMount } from 'svelte';
    import ItemCard from '$lib/components/global/item-card.svelte';
    import type { GameItem } from '$lib/models/game-item';

    let loading = $state(true);
    let gameItems = $state([] as GameItem[]);

    onMount(async () => {
        const response = await fetch('/api/game-items');
        const responseGameItems: GameItem[] = await response.json();

        responseGameItems.sort((a, b) => (b.highPrice ?? 0) - (a.highPrice ?? 0));
        gameItems = responseGameItems;
        loading = false;
    });
</script>

<h1 class="text-3xl font-bold mb-4">Browse items</h1>

<h2 class="text-2xl font-bold mb-4">All items</h2>

<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
    {#if loading}
        {#each { length: 5 }}
            <ItemCard {loading} />
        {/each}
    {:else}
        {#each gameItems as item}
            <ItemCard {item} linkToItemPage />
        {/each}
    {/if}
</div>
