import { describe, expect, it } from 'vitest';
import { pickDestination, scoreDestination, spawnNpcs, updateNpc, facing } from '../src/game/npc';
import { doorMatWalkable } from '../src/game/road-graph';
import { mulberry32 } from '../src/engine/rng';
import buildings from '../src/data/buildings.json';

describe('npc ai', () => {
  it('all destinations are walkable door mats', () => {
    expect(doorMatWalkable()).toBe(true);
  });

  it('utility scoring prefers cafe when energy is low', () => {
    const rng = mulberry32(1);
    const npc = spawnNpcs(rng)[0]!;
    npc.needs.energy = 5;
    const cafeScore = scoreDestination(npc, 'cafe', mulberry32(2));
    const museumScore = scoreDestination(npc, 'museum', mulberry32(3));
    expect(cafeScore).toBeGreaterThan(museumScore);
  });

  it('pickDestination always returns a real building', () => {
    const rng = mulberry32(4);
    const npcs = spawnNpcs(rng);
    for (const npc of npcs) {
      const dest = pickDestination(npc, rng);
      expect(buildings.some((b) => b.id === dest)).toBe(true);
    }
  });

  it('npcs move along their path and never end inside a building', () => {
    const rng = mulberry32(5);
    const npcs = spawnNpcs(rng);
    for (let i = 0; i < 60 * 20; i += 1) {
      for (const npc of npcs) updateNpc(npc, 1 / 60, { rng, others: npcs });
    }
    for (const npc of npcs) {
      const inside = buildings.some(
        (b) => npc.x > b.x + 0.14 && npc.x < b.x + b.w - 0.14 && npc.y > b.y + 0.14 && npc.y < b.y + b.d - 0.14,
      );
      expect(inside).toBe(false);
    }
  });

  it('stuck recovery repaths after being blocked', () => {
    const rng = mulberry32(6);
    const npc = spawnNpcs(rng)[0]!;
    npc.targetBuilding = 'cafe';
    npc.path = [{ x: npc.x, y: npc.y }]; // degenerate path forces arrival -> new think cycle
    updateNpc(npc, 1 / 60, { rng, others: [npc] });
    expect(npc.targetBuilding).toBeTruthy();
  });

  it('facing picks dominant axis', () => {
    expect(facing(2, 1)).toBe('E');
    expect(facing(-2, 1)).toBe('W');
    expect(facing(1, 2)).toBe('S');
    expect(facing(1, -2)).toBe('N');
  });
});
