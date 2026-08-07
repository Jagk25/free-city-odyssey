/** Pure mini-game cores — no DOM, fully node-testable. DOM runtime lives in runtime.ts. */

// ---- Memory Lock (Simon) ----
export function newMemorySequence(rng: () => number, len: number): number[] {
  return Array.from({ length: len }, () => Math.floor(rng() * 4));
}

export function checkMemoryInput(seq: readonly number[], step: number, input: number): boolean {
  return seq[step] === input;
}

// ---- Combination Lock ----
export function checkCombo(combo: readonly number[], guess: readonly number[]): boolean {
  return combo.length === guess.length && combo.every((v, i) => v === guess[i]);
}

// ---- Signal Relink (wire matching) ----
export function wiresMatch(leftColor: string, rightColor: string): boolean {
  return leftColor === rightColor;
}

export function shuffled<T>(items: readonly T[], rng: () => number): T[] {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

// ---- Vault Cipher (Mastermind) ----
export function newMastermindCode(rng: () => number): number[] {
  return Array.from({ length: 4 }, () => 1 + Math.floor(rng() * 6));
}

export function mastermindScore(
  code: readonly number[],
  guess: readonly number[],
): { exact: number; misplaced: number } {
  let exact = 0;
  let misplaced = 0;
  const c = [...code];
  const g = [...guess];
  for (let i = 0; i < 4; i += 1) {
    if (g[i] === c[i]) {
      exact += 1;
      c[i] = 0;
      g[i] = -1;
    }
  }
  for (let i = 0; i < 4; i += 1) {
    if (g[i]! > 0) {
      const j = c.indexOf(g[i]!);
      if (j >= 0) {
        misplaced += 1;
        c[j] = 0;
      }
    }
  }
  return { exact, misplaced };
}

// ---- Riddle ----
export function checkRiddle(correctIndex: number, pick: number): boolean {
  return correctIndex === pick;
}

// ---- Reflex Circuit ----
export function reactionHit(pos: number, zoneLeft: number, zoneWidth: number): boolean {
  return pos >= zoneLeft && pos <= zoneLeft + zoneWidth;
}

export function nextReactionZone(rng: () => number, prevWidth: number): { left: number; width: number } {
  return { left: 15 + rng() * 65, width: Math.max(9, prevWidth - 2) };
}

// ---- The Haggle ----
export interface HaggleState {
  min: number;
  rounds: number;
}

export function newHaggle(rng: () => number): HaggleState {
  return { min: 65 + Math.floor(rng() * 30), rounds: 3 };
}

export function haggleOffer(
  state: HaggleState,
  offer: number,
): { accepted: boolean; state: HaggleState; finalPrice: number | null } {
  if (offer >= state.min) return { accepted: true, state, finalPrice: offer };
  const rounds = state.rounds - 1;
  const min = Math.max(55, state.min - 8);
  if (rounds <= 0) return { accepted: false, state: { min, rounds }, finalPrice: 95 };
  return { accepted: false, state: { min, rounds }, finalPrice: null };
}

// ---- The Lineup (deduction) ----
export interface Suspect {
  label: string;
  guilty: boolean;
}

export function checkLineup(suspects: readonly Suspect[], pickIndex: number): boolean {
  return suspects[pickIndex]?.guilty === true;
}
