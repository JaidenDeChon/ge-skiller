import { persisted } from 'svelte-persisted-store';
import { LocalStorageStoreNames } from '$lib/constants/enums/local-storage-store-names';
import type { GameItem } from '$lib/models/game-item';

export const favoritesStore = persisted(LocalStorageStoreNames.FAVORITES_STORE, {
    favorites: [] as GameItem['id'][],
});
