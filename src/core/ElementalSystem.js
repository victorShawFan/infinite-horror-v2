// ═══════════════════════════════════════════════════════════════
// 元素交互系统 — 火/冰/毒/念/暗/圣/灵七元素相克
// ═══════════════════════════════════════════════════════════════
//
// 相克关系（伤害 +50%）:
//   火 → 冰 → 毒 → 念 → 火  (基础三角 + 念力)
//   圣 → 暗, 暗 → 灵, 灵 → 圣  (高级三角)
//
// 抗性关系（伤害 -30%）:
//   同元素互相抗性
//
// 共鸣效果：
//   火+冰 = 蒸汽爆裂（额外AOE 20%伤害）
//   毒+火 = 毒雾引燃（DOT伤害翻倍）
//   念+圣 = 心灵净化（清除所有负面状态 + 恢复5%HP）
//   暗+毒 = 深渊腐蚀（忽视30% DEF）

import { DAMAGE_TYPE } from './constants.js';

// ── 元素相克表 ──
export const ELEMENT_ADVANTAGE = {
  [DAMAGE_TYPE.FIRE]:    [DAMAGE_TYPE.ICE],        // 火克冰
  [DAMAGE_TYPE.ICE]:     [DAMAGE_TYPE.POISON],     // 冰克毒
  [DAMAGE_TYPE.POISON]:  [DAMAGE_TYPE.PSYCHIC],    // 毒克念
  [DAMAGE_TYPE.PSYCHIC]: [DAMAGE_TYPE.FIRE],       // 念克火
  [DAMAGE_TYPE.HOLY]:    [DAMAGE_TYPE.DARK],       // 圣克暗
  [DAMAGE_TYPE.DARK]:    [DAMAGE_TYPE.SPIRIT],     // 暗克灵
  [DAMAGE_TYPE.SPIRIT]:  [DAMAGE_TYPE.HOLY],       // 灵克圣
};

// ── 元素共鸣组合 ──
export const ELEMENT_RESONANCE = {
  'fire+ice':    { name: '蒸汽爆裂', bonusDmgPct: 0.20, type: 'aoe', color: '#ff8844', icon: '💨' },
  'poison+fire': { name: '毒雾引燃', dotMultiplier: 2.0, type: 'dot_boost', color: '#88ff44', icon: '🔥' },
  'psychic+holy':{ name: '心灵净化', healPct: 0.05, cleanse: true, type: 'cleanse', color: '#ffff88', icon: '✨' },
  'dark+poison': { name: '深渊腐蚀', armorIgnore: 0.30, type: 'penetrate', color: '#880088', icon: '☠' },
  'ice+psychic': { name: '冻结思维', stunChance: 0.25, type: 'stun', color: '#88ccff', icon: '❄' },
  'holy+fire':   { name: '神圣烈焰', bonusDmgPct: 0.15, purify: true, type: 'purify', color: '#ffdd44', icon: '🔆' },
};

// ── 元素名称和颜色 ──
export const ELEMENT_INFO = {
  [DAMAGE_TYPE.PHYSICAL]: { name: '物理', color: '#cccccc', icon: '⚔' },
  [DAMAGE_TYPE.FIRE]:     { name: '火',   color: '#ff4444', icon: '🔥' },
  [DAMAGE_TYPE.ICE]:      { name: '冰',   color: '#44ccff', icon: '❄' },
  [DAMAGE_TYPE.POISON]:   { name: '毒',   color: '#44ff44', icon: '☠' },
  [DAMAGE_TYPE.PSYCHIC]:  { name: '念',   color: '#cc44ff', icon: '🧠' },
  [DAMAGE_TYPE.DARK]:     { name: '暗',   color: '#884488', icon: '🌑' },
  [DAMAGE_TYPE.HOLY]:     { name: '圣',   color: '#ffff44', icon: '✦' },
  [DAMAGE_TYPE.SPIRIT]:   { name: '灵',   color: '#88ffcc', icon: '👻' },
};

/**
 * 计算元素相克修正
 * @param {string} attackElement - 攻击元素
 * @param {string} defendElement - 防御元素（敌人的元素类型）
 * @returns {{ multiplier: number, isAdvantage: boolean, isResist: boolean, text: string }}
 */
export function calcElementalModifier(attackElement, defendElement) {
  if (!attackElement || !defendElement || attackElement === DAMAGE_TYPE.PHYSICAL || defendElement === DAMAGE_TYPE.PHYSICAL) {
    return { multiplier: 1.0, isAdvantage: false, isResist: false, text: '' };
  }

  // 同元素抗性
  if (attackElement === defendElement) {
    return { multiplier: 0.7, isAdvantage: false, isResist: true, 
             text: `同元素抗性 -30%` };
  }

  // 相克检查
  const advantages = ELEMENT_ADVANTAGE[attackElement] || [];
  if (advantages.includes(defendElement)) {
    return { multiplier: 1.5, isAdvantage: true, isResist: false,
             text: `${ELEMENT_INFO[attackElement]?.name}克${ELEMENT_INFO[defendElement]?.name} +50%` };
  }

  // 被克检查（反向）
  const defAdvantages = ELEMENT_ADVANTAGE[defendElement] || [];
  if (defAdvantages.includes(attackElement)) {
    return { multiplier: 0.75, isAdvantage: false, isResist: true,
             text: `${ELEMENT_INFO[defendElement]?.name}抗${ELEMENT_INFO[attackElement]?.name} -25%` };
  }

  return { multiplier: 1.0, isAdvantage: false, isResist: false, text: '' };
}

/**
 * 检查元素共鸣
 * @param {string[]} activeElements - 当前激活的元素（来自芯片、武器、技能）
 * @returns {object[]} 激活的共鸣效果列表
 */
export function checkElementalResonance(activeElements) {
  if (!activeElements || activeElements.length < 2) return [];
  
  const results = [];
  const unique = [...new Set(activeElements)];
  
  for (let i = 0; i < unique.length; i++) {
    for (let j = i + 1; j < unique.length; j++) {
      const key1 = `${unique[i]}+${unique[j]}`;
      const key2 = `${unique[j]}+${unique[i]}`;
      const resonance = ELEMENT_RESONANCE[key1] || ELEMENT_RESONANCE[key2];
      if (resonance) results.push(resonance);
    }
  }
  
  return results;
}

/**
 * 获取玩家当前的所有活跃元素
 * @param {object} player
 * @returns {string[]} 元素列表
 */
export function getPlayerActiveElements(player) {
  const elements = [];
  
  // 武器元素
  if (player.weapon?.damageType && player.weapon.damageType !== DAMAGE_TYPE.PHYSICAL) {
    elements.push(player.weapon.damageType);
  }
  
  // 芯片元素
  for (const chip of player.chips || []) {
    if (chip.damageType && !elements.includes(chip.damageType)) {
      elements.push(chip.damageType);
    }
  }
  
  // 血统元素
  if (player.activeBloodline === 'daoist') {
    if (!elements.includes(DAMAGE_TYPE.SPIRIT)) elements.push(DAMAGE_TYPE.SPIRIT);
  }
  
  return elements;
}

/**
 * 获取敌人的元素类型
 * @param {object} enemy
 * @returns {string}
 */
export function getEnemyElement(enemy) {
  return enemy.damageType || enemy.element || DAMAGE_TYPE.PHYSICAL;
}
