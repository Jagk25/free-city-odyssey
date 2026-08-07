import type { WeatherKind } from '../game/weather';

/** Sim → render contract. Presentation-only systems (cars, particles, sky) never appear here. */
export interface RenderWorldState {
  minute: number;
  weather: WeatherKind;
  playerX: number;
  playerY: number;
}

/** Renderer abstraction — Canvas2D fallback can implement the same interface (see ROADMAP risk table). */
export interface IRenderer {
  init(): Promise<void>;
  setWorldState(state: RenderWorldState): void;
  begin(): void;
  end(): void;
  readonly width: number;
  readonly height: number;
}
