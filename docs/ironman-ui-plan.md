# Ironman mode — UI plan and copy

Companion to `ironman-feature-recommendations.md`. Covers where the mode lives, what changes on each
screen, and the exact copy.

---

## 0. Correction: the ingestion scripts are mostly fine

Worth stating up front, because it changes the shape of the work.

`scripts/grab-osrsbox-items.ts` **already imports everything by default**:

```ts
const SKIP_UNTRADEABLE = process.env.OSRSBOX_SKIP_UNTRADEABLE === 'true';
const SKIP_NOTED = process.env.OSRSBOX_SKIP_NOTED === 'true';
// ...
// Optional filters (default is to import everything).
if ((SKIP_UNTRADEABLE && !item.tradeable) || (SKIP_NOTED && item.noted)) { … }
```

Neither env var is set anywhere in the repo, so both default to `false`.
`scripts/populate-ingredients.ts` builds its `baseFilter` purely from CLI flags and has no tradeable
filter either. So untradeable items are almost certainly **already in the database, with creation
specs**. The exclusion is entirely at the query layer in `game-item-mongo-service.server.ts`.

That means the "make the database include Ironman items" work is smaller than it looked, and the real
work is what the app does with items that have no GE price.

### What does still need changing on the data side

1. **Non-GE items have no price fields at all.** `game-item-price-service.ts` correctly skips
   `!item.tradeable_on_ge`, so those items have no `highPrice`/`lowPrice` — which is exactly why
   `getValidPriceQuery()` filters them out. Removing that filter without giving them a value basis
   just surfaces a list of dashes. **They need `cost`, `highalch` and (once scraped) shop prices as
   their value basis.** This is the dependency, not the import.
2. **Add a `valueBasis` precomputed field** in the same batch pass that writes `bestShopBuy`, so every
   item has a defined non-GE value and the browse page can sort on it:
   `bestShopBuy.unitPrice ?? (highalch − natureRuneCost) ?? null`.
3. **Confirm coverage before flipping the filter.** Add a one-off count to
   `scripts/update-db.ts`'s summary: how many items have `creationSpecs` but no GE price. That number
   is the size of the unlock and tells us whether it's worth it before any UI ships.
4. **`backfill-missing-items.ts` is not a route for untradeables** — its skeleton builder pulls from
   the GE mapping endpoint, which only contains GE-tradeable items, so its hardcoded
   `tradeable: true, tradeable_on_ge: true` is correct for that source. Leave it alone.

### One reassurance about scope

The browse filter already requires creation specs:

```ts
const base = { 'creationSpecs.0': { $exists: true } }; // Only items that have creation specs
```

So dropping `tradeable_on_ge` from **browse** adds untradeable _craftable_ items — a bounded, useful
set, not a flood. **Search** has no such requirement, so dropping it there opens search to every item
in the DB. That's desirable (an Ironman wants to look anything up) but it's the path where the
no-price state below actually matters.

---

## 1. Where the mode lives

**Recommendation: account type is a property of the character profile, not a view preference.**

The app already has multiple character profiles and a character switcher. Ironman status belongs to
the account, so if someone keeps a main and an iron, switching characters should switch the pricing
automatically. Burying it as a fourth switch in the items-page toolbar — next to "Filter by my skill
levels" and "Show profit" — would imply it's a per-page display option, and it would silently
disagree with itself across the item page, favorites and search.

```ts
// src/lib/models/player-stats.ts
export type AccountType = 'main' | 'ironman' | 'hardcore' | 'ultimate' | 'group';

export interface ICharacterProfile {
    id: UUID;
    name: string;
    accountType: AccountType; // new; defaults to 'main' for existing profiles
    skillLevels: Record<SkillNames, number>;
}
```

Branch all pricing on one derived boolean rather than on the enum, so the four Ironman variants can't
drift apart:

```ts
const canUseGrandExchange = $derived(accountType === 'main');
```

Store the full enum anyway — Ultimate needs it later (no bank changes the supplies feature) and Group
needs it eventually (trading within a group is allowed). Neither changes pricing today.

**When no character is selected**, fall back to `'main'`. A visitor with no profile gets today's
behaviour unchanged.

**Escape hatch:** if we want people to preview Ironman prices without making a profile, add the
toggle to the items-page toolbar as an _override_ that defaults to whatever the active character
says. I'd skip this in v1 — it reintroduces exactly the disagreement the character-level setting
avoids.

---

## 2. Screen by screen

### 2.1 Character dialog + My character page

The entry point, and the only place the mode is set.

`src/lib/components/dialogs/character-stats-dialog.svelte` and `src/routes/my-character/+page.svelte`
gain an account-type selector above the skills grid.

> **Account type**
>
> - **Main** — Prices come from the Grand Exchange.
> - **Ironman** — No trading. Items are valued at what shops and alchemy will actually give you.
> - **Hardcore Ironman** — No trading. Items are valued at what shops and alchemy will actually give you.
> - **Ultimate Ironman** — No trading and no bank. Items are valued at what shops and alchemy will actually give you.
> - **Group Ironman** — No trading outside your group. Items are valued at what shops and alchemy will actually give you.

Existing profiles have no `accountType`; default them to `main` on read so nobody's saved characters
change behaviour on deploy.

### 2.2 Character switcher / site header

`src/lib/components/global/character-switcher.svelte`

The mode must be visible at all times — the worst outcome is someone reading shop-based numbers while
believing they're GE numbers. Add a small badge beside the character name:

- Badge text: `Ironman` (or `HCIM` / `UIM` / `GIM`)
- Tooltip: `Ironman — prices don't use the Grand Exchange`

Ironman helm icons would fit the existing `/static/other-images/` convention if we'd rather go visual.

### 2.3 Items page

`src/lib/components/items/game-items-page.svelte`

**A dismissible banner** above the toolbar the first few times, so the number change is explained
rather than discovered:

> **Ironman prices**
> Profit here doesn't use the Grand Exchange. Materials you'd gather yourself count as free,
> materials you'd buy count at shop price, and items are worth what a shop or the alchemy spell will
> actually pay. [How this is worked out]

**Switch relabels** (only under Ironman; unchanged for mains):

| Today                                               | Under Ironman                                               |
| --------------------------------------------------- | ----------------------------------------------------------- |
| `Show profit` <span>(enables profit sorting)</span> | `Show Ironman profit` <span>(enables profit sorting)</span> |
| `Only show what I have supplies for`                | unchanged                                                   |
| `Filter by my skill levels`                         | unchanged                                                   |

**Sort options.** Two notes here, one of which is a real design consequence:

| Value         | Main label         | Ironman label            |
| ------------- | ------------------ | ------------------------ |
| `desc`        | `Sort by value`    | `Sort by sell value`     |
| `profit-desc` | `Sort by profit`   | `Sort by Ironman profit` |
| `roi-desc`    | `Sort by best ROI` | **hidden**               |
| `shop-desc`   | —                  | `Sort by shop value`     |
| `xp-cost-asc` | —                  | `Sort by cheapest XP`    |

**ROI has to be hidden under Ironman, not relabelled.** ROI is `profit / creationCost`, and the
service already returns `null` when cost is zero. For an Ironman working from gathered materials cost
_is_ zero, so ROI is undefined for most of the list — the sort would quietly drop the majority of
results. `Sort by cheapest XP` is the metric that replaces it, and it's the one Ironmen actually
optimise anyway. Note the existing `normalizeSortSelection()` already falls back to `'desc'` for
unavailable sorts, so hiding ROI needs the same guard extended rather than new machinery.

### 2.4 Item card

`src/lib/components/global/item-card.svelte`

The big number currently renders `highPrice ?? lowPrice`. Under Ironman it renders the exit value,
and it needs to say where that value came from — a bare number with no source is the thing that makes
people distrust the whole page.

```
  Adamant platebody
  A sturdy platebody.

  1,536gp                          ← exit value
  High alch                        ← source line, replaces the "2 hours ago" timestamp
  Ironman profit: +410 gp (36.4%)
  Shop cost: ≤340gp
```

Source line copy, by which basis won:

- `High alch`
- `Bob's Brilliant Axes` (the shop name, when a shop pays more)
- `No sell value` (nothing buys it and it can't be alched)

Cost line copy:

- `Shop cost: ≤340gp` — when some inputs are shop-bought
- `Gathered — no gp cost` — when every input is self-gathered

The `timeSince` line is GE-specific and should be dropped under Ironman; shop and alch values don't
go stale hourly.

### 2.5 Item detail page

`src/routes/items/[id=integer]/+page.svelte`. Four changes, top to bottom.

**Grand Exchange card.**

- Item is untradeable → don't render the card at all.
- Item is tradeable but the account is an Ironman → collapse it behind a disclosure:
  `Show Grand Exchange prices` / muted sub-line `You can't use the Grand Exchange on this account.`
  Worth keeping rather than hiding outright — people do want to know what a thing is "worth".

**New Shops card** (feature #2), a peer of the two existing pricing cards:

> ### Shops
>
> | Shop                              | Location  | Buys at | Sells at | Stock |
> | --------------------------------- | --------- | ------- | -------- | ----- |
> | Bob's Brilliant Axes `Best price` | Lumbridge | 25 gp   | 16 gp    | 5     |
> | General store                     | Anywhere  | 5 gp    | 21 gp    | 0     |
>
> Empty state: `No shop buys this item.`
> Members shops carry a `Members` badge.

**Game Prices card.** Rename the `Store price` row to `Value`. It's the item's base value, not a
store price, and once the Shops card exists next to it the old label is actively contradicted.

**Value insights card.**

| Row                | Main | Ironman                                                         |
| ------------------ | ---- | --------------------------------------------------------------- |
| `GE spread`        | keep | hide — it's a merchant metric                                   |
| `High alch profit` | keep | replace with `High alch value`, sub-label `after 1 nature rune` |
| `Low alch profit`  | keep | replace with `Low alch value`, sub-label `after 1 nature rune`  |
| `gp per XP`        | —    | new row                                                         |

**Buy limit row** (in the Grand Exchange card) is a GE concept. Under Ironman it's replaced by
`Shop stock` / `Restocks every 60s` in the Shops card.

### 2.6 The selling block — answering your question directly

**Yes — new UI on the item page**, and it belongs _inside_ the Shops card rather than as its own
section, because it's meaningless without knowing which shop you're selling to. It appears under the
table, keyed to the best-paying shop, with a shop picker if more than one buys the item.

It needs two copy variants, because the number that matters depends on whether gp was fronted:

**When creation cost is zero (gathered materials — the common case):**

> **Selling to Bob's Brilliant Axes**
> The price drops as you sell. You'll get **25 gp** for the first one, down to **8 gp** by the 10th.
> Selling all 10 gets you **164 gp**. After that it stays at 8 gp.
> Stock refills every 60 seconds.

**When creation cost is above zero:**

> **Selling to Bob's Brilliant Axes**
> Each one costs you **340 gp** to make. The shop pays less for every one you sell, and drops below
> what you paid after **4**. Selling those 4 gets you **1,420 gp** — a profit of **60 gp**.
> Stock refills every 60 seconds.

Both are driven by the same `shopSources` data already fetched for the table, so no extra request. The
cost basis is already available — `creationCost` is computed for the item, and if "Only show what I
have supplies for" is on it's already net of the character's bank.

---

## 3. The no-price state (the main correctness risk)

Once untradeables are browsable, a whole class of items reaches components that have always assumed a
price exists. Today `item-card.svelte` renders `—` and `+page.svelte` renders `—` via `formatPrice`,
which is _safe_ but not _informative_ — a page of dashes reads as broken data.

Every price surface needs a defined, explained empty state:

| Situation                                       | Big number | Sub-line            |
| ----------------------------------------------- | ---------- | ------------------- |
| Untradeable, no shop buys it, not alchable      | `—`        | `Nothing buys this` |
| Untradeable, alchable                           | alch value | `High alch`         |
| Untradeable, shop buys it                       | shop price | shop name           |
| Tradeable but no recent GE trade (main account) | `—`        | `No recent trades`  |

That last row exists today and is silently filtered out. Once the filter drops it becomes visible, so
it needs copy whether or not we ship Ironman mode.

**This is the single highest-risk part of the change** and the reason I'd ship §0's coverage count
first: it tells us how many items land in each row before we write the states.

---

## 4. Suggested UI build order

| #   | Work                                                                    | Ships value alone?                                          |
| --- | ----------------------------------------------------------------------- | ----------------------------------------------------------- |
| 1   | `accountType` on the profile + character-dialog selector + header badge | Yes — mode is visible and settable before anything reads it |
| 2   | No-price states everywhere (§3)                                         | Yes — fixes a latent gap today                              |
| 3   | Drop `tradeable_on_ge` from browse + search behind the mode             | Yes — the untradeable unlock                                |
| 4   | Alch fix + `Value` relabel + hide GE spread                             | Yes — no new data needed                                    |
| 5   | Shops card                                                              | Needs shop scrape                                           |
| 6   | Selling block (§2.6)                                                    | Needs 5                                                     |
| 7   | Item-card exit value + source line, sort relabels, new sorts            | Needs 5                                                     |
| 8   | Cheapest-XP sort + gp-per-XP row                                        | Needs 7                                                     |

Steps 1–4 need no scraping and no new fields, and each is independently shippable. Step 3 is the one
you asked about, and it's a filter change gated on the mode rather than a data migration.

---

## 5. Open copy decisions

- **"Sell value" vs "cash value" vs "what you'd get."** I've used `sell value` throughout — shortest
  thing that's true for both shop and alch exits. Easy to swap, it's one label.
- **Nature rune cost** needs a home. It's an input to every alch number, and Ironmen craft their own
  so there's no market price that's really theirs. Suggest a field on the character profile,
  defaulting to the live GE price of a nature rune, with copy:
  `Nature rune cost — used for alchemy values. Set this to what a nature rune is worth to you.`
- **Ironman variants in copy.** Everything above says "Ironman" for all four types. Only Ultimate
  needs different wording eventually (no bank, so "supplies" means inventory), and that can wait.
