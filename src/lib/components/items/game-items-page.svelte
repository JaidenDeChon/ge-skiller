<script lang="ts">
    import ItemCard from '$lib/components/global/item-card.svelte';
    import * as Pagination from '$lib/components/ui/pagination';
    import * as Select from '$lib/components/ui/select';
    import { Label } from '$lib/components/ui/label';
    import { Switch } from '$lib/components/ui/switch';
    import * as AlertDialog from '$lib/components/ui/alert-dialog';
    import { onDestroy } from 'svelte';
    import { defaultSkillLevels } from '$lib/constants/default-skill-levels';
    import type { SkillTreePage } from '$lib/constants/skill-tree-pages';
    import { getStoreRoot } from '$lib/stores/character-store.svelte';
    import {
        bankItemsStore,
        ensureSuppliesForCharacter,
        getSuppliesForCharacter,
    } from '$lib/stores/bank-items-store';
    import { filterItemsStore } from '$lib/stores/filter-items-by-player-levels';
    import { itemsPagePreferences } from '$lib/stores/items-page-preferences';
    import type { IGameItem } from '$lib/models/game-item';
    import type { CharacterProfile } from '$lib/models/player-stats';

    const perPageOptions = [12, 24, 48, 96, 192];
    const filterOptions = [
        { value: 'all', label: 'All items' },
        { value: 'members', label: 'Members only' },
        { value: 'f2p', label: 'Free to play' },
        { value: 'equipable', label: 'Equipable' },
        { value: 'stackable', label: 'Stackable' },
        { value: 'quest', label: 'Quest items' },
        { value: 'nonquest', label: 'Non-quest items' },
    ];
    const sortOptions = [
        { value: 'desc', label: 'Sort by value' },
        { value: 'profit-desc', label: 'Sort by profit' },
    ];

    function normalizeSkillLevels(skillLevels?: CharacterProfile['skillLevels'], hasCharacter = true) {
        if (!hasCharacter) return undefined;

        const levels = skillLevels ?? defaultSkillLevels;

        const normalized: Record<string, number> = {};
        Object.entries(levels).forEach(([skill, level]) => {
            const numericLevel = Math.max(0, Math.floor(Number(level)));
            if (!Number.isFinite(numericLevel)) return;
            normalized[skill.toLowerCase()] = numericLevel;
        });

        if (!Object.keys(normalized).length) return undefined;
        return normalized;
    }

    const characterStore = $derived(getStoreRoot());
    const characters = $derived(characterStore?.characters ?? []);
    const activeCharacter = $derived.by(() => {
        if (!characters.length) return undefined;

        const targetId = characterStore?.activeCharacter;
        if (targetId === undefined || targetId === null) return undefined;

        return characters.find((c) => String(c.id) === String(targetId));
    });
    const activeSkillLevels = $derived(normalizeSkillLevels(activeCharacter?.skillLevels, Boolean(activeCharacter)));
    let skillFilterChecked = $state($filterItemsStore.filterItemsByPlayerLevels);
    const skillFilterEnabled = $derived(Boolean(skillFilterChecked && activeSkillLevels));
    const skillLevelsForQuery = $derived(skillFilterEnabled ? activeSkillLevels : undefined);

    const props = $props<{ heading?: string; skill?: SkillTreePage | null }>();
    const headingProp = $derived(props.heading ?? 'Browse items');
    const skill = $derived(props.skill ?? null);
    const skillSlug = $derived(skill?.slug ?? null);
    const headingLabel = $derived(skill?.title ?? headingProp);

    let loading = $state(true);
    let fetchedItems = $state([] as IGameItem[]);
    import { hiddenStore } from '$lib/stores/hidden-store';
    const hiddenIds = $derived($hiddenStore.hidden ?? []);
    $effect(() => {
        ensureSuppliesForCharacter(activeCharacter?.id ?? null);
    });

    const bankItems = $derived(getSuppliesForCharacter($bankItemsStore, activeCharacter?.id ?? null));
    let totalItems = $state(0);
    let currentPage = $state(Number($itemsPagePreferences.page) || 1);
    let perPageSelected = $state($itemsPagePreferences.perPage || '12');
    let filterSelected = $state($itemsPagePreferences.filter || 'all');
    let sortOrderSelected = $state(
        $itemsPagePreferences.sortOrder === 'profit-desc' && $itemsPagePreferences.profitMode
            ? 'profit-desc'
            : 'desc',
    );
    let useSuppliesChecked = $state($itemsPagePreferences.useSupplies ?? false);
    let profitModeChecked = $state($itemsPagePreferences.profitMode ?? false);
    const perPageValue = $derived(Number(perPageSelected) || 12);
    const perPageLabel = $derived(`${perPageValue}`);
    const filterLabel = $derived(
        filterOptions.find((option) => option.value === filterSelected)?.label ?? 'Filter items',
    );
    const sortLabel = $derived(
        sortOptions.find((option) => option.value === sortOrderSelected)?.label ?? 'Sort items',
    );
    const profitModeEnabled = $derived(profitModeChecked);
    const profitContextLabel = $derived(profitModeEnabled && useSuppliesChecked ? 'Profit (supplies)' : 'Profit');
    const suppliesParam = $derived.by(() => {
        if (!useSuppliesChecked) return null;
        const entries: Array<[string, number]> = [];
        for (const entry of bankItems) {
            const id = entry?.id;
            const quantity = Math.floor(Number(entry?.quantity ?? 0));
            if (!Number.isFinite(quantity) || quantity <= 0) continue;
            if (id === null || id === undefined) continue;
            entries.push([String(id), quantity]);
        }
        if (!entries.length) return null;
        entries.sort((a, b) => a[0].localeCompare(b[0]));
        return JSON.stringify(Object.fromEntries(entries));
    });
    const suppliesActive = $derived(useSuppliesChecked);
    const skillToggleDisabled = $derived(useSuppliesChecked);
    let listAbort: AbortController | null = null;
    let lastSkillSlug: string | null = null;
    const isMobile = $derived(typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches);
    const cacheSkipKey = 'ge-skiller:items-cache:skip';
    const longWaitSkipKey = 'ge-skiller:items-long-wait:skip';
    let skipCacheOnce = $state(false);
    let forceLoading = $state(false);
    let longWaitDialogOpen = $state(false);
    let pendingLongWaitToggle = $state<null | 'profit' | 'supplies'>(null);
    let skipLongWaitDialog = $state(false);
    let doNotAskAgainChecked = $state(false);
    if (typeof window !== 'undefined') {
        const navEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
        const navType = navEntry?.type;
        const legacyNavType = (performance as Performance & { navigation?: { type?: number } }).navigation?.type;
        const shouldSkipForReload = navType === 'reload' || legacyNavType === 1;
        const skipFlag = sessionStorage.getItem(cacheSkipKey);
        if (skipFlag) sessionStorage.removeItem(cacheSkipKey);
        skipCacheOnce = shouldSkipForReload || Boolean(skipFlag);
        skipLongWaitDialog = localStorage.getItem(longWaitSkipKey) === '1';

        const markSkip = () => {
            try {
                sessionStorage.setItem(cacheSkipKey, '1');
            } catch {
                // ignore storage failures
            }
        };
        window.addEventListener('beforeunload', markSkip);
        onDestroy(() => {
            window.removeEventListener('beforeunload', markSkip);
        });
    }

    $effect(() => {
        if ($filterItemsStore.filterItemsByPlayerLevels !== skillFilterChecked) {
            skillFilterChecked = $filterItemsStore.filterItemsByPlayerLevels;
        }
    });

    // Keep local selection state in sync with persisted preferences (e.g., when storage events fire).
    $effect(() => {
        if ($itemsPagePreferences.filter !== filterSelected) {
            filterSelected = $itemsPagePreferences.filter || 'all';
        }
        const prefOrder = $itemsPagePreferences.sortOrder || 'desc';
        const profitPrefEnabled = $itemsPagePreferences.profitMode ?? false;
        const normalizedOrder = normalizeSortSelection(prefOrder, profitPrefEnabled);
        if (normalizedOrder !== sortOrderSelected) {
            sortOrderSelected = normalizedOrder;
        }
        if (normalizedOrder !== prefOrder) {
            itemsPagePreferences.set({ ...$itemsPagePreferences, sortOrder: normalizedOrder });
        }
        if ($itemsPagePreferences.perPage !== perPageSelected) {
            perPageSelected = $itemsPagePreferences.perPage || '12';
        }
        if ($itemsPagePreferences.useSupplies !== useSuppliesChecked) {
            useSuppliesChecked = $itemsPagePreferences.useSupplies ?? false;
        }
        if ($itemsPagePreferences.profitMode !== profitModeChecked) {
            profitModeChecked = $itemsPagePreferences.profitMode ?? false;
        }
    });

    // Reset pagination whenever a skill-specific route is entered.
    $effect(() => {
        const nextSkillSlug = skillSlug;
        if (nextSkillSlug && nextSkillSlug !== lastSkillSlug) {
            currentPage = 1;
            itemsPagePreferences.set({ ...$itemsPagePreferences, page: 1 });
        } else if (!nextSkillSlug && lastSkillSlug) {
            currentPage = Number($itemsPagePreferences.page) || 1;
        }
        lastSkillSlug = nextSkillSlug;
    });

    async function loadPage(
        page: number,
        perPageValue: number,
        filter: string,
        sortOrder: string,
        skillLevels?: Record<string, number>,
        skill?: string | null,
        supplies?: string | null,
        suppliesEnabled?: boolean,
        profitMode?: boolean,
    ) {
        if (listAbort) listAbort.abort();
        const controller = new AbortController();
        listAbort = controller;
        const shouldForceLoading = forceLoading;
        const cacheKey = buildItemsCacheKey({
            page,
            perPageValue,
            filter,
            sortOrder,
            skillLevels,
            skill,
            supplies,
            suppliesEnabled,
            profitMode,
        });
        const cached = !skipCacheOnce && !shouldForceLoading ? readItemsCache(cacheKey) : null;
        skipCacheOnce = false;
        if (shouldForceLoading) {
            fetchedItems = [];
            totalItems = 0;
        }
        if (cached) {
            fetchedItems = cached.items;
            totalItems = cached.total;
        }
        loading = !cached;
        try {
            // eslint-disable-next-line svelte/prefer-svelte-reactivity
            const searchParams = new URLSearchParams({
                page: page.toString(),
                perPage: perPageValue.toString(),
                filter,
                order: sortOrder,
            });

            if (skillLevels && Object.keys(skillLevels).length) {
                searchParams.set('skillLevels', JSON.stringify(skillLevels));
            }

            if (skill) {
                searchParams.set('skill', skill);
            }

            if (supplies) {
                searchParams.set('supplies', supplies);
            }
            if (suppliesEnabled) {
                searchParams.set('suppliesActive', '1');
            }
            if (profitMode) {
                searchParams.set('profitMode', '1');
            }

            const response = await fetch(`/api/game-items?${searchParams.toString()}`, {
                signal: controller.signal,
            });
            if (!response.ok) {
                throw new Error(`Failed to fetch items (status ${response.status})`);
            }
            const data: { items?: IGameItem[]; total?: number; page?: number; perPage?: number } =
                await response.json();
            if (!Array.isArray(data.items)) {
                throw new Error('Invalid items payload');
            }
            if (controller.signal.aborted) return;
            fetchedItems = data.items;
            totalItems = data.total ?? 0;
            writeItemsCache(cacheKey, {
                items: data.items,
                total: data.total ?? 0,
                page: data.page ?? page,
                perPage: data.perPage ?? perPageValue,
            });
        } catch (error) {
            if ((error as Error).name !== 'AbortError') {
                console.error('Failed to fetch game items', error);
            }
        } finally {
            if (listAbort === controller) {
                listAbort = null;
                if (shouldForceLoading) forceLoading = false;
                loading = false;
            }
        }
    }

    // Fetch whenever pagination inputs change.
    $effect(() => {
        void loadPage(
            currentPage,
            perPageValue,
            filterSelected,
            sortOrderSelected,
            skillLevelsForQuery,
            skillSlug,
            suppliesParam,
            suppliesActive,
            profitModeEnabled,
        );
    });

    const gameItems = $derived.by(() => {
        const hiddenSet = new Set(hiddenIds);
        return fetchedItems.filter((gi) => !hiddenSet.has(gi.id as unknown as number));
    });

    // Persist current page when it changes without creating feedback loops.
    $effect(() => {
        const page = currentPage; // track
        itemsPagePreferences.update((prefs) => ({ ...prefs, page }));
    });

    function handlePerPageChange(value: string) {
        const next = value || '12';
        perPageSelected = next;
        itemsPagePreferences.set({ ...$itemsPagePreferences, perPage: next });
        currentPage = 1;
        itemsPagePreferences.set({ ...$itemsPagePreferences, page: 1 });
    }

    function handleFilterChange(value: string) {
        filterSelected = value || 'all';
        itemsPagePreferences.set({ ...$itemsPagePreferences, filter: filterSelected });
        currentPage = 1;
        itemsPagePreferences.set({ ...$itemsPagePreferences, page: 1 });
    }

    function normalizeSortSelection(value?: string | null, profitEnabled = profitModeChecked) {
        if (value === 'profit-desc') {
            return profitEnabled ? 'profit-desc' : 'desc';
        }
        return 'desc';
    }

    function handleSortChange(value: string) {
        const normalized = normalizeSortSelection(value, profitModeEnabled);
        sortOrderSelected = normalized;
        itemsPagePreferences.update((prefs) => ({ ...prefs, sortOrder: normalized }));
        currentPage = 1;
        itemsPagePreferences.update((prefs) => ({ ...prefs, page: 1 }));
    }

    function applySkillFilterToggle(value: boolean) {
        skillFilterChecked = value;
        filterItemsStore.set({ ...$filterItemsStore, filterItemsByPlayerLevels: value });
        // Reset pagination to trigger the reload.
        currentPage = 1;
        itemsPagePreferences.set({ ...$itemsPagePreferences, page: 1 });
    }

    function applySuppliesToggle(value: boolean) {
        useSuppliesChecked = value;
        itemsPagePreferences.set({ ...$itemsPagePreferences, useSupplies: value });
        skipCacheOnce = true;
        forceLoading = true;
        if (value && activeSkillLevels && !skillFilterChecked) {
            skillFilterChecked = true;
            filterItemsStore.set({ ...$filterItemsStore, filterItemsByPlayerLevels: true });
        }
        currentPage = 1;
        itemsPagePreferences.set({ ...$itemsPagePreferences, page: 1 });
    }

    function requestLongWaitToggle(kind: 'profit' | 'supplies', value: boolean) {
        if (!value) {
            if (kind === 'profit') {
                handleProfitModeToggle(false);
            } else {
                applySuppliesToggle(false);
            }
            return;
        }

        if (skipLongWaitDialog) {
            pendingLongWaitToggle = kind;
            confirmLongWait();
            return;
        }

        pendingLongWaitToggle = kind;
        doNotAskAgainChecked = false;
        longWaitDialogOpen = true;
    }

    function confirmLongWait() {
        if (doNotAskAgainChecked && typeof window !== 'undefined') {
            try {
                localStorage.setItem(longWaitSkipKey, '1');
                skipLongWaitDialog = true;
            } catch {
                // ignore storage failures
            }
        }
        if (pendingLongWaitToggle === 'profit') {
            handleProfitModeToggle(true);
        } else if (pendingLongWaitToggle === 'supplies') {
            applySuppliesToggle(true);
        }
        pendingLongWaitToggle = null;
        longWaitDialogOpen = false;
    }

    function cancelLongWait() {
        pendingLongWaitToggle = null;
        doNotAskAgainChecked = false;
        longWaitDialogOpen = false;
    }

    function handleProfitModeToggle(value: boolean) {
        const nextSortOrder = !value && sortOrderSelected === 'profit-desc' ? 'desc' : sortOrderSelected;
        if (nextSortOrder !== sortOrderSelected) {
            sortOrderSelected = nextSortOrder;
        }
        profitModeChecked = value;
        itemsPagePreferences.update((prefs) => ({
            ...prefs,
            profitMode: value,
            sortOrder: nextSortOrder,
        }));
        skipCacheOnce = true;
        forceLoading = true;
        currentPage = 1;
        itemsPagePreferences.update((prefs) => ({ ...prefs, page: 1 }));
    }

    type ItemsCacheEntry = {
        items: IGameItem[];
        total: number;
        page: number;
        perPage: number;
        cachedAt: number;
    };

    function normalizeRecord(record?: Record<string, number> | null): Record<string, number> | null {
        if (!record) return null;
        const entries = Object.entries(record)
            .map(([key, value]) => [key, Math.floor(Number(value))] as const)
            .filter(([, value]) => Number.isFinite(value));
        if (!entries.length) return null;
        entries.sort((a, b) => a[0].localeCompare(b[0]));
        return Object.fromEntries(entries);
    }

    function buildItemsCacheKey(params: {
        page: number;
        perPageValue: number;
        filter: string;
        sortOrder: string;
        skillLevels?: Record<string, number>;
        skill?: string | null;
        supplies?: string | null;
        suppliesEnabled?: boolean;
        profitMode?: boolean;
    }) {
        if (typeof window === 'undefined') return '';
        const normalizedSkills = normalizeRecord(params.skillLevels);
        const payload = {
            page: params.page,
            perPage: params.perPageValue,
            filter: params.filter,
            sortOrder: params.sortOrder,
            skill: params.skill ?? null,
            skillLevels: normalizedSkills,
            supplies: params.supplies ?? null,
            useSupplies: params.suppliesEnabled ?? useSuppliesChecked,
            profitMode: params.profitMode ?? profitModeChecked,
        };
        return `ge-skiller:items-cache:${JSON.stringify(payload)}`;
    }

    function readItemsCache(cacheKey: string): ItemsCacheEntry | null {
        if (!cacheKey || typeof window === 'undefined') return null;
        try {
            const raw = sessionStorage.getItem(cacheKey);
            if (!raw) return null;
            const parsed = JSON.parse(raw) as ItemsCacheEntry;
            if (!parsed || !Array.isArray(parsed.items)) return null;
            return parsed;
        } catch (error) {
            console.warn('Failed to read items cache', error);
            return null;
        }
    }

    function writeItemsCache(
        cacheKey: string,
        data: { items: IGameItem[]; total: number; page: number; perPage: number },
    ) {
        if (!cacheKey || typeof window === 'undefined') return;
        try {
            const entry: ItemsCacheEntry = { ...data, cachedAt: Date.now() };
            sessionStorage.setItem(cacheKey, JSON.stringify(entry));
        } catch (error) {
            console.warn('Failed to write items cache', error);
        }
    }
</script>

<div class="items-page pt-6 pb-8">
    <div class="content-sizing">
        <div class="flex items-center mb-4 gap-3">
            {#if skill}
                <img src={skill.icon} alt={`${headingLabel} icon`} class="h-8 w-8" />
            {/if}
            <h1 class="text-3xl font-bold">{headingLabel}</h1>
        </div>
    </div>

    <div class="border-b border-border">
        <div class="content-sizing">
            <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm py-2">
                <div class="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                    <div class="min-w-[180px] sm:w-[210px]">
                        <Select.Root type="single" bind:value={filterSelected} onValueChange={handleFilterChange}>
                            <Select.Trigger>{filterLabel}</Select.Trigger>
                            <Select.Content>
                                <Select.Group>
                                    {#each filterOptions as option (option.value)}
                                        <Select.Item value={option.value}>{option.label}</Select.Item>
                                    {/each}
                                </Select.Group>
                            </Select.Content>
                        </Select.Root>
                    </div>
                    <div class="min-w-[180px] sm:w-[210px]">
                        <Select.Root type="single" bind:value={sortOrderSelected} onValueChange={handleSortChange}>
                            <Select.Trigger>{sortLabel}</Select.Trigger>
                            <Select.Content>
                                <Select.Group>
                                    {#each sortOptions as option (option.value)}
                                        <Select.Item
                                            value={option.value}
                                            disabled={option.value === 'profit-desc' && !profitModeEnabled}
                                        >
                                            {option.label}
                                        </Select.Item>
                                    {/each}
                                </Select.Group>
                            </Select.Content>
                        </Select.Root>
                    </div>
                </div>

                <div
                    class="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end sm:text-right"
                >
                    <div class="min-w-[170px] sm:w-[190px]">
                        <Select.Root type="single" bind:value={perPageSelected} onValueChange={handlePerPageChange}>
                            <Select.Trigger>{perPageLabel} items per page</Select.Trigger>
                            <Select.Content>
                                <Select.Group>
                                    {#each perPageOptions as option (option)}
                                        <Select.Item value={option.toString()}>{option}</Select.Item>
                                    {/each}
                                </Select.Group>
                            </Select.Content>
                        </Select.Root>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="border-b border-border mb-4">
        <div class="content-sizing">
            <div class="flex w-full flex-col items-start gap-2 py-2">
                <div class="flex items-center gap-2">
                    <Switch
                        id="skill-filter-switch"
                        checked={skillFilterChecked}
                        onCheckedChange={applySkillFilterToggle}
                        aria-label="Filter by my skill levels"
                        disabled={skillToggleDisabled}
                    />
                    <Label
                        for="skill-filter-switch"
                        class={`cursor-pointer select-none text-sm ${skillToggleDisabled ? 'opacity-60' : ''}`}
                    >
                        Filter by my skill levels
                    </Label>
                </div>
                <p class="text-xs text-muted-foreground">Longer wait times:</p>
                <div class="flex items-center gap-2">
                    <Switch
                        id="supplies-profit-switch"
                        checked={useSuppliesChecked}
                        onCheckedChange={(value) => requestLongWaitToggle('supplies', value)}
                        aria-label="Only show what I have supplies for"
                    />
                    <Label for="supplies-profit-switch" class="cursor-pointer select-none text-sm">
                        Only show what I have supplies for
                    </Label>
                </div>
                <div class="flex items-center gap-2">
                    <Switch
                        id="profit-mode-switch"
                        checked={profitModeEnabled}
                        onCheckedChange={(value) => requestLongWaitToggle('profit', value)}
                        aria-label="Enable profit mode"
                    />
                    <Label for="profit-mode-switch" class="cursor-pointer select-none text-sm">
                        Show profit <span class="text-xs text-muted-foreground">(enables profit sorting)</span>
                    </Label>
                </div>
            </div>
        </div>
    </div>

    <AlertDialog.Root bind:open={longWaitDialogOpen}>
        <AlertDialog.Content>
            <AlertDialog.Header>
                <AlertDialog.Title>Longer wait time</AlertDialog.Title>
                <AlertDialog.Description>
                    This filter can take 20–60 seconds to process. Do you want to continue?
                </AlertDialog.Description>
            </AlertDialog.Header>
            <AlertDialog.Footer class="flex flex-wrap items-center justify-between gap-3">
                <div class="flex items-center gap-2 mr-auto">
                    <input
                        id="long-wait-skip"
                        type="checkbox"
                        class="h-4 w-4 rounded border border-input"
                        bind:checked={doNotAskAgainChecked}
                    />
                    <Label for="long-wait-skip" class="cursor-pointer select-none text-sm">
                        Do not ask again
                    </Label>
                </div>
                <AlertDialog.Cancel onclick={cancelLongWait}>Cancel</AlertDialog.Cancel>
                <AlertDialog.Action onclick={confirmLongWait}>Yes, continue</AlertDialog.Action>
            </AlertDialog.Footer>
        </AlertDialog.Content>
    </AlertDialog.Root>

    <div class="content-sizing">
        {#snippet pagination()}
            <div class="max-w-24 mx-auto">
                <Pagination.Root
                    class="item-page-pagination"
                    bind:page={currentPage}
                    count={totalItems}
                    perPage={perPageValue}
                >
                    {#snippet children({ pages, currentPage })}
                        <Pagination.Content>
                            <Pagination.Item>
                                <Pagination.PrevButton />
                            </Pagination.Item>
                            {#each isMobile ? pages.filter((p) => {
                                      const last = pages[pages.length - 1];
                                      const lastVal = last && last.type !== 'ellipsis' ? last.value : undefined;
                                      if (p.type === 'ellipsis') return false;
                                      const val = p.value;
                                      return val === 1 || val === currentPage || (lastVal !== undefined && val === lastVal) || val === currentPage - 1 || val === currentPage + 1;
                                  }) : pages as page (page.key)}
                                {#if page.type === 'ellipsis'}
                                    <Pagination.Item>
                                        <Pagination.Ellipsis />
                                    </Pagination.Item>
                                {:else}
                                    <Pagination.Item>
                                        <Pagination.Link {page} isActive={currentPage === page.value}>
                                            {page.value}
                                        </Pagination.Link>
                                    </Pagination.Item>
                                {/if}
                            {/each}
                            <Pagination.Item>
                                <Pagination.NextButton />
                            </Pagination.Item>
                        </Pagination.Content>
                    {/snippet}
                </Pagination.Root>
            </div>
        {/snippet}

        <div class="mb-6">
            {@render pagination()}
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {#if loading}
                {#each Array.from({ length: perPageValue }, (_, i) => i) as index (index)}
                    <ItemCard {loading} />
                {/each}
            {:else}
                {#each gameItems as item (item.id)}
                    <ItemCard
                        {item}
                        linkToItemPage
                        allowHide={true}
                        allowFavorite={true}
                        showProfit={profitModeEnabled}
                        profitContext={profitContextLabel}
                    />
                {/each}
            {/if}
        </div>

        <div class="mt-8">
            {@render pagination()}
        </div>
    </div>
</div>
