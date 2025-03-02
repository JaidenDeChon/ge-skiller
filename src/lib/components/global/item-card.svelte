<script lang="ts">
    import { onMount } from 'svelte';
    import Device from 'svelte-device-info';
    import FavoriteButton from './favorite-button.svelte';
    import * as Avatar from '$lib/components/ui/avatar';
    import { Skeleton } from '$lib/components/ui/skeleton';
    import { timeSince } from '$lib/helpers/time-since';
    import type { IGameItem } from '$lib/models/game-item';

    const headerTextDivClasses = 'flex-1 flex flex-col mb-2 text-sm';

    const emptyGameItem: IGameItem = {
        id: -1,
        name: '',
        icon: '',
        examine: '',
        wikiName: '',
        cost: -1,
        highalch: -1,
        lowalch: -1,
        incomplete: false,
        members: false,
        tradeable: false,
        buyLimit: -1,
        highPrice: -1,
        highTime: -1,
        lowPrice: -1,
        lowTime: -1,
    };

    const {
        item = emptyGameItem,
        loading = false,
        linkToItemPage = false,
    } = $props<{
        item?: IGameItem;
        loading?: boolean;
        linkToItemPage?: boolean;
    }>();

    let isTouch = $state(true);
    let timeSinceHighTime = $state('Calculating...');

    onMount(() => {
        isTouch = Device.isMobile || Device.isTablet;
        if (item.highTime) timeSinceHighTime = timeSince(item.highTime);
        else timeSinceHighTime = '';
    });
</script>

{#snippet itemCardHeaderContent()}
    <span class="font-medium animate-fade-in">{item.name}</span>
    <span class="text-muted-foreground animate-fade-in">{item.examine}</span>
{/snippet}

<div class="item-card custom-card group">
    <!-- Header -->
    <header class="flex justify-between gap-6 group/header">
        {#if loading}
            <div class={headerTextDivClasses}>
                <Skeleton class="h-4 w-1/3 mb-1" />
                <Skeleton class="h-4 w-3/5" />
            </div>
        {:else if linkToItemPage}
            <a href={`/items/${item.id}`} class="group-hover/header:underline {headerTextDivClasses}">
                {@render itemCardHeaderContent()}
            </a>
        {:else}
            {@render itemCardHeaderContent()}
        {/if}

        {#if loading}
            <Skeleton class="rounded-full size-12" />
        {:else}
            <Avatar.Root class="p-2 bg-muted border item-card__img-background h-12 w-12">
                <Avatar.Image src="/item-images/{item.icon}" class="item-card__image object-contain animate-fade-in" />
                <Avatar.Fallback class="animate-fade-in">{item.name}</Avatar.Fallback>
            </Avatar.Root>
        {/if}
    </header>

    <!-- Body -->
    <div class="flex justify-between items-end gap-6 mt-6">
        <div>
            {#if loading}
                <Skeleton class="h-5 w-24 mb-3 mt-2" />
                <Skeleton class="h-2 w-12" />
            {:else}
                <p class="text-2xl font-bold animate-fade-in">
                    <span class="text-primary">{item.highPrice}</span>gp
                </p>
                {#if item.highTime}
                    <p class="text-muted-foreground text-xs animate-fade-in">
                        {timeSinceHighTime}
                    </p>
                {/if}
            {/if}
        </div>
        {#if !loading}
            <FavoriteButton gameItem={item} />
        {/if}
    </div>
</div>

<style>
    .item-card :global(header img) {
        filter: drop-shadow(2px 2px 5px rgba(0, 0, 0, 0.4));
    }
</style>
