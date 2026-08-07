import { describe, expect, it } from 'vitest';
import { doorMatWalkable, findPath, cellWalkable, toCell } from '../src/game/road-graph';
import buildings from '../src/data/buildings.json';

describe('road graph', () => {
  it('every door mat is walkable (doorway gate)', () => {
    expect(doorMatWalkable()).toBe(true);
  });

  it('building center cells are not walkable', () => {
    for (const b of buildings) {
      const cell = toCell(b.x + b.w / 2, b.y + b.d / 2);
      expect(cellWalkable(cell.cx, cell.cy)).toBe(false);
    }
  });

  it('finds a path between two door mats across the map', () => {
    const cafe = buildings.find((b) => b.id === 'cafe')!;
    const hotel = buildings.find((b) => b.id === 'hotel')!;
    const path = findPath(cafe.door, hotel.door);
    expect(path).not.toBeNull();
    expect(path!.length).toBeGreaterThan(10);
  });

  it('path never passes through a building cell', () => {
    const bank = buildings.find((b) => b.id === 'bank')!;
    const warehouse = buildings.find((b) => b.id === 'warehouse')!;
    const path = findPath(bank.door, warehouse.door)!;
    for (const wp of path) {
      const cell = toCell(wp.x, wp.y);
      expect(cellWalkable(cell.cx, cell.cy)).toBe(true);
    }
  });
});
