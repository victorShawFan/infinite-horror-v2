// ═══════════════════════════════════════════════════════════════
// 天赋树系统 — 三条路线的被动Build选择
// ═══════════════════════════════════════════════════════════════
//
// 路线1: 战斗 (红) — ATK / CRT / 暴击伤害 / 连击
// 路线2: 生存 (绿) — DEF / MaxHP / 恢复 / 减伤
// 路线3: 技巧 (蓝) — SPD / 闪避 / 法力 / 技能增强
//
// 每次升级获得1天赋点，主神空间可分配
// 每条路线最多 10 层，分5个节点
// 当单路线满10点时解锁终极天赋

import { eventBus } from './EventBus.js';

export const TALENT_PATHS = {
  combat: {
    id: 'combat',
    name: '战斗之道',
    color: '#ff4444',
    icon: '⚔',
    desc: '纯粹的破坏力。提升攻击、暴击和连击能力。',
    tiers: [
      { level: 1, name: '利刃', desc: 'ATK +3', effect: { atk: 3 } },
      { level: 2, name: '精准打击', desc: 'CRT +5%', effect: { crt: 5 } },
      { level: 3, name: '猛攻', desc: 'ATK +5, 暴击伤害 +10%', effect: { atk: 5, critDmgBonus: 0.10 } },
      { level: 4, name: '致命节奏', desc: '每3回合额外攻击1次', effect: { rhythmStrike: 3 } },
      { level: 5, name: '嗜血', desc: '击杀恢复 10% MaxHP', effect: { killHeal: 0.10 } },
      { level: 6, name: '破甲', desc: '攻击忽略敌人 15% DEF', effect: { armorPen: 0.15 } },
      { level: 7, name: '狂暴', desc: 'HP<30%时 ATK +30%', effect: { berserkerThreshold: 0.30, berserkerAtkBonus: 0.30 } },
      { level: 8, name: '连锁暴击', desc: '暴击后下次攻击 CRT +20%', effect: { chainCrit: 20 } },
      { level: 9, name: '无双', desc: 'ATK +8, CRT +8%', effect: { atk: 8, crt: 8 } },
      { level: 10, name: '★ 灭世', desc: '每5回合造成敌人当前HP 15%的真实伤害', effect: { executeDmg: { interval: 5, percent: 0.15 } } },
    ]
  },
  survival: {
    id: 'survival',
    name: '生存之道',
    color: '#44ff88',
    icon: '🛡',
    desc: '坚不可摧的防御。提升生命、防御和恢复能力。',
    tiers: [
      { level: 1, name: '坚韧', desc: 'DEF +3', effect: { def: 3 } },
      { level: 2, name: '厚皮', desc: 'MaxHP +30', effect: { maxHp: 30 } },
      { level: 3, name: '战斗恢复', desc: '每回合恢复 2% MaxHP', effect: { regenPercent: 0.02 } },
      { level: 4, name: '铁壁', desc: 'DEF +5, 受到暴击伤害 -20%', effect: { def: 5, critDmgReduce: 0.20 } },
      { level: 5, name: '生命源泉', desc: 'MaxHP +60', effect: { maxHp: 60 } },
      { level: 6, name: '格挡', desc: '20%概率减少 50% 伤害', effect: { blockChance: 0.20, blockReduce: 0.50 } },
      { level: 7, name: '重生', desc: '每场战斗首次致死时保留1HP', effect: { deathSave: true } },
      { level: 8, name: '反击', desc: '格挡成功时反弹 30% 伤害', effect: { blockCounter: 0.30 } },
      { level: 9, name: '不屈', desc: 'DEF +8, MaxHP +80', effect: { def: 8, maxHp: 80 } },
      { level: 10, name: '★ 永恒', desc: 'HP<20%时受到所有伤害减少 40%', effect: { lastStand: { threshold: 0.20, dmgReduce: 0.40 } } },
    ]
  },
  technique: {
    id: 'technique',
    name: '技巧之道',
    color: '#4488ff',
    icon: '✦',
    desc: '灵巧与智慧。提升速度、闪避和技能效果。',
    tiers: [
      { level: 1, name: '敏捷', desc: 'SPD +3', effect: { spd: 3 } },
      { level: 2, name: '闪避本能', desc: '10%概率完全闪避攻击', effect: { dodgeChance: 0.10 } },
      { level: 3, name: '精神集中', desc: 'MaxMana +20, 技能冷却 -1', effect: { maxMana: 20, cdReduce: 1 } },
      { level: 4, name: '战术思维', desc: '战斗预判精度 +100%', effect: { previewAccuracy: true } },
      { level: 5, name: '迅捷打击', desc: 'SPD +5, 双击阈值降低 20%', effect: { spd: 5, doubleAtkThresholdReduce: 0.20 } },
      { level: 6, name: '技能精通', desc: '技能伤害 +25%', effect: { skillDmgBonus: 0.25 } },
      { level: 7, name: '法力涌流', desc: '每回合恢复 3 法力', effect: { manaRegen: 3 } },
      { level: 8, name: '影分身', desc: '15%概率双倍技能效果', effect: { skillDoubleChance: 0.15 } },
      { level: 9, name: '洞察', desc: 'SPD +8, 闪避 +8%', effect: { spd: 8, dodgeChance: 0.08 } },
      { level: 10, name: '★ 时间裂隙', desc: '每4回合获得一个额外行动回合', effect: { extraTurn: { interval: 4 } } },
    ]
  }
};

// ── 天赋状态管理 ──
export function initTalentState() {
  return {
    points: 0,
    allocated: { combat: 0, survival: 0, technique: 0 },
    // 缓存总效果
    _cache: null,
  };
}

export function allocateTalentPoint(talentState, pathId) {
  if (!TALENT_PATHS[pathId]) return { success: false, reason: '无效路线' };
  if (talentState.points <= 0) return { success: false, reason: '天赋点不足' };
  if (talentState.allocated[pathId] >= 10) return { success: false, reason: '该路线已满' };
  
  talentState.points--;
  talentState.allocated[pathId]++;
  talentState._cache = null; // 清缓存
  
  const tier = TALENT_PATHS[pathId].tiers[talentState.allocated[pathId] - 1];
  eventBus.emit('talent:allocated', { pathId, level: talentState.allocated[pathId], tier });
  
  return { success: true, tier, remaining: talentState.points };
}

export function resetTalents(talentState, cost = 500) {
  const totalAllocated = Object.values(talentState.allocated).reduce((s, v) => s + v, 0);
  if (totalAllocated === 0) return { success: false, reason: '无已分配天赋' };
  
  talentState.points += totalAllocated;
  talentState.allocated = { combat: 0, survival: 0, technique: 0 };
  talentState._cache = null;
  
  eventBus.emit('talent:reset', { refunded: totalAllocated });
  return { success: true, refunded: totalAllocated, cost };
}

// ── 汇总所有已解锁天赋效果 ──
export function getTalentEffects(talentState) {
  if (talentState._cache) return talentState._cache;
  
  const effects = {
    // 直接属性
    atk: 0, def: 0, spd: 0, crt: 0, maxHp: 0, maxMana: 0, res: 0,
    // 特殊被动
    critDmgBonus: 0,        // 暴击伤害加成
    critDmgReduce: 0,       // 受暴击伤害减免
    armorPen: 0,            // 破甲百分比
    killHeal: 0,            // 击杀回血百分比
    regenPercent: 0,        // 每回合回血
    manaRegen: 0,           // 每回合回蓝
    dodgeChance: 0,         // 闪避概率
    blockChance: 0,         // 格挡概率
    blockReduce: 0,         // 格挡减伤
    blockCounter: 0,        // 格挡反击
    skillDmgBonus: 0,       // 技能伤害加成
    cdReduce: 0,            // 冷却缩减
    doubleAtkThresholdReduce: 0, // 双击阈值降低
    // 触发式
    rhythmStrike: 0,        // 节奏打击间隔
    chainCrit: 0,           // 连锁暴击加成
    berserkerThreshold: 0,  // 狂暴HP阈值
    berserkerAtkBonus: 0,   // 狂暴ATK加成
    deathSave: false,       // 死亡保护
    previewAccuracy: false, // 精确预判
    skillDoubleChance: 0,   // 技能双倍
    executeDmg: null,       // 处决伤害
    lastStand: null,        // 最后防线
    extraTurn: null,        // 额外回合
    geneLockChargeBonus: 0, // 基因锁充能加成（来自套装）
  };
  
  for (const [pathId, path] of Object.entries(TALENT_PATHS)) {
    const allocated = talentState.allocated[pathId] || 0;
    for (let i = 0; i < allocated; i++) {
      const tier = path.tiers[i];
      for (const [key, val] of Object.entries(tier.effect)) {
        if (typeof val === 'number') {
          effects[key] = (effects[key] || 0) + val;
        } else if (typeof val === 'boolean') {
          effects[key] = val;
        } else if (typeof val === 'object' && val !== null) {
          effects[key] = val; // executeDmg, lastStand, extraTurn
        }
      }
    }
  }
  
  talentState._cache = effects;
  return effects;
}

// ── 获取路线描述 ──
export function getTalentPathInfo(talentState, pathId) {
  const path = TALENT_PATHS[pathId];
  if (!path) return null;
  const allocated = talentState.allocated[pathId] || 0;
  const unlockedTiers = path.tiers.slice(0, allocated);
  const nextTier = allocated < 10 ? path.tiers[allocated] : null;
  return { path, allocated, unlockedTiers, nextTier };
}
