# STATE.md — Free City: Odyssey

Owned by: ORCHESTRATOR agent (see AGENTS.md).

## Current phase

**P5+P6 — Story, Dialogue, Cutscenes, Endings + Full UX** (this commit)

## Gate history

| Phase | Gate | Status | Evidence |
|---|---|---|---|
| P0 | scaffold + tests + CI | PASS | commit b938180 |
| P1 | engine core + tests | PASS | commit fbb31d3 |
| P2 | 4-clock-times e2e; fps meter | PASS | commit d9560c8 |
| P3 | doorway regression e2e | PASS | commit 4545010 |
| P4 | interiors e2e; save round-trip | PASS | commit 4577f84 |
| P5+P6 | intro cutscene e2e; quest advances at café; dialogue validator clean | PENDING | awaiting CI |

## Repo map (for agent context)

- `src/engine/` — 7 modules ✅
- `src/game/` — 15 sim modules ✅
- `src/interiors/`, `src/minigames/` ✅
- `src/ui/hud.ts` — full DOM HUD + minimap ✅
- `src/render/` — 9 modules + vision/markers ✅
- `src/data/` — all content JSON incl. cutscenes + dialogue trees ✅
- `tests/` — 28 suites ✅
- `e2e/` — boot, clock, doorway, interiors, story ✅

## Next

P7 — Mobile & PWA: safe-area polish, install prompt, offline service worker,
haptics. Then P8 — QA hardening: performance pass, soak test, save migration
matrix. Then P9 — Release: changelog, itch.io, v1.0.0 tag.
