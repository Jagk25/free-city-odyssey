export const FRAGMENTS: readonly { x: number; y: number }[] = [
  { x: 1.4, y: 1.4 },
  { x: 26.6, y: 1.4 },
  { x: 1.4, y: 26.6 },
  { x: 26.6, y: 26.6 },
  { x: 13.9, y: 13.9 },
  { x: 2.4, y: 20.4 },
];

/** Returns the fragment index picked up this step, or null. */
export function pickFragment(
  collected: readonly number[],
  px: number,
  py: number,
  radius = 0.6,
): number | null {
  for (let i = 0; i < FRAGMENTS.length; i += 1) {
    if (collected.includes(i)) continue;
    const f = FRAGMENTS[i]!;
    if (Math.hypot(px - f.x, py - f.y) < radius) return i;
  }
  return null;
}

export function allCollected(collected: readonly number[]): boolean {
  return collected.length >= FRAGMENTS.length;
}
