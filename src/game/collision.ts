import buildings from '../data/buildings.json';
import map from '../data/map.json';

export interface Rect {
  x: number;
  y: number;
  w: number;
  d: number;
}

const INSET = 0.14;
const EDGE = 0.3;

export const BUILDING_RECTS: readonly Rect[] = buildings.map((b) => ({
  x: b.x + INSET,
  y: b.y + INSET,
  w: b.w - INSET * 2,
  d: b.d - INSET * 2,
}));

export function pointInRect(px: number, py: number, r: Rect): boolean {
  return px > r.x && px < r.x + r.w && py > r.y && py < r.y + r.d;
}

export function isSolid(x: number, y: number): boolean {
  return BUILDING_RECTS.some((r) => pointInRect(x, y, r));
}

export function clampToMap(x: number, y: number): { x: number; y: number } {
  return {
    x: Math.min(Math.max(x, EDGE), map.width - EDGE),
    y: Math.min(Math.max(y, EDGE), map.height - EDGE),
  };
}

/** Axis-separated movement: try X then Y independently so entities slide along walls. */
export function moveWithCollision(
  x: number,
  y: number,
  dx: number,
  dy: number,
  extraSolid?: (x: number, y: number) => boolean,
): { x: number; y: number; movedX: boolean; movedY: boolean } {
  let nx = x;
  let ny = y;
  let movedX = false;
  let movedY = false;

  const tx = x + dx;
  if (!isSolid(tx, ny) && !(extraSolid?.(tx, ny) ?? false)) {
    nx = tx;
    movedX = true;
  }
  const ty = y + dy;
  if (!isSolid(nx, ty) && !(extraSolid?.(nx, ty) ?? false)) {
    ny = ty;
    movedY = true;
  }

  const clamped = clampToMap(nx, ny);
  return { x: clamped.x, y: clamped.y, movedX, movedY };
}
