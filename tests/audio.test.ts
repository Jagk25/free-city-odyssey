import { describe, expect, it } from 'vitest';
import { SFX, SONG_ROWS, musicNote } from '../src/engine/audio';

describe('audio data', () => {
  it('every sfx has at least one tone with sane values', () => {
    for (const tones of Object.values(SFX)) {
      expect(tones.length).toBeGreaterThan(0);
      for (const t of tones) {
        expect(t.freq).toBeGreaterThan(0);
        expect(t.delay).toBeGreaterThanOrEqual(0);
        expect(t.dur).toBeGreaterThan(0);
        expect(t.vol).toBeGreaterThan(0);
      }
    }
  });

  it('music sequencer is deterministic and cycles', () => {
    expect(musicNote(0)).toEqual(musicNote(SONG_ROWS.length * 8));
    expect(musicNote(2).sparkle).toBe(true);
    expect(musicNote(1).bass).toBe(false);
  });
});
