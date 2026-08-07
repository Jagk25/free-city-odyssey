import type { IRenderer } from '../render/renderer';
import type { Input } from '../engine/input';
import { defaultSave, load, save, type SaveGame } from '../engine/save-system';
import map from '../data/map.json';

const AUTOSAVE_SECONDS = 15;
const PLAYER_SPEED = 2.25;
const EDGE = 0.3;

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

/** P1 world shell: player movement with map-bounds clamp, autosave. Collision + entities arrive in P2/P3. */
export class World {
  private state: SaveGame = defaultSave();
  private autosave = 0;

  constructor(
    private readonly renderer: IRenderer,
    private readonly input: Input,
  ) {}

  init(): void {
    this.state = load();
  }

  update(dt: number): void {
    this.input.pollGamepad();
    const axis = this.input.axis();
    this.state.player.x = clamp(this.state.player.x + axis.x * dt * PLAYER_SPEED, EDGE, map.width - EDGE);
    this.state.player.y = clamp(this.state.player.y + axis.y * dt * PLAYER_SPEED, EDGE, map.height - EDGE);

    this.autosave += dt;
    if (this.autosave >= AUTOSAVE_SECONDS) {
      this.autosave = 0;
      save(this.state);
    }
    this.input.endFrame();
  }

  render(_alpha: number): void {
    this.renderer.setPlayerPosition(this.state.player.x, this.state.player.y);
    this.renderer.begin();
    this.renderer.end();
  }
}
