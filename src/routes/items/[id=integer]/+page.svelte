<script lang="ts">
    import { Star, StarOff, TrendingUp, TrendingDown, Package, ArrowLeftRight, Coins } from 'lucide-svelte';
    import { Skeleton } from '$lib/components/ui/skeleton';
    import * as Avatar from '$lib/components/ui/avatar';
    import * as Breadcrumb from '$lib/components/ui/breadcrumb';
    import * as Dialog from '$lib/components/ui/dialog';
    import * as Table from '$lib/components/ui/table';
    import IconBadge from '$lib/components/global/icon-badge.svelte';
    import FavoriteButton from '$lib/components/global/favorite-button.svelte';
    import GameItemTreeCard from '$lib/components/game-item-creation-card/game-item-creation-card.svelte';
    import { iconToDataUri } from '$lib/helpers/icon-to-data-uri';
    import { formatWithCommas } from '$lib/helpers/format-number';
    import { getPrimaryCreationSpec } from '$lib/helpers/creation-specs';
    import type { IOsrsboxItemWithMeta } from '$lib/models/osrsbox-db-item';
    import Button from '$lib/components/ui/button/button.svelte';
    import { Input } from '$lib/components/ui/input';
    import { Label } from '$lib/components/ui/label';
    import OsrsboxItemUploadDialog from '$lib/components/dialogs/osrsbox-item-upload-dialog.svelte';
    import { bankItemsStore } from '$lib/stores/bank-items-store';
    import { toast } from 'svelte-sonner';

    const { data }: { data: { gameItem: IOsrsboxItemWithMeta | null; showDevControls?: boolean } } = $props();

    let loading = $state(false);
    let gameItem = $state<IOsrsboxItemWithMeta | null>(data.gameItem ?? null);
    const iconSrc = $derived(iconToDataUri(gameItem?.icon));
    const wikiUrl = $derived(() => {
        const slug = gameItem?.wiki_name ?? gameItem?.name ?? gameItem?.wikiName;
        if (!slug) return null;
        return `https://oldschool.runescape.wiki/w/${encodeURIComponent(slug.replaceAll(' ', '_'))}`;
    });
    const geSpread = $derived(() => {
        const high = normalizePrice(gameItem?.highPrice);
        const low = normalizePrice(gameItem?.lowPrice);
        if (high === null || low === null) return null;
        return high - low;
    });
    const highAlchProfit = $derived(() => {
        const alch = gameItem?.highalch;
        const price = normalizePrice(gameItem?.highPrice);
        if (alch === null || alch === undefined || price === null) return null;
        return alch - price;
    });
    const lowAlchProfit = $derived(() => {
        const alch = gameItem?.lowalch;
        const price = normalizePrice(gameItem?.lowPrice);
        if (alch === null || alch === undefined || price === null) return null;
        return alch - price;
    });
    const devControlsEnabled = Boolean(data.showDevControls);

    function formatValue(value: number | null | undefined, suffix = ' gp') {
        if (value === null || value === undefined) return '—';
        return `${formatWithCommas(Math.round(value))}${suffix}`;
    }

    function formatPrice(value: number | null | undefined) {
        const normalized = normalizePrice(value);
        if (normalized === null) return '—';
        return `${formatWithCommas(Math.round(normalized))} gp`;
    }

    function formatDelta(value: number | null | undefined) {
        if (value === null || value === undefined) return '—';
        const sign = value > 0 ? '+' : '';
        return `${sign}${formatWithCommas(Math.round(value))} gp`;
    }

    function normalizePrice(value: number | null | undefined): number | null {
        if (value === null || value === undefined) return null;
        if (!Number.isFinite(value)) return null;
        if (value <= 0) return null;
        return value;
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
    });

    const primaryCreationSpec = $derived(getPrimaryCreationSpec(gameItem));
    const renderChart = $derived(!!primaryCreationSpec?.ingredients?.length);

    const bankItems = $derived($bankItemsStore.items ?? []);
    const bankEntry = $derived.by(() => {
        const itemId = Number(gameItem?.id);
        if (!Number.isFinite(itemId)) return undefined;
        return bankItems.find((entry) => Number(entry.id) === itemId);
    });
    const isInBank = $derived(Boolean(bankEntry));
    const bankQuantity = $derived(bankEntry?.quantity ?? 0);

    let bankDialogOpen = $state(false);
    let bankDialogMode = $state<'add' | 'remove'>('add');
    let bankQuantityInput = $state('1');

    function openAddToBank() {
        bankDialogMode = 'add';
        bankQuantityInput = '1';
        bankDialogOpen = true;
    }

    function openRemoveFromBank() {
        bankDialogMode = 'remove';
        bankDialogOpen = true;
    }

    function parseQuantity(value: string | undefined) {
        const numeric = Math.floor(Number(value ?? ''));
        if (!Number.isFinite(numeric) || numeric <= 0) return 1;
        return numeric;
    }

    function confirmAddToBank() {
        const itemId = Number(gameItem?.id);
        if (!Number.isFinite(itemId) || !gameItem) return;
        const quantity = parseQuantity(bankQuantityInput);

        bankItemsStore.update((current) => {
            const items = current?.items ?? [];
            const existing = items.find((entry) => Number(entry.id) === itemId);
            const nextItems = existing
                ? items.map((entry) =>
                      Number(entry.id) === itemId
                          ? { ...entry, quantity: Math.max(1, entry.quantity + quantity) }
                          : entry,
                  )
                : [...items, { id: itemId, quantity }];
            return { ...current, items: nextItems };
        });

        toast.success(`Added ${quantity}x ${gameItem.name} to your supplies.`);
        bankDialogOpen = false;
    }

    function confirmRemoveFromBank() {
        const itemId = Number(gameItem?.id);
        if (!Number.isFinite(itemId) || !gameItem) return;
        bankItemsStore.update((current) => {
            const items = current?.items ?? [];
            const nextItems = items.filter((entry) => Number(entry.id) !== itemId);
            return { ...current, items: nextItems };
        });
        toast.success(`Removed ${gameItem.name} from your supplies.`);
        bankDialogOpen = false;
    }
</script>

<div class="content-sizing pt-6">
    <Dialog.Root bind:open={bankDialogOpen}>
        <Dialog.Content>
            {#if bankDialogMode === 'add'}
                <Dialog.Header>
                    <Dialog.Title>Add to supplies</Dialog.Title>
                    <Dialog.Description>How many would you like to add?</Dialog.Description>
                </Dialog.Header>
                <div class="space-y-2 py-4">
                    <Label for="supplies-quantity">Quantity</Label>
                    <Input
                        id="supplies-quantity"
                        type="number"
                        min="1"
                        step="1"
                        inputmode="numeric"
                        bind:value={bankQuantityInput}
                    />
                </div>
                <Dialog.Footer>
                    <Button variant="ghost" onclick={() => (bankDialogOpen = false)}>Cancel</Button>
                    <Button onclick={confirmAddToBank}>Add to supplies</Button>
                </Dialog.Footer>
            {:else}
                <Dialog.Header>
                    <Dialog.Title>Remove from supplies</Dialog.Title>
                    <Dialog.Description>
                        You have {bankQuantity} of these in your supplies. Remove this item?
                    </Dialog.Description>
                </Dialog.Header>
                <Dialog.Footer>
                    <Button variant="ghost" onclick={() => (bankDialogOpen = false)}>Cancel</Button>
                    <Button variant="critical" onclick={confirmRemoveFromBank}>Remove from supplies</Button>
                </Dialog.Footer>
            {/if}
        </Dialog.Content>
    </Dialog.Root>
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
                        <Button href={wikiUrl()} target="_blank" rel="noreferrer" variant="outline">Wiki</Button>
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
                    {#if isInBank}
                        <Button variant="outline" onclick={openRemoveFromBank}>Remove from supplies</Button>
                    {:else}
                        <Button variant="outline" onclick={openAddToBank}>Add to supplies</Button>
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
                        <Avatar.Fallback class="animate-fade-in-delayed"
                            >{gameItem.name?.substring(0, 2)}</Avatar.Fallback
                        >
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
                                    <span
                                        class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted border item-card__img-background shadow-sm"
                                    >
                                        <TrendingUp class="h-4 w-4" />
                                    </span>
                                    <span>High price</span>
                                </div>
                            </Table.Cell>
                            <Table.Cell class="text-end">{formatPrice(gameItem?.highPrice)}</Table.Cell>
                        </Table.Row>
                        <Table.Row>
                            <Table.Cell class="font-medium">
                                <div class="flex items-center gap-2">
                                    <span
                                        class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted border item-card__img-background shadow-sm"
                                    >
                                        <TrendingDown class="h-4 w-4" />
                                    </span>
                                    <span>Low price</span>
                                </div>
                            </Table.Cell>
                            <Table.Cell class="text-end">{formatPrice(gameItem?.lowPrice)}</Table.Cell>
                        </Table.Row>
                        <Table.Row>
                            <Table.Cell class="font-medium">
                                <div class="flex items-center gap-2">
                                    <span
                                        class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted border item-card__img-background shadow-sm"
                                    >
                                        <Package class="h-4 w-4" />
                                    </span>
                                    <span>Buy limit</span>
                                </div>
                            </Table.Cell>
                            <Table.Cell class="text-end"
                                >{formatValue(gameItem?.buyLimit ?? gameItem?.buy_limit, '')}</Table.Cell
                            >
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
                                    <span
                                        class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted border item-card__img-background shadow-sm"
                                    >
                                        <img
                                            src="/spell-images/high-level-alchemy.png"
                                            alt="High alchemy"
                                            class="h-4 w-4 drop-shadow"
                                        />
                                    </span>
                                    <span>High alch</span>
                                </div>
                            </Table.Cell>
                            <Table.Cell class="text-end">{formatValue(gameItem?.highalch)}</Table.Cell>
                        </Table.Row>
                        <Table.Row>
                            <Table.Cell class="font-medium">
                                <div class="flex items-center gap-2">
                                    <span
                                        class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted border item-card__img-background shadow-sm"
                                    >
                                        <img
                                            src="/spell-images/low-level-alchemy.png"
                                            alt="Low alchemy"
                                            class="h-4 w-4 drop-shadow"
                                        />
                                    </span>
                                    <span>Low alch</span>
                                </div>
                            </Table.Cell>
                            <Table.Cell class="text-end">{formatValue(gameItem?.lowalch)}</Table.Cell>
                        </Table.Row>
                        <Table.Row>
                            <Table.Cell class="font-medium">
                                <div class="flex items-center gap-2">
                                    <span
                                        class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted border item-card__img-background shadow-sm"
                                    >
                                        <img
                                            src="/other-images/pot.png"
                                            alt="General store"
                                            class="h-4 w-4 drop-shadow"
                                        />
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
                                <span
                                    class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted border item-card__img-background shadow-sm"
                                >
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
                                <span
                                    class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted border item-card__img-background shadow-sm"
                                >
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
                                <span
                                    class="inline-flex h-8 w-8 items-center justify-center rounded-full bg-muted border item-card__img-background shadow-sm"
                                >
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

<style>
    :global(.item-page__item-image) {
        filter: drop-shadow(2px 2px 5px rgba(0, 0, 0, 0.4));
    }
</style>
