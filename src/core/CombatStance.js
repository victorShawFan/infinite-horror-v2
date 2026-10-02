// ═══════════════════════════════════════════════════════════════
// 战斗姿态系统 — 战前选择影响战斗策略
// ═══════════════════════════════════════════════════════════════
//
// 玩家在战前确认面板选择一种战斗姿态
// 每种姿态改变攻防比例、暴击率、特殊效果
// 影响 executeBattle 的数值计算

import { gameState } from './GameState.js';
import { eventBus } from './EventBus.js';

export const STANCES = {
  balanced: {
    id: 'balanced',
    name: '平衡', icon: '⚖',
    desc: '攻守兼备，不特化任何方向',
    color: '#aaaaff',
    modifiers: { atkMult: 1.0, defMult: 1.0, crtBonus: 0, spdBonus: 0 },
  },
  aggressive: {
    id: 'aggressive',
    name: '猛攻', icon: '🔥',
    desc: 'ATK+25%，DEF-15%，暴击+10%',
    color: '#ff4444',
    modifiers: { atkMult: 1.25, defMult: 0.85, crtBonus: 10, spdBonus: 0 },
  },
  defensive: {
    id: 'defensive',
    name: '防御', icon: '🛡',
    desc: 'DEF+30%，ATK-20%，受伤减少',
    color: '#4488ff',
    modifiers: { atkMult: 0.80, defMult: 1.30, crtBonus: -5, spdBonus: 0 },
  },
  swift: {
    id: 'swift',
    name: '迅捷', icon: '💨',
    desc: 'SPD+40%，双击概率大增，但ATK-10%',
    color: '#44ffaa',
    modifiers: { atkMult: 0.90, defMult: 1.0, crtBonus: 5, spdBonus: 40 },
  },
  reckless: {
    id: 'reckless',
    name: '舍身', icon: '💀',
    desc: 'ATK+50%，DEF-30%，高风险高回报',
    color: '#ff8800',
    modifiers: { atkMult: 1.50, defMult: 0.70, crtBonus: 15, spdBonus: -5 },
    unlockLevel: 5, // 5级解锁
  },
  precision: {
    id: 'precision',
    name: '精准', icon: '🎯',
    desc: '暴击+30%，暴击伤害+50%，普攻-10%',
    color: '#ffcc44',
    modifiers: { atkMult: 0.90, defMult: 1.0, crtBonus: 30, spdBonus: 0, critDmgBonus: 0.5 },
    unlockLevel: 8,
  },
};

let _currentStance = 'balanced';

/**
 * 获取当前选中的姿态
 */
export function getCurrentStance() {
  return STANCES[_currentStance] || STANCES.balanced;
}

/**
 * 设置战斗姿态
 */
export function setStance(stanceId) {
  if (!STANCES[stanceId]) return false;
  const stance = STANCES[stanceId];
  if (stance.unlockLevel && gameState.player.level < stance.unlockLevel) return false;
  _currentStance = stanceId;
  eventBus.emit('stance:changed', { stance: stanceId });
  return true;
}

/**
 * 获取可用姿态列表
 */
export function getAvailableStances() {
  const level = gameState.player.level;
  return Object.values(STANCES).filter(s => !s.unlockLevel || level >= s.unlockLevel);
}

/**
 * 获取姿态修正后的属性
 */
export function applyStanceModifiers(atk, def, crt, spd) {
  const stance = getCurrentStance();
  const m = stance.modifiers;
  return {
    atk: Math.floor(atk * m.atkMult),
    def: Math.floor(def * m.defMult),
    crt: Math.max(0, crt + (m.crtBonus || 0)),
    spd: Math.max(1, spd + (m.spdBonus || 0)),
    critDmgBonus: m.critDmgBonus || 0,
    stanceName: stance.name,
    stanceIcon: stance.icon,
  };
}

/**
 * 保存/恢复姿态到存档
 */
export function getStanceId() { return _currentStance; }
export function restoreStance(id) { if (STANCES[id]) _currentStance = id; }
