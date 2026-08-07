# ARCHITECTURE.md — Free City: Odyssey

Owned by: ARCHITECT agent (see AGENTS.md). Update via DECISIONS.log entry.

## Module map

| Module | Path | Responsibility |
|---|---|---|
| Boot | `src/main.ts` | Wire everything + audio + touch + debug hooks + minigame host |
| Engine | `src/engine/` | loop, input, camera, audio, save (v2), rng, pool |
| Sim | `src/game/` | world, world-clock, weather, collision, road-graph, npc, seekers, player, cat, events, inventory |
| Interiors | `src/interiors/interior-runtime.ts` | Room state, furniture collision, proximity (pure) |
| Mini-games | `src/minigames/` | logic.ts (pure cores, 9 games) + runtime.ts (DOM host) |
| Render | `src/render/` | pixi-renderer, sky, city, particles, traffic, entities, interior-renderer, iso-math, renderer |
| Data | `src/data/*.json` | map, buildings, props, NPCs, quests, interiors (+furn/rewards), items, dialogue, strings |

## Data flow

input → world.update(dt) [fixed 60Hz] → sim (city | interior mode) →
RenderWorldState (mode + interior payload) → renderer [every rAF]

UI bridge: world → GameUi interface (notify / sfx / openMinigame) → DOM in
main.ts. Game logic never touches the DOM directly.

## Rules

1. Logic never imports from `render/` — only through `IRenderer`.
2. Content never lives in `.ts` logic — always `src/data/*.json`.
3. No runtime network calls. Everything bundled.
4. Engine, AI, interiors, mini-game cores stay pure — node-testable.
5. Presentation-only systems live in render/ (ADR-0007).
6. AI may only target door mats (ADR-0004).
7. Mini-game rules live in pure logic cores; the DOM host is replaceable (ADR-0010).
