import type { GameItemCreationSpecs, IOsrsboxItem, IOsrsboxItemWithMeta } from '$lib/models/osrsbox-db-item';

/**
 * Returns the first creation spec with ingredients, falling back to the first spec if none qualify.
 */
export function getPrimaryCreationSpec(
    item?: IOsrsboxItem | IOsrsboxItemWithMeta | null,
): GameItemCreationSpecs | undefined {
    if (!item?.creationSpecs) return undefined;

    const specs = Array.isArray(item.creationSpecs) ? item.creationSpecs : [item.creationSpecs];
    if (!specs.length) return undefined;

    return specs.find((spec) => spec.ingredients?.length) ?? specs[0];
}
