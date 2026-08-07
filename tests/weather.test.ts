import { describe, expect, it } from 'vitest';
import { advanceWeather, initialWeather, nextWeather, WEATHER_KINDS } from '../src/game/weather';
import { mulberry32 } from '../src/engine/rng';

describe('weather director', () => {
  it('counts down without changing kind', () => {
    const rng = mulberry32(1);
    const { state, changed } = advanceWeather(initialWeather(), 5, rng);
    expect(changed).toBe(false);
    expect(state.kind).toBe('clear');
    expect(state.timer).toBeLessThan(30);
  });

  it('changes kind when the timer expires and re-arms', () => {
    const rng = mulberry32(2);
    const { state, changed } = advanceWeather({ kind: 'clear', timer: 0.1 }, 1, rng);
    expect(changed).toBe(true);
    expect(WEATHER_KINDS).toContain(state.kind);
    expect(state.timer).toBeGreaterThanOrEqual(32);
  });

  it('is deterministic for the same seed', () => {
    const seq = (seed: number): string => {
      const rng = mulberry32(seed);
      return Array.from({ length: 20 }, () => nextWeather(rng)).join(',');
    };
    expect(seq(9)).toBe(seq(9));
  });
});
