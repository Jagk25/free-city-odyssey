export type Inventory = Record<string, number>;

export function addItem(inv: Inventory, name: string, count = 1): Inventory {
  return { ...inv, [name]: (inv[name] ?? 0) + count };
}

export function removeItem(inv: Inventory, name: string): Inventory {
  const next = { ...inv };
  delete next[name];
  return next;
}

export function hasItem(inv: Inventory, name: string): boolean {
  return (inv[name] ?? 0) > 0;
}

export interface TradeEffect {
  cash?: number;
  rep?: number;
  xp?: number;
  energy?: number;
  flag?: string;
}

export interface Trade {
  location: string;
  want: string;
  give: string;
  effect: TradeEffect;
}

export function canTrade(inv: Inventory, trade: Trade): boolean {
  return hasItem(inv, trade.want) && !hasItem(inv, trade.give);
}

/** Swaps want -> give. Effects are applied by the caller (world). */
export function executeTrade(inv: Inventory, trade: Trade): Inventory {
  if (!canTrade(inv, trade)) return inv;
  return addItem(removeItem(inv, trade.want), trade.give);
}
