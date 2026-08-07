import type { IRenderer } from '../render/renderer';
import type { Input } from '../engine/input';
import { defaultSave, load, save, type SaveGame } from '../engine/save-system';
import { advanceClock } from './world-clock';
import { advanceWeather, initialWeather, type WeatherState } from './weather';
import { mulberry32 } from '../engine/rng';
import map from '../data/map.json';

const AUTOSAVE_SECONDS = 15;
const PLAYER_SPEED = 2.25;
const EDGE = 0.3;

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

/** P2 world: player movement, world clock, weather director, autosave. */
export class World {
  private state: SaveGame = defaultSave();
  private weather: WeatherState = initialWeather();
  private autosave = 0;
  private readonly rng = mulberry32(Date.now() % 2147483647);

  constructor(
    private readonly renderer: IRenderer,
    private readonly input: Input,
  ) {}

  init(): void {
    this.state = load();
  }

  /** Debug/e2e hook — drives the 4-clock-times render test. */
  setMinute(minute: number): void {
    this.state.minute = minute;
  }

  update(dt: number): void {
    this.input.pollGamepad();
    const axis = this.input.axis();
    this.state.player.x = clamp(this.state.player.x + axis.x * dt * PLAYER_SPEED, EDGE, map.width - EDGE);
    this.state.player.y = clamp(this.state.player.y + axis.y * dt * PLAYER_SPEED, EDGE, map.height - EDGE);

    const clock = advanceClock({ day: this.state.day, minute: this.state.minute }, dt);
    this.state.day = clock.day;
    this.state.minute = clock.minute;

    this.weather = advanceWeather(this.weather, dt, this.rng).state;

    this.autosave += dt;
    if (this.autosave >= AUTOSAVE_SECONDS) {
      this.autosave = 0;
      save(this.state);
    }
    this.input.endFrame();
  }

  render(_alpha: number): void {
    this.renderer.setWorldState({
      minute: this.state.minute,
      weather: this.weather.kind,
      playerX: this.state.player.x,
      playerY: this.state.player.y,
    });
    this.renderer.begin();
    this.renderer.end();
  }
}
