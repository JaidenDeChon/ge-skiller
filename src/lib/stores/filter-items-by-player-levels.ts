import { persisted } from 'svelte-persisted-store';
import { LocalStorageStoreNames } from '$lib/constants/enums/local-storage-store-names';

export const filterItemsStore = persisted(LocalStorageStoreNames.FILTER_ITEMS_BY_PLAYER_SKILLS_STORE, {
    filterItemsByPlayerLevels: false,
    filterItemsBySkills: [] as string[],
});
