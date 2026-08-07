import type { Npc } from './npc';
import { facing } from './npc';
import { moveWithCollision } from './collision';
import { findPath } from './road-graph';

export interface SeekerRule {
  npcId: string;
  when: (flags: Record<string, unknown>, side: Record<string, unknown>) => boolean;
}

export const SEEKER_RULES: readonly SeekerRule[] = [
  { npcId: 'maya', when: (flags) => !flags.metMaya },
  { npcId: 'zed', when: (flags) => Boolean(flags.metMaya) && !flags.metZed },
  { npcId: 'ivy', when: (_flags, side) => side.photo === 1 && (side.photoSpots as number) < 3 },
];

const SEEK_SPEED = 1.15;
const REPATH_SECONDS = 2;

export function activeSeeker(
  rule: SeekerRule,
  flags: Record<string, unknown>,
  side: Record<string, unknown>,
): boolean {
  return rule.when(flags, side);
}

const repathTimers = new Map<string, number>();

/** Seekers path to the player with a "!" overhead; they stop at conversation distance. */
export function updateSeekers(
  npcs: Npc[],
  player: { x: number; y: number },
  flags: Record<string, unknown>,
  side: Record<string, unknown>,
  dt: number,
): void {
  for (const rule of SEEKER_RULES) {
    const npc = npcs.find((n) => n.def.id === rule.npcId);
    if (!npc) continue;

    const active = activeSeeker(rule, flags, side);
    npc.seeking = active;
    if (!active) continue;

    const dx = player.x - npc.x;
    const dy = player.y - npc.y;
    const dist = Math.hypot(dx, dy);
    npc.moving = false;

    if (dist > 1.3) {
      let timer = (repathTimers.get(npc.def.id) ?? 0) - dt;
      if (timer <= 0 || npc.path.length === 0) {
        npc.path = findPath(npc, player) ?? [];
        timer = REPATH_SECONDS;
      }
      repathTimers.set(npc.def.id, timer);

      if (npc.path.length > 0) {
        const wp = npc.path[0]!;
        const wdx = wp.x - npc.x;
        const wdy = wp.y - npc.y;
        const wdist = Math.hypot(wdx, wdy);
        if (wdist < 0.45) {
          npc.path.shift();
        } else {
          const step = Math.min(wdist, SEEK_SPEED * dt);
          const result = moveWithCollision(npc.x, npc.y, (wdx / wdist) * step, (wdy / wdist) * step);
          npc.x = result.x;
          npc.y = result.y;
          npc.dir = facing(wdx, wdy);
          npc.moving = true;
          npc.movePhase += dt * 10;
        }
      } else {
        // No path (player unreachable cell): steer directly, still respecting buildings.
        const step = Math.min(dist, SEEK_SPEED * dt);
        const result = moveWithCollision(npc.x, npc.y, (dx / dist) * step, (dy / dist) * step);
        npc.x = result.x;
        npc.y = result.y;
        npc.dir = facing(dx, dy);
        npc.moving = true;
        npc.movePhase += dt * 10;
      }
    } else {
      npc.dir = facing(dx, dy);
    }
  }
}
