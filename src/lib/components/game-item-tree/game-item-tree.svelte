<script lang="ts">
    import OrganizationChart from '$lib/components/organization-chart/oranization-chart.svelte';
    import ItemNode from '$lib/components/game-item-tree/item-node.svelte';
    import { getPrimaryCreationSpec } from '$lib/helpers/creation-specs';
    import type { OrgNode, TemplateMap } from '$lib/components/organization-chart/models';
    import type {
        GameItemCreationIngredient,
        GameItemCreationSpecs,
        IOsrsboxItemWithMeta,
    } from '$lib/models/osrsbox-db-item';

    const { gameItem }: { gameItem: IOsrsboxItemWithMeta | null } = $props();

    type IngredientNodeData = {
        item: IOsrsboxItemWithMeta;
        amount?: number;
        consumedDuringCreation?: boolean;
        depth: number;
    };

    const MAX_TREE_DEPTH = 12;
    const templates: TemplateMap = { default: ItemNode };

    // Runes state
    let collapsedKeys = $state<Record<string | number, boolean>>({});
    let rootNode = $state<OrgNode | null>(null);
    let lastGameItemId = $state<string | number | null>(null);

    // Rebuild the tree and reset collapse ONLY when the item id actually changes
    $effect(() => {
        const currentId = gameItem?.id ?? null;

        // If nothing changed, do nothing
        if (currentId === lastGameItemId) return;

        // Record the new id and rebuild state
        lastGameItemId = currentId;
        collapsedKeys = {};
        rootNode = buildRootNode(gameItem);
    });

    function buildRootNode(item: IOsrsboxItemWithMeta | null): OrgNode | null {
        if (!item) return null;

        const visited = new Set<string | number>([item.id ?? 'root']);
        const creationSpec = getPrimaryCreationSpec(item);
        const children = buildChildren(creationSpec?.ingredients ?? [], `${item.id}`, 1, visited);

        return {
            key: item.id ?? 'root',
            data: { item, depth: 0 } satisfies IngredientNodeData,
            children,
            collapsible: !!children.length,
            leaf: !children.length,
        };
    }

    function buildChildren(
        ingredients: GameItemCreationSpecs['ingredients'],
        parentKey: string | number,
        depth: number,
        visited: Set<string | number>,
    ): OrgNode[] {
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
    ): OrgNode {
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
                item: ingredient.item as IOsrsboxItemWithMeta,
                amount: ingredient.amount,
                consumedDuringCreation: ingredient.consumedDuringCreation,
                depth,
            } satisfies IngredientNodeData,
            children,
            leaf: !children.length,
            collapsible: !!children.length,
        };
    }

    function handleUpdateCollapsedKeys(value: Record<string | number, boolean>) {
        collapsedKeys = value;
    }
</script>

{#if rootNode}
    <OrganizationChart
        value={rootNode}
        {templates}
        collapsible={true}
        collapsedKeys={collapsedKeys}
        onUpdateCollapsedKeys={handleUpdateCollapsedKeys}
    />
{/if}