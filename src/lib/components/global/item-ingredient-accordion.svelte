<script lang="ts">
    import Self from './item-ingredient-accordion.svelte';
    import * as Accordion from '$lib/components/ui/accordion';
    import { iconToDataUri } from '$lib/helpers/icon-to-data-uri';
    import { getPrimaryCreationSpec } from '$lib/helpers/creation-specs';
    import type { IOsrsboxItemWithMeta } from '$lib/models/osrsbox-db-item';

    interface ItemIngredientAccordionProps {
        gameItem: IOsrsboxItemWithMeta | null;
        linkToItem?: boolean;
        disabled?: boolean;
        index?: number;
    }

    const { gameItem, linkToItem = false, disabled = false, index = 0 }: ItemIngredientAccordionProps = $props();

    const iconSrc = $derived(iconToDataUri(gameItem?.icon));
    const creationSpec = $derived(getPrimaryCreationSpec(gameItem));
</script>

<Accordion.Root type="multiple" value={index === 0 ? ['root'] : []} disabled={disabled || index === 0} class="w-full">
    <Accordion.Item class="border-transparent" value="root">
        <Accordion.Trigger class="accordion-trigger">
            <div class="flex gap-3 items-center">
                <!-- Image -->
                <div class="flex justify-center items-center size-9 bg-muted rounded-full border">
                    <img
                        class="game-item-shadow transition-fade-in-delayed size-5"
                        src={iconSrc}
                        alt={gameItem?.name}
                    />
                </div>

                <!-- Item name -->
                {#if linkToItem}
                    <a href="/items/{gameItem?.id}" class="no-underline hover:underline cursor-pointer"
                        >{gameItem?.name}</a
                    >
                {:else}
                    <p>{gameItem?.name}</p>
                {/if}
            </div>
        </Accordion.Trigger>
        <Accordion.Content class="pl-6 origin-right">
            {#if creationSpec?.ingredients?.length}
                {#each creationSpec.ingredients as ingredient}
                    <Self
                        gameItem={ingredient.item as IOsrsboxItemWithMeta}
                        linkToItem
                        disabled={!getPrimaryCreationSpec(ingredient.item)?.ingredients?.length}
                        index={index + 1}
                    />
                {/each}
            {/if}
        </Accordion.Content>
    </Accordion.Item>
</Accordion.Root>

<style>
    :global(.accordion-trigger) {
        cursor: default;

        &:disabled {
            :global(svg) {
                display: none;
            }

            &:hover {
                text-decoration: none;
            }
        }
    }
</style>
