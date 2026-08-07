import type { Direction } from '../game/npc';
import { facing } from '../game/npc';

export const ROOM_W = 8;
export const ROOM_H = 5;
const SPEED = 3;

export interface FurnItem {
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  blocking: boolean;
}

export interface RoomState {
  id: string;
  px: number;
  py: number;
  dir: Direction;
  moving: boolean;
  movePhase: number;
}

export function createRoom(id: string): RoomState {
  return { id, px: ROOM_W / 2, py: ROOM_H - 0.6, dir: 'N', moving: false, movePhase: 0 };
}

export function roomBlocked(furn: readonly FurnItem[], x: number, y: number): boolean {
  if (x < 0.3 || x > ROOM_W - 0.3 || y < 0.3 || y > ROOM_H - 0.3) return true;
  return furn.some(
    (f) => f.blocking && x > f.x - 0.15 && x < f.x + f.w + 0.15 && y > f.y - 0.15 && y < f.y + f.h + 0.15,
  );
}

/** Axis-separated room movement — same slide feel as the city. */
export function moveInRoom(
  room: RoomState,
  furn: readonly FurnItem[],
  axis: { x: number; y: number },
  dt: number,
): RoomState {
  if (axis.x === 0 && axis.y === 0) {
    room.moving = false;
    return room;
  }
  const len = Math.hypot(axis.x, axis.y);
  const dx = (axis.x / len) * dt * SPEED;
  const dy = (axis.y / len) * dt * SPEED;

  if (!roomBlocked(furn, room.px + dx, room.py)) room.px += dx;
  if (!roomBlocked(furn, room.px, room.py + dy)) room.py += dy;

  room.dir = facing(axis.x, axis.y);
  room.moving = true;
  room.movePhase += dt * 12;
  return room;
}

export function nearPoint(room: RoomState, x: number, y: number, radius = 1.2): boolean {
  return Math.hypot(room.px - x, room.py - y) < radius;
}
