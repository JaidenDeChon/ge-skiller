import mongoose from 'mongoose';

export interface IGameItemSkill {
    skillName: string;
    categories: mongoose.Types.ObjectId[];
}

const gameItemSkillsSchema = new mongoose.Schema<IGameItemSkill>({
    skillName: {
        type: String,
        required: true,
    },
    categories: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'GameItemCategory',
        },
    ],
});

let GameItemSkillsModel: mongoose.Model<IGameItemSkill>;

if (mongoose.models.GameItemSkills) {
    GameItemSkillsModel = mongoose.models.GameItemSkills;
} else {
    GameItemSkillsModel = mongoose.model<IGameItemSkill>('GameItemSkills', gameItemSkillsSchema, 'game-item-skills');
}

export { GameItemSkillsModel };
