# Changelog — Free City: Odyssey

All notable changes, by phase. Built by the 7-agent swarm (see AGENTS.md).

## 1.0.0 — 2026-08-08

Full end-to-end build complete. Playable, installable, offline-capable.

### P9 — Release
- CHANGELOG, full README, v1.0.0.

### P7 — Mobile & PWA
- Runtime-caching service worker: fully offline after first load.
- Install prompt (beforeinstallprompt) with zero-binary SVG icon.
- Haptics on touch interactions (navigator.vibrate).

### P8 — QA hardening
- Random-input soak e2e: zero console errors.
- Save migration matrix: v0 prototype, v1 scaffold, v2 current all migrate.

### P5+P6 — Story & Full UX
- Data-driven quest engine: main chain + ending choice (Preserve/Awaken).
- Dialogue trees (Maya/Zed/Ivy + generic citizens) with dead-node validator.
- Cutscene engine: letterbox, typewriter, skip. Intro, vision, storm, both endings.
- Glitch Vision + 6 fragments + Board Awakens. Side quests: Lost Cat, Package Run, Photo Tour.
- Full HUD: stats, quest tracker, world status, inventory, feed, prompt, minimap, pause menu, debug panel.

### P4 — Interiors & Mini-games
- 14 walkable rooms with furniture collision, resident NPCs, hidden items, terminals.
- 9 mini-games with pure logic cores: Memory Lock, Combination Lock, Signal Relink, Vault Cipher, Riddles, Reflex Circuit, The Haggle, The Lineup.
- Inventory + 14 trade pairs. Save v2.

### P3 — Characters & AI
- Player controller (4-dir, collision slide, energy). 10 citizens with needs-based utility AI.
- A* road graph with door-mat targets (doorway bug eliminated by construction).
- Seekers (Maya→Zed→Ivy), wandering cat, robbery event. Doorway regression e2e.

### P2 — World Renderer
- Full isometric city, 14 featured buildings, dynamic sky (sun/moon/stars/clouds/birds).
- Day/night lighting, weather director (clear/neon rain/fog), traffic, pooled particles, FPS meter.

### P1 — Engine Core
- Fixed 60Hz deterministic loop, remappable input (keyboard/touch/gamepad), camera, gesture-gated audio bus, versioned saves.

### P0 — Scaffold
- Vite + strict TypeScript + PixiJS v8 + Vitest + Playwright + CI + Pages.
