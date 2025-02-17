<script lang="ts">
    import type { PageData } from "./$types";
    import ItemCard from "$lib/components/global/item-card.svelte";

    export let data: PageData;

    $: sortedItems = data.gameItems
        .slice()
        .sort((a, b) => (b.highPrice ?? 0) - (a.highPrice ?? 0));
</script>

<h2 class="text-3xl font-bold mb-4">Dashboard</h2>

<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
    {#each sortedItems as item}
        <ItemCard {item} />
    {/each}
</div>
