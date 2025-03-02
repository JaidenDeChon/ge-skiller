import type { MapData } from './grand-exchange-protocols';

/**
 * Represents the amount of experience in a given skill awarded for creating an item.
 * @property skillName - The name of the skill in which experience is awarded.
 * @property experienceAmount - The amount of experience awarded.
 */
export type GameItemCreationExperienceGranted = {
    skillName: string;
    experienceAmount: number;
}

/**
 * Represents a skill level requirement for creating an item.
 * @property skillName - The name of the required skill.
 * @property skillLevel - The level of the required skill.
 */
export type SkillLevelDesignation = {
    skillName: string;
    skillLevel: number;
}

/**
 * Represents an item required as an ingredient for creating another item.
 * @property consumedDuringCreation - Indicates whether this ingredient is consumed/loss upon use.
 * @property amount - The amount of this ingredient that is required.
 * @property item - The full item object representing this item.
 */
export type GameItemCreationIngredient = {
    consumedDuringCreation: boolean;
    amount: number;
    item: IGameItem
}

/**
 * Represents the character requirements for creating a given item.
 * @property experienceGranted - The amount of experience granted and in which skills.
 * @property requiredSkills - The names and levels of the skills required to create the item.
 * @property ingredients - The list of items required to create this item.
 */
export type GameItemCreationSpecs = {
    experienceGranted: GameItemCreationExperienceGranted[];
    requiredSkills: SkillLevelDesignation[];
    ingredients: GameItemCreationIngredient[];
}

/**
 * Represents an in-game item.
 * @property id             - Unique OSRS item ID number.
 * @property name           - The name of the item.
 * @property image          - The name of the file for the image of this item.
 * @property examineText    - The "examine" text of the item. Works as a description.
 * @property incomplete     - If the item has incomplete wiki data.
 * @property members        - If the item is members-only.
 * @property tradeable      - If the item is tradeable (between players and on the GE).
 * @property buyLimit       - The GE buy limit of the item.
 * @property storePrice     - The store price of the item.
 * @property highPrice      - The most recent high price at which the item was sold.
 * @property highTime       - The time at which the item sold at the most recent high price.
 * @property lowPrice       - The most recent low price at which the item was sold.
 * @property lowTime        - The time at which the item sold at the most recent low price.
 * @property highAlch       - The high alchemy value of the item (cost * 0.6).
 * @property lowAlch        - The low alchemy value of the item (cost * 0.4).
 * @property creationSpecs  - The character requirements for creating this item.
 */
export interface IGameItem extends MapData {
    [key: string]: undefined | string | number | boolean | GameItemCreationSpecs;
    highPrice?: number;
    highTime?: number;
    lowPrice?: number;
    lowTime?: number;
    creationSpecs?: GameItemCreationSpecs;
}

/**
 * Pairs multiple GameItems together under a single category represented by a string.
 * @property categoryName - The name of the category of these GameItems.
 * @property items - The list of GameItems for this category.
 */
export type GameItemsByCategory = {
    categoryName: string;
    items: IGameItem[];
};

/**
 * Pairs multiple `GameItemsByCategory` objects together under a single skill.
 * @property skillName - The name of the skill to which these categories are relevant.
 * @property categories - The list of categories under this skill.
 */
export type GameItemsBySkill = {
    skillName: string;
    categories: GameItemsByCategory[];
};
