import type { Npc } from './npc';
import { facing } from './npc';
import { moveWithCollision } from './collision';
import buildings from '../data/buildings.json';

export interface RobberyState {
  active: boolean;
  cooldown: number;
  robber: { x: number; y: number } | null;
  cop: { x: number; y: number } | null;
}

const ROBBER_SPEED = 1.5;
const COP_SPEED = 1.65;
const ARREST_DIST = 0.5;

export function createRobberyState(): RobberyState {
  return { active: false, cooldown: 20, robber: null, cop: null };
}

export function startRobbery(state: RobberyState): RobberyState {
  const bank = buildings.find((b) => b.id === 'bank')!;
  return {
    active: true,
    cooldown: 55 + Math.random() * 35,
    robber: { x: bank.x + 1, y: bank.y + 1 },
    cop: { x: bank.x + 4, y: bank.y + 4 },
  };
}

export function updateRobbery(
  state: RobberyState,
  dt: number,
  player: { x: number; y: number },
): { state: RobberyState; arrested: boolean; started: boolean } {
  if (!state.active) {
    const cooldown = state.cooldown - dt;
    if (cooldown <= 0) {
      return { state: startRobbery(state), arrested: false, started: true };
    }
    return { state: { ...state, cooldown }, arrested: false, started: false };
  }

  const robber = state.robber!;
  const cop = state.cop!;

  // Robber flees toward a point past the player.
  const rdx = player.x + 4 - robber.x;
  const rdy = player.y + 3 - robber.y;
  const rd = Math.hypot(rdx, rdy) || 1;
  const rr = moveWithCollision(robber.x, robber.y, (rdx / rd) * dt * ROBBER_SPEED, (rdy / rd) * dt * ROBBER_SPEED);
  robber.x = rr.x;
  robber.y = rr.y;

  // Cop chases the robber.
  const cdx = robber.x - cop.x;
  const cdy = robber.y - cop.y;
  const cd = Math.hypot(cdx, cdy) || 1;
  const cr = moveWithCollision(cop.x, cop.y, (cdx / cd) * dt * COP_SPEED, (cdy / cd) * dt * COP_SPEED);
  cop.x = cr.x;
  cop.y = cr.y;

  if (cd < ARREST_DIST) {
    return { state: createRobberyState(), arrested: true, started: false };
  }
  return { state, arrested: false, started: false };
}

/** Visual-only facing helper for the entity renderer. */
export function robberyFacing(from: { x: number; y: number }, to: { x: number; y: number }): 'N' | 'S' | 'E' | 'W' {
  return facing(to.x - from.x, to.y - from.y);
}
