<script lang="ts">
    import Self from './item-card-compact.svelte';
    import Button from '../ui/button/button.svelte';
    import { ChevronDown } from 'lucide-svelte';
    import type { GameItem } from '$lib/models/game-item';

    interface ItemCardCompactProps {
        gameItem: GameItem | null;
        linkToItem?: boolean;
        rootClassname?: string;
    }

    const { gameItem, linkToItem = false, rootClassname = '' }: ItemCardCompactProps = $props();

    let expanded = $state(false);
</script>

<div class="flex flex-col">
    {#if gameItem}
        <div
            class="group py-2 px-3 flex gap-3 items-center rounded-md hover:bg-muted transition-colors h-fit {rootClassname}"
        >
            <!-- Image -->
            <div class="flex justify-center items-center size-9 bg-muted rounded-full border group-hover:bg-background">
                <img
                    class="game-item-shadow transition-fade-in-delayed size-5"
                    src="/item-images/{gameItem.image}"
                    alt={gameItem.name}
                />
            </div>

            <!-- Item name -->
            {#if linkToItem}
                <a href="/items/{gameItem.id}" class="hover:underline">{gameItem.name}</a>
            {:else}
                <p class="text-sm">{gameItem.name}</p>
            {/if}

            {#if gameItem.creationSpecs?.ingredients.length}
                <Button
                    class="size-7 p-0 rounded-full ml-auto text-muted-foreground border bg-muted group-hover:bg-background hover:text-foreground"
                    onclick={() => (expanded = !expanded)}
                >
                    <ChevronDown />
                </Button>
            {/if}
        </div>
    {/if}

    {#if expanded && gameItem?.creationSpecs?.ingredients.length}
        <div class="border-l ml-auto w-11/12 scale-95">
            {#each gameItem.creationSpecs.ingredients as ingredient}
                <Self rootClassname="mb-2 ml-2" gameItem={ingredient.item} linkToItem />
            {/each}
        </div>
    {/if}
</div>
