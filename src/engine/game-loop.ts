export interface LoopCallbacks {
  update: (dt: number) => void;
  render: (alpha: number) => void;
}

/** Fixed simulation step: 60 Hz, decoupled from render rate. */
export const STEP = 1 / 60;
const MAX_STEPS = 5;
const MAX_FRAME_DELTA = 0.25;

export class GameLoop {
  private acc = 0;
  private last = 0;
  private running = false;

  constructor(private readonly cb: LoopCallbacks) {}

  start(): void {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    requestAnimationFrame(this.frame);
  }

  stop(): void {
    this.running = false;
  }

  private frame = (now: number): void => {
    if (!this.running) return;
    let delta = (now - this.last) / 1000;
    this.last = now;
    if (delta > MAX_FRAME_DELTA) delta = MAX_FRAME_DELTA;
    this.acc += delta;

    let steps = 0;
    while (this.acc >= STEP && steps < MAX_STEPS) {
      this.cb.update(STEP);
      this.acc -= STEP;
      steps += 1;
    }
    if (steps === MAX_STEPS) this.acc = 0; // drop backlog after long tab-out

    this.cb.render(this.acc / STEP);
    requestAnimationFrame(this.frame);
  };
}
