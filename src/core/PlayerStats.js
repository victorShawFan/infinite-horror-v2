// ═══════════════════════════════════════════════════════════════
// 玩家长期统计追踪系统
// ═══════════════════════════════════════════════════════════════
//
// 追踪和展示玩家的完整游戏历程数据：
// - 总伤害输出/承受
// - 最高单次伤害
// - 最长连杀
// - 最快Boss击杀
// - 最多使用的技能
// - 各章节完成状态
// ═══════════════════════════════════════════════════════════════

import { gameState } from './GameState.js';
import { eventBus } from './EventBus.js';

// ── 追踪数据结构 ──
const DEFAULT_STATS = {
  totalDamageDealt: 0,
  totalDamageTaken: 0,
  maxSingleHit: 0,
  maxKillStreak: 0,
  bossesDefeated: 0,
  fastestBossKill: Infinity, // 回合数
  fastestBossName: '',
  totalHealingDone: 0,
  criticalHits: 0,
  dodgesPerformed: 0,
  skillsUsed: 0,
  consumablesUsed: 0,
  goldSpent: 0,
  companionsRevived: 0,
  explorationEventsCompleted: 0,
  chapterCompletions: {},
  favoriteBloodline: 'none',
  highestLevel: 1,
  totalPlayTime: 0, // 估算（回合数 × 平均回合时间）
  perfectBattles: 0, // 无伤战斗
};

let _stats = { ...DEFAULT_STATS };

/**
 * 记录战斗数据
 */
export function recordBattleStats(data) {
  if (data.damageDealt) _stats.totalDamageDealt += data.damageDealt;
  if (data.damageTaken) _stats.totalDamageTaken += data.damageTaken;
  if (data.maxHit && data.maxHit > _stats.maxSingleHit) _stats.maxSingleHit = data.maxHit;
  if (data.critCount) _stats.criticalHits += data.critCount;
  if (data.isBoss && data.victory) {
    _stats.bossesDefeated++;
    if (data.rounds < _stats.fastestBossKill) {
      _stats.fastestBossKill = data.rounds;
      _stats.fastestBossName = data.enemyName || '未知';
    }
  }
  if (data.damageTaken === 0 && data.victory) _stats.perfectBattles++;
}

/**
 * 记录连杀
 */
export function recordMaxStreak(streak) {
  if (streak > _stats.maxKillStreak) _stats.maxKillStreak = streak;
}

/**
 * 记录治疗
 */
export function recordHealing(amount) {
  _stats.totalHealingDone += amount;
}

/**
 * 记录章节完成
 */
export function recordChapterComplete(chapter) {
  _stats.chapterCompletions[chapter] = true;
}

/**
 * 更新最高等级
 */
export function updateHighestLevel(level) {
  if (level > _stats.highestLevel) _stats.highestLevel = level;
}

/**
 * 获取统计数据
 */
export function getPlayerStats() {
  return { ..._stats };
}

/**
 * 展示统计面板
 */
export function showPlayerStatsPanel() {
  const old = document.getElementById('player-stats-panel');
  if (old) { old.remove(); return; }
  
  const s = _stats;
  const p = gameState.player;
  
  // 计算游戏时间估算
  const estimatedMinutes = Math.floor((gameState.stats?.turnsPlayed || 0) * 0.5);
  const hours = Math.floor(estimatedMinutes / 60);
  const mins = estimatedMinutes % 60;
  const timeStr = hours > 0 ? `${hours}小时${mins}分` : `${mins}分钟`;
  
  // 成就式里程碑
  const milestones = [];
  if (s.totalDamageDealt >= 10000) milestones.push('💥 万伤输出者');
  if (s.bossesDefeated >= 5) milestones.push('👑 Boss猎人');
  if (s.perfectBattles >= 3) milestones.push('✦ 无伤大师');
  if (s.maxKillStreak >= 10) milestones.push('🔥 连杀狂人');
  if (s.maxSingleHit >= 100) milestones.push('⚡ 一击必杀');
  if ((gameState.stats?.stepsWalked || 0) >= 1000) milestones.push('🚶 千里行者');
  
  const panel = document.createElement('div');
  panel.id = 'player-stats-panel';
  panel.style.cssText = `
    position:fixed;top:0;left:0;right:0;bottom:0;z-index:420;
    display:flex;align-items:center;justify-content:center;
    background:rgba(0,0,0,0.88);animation:psp-fadeIn 0.3s;
  `;
  
  panel.innerHTML = `
    <style>@keyframes psp-fadeIn { from { opacity: 0 } to { opacity: 1 } }
    .psp-row { display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #ffffff06; }
    .psp-label { color:#888;font-size:12px; }
    .psp-value { color:#ddd;font-size:12px;font-weight:bold; }</style>
    <div style="max-width:440px;width:92%;max-height:85vh;overflow-y:auto;
      background:linear-gradient(180deg,rgba(8,6,12,0.98),rgba(4,3,6,0.98));
      border:1px solid #aa884420;border-radius:16px;padding:24px;">
      
      <p style="text-align:center;color:#aa8844;font-size:10px;letter-spacing:6px;margin-bottom:4px;">— 轮回记录 —</p>
      <p style="text-align:center;color:#ddd;font-size:18px;font-weight:bold;margin-bottom:16px;">
        ${p.level > 1 ? 'Lv.' + p.level + ' 轮回者' : '初入轮回'}
      </p>
      
      <!-- 游戏时间 -->
      <div style="text-align:center;margin-bottom:16px;">
        <span style="color:#666;font-size:11px;">游戏时长: </span>
        <span style="color:#ffcc44;font-size:14px;">${timeStr}</span>
        <span style="color:#666;font-size:11px;"> · 第${gameState.chapter}章</span>
      </div>
      
      <!-- 战斗数据 -->
      <div style="margin-bottom:16px;">
        <p style="color:#ff6644;font-size:10px;letter-spacing:2px;margin-bottom:8px;">⚔ 战斗记录</p>
        <div class="psp-row"><span class="psp-label">总伤害输出</span><span class="psp-value" style="color:#ff6644;">${s.totalDamageDealt.toLocaleString()}</span></div>
        <div class="psp-row"><span class="psp-label">总承受伤害</span><span class="psp-value" style="color:#4488ff;">${s.totalDamageTaken.toLocaleString()}</span></div>
        <div class="psp-row"><span class="psp-label">最高单次伤害</span><span class="psp-value" style="color:#ff44aa;">${s.maxSingleHit}</span></div>
        <div class="psp-row"><span class="psp-label">暴击次数</span><span class="psp-value">${s.criticalHits}</span></div>
        <div class="psp-row"><span class="psp-label">无伤战斗</span><span class="psp-value" style="color:#44ff88;">${s.perfectBattles}</span></div>
        <div class="psp-row"><span class="psp-label">最长连杀</span><span class="psp-value" style="color:#ffaa00;">${s.maxKillStreak}</span></div>
      </div>
      
      <!-- Boss记录 -->
      <div style="margin-bottom:16px;">
        <p style="color:#cc44ff;font-size:10px;letter-spacing:2px;margin-bottom:8px;">👑 Boss记录</p>
        <div class="psp-row"><span class="psp-label">Boss击败</span><span class="psp-value">${s.bossesDefeated}</span></div>
        ${s.fastestBossKill < Infinity ? `<div class="psp-row"><span class="psp-label">最快击杀</span><span class="psp-value">${s.fastestBossKill}回合 (${s.fastestBossName})</span></div>` : ''}
      </div>
      
      <!-- 里程碑 -->
      ${milestones.length > 0 ? `
        <div style="margin-bottom:16px;padding:10px;background:rgba(255,204,68,0.04);border:1px solid #ffcc4415;border-radius:8px;">
          <p style="color:#ffcc44;font-size:10px;letter-spacing:2px;margin-bottom:6px;">🏆 达成成就</p>
          <div style="display:flex;flex-wrap:wrap;gap:6px;">
            ${milestones.map(m => `<span style="color:#ffcc44;font-size:11px;padding:3px 8px;background:rgba(255,204,68,0.08);border-radius:4px;">${m}</span>`).join('')}
          </div>
        </div>
      ` : ''}
      
      <div style="text-align:center;">
        <button id="psp-close" style="background:transparent;border:1px solid #444;color:#888;
          padding:8px 30px;cursor:pointer;font-size:12px;font-family:inherit;border-radius:6px;">
          关闭 (Esc)
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(panel);
  const close = () => { panel.remove(); document.removeEventListener('keydown', kh); };
  const kh = (e) => { if (e.key === 'Escape') { e.preventDefault(); close(); } };
  document.getElementById('psp-close')?.addEventListener('click', close);
  document.addEventListener('keydown', kh);
}

// ── 序列化 ──
export function serializePlayerStats() {
  const out = { ..._stats };
  // Infinity 不能 JSON 序列化，用 -1 作为哨兵值
  if (out.fastestBossKill === Infinity) out.fastestBossKill = -1;
  return out;
}
export function deserializePlayerStats(data) {
  if (data) {
    _stats = { ...DEFAULT_STATS, ...data };
    // 还原哨兵值为 Infinity
    if (_stats.fastestBossKill === -1 || _stats.fastestBossKill === null) {
      _stats.fastestBossKill = Infinity;
    }
  }
}
