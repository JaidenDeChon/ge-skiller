<script lang="ts">
    import { onMount } from 'svelte';
    import { TriangleAlert } from 'lucide-svelte';
    import platformDetect from 'platform-detect';
    import * as Card from '$lib/components/ui/card';
    import * as Alert from '$lib/components/ui/alert';
    import * as Tabs from '$lib/components/ui/tabs';
    import ScrollArea from '../ui/scroll-area/scroll-area.svelte';
    import { Skeleton } from '$lib/components/ui/skeleton';
    import GameItemTree from '$lib/components/game-item-tree/game-item-tree.svelte';
    import GameItemTreeTable from '$lib/components/game-item-tree/game-item-tree-table.svelte';
    import type { IGameItem } from '$lib/models/game-item';

    const { ios, macos, safari } = platformDetect;

    let isIos = $state(false);
    let isSafariOnMac = $state(false);

    onMount(() => {
        isIos = ios;
        isSafariOnMac = macos && safari;
    });

    const showWebKitWarning = $derived(isIos || isSafariOnMac);

    interface GameItemTreeCardProps {
        gameItem: IGameItem | null;
        loading: boolean;
        renderChart: boolean;
        rootClass?: string;
    }

    const { gameItem, loading, renderChart, rootClass = '' }: GameItemTreeCardProps = $props();

    const gameItemTreeTabs = {
        VISUAL: 'Visual',
        TABLE: 'Table',
    } as const;

    const defaultTab = $derived(showWebKitWarning ? gameItemTreeTabs.TABLE : gameItemTreeTabs.VISUAL);
</script>

{#snippet visualView()}
    <!-- Warning for WebKit users -->
    {#if showWebKitWarning}
        <Alert.Root variant="destructive" class="mb-4">
            <TriangleAlert class="size-4" />
            <Alert.Title>Heads up!</Alert.Title>
            <Alert.Description>
                The Visual view does not render correctly in Safari on any platform, or in any browser on iOS or iPadOS.
            </Alert.Description>
        </Alert.Root>
    {/if}

    <!-- GameItemTree -->
    <div class="border rounded-md">
        <GameItemTree {gameItem} />
    </div>
{/snippet}

{#snippet tableView()}
    <GameItemTreeTable {gameItem} />
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
                {gameItem?.creationSpecs?.ingredients.length
                    ? 'Explore the ingredients that make up this item'
                    : 'This item has no ingredients.'}
            </Card.Description>
        </Card.Header>

        <!-- Body -->
        {#if renderChart}
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
                    <Tabs.Content value={gameItemTreeTabs.TABLE}>
                        {@render tableView()}
                    </Tabs.Content>
                </Card.Content>
            </Tabs.Root>

            <Card.Content class="hidden px-5 mt-5 gap-4 grid-cols-2 xl:grid">
                <div>
                    {@render visualView()}
                </div>
                <ScrollArea class="max-h-[300px] px-3 border rounded-md">
                    {@render tableView()}
                </ScrollArea>
            </Card.Content>
        {/if}
    {/if}
</Card.Root>
