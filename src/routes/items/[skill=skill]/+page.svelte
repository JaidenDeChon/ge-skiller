<script lang="ts">
    import GameItemsPage from '$lib/components/items/game-items-page.svelte';

    const { data } = $props();
    const skill = $derived(data.skill);
</script>

{#key skill?.slug ?? 'all'}
    <GameItemsPage {skill} />
{/key}
