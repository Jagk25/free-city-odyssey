import { describe, expect, it } from 'vitest';
import { advanceClock, dayFactor, formatTime, isNight, DAY_MINUTES } from '../src/game/world-clock';

describe('world clock', () => {
  it('advances minutes and rolls over the day', () => {
    const a = advanceClock({ day: 1, minute: DAY_MINUTES - 1 }, 2 / 0.8);
    expect(a.day).toBe(2);
    expect(a.minute).toBeCloseTo(1, 5);
  });

  it('dayFactor peaks at 13:00 and is zero in deep night', () => {
    expect(dayFactor(13 * 60)).toBeCloseTo(1, 5);
    expect(dayFactor(4 * 60)).toBe(0);
  });

  it('isNight matches the lit-window threshold', () => {
    expect(isNight(0)).toBe(true);
    expect(isNight(13 * 60)).toBe(false);
  });

  it('formats padded time', () => {
    expect(formatTime(480)).toBe('08:00');
    expect(formatTime(61)).toBe('01:01');
  });
});
