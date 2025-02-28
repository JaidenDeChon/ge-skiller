<script lang="ts">
    import Self from './item-ingredient-accordion.svelte';
    import * as Accordion from '$lib/components/ui/accordion';
    import type { GameItem } from '$lib/models/game-item';

    interface ItemIngredientAccordionProps {
        gameItem: GameItem | null;
        linkToItem?: boolean;
        disabled?: boolean;
    }

    const { gameItem, linkToItem = false, disabled = false }: ItemIngredientAccordionProps = $props();
</script>

<Accordion.Root type="multiple" {disabled} class="w-full">
    <Accordion.Item>
        <Accordion.Trigger class="accordion-trigger">
            <div class="flex gap-3 items-center">
                <!-- Image -->
                <div class="flex justify-center items-center size-9 bg-muted rounded-full border">
                    <img
                        class="game-item-shadow transition-fade-in-delayed size-5"
                        src="/item-images/{gameItem?.image}"
                        alt={gameItem?.name}
                    />
                </div>

                <!-- Item name -->
                {#if linkToItem}
                    <a href="/items/{gameItem?.id}" class="hover:underline">{gameItem?.name}</a>
                {:else}
                    <p>{gameItem?.name}</p>
                {/if}
            </div>
        </Accordion.Trigger>
        <Accordion.Content class="pl-6 origin-right">
            {#if gameItem?.creationSpecs?.ingredients.length}
                {#each gameItem.creationSpecs.ingredients as ingredient}
                    <Self
                        gameItem={ingredient.item}
                        linkToItem
                        disabled={!ingredient.item.creationSpecs?.ingredients.length}
                    />
                {/each}
            {/if}
        </Accordion.Content>
    </Accordion.Item>
</Accordion.Root>

<style>
    :global(.accordion-trigger) {
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
