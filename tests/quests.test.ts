import { describe, expect, it } from 'vitest';
import { advanceMainQuest, mainQuestTarget, mainQuestTitle, sideIsDone, sideStageLabel } from '../src/game/quests';

describe('quest engine', () => {
  it('walks the main chain in order', () => {
    expect(advanceMainQuest('routine')).toBe('glasses');
    expect(advanceMainQuest('glasses')).toBe('bank');
    expect(advanceMainQuest('bank')).toBe('garden');
    expect(advanceMainQuest('garden')).toBe('server');
    expect(advanceMainQuest('server')).toBe('done');
    expect(advanceMainQuest('done')).toBe('done');
  });

  it('targets the right buildings', () => {
    expect(mainQuestTarget('routine')).toBe('cafe');
    expect(mainQuestTarget('glasses')).toBe('dev');
    expect(mainQuestTarget('server')).toBe('warehouse');
    expect(mainQuestTarget('done')).toBeNull();
  });

  it('has titles for every stage', () => {
    for (const id of ['routine', 'glasses', 'bank', 'garden', 'server', 'done']) {
      expect(mainQuestTitle(id).length).toBeGreaterThan(3);
    }
  });

  it('side quest labels track stages and completion', () => {
    expect(sideStageLabel('cat', 0, 0)).toContain('ask at the Old Inn');
    expect(sideStageLabel('cat', 3, 0)).toContain('complete');
    expect(sideIsDone('cat', 3)).toBe(true);
    expect(sideIsDone('pack', 1)).toBe(false);
    expect(sideIsDone('pack', 2)).toBe(true);
    expect(sideStageLabel('photo', 1, 1)).toContain('2 glowing');
  });
});
