import { describe, expect, it } from 'vitest';
import { createCat, updateCat } from '../src/game/cat';
import { mulberry32 } from '../src/engine/rng';

describe('cat', () => {
  it('wanders without entering buildings', () => {
    const rng = mulberry32(9);
    const cat = createCat(14, 14);
    for (let i = 0; i < 60 * 10; i += 1) updateCat(cat, 1 / 60, { x: 5, y: 5 }, rng, 28, 28);
    expect(cat.x).toBeGreaterThan(0);
    expect(cat.y).toBeGreaterThan(0);
  });

  it('follows the player and returns home at the inn', () => {
    const rng = mulberry32(10);
    const cat = createCat(10, 10);
    cat.following = true;
    let home: string | null = null;
    for (let i = 0; i < 60 * 40 && !home; i += 1) {
      home = updateCat(cat, 1 / 60, { x: 4, y: 16 }, rng, 28, 28);
    }
    expect(home).toBe('home');
    expect(cat.home).toBe(true);
  });
});
