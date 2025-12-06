import { persisted } from 'svelte-persisted-store';
import { LocalStorageStoreNames } from '$lib/constants/enums/local-storage-store-names';
import type { IGameItem } from '$lib/models/game-item';

export type RecentSearchItem = Pick<IGameItem, 'id' | 'name' | 'icon' | 'examine'>;

export type RecentSearchEntry = {
    query: string;
    item: RecentSearchItem;
};

interface RecentSearchesState {
    recentSearches: RecentSearchEntry[];
}

const MAX_RECENT_SEARCHES = 15;

export const recentSearchesStore = persisted<RecentSearchesState>(
    LocalStorageStoreNames.RECENT_SEARCHES_STORE,
    { recentSearches: [] },
);

function normalize(entries: RecentSearchesState['recentSearches'] | string[] | undefined): RecentSearchEntry[] {
    if (!Array.isArray(entries)) return [];
    if (entries.length === 0) return [];

    const first = entries[0];
    if (typeof first === 'string') return [];

    return (entries as RecentSearchEntry[]).filter(
        (entry) => entry?.item?.id !== undefined && entry?.item?.name,
    );
}

export function addRecentSearch(query: string, item: RecentSearchItem) {
    if (item?.id === undefined) return;

    const trimmed = query.trim() || item.name?.trim() || '';
    if (!trimmed) return;

    recentSearchesStore.update((state) => {
        const normalized = normalize(state?.recentSearches);
        const withoutDuplicates = normalized.filter((entry) => entry.item.id !== item.id);

        const nextSearches: RecentSearchEntry[] = [
            {
                query: trimmed,
                item: {
                    id: item.id,
                    name: item.name,
                    icon: item.icon ?? null,
                    examine: item.examine ?? '',
                },
            },
            ...withoutDuplicates,
        ].slice(0, MAX_RECENT_SEARCHES);

        return { recentSearches: nextSearches };
    });
}
