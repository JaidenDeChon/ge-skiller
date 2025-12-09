import mongoose from 'mongoose';
import type { IGameItem } from '$lib/models/game-item';

/**
 * Mongoose schema derived from the IGameItem interface.
 */
export const gameItemSchema = new mongoose.Schema<IGameItem>({
    id: {
        type: Number,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    icon: {
        type: String,
        required: true,
    },
    examine: {
        type: String,
        required: true,
    },
    incomplete: {
        type: Boolean,
        required: false,
    },
    members: {
        type: Boolean,
        required: false,
    },
    tradeable: {
        type: Boolean,
        required: false,
    },
    buyLimit: {
        type: Number,
        required: false,
    },
    cost: {
        type: Number,
        required: false,
    },
    highalch: {
        type: Number,
        required: false,
    },
    lowalch: {
        type: Number,
        required: false,
    },
    highPrice: {
        type: Number,
        required: false,
    },
    highTime: {
        type: Number,
        required: false,
    },
    lowPrice: {
        type: Number,
        required: false,
    },
    lowTime: {
        type: Number,
        required: false,
    },
    creationSpecs: {
        experienceGranted: [
            {
                skillName: String,
                experienceAmount: Number,
            },
        ],
        requiredSkills: [
            {
                skillName: String,
                skillLevel: Number,
            },
        ],
        ingredients: [
            new mongoose.Schema(
                {
                    consumedDuringCreation: Boolean,
                    amount: Number,
                    // Recursively reference another GameItem
                    item: {
                        type: mongoose.Schema.Types.ObjectId,
                        ref: 'GameItem',
                    },
                },
                { _id: false },
            ),
        ],
    },
});

let GameItemModel: mongoose.Model<IGameItem>;

if (mongoose.models.GameItem) {
    GameItemModel = mongoose.models.GameItem;
} else {
    GameItemModel = mongoose.model<IGameItem>('GameItem', gameItemSchema, 'game-items');
}

export { GameItemModel };
