<script lang="ts">
    import ItemCardCompact from '../global/item-card-compact.svelte';
    import type { GameItem } from '$lib/models/game-item';

    interface GameItemTreeTableProps {
        gameItem: GameItem | null;
    }

    const { gameItem }: GameItemTreeTableProps = $props();
</script>

<ItemCardCompact {gameItem} />
