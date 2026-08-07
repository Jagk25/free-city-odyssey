import { findPath } from './road-graph';
import { moveWithCollision } from './collision';
import buildings from '../data/buildings.json';
import npcData from '../data/npcs.json';

export type Direction = 'N' | 'S' | 'E' | 'W';

export interface NpcDef {
  id: string;
  name: string;
  color: string;
  skin: string;
  hair: string;
  hat: string | null;
  spawn: [number, number];
  seeker?: string;
}

export interface Needs {
  energy: number;
  social: number;
  curiosity: number;
}

export interface Npc {
  def: NpcDef;
  x: number;
  y: number;
  dir: Direction;
  movePhase: number;
  moving: boolean;
  memory: number;
  needs: Needs;
  targetBuilding: string | null;
  path: { x: number; y: number }[];
  thinkTimer: number;
  stuckTimer: number;
  seeking: boolean;
}

const SPEED = 0.75;
const ARRIVE_DIST = 0.45;
const STUCK_SECONDS = 1.4;
const THINK_MIN = 3;
const THINK_VAR = 4;

export function spawnNpcs(rng: () => number): Npc[] {
  return (npcData as NpcDef[]).map((def) => ({
    def,
    x: def.spawn[0],
    y: def.spawn[1],
    dir: 'S',
    movePhase: rng() * 6,
    moving: false,
    memory: 0,
    needs: {
      energy: 60 + rng() * 35,
      social: 45 + rng() * 40,
      curiosity: 35 + rng() * 50,
    },
    targetBuilding: null,
    path: [],
    thinkTimer: rng() * 2,
    stuckTimer: 0,
    seeking: false,
  }));
}

export function doorMat(buildingId: string): { x: number; y: number } | null {
  const b = buildings.find((bb) => bb.id === buildingId);
  return b ? { x: b.door.x, y: b.door.y } : null;
}

/** Utility scoring: needs drive destination choice, distance penalizes. Highest score wins. */
export function scoreDestination(npc: Npc, buildingId: string, rng: () => number): number {
  const door = doorMat(buildingId);
  if (!door) return -Infinity;
  let score = rng() * 8;
  if (buildingId === 'cafe') score += (100 - npc.needs.energy) * 0.45;
  if (buildingId === 'market' || buildingId === 'inn') score += (100 - npc.needs.social) * 0.35;
  if (['bank', 'dev', 'library', 'museum'].includes(buildingId)) score += npc.needs.curiosity * 0.26;
  score -= Math.hypot(npc.x - door.x, npc.y - door.y) * 0.5;
  return score;
}

export function pickDestination(npc: Npc, rng: () => number): string {
  let best = buildings[0]!.id;
  let bestScore = -Infinity;
  for (const b of buildings) {
    const s = scoreDestination(npc, b.id, rng);
    if (s > bestScore) {
      bestScore = s;
      best = b.id;
    }
  }
  return best;
}

export function facing(dx: number, dy: number): Direction {
  return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'E' : 'W') : dy > 0 ? 'S' : 'N';
}

export interface NpcUpdateContext {
  rng: () => number;
  others: Npc[];
}

/** One sim step for an NPC: think → path → move → arrive. Returns a speech trigger when arriving. */
export function updateNpc(npc: Npc, dt: number, ctx: NpcUpdateContext): void {
  npc.needs.energy = Math.max(0, npc.needs.energy - dt * 0.8);
  npc.needs.social = Math.max(0, npc.needs.social - dt * 0.45);
  npc.needs.curiosity = Math.min(100, npc.needs.curiosity + dt * 0.45);

  if (npc.seeking) return; // seekers are driven by updateSeekers

  npc.thinkTimer -= dt;
  if (!npc.targetBuilding || npc.thinkTimer <= 0) {
    npc.targetBuilding = pickDestination(npc, ctx.rng);
    npc.thinkTimer = THINK_MIN + ctx.rng() * THINK_VAR;
    const door = doorMat(npc.targetBuilding);
    npc.path = door ? (findPath(npc, door) ?? []) : [];
  }

  npc.moving = false;
  if (npc.path.length > 0) {
    const waypoint = npc.path[0]!;
    const dx = waypoint.x - npc.x;
    const dy = waypoint.y - npc.y;
    const dist = Math.hypot(dx, dy);

    if (dist < ARRIVE_DIST) {
      npc.path.shift();
    } else {
      const step = Math.min(dist, SPEED * dt);
      const occupied = (x: number, y: number): boolean =>
        ctx.others.some((o) => o !== npc && Math.hypot(o.x - x, o.y - y) < 0.32);
      const result = moveWithCollision(npc.x, npc.y, (dx / dist) * step, (dy / dist) * step, occupied);
      const progress = Math.hypot(result.x - npc.x, result.y - npc.y);
      npc.x = result.x;
      npc.y = result.y;
      npc.dir = facing(dx, dy);
      npc.moving = true;
      npc.movePhase += dt * 10;

      if (progress < SPEED * dt * 0.25) {
        npc.stuckTimer += dt;
        if (npc.stuckTimer > STUCK_SECONDS) {
          npc.stuckTimer = 0;
          npc.targetBuilding = pickDestination(npc, ctx.rng);
          const door = doorMat(npc.targetBuilding);
          npc.path = door ? (findPath(npc, door) ?? []) : [];
        }
      } else {
        npc.stuckTimer = 0;
      }
    }
  } else if (npc.targetBuilding) {
    // Arrived: satisfy needs at the door mat.
    const id = npc.targetBuilding;
    if (id === 'cafe') npc.needs.energy = Math.min(100, npc.needs.energy + dt * 14);
    if (id === 'market' || id === 'inn') npc.needs.social = Math.min(100, npc.needs.social + dt * 12);
    npc.needs.curiosity = Math.max(0, npc.needs.curiosity - dt * 8);
  }
}
