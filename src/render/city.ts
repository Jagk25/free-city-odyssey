import { Graphics, Text } from 'pixi.js';
import { gridToScreen } from './iso-math';
import { isNight } from '../game/world-clock';

export interface BuildingData {
  id: string;
  name: string;
  x: number;
  y: number;
  w: number;
  d: number;
  h: number;
  color: string;
  feature: string;
  door: { x: number; y: number };
}

export interface PropData {
  type: string;
  x: number;
  y: number;
}

export interface EmitterPoint {
  x: number;
  y: number;
  kind: 'smoke' | 'fountain';
}

export function shade(hex: string, amt: number): number {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.max(0, (n >> 16) + amt));
  const g = Math.min(255, Math.max(0, ((n >> 8) & 255) + amt));
  const b = Math.min(255, Math.max(0, (n & 255) + amt));
  return (r << 16) | (g << 8) | b;
}

export function isRoad(x: number, y: number): boolean {
  return Math.abs((x % 5) - 2) < 0.75 || Math.abs((y % 5) - 2) < 0.75;
}

function tileColor(x: number, y: number): number {
  if (x > 24 && y > 24) return 0x344e60;
  if (x < 3 && y < 3) return 0x2f7147;
  return isRoad(x, y) ? 0x4d576a : 0x3d7e50;
}

function drawTiles(gfx: Graphics, width: number, height: number): void {
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const p = gridToScreen(x, y);
      gfx
        .poly([p.x, p.y - 18, p.x + 36, p.y, p.x, p.y + 18, p.x - 36, p.y])
        .fill(tileColor(x, y));
      if (isRoad(x, y)) {
        gfx.rect(p.x - 35, p.y - 2, 5, 4).fill(0x30394b);
        gfx.rect(p.x + 30, p.y - 2, 5, 4).fill(0x30394b);
        if ((x + y) % 4 === 0) gfx.rect(p.x - 2, p.y - 2, 4, 4).fill(0xdec359);
      } else if ((x * 11 + y * 7) % 5 === 0) {
        gfx.rect(p.x - 5, p.y - 3, 4, 3).fill(0x2b6840);
      }
    }
  }
}

function drawPropBase(gfx: Graphics, prop: PropData): void {
  const p = gridToScreen(prop.x, prop.y);
  switch (prop.type) {
    case 'lamp':
      gfx.rect(p.x - 2, p.y - 32, 4, 30).fill(0x263247);
      gfx.rect(p.x - 5, p.y - 35, 10, 5).fill(0xffdf76);
      break;
    case 'tree':
      gfx.rect(p.x - 2, p.y - 18, 4, 18).fill(0x5b3b24);
      gfx.circle(p.x, p.y - 23, 10).fill(0x1c4a2c);
      gfx.circle(p.x - 4, p.y - 27, 7).fill(0x36703d);
      gfx.circle(p.x + 5, p.y - 27, 6).fill(0x36703d);
      break;
    case 'bench':
      gfx.rect(p.x - 10, p.y - 9, 20, 4).fill(0x69462b);
      gfx.rect(p.x - 8, p.y - 5, 3, 5).fill(0x69462b);
      gfx.rect(p.x + 5, p.y - 5, 3, 5).fill(0x69462b);
      break;
    case 'bin':
      gfx.rect(p.x - 4, p.y - 12, 8, 12).fill(0x344254);
      gfx.rect(p.x - 5, p.y - 14, 10, 3).fill(0x617184);
      break;
    case 'fountain':
      gfx.ellipse(p.x, p.y - 3, 16, 7).fill(0x5a6a7a);
      gfx.ellipse(p.x, p.y - 5, 12, 5).fill(0x3a4a5a);
      gfx.ellipse(p.x, p.y - 6, 9, 3.5).fill(0x7ec8e8);
      break;
    case 'statue':
      gfx.rect(p.x - 6, p.y - 6, 12, 6).fill(0x6a7a8a);
      gfx.rect(p.x - 3, p.y - 22, 6, 16).fill(0x8a9aaa);
      gfx.circle(p.x, p.y - 25, 4).fill(0x8a9aaa);
      break;
    case 'hydrant':
      gfx.rect(p.x - 3, p.y - 10, 6, 10).fill(0xc0392b);
      gfx.rect(p.x - 5, p.y - 7, 10, 3).fill(0xc0392b);
      gfx.circle(p.x, p.y - 11, 3).fill(0xc0392b);
      break;
    case 'phone':
      gfx.rect(p.x - 5, p.y - 22, 10, 22).fill(0x8a2a3a);
      gfx.rect(p.x - 3, p.y - 19, 6, 10).fill({ color: 0xaee8ff, alpha: 0.35 });
      gfx.rect(p.x - 4, p.y - 24, 8, 2).fill(0xffdf70);
      break;
    default:
      break;
  }
}

function drawBuildingBase(gfx: Graphics, b: BuildingData): Text {
  const corners: [{ x: number; y: number }, { x: number; y: number }, { x: number; y: number }, { x: number; y: number }] = [    gridToScreen(b.x, b.y),
    gridToScreen(b.x + b.w, b.y),
    gridToScreen(b.x + b.w, b.y + b.d),
    gridToScreen(b.x, b.y + b.d),
  ];
  const top: [{ x: number; y: number }, { x: number; y: number }, { x: number; y: number }, { x: number; y: number }] = corners.map((c) => ({ x: c.x, y: c.y - b.h })) as typeof top;  con
  st col = parseInt(b.color.slice(1), 16);

  gfx
    .poly([
      corners[0].x + 5, corners[0].y + 7, corners[1].x + 5, corners[1].y + 7,
      corners[2].x + 5, corners[2].y + 7, corners[3].x + 5, corners[3].y + 7,
    ])
    .fill({ color: 0x000000, alpha: 0.22 });
  gfx
    .poly([corners[0].x, corners[0].y, corners[3].x, corners[3].y, top[3].x, top[3].y, top[0].x, top[0].y])
    .fill(shade(b.color, -70));
  gfx
    .poly([corners[1].x, corners[1].y, corners[2].x, corners[2].y, top[2].x, top[2].y, top[1].x, top[1].y])
    .fill(shade(b.color, -95));
  gfx
    .poly([top[0].x, top[0].y, top[1].x, top[1].y, top[2].x, top[2].y, top[3].x, top[3].y])
    .fill(col);
  gfx
    .poly([top[0].x, top[0].y, top[1].x, top[1].y, top[2].x, top[2].y, top[3].x, top[3].y])
    .stroke({ width: 3, color: shade(b.color, -60) });

  const q = gridToScreen(b.x + b.w / 2, b.y + b.d / 2);

  switch (b.feature) {
    case 'columns':
      for (let i = -1; i <= 1; i += 1) gfx.rect(q.x + i * 12 - 2, q.y - 20, 4, 20).fill(shade(b.color, 30));
      break;
    case 'balcony':
      gfx.rect(q.x - 16, q.y - 30, 32, 3).fill(shade(b.color, -30));
      gfx.moveTo(q.x - 16, q.y - 30).lineTo(q.x - 16, q.y - 36).stroke({ width: 1, color: 0xffffff, alpha: 0.2 });
      gfx.moveTo(q.x + 16, q.y - 30).lineTo(q.x + 16, q.y - 36).stroke({ width: 1, color: 0xffffff, alpha: 0.2 });
      break;
    case 'awning':
      gfx
        .poly([q.x - 16, q.y - b.h + 34, q.x + 16, q.y - b.h + 34, q.x + 12, q.y - b.h + 42, q.x - 12, q.y - b.h + 42])
        .fill(0xe05c5c);
      for (let i = -2; i < 3; i += 1) {
        gfx.rect(q.x + i * 6 - 3, q.y - b.h + 34, 6, 8).fill(i % 2 ? 0xffffff : 0xe05c5c);
      }
      break;
    case 'dish':
      gfx.moveTo(q.x, q.y - b.h).lineTo(q.x, q.y - b.h - 12).stroke({ width: 2, color: 0xa5b3c2 });
      gfx.arc(q.x + 3, q.y - b.h - 14, 6, -0.6, 1.8).stroke({ width: 2, color: 0xa5b3c2 });
      break;
    case 'crane':
      gfx
        .moveTo(q.x - 14, q.y - b.h)
        .lineTo(q.x - 14, q.y - b.h - 20)
        .lineTo(q.x + 10, q.y - b.h - 20)
        .stroke({ width: 3, color: 0xc9a03a });
      gfx.moveTo(q.x + 6, q.y - b.h - 20).lineTo(q.x + 6, q.y - b.h - 8).stroke({ width: 1, color: 0xc9a03a, alpha: 0.5 });
      break;
    case 'dome':
      gfx.arc(q.x, q.y - b.h, 14, Math.PI, 0).fill(shade(b.color, 20));
      gfx.circle(q.x, q.y - b.h - 14, 2.5).fill(0xffdf70);
      break;
    case 'chimney':
      gfx.rect(q.x + 8, q.y - b.h - 12, 7, 12).fill(0x5a4a3a);
      break;
    default:
      break;
  }

  gfx.rect(q.x - 10, q.y - 17, 20, 17).fill(0x17253b);
  gfx.rect(q.x - 34, q.y - b.h + 1, 68, 15).fill(0x0b1730);
  gfx.rect(q.x - 34, q.y - b.h + 1, 68, 15).stroke({ width: 1, color: 0xffffff, alpha: 0.2 });

  const label = new Text({
    text: b.name,
    style: { fill: 0xffffff, fontFamily: 'monospace', fontSize: 9, fontWeight: 'bold' },
  });
  label.anchor.set(0.5, 0.5);
  label.position.set(q.x, q.y - b.h + 9);
  return label;
}

/** Static city: tiles, props, building shells. Drawn once. Returns building name labels to add to the stage. */
export function drawCityBase(
  gfx: Graphics,
  buildings: BuildingData[],
  props: PropData[],
  mapWidth: number,
  mapHeight: number,
): Text[] {
  drawTiles(gfx, mapWidth, mapHeight);
  for (const prop of props) drawPropBase(gfx, prop);
  const sorted = [...buildings].sort((a, b) => a.x + a.y - (b.x + b.y));
  return sorted.map((b) => drawBuildingBase(gfx, b));
}

/** Animated city layer: lit windows, door glow, door mats, beacon, neon, lanterns, lamp glows. Redrawn at ~10Hz. */
export function drawCityAnimated(
  gfx: Graphics,
  buildings: BuildingData[],
  props: PropData[],
  minute: number,
  timeMs: number,
): void {
  gfx.clear();
  const night = isNight(minute);

  for (const b of buildings) {
    const q = gridToScreen(b.x + b.w / 2, b.y + b.d / 2);
    const floors = Math.max(2, Math.floor(b.h / 20));
    for (let f = 0; f < floors; f += 1) {
      const wy = q.y - 14 - f * 16;
      if (wy < q.y - b.h + 18) break;
      for (let i = -1; i <= 1; i += 1) {
        const on = night || Math.sin(timeMs * 0.003 + i + f + b.x + b.y) > 0.45;
        gfx.rect(q.x + i * 12 - 3, wy - 8, 6, 6).fill(on ? 0xffe582 : 0x173352);
      }
    }

    gfx.rect(q.x - 7, q.y - 14, 14, 9).fill(night ? 0xffdf76 : 0x8ce1ff);

    const dm = gridToScreen(b.door.x, b.door.y);
    gfx.ellipse(dm.x, dm.y, 11, 4.5).fill({ color: 0xffdf70, alpha: 0.25 + 0.1 * Math.sin(timeMs * 0.006) });

    if (b.feature === 'beacon') {
      const on = Math.sin(timeMs * 0.01) > 0;
      gfx.rect(q.x - 3, q.y - b.h - 14, 6, 14).fill(0x263445);
      gfx.circle(q.x, q.y - b.h - 17, 4).fill(on ? 0xff4040 : 0x4040ff);
    }
    if (b.feature === 'neon') {
      const colors = [0xff5ce0, 0x5ce0ff, 0xffe05c];
      gfx.rect(q.x - 26, q.y - b.h + 20, 52, 5).fill(colors[Math.floor(timeMs * 0.004) % 3]!);
    }
    if (b.feature === 'lanterns') {
      for (let i = -2; i <= 2; i += 1) {
        const lx = q.x + i * 11;
        const ly = q.y - b.h + 24 + Math.sin(timeMs * 0.004 + i) * 2;
        gfx.circle(lx, ly + 3, 3).fill([0xffdf70, 0xff8a5c, 0x5cff8a][Math.abs(i) % 3]!);
      }
    }
  }

  for (const prop of props) {
    if (prop.type !== 'lamp') continue;
    const p = gridToScreen(prop.x, prop.y);
    const glow = night ? 16 : 9;
    gfx.circle(p.x, p.y - 29, glow + Math.sin(timeMs * 0.005 + prop.x) * 2).fill({ color: 0xffe7a0, alpha: 0.27 });
  }
}

/** Particle emitter positions: chimneys + fountains, in screen space. */
export function getEmitters(buildings: BuildingData[], props: PropData[]): EmitterPoint[] {
  const points: EmitterPoint[] = [];
  for (const b of buildings) {
    if (b.feature === 'chimney') {
      const p = gridToScreen(b.x + b.w / 2, b.y + b.d / 2);
      points.push({ x: p.x + 11, y: p.y - b.h - 14, kind: 'smoke' });
    }
  }
  for (const prop of props) {
    if (prop.type === 'fountain') {
      const p = gridToScreen(prop.x, prop.y);
      points.push({ x: p.x, y: p.y - 10, kind: 'fountain' });
    }
  }
  return points;
}
