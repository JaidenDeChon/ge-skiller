<script lang="ts">
    import * as Card from '$lib/components/ui/card';
    import * as Tabs from '$lib/components/ui/tabs';
    import ScrollArea from '../ui/scroll-area/scroll-area.svelte';
    import { Skeleton } from '$lib/components/ui/skeleton';
    import GameItemTree from '$lib/components/game-item-tree/game-item-tree.svelte';
    import GameItemTreeTable from '$lib/components/game-item-tree/game-item-tree-table.svelte';
    import { getPrimaryCreationSpec } from '$lib/helpers/creation-specs';
    import type { IOsrsboxItemWithMeta } from '$lib/models/osrsbox-db-item';

    interface GameItemTreeCardProps {
        gameItem: IOsrsboxItemWithMeta | null;
        loading: boolean;
        renderChart: boolean;
        rootClass?: string;
    }

    const { gameItem, loading, renderChart, rootClass = '' }: GameItemTreeCardProps = $props();
    const creationSpec = $derived(getPrimaryCreationSpec(gameItem));

    const gameItemTreeTabs = {
        VISUAL: 'Visual',
        TABLE: 'Table',
    } as const;

    const hasIngredients = $derived(renderChart && !!creationSpec?.ingredients?.length);
    const defaultTab = gameItemTreeTabs.VISUAL;
</script>

{#snippet visualView()}
    <div class="border rounded-md bg-muted/40 p-3">
        <GameItemTree {gameItem} />
    </div>
{/snippet}

{#snippet tableView()}
    <ScrollArea class="h-[18.75rem] px-3 border rounded-md">
        <GameItemTreeTable {gameItem} />
    </ScrollArea>
{/snippet}

<Card.Root class={rootClass}>
    {#if loading}
        <Skeleton class="w-48 max-w-full h-5 ml-5 mt-8 mb-2" />
        <Skeleton class="w-60 max-w-full h-3 ml-5 mt-4 mb-2" />
        <Skeleton class="mx-5 mt-5 h-80" />
    {:else}
        <!-- Header -->
        <Card.Header>
            <Card.Title class="text-xl">Item ingredients tree</Card.Title>
            <Card.Description>
                {hasIngredients ? 'Explore the ingredients that make up this item' : 'This item has no ingredients.'}
            </Card.Description>
        </Card.Header>

        <!-- Body -->
        {#if hasIngredients}
            <Tabs.Root value={defaultTab} class="w-full my-5 px-5 xl:hidden">
                <!-- Tabs -->
                <Tabs.List class="w-full grid grid-cols-2">
                    <Tabs.Trigger value={gameItemTreeTabs.VISUAL}>Visual</Tabs.Trigger>
                    <Tabs.Trigger value={gameItemTreeTabs.TABLE}>Table</Tabs.Trigger>
                </Tabs.List>

                <!-- Body content -->
                <Card.Content class="p-0 mt-5">
                    <!-- "Visual" view -->
                    <Tabs.Content value={gameItemTreeTabs.VISUAL}>
                        {@render visualView()}
                    </Tabs.Content>

                    <!-- "Table" view -->
                    <Tabs.Content class="h-[18.75rem]" value={gameItemTreeTabs.TABLE}>
                        {@render tableView()}
                    </Tabs.Content>
                </Card.Content>
            </Tabs.Root>

            <Card.Content class="hidden px-5 mt-5 gap-4 grid-cols-2 xl:grid">
                <div>
                    {@render visualView()}
                </div>
                <div>
                    {@render tableView()}
                </div>
            </Card.Content>
        {:else}
            <Card.Content class="px-5 pb-6 text-sm text-muted-foreground">
                <p>We don't have ingredient data for this item yet.</p>
            </Card.Content>
        {/if}
    {/if}
</Card.Root>
