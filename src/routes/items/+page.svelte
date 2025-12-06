<script lang="ts">
    import { onMount } from 'svelte';
    import ItemCard from '$lib/components/global/item-card.svelte';
    import * as Pagination from '$lib/components/ui/pagination';
    import * as Select from '$lib/components/ui/select';
    import type { IGameItem } from '$lib/models/game-item';

    // Hacky way to remove the default pagination button at index 3 since the pagination component does not
    // intelligently scale.
    onMount(() => {
        setTimeout(() => {
            const paginator = document.querySelector('.item-page-pagination');
            const buttons = paginator?.querySelectorAll('button[data-pagination-page]');
            const buttonsArray = buttons ? Array.from(buttons) : [];
            buttonsArray[3].remove();
        }, 2000);
    });

    const perPageOptions = [12, 24, 48, 96, 192];
    const filterOptions = [
        { value: 'all', label: 'All items' },
        { value: 'members', label: 'Members only' },
        { value: 'f2p', label: 'Free to play' },
        { value: 'equipable', label: 'Equipable' },
        { value: 'stackable', label: 'Stackable' },
        { value: 'quest', label: 'Quest items' },
    ];
    const sortOrderOptions = [
        { value: 'desc', label: 'Price: high to low' },
        { value: 'asc', label: 'Price: low to high' },
    ];

    let loading = $state(true);
    let gameItems = $state([] as IGameItem[]);
    let totalItems = $state(0);
    let currentPage = $state(1);
    let perPageSelected = $state('12');
    let filterSelected = $state('all');
    let sortOrderSelected = $state('desc');
    const perPageValue = $derived(Number(perPageSelected) || 12);
    const perPageLabel = $derived(`${perPageValue}`);
    const filterLabel = $derived(filterOptions.find((option) => option.value === filterSelected)?.label ?? 'Filter items');
    const sortOrderLabel = $derived(
        sortOrderOptions.find((option) => option.value === sortOrderSelected)?.label ?? 'Price order',
    );
    let listAbort: AbortController | null = null;

    async function loadPage(page: number, perPageValue: number, filter: string, sortOrder: string) {
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

            const response = await fetch(`/api/game-items?${searchParams.toString()}`, {
                signal: controller.signal,
            });
            const data: { items: IGameItem[]; total: number; page: number; perPage: number } = await response.json();
            if (controller.signal.aborted) return;
            gameItems = data.items;
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
        void loadPage(currentPage, perPageValue, filterSelected, sortOrderSelected);
    });

    function handlePerPageChange(value: string) {
        const next = value || '12';
        perPageSelected = next;
        currentPage = 1;
    }

    function handleFilterChange(value: string) {
        filterSelected = value || 'all';
        currentPage = 1;
    }

    function handleSortOrderChange(value: string) {
        sortOrderSelected = value || 'desc';
        currentPage = 1;
    }
</script>

<div class="items-page pt-6">
    <div class="px-4 sm:px-6 lg:px-8">
        <div class="flex items-center mb-4 gap-4">
            <h1 class="text-3xl font-bold">Browse items</h1>
        </div>
    </div>

    <div class="border-b border-border mb-4">
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

            <div class="min-w-[170px] sm:w-[190px] sm:text-right">
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

    <div class="px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {#if loading}
                {#each Array.from({ length: perPageValue }, (_, i) => i) as index (index)}
                    <ItemCard {loading} />
                {/each}
            {:else}
                {#each gameItems as item}
                    <ItemCard {item} linkToItemPage />
                {/each}
            {/if}
        </div>

        <div class="mt-8 max-w-24 mx-auto">
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
    </div>
</div>
