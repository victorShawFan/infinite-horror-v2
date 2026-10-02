// ═══════════════════════════════════════════════════════════════
// 装备强化与锻造系统 — 魔塔式数值深度的装备层
// ═══════════════════════════════════════════════════════════════
//
// 武器/护甲/饰品可强化 +1 ~ +10
// 每级增加基础属性，高等级概率失败（不摧毁）
// 支持宝石镶嵌（每件装备最多 2 槽位）
// 套装效果（同系列装备达到数量触发额外加成）

import { eventBus } from './EventBus.js';

// ── 强化表：每级增幅系数 & 成功率 ──
export const ENHANCE_TABLE = [
  // [level, statMultiplier, successRate, cost]
  [1,  0.10, 1.00,  50],   // +1: 100%
  [2,  0.20, 0.95, 100],   // +2: 95%
  [3,  0.32, 0.90, 180],   // +3: 90%
  [4,  0.45, 0.85, 280],   // +4: 85%
  [5,  0.60, 0.75, 400],   // +5: 75%
  [6,  0.78, 0.65, 550],   // +6: 65%
  [7,  0.98, 0.55, 750],   // +7: 55%
  [8,  1.20, 0.45, 1000],  // +8: 45%
  [9,  1.45, 0.35, 1400],  // +9: 35%
  [10, 1.75, 0.25, 2000],  // +10: 25%
];

// ── 宝石定义 ──
export const GEM_TYPES = {
  ruby:    { id: 'ruby',    name: '红宝石', stat: 'atk', value: 3, desc: 'ATK +3', color: '#ff4444' },
  sapphire:{ id: 'sapphire',name: '蓝宝石', stat: 'def', value: 3, desc: 'DEF +3', color: '#4488ff' },
  emerald: { id: 'emerald', name: '绿宝石', stat: 'maxHp',value:20,desc: 'MaxHP +20',color:'#44ff88' },
  topaz:   { id: 'topaz',   name: '黄宝石', stat: 'spd', value: 2, desc: 'SPD +2', color: '#ffcc44' },
  diamond: { id: 'diamond', name: '钻石',   stat: 'crt', value: 5, desc: 'CRT +5%',color: '#ffffff' },
  amethyst:{ id: 'amethyst',name: '紫水晶', stat: 'res', value: 5, desc: 'RES +5', color: '#aa44ff' },
  obsidian:{ id: 'obsidian',name: '黑曜石', stat: 'atk', value: 5, desc: 'ATK +5 (稀有)',color:'#222222' },
};

// ── 套装定义 ──
export const EQUIPMENT_SETS = {
  umbrella_corp: {
    name: '保护伞遗产',
    pieces: ['umbrella_pistol', 'umbrella_vest', 'umbrella_badge'],
    bonuses: {
      2: { atk: 5, def: 5, desc: '☣ 2件: ATK+5, DEF+5 — 抗毒体质' },
      3: { atk: 10, def: 10, maxHp: 50, desc: '🧬 3件: ATK+10, DEF+10, MaxHP+50 — 生化改造' },
    }
  },
  alien_hunter: {
    name: '异形猎手',
    pieces: ['acid_blade', 'xenomorph_carapace', 'motion_tracker'],
    bonuses: {
      2: { spd: 4, crt: 5, desc: '📡 2件: SPD+4, CRT+5% — 动态追踪' },
      3: { spd: 4, crt: 15, atk: 6, desc: '🎯 3件: SPD+4, CRT+15%, ATK+6 — 猎手直觉' },
    }
  },
  divine_scroll: {
    name: '神鬼真经',
    pieces: ['imhotep_staff', 'anubis_armor', 'scarab_amulet'],
    bonuses: {
      2: { maxHp: 60, def: 6, desc: '🏺 2件: MaxHP+60, DEF+6 — 亡灵祝福' },
      3: { maxHp: 80, def: 10, atk: 6, desc: '📜 3件: MaxHP+80, DEF+10, ATK+6 — 复活真经' },
    }
  },
  lord_god: {
    name: '主神套装',
    pieces: ['lord_blade', 'lord_guard', 'lord_ring'],
    bonuses: {
      2: { atk: 8, crt: 5, desc: '⚡ 2件: ATK+8, CRT+5% — 主神馈赠' },
      3: { atk: 15, def: 15, crt: 10, spd: 5, desc: '👑 3件: ATK+15, DEF+15, CRT+10%, SPD+5 — 主神之力' },
    }
  },
  gene_breaker: {
    name: '基因突破者',
    pieces: ['gene_gauntlet', 'gene_suit', 'gene_core'],
    bonuses: {
      2: { atk: 12, maxHp: 80, desc: '🧬 2件: ATK+12, MaxHP+80 — 基因增幅' },
      3: { atk: 20, maxHp: 120, spd: 4, desc: '⚡ 3件: ATK+20, MaxHP+120, SPD+4 — 超进化' },
    }
  },
  zhongzhou_elite: {
    name: '中洲精锐',
    pieces: ['zhongzhou_sword', 'zhongzhou_plate', 'zhongzhou_ring'],
    bonuses: {
      2: { atk: 6, def: 8, desc: '🤝 2件: ATK+6, DEF+8 — 团队协作' },
      3: { atk: 10, def: 12, maxHp: 40, spd: 3, desc: '👑 3件: ATK+10, DEF+12, HP+40, SPD+3 — 队长意志' },
    }
  },
  demon_slayer: {
    name: '弑魔者',
    pieces: ['holy_blade', 'crusader_armor', 'exorcist_cross'],
    bonuses: {
      2: { atk: 10, desc: '✝ 2件: ATK+10 — 圣光之力' },
      3: { atk: 18, def: 8, crt: 8, desc: '⚔ 3件: ATK+18, DEF+8, CRT+8% — 弑魔本能' },
    }
  },
};

// ── 强化装备 ──
export function enhanceEquipment(equipment, player) {
  if (!equipment) return { success: false, reason: '无装备' };
  
  const currentLevel = equipment.enhanceLevel || 0;
  if (currentLevel >= 10) return { success: false, reason: '已达最高强化等级' };
  
  const row = ENHANCE_TABLE[currentLevel];
  const cost = row[3];
  
  if ((player.rewardPoints || 0) < cost) {
    return { success: false, reason: `奖励点不足 (需要 ${cost})` };
  }
  
  player.rewardPoints -= cost;
  
  // 判定成功率
  const roll = Math.random();
  const successRate = row[2];
  
  if (roll > successRate) {
    eventBus.emit('equipment:enhance_fail', { equipment, level: currentLevel });
    return { 
      success: false, 
      reason: `强化失败！(成功率 ${Math.floor(successRate * 100)}%)`,
      costPaid: cost,
      level: currentLevel
    };
  }
  
  // 成功：提升等级
  equipment.enhanceLevel = currentLevel + 1;
  
  // 重算强化加成
  recalcEnhanceBonuses(equipment);
  
  eventBus.emit('equipment:enhanced', { equipment, newLevel: equipment.enhanceLevel });
  return { 
    success: true, 
    newLevel: equipment.enhanceLevel,
    costPaid: cost,
    bonuses: equipment.enhanceBonuses
  };
}

// ── 重算强化后属性加成 ──
export function recalcEnhanceBonuses(equipment) {
  const level = equipment.enhanceLevel || 0;
  if (level === 0) {
    equipment.enhanceBonuses = {};
    return;
  }
  
  const row = ENHANCE_TABLE[level - 1];
  const mult = row[1];
  const bonuses = {};
  
  // 武器强化加ATK
  if (equipment.atk) bonuses.atk = Math.max(1, Math.floor(equipment.atk * mult));
  // 护甲强化加DEF
  if (equipment.def) bonuses.def = Math.max(1, Math.floor(equipment.def * mult));
  // 速度强化
  if (equipment.spd) bonuses.spd = Math.max(1, Math.floor(equipment.spd * mult));
  // 暴击强化
  if (equipment.crt) bonuses.crt = Math.max(1, Math.floor(equipment.crt * mult));
  
  equipment.enhanceBonuses = bonuses;
}

// ── 镶嵌宝石 ──
export function socketGem(equipment, gemId) {
  if (!equipment) return { success: false, reason: '无装备' };
  
  const gem = GEM_TYPES[gemId];
  if (!gem) return { success: false, reason: '无效宝石' };
  
  if (!equipment.gemSlots) equipment.gemSlots = [];
  const maxSlots = equipment.maxGemSlots || 2;
  
  if (equipment.gemSlots.length >= maxSlots) {
    return { success: false, reason: `宝石槽已满 (${maxSlots}/${maxSlots})` };
  }
  
  equipment.gemSlots.push({ ...gem });
  eventBus.emit('equipment:gem_socketed', { equipment, gem });
  return { success: true, gem };
}

// ── 移除宝石 ──
export function unsocketGem(equipment, slotIndex) {
  if (!equipment?.gemSlots?.[slotIndex]) {
    return { success: false, reason: '无效槽位' };
  }
  const removed = equipment.gemSlots.splice(slotIndex, 1)[0];
  return { success: true, gem: removed };
}

// ── 获取装备总属性（基础 + 强化 + 宝石） ──
export function getEquipmentTotalStats(equipment) {
  if (!equipment) return {};
  
  const stats = {};
  const base = { atk: equipment.atk || 0, def: equipment.def || 0, spd: equipment.spd || 0, crt: equipment.crt || 0, maxHp: equipment.maxHp || 0, res: equipment.res || 0 };
  const enhance = equipment.enhanceBonuses || {};
  
  for (const [k, v] of Object.entries(base)) {
    stats[k] = v + (enhance[k] || 0);
  }
  
  // 宝石加成
  for (const gem of equipment.gemSlots || []) {
    stats[gem.stat] = (stats[gem.stat] || 0) + gem.value;
  }
  
  return stats;
}

// ── 检测套装效果 ──
export function getActiveSetBonuses(player) {
  const equipped = [
    player.weapon?.setId,
    player.armor?.setId,
    player.accessory?.setId,
  ].filter(Boolean);
  
  const bonuses = {};
  
  for (const [setKey, setDef] of Object.entries(EQUIPMENT_SETS)) {
    const count = equipped.filter(id => setDef.pieces.includes(id)).length;
    for (const [threshold, bonus] of Object.entries(setDef.bonuses)) {
      if (count >= Number(threshold)) {
        for (const [stat, val] of Object.entries(bonus)) {
          if (stat === 'desc') continue;
          bonuses[stat] = (bonuses[stat] || 0) + val;
        }
      }
    }
  }
  
  return bonuses;
}

// ── 获取装备显示名 ──
export function getEquipmentDisplayName(equipment) {
  if (!equipment) return '';
  const level = equipment.enhanceLevel || 0;
  const levelStr = level > 0 ? ` +${level}` : '';
  const gemCount = (equipment.gemSlots || []).length;
  const gemStr = gemCount > 0 ? ` [${gemCount}💎]` : '';
  return `${equipment.name}${levelStr}${gemStr}`;
}

// ── 强化费用预览 ──
export function getEnhanceCost(equipment) {
  const level = equipment?.enhanceLevel || 0;
  if (level >= 10) return { cost: Infinity, successRate: 0, maxed: true };
  const row = ENHANCE_TABLE[level];
  return { cost: row[3], successRate: row[2], nextLevel: level + 1, maxed: false };
}


// ── 格式化套装信息HTML ──
export function formatSetBonusHTML(player) {
  const equipped = [player.weapon, player.armor, player.accessory].filter(Boolean);
  const equippedSetIds = equipped.map(e => e.setId).filter(Boolean);
  if (equippedSetIds.length === 0) return '<p style="color:#444;font-size:12px;">暂无套装部件</p>';
  
  let html = '';
  for (const [setKey, setDef] of Object.entries(EQUIPMENT_SETS)) {
    const count = equippedSetIds.filter(id => setDef.pieces.includes(id)).length;
    if (count === 0) continue;
    
    html += `<div style="margin-bottom:8px;padding:8px;background:rgba(255,255,255,0.02);border:1px solid ${count >= 2 ? '#ffcc4433' : '#22222266'};border-radius:6px;">`;
    html += `<p style="color:${count >= 2 ? '#ffcc44' : '#666'};font-size:12px;font-weight:bold;">${setDef.name} (${count}/${setDef.pieces.length})</p>`;
    for (const [tier, bonus] of Object.entries(setDef.bonuses)) {
      const active = count >= parseInt(tier);
      html += `<p style="color:${active ? '#44ff88' : '#444'};font-size:11px;margin-top:2px;">${active ? '✓' : '○'} ${bonus.desc}</p>`;
    }
    html += '</div>';
  }
  return html;
}
