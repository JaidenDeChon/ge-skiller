import { describe, expect, it } from 'bun:test';
import { isCurrencyItem, resolveIngredientUnitPrice } from './ingredient-price';

describe('resolveIngredientUnitPrice', () => {
    it('prefers the live high price', () => {
        expect(
            resolveIngredientUnitPrice({
                name: 'Acorn',
                tradeable_on_ge: true,
                cost: 47,
                highPrice: 139,
                lowPrice: 120,
            }),
        ).toBe(139);
    });

    it('falls back to the low price before touching cost', () => {
        expect(resolveIngredientUnitPrice({ name: 'Acorn', tradeable_on_ge: true, cost: 47, lowPrice: 120 })).toBe(120);
    });

    it('uses cost for a tradeable item with no live price', () => {
        expect(resolveIngredientUnitPrice({ name: 'Acorn', tradeable_on_ge: true, cost: 47 })).toBe(47);
    });

    it('reports no price for an untradeable ingredient', () => {
        // The bug this exists for: cost 1 made Oak sapling look like a 31,500% return.
        expect(resolveIngredientUnitPrice({ name: 'Oak seedling (w)', tradeable_on_ge: false, cost: 1 })).toBeNull();
    });

    it('prices coins from cost even though they are untradeable', () => {
        expect(resolveIngredientUnitPrice({ name: 'Coins', tradeable_on_ge: false, cost: 1 })).toBe(1);
    });

    it('prices platinum tokens from cost', () => {
        expect(resolveIngredientUnitPrice({ name: 'Platinum token', tradeable_on_ge: false, cost: 1000 })).toBe(1000);
    });

    it('reports no price for an unresolved ingredient', () => {
        expect(resolveIngredientUnitPrice(null)).toBeNull();
        expect(resolveIngredientUnitPrice(undefined)).toBeNull();
    });

    it('treats a missing tradeable flag as not tradeable rather than as true', () => {
        expect(resolveIngredientUnitPrice({ name: 'Lovakite ore', cost: 80 })).toBeNull();
    });

    it('reports no price when nothing is priced at all', () => {
        expect(resolveIngredientUnitPrice({ name: 'Bone in vinegar', tradeable_on_ge: true })).toBeNull();
    });
});

describe('isCurrencyItem', () => {
    it('matches the money items exactly', () => {
        expect(isCurrencyItem('Coins')).toBe(true);
        expect(isCurrencyItem('Platinum token')).toBe(true);
    });

    it('does not match a merely coin-shaped name', () => {
        expect(isCurrencyItem('Coins (Deadman)')).toBe(false);
        expect(isCurrencyItem('coins')).toBe(false);
        expect(isCurrencyItem(null)).toBe(false);
        expect(isCurrencyItem(undefined)).toBe(false);
    });
});
