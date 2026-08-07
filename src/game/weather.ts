export type WeatherKind = 'clear' | 'rain' | 'fog';
export const WEATHER_KINDS: readonly WeatherKind[] = ['clear', 'rain', 'fog'];

export interface WeatherState {
  kind: WeatherKind;
  timer: number;
}

export function initialWeather(): WeatherState {
  return { kind: 'clear', timer: 30 };
}

export function nextWeather(rng: () => number): WeatherKind {
  return WEATHER_KINDS[Math.floor(rng() * WEATHER_KINDS.length)]!;
}

/** Counts down the current condition, then rolls a new one (32–74s). Seeded RNG keeps it deterministic. */
export function advanceWeather(
  state: WeatherState,
  dt: number,
  rng: () => number,
): { state: WeatherState; changed: boolean } {
  const timer = state.timer - dt;
  if (timer > 0) return { state: { ...state, timer }, changed: false };
  return {
    state: { kind: nextWeather(rng), timer: 32 + rng() * 42 },
    changed: true,
  };
}
