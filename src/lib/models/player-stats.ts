import { SkillNames } from '$lib/constants/enums/skill-names';
import { defaultSkillLevels } from '$lib/constants/default-skill-levels';

/**
 * The shape of the stat data kept on a player character.
 * @property name         - The name of the character.
 * @property skillLevels  - Record relating skill levels to their respective level numbers.
 */
export interface ICharacterProfile {
    name: string;
    skillLevels: Record<SkillNames, number>,
}

export class CharacterProfile implements ICharacterProfile {
    name: string;
    skillLevels: Record<SkillNames, number>;

    constructor(
        name: ICharacterProfile['name'],
        skillLevels: ICharacterProfile['skillLevels'] = defaultSkillLevels,
    ) {
        const mergedSkillLevels = Object.assign(defaultSkillLevels, skillLevels);
        this.name = name;
        this.skillLevels = mergedSkillLevels;
    }
}
