// src/lib/stores/character-store.svelte.ts
import { LocalStorageStoreNames } from '$lib/constants/enums/local-storage-store-names';
import type { CharacterProfile } from '$lib/models/player-stats';
import { LocalStorage } from '$lib/services/persisted-store.svelte';

interface ICharacterStoreData {
  activeCharacter: undefined | CharacterProfile['id'];
  characters: CharacterProfile[];
}

const _store = new LocalStorage<ICharacterStoreData>(
  LocalStorageStoreNames.CHARACTER_STORE,
  { activeCharacter: undefined, characters: [] }
);

// Expose live proxies (no runes in module exports).

// live proxy to the JSON root.
export function getStoreRoot() {
  return _store.current;
}

// live proxied array of characters.
export function getCharacters() {
  return _store.current.characters;
}

// live proxied active character id.
export function getActiveCharacter() {
  return _store.current.activeCharacter;
}
