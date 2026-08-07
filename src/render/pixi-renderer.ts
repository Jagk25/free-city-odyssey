import { Application, Container, Graphics, Text } from 'pixi.js';
import type { IRenderer, RenderWorldState } from './renderer';
import { gridToScreen } from './iso-math';
import { Camera } from '../engine/camera';
import { dayFactor } from '../game/world-clock';
import { createSkyEntities, drawSky, type SkyEntities } from './sky';
import { drawCityAnimated, drawCityBase, getEmitters, type EmitterPoint } from './city';
import { ParticleSystem } from './particles';
import { advanceCar, spawnCars, type Car } from './traffic';
import { EntityRenderer } from './entities';
import { InteriorRenderer } from './interior-renderer';
import { mulberry32 } from '../engine/rng';
import buildings from '../data/buildings.json';
import props from '../data/props.json';
import map from '../data/map.json';

interface RainDrop {
  x: number;
  y: number;
  z: number;
}

/** P4 renderer: living city + characters + interiors. */
export class PixiRenderer implements IRenderer {
  private app = new Application();
  private skyGfx = new Graphics();
  private worldLayer = new Container();
  private cityGfx = new Graphics();
  private animGfx = new Graphics();
  private trafficGfx = new Graphics();
  private particleGfx = new Graphics();
  private weatherGfx = new Graphics();
  private nightGfx = new Graphics();
  private readonly entities = new EntityRenderer();
  private readonly interior = new InteriorRenderer();
  private fpsText: Text | null = null;

  private readonly camera = new Camera(() => ({ w: this.width, h: this.height }), {
    minX: (-map.height * map.tileW) / 2,
    minY: 0,
    maxX: (map.width * map.tileW) / 2,
    maxY: ((map.width + map.height) * map.tileH) / 2,
  });

  private readonly particles = new ParticleSystem(256, mulberry32(1337));
  private readonly skyEntities: SkyEntities = createSkyEntities();
  private cars: Car[] = [];
  private emitters: EmitterPoint[] = [];
  private rain: RainDrop[] = [];

  private state: RenderWorldState | null = null;
  private timeMs = 0;
  private lastFrame = 0;
  private animTimer = 0;
  private fpsFrames = 0;
  private fpsTime = 0;

  get width(): number {
    return this.app.screen.width;
  }

  get height(): number {
    return this.app.screen.height;
  }

  async init(): Promise<void> {
    await this.app.init({ background: 0x0a1629, resizeTo: window, antialias: true });
    document.body.appendChild(this.app.canvas);

    const labels = drawCityBase(this.cityGfx, buildings, props, map.width, map.height);
    this.emitters = getEmitters(buildings, props);
    this.cars = spawnCars(10, mulberry32(Date.now() % 2147483647));

    const rng = mulberry32(99);
    this.rain = Array.from({ length: 72 }, () => ({ x: rng(), y: rng(), z: 0.3 + rng() }));

    this.worldLayer.addChild(this.cityGfx);
    this.worldLayer.addChild(this.animGfx);
    this.worldLayer.addChild(this.trafficGfx);
    this.worldLayer.addChild(this.particleGfx);
    this.worldLayer.addChild(this.entities.container);
    for (const label of labels) this.worldLayer.addChild(label);

    this.interior.container.visible = false;

    this.app.stage.addChild(this.skyGfx);
    this.app.stage.addChild(this.worldLayer);
    this.app.stage.addChild(this.weatherGfx);
    this.app.stage.addChild(this.nightGfx);
    this.app.stage.addChild(this.interior.container);

    if (typeof location !== 'undefined' && location.search.includes('fps=1')) {
      this.fpsText = new Text({ text: 'FPS: --', style: { fill: 0x8fe7a5, fontFamily: 'monospace', fontSize: 12 } });
      this.fpsText.position.set(16, 16);
      this.app.stage.addChild(this.fpsText);
    }

    this.lastFrame = performance.now();
  }

  setWorldState(state: RenderWorldState): void {
    this.state = state;
  }

  begin(): void {
    if (!this.state) return;
    const now = performance.now();
    const dtMs = Math.min(50, now - this.lastFrame);
    this.lastFrame = now;
    this.timeMs += dtMs;
    const dt = dtMs / 1000;

    const inInterior = this.state.mode === 'interior' && this.state.interior;
    this.worldLayer.visible = !inInterior;
    this.skyGfx.visible = !inInterior;
    this.weatherGfx.visible = !inInterior;
    this.nightGfx.visible = !inInterior;
    this.interior.container.visible = Boolean(inInterior);

    if (inInterior) {
      this.interior.draw(this.state.interior!, this.timeMs, this.width, this.height);
      this.tickFps(dtMs);
      return;
    }

    drawSky(this.skyGfx, { minute: this.state.minute, timeMs: this.timeMs, width: this.width, height: this.height, dtMs }, this.skyEntities);

    this.animTimer += dtMs;
    if (this.animTimer >= 100) {
      this.animTimer = 0;
      drawCityAnimated(this.animGfx, buildings, props, this.state.minute, this.timeMs);
    }

    this.drawTraffic(dt);
    this.drawParticles(dt);
    this.drawWeather(dt);

    this.entities.draw(
      { x: this.state.playerX, y: this.state.playerY, dir: this.state.playerDir, moving: this.state.playerMoving, movePhase: this.state.playerMovePhase },
      this.state.npcs,
      this.state.cat,
      this.state.robbery,
      this.timeMs,
    );

    const p = gridToScreen(this.state.playerX, this.state.playerY);
    this.camera.follow({ x: p.x, y: p.y }, 0.12);
    this.worldLayer.position.set(-this.camera.x, -this.camera.y);

    const day = dayFactor(this.state.minute);
    this.nightGfx.clear();
    if (day < 0.98) {
      this.nightGfx.rect(0, 0, this.width, this.height).fill({ color: 0x060a1c, alpha: (1 - day) * 0.55 });
    }

    this.tickFps(dtMs);
  }

  private tickFps(dtMs: number): void {
    if (!this.fpsText) return;
    this.fpsFrames += 1;
    this.fpsTime += dtMs;
    if (this.fpsTime >= 500) {
      this.fpsText.text = `FPS: ${Math.round((this.fpsFrames * 1000) / this.fpsTime)}`;
      this.fpsFrames = 0;
      this.fpsTime = 0;
    }
  }

  private drawTraffic(dt: number): void {
    if (!this.state) return;
    this.trafficGfx.clear();
    const night = dayFactor(this.state.minute) < 0.4;
    for (const car of this.cars) {
      advanceCar(car, dt, 27.8, Math.random);
      const p = gridToScreen(car.x, car.y);
      const horiz = car.dir === 'E' || car.dir === 'W';
      this.trafficGfx.ellipse(p.x, p.y + 2, horiz ? 15 : 9, horiz ? 6 : 9).fill({ color: 0x030914, alpha: 0.4 });
      if (horiz) {
        const flip = car.dir === 'W' ? -1 : 1;
        this.trafficGfx.rect(p.x - 14 * flip, p.y - 7, 28 * flip, 10).fill(car.color);
        this.trafficGfx.rect(p.x - 9 * flip, p.y - 11, 18 * flip, 6).fill(0x0b1220);
        if (night) {
          this.trafficGfx
            .poly([p.x + 14 * flip, p.y - 4, p.x + 24 * flip, p.y - 7, p.x + 24 * flip, p.y + 1])
            .fill({ color: 0xffdf70, alpha: 0.4 });
        }
      } else {
        const flip = car.dir === 'N' ? -1 : 1;
        this.trafficGfx.rect(p.x - 5, p.y - 14 * flip, 10, 28 * flip).fill(car.color);
        this.trafficGfx.rect(p.x - 4, p.y - 9 * flip, 8, 18 * flip).fill(0x0b1220);
      }
    }
  }

  private drawParticles(dt: number): void {
    for (const e of this.emitters) {
      if (e.kind === 'smoke' && Math.random() < 0.15) {
        this.particles.emit(e.x, e.y, (Math.random() - 0.5) * 6, -14 - Math.random() * 8, 1.4, 0xaab4c0, 3);
      }
      if (e.kind === 'fountain' && Math.random() < 0.25) {
        this.particles.emit(e.x + (Math.random() - 0.5) * 8, e.y, (Math.random() - 0.5) * 10, -25 - Math.random() * 15, 0.7, 0xaee8ff, 2);
      }
    }
    this.particles.update(dt);
    this.particleGfx.clear();
    for (const p of this.particles.active) {
      this.particleGfx.rect(p.x, p.y, p.size, p.size).fill({ color: p.color, alpha: Math.max(0, p.life / p.max) });
    }
  }

  private drawWeather(dt: number): void {
    if (!this.state) return;
    this.weatherGfx.clear();
    if (this.state.weather === 'rain') {
      for (const drop of this.rain) {
        drop.y += dt * drop.z * 0.9;
        if (drop.y > 1) {
          drop.y = -0.05;
          drop.x = Math.random();
        }
        const x = drop.x * this.width;
        const y = drop.y * this.height;
        this.weatherGfx
          .moveTo(x, y)
          .lineTo(x - 4 * drop.z, y + 13 * drop.z)
          .stroke({ width: 1, color: 0x78cfff, alpha: 0.45 });
      }
    } else if (this.state.weather === 'fog') {
      for (let i = 0; i < 4; i += 1) {
        const x = ((this.timeMs * 0.009 + i * 260) % (this.width + 200)) - 100;
        this.weatherGfx.ellipse(x, this.height * 0.3 + i * 90, 160, 34).fill({ color: 0xb8d5e0, alpha: 0.13 });
      }
    }
  }

  end(): void {
    // post effects (Glitch Vision bloom) land in P5/P6
  }
}
