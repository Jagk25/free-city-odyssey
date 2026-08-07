import { describe, expect, it } from 'vitest';
import { ParticleSystem } from '../src/render/particles';
import { mulberry32 } from '../src/engine/rng';

describe('ParticleSystem', () => {
  it('emits and recycles particles back into the pool', () => {
    const ps = new ParticleSystem(16, mulberry32(3));
    const initialPool = ps.pooledCount;
    ps.burst(100, 100, 0xffdf70, 10);
    expect(ps.activeCount).toBe(10);
    for (let i = 0; i < 600; i += 1) ps.update(1 / 60);
    expect(ps.activeCount).toBe(0);
    expect(ps.pooledCount).toBe(initialPool);
  });

  it('never exceeds capacity', () => {
    const ps = new ParticleSystem(4, mulberry32(4));
    for (let i = 0; i < 20; i += 1) ps.emit(0, 0, 0, 0, 10, 0xffffff);
    expect(ps.activeCount).toBe(4);
  });

  it('applies gravity to velocity', () => {
    const ps = new ParticleSystem(2, mulberry32(5));
    ps.emit(0, 0, 0, 0, 10, 0xffffff);
    ps.update(1, 100);
    expect(ps.active[0]!.vy).toBeCloseTo(100, 5);
  });
});
