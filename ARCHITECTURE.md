# ARCHITECTURE.md — Free City: Odyssey

Owned by: ARCHITECT agent (see AGENTS.md). Update via DECISIONS.log entry.

## Module map

| Module | Path | Responsibility |
|---|---|---|
| Boot | `src/main.ts` | Wire engine + renderer + world + audio unlock + touch binding |
| Game loop | `src/engine/game-loop.ts` | Fixed 60Hz sim tick; `tick()` exposed for deterministic tests |
| Input | `src/engine/input.ts` | Remappable keyboard + touch buttons + gamepad, one API |
| Camera | `src/engine/camera.ts` | Follow + bounds clamp, pure logic |
| Audio | `src/engine/audio.ts` | Gesture-gated WebAudio bus; procedural SFX + music sequencer |
| Save | `src/engine/save-system.ts` | Versioned localStorage, migration from prototype v0 |
| RNG | `src/engine/rng.ts` | Seeded deterministic RNG |
| Pool | `src/engine/pool.ts` | Object pooling for hot loops |
| Renderer iface | `src/render/renderer.ts` | IRenderer — PixiJS now, Canvas2D fallback possible |
| Pixi renderer | `src/render/pixi-renderer.ts` | WebGL scene: city from data, player sprite, follow camera |
| Iso math | `src/render/iso-math.ts` | grid <-> screen transforms |
| World | `src/game/world.ts` | Player movement (map-bounds clamp), save owner, autosave |
| Data | `src/data/*.json` | All content: map, buildings, NPCs, quests, interiors, items, dialogue, strings |

## Data flow

input (keyboard/touch/gamepad) → world.update(dt) [fixed 60Hz] → state →
renderer.setPlayerPosition + camera → renderer.begin/end [every rAF]

## Rules

1. Logic never imports from `render/` — only through `IRenderer`.
2. Content never lives in `.ts` logic — always `src/data/*.json`.
3. No runtime network calls. Everything bundled.
4. Engine modules stay pure where possible (camera, rng, save, audio data)
   so they are unit-testable in node without a DOM.
