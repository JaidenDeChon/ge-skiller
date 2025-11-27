<script lang="ts">
    import { page } from '$app/state';
    import { toast } from 'svelte-sonner';
    import {
        Star,
        StarOff,
        TrendingUp,
        TrendingDown,
        Package,
        ArrowLeftRight,
        Coins,
    } from 'lucide-svelte';
    import { Skeleton } from '$lib/components/ui/skeleton';
    import * as Avatar from '$lib/components/ui/avatar';
    import * as Breadcrumb from '$lib/components/ui/breadcrumb';
    import * as Table from '$lib/components/ui/table';
    import IconBadge from '$lib/components/global/icon-badge.svelte';
    import FavoriteButton from '$lib/components/global/favorite-button.svelte';
    import GameItemTreeCard from '$lib/components/game-item-tree/game-item-tree-card.svelte';
    import { iconToDataUri } from '$lib/helpers/icon-to-data-uri';
    import { formatWithCommas } from '$lib/helpers/format-number';
    import type { IGameItem, SkillLevelDesignation } from '$lib/models/game-item';
    import type { TimeSeriesDataPoint } from '$lib/models/grand-exchange-protocols';
    import Button from '$lib/components/ui/button/button.svelte';

    type AssociatedSkillsArray = NonNullable<IGameItem['creationSpecs']>['requiredSkills'];

    const slug = $derived(page.params.id);
    let loading = $state(true);
    let gameItem = $state<IGameItem | null>(null);
    let associatedSkills = $state(undefined as undefined | AssociatedSkillsArray);
    let priceHistory = $state([] as TimeSeriesDataPoint[]);
    let priceHistoryLoading = $state(false);
    let priceHistoryError = $state<string | null>(null);
    const MAX_CHART_POINTS = 30;
    const iconSrc = $derived(iconToDataUri(gameItem?.icon));
    const wikiUrl = $derived(() => {
        const slug = gameItem?.wikiName ?? gameItem?.name;
        if (!slug) return null;
        return `https://oldschool.runescape.wiki/w/${encodeURIComponent(slug.replaceAll(' ', '_'))}`;
    });
    const geSpread = $derived(() => {
        const high = gameItem?.highPrice;
        const low = gameItem?.lowPrice;
        if (high === null || high === undefined || low === null || low === undefined) return null;
        return high - low;
    });
    const highAlchProfit = $derived(() => {
        const alch = gameItem?.highalch;
        const price = gameItem?.highPrice;
        if (alch === null || alch === undefined || price === null || price === undefined) return null;
        return alch - price;
    });
    const lowAlchProfit = $derived(() => {
        const alch = gameItem?.lowalch;
        const price = gameItem?.lowPrice;
        if (alch === null || alch === undefined || price === null || price === undefined) return null;
        return alch - price;
    });
    const chartPoints = $derived(() => {
        const filtered = (priceHistory ?? []).filter(
            (point) => point.avgHighPrice !== null || point.avgLowPrice !== null,
        );
        const sorted = filtered.sort((a, b) => a.timestamp - b.timestamp);
        const trimmed = sorted.slice(-MAX_CHART_POINTS);

        return trimmed.map((point) => ({
            timestamp: point.timestamp,
            high: point.avgHighPrice ?? 0,
            low: point.avgLowPrice ?? 0,
        }));
    });

    function formatValue(value: number | null | undefined, suffix = ' gp') {
        if (value === null || value === undefined) return '—';
        return `${formatWithCommas(Math.round(value))}${suffix}`;
    }

    function formatDelta(value: number | null | undefined) {
        if (value === null || value === undefined) return '—';
        const sign = value > 0 ? '+' : '';
        return `${sign}${formatWithCommas(Math.round(value))} gp`;
    }

    async function loadPriceHistory(id: number) {
        priceHistoryLoading = true;
        priceHistoryError = null;
        try {
            const response = await fetch(`/api/game-item-timeseries?id=${id}&timestep=6h`);
            if (!response.ok) throw new Error('Failed to fetch price history');
            const data: TimeSeriesDataPoint[] = await response.json();
            priceHistory = data;
        } catch (error) {
            console.error(error);
            priceHistoryError = 'Could not load price history right now.';
        } finally {
            priceHistoryLoading = false;
        }
    }

    // Load the game item data once it's available.
    $effect(() => {
        if (!slug) return;

        fetch(`/api/game-item-full-tree/?id=${slug}`)
            .then(async (response) => {
                gameItem = await response.json();

                if (!gameItem) throw new Error('');

                getAssociatedSkills(gameItem);
                void loadPriceHistory(gameItem.id);
                loading = false;
            })
            .catch((error) => {
                console.error(error);
                toast.error('Failed to fetch all item data.', {
                    description: 'There may be issues on the page.',
                    action: {
                        label: 'Go back',
                        onClick: () => window.history.back(),
                    },
                });
            });
    });

    const renderChart = $derived(!!gameItem?.creationSpecs?.ingredients?.length);

    /**
     * Recursively searches through the IGameItem object's `creationSpecs` property to gather a list of all associated
     * skills.
     * @param item {IGameItem} The IGameItem object to search.
     */
    function getAssociatedSkills(item: IGameItem): void {
        const foundSkills: AssociatedSkillsArray = [];

        function extractSkills(gameItem: IGameItem) {
            if (gameItem.creationSpecs?.requiredSkills) {
                gameItem.creationSpecs.requiredSkills.forEach((requiredSkill: SkillLevelDesignation) => {
                    if (
                        !foundSkills.some(
                            (foundSkill: SkillLevelDesignation) => foundSkill.skillName === requiredSkill.skillName,
                        )
                    ) {
                        foundSkills.push(requiredSkill);
                    }
                });
            }

            if (gameItem.creationSpecs?.ingredients) {
                gameItem.creationSpecs.ingredients.forEach((ingredient) => {
                    if (ingredient.item) {
                        extractSkills(ingredient.item);
                    }
                });
            }
        }

        extractSkills(item);
        associatedSkills = foundSkills;
    }
</script>

<!-- Header -->
<header>
    <div class="flex justify-between items-center w-full">
        {#if loading || !gameItem}
            <div class="flex gap-5">
                <Skeleton class="h-4 w-10" />
                <Skeleton class="h-4 w-10" />
                <Skeleton class="h-4 w-32" />
            </div>
            <Skeleton class="rounded-full w-10 h-10" />
        {:else}
            <!-- Breadcrumbs and actions -->
            <Breadcrumb.Root>
                <Breadcrumb.List>
                    <!-- Home -->
                    <Breadcrumb.Item>
                        <Breadcrumb.Link href="/">Home</Breadcrumb.Link>
                    </Breadcrumb.Item>

                    <Breadcrumb.Separator />

                    <!-- Items -->
                    <Breadcrumb.Item>
                        <Breadcrumb.Link href="/items">Items</Breadcrumb.Link>
                    </Breadcrumb.Item>

                    <Breadcrumb.Separator />

                    <!-- This page -->
                    <Breadcrumb.Item>
                        <Breadcrumb.Page>{gameItem?.name}</Breadcrumb.Page>
                    </Breadcrumb.Item>
                </Breadcrumb.List>
            </Breadcrumb.Root>

            <div class="flex items-center gap-3">
                {#if wikiUrl()}
                    <Button
                        href={wikiUrl()}
                        target="_blank"
                        rel="noreferrer"
                        variant="outline"
                    >
                        Wiki
                    </Button>
                {/if}
                <FavoriteButton {gameItem} />
            </div>
        {/if}
    </div>

    <!-- Item name, description, color -->
    <!-- py-3 makes up for py-3 from .content-sizing -->
    <div class="flex gap-6 my-4 py-3">
        <!-- Item image -->
        {#if loading || !gameItem}
            <Skeleton class="h-16 w-16 rounded-full" />
        {:else}
            <Avatar.Root class="p-3 bg-muted border item-card__img-background h-16 w-16">
                {#if gameItem.icon}
                    <Avatar.Image
                        src={iconSrc}
                        alt={gameItem.name}
                        class="item-page__item-image object-contain animate-fade-in"
                    />
                {:else}
                    <Avatar.Fallback class="animate-fade-in-delayed">{gameItem.name?.substring(0, 2)}</Avatar.Fallback>
                {/if}
            </Avatar.Root>
        {/if}

        <!-- Name and description -->
        <div class="flex flex-col gap-2 justify-center">
            {#if loading || !gameItem}
                <Skeleton class="h-7 w-52 mb-2" />
                <Skeleton class="h-3 w-36" />
            {:else}
                <h1 class="text-2xl font-bold animate-fade-in">{gameItem.name}</h1>
                <p class="text-muted-foreground text-sm animate-fade-in">
                    {gameItem.examine}
                </p>
            {/if}
        </div>
    </div>
</header>

<!-- Skill tags -->

<div class="flex gap-3 flex-wrap">
    <IconBadge text={gameItem?.members ? 'Members' : 'Free to play'}>
        {#snippet icon()}
            <!-- Members indicator -->
            {#if gameItem?.members}
                <Star class="size-5 p-0.5 fill-primary text-transparent" />
            {:else}
                <StarOff class="size-5 p-0.5 text-muted-foreground" />
            {/if}
        {/snippet}
    </IconBadge>

    {#if associatedSkills?.length}
        {#each associatedSkills as associatedSkill}
            <IconBadge text={associatedSkill.skillName} secondaryText={associatedSkill.skillLevel.toString()}>
                {#snippet icon()}
                    <Avatar.Root class="size-5 p-0.5">
                        <Avatar.Image src="/skill-images/{associatedSkill.skillName}.png"></Avatar.Image>
                    </Avatar.Root>
                {/snippet}
            </IconBadge>
        {/each}
    {/if}
</div>

<!-- Pricing tables -->
<div class="grid gap-4 md:grid-cols-2 mt-6">
    {#if loading || !gameItem}
        <Skeleton class="h-44 w-full" />
        <Skeleton class="h-44 w-full" />
    {:else}
        <section class="border rounded-lg bg-card shadow-sm overflow-hidden">
            <div class="flex items-center justify-between p-4 border-b">
                <h3 class="text-lg font-semibold">Grand Exchange</h3>
            </div>
            <Table.Root>
                <Table.Body>
                    <Table.Row>
                        <Table.Cell class="font-medium">
                            <div class="flex items-center gap-2">
                                <span class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted border item-card__img-background shadow-sm">
                                    <TrendingUp class="h-4 w-4" />
                                </span>
                                <span>High price</span>
                            </div>
                        </Table.Cell>
                        <Table.Cell class="text-end">{formatValue(gameItem?.highPrice)}</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                        <Table.Cell class="font-medium">
                            <div class="flex items-center gap-2">
                                <span class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted border item-card__img-background shadow-sm">
                                    <TrendingDown class="h-4 w-4" />
                                </span>
                                <span>Low price</span>
                            </div>
                        </Table.Cell>
                        <Table.Cell class="text-end">{formatValue(gameItem?.lowPrice)}</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                        <Table.Cell class="font-medium">
                            <div class="flex items-center gap-2">
                                <span class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted border item-card__img-background shadow-sm">
                                    <Package class="h-4 w-4" />
                                </span>
                                <span>Buy limit</span>
                            </div>
                        </Table.Cell>
                        <Table.Cell class="text-end">{formatValue(gameItem?.buyLimit ?? gameItem?.buy_limit, '')}</Table.Cell>
                    </Table.Row>
                </Table.Body>
            </Table.Root>
        </section>

        <section class="border rounded-lg bg-card shadow-sm overflow-hidden">
            <div class="flex items-center justify-between p-4 border-b">
                <h3 class="text-lg font-semibold">Game Prices</h3>
            </div>
            <Table.Root>
                <Table.Body>
                    <Table.Row>
                        <Table.Cell class="font-medium">
                            <div class="flex items-center gap-2">
                                <span class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted border item-card__img-background shadow-sm">
                                    <img src="/spell-images/high-level-alchemy.png" alt="High alchemy" class="h-4 w-4 drop-shadow" />
                                </span>
                                <span>High alch</span>
                            </div>
                        </Table.Cell>
                        <Table.Cell class="text-end">{formatValue(gameItem?.highalch)}</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                        <Table.Cell class="font-medium">
                            <div class="flex items-center gap-2">
                                <span class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted border item-card__img-background shadow-sm">
                                    <img src="/spell-images/low-level-alchemy.png" alt="Low alchemy" class="h-4 w-4 drop-shadow" />
                                </span>
                                <span>Low alch</span>
                            </div>
                        </Table.Cell>
                        <Table.Cell class="text-end">{formatValue(gameItem?.lowalch)}</Table.Cell>
                    </Table.Row>
                    <Table.Row>
                        <Table.Cell class="font-medium">
                            <div class="flex items-center gap-2">
                                <span class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted border item-card__img-background shadow-sm">
                                    <img src="/other-images/pot.png" alt="General store" class="h-4 w-4 drop-shadow" />
                                </span>
                                <span>Store price</span>
                            </div>
                        </Table.Cell>
                        <Table.Cell class="text-end">{formatValue(gameItem?.cost)}</Table.Cell>
                    </Table.Row>
                </Table.Body>
            </Table.Root>
        </section>
    {/if}
</div>

<!-- Insights & requirements -->
<div class="grid gap-4 md:grid-cols-2 mt-4">
    <section class="border rounded-lg bg-card shadow-sm overflow-hidden">
        <div class="flex items-center justify-between p-4 border-b">
            <h3 class="text-lg font-semibold">Value insights</h3>
        </div>
        <Table.Root>
            <Table.Body>
                <Table.Row>
                    <Table.Cell class="font-medium">
                        <div class="flex items-center gap-2">
                            <span class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted border item-card__img-background shadow-sm">
                                <ArrowLeftRight class="h-4 w-4" />
                            </span>
                            <span>GE spread</span>
                        </div>
                    </Table.Cell>
                    <Table.Cell class="text-end">{formatDelta(geSpread())}</Table.Cell>
                </Table.Row>
                <Table.Row>
                    <Table.Cell class="font-medium">
                        <div class="flex items-center gap-2">
                            <span class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted border item-card__img-background shadow-sm">
                                <Coins class="h-4 w-4" />
                            </span>
                            <span>High alch profit</span>
                        </div>
                    </Table.Cell>
                    <Table.Cell class="text-end">{formatDelta(highAlchProfit())}</Table.Cell>
                </Table.Row>
                <Table.Row>
                    <Table.Cell class="font-medium">
                        <div class="flex items-center gap-2">
                            <span class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted border item-card__img-background shadow-sm">
                                <Coins class="h-4 w-4" />
                            </span>
                            <span>Low alch profit</span>
                        </div>
                    </Table.Cell>
                    <Table.Cell class="text-end">{formatDelta(lowAlchProfit())}</Table.Cell>
                </Table.Row>
            </Table.Body>
        </Table.Root>
    </section>

    <section class="border rounded-lg bg-card shadow-sm overflow-hidden">
        <div class="flex items-center justify-between p-4 border-b">
            <h3 class="text-lg font-semibold">Price history (6h)</h3>
        </div>
        <div class="p-4">
            {#if priceHistoryLoading}
                <Skeleton class="h-48 w-full" />
            {:else if priceHistoryError}
                <p class="text-sm text-destructive">{priceHistoryError}</p>
            {:else if chartPoints().length === 0}
                <p class="text-sm text-muted-foreground">No price history available yet.</p>
            {:else}
                <p class="text-sm text-muted-foreground">LayerChart goes here</p>
            {/if}
        </div>
    </section>
</div>

<!-- Item tree card -->
<GameItemTreeCard rootClass="mt-4 pb-5" {gameItem} {loading} {renderChart} />

<style>
    :global(.item-page__item-image) {
        filter: drop-shadow(2px 2px 5px rgba(0, 0, 0, 0.4));
    }
</style>
