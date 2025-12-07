import { persisted } from 'svelte-persisted-store';
import { LocalStorageStoreNames } from '$lib/constants/enums/local-storage-store-names';
import type { IGameItem } from '$lib/models/game-item';

export const hiddenStore = persisted(LocalStorageStoreNames.HIDDEN_STORE ?? 'ge-skiller-hidden', {
    hidden: [] as IGameItem['id'][],
});
