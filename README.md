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
