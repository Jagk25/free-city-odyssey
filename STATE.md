# STATE.md — Free City: Odyssey

Owned by: ORCHESTRATOR agent (see AGENTS.md).

## Current phase

**P0 — Bootstrap** (this commit)

## Gate history

| Phase | Gate | Status | Evidence |
|---|---|---|---|
| P0 | dev server + unit tests + e2e smoke + CI green | PENDING | awaiting first CI run |

## Repo map (for agent context)

- `src/engine/` — loop, input, save, rng, pool ✅
- `src/render/` — IRenderer, PixiJS boot scene, iso math ✅
- `src/game/` — world shell ✅
- `src/data/` — all content JSON ✅
- `tests/`, `e2e/` — unit + smoke ✅
- `.github/workflows/` — ci.yml, pages.yml ✅

## Next

P1 — engine hardening: touch/gamepad input, audio bus (Howler + procedural
fallback), camera follow+clamp, save schema consumers.
