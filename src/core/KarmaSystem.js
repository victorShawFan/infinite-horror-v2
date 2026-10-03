// ═══════════════════════════════════════════════════════════════
// 业力系统 — 道德选择影响结局和战斗
// ═══════════════════════════════════════════════════════════════
//
// 业力值范围: -20 ~ +20
// 正义(>5): 同伴关系加成, 圣光伤害加成, 最终结局A
// 中立(-5~5): 无特殊效果
// 暗黑(<-5): 攻击力加成, 暗影伤害加成, 最终结局B
//
// 业力来源：叙事事件选择、NPC互动、战斗行为

import { gameState } from './GameState.js';

// ── 业力等级 ──
export const KARMA_LEVELS = {
  saintly:  { min: 15,  name: '圣者',   icon: '✦', color: '#ffdd44', desc: '你的善行已传遍轮回世界' },
  virtuous: { min: 8,   name: '正义',   icon: '☀', color: '#44ff88', desc: '你选择了保护弱者的道路' },
  kind:     { min: 3,   name: '善良',   icon: '💚', color: '#88cc44', desc: '你的心中仍有温暖' },
  neutral:  { min: -2,  name: '中立',   icon: '⚖', color: '#888888', desc: '你在善恶之间保持平衡' },
  pragmatic:{ min: -7,  name: '务实',   icon: '🔷', color: '#4488ff', desc: '为达目的，偶尔需要牺牲' },
  dark:     { min: -14, name: '暗黑',   icon: '🌑', color: '#884488', desc: '你已习惯了黑暗中的抉择' },
  fallen:   { min: -999,name: '堕落',   icon: '💀', color: '#ff2222', desc: '你已完全迷失在恐怖之中' },
};

/**
 * 获取当前业力等级
 */
export function getKarmaLevel() {
  const karma = gameState.karma || 0;
  for (const [id, level] of Object.entries(KARMA_LEVELS)) {
    if (karma >= level.min) return { id, ...level, value: karma };
  }
  return { id: 'neutral', ...KARMA_LEVELS.neutral, value: karma };
}

/**
 * 获取业力对战斗的影响
 */
export function getKarmaCombatModifiers() {
  const karma = gameState.karma || 0;
  const mods = {
    atkBonus: 0,
    defBonus: 0,
    healBonus: 0,
    critBonus: 0,
    companionBonus: 0,
    holyDmgBonus: 0,
    darkDmgBonus: 0,
  };
  
  if (karma >= 15) {
    // 圣者：全面加成
    mods.defBonus = 5;
    mods.healBonus = 20; // 治疗效果+20%
    mods.companionBonus = 15; // 同伴效果+15%
    mods.holyDmgBonus = 25; // 圣光伤害+25%
  } else if (karma >= 8) {
    // 正义
    mods.defBonus = 3;
    mods.healBonus = 10;
    mods.companionBonus = 10;
    mods.holyDmgBonus = 15;
  } else if (karma >= 3) {
    // 善良
    mods.healBonus = 5;
    mods.companionBonus = 5;
    mods.holyDmgBonus = 8;
  } else if (karma <= -14) {
    // 堕落：攻击加成但削弱防御
    mods.atkBonus = 8;
    mods.critBonus = 10;
    mods.darkDmgBonus = 25;
    mods.defBonus = -3;
    mods.companionBonus = -15;
  } else if (karma <= -7) {
    // 暗黑
    mods.atkBonus = 5;
    mods.critBonus = 5;
    mods.darkDmgBonus = 15;
    mods.companionBonus = -8;
  } else if (karma <= -2) {
    // 务实
    mods.atkBonus = 2;
    mods.darkDmgBonus = 5;
  }
  
  return mods;
}

/**
 * 获取业力对结局的影响
 */
export function getEndingType() {
  const karma = gameState.karma || 0;
  if (karma >= 10) return { type: 'true_ending', name: '真·结局', desc: '你以善念照亮了轮回的黑暗' };
  if (karma >= 3) return { type: 'good_ending', name: '善终', desc: '你带着温暖离开了这个世界' };
  if (karma >= -3) return { type: 'normal_ending', name: '常规结局', desc: '轮回结束了，但痕迹永存' };
  if (karma >= -10) return { type: 'dark_ending', name: '暗黑结局', desc: '你活下来了，但失去了一些重要的东西' };
  return { type: 'fallen_ending', name: '堕落结局', desc: '你变成了自己最害怕的样子' };
}

/**
 * 渲染业力面板HTML
 */
export function renderKarmaDisplay() {
  const level = getKarmaLevel();
  const karma = level.value;
  const maxKarma = 20;
  const barPct = Math.min(100, ((karma + maxKarma) / (maxKarma * 2)) * 100);
  
  return `<div style="display:flex;align-items:center;gap:6px;">
    <span style="color:${level.color};font-size:12px;">${level.icon} ${level.name}</span>
    <div style="flex:1;height:4px;background:#1a1a1a;border-radius:2px;overflow:hidden;min-width:60px;">
      <div style="height:100%;width:${barPct}%;background:linear-gradient(90deg,#ff4444,#888888 50%,#44ff88);border-radius:2px;"></div>
    </div>
    <span style="color:#666;font-size:10px;">${karma > 0 ? '+' : ''}${karma}</span>
  </div>`;
}

/**
 * 渲染完整业力面板
 */
export function renderKarmaPanel() {
  const level = getKarmaLevel();
  const mods = getKarmaCombatModifiers();
  const ending = getEndingType();
  
  let html = '<div style="max-width:360px;margin:0 auto;text-align:center;">';
  
  // 业力等级
  html += `<div style="margin-bottom:12px;">
    <span style="font-size:28px;">${level.icon}</span>
    <h3 style="color:${level.color};font-size:18px;margin-top:4px;">${level.name}</h3>
    <p style="color:#888;font-size:11px;">${level.desc}</p>
    <p style="color:#666;font-size:10px;margin-top:4px;">业力值: ${level.value > 0 ? '+' : ''}${level.value}</p>
  </div>`;
  
  // 战斗影响
  const activeEffects = [];
  if (mods.atkBonus) activeEffects.push(`ATK ${mods.atkBonus > 0 ? '+' : ''}${mods.atkBonus}`);
  if (mods.defBonus) activeEffects.push(`DEF ${mods.defBonus > 0 ? '+' : ''}${mods.defBonus}`);
  if (mods.critBonus) activeEffects.push(`CRT +${mods.critBonus}%`);
  if (mods.healBonus) activeEffects.push(`治疗 +${mods.healBonus}%`);
  if (mods.companionBonus) activeEffects.push(`同伴 ${mods.companionBonus > 0 ? '+' : ''}${mods.companionBonus}%`);
  if (mods.holyDmgBonus) activeEffects.push(`圣光 +${mods.holyDmgBonus}%`);
  if (mods.darkDmgBonus) activeEffects.push(`暗影 +${mods.darkDmgBonus}%`);
  
  if (activeEffects.length > 0) {
    html += `<div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:8px;margin-bottom:10px;">
      <p style="color:#888;font-size:10px;margin-bottom:4px;">战斗影响</p>
      <p style="color:${level.color};font-size:12px;">${activeEffects.join(' · ')}</p>
    </div>`;
  }
  
  // 预计结局
  html += `<div style="background:rgba(255,204,68,0.05);border:1px solid #ffcc4420;border-radius:8px;padding:8px;">
    <p style="color:#666;font-size:9px;">预计结局走向</p>
    <p style="color:#ffcc44;font-size:12px;">${ending.name}</p>
    <p style="color:#555;font-size:10px;">${ending.desc}</p>
  </div>`;
  
  html += '</div>';
  return html;
}
