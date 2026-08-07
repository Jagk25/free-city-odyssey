/** Renderer abstraction — Canvas2D fallback can implement the same interface (see ROADMAP risk table). */
export interface IRenderer {
  init(): Promise<void>;
  begin(): void;
  end(): void;
  readonly width: number;
  readonly height: number;
}
