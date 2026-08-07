import { describe, expect, it } from 'vitest';
import { activeSeeker, SEEKER_RULES, updateSeekers } from '../src/game/seekers';
import { spawnNpcs } from '../src/game/npc';
import { mulberry32 } from '../src/engine/rng';

describe('seekers', () => {
  it('maya seeks until met, then zed, then ivy during photo quest', () => {
    const maya = SEEKER_RULES[0]!;
    const zed = SEEKER_RULES[1]!;
    const ivy = SEEKER_RULES[2]!;
    expect(activeSeeker(maya, {}, {})).toBe(true);
    expect(activeSeeker(zed, {}, {})).toBe(false);
    expect(activeSeeker(zed, { metMaya: true }, {})).toBe(true);
    expect(activeSeeker(zed, { metMaya: true, metZed: true }, {})).toBe(false);
    expect(activeSeeker(ivy, {}, { photo: 1, photoSpots: 1 })).toBe(true);
    expect(activeSeeker(ivy, {}, { photo: 1, photoSpots: 3 })).toBe(false);
  });

  it('seeking npc approaches the player and stops at conversation distance', () => {
    const rng = mulberry32(7);
    const npcs = spawnNpcs(rng);
    const player = { x: 14, y: 14 };
    for (let i = 0; i < 60 * 30; i += 1) {
      updateSeekers(npcs, player, {}, {}, 1 / 60);
    }
    const maya = npcs.find((n) => n.def.id === 'maya')!;
    const dist = Math.hypot(maya.x - player.x, maya.y - player.y);
    expect(dist).toBeLessThanOrEqual(2.2);
  });

  it('non-seeker rules leave npc seeking false', () => {
    const rng = mulberry32(8);
    const npcs = spawnNpcs(rng);
    updateSeekers(npcs, { x: 14, y: 14 }, { metMaya: true, metZed: true }, { photo: 0 }, 1 / 60);
    expect(npcs.every((n) => !n.seeking)).toBe(true);
  });
});
