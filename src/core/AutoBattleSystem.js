// ═══════════════════════════════════════════════════════════════
// 自动战斗系统 — 碾压弱敌时自动清怪
// 魔塔核心机制：当玩家实力远超敌人时，自动推进
// ═══════════════════════════════════════════════════════════════

import { previewBattle, getEffectiveAtk, getEffectiveDef } from './CombatSystem.js';

let _enabled = false;
let _threshold = 0.15; // 受伤低于15%最大HP时自动战斗

/**
 * 开关自动战斗
 */
export function toggleAutoBattle() {
  _enabled = !_enabled;
  return _enabled;
}

export function isAutoBattleEnabled() {
  return _enabled;
}

export function setAutoBattleThreshold(pct) {
  _threshold = Math.max(0.05, Math.min(0.5, pct));
}

/**
 * 判断是否应该自动战斗
 * @param {Object} player - 玩家数据
 * @param {Object} enemy - 已缩放的敌人数据
 * @returns {Object} { shouldAuto, reason }
 */
export function shouldAutoBattle(player, enemy) {
  if (!_enabled) return { shouldAuto: false, reason: '未开启' };
  
  // Boss永远不自动
  if (enemy.type === 'boss' || enemy.isBoss || enemy.bossId) {
    return { shouldAuto: false, reason: 'Boss战需要手动' };
  }
  
  const preview = previewBattle(player, enemy);
  
  if (!preview.canWin) {
    return { shouldAuto: false, reason: '无法击败' };
  }
  
  const damageRatio = preview.totalDamage / player.maxHp;
  if (damageRatio <= _threshold) {
    return { 
      shouldAuto: true, 
      reason: `碾压 (受伤${Math.round(damageRatio * 100)}% < ${Math.round(_threshold * 100)}%)`,
      preview,
    };
  }
  
  return { shouldAuto: false, reason: `受伤${Math.round(damageRatio * 100)}%超过阈值` };
}

/**
 * 渲染自动战斗状态指示器
 */
export function renderAutoBattleIndicator(ctx, x, y) {
  if (!_enabled) return;
  
  ctx.save();
  ctx.font = '10px "Microsoft YaHei"';
  ctx.fillStyle = 'rgba(68, 204, 136, 0.6)';
  ctx.textAlign = 'left';
  ctx.fillText('⚡ AUTO', x, y);
  ctx.fillStyle = 'rgba(100, 100, 100, 0.4)';
  ctx.fillText(`(≤${Math.round(_threshold * 100)}%伤)`, x + 48, y);
  ctx.restore();
}

/**
 * 序列化/反序列化
 */
export function serializeAutoBattle() {
  return { enabled: _enabled, threshold: _threshold };
}

export function deserializeAutoBattle(data) {
  if (!data) return;
  _enabled = !!data.enabled;
  _threshold = data.threshold || 0.15;
}
