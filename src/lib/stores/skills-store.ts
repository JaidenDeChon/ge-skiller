import { persisted } from 'svelte-persisted-store';
import { LocalStorageStoreNames } from '$lib/constants/enums/local-storage-store-names';
import type { CharacterProfile } from '$lib/models/player-stats';

export const skillsStore = persisted(LocalStorageStoreNames.SKILLS_STORE, {
    characters: [] as CharacterProfile[],
});
