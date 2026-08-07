import questsData from '../data/quests.json';

export interface QuestDef {
  id: string;
  title: string;
  target: string | null;
  next: string | null;
}

export interface SideDef {
  id: string;
  title: string;
  giver: string;
  stages: string[];
  spots?: [number, number][];
}

const MAIN = questsData.main as QuestDef[];
const SIDE = questsData.side as SideDef[];

export function questDef(id: string): QuestDef | undefined {
  return MAIN.find((q) => q.id === id);
}

export function mainQuestTitle(id: string): string {
  return questDef(id)?.title ?? id;
}

export function mainQuestTarget(id: string): string | null {
  return questDef(id)?.target ?? null;
}

/** Advances the main chain: returns the next quest id (or the same id if the chain is done). */
export function advanceMainQuest(currentId: string): string {
  const def = questDef(currentId);
  return def?.next ?? currentId;
}

export function sideDef(id: string): SideDef | undefined {
  return SIDE.find((s) => s.id === id);
}

export function sideStageLabel(id: string, stage: number, photoSpots: number): string {
  const def = sideDef(id);
  if (!def) return id;
  if (id === 'cat') {
    return ['Lost Cat: ask at the Old Inn', 'Lost Cat: find the cat roaming the city', 'Lost Cat: lead it back to the Inn', 'Lost Cat: complete'][stage] ?? def.title;
  }
  if (id === 'pack') {
    return ['Package Run: ask at the Corner Shop', 'Package Run: deliver to the Dev Office', 'Package Run: complete'][stage] ?? def.title;
  }
  if (id === 'photo') {
    if (stage === 0) return 'Photo Tour: ask at the Night Market';
    if (stage === 1) return `Photo Tour: visit ${3 - photoSpots} glowing spot(s)`;
    return 'Photo Tour: complete';
  }
  return def.title;
}

export function sideIsDone(id: string, stage: number): boolean {
  if (id === 'cat') return stage >= 3;
  return stage >= 2;
}
