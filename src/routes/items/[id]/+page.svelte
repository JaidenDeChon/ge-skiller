<script lang="ts">
    import { toast } from 'svelte-sonner';
    import { page } from '$app/state';
    import { Skeleton } from '$lib/components/ui/skeleton';
    import * as Avatar from '$lib/components/ui/avatar';
    import type { GameItem } from '$lib/models/game-item';

    const slug = $derived(page.params.id);
    let loading = $state(true);
    let gameItem = $state<GameItem | null>(null);

    // Load the game item data once it's available.
    $effect(() => {
        if (!slug) return;

        fetch(`/api/game-items/?id=${slug}`)
            .then(async (response) => {
                gameItem = await response.json();
                loading = false;
                console.log(gameItem);
            })
            .catch((error) => {
                console.error(error);
                toast.error('Failed to fetch item data.', {
                    description: 'The item could not be found.',
                    action: {
                        label: 'Go back',
                        onClick: () => window.history.back(),
                    },
                });
            });
    });
</script>

<!-- Header -->
<div class="flex gap-6 mt-4">
    <!-- Item image -->
    {#if loading || !gameItem}
        <Skeleton class="h-16 w-16 rounded-full" />
    {:else}
        <Avatar.Root class="p-3 bg-muted border item-card__img-background h-16 w-16">
            <Avatar.Image
                src="/item-images/{gameItem.image}"
                alt={gameItem.name}
                class="item-page__item-image object-contain animate-fade-in"
            />
            <Avatar.Fallback class="animate-fade-in-delayed">{gameItem.name.substring(0, 2)}</Avatar.Fallback>
        </Avatar.Root>
    {/if}

    <!-- Name and description -->
    <div class="flex flex-col gap-1 justify-center">
        {#if loading || !gameItem}
            <Skeleton class="h-7 w-52 mb-2" />
            <Skeleton class="h-3 w-36" />
        {:else}
            <h1 class="text-2xl font-bold animate-fade-in">{gameItem.name}</h1>
            <p class="text-muted-foreground text-sm animate-fade-in">
                {gameItem.examineText}
            </p>
        {/if}
    </div>
</div>

<style>
    :global(.item-page__item-image) {
        filter: drop-shadow(2px 2px 5px rgba(0, 0, 0, 0.4));
    }
</style>
