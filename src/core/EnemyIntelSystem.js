// ═══════════════════════════════════════════════════════════════
// 敌人情报系统 — 战斗中发现与积累的敌人知识
// ═══════════════════════════════════════════════════════════════
//
// 核心机制：
// 1. 首次遇到敌人：只显示名字和外观描述
// 2. 战斗中使用不同攻击方式：逐步揭示属性
// 3. 击败后：记录基础数据到图鉴
// 4. 多次击败/使用元素攻击：揭示弱点和抗性
// 5. 完整情报提供战斗优势（+5%伤害）
//
// 情报等级：
// ☆☆☆ 未知 — 只有名字
// ★☆☆ 初识 — 基础属性(HP/ATK/DEF)
// ★★☆ 熟悉 — 弱点/抗性/特性
// ★★★ 精通 — 行动模式/掉落/战术建议
// ═══════════════════════════════════════════════════════════════

import { eventBus } from './EventBus.js';

// ── 情报等级 ──
export const INTEL_LEVEL = {
  UNKNOWN:  0,  // 未知
  BASIC:    1,  // 初识
  FAMILIAR: 2,  // 熟悉
  MASTERED: 3,  // 精通
};

const INTEL_LABELS = ['☆☆☆ 未知', '★☆☆ 初识', '★★☆ 熟悉', '★★★ 精通'];
const INTEL_COLORS = ['#555', '#ffcc44', '#44aaff', '#44ff88'];

// ── 情报数据库 ──
let _intelDB = {};
// 格式: { 'zombie_soldier': { 
//   name: '丧尸士兵', level: 2, kills: 3, 
//   discoveredStats: true, discoveredWeakness: true, discoveredPattern: false,
//   notes: ['物理攻击有效', '火焰弱点已确认'],
//   firstMet: 1, lastMet: 3,
//   bestTime: 4, // 最快击杀回合数
// }}

/**
 * 记录遭遇敌人（战斗开始时调用）
 */
export function recordEncounter(enemy) {
  const id = getEnemyTypeId(enemy);
  if (!_intelDB[id]) {
    _intelDB[id] = {
      name: enemy.name,
      sprite: enemy.sprite || '👹',
      level: INTEL_LEVEL.UNKNOWN,
      kills: 0,
      encounters: 0,
      discoveredStats: false,
      discoveredWeakness: false,
      discoveredPattern: false,
      discoveredDrops: false,
      notes: [],
      firstMet: 0,
      lastMet: 0,
      bestTime: Infinity,
      totalDamageDealt: 0,
      totalDamageTaken: 0,
      // 快照数据（击败后记录）
      snapshot: null,
    };
    eventBus.emit('intel:first_encounter', { id, name: enemy.name });
  }
  _intelDB[id].encounters++;
  return _intelDB[id];
}

/**
 * 记录击败敌人（战斗胜利时调用）
 */
export function recordKill(enemy, combatStats) {
  const id = getEnemyTypeId(enemy);
  const intel = _intelDB[id];
  if (!intel) return;
  
  intel.kills++;
  intel.lastMet = combatStats?.chapter || 0;
  if (!intel.firstMet) intel.firstMet = intel.lastMet;
  
  // 记录战斗数据
  if (combatStats?.rounds && combatStats.rounds < intel.bestTime) {
    intel.bestTime = combatStats.rounds;
  }
  intel.totalDamageDealt += (combatStats?.damageDealt || 0);
  intel.totalDamageTaken += (combatStats?.damageTaken || 0);
  
  // 保存敌人属性快照
  if (!intel.snapshot) {
    intel.snapshot = {
      hp: enemy.hp || enemy._originalHp || 0,
      atk: enemy.atk || 0,
      def: enemy.def || 0,
      spd: enemy.spd || 5,
      weaknesses: [...(enemy.weaknesses || [])],
      traits: [...(enemy.traits || [])],
      element: enemy.damageType || enemy.element || null,
      description: enemy.description || '',
    };
  }
  
  // 升级情报等级
  updateIntelLevel(id, enemy);
}

/**
 * 记录战斗中发现的信息
 */
export function recordDiscovery(enemy, discoveryType, note) {
  const id = getEnemyTypeId(enemy);
  const intel = _intelDB[id];
  if (!intel) return;
  
  switch (discoveryType) {
    case 'stats':
      if (!intel.discoveredStats) {
        intel.discoveredStats = true;
        intel.notes.push('📊 基础属性已确认');
        eventBus.emit('intel:discovery', { id, type: 'stats', name: intel.name });
      }
      break;
    case 'weakness':
      if (!intel.discoveredWeakness) {
        intel.discoveredWeakness = true;
        if (note) intel.notes.push('🎯 ' + note);
        eventBus.emit('intel:discovery', { id, type: 'weakness', name: intel.name });
      }
      break;
    case 'pattern':
      if (!intel.discoveredPattern) {
        intel.discoveredPattern = true;
        if (note) intel.notes.push('🔄 ' + note);
        eventBus.emit('intel:discovery', { id, type: 'pattern', name: intel.name });
      }
      break;
    case 'drops':
      if (!intel.discoveredDrops) {
        intel.discoveredDrops = true;
        if (note) intel.notes.push('📦 ' + note);
      }
      break;
  }
  
  updateIntelLevel(id, enemy);
}

/**
 * 更新情报等级
 */
function updateIntelLevel(id) {
  const intel = _intelDB[id];
  if (!intel) return;
  
  let level = INTEL_LEVEL.UNKNOWN;
  
  // 至少击败1次 → 初识
  if (intel.kills >= 1 || intel.discoveredStats) {
    level = INTEL_LEVEL.BASIC;
  }
  
  // 击败2次+发现弱点 → 熟悉
  if (intel.kills >= 2 && (intel.discoveredWeakness || intel.discoveredStats)) {
    level = INTEL_LEVEL.FAMILIAR;
  }
  
  // 击败3次+发现模式+弱点 → 精通
  if (intel.kills >= 3 && intel.discoveredWeakness && intel.discoveredPattern) {
    level = INTEL_LEVEL.MASTERED;
  }
  
  if (level > intel.level) {
    const oldLevel = intel.level;
    intel.level = level;
    eventBus.emit('intel:level_up', { id, name: intel.name, oldLevel, newLevel: level });
  }
}

/**
 * 获取情报等级的战斗加成
 */
export function getIntelCombatBonus(enemy) {
  const id = getEnemyTypeId(enemy);
  const intel = _intelDB[id];
  if (!intel) return { dmgBonus: 0, defBonus: 0, label: null };
  
  switch (intel.level) {
    case INTEL_LEVEL.BASIC:    return { dmgBonus: 0.02, defBonus: 0, label: '★ 情报加成 +2%伤害' };
    case INTEL_LEVEL.FAMILIAR: return { dmgBonus: 0.05, defBonus: 0.03, label: '★★ 情报加成 +5%伤害 +3%减伤' };
    case INTEL_LEVEL.MASTERED: return { dmgBonus: 0.08, defBonus: 0.05, label: '★★★ 情报加成 +8%伤害 +5%减伤' };
    default: return { dmgBonus: 0, defBonus: 0, label: null };
  }
}

/**
 * 获取敌人情报（用于UI显示）
 */
export function getEnemyIntel(enemy) {
  const id = getEnemyTypeId(enemy);
  return _intelDB[id] || null;
}

/**
 * 获取所有已记录的情报
 */
export function getAllIntel() {
  return { ..._intelDB };
}

/**
 * 获取情报统计
 */
export function getIntelStats() {
  const entries = Object.values(_intelDB);
  return {
    total: entries.length,
    unknown: entries.filter(e => e.level === INTEL_LEVEL.UNKNOWN).length,
    basic: entries.filter(e => e.level === INTEL_LEVEL.BASIC).length,
    familiar: entries.filter(e => e.level === INTEL_LEVEL.FAMILIAR).length,
    mastered: entries.filter(e => e.level === INTEL_LEVEL.MASTERED).length,
    totalKills: entries.reduce((sum, e) => sum + e.kills, 0),
  };
}

/**
 * 渲染情报图鉴面板
 */
export function renderIntelPanel() {
  const entries = Object.entries(_intelDB).sort((a, b) => b[1].level - a[1].level || b[1].kills - a[1].kills);
  const stats = getIntelStats();
  
  if (entries.length === 0) {
    return `<div style="text-align:center;padding:40px;color:#555;">
      <p style="font-size:14px;">📋 敌人情报</p>
      <p style="font-size:12px;margin-top:8px;color:#444;">尚未收集任何情报...</p>
    </div>`;
  }
  
  let html = '<div style="padding:12px;max-height:70vh;overflow-y:auto;">';
  html += '<h3 style="color:#44aaff;text-align:center;letter-spacing:4px;margin-bottom:4px;">📋 敌人情报图鉴</h3>';
  html += `<p style="color:#666;text-align:center;font-size:10px;margin-bottom:12px;">
    已录入 ${stats.total} 种 · 精通 ${stats.mastered} · 熟悉 ${stats.familiar} · 初识 ${stats.basic}
  </p>`;
  
  for (const [id, intel] of entries) {
    const color = INTEL_COLORS[intel.level];
    const label = INTEL_LABELS[intel.level];
    
    html += `<div style="background:rgba(255,255,255,0.02);border-left:3px solid ${color}40;
      border-radius:0 6px 6px 0;padding:8px 12px;margin:4px 0;">`;
    
    // 头部：名字+等级
    html += `<div style="display:flex;justify-content:space-between;align-items:center;">
      <span style="color:${color};font-size:13px;">${intel.sprite} ${intel.name}</span>
      <span style="color:${color};font-size:10px;">${label}</span>
    </div>`;
    
    // 基本信息
    if (intel.level >= INTEL_LEVEL.BASIC && intel.snapshot) {
      const s = intel.snapshot;
      html += `<p style="color:#888;font-size:11px;margin-top:4px;">
        HP:${s.hp} ATK:${s.atk} DEF:${s.def} SPD:${s.spd}
      </p>`;
    }
    
    // 弱点和特性
    if (intel.level >= INTEL_LEVEL.FAMILIAR && intel.snapshot) {
      const s = intel.snapshot;
      if (s.weaknesses?.length) {
        const wkMap = { fire:'🔥火', ice:'❄冰', poison:'☠毒', psychic:'🧠念', dark:'🌑暗', holy:'✦圣', physical:'⚔物' };
        html += `<p style="color:#ff8844;font-size:10px;margin-top:2px;">弱点: ${s.weaknesses.map(w => wkMap[w]||w).join(' ')}</p>`;
      }
      if (s.traits?.length) {
        html += `<p style="color:#aa88ff;font-size:10px;">特性: ${s.traits.join(' · ')}</p>`;
      }
    }
    
    // 精通信息
    if (intel.level >= INTEL_LEVEL.MASTERED) {
      html += `<p style="color:#44ff88;font-size:10px;margin-top:2px;">
        击杀 ${intel.kills}次 · 最快 ${intel.bestTime === Infinity ? '-' : intel.bestTime + '回合'}
      </p>`;
    }
    
    // 笔记
    if (intel.notes.length > 0 && intel.level >= INTEL_LEVEL.BASIC) {
      html += `<div style="margin-top:4px;padding-top:4px;border-top:1px solid #ffffff08;">`;
      for (const note of intel.notes.slice(-3)) {
        html += `<p style="color:#666;font-size:10px;font-style:italic;">${note}</p>`;
      }
      html += '</div>';
    }
    
    html += '</div>';
  }
  
  html += '</div>';
  return html;
}

/**
 * 获取预战情报显示HTML
 */
export function getPreBattleIntelHTML(enemy) {
  const intel = getEnemyIntel(enemy);
  if (!intel || intel.level === INTEL_LEVEL.UNKNOWN) {
    return '<p style="color:#555;font-size:10px;text-align:center;margin-top:4px;">❓ 未知敌人 — 首次遭遇</p>';
  }
  
  const color = INTEL_COLORS[intel.level];
  const bonus = getIntelCombatBonus(enemy);
  let html = `<div style="background:rgba(${intel.level >= 2 ? '68,170,255' : '255,204,68'},0.06);border:1px solid ${color}20;border-radius:6px;padding:6px 8px;margin-top:6px;text-align:center;">`;
  html += `<p style="color:${color};font-size:10px;">${INTEL_LABELS[intel.level]} · 击杀${intel.kills}次</p>`;
  if (bonus.label) {
    html += `<p style="color:#44ff88;font-size:9px;margin-top:2px;">${bonus.label}</p>`;
  }
  html += '</div>';
  return html;
}

// ── 辅助函数 ──
function getEnemyTypeId(enemy) {
  // 用敌人的base ID或名字生成唯一类型标识
  return enemy.baseId || enemy.id?.replace(/-\d+$/, '') || enemy.name?.toLowerCase().replace(/\s+/g, '_') || 'unknown';
}

// ── 序列化 ──
export function serializeIntel() {
  return { db: _intelDB };
}

export function deserializeIntel(data) {
  if (data?.db) _intelDB = data.db;
}

export function resetIntel() {
  _intelDB = {};
}
