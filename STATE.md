# STATE.md - Free City: Odyssey

## Current phase

**v1.1.0 - Cinematic Update.** Animated cutscenes, procedural voice, leave fix.

## Note on this push

This update was pushed in 3 parts due to payload size limits:
1. src/game/cutscenes.ts, src/data/cutscenes.json, src/engine/audio.ts
2. src/render/interior-renderer.ts, src/render/entities.ts, package.json
3. This file, CHANGELOG.md, DECISIONS.log

IMPORTANT FOLLOW-UP REQUIRED: src/game/world.ts, index.html, and src/main.ts
were NOT included in this push due to size limits. These three files contain
the actual functional wiring:
- world.ts: the walkable south exit mat logic + ROOM_H import (the real
  gameplay fix for leaving buildings)
- index.html: the #cine DOM structure, CSS animations (kenburns, grain,
  vignette, letterbox bars)
- main.ts: the canvas cinematic rendering loop, voice-on-typewriter wiring,
  and the #leave button visibility toggle (window.leaveBtn?.classList.toggle)

Without these three files, the new cutscenes.ts/audio.ts/interior-renderer.ts
changes are inert - the old index.html/main.ts/world.ts in the repo do not
reference Slide.bg, speechBlip, or the exit mat. A follow-up push of these
three files is required before this feature is playable.

## Gate history

| Phase | Gate | Status |
|---|---|---|
| P0-P9 | full build | PASS |
| hotfixes 1-4 | CI + typecheck + e2e | PASS |
| v1.1.0 part 1/3 | cutscenes+audio pushed | PASS |
| v1.1.0 part 2/3 | renderers+package.json pushed | PASS |
| v1.1.0 part 3/3 | docs pushed | PASS |
| v1.1.0 wiring | world.ts/index.html/main.ts | PENDING |
