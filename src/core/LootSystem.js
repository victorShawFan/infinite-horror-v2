// ═══════════════════════════════════════════════════════════════
// 战利品系统 — 敌人掉落 + 稀有度 + 随机词缀装备
// ═══════════════════════════════════════════════════════════════
//
// 掉落等级：普通(白) → 精良(蓝) → 史诗(紫) → 传说(橙)
// 每次击杀按概率掉落：消耗品、宝石、装备
// 装备可带随机词缀

import { DAMAGE_TYPE } from './constants.js';
import { GEM_TYPES } from './EquipmentSystem.js';
import { eventBus } from './EventBus.js';
import { rollQuality, applyQualityToEquipment, QUALITY_CONFIG } from './EquipmentAffixes.js';

// ── 稀有度 ──
export const RARITY = {
  COMMON:    { id: 'common',    name: '普通', color: '#aaaaaa', statMult: 1.0, affixCount: 0 },
  UNCOMMON:  { id: 'uncommon',  name: '精良', color: '#4488ff', statMult: 1.2, affixCount: 1 },
  EPIC:      { id: 'epic',      name: '史诗', color: '#aa44ff', statMult: 1.5, affixCount: 2 },
  LEGENDARY: { id: 'legendary', name: '传说', color: '#ffaa00', statMult: 2.0, affixCount: 3 },
};

// ── 掉落率表（基于章节） ──
export const DROP_RATES = {
  // [章节范围]: { 消耗品, 宝石, 装备 }
  early:  { consumable: 0.30, gem: 0.05, equipment: 0.03 },  // Ch1-4
  mid:    { consumable: 0.25, gem: 0.10, equipment: 0.06 },  // Ch5-8
  late:   { consumable: 0.20, gem: 0.15, equipment: 0.10 },  // Ch9-12
  boss:   { consumable: 0.50, gem: 0.60, equipment: 0.30 },  // Boss 固定高掉率
};

// ── 稀有度概率 ──
const RARITY_WEIGHTS = {
  early: [['common', 0.70], ['uncommon', 0.25], ['epic', 0.05], ['legendary', 0]],
  mid:   [['common', 0.50], ['uncommon', 0.35], ['epic', 0.12], ['legendary', 0.03]],
  late:  [['common', 0.30], ['uncommon', 0.40], ['epic', 0.22], ['legendary', 0.08]],
  boss:  [['common', 0.10], ['uncommon', 0.30], ['epic', 0.40], ['legendary', 0.20]],
};

// ── 消耗品模板 ──
const CONSUMABLE_TEMPLATES = [
  { name: '小型修复包', effect: { healPercent: 0.20 }, desc: '恢复20% MaxHP' },
  { name: '中型修复包', effect: { healPercent: 0.40 }, desc: '恢复40% MaxHP' },
  { name: '大型修复包', effect: { healPercent: 0.60 }, desc: '恢复60% MaxHP' },
  { name: '战斗兴奋剂', effect: { tempAtk: 10, duration: 3 }, desc: '3回合ATK+10' },
  { name: '防护屏障', effect: { tempDef: 10, duration: 3 }, desc: '3回合DEF+10' },
  { name: '精力饮料', effect: { tempSpd: 8, duration: 3 }, desc: '3回合SPD+8' },
  { name: '法力结晶', effect: { manaRestore: 30 }, desc: '恢复30法力' },
  { name: '抗毒血清', effect: { cleanse: 'poison' }, desc: '清除中毒状态' },
  { name: '解冻剂', effect: { cleanse: 'freeze' }, desc: '清除冻结状态' },
];

// ── 装备基础模板 ──
const WEAPON_TEMPLATES = [
  { name: '战术匕首', baseAtk: 6, slot: 'weapon', damageType: DAMAGE_TYPE.PHYSICAL },
  { name: '军用手枪', baseAtk: 8, slot: 'weapon', damageType: DAMAGE_TYPE.PHYSICAL },
  { name: '霰弹枪', baseAtk: 10, slot: 'weapon', damageType: DAMAGE_TYPE.PHYSICAL },
  { name: '激光刃', baseAtk: 9, slot: 'weapon', damageType: DAMAGE_TYPE.FIRE },
  { name: '冰晶杖', baseAtk: 7, slot: 'weapon', damageType: DAMAGE_TYPE.ICE },
  { name: '念力球', baseAtk: 8, slot: 'weapon', damageType: DAMAGE_TYPE.PSYCHIC },
  { name: '暗影短剑', baseAtk: 9, slot: 'weapon', damageType: DAMAGE_TYPE.DARK },
  { name: '圣光锤', baseAtk: 11, slot: 'weapon', damageType: DAMAGE_TYPE.HOLY },
  { name: '灵魂镰刀', baseAtk: 10, slot: 'weapon', damageType: DAMAGE_TYPE.SPIRIT },
];

const ARMOR_TEMPLATES = [
  { name: '皮甲', baseDef: 4, slot: 'armor' },
  { name: '战术背心', baseDef: 6, slot: 'armor' },
  { name: '合金护甲', baseDef: 8, slot: 'armor' },
  { name: '能量护盾', baseDef: 7, slot: 'armor', baseSpd: 2 },
  { name: '暗影斗篷', baseDef: 5, slot: 'armor', baseSpd: 4 },
];

const ACCESSORY_TEMPLATES = [
  { name: '精准透镜', baseCrt: 6, slot: 'accessory' },
  { name: '速度护符', baseSpd: 4, slot: 'accessory' },
  { name: '生命戒指', baseMaxHp: 30, slot: 'accessory' },
  { name: '法力坠饰', baseMaxMana: 20, slot: 'accessory' },
  { name: '抗性披肩', baseRes: 8, slot: 'accessory' },
];

// ── 随机词缀 ──
const EQUIPMENT_AFFIXES = [
  { name: '锋利的', stat: 'atk', value: [2, 5] },
  { name: '坚固的', stat: 'def', value: [2, 4] },
  { name: '迅捷的', stat: 'spd', value: [1, 3] },
  { name: '致命的', stat: 'crt', value: [3, 8] },
  { name: '强韧的', stat: 'maxHp', value: [15, 40] },
  { name: '智慧的', stat: 'maxMana', value: [10, 25] },
  { name: '抗性的', stat: 'res', value: [3, 8] },
  { name: '吸血的', stat: 'lifeSteal', value: [3, 8] },   // 百分比
  { name: '破甲的', stat: 'armorPen', value: [5, 12] },   // 百分比
];

// ── 辅助函数 ──
function getChapterTier(chapter) {
  if (chapter <= 4) return 'early';
  if (chapter <= 8) return 'mid';
  return 'late';
}

function rollRarity(tier) {
  const weights = RARITY_WEIGHTS[tier];
  const roll = Math.random();
  let cumulative = 0;
  for (const [rarityKey, weight] of weights) {
    cumulative += weight;
    if (roll < cumulative) return RARITY[rarityKey.toUpperCase()];
  }
  return RARITY.COMMON;
}

function randomRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── 生成随机词缀 ──
function generateAffixes(count) {
  const pool = [...EQUIPMENT_AFFIXES];
  const result = [];
  for (let i = 0; i < Math.min(count, pool.length); i++) {
    const idx = Math.floor(Math.random() * pool.length);
    const affix = pool.splice(idx, 1)[0];
    const value = randomRange(affix.value[0], affix.value[1]);
    result.push({ ...affix, value });
  }
  return result;
}

// ── 生成随机装备 ──
function generateEquipment(chapter, rarity) {
  const tier = getChapterTier(chapter);
  const chapterMult = 1 + (chapter - 1) * 0.12; // 章节等级加成
  const statMult = rarity.statMult * chapterMult;
  
  // 随机选择装备类型
  const typeRoll = Math.random();
  let template, slot;
  if (typeRoll < 0.45) {
    template = randomPick(WEAPON_TEMPLATES);
    slot = 'weapon';
  } else if (typeRoll < 0.80) {
    template = randomPick(ARMOR_TEMPLATES);
    slot = 'armor';
  } else {
    template = randomPick(ACCESSORY_TEMPLATES);
    slot = 'accessory';
  }
  
  // 生成词缀
  const affixes = generateAffixes(rarity.affixCount);
  const affixPrefix = affixes.length > 0 ? affixes[0].name : '';
  
  // 构建装备
  const equipment = {
    name: `${affixPrefix}${template.name}`,
    rarity: rarity.id,
    rarityColor: rarity.color,
    slot,
    enhanceLevel: 0,
    enhanceBonuses: {},
    gemSlots: [],
    maxGemSlots: rarity.id === 'legendary' ? 3 : rarity.id === 'epic' ? 2 : 1,
    affixes: [],
    chapter,
  };
  
  // 基础属性
  if (template.baseAtk) equipment.atk = Math.floor(template.baseAtk * statMult);
  if (template.baseDef) equipment.def = Math.floor(template.baseDef * statMult);
  if (template.baseSpd) equipment.spd = Math.floor(template.baseSpd * statMult);
  if (template.baseCrt) equipment.crt = Math.floor(template.baseCrt * statMult);
  if (template.baseMaxHp) equipment.maxHp = Math.floor(template.baseMaxHp * statMult);
  if (template.baseMaxMana) equipment.maxMana = Math.floor(template.baseMaxMana * statMult);
  if (template.baseRes) equipment.res = Math.floor(template.baseRes * statMult);
  if (template.damageType) equipment.damageType = template.damageType;
  
  // 应用词缀
  for (const affix of affixes) {
    equipment.affixes.push({ name: affix.name, stat: affix.stat, value: affix.value });
    if (['atk', 'def', 'spd', 'crt', 'maxHp', 'maxMana', 'res'].includes(affix.stat)) {
      equipment[affix.stat] = (equipment[affix.stat] || 0) + affix.value;
    }
    // 特殊词缀存储
    if (affix.stat === 'lifeSteal') equipment.lifeStealPct = affix.value;
    if (affix.stat === 'armorPen') equipment.armorPenPct = affix.value;
  }
  
  // 应用品质系统（叠加在现有词缀之上）
  const quality = rollQuality(chapter, rarity.id === 'legendary' ? 15 : rarity.id === 'epic' ? 8 : 0);
  equipment.quality = quality;
  const qc = QUALITY_CONFIG[quality];
  if (qc) {
    equipment.qualityName = qc.name;
    equipment.qualityColor = qc.color;
  }
  
  return equipment;
}

// ── 生成战利品 ──
export function generateLoot(enemy, chapter, options = {}) {
  const isBoss = enemy.type === 'boss' || enemy.bossId;
  const tier = isBoss ? 'boss' : getChapterTier(chapter);
  const rates = DROP_RATES[tier];
  const drops = [];
  
  // 消耗品
  if (Math.random() < rates.consumable) {
    const item = randomPick(CONSUMABLE_TEMPLATES);
    drops.push({ type: 'consumable', ...item });
  }
  
  // 宝石
  if (Math.random() < rates.gem) {
    const gemKeys = Object.keys(GEM_TYPES);
    const gemId = randomPick(gemKeys);
    drops.push({ type: 'gem', gemId, ...GEM_TYPES[gemId] });
  }
  
  // 装备
  if (Math.random() < rates.equipment) {
    const rarity = rollRarity(tier);
    const equip = generateEquipment(chapter, rarity);
    drops.push({ type: 'equipment', equipment: equip });
  }
  
  // 遗物效果：保底史诗掉落
  if (options.guaranteeEpic && drops.every(d => d.type !== 'equipment')) {
    const epicEquip = generateEquipment(chapter, RARITY.EPIC);
    drops.push({ type: 'equipment', equipment: epicEquip });
  }

  // Boss 保底：至少掉一个宝石
  if (isBoss && !drops.some(d => d.type === 'gem')) {
    const gemKeys = Object.keys(GEM_TYPES);
    const gemId = randomPick(gemKeys);
    drops.push({ type: 'gem', gemId, ...GEM_TYPES[gemId] });
  }
  
  return drops;
}

// ── 生成掉落日志文本 ──
export function formatLootLog(drops) {
  return drops.map(drop => {
    switch (drop.type) {
      case 'consumable':
        return { text: `📦 获得 ${drop.name}`, type: 'loot' };
      case 'gem':
        return { text: `💎 获得 ${drop.name}`, type: 'loot' };
      case 'equipment': {
        const e = drop.equipment;
        const color = e.rarityColor || '#aaa';
        const stats = [];
        if (e.atk) stats.push(`ATK+${e.atk}`);
        if (e.def) stats.push(`DEF+${e.def}`);
        if (e.spd) stats.push(`SPD+${e.spd}`);
        if (e.crt) stats.push(`CRT+${e.crt}`);
        if (e.maxHp) stats.push(`HP+${e.maxHp}`);
        return { text: `⚔ 获得 [${RARITY[e.rarity?.toUpperCase()]?.name || ''}] ${e.name} (${stats.join(', ')})`, type: 'loot_equipment', color };
      }
      default:
        return { text: `获得物品`, type: 'loot' };
    }
  });
}

// ── 应用掉落物到玩家 ──
export function applyLoot(drops, player, gameState) {
  for (const drop of drops) {
    switch (drop.type) {
      case 'consumable':
        player.inventory = player.inventory || [];
        if (player.inventory.length < (player.maxInventory || 20)) {
          player.inventory.push(drop);
        }
        break;
      case 'gem':
        gameState.gemInventory = gameState.gemInventory || [];
        gameState.gemInventory.push(drop.gemId);
        break;
      case 'equipment':
        player.inventory = player.inventory || [];
        if (player.inventory.length < (player.maxInventory || 20)) {
          player.inventory.push(drop);
        }
        break;
    }
  }
  
  eventBus.emit('loot:received', { drops });
}
