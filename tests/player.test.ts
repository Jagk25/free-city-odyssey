import { describe, expect, it } from 'vitest';
import { createPlayer, updatePlayer, PLAYER_SPEED } from '../src/game/player';

describe('player controller', () => {
  it('moves at configured speed with energy drain', () => {
    const p = createPlayer(14, 14);
    const before = p.x;
    const r = updatePlayer(p, { x: 1, y: 0 }, 1);
    expect(p.x - before).toBeCloseTo(PLAYER_SPEED, 3);
    expect(r.energyDelta).toBeCloseTo(-0.6, 3);
    expect(p.dir).toBe('E');
    expect(p.moving).toBe(true);
  });

  it('idle input is a no-op', () => {
    const p = createPlayer(14, 14);
    const r = updatePlayer(p, { x: 0, y: 0 }, 1);
    expect(r.moved).toBe(false);
    expect(p.moving).toBe(false);
  });

  it('cannot walk through buildings', () => {
    const p = createPlayer(4, 2); // north of the bank
    for (let i = 0; i < 60; i += 1) updatePlayer(p, { x: 0, y: 1 }, 1 / 60);
    expect(p.y).toBeLessThan(3.2); // stopped before the bank footprint
  });
});
