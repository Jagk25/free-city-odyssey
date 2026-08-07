# STATE.md — Free City: Odyssey

Owned by: ORCHESTRATOR agent (see AGENTS.md).

## Current phase

**P2 — World renderer** (this commit)

## Gate history

| Phase | Gate | Status | Evidence |
|---|---|---|---|
| P0 | dev server + unit tests + e2e smoke + CI green | PASS | commit b938180 |
| P1 | tests pass; sprite moves via keyboard/touch/gamepad; save round-trips | PASS | commit fbb31d3 |
| P2 | 4-clock-times e2e; 60fps with all systems (?fps=1); zero console errors | PENDING | awaiting CI |

## Repo map (for agent context)

- `src/engine/` — loop, input, camera, audio, save, rng, pool ✅
- `src/game/` — world, world-clock, weather ✅
- `src/render/` — pixi-renderer, sky, city, particles, traffic, iso-math, renderer ✅
- `src/data/` — map, buildings, props, NPCs, quests, interiors, items, dialogue, strings ✅
- `tests/` — 12 suites ✅
- `e2e/` — boot smoke + 4-clock-times ✅
- `.github/workflows/` — ci.yml, pages.yml ✅

## Next

P3 — characters & AI: player controller (4-dir animation, energy, axis-split
collision), NPC utility AI at door mats, A* road graph, stuck recovery,
seekers, cat, robbery event. Doorway regression e2e across all 14 doors.
