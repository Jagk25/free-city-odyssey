# FREE CITY: ODYSSEY — End-to-End Rebuild Workflow for Kimi K3

**Purpose:** rebuild the single-file prototype (`index.html`, v9.1) as a real,
modular, production-grade browser game — using Kimi K3 as the engineering
workforce, driven by the phase prompts in this document.

**Why Kimi K3 fits this job:** 1M-token context (the entire spec + reference
build + repo map fit in one session), native vision (screenshot-guided UI
iteration), long-horizon agentic coding with terminal/tool use, and strong
repository navigation. Use the full 1M context setting where available.

---

## 0. How to use this document

1. Create the GitHub repo `free-city-odyssey` (public, so Pages hosting is free).
2. Start a Kimi K3 session. Paste **Section 2 (Global System Prompt)** first.
3. Then paste **Section 3 (Product Spec)** and attach the reference build
   (`index.html` v9.1) plus 2–3 gameplay screenshots.
4. Execute phases **P0 → P9** in order. Paste each phase prompt only after the
   previous phase's **Acceptance Gate** passes. Do not skip gates.
5. Every phase ends with: tests green → commit → PR → merge → tag.

---

## 1. North Star

> A living-city story RPG in the browser: you are NOA, a background citizen who
> notices the loop. Explore six districts, enter every building, befriend AI
> citizens, solve diegetic mini-games, gather the six fragments, and choose the
> city's ending. 60 fps on mid phones, installable as a PWA, zero backend.

**Pillars:** (1) the city feels alive without you; (2) every door opens;
(3) choices are remembered; (4) runs offline, anywhere.

---

## 2. Global System Prompt (paste at the start of EVERY Kimi K3 session)

```text
You are the engineering team for FREE CITY: ODYSSEY, a browser RPG.
Work as five roles in sequence on every task: ANALYST (clarify, find edge
cases), ARCHITECT (propose the smallest clean design), CODER (implement),
TESTER (write/run tests, try to break it), REVIEWER (diff review, simplify).
State the active role when you switch.

Hard rules:
- TypeScript strict mode. No `any` without a comment justifying it.
- Data-driven content: buildings, NPCs, quests, dialogue, puzzles, and items
  live in /src/data/*.json — never hardcoded in logic.
- Deterministic simulation tick (fixed 60Hz) decoupled from rendering.
- Every feature ships with: unit tests for logic, and a Playwright step for
  any user-visible flow.
- Mobile-first: touch + keyboard + gamepad inputs for every action.
- No external network calls at runtime. Everything bundled/local.
- Performance budget: 60fps with 150 active entities on a 2021 mid-range
  phone; frame budget 16.6ms; pooled particles, no per-frame allocation in
  hot loops.
- Commits: conventional commits, one concern per commit, PR per phase.
- When blocked, present 2 options with trade-offs; never silently drop scope.
```

---

## 3. Product Spec (feature inventory — the rebuild must preserve ALL of this)

### 3.1 World
- 28×28 isometric map, 6 named districts (Downtown, Midtown, Civic Heights,
  Old Quarter, Market Row, Harbor), road grid every 5 tiles, park and dock
  biomes, camera follows player, world-bounds clamped.
- 14 buildings with unique silhouettes/features (bank columns, police beacon,
  café awning, inn chimney smoke, market lanterns, dev dish, warehouse crane,
  arcade neon, museum dome, balconies), per-floor animated windows, glowing
  door mats marking entrances.
- Props: lamps (night glow), trees, benches, bins, fountains (spray
  particles), statues, hydrants, phone booths.
- Dynamic sky: dawn/day/dusk/night gradients, arcing sun, moon + twinkling
  stars, parallax clouds, flapping birds; night darkening overlay; windows
  and lamps light up at night.
- Weather director: clear / neon rain (streak particles) / fog bank, random
  timed shifts with feed notification.
- Traffic: 10 cars, randomized color/speed/route, loop around map, headlights
  at night.
- Pooled particle system (fountain spray, chimney smoke, walk dust, fragment
  sparkles, level-up burst).

### 3.2 Characters
- Player NOA: 4-direction sprites (N/S/E/W faces), walk cycle with body lean,
  arm swing, foot steps, idle breathing, blink; energy stat drains on movement;
  building collision with axis-separated sliding; world-bounds clamp.
- 10 named citizens: needs (energy/social/curiosity) decay over time; utility
  scoring picks destinations at building door mats; stuck detection re-paths;
  NPC-NPC and NPC-building collision; hats (cap/beanie); talk gesture; mood
  reflected in dialogue; memory of player kindness (🙂/❤ tiers).
- Seekers: NPCs with pending business actively path to the player with a "!"
  marker (Maya → Zed → Ivy chain).
- Wandering cat (side quest): roams, follows player when found, returns home.
- Robbery event: robber flees the bank, cop chases, resolution grants rep/XP.

### 3.3 Interiors
- All 14 buildings enterable: 8×5 rooms, themed furniture sets with collision
  (counters, shelves, beds, sofas, desks with glowing screens, plants, rugs,
  wall art), resident NPC (idle bob), one hidden pickup item (sparkle), one
  puzzle terminal (pulsing), LEAVE button, door SFX.

### 3.4 Mini-games (9 types, DOM/canvas hybrid UI)
Memory Lock (Simon), Combination Lock, Signal Relink (wire matching),
Vault Cipher (Mastermind 4-digit with ●/○ hints, 6 tries, reshuffle),
Riddle ×2 (multiple choice), Reflex Circuit (stop marker in shrinking zone,
3 hits), The Haggle (3-round negotiation vs hidden minimum), The Lineup
(evidence deduction). Solving grants location-specific rewards; Warehouse
relink is the story climax.

### 3.5 Story & dialogue
- Main chain: Routine Breaker → Glasses Glitch (unlocks Vision) → Bank Day
  (vault) → Hidden Signal → Server Storm (warehouse core) → ENDING CHOICE:
  Preserve the Loop / Awaken the City (two different cutscenes + permanent
  flag + reward).
- Cutscene engine: letterbox bars, typewriter text, click/E advance, skip.
  Scenes: intro, vision unlock, storm, both endings.
- Dialogue trees: Maya (multi-branch backstory), Zed (gives Strange Note),
  Ivy (photo hints); generic citizen menu (mood from needs / city lore rumor /
  greeting builds memory).
- Side quests with live tracker states: Lost Cat, Package Run, Photo Tour
  (3 glowing spots).

### 3.6 Progression & economy
- XP/levels (level-up burst + SFX), cash, reputation, energy.
- Glitch Vision toggle (V): green overlay + scanlines; reveals 6 hidden
  fragments; collecting all 6 = "The Board Awakens" bonus + permanent glow.
- Inventory + item trading with interior NPCs (14 want/give pairs).
- Autosave every 15s to localStorage, versioned, covering: player, world
  clock, quest state, side quests, inventory, solved terminals, fragments,
  NPC-relevant flags, cat state, XP/level.

### 3.7 UX
- HUD: day/clock, energy bar (red when low), cash, rep, district.
- Quest tracker: main + 3 side quests with strikethrough completion.
- World status panel: weather, level, XP, fragments.
- Inventory panel; notification feed (last 3, auto-fade); live interaction
  prompt ("E · Enter CAFÉ / Talk to MAYA"); minimap with player, NPCs,
  buildings, quest marker; version badge; pause menu (resume/save/music/
  reset); debug panel (6 buttons: weather, robbery, +XP, vision, items,
  replay intro).
- Audio: procedural Web Audio chiptune loop + SFX set (door, coin, alert,
  blip, fail, fragment, level), gesture-gated start, music toggle.
- Mobile: on-screen D-pad + ACT button, safe-area aware, responsive layout.

---

## 4. Tech stack & repository layout

**Stack:** Vite + TypeScript (strict) · PixiJS v8 (WebGL renderer; DOM for
menus/dialogue) · Howler.js (audio; keep procedural synth module) · Vitest
(unit) · Playwright (e2e smoke) · ESLint+Prettier · GitHub Actions (CI:
build+test, deploy to Pages) · PWA (manifest + service worker).

```text
free-city-odyssey/
  index.html
  public/                 # icons, manifest, robots
  src/
    main.ts               # boot
    engine/               # loop, camera, input, save, audio, rng, pool
    render/               # pixi stage, iso math, sky, weather, particles
    game/                 # world, player, npc, ai, seekers, events, quests
    game/interiors/       # room loader, furniture, terminals
    game/minigames/       # 9 puzzle components
    game/story/           # dialogue runtime, cutscene engine, endings
    ui/                   # hud, panels, feed, prompt, minimap, menus
    data/                 # buildings.json npcs.json quests.json dialogue.json
                          # items.json riddles.json interiors.json strings.en.json
    styles/
  tests/ (unit)   e2e/ (playwright)
  .github/workflows/ci.yml + pages.yml
```

---

## 5. Phase prompts (paste one at a time, in order)

### P0 — Bootstrap
```text
Role sequence on. Task: scaffold the repo per Section 4 (Vite + TS strict +
PixiJS + Howler + Vitest + Playwright + ESLint/Prettier + GitHub Actions CI
deploying to Pages + PWA manifest/service worker). Add /src/data/*.json stubs
matching Section 3 entities. Add a README with run instructions.
GATE: `npm run dev` serves a blank Pixi stage; `npm test` and `npx playwright
test` pass a trivial spec; CI green on the PR; Pages URL serves the build.
Commit: "chore: project bootstrap (P0)".
```

### P1 — Engine core
```text
Implement engine/: fixed 60Hz sim tick with render interpolation; camera
(follow + clamp); input manager (keyboard, touch D-pad, gamepad, remappable);
save system (localStorage, schema version + migrate function, autosave 15s);
audio bus (Howler + procedural synth fallback, gesture-gated); seeded RNG;
object pool. Unit tests for tick determinism, save migration, pool reuse.
GATE: tests pass; demo scene moves a sprite with all three input types;
save/load round-trips. Commit: "feat(engine): core loop, input, save, audio (P1)".
```

### P2 — World renderer
```text
Implement render/ + world from data/buildings.json: iso tiles, 14 buildings
with per-floor windows + unique features + door mats, props with particles,
dynamic sky (sun/moon/stars/clouds/birds), night overlay + lit windows,
weather director (clear/neon rain/fog), traffic system (10 randomized cars,
night headlights), pooled particles. Everything data-driven from Section 3.1.
GATE: Playwright screenshot at 4 clock times matches baselines; 60fps with
all systems on (expose ?fps=1 meter); zero console errors. Commit:
"feat(world): isometric city, sky, weather, traffic (P2)".
```

### P3 — Characters & AI
```text
Implement player controller (4-dir animation, lean, energy drain, axis-split
collision, world clamp) and NPC system from data/npcs.json: needs decay,
utility target selection at DOOR MATS (never building centers), A* on the
road graph, stuck detection + repath, NPC collision, talk gestures, memory
tiers, seekers with "!" that path to the player, wandering cat, robbery
event. Unit tests: utility choice, repath on stuck, seeker activation order.
GATE: e2e walks to all 14 door mats and asserts the interaction prompt
appears for each (regression: doorway-block bug class); NPCs never idle
inside building footprints for >2s. Commit: "feat(ai): citizens, seekers,
events (P3)".
```

### P4 — Interiors & mini-games
```text
Implement interiors (8×5 rooms from data/interiors.json: furniture collision,
resident NPC, hidden item, terminal, leave flow) and all 9 mini-games as
isolated components per Section 3.4, each with a JSON config and unit tests
for win/lose logic. Item pickups, inventory, 14 trade pairs from items.json.
GATE: e2e completes each mini-game via scripted inputs; inventory/trade
round-trips through save/load. Commit: "feat(interiors): rooms, puzzles,
trading (P4)".
```

### P5 — Story, dialogue, cutscenes
```text
Implement the data-driven quest engine (main chain + ending choice with two
endings), dialogue tree runtime (Maya/Zed/Ivy trees + generic citizen menu
driven by needs), cutscene engine (letterbox, typewriter, skip, E/click
advance), seekers scripting, side quests (Lost Cat, Package Run, Photo Tour)
with live tracker. All content from dialogue.json/quests.json per Section 3.5.
GATE: e2e plays intro → café → dev office → bank → warehouse → both endings
on separate runs; no dead dialogue nodes (validator script). Commit:
"feat(story): quests, dialogue, cutscenes, endings (P5)".
```

### P6 — UX & HUD
```text
Implement all UI per Section 3.7: HUD, quest tracker with side states, world
status, inventory, notification feed, interaction prompt, minimap with quest
marker, version badge, pause menu, settings (mute, quality), debug panel
(6 actions), i18n scaffold via strings.en.json. DOM UI over the Pixi stage.
GATE: e2e asserts every panel updates on state change; prompt shows correct
label for building vs NPC vs item vs cat; axe-core finds no critical a11y
issues. Commit: "feat(ui): full HUD and menus (P6)".
```

### P7 — Mobile & PWA
```text
Implement touch D-pad + ACT with safe-area insets, responsive panels, PWA
(manifest, icons, service worker offline cache, install prompt), haptics on
interactions where supported. GATE: Lighthouse PWA ≥ 90; e2e on mobile
viewport completes the café mission with touch only; offline reload works.
Commit: "feat(pwa): mobile controls and offline install (P7)".
```

### P8 — QA hardening
```text
Performance pass: profile with 150 entities, enforce 16.6ms budget, pool
audit, texture atlas. Save migration tests across versions. Full Playwright
suite incl. doorway regression, both endings, offline, mobile. Soak test:
30-minute idle sim, zero errors, no memory growth >10%. GATE: CI runs the
full suite on PR; coverage on game logic ≥ 80%. Commit: "test: hardening and
performance (P8)".
```

### P9 — Release
```text
Add versioning + CHANGELOG, itch.io upload workflow (butler), GitHub Release
with zip artifact, optional Capacitor wrapper scaffold. Tag v1.0.0. GATE:
release CI publishes Pages + attaches itch build; fresh-clone `npm i && npm
run build && npx playwright test` passes. Commit: "chore(release): v1.0.0 (P9)".
```

---

## 6. Standing QA gates (run every phase)

- **Doorway regression (never again):** scripted walk to all 14 door mats →
  prompt must read "Enter …"; NPCs must not occupy door tiles > 2s.
- Zero console errors/warnings during a 5-minute random-input soak.
- Save/load round-trip preserves: quest, side quests, inventory, solved
  terminals, fragments, flags, cat, XP/level, clock.
- 60 fps with all systems enabled on the reference phone profile.

## 7. GitHub workflow

- Branches: `main` (stable, tagged releases) + `dev` + `feat/Px-*` per phase.
- PR per phase; CI = build + unit + e2e + Lighthouse; merge only when green.
- Releases: tag `vX.Y.Z`; Pages auto-deploys `main`; itch via butler on tags.

## 8. Risks & fallbacks

| Risk | Mitigation |
|---|---|
| PixiJS learning curve slows P2 | Fallback: keep Canvas2D renderer behind the same `IRenderer` interface; swap later |
| Scope creep beyond spec | Spec Section 3 is the contract; new ideas go to `BACKLOG.md`, not code |
| Audio autoplay policies | Gesture-gated start (already in spec); Howler handles unlock |
| Save breakage between versions | Schema version + migrate() from P1; migration tests in P8 |
| Mobile perf | Quality setting (particles/weather off), dynamic resolution |

## 9. Definition of Done (v1.0.0)

- [ ] All Section 3 features present and data-driven
- [ ] Both endings reachable; all 14 interiors enterable; 9 mini-games winnable
- [ ] Full e2e suite green in CI; doorway regression covered
- [ ] PWA installable, offline-capable; Lighthouse ≥ 90
- [ ] 60 fps budget met on reference device
- [ ] Pages URL live; itch.io build uploaded; v1.0.0 tagged
