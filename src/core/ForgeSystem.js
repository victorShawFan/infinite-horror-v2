// ═══════════════════════════════════════════════════════════════
// 装备锻造与融合系统 — 主神空间的深度装备玩法
// ═══════════════════════════════════════════════════════════════
//
// 功能:
//   1. 装备融合: 两件同类型装备 → 一件更高品质装备
//   2. 材料分解: 装备 → 锻造材料(灵魂碎片)
//   3. 锻造配方: 用材料创造特定装备
//   4. 装备重铸: 重新随机词缀，保留强化等级
//
// 品质等级: 粗糙(白) → 精良(绿) → 稀有(蓝) → 史诗(紫) → 传说(橙)
// ═══════════════════════════════════════════════════════════════

import { eventBus } from './EventBus.js';
import { gameState } from './GameState.js';
import { generateAffixes, applyQualityToEquipment } from './EquipmentAffixes.js';

// ── 品质定义 ──
export const QUALITY = {
  COMMON:    { id: 'common',    name: '粗糙', color: '#999999', tier: 0, statMult: 1.0  },
  FINE:      { id: 'fine',      name: '精良', color: '#44cc44', tier: 1, statMult: 1.15 },
  RARE:      { id: 'rare',      name: '稀有', color: '#4488ff', tier: 2, statMult: 1.35 },
  EPIC:      { id: 'epic',      name: '史诗', color: '#aa44ff', tier: 3, statMult: 1.60 },
  LEGENDARY: { id: 'legendary', name: '传说', color: '#ff8800', tier: 4, statMult: 2.00 },
};

const QUALITY_LIST = [QUALITY.COMMON, QUALITY.FINE, QUALITY.RARE, QUALITY.EPIC, QUALITY.LEGENDARY];

function getQualityByTier(tier) {
  return QUALITY_LIST[Math.min(tier, QUALITY_LIST.length - 1)] || QUALITY.COMMON;
}

// ── 分解表：装备品质 → 获得灵魂碎片数量 ──
const DISASSEMBLE_TABLE = {
  common: 5,  fine: 12,  rare: 25,  epic: 50,  legendary: 100,
};

// ── 锻造配方 ──
export const FORGE_RECIPES = [
  {
    id: 'weapon_lord_blade',
    name: '主神之刃',
    type: 'weapon',
    category: 'weapon',
    cost: 200,
    requiredChapter: 4,
    baseStats: { atk: 20, crt: 5 },
    quality: 'rare',
    setId: 'weapon_lord_blade',
    description: '由主神空间的能量凝聚而成的利刃。',
    maxGemSlots: 2,
  },
  {
    id: 'armor_lord_guard',
    name: '主神护甲',
    type: 'armor',
    category: 'armor',
    cost: 200,
    requiredChapter: 4,
    baseStats: { def: 18, maxHp: 40 },
    quality: 'rare',
    setId: 'armor_lord_guard',
    description: '提供全方位防护的主神级护甲。',
    maxGemSlots: 2,
  },
  {
    id: 'acc_lord_ring',
    name: '主神之戒',
    type: 'accessory',
    category: 'accessory',
    cost: 180,
    requiredChapter: 5,
    baseStats: { spd: 6, crt: 8 },
    quality: 'rare',
    setId: 'acc_lord_ring',
    description: '传闻可以微弱感知主神意志的戒指。',
    maxGemSlots: 1,
  },
  {
    id: 'weapon_gene_fist',
    name: '基因战拳',
    type: 'weapon',
    category: 'weapon',
    cost: 350,
    requiredChapter: 7,
    baseStats: { atk: 30, spd: 4 },
    quality: 'epic',
    setId: 'weapon_gene_fist',
    description: '融入基因锁力量的拳套，攻速极快。',
    maxGemSlots: 2,
  },
  {
    id: 'armor_gene_suit',
    name: '基因战衣',
    type: 'armor',
    category: 'armor',
    cost: 350,
    requiredChapter: 7,
    baseStats: { def: 25, maxHp: 80 },
    quality: 'epic',
    setId: 'armor_gene_suit',
    description: '基因锁激活后自动调整防御姿态的战衣。',
    maxGemSlots: 2,
  },
  {
    id: 'weapon_honghuang',
    name: '洪荒之力',
    type: 'weapon',
    category: 'weapon',
    cost: 600,
    requiredChapter: 11,
    baseStats: { atk: 45, crt: 12 },
    quality: 'legendary',
    setId: null,
    description: '第四阶基因锁完全觉醒后凝聚的终极力量。',
    maxGemSlots: 3,
  },
  {
    id: 'armor_soullight',
    name: '心灵之光铠',
    type: 'armor',
    category: 'armor',
    cost: 500,
    requiredChapter: 10,
    baseStats: { def: 35, res: 20, maxHp: 100 },
    quality: 'legendary',
    setId: null,
    description: '赵樱空的心灵之光化为实体的防护铠甲。',
    maxGemSlots: 3,
  },
  {
    id: 'acc_chess_piece',
    name: '楚轩的棋子',
    type: 'accessory',
    category: 'accessory',
    cost: 300,
    requiredChapter: 8,
    baseStats: { spd: 8, crt: 10, res: 8 },
    quality: 'epic',
    setId: null,
    description: '楚轩的计划总是走在所有人前面。持有者获得战术优势。',
    maxGemSlots: 2,
  },
  {
    id: 'weapon_zero_sniper',
    name: '零点的狙击',
    type: 'weapon',
    category: 'weapon',
    cost: 280,
    requiredChapter: 6,
    baseStats: { atk: 22, crt: 15, spd: -2 },
    quality: 'rare',
    setId: null,
    description: '精准到可怕的程度。暴击率极高但出手略慢。',
    maxGemSlots: 1,
  },
];

// ── 融合规则 ──
// 同类型装备(weapon+weapon, armor+armor, accessory+accessory)
// 融合后品质提升一级，属性取两者较高值并增加10%
export function fuseEquipment(eq1, eq2, player) {
  if (!eq1 || !eq2) return { success: false, reason: '需要两件装备' };
  
  // 检查是否同类型
  const type1 = eq1.type || eq1.category || 'unknown';
  const type2 = eq2.type || eq2.category || 'unknown';
  if (type1 !== type2) return { success: false, reason: '只能融合相同类型的装备' };
  
  // 费用
  const cost = 100 + (getQualityTier(eq1) + getQualityTier(eq2)) * 50;
  if ((player.gold || 0) < cost) return { success: false, reason: `金币不足 (需要 ${cost}G)` };
  
  player.gold -= cost;
  
  // 计算新品质
  const maxTier = Math.max(getQualityTier(eq1), getQualityTier(eq2));
  const newTier = Math.min(maxTier + 1, 4);
  const newQuality = getQualityByTier(newTier);
  
  // 合并属性：取较高值并增加10%
  const stats = {};
  for (const key of ['atk', 'def', 'spd', 'crt', 'maxHp', 'res']) {
    const v1 = eq1[key] || 0;
    const v2 = eq2[key] || 0;
    const maxVal = Math.max(v1, v2);
    if (maxVal > 0) {
      stats[key] = Math.ceil(maxVal * 1.1);
    }
  }
  
  // 创建融合装备
  const fused = {
    id: `fused_${type1}_${Date.now()}`,
    name: `${newQuality.name}·${eq1.name.replace(/^(粗糙|精良|稀有|史诗|传说)·/, '')}`,
    type: type1,
    category: type1,
    quality: newQuality.id,
    qualityColor: newQuality.color,
    ...stats,
    enhanceLevel: 0,
    enhanceBonuses: {},
    gemSlots: [],
    maxGemSlots: Math.min((eq1.maxGemSlots || 1) + 1, 3),
    description: `由 ${eq1.name} 与 ${eq2.name} 融合而成`,
    fused: true,
  };
  
  // 尝试继承词缀
  try {
    try { fused.affixes = generateAffixes("rare", 1); } catch(e) {};
  } catch {}
  
  eventBus.emit('forge:fused', { result: fused, materials: [eq1, eq2], cost });
  return { success: true, result: fused, cost };
}

function getQualityTier(eq) {
  if (!eq) return 0;
  const q = eq.quality || 'common';
  const tiers = { common: 0, fine: 1, rare: 2, epic: 3, legendary: 4 };
  return tiers[q] ?? 0;
}

// ── 分解装备 ──
export function disassembleEquipment(equipment, player) {
  if (!equipment) return { success: false, reason: '无装备' };
  
  const quality = equipment.quality || 'common';
  const baseFragments = DISASSEMBLE_TABLE[quality] || 5;
  const enhanceBonus = (equipment.enhanceLevel || 0) * 3;
  const gemBonus = (equipment.gemSlots || []).length * 5;
  const total = baseFragments + enhanceBonus + gemBonus;
  
  if (!player.soulFragments) player.soulFragments = 0;
  player.soulFragments += total;
  
  // 返还镶嵌的宝石
  const returnedGems = [...(equipment.gemSlots || [])];
  
  eventBus.emit('forge:disassembled', { equipment, fragments: total, gems: returnedGems });
  return { success: true, fragments: total, returnedGems, equipmentName: equipment.name };
}

// ── 锻造配方制作 ──
export function forgeRecipe(recipeId, player) {
  const recipe = FORGE_RECIPES.find(r => r.id === recipeId);
  if (!recipe) return { success: false, reason: '未知配方' };
  
  if ((player.chapter || 1) < recipe.requiredChapter) {
    return { success: false, reason: `需要通关第${recipe.requiredChapter}章才能解锁` };
  }
  
  if (!player.soulFragments) player.soulFragments = 0;
  if (player.soulFragments < recipe.cost) {
    return { success: false, reason: `灵魂碎片不足 (${player.soulFragments}/${recipe.cost})` };
  }
  
  player.soulFragments -= recipe.cost;
  
  const qualityDef = QUALITY_LIST.find(q => q.id === recipe.quality) || QUALITY.COMMON;
  
  const equipment = {
    id: recipe.id,
    name: recipe.name,
    type: recipe.type,
    category: recipe.category,
    quality: recipe.quality,
    qualityColor: qualityDef.color,
    ...recipe.baseStats,
    enhanceLevel: 0,
    enhanceBonuses: {},
    gemSlots: [],
    maxGemSlots: recipe.maxGemSlots || 2,
    setId: recipe.setId || undefined,
    description: recipe.description,
    forged: true,
  };
  
  // 根据品质随机附加词缀
  try {
    try { equipment.affixes = generateAffixes(qualityDef.id, 1); } catch(e) {};
  } catch {}
  
  eventBus.emit('forge:crafted', { recipe, equipment });
  return { success: true, equipment, recipe };
}

// ── 重铸词缀 ──
export function reforgeAffixes(equipment, player) {
  if (!equipment) return { success: false, reason: '无装备' };
  
  const cost = 50 + getQualityTier(equipment) * 30;
  if (!player.soulFragments) player.soulFragments = 0;
  if (player.soulFragments < cost) {
    return { success: false, reason: `灵魂碎片不足 (${player.soulFragments}/${cost})` };
  }
  
  player.soulFragments -= cost;
  
  // 保留强化等级和宝石，重新随机词缀
  const oldAffixes = equipment.affixes ? [...equipment.affixes] : [];
  try {
    try { equipment.affixes = generateAffixes(equipment.quality, 1); } catch(e) {};
  } catch {}
  
  eventBus.emit('forge:reforged', { equipment, oldAffixes, newAffixes: equipment.affixes || [] });
  return { success: true, equipment, cost };
}

// ── 获取可用配方列表 ──
export function getAvailableRecipes(chapter) {
  return FORGE_RECIPES.filter(r => chapter >= r.requiredChapter);
}

// ── 获取融合费用预览 ──
export function getFusionCost(eq1, eq2) {
  return 100 + (getQualityTier(eq1) + getQualityTier(eq2)) * 50;
}

// ── 获取分解预览 ──
export function getDisassemblePreview(equipment) {
  const quality = equipment?.quality || 'common';
  const baseFragments = DISASSEMBLE_TABLE[quality] || 5;
  const enhanceBonus = (equipment?.enhanceLevel || 0) * 3;
  const gemBonus = (equipment?.gemSlots || []).length * 5;
  return {
    fragments: baseFragments + enhanceBonus + gemBonus,
    returnedGems: (equipment?.gemSlots || []).length,
  };
}
