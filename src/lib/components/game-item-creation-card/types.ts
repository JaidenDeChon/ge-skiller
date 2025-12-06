import type { IOsrsboxItemWithMeta } from '$lib/models/osrsbox-db-item';

export type IngredientNodeData = {
    item?: IOsrsboxItemWithMeta;
    amount?: number;
    consumedDuringCreation?: boolean;
    depth?: number;
};

export type IngredientTreeNode = {
    key: string | number;
    data: IngredientNodeData;
    children: IngredientTreeNode[];
    leaf: boolean;
};
