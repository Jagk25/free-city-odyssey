export interface DialogueChoice {
  t: string;
  next?: string;
  fx?: string;
}

export interface DialogueNode {
  sp: string;
  t: string;
  c?: DialogueChoice[];
}

export type DialogueTree = Record<string, DialogueNode>;

export function getNode(tree: DialogueTree, id: string): DialogueNode | null {
  return tree[id] ?? null;
}

/** Returns a list of validation errors: missing nodes, dead references. Empty array = valid. */
export function validateTree(name: string, tree: DialogueTree): string[] {
  const errors: string[] = [];
  const ids = Object.keys(tree);
  if (ids.length === 0) {
    errors.push(`${name}: tree is empty`);
    return errors;
  }
  if (!tree.start) {
    errors.push(`${name}: missing 'start' node`);
  }
  for (const [id, node] of Object.entries(tree)) {
    if (!node.t) errors.push(`${name}.${id}: empty text`);
    for (const choice of node.c ?? []) {
      if (choice.next && !tree[choice.next]) {
        errors.push(`${name}.${id}: choice '${choice.t}' points to missing node '${choice.next}'`);
      }
    }
  }
  return errors;
}

export function validateTrees(trees: Record<string, DialogueTree>): string[] {
  return Object.entries(trees).flatMap(([name, tree]) => validateTree(name, tree));
}
