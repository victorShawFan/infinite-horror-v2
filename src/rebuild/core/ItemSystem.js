import { TARGET_KIND } from './TurnBattleEngine.js';

export const ITEM_CATALOG = Object.freeze({
  first_aid: {
    id: 'first_aid', name: '战术急救包', icon: '十', cost: 80,
    target: TARGET_KIND.SINGLE_ALLY, healFlat: 35,
    desc: '在战斗中为一名存活队员恢复35点生命。',
  },
  team_spray: {
    id: 'team_spray', name: '群体止血喷雾', icon: '雾', cost: 180,
    target: TARGET_KIND.ALL_ALLIES, healFlat: 18,
    desc: '为中洲队所有存活成员恢复18点生命。',
  },
});

function cloneProfile(profile) {
  return { ...profile, inventory: { ...(profile.inventory || {}) } };
}

export function purchaseItem(profile, itemId, quantity = 1, catalog = ITEM_CATALOG) {
  const next = cloneProfile(profile);
  const item = catalog[itemId];
  const count = Math.max(1, Math.floor(Number(quantity || 1)));
  if (!item) return { ok: false, error: 'item_not_found', profile: next };
  const totalCost = item.cost * count;
  if ((next.rewardPoints || 0) < totalCost) return { ok: false, error: 'insufficient_points', profile: next };
  next.rewardPoints -= totalCost;
  next.inventory[itemId] = (next.inventory[itemId] || 0) + count;
  return { ok: true, item, quantity: count, profile: next };
}

export function syncInventoryFromCombatant(profile, combatant) {
  return {
    ...profile,
    inventory: { ...(combatant?.inventory || {}) },
  };
}
