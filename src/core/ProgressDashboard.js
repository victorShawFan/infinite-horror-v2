// ═══════════════════════════════════════════════════════════════
// 成长仪表盘 — 数据驱动的角色进化可视化
// ═══════════════════════════════════════════════════════════════
//
// 展示玩家从第1章到当前章节的成长曲线：
// - 属性增长折线图(Canvas)
// - 战斗效率统计
// - 章节对比数据
// - 成就里程碑
// ═══════════════════════════════════════════════════════════════

import { gameState } from './GameState.js';
import { getSnapshots as getGrowthSnapshots } from './GrowthTracker.js';

/**
 * 渲染成长仪表盘HTML
 */
export function renderProgressDashboard() {
  const snapshots = getGrowthSnapshots();
  const p = gameState.player;
  const s = gameState.stats;
  
  // 计算统计
  const playTimeMin = Math.floor((Date.now() - (s.startTime || Date.now())) / 60000);
  const avgKillsPerChapter = s.chaptersCleared > 0 ? Math.floor(s.enemiesKilled / s.chaptersCleared) : s.enemiesKilled;
  const deathRate = (s.enemiesKilled + s.deathCount) > 0 ? ((s.deathCount / (s.enemiesKilled + s.deathCount)) * 100).toFixed(1) : '0.0';
  const critRate = s.enemiesKilled > 0 ? ((s.criticalHits || 0) / s.enemiesKilled * 100).toFixed(1) : '0.0';
  const avgGoldPerKill = s.enemiesKilled > 0 ? Math.floor(s.goldEarned / s.enemiesKilled) : 0;
  
  let html = '<div style="padding:12px;max-height:75vh;overflow-y:auto;">';
  html += '<h3 style="color:#aa88ff;text-align:center;letter-spacing:4px;margin-bottom:12px;">📊 成 长 仪 表 盘</h3>';
  
  // ── 核心属性面板 ──
  html += '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px;">';
  const stats = [
    { label: '等级', value: 'Lv.' + p.level, color: '#ffcc44' },
    { label: '攻击', value: p.atk, color: '#ff6644' },
    { label: '防御', value: p.def, color: '#4488ff' },
    { label: '生命', value: p.hp + '/' + p.maxHp, color: '#44ff88' },
    { label: '速度', value: p.spd || 5, color: '#ffaa44' },
    { label: '暴击', value: (p.crt || 0) + '%', color: '#ff44cc' },
  ];
  for (const stat of stats) {
    html += `<div style="background:rgba(255,255,255,0.02);border:1px solid ${stat.color}15;border-radius:6px;padding:8px;text-align:center;">
      <p style="color:#555;font-size:9px;letter-spacing:1px;">${stat.label}</p>
      <p style="color:${stat.color};font-size:18px;font-weight:bold;">${stat.value}</p>
    </div>`;
  }
  html += '</div>';
  
  // ── 战斗效率面板 ──
  html += '<div style="background:rgba(255,255,255,0.02);border:1px solid #ffffff08;border-radius:8px;padding:12px;margin-bottom:12px;">';
  html += '<p style="color:#888;font-size:11px;letter-spacing:2px;margin-bottom:8px;">⚔ 战斗效率</p>';
  html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px;">';
  
  const combatStats = [
    { label: '总击杀', value: s.enemiesKilled, icon: '⚔' },
    { label: 'Boss击杀', value: s.bossesKilled || 0, icon: '💀' },
    { label: '死亡次数', value: s.deathCount, icon: '✝' },
    { label: '死亡率', value: deathRate + '%', icon: '📉' },
    { label: '暴击率', value: critRate + '%', icon: '💥' },
    { label: '场均金币', value: avgGoldPerKill + 'G', icon: '💰' },
    { label: '已过章节', value: s.chaptersCleared + '/12', icon: '📖' },
    { label: '场均击杀', value: avgKillsPerChapter, icon: '🎯' },
  ];
  
  for (const cs of combatStats) {
    html += `<div style="display:flex;justify-content:space-between;padding:3px 6px;">
      <span style="color:#666;font-size:11px;">${cs.icon} ${cs.label}</span>
      <span style="color:#aaa;font-size:11px;font-weight:bold;">${cs.value}</span>
    </div>`;
  }
  html += '</div></div>';
  
  // ── 章节成长曲线 ──
  if (snapshots && Object.keys(snapshots).length > 1) {
    html += '<div style="background:rgba(255,255,255,0.02);border:1px solid #ffffff08;border-radius:8px;padding:12px;margin-bottom:12px;">';
    html += '<p style="color:#888;font-size:11px;letter-spacing:2px;margin-bottom:8px;">📈 章节成长曲线</p>';
    
    const chapters = Object.keys(snapshots).sort((a, b) => Number(a) - Number(b));
    html += '<div style="display:flex;gap:4px;overflow-x:auto;padding-bottom:4px;">';
    
    for (const ch of chapters) {
      const snap = snapshots[ch];
      const barHeight = Math.min(60, Math.max(10, (snap.atk || 10) / 5));
      html += `<div style="display:flex;flex-direction:column;align-items:center;min-width:28px;">
        <div style="width:16px;height:${barHeight}px;background:linear-gradient(to top, #ff6644, #ff886680);border-radius:3px 3px 0 0;"></div>
        <p style="color:#666;font-size:8px;margin-top:2px;">Ch${ch}</p>
        <p style="color:#ff6644;font-size:8px;">ATK${snap.atk || '?'}</p>
      </div>`;
    }
    
    html += '</div></div>';
  }
  
  // ── 游玩时间 ──
  html += `<div style="text-align:center;color:#444;font-size:10px;margin-top:8px;">
    ⏱ 游玩时间: ${playTimeMin > 60 ? Math.floor(playTimeMin/60) + '小时' + (playTimeMin%60) + '分' : playTimeMin + '分钟'}
    · 总伤害: ${(s.damageDealt || 0).toLocaleString()}
    · 总金币: ${(s.goldEarned || 0).toLocaleString()}G
  </div>`;
  
  html += '</div>';
  return html;
}
