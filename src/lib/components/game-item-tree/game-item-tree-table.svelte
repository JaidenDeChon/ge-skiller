<script lang="ts">
    import ItemIngredientAccordion from '$lib/components/global/item-ingredient-accordion.svelte';
    import type { IGameItem } from '$lib/models/game-item';

    interface GameItemTreeTableProps {
        gameItem: IGameItem | null;
    }

    const { gameItem }: GameItemTreeTableProps = $props();
</script>

<ItemIngredientAccordion {gameItem} />
