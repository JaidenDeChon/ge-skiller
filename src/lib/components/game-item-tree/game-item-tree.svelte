<script lang="ts">
    import { onMount, mount, unmount } from 'svelte';
    import * as d3 from 'd3';
    import { OrgChart } from 'd3-org-chart';
    import ItemNode from '$lib/components/game-item-tree/item-node.svelte';
    import type { IGameItem, GameItemCreationIngredient } from '$lib/models/game-item';

    const { gameItem }: { gameItem: IGameItem | null } = $props();

    let gameItemTreeElement = $state();
    const renderChart = $derived(!!gameItem?.creationSpecs?.ingredients?.length);

    onMount(() => renderGameItemTree());

    async function renderGameItemTree() {
        // Bail out if there's no item, or if the item has no ingredients.
        if (!renderChart) return;

        const chartData = transformGameItemsForOrgChart([gameItem!]);

        new OrgChart()
            .container(gameItemTreeElement as string)
            .data(chartData)
            .nodeWidth(() => 72)
            .nodeHeight(() => 72)
            .expandAll()
            .nodeContent((d) => {
                const gameItem = d.data as IGameItem;
                const target = document.createElement('div');
                const props = { gameItem };

                const componentInstance = mount(ItemNode, { target, props });
                setTimeout(() => unmount(componentInstance), 1000);

                return target.innerHTML;
            })
            .linkUpdate(function (this: SVGPathElement, d, i, arr) {
                d3.select(this).attr('stroke', 'hsl(var(--muted-foreground))');
            })
            .svgHeight(300)
            .fit()
            .render();
    }

    type OrgChartNode = {
        id: IGameItem['id'];
        parentId: IGameItem['id'] | null;
        name: IGameItem['name'];
        icon?: IGameItem['icon'];
        examine?: IGameItem['examine'];
    };

    function transformGameItemsForOrgChart(items: IGameItem[]): OrgChartNode[] {
        const result: OrgChartNode[] = [];

        function processItem(item: IGameItem, parentId: OrgChartNode['parentId'] | null = null) {
            // Add the current item as a node
            result.push({
                id: item.id,
                parentId,
                name: item.name,
                icon: item.icon ? `/item-images/${item.icon}` : undefined,
                examine: item.examine,
            });

            // If the item has ingredients, process them as children
            if (item.creationSpecs?.ingredients) {
                item.creationSpecs.ingredients.forEach((ingredient: GameItemCreationIngredient) => {
                    processItem(ingredient.item, item.id);
                });
            }
        }

        // Process all root-level items (items that are not explicitly ingredients of another item)
        items.forEach((item) => processItem(item));

        return result;
    }
</script>

<div bind:this={gameItemTreeElement}></div>

<style>
    :global(.node-button-div > div) {
        @apply bg-background text-primary border-primary !important;

        & span {
            @apply text-primary !important;
        }

        & path {
            stroke: hsl(var(--primary));
            fill: hsl(var(--primary));
        }
    }
</style>
