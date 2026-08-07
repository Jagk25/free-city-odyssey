# ARCHITECTURE.md — Free City: Odyssey

Owned by: ARCHITECT agent (see AGENTS.md). Update via DECISIONS.log entry.

## Module map

| Module | Path | Responsibility |
|---|---|---|
| Boot | `src/main.ts` | Wire everything + audio unlock + touch binding + debug hooks |
| Engine | `src/engine/` | loop, input, camera, audio, save, rng, pool |
| World clock | `src/game/world-clock.ts` | Day/night cycle (pure) |
| Weather | `src/game/weather.ts` | Director state machine (pure) |
| Collision | `src/game/collision.ts` | Building footprints, axis-split sliding, bounds (pure) |
| Road graph | `src/game/road-graph.ts` | Walkable grid + A*, door-mat walkability gate (pure) |
| NPC | `src/game/npc.ts` | Needs, utility destination scoring, pathing, stuck recovery |
| Seekers | `src/game/seekers.ts` | Activation rules + path-to-player with "!" |
| Player | `src/game/player.ts` | 4-dir facing, walk phase, energy, collision slide |
| Cat | `src/game/cat.ts` | Wander / follow / home states |
| Events | `src/game/events.ts` | Robbery: flee, chase, arrest resolution |
| World | `src/game/world.ts` | Integration root for all sim systems + save owner |
| Render | `src/render/` | pixi-renderer, sky, city, particles, traffic, entities, iso-math, renderer |
| Data | `src/data/*.json` | All content: map, buildings, props, NPCs, quests, interiors, items, dialogue, strings |

## Data flow

input → world.update(dt) [fixed 60Hz] → sim (player, npcs, seekers, cat,
robbery, clock, weather) → RenderWorldState → renderer [every rAF]

## Rules

1. Logic never imports from `render/` — only through `IRenderer`.
2. Content never lives in `.ts` logic — always `src/data/*.json`.
3. No runtime network calls. Everything bundled.
4. Engine and AI modules stay pure where possible so they are node-testable.
5. Presentation-only systems (cars, particles, sky) live in render/ (ADR-0007).
6. AI may only target door mats, never building centers (ADR-0004).
