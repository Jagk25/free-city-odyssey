import type { IRenderer } from '../render/renderer';
import type { Input } from '../engine/input';
import { defaultSave, load, save, type SaveGame } from '../engine/save-system';

const AUTOSAVE_SECONDS = 15;
const PLAYER_SPEED = 2.25;

/** P0 world shell: owns save state + autosave. Map, collision and entities arrive in P2/P3. */
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
    const axis = this.input.axis();
    this.state.player.x += axis.x * dt * PLAYER_SPEED;
    this.state.player.y += axis.y * dt * PLAYER_SPEED;

    this.autosave += dt;
    if (this.autosave >= AUTOSAVE_SECONDS) {
      this.autosave = 0;
      save(this.state);
    }
    this.input.endFrame();
  }

  render(_alpha: number): void {
    this.renderer.begin();
    this.renderer.end();
  }
}
