export type Action = 'up' | 'down' | 'left' | 'right' | 'interact' | 'vision' | 'pause';

const KEYMAP: Record<string, Action> = {
  arrowup: 'up',
  w: 'up',
  arrowdown: 'down',
  s: 'down',
  arrowleft: 'left',
  a: 'left',
  arrowright: 'right',
  d: 'right',
  e: 'interact',
  enter: 'interact',
  v: 'vision',
  escape: 'pause',
  p: 'pause',
};

/** Keyboard input with per-frame pressed tracking. Touch + gamepad land in P1/P7 behind this same API. */
export class Input {
  private held = new Set<Action>();
  private pressedFrame = new Set<Action>();

  attach(target: Window = window): void {
    target.addEventListener('keydown', (e) => {
      const action = KEYMAP[e.key.toLowerCase()];
      if (!action) return;
      if (!this.held.has(action)) this.pressedFrame.add(action);
      this.held.add(action);
    });
    target.addEventListener('keyup', (e) => {
      const action = KEYMAP[e.key.toLowerCase()];
      if (action) this.held.delete(action);
    });
  }

  isDown(action: Action): boolean {
    return this.held.has(action);
  }

  wasPressed(action: Action): boolean {
    return this.pressedFrame.has(action);
  }

  axis(): { x: number; y: number } {
    const x = (this.isDown('right') ? 1 : 0) - (this.isDown('left') ? 1 : 0);
    const y = (this.isDown('down') ? 1 : 0) - (this.isDown('up') ? 1 : 0);
    return { x, y };
  }

  endFrame(): void {
    this.pressedFrame.clear();
  }
}
