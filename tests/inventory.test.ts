import { describe, expect, it } from 'vitest';
import { addItem, canTrade, executeTrade, hasItem, removeItem, type Trade } from '../src/game/inventory';

describe('inventory', () => {
  it('adds, checks, and removes items', () => {
    let inv = addItem({}, 'Old Key');
    expect(hasItem(inv, 'Old Key')).toBe(true);
    inv = addItem(inv, 'Old Key');
    expect(inv['Old Key']).toBe(2);
    inv = removeItem(inv, 'Old Key');
    expect(hasItem(inv, 'Old Key')).toBe(false);
  });

  it('trades only when holding the wanted item and not yet owning the reward', () => {
    const trade: Trade = { location: 'bank', want: 'Old Key', give: 'Vault Access', effect: { cash: 50 } };
    expect(canTrade({}, trade)).toBe(false);
    let inv = addItem({}, 'Old Key');
    expect(canTrade(inv, trade)).toBe(true);
    inv = executeTrade(inv, trade);
    expect(hasItem(inv, 'Old Key')).toBe(false);
    expect(hasItem(inv, 'Vault Access')).toBe(true);
    expect(canTrade(inv, trade)).toBe(false); // no double-trade
  });
});
