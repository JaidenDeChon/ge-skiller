import { persisted } from 'svelte-persisted-store';
import { LocalStorageStoreNames } from '$lib/constants/enums/local-storage-store-names';
import { CharacterProfile } from '$lib/models/player-stats';

export const characterStore = persisted(LocalStorageStoreNames.CHARACTER_STORE, {
    activeCharacter: undefined as undefined | CharacterProfile['id'],
    characters: [] as CharacterProfile[],
});
