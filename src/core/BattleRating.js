// ═══════════════════════════════════════════════════════════════
// 战斗评级系统 — 每场战斗给出S/A/B/C/D评级
// ═══════════════════════════════════════════════════════════════
//
// 评级因素：
//   1. 剩余HP百分比 (越高越好)
//   2. 战斗回合数 (越少越好)
//   3. 暴击率 (越高越好)
//   4. 是否满血通过 (完美加分)
//
// 分数: 0~100
//   S: 90+  金色  "完美作战"
//   A: 75+  紫色  "出色发挥"
//   B: 55+  蓝色  "表现良好"
//   C: 35+  绿色  "尚需努力"
//   D: <35  灰色  "险胜"
// ═══════════════════════════════════════════════════════════════

import { eventBus } from './EventBus.js';

const GRADE_CONFIG = [
  { grade: 'S', minScore: 90, color: '#ffdd00', glow: '#ffaa00', label: '完美作战', icon: '⭐' },
  { grade: 'A', minScore: 75, color: '#aa44ff', glow: '#8833cc', label: '出色发挥', icon: '✦' },
  { grade: 'B', minScore: 55, color: '#4488ff', glow: '#3366cc', label: '表现良好', icon: '●' },
  { grade: 'C', minScore: 35, color: '#44cc66', glow: '#338844', label: '尚需努力', icon: '◆' },
  { grade: 'D', minScore: 0,  color: '#888888', glow: '#555555', label: '险胜', icon: '◇' },
];

export function rateBattle(result, player) {
  let score = 0;

  // 1. HP残留分 (40分满)
  const hpPct = player.hp / player.maxHp;
  score += Math.floor(hpPct * 40);

  // 2. 回合效率分 (30分满) - 基线8回合内满分
  const roundBonus = Math.max(0, 30 - (result.rounds - 3) * 4);
  score += Math.min(30, roundBonus);

  // 3. 暴击表现 (15分满)
  const crits = (result.log || []).filter(l => l.type === 'critical').length;
  score += Math.min(15, crits * 5);

  // 4. 完美奖分
  if (hpPct >= 1.0) score += 10; // 满血
  else if (hpPct >= 0.9) score += 5; // 几乎满血

  // 5. Boss奖分
  if (result.isBoss) score += 5;

  // 限制在0~100
  score = Math.min(100, Math.max(0, score));

  // 确定评级
  let gradeInfo = GRADE_CONFIG[GRADE_CONFIG.length - 1];
  for (const g of GRADE_CONFIG) {
    if (score >= g.minScore) {
      gradeInfo = g;
      break;
    }
  }

  const rating = {
    score,
    grade: gradeInfo.grade,
    color: gradeInfo.color,
    glow: gradeInfo.glow,
    label: gradeInfo.label,
    icon: gradeInfo.icon,
    hpPct: Math.floor(hpPct * 100),
    rounds: result.rounds,
    crits,
  };

  eventBus.emit('battle:rated', rating);
  return rating;
}

// ── 累积统计 ──
const ratingStats = { S: 0, A: 0, B: 0, C: 0, D: 0, total: 0, totalScore: 0 };

export function recordRating(rating) {
  ratingStats[rating.grade] = (ratingStats[rating.grade] || 0) + 1;
  ratingStats.total++;
  ratingStats.totalScore += rating.score;
}

export function getRatingStats() {
  return {
    ...ratingStats,
    avgScore: ratingStats.total > 0 ? Math.floor(ratingStats.totalScore / ratingStats.total) : 0,
    bestGrade: ratingStats.S > 0 ? 'S' : ratingStats.A > 0 ? 'A' : ratingStats.B > 0 ? 'B' : ratingStats.C > 0 ? 'C' : 'D',
  };
}

export function resetRatingStats() {
  ratingStats.S = 0; ratingStats.A = 0; ratingStats.B = 0;
  ratingStats.C = 0; ratingStats.D = 0;
  ratingStats.total = 0; ratingStats.totalScore = 0;
}

// ── 生成评级显示HTML ──
export function formatRatingHTML(rating) {
  return `
    <div style="text-align: center; margin: 12px 0;">
      <div style="
        display: inline-block; width: 64px; height: 64px; line-height: 64px;
        font-size: 36px; font-weight: 900; letter-spacing: 2px;
        color: ${rating.color};
        text-shadow: 0 0 20px ${rating.glow}, 0 0 40px ${rating.glow}40;
        border: 2px solid ${rating.color}60;
        border-radius: 12px;
        background: rgba(0,0,0,0.4);
      ">${rating.grade}</div>
      <p style="color: ${rating.color}; font-size: 13px; margin-top: 6px; letter-spacing: 2px;">
        ${rating.icon} ${rating.label}
      </p>
      <p style="color: #666; font-size: 11px;">
        评分 ${rating.score}/100 · HP ${rating.hpPct}% · ${rating.rounds}回合 · ${rating.crits}暴击
      </p>
    </div>
  `;
}

export { GRADE_CONFIG };
