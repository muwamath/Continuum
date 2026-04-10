# Continuum

An incremental/idle game inspired by [Increlution](https://store.steampowered.com/app/1593350/Increlution/).

## Features

- **Scenes & Acts** — progression through scenes, each with unique available actions
- 4 skills (Harvest, Logging, Construction, Agility) with dual mastery systems
- Action queue with front/back insertion and cancel
- **Automation** — actions unlock auto-queue after enough completions, with priority-based ordering
- Incremental resource consumption — actions consume materials one at a time as they progress
- Inventory with capacity upgrades, grouped by category (Provisions, Materials)
- Tooltips with descriptions and stats on actions and inventory items
- Health, rebirth, and survival mechanics
- Auto-save to localStorage
- Fully responsive dark-theme UI with 3-column layout
- Debug overlay on localhost for testing and tuning

## Tech Stack

- TypeScript (strict)
- React 19
- Vite
- Vitest (testing)
- GitHub Pages (deployment)

## Getting Started

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173/Continuum/`).

## How to Play

- Click an action on the left to add it to the queue. The game runs at 100ms per tick.
- The active action is the front of the queue. Cancel any queued action with the X button — partial progress and consumed resources are saved and restored if you re-queue it.
- Press **spacebar** or click the play/pause indicator above the queue to toggle pause.
- Eat is automatic when health is low and food is available.
- After enough completions, an action unlocks **automation**. Cycle modes via the priority button: **Off → AN → 1 → 2 → 3 → 4 → 5 → Off**.
  - **1–5**: passive priority (1 runs first). One action fills the queue when it empties.
  - **AN** (As Needed): reactive — only runs when something needs it. Material producers fire when a downstream action stalls on a missing material; food producers fire when the food count hits 0 and run until full.
- When you die, rebirth grants a permanent health bonus based on how long you survived. Scenes and inventory reset; completion counts and automation settings persist.
- Surviving **15 minutes in a single run** earns **1 skill point**. Spend skill points on the death screen to permanently unlock perks: **Iron Stomach** (less health decay), **Quick Learner** (lower automation thresholds), and **Hearty Meals** (more food healing). Skill points and perks both carry across rebirths.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start local dev server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build locally |
| `npm test` | Run tests (single run) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | Lint with ESLint |

## Development Workflow

1. Create a feature branch from `main`
2. Develop and test locally (`npm run dev`, `npm test`)
3. When ready, merge to `main` and push
4. GitHub Actions automatically deploys to Pages

## Deployment

Pushing to `main` automatically deploys to GitHub Pages via GitHub Actions.

## Icon Attribution

Game icons by [game-icons.net](https://game-icons.net/) contributors, licensed under [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/):
- Lorc: wheat, hammer-nails, run, smash-arrows, blackcurrant (berry)
- Skoll: logging
- Delapouite: upgrade, wood-pile (wood)
- Guard13007: pause-button, play-button
- Sbed: cancel
- DarkZaitzev: big-gear

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
