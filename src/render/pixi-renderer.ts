import { Application, Graphics, Text } from 'pixi.js';
import type { IRenderer } from './renderer';
import { gridToScreen } from './iso-math';
import buildings from '../data/buildings.json';

/** P0 boot renderer: proves the PixiJS pipeline draws the city data. Full scene graph lands in P2. */
export class PixiRenderer implements IRenderer {
  private app = new Application();
  private scene = new Graphics();

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
    const title = new Text({
      text: 'FREE CITY: ODYSSEY — P0 boot OK',
      style: { fill: 0x5cffa0, fontFamily: 'monospace', fontSize: 16 },
    });
    title.position.set(16, 16);
    this.app.stage.addChild(title);
  }

  private drawCity(): void {
    const cx = this.width / 2;
    const cy = this.height / 3;
    for (const b of buildings) {
      const p = gridToScreen(b.x + b.w / 2, b.y + b.d / 2);
      this.scene
        .rect(cx + p.x - 14, cy + p.y - b.h, 28, b.h)
        .fill(parseInt(b.color.slice(1), 16));
    }
    this.app.stage.addChild(this.scene);
  }

  begin(): void {
    // camera transform lands in P2
  }

  end(): void {
    // post effects land in P2
  }
}
