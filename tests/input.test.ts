import { describe, expect, it } from 'vitest';
import { Input } from '../src/engine/input';

describe('Input', () => {
  it('tracks press/release and per-frame pressed state', () => {
    const input = new Input();
    input.press('up');
    expect(input.isDown('up')).toBe(true);
    expect(input.wasPressed('up')).toBe(true);
    input.endFrame();
    expect(input.wasPressed('up')).toBe(false);
    expect(input.isDown('up')).toBe(true);
    input.release('up');
    expect(input.isDown('up')).toBe(false);
  });

  it('axis combines directions', () => {
    const input = new Input();
    input.press('right');
    input.press('down');
    expect(input.axis()).toEqual({ x: 1, y: 1 });
  });

  it('rebind changes the key mapping', () => {
    const input = new Input();
    input.rebind('up', ['i']);
    expect(input.getBindings().up).toEqual(['i']);
  });

  it('pollGamepad is a safe no-op without a gamepad', () => {
    const input = new Input();
    expect(() => input.pollGamepad()).not.toThrow();
  });

  it('maps gamepad buttons and axes to actions', () => {
    const input = new Input();
    const fakePad = {
      connected: true,
      buttons: [{ pressed: true }],
      axes: [0.8, 0],
    } as unknown as Gamepad;

    input.pollGamepad(() => [fakePad]);
    expect(input.isDown('interact')).toBe(true);
    expect(input.isDown('right')).toBe(true);
    expect(input.wasPressed('interact')).toBe(true);

    input.endFrame();
    expect(input.wasPressed('interact')).toBe(false);
    expect(input.isDown('interact')).toBe(true);

    input.pollGamepad(() => []);
    expect(input.isDown('interact')).toBe(false);
  });
});
