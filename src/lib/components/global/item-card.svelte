<script lang="ts">
    import { onMount } from 'svelte';
    import Device from 'svelte-device-info';
    import { Heart } from 'lucide-svelte';
    import { Button } from '$lib/components/ui/button';
    import * as Avatar from '$lib/components/ui/avatar';
    import { timeSince } from '$lib/helpers/time-since';
    import { favoritesStore } from '$lib/stores/favorites-store';
    import type { GameItem } from '$lib/models/game-item';

    const { item, handleFavoriteClick } = $props<{
        item: GameItem;
        handleFavoriteClick?: Function;
    }>();

    const isFavorited = $derived($favoritesStore.favorites.includes(item.id));

    let isTouch = $state(true);

    onMount(() => {
        isTouch = Device.isMobile || Device.isTablet;
    });

    $effect(() => {
        console.log(isFavorited);
    });
</script>

<div class="custom-card group">
    <!-- Header -->
    <div class="flex justify-between gap-6">
        <div class="flex flex-col mb-2 text-sm">
            <span class="font-medium">{item.name}</span>
            <span class="text-muted-foreground">{item.examineText}</span>
        </div>
        <Avatar.Root class="p-2 bg-muted border h-12 w-12">
            <Avatar.Image src="/item-images/{item.image}" alt={item.name} class="object-contain" />
            <Avatar.Fallback>{item.name}</Avatar.Fallback>
        </Avatar.Root>
    </div>

    <!-- Body -->
    <div class="flex justify-between items-end gap-6 mt-6">
        <div>
            <p class="text-2xl font-bold">
                <span class="text-primary">{item.highPrice}</span>gp
            </p>
            {#if item.highTime}
                <p class="text-muted-foreground text-xs">
                    {timeSince(item.highTime)}
                </p>
            {/if}
        </div>
        <Button
            variant="ghost"
            size="icon"
            class={[
                'rounded-full transition-opacity',
                isFavorited && 'text-primary',
                !isFavorited && !isTouch && 'opacity-0 group-hover:opacity-100',
            ]}
            onclick={handleFavoriteClick}
        >
            <Heart fill={isFavorited ? 'hsl(var(--primary))' : 'transparent'} />
        </Button>
    </div>
</div>
