<script lang="ts">
    import * as Table from '$lib/components/ui/table';
    import { getPrimaryCreationSpec } from '$lib/helpers/creation-specs';
    import type { GameItemCreationSpecs, IOsrsboxItemWithMeta } from '$lib/models/osrsbox-db-item';
    import { bankItemsStore } from '$lib/stores/bank-items-store';
    import { untrack } from 'svelte';
    import { resolve } from '$app/paths';

    interface GameItemCreationCostTableProps {
        gameItem: IOsrsboxItemWithMeta | null;
        creationSpec?: GameItemCreationSpecs | null;
    }

    const { gameItem, creationSpec = null }: GameItemCreationCostTableProps = $props();

    type CostRow = {
        key: string | number;
        item: IOsrsboxItemWithMeta;
        amount: number;
        unitPrice: number | null;
        totalPrice: number | null;
    };

    const rootSpec = $derived(creationSpec ?? getPrimaryCreationSpec(gameItem) ?? null);
    const costRows = $derived(buildCostRows(rootSpec));
    const bankItems = $derived($bankItemsStore.items ?? []);
    const suppliesOwned = $derived.by(() => {
        const owned = new Set<string>();
        for (const entry of bankItems) {
            const id = entry?.id;
            const quantity = Math.floor(Number(entry?.quantity ?? 0));
            if (!Number.isFinite(quantity) || quantity <= 0) continue;
            if (id === null || id === undefined) continue;
            owned.add(String(id));
        }
        return owned;
    });
    const suppliesExpandedOwned = $derived.by(() => {
        const expanded = new Set<string>();
        for (const row of costRows) {
            const itemId = row.item?.id;
            if (itemId === null || itemId === undefined) continue;
            const key = String(itemId);
            if (!suppliesOwned.has(key)) continue;
            const spec = getPrimaryCreationSpec(row.item);
            collectIngredientIds(spec, expanded);
        }
        return expanded;
    });
    // Owned map: checked = already have it, so we should exclude its cost
    let ownedMap = $state<Record<string | number, boolean>>({});

    $effect(() => {
        const prev = untrack(() => ownedMap);
        const next = costRows.map((row) => {
            const existing = prev[row.key];
            if (existing !== undefined) return [row.key, existing];
            const itemId = row.item?.id;
            const supplyKey = itemId === null || itemId === undefined ? null : String(itemId);
            const defaultOwned = supplyKey
                ? suppliesOwned.has(supplyKey) || suppliesExpandedOwned.has(supplyKey)
                : false;
            return [row.key, defaultOwned];
        });
        ownedMap = Object.fromEntries(next);
    });

    const allChecked = $derived(Object.values(ownedMap).every(Boolean));

    const selectedTotal = $derived(
        costRows.reduce((sum, row) => {
            if (ownedMap[row.key] || row.totalPrice === null) return sum;
            return sum + row.totalPrice;
        }, 0),
    );

    const geValue = $derived(normalizeNumber(gameItem?.highPrice ?? gameItem?.lowPrice));
    const storeValue = $derived(normalizeNumber(gameItem?.cost));
    const highAlchValue = $derived(normalizeNumber(gameItem?.highalch));
    const lowAlchValue = $derived(normalizeNumber(gameItem?.lowalch));

    function toggleRow(rowKey: string | number) {
        ownedMap = { ...ownedMap, [rowKey]: !ownedMap[rowKey] };
    }

    function toggleAll(value: boolean) {
        ownedMap = Object.fromEntries(costRows.map((row) => [row.key, value]));
    }

    function buildCostRows(spec: GameItemCreationSpecs | null): CostRow[] {
        if (!spec) return [];

        const map = new Map<string | number, CostRow>();
        accumulate(spec, 1, map, new Set());
        return Array.from(map.values()).sort((a, b) => (b.totalPrice ?? 0) - (a.totalPrice ?? 0));
    }

    function accumulate(
        spec: GameItemCreationSpecs,
        multiplier: number,
        map: Map<string | number, CostRow>,
        visited: Set<string | number>,
    ) {
        for (const ing of spec.ingredients ?? []) {
            if (!ing?.item) continue;
            if (ing.consumedDuringCreation === false) continue;

            const item = ing.item as IOsrsboxItemWithMeta;
            const amount = (ing.amount ?? 1) * multiplier;
            const key = item.id ?? item.name ?? crypto.randomUUID();

            const unitPrice = resolveUnitPrice(item);
            const totalPrice = unitPrice !== null ? unitPrice * amount : null;

            const existing = map.get(key);
            if (existing) {
                existing.amount += amount;
                existing.totalPrice =
                    unitPrice !== null && existing.totalPrice !== null
                        ? existing.totalPrice + totalPrice!
                        : (existing.totalPrice ?? totalPrice);
            } else {
                map.set(key, { key, item, amount, unitPrice, totalPrice });
            }

            const childId = item.id ?? null;
            if (childId !== null) {
                if (visited.has(childId)) continue;
                visited.add(childId);
            }

            const childSpec = getPrimaryCreationSpec(item);
            if (childSpec) {
                accumulate(childSpec, amount, map, visited);
            }

            if (childId !== null) visited.delete(childId);
        }
    }

    function collectIngredientIds(spec: GameItemCreationSpecs | null, sink: Set<string>, visited = new Set<string>()) {
        if (!spec) return;
        for (const ing of spec.ingredients ?? []) {
            if (!ing?.item) continue;
            if (ing.consumedDuringCreation === false) continue;

            const item = ing.item as IOsrsboxItemWithMeta;
            const itemId = item.id;
            if (itemId === null || itemId === undefined) continue;
            const key = String(itemId);
            sink.add(key);

            if (visited.has(key)) continue;
            visited.add(key);
            const childSpec = getPrimaryCreationSpec(item);
            if (childSpec) {
                collectIngredientIds(childSpec, sink, visited);
            }
            visited.delete(key);
        }
    }

    function resolveUnitPrice(item?: IOsrsboxItemWithMeta | null): number | null {
        if (!item) return null;
        const price = item.highPrice ?? item.lowPrice ?? item.cost ?? null;
        return typeof price === 'number' ? price : null;
    }

    function formatNumber(value: number | null | undefined) {
        if (value === null || value === undefined) return '—';
        return Math.round(value).toLocaleString();
    }

    function normalizeNumber(value: number | null | undefined): number | null {
        return typeof value === 'number' ? value : null;
    }

    function formatDelta(value: number | null, baseline: number | null): string {
        if (value === null || baseline === null) return '—';
        const delta = value - baseline;
        const sign = delta > 0 ? '+' : '';
        return `${sign}${Math.round(delta).toLocaleString()} gp`;
    }
</script>

{#if !costRows.length}
    <p class="text-sm text-muted-foreground p-3">No cost data available.</p>
{:else}
    <Table.Root>
        <Table.Header>
            <Table.Row>
                <Table.Head class="w-16">
                    <input
                        type="checkbox"
                        aria-label="Mark all ingredients as already owned"
                        checked={allChecked}
                        onchange={(event) => toggleAll((event.currentTarget as HTMLInputElement).checked)}
                    />
                </Table.Head>
                <Table.Head>Item (owned?)</Table.Head>
                <Table.Head class="text-end">Qty</Table.Head>
                <Table.Head class="text-end">Unit (GE)</Table.Head>
                <Table.Head class="text-end">Total</Table.Head>
            </Table.Row>
        </Table.Header>
        <Table.Body>
            {#each costRows as row (row.key)}
                <Table.Row>
                    <Table.Cell class="w-16">
                        <input type="checkbox" checked={ownedMap[row.key]} onchange={() => toggleRow(row.key)} />
                    </Table.Cell>
                    <Table.Cell class="font-medium">
                        {#if row.item.id}
                            <a class="text-primary hover:underline" href={resolve(`/items/${row.item.id}`)}>
                                {row.item.name}
                            </a>
                        {:else}
                            {row.item.name}
                        {/if}
                    </Table.Cell>
                    <Table.Cell class="text-end">{formatNumber(row.amount)}</Table.Cell>
                    <Table.Cell class="text-end">{formatNumber(row.unitPrice)}</Table.Cell>
                    <Table.Cell class="text-end">{formatNumber(ownedMap[row.key] ? 0 : row.totalPrice)}</Table.Cell>
                </Table.Row>
            {/each}
            <Table.Row>
                <Table.Cell colspan={2} class="font-semibold">
                    <div class="inline-flex items-center gap-2">
                        <span class="inline-block h-5 w-5"></span>
                    </div>
                </Table.Cell>
                <Table.Cell class="text-end font-semibold" colspan={3}>{formatNumber(selectedTotal)}</Table.Cell>
            </Table.Row>
            <Table.Row>
                <Table.Cell colspan={2} class="font-semibold">
                    <div class="inline-flex items-center gap-2">
                        <img src="/other-images/grand-exchange.png" alt="Grand Exchange" class="h-5 w-5 drop-shadow" />
                        Profit vs GE (high)
                    </div>
                </Table.Cell>
                <Table.Cell class="text-end font-semibold" colspan={3}>{formatDelta(geValue, selectedTotal)}</Table.Cell
                >
            </Table.Row>
            <Table.Row>
                <Table.Cell colspan={2} class="font-semibold">
                    <div class="inline-flex items-center gap-2">
                        <img src="/other-images/pot.png" alt="General store" class="h-5 w-5 drop-shadow" />
                        Profit vs store
                    </div>
                </Table.Cell>
                <Table.Cell class="text-end font-semibold" colspan={3}
                    >{formatDelta(storeValue, selectedTotal)}</Table.Cell
                >
            </Table.Row>
            <Table.Row>
                <Table.Cell colspan={2} class="font-semibold">
                    <div class="inline-flex items-center gap-2">
                        <img
                            src="/spell-images/high-level-alchemy.png"
                            alt="High alchemy"
                            class="h-5 w-5 drop-shadow"
                        />
                        Profit vs high alch
                    </div>
                </Table.Cell>
                <Table.Cell class="text-end font-semibold" colspan={3}
                    >{formatDelta(highAlchValue, selectedTotal)}</Table.Cell
                >
            </Table.Row>
            <Table.Row>
                <Table.Cell colspan={2} class="font-semibold">
                    <div class="inline-flex items-center gap-2">
                        <img src="/spell-images/low-level-alchemy.png" alt="Low alchemy" class="h-5 w-5 drop-shadow" />
                        Profit vs low alch
                    </div>
                </Table.Cell>
                <Table.Cell class="text-end font-semibold" colspan={3}
                    >{formatDelta(lowAlchValue, selectedTotal)}</Table.Cell
                >
            </Table.Row>
        </Table.Body>
    </Table.Root>
{/if}
