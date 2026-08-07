export interface CameraBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface Viewport {
  w: number;
  h: number;
}

/** Follow camera with bounds clamping. Pure logic — no rendering imports, fully unit-testable. */
export class Camera {
  x = 0;
  y = 0;

  constructor(
    private readonly viewport: () => Viewport,
    private bounds: CameraBounds,
  ) {}

  setBounds(bounds: CameraBounds): void {
    this.bounds = bounds;
  }

  follow(target: { x: number; y: number }, lerp = 1): void {
    const { w, h } = this.viewport();
    this.x += (target.x - w / 2 - this.x) * lerp;
    this.y += (target.y - h / 2 - this.y) * lerp;
    this.clamp();
  }

  clamp(): void {
    const { w, h } = this.viewport();
    const hiX = Math.max(this.bounds.minX, this.bounds.maxX - w);
    const hiY = Math.max(this.bounds.minY, this.bounds.maxY - h);
    this.x = Math.min(Math.max(this.x, this.bounds.minX), hiX);
    this.y = Math.min(Math.max(this.y, this.bounds.minY), hiY);
  }
}
