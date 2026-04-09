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
- `src/styles/` — Global CSS and layout.

## Code Style
- Functional components with hooks only
- Prefer `useReducer` for game state (single immutable state tree)
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

## Layout
- Fully responsive, fills the entire viewport
- CSS Grid layout with four panels: top (skills), center (inventory), bottom (actions), right (queue)
- Dark theme by default

## Game Design
- See `ContinuumGameDesign.md` for the full design document (untracked)
- 100ms tick system drives all game logic
- Icons from game-icons.net (CC BY 3.0)
