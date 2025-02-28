<script lang="ts">
    import ItemIngredientAccordion from '$lib/components/global/item-ingredient-accordion.svelte';
    import type { GameItem } from '$lib/models/game-item';

    interface GameItemTreeTableProps {
        gameItem: GameItem | null;
    }

    const { gameItem }: GameItemTreeTableProps = $props();
</script>

<ItemIngredientAccordion {gameItem} />
