# Free City: Odyssey

A living-city browser RPG prototype. You are NOA, a background citizen who
notices the loop stutter. Explore 6 districts, enter 14 buildings, solve 9
types of mini-games, befriend AI citizens, and decide the city's fate.

**Play:** open `index.html` in any modern browser (desktop or mobile).
No install, no build step, no dependencies.

## Current build: v9.1 (Doorway Fix)
- Fixed NPCs jamming building entrances (destinations moved to door mats)
- Fixed NPC stuck-forever behavior (stuck detection + re-pathing)
- Restored world bounds (no more walking off the map)
- Interaction now targets the nearest of building/citizen
- Golden door mats + live "E: Enter / Talk" prompt

## Rebuild workflow
- `AGENTS.md` — 7-agent Kimi K3 swarm constitution (roles, thinking protocol,
  handoffs, standing gates)
- `docs/FREE_CITY_KIMI_K3_BUILD_PLAN.md` — end-to-end phase prompts P0–P9
  with acceptance gates
- `ROADMAP.md` — the prototype → production transformation plan
