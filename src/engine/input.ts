export type Action = 'up' | 'down' | 'left' | 'right' | 'interact' | 'vision' | 'pause';

const DEFAULT_BINDINGS: Record<Action, string[]> = {
  up: ['arrowup', 'w'],
  down: ['arrowdown', 's'],
  left: ['arrowleft', 'a'],
  right: ['arrowright', 'd'],
  interact: ['e', 'enter'],
  vision: ['v'],
  pause: ['escape', 'p'],
};

/** Standard-layout gamepad mapping. */
const GAMEPAD_BUTTONS: Record<number, Action> = {
  0: 'interact',
  1: 'pause',
  3: 'vision',
  9: 'pause',
  12: 'up',
  13: 'down',
  14: 'left',
  15: 'right',
};

const AXIS_DEADZONE = 0.35;

type GamepadSource = () => (Gamepad | null)[];

/** Unified input: keyboard (remappable) + touch buttons + gamepad, behind one API. */
export class Input {
  private keyHeld = new Set<Action>();
  private padHeld = new Set<Action>();
  private pressedFrame = new Set<Action>();
  private bindings: Record<Action, string[]>;
  private keyToAction = new Map<string, Action>();

  constructor() {
    this.bindings = { ...DEFAULT_BINDINGS };
    this.rebuildKeymap();
  }

  private rebuildKeymap(): void {
    this.keyToAction.clear();
    for (const [action, keys] of Object.entries(this.bindings) as [Action, string[]][]) {
      for (const key of keys) this.keyToAction.set(key, action);
    }
  }

  rebind(action: Action, keys: string[]): void {
    this.bindings[action] = keys.map((k) => k.toLowerCase());
    this.rebuildKeymap();
  }

  getBindings(): Record<Action, string[]> {
    return Object.fromEntries(
      Object.entries(this.bindings).map(([k, v]) => [k, [...v]]),
    ) as Record<Action, string[]>;
  }

  press(action: Action): void {
    if (!this.isDown(action)) this.pressedFrame.add(action);
    this.keyHeld.add(action);
  }

  release(action: Action): void {
    this.keyHeld.delete(action);
  }

  attach(target: Window = window): void {
    target.addEventListener('keydown', (e) => {
      const action = this.keyToAction.get(e.key.toLowerCase());
      if (action) this.press(action);
    });
    target.addEventListener('keyup', (e) => {
      const action = this.keyToAction.get(e.key.toLowerCase());
      if (action) this.release(action);
    });
  }

  /** Wire a DOM element (touch D-pad / ACT button) to an action. */
  bindTouchButton(el: HTMLElement, action: Action): void {
    const on = (e: Event): void => {
      e.preventDefault();
      this.press(action);
    };
    const off = (e: Event): void => {
      e.preventDefault();
      this.release(action);
    };
    el.addEventListener('pointerdown', on);
    el.addEventListener('pointerup', off);
    el.addEventListener('pointercancel', off);
    el.addEventListener('pointerleave', off);
  }

  /** Poll gamepad state. Source is injectable so tests can supply a fake pad. */
  pollGamepad(
    getPads: GamepadSource = () =>
      typeof navigator !== 'undefined' && navigator.getGamepads
        ? Array.from(navigator.getGamepads())
        : [],
  ): void {
    const pad = getPads().find((p) => p !== null && p.connected);
    const next = new Set<Action>();

    if (pad) {
      for (const [idx, action] of Object.entries(GAMEPAD_BUTTONS)) {
        if (pad.buttons[Number(idx)]?.pressed) next.add(action);
      }
      const ax = pad.axes[0] ?? 0;
      const ay = pad.axes[1] ?? 0;
      if (ax < -AXIS_DEADZONE) next.add('left');
      if (ax > AXIS_DEADZONE) next.add('right');
      if (ay < -AXIS_DEADZONE) next.add('up');
      if (ay > AXIS_DEADZONE) next.add('down');
    }

    for (const action of next) {
      if (!this.padHeld.has(action) && !this.isDown(action)) {
        this.pressedFrame.add(action);
      }
    }
    this.padHeld = next;
  }

  isDown(action: Action): boolean {
    return this.keyHeld.has(action) || this.padHeld.has(action);
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
