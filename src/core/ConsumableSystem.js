// ═══════════════════════════════════════════════════════════════
// 消耗品系统 — 战前使用、探索中使用的一次性道具
// ═══════════════════════════════════════════════════════════════
//
// 类型: 恢复药 / 增益药水 / 战略道具 / 侦察道具
// 来源: 宝箱、商店、战斗掉落、事件奖励

import { gameState } from './GameState.js';
import { eventBus } from './EventBus.js';

// ── 消耗品定义 ──
export const CONSUMABLE_DEFS = {
  // ── 恢复类 ──
  potion_small: {
    name: '小型回复药', icon: '🧪', color: '#44ff88',
    desc: '恢复30HP', category: 'heal',
    effect: { heal: 30 },
    value: 30, rarity: 'common',
  },
  potion_medium: {
    name: '中型回复药', icon: '🧪', color: '#44ffaa',
    desc: '恢复80HP', category: 'heal',
    effect: { heal: 80 },
    value: 80, rarity: 'uncommon',
  },
  potion_large: {
    name: '大型回复药', icon: '🧪', color: '#44ffff',
    desc: '恢复200HP', category: 'heal',
    effect: { heal: 200 },
    value: 200, rarity: 'rare',
  },
  elixir: {
    name: '万灵药', icon: '✨', color: '#ffcc44',
    desc: '完全恢复HP', category: 'heal',
    effect: { healFull: true },
    value: 500, rarity: 'legendary',
  },
  antidote: {
    name: '解毒剂', icon: '💊', color: '#88ff44',
    desc: '清除毒素和诅咒', category: 'cure',
    effect: { clearDebuffs: true },
    value: 40, rarity: 'common',
  },

  // ── 战斗增益类 ──
  atk_tonic: {
    name: '力量药剂', icon: '⚔', color: '#ff6644',
    desc: '下场战斗ATK+30%', category: 'buff',
    effect: { combatBuff: { stat: 'atk', multiplier: 1.3, duration: 1 } },
    value: 60, rarity: 'uncommon',
  },
  def_tonic: {
    name: '铁壁药剂', icon: '🛡', color: '#6688ff',
    desc: '下场战斗DEF+50%', category: 'buff',
    effect: { combatBuff: { stat: 'def', multiplier: 1.5, duration: 1 } },
    value: 60, rarity: 'uncommon',
  },
  crit_oil: {
    name: '暴击之油', icon: '💥', color: '#ffaa00',
    desc: '下场战斗CRT+25%', category: 'buff',
    effect: { combatBuff: { stat: 'crt', bonus: 25, duration: 1 } },
    value: 80, rarity: 'uncommon',
  },
  berserker_draught: {
    name: '狂战士饮剂', icon: '🔥', color: '#ff2200',
    desc: 'ATK翻倍，但DEF-50%（1场战斗）', category: 'buff',
    effect: { combatBuff: { stat: 'atk', multiplier: 2, duration: 1, penalty: { stat: 'def', multiplier: 0.5 } } },
    value: 120, rarity: 'rare',
  },

  // ── 侦察类 ──
  trap_detector: {
    name: '陷阱探测器', icon: '🔍', color: '#44ccff',
    desc: '揭示当前楼层所有隐藏陷阱', category: 'utility',
    effect: { revealTraps: true },
    value: 50, rarity: 'uncommon',
  },
  enemy_scan: {
    name: '敌情扫描仪', icon: '📡', color: '#ff8844',
    desc: '精确显示当前楼层所有敌人属性', category: 'utility',
    effect: { scanEnemies: true },
    value: 40, rarity: 'uncommon',
  },

  // ── 战略道具 ──
  smoke_bomb: {
    name: '烟雾弹', icon: '💨', color: '#888888',
    desc: '逃离当前战斗(不获得奖励)', category: 'escape',
    effect: { escape: true },
    value: 50, rarity: 'uncommon',
  },
  teleport_stone: {
    name: '传送石', icon: '🌀', color: '#aa88ff',
    desc: '传送到本层楼梯入口', category: 'utility',
    effect: { teleportToStairs: true },
    value: 100, rarity: 'rare',
  },
};

/**
 * 初始化玩家背包（如果尚未初始化）
 */
export function ensureInventory() {
  if (!gameState.player.consumables) {
    gameState.player.consumables = {};
  }
  return gameState.player.consumables;
}

/**
 * 添加消耗品到背包
 * @returns {boolean} 是否成功
 */
export function addConsumable(consumableId, count = 1) {
  const def = CONSUMABLE_DEFS[consumableId];
  if (!def) return false;
  const inv = ensureInventory();
  inv[consumableId] = (inv[consumableId] || 0) + count;
  eventBus.emit('consumable:added', { id: consumableId, count });
  return true;
}

/**
 * 使用消耗品
 * @returns {{ success: boolean, effect: string }}
 */
export function useConsumable(consumableId) {
  const def = CONSUMABLE_DEFS[consumableId];
  if (!def) return { success: false, effect: '未知道具' };
  const inv = ensureInventory();
  if (!inv[consumableId] || inv[consumableId] <= 0) {
    return { success: false, effect: '数量不足' };
  }

  const p = gameState.player;
  let effectText = '';

  // 恢复类
  if (def.effect.heal) {
    const actual = Math.min(def.effect.heal, p.maxHp - p.hp);
    p.hp = Math.min(p.maxHp, p.hp + def.effect.heal);
    effectText = `❤ 恢复 ${actual} HP`;
  }
  if (def.effect.healFull) {
    const actual = p.maxHp - p.hp;
    p.hp = p.maxHp;
    effectText = `✨ 完全恢复! (+${actual} HP)`;
  }
  if (def.effect.clearDebuffs) {
    // 清除临时debuff（诅咒陷阱等）
    effectText = `💊 清除了负面状态`;
  }

  // 战斗增益类 — 存储到临时状态，下场战斗消耗
  if (def.effect.combatBuff) {
    if (!gameState._pendingBuffs) gameState._pendingBuffs = [];
    gameState._pendingBuffs.push({ ...def.effect.combatBuff, source: consumableId });
    effectText = `⚔ ${def.name}: 效果将在下场战斗生效`;
  }

  // 侦察类
  if (def.effect.revealTraps) {
    effectText = `🔍 陷阱位置已揭示!`;
    // 实际效果在 main.js 处理
  }
  if (def.effect.scanEnemies) {
    effectText = `📡 敌人属性已扫描!`;
  }

  // 消耗道具
  inv[consumableId]--;
  if (inv[consumableId] <= 0) delete inv[consumableId];
  gameState.stats.consumablesUsed = (gameState.stats.consumablesUsed || 0) + 1;
  eventBus.emit('consumable:used', { id: consumableId, effect: def.effect });

  return { success: true, effect: effectText, definition: def };
}

/**
 * 获取背包内容（UI用）
 */
export function getInventoryList() {
  const inv = ensureInventory();
  return Object.entries(inv)
    .filter(([, count]) => count > 0)
    .map(([id, count]) => ({
      id,
      count,
      ...(CONSUMABLE_DEFS[id] || { name: id, icon: '?', desc: '' }),
    }))
    .sort((a, b) => {
      const order = { heal: 0, cure: 1, buff: 2, utility: 3, escape: 4 };
      return (order[a.category] ?? 99) - (order[b.category] ?? 99);
    });
}

/**
 * 获取待使用的战斗增益
 * @returns {Array} 增益列表
 */
export function consumePendingBuffs() {
  const buffs = gameState._pendingBuffs || [];
  gameState._pendingBuffs = [];
  return buffs;
}

/**
 * 给新玩家初始道具
 */
export function giveStarterConsumables() {
  addConsumable('potion_small', 3);
  addConsumable('antidote', 1);
}
