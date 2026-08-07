import { describe, expect, it } from 'vitest';
import { createRoom, moveInRoom, nearPoint, roomBlocked, ROOM_H, ROOM_W, type FurnItem } from '../src/interiors/interior-runtime';
import interiors from '../src/data/interiors.json';

const furn = (list: [string, number, number, number, number][]): FurnItem[] =>
  list.map(([type, x, y, w, h]) => ({ type, x, y, w, h, blocking: type !== 'rug' }));

describe('interior runtime', () => {
  it('room bounds block movement', () => {
    expect(roomBlocked([], 0.1, 2)).toBe(true);
    expect(roomBlocked([], ROOM_W - 0.1, 2)).toBe(true);
    expect(roomBlocked([], 2, ROOM_H - 0.1)).toBe(true);
    expect(roomBlocked([], 4, 2.5)).toBe(false);
  });

  it('blocking furniture stops movement, rugs do not', () => {
    const f = furn([['counter', 2, 0, 3, 1], ['rug', 3, 2, 2, 1]]);
    expect(roomBlocked(f, 3.5, 0.5)).toBe(true);
    expect(roomBlocked(f, 4, 2.5)).toBe(false);
  });

  it('every room: spawn point, terminal, npc, and item are all reachable', () => {
    for (const def of interiors) {
      const f = furn(def.furn as [string, number, number, number, number][]);
      const spawn = createRoom(def.id);
      expect(roomBlocked(f, spawn.px, spawn.py), `${def.id} spawn blocked`).toBe(false);
      expect(roomBlocked(f, def.terminal[0] + 0.5, def.terminal[1] + 0.5), `${def.id} terminal blocked`).toBe(false);
      expect(roomBlocked(f, def.npc.x, def.npc.y), `${def.id} npc blocked`).toBe(false);
      expect(roomBlocked(f, def.item.x, def.item.y), `${def.id} item blocked`).toBe(false);
    }
  });

  it('movement respects furniture collision', () => {
    const f = furn([['counter', 2, 0, 3, 1]]);
    const room = createRoom('test');
    room.px = 3.5;
    room.py = 1.5;
    moveInRoom(room, f, { x: 0, y: -1 }, 1);
    expect(room.py).toBeLessThanOrEqual(1.5); // could not pass through the counter
  });

  it('nearPoint radius works', () => {
    const room = createRoom('test');
    room.px = 4;
    room.py = 4;
    expect(nearPoint(room, 4.5, 4, 1.2)).toBe(true);
    expect(nearPoint(room, 7, 4, 1.2)).toBe(false);
  });
});
