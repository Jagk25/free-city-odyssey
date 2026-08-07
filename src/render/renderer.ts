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

export interface RenderInterior {
  id: string;
  name: string;
  color: string;
  px: number;
  py: number;
  dir: Facing;
  moving: boolean;
  movePhase: number;
  furn: { type: string; x: number; y: number; w: number; h: number; blocking: boolean }[];
  npc: { name: string; x: number; y: number };
  item: { name: string; x: number; y: number } | null;
  terminal: { x: number; y: number };
  solved: boolean;
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
  playerGlow: boolean;
  npcs: RenderNpc[];
  cat: { x: number; y: number; moving: boolean } | null;
  robbery: { robber: { x: number; y: number }; cop: { x: number; y: number } } | null;
  mode: 'city' | 'interior';
  interior: RenderInterior | null;
  visionOn: boolean;
  fragments: number[];
  questTarget: { x: number; y: number } | null;
  photoSpots: { x: number; y: number }[];
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
