/**
 * Raw OSRS item record sourced from the OSRSBox database dump.
 * All properties are required; fields marked nullable may legitimately contain null when data is missing.
 * @property id - Unique OSRS item ID number. Required; not nullable.
 * @property name - The name of the item. Required; not nullable.
 * @property last_updated - The last time (UTC) the item was updated in ISO8601 format. Required; not nullable.
 * @property incomplete - Indicates if the item has incomplete wiki data. Required; not nullable.
 * @property members - Whether the item is members-only. Required; not nullable.
 * @property tradeable - Whether the item is tradeable between players and on the GE. Required; not nullable.
 * @property tradeable_on_ge - Whether the item is tradeable only on the GE. Required; not nullable.
 * @property stackable - Whether the item is stackable in inventory. Required; not nullable.
 * @property stacked - Stack count when stacked. Required; nullable.
 * @property noted - Whether the item is noted. Required; not nullable.
 * @property noteable - Whether the item is noteable. Required; not nullable.
 * @property linked_id_item - Linked ID of the actual item when noted/placeholder. Required; nullable.
 * @property linked_id_noted - Linked ID of the item in noted form. Required; nullable.
 * @property linked_id_placeholder - Linked ID of the item in placeholder form. Required; nullable.
 * @property placeholder - Whether the item is a placeholder. Required; not nullable.
 * @property equipable - Whether the item is equipable (based on right-click menu). Required; not nullable.
 * @property equipable_by_player - Whether the item is equipable in-game by a player. Required; not nullable.
 * @property equipable_weapon - Whether the item is an equipable weapon. Required; not nullable.
 * @property cost - Store price of the item. Required; not nullable.
 * @property lowalch - Low alchemy value (cost * 0.4). Required; nullable.
 * @property highalch - High alchemy value (cost * 0.6). Required; nullable.
 * @property weight - Weight in kilograms. Required; nullable.
 * @property buy_limit - Grand Exchange buy limit. Required; nullable.
 * @property quest_item - Whether the item is associated with a quest. Required; not nullable.
 * @property release_date - Date released in ISO8601 format. Required; nullable.
 * @property duplicate - Whether the item is a duplicate entry. Required; not nullable.
 * @property examine - Examine text for the item. Required; nullable.
 * @property icon - Item icon encoded as base64. Required; not nullable.
 * @property wiki_name - OSRS Wiki display name. Required; nullable.
 * @property wiki_url - OSRS Wiki URL (may include anchor link). Required; nullable.
 * @property equipment - Equipment bonuses of equipable armour/weapons. Required; nullable.
 * @property weapon - Weapon bonuses including attack speed, type and stance. Required; nullable.
 */
export interface IGameItem {
    id: number;
    name: string;
    last_updated: string;
    incomplete: boolean;
    members: boolean;
    tradeable: boolean;
    tradeable_on_ge: boolean;
    stackable: boolean;
    stacked: number | null;
    noted: boolean;
    noteable: boolean;
    linked_id_item: number | null;
    linked_id_noted: number | null;
    linked_id_placeholder: number | null;
    placeholder: boolean;
    equipable: boolean;
    equipable_by_player: boolean;
    equipable_weapon: boolean;
    cost: number;
    lowalch: number | null;
    highalch: number | null;
    weight: number | null;
    buy_limit: number | null;
    quest_item: boolean;
    release_date: string | null;
    duplicate: boolean;
    examine: string | null;
    icon: string;
    wiki_name: string | null;
    wiki_url: string | null;
    equipment: Record<string, unknown> | null;
    weapon: Record<string, unknown> | null;
}
