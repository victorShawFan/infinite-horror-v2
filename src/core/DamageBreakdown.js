// ═══════════════════════════════════════════════════════════════
// 伤害明细分解系统 — 让数值透明可理解
// ═══════════════════════════════════════════════════════════════
//
// 在战前确认面板和角色面板中展示详细的伤害公式分解：
// 基础ATK + 装备 + 天赋 + 附魔 + 血统 × 姿态修正 - 敌方DEF = 最终伤害
// 
// 让玩家清晰看到每个Build决策如何影响实际输出
// ═══════════════════════════════════════════════════════════════

import { gameState } from './GameState.js';
import { getStatsBreakdown } from './CombatSystem.js';

/**
 * 生成完整的伤害分解HTML
 * @param {object} player - 玩家数据
 * @param {object} enemy - 敌人数据
 * @returns {string} HTML字符串
 */
export function generateDamageBreakdownHTML(player, enemy) {
  let breakdown;
  try { breakdown = getStatsBreakdown(player); } catch { breakdown = null; }
  
  if (!breakdown) {
    // Fallback: 简单计算
    const baseDmg = Math.max(1, player.atk - (enemy.def || 0));
    return `<div style="font-size:11px;color:#888;">预计伤害: <span style="color:#ff6644;">${baseDmg}</span></div>`;
  }
  
  const atkBreakdown = breakdown.atk || {};
  const defBreakdown = breakdown.def || {};
  
  const sections = [];
  
  // ATK分解
  const atkParts = [];
  if (atkBreakdown.base) atkParts.push({ label: '基础', value: atkBreakdown.base, color: '#ccc' });
  if (atkBreakdown.weapon) atkParts.push({ label: '武器', value: atkBreakdown.weapon, color: '#ff8844' });
  if (atkBreakdown.talent) atkParts.push({ label: '天赋', value: atkBreakdown.talent, color: '#ff4444' });
  if (atkBreakdown.enchant) atkParts.push({ label: '附魔', value: atkBreakdown.enchant, color: '#aa88ff' });
  if (atkBreakdown.bloodline) atkParts.push({ label: '血统', value: atkBreakdown.bloodline, color: '#ff6600' });
  if (atkBreakdown.geneLock) atkParts.push({ label: '基因锁', value: atkBreakdown.geneLock, color: '#ffaa00' });
  if (atkBreakdown.stance) atkParts.push({ label: '姿态', value: atkBreakdown.stance, color: '#44aaff' });
  
  const totalAtk = atkParts.reduce((sum, p) => sum + (p.value || 0), 0) || player.atk;
  const rawDmg = Math.max(1, totalAtk - (enemy.def || 0));
  
  // 暴击期望
  const crt = player.crt || 0;
  const critMult = 1.5; // 默认暴击倍率
  const avgDmg = Math.floor(rawDmg * (1 + crt / 100 * (critMult - 1)));
  
  let html = `
    <div style="font-size:11px;line-height:1.6;">
      <p style="color:#888;letter-spacing:2px;margin-bottom:4px;">⚔ 攻击力分解</p>
      <div style="padding-left:8px;">
  `;
  
  for (const part of atkParts) {
    if (part.value) {
      html += `<div style="display:flex;justify-content:space-between;">
        <span style="color:#888;">${part.label}</span>
        <span style="color:${part.color};">+${part.value}</span>
      </div>`;
    }
  }
  
  html += `
      <div style="border-top:1px solid #333;margin:4px 0;padding-top:4px;display:flex;justify-content:space-between;">
        <span style="color:#aaa;">有效ATK</span>
        <span style="color:#ff6644;font-weight:bold;">${totalAtk}</span>
      </div>
      </div>
      
      <div style="margin:8px 0;padding:6px 8px;background:rgba(255,100,68,0.06);border-radius:6px;">
        <div style="display:flex;justify-content:space-between;">
          <span style="color:#888;">ATK ${totalAtk} - DEF ${enemy.def || 0}</span>
          <span style="color:#ff6644;">= ${rawDmg}/击</span>
        </div>
        ${crt > 0 ? `<div style="display:flex;justify-content:space-between;margin-top:2px;">
          <span style="color:#888;">含暴击(${crt}%)期望</span>
          <span style="color:#ff44aa;">≈ ${avgDmg}/击</span>
        </div>` : ''}
      </div>
    </div>
  `;
  
  return html;
}

/**
 * 生成简洁的一行伤害预览
 */
export function getQuickDamagePreview(player, enemy) {
  const rawDmg = Math.max(1, player.atk - (enemy.def || 0));
  const crt = player.crt || 0;
  const turnsToKill = rawDmg > 0 ? Math.ceil((enemy.hp || 1) / rawDmg) : Infinity;
  
  return {
    damage: rawDmg,
    turnsToKill,
    canWin: rawDmg > 0 && turnsToKill < 100,
    critChance: crt,
  };
}

/**
 * 生成防御分解HTML
 */
export function generateDefenseBreakdownHTML(player, enemyAtk) {
  const rawDmg = Math.max(0, (enemyAtk || 0) - (player.def || 0));
  const turnsToLose = rawDmg > 0 ? Math.ceil(player.hp / rawDmg) : Infinity;
  
  return `
    <div style="font-size:11px;line-height:1.6;">
      <p style="color:#888;letter-spacing:2px;margin-bottom:4px;">🛡 防御分解</p>
      <div style="padding:6px 8px;background:rgba(68,136,255,0.06);border-radius:6px;">
        <div style="display:flex;justify-content:space-between;">
          <span style="color:#888;">敌ATK ${enemyAtk} - DEF ${player.def}</span>
          <span style="color:#4488ff;">= ${rawDmg}/击</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-top:2px;">
          <span style="color:#888;">HP ${player.hp}/${player.maxHp}</span>
          <span style="color:${turnsToLose < 5 ? '#ff4444' : turnsToLose < 10 ? '#ffcc44' : '#44ff88'};">
            可承受 ${turnsToLose === Infinity ? '∞' : turnsToLose} 击
          </span>
        </div>
      </div>
    </div>
  `;
}
