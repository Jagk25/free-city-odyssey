import { describe, expect, it } from 'vitest';
import { Camera } from '../src/engine/camera';

const viewport = { w: 800, h: 600 };
const bounds = { minX: -1000, minY: 0, maxX: 1000, maxY: 1000 };

describe('Camera', () => {
  it('clamps to bounds when the target is beyond the edges', () => {
    const cam = new Camera(() => viewport, bounds);
    cam.follow({ x: -2000, y: -500 });
    expect(cam.x).toBe(bounds.minX);
    expect(cam.y).toBe(bounds.minY);

    cam.follow({ x: 5000, y: 5000 });
    expect(cam.x).toBeLessThanOrEqual(bounds.maxX - viewport.w);
    expect(cam.y).toBeLessThanOrEqual(bounds.maxY - viewport.h);
  });

  it('handles worlds smaller than the viewport', () => {
    const cam = new Camera(() => viewport, { minX: 0, minY: 0, maxX: 100, maxY: 100 });
    cam.follow({ x: 50, y: 50 });
    expect(cam.x).toBe(0);
    expect(cam.y).toBe(0);
  });

  it('lerps toward the target when lerp < 1', () => {
    const cam = new Camera(() => viewport, bounds);
    cam.follow({ x: 400, y: 300 }, 0.5);
    expect(cam.x).toBe(0); // halfway from 0 to (400-400)
    cam.follow({ x: 800, y: 300 }, 1);
    expect(cam.x).toBe(400); // 800 - 400 viewport half
  });
});
