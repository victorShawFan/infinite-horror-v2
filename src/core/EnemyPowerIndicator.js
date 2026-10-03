// ═══════════════════════════════════════════════════════════════
// 敌人威胁评估系统 — 战前敌人实力可视化
// ═══════════════════════════════════════════════════════════════
//
// 在地图上显示敌人相对于玩家的威胁等级：
//   - 远弱于你：灰色（可轻松碾压）
//   - 弱于你：绿色（低威胁）
//   - 势均力敌：黄色（正常挑战）
//   - 强于你：橙色（有风险）
//   - 远强于你：红色（极度危险）
//   - Boss：紫色脉动
// ═══════════════════════════════════════════════════════════════

import { gameState } from './GameState.js';
import { getEffectiveAtk, getEffectiveDef } from './CombatSystem.js';

/**
 * 威胁等级枚举
 */
export const THREAT_LEVEL = {
  TRIVIAL:   'trivial',    // 远弱
  WEAK:      'weak',       // 弱
  EVEN:      'even',       // 势均力敌
  STRONG:    'strong',     // 强
  DEADLY:    'deadly',     // 极危险
  BOSS:      'boss',       // Boss
};

const THREAT_CONFIG = {
  [THREAT_LEVEL.TRIVIAL]: { color: '#666666', glow: 'none',                     icon: '·',  label: '无威胁', border: '#33333340' },
  [THREAT_LEVEL.WEAK]:    { color: '#44cc88', glow: '0 0 6px rgba(68,204,136,0.2)',  icon: '▪',  label: '低威胁', border: '#44cc8840' },
  [THREAT_LEVEL.EVEN]:    { color: '#ffcc44', glow: '0 0 8px rgba(255,204,68,0.25)', icon: '◆',  label: '对等',   border: '#ffcc4440' },
  [THREAT_LEVEL.STRONG]:  { color: '#ff8844', glow: '0 0 10px rgba(255,136,68,0.3)', icon: '▲',  label: '危险',   border: '#ff884450' },
  [THREAT_LEVEL.DEADLY]:  { color: '#ff4444', glow: '0 0 14px rgba(255,68,68,0.4)',  icon: '☠',  label: '致命',   border: '#ff444460' },
  [THREAT_LEVEL.BOSS]:    { color: '#cc44ff', glow: '0 0 16px rgba(204,68,255,0.4)', icon: '💀', label: 'BOSS',   border: '#cc44ff60' },
};

/**
 * 计算敌人相对玩家的威胁等级
 * @param {object} enemy - 敌人数据
 * @param {object} player - 玩家数据
 * @returns {{ level: string, config: object, powerRatio: number }}
 */
export function assessThreat(enemy, player) {
  if (enemy.type === 'boss' || enemy.isBoss || enemy.bossId) {
    return { level: THREAT_LEVEL.BOSS, config: THREAT_CONFIG[THREAT_LEVEL.BOSS], powerRatio: 999 };
  }
  
  // 综合战力评估
  const pAtk = getEffectiveAtk(player);
  const pDef = getEffectiveDef(player);
  const playerPower = pAtk * 1.5 + pDef + (player.maxHp * 0.05) + (player.level * 2);
  
  const eAtk = enemy.atk || 0;
  const eDef = enemy.def || 0;
  const eHp = enemy.hp || 0;
  const enemyPower = eAtk * 1.5 + eDef + (eHp * 0.05) + ((enemy.level || 1) * 2);
  
  const ratio = enemyPower / Math.max(1, playerPower);
  
  let level;
  if (ratio < 0.4) level = THREAT_LEVEL.TRIVIAL;
  else if (ratio < 0.7) level = THREAT_LEVEL.WEAK;
  else if (ratio < 1.3) level = THREAT_LEVEL.EVEN;
  else if (ratio < 2.0) level = THREAT_LEVEL.STRONG;
  else level = THREAT_LEVEL.DEADLY;
  
  return { level, config: THREAT_CONFIG[level], powerRatio: ratio };
}

/**
 * 获取敌人在Canvas上的颜色
 */
export function getEnemyMapColor(enemy, player) {
  const threat = assessThreat(enemy, player);
  return threat.config.color;
}

/**
 * 生成敌人悬停提示HTML
 */
export function getEnemyTooltipHTML(enemy, player, scaledEnemy) {
  const target = scaledEnemy || enemy;
  const threat = assessThreat(target, player);
  const c = threat.config;
  
  const pAtk = getEffectiveAtk(player);
  const canDamage = pAtk - (target.def || 0) > 0;
  const estimatedRounds = canDamage 
    ? Math.ceil((target.hp || 1) / Math.max(1, pAtk - (target.def || 0)))
    : '∞';
  
  return `
    <div style="padding:8px 12px;background:rgba(5,5,10,0.95);border:1px solid ${c.border};border-radius:8px;min-width:180px;box-shadow:${c.glow};">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
        <span style="font-size:14px;">${c.icon}</span>
        <span style="color:${c.color};font-size:13px;font-weight:bold;">${target.name}</span>
        <span style="color:${c.color};font-size:10px;opacity:0.7;">— ${c.label}</span>
      </div>
      <div style="display:flex;gap:12px;font-size:11px;color:#888;">
        <span>HP ${target.hp}</span>
        <span>ATK ${target.atk}</span>
        <span>DEF ${target.def}</span>
      </div>
      <div style="margin-top:4px;font-size:10px;color:${canDamage ? '#888' : '#ff4444'};">
        ${canDamage ? `≈ ${estimatedRounds} 回合击杀` : '⚠ 无法造成有效伤害！'}
      </div>
      ${target.affix ? `<div style="margin-top:4px;font-size:10px;color:#ffcc44;">⚠ ${target.affix.name}</div>` : ''}
      ${target.element && target.element !== 'physical' ? `<div style="margin-top:2px;font-size:10px;color:#4488ff;">✦ 元素: ${target.element}</div>` : ''}
    </div>
  `;
}

/**
 * 在Canvas上绘制敌人威胁指示器
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} screenX - 屏幕坐标X
 * @param {number} screenY - 屏幕坐标Y
 * @param {number} tileSize - 格子大小
 * @param {object} enemy - 敌人数据
 * @param {object} player - 玩家数据
 */
export function drawThreatIndicator(ctx, screenX, screenY, tileSize, enemy, player) {
  const threat = assessThreat(enemy, player);
  const c = threat.config;
  
  // 绘制底部威胁色条
  const barWidth = tileSize * 0.6;
  const barHeight = 3;
  const barX = screenX + (tileSize - barWidth) / 2;
  const barY = screenY + tileSize - 6;
  
  ctx.save();
  
  // 背景
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);
  
  // 威胁色条
  ctx.fillStyle = c.color;
  ctx.globalAlpha = 0.8;
  ctx.fillRect(barX, barY, barWidth, barHeight);
  
  // Boss脉动效果
  if (threat.level === THREAT_LEVEL.BOSS) {
    const pulse = (Math.sin(Date.now() / 300) + 1) / 2;
    ctx.globalAlpha = pulse * 0.3;
    ctx.strokeStyle = c.color;
    ctx.lineWidth = 2;
    ctx.strokeRect(screenX + 2, screenY + 2, tileSize - 4, tileSize - 4);
  }
  
  // Deadly闪烁效果
  if (threat.level === THREAT_LEVEL.DEADLY) {
    const blink = Math.sin(Date.now() / 500) > 0;
    if (blink) {
      ctx.globalAlpha = 0.15;
      ctx.fillStyle = c.color;
      ctx.fillRect(screenX, screenY, tileSize, tileSize);
    }
  }
  
  ctx.restore();
}
