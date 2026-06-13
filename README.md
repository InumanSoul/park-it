# 🅿️ Park It!

A top-down parking game about precision, patience, and not hitting Doris.

**▶️ [Play it here](https://inumansoul.github.io/park-it/)**

Steer a car into the highlighted spot before the clock runs out — dodge parked cars,
runaway shopping carts, wandering pedestrians, and cross-traffic. You get **3 lives**;
how far up the level ladder can you climb before you run out? Post your run to the
**public leaderboard** and see how you stack up.

## Features

- 🚗 **Real car handling** — kinematic bicycle-model steering with forgiving (Normal) or twitchy (Hard) characters.
- 🅿️ **Four parking challenges** — standard, **parallel**, diagonal, and **back-in only** slots that get tighter as you climb.
- 🌃 **Night shifts** — headlight cones and fog on later levels.
- 🛒 **Hazards** — parked cars, shopping carts, pedestrians (Doris), and cross-traffic.
- ❤️ **Lives** — 3 hearts; crashes and time-outs cost one. Lose them all and your run is scored.
- 🏆 **Public leaderboard** — submit a nickname, ranked by level reached (stars break ties), with separate Normal/Hard boards.
- 🔊 Fully synthesized sound (WebAudio) and inline SVG art — **zero asset files**.

## Controls

| Key | Action |
| --- | --- |
| ↑ / ↓ | Accelerate / reverse |
| ← / → | Steer |
| `R` | Retry the current level |
| `H` | Honk |
| `M` | Sound on/off |
| `L` | Open the leaderboard (from the title) |
| `Esc` | Back |

## Tech

Vanilla JavaScript on an HTML5 Canvas — no game engine, no runtime dependencies — bundled
with [Vite](https://vitejs.dev/). The leaderboard is a [Cloudflare Worker](https://workers.cloudflare.com/)
backed by D1 (SQLite). Deployed to GitHub Pages via GitHub Actions.

## Develop

```sh
pnpm install
pnpm dev        # dev server with hot reload
pnpm build      # production bundle → dist/
pnpm preview    # serve the built bundle
```

The game code lives in `src/` as small single-responsibility ES modules (state, level
generation, physics, collision, movers, audio, rendering, leaderboard). See
[`CLAUDE.md`](./CLAUDE.md) for an architecture tour.

## Leaderboard backend

The Cloudflare Worker lives in [`leaderboard-worker/`](./leaderboard-worker/) and deploys
separately from the game (GitHub Pages only serves `dist/`). It validates and rate-limits
every submission server-side. See its [README](./leaderboard-worker/README.md) to deploy
your own; then set `LEADERBOARD_URL` in `src/config.js`. Leave it empty and the leaderboard
quietly disables — the game still runs.

## Credits

Made by [Anderson Fariña](https://inumansoul.com). Contributions and bug reports welcome —
open an [issue or PR](https://github.com/InumanSoul/park-it).
