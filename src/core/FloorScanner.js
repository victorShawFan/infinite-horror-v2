// ═══════════════════════════════════════════════════════════════
// 楼层扫描系统 — 显示当前楼层的资源概览
// ═══════════════════════════════════════════════════════════════
//
// 按 Tab 键显示当前楼层的统计信息：
// - 剩余敌人数量和总战力
// - 剩余物品/钥匙/门
// - 交互物位置
// - 楼梯位置
// - 探索完成度
//
// 这是魔塔游戏的核心策略功能——帮助玩家规划路线

import { ENTITY_TYPE } from './constants.js';
import { gameState } from './GameState.js';
import { getEffectiveAtk, getEffectiveDef } from './CombatSystem.js';
import { previewBattle } from './CombatSystem.js';

/**
 * 扫描当前楼层并生成概览数据
 * @param {Array} entities - 当前楼层实体列表
 * @param {Object} player - 玩家数据
 * @returns {Object} 楼层概览数据
 */
export function scanFloor(entities, player) {
  const enemies = [];
  const bosses = [];
  const items = [];
  const keys = [];
  const doors = [];
  const companions = [];
  const events = [];
  const interactables = [];
  
  for (const e of entities) {
    if (e.type === ENTITY_TYPE.ENEMY) {
      const canWin = safePreview(player, e);
      enemies.push({
        name: e.name,
        hp: e.hp,
        atk: e.atk,
        def: e.def,
        canWin: canWin.canWin,
        turnsNeeded: canWin.turnsNeeded,
        exp: e.rewards?.exp || 0,
        gold: e.rewards?.gold || 0,
        traits: e.traits || [],
      });
    } else if (e.type === ENTITY_TYPE.BOSS) {
      bosses.push({
        name: e.name,
        hp: e.hp,
        atk: e.atk,
        def: e.def,
      });
    } else if (e.type === ENTITY_TYPE.ITEM) {
      if (e.itemType === 'key') keys.push({ color: e.keyColor, name: e.name });
      else if (e.itemType === 'door') doors.push({ color: e.doorColor, name: e.name });
      else items.push({ name: e.name, type: e.itemType });
    } else if (e.type === ENTITY_TYPE.COMPANION || e.type === ENTITY_TYPE.NPC) {
      companions.push({ name: e.name });
    } else if (e.type === ENTITY_TYPE.EVENT) {
      if (e.interactableType) {
        interactables.push({ name: e.name, type: e.interactableType, sprite: e.sprite });
      } else {
        events.push({ name: e.name });
      }
    }
  }
  
  // 计算可击败的敌人数量
  const defeatable = enemies.filter(e => e.canWin).length;
  const totalExp = enemies.filter(e => e.canWin).reduce((s, e) => s + e.exp, 0);
  const totalGold = enemies.filter(e => e.canWin).reduce((s, e) => s + e.gold, 0);
  
  return {
    enemies,
    bosses,
    items,
    keys,
    doors,
    companions,
    events,
    interactables,
    summary: {
      totalEnemies: enemies.length,
      defeatable,
      undefeatable: enemies.length - defeatable,
      totalBosses: bosses.length,
      totalItems: items.length,
      totalKeys: keys.length,
      totalDoors: doors.length,
      totalInteractables: interactables.length,
      potentialExp: totalExp,
      potentialGold: totalGold,
    },
  };
}

function safePreview(player, enemy) {
  try {
    return previewBattle(player, enemy);
  } catch {
    return { canWin: false, turnsNeeded: 99 };
  }
}

/**
 * 渲染楼层概览面板HTML
 */
export function renderFloorOverview(scanData) {
  const s = scanData.summary;
  
  let html = '<div style="max-width:420px;margin:0 auto;text-align:center;">';
  
  // 敌人概览
  html += '<div style="display:flex;gap:12px;justify-content:center;margin-bottom:12px;">';
  html += `<div style="background:rgba(255,68,68,0.08);border:1px solid #ff444430;border-radius:8px;padding:8px 12px;min-width:80px;">
    <p style="color:#ff4444;font-size:20px;font-weight:bold;">${s.totalEnemies}</p>
    <p style="color:#888;font-size:10px;">敌人</p>
    <p style="color:${s.defeatable === s.totalEnemies ? '#44ff88' : '#ffcc44'};font-size:9px;">${s.defeatable}可击败</p>
  </div>`;
  
  if (s.totalBosses > 0) {
    html += `<div style="background:rgba(255,136,0,0.08);border:1px solid #ff880030;border-radius:8px;padding:8px 12px;min-width:80px;">
      <p style="color:#ff8800;font-size:20px;font-weight:bold;">${s.totalBosses}</p>
      <p style="color:#888;font-size:10px;">Boss</p>
    </div>`;
  }
  
  html += `<div style="background:rgba(68,255,136,0.08);border:1px solid #44ff8830;border-radius:8px;padding:8px 12px;min-width:80px;">
    <p style="color:#44ff88;font-size:20px;font-weight:bold;">${s.totalItems + s.totalInteractables}</p>
    <p style="color:#888;font-size:10px;">资源</p>
  </div>`;
  
  html += `<div style="background:rgba(255,204,68,0.08);border:1px solid #ffcc4430;border-radius:8px;padding:8px 12px;min-width:80px;">
    <p style="color:#ffcc44;font-size:20px;font-weight:bold;">${s.totalKeys}/${s.totalDoors}</p>
    <p style="color:#888;font-size:10px;">钥匙/门</p>
  </div>`;
  html += '</div>';
  
  // 预计收益
  if (s.potentialExp > 0 || s.potentialGold > 0) {
    html += `<div style="background:rgba(255,255,255,0.03);border-radius:6px;padding:6px;margin-bottom:10px;">
      <p style="color:#666;font-size:10px;margin-bottom:2px;">预计收益（击败所有可击败敌人）</p>
      <p style="color:#aa88ff;font-size:12px;">+${s.potentialExp} EXP · +${s.potentialGold} G</p>
    </div>`;
  }
  
  // 钥匙详情
  if (scanData.keys.length > 0) {
    const yellowKeys = scanData.keys.filter(k => k.color === 'yellow').length;
    const blueKeys = scanData.keys.filter(k => k.color === 'blue').length;
    const redKeys = scanData.keys.filter(k => k.color === 'red').length;
    html += '<div style="display:flex;gap:8px;justify-content:center;margin-bottom:8px;">';
    if (yellowKeys > 0) html += `<span style="color:#ffcc44;font-size:11px;">🔑×${yellowKeys}</span>`;
    if (blueKeys > 0) html += `<span style="color:#4488ff;font-size:11px;">🗝×${blueKeys}</span>`;
    if (redKeys > 0) html += `<span style="color:#ff4444;font-size:11px;">🗝×${redKeys}</span>`;
    html += '</div>';
  }
  
  // 交互物列表
  if (scanData.interactables.length > 0) {
    html += '<div style="display:flex;gap:4px;justify-content:center;flex-wrap:wrap;margin-bottom:8px;">';
    for (const ia of scanData.interactables) {
      html += `<span style="color:#aaa;font-size:10px;background:rgba(255,255,255,0.03);padding:2px 6px;border-radius:3px;">${ia.sprite || '?'} ${ia.name}</span>`;
    }
    html += '</div>';
  }
  
  // 不可击败敌人警告
  if (s.undefeatable > 0) {
    html += `<div style="background:rgba(255,68,68,0.06);border:1px solid #ff444420;border-radius:6px;padding:6px;margin-top:8px;">
      <p style="color:#ff4444;font-size:11px;">⚠ ${s.undefeatable}个敌人当前无法击败</p>
      <p style="color:#666;font-size:9px;">建议先提升属性或绕开</p>
    </div>`;
  }
  
  // 全部可击败提示
  if (s.defeatable === s.totalEnemies && s.totalEnemies > 0) {
    html += `<div style="background:rgba(68,255,136,0.06);border:1px solid #44ff8820;border-radius:6px;padding:6px;margin-top:8px;">
      <p style="color:#44ff88;font-size:11px;">✓ 所有敌人均可击败</p>
    </div>`;
  }
  
  html += '</div>';
  return html;
}
