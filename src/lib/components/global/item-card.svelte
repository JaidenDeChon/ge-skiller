<script lang="ts">
    import { get } from 'svelte/store';
    import { onMount } from 'svelte';
    import Device from 'svelte-device-info';
    import { Heart } from 'lucide-svelte';
    import { toast } from 'svelte-sonner';
    import { Button } from '$lib/components/ui/button';
    import { Skeleton } from '$lib/components/ui/skeleton';
    import * as Avatar from '$lib/components/ui/avatar';
    import { timeSince } from '$lib/helpers/time-since';
    import { favoritesStore } from '$lib/stores/favorites-store';
    import type { GameItem } from '$lib/models/game-item';

    const emptyGameItem: GameItem = {
        id: '0',
        name: 'Loading...',
        examineText: 'Loading...',
        highPrice: 0,
        highTime: 0,
        image: 'loading.gif',
    };

    const { item = emptyGameItem, loading = false } = $props<{
        item?: GameItem;
        loading?: boolean;
    }>();

    const isFavorited = $derived($favoritesStore.favorites.includes(item.id));

    let isTouch = $state(true);
    let timeSinceHighTime = $state('Calculating...');

    onMount(() => {
        isTouch = Device.isMobile || Device.isTablet;
        if (item.highTime) timeSinceHighTime = timeSince(item.highTime);
        else timeSinceHighTime = '';
    });

    function handleFavorite() {
        let favorites = get(favoritesStore).favorites;
        let updatedFavorites;

        if (isFavorited) updatedFavorites = favorites.filter((id) => id !== item.id);
        else updatedFavorites = [...favorites, item.id];

        favoritesStore.set({ favorites: updatedFavorites });
        toast.success(`"${item.name}" has been ${isFavorited ? 'unfavorited' : 'favorited'}.`);
    }
</script>

<div class="item-card custom-card group">
    <!-- Header -->
    <header class="flex justify-between gap-6">
        <div class="flex-1 flex flex-col mb-2 text-sm">
            {#if loading}
                <Skeleton class="h-4 w-1/3 mb-2" />
                <Skeleton class="h-4 w-3/5" />
            {:else}
                <span class="font-medium">{item.name}</span>
                <span class="text-muted-foreground">{item.examineText}</span>
            {/if}
        </div>
        {#if loading}
            <Skeleton class="rounded-full size-12" />
        {:else}
            <Avatar.Root class="p-2 bg-muted border item-card__img-background h-12 w-12">
                <Avatar.Image src="/item-images/{item.image}" alt={item.name} class="item-card__image object-contain" />
                <Avatar.Fallback>{item.name}</Avatar.Fallback>
            </Avatar.Root>
        {/if}
    </header>

    <!-- Body -->
    <div class="flex justify-between items-end gap-6 mt-6">
        <div>
            {#if loading}
                <Skeleton class="h-6 w-24 mb-4" />
                <Skeleton class="h-2 w-8" />
            {:else}
                <p class="text-2xl font-bold">
                    <span class="text-primary">{item.highPrice}</span>gp
                </p>
                {#if item.highTime}
                    <p class="text-muted-foreground text-xs">
                        {timeSinceHighTime}
                    </p>
                {/if}
            {/if}
        </div>
        {#if !loading}
            <Button
                variant="ghost"
                size="icon"
                class={[
                    'rounded-full transition-opacity',
                    isFavorited && 'text-primary',
                    !isFavorited && !isTouch && 'opacity-0 group-hover:opacity-100',
                ]}
                onclick={handleFavorite}
            >
                <Heart fill={isFavorited ? 'hsl(var(--primary))' : 'transparent'} />
            </Button>
        {/if}
    </div>
</div>

<style>
    .item-card :global(header img) {
        filter: drop-shadow(2px 2px 5px rgba(0, 0, 0, 0.4));
    }
</style>
