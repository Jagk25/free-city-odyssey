import { describe, expect, it } from 'vitest';
import { advanceCar, spawnCars, CAR_COLORS, ROUTES } from '../src/render/traffic';
import { mulberry32 } from '../src/engine/rng';

describe('traffic', () => {
  it('spawns cars on valid routes', () => {
    const cars = spawnCars(10, mulberry32(11));
    expect(cars).toHaveLength(10);
    for (const car of cars) {
      expect(CAR_COLORS).toContain(car.color);
      expect(ROUTES.some((r) => r.dir === car.dir)).toBe(true);
    }
  });

  it('moves with speed and wraps at the limit with a new color', () => {
    const rng = mulberry32(12);
    const car = { x: 27.7, y: 2.35, dir: 'E' as const, speed: 1, color: CAR_COLORS[0]! };
    advanceCar(car, 0.2, 27.8, rng);
    expect(car.x).toBe(-0.5);
    expect(CAR_COLORS).toContain(car.color);
  });

  it('is deterministic for the same seed', () => {
    const run = (seed: number): string => {
      const rng = mulberry32(seed);
      const cars = spawnCars(5, rng);
      for (let i = 0; i < 100; i += 1) {
        for (const c of cars) advanceCar(c, 1 / 60, 27.8, rng);
      }
      return cars.map((c) => `${c.x.toFixed(3)},${c.y.toFixed(3)},${c.color}`).join('|');
    };
    expect(run(21)).toBe(run(21));
  });
});
