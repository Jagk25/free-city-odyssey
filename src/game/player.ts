import type { Direction } from './npc';
import { facing } from './npc';
import { moveWithCollision } from './collision';

export interface Player {
  x: number;
  y: number;
  dir: Direction;
  moving: boolean;
  movePhase: number;
}

export const PLAYER_SPEED = 2.25;
const ENERGY_DRAIN = 0.6;

export function createPlayer(x: number, y: number): Player {
  return { x, y, dir: 'S', moving: false, movePhase: 0 };
}

export function updatePlayer(
  player: Player,
  axis: { x: number; y: number },
  dt: number,
): { moved: boolean; energyDelta: number } {
  player.moving = false;
  if (axis.x === 0 && axis.y === 0) return { moved: false, energyDelta: 0 };

  const len = Math.hypot(axis.x, axis.y);
  const dx = (axis.x / len) * dt * PLAYER_SPEED;
  const dy = (axis.y / len) * dt * PLAYER_SPEED;
  const result = moveWithCollision(player.x, player.y, dx, dy);

  player.x = result.x;
  player.y = result.y;
  player.dir = facing(axis.x, axis.y);
  player.moving = true;
  player.movePhase += dt * 14;
  return { moved: result.movedX || result.movedY, energyDelta: -dt * ENERGY_DRAIN };
}
