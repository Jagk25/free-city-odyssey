# Changelog - Free City: Odyssey

## 1.1.0 - 2026-08-08 - Cinematic Update

- Cutscene engine v2: per-slide animated canvas scenes (matrix rain, city
  dawn, glitch static, dark pulse), letterbox bars that slide in, crossfade
  slide transitions, film grain + vignette overlays, ken-burns slow zoom.
- Procedural voice: per-speaker pitch speech blips synced to the typewriter
  and dialogue - voice with zero audio assets.
- LEAVE BUILDING FIX x3: the LEAVE button started hidden and was never shown
  (the actual bug); it now follows interior mode, PLUS a walkable exit mat at
  each room's south edge (src/game/world.ts), PLUS an exit-mat visual in
  every room (src/render/interior-renderer.ts).
- Character polish: soft double-layer shadows + rim outline.
- cutscenes.json: per-slide background scene tags.

## 1.0.0 - 2026-08-08

Full end-to-end build complete. Playable, installable, offline-capable.
