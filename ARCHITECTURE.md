# ARCHITECTURE.md — Free City: Odyssey

Owned by: ARCHITECT agent (see AGENTS.md). Update via DECISIONS.log entry.

## Module map

| Module | Path | Responsibility |
|---|---|---|
| Boot | `src/main.ts` | Wire engine + renderer + world + audio unlock + touch binding + debug hook |
| Game loop | `src/engine/game-loop.ts` | Fixed 60Hz sim tick; `tick()` exposed for deterministic tests |
| Input | `src/engine/input.ts` | Remappable keyboard + touch buttons + gamepad, one API |
| Camera | `src/engine/camera.ts` | Follow + bounds clamp, pure logic |
| Audio | `src/engine/audio.ts` | Gesture-gated WebAudio bus; procedural SFX + music sequencer |
| Save | `src/engine/save-system.ts` | Versioned localStorage, migration from prototype v0 |
| RNG | `src/engine/rng.ts` | Seeded deterministic RNG |
| Pool | `src/engine/pool.ts` | Object pooling for hot loops |
| World clock | `src/game/world-clock.ts` | Day/night cycle, dayFactor, formatTime (pure) |
| Weather | `src/game/weather.ts` | Director state machine, seeded transitions (pure) |
| World | `src/game/world.ts` | Player movement, clock + weather advance, save owner, autosave |
| Renderer iface | `src/render/renderer.ts` | IRenderer + RenderWorldState contract |
| Pixi renderer | `src/render/pixi-renderer.ts` | Composition root: sky, city, traffic, particles, weather, night |
| Sky | `src/render/sky.ts` | Gradient strips, sun/moon, stars, clouds, birds |
| City | `src/render/city.ts` | Iso tiles, buildings (base + animated layers), props, emitters |
| Particles | `src/render/particles.ts` | Pooled particle system (renderer-agnostic) |
| Traffic | `src/render/traffic.ts` | Car spawn/advance logic (pure) |
| Iso math | `src/render/iso-math.ts` | grid <-> screen transforms |
| Data | `src/data/*.json` | All content: map, buildings, props, NPCs, quests, interiors, items, dialogue, strings |

## Data flow

input → world.update(dt) [fixed 60Hz] → sim state (player, clock, weather) →
setWorldState → renderer [every rAF]: sky/city/traffic/particles/weather/night

## Rules

1. Logic never imports from `render/` — only through `IRenderer`.
2. Content never lives in `.ts` logic — always `src/data/*.json`.
3. No runtime network calls. Everything bundled.
4. Engine modules stay pure where possible (camera, rng, save, audio data)
   so they are unit-testable in node without a DOM.
5. Presentation-only systems (cars, particles, sky entities) live in render/
   and never touch sim state (ADR-0007).
