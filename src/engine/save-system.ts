export const SAVE_VERSION = 1;
const KEY = 'freecity.save';

export interface SaveGame {
  version: number;
  day: number;
  minute: number;
  cash: number;
  rep: number;
  energy: number;
  quest: string;
  flags: Record<string, unknown>;
  inventory: Record<string, number>;
  player: { x: number; y: number };
}

export function defaultSave(): SaveGame {
  return {
    version: SAVE_VERSION,
    day: 1,
    minute: 8 * 60,
    cash: 40,
    rep: 0,
    energy: 100,
    quest: 'routine',
    flags: {},
    inventory: {},
    player: { x: 5.25, y: 5.25 },
  };
}

/** Migrates any older/raw save shape to the current version. v0 = prototype { S, hx, hy }. */
export function migrate(raw: Record<string, unknown>): SaveGame {
  const base = defaultSave();
  if (typeof raw !== 'object' || raw === null) return base;

  if ('S' in raw) {
    const s = raw.S as Record<string, unknown>;
    return {
      ...base,
      day: Number(s.day) || 1,
      minute: Number(s.min) || 480,
      cash: Number(s.cash) || 0,
      rep: Number(s.rep) || 0,
      energy: Number(s.energy) || 100,
      quest: String(s.quest ?? 'routine'),
      flags: (s.flags as Record<string, unknown>) ?? {},
      inventory: (s.inv as Record<string, number>) ?? {},
      player: { x: Number(raw.hx) || 5.25, y: Number(raw.hy) || 5.25 },
    };
  }

  return { ...base, ...(raw as Partial<SaveGame>), version: SAVE_VERSION };
}

export function save(state: SaveGame, storage: Storage = localStorage): void {
  storage.setItem(KEY, JSON.stringify(state));
}

export function load(storage: Storage = localStorage): SaveGame {
  try {
    const text = storage.getItem(KEY);
    if (!text) return defaultSave();
    return migrate(JSON.parse(text) as Record<string, unknown>);
  } catch {
    return defaultSave();
  }
}
