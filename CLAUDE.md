# Continuum — Project Conventions

## Tech Stack
- **TypeScript** (strict mode) + **React 19** + **Vite**
- **Vitest** for testing
- Plain CSS with custom properties (no Tailwind, no CSS-in-JS)
- Deployed to **GitHub Pages** via GitHub Actions on push to `main`

## Architecture
- `src/engine/` — Pure game logic. No React imports. All functions are pure (state in, state out).
- `src/data/` — Static game definitions (skills, actions, items). Treat as read-only config.
- `src/hooks/` — React hooks that bridge the engine to the UI.
- `src/components/` — Functional React components only. No class components.
- `public/icons/` — SVG icons from game-icons.net.

## Key Design Decisions

### Incremental Cost Consumption
Actions with item costs (e.g., Wooden Cart needs 10 wood) consume resources **one at a time** as progress advances, not all at once on completion. Each unit funds a fraction of the total progress (`expCost / totalUnits`). If resources run out mid-build, the action stalls and is removed. Canceling forfeits consumed resources. This is tracked via `costsConsumed` on `QueuedAction`.

### State Management
`useReducer` with a single immutable `GameState` object. The reducer dispatches to pure engine functions. No Context needed yet — state is passed as props from `App.tsx`.

### Game Loop
`setInterval` at 100ms dispatching `TICK`. Starts/stops based on `isPaused`. The tick function short-circuits when paused or queue is empty.

## Code Style
- Functional components with hooks only
- Engine functions must be testable without React — no side effects, no DOM access
- Use TypeScript strict mode; avoid `any`

## Testing
- Engine logic: unit tests with Vitest (`src/engine/__tests__/`)
- Run tests: `npm test` (single run) or `npm run test:watch` (watch mode)

## Workflow
- All new work goes in a **feature branch**
- Test locally before merging to `main`
- Push to `main` triggers automatic deployment to GitHub Pages
- Never commit directly to `main`

## Versioning
- Version is `package.json` version + short git commit hash (e.g., `v0.2.0-a71e3ac`)
- Displayed in the bottom-right corner of the game
- Bump `package.json` version for significant changes

## Layout
- Fully responsive, fills the entire viewport
- CSS Grid layout with four panels: top (skills), center (inventory), bottom (actions), right (queue)
- Dark theme by default
- Skill and action panels use `overflow: visible` with `z-index` so tooltips aren't clipped

## Debug Overlay
- Only available on `localhost` (checked via `window.location.hostname`)
- Opened via a "Debug" button in the bottom-right
- Closed with Escape key or close button
- Includes "Restart Game" to clear all progress and localStorage

## Game Design
- See `ContinuumGameDesign.md` for the full design document (untracked, in .gitignore)
- 100ms tick system drives all game logic
- Icons from game-icons.net (CC BY 3.0)
- Save/load: auto-saves to localStorage every 30s and on page unload
