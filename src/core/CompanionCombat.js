// ═══════════════════════════════════════════════════════════════
// 同伴战斗支援系统 — 同伴根据关系等级提供战斗援助
// ═══════════════════════════════════════════════════════════════
import { gameState } from './GameState.js';
import { getRelationshipLevel, COMPANION_PROFILES } from './RelationshipSystem.js';
import { eventBus } from './EventBus.js';

// ── 同伴战斗技能 ──
const COMPANION_SKILLS = {
  zhang_jie: {
    name: '张杰',
    skills: [
      { level: 1, name: '战术指挥', desc: 'ATK+5%', effect: { atkPct: 0.05 }, icon: '🎯' },
      { level: 2, name: '精准分析', desc: '暴击+3%', effect: { crt: 3 }, icon: '📊' },
      { level: 3, name: '队长鼓舞', desc: '全属性+3', effect: { allStats: 3 }, icon: '⚡' },
      { level: 4, name: '极限突破', desc: '致命一击概率+8%', effect: { crt: 8 }, icon: '💥' },
    ]
  },
  zhan_lan: {
    name: '詹岚',
    skills: [
      { level: 1, name: '弱点扫描', desc: 'DEF穿透+5%', effect: { armorPen: 0.05 }, icon: '🔍' },
      { level: 2, name: '情报共享', desc: '额外经验+10%', effect: { expBonus: 0.1 }, icon: '📋' },
      { level: 3, name: '战术预判', desc: 'SPD+3', effect: { spd: 3 }, icon: '🧠' },
      { level: 4, name: '致命标记', desc: '暴击伤害+20%', effect: { critDmgBonus: 0.2 }, icon: '🎯' },
    ]
  },
  li_xiaoyi: {
    name: '李萧毅',
    skills: [
      { level: 1, name: '火力掩护', desc: 'ATK+3', effect: { atk: 3 }, icon: '🔫' },
      { level: 2, name: '弹幕压制', desc: '敌人ATK-5%', effect: { enemyAtkReduction: 0.05 }, icon: '💫' },
      { level: 3, name: '精准射击', desc: '暴击+5%', effect: { crt: 5 }, icon: '🎯' },
      { level: 4, name: '全力支援', desc: 'ATK+6, SPD+2', effect: { atk: 6, spd: 2 }, icon: '⚡' },
    ]
  },
  mou_gang: {
    name: '牟钢',
    skills: [
      { level: 1, name: '铁壁守护', desc: 'DEF+3', effect: { def: 3 }, icon: '🛡' },
      { level: 2, name: '生命共鸣', desc: 'MaxHP+20', effect: { maxHp: 20 }, icon: '❤' },
      { level: 3, name: '钢铁意志', desc: 'DEF+5, 抗暴击', effect: { def: 5 }, icon: '💪' },
      { level: 4, name: '不屈壁垒', desc: 'DEF+8, MaxHP+30', effect: { def: 8, maxHp: 30 }, icon: '🏰' },
    ]
  },
  chu_xuan: {
    name: '楚轩',
    skills: [
      { level: 1, name: '推演计算', desc: '敌人DEF-5%', effect: { enemyDefReduction: 0.05 }, icon: '🧮' },
      { level: 2, name: '战局模拟', desc: 'ATK+4, CRT+3%', effect: { atk: 4, crt: 3 }, icon: '🎲' },
      { level: 3, name: '弱点暴露', desc: '穿甲+10%', effect: { armorPen: 0.1 }, icon: '🔬' },
      { level: 4, name: '必胜算式', desc: '暴击+10%, ATK+6', effect: { crt: 10, atk: 6 }, icon: '♟' },
    ]
  },
  luo_gandao: {
    name: '罗甘道',
    skills: [
      { level: 1, name: '军人直觉', desc: 'SPD+2', effect: { spd: 2 }, icon: '⚡' },
      { level: 2, name: '近战压制', desc: 'ATK+5', effect: { atk: 5 }, icon: '⚔' },
      { level: 3, name: '铁血战意', desc: 'ATK+5%, MaxHP+25', effect: { atkPct: 0.05, maxHp: 25 }, icon: '🩸' },
      { level: 4, name: '不退军魂', desc: 'ATK+8, DEF+6, SPD+3', effect: { atk: 8, def: 6, spd: 3 }, icon: '🎖' },
    ]
  },
};

// ── 获取当前同伴战斗加成 ──
export function getCompanionCombatBonuses() {
  const companions = gameState.companions || [];
  const bonuses = {
    atk: 0, def: 0, maxHp: 0, spd: 0, crt: 0,
    atkPct: 0, armorPen: 0, expBonus: 0,
    critDmgBonus: 0, enemyAtkReduction: 0, enemyDefReduction: 0,
    activeSkills: [],
  };

  for (const comp of companions) {
    if (!comp.alive) continue;
    const skillDef = COMPANION_SKILLS[comp.id];
    if (!skillDef) continue;

    const relLevel = getRelationshipLevel(comp.id, gameState.relationships) || 0;
    
    for (const skill of skillDef.skills) {
      if (relLevel >= skill.level) {
        const e = skill.effect;
        if (e.atk) bonuses.atk += e.atk;
        if (e.def) bonuses.def += e.def;
        if (e.maxHp) bonuses.maxHp += e.maxHp;
        if (e.spd) bonuses.spd += e.spd;
        if (e.crt) bonuses.crt += e.crt;
        if (e.atkPct) bonuses.atkPct += e.atkPct;
        if (e.armorPen) bonuses.armorPen += e.armorPen;
        if (e.expBonus) bonuses.expBonus += e.expBonus;
        if (e.critDmgBonus) bonuses.critDmgBonus += e.critDmgBonus;
        if (e.enemyAtkReduction) bonuses.enemyAtkReduction += e.enemyAtkReduction;
        if (e.enemyDefReduction) bonuses.enemyDefReduction += e.enemyDefReduction;
        if (e.allStats) {
          bonuses.atk += e.allStats;
          bonuses.def += e.allStats;
          bonuses.spd += e.allStats;
        }
        bonuses.activeSkills.push({
          companion: skillDef.name,
          skill: skill.name,
          desc: skill.desc,
          icon: skill.icon,
        });
      }
    }
  }

  return bonuses;
}

// ── 格式化同伴支援面板 ──
export function formatCompanionCombatHTML() {
  const companions = gameState.companions || [];
  if (companions.length === 0) return '<p style="color:#444;font-size:12px;">暂无同伴</p>';

  let html = '';
  for (const comp of companions) {
    const skillDef = COMPANION_SKILLS[comp.id];
    if (!skillDef) continue;
    const relLevel = getRelationshipLevel(comp.id, gameState.relationships) || 0;
    const alive = comp.alive;

    html += `<div style="margin-bottom:8px;padding:8px;background:rgba(255,255,255,0.02);
      border:1px solid ${alive ? '#44668833' : '#44444433'};border-radius:6px;
      ${!alive ? 'opacity:0.5;' : ''}">
      <p style="color:${alive ? '#88bbff' : '#666'};font-size:12px;font-weight:bold;">
        ${skillDef.name} ${!alive ? '(已阵亡)' : ''} — 关系Lv.${relLevel}
      </p>`;
    
    for (const skill of skillDef.skills) {
      const active = alive && relLevel >= skill.level;
      html += `<p style="color:${active ? '#44ff88' : '#444'};font-size:10px;margin-top:2px;">
        ${active ? '✓' : '○'} Lv.${skill.level}: ${skill.icon} ${skill.name} — ${skill.desc}
      </p>`;
    }
    
    html += '</div>';
  }
  return html;
}

// ── 战斗开始时的同伴喊话 ──
export function getCompanionBattleCry(enemyName) {
  const companions = gameState.companions?.filter(c => c.alive) || [];
  if (companions.length === 0) return null;
  
  const cries = {
    zhang_jie: [`全队注意！${enemyName}来了，按计划行动！`, '保持阵型，不要慌！', '分析弱点，找准时机！'],
    zhan_lan: ['我来分析它的弱点...', `${enemyName}...让我查查数据。`, '小心，这个敌人不简单。'],
    li_xiaoyi: ['掩护你！', '我来火力支援！', '准备好了，随时射击！'],
    mou_gang: ['有我在后面挡着！', '放心打，我守住防线。', '冲吧！我来断后！'],
    chu_xuan: ['根据推演，胜率...尚可。', '按我说的策略来。', '这一步棋...有意思。'],
    luo_gandao: ['跟我冲！', '士兵不会后退！', '让他看看真正的战斗！'],
  };
  
  const aliveComps = companions.filter(c => cries[c.id]);
  if (aliveComps.length === 0) return null;
  const chosen = aliveComps[Math.floor(Math.random() * aliveComps.length)];
  const lines = cries[chosen.id];
  return {
    speaker: COMPANION_PROFILES[chosen.id]?.name || chosen.name,
    text: lines[Math.floor(Math.random() * lines.length)],
  };
}
