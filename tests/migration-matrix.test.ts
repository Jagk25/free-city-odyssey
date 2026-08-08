import { describe, expect, it } from 'vitest';
import { migrate, SAVE_VERSION } from '../src/engine/save-system';

describe('save migration matrix', () => {
  it('v0 (prototype) migrates with all v2 fields defaulted', () => {
    const v0 = {
      S: { day: 2, min: 700, cash: 90, rep: 3, energy: 50, quest: 'bank', flags: { vision: true }, inv: { 'Old Key': 1 } },
      hx: 9,
      hy: 11,
    };
    const m = migrate(v0);
    expect(m.version).toBe(SAVE_VERSION);
    expect(m.cash).toBe(90);
    expect(m.solvedTerminals).toEqual([]);
    expect(m.side).toEqual({ cat: 0, pack: 0, photo: 0, photoSpots: 0 });
    expect(m.xp).toBe(0);
    expect(m.level).toBe(1);
  });

  it('v1 (scaffold) migrates by adding v2 fields', () => {
    const v1 = {
      version: 1,
      day: 4,
      minute: 800,
      cash: 120,
      rep: 6,
      energy: 70,
      quest: 'garden',
      flags: { metMaya: true },
      inventory: { 'Glitch Lens': 1 },
      player: { x: 12, y: 13 },
    };
    const m = migrate(v1 as unknown as Record<string, unknown>);
    expect(m.version).toBe(SAVE_VERSION);
    expect(m.cash).toBe(120);
    expect(m.flags.metMaya).toBe(true);
    expect(m.solvedTerminals).toEqual([]);
  });

  it('v2 passes through unchanged', () => {
    const v2 = {
      version: SAVE_VERSION,
      day: 5,
      minute: 900,
      cash: 200,
      rep: 10,
      energy: 100,
      xp: 40,
      level: 2,
      quest: 'server',
      flags: { vision: true },
      inventory: { 'Core Chip': 1 },
      solvedTerminals: ['cafe', 'bank'],
      side: { cat: 3, pack: 2, photo: 1, photoSpots: 2 },
      player: { x: 16, y: 16 },
    };
    const m = migrate(v2 as unknown as Record<string, unknown>);
    expect(m).toEqual(v2);
  });
});
