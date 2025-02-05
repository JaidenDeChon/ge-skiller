import { ObjectId } from 'bson';
import { GameItemModel, type IGameItem } from '$lib/models/mongo-schemas/game-item-schema';
import { GameItemPricingModel, type IGameItemPricing } from '$lib/models/mongo-schemas/game-item-pricing-schema';
import { GameItemCategoryModel, type IGameItemCategory } from '$lib/models/mongo-schemas/game-item-categories-schema';
import { GameItemSkillsModel } from '$lib/models/mongo-schemas/game-item-skills-schema';
import type { Document, Types } from 'mongoose';
import type {
    GameItemsByCategory,
    GameItemsBySkill,
    GameItem,
    GameItemCreationIngredient
} from '$lib/models/game-item';

type GameItemDoc = Document<unknown, object, IGameItem> & IGameItem & { _id: Types.ObjectId };
type GameItemPricingDoc = Document<unknown, object, IGameItemPricing> & IGameItemPricing & { _id: Types.ObjectId };
type GameItemCategoryDoc = Document<unknown, object, IGameItemCategory> & IGameItemCategory & { _id: Types.ObjectId };

export async function buildGameItemTrees(): Promise<{
    finishedGameItems: GameItem[];
    finishedSkills: GameItemsBySkill[];
}> {
    // Grab documents from MongoDB.
    const mongoGameItems = await GameItemModel.find();
    const mongoGameItemPricing = await GameItemPricingModel.find();
    const mongoGameItemCategories = await GameItemCategoryModel.find();
    const mongoGameItemSkills = await GameItemSkillsModel.find();

    // Create arrays to cache the finished items, categories, and skills.
    const finishedGameItems: GameItem[] = [];
    const finishedCategories: GameItemsByCategory[] = [];
    const finishedSkills: GameItemsBySkill[] = [];

    // Fully assemble each GameItem. This includes populating the ingredients recursively. Once populated, place them in
    // the finishedGameItems array as a cache of completed items.
    for (const item of mongoGameItems) {
        const assembledGameItem = await buildGameItem(item, mongoGameItemPricing, finishedGameItems);
        finishedGameItems.push(assembledGameItem);
    }

    // Populate the finishedCategories array. Once populated, place them in finishedCategories as a cache of completec
    // categories.
    mongoGameItemCategories.forEach(category => {
        const finishedCategory = buildGameItemsByCategoryObject(category, finishedGameItems, mongoGameItems);
        finishedCategories.push(finishedCategory);
    });

    // Populate the finishedSkills array. Once populated, place them in the finishedSkills array as a cache of completed
    // skills.
    mongoGameItemSkills.forEach(skill => {
        const finishedSkill = buildGameItemsBySkillObject(
            skill.skillName,
            skill.categories,
            finishedCategories,
            mongoGameItemCategories
        );
        finishedSkills.push(finishedSkill);
    });

    return { finishedGameItems, finishedSkills };
}

/**
 * Fully builds a GameItem given a GameItemDocument. This includes populating the ingredients recursively.
 * @param item - The GameItemDocument to build.
 * @param mongoGameItemPricing - The GameItemPricingDocuments to use for pricing.
 * @param finishedGameItems - The GameItems that have already been built.
 * @returns A fully built GameItem.
 */
async function buildGameItem(
    item: GameItemDoc,
    mongoGameItemPricing: GameItemPricingDoc[],
    finishedGameItems: GameItem[],
): Promise<GameItem> {
    const pricing = mongoGameItemPricing.find(p => p.associatedGameItemDocId.equals(item._id));
    const ingredients: GameItemCreationIngredient[] = [];

    if (!item.creationSpecs?.ingredients) return constructGameItemObject(item, pricing, ingredients);

    for (const ingredient of item.creationSpecs.ingredients) {
        let ingredientItem: GameItem;

        // Determine whether the ingredient item is already in the finishedGameItems array.
        const finishedItem = finishedGameItems.find(i => i.id === ingredient.item._id);

        if (finishedItem) ingredientItem = finishedItem;
        else {
            const ingredientItemDoc = await GameItemModel.findById(ingredient.item);
            ingredientItem = await buildGameItem(
                ingredientItemDoc as GameItemDoc,
                mongoGameItemPricing,
                finishedGameItems,
            )
        }

        ingredients.push({ ...ingredient, item: ingredientItem });
    }

    return constructGameItemObject(item, pricing, ingredients);
}

/**
 * Constructs a GameItem object. Separated into its own function for readability and to avoid code duplication.
 * @param item {GameItemDoc} The GameItemDocument to build.
 * @param pricing {GameItemPricingDoc | undefined} The GameItemPricingDoc obj to use for pricing.
 * @param ingredients {GameItemCreationIngredient[]} The GameItemCreationIngredients obj to use for ingredients.
 * @returns A fully built GameItem.
 */
function constructGameItemObject(
    item: GameItemDoc,
    pricing: GameItemPricingDoc | undefined,
    ingredients: GameItemCreationIngredient[],
): GameItem {
    return {
        id: item.id,
        name: item.name,
        examineText: item.examineText,
        image: item.image,
        highAlch: item.highAlch,
        lowAlch: item.lowAlch,
        highPrice: pricing?.highPrice,
        lowPrice: pricing?.lowPrice,
        highTime: pricing?.highTime,
        lowTime: pricing?.lowTime,
        creationSpecs: {
            experienceGranted: item.creationSpecs?.experienceGranted ?? [],
            requiredSkills: item.creationSpecs?.requiredSkills ?? [],
            ingredients,
        }
    };
}

/**
 * Builds a GameItemsByCategory object using the given data.
 * @param category {GameItemCategoryDoc} The GameItemCategoryDoc to build/populate with data.
 * @param finishedGameItems {finishedGameItems} The GameItems that have already been built.
 * @param mongoGameItems {mongoGameItems} The GameItemDocuments to use for building the items in the category.
 * @returns A fully built GameItemCategory.
 */
function buildGameItemsByCategoryObject(
    category: GameItemCategoryDoc,
    finishedGameItems: GameItem[],
    mongoGameItems: GameItemDoc[],
): GameItemsByCategory {
    const categoryName = category.categoryName;
    const items = finishedGameItems.filter(item => {
        // Find the MongoDB ID of the item.
        const id = mongoGameItems.find(i => i.id === item.id)?._id.toString() ?? '';
        return category.items.includes(ObjectId.createFromHexString(id));
    });

    return { categoryName, items };
}

/**
 * Assembles a GameItemsBySkill object using the given data.
 * @param skillName {string} The name of the skill to be assembled.
 * @param deflatedCategories {Types.ObjectId[]} The not-yet-populated category children of the skill.
 * @param finishedCategories {GameItemsByCategory[]} - The GameItemCategories that have already been built.
 * @param mongoGameItemCategories - The GameItemCategoryDocuments to use for populating the categories in the skill.
 * @returns A fully built GameItemSkill.
 */
function buildGameItemsBySkillObject(
    skillName: string,
    deflatedCategories: Types.ObjectId[],
    finishedCategories: GameItemsByCategory[],
    mongoGameItemCategories: GameItemCategoryDoc[]
): GameItemsBySkill {
    const categories = finishedCategories
        .filter(category => {
            // Find the MongoDB ID of the category.
            const id = mongoGameItemCategories.find(c =>
                c.categoryName === category.categoryName
            )?._id.toString() ?? '';
            return deflatedCategories.includes(ObjectId.createFromHexString(id))
        });

    return { skillName, categories };
}
