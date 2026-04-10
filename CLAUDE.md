# Continuum — Project Conventions

## Tech Stack
- **TypeScript** (strict mode) + **React 19** + **Vite**
- **Vitest** for testing
- Plain CSS with custom properties (no Tailwind, no CSS-in-JS)
- Deployed to **GitHub Pages** via GitHub Actions on push to `main`

## Architecture
- `src/engine/` — Pure game logic. No React imports. All functions are pure (state in, state out).
- `src/data/` — Static game definitions (skills, actions, items, scenes). Treat as read-only config. `actionDefinitionMap` provides O(1) lookups by action ID.
- `src/hooks/` — React hooks that bridge the engine to the UI.
- `src/components/` — Functional React components only. No class components.
- `public/icons/` — SVG icons from game-icons.net.

## Key Design Decisions

### Scenes & Acts
The game is organized into Acts containing Scenes. Each scene defines which actions are available via `actionIds`. Actions can appear in multiple scenes. Completing an action with `leadsToScene` transitions the player to a new scene and clears the queue. Scenes reset to `act1-scene1` on rebirth.

### Automation
Actions track global completion counts (`actionCompletionCounts`). After reaching a threshold (200 for repeatable, 5 for one-time), automation unlocks. Players cycle modes via the priority button: Off → AN → 1 → 2 → 3 → 4 → 5 → Off. Numeric priorities (1 highest) are stored in `automationSettings`. The "AN" (As Needed) mode is stored in `asNeededActions` and fires reactively, not passively: AN producers are injected at the front of the queue with a finite `targetCount` when a downstream action stalls on a missing material, or when a food item drops to 0 (gathered until full). Passive automation fills one action at a time when the queue empties; logic lives in `src/engine/automation.ts` and `src/engine/tick.ts`.

### Incremental Cost Consumption
Actions with item costs (e.g., Wooden Cart needs 10 wood) consume resources **one at a time** as progress advances, not all at once on completion. Each unit funds a fraction of the total progress (`expCost / totalUnits`). If resources run out mid-build, the action stalls — progress and consumed costs are saved to `stalledActionProgress` on `GameState` and restored when the action is re-queued (manually or via automation). This is tracked via `costsConsumed` on `QueuedAction`.

### State Management
`useReducer` with a single immutable `GameState` object. The reducer dispatches to pure engine functions. No Context needed yet — state is passed as props from `App.tsx`.

### Game Loop
`setInterval` at 100ms dispatching `TICK`. Starts/stops based on `isPaused`. The tick function short-circuits when paused or queue is empty. Players can toggle pause via spacebar or clicking the play/pause indicator in the queue panel. User-initiated pauses display "Paused by User" (tracked via `pausedByUser` on `GameState`).

## Code Style
- Functional components with hooks only
- Engine functions must be testable without React — no side effects, no DOM access
- Use TypeScript strict mode; avoid `any`

## Testing
- Engine logic: unit tests with Vitest (`src/engine/__tests__/`)
- Run tests: `npm test` (single run) or `npm run test:watch` (watch mode)
- Type check: `tsc -p tsconfig.app.json` (not root tsconfig)

## Workflow
- All new work goes in a **feature branch**
- Test locally before merging to `main`
- Push to `main` triggers automatic deployment to GitHub Pages
- Never commit directly to `main`

## Versioning
- Version is `package.json` version + short git commit hash + build timestamp (e.g., `v0.2.0 · a71e3ac · 5:30:00 PM`)
- Displayed in the footer bar at the bottom of the game
- Build timestamp updates when Vite restarts, useful for confirming fresh code during development
- Bump `package.json` version for significant changes

## Layout
- Fully responsive, fills the entire viewport
- CSS Grid layout with 3-column body: Actions (left), Inventory (center), Queue (right)
- Health bar and skills span the full width above
- Footer bar at the bottom contains debug button and version label
- Dark theme by default
- Skill and action panels use `overflow: visible` with `z-index` so tooltips aren't clipped
- Tooltips use `position: fixed` with `z-index: 9999` to escape stacking contexts
- Actions grouped by category (Gathering, Construction, Exploration)
- Inventory grouped by category (Provisions, Materials)
- Skill cards stretch equidistantly across the row (`flex: 1` with `space-between`)
- Health bar is double-height with the timer / HP / damage stats overlaid centered on top of the fill

## Debug Overlay
- Only available on `localhost` (checked via `window.location.hostname`)
- Opened via a "Debug" button in the footer bar
- Closed with Escape key or close button
- Includes "Restart Game" to clear all progress and localStorage

## Game Design
- See `ContinuumGameDesign.md` for the full design document (untracked, in .gitignore)
- 100ms tick system drives all game logic
- Icons from game-icons.net (CC BY 3.0)
- Save/load: auto-saves to localStorage every 30s and on page unload
