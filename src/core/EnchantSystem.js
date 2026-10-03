// ═══════════════════════════════════════════════════════════════
// 装备附魔系统 — 为武器和护甲注入元素力量
// ═══════════════════════════════════════════════════════════════
//
// 功能：
//   1. 元素附魔：给武器添加元素属性（火/冰/毒/念/暗/圣/灵）
//   2. 防御附魔：给护甲添加元素抗性
//   3. 饰品附魔：给饰品添加特殊效果（吸血/破甲/急速等）
//   4. 附魔有概率失败（低等级可能损坏装备）
//   5. 附魔消耗灵魂碎片（Soul Shards）+ 元素核心
//
// 每件装备最多1个附魔，可覆盖

import { eventBus } from './EventBus.js';
import { gameState } from './GameState.js';
import { DAMAGE_TYPE } from './constants.js';
import { ELEMENT_INFO } from './ElementalSystem.js';

// ── 元素核心定义（附魔材料）──
export const ENCHANT_CORES = {
  fire_core:    { id: 'fire_core',    name: '火元素核心',  element: DAMAGE_TYPE.FIRE,    color: '#ff4444', icon: '🔥', dropChapter: [1, 7] },
  ice_core:     { id: 'ice_core',     name: '冰元素核心',  element: DAMAGE_TYPE.ICE,     color: '#44ccff', icon: '❄',  dropChapter: [2, 6] },
  poison_core:  { id: 'poison_core',  name: '毒元素核心',  element: DAMAGE_TYPE.POISON,  color: '#44ff44', icon: '☠',  dropChapter: [2, 9] },
  psychic_core: { id: 'psychic_core', name: '念力核心',    element: DAMAGE_TYPE.PSYCHIC, color: '#cc44ff', icon: '🧠', dropChapter: [3, 11] },
  dark_core:    { id: 'dark_core',    name: '暗影核心',    element: DAMAGE_TYPE.DARK,    color: '#884488', icon: '🌑', dropChapter: [5, 10] },
  holy_core:    { id: 'holy_core',    name: '圣光核心',    element: DAMAGE_TYPE.HOLY,    color: '#ffff44', icon: '✦',  dropChapter: [4, 8] },
  spirit_core:  { id: 'spirit_core',  name: '灵魂核心',    element: DAMAGE_TYPE.SPIRIT,  color: '#88ffcc', icon: '👻', dropChapter: [3, 12] },
};

// ── 附魔效果定义 ──
export const ENCHANT_EFFECTS = {
  // 武器附魔
  weapon: {
    fire_strike:    { name: '烈焰打击',  element: DAMAGE_TYPE.FIRE,    bonusDmg: 5, dot: 2,  desc: '攻击附加5火焰伤害，30%概率灼烧2回合', icon: '🔥' },
    frost_edge:     { name: '冰霜之刃',  element: DAMAGE_TYPE.ICE,     bonusDmg: 3, slow: 2, desc: '攻击附加3冰霜伤害，25%概率减速2回合', icon: '❄' },
    venom_coat:     { name: '蛇毒涂层',  element: DAMAGE_TYPE.POISON,  bonusDmg: 2, dot: 4,  desc: '攻击附加2毒素伤害，40%概率中毒4回合', icon: '☠' },
    mind_pierce:    { name: '念力穿透',  element: DAMAGE_TYPE.PSYCHIC, bonusDmg: 4, penPct: 15, desc: '攻击附加4念力伤害，无视15%防御', icon: '🧠' },
    shadow_strike:  { name: '暗影打击',  element: DAMAGE_TYPE.DARK,    bonusDmg: 4, critBonus: 8, desc: '攻击附加4暗影伤害，暴击+8%', icon: '🌑' },
    holy_smite:     { name: '圣光制裁',  element: DAMAGE_TYPE.HOLY,    bonusDmg: 6, healPct: 5, desc: '攻击附加6圣光伤害，恢复伤害5%的HP', icon: '✦' },
    spirit_drain:   { name: '灵魂汲取',  element: DAMAGE_TYPE.SPIRIT,  bonusDmg: 3, manaGain: 2, desc: '攻击附加3灵魂伤害，恢复2法力', icon: '👻' },
  },
  // 护甲附魔
  armor: {
    fire_ward:      { name: '火焰护盾',  element: DAMAGE_TYPE.FIRE,    resist: 15, reflect: 3, desc: '火抗+15%，被击时反射3火焰伤害', icon: '🔥' },
    frost_armor:    { name: '冰霜铠甲',  element: DAMAGE_TYPE.ICE,     resist: 15, slowEnemy: 10, desc: '冰抗+15%，被击时10%概率冻结敌人', icon: '❄' },
    venom_shield:   { name: '毒雾结界',  element: DAMAGE_TYPE.POISON,  resist: 15, dot: 2, desc: '毒抗+15%，被击时释放毒雾（2伤害/回合）', icon: '☠' },
    psychic_barrier: { name: '念力屏障', element: DAMAGE_TYPE.PSYCHIC, resist: 20, defBonus: 3, desc: '念抗+20%，DEF+3', icon: '🧠' },
    shadow_cloak:   { name: '暗影斗篷',  element: DAMAGE_TYPE.DARK,    resist: 15, dodgeBonus: 5, desc: '暗抗+15%，闪避+5%', icon: '🌑' },
    holy_aegis:     { name: '圣光庇护',  element: DAMAGE_TYPE.HOLY,    resist: 20, regenBonus: 1, desc: '圣抗+20%，每回合恢复1%HP', icon: '✦' },
    spirit_ward:    { name: '幽灵结界',  element: DAMAGE_TYPE.SPIRIT,  resist: 15, manaRegenBonus: 1, desc: '灵抗+15%，每回合恢复1法力', icon: '👻' },
  },
  // 饰品附魔
  accessory: {
    fury:       { name: '狂怒附魔',  bonusAtk: 5,   critBonus: 5, desc: 'ATK+5, CRT+5%', icon: '🔥', element: DAMAGE_TYPE.FIRE },
    guardian:   { name: '守护附魔',  bonusDef: 5,   hpBonus: 30,  desc: 'DEF+5, HP+30', icon: '🛡', element: DAMAGE_TYPE.HOLY },
    haste:      { name: '急速附魔',  bonusSpd: 4,   dodgeBonus: 5, desc: 'SPD+4, 闪避+5%', icon: '⚡', element: DAMAGE_TYPE.ICE },
    vampiric:   { name: '吸血附魔',  lifeSteal: 8,  desc: '攻击恢复8%伤害值HP', icon: '🩸', element: DAMAGE_TYPE.DARK },
    wisdom:     { name: '智慧附魔',  manaBonus: 15, skillBoost: 10, desc: 'MaxMana+15, 技能伤害+10%', icon: '📘', element: DAMAGE_TYPE.PSYCHIC },
    thorns:     { name: '荆棘附魔',  reflectPct: 12, desc: '反弹12%受到的伤害', icon: '🌿', element: DAMAGE_TYPE.POISON },
  },
};

// ── 附魔成功率 ──
const BASE_SUCCESS_RATE = 0.85; // 85%基础成功率
const QUALITY_BONUS = { common: 0, fine: 0.05, rare: 0.05, epic: 0.03, legendary: 0 };

/**
 * 计算附魔成功率
 */
export function getEnchantSuccessRate(equipment) {
  let rate = BASE_SUCCESS_RATE;
  // 已有附魔时覆盖率降低
  if (equipment.enchant) rate -= 0.10;
  // 品质加成
  const quality = equipment.quality || equipment.rarity || 'common';
  rate += QUALITY_BONUS[quality] || 0;
  return Math.min(0.95, Math.max(0.50, rate));
}

/**
 * 获取装备槽对应的可用附魔列表
 */
export function getAvailableEnchants(equipment) {
  const slot = equipment.slot;
  if (!slot || !ENCHANT_EFFECTS[slot]) return [];
  
  return Object.entries(ENCHANT_EFFECTS[slot]).map(([id, ench]) => ({
    id, ...ench,
    coreCost: getCoreForElement(ench.element),
    shardCost: getShardCost(equipment),
  }));
}

function getCoreForElement(element) {
  for (const [id, core] of Object.entries(ENCHANT_CORES)) {
    if (core.element === element) return id;
  }
  return null;
}

function getShardCost(equipment) {
  const qualityCosts = { common: 20, fine: 30, rare: 50, epic: 80, legendary: 120 };
  return qualityCosts[equipment.quality || equipment.rarity || 'common'] || 30;
}

/**
 * 执行附魔
 * @param {Object} equipment - 要附魔的装备
 * @param {string} enchantId - 附魔效果ID
 * @returns {{ success: boolean, message: string, equipment?: Object }}
 */
export function applyEnchant(equipment, enchantId) {
  const slot = equipment.slot;
  const enchantDef = ENCHANT_EFFECTS[slot]?.[enchantId];
  if (!enchantDef) return { success: false, message: '无效的附魔' };
  
  // 检查材料
  const coreId = getCoreForElement(enchantDef.element);
  const shardCost = getShardCost(equipment);
  const cores = gameState.enchantCores || {};
  const shards = gameState.soulShards || 0;
  
  if (coreId && (cores[coreId] || 0) < 1) {
    const coreName = ENCHANT_CORES[coreId]?.name || '核心';
    return { success: false, message: `需要 1× ${coreName}` };
  }
  if (shards < shardCost) {
    return { success: false, message: `需要 ${shardCost} 灵魂碎片（当前: ${shards}）` };
  }
  
  // 消耗材料
  if (coreId) cores[coreId] = (cores[coreId] || 0) - 1;
  gameState.enchantCores = cores;
  gameState.soulShards = shards - shardCost;
  
  // 判定成功率
  const rate = getEnchantSuccessRate(equipment);
  const roll = Math.random();
  
  if (roll > rate) {
    // 失败 — 不损坏装备，但材料消耗
    eventBus.emit('enchant:failed', { equipment, enchantId });
    return { success: false, message: `附魔失败！（成功率 ${Math.round(rate * 100)}%）材料已消耗` };
  }
  
  // 成功 — 应用附魔
  equipment.enchant = {
    id: enchantId,
    name: enchantDef.name,
    icon: enchantDef.icon,
    element: enchantDef.element,
    effects: { ...enchantDef },
  };
  
  // 更新装备显示名
  if (!equipment._originalName) equipment._originalName = equipment.name;
  equipment.name = `${enchantDef.icon}${equipment._originalName}`;
  
  eventBus.emit('enchant:success', { equipment, enchant: enchantDef });
  return { success: true, message: `✨ 附魔成功！${enchantDef.name}`, equipment };
}

/**
 * 移除附魔（返还部分碎片）
 */
export function removeEnchant(equipment) {
  if (!equipment.enchant) return { success: false, message: '该装备没有附魔' };
  
  const refund = Math.floor(getShardCost(equipment) * 0.3);
  gameState.soulShards = (gameState.soulShards || 0) + refund;
  
  if (equipment._originalName) equipment.name = equipment._originalName;
  delete equipment.enchant;
  delete equipment._originalName;
  
  return { success: true, message: `附魔已移除。返还 ${refund} 灵魂碎片` };
}

/**
 * 获取附魔提供的战斗加成
 */
export function getEnchantCombatBonus(player) {
  const bonus = {
    bonusDmg: 0,
    bonusDef: 0,
    bonusAtk: 0,
    bonusSpd: 0,
    bonusCrt: 0,
    bonusHp: 0,
    bonusMana: 0,
    lifeStealPct: 0,
    reflectPct: 0,
    dotDmg: 0,
    dotChance: 0,
    manaGain: 0,
    healPct: 0,
    armorPenPct: 0,
    dodgeBonus: 0,
    resistances: {},
    regenBonus: 0,
    manaRegenBonus: 0,
    skillBoost: 0,
  };
  
  const slots = ['weapon', 'armor', 'accessory'];
  for (const slot of slots) {
    const equip = player[slot];
    if (!equip?.enchant?.effects) continue;
    const eff = equip.enchant.effects;
    
    if (eff.bonusDmg) bonus.bonusDmg += eff.bonusDmg;
    if (eff.bonusDef) bonus.bonusDef += eff.bonusDef;
    if (eff.bonusAtk) bonus.bonusAtk += eff.bonusAtk;
    if (eff.bonusSpd) bonus.bonusSpd += eff.bonusSpd;
    if (eff.critBonus) bonus.bonusCrt += eff.critBonus;
    if (eff.hpBonus) bonus.bonusHp += eff.hpBonus;
    if (eff.manaBonus) bonus.bonusMana += eff.manaBonus;
    if (eff.lifeSteal) bonus.lifeStealPct += eff.lifeSteal;
    if (eff.reflectPct) bonus.reflectPct += eff.reflectPct;
    if (eff.reflect) bonus.reflectPct += eff.reflect; // armor reflect flat
    if (eff.dot) { bonus.dotDmg += eff.dot; bonus.dotChance += 0.30; }
    if (eff.manaGain) bonus.manaGain += eff.manaGain;
    if (eff.healPct) bonus.healPct += eff.healPct;
    if (eff.penPct) bonus.armorPenPct += eff.penPct;
    if (eff.dodgeBonus) bonus.dodgeBonus += eff.dodgeBonus;
    if (eff.resist) {
      const elem = eff.element || 'physical';
      bonus.resistances[elem] = (bonus.resistances[elem] || 0) + eff.resist;
    }
    if (eff.regenBonus) bonus.regenBonus += eff.regenBonus;
    if (eff.manaRegenBonus) bonus.manaRegenBonus += eff.manaRegenBonus;
    if (eff.skillBoost) bonus.skillBoost += eff.skillBoost;
  }
  
  return bonus;
}

/**
 * 生成附魔面板HTML
 */
export function renderEnchantPanel(equipment) {
  if (!equipment) return '<p style="color:#666;text-align:center;">选择一件装备进行附魔</p>';
  
  const enchants = getAvailableEnchants(equipment);
  const currentEnchant = equipment.enchant;
  const successRate = Math.round(getEnchantSuccessRate(equipment) * 100);
  const shards = gameState.soulShards || 0;
  const cores = gameState.enchantCores || {};
  
  let html = '<div style="max-width:400px;margin:0 auto;">';
  
  // 当前装备信息
  html += `<div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:10px;margin-bottom:12px;text-align:center;">`;
  html += `<p style="color:#ddd;font-size:13px;font-weight:bold;">${equipment.name}</p>`;
  html += `<p style="color:#888;font-size:10px;">${equipment.slot === 'weapon' ? '武器' : equipment.slot === 'armor' ? '护甲' : '饰品'}</p>`;
  if (currentEnchant) {
    html += `<p style="color:#ffcc44;font-size:11px;margin-top:4px;">${currentEnchant.icon} 当前附魔: ${currentEnchant.name}</p>`;
  }
  html += `<p style="color:#666;font-size:9px;margin-top:2px;">成功率: ${successRate}% · 灵魂碎片: ${shards}</p>`;
  html += `</div>`;
  
  // 可用附魔列表
  for (const ench of enchants) {
    const hasCores = !ench.coreCost || (cores[ench.coreCost] || 0) >= 1;
    const hasShards = shards >= ench.shardCost;
    const canEnchant = hasCores && hasShards;
    const coreName = ench.coreCost ? (ENCHANT_CORES[ench.coreCost]?.name || '核心') : '';
    const coreCount = ench.coreCost ? (cores[ench.coreCost] || 0) : 0;
    
    html += `<div style="
      display:flex;align-items:center;gap:8px;
      padding:8px 10px;margin-bottom:4px;
      background:rgba(255,255,255,${canEnchant ? '0.04' : '0.01'});
      border:1px solid ${canEnchant ? '#333' : '#1a1a1a'};border-radius:8px;
      opacity:${canEnchant ? '1' : '0.5'};
    ">`;
    
    // Icon
    const elemInfo = ELEMENT_INFO[ench.element] || { color: '#888' };
    html += `<span style="font-size:20px;">${ench.icon}</span>`;
    
    // Info
    html += `<div style="flex:1;">`;
    html += `<p style="color:${elemInfo.color};font-size:12px;font-weight:bold;">${ench.name}</p>`;
    html += `<p style="color:#888;font-size:10px;">${ench.desc}</p>`;
    html += `<p style="color:#555;font-size:9px;">`;
    if (ench.coreCost) html += `${coreName} ×1 (${coreCount}) · `;
    html += `碎片 ×${ench.shardCost}</p>`;
    html += `</div>`;
    
    // Button
    html += `<button data-enchant-id="${ench.id}" ${!canEnchant ? 'disabled' : ''} style="
      padding:6px 12px;border-radius:6px;font-size:11px;
      border:1px solid ${canEnchant ? elemInfo.color : '#333'};
      background:${canEnchant ? 'rgba(255,255,255,0.06)' : 'transparent'};
      color:${canEnchant ? elemInfo.color : '#444'};
      cursor:${canEnchant ? 'pointer' : 'default'};font-family:inherit;
    ">附魔</button>`;
    
    html += `</div>`;
  }
  
  // 移除附魔
  if (currentEnchant) {
    html += `<div style="text-align:center;margin-top:10px;">`;
    html += `<button data-remove-enchant="true" style="
      padding:4px 16px;border-radius:4px;font-size:10px;
      border:1px solid #444;background:transparent;color:#888;
      cursor:pointer;font-family:inherit;
    ">移除附魔 (返还30%碎片)</button>`;
    html += `</div>`;
  }
  
  html += '</div>';
  return html;
}

// ── 序列化 ──
export function serializeEnchant() {
  return {
    enchantCores: gameState.enchantCores || {},
    soulShards: gameState.soulShards || 0,
  };
}

export function deserializeEnchant(data) {
  if (data) {
    gameState.enchantCores = data.enchantCores || {};
    gameState.soulShards = data.soulShards || 0;
  }
}
