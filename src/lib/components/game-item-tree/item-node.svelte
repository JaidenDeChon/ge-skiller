<script lang="ts">
    import * as Card from '$lib/components/ui/card';
    import type { IGameItem } from '$lib/models/game-item';

    const { gameItem }: { gameItem?: IGameItem } = $props();
</script>

{#if gameItem}
    <Card.Root class="border-muted-foreground item-node fixed shadow-none bg-muted rounded-full">
        <Card.Content class="flex flex-col w-16 h-16 p-3">
            <img src={gameItem.icon} alt={gameItem.name} class="w-full h-full object-contain" />
        </Card.Content>
    </Card.Root>
{/if}

<style>
    :global(.item-node) {
        transform-origin: 0px 0px;
    }

    img {
        filter: drop-shadow(2px 2px 5px rgba(0, 0, 0, 0.4));
    }
</style>
