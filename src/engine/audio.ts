export type SfxId = 'door' | 'coin' | 'alert' | 'blip' | 'fail' | 'fragment' | 'level';
type OscType = 'sine' | 'square' | 'triangle' | 'sawtooth';

export interface Tone {
  freq: number;
  delay: number;
  dur: number;
  type: OscType;
  vol: number;
}

/** Procedural SFX schedule — pure data, unit-tested, zero assets. */
export const SFX: Record<SfxId, Tone[]> = {
  door: [{ freq: 180, delay: 0, dur: 0.12, type: 'square', vol: 0.05 }],
  coin: [
    { freq: 880, delay: 0, dur: 0.12, type: 'square', vol: 0.045 },
    { freq: 1200, delay: 0.05, dur: 0.12, type: 'square', vol: 0.045 },
  ],
  alert: [
    { freq: 440, delay: 0, dur: 0.15, type: 'sawtooth', vol: 0.05 },
    { freq: 330, delay: 0.09, dur: 0.15, type: 'sawtooth', vol: 0.05 },
    { freq: 220, delay: 0.18, dur: 0.15, type: 'sawtooth', vol: 0.05 },
  ],
  blip: [{ freq: 660, delay: 0, dur: 0.06, type: 'square', vol: 0.02 }],
  fail: [{ freq: 140, delay: 0, dur: 0.18, type: 'sawtooth', vol: 0.05 }],
  fragment: [
    { freq: 520, delay: 0, dur: 0.1, type: 'sine', vol: 0.04 },
    { freq: 780, delay: 0.06, dur: 0.1, type: 'sine', vol: 0.04 },
    { freq: 1040, delay: 0.12, dur: 0.1, type: 'sine', vol: 0.04 },
  ],
  level: [
    { freq: 440, delay: 0, dur: 0.14, type: 'square', vol: 0.04 },
    { freq: 554, delay: 0.08, dur: 0.14, type: 'square', vol: 0.04 },
    { freq: 659, delay: 0.16, dur: 0.14, type: 'square', vol: 0.04 },
    { freq: 880, delay: 0.24, dur: 0.14, type: 'square', vol: 0.04 },
  ],
};

/** Original chiptune score — semitone rows, 8 steps each, cycling. */
export const SONG_ROWS: number[][] = [
  [0, 4, 7, 11, 7, 4, 2, 4],
  [0, 5, 7, 12, 7, 5, 2, 5],
  [-5, 0, 4, 7, 4, 0, -1, 0],
  [-2, 2, 5, 9, 5, 2, 0, 2],
];
export const SONG_STEP_MS = 180;

export function musicNote(step: number): { freq: number; bass: boolean; sparkle: boolean } {
  const row = SONG_ROWS[Math.floor(step / 8) % SONG_ROWS.length]!;
  const semi = row[step % 8]!;
  return {
    freq: 220 * Math.pow(2, semi / 12),
    bass: step % 2 === 0,
    sparkle: step % 4 === 2,
  };
}

/**
 * Gesture-gated audio bus. Browsers suspend AudioContext until a user
 * gesture — call unlock() from a pointer/key handler before any playback.
 */
export class AudioBus {
  private ctx: AudioContext | null = null;
  private musicTimer: ReturnType<typeof setInterval> | null = null;
  private step = 0;
  private unlocked = false;
  private musicOn = false;
  private tracks = new Map<string, import('howler').Howl>();

  get isUnlocked(): boolean {
    return this.unlocked;
  }

  get isMusicOn(): boolean {
    return this.musicOn;
  }

  async unlock(): Promise<void> {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const Ctor =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
    }
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    this.unlocked = true;
  }

  sfx(id: SfxId): void {
    if (!this.unlocked || !this.ctx) return;
    const now = this.ctx.currentTime;
    for (const tone of SFX[id]) {
      this.tone(tone.freq, now + tone.delay, tone.dur, tone.type, tone.vol);
    }
  }

  toggleMusic(): boolean {
    if (this.musicOn) {
      this.stopMusic();
      return false;
    }
    if (!this.unlocked || !this.ctx) return false;
    this.musicOn = true;
    this.playStep();
    this.musicTimer = setInterval(() => this.playStep(), SONG_STEP_MS);
    return true;
  }

  stopMusic(): void {
    this.musicOn = false;
    if (this.musicTimer) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  private playStep(): void {
    if (!this.ctx) return;
    const note = musicNote(this.step);
    const now = this.ctx.currentTime;
    this.tone(note.freq, now, 0.17, 'square', 0.022);
    if (note.bass) this.tone(note.freq / 2, now, 0.14, 'triangle', 0.032);
    if (note.sparkle) this.tone(note.freq * 2, now, 0.06, 'sine', 0.012);
    this.step += 1;
  }

  private tone(freq: number, when: number, dur: number, type: OscType, vol: number): void {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, when);
    gain.gain.exponentialRampToValueAtTime(vol, when + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(when);
    osc.stop(when + dur + 0.02);
  }

  /** Reserved for composed tracks (P6+). Dynamic import keeps node tests safe. */
  async registerTrack(id: string, src: string[]): Promise<void> {
    const { Howl } = await import('howler');
    this.tracks.set(id, new Howl({ src }));
  }
}
