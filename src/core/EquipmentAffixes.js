// ═══════════════════════════════════════════════════════════════
// 装备词缀系统 — 随机词缀让每件装备独特
// ═══════════════════════════════════════════════════════════════
//
// 设计理念：
//   装备掉落时可附带0-2个词缀（前缀+后缀）
//   词缀分5个品级：粗糙/普通/精良/稀有/传奇
//   词缀影响战斗属性、提供特殊效果
//   高品级词缀在高章节更常出现
// ═══════════════════════════════════════════════════════════════

import { eventBus } from './EventBus.js';

// ── 品质等级 ──
export const QUALITY = {
  CRUDE: 'crude',       // 粗糙 - 灰色
  COMMON: 'common',     // 普通 - 白色  
  FINE: 'fine',         // 精良 - 绿色
  RARE: 'rare',         // 稀有 - 蓝色
  LEGENDARY: 'legendary', // 传奇 - 橙色
};

export const QUALITY_CONFIG = {
  [QUALITY.CRUDE]:     { name: '粗糙', color: '#888888', statMult: 0.7, affixSlots: 0 },
  [QUALITY.COMMON]:    { name: '普通', color: '#cccccc', statMult: 1.0, affixSlots: 0 },
  [QUALITY.FINE]:      { name: '精良', color: '#44cc44', statMult: 1.15, affixSlots: 1 },
  [QUALITY.RARE]:      { name: '稀有', color: '#4488ff', statMult: 1.3, affixSlots: 2 },
  [QUALITY.LEGENDARY]: { name: '传奇', color: '#ff8800', statMult: 1.5, affixSlots: 2 },
};

// ── 前缀词缀池 ──
export const PREFIX_AFFIXES = [
  // 攻击类
  { id: 'sharp', name: '锋利的', stat: 'atk', range: [2, 5], weight: 10, minChapter: 1 },
  { id: 'brutal', name: '残暴的', stat: 'atk', range: [4, 8], weight: 6, minChapter: 3 },
  { id: 'devastating', name: '毁灭的', stat: 'atk', range: [8, 15], weight: 2, minChapter: 7 },
  // 防御类
  { id: 'sturdy', name: '坚固的', stat: 'def', range: [2, 4], weight: 10, minChapter: 1 },
  { id: 'fortified', name: '铸铁的', stat: 'def', range: [4, 8], weight: 6, minChapter: 3 },
  { id: 'unbreakable', name: '不灭的', stat: 'def', range: [8, 14], weight: 2, minChapter: 7 },
  // 生命类
  { id: 'vital', name: '活力的', stat: 'maxHp', range: [15, 30], weight: 8, minChapter: 1 },
  { id: 'tenacious', name: '顽强的', stat: 'maxHp', range: [30, 60], weight: 4, minChapter: 4 },
  { id: 'undying', name: '不朽的', stat: 'maxHp', range: [60, 120], weight: 1, minChapter: 8 },
  // 速度类
  { id: 'swift', name: '迅捷的', stat: 'spd', range: [1, 3], weight: 7, minChapter: 1 },
  { id: 'blinding', name: '疾风的', stat: 'spd', range: [3, 6], weight: 3, minChapter: 5 },
  // 暴击类
  { id: 'keen', name: '精准的', stat: 'crt', range: [3, 6], weight: 7, minChapter: 2 },
  { id: 'lethal', name: '致命的', stat: 'crt', range: [6, 12], weight: 3, minChapter: 5 },
];

// ── 后缀词缀池 ──
export const SUFFIX_AFFIXES = [
  // 元素加成
  { id: 'of_flame', name: '烈焰', effect: 'fire_dmg', value: [5, 12], weight: 6, minChapter: 2,
    desc: '攻击附带火焰伤害' },
  { id: 'of_frost', name: '寒冰', effect: 'ice_dmg', value: [5, 12], weight: 6, minChapter: 2,
    desc: '攻击附带冰霜伤害' },
  { id: 'of_venom', name: '剧毒', effect: 'poison_dmg', value: [3, 8], weight: 6, minChapter: 3,
    desc: '攻击附带中毒效果' },
  { id: 'of_light', name: '圣光', effect: 'holy_dmg', value: [4, 10], weight: 4, minChapter: 4,
    desc: '攻击附带圣光伤害' },
  // 生存类
  { id: 'of_regen', name: '再生', effect: 'regen', value: [1, 3], weight: 5, minChapter: 2,
    desc: '每回合恢复HP' },
  { id: 'of_leech', name: '汲取', effect: 'lifesteal', value: [5, 15], weight: 3, minChapter: 4,
    desc: '攻击吸血%' },
  { id: 'of_thorns', name: '荆棘', effect: 'thorns', value: [3, 8], weight: 5, minChapter: 3,
    desc: '受击反弹固定伤害' },
  // 特殊
  { id: 'of_fortune', name: '财运', effect: 'gold_bonus', value: [10, 30], weight: 4, minChapter: 1,
    desc: '金币掉落+%' },
  { id: 'of_wisdom', name: '智慧', effect: 'exp_bonus', value: [8, 20], weight: 4, minChapter: 1,
    desc: '经验获取+%' },
  { id: 'of_the_void', name: '虚空', effect: 'ignore_def', value: [5, 15], weight: 2, minChapter: 6,
    desc: '无视敌人%防御' },
  { id: 'of_the_gods', name: '神力', effect: 'all_stats', value: [2, 5], weight: 1, minChapter: 8,
    desc: '全属性+' },
];

// ── 根据章节和随机种子生成品质 ──
export function rollQuality(chapter, luckBonus = 0) {
  const r = Math.random() * 100 + luckBonus;
  // 品质概率随章节提升
  const legendaryThreshold = Math.max(2, 5 + chapter * 0.5);
  const rareThreshold = legendaryThreshold + Math.max(8, 12 + chapter);
  const fineThreshold = rareThreshold + Math.max(20, 25 + chapter * 0.5);
  const commonThreshold = fineThreshold + 30;
  
  if (r >= 100 - legendaryThreshold) return QUALITY.LEGENDARY;
  if (r >= 100 - rareThreshold) return QUALITY.RARE;
  if (r >= 100 - fineThreshold) return QUALITY.FINE;
  if (r >= 100 - commonThreshold) return QUALITY.COMMON;
  return QUALITY.CRUDE;
}

// ── 根据品质生成词缀 ──
export function generateAffixes(quality, chapter) {
  const config = QUALITY_CONFIG[quality];
  if (!config || config.affixSlots === 0) return { prefix: null, suffix: null };

  const affixes = { prefix: null, suffix: null };
  
  // 生成前缀
  if (config.affixSlots >= 1) {
    const pool = PREFIX_AFFIXES.filter(a => chapter >= a.minChapter);
    if (pool.length > 0) {
      const totalWeight = pool.reduce((s, a) => s + a.weight, 0);
      let roll = Math.random() * totalWeight;
      for (const affix of pool) {
        roll -= affix.weight;
        if (roll <= 0) {
          const value = affix.range[0] + Math.floor(Math.random() * (affix.range[1] - affix.range[0] + 1));
          affixes.prefix = { id: affix.id, name: affix.name, stat: affix.stat, value };
          break;
        }
      }
    }
  }

  // 生成后缀
  if (config.affixSlots >= 2) {
    const pool = SUFFIX_AFFIXES.filter(a => chapter >= a.minChapter);
    if (pool.length > 0) {
      const totalWeight = pool.reduce((s, a) => s + a.weight, 0);
      let roll = Math.random() * totalWeight;
      for (const affix of pool) {
        roll -= affix.weight;
        if (roll <= 0) {
          const value = affix.value[0] + Math.floor(Math.random() * (affix.value[1] - affix.value[0] + 1));
          affixes.suffix = { 
            id: affix.id, name: affix.name, 
            effect: affix.effect, value, desc: affix.desc 
          };
          break;
        }
      }
    }
  }

  return affixes;
}

// ── 应用品质和词缀到装备 ──
export function applyQualityToEquipment(equipment, quality, chapter) {
  const config = QUALITY_CONFIG[quality];
  if (!config) return equipment;

  const enhanced = { ...equipment };
  enhanced.quality = quality;
  enhanced.qualityConfig = config;

  // 基础属性按品质缩放
  if (enhanced.atk) enhanced.atk = Math.floor(enhanced.atk * config.statMult);
  if (enhanced.def) enhanced.def = Math.floor(enhanced.def * config.statMult);
  if (enhanced.maxHp) enhanced.maxHp = Math.floor(enhanced.maxHp * config.statMult);
  if (enhanced.spd) enhanced.spd = Math.floor(enhanced.spd * config.statMult);
  if (enhanced.crt) enhanced.crt = Math.floor(enhanced.crt * config.statMult);

  // 生成词缀
  const affixes = generateAffixes(quality, chapter);
  enhanced.affixes = affixes;

  // 应用前缀属性
  if (affixes.prefix) {
    const stat = affixes.prefix.stat;
    enhanced[stat] = (enhanced[stat] || 0) + affixes.prefix.value;
  }

  // 构建显示名
  enhanced.displayName = getAffixedName(enhanced, affixes);

  return enhanced;
}

// ── 生成带词缀的显示名 ──
export function getAffixedName(equipment, affixes) {
  let name = equipment.name || '未知装备';
  if (affixes?.prefix) name = affixes.prefix.name + name;
  if (affixes?.suffix) name = name + '·' + affixes.suffix.name;
  return name;
}

// ── 获取词缀提供的战斗效果 ──
export function getAffixCombatEffects(equipment) {
  const effects = {
    fireDmg: 0, iceDmg: 0, poisonDmg: 0, holyDmg: 0,
    regen: 0, lifestealPct: 0, thornsDmg: 0,
    goldBonus: 0, expBonus: 0, ignoreDefPct: 0, allStats: 0,
  };

  if (!equipment?.affixes?.suffix) return effects;

  const suffix = equipment.affixes.suffix;
  switch (suffix.effect) {
    case 'fire_dmg': effects.fireDmg = suffix.value; break;
    case 'ice_dmg': effects.iceDmg = suffix.value; break;
    case 'poison_dmg': effects.poisonDmg = suffix.value; break;
    case 'holy_dmg': effects.holyDmg = suffix.value; break;
    case 'regen': effects.regen = suffix.value; break;
    case 'lifesteal': effects.lifestealPct = suffix.value; break;
    case 'thorns': effects.thornsDmg = suffix.value; break;
    case 'gold_bonus': effects.goldBonus = suffix.value; break;
    case 'exp_bonus': effects.expBonus = suffix.value; break;
    case 'ignore_def': effects.ignoreDefPct = suffix.value; break;
    case 'all_stats': effects.allStats = suffix.value; break;
  }

  return effects;
}

// ── 合并所有装备的词缀效果 ──
export function getAllAffixEffects(player) {
  const combined = {
    fireDmg: 0, iceDmg: 0, poisonDmg: 0, holyDmg: 0,
    regen: 0, lifestealPct: 0, thornsDmg: 0,
    goldBonus: 0, expBonus: 0, ignoreDefPct: 0, allStats: 0,
  };

  const slots = ['weapon', 'armor', 'accessory'];
  for (const slot of slots) {
    const eq = player[slot];
    if (!eq) continue;
    const fx = getAffixCombatEffects(eq);
    for (const key in combined) {
      combined[key] += fx[key] || 0;
    }
  }

  return combined;
}

// ── 品质颜色工具 ──
export function getQualityColor(quality) {
  return QUALITY_CONFIG[quality]?.color || '#cccccc';
}

export function getQualityName(quality) {
  return QUALITY_CONFIG[quality]?.name || '普通';
}

// ── 装备描述生成 ──
export function formatEquipmentTooltip(equipment) {
  if (!equipment) return '';
  const q = QUALITY_CONFIG[equipment.quality] || QUALITY_CONFIG[QUALITY.COMMON];
  const lines = [];
  
  lines.push(`<span style="color:${q.color};font-weight:bold;">[${q.name}] ${equipment.displayName || equipment.name}</span>`);
  
  if (equipment.atk) lines.push(`ATK +${equipment.atk}`);
  if (equipment.def) lines.push(`DEF +${equipment.def}`);
  if (equipment.maxHp) lines.push(`MaxHP +${equipment.maxHp}`);
  if (equipment.spd) lines.push(`SPD +${equipment.spd}`);
  if (equipment.crt) lines.push(`CRT +${equipment.crt}%`);
  
  if (equipment.affixes?.prefix) {
    lines.push(`<span style="color:#44cc44;">前缀: ${equipment.affixes.prefix.name} (${equipment.affixes.prefix.stat}+${equipment.affixes.prefix.value})</span>`);
  }
  if (equipment.affixes?.suffix) {
    lines.push(`<span style="color:#4488ff;">后缀: ${equipment.affixes.suffix.name} — ${equipment.affixes.suffix.desc}</span>`);
  }
  
  return lines.join('<br>');
}
