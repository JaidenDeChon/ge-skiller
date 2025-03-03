import { v4 as uuidv4 } from 'uuid';
import { SkillNames } from '$lib/constants/enums/skill-names';
import { defaultSkillLevels } from '$lib/constants/default-skill-levels';
import type { UUID } from 'crypto';

/**
 * The shape of the stat data kept on a player character.
 * @property id           - The randomly-generated ID of the character for referencing in localStorage.
 * @property name         - The name of the character.
 * @property skillLevels  - Record relating skill levels to their respective level numbers.
 */
export interface ICharacterProfile {
    id: UUID;
    name: string;
    skillLevels: Record<SkillNames, number>;
}

export class CharacterProfile implements ICharacterProfile {
    id: ICharacterProfile['id'];
    name: ICharacterProfile['name'];
    skillLevels: ICharacterProfile['skillLevels'];

    constructor(
        name: ICharacterProfile['name'],
        skillLevels: ICharacterProfile['skillLevels'] = defaultSkillLevels,
        id?: ICharacterProfile['id'],
    ) {
        this.id = id || uuidv4() as UUID;
        this.name = name;
        this.skillLevels = Object.assign(defaultSkillLevels, skillLevels);
    }
}
