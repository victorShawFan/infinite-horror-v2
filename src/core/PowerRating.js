// ═══════════════════════════════════════════════════════════════
// 战力评估系统 — 单一数值代表角色综合战斗力
// ═══════════════════════════════════════════════════════════════
//
// 战力 = ATK×2 + DEF×1.5 + HP×0.05 + SPD×1.8 + CRT×0.8
//       + 装备评分 + 技能评分 + 基因锁评分 + 天赋评分
//
// 敌人战力同理，用于预战判断
// ═══════════════════════════════════════════════════════════════

import { getEffectiveAtk, getEffectiveDef, getEffectiveSpd, getEffectiveCrt } from './CombatSystem.js';
import { gameState } from './GameState.js';
import { getAvailableSkills } from './SkillSystem.js';
import { getTalentEffects } from './TalentTree.js';
import { getGeneLockProgress } from './GeneLockSystem.js';
import { getEquipmentTotalStats } from './EquipmentSystem.js';

// ── 计算玩家战力 ──
export function getPlayerPowerRating(player) {
  const p = player || gameState.player;
  const atk = getEffectiveAtk(p);
  const def = getEffectiveDef(p);
  const spd = getEffectiveSpd(p);
  const crt = getEffectiveCrt(p);
  
  const basePR = Math.floor(
    atk * 2.0 +
    def * 1.5 +
    p.maxHp * 0.05 +
    spd * 1.8 +
    crt * 0.8
  );
  
  // 装备评分
  let equipScore = 0;
  for (const slot of ['weapon', 'armor', 'accessory']) {
    const eq = p[slot];
    if (!eq) continue;
    const stats = getEquipmentTotalStats(eq);
    equipScore += (stats.atk || 0) * 2 + (stats.def || 0) * 1.5 + (stats.maxHp || 0) * 0.05 + (stats.spd || 0) * 1.8 + (stats.crt || 0) * 0.8;
    equipScore += (eq.enhanceLevel || 0) * 5;
  }
  
  // 技能评分
  let skillScore = 0;
  try {
    const skills = getAvailableSkills(p);
    skillScore = skills.length * 15;
  } catch {}
  
  // 基因锁评分
  let geneLockScore = 0;
  try {
    const gl = getGeneLockProgress(p);
    geneLockScore = (gl.level || 0) * 50;
  } catch {}
  
  // 天赋评分
  let talentScore = 0;
  try {
    const t = getTalentEffects(gameState.talents);
    if (t) {
      talentScore = Object.values(gameState.talents.allocated || {}).reduce((a, b) => a + b, 0) * 10;
    }
  } catch {}
  
  const total = basePR + Math.floor(equipScore) + skillScore + geneLockScore + talentScore;
  
  return {
    total,
    base: basePR,
    equipment: Math.floor(equipScore),
    skills: skillScore,
    geneLock: geneLockScore,
    talent: talentScore,
    stats: { atk, def, hp: p.maxHp, spd, crt },
    rank: getPowerRank(total),
  };
}

// ── 计算敌人战力 ──
export function getEnemyPowerRating(enemy) {
  if (!enemy) return { total: 0, rank: { name: '?', color: '#666' } };
  
  const total = Math.floor(
    (enemy.atk || 0) * 2.0 +
    (enemy.def || 0) * 1.5 +
    (enemy.hp || 0) * 0.05 +
    (enemy.spd || 0) * 1.8 +
    (enemy.bossId ? 80 : 0) +  // Boss加成
    ((enemy.traits || []).length * 20) +  // 特性加成
    ((enemy.rewards?.rewardPoints || 0) * 0.1)
  );
  
  return { total, rank: getPowerRank(total) };
}

// ── 战力等级 ──
function getPowerRank(pr) {
  if (pr >= 800) return { name: 'SSS', color: '#ff2222', desc: '神级' };
  if (pr >= 600) return { name: 'SS',  color: '#ff6622', desc: '传说' };
  if (pr >= 450) return { name: 'S',   color: '#ffaa22', desc: '卓越' };
  if (pr >= 320) return { name: 'A',   color: '#ffcc44', desc: '精英' };
  if (pr >= 220) return { name: 'B',   color: '#44ff88', desc: '老练' };
  if (pr >= 140) return { name: 'C',   color: '#44aaff', desc: '熟练' };
  if (pr >= 80)  return { name: 'D',   color: '#8888ff', desc: '普通' };
  return { name: 'E',   color: '#888888', desc: '新手' };
}

// ── 战力对比 ──
export function comparePower(player, enemy) {
  const pPR = getPlayerPowerRating(player);
  const ePR = getEnemyPowerRating(enemy);
  const ratio = ePR.total > 0 ? pPR.total / ePR.total : 999;
  
  let verdict, verdictColor, verdictIcon;
  if (ratio >= 2.0) { verdict = '碾压'; verdictColor = '#44ff88'; verdictIcon = '💪'; }
  else if (ratio >= 1.3) { verdict = '优势'; verdictColor = '#88ff44'; verdictIcon = '✓'; }
  else if (ratio >= 0.9) { verdict = '势均力敌'; verdictColor = '#ffcc44'; verdictIcon = '⚖'; }
  else if (ratio >= 0.6) { verdict = '劣势'; verdictColor = '#ff8844'; verdictIcon = '⚠'; }
  else { verdict = '极度危险'; verdictColor = '#ff2222'; verdictIcon = '☠'; }
  
  return {
    player: pPR,
    enemy: ePR,
    ratio,
    verdict,
    verdictColor,
    verdictIcon,
  };
}

// ── 格式化战力显示 ──
export function formatPowerRating(pr) {
  return `${pr.rank.name} (${pr.total})`;
}
