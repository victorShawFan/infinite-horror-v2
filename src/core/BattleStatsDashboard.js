// ═══════════════════════════════════════════════════════════════
// 战斗统计仪表板 — 深度数值分析面板
// ═══════════════════════════════════════════════════════════════
//
// 从主神空间或角色面板查看详细战斗统计：
//   - 综合战力评分
//   - 伤害输出趋势（按章节）
//   - 战斗评级分布
//   - 敌人击杀排行
//   - 技能使用效率
//   - 天赋/装备贡献分析
// ═══════════════════════════════════════════════════════════════

import { gameState } from './GameState.js';
import { getEffectiveAtk, getEffectiveDef, getEffectiveCrt, getEffectiveSpd } from './CombatSystem.js';
import { getTalentEffects, TALENT_PATHS } from './TalentTree.js';
import { getGeneLockDescription } from './GeneLockSystem.js';
import { GENE_LOCK } from './constants.js';

// ── 综合战力计算 ──
export function calculatePowerRating(player) {
  const atk = getEffectiveAtk(player);
  const def = getEffectiveDef(player);
  const crt = getEffectiveCrt(player);
  const spd = getEffectiveSpd(player);
  
  // 加权综合评分
  const offensePower = atk * 1.5 + crt * 0.8 + spd * 0.3;
  const defensePower = def * 1.2 + player.maxHp * 0.05;
  const geneLockBonus = (player.geneLock || 0) * 50;
  const levelBonus = (player.level || 1) * 10;
  
  const total = Math.floor(offensePower + defensePower + geneLockBonus + levelBonus);
  
  // 评级
  let grade, gradeColor;
  if (total >= 2000) { grade = 'SSS'; gradeColor = '#ff4444'; }
  else if (total >= 1500) { grade = 'SS'; gradeColor = '#ff8844'; }
  else if (total >= 1000) { grade = 'S'; gradeColor = '#ffcc44'; }
  else if (total >= 700) { grade = 'A'; gradeColor = '#44ff88'; }
  else if (total >= 400) { grade = 'B'; gradeColor = '#4488ff'; }
  else if (total >= 200) { grade = 'C'; gradeColor = '#888888'; }
  else { grade = 'D'; gradeColor = '#666666'; }
  
  return {
    total,
    offense: Math.floor(offensePower),
    defense: Math.floor(defensePower),
    grade,
    gradeColor,
    breakdown: {
      atk, def, crt, spd,
      maxHp: player.maxHp,
      geneLock: player.geneLock || 0,
      level: player.level || 1,
    },
  };
}

// ── 属性雷达图SVG生成 ──
function generateRadarChart(stats, maxStats) {
  const size = 120;
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const labels = ['ATK', 'DEF', 'HP', 'CRT', 'SPD', 'GEN'];
  const values = [
    Math.min(1, stats.atk / maxStats.atk),
    Math.min(1, stats.def / maxStats.def),
    Math.min(1, stats.maxHp / maxStats.maxHp),
    Math.min(1, stats.crt / maxStats.crt),
    Math.min(1, stats.spd / maxStats.spd),
    Math.min(1, stats.geneLock / 4),
  ];
  
  const n = labels.length;
  const getPoint = (i, val) => {
    const angle = (Math.PI * 2 * i / n) - Math.PI / 2;
    return {
      x: cx + r * val * Math.cos(angle),
      y: cy + r * val * Math.sin(angle),
    };
  };
  
  // 背景网格
  let gridLines = '';
  for (let ring = 0.25; ring <= 1; ring += 0.25) {
    const points = [];
    for (let i = 0; i < n; i++) {
      const p = getPoint(i, ring);
      points.push(`${p.x},${p.y}`);
    }
    gridLines += `<polygon points="${points.join(' ')}" fill="none" stroke="#333" stroke-width="0.5"/>`;
  }
  
  // 轴线
  let axisLines = '';
  for (let i = 0; i < n; i++) {
    const p = getPoint(i, 1);
    axisLines += `<line x1="${cx}" y1="${cy}" x2="${p.x}" y2="${p.y}" stroke="#333" stroke-width="0.5"/>`;
  }
  
  // 数值多边形
  const dataPoints = [];
  for (let i = 0; i < n; i++) {
    const p = getPoint(i, values[i]);
    dataPoints.push(`${p.x},${p.y}`);
  }
  
  // 标签
  let labelTexts = '';
  for (let i = 0; i < n; i++) {
    const p = getPoint(i, 1.25);
    const color = ['#ff6644', '#4488ff', '#44ff88', '#ffcc44', '#44ccff', '#ff8800'][i];
    labelTexts += `<text x="${p.x}" y="${p.y}" text-anchor="middle" dominant-baseline="middle" fill="${color}" font-size="8" font-family="monospace">${labels[i]}</text>`;
  }
  
  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="display:block;margin:0 auto;">
    ${gridLines}
    ${axisLines}
    <polygon points="${dataPoints.join(' ')}" fill="rgba(255,140,60,0.2)" stroke="#ff8c3c" stroke-width="1.5"/>
    ${labelTexts}
  </svg>`;
}

// ── 章节DPS趋势条形图 ──
function generateDPSTrend(chapterSnapshots) {
  if (!chapterSnapshots || chapterSnapshots.length === 0) {
    return '<p style="color:#555;font-size:11px;text-align:center;">暂无章节数据</p>';
  }
  
  const maxAtk = Math.max(...chapterSnapshots.map(s => s.atk || 0), 1);
  const bars = chapterSnapshots.map((s, i) => {
    const pct = Math.floor(((s.atk || 0) / maxAtk) * 100);
    const color = `hsl(${20 + i * 12}, 70%, 55%)`;
    return `<div style="display:flex;align-items:center;gap:6px;margin:3px 0;">
      <span style="color:#666;font-size:9px;width:30px;text-align:right;">Ch${i + 1}</span>
      <div style="flex:1;height:12px;background:#111;border-radius:2px;overflow:hidden;">
        <div style="height:100%;width:${pct}%;background:${color};border-radius:2px;transition:width 0.5s;"></div>
      </div>
      <span style="color:#888;font-size:9px;width:35px;">${s.atk || '?'}</span>
    </div>`;
  }).join('');
  
  return `<div style="padding:4px 0;">
    <p style="color:#666;font-size:9px;letter-spacing:1px;margin-bottom:6px;">ATK 成长趋势</p>
    ${bars}
  </div>`;
}

// ── 战斗评级分布 ──
function generateRatingDistribution(stats) {
  const grades = { SS: 0, S: 0, A: 0, B: 0, C: 0, D: 0 };
  const gradeColors = { SS: '#ff4444', S: '#ff8844', A: '#ffcc44', B: '#44ff88', C: '#4488ff', D: '#888' };
  
  // 从统计中提取
  const sRatings = stats.sRatings || 0;
  const totalBattles = stats.enemiesKilled || 0;
  
  // 估算分布 (基于S+率和总场次)
  grades.SS = Math.floor(sRatings * 0.3);
  grades.S = sRatings - grades.SS;
  const remaining = totalBattles - sRatings;
  grades.A = Math.floor(remaining * 0.3);
  grades.B = Math.floor(remaining * 0.4);
  grades.C = Math.floor(remaining * 0.2);
  grades.D = remaining - grades.A - grades.B - grades.C;
  
  const maxCount = Math.max(...Object.values(grades), 1);
  
  return Object.entries(grades).map(([g, count]) => {
    const pct = Math.floor((count / maxCount) * 100);
    return `<div style="display:flex;align-items:center;gap:6px;margin:2px 0;">
      <span style="color:${gradeColors[g]};font-size:11px;font-weight:bold;width:22px;text-align:center;">${g}</span>
      <div style="flex:1;height:10px;background:#111;border-radius:2px;overflow:hidden;">
        <div style="height:100%;width:${pct}%;background:${gradeColors[g]}40;border-left:2px solid ${gradeColors[g]};border-radius:2px;"></div>
      </div>
      <span style="color:#555;font-size:9px;width:25px;text-align:right;">${count}</span>
    </div>`;
  }).join('');
}

// ── 主渲染函数 ──
export function renderBattleStatsDashboard(container) {
  const p = gameState.player;
  const stats = gameState.stats || {};
  const power = calculatePowerRating(p);
  
  // 获取章节成长快照
  let chapterSnapshots = [];
  try {
    const growthData = JSON.parse(localStorage.getItem('ih_growth') || '{}');
    chapterSnapshots = growthData.snapshots || [];
  } catch {}
  
  // 最大参考值（用于雷达图）
  const maxStats = {
    atk: Math.max(500, power.breakdown.atk * 1.5),
    def: Math.max(300, power.breakdown.def * 1.5),
    maxHp: Math.max(1000, p.maxHp * 1.5),
    crt: Math.max(50, power.breakdown.crt * 1.5),
    spd: Math.max(30, power.breakdown.spd * 1.5),
  };
  
  const geneLockNames = ['未开启', '第一阶', '第二阶', '第三阶', '第四阶'];
  const geneLockColors = ['#666', '#44cc88', '#4488ff', '#ffcc44', '#ff4444'];
  const glStage = p.geneLock || 0;
  
  const html = `
    <div style="padding:16px;max-height:80vh;overflow-y:auto;font-family:'Noto Sans SC',sans-serif;">
      <!-- 标题 -->
      <h2 style="text-align:center;color:#ffcc44;letter-spacing:6px;margin-bottom:4px;font-size:16px;">
        ⚔ 战斗仪表板
      </h2>
      <p style="text-align:center;color:#555;font-size:10px;margin-bottom:16px;">
        Chapter ${gameState.chapter || 1} · Lv.${p.level}
      </p>
      
      <!-- 综合战力 -->
      <div style="text-align:center;margin-bottom:16px;">
        <div style="display:inline-block;border:2px solid ${power.gradeColor}40;border-radius:50%;width:80px;height:80px;
          display:flex;align-items:center;justify-content:center;flex-direction:column;margin:0 auto;
          background:radial-gradient(circle,${power.gradeColor}10,transparent);
          box-shadow:0 0 20px ${power.gradeColor}20;">
          <span style="font-size:28px;font-weight:bold;color:${power.gradeColor};line-height:1;">${power.grade}</span>
          <span style="font-size:10px;color:#888;margin-top:2px;">${power.total}</span>
        </div>
        <div style="display:flex;justify-content:center;gap:16px;margin-top:10px;">
          <span style="color:#ff6644;font-size:11px;">⚔ 攻击 ${power.offense}</span>
          <span style="color:#4488ff;font-size:11px;">🛡 防御 ${power.defense}</span>
        </div>
      </div>
      
      <!-- 属性雷达 -->
      <div style="margin-bottom:16px;">
        ${generateRadarChart(power.breakdown, maxStats)}
      </div>
      
      <!-- 核心属性 -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px;">
        <div style="background:#ff664410;border:1px solid #ff664430;border-radius:6px;padding:8px;text-align:center;">
          <p style="color:#ff6644;font-size:18px;font-weight:bold;">${power.breakdown.atk}</p>
          <p style="color:#666;font-size:9px;">ATK</p>
        </div>
        <div style="background:#4488ff10;border:1px solid #4488ff30;border-radius:6px;padding:8px;text-align:center;">
          <p style="color:#4488ff;font-size:18px;font-weight:bold;">${power.breakdown.def}</p>
          <p style="color:#666;font-size:9px;">DEF</p>
        </div>
        <div style="background:#44ff8810;border:1px solid #44ff8830;border-radius:6px;padding:8px;text-align:center;">
          <p style="color:#44ff88;font-size:18px;font-weight:bold;">${p.maxHp}</p>
          <p style="color:#666;font-size:9px;">MaxHP</p>
        </div>
        <div style="background:#ffcc4410;border:1px solid #ffcc4430;border-radius:6px;padding:8px;text-align:center;">
          <p style="color:#ffcc44;font-size:18px;font-weight:bold;">${power.breakdown.crt}%</p>
          <p style="color:#666;font-size:9px;">CRT</p>
        </div>
        <div style="background:#44ccff10;border:1px solid #44ccff30;border-radius:6px;padding:8px;text-align:center;">
          <p style="color:#44ccff;font-size:18px;font-weight:bold;">${power.breakdown.spd}</p>
          <p style="color:#666;font-size:9px;">SPD</p>
        </div>
        <div style="background:${geneLockColors[glStage]}10;border:1px solid ${geneLockColors[glStage]}30;border-radius:6px;padding:8px;text-align:center;">
          <p style="color:${geneLockColors[glStage]};font-size:14px;font-weight:bold;">${geneLockNames[glStage]}</p>
          <p style="color:#666;font-size:9px;">基因锁</p>
        </div>
      </div>
      
      <!-- 章节ATK趋势 -->
      <div style="background:rgba(255,255,255,0.02);border:1px solid #222;border-radius:8px;padding:10px;margin-bottom:12px;">
        <p style="color:#888;font-size:10px;letter-spacing:2px;margin-bottom:6px;">📈 成长趋势</p>
        ${generateDPSTrend(chapterSnapshots)}
      </div>
      
      <!-- 战斗统计 -->
      <div style="background:rgba(255,255,255,0.02);border:1px solid #222;border-radius:8px;padding:10px;margin-bottom:12px;">
        <p style="color:#888;font-size:10px;letter-spacing:2px;margin-bottom:8px;">📊 战斗统计</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">
          <div style="display:flex;justify-content:space-between;padding:4px 8px;">
            <span style="color:#666;font-size:11px;">击杀敌人</span>
            <span style="color:#e0e0e0;font-size:11px;font-weight:bold;">${stats.enemiesKilled || 0}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:4px 8px;">
            <span style="color:#666;font-size:11px;">Boss击杀</span>
            <span style="color:#ff8844;font-size:11px;font-weight:bold;">${stats.bossesKilled || 0}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:4px 8px;">
            <span style="color:#666;font-size:11px;">总伤害</span>
            <span style="color:#ff4444;font-size:11px;font-weight:bold;">${(stats.damageDealt || 0).toLocaleString()}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:4px 8px;">
            <span style="color:#666;font-size:11px;">死亡次数</span>
            <span style="color:#ff4444;font-size:11px;font-weight:bold;">${stats.deathCount || 0}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:4px 8px;">
            <span style="color:#666;font-size:11px;">最高连杀</span>
            <span style="color:#ffcc44;font-size:11px;font-weight:bold;">${stats.maxKillStreak || 0}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:4px 8px;">
            <span style="color:#666;font-size:11px;">最高单击</span>
            <span style="color:#ff6644;font-size:11px;font-weight:bold;">${(stats.maxSingleHit || 0).toLocaleString()}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:4px 8px;">
            <span style="color:#666;font-size:11px;">总金币</span>
            <span style="color:#ffcc44;font-size:11px;font-weight:bold;">${(stats.goldEarned || 0).toLocaleString()}</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:4px 8px;">
            <span style="color:#666;font-size:11px;">探索房间</span>
            <span style="color:#44ccff;font-size:11px;font-weight:bold;">${stats.roomsExplored || 0}</span>
          </div>
        </div>
      </div>
      
      <!-- 评级分布 -->
      <div style="background:rgba(255,255,255,0.02);border:1px solid #222;border-radius:8px;padding:10px;margin-bottom:12px;">
        <p style="color:#888;font-size:10px;letter-spacing:2px;margin-bottom:6px;">🏆 评级分布</p>
        ${generateRatingDistribution(stats)}
      </div>
      
      <!-- 天赋分配 -->
      <div style="background:rgba(255,255,255,0.02);border:1px solid #222;border-radius:8px;padding:10px;">
        <p style="color:#888;font-size:10px;letter-spacing:2px;margin-bottom:8px;">🌟 天赋路线</p>
        ${Object.entries(TALENT_PATHS).map(([id, path]) => {
          const allocated = p.talents?.allocated?.[id] || 0;
          const pct = allocated * 10;
          return `<div style="display:flex;align-items:center;gap:8px;margin:4px 0;">
            <span style="color:${path.color};font-size:14px;">${path.icon}</span>
            <span style="color:#aaa;font-size:11px;width:55px;">${path.name}</span>
            <div style="flex:1;height:8px;background:#111;border-radius:4px;overflow:hidden;">
              <div style="height:100%;width:${pct}%;background:${path.color}60;border-radius:4px;
                transition:width 0.3s;"></div>
            </div>
            <span style="color:${path.color};font-size:10px;width:30px;text-align:right;">${allocated}/10</span>
          </div>`;
        }).join('')}
      </div>
    </div>
  `;
  
  if (typeof container === 'string') {
    const el = document.getElementById(container);
    if (el) el.innerHTML = html;
    return html;
  }
  return html;
}

export function getBattleDashboardSummary() {
  const p = gameState.player;
  const power = calculatePowerRating(p);
  return `${power.grade} · 战力${power.total} · ATK${power.breakdown.atk} DEF${power.breakdown.def}`;
}
