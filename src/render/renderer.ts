import type { WeatherKind } from '../game/weather';

export type Facing = 'N' | 'S' | 'E' | 'W';

export interface RenderNpc {
  id: string;
  name: string;
  x: number;
  y: number;
  dir: Facing;
  moving: boolean;
  movePhase: number;
  color: string;
  skin: string;
  hair: string;
  hat: string | null;
  seeking: boolean;
  memory: number;
}

/** Sim → render contract. Presentation-only systems (cars, particles, sky) never appear here. */
export interface RenderWorldState {
  minute: number;
  weather: WeatherKind;
  playerX: number;
  playerY: number;
  playerDir: Facing;
  playerMoving: boolean;
  playerMovePhase: number;
  npcs: RenderNpc[];
  cat: { x: number; y: number; moving: boolean } | null;
  robbery: { robber: { x: number; y: number }; cop: { x: number; y: number } } | null;
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
