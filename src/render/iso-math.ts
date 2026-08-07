export const TILE_W = 72;
export const TILE_H = 36;

export function gridToScreen(gx: number, gy: number): { x: number; y: number } {
  return { x: ((gx - gy) * TILE_W) / 2, y: ((gx + gy) * TILE_H) / 2 };
}

export function screenToGrid(sx: number, sy: number): { x: number; y: number } {
  return {
    x: sx / TILE_W + sy / TILE_H,
    y: sy / TILE_H - sx / TILE_W,
  };
}
