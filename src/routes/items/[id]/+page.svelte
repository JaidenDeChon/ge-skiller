<script lang="ts">
    import { mount, unmount } from 'svelte';
    import { toast } from 'svelte-sonner';
    import { OrgChart } from 'd3-org-chart';
    import { page } from '$app/state';
    import { Skeleton } from '$lib/components/ui/skeleton';
    import * as Avatar from '$lib/components/ui/avatar';
    import * as Breadcrumb from '$lib/components/ui/breadcrumb';
    import * as Card from '$lib/components/ui/card';
    import IconBadge from '$lib/components/global/icon-badge.svelte';
    import FavoriteButton from '$lib/components/global/favorite-button.svelte';
    import ItemNode from '$lib/components/game-item-tree/item-node.svelte';
    import type { GameItem } from '$lib/models/game-item';

    const slug = $derived(page.params.id);
    let loading = $state(true);
    let gameItem = $state<GameItem | null>(null);

    // Load the game item data once it's available.
    $effect(() => {
        if (!slug) return;

        fetch(`/api/game-items/?id=${slug}`)
            .then(async (response) => {
                gameItem = await response.json();
                loading = false;
                renderGameItemTree();
            })
            .catch((error) => {
                console.error(error);
                toast.error('Failed to fetch item data.', {
                    description: 'The item could not be found.',
                    action: {
                        label: 'Go back',
                        onClick: () => window.history.back(),
                    },
                });
            });
    });

    let gameItemTreeElement = $state();
    let chartInstance = $state<undefined | OrgChart<unknown>>(undefined);

    function renderGameItemTree() {
        if (!gameItem) return;

        const chartData = transformGameItemsForOrgChart([gameItem]);

        chartInstance = new OrgChart()
            .container(gameItemTreeElement as string)
            .data(chartData)
            .nodeWidth(() => 72)
            .nodeHeight(() => 72)
            .expandAll()
            .buttonContent(({ node }) => {
                return `
                    <button class="h-7 w-7 mx-auto mt-2 bg-background border">
                        <span class="text-lg">${node.children ? '-' : '+'}</span>
                    </button>`;
            })
            .nodeContent((d) => {
                const gameItem = d.data as GameItem;
                const target = document.createElement('div');
                const props = { gameItem };

                const componentInstance = mount(ItemNode, { target, props });
                setTimeout(() => unmount(componentInstance), 1000);

                return target.innerHTML;
            })
            .onExpandOrCollapse(() => fitChartToContainer)
            .svgHeight(300)
            .fit()
            .render();
    }

    function fitChartToContainer() {
        setTimeout(() => chartInstance?.fit(), 2000);
    }

    type OrgChartNode = {
        id: string;
        parentId: string | null;
        name: string;
        image?: string;
        examineText?: string;
    };

    function transformGameItemsForOrgChart(items: GameItem[]): OrgChartNode[] {
        const result: OrgChartNode[] = [];

        function processItem(item: GameItem, parentId: string | null = null) {
            // Add the current item as a node
            result.push({
                id: item.id,
                parentId,
                name: item.name,
                image: item.image ? `/item-images/${item.image}` : undefined,
                examineText: item.examineText,
            });

            // If the item has ingredients, process them as children
            if (item.creationSpecs?.ingredients) {
                item.creationSpecs.ingredients.forEach((ingredient) => {
                    processItem(ingredient.item, item.id);
                });
            }
        }

        // Process all root-level items (items that are not explicitly ingredients of another item)
        items.forEach((item) => processItem(item));

        return result;
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
            <!-- Breadcrumbs and favorite -->
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

            <!-- Favorite button -->
            <FavoriteButton {gameItem} />
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
                <Avatar.Image
                    src="/item-images/{gameItem.image}"
                    alt={gameItem.name}
                    class="item-page__item-image object-contain animate-fade-in"
                />
                <Avatar.Fallback class="animate-fade-in-delayed">{gameItem.name.substring(0, 2)}</Avatar.Fallback>
            </Avatar.Root>
        {/if}

        <!-- Name and description -->
        <div class="flex flex-col gap-1 justify-center">
            {#if loading || !gameItem}
                <Skeleton class="h-7 w-52 mb-2" />
                <Skeleton class="h-3 w-36" />
            {:else}
                <h1 class="text-2xl font-bold animate-fade-in">{gameItem.name}</h1>
                <p class="text-muted-foreground text-sm animate-fade-in">
                    {gameItem.examineText}
                </p>
            {/if}
        </div>
    </div>
</header>

<!-- Skill tags -->
<IconBadge text="Crafting">
    {#snippet icon()}
        <Avatar.Root class="h-4 w-4">
            <Avatar.Image src="/skill-images/crafting.png"></Avatar.Image>
        </Avatar.Root>
    {/snippet}
</IconBadge>

<!-- Item tree -->
<Card.Root class="mt-4">
    <Card.Header>
        <Card.Title class="text-xl">Item ingredients tree</Card.Title>
        <Card.Description>Explore the ingredients that make up this item</Card.Description>
    </Card.Header>
    <Card.Content>
        <div bind:this={gameItemTreeElement}></div>
    </Card.Content>
</Card.Root>

<style>
    :global(.item-page__item-image) {
        filter: drop-shadow(2px 2px 5px rgba(0, 0, 0, 0.4));
    }
</style>
