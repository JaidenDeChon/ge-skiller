import type { ICharacterProfile } from '$lib/models/player-stats';

export const defaultSkillLevels: ICharacterProfile['skillLevels'] = {
    agility: 1,
    attack: 1,
    construction: 1,
    cooking: 1,
    crafting: 1,
    defence: 1,
    farming: 1,
    firemaking: 1,
    fishing: 1,
    fletching: 1,
    herblore: 1,
    hitpoints: 10,
    hunter: 1,
    magic: 1,
    mining: 1,
    prayer: 1,
    ranged: 1,
    runecrafting: 1,
    slayer: 1,
    smithing: 1,
    strength: 1,
    thieving: 1,
    woodcutting: 1,
} as const;
