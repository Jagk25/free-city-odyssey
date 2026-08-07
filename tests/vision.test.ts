import { describe, expect, it } from 'vitest';
import { allCollected, pickFragment, FRAGMENTS } from '../src/game/vision';

describe('vision fragments', () => {
  it('picks up a fragment in radius and never twice', () => {
    const f = FRAGMENTS[0]!;
    expect(pickFragment([], f.x, f.y)).toBe(0);
    expect(pickFragment([0], f.x, f.y)).toBeNull();
  });

  it('returns null when out of radius', () => {
    expect(pickFragment([], 14, 14.5)).toBeNull();
  });

  it('allCollected only when all six are held', () => {
    expect(allCollected([0, 1, 2, 3, 4])).toBe(false);
    expect(allCollected([0, 1, 2, 3, 4, 5])).toBe(true);
  });
});
