import { moveWithCollision } from './collision';
import buildings from '../data/buildings.json';

export interface Cat {
  x: number;
  y: number;
  wanderTimer: number;
  tx: number;
  ty: number;
  following: boolean;
  home: boolean;
  moving: boolean;
}

const WANDER_SPEED = 0.9;
const FOLLOW_SPEED = 2.6;

export function createCat(x = 14.5, y = 14.5): Cat {
  return { x, y, wanderTimer: 0, tx: x, ty: y, following: false, home: false, moving: false };
}

export function updateCat(
  cat: Cat,
  dt: number,
  player: { x: number; y: number },
  rng: () => number,
  mapW: number,
  mapH: number,
): 'home' | null {
  if (cat.home) return null;
  cat.moving = false;

  if (cat.following) {
    const dx = player.x - cat.x;
    const dy = player.y - cat.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 1) {
      const step = Math.min(dist, FOLLOW_SPEED * dt);
      const result = moveWithCollision(cat.x, cat.y, (dx / dist) * step, (dy / dist) * step);
      cat.x = result.x;
      cat.y = result.y;
      cat.moving = true;
    }
    const inn = buildings.find((b) => b.id === 'inn')!;
    if (Math.hypot(cat.x - (inn.x + 1), cat.y - (inn.y + 1)) < 2) {
      cat.home = true;
      cat.following = false;
      return 'home';
    }
    return null;
  }

  cat.wanderTimer -= dt;
  if (cat.wanderTimer <= 0) {
    cat.wanderTimer = 2 + rng() * 3;
    cat.tx = Math.min(Math.max(0.5, cat.x + (rng() - 0.5) * 4), mapW - 0.5);
    cat.ty = Math.min(Math.max(0.5, cat.y + (rng() - 0.5) * 4), mapH - 0.5);
  }
  const dx = cat.tx - cat.x;
  const dy = cat.ty - cat.y;
  const dist = Math.hypot(dx, dy);
  if (dist > 0.3) {
    const step = Math.min(dist, WANDER_SPEED * dt);
    const result = moveWithCollision(cat.x, cat.y, (dx / dist) * step, (dy / dist) * step);
    cat.x = result.x;
    cat.y = result.y;
    cat.moving = true;
  }
  return null;
}
