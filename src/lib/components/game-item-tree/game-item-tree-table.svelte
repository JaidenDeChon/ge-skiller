<script lang="ts">
    import ItemIngredientAccordion from '$lib/components/global/item-ingredient-accordion.svelte';
    import type { IOsrsboxItemWithMeta } from '$lib/models/osrsbox-db-item';

    interface GameItemTreeTableProps {
        gameItem: IOsrsboxItemWithMeta | null;
    }

    const { gameItem }: GameItemTreeTableProps = $props();
</script>

<ItemIngredientAccordion {gameItem} />
