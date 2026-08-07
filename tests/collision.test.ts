import { describe, expect, it } from 'vitest';
import { isSolid, moveWithCollision, BUILDING_RECTS } from '../src/game/collision';
import buildings from '../src/data/buildings.json';

describe('collision', () => {
  it('building centers are solid, door mats are not', () => {
    for (const b of buildings) {
      expect(isSolid(b.x + b.w / 2, b.y + b.d / 2)).toBe(true);
      expect(isSolid(b.door.x, b.door.y)).toBe(false);
    }
  });

  it('rect count matches building count', () => {
    expect(BUILDING_RECTS).toHaveLength(buildings.length);
  });

  it('slides along walls: blocked X still allows Y', () => {
    const bank = buildings.find((b) => b.id === 'bank')!;
    const from = { x: bank.x - 0.5, y: bank.y + bank.d / 2 };
    const result = moveWithCollision(from.x, from.y, 1, 0.5);
    expect(result.movedX).toBe(false);
    expect(result.movedY).toBe(true);
  });

  it('clamps to map bounds', () => {
    const result = moveWithCollision(0.5, 0.5, -10, -10);
    expect(result.x).toBeGreaterThanOrEqual(0.3);
    expect(result.y).toBeGreaterThanOrEqual(0.3);
  });
});
