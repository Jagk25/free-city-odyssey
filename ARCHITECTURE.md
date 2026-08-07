# ARCHITECTURE.md — Free City: Odyssey

Owned by: ARCHITECT agent (see AGENTS.md). Update via DECISIONS.log entry.

## Module map

| Module | Path | Responsibility |
|---|---|---|
| Boot | `src/main.ts` | Wire everything + audio + touch + cutscene/dialogue DOM + pause + debug |
| Engine | `src/engine/` | loop, input, camera, audio, save (v2), rng, pool |
| Sim | `src/game/` | world, world-clock, weather, collision, road-graph, npc, seekers, player, cat, events, inventory, quests, dialogue, cutscenes, vision |
| Interiors | `src/interiors/` | room runtime (pure) |
| Mini-games | `src/minigames/` | logic cores (pure) + DOM runtime |
| UI | `src/ui/hud.ts` | DOM HUD writer + minimap canvas |
| Render | `src/render/` | pixi-renderer, sky, city, particles, traffic, entities, interior-renderer, iso-math, renderer |
| Data | `src/data/*.json` | map, buildings, props, NPCs, quests, interiors, items, dialogue, cutscenes, dialogue-trees, strings |

## Data flow

input → world.update(dt) [fixed 60Hz] → sim → RenderWorldState → renderer;
world → GameUi (notify/sfx/minigame/dialogue/cutscene/hud/minimap) → DOM.
Overlays (dialogue/cutscene/minigame/pause) pause the sim via overlayOpen.

## Rules

1. Logic never imports from `render/` — only through `IRenderer`.
2. Content never lives in `.ts` logic — always `src/data/*.json`.
3. No runtime network calls. Everything bundled.
4. Engine, AI, interiors, mini-game, quest, dialogue, cutscene cores stay pure.
5. Presentation-only systems live in render/ (ADR-0007).
6. AI may only target door mats (ADR-0004).
7. Mini-game rules live in pure logic cores (ADR-0010).
8. Story content (cutscenes, dialogue trees) is data + validated (ADR-0012).
