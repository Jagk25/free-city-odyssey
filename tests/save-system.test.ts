import { describe, expect, it } from 'vitest';
import { defaultSave, migrate, SAVE_VERSION } from '../src/engine/save-system';

describe('save migration', () => {
  it('migrates prototype v0 saves ({ S, hx, hy }) to v2', () => {
    const v0 = {
      S: { day: 3, min: 720, cash: 150, rep: 5, energy: 60, quest: 'bank', flags: { vision: true }, inv: { 'Old Key': 1 } },
      hx: 10,
      hy: 12,
    };
    const migrated = migrate(v0);
    expect(migrated.version).toBe(SAVE_VERSION);
    expect(migrated.day).toBe(3);
    expect(migrated.cash).toBe(150);
    expect(migrated.quest).toBe('bank');
    expect(migrated.flags.vision).toBe(true);
    expect(migrated.inventory['Old Key']).toBe(1);
    expect(migrated.player).toEqual({ x: 10, y: 12 });
    expect(migrated.solvedTerminals).toEqual([]);
    expect(migrated.level).toBe(1);
  });

  it('migrates v1 saves by adding v2 fields', () => {
    const v1 = {
      version: 1,
      day: 2,
      minute: 600,
      cash: 80,
      rep: 2,
      energy: 90,
      quest: 'glasses',
      flags: {},
      inventory: {},
      player: { x: 8, y: 9 },
    };
    const migrated = migrate(v1 as unknown as Record<string, unknown>);
    expect(migrated.version).toBe(SAVE_VERSION);
    expect(migrated.cash).toBe(80);
    expect(migrated.solvedTerminals).toEqual([]);
    expect(migrated.side).toEqual({ cat: 0, pack: 0, photo: 0, photoSpots: 0 });
    expect(migrated.xp).toBe(0);
  });

  it('returns defaults for corrupt input', () => {
    expect(migrate(null as unknown as Record<string, unknown>)).toEqual(defaultSave());
  });
});
