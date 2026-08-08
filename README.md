# Free City: Odyssey

A living-city story RPG that runs entirely in your browser. You are NOA, a
background citizen who notices the city's loop stutter. Explore six districts,
enter all 14 buildings, befriend AI citizens with real needs and memories,
solve nine different mini-games, gather the six hidden fragments, and choose
the city's ending.

## ▶ Play

**Live build:** https://jagk25.github.io/free-city-odyssey/ (auto-deployed
from `main` via GitHub Pages)

**Run locally:**

```bash
npm install
npm run dev        # http://localhost:5173
```

**Production build:** `npm run build` → `dist/`

## Controls

| Action | Keyboard | Touch | Gamepad |
|---|---|---|---|
| Move | WASD / Arrows | D-pad | Left stick / D-pad |
| Interact | E / Enter | ACT button | A |
| Glitch Vision | V | — | Y |
| Pause | Esc / P | — | Start |

## Features

- **Living city:** 28×28 isometric world, 6 districts, day/night cycle,
  dynamic weather (clear / neon rain / fog), traffic, birds, fountains.
- **AI citizens:** 10 named NPCs with energy/social/curiosity needs, utility
  AI, A* pathfinding, memory of your kindness. Seekers hunt you down when
  they need you.
- **14 enterable buildings:** walkable interiors with furniture collision,
  resident NPCs, hidden items, and puzzle terminals.
- **9 mini-games:** Memory Lock, Combination Lock, Signal Relink, Vault
  Cipher (Mastermind), Riddles, Reflex Circuit, The Haggle, The Lineup.
- **Story:** full main chain with cutscenes and two different endings.
  Side quests: Lost Cat, Package Run, Photo Tour.
- **Progression:** XP/levels, cash, reputation, energy, inventory, item
  trading, Glitch Vision fragments.
- **PWA:** installable, fully offline after first load, haptics on mobile.
- **Zero backend, zero assets:** procedural Web Audio soundtrack + SFX.

## Development

```bash
npm test           # unit suites (Vitest)
npm run test:e2e   # Playwright: boot, clock, doorway regression, interiors, story, soak
npm run typecheck  # strict TypeScript
npm run build      # production bundle
```

## Architecture

- `src/engine/` — deterministic 60Hz loop, input, camera, audio, save, rng, pool
- `src/game/` — world sim: NPCs, seekers, quests, dialogue, cutscenes, vision, events
- `src/render/` — PixiJS: sky, city, entities, interiors, particles, traffic
- `src/minigames/` — pure logic cores + DOM host
- `src/interiors/` — room runtime
- `src/ui/` — DOM HUD + minimap
- `src/data/*.json` — all content (buildings, NPCs, quests, dialogue, cutscenes, items)

Governance: `AGENTS.md` (swarm roles), `ARCHITECTURE.md`, `DECISIONS.log`
(ADRs), `STATE.md` (phase gates), `docs/FREE_CITY_KIMI_K3_BUILD_PLAN.md`
(full spec + phase prompts).

## License

All code, story, and art are original. Procedural audio — no external assets.
