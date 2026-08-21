# Wiki name normalization

## The problem

OSRSBox (`osrsreboxed-db`) does not store the real OSRS Wiki page title for items that
live on a "switch infobox" page. Instead it synthesises `wiki_name` by appending the
infobox **version label** in parentheses, and points `wiki_url` at an anchor:

| field       | value                                                   |
| ----------- | ------------------------------------------------------- |
| `id`        | `5364`                                                  |
| `name`      | `Oak seedling (w)`  ← real in-game name                 |
| `wiki_name` | `Oak seedling (Watered)`  ← **synthetic, not a page**   |
| `wiki_url`  | `.../w/Oak_seedling#Watered`                            |

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

**4,257** items have a `wiki_name` that legitimately ends in a parenthetical *and* is a
real page title — `Longbow (u)`, `Oak shortbow (u)`, `Holy grail (item)`, `Ring of
charos (a)`. Blindly stripping a trailing `(...)` would corrupt all of those.

`wiki_url` is the reliable discriminator. Verified across the whole dataset:

- anchored items where `wiki_name` does **not** start with the URL's page title: **0**
- items with a `wiki_url` but no `wiki_name`: **0**

So: **if `wiki_url` contains a `#`, the page title is the part before it and the version
is the part after it.** No guessing, no heuristics.

## The fix

`scripts/lib/wiki-name.ts` derives, from `wiki_url` (authoritative) with a
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

## Related, but a separate defect

Fixing the names lets watered seedlings acquire `creationSpecs`. It does **not** on its
own fix the "saplings show ≤1gp investment / absurd ROI" symptom.

The profit/ROI aggregation in `src/lib/services/game-item-mongo-service.server.ts` prices
an ingredient as `highPrice ?? lowPrice ?? cost`. A watered seedling is untradeable, so
it has no `highPrice`/`lowPrice` and falls back to `cost`, which is the game's base value
of **1**. The pipeline also only descends **one** level (`primarySpec.ingredients`), so
the acorn that represents the real outlay never enters the sum.

Net effect: `Oak sapling` reports a creation cost of 1gp and an ROI of ~31,600%.

That needs its own change (either treat "untradeable and unpriced" as *unknown* cost
rather than `cost`, or recurse into the ingredient's own creation tree). Tracked
separately — see the PR discussion.

## Progress checklist

- [x] Root cause identified and quantified against the full dataset
- [x] `wiki_url` validated as authoritative (0 counterexamples in 28,744 items)
- [ ] `scripts/lib/wiki-name.ts` + unit tests
- [ ] Schema fields `wiki_page_title` / `wiki_version`
- [ ] `grab-osrsbox-items.ts` stamps derived fields
- [ ] `backfill-missing-items.ts` stamps derived fields
- [ ] `normalize-wiki-names.ts` repair script
- [ ] `update-db.ts` wires in the new step
- [ ] `populate-ingredients.ts` scrapes `wiki_page_title`
- [ ] Verified against the live database (**blocked: no `.env` / Mongo credentials**)

## Resuming this work

The analysis above is complete and does not need redoing. Reference data used for the
measurements can be re-downloaded with:

```bash
curl -sL -o items-complete.json \
  https://raw.githubusercontent.com/0xNeffarion/osrsreboxed-db/master/docs/items-complete.json
```

Branch: `claude/wiki-name-version-suffix-normalization` (based on the profit/ROI branch
`claude/ge-skiller-profit-roi-ui-3154eh`, which merges to `main` as-is).
