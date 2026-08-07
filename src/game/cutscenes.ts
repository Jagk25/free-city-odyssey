export interface Slide {
  sp: string;
  t: string;
}

export interface CutsceneState {
  slides: Slide[];
  index: number;
  chars: number;
}

export function createCutscene(slides: Slide[]): CutsceneState {
  return { slides, index: 0, chars: 0 };
}

export function currentSlide(state: CutsceneState): Slide | null {
  return state.slides[state.index] ?? null;
}

export function isTyping(state: CutsceneState): boolean {
  const slide = currentSlide(state);
  return slide !== null && state.chars < slide.t.length;
}

/** Advances the typewriter by n characters. */
export function tick(state: CutsceneState, n = 1): CutsceneState {
  const slide = currentSlide(state);
  if (!slide) return state;
  return { ...state, chars: Math.min(slide.t.length, state.chars + n) };
}

/** If typing: complete the text. If complete: next slide. */
export function advance(state: CutsceneState): CutsceneState {
  if (isTyping(state)) {
    const slide = currentSlide(state)!;
    return { ...state, chars: slide.t.length };
  }
  return { slides: state.slides, index: state.index + 1, chars: 0 };
}

export function isDone(state: CutsceneState): boolean {
  return state.index >= state.slides.length;
}

export function currentText(state: CutsceneState): string {
  const slide = currentSlide(state);
  if (!slide) return '';
  return slide.t.slice(0, state.chars);
}

export function currentSpeaker(state: CutsceneState): string {
  return currentSlide(state)?.sp ?? '';
}
