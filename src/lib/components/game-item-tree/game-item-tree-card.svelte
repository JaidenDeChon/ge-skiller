<script lang="ts">
    import * as Card from '$lib/components/ui/card';
    import { Skeleton } from '$lib/components/ui/skeleton';
    import GameItemTree from '$lib/components/game-item-tree/game-item-tree.svelte';
    import GameItemTreeTable from '$lib/components/game-item-tree/game-item-tree-table.svelte';
    import ItemIngredientAccordion from '$lib/components/global/item-ingredient-accordion.svelte';
    import * as Tabs from '$lib/components/ui/tabs';
    import { getPrimaryCreationSpec } from '$lib/helpers/creation-specs';
    import type { GameItemCreationSpecs, IOsrsboxItemWithMeta } from '$lib/models/osrsbox-db-item';

    interface GameItemTreeCardProps {
        gameItem: IOsrsboxItemWithMeta | null;
        loading: boolean;
        renderChart: boolean;
        rootClass?: string;
    }

    const { gameItem, loading, renderChart, rootClass = '' }: GameItemTreeCardProps = $props();
    const creationSpec = $derived(getPrimaryCreationSpec(gameItem));
    const creationSpecs = $derived((gameItem?.creationSpecs ?? []) as GameItemCreationSpecs[]);
    const specOptions = $derived(
        creationSpecs.map((spec, index) => ({
            id: `spec-${index}`,
            label: creationSpecs.length === 1 ? 'Spec' : `Spec ${index + 1}`,
            spec,
        })),
    );
    let selectedSpecId = $state(specOptions[0]?.id ?? '');
    const selectedSpec = $derived(
        specOptions.find((opt) => opt.id === selectedSpecId)?.spec ?? creationSpec ?? null,
    );

    $effect(() => {
        if (!specOptions.find((opt) => opt.id === selectedSpecId)) {
            selectedSpecId = specOptions[0]?.id ?? '';
        }
    });

    const hasIngredients = $derived(renderChart && !!selectedSpec?.ingredients?.length);
</script>

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
            <Tabs.Root value={selectedSpecId} onValueChange={(val) => (selectedSpecId = val)}>
                {#if specOptions.length > 1}
                    <div class="px-5 mt-4">
                        <Tabs.List class="flex gap-2 flex-wrap w-fit">
                            {#each specOptions as option}
                                <Tabs.Trigger value={option.id}>{option.label}</Tabs.Trigger>
                            {/each}
                        </Tabs.List>
                    </div>
                {/if}

                {#each specOptions as option}
                    <Tabs.Content value={option.id} class="px-5">
                        <div class="grid gap-4 xl:grid-cols-2">
                            <div class="border rounded-md bg-muted/40 p-3">
                                <GameItemTree gameItem={gameItem} creationSpec={option.spec} />
                            </div>
                            <div class="border rounded-lg bg-card shadow-sm overflow-hidden">
                                <div class="space-y-4 max-h-[28rem] overflow-auto">
                                    <GameItemTreeTable gameItem={gameItem} creationSpec={option.spec} />
                                </div>
                            </div>
                        </div>
                    </Tabs.Content>
                {/each}
            </Tabs.Root>
        {:else}
            <Card.Content class="px-5 pb-6 text-sm text-muted-foreground">
                <p>We don't have ingredient data for this item yet.</p>
            </Card.Content>
        {/if}
    {/if}
</Card.Root>
