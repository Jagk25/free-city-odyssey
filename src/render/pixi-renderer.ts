import { Application, Container, Graphics, Text } from 'pixi.js';
import type { IRenderer } from './renderer';
import { gridToScreen } from './iso-math';
import { Camera } from '../engine/camera';
import buildings from '../data/buildings.json';
import map from '../data/map.json';

/** P1 renderer: city from data + player sprite + follow camera. Full scene graph lands in P2. */
export class PixiRenderer implements IRenderer {
  private app = new Application();
  private worldLayer = new Container();
  private cityGfx = new Graphics();
  private playerGfx = new Graphics();

  readonly camera = new Camera(() => ({ w: this.width, h: this.height }), {
    minX: (-map.height * map.tileW) / 2,
    minY: 0,
    maxX: (map.width * map.tileW) / 2,
    maxY: ((map.width + map.height) * map.tileH) / 2,
  });

  get width(): number {
    return this.app.screen.width;
  }

  get height(): number {
    return this.app.screen.height;
  }

  async init(): Promise<void> {
    await this.app.init({ background: 0x0a1629, resizeTo: window, antialias: true });
    document.body.appendChild(this.app.canvas);
    this.drawCity();
    this.drawPlayerShape();
    this.worldLayer.addChild(this.cityGfx);
    this.worldLayer.addChild(this.playerGfx);
    this.app.stage.addChild(this.worldLayer);

    const title = new Text({
      text: 'FREE CITY: ODYSSEY — P1 engine demo',
      style: { fill: 0x5cffa0, fontFamily: 'monospace', fontSize: 14 },
    });
    title.position.set(16, 16);
    this.app.stage.addChild(title);
  }

  private drawCity(): void {
    for (const b of buildings) {
      const p = gridToScreen(b.x + b.w / 2, b.y + b.d / 2);
      this.cityGfx.rect(p.x - 14, p.y - b.h, 28, b.h).fill(parseInt(b.color.slice(1), 16));
      const d = gridToScreen(b.door.x, b.door.y);
      this.cityGfx.ellipse(d.x, d.y, 10, 4).fill(0xffdf70);
    }
  }

  private drawPlayerShape(): void {
    this.playerGfx.ellipse(0, 0, 12, 5).fill(0x030914);
    this.playerGfx.rect(-8, -28, 16, 15).fill(0x3ab8ff);
    this.playerGfx.circle(0, -34, 7).fill(0xefbd95);
  }

  setPlayerPosition(gx: number, gy: number): void {
    const p = gridToScreen(gx, gy);
    this.playerGfx.position.set(p.x, p.y);
    this.camera.follow({ x: p.x, y: p.y }, 0.12);
  }

  begin(): void {
    this.worldLayer.position.set(-this.camera.x, -this.camera.y);
  }

  end(): void {
    // post effects land in P2
  }
}
