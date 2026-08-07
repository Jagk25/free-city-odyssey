# ARCHITECTURE.md — Free City: Odyssey

Owned by: ARCHITECT agent (see AGENTS.md). Update via DECISIONS.log entry.

## Module map

| Module | Path | Responsibility |
|---|---|---|
| Boot | `src/main.ts` | Wire engine + renderer + world |
| Game loop | `src/engine/game-loop.ts` | Fixed 60Hz sim tick, render interpolation |
| Input | `src/engine/input.ts` | Keyboard now; touch/gamepad behind same API (P1/P7) |
| Save | `src/engine/save-system.ts` | Versioned localStorage, migration from prototype v0 |
| RNG | `src/engine/rng.ts` | Seeded deterministic RNG |
| Pool | `src/engine/pool.ts` | Object pooling for hot loops |
| Renderer iface | `src/render/renderer.ts` | IRenderer — PixiJS now, Canvas2D fallback possible |
| Pixi renderer | `src/render/pixi-renderer.ts` | WebGL scene (P0 boot scene; full graph in P2) |
| Iso math | `src/render/iso-math.ts` | grid <-> screen transforms |
| World | `src/game/world.ts` | Save state owner, autosave (entities arrive P3) |
| Data | `src/data/*.json` | All content: buildings, NPCs, quests, interiors, items, dialogue, strings |

## Data flow

input → world.update(dt) [fixed 60Hz] → state → renderer [every rAF, interpolated]

## Rules

1. Logic never imports from `render/` — only through `IRenderer`.
2. Content never lives in `.ts` logic — always `src/data/*.json`.
3. No runtime network calls. Everything bundled.
