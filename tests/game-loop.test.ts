import { describe, expect, it } from 'vitest';
import { GameLoop, STEP } from '../src/engine/game-loop';

function counter(): { loop: GameLoop; updates: () => number } {
  let updates = 0;
  const loop = new GameLoop({
    update: () => {
      updates += 1;
    },
    render: () => {},
  });
  return { loop, updates: () => updates };
}

describe('GameLoop deterministic stepping', () => {
  it('runs exactly one update per 1/60s of accumulated time', () => {
    const { loop, updates } = counter();
    loop.tick(STEP);
    expect(updates()).toBe(1);
    loop.tick(STEP / 2);
    expect(updates()).toBe(1);
    loop.tick(STEP / 2);
    expect(updates()).toBe(2);
  });

  it('caps catch-up at 5 steps and drops backlog', () => {
    const { loop, updates } = counter();
    loop.tick(10);
    expect(updates()).toBe(5);
  });

  it('produces identical step counts for identical delta sequences', () => {
    const run = (): number => {
      const { loop, updates } = counter();
      for (const d of [0.016, 0.033, 0.008, 0.25, 0.5]) loop.tick(d);
      return updates();
    };
    expect(run()).toBe(run());
  });
});
