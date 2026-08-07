import { describe, expect, it } from 'vitest';
import { getNode, validateTree, validateTrees, type DialogueTree } from '../src/game/dialogue';
import trees from '../src/data/dialogue-trees.json';

describe('dialogue runtime', () => {
  it('fetches nodes by id', () => {
    const tree: DialogueTree = { start: { sp: 'A', t: 'hello' } };
    expect(getNode(tree, 'start')!.t).toBe('hello');
    expect(getNode(tree, 'missing')).toBeNull();
  });

  it('validator catches dead references', () => {
    const bad: DialogueTree = {
      start: { sp: 'A', t: 'hi', c: [{ t: 'go', next: 'nowhere' }] },
    };
    const errors = validateTree('bad', bad);
    expect(errors.length).toBe(1);
    expect(errors[0]).toContain('nowhere');
  });

  it('validator catches missing start node', () => {
    const errors = validateTree('bad', { other: { sp: 'A', t: 'hi' } });
    expect(errors.some((e) => e.includes('start'))).toBe(true);
  });

  it('all shipped dialogue trees are valid (no dead nodes)', () => {
    const errors = validateTrees(trees as Record<string, DialogueTree>);
    expect(errors).toEqual([]);
  });
});
