# STATE.md — Free City: Odyssey

Owned by: ORCHESTRATOR agent (see AGENTS.md).

## Current phase

**P4 — Interiors & Mini-games** (this commit)

## Gate history

| Phase | Gate | Status | Evidence |
|---|---|---|---|
| P0 | scaffold + tests + CI | PASS | commit b938180 |
| P1 | engine core + tests | PASS | commit fbb31d3 |
| P2 | 4-clock-times e2e; fps meter | PASS | commit d9560c8 |
| P3 | doorway regression e2e | PASS | commit 4545010 |
| P4 | e2e: enter cafe → pickup → terminal → leave; save round-trip | PENDING | awaiting CI |

## Repo map (for agent context)

- `src/engine/` — 7 modules ✅
- `src/game/` — 10 sim modules + inventory ✅
- `src/interiors/` — room runtime (pure) ✅
- `src/minigames/` — logic cores (pure) + DOM runtime ✅
- `src/render/` — 9 modules incl. interior-renderer ✅
- `src/data/` — all content JSON (+furn, +rewards) ✅
- `tests/` — 24 suites ✅
- `e2e/` — boot, 4-clock-times, doorway regression, interiors ✅

## Next

P5 — story, dialogue, cutscenes: data-driven quest engine (main chain +
ending choice), dialogue tree runtime (Maya/Zed/Ivy + generic citizen menu),
cutscene engine (letterbox, typewriter, skip), seekers scripting, side quests
with live tracker. Dialogue validator (no dead nodes).
