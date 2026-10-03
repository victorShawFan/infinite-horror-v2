// ═══════════════════════════════════════════════════════════════
// 属性分配系统 — 升级时手动分配属性点
// ═══════════════════════════════════════════════════════════════
//
// 每次升级获得 3 属性点 + 1 天赋点
// 可分配到: HP, ATK, DEF, SPD, CRT, MANA
// 每个属性有不同的点数消耗和递增效果
// 支持推荐加点方案（根据血统/基因锁）

import { eventBus } from './EventBus.js';
import { gameState } from './GameState.js';
import { BLOODLINE } from './constants.js';

// ── 属性点消耗与效果定义 ──
export const STAT_DEFS = {
  maxHp: {
    id: 'maxHp', name: '生命', icon: '❤', color: '#44ff88',
    desc: '每点 +15 最大HP',
    perPoint: 15,
    maxInvest: 30, // 最多可投入30点
  },
  atk: {
    id: 'atk', name: '攻击', icon: '⚔', color: '#ff6644',
    desc: '每点 +3 攻击力',
    perPoint: 3,
    maxInvest: 30,
  },
  def: {
    id: 'def', name: '防御', icon: '🛡', color: '#4488ff',
    desc: '每点 +2 防御力',
    perPoint: 2,
    maxInvest: 30,
  },
  spd: {
    id: 'spd', name: '速度', icon: '⚡', color: '#ffcc44',
    desc: '每点 +2 速度（影响先手和双击）',
    perPoint: 2,
    maxInvest: 20,
  },
  crt: {
    id: 'crt', name: '暴击', icon: '💥', color: '#ff44cc',
    desc: '每点 +3% 暴击率',
    perPoint: 3,
    maxInvest: 20,
  },
  maxMana: {
    id: 'maxMana', name: '法力', icon: '💎', color: '#8844ff',
    desc: '每点 +8 最大法力',
    perPoint: 8,
    maxInvest: 15,
    requires: () => gameState.player.activeBloodline === BLOODLINE.DAOIST || (gameState.player.maxMana || 0) > 0,
    requiresText: '需要道法血统或已有法力值',
  },
};

const STAT_IDS = ['maxHp', 'atk', 'def', 'spd', 'crt', 'maxMana'];

// ── 推荐加点方案 ──
export const BUILD_PRESETS = {
  balanced: {
    name: '均衡型', desc: '攻守兼备，适合新手',
    icon: '⚖',
    priority: { atk: 1, def: 1, maxHp: 1, spd: 0, crt: 0, maxMana: 0 },
  },
  berserker: {
    name: '狂战士', desc: '高攻高暴击，血族/古武推荐',
    icon: '🔥',
    priority: { atk: 2, crt: 1, maxHp: 0, def: 0, spd: 0, maxMana: 0 },
  },
  tank: {
    name: '铁壁型', desc: '高HP高防御，武修推荐',
    icon: '🛡',
    priority: { maxHp: 2, def: 1, atk: 0, spd: 0, crt: 0, maxMana: 0 },
  },
  swift: {
    name: '疾风型', desc: '高速双击流，速度碾压',
    icon: '⚡',
    priority: { spd: 2, atk: 1, crt: 0, maxHp: 0, def: 0, maxMana: 0 },
  },
  caster: {
    name: '法师型', desc: '高法力高暴击，道法推荐',
    icon: '💎',
    priority: { maxMana: 2, crt: 1, atk: 0, maxHp: 0, def: 0, spd: 0 },
  },
  critical: {
    name: '刺客型', desc: '暴击流，一击致命',
    icon: '🗡',
    priority: { crt: 2, atk: 1, spd: 0, maxHp: 0, def: 0, maxMana: 0 },
  },
};

// ── 状态 ──
let _pendingPoints = 0; // 待分配的属性点
let _invested = {}; // 各属性已投入的点数

export function getPendingPoints() { return _pendingPoints; }
export function getInvested() { return { ..._invested }; }

export function initStatAllocation() {
  if (!gameState._statAllocation) {
    gameState._statAllocation = {
      pendingPoints: 0,
      invested: { maxHp: 0, atk: 0, def: 0, spd: 0, crt: 0, maxMana: 0 },
    };
  }
  _pendingPoints = gameState._statAllocation.pendingPoints;
  _invested = { ...gameState._statAllocation.invested };
}

function _save() {
  gameState._statAllocation = {
    pendingPoints: _pendingPoints,
    invested: { ..._invested },
  };
}

/**
 * 升级时调用：增加待分配点数
 */
export function grantStatPoints(points = 3) {
  _pendingPoints += points;
  _save();
  eventBus.emit('statalloc:points_available', { points: _pendingPoints });
}

/**
 * 分配1点到指定属性
 * @returns {{ success: boolean, message: string }}
 */
export function allocateStat(statId) {
  if (_pendingPoints <= 0) return { success: false, message: '没有可用的属性点' };
  
  const def = STAT_DEFS[statId];
  if (!def) return { success: false, message: '无效的属性' };
  
  const currentInvest = _invested[statId] || 0;
  if (currentInvest >= def.maxInvest) {
    return { success: false, message: `${def.name}已达投入上限 (${def.maxInvest})` };
  }
  
  if (def.requires && !def.requires()) {
    return { success: false, message: def.requiresText || '未满足前置条件' };
  }
  
  // 应用效果
  const p = gameState.player;
  const gain = def.perPoint;
  
  switch (statId) {
    case 'maxHp':
      p.maxHp += gain;
      p.hp += gain; // 也恢复对应HP
      break;
    case 'atk': p.atk += gain; break;
    case 'def': p.def += gain; break;
    case 'spd': p.spd += gain; break;
    case 'crt': p.crt = (p.crt || 0) + gain; break;
    case 'maxMana':
      p.maxMana = (p.maxMana || 0) + gain;
      break;
  }
  
  _invested[statId] = currentInvest + 1;
  _pendingPoints--;
  _save();
  
  eventBus.emit('statalloc:allocated', {
    statId, gain, remaining: _pendingPoints,
    totalInvested: _invested[statId],
  });
  
  return { success: true, message: `${def.icon} ${def.name} +${gain}` };
}

/**
 * 一键按推荐方案分配所有点数
 */
export function autoAllocate(presetId = 'balanced') {
  const preset = BUILD_PRESETS[presetId];
  if (!preset) return { success: false, message: '未知方案' };
  
  const results = [];
  while (_pendingPoints > 0) {
    // 按优先级排序
    const candidates = STAT_IDS
      .filter(id => {
        const def = STAT_DEFS[id];
        if ((_invested[id] || 0) >= def.maxInvest) return false;
        if (def.requires && !def.requires()) return false;
        return (preset.priority[id] || 0) > 0;
      })
      .sort((a, b) => (preset.priority[b] || 0) - (preset.priority[a] || 0));
    
    if (candidates.length === 0) break;
    
    // 分配到最高优先级（如果多个相同优先级则轮流）
    const topPrio = preset.priority[candidates[0]];
    const topCandidates = candidates.filter(id => preset.priority[id] === topPrio);
    // 选已投入最少的那个
    topCandidates.sort((a, b) => (_invested[a] || 0) - (_invested[b] || 0));
    
    const result = allocateStat(topCandidates[0]);
    if (!result.success) break;
    results.push(result.message);
  }
  
  return { success: true, results };
}

/**
 * 获取推荐方案（根据当前血统）
 */
export function getRecommendedBuild() {
  const bl = gameState.player.activeBloodline;
  switch (bl) {
    case BLOODLINE.VAMPIRE: return 'berserker';
    case BLOODLINE.ANCIENT_WU: return 'berserker';
    case BLOODLINE.MARTIAL: return 'tank';
    case BLOODLINE.DAOIST: return 'caster';
    default: return 'balanced';
  }
}

/**
 * 生成属性分配面板HTML
 */
export function renderStatAllocationPanel() {
  const p = gameState.player;
  const recBuild = getRecommendedBuild();
  
  let html = '<div style="padding:12px;max-width:420px;margin:0 auto;">';
  
  // 标题
  html += '<h3 style="color:#ffcc44;text-align:center;margin-bottom:8px;font-size:14px;">⬆ 属性分配</h3>';
  html += `<p style="color:#888;text-align:center;font-size:11px;margin-bottom:12px;">可用属性点: <strong style="color:#ffcc44;font-size:14px;">${_pendingPoints}</strong></p>`;
  
  // 属性列表
  for (const statId of STAT_IDS) {
    const def = STAT_DEFS[statId];
    const invested = _invested[statId] || 0;
    const currentVal = statId === 'maxMana' ? (p.maxMana || 0) : (p[statId] || 0);
    const locked = def.requires && !def.requires();
    const maxed = invested >= def.maxInvest;
    const canAllocate = _pendingPoints > 0 && !locked && !maxed;
    
    const barWidth = Math.min(100, (invested / def.maxInvest) * 100);
    
    html += `<div style="
      display:flex;align-items:center;gap:8px;
      padding:6px 8px;margin-bottom:4px;
      background:${canAllocate ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.01)'};
      border-radius:6px;border:1px solid ${locked ? '#333' : '#222'};
      opacity:${locked ? '0.4' : '1'};
    ">`;
    
    // Icon + Name
    html += `<div style="width:50px;text-align:center;">
      <span style="font-size:16px;">${def.icon}</span>
      <p style="color:${def.color};font-size:9px;">${def.name}</p>
    </div>`;
    
    // Current value + bar
    html += `<div style="flex:1;">
      <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
        <span style="color:${def.color};font-size:12px;font-weight:bold;">${currentVal}</span>
        <span style="color:#666;font-size:9px;">${invested}/${def.maxInvest} 点</span>
      </div>
      <div style="height:4px;background:#1a1a1a;border-radius:2px;overflow:hidden;">
        <div style="height:100%;width:${barWidth}%;background:${def.color};opacity:0.7;border-radius:2px;"></div>
      </div>
      <p style="color:#555;font-size:8px;margin-top:1px;">${locked ? def.requiresText : def.desc}</p>
    </div>`;
    
    // + Button
    html += `<button 
      data-stat-alloc="${statId}"
      ${!canAllocate ? 'disabled' : ''}
      style="
        width:36px;height:36px;border-radius:50%;
        border:2px solid ${canAllocate ? def.color : '#333'};
        background:${canAllocate ? 'rgba(255,255,255,0.08)' : 'transparent'};
        color:${canAllocate ? def.color : '#444'};
        font-size:18px;font-weight:bold;cursor:${canAllocate ? 'pointer' : 'default'};
        display:flex;align-items:center;justify-content:center;
      ">+</button>`;
    
    html += '</div>';
  }
  
  // 推荐方案快速分配
  if (_pendingPoints > 0) {
    html += '<div style="margin-top:12px;border-top:1px solid #222;padding-top:10px;">';
    html += '<p style="color:#666;font-size:10px;margin-bottom:6px;">💡 一键分配方案:</p>';
    html += '<div style="display:flex;gap:4px;flex-wrap:wrap;">';
    for (const [id, preset] of Object.entries(BUILD_PRESETS)) {
      const isRec = id === recBuild;
      html += `<button data-auto-alloc="${id}" style="
        padding:4px 8px;border-radius:4px;font-size:10px;
        border:1px solid ${isRec ? '#ffcc44' : '#333'};
        background:${isRec ? 'rgba(255,204,68,0.1)' : 'rgba(255,255,255,0.03)'};
        color:${isRec ? '#ffcc44' : '#888'};cursor:pointer;
      ">${preset.icon} ${preset.name}${isRec ? ' ★' : ''}</button>`;
    }
    html += '</div></div>';
  }
  
  html += '</div>';
  return html;
}

// ── 序列化 ──
export function serializeStatAllocation() {
  return { pendingPoints: _pendingPoints, invested: { ..._invested } };
}

export function deserializeStatAllocation(data) {
  if (data) {
    _pendingPoints = data.pendingPoints || 0;
    _invested = data.invested || { maxHp: 0, atk: 0, def: 0, spd: 0, crt: 0, maxMana: 0 };
    _save();
  }
}
