import type { GameItem, GameItemsBySkill } from '$lib/models/game-item';
import { buildGameItemTrees } from '$lib/helpers/game-item-cache/build-game-item-trees';

const allGameItems: GameItem[] = [];
const itemsBySkill: GameItemsBySkill[] = [];

/**
 * Populates the game item lists.
 */
export async function populateGameItemCache(): Promise<void> {
    allGameItems.length = 0;
    itemsBySkill.length = 0;

    const { finishedGameItems, finishedSkills } = await buildGameItemTrees();
    allGameItems.push(...finishedGameItems);
    itemsBySkill.push(...finishedSkills);
}

/**
 * Checks both lists for empty state. If empty, calls function to populate them.
 */
export async function ensureCacheIsPopulated(): Promise<void> {
    if (!allGameItems.length || !itemsBySkill.length) await populateGameItemCache();
}

/**
 * Retrieves a GameItem object using the given ID.
 * @param itemId {string | undefined} The ID of the item to find. Skip this to get all game items.
 * @returns The found item, or null if not found.
 */
export async function getItemById(itemId: string | undefined): Promise<GameItem | GameItem[] | null> {
    await ensureCacheIsPopulated();
    const foundItem = allGameItems.find(item => item.id === itemId);
    return foundItem ?? null;
}

/**
 * Retrieves the GameItemsBySkill object with the matching `skillName`, or all of them if none is given.
 * @param skillName The string name of the category of `GameItem`s to retrieve.
 * @returns The `GameItemsBySkill` object with `skillName` property that matches the given name. Returns the
 *     entire `itemsBySkill` array if no skill name is given. If one is given and no matching object can be
 *     found, returns `null`.
 */
export async function getItemsBySkill(skillName?: string): Promise<GameItemsBySkill[] | GameItemsBySkill | null> {
    await ensureCacheIsPopulated();
    if (skillName) return itemsBySkill.find(skill => skill.skillName === skillName) ?? null;
    else return itemsBySkill;
}

/**
 * Function for retrieving the list of all GameItems.
 * @returns The list of all GameItems.
 */
export async function getAllGameItems(): Promise<GameItem[]> {
    await ensureCacheIsPopulated();
    return allGameItems;
}
