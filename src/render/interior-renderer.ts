import { Container, Graphics, Text } from 'pixi.js';
import type { RenderInterior } from './renderer';
import { shade } from './city';

const RTW = 46;
const ROOM_W = 8;
const ROOM_H = 5;

const FURN_COLORS: Record<string, number> = {
  counter: 0x6b4a30,
  table: 0x7a5a3a,
  shelf: 0x4a3a2a,
  bed: 0x3a4a6a,
  sofa: 0x5a3a5a,
  desk: 0x3a3a4a,
  plant: 0x2a5a3a,
};

export class InteriorRenderer {
  readonly container = new Container();
  private readonly gfx = new Graphics();
  private readonly title = new Text({
    text: '',
    style: { fill: 0xffffff, fontFamily: 'monospace', fontSize: 15, fontWeight: 'bold' },
  });
  private readonly hint = new Text({
    text: 'WASD/Arrows to move . E to interact',
    style: { fill: 0x9fc9e8, fontFamily: 'monospace', fontSize: 11 },
  });

  constructor() {
    this.title.anchor.set(0.5, 0);
    this.hint.anchor.set(0.5, 1);
    this.container.addChild(this.gfx);
    this.container.addChild(this.title);
    this.container.addChild(this.hint);
  }

  draw(room: RenderInterior, timeMs: number, width: number, height: number): void {
    const ox = width / 2 - (ROOM_W * RTW) / 2;
    const oy = height / 2 - (ROOM_H * RTW) / 2;
    const accent = parseInt(room.color.slice(1), 16);

    this.gfx.clear();
    this.gfx.rect(0, 0, width, height).fill(0x0c1220);

    for (let y = 0; y < ROOM_H; y += 1) {
      for (let x = 0; x < ROOM_W; x += 1) {
        this.gfx.rect(ox + x * RTW, oy + y * RTW, RTW - 2, RTW - 2).fill((x + y) % 2 === 0 ? 0x182337 : 0x141d2e);
      }
    }

    this.gfx.rect(ox, oy - 30, ROOM_W * RTW, 26).fill({ color: accent, alpha: 0.35 });
    this.gfx.rect(ox + 20, oy - 24, 26, 18).fill({ color: 0xffffff, alpha: 0.07 });
    this.gfx.rect(ox + ROOM_W * RTW - 46, oy - 24, 26, 18).fill({ color: 0xffffff, alpha: 0.07 });

    for (const f of room.furn) {
      const X = ox + f.x * RTW;
      const Y = oy + f.y * RTW;
      const W2 = f.w * RTW;
      const H2 = f.h * RTW;
      if (f.type === 'rug') {
        this.gfx.rect(X + 2, Y + 2, W2 - 4, H2 - 4).fill({ color: accent, alpha: 0.27 });
        this.gfx.rect(X + 6, Y + 6, W2 - 12, H2 - 12).stroke({ width: 1, color: accent, alpha: 0.5 });
        continue;
      }
      this.gfx.rect(X + 3, Y + 4, W2 - 4, H2 - 4).fill({ color: 0x000000, alpha: 0.25 });
      this.gfx.rect(X + 2, Y + 2, W2 - 6, H2 - 6).fill(FURN_COLORS[f.type] ?? 0x555555);
      this.gfx.rect(X + 2, Y + 2, W2 - 6, 4).fill({ color: 0xffffff, alpha: 0.13 });
      if (f.type === 'plant') this.gfx.circle(X + W2 / 2, Y + H2 / 2 - 4, 8).fill(0x3a7a4a);
      if (f.type === 'bed') this.gfx.rect(X + 5, Y + 5, W2 - 14, 8).fill(0xdfe6ff);
      if (f.type === 'shelf') {
        for (let i = 0; i < 3; i += 1) {
          this.gfx.rect(X + 5 + i * 8, Y + 6, 6, H2 - 14).fill([0xc05a5a, 0x5a8ac0, 0xc0a05a][i]!);
        }
      }
      if (f.type === 'desk') this.gfx.rect(X + W2 / 2 - 8, Y + 4, 16, 10).fill(0x4fd1ff);
    }

    if (room.item) {
      const ix = ox + room.item.x * RTW;
      const iy = oy + room.item.y * RTW;
      const pulse = 6 + Math.sin(timeMs * 0.008) * 3;
      this.gfx.circle(ix, iy, pulse).fill(0xffdf70);
      this.gfx.circle(ix, iy, 2.5).fill(0x111111);
    }

    const nx = ox + room.npc.x * RTW;
    const ny = oy + room.npc.y * RTW;
    const nbob = Math.sin(timeMs * 0.003) * 1.5;
    this.gfx.ellipse(nx, ny + 14, 11, 4).fill({ color: 0x030914, alpha: 0.45 });
    this.gfx.rect(nx - 8, ny - 6 + nbob, 16, 14).fill(accent);
    this.gfx.circle(nx, ny - 14 + nbob, 7).fill(0xf0c8a0);
    this.gfx.rect(nx - 7, ny - 19 + nbob, 14, 6).fill(0x3a2a1a);

    const tx = ox + room.terminal.x * RTW + RTW / 2;
    const ty = oy + room.terminal.y * RTW + RTW / 2;
    const tpulse = room.solved ? 0 : 6 + Math.sin(timeMs * 0.008) * 3;
    this.gfx.circle(tx, ty, 10 + tpulse).fill(room.solved ? 0x3a4a3a : 0xffdf70);

    const px = ox + room.px * RTW;
    const py = oy + room.py * RTW;
    const pbob = room.moving ? Math.abs(Math.sin(room.movePhase)) * 2 : 0;
    this.gfx.ellipse(px, py + 14, 11, 4).fill({ color: 0x030914, alpha: 0.45 });
    this.gfx.rect(px - 8, py - 6 + pbob, 16, 14).fill(0x3ab8ff);
    this.gfx.circle(px, py - 14 + pbob, 7).fill(0xefbd95);
    this.gfx.rect(px - 7, py - 19 + pbob, 14, 6).fill(0x18294c);

    const exitPulse = 0.3 + 0.15 * Math.sin(timeMs * 0.006);
    this.gfx.rect(ox + 3.2 * RTW, oy + (ROOM_H - 0.55) * RTW, 1.6 * RTW, 10).fill({ color: 0xffdf70, alpha: exitPulse });
    this.gfx.rect(ox + 3.2 * RTW, oy + (ROOM_H - 0.55) * RTW, 1.6 * RTW, 10).stroke({ width: 1, color: 0xffdf70, alpha: 0.7 });

    this.title.text = room.name;
    this.title.position.set(width / 2, oy - 28);
    this.hint.position.set(width / 2, height - 12);
  }
}

export function interiorAccent(color: string): number {
  return shade(color, 0);
}
