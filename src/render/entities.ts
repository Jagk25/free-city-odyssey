import { Container, Graphics, Text } from 'pixi.js';
import { gridToScreen } from './iso-math';
import { shade } from './city';
import type { Facing, RenderNpc } from './renderer';

export interface EntityPose {
  x: number;
  y: number;
  dir: Facing;
  moving: boolean;
  movePhase: number;
  color: string;
  skin: string;
  hair: string;
  hat: string | null;
  name: string;
  seeking: boolean;
  memory: number;
  isPlayer: boolean;
}

function drawCharacter(gfx: Graphics, e: EntityPose, timeMs: number): void {
  const p = gridToScreen(e.x, e.y);
  const st = e.moving ? Math.sin(e.movePhase) : 0;
  const bob = e.moving ? Math.abs(st) * 2.2 : Math.sin(timeMs * 0.003 + e.movePhase) * 0.7;
  const skin = parseInt(e.skin.slice(1), 16);
  const hair = parseInt(e.hair.slice(1), 16);
  const body = parseInt(e.color.slice(1), 16);

  gfx.ellipse(p.x, p.y + 1, 16, 6).fill({ color: 0x030914, alpha: 0.22 });
  gfx.ellipse(p.x, p.y + 1, 12, 4).fill({ color: 0x030914, alpha: 0.35 });

  const la = st * 5.5;
  const ra = -st * 5.5;
  gfx
    .moveTo(p.x - 3, p.y - 15 + bob)
    .lineTo(p.x - 5 + la, p.y - 2)
    .stroke({ width: 5, color: 0x121a2a, cap: 'round' });
  gfx
    .moveTo(p.x + 3, p.y - 15 + bob)
    .lineTo(p.x + 5 + ra, p.y - 2)
    .stroke({ width: 5, color: 0x121a2a, cap: 'round' });

  gfx.rect(p.x - 9, p.y - 29 + bob, 18, 17).fill(0x0a1220);
  gfx.rect(p.x - 8, p.y - 28 + bob, 16, 15).fill(body);
  gfx.rect(p.x - 8, p.y - 28 + bob + 12, 16, 3).fill(shade(e.color, -40));

  gfx.moveTo(p.x - 8, p.y - 25 + bob).lineTo(p.x - 12 - st * 2, p.y - 16 + bob).stroke({ width: 3, color: skin });
  gfx.moveTo(p.x + 8, p.y - 25 + bob).lineTo(p.x + 12 + st * 2, p.y - 16 + bob).stroke({ width: 3, color: skin });

  gfx.rect(p.x - 7, p.y - 41 + bob, 14, 14).fill(skin);
  gfx.rect(p.x - 8, p.y - 44 + bob, 16, 6).fill(hair);

  const side = e.dir === 'E' ? 1 : e.dir === 'W' ? -1 : 0;
  if (e.hat === 'cap') {
    gfx.rect(p.x - 8, p.y - 46 + bob, 16, 4).fill(0xe05c5c);
    gfx.rect(p.x + (side >= 0 ? 2 : -10), p.y - 43 + bob, 8, 2).fill(0xe05c5c);
  } else if (e.hat === 'beanie') {
    gfx.rect(p.x - 8, p.y - 46 + bob, 16, 5).fill(0x4a6a8a);
    gfx.circle(p.x, p.y - 47 + bob, 2).fill(0x4a6a8a);
  }

  if (e.dir === 'N') {
    gfx.rect(p.x - 7, p.y - 38 + bob, 14, 10).fill(hair);
  } else if (side !== 0) {
    gfx.rect(p.x + side * 2, p.y - 36 + bob, 3, 2).fill(0xf8fbff);
    gfx.rect(p.x + side * 3, p.y - 36 + bob, 1, 2).fill(0x1c2841);
  } else {
    const blink = Math.sin(timeMs * 0.0017 + e.movePhase * 3) > 0.985;
    gfx.rect(p.x - 4, p.y - 36 + bob, 3, blink ? 1 : 2).fill(blink ? 0x563d36 : 0xf7fbff);
    gfx.rect(p.x + 2, p.y - 36 + bob, 3, blink ? 1 : 2).fill(blink ? 0x563d36 : 0xf7fbff);
    if (!blink) {
      gfx.rect(p.x - 3, p.y - 36 + bob, 1, 2).fill(0x1c2841);
      gfx.rect(p.x + 3, p.y - 36 + bob, 1, 2).fill(0x1c2841);
    }
    gfx.rect(p.x - 1, p.y - 31 + bob, 3, 1).fill(0xb76565);
  }

  if (e.seeking) {
    gfx.rect(p.x - 2, p.y - 74 + Math.sin(timeMs * 0.008) * 2, 4, 10).fill(0xffdf70);
    gfx.rect(p.x - 2, p.y - 62 + Math.sin(timeMs * 0.008) * 2, 4, 3).fill(0xffdf70);
  }
}

export class EntityRenderer {
  readonly container = new Container();
  private readonly gfx = new Graphics();
  private readonly labels = new Map<string, Text>();

  constructor() {
    this.container.addChild(this.gfx);
  }

  draw(
    player: { x: number; y: number; dir: Facing; moving: boolean; movePhase: number },
    npcs: RenderNpc[],
    cat: { x: number; y: number; moving: boolean } | null,
    robbery: { robber: { x: number; y: number }; cop: { x: number; y: number } } | null,
    timeMs: number,
  ): void {
    this.gfx.clear();

    const poses: EntityPose[] = [
      ...npcs.map((n) => ({
        x: n.x, y: n.y, dir: n.dir, moving: n.moving, movePhase: n.movePhase,
        color: n.color, skin: n.skin, hair: n.hair, hat: n.hat,
        name: n.name, seeking: n.seeking, memory: n.memory, isPlayer: false,
      })),
      {
        x: player.x, y: player.y, dir: player.dir, moving: player.moving,
        movePhase: player.movePhase, color: '#3ab8ff', skin: '#efbd95',
        hair: '#18294c', hat: null, name: 'NOA', seeking: false, memory: 0, isPlayer: true,
      },
    ];

    if (robbery) {
      poses.push(
        { x: robbery.robber.x, y: robbery.robber.y, dir: 'S', moving: true, movePhase: timeMs * 0.01, color: '#2b2b2b', skin: '#caa06b', hair: '#111111', hat: null, name: 'ROBBER', seeking: false, memory: 0, isPlayer: false },
        { x: robbery.cop.x, y: robbery.cop.y, dir: 'S', moving: true, movePhase: timeMs * 0.011, color: '#204a8f', skin: '#e8c39e', hair: '#111111', hat: null, name: 'COP', seeking: false, memory: 0, isPlayer: false },
      );
    }

    poses.sort((a, b) => a.x + a.y - (b.x + b.y));
    for (const pose of poses) drawCharacter(this.gfx, pose, timeMs);

    if (cat) {
      const p = gridToScreen(cat.x, cat.y);
      const st = cat.moving ? Math.sin(timeMs * 0.02) : 0;
      this.gfx.ellipse(p.x, p.y + 1, 8, 3).fill({ color: 0x030914, alpha: 0.45 });
      this.gfx.rect(p.x - 6, p.y - 8, 12, 7).fill(0xe8a54a);
      this.gfx.circle(p.x + 6, p.y - 9, 4).fill(0xe8a54a);
      this.gfx.poly([p.x + 3, p.y - 12, p.x + 4.5, p.y - 16, p.x + 6, p.y - 12]).fill(0xe8a54a);
      this.gfx.poly([p.x + 6, p.y - 12, p.x + 7.5, p.y - 16, p.x + 9, p.y - 12]).fill(0xe8a54a);
      this.gfx
        .moveTo(p.x - 6, p.y - 6)
        .quadraticCurveTo(p.x - 11, p.y - 10 + st * 2, p.x - 10, p.y - 14)
        .stroke({ width: 2, color: 0xe8a54a });
      this.gfx.rect(p.x + 7, p.y - 10, 1.4, 1.4).fill(0x111111);
    }

    this.syncLabels(poses);
  }

  private syncLabels(poses: EntityPose[]): void {
    const seen = new Set<string>();
    for (const pose of poses) {
      seen.add(pose.name);
      let label = this.labels.get(pose.name);
      if (!label) {
        label = new Text({
          text: pose.name,
          style: { fill: pose.isPlayer ? 0xffdf70 : 0xffffff, fontFamily: 'monospace', fontSize: 8, fontWeight: 'bold' },
        });
        label.anchor.set(0.5, 1);
        this.labels.set(pose.name, label);
        this.container.addChild(label);
      }
      const p = gridToScreen(pose.x, pose.y);
      label.position.set(p.x, p.y - 50);
    }
    for (const [name, label] of this.labels) {
      if (!seen.has(name)) {
        label.destroy();
        this.labels.delete(name);
      }
    }
  }
}
