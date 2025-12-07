<script lang="ts">
    import ItemCard from '$lib/components/global/item-card.svelte';
    import * as Pagination from '$lib/components/ui/pagination';
    import * as Select from '$lib/components/ui/select';
    import { Label } from '$lib/components/ui/label';
    import { Switch } from '$lib/components/ui/switch';
    import { defaultSkillLevels } from '$lib/constants/default-skill-levels';
    import type { SkillTreePage } from '$lib/constants/skill-tree-pages';
    import { getStoreRoot } from '$lib/stores/character-store.svelte';
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
    const sortOrderOptions = [
        { value: 'desc', label: 'Price: high to low' },
        { value: 'asc', label: 'Price: low to high' },
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
    const skillToggleLabel = $derived(
        activeCharacter ? `Filter by my skill levels (${activeCharacter.name})` : 'Filter by my skill levels',
    );

    const props = $props<{ heading?: string; skill?: SkillTreePage | null }>();
    const headingProp = $derived(props.heading ?? 'Browse items');
    const skill = $derived(props.skill ?? null);
    const skillSlug = $derived(skill?.slug ?? null);
    const headingLabel = $derived(skill?.title ?? headingProp);

    let loading = $state(true);
    let fetchedItems = $state([] as IGameItem[]);
    import { hiddenStore } from '$lib/stores/hidden-store';
    const hiddenIds = $derived($hiddenStore.hidden ?? []);
    let totalItems = $state(0);
    let currentPage = $state(Number($itemsPagePreferences.page) || 1);
    let perPageSelected = $state($itemsPagePreferences.perPage || '12');
    let filterSelected = $state($itemsPagePreferences.filter || 'all');
    let sortOrderSelected = $state($itemsPagePreferences.sortOrder || 'desc');
    const perPageValue = $derived(Number(perPageSelected) || 12);
    const perPageLabel = $derived(`${perPageValue}`);
    const filterLabel = $derived(filterOptions.find((option) => option.value === filterSelected)?.label ?? 'Filter items');
    const sortOrderLabel = $derived(
        sortOrderOptions.find((option) => option.value === sortOrderSelected)?.label ?? 'Price order',
    );
    let listAbort: AbortController | null = null;
    let lastSkillSlug: string | null = null;

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
        if ($itemsPagePreferences.sortOrder !== sortOrderSelected) {
            sortOrderSelected = $itemsPagePreferences.sortOrder || 'desc';
        }
        if ($itemsPagePreferences.perPage !== perPageSelected) {
            perPageSelected = $itemsPagePreferences.perPage || '12';
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
    ) {
        if (listAbort) listAbort.abort();
        const controller = new AbortController();
        listAbort = controller;
        loading = true;
        try {
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

            const response = await fetch(`/api/game-items?${searchParams.toString()}`, {
                signal: controller.signal,
            });
            const data: { items: IGameItem[]; total: number; page: number; perPage: number } = await response.json();
            if (controller.signal.aborted) return;
            fetchedItems = data.items;
            totalItems = data.total;
        } catch (error) {
            if ((error as Error).name !== 'AbortError') {
                console.error('Failed to fetch game items', error);
            }
        } finally {
            if (listAbort === controller) listAbort = null;
            loading = false;
        }
    }

    // Fetch whenever pagination inputs change.
    $effect(() => {
        void loadPage(currentPage, perPageValue, filterSelected, sortOrderSelected, skillLevelsForQuery, skillSlug);
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

    function handleSortOrderChange(value: string) {
        sortOrderSelected = value || 'desc';
        itemsPagePreferences.set({ ...$itemsPagePreferences, sortOrder: sortOrderSelected });
        currentPage = 1;
        itemsPagePreferences.set({ ...$itemsPagePreferences, page: 1 });
    }

    function handleSkillFilterToggle(value: boolean) {
        filterItemsStore.set({ ...$filterItemsStore, filterItemsByPlayerLevels: value });
        // Reset pagination to trigger the reload.
        currentPage = 1;
        itemsPagePreferences.set({ ...$itemsPagePreferences, page: 1 });
    }

</script>

<div class="items-page pt-6 pb-8">
    <div class="px-4 sm:px-6 lg:px-8">
        <div class="flex items-center mb-4 gap-3">
            {#if skill}
                <img src={skill.icon} alt={`${headingLabel} icon`} class="h-8 w-8" />
            {/if}
            <h1 class="text-3xl font-bold">{headingLabel}</h1>
        </div>
    </div>

    <div class="border-b border-border">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm px-4 sm:px-6 lg:px-8 py-2">
            <div class="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <div class="min-w-[180px] sm:w-[210px]">
                    <Select.Root type="single" bind:value={filterSelected} onValueChange={handleFilterChange}>
                        <Select.Trigger>{filterLabel}</Select.Trigger>
                        <Select.Content>
                            <Select.Group>
                                {#each filterOptions as option}
                                    <Select.Item value={option.value}>{option.label}</Select.Item>
                                {/each}
                            </Select.Group>
                        </Select.Content>
                    </Select.Root>
                </div>

                <div class="min-w-[180px] sm:w-[210px]">
                    <Select.Root type="single" bind:value={sortOrderSelected} onValueChange={handleSortOrderChange}>
                        <Select.Trigger>{sortOrderLabel}</Select.Trigger>
                        <Select.Content>
                            <Select.Group>
                                {#each sortOrderOptions as option}
                                    <Select.Item value={option.value}>{option.label}</Select.Item>
                                {/each}
                            </Select.Group>
                        </Select.Content>
                    </Select.Root>
                </div>
            </div>

            <div class="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center sm:justify-end sm:text-right">
                <div class="min-w-[170px] sm:w-[190px]">
                    <Select.Root type="single" bind:value={perPageSelected} onValueChange={handlePerPageChange}>
                        <Select.Trigger>{perPageLabel} items per page</Select.Trigger>
                        <Select.Content>
                            <Select.Group>
                                {#each perPageOptions as option}
                                    <Select.Item value={option.toString()}>{option}</Select.Item>
                                {/each}
                            </Select.Group>
                        </Select.Content>
                    </Select.Root>
                </div>
            </div>
        </div>
    </div>

    <div class="border-b border-border mb-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm px-4 sm:px-6 lg:px-8 py-2">
            <div class="flex w-full flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-start">
                <div class="flex items-center gap-2">
                    <Switch
                        id="skill-filter-switch"
                        bind:checked={skillFilterChecked}
                        onCheckedChange={handleSkillFilterToggle}
                        aria-label={skillToggleLabel}
                    />
                    <Label for="skill-filter-switch" class="cursor-pointer select-none text-sm">
                        {skillToggleLabel}
                    </Label>
                </div>
                
            </div>
        </div>
    </div>

    <div class="px-4 sm:px-6 lg:px-8">
        {#snippet pagination()}
            <div class="max-w-24 mx-auto">
                <Pagination.Root class="item-page-pagination" bind:page={currentPage} count={totalItems} perPage={perPageValue}>
                    {#snippet children({ pages, currentPage })}
                        <Pagination.Content>
                            <Pagination.Item>
                                <Pagination.PrevButton />
                            </Pagination.Item>
                            {#each pages as page (page.key)}
                                {#if page.type === "ellipsis"}
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
                {#each gameItems as item}
                    <ItemCard {item} linkToItemPage allowHide={true} allowFavorite={true} />
                {/each}
            {/if}
        </div>

        <div class="mt-8">
            {@render pagination()}
        </div>
    </div>
</div>
