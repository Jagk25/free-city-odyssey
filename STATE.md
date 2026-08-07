# STATE.md — Free City: Odyssey

Owned by: ORCHESTRATOR agent (see AGENTS.md).

## Current phase

**P1 — Engine core** (this commit)

## Gate history

| Phase | Gate | Status | Evidence |
|---|---|---|---|
| P0 | dev server + unit tests + e2e smoke + CI green | PASS (scaffold) | commit b938180 |
| P1 | tests pass; sprite moves via keyboard/touch/gamepad; save round-trips | PENDING | awaiting CI |

## Repo map (for agent context)

- `src/engine/` — loop (testable tick), input (remap/touch/gamepad), camera, audio bus, save, rng, pool ✅
- `src/render/` — IRenderer (+setPlayerPosition), PixiJS scene with follow camera, iso math ✅
- `src/game/` — world shell with map-bounds clamp + autosave ✅
- `src/data/` — all content JSON + map.json (districts) ✅
- `tests/` — rng, pool, save, iso, camera, input, game-loop, audio ✅
- `e2e/` — boot smoke ✅
- `.github/workflows/` — ci.yml, pages.yml ✅

## Next

P2 — world renderer: full iso tilemap, building features (columns, beacon,
awnings, chimney smoke, lanterns, neon), dynamic sky (sun/moon/stars/clouds/
birds), day/night lighting, weather director, traffic, pooled particles.
