import buildings from '../data/buildings.json';
import map from '../data/map.json';

const INSET = 0.14;
const CELL = 0.5;

export interface GridNode {
  cx: number;
  cy: number;
}

export function cellKey(cx: number, cy: number): number {
  return cy * 1000 + cx;
}

export function toCell(x: number, y: number): GridNode {
  return { cx: Math.floor(x / CELL), cy: Math.floor(y / CELL) };
}

export function cellCenter(cx: number, cy: number): { x: number; y: number } {
  return { x: cx * CELL + CELL / 2, y: cy * CELL + CELL / 2 };
}

export function cellWalkable(cx: number, cy: number): boolean {
  const { x, y } = cellCenter(cx, cy);
  if (x < 0.3 || y < 0.3 || x > map.width - 0.3 || y > map.height - 0.3) return false;
  return !buildings.some(
    (b) => x > b.x + INSET && x < b.x + b.w - INSET && y > b.y + INSET && y < b.y + b.d - INSET,
  );
}

export function neighbors(node: GridNode): GridNode[] {
  const out: GridNode[] = [];
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
    const cx = node.cx + dx;
    const cy = node.cy + dy;
    if (cx >= 0 && cy >= 0 && cellWalkable(cx, cy)) out.push({ cx, cy });
  }
  return out;
}

function heuristic(a: GridNode, b: GridNode): number {
  return Math.abs(a.cx - b.cx) + Math.abs(a.cy - b.cy);
}

/** A* over the walkable grid. Returns world-space waypoints (cell centers), or null if unreachable. */
export function findPath(
  from: { x: number; y: number },
  to: { x: number; y: number },
): { x: number; y: number }[] | null {
  const start = toCell(from.x, from.y);
  const goal = toCell(to.x, to.y);
  if (!cellWalkable(goal.cx, goal.cy)) return null;
  if (start.cx === goal.cx && start.cy === goal.cy) return [cellCenter(goal.cx, goal.cy)];

  const open = new Map<number, number>(); // key -> fScore
  const gScore = new Map<number, number>();
  const cameFrom = new Map<number, number>();
  const startKey = cellKey(start.cx, start.cy);
  gScore.set(startKey, 0);
  open.set(startKey, heuristic(start, goal));

  const visited = new Set<number>();
  const maxIterations = 4000;
  let iterations = 0;

  while (open.size > 0 && iterations < maxIterations) {
    iterations += 1;
    let currentKey = -1;
    let bestF = Infinity;
    for (const [key, f] of open) {
      if (f < bestF) {
        bestF = f;
        currentKey = key;
      }
    }
    const current = { cx: currentKey % 1000, cy: Math.floor(currentKey / 1000) };

    if (current.cx === goal.cx && current.cy === goal.cy) {
      const path: { x: number; y: number }[] = [];
      let key = currentKey;
      while (key !== startKey) {
        path.unshift(cellCenter(key % 1000, Math.floor(key / 1000)));
        key = cameFrom.get(key)!;
      }
      return path;
    }

    open.delete(currentKey);
    visited.add(currentKey);

    for (const next of neighbors(current)) {
      const nextKey = cellKey(next.cx, next.cy);
      if (visited.has(nextKey)) continue;
      const tentative = (gScore.get(currentKey) ?? Infinity) + 1;
      if (tentative < (gScore.get(nextKey) ?? Infinity)) {
        cameFrom.set(nextKey, currentKey);
        gScore.set(nextKey, tentative);
        open.set(nextKey, tentative + heuristic(next, goal));
      }
    }
  }
  return null;
}

/** Every building door mat is guaranteed walkable — the P3 doorway gate. */
export function doorMatWalkable(): boolean {
  return buildings.every((b) => {
    const cell = toCell(b.door.x, b.door.y);
    return cellWalkable(cell.cx, cell.cy);
  });
}
