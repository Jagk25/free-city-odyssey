export const DAY_MINUTES = 1440;
export const MINUTES_PER_SECOND = 0.8;

export interface WorldClock {
  day: number;
  minute: number;
}

export function advanceClock(
  clock: WorldClock,
  dtSeconds: number,
  rate = MINUTES_PER_SECOND,
): WorldClock {
  let minute = clock.minute + dtSeconds * rate;
  let day = clock.day;
  while (minute >= DAY_MINUTES) {
    minute -= DAY_MINUTES;
    day += 1;
  }
  return { day, minute };
}

/** 0 = deep night, 1 = full daylight. Peaks at 13:00. */
export function dayFactor(minute: number): number {
  const h = (minute / 60) % 24;
  return Math.max(0, Math.min(1, 1 - Math.abs(h - 13) / 9));
}

/** Lit-window / lamp-glow threshold shared by city rendering. */
export function isNight(minute: number): boolean {
  return dayFactor(minute) < 0.4;
}

export function formatTime(minute: number): string {
  const h = Math.floor(minute / 60) % 24;
  const m = Math.floor(minute % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
