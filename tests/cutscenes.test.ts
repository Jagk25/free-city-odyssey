import { describe, expect, it } from 'vitest';
import { advance, createCutscene, currentText, currentSpeaker, isDone, isTyping, tick } from '../src/game/cutscenes';
import cutscenes from '../src/data/cutscenes.json';

describe('cutscene engine', () => {
  it('types out text then advances slides', () => {
    let s = createCutscene([{ sp: 'A', t: 'hello' }, { sp: 'B', t: 'world' }]);
    expect(isTyping(s)).toBe(true);
    s = tick(s, 3);
    expect(currentText(s)).toBe('hel');
    s = advance(s); // complete typing
    expect(currentText(s)).toBe('hello');
    s = advance(s); // next slide
    expect(currentSpeaker(s)).toBe('B');
    s = advance(s); // complete
    s = advance(s); // past end
    expect(isDone(s)).toBe(true);
  });

  it('all shipped cutscenes have non-empty slides', () => {
    for (const [, slides] of Object.entries(cutscenes)) {
      expect(slides.length).toBeGreaterThan(0);
      for (const slide of slides) {
        expect(slide.t.length).toBeGreaterThan(10);
      }
    }
  });
});
