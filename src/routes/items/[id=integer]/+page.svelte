<script lang="ts">
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
    import GameItemTreeCard from '$lib/components/game-item-creation-card/game-item-creation-card.svelte';
    import { iconToDataUri } from '$lib/helpers/icon-to-data-uri';
    import { formatWithCommas } from '$lib/helpers/format-number';
    import { getPrimaryCreationSpec } from '$lib/helpers/creation-specs';
    import type { IOsrsboxItemWithMeta, SkillLevelDesignation } from '$lib/models/osrsbox-db-item';
    import Button from '$lib/components/ui/button/button.svelte';
    import OsrsboxItemUploadDialog from '$lib/components/dialogs/osrsbox-item-upload-dialog.svelte';
    import { afterNavigate, beforeNavigate } from '$app/navigation';
    import { browser } from '$app/environment';
    import { toast } from 'svelte-sonner';
    
    const { data }: { data: { gameItem: IOsrsboxItemWithMeta | null; showDevControls?: boolean } } = $props();
    
    type AssociatedSkillsArray = SkillLevelDesignation[];
    let loading = $state(false);
    let gameItem = $state<IOsrsboxItemWithMeta | null>(data.gameItem ?? null);
        let associatedSkills = $state(undefined as undefined | AssociatedSkillsArray);
        const iconSrc = $derived(iconToDataUri(gameItem?.icon));
        const wikiUrl = $derived(() => {
            const slug = gameItem?.wiki_name ?? gameItem?.name ?? gameItem?.wikiName;
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
        const devControlsEnabled = Boolean(data.showDevControls);
        
        function formatValue(value: number | null | undefined, suffix = ' gp') {
            if (value === null || value === undefined) return '—';
            return `${formatWithCommas(Math.round(value))}${suffix}`;
        }
        
        function formatDelta(value: number | null | undefined) {
            if (value === null || value === undefined) return '—';
            const sign = value > 0 ? '+' : '';
            return `${sign}${formatWithCommas(Math.round(value))} gp`;
        }
        
        let editLoading = $state(false);
        
        async function handleEdit(openWithItem: (item: Record<string, unknown>) => void) {
            if (!gameItem?.id) return;
            editLoading = true;
            try {
                const resp = await fetch(`/api/osrsbox-items?id=${encodeURIComponent(gameItem.id)}`);
                if (!resp.ok) {
                    const message = await resp.text();
                    throw new Error(message || 'Failed to load item for editing.');
                }
                const item = (await resp.json()) as Record<string, unknown>;
                openWithItem(item);
            } catch (error) {
                console.error(error);
                toast.error(error instanceof Error ? error.message : 'Failed to load item for editing.');
            } finally {
                editLoading = false;
            }
        }
        
        async function refreshItemFromApi() {
            if (!gameItem?.id) return;
            loading = true;
            try {
                const resp = await fetch(`/api/osrsbox-items?id=${encodeURIComponent(gameItem.id)}`);
                if (!resp.ok) {
                    const message = await resp.text();
                    throw new Error(message || 'Failed to refresh item.');
                }
                const updated = (await resp.json()) as IOsrsboxItemWithMeta;
                gameItem = updated;
                associatedSkills = undefined;
                getAssociatedSkills(updated);
                toast.success('Item updated.');
            } catch (error) {
                console.error(error);
                toast.error(error instanceof Error ? error.message : 'Failed to refresh item.');
            } finally {
                loading = false;
            }
        }
        
        let lastDataItemId: string | number | null = null;
        
        $effect(() => {
            // When routed data arrives, hydrate local state and kick off dependent fetches.
            const incoming = data.gameItem ?? null;
            const incomingId = incoming?.id ?? null;
            if (incomingId === lastDataItemId) return;
            
            lastDataItemId = incomingId;
            gameItem = incoming;
            loading = false;
            associatedSkills = undefined;
            
            if (incoming) getAssociatedSkills(incoming);
        });
        
        const primaryCreationSpec = $derived(getPrimaryCreationSpec(gameItem));
        const renderChart = $derived(!!primaryCreationSpec?.ingredients?.length);
        /**
        * Recursively searches through the item's `creationSpecs` to gather a list of all associated skills.
        * @param item {IOsrsboxItemWithMeta} The item object to search.
        */
        function getAssociatedSkills(item: IOsrsboxItemWithMeta): void {
            const foundSkills: AssociatedSkillsArray = [];
            
            function extractSkills(target?: IOsrsboxItemWithMeta | null) {
                if (!target) return;
                
                const creationSpec = getPrimaryCreationSpec(target);
                if (creationSpec?.requiredSkills?.length) {
                    creationSpec.requiredSkills.forEach((requiredSkill: SkillLevelDesignation) => {
                        const alreadyAdded = foundSkills.some(
                        (foundSkill: SkillLevelDesignation) => foundSkill.skillName === requiredSkill.skillName,
                        );
                        if (!alreadyAdded) foundSkills.push(requiredSkill);
                    });
                }
                
                if (creationSpec?.ingredients?.length) {
                    creationSpec.ingredients.forEach((ingredient) => extractSkills(ingredient.item));
                }
            }
            
            extractSkills(item);
            associatedSkills = foundSkills;
        }
    </script>
    
<div class="px-4 sm:px-6 lg:px-8 pt-6">
        <div class="max-w-5xl mx-auto w-full">
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
                    {#if devControlsEnabled}
                    <OsrsboxItemUploadDialog triggerClass="inline-flex" onCreated={refreshItemFromApi}>
                        {#snippet trigger({ openWithItem, triggerClass })}
                        <Button
                        variant="outline"
                        class={triggerClass}
                        disabled={!gameItem || editLoading}
                        onclick={() => gameItem && handleEdit(openWithItem)}
                        >
                        Edit
                    </Button>
                    {/snippet}
                </OsrsboxItemUploadDialog>
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
    </div>
    
    <!-- Item tree card -->
    <GameItemTreeCard rootClass="mt-4 pb-5" {gameItem} {loading} {renderChart} />
    
    <!-- Pricing tables -->
    <div class="grid gap-4 lg:grid-cols-2 mt-6">
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
    <div class="grid gap-4 lg:grid-cols-2 mt-4">
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
    </div>
    
</div>
</div>

<style>
    :global(.item-page__item-image) {
        filter: drop-shadow(2px 2px 5px rgba(0, 0, 0, 0.4));
    }
</style>
