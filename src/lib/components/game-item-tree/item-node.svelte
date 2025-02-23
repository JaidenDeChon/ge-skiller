<script lang="ts">
    import * as Card from '$lib/components/ui/card';
    import type { GameItem } from '$lib/models/game-item';

    const { gameItem }: { gameItem?: GameItem } = $props();
</script>

{#if gameItem}
    <Card.Root class="shadow-none bg-muted">
        <Card.Content class="flex flex-col w-[72px] h-[72px] p-4">
            <img src={gameItem.image} alt={gameItem.name} class="w-full h-full object-contain" />
        </Card.Content>
    </Card.Root>
{/if}

<style>
    img {
        filter: drop-shadow(2px 2px 5px rgba(0, 0, 0, 0.4));
    }
</style>
