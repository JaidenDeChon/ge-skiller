<script lang="ts">
    import ItemCard from '$lib/components/global/item-card.svelte';
    import * as Pagination from '$lib/components/ui/pagination';
    import * as Select from '$lib/components/ui/select';
    import type { IGameItem } from '$lib/models/game-item';

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

    function handlePerPageChange(event: CustomEvent<string> | Event) {
        const detailValue = (event as CustomEvent<string>).detail;
        const targetValue = (event.target as HTMLInputElement | null)?.value;
        const value = detailValue ?? targetValue ?? '12';
        perPageSelected = value;
        currentPage = 1;
    }
</script>

<div class="flex items-center justify-between mb-4 gap-4">
    <h1 class="text-3xl font-bold">Browse items</h1>
    <div class="flex items-center gap-2 text-sm">
        <Select.Root type="single" bind:value={perPageSelected} on:change={handlePerPageChange} class="min-w-[150px]">
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

<h2 class="text-2xl font-bold mb-4">All items</h2>

<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
    {#if loading}
        {#each { length: perPageValue }}
            <ItemCard {loading} />
        {/each}
    {:else}
        {#each gameItems as item}
            <ItemCard {item} linkToItemPage />
        {/each}
    {/if}
</div>

<div class="mt-8">
    <Pagination.Root bind:page={currentPage} count={totalItems} perPage={perPageValue}>
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
