import type { Graphics } from 'pixi.js';
import { dayFactor } from '../game/world-clock';
import { mulberry32 } from '../engine/rng';

export interface Star {
  x: number;
  y: number;
  tw: number;
}
export interface Cloud {
  x: number;
  y: number;
  s: number;
}
export interface Bird {
  x: number;
  y: number;
  s: number;
  ph: number;
}

export interface SkyEntities {
  stars: Star[];
  clouds: Cloud[];
  birds: Bird[];
}

/** Deterministic visual entities — same sky every launch. */
export function createSkyEntities(seed = 7): SkyEntities {
  const rng = mulberry32(seed);
  return {
    stars: Array.from({ length: 60 }, () => ({ x: rng(), y: rng() * 0.5, tw: rng() * 6 })),
    clouds: Array.from({ length: 6 }, (_, i) => ({ x: rng(), y: 0.05 + i * 0.07, s: 0.4 + rng() * 0.8 })),
    birds: Array.from({ length: 3 }, () => ({ x: rng(), y: 0.1 + rng() * 0.2, s: 0.5 + rng(), ph: rng() * 6 })),
  };
}

interface Rgb {
  r: number;
  g: number;
  b: number;
}

const DAY_TOP: Rgb = { r: 0x2a, g: 0x6a, b: 0xb0 };
const DAY_BOT: Rgb = { r: 0x7e, g: 0xc8, b: 0xe8 };
const DUSK_TOP: Rgb = { r: 0x1a, g: 0x3a, b: 0x70 };
const DUSK_BOT: Rgb = { r: 0xe8, g: 0x90, b: 0x6a };
const NIGHT_TOP: Rgb = { r: 0x06, g: 0x0a, b: 0x1e };
const NIGHT_BOT: Rgb = { r: 0x1a, g: 0x24, b: 0x40 };

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function mix(a: Rgb, b: Rgb, t: number): Rgb {
  return { r: lerp(a.r, b.r, t), g: lerp(a.g, b.g, t), b: lerp(a.b, b.b, t) };
}

function toHex(c: Rgb): number {
  return (Math.round(c.r) << 16) | (Math.round(c.g) << 8) | Math.round(c.b);
}

function skyPalette(day: number): { top: Rgb; bot: Rgb } {
  if (day > 0.7) {
    const t = Math.min(1, (day - 0.7) / 0.3);
    return { top: mix(DUSK_TOP, DAY_TOP, t), bot: mix(DUSK_BOT, DAY_BOT, t) };
  }
  if (day > 0.35) {
    const t = (day - 0.35) / 0.35;
    return { top: mix(NIGHT_TOP, DUSK_TOP, t), bot: mix(NIGHT_BOT, DUSK_BOT, t) };
  }
  const t = (day / 0.35) * 0.4;
  return { top: mix(NIGHT_TOP, DUSK_TOP, t), bot: mix(NIGHT_BOT, DUSK_BOT, t) };
}

export interface SkyFrame {
  minute: number;
  timeMs: number;
  width: number;
  height: number;
  dtMs: number;
}

const STRIPS = 40;

export function drawSky(gfx: Graphics, frame: SkyFrame, entities: SkyEntities): void {
  const day = dayFactor(frame.minute);
  const { top, bot } = skyPalette(day);
  const { width: w, height: h } = frame;

  gfx.clear();
  for (let i = 0; i < STRIPS; i += 1) {
    const t = i / (STRIPS - 1);
    gfx.rect(0, (i * h) / STRIPS, w, h / STRIPS + 1).fill(toHex(mix(top, bot, t)));
  }

  if (day < 0.4) {
    for (const s of entities.stars) {
      const a = (0.3 + 0.7 * Math.abs(Math.sin(frame.timeMs * 0.001 + s.tw))) * (1 - day * 2);
      if (a <= 0) continue;
      gfx.rect(s.x * w, s.y * h, 1.6, 1.6).fill({ color: 0xffffff, alpha: a });
    }
  }

  const hour = (frame.minute / 60) % 24;
  const sunA = ((hour - 6) / 12) * Math.PI;
  const sx = w * 0.5 + Math.cos(sunA) * w * 0.42;
  const sy = h * 0.55 - Math.sin(sunA) * h * 0.4;
  if (day > 0.1) gfx.circle(sx, sy, 16).fill(0xffdf70);
  if (day < 0.5) {
    const mx = w * 0.5 - Math.cos(sunA) * w * 0.42;
    const my = h * 0.55 - Math.sin(sunA) * h * 0.35;
    gfx.circle(mx, my, 12).fill(0xdfe6f0);
    gfx.circle(mx + 5, my - 3, 10).fill(toHex(top));
  }

  for (const cl of entities.clouds) {
    cl.x += (frame.dtMs / 1000) * 0.004 * cl.s;
    if (cl.x > 1.2) cl.x = -0.25;
    const cx = cl.x * w;
    const cy = cl.y * h;
    const alpha = 0.1 + day * 0.14;
    gfx.ellipse(cx, cy, 70 * cl.s, 14 * cl.s).fill({ color: 0xffffff, alpha });
    gfx.ellipse(cx + 30 * cl.s, cy + 5, 45 * cl.s, 11 * cl.s).fill({ color: 0xffffff, alpha });
  }

  for (const b of entities.birds) {
    b.x += (frame.dtMs / 1000) * 0.02 * b.s;
    if (b.x > 1.1) {
      b.x = -0.1;
      b.y = 0.08 + ((b.ph * 7919) % 1) * 0.2;
    }
    const bx = b.x * w;
    const by = b.y * h + Math.sin(frame.timeMs * 0.004 + b.ph) * 8;
    const fl = Math.sin(frame.timeMs * 0.02 + b.ph) * 4;
    gfx
      .moveTo(bx - 6, by)
      .quadraticCurveTo(bx - 2, by - 4 - fl, bx, by)
      .quadraticCurveTo(bx + 2, by - 4 - fl, bx + 6, by)
      .stroke({ width: 1.6, color: 0x142332, alpha: 0.3 + day * 0.5 });
  }
}
