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

    let loading = $state(true);
    let gameItems = $state([] as IGameItem[]);
    let totalItems = $state(0);
    let currentPage = $state(1);
    let perPageSelected = $state('12');
    const perPageValue = $derived(Number(perPageSelected) || 12);
    const perPageLabel = $derived(`${perPageValue}`);

    async function loadPage(page: number, perPageValue: number) {
        loading = true;
        try {
            const response = await fetch(`/api/game-items?page=${page}&perPage=${perPageValue}`);
            const data: { items: IGameItem[]; total: number; page: number; perPage: number } = await response.json();
            gameItems = data.items;
            totalItems = data.total;
            currentPage = data.page;
            perPageSelected = data.perPage?.toString() ?? perPageSelected;
        } catch (error) {
            console.error('Failed to fetch game items', error);
        } finally {
            loading = false;
        }
    }

    // Fetch whenever pagination inputs change.
    $effect(() => {
        void loadPage(currentPage, perPageValue);
    });

    function handlePerPageChange(value: string) {
        const next = value || '12';
        perPageSelected = next;
        currentPage = 1;
    }
</script>

<div class="items-page-container">
    <div class="flex items-center justify-between mb-4 gap-4">
        <h1 class="text-3xl font-bold">Browse items</h1>
        <div class="flex items-center gap-2 text-sm">
            <div class="min-w-[150px]">
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

    <h2 class="text-2xl font-bold mb-4">All items</h2>

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

<style>
    .items-page-container {
        max-width: calc(100vw - 4rem);
    }
</style>
