// ═══════════════════════════════════════════════════════════════
// 连击系统 — 通过战斗行为链触发连击奖励
// ═══════════════════════════════════════════════════════════════
//
// 在战斗中，特定的攻击序列会触发连击效果：
// - 暴击连击(CritChain): 连续暴击累积加伤
// - 元素连锁(ElementChain): 连续不同元素攻击触发连锁反应
// - 弱点打击(WeaknessChain): 攻击弱点累积穿甲
// - 同伴连携(CompanionCombo): 同伴技能+玩家攻击触发联合攻击
// - 完美防御(PerfectBlock): 连续减伤后触发反击
//
// 连击奖励：
// - 2连: 10%加伤
// - 3连: 20%加伤 + 特效
// - 5连: 50%加伤 + 强力特效
// - 10连: 100%加伤 + 必杀

import { gameState } from './GameState.js';

// ── 连击类型定义 ──
export const COMBO_TYPES = {
  crit_chain: {
    name: '暴击连锁',
    icon: '⚡',
    color: '#ffcc44',
    desc: '连续暴击叠加伤害',
    trigger: 'consecutive_crits',
    thresholds: [
      { count: 2, bonus: 0.10, text: '暴击连锁 ×2！' },
      { count: 3, bonus: 0.25, text: '三连暴击！伤害激增！' },
      { count: 5, bonus: 0.50, text: '暴击风暴！五连暴击！' },
      { count: 8, bonus: 1.00, text: '★ 完美连击 ★ 暴击之王！' },
    ],
  },
  elemental_chain: {
    name: '元素连锁',
    icon: '🔮',
    color: '#44aaff',
    desc: '不同元素攻击触发连锁',
    trigger: 'different_elements',
    thresholds: [
      { count: 2, bonus: 0.15, text: '元素连锁！' },
      { count: 3, bonus: 0.30, text: '三元素共鸣！', effect: 'dot' },
      { count: 4, bonus: 0.50, text: '元素爆发！全属性增幅！', effect: 'allBoost' },
    ],
  },
  weakness_chain: {
    name: '弱点连打',
    icon: '🎯',
    color: '#ff8844',
    desc: '持续攻击弱点累积穿甲',
    trigger: 'hit_weakness',
    thresholds: [
      { count: 2, bonus: 0.10, armorPen: 0.10, text: '弱点连打！防御削减！' },
      { count: 4, bonus: 0.20, armorPen: 0.25, text: '弱点碎裂！大幅穿甲！' },
      { count: 6, bonus: 0.40, armorPen: 0.50, text: '致命弱点！防御崩溃！' },
    ],
  },
  companion_combo: {
    name: '同伴连携',
    icon: '🤝',
    color: '#44ff88',
    desc: '同伴技能后立即攻击的联合加成',
    trigger: 'after_companion',
    thresholds: [
      { count: 1, bonus: 0.20, text: '同伴连携！联合攻击！' },
      { count: 2, bonus: 0.35, text: '双重连携！默契配合！' },
      { count: 3, bonus: 0.50, text: '★ 团队合击 ★', effect: 'teamHeal' },
    ],
  },
  perfect_defense: {
    name: '完美防御',
    icon: '🛡',
    color: '#6688ff',
    desc: '连续承受攻击后触发反击',
    trigger: 'consecutive_blocks',
    thresholds: [
      { count: 3, bonus: 0.15, text: '完美防御！反击之力凝聚！' },
      { count: 5, bonus: 0.30, text: '绝对防御！强力反击蓄满！', effect: 'counter' },
    ],
  },
};

// ── 战斗中连击追踪器 ──
let _comboState = {};

/**
 * 初始化连击状态（每场战斗开始时调用）
 */
export function initComboState() {
  _comboState = {
    critStreak: 0,          // 连续暴击次数
    elementHistory: [],      // 最近使用的元素列表
    weaknessHits: 0,        // 弱点命中次数
    companionComboCount: 0,  // 同伴连携次数
    blockCount: 0,           // 连续承受攻击次数
    lastAction: null,        // 上一个动作类型
    activeCombo: null,       // 当前激活的连击
    totalComboBonus: 0,      // 累计连击加成
  };
  return _comboState;
}

/**
 * 记录暴击事件
 */
export function recordCrit(isCrit) {
  if (isCrit) {
    _comboState.critStreak++;
    _comboState.lastAction = 'crit';
  } else {
    _comboState.critStreak = 0;
  }
}

/**
 * 记录元素攻击
 */
export function recordElementalHit(element) {
  if (!element || element === 'physical') return;
  const history = _comboState.elementHistory;
  // 只记录不同元素
  if (history.length === 0 || history[history.length - 1] !== element) {
    history.push(element);
    if (history.length > 5) history.shift();
  }
}

/**
 * 记录弱点攻击
 */
export function recordWeaknessHit(hitWeakness) {
  if (hitWeakness) {
    _comboState.weaknessHits++;
  } else {
    _comboState.weaknessHits = Math.max(0, _comboState.weaknessHits - 1);
  }
}

/**
 * 记录同伴技能触发
 */
export function recordCompanionAction() {
  _comboState.companionComboCount++;
  _comboState.lastAction = 'companion';
}

/**
 * 记录承受攻击（防御）
 */
export function recordBlock() {
  _comboState.blockCount++;
}

/**
 * 计算当前连击加成
 * @returns {{ comboName, icon, color, bonus, text, effects[] } | null}
 */
export function getComboBonus() {
  const results = [];
  
  // 1. 暴击连锁
  if (_comboState.critStreak >= 2) {
    const combo = COMBO_TYPES.crit_chain;
    let best = null;
    for (const t of combo.thresholds) {
      if (_comboState.critStreak >= t.count) best = t;
    }
    if (best) {
      results.push({
        type: 'crit_chain',
        name: combo.name,
        icon: combo.icon,
        color: combo.color,
        bonus: best.bonus,
        text: best.text,
        count: _comboState.critStreak,
      });
    }
  }
  
  // 2. 元素连锁
  const uniqueElements = new Set(_comboState.elementHistory);
  if (uniqueElements.size >= 2) {
    const combo = COMBO_TYPES.elemental_chain;
    let best = null;
    for (const t of combo.thresholds) {
      if (uniqueElements.size >= t.count) best = t;
    }
    if (best) {
      results.push({
        type: 'elemental_chain',
        name: combo.name,
        icon: combo.icon,
        color: combo.color,
        bonus: best.bonus,
        text: best.text,
        effect: best.effect,
        count: uniqueElements.size,
      });
    }
  }
  
  // 3. 弱点连打
  if (_comboState.weaknessHits >= 2) {
    const combo = COMBO_TYPES.weakness_chain;
    let best = null;
    for (const t of combo.thresholds) {
      if (_comboState.weaknessHits >= t.count) best = t;
    }
    if (best) {
      results.push({
        type: 'weakness_chain',
        name: combo.name,
        icon: combo.icon,
        color: combo.color,
        bonus: best.bonus,
        armorPen: best.armorPen || 0,
        text: best.text,
        count: _comboState.weaknessHits,
      });
    }
  }
  
  // 4. 同伴连携
  if (_comboState.companionComboCount >= 1 && _comboState.lastAction === 'companion') {
    const combo = COMBO_TYPES.companion_combo;
    let best = null;
    for (const t of combo.thresholds) {
      if (_comboState.companionComboCount >= t.count) best = t;
    }
    if (best) {
      results.push({
        type: 'companion_combo',
        name: combo.name,
        icon: combo.icon,
        color: combo.color,
        bonus: best.bonus,
        text: best.text,
        effect: best.effect,
        count: _comboState.companionComboCount,
      });
    }
  }
  
  // 5. 完美防御
  if (_comboState.blockCount >= 3) {
    const combo = COMBO_TYPES.perfect_defense;
    let best = null;
    for (const t of combo.thresholds) {
      if (_comboState.blockCount >= t.count) best = t;
    }
    if (best) {
      results.push({
        type: 'perfect_defense',
        name: combo.name,
        icon: combo.icon,
        color: combo.color,
        bonus: best.bonus,
        text: best.text,
        effect: best.effect,
        count: _comboState.blockCount,
      });
    }
    // 反击后重置
    if (best?.effect === 'counter') _comboState.blockCount = 0;
  }
  
  if (results.length === 0) return null;
  
  // 返回最高加成的连击
  results.sort((a, b) => b.bonus - a.bonus);
  return results[0];
}

/**
 * 获取所有活跃连击（用于HUD显示）
 */
export function getAllActiveCombos() {
  const combos = [];
  
  if (_comboState.critStreak >= 2) {
    combos.push({ icon: '⚡', name: '暴击', count: _comboState.critStreak, color: '#ffcc44' });
  }
  if (new Set(_comboState.elementHistory).size >= 2) {
    combos.push({ icon: '🔮', name: '元素', count: new Set(_comboState.elementHistory).size, color: '#44aaff' });
  }
  if (_comboState.weaknessHits >= 2) {
    combos.push({ icon: '🎯', name: '弱点', count: _comboState.weaknessHits, color: '#ff8844' });
  }
  if (_comboState.companionComboCount >= 1) {
    combos.push({ icon: '🤝', name: '连携', count: _comboState.companionComboCount, color: '#44ff88' });
  }
  if (_comboState.blockCount >= 3) {
    combos.push({ icon: '🛡', name: '防御', count: _comboState.blockCount, color: '#6688ff' });
  }
  
  return combos;
}

/**
 * 获取当前连击状态（用于测试）
 */
export function getComboState() {
  return { ..._comboState };
}

/**
 * 生成连击日志条目
 */
export function formatComboLog(combo) {
  if (!combo) return [];
  return [
    { text: `${combo.icon} ${combo.text} (DMG +${Math.floor(combo.bonus * 100)}%)`, type: 'combo_trigger' },
  ];
}
