import { describe, expect, it } from 'vitest';
import {
  checkCombo,
  checkLineup,
  checkMemoryInput,
  checkRiddle,
  haggleOffer,
  mastermindScore,
  newHaggle,
  newMastermindCode,
  newMemorySequence,
  nextReactionZone,
  reactionHit,
  shuffled,
} from '../src/minigames/logic';
import { mulberry32 } from '../src/engine/rng';

describe('memory lock', () => {
  it('generates the requested length and validates steps', () => {
    const seq = newMemorySequence(mulberry32(1), 5);
    expect(seq).toHaveLength(5);
    expect(checkMemoryInput(seq, 0, seq[0]!)).toBe(true);
    expect(checkMemoryInput(seq, 0, (seq[0]! + 1) % 4)).toBe(false);
  });
});

describe('combination lock', () => {
  it('accepts the exact combo only', () => {
    expect(checkCombo([2, 6, 3], [2, 6, 3])).toBe(true);
    expect(checkCombo([2, 6, 3], [2, 6, 4])).toBe(false);
  });
});

describe('wire relink', () => {
  it('shuffles deterministically with a seed', () => {
    const a = shuffled([1, 2, 3, 4], mulberry32(7));
    const b = shuffled([1, 2, 3, 4], mulberry32(7));
    expect(a).toEqual(b);
    expect([...a].sort()).toEqual([1, 2, 3, 4]);
  });
});

describe('vault cipher (mastermind)', () => {
  it('scores exact and misplaced correctly', () => {
    expect(mastermindScore([1, 2, 3, 4], [1, 2, 3, 4])).toEqual({ exact: 4, misplaced: 0 });
    expect(mastermindScore([1, 2, 3, 4], [4, 3, 2, 1])).toEqual({ exact: 0, misplaced: 4 });
    expect(mastermindScore([1, 1, 2, 2], [1, 3, 3, 3])).toEqual({ exact: 1, misplaced: 0 });
  });

  it('codes use digits 1-6', () => {
    const code = newMastermindCode(mulberry32(8));
    expect(code).toHaveLength(4);
    for (const d of code) {
      expect(d).toBeGreaterThanOrEqual(1);
      expect(d).toBeLessThanOrEqual(6);
    }
  });
});

describe('riddle + lineup', () => {
  it('riddle accepts only the correct index', () => {
    expect(checkRiddle(2, 2)).toBe(true);
    expect(checkRiddle(2, 1)).toBe(false);
  });

  it('lineup accepts only the guilty suspect', () => {
    const suspects = [
      { label: 'A', guilty: false },
      { label: 'B', guilty: true },
    ];
    expect(checkLineup(suspects, 1)).toBe(true);
    expect(checkLineup(suspects, 0)).toBe(false);
  });
});

describe('reflex circuit', () => {
  it('hit detection respects the zone', () => {
    expect(reactionHit(50, 40, 16)).toBe(true);
    expect(reactionHit(30, 40, 16)).toBe(false);
  });

  it('zones shrink per hit', () => {
    const z = nextReactionZone(mulberry32(9), 16);
    expect(z.width).toBe(14);
    expect(z.left).toBeGreaterThanOrEqual(15);
  });
});

describe('haggle', () => {
  it('accepts offers at or above the hidden minimum', () => {
    const state = newHaggle(mulberry32(10));
    const r = haggleOffer(state, 95);
    expect(r.accepted).toBe(true);
    expect(r.finalPrice).toBe(95);
  });

  it('lowers the minimum on rejection and ends with a final price', () => {
    let state = newHaggle(mulberry32(11));
    let r = haggleOffer(state, 1);
    expect(r.accepted).toBe(false);
    expect(r.state.min).toBeLessThan(state.min);
    state = r.state;
    r = haggleOffer(state, 1);
    state = r.state;
    r = haggleOffer(state, 1);
    expect(r.finalPrice).toBe(95);
  });
});
