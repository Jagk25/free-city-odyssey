# FREE CITY — Prototype → Real Game: Transformation Roadmap

## Where we are
A single-file HTML5 canvas prototype (~83KB) with: 28x28 isometric world, 14
buildings with walkable interiors, 10 AI citizens + seekers, cutscene engine,
dialogue trees, 9 mini-games, side quests, day/night, weather, traffic,
procedural audio, and localStorage saves.

## Phase 0 — Repository & hosting (NOW)
- GitHub repo `free-city-odyssey` with index.html + docs
- Enable GitHub Pages -> instantly playable public URL
- Branching: `main` (stable) + `dev` (active work), PR-per-feature

## Phase 1 — Codebase modularization (week 1-2)
Split the monolith into ES modules under /src:
- /src/engine: renderer, input, audio, save, loop, camera
- /src/game: world data, NPC AI, quests, dialogue, puzzles, cutscenes
- /src/data: buildings.json, npcs.json, quests.json, dialogue.json, riddles.json
- Tooling: Vite (dev server + bundling), ESLint, Prettier
- Why: data-driven content means new buildings/quests/puzzles ship as JSON,
  not code changes. This is the single biggest velocity unlock.

## Phase 2 — Renderer upgrade (week 3-4)
Options, in order of recommendation:
1. **PixiJS (WebGL)** — keeps our canvas-style 2D code, 10-50x draw throughput,
   filters (bloom for Glitch Vision!), particle containers. Lowest-risk jump.
2. **Phaser 3** — full game framework (scenes, tweens, arcade physics,
   tilemaps). Best if we want built-in structure over custom engine work.
3. Keep Canvas2D — fine for prototype, will cap visual ambition.
Target: 60fps with 100+ entities, real lighting layer, sprite sheets
(Aseprite) replacing procedural rects.

## Phase 3 — Content pipeline (week 4-6)
- Maps: Tiled editor -> JSON -> engine loader (replaces hand-placed arrays)
- Art: Aseprite sprite sheets, 4-direction walk cycles, building tilesets
- Writing: dialogue trees in JSON with a validation script (no dead nodes)
- Audio: composed loops (or CC0 packs) via Howler.js, keeping the procedural
  engine as fallback

## Phase 4 — Systems hardening (week 6-8)
- Save versioning + migration (current saves break between versions)
- Deterministic sim tick decoupled from render (fixes tab-switch drift)
- NPC pathfinding: A* on the road graph (replaces steering + stuck hacks)
- Gamepad support (Gamepad API), remappable keys
- i18n scaffolding (all strings in locale files)
- Automated smoke tests: headless Puppeteer run — load page, assert no
  console errors, simulate movement into every door (regression-tests the
  doorway bug class we just fixed)

## Phase 5 — Release packaging (week 8-10)
- PWA: installable, offline-first, home-screen icon
- itch.io HTML5 upload (free, discoverable)
- Optional: Capacitor wrapper -> iOS/Android; Electron -> Steam later
- Analytics-light: anonymous opt-in funnel (intro completion, ending reached)

## Team/agent workflow
- Issues per feature with acceptance criteria; milestones per phase
- Agent swarm roles: see AGENTS.md (7 agents, thinking protocol, gates)
- Every PR: QA smoke test + one gameplay screenshot/video

## Immediate next actions
1. Push v9.1 to GitHub (this commit)
2. Enable Pages -> share playable link
3. Open Phase-1 issues (modularization)
