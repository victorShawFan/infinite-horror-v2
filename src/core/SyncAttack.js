// ═══════════════════════════════════════════════════════════════
// 协同攻击系统 — 同伴合体大招
// ═══════════════════════════════════════════════════════════════
//
// 当战斗中累积足够的"协同值"时,可以触发协同攻击:
// - 协同值通过暴击、元素克制、同伴技能使用来累积
// - 满100时自动触发（或手动选择触发时机）
// - 每次协同攻击消耗全部协同值
// - 不同同伴组合有不同的协同攻击效果
// ═══════════════════════════════════════════════════════════════

import { eventBus } from './EventBus.js';
import { gameState } from './GameState.js';

// ── 协同值状态 ──
let _syncGauge = 0;
const SYNC_MAX = 100;
const SYNC_THRESHOLD = 80; // 达到80即可触发

// ── 协同攻击定义 ──
const SYNC_ATTACKS = {
  // 郑吒 + 张杰: 队长双突
  'zhang_jie': {
    name: '队长双突',
    icon: '⚔🛡',
    desc: '郑吒与张杰联手冲锋，造成200%ATK伤害并获得1回合无敌',
    color: '#ff8844',
    dmgMult: 2.0,
    bonus: { invincible: 1 },
    dialogue: '张杰：「跟上我的节奏！」\n郑吒：「明白！」',
  },
  // 郑吒 + 詹岚: 精确打击
  'zhan_lan': {
    name: '精确打击',
    icon: '⚔🎯',
    desc: '詹岚标记弱点+郑吒全力一击，造成250%ATK穿甲伤害',
    color: '#44aaff',
    dmgMult: 2.5,
    bonus: { armorPen: 0.8 },
    dialogue: '詹岚：「弱点已标记，3点钟方向。」\n郑吒：「收到！」',
  },
  // 郑吒 + 楚轩: 战术陷阱
  'chuxuan': {
    name: '楚轩的计算',
    icon: '⚔🧠',
    desc: '楚轩预判敌人行动+郑吒利用空隙，造成180%ATK+DEF削减30%',
    color: '#aa88ff',
    dmgMult: 1.8,
    bonus: { defReduce: 0.3, duration: 3 },
    dialogue: '楚轩：「它会在0.3秒后向左移动。」\n郑吒：「……你是怎么算出来的？」',
  },
  // 郑吒 + 赵樱空: 双刃共鸣
  'zhao_yingkong': {
    name: '双刃共鸣',
    icon: '⚔🗡',
    desc: '赵樱空先手破防+郑吒追击，造成220%ATK+3回合流血',
    color: '#ff44cc',
    dmgMult: 2.2,
    bonus: { bleed: { pctPerTurn: 0.05, turns: 3 } },
    dialogue: '赵樱空：「……」（无声抽刀）\n郑吒：「小心，这次我跟上。」',
  },
  // 郑吒 + 霸王: 力量碾压
  'bawang': {
    name: '力量碾压',
    icon: '⚔💪',
    desc: '霸王重击+郑吒追击，造成300%ATK伤害+2回合眩晕',
    color: '#ff4444',
    dmgMult: 3.0,
    bonus: { stun: 2 },
    dialogue: '霸王：「让开，看我的！」\n郑吒：「等一下——算了，一起上！」',
  },
  // 默认协同攻击（无特定同伴时）
  '_default': {
    name: '全队协攻',
    icon: '⚔⚔',
    desc: '全队集中火力，造成150%ATK伤害',
    color: '#ffffff',
    dmgMult: 1.5,
    bonus: {},
    dialogue: '郑吒：「全队集火！」',
  },
};

/**
 * 增加协同值
 * @param {number} amount - 增加量
 * @param {string} reason - 原因（用于日志）
 */
export function addSyncGauge(amount, reason) {
  const prev = _syncGauge;
  _syncGauge = Math.min(SYNC_MAX, _syncGauge + amount);
  
  if (_syncGauge >= SYNC_THRESHOLD && prev < SYNC_THRESHOLD) {
    eventBus.emit('sync:ready', { gauge: _syncGauge });
  }
  
  if (_syncGauge !== prev) {
    eventBus.emit('sync:gauge_change', { gauge: _syncGauge, max: SYNC_MAX, reason });
  }
}

/**
 * 获取当前协同值
 */
export function getSyncGauge() {
  return { current: _syncGauge, max: SYNC_MAX, ready: _syncGauge >= SYNC_THRESHOLD };
}

/**
 * 消耗协同值执行协同攻击
 * @param {Object} enemy - 当前敌人
 * @returns {Object|null} 协同攻击结果
 */
export function executeSyncAttack(enemy) {
  if (_syncGauge < SYNC_THRESHOLD) return null;
  
  // 找到最佳同伴
  const companion = _getBestSyncCompanion();
  const attack = companion ? (SYNC_ATTACKS[companion.id] || SYNC_ATTACKS._default) : SYNC_ATTACKS._default;
  
  const p = gameState.player;
  const baseDmg = Math.floor(p.atk * attack.dmgMult);
  
  // 穿甲计算
  let finalDmg = baseDmg;
  if (attack.bonus.armorPen) {
    const effectiveDef = Math.floor(enemy.def * (1 - attack.bonus.armorPen));
    finalDmg = Math.max(1, baseDmg - effectiveDef);
  } else {
    finalDmg = Math.max(1, baseDmg - (enemy.def || 0));
  }
  
  // 消耗协同值
  _syncGauge = 0;
  eventBus.emit('sync:executed', {
    attack: attack.name,
    damage: finalDmg,
    companion: companion?.name || '全队',
  });
  
  return {
    name: attack.name,
    icon: attack.icon,
    desc: attack.desc,
    color: attack.color,
    damage: finalDmg,
    bonus: attack.bonus,
    dialogue: attack.dialogue,
    companionName: companion?.name || '全队',
  };
}

/**
 * 获取协同攻击信息（用于UI预览）
 */
export function getSyncAttackInfo() {
  const companion = _getBestSyncCompanion();
  const attack = companion ? (SYNC_ATTACKS[companion.id] || SYNC_ATTACKS._default) : SYNC_ATTACKS._default;
  return { ...attack, companionName: companion?.name || '全队', ready: _syncGauge >= SYNC_THRESHOLD };
}

/**
 * 渲染协同值UI条
 */
export function renderSyncGaugeHTML() {
  const pct = Math.floor(_syncGauge / SYNC_MAX * 100);
  const ready = _syncGauge >= SYNC_THRESHOLD;
  const color = ready ? '#ffcc44' : '#4488ff';
  
  return `<div style="display:flex;align-items:center;gap:6px;">
    <span style="color:#888;font-size:10px;">协同</span>
    <div style="width:80px;height:6px;background:#111;border-radius:3px;overflow:hidden;">
      <div style="height:100%;width:${pct}%;background:${color};border-radius:3px;transition:width 0.3s;
        ${ready ? 'animation:pulse 0.8s infinite;' : ''}"></div>
    </div>
    <span style="color:${color};font-size:10px;font-weight:bold;">${_syncGauge}%</span>
    ${ready ? '<span style="color:#ffcc44;font-size:10px;animation:pulse 0.5s infinite;">⚡ READY</span>' : ''}
  </div>`;
}

// ── 辅助 ──
function _getBestSyncCompanion() {
  const companions = gameState.companions?.filter(c => c.alive) || [];
  if (companions.length === 0) return null;
  
  // 优先选关系最好的、有专属协同的同伴
  const withSync = companions.filter(c => SYNC_ATTACKS[c.id]);
  if (withSync.length > 0) {
    return withSync.reduce((best, c) => {
      const rel = gameState.relationships?.[c.id]?.level || 0;
      const bestRel = gameState.relationships?.[best.id]?.level || 0;
      return rel > bestRel ? c : best;
    });
  }
  return companions[0];
}

// ── 重置 ──
export function resetSyncGauge() {
  _syncGauge = 0;
}

// ── 序列化 ──
export function serializeSync() {
  return { gauge: _syncGauge };
}

export function deserializeSync(data) {
  if (data?.gauge !== undefined) _syncGauge = data.gauge;
}
