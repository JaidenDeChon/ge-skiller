# GE Skiller

SvelteKit application for Old School RuneScape skilling and Grand Exchange browsing. Developed primarily with [Bun](https://bun.sh/) as the runtime.

## Project overview
- Root landing page renders a hero image (random NPC) and FAQ content driven by a server load function.
- Global layout (`src/routes/+layout.svelte`) provides navigation/sidebar, header, toaster, and enables view transitions; server load injects a `showDevControls` flag.
- Routes live under `src/routes/` using SvelteKit's file-based routing:
  - Landing (`+page.*`).
  - `items/` tree for browsing/searching items, with skill-specific subroutes and item detail routes.
  - Additional feature routes like `favorites/` and `hidden/`, plus API routes under `api/` (e.g., `api/game-items`).
- Shared components live under `src/lib/components/`, UI helpers in `src/lib/helpers`, constants in `src/lib/constants`, and models in `src/lib/models`.
- Styling comes from `src/app.css` with Tailwind utilities configured via `tailwind.config.ts` and related config files.

## Key feature areas
- **Item browsing UI**: `src/lib/components/items/game-items-page.svelte` handles filtering, pagination, skill-based availability, fetches `/api/game-items`, and renders cards with pagination controls.
- **Data/services**: `src/lib/services/` wraps external APIs (e.g., OSRS wiki) and persistence layers for item data/pricing, including `grand-exchange-api-service.ts` for cached price and timeseries fetches.
- **State & preferences**: Svelte stores in `src/lib/stores/` persist character profiles, favorites/hidden flags, and item-page filters across sessions.
- **Helpers**: Utilities for formatting numbers, time, skill defaults, and related helpers reside alongside constants and models.

## Getting started
- Install dependencies (Bun preferred):
  ```bash
  bun install
  ```
- Start the dev server:
  ```bash
  bun run dev
  # or open automatically
  bun run dev -- --open
  ```

## Building & previewing
```bash
bun run build
bun run preview
```

## Where to explore next
- Trace data flow from `src/routes/items/+page.svelte` → `src/lib/components/items/game-items-page.svelte` → `src/routes/api/game-items` → `src/lib/services/` for sourcing logic.
- Review stores in `src/lib/stores/` to see how user preferences persist.
- Follow patterns in `src/lib/services/grand-exchange-api-service.ts` when adding new data sources (centralized fetch helpers, typed responses, caching).

## Tooling
- Tailwind CSS utilities via `tailwind.config.ts`.
- Project configured for Bun-first workflows but compatible with Node package managers if needed.
