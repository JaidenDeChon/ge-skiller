<script lang="ts">
    import ItemNode from '$lib/components/game-item-tree/item-node.svelte';
    import type { IngredientTreeNode } from '$lib/components/game-item-tree/types';
    import { getPrimaryCreationSpec } from '$lib/helpers/creation-specs';
    import type {
        GameItemCreationIngredient,
        GameItemCreationSpecs,
        IOsrsboxItemWithMeta,
    } from '$lib/models/osrsbox-db-item';

    const { gameItem }: { gameItem: IOsrsboxItemWithMeta | null } = $props();

    const MAX_TREE_DEPTH = 12;
    const rootNode = $derived(buildRootNode(gameItem));

    function buildRootNode(item: IOsrsboxItemWithMeta | null): IngredientTreeNode | null {
        if (!item) return null;

        const visited = new Set<string | number>([item.id ?? 'root']);
        const creationSpec = getPrimaryCreationSpec(item);
        const children = buildChildren(creationSpec?.ingredients ?? [], `${item.id}`, 1, visited);

        return {
            key: item.id ?? 'root',
            data: { item, depth: 0 },
            children,
            leaf: !children.length,
        };
    }

    function buildChildren(
        ingredients: GameItemCreationSpecs['ingredients'],
        parentKey: string | number,
        depth: number,
        visited: Set<string | number>,
    ): IngredientTreeNode[] {
        if (!ingredients || depth > MAX_TREE_DEPTH) return [];

        return ingredients.map((ingredient, index) =>
            buildNodeFromIngredient(ingredient, parentKey, depth, index, visited),
        );
    }

    function buildNodeFromIngredient(
        ingredient: GameItemCreationIngredient,
        parentKey: string | number,
        depth: number,
        index: number,
        visited: Set<string | number>,
    ): IngredientTreeNode {
        const ingredientId = ingredient.item?.id ?? `unknown-${index}`;
        const key = `${parentKey}-${ingredientId}-${index}`;

        const nextVisited = new Set<string | number>(visited);

        // Stop cycles: if we've seen this id in the current path, don't recurse further.
        const alreadyVisited = nextVisited.has(ingredientId);
        if (!alreadyVisited) nextVisited.add(ingredientId);

        const creationSpec =
            !alreadyVisited && depth < MAX_TREE_DEPTH && ingredient.item
                ? getPrimaryCreationSpec(ingredient.item)
                : undefined;

        const children =
            alreadyVisited || !creationSpec
                ? []
                : buildChildren(creationSpec.ingredients ?? [], key, depth + 1, nextVisited);

        return {
            key,
            data: {
                item: ingredient.item as IOsrsboxItemWithMeta | undefined,
                amount: ingredient.amount,
                consumedDuringCreation: ingredient.consumedDuringCreation,
                depth,
            },
            children,
            leaf: !children.length,
        };
    }
</script>

{#if rootNode}
    <div class="space-y-3">
        <p class="text-sm text-muted-foreground">
            Visual ingredient tree coming soon. The computed data is ready for the new chart.
        </p>
        <ItemNode node={rootNode} />
    </div>
{:else}
    <p class="text-sm text-muted-foreground">No ingredient data available for this item.</p>
{/if}
