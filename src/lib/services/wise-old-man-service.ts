import { WOMClient } from '@wise-old-man/utils';
import { SkillNames } from '$lib/constants/enums/skill-names';
import { CharacterProfile } from '$lib/models/player-stats';

const useImportMetaEnv = typeof import.meta !== 'undefined' && import.meta.env;
const useProcessEnv = typeof process !== 'undefined' && process.env;

const isProduction =
    (useImportMetaEnv && import.meta.env.MODE === 'production') ||
    (useProcessEnv && process.env.NODE_ENV === 'production');

const environmentName = isProduction ? 'production' : 'development';

const userAgent =
    `This API call came from a ${environmentName} instance of ge-skiller (https://ge-skiller.netlify.app). Please contact ` +
    'Jaiden with any issues at me@jaiden.foo or on Discord at .mrbubbs. Thank you!';

export async function fetchCharacterDetailsFromWOM(characterName: string): Promise<CharacterProfile> {
    const client = new WOMClient({ userAgent });
    const result = await client.players.getPlayerDetails(characterName);

    if (!result.id) throw new Error('Could not find character on Wise Old Man.');

    return new CharacterProfile(
        characterName,
        {
            [SkillNames.AGILITY]: (result.latestSnapshot?.data.skills.agility.level ?? 0),
            [SkillNames.ATTACK]: (result.latestSnapshot?.data.skills.attack.level ?? 0),
            [SkillNames.CONSTRUCTION]: (result.latestSnapshot?.data.skills.construction.level ?? 0),
            [SkillNames.COOKING]: (result.latestSnapshot?.data.skills.cooking.level ?? 0),
            [SkillNames.CRAFTING]: (result.latestSnapshot?.data.skills.crafting.level ?? 0),
            [SkillNames.DEFENCE]: (result.latestSnapshot?.data.skills.defence.level ?? 0),
            [SkillNames.FARMING]: (result.latestSnapshot?.data.skills.farming.level ?? 0),
            [SkillNames.FIREMAKING]: (result.latestSnapshot?.data.skills.firemaking.level ?? 0),
            [SkillNames.FISHING]: (result.latestSnapshot?.data.skills.fishing.level ?? 0),
            [SkillNames.FLETCHING]: (result.latestSnapshot?.data.skills.fletching.level ?? 0),
            [SkillNames.HERBLORE]: (result.latestSnapshot?.data.skills.herblore.level ?? 0),
            [SkillNames.HITPOINTS]: (result.latestSnapshot?.data.skills.hitpoints.level ?? 0),
            [SkillNames.HUNTER]: (result.latestSnapshot?.data.skills.hunter.level ?? 0),
            [SkillNames.MAGIC]: (result.latestSnapshot?.data.skills.magic.level ?? 0),
            [SkillNames.MINING]: (result.latestSnapshot?.data.skills.mining.level ?? 0),
            [SkillNames.PRAYER]: (result.latestSnapshot?.data.skills.prayer.level ?? 0),
            [SkillNames.RANGED]: (result.latestSnapshot?.data.skills.ranged.level ?? 0),
            [SkillNames.RUNECRAFTING]: (result.latestSnapshot?.data.skills.runecrafting.level ?? 0),
            [SkillNames.SLAYER]: (result.latestSnapshot?.data.skills.slayer.level ?? 0),
            [SkillNames.SMITHING]: (result.latestSnapshot?.data.skills.smithing.level ?? 0),
            [SkillNames.STRENGTH]: (result.latestSnapshot?.data.skills.strength.level ?? 0),
            [SkillNames.THIEVING]: (result.latestSnapshot?.data.skills.thieving.level ?? 0),
            [SkillNames.WOODCUTTING]: (result.latestSnapshot?.data.skills.woodcutting.level ?? 0),
        }
    )
}
