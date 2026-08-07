import { describe, expect, it } from 'vitest';
import { defaultSave, migrate, SAVE_VERSION } from '../src/engine/save-system';

describe('save migration', () => {
  it('migrates prototype v0 saves ({ S, hx, hy }) to v1', () => {
    const v0 = {
      S: { day: 3, min: 720, cash: 150, rep: 5, energy: 60, quest: 'bank', flags: { vision: true }, inv: { 'Old Key': 1 } },
      hx: 10,
      hy: 12,
    };
    const migrated = migrate(v0);
    expect(migrated.version).toBe(SAVE_VERSION);
    expect(migrated.day).toBe(3);
    expect(migrated.minute).toBe(720);
    expect(migrated.cash).toBe(150);
    expect(migrated.quest).toBe('bank');
    expect(migrated.flags.vision).toBe(true);
    expect(migrated.inventory['Old Key']).toBe(1);
    expect(migrated.player).toEqual({ x: 10, y: 12 });
  });

  it('returns defaults for corrupt input', () => {
    expect(migrate(null as unknown as Record<string, unknown>)).toEqual(defaultSave());
  });
});
