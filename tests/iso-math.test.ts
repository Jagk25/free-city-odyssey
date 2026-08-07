import { describe, expect, it } from 'vitest';
import { gridToScreen, screenToGrid } from '../src/render/iso-math';

describe('iso math', () => {
  it('round-trips grid <-> screen', () => {
    for (const [gx, gy] of [[0, 0], [5.25, 5.25], [27.9, 1.4], [13.9, 13.9]] as const) {
      const s = gridToScreen(gx, gy);
      const back = screenToGrid(s.x, s.y);
      expect(back.x).toBeCloseTo(gx, 6);
      expect(back.y).toBeCloseTo(gy, 6);
    }
  });
});
