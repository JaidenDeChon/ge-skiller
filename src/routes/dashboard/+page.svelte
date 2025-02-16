<script lang="ts">
    import type { PageData } from "./$types";
    import ItemCard from "$lib/components/global/item-card.svelte";

    export let data: PageData;
</script>

<h2 class="text-3xl font-bold mb-4">Dashboard</h2>

<div class="flex flex-col gap-4">
    {#each data.gameItems as item}
        <ItemCard {item} />
    {/each}
</div>
