<script lang="ts">
    import Self from './item-card-compact.svelte';
    import Button from '../ui/button/button.svelte';
    import { ChevronDown } from 'lucide-svelte';
    import { iconToDataUri } from '$lib/helpers/icon-to-data-uri';
    import { getPrimaryCreationSpec } from '$lib/helpers/creation-specs';
    import type { IOsrsboxItemWithMeta } from '$lib/models/osrsbox-db-item';

    interface ItemCardCompactProps {
        gameItem: IOsrsboxItemWithMeta | null;
        linkToItem?: boolean;
        rootClassname?: string;
    }

    const { gameItem, linkToItem = false, rootClassname = '' }: ItemCardCompactProps = $props();

    let expanded = $state(false);

    const iconSrc = $derived(iconToDataUri(gameItem?.icon));
    const creationSpec = $derived(getPrimaryCreationSpec(gameItem));
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
                    src={iconSrc}
                    alt={gameItem.name}
                />
            </div>

            <!-- Item name -->
            {#if linkToItem}
                <a href="/items/{gameItem.id}" class="hover:underline">{gameItem.name}</a>
            {:else}
                <p>{gameItem.name}</p>
            {/if}

            {#if creationSpec?.ingredients?.length}
                <Button
                    class="size-7 p-0 rounded-full ml-auto text-muted-foreground border bg-muted group-hover:bg-background hover:text-foreground"
                    onclick={() => (expanded = !expanded)}
                >
                    <ChevronDown />
                </Button>
            {/if}
        </div>
    {/if}

    {#if expanded && creationSpec?.ingredients?.length}
        <div class="border-l ml-auto w-11/12 scale-95">
            {#each creationSpec.ingredients as ingredient}
                <Self rootClassname="mb-2 ml-2" gameItem={ingredient.item as IOsrsboxItemWithMeta} linkToItem />
            {/each}
        </div>
    {/if}
</div>
