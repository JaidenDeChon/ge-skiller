/**
 * Latest high and low prices for the items that we have data for, and the Unix timestamp when that transaction took place.
 * @property high - The high price.
 * @property highTime - The Unix timestamp when that transaction took place.
 * @property low - The low price.
 * @property lowTime - The Unix timestamp when that transaction took place.
 */
export type TransactionData = {
    high: number;
    highTime: number;
    low: number;
    lowTime: number;
};

export type FullTransactionData = {
    [key: string]: TransactionData;
};

/**
 * Represents an in-game item.
 * @property id          - Unique OSRS item ID number.
 * @property name        - The name of the item.
 * @property icon        - The name of the file for the image of this item.
 * @property examine     - The "examine" text of the item. Works as a description.
 * @property incomplete  - If the item has incomplete wiki data.
 * @property members     - If the item is members-only.
 * @property tradeable   - If the item is tradeable (between players and on the GE).
 * @property buyLimit    - The GE buy limit of the item.
 * @property cost        - The store price of the item.
 * @property lowAlch     - The low alchemy value of the item (cost * 0.4).
 * @property highAlch    - The high alchemy value of the item (cost * 0.6).
 * @property wikiName    - The name of the OSRS Wiki entry for this item.
 */
export type MapData = {
    id: number;
    name: string;
    icon: string;
    examine: string;
    incomplete: boolean;
    members: boolean;
    tradeable: boolean;
    buyLimit: number;
    cost: number;
    lowalch: number;
    highalch: number;
    wikiName: string;
};

/**
 * A list of objects containing the name, id, examine text, members status, lowalch, highalch, GE buy limit, icon file name (on the wiki).
 */
export type FullMap = {
    [key: string]: MapData;
};

/** A combined type of MapData and low alch/high alch values. */
export type MapDataCombined = MapData & { highPrice: number, lowPrice: number };

/** An object with a string for a key and the above type for a value. */
export type FullMapDataCombined = {
    [key: string]: MapData & { highPrice: number, lowPrice: number, highTime: number, lowTime: number }
}

/**
 * A list of the high and low prices of an item.
 * @property avgHighPrice - The average high price.
 * @property highPriceVolume - The high price volume.
 * @property avgLowPrice - The average low price.
 * @property lowPriceVolume - The low price volume.
 * @property timestamp - The timestamp of the data.
 */
export interface TimeSeriesDataPoint {
    avgHighPrice: number | null;
    highPriceVolume: number;
    avgLowPrice: number | null;
    lowPriceVolume: number;
    timestamp: number;
}

/**
 * An assorted list of the high and low prices of an item.
 */
export interface TimeSeriesData {
    [key: string]: TimeSeriesDataPoint;
}

/**
 * The valid values for the `PricesOptions` property `timestep`.
 */
export enum PricesOptionTimestep {
    FIVE_MINUTES = '5m',
    ONE_HOUR = '1h',
}

/**
 * The object expected by the Grand Exchange API Service function `prices`.
 */
export interface PricesOptions {
    // Timestep of the time-series.
    timestep: '5m' | '1h';
    // Represents the beginning of the period being averaged.
    timestamp: number | string;
}

/**
 * The valid values for the `TimeSeriesOptions` property `timestep`.
 */
export enum TimeSeriesOptionTimestep {
    FIVE_MINUTES = '5m',
    ONE_HOUR = '1h',
    SIX_HOURS = '6h',
}

/**
 * The object expected by the Grand Exchange API Service function `timeseries`.
 */
export interface TimeSeriesOptions {
    // Timestep of the time-series.
    timestep: TimeSeriesOptionTimestep;
    // Item id to return a time-series for.
    id: number | string;
}