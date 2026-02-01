import { persisted } from 'svelte-persisted-store';
import { LocalStorageStoreNames } from '$lib/constants/enums/local-storage-store-names';
import type { IGameItem } from '$lib/models/game-item';

export interface BankItemEntry {
    id: IGameItem['id'];
    quantity: number;
}

export const bankItemsStore = persisted(LocalStorageStoreNames.BANK_ITEMS_STORE, {
    items: [] as BankItemEntry[],
});
