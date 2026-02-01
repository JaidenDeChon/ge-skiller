<script lang="ts">
    import FavoriteButton from './favorite-button.svelte';
    import HideButton from './hide-button.svelte';
    import * as Avatar from '$lib/components/ui/avatar';
    import { Skeleton } from '$lib/components/ui/skeleton';
    import { timeSince } from '$lib/helpers/time-since';
    import { formatWithCommas } from '$lib/helpers/format-number';
    import type { IGameItem } from '$lib/models/game-item';
    import { iconToDataUri } from '$lib/helpers/icon-to-data-uri';
    import { resolve } from '$app/paths';

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
        allowFavorite = true,
        allowHide = true,
    } = $props<{
        item?: IGameItem;
        loading?: boolean;
        linkToItemPage?: boolean;
        allowFavorite?: boolean;
        allowHide?: boolean;
    }>();

    let timeSincePriceTime = $state('Calculating...');
    const iconSrc = $derived(iconToDataUri(item.icon));
    const priceValue = $derived(resolveDisplayPrice(item));
    const hasPrice = $derived(priceValue !== null);
    const formattedPrice = $derived(hasPrice ? formatWithCommas(priceValue!) : '—');
    const priceTime = $derived(resolveDisplayTime(item));

    $effect(() => {
        if (priceTime) timeSincePriceTime = timeSince(priceTime);
        else timeSincePriceTime = '';
    });

    function resolveDisplayPrice(item: IGameItem): number | null {
        const price = item.highPrice ?? item.lowPrice ?? null;
        if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) return null;
        return price;
    }

    function resolveDisplayTime(item: IGameItem): number | null {
        const high = item.highPrice;
        if (typeof high === 'number' && Number.isFinite(high) && high > 0) {
            const highTime = item.highTime;
            if (typeof highTime === 'number' && Number.isFinite(highTime) && highTime > 0) return highTime;
        }

        const low = item.lowPrice;
        if (typeof low === 'number' && Number.isFinite(low) && low > 0) {
            const lowTime = item.lowTime;
            if (typeof lowTime === 'number' && Number.isFinite(lowTime) && lowTime > 0) return lowTime;
        }

        return null;
    }
</script>

{#snippet itemCardHeaderContent()}
    <span class="font-medium animate-fade-in">{item.name}</span>
    <span class="text-muted-foreground animate-fade-in">{item.examine}</span>
{/snippet}

<div class="item-card custom-card group flex h-full flex-col">
    <!-- Header -->
    <header class="flex justify-between gap-6 group/header">
        {#if loading}
            <div class={headerTextDivClasses}>
                <Skeleton class="h-4 w-1/3 mb-1" />
                <Skeleton class="h-4 w-3/5" />
            </div>
            <Skeleton class="rounded-full size-12" />
        {:else if linkToItemPage}
            <a href={resolve(`/items/${item.id}`)} class="flex justify-between gap-6 w-full items-start">
                <div class="group-hover/header:underline {headerTextDivClasses}">
                    {@render itemCardHeaderContent()}
                </div>
                <Avatar.Root class="p-2 bg-muted border item-card__img-background h-12 w-12">
                    <Avatar.Image src={iconSrc} class="item-card__image object-contain animate-fade-in" />
                    <Avatar.Fallback class="animate-fade-in">{item.name}</Avatar.Fallback>
                </Avatar.Root>
            </a>
        {:else}
            <div class={headerTextDivClasses}>
                {@render itemCardHeaderContent()}
            </div>
            <Avatar.Root class="p-2 bg-muted border item-card__img-background h-12 w-12">
                <Avatar.Image src={iconSrc} class="item-card__image object-contain animate-fade-in" />
                <Avatar.Fallback class="animate-fade-in">{item.name}</Avatar.Fallback>
            </Avatar.Root>
        {/if}
    </header>

    <!-- Body -->
    <div class="flex justify-between items-end gap-4 mt-auto pt-4">
        <div>
            {#if loading}
                <Skeleton class="h-5 w-24 mb-3 mt-2" />
                <Skeleton class="h-2 w-12" />
            {:else}
                <p class="text-2xl font-bold animate-fade-in">
                    <span class="text-primary">{formattedPrice}</span>{#if hasPrice}gp{/if}
                </p>
                {#if priceTime}
                    <p class="text-muted-foreground text-xs animate-fade-in">
                        {timeSincePriceTime}
                    </p>
                {/if}
            {/if}
        </div>
        {#if !loading}
            <div class="flex items-center gap-2 ml-auto">
                {#if allowHide}
                    <HideButton gameItem={item} />
                {/if}
                {#if allowFavorite}
                    <FavoriteButton gameItem={item} />
                {/if}
            </div>
        {/if}
    </div>
</div>

<style>
    .item-card :global(header img) {
        filter: drop-shadow(2px 2px 5px rgba(0, 0, 0, 0.4));
    }
</style>
