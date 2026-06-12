# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Park It!** — a top-down parking mini-game. Pure client-side HTML5 Canvas 2D, no runtime dependencies. Bundled with Vite. `index.html` (repo root) is Vite's entry: the `<canvas id="game" width="960" height="600">`, the HUD bar, and `<script type="module" src="/src/main.js">`.

`src/` is split into single-responsibility ES modules:

- `main.js` — entry: the rAF loop, input handlers, `startRun`/`initSound`. Imports `style.css`.
- `canvas.js` — `cvs`, `ctx`, `W`, `H` (the shared 2D context and fixed dimensions).
- `state.js` — the global `G` state object, `car`, and the mutable level arrays (`slots`/`obstacles`/`movers`/`level.target`).
- `config.js` — tuning data and constants: `CHARACTERS`, `DIFF`, `MSG`, `PALETTE`, fonts, car/physics constants.
- `sprites.js` — inline SVG sprites → `Image` objects, HUD avatars, sound icons.
- `util.js` — `rand`, `pick`, `rectCorners`.
- `geometry.js` — OBB/SAT collision (`corners`, `obbHit`, `insideSlot`, `circleHitsCar`).
- `level.js` — `makePlan`, the three layout builders, `buildLevel`.
- `movers.js` — spawn/update of grannies, carts, traffic.
- `simulation.js` — `updatePlay` (the per-frame game logic), `crash`, `calcStars`.
- `audio.js` — WebAudio synthesis, `sfx`, engine sound, mute.
- `render.js` — all `draw*` functions, `overlay`, `roundRect`, `syncHUD`.

Everything is inline: SVG sprites are data URIs decoded into `Image` objects, all sound is synthesized at runtime via WebAudio, fonts come from Google Fonts. No assets directory, no network calls at play time.

## Running & deploying

```sh
npm install      # first time
npm run dev      # dev server with HMR
npm run build    # minified production bundle → dist/
npm run preview  # serve the built dist/ locally
```

There is no lint or test tooling.

Deployment is automatic: `.github/workflows/static.yml` runs `npm ci && npm run build` and uploads **`dist/`** to GitHub Pages on every push to `main`. `vite.config.js` sets `base: './'` so the hashed asset URLs are relative — required because Pages serves this project under the `/park-it/` subpath. Changing the build output dir means updating both `vite.config.js` and that workflow's `path:`.

## Architecture

The whole game is driven by **one global state object `G`** and **one `requestAnimationFrame` loop** (`frame()` at the bottom of `game.js`).

### Scene state machine
`G.scene` is one of `title | menu | play | crashed | parked | timeup`. `frame()` switches on it: `title`/`menu` just draw their screen; the other four run the in-game render path, and only `play` advances simulation via `updatePlay(dt)`. Scene transitions happen almost entirely inside the `keydown` handler (Enter/R/Esc) and in `updatePlay` (crash → `crashed`, park success → `parked`, timer → `timeup`).

### Frame budget & time
`dt` is clamped to `1/30` so a stutter can't tunnel the car through a wall. All motion is `dt`-scaled; `tSec = now/1000` drives cosmetic pulsing/blinking.

### Level generation pipeline
`makePlan(lvl)` → picks `{layout, reverseIn, night}` with **hard-coded introductions** (level 4 = parallel, 5 = back-in, 6 = diagonal, 8 = night) so mechanics teach in order. `buildLevel()` then:
1. Calls one of `layoutStandard` / `layoutParallel` / `layoutDiagonal` to fill the `slots[]` array and set `G.laneTop`/`G.laneBottom` (the drivable corridor).
2. Picks a non-edge `targetSlot`, fills other slots with parked-car `obstacles[]`.
3. `spawnMovers(lvl)` **first**, then lane obstacles are **rejection-sampled** against the target corridor, the spawn zone, parked cars, and every mover's path — order matters, movers reserve their lanes before static obstacles fill in.
4. Sets the time limit (scaled by difficulty + mechanic slack).

Difficulty (`DIFF.normal` / `DIFF.hard`) multiplies steering rate/limit, slot width, and time. The chosen character (`CHARACTERS`) maps 1:1 to a difficulty id.

### Car physics
Kinematic **bicycle model** in `updatePlay`: integrates separate front/rear axle points `WHEELBASE` apart, then derives heading from their delta. Steering eases toward a target rather than snapping. `CAR_LEN/CAR_W/WHEELBASE` and the accel/drag constants are the handles for feel.

### Collision & parking geometry
`corners()` builds an oriented bounding box; `obbHit()` is a SAT test between two OBBs; `insideSlot()` transforms the car's corners into slot-local space; `circleHitsCar()` does circle-vs-OBB for pedestrians/carts. Parking succeeds when the car is inside the target slot, nearly stopped, (on back-in levels) facing outward, and held there for 0.6s (`G.parkHold`). `calcStars()` grades the final pose.

### Movers
`movers[]` holds `granny` (meandering pedestrian), `cart` (straight-line runaway), and `traffic` (cross-lane car). Spawn counts gate on level. `updateMovers(dt)` handles their motion and off-screen re-spawning; each type has distinct collision handling in `updatePlay`.

### Rendering
All `draw*` functions write to the single 2D `ctx`. Night levels composite an **offscreen fog canvas** (`drawNight`) using `destination-out` to punch headlight/beacon holes. The HUD is **DOM, not canvas** — `syncHUD()` writes `textContent` into `#hud` elements each frame and toggles visibility by scene.

### Audio
Lazily-created `AudioContext` (resumed on first Enter/click to satisfy autoplay policy). `beep()`/`noiseBurst()` are the primitives; `sfx` is the named-effect table; `engineUpdate()` drives a continuous oscillator from car speed. Everything routes through `masterGain`, which mute toggles to 0. Mute is the only persisted state (`localStorage 'parkit-muted'`).

## Conventions that matter

- **Shared mutable state crosses module boundaries via in-place mutation, not reassignment.** `G`, `car`, and the `slots`/`obstacles`/`movers` arrays are exported once from `state.js` and never reassigned — `buildLevel` clears the arrays with `.length = 0` so every importer keeps a live reference. The one reassignable level reference lives on the `level` object as `level.target` (do **not** reintroduce a bare `let targetSlot`, which can't be reassigned across modules under ES live bindings).
- The canvas is a **fixed 960×600 internal resolution**; click coordinates are scaled back from the displayed size (`W/r.width`) in the click handler. Don't hardcode pixel positions assuming the CSS size.
- New game mechanics generally touch four places in concert: `makePlan` (when it appears), a layout/spawn builder (geometry), `updatePlay` (rules/collision), and a `draw*` (visuals). The rejection-sampling in `buildLevel` is what keeps generated levels solvable — preserve it when adding obstacles.
