import mongoose from 'mongoose';

export interface IGameItemCategory {
    categoryName: string;
    items: mongoose.Types.ObjectId[];
}

export const gameItemCategoriesSchema = new mongoose.Schema<IGameItemCategory>({
    categoryName: {
        type: String,
        required: true,
    },
    items: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'GameItem',
        }
    ]
});

let GameItemCategoryModel: mongoose.Model<IGameItemCategory>;

if (mongoose.models.GameItemCategory) {
    GameItemCategoryModel = mongoose.models.GameItemCategory;
} else {
    GameItemCategoryModel = mongoose.model<IGameItemCategory>(
        'GameItemCategory',
        gameItemCategoriesSchema,
        'game-item-categories'
    );
}

export { GameItemCategoryModel };
