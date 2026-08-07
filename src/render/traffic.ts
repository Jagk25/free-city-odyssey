export type CarDir = 'E' | 'W' | 'S' | 'N';

export interface Car {
  x: number;
  y: number;
  dir: CarDir;
  speed: number;
  color: number;
}

export const CAR_COLORS: readonly number[] = [
  0xc0392b, 0x2980b9, 0xf1c40f, 0x2ecc71, 0xe67e22, 0x9b59b6, 0x1abc9c, 0xe74c3c,
];

export const ROUTES: readonly { x: number; y: number; dir: CarDir }[] = [
  { x: -0.5, y: 2.35, dir: 'E' },
  { x: 27.5, y: 2.35, dir: 'W' },
  { x: 2.35, y: -0.5, dir: 'S' },
  { x: 2.35, y: 27.5, dir: 'N' },
  { x: 7.35, y: -0.5, dir: 'S' },
  { x: 7.35, y: 27.5, dir: 'N' },
  { x: -0.5, y: 7.35, dir: 'E' },
  { x: 27.5, y: 7.35, dir: 'W' },
  { x: 12.35, y: -0.5, dir: 'S' },
  { x: -0.5, y: 12.35, dir: 'E' },
];

export function spawnCars(count: number, rng: () => number): Car[] {
  const cars: Car[] = [];
  for (let i = 0; i < count; i += 1) {
    const route = ROUTES[Math.floor(rng() * ROUTES.length)]!;
    cars.push({
      x: route.x,
      y: route.y,
      dir: route.dir,
      speed: 0.8 + rng() * 0.7,
      color: CAR_COLORS[Math.floor(rng() * CAR_COLORS.length)]!,
    });
  }
  return cars;
}

/** Advances one car; wraps at the map edge and re-rolls its color. Pure — no rendering imports. */
export function advanceCar(car: Car, dt: number, lim: number, rng: () => number): void {
  const delta = dt * car.speed;
  if (car.dir === 'E') car.x += delta;
  else if (car.dir === 'W') car.x -= delta;
  else if (car.dir === 'S') car.y += delta;
  else car.y -= delta;

  const wrapped =
    (car.dir === 'E' && car.x > lim) ||
    (car.dir === 'W' && car.x < -0.5) ||
    (car.dir === 'S' && car.y > lim) ||
    (car.dir === 'N' && car.y < -0.5);

  if (wrapped) {
    if (car.dir === 'E') car.x = -0.5;
    else if (car.dir === 'W') car.x = lim;
    else if (car.dir === 'S') car.y = -0.5;
    else car.y = lim;
    car.color = CAR_COLORS[Math.floor(rng() * CAR_COLORS.length)]!;
  }
}
