# Wiki name normalization

## The problem

OSRSBox (`osrsreboxed-db`) does not store the real OSRS Wiki page title for items that
live on a "switch infobox" page. Instead it synthesises `wiki_name` by appending the
infobox **version label** in parentheses, and points `wiki_url` at an anchor:

| field       | value                                                |
| ----------- | ---------------------------------------------------- |
| `id`        | `5364`                                               |
| `name`      | `Oak seedling (w)` ← real in-game name               |
| `wiki_name` | `Oak seedling (Watered)` ← **synthetic, not a page** |
| `wiki_url`  | `.../w/Oak_seedling#Watered`                         |

There is no wiki page called `Oak seedling (Watered)`. The real page is `Oak seedling`,
and `Watered` is one of its infobox versions.

`scripts/populate-ingredients.ts` derived the wiki page title to scrape from
`owner.wiki_name ?? owner.name`, so for every one of these items it requested a page
that does not exist, found no `Creation` section, and left the item with **no
`creationSpecs`**.

### Scope

Measured against `osrsreboxed-db` `items-complete.json` (28,744 items):

- **8,377** items have an anchored `wiki_url` (~29% of the dataset).
- **8,266** of those have `wiki_name != name`.
- For **all 8,377**, `wiki_name` is exactly `"<page title> (<anchor>)"` — the pattern is
  perfectly consistent, so it can be undone mechanically.
- `normalizeTitleForLookup()` previously stripped only `(N)` dose suffixes and
  `(unpoisoned)`, which covers roughly 1,500 of them. The rest silently failed.

Most common version labels: `2 dose`, `1 dose`, `Unpoisoned`, `Normal`, `4 dose`,
`3 dose`, `Broken`, `Inventory`, `Poison`, `Poison+`, `Poison++`, `Uncharged`,
`Un-attuned`, `Inactive`, `Charged`, `Locked`, `Worn`, `Attuned`, `Undamaged`,
`Unpolished`, `Polished`, `Active`, `Empty`, `Watered`, `Unwatered`, …

So this is **not** a seedling-specific problem. Watered seedlings are just the instance
that surfaced, because saplings sort to the top of the ROI list.

### Why a regex on `wiki_name` is the wrong fix

**4,257** items have a `wiki_name` that legitimately ends in a parenthetical _and_ is a
real page title — `Longbow (u)`, `Oak shortbow (u)`, `Holy grail (item)`, `Ring of
charos (a)`. Blindly stripping a trailing `(...)` would corrupt all of those.

`wiki_url` is the reliable discriminator. Verified across the whole dataset:

- anchored items where `wiki_name` does **not** start with the URL's page title: **0**
- items with a `wiki_url` but no `wiki_name`: **0**

So: **if `wiki_url` contains a `#`, the page title is the part before it and the version
is the part after it.** No guessing, no heuristics.

## The fix

`src/lib/helpers/wiki-page-title.ts` derives, from `wiki_url` (authoritative) with a
`wiki_name`/`name` fallback:

- `wiki_page_title` — the real, fetchable wiki page title (`Oak seedling`)
- `wiki_version` — the infobox version label, or `null` (`Watered`)

These are persisted as new fields on the item document. `wiki_name` and `wiki_url` are
left untouched, so nothing that already relies on them changes behaviour, and the
variant information is preserved rather than thrown away.

Applied in three places so the data cannot drift back:

1. **`scripts/grab-osrsbox-items.ts`** — stamps the fields on every upsert, so a fresh
   import is correct from the start. (Without this, re-running the import would
   reintroduce the problem on every update.)
2. **`scripts/backfill-missing-items.ts`** — same, for items sourced from the price
   mapping / wiki rather than from OSRSBox.
3. **`scripts/normalize-wiki-names.ts`** — a standalone, idempotent repair pass over the
   existing collection, wired into `scripts/update-db.ts` as the `wiki-names` step so it
   runs before `populate-ingredients`.

`scripts/populate-ingredients.ts` then scrapes `wiki_page_title` instead of `wiki_name`.

## The second defect: untradeable ingredients priced at 1gp

Fixing the names lets watered seedlings acquire `creationSpecs`, but on its own it does
**not** fix the "saplings show ≤1gp investment / absurd ROI" symptom. That has an
independent cause, also fixed here.

The profit/ROI aggregation in `src/lib/services/game-item-mongo-service.server.ts` priced
an ingredient as `highPrice ?? lowPrice ?? cost`. A watered seedling is untradeable, so
it has no `highPrice`/`lowPrice` and fell through to `cost` — the game's base value of
**1**. `Oak sapling` therefore reported a creation cost of 1gp and an ROI of ~31,500%,
which is why saplings dominated the new ROI sort.

`cost` is now used only for ingredients that are actually tradeable on the GE. An
untradeable ingredient is priced as _unknown_, which nulls the creation cost and keeps
the item out of the profit and ROI sorts rather than letting it top them on a fabricated
number. `game-item-creation-cost-table.svelte` applies the same rule client-side, where
the recursive walk it already does surfaces the real underlying cost on the child rows.

Note the list pipeline still only descends **one** level (`primarySpec.ingredients`), so
it does not sum an item's full creation tree. Making saplings show their _true_ acorn-based
investment (rather than dropping out as unknown) would mean either recursing in the
aggregation or precomputing an effective value per item offline, in the style of
`compute-creation-tree-skills.ts`. That is a larger change and is not attempted here.

## Status

- [x] Root cause identified and quantified against the full dataset
- [x] `wiki_url` validated as authoritative (0 counterexamples in 28,744 items)
- [x] `src/lib/helpers/wiki-page-title.ts` + unit tests
- [x] Schema fields `wiki_page_title` / `wiki_version`
- [x] `grab-osrsbox-items.ts` stamps derived fields
- [x] `backfill-missing-items.ts` stamps derived fields
- [x] `normalize-wiki-names.ts` repair script
- [x] `update-db.ts` wires in the `wiki-names` step
- [x] `populate-ingredients.ts` scrapes the derived title
- [x] Untradeable ingredients no longer priced from `cost`
- [ ] **Run against the live database** — see below

## Running it

The repair pass is idempotent and supports a dry run:

```bash
bun run normalize-wiki-names -- --dry-run   # report only
bun run normalize-wiki-names                # write
```

It is also step `wiki-names` of `bun run update-db`, so a normal refresh picks it up
automatically. `--skip-wiki-names` opts out.

After it has run, re-run `populate-ingredients` so the ~8,300 previously unresolvable
items get their creation trees:

```bash
bun run populate-item-ingredient-trees
```

## Reading the numbers

Two different counts get quoted about this migration, and confusing them makes the
change look far bigger than it is.

| Count                                 | Value      | Meaning                                                                                                                 |
| ------------------------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------- |
| Documents written                     | **28,744** | Every item. `wiki_page_title` / `wiki_version` are new fields, so every document gains them on the first run.           |
| Titles that differ from `wiki_name`   | **9,209**  | Items that will now resolve to a _different_ wiki page.                                                                 |
| ...of which carry a `#version` anchor | **8,377**  | The switch-infobox items — the actual defect.                                                                           |
| ...of which have no `wiki_url` at all | **832**    | `wiki_name` is null; the derivation falls back to `name`, which is what the old code already used. No behaviour change. |
| Items untouched entirely              | **0**      | Every item derives _something_.                                                                                         |

So the write count is the whole collection by construction, and it is not a measure of
impact. Only 9,209 items change behaviour, and only 8,377 of those are the bug. The
migration adds two fields and never modifies `name`, `wiki_name` or `wiki_url`, so
anything reading those is unaffected.

`normalize-wiki-names.ts` prints both figures side by side so the write count cannot be
mistaken for the blast radius.

## Blast radius

`wiki_page_title` / `wiki_version` are read by exactly one consumer:
`scripts/populate-ingredients.ts`, via `wikiTitleCandidates()`. No route, component or
service reads them. Everything still reading `wiki_name` — the item detail page, the
upload dialog, `find-ingredient-cycles.ts`, the items API — sees byte-identical data.

## Verification performed

- Unit tests: `bun test` — 16 pass with no database; 19 pass with one.
- Whole-dataset replay of the derivation over `items-complete.json` (28,744 items):
  9,209 titles changed, 19,535 left byte-identical, **0 mangled** (every derived title
  is a prefix of the `wiki_name` it came from).
- 6,215 derived titles legitimately end in `(...)` — e.g. `Longbow (u)`,
  `Holy grail (item)`. A regex that stripped trailing parentheses from `wiki_name`
  would have corrupted all of them. Deriving from `wiki_url` leaves them intact.
- **Full live-wiki validation** of every distinct page title involved, via the
  MediaWiki API:

    | Titles                                  | Resolve                    |
    | --------------------------------------- | -------------------------- |
    | Derived (`wiki_page_title`)             | **1,329 / 1,330 — 99.92%** |
    | Old (`wiki_name`, what the scrape used) | **148 / 4,350 — 3.40%**    |

    The single failure is `Kebbit (unobtainable item)`, backing 12 untradeable items
    whose wiki page has been deleted upstream. Its `wiki_name` 404s too, so this is stale
    OSRSBox data rather than a regression.

- Aggregation behaviour covered by `src/lib/services/game-item-creation-cost.test.ts`,
  which runs against a real MongoDB:

    ```bash
    docker run -d --rm -p 27018:27017 mongo:7
    bun test
    ```

    The suite skips itself when no such instance is reachable.

## Known unrelated bug this exposes

`src/routes/items/[id=integer]/+page.svelte` builds its "view on wiki" link from
`wiki_name`, so that link 404s for the same 8,377 items. It is a one-line fix — prefer
the stored `wiki_url`, which already carries the correct anchor — but it is a UI change
and is deliberately left out of this migration.
