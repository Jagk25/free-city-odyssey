# STATE.md — Free City: Odyssey

Owned by: ORCHESTRATOR agent (see AGENTS.md).

## Current phase

**P3 — Characters & AI** (this commit)

## Gate history

| Phase | Gate | Status | Evidence |
|---|---|---|---|
| P0 | scaffold + tests + CI | PASS | commit b938180 |
| P1 | engine core + tests | PASS | commit fbb31d3 |
| P2 | 4-clock-times e2e; fps meter | PASS | commit d9560c8 |
| P3 | doorway regression e2e (all 14 doors); NPCs never inside footprints >2s | PENDING | awaiting CI |

## Repo map (for agent context)

- `src/engine/` — 7 modules ✅
- `src/game/` — world, world-clock, weather, collision, road-graph, npc, seekers, player, cat, events ✅
- `src/render/` — 8 modules ✅
- `src/data/` — all content JSON ✅
- `tests/` — 20 suites ✅
- `e2e/` — boot, 4-clock-times, doorway regression ✅

## Next

P4 — interiors & mini-games: 14 walkable rooms (furniture collision,
resident NPC, hidden item, terminal), 9 mini-game components with JSON
configs, inventory + trading, save round-trip.
