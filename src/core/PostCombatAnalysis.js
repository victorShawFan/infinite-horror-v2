// ═══════════════════════════════════════════════════════════════
// 战后详细分析面板 — 每场战斗的深度复盘
// ═══════════════════════════════════════════════════════════════
//
// 在重要战斗后（Boss、高评级、险胜、首杀等）展示：
// 1. 伤害输出/承受分析
// 2. 关键回合回顾
// 3. 技能/暴击/格挡统计
// 4. 战力成长建议
// ═══════════════════════════════════════════════════════════════

import { eventBus } from './EventBus.js';
import { gameState } from './GameState.js';

/**
 * 判断是否需要展示详细分析
 */
export function shouldShowAnalysis(result, rating) {
  // Boss战必展示
  if (result._isBoss) return true;
  // S级以上评价
  if (rating && (rating.grade === 'S' || rating.grade === 'SS')) return true;
  // 险胜（HP<15%）
  if (result.victory && gameState.player.hp < gameState.player.maxHp * 0.15) return true;
  // 回合超过15
  if (result.rounds > 15) return true;
  return false;
}

/**
 * 从战斗日志中提取统计数据
 */
export function extractCombatStats(result) {
  const log = result.log || [];
  let playerDmgDealt = result.totalDamageDealt || 0;
  let playerDmgTaken = result.totalDamageTaken || 0;
  let critCount = result.critCount || 0;
  let skillsUsed = 0;
  let healsReceived = 0;
  let companionContributions = 0;
  let dodges = 0;
  let blocks = 0;
  let statusEffectsApplied = 0;
  let keyMoments = [];
  
  for (let i = 0; i < log.length; i++) {
    const entry = log[i];
    if (!entry || !entry.text) continue;
    const t = entry.text;
    
    if (entry.type === 'skill') skillsUsed++;
    if (entry.type === 'heal') healsReceived++;
    if (t.includes('同伴') || t.includes('companion')) companionContributions++;
    if (t.includes('闪避') || t.includes('dodge')) dodges++;
    if (t.includes('格挡') || t.includes('block')) blocks++;
    if (t.includes('状态') || entry.type === 'status') statusEffectsApplied++;
    
    // 关键时刻提取
    if (t.includes('BOSS') || t.includes('相位') || t.includes('phase')) {
      keyMoments.push({ round: i, text: t, type: 'phase' });
    }
    if (t.includes('暴击') || t.includes('critical')) {
      if (keyMoments.length < 5) keyMoments.push({ round: i, text: t, type: 'crit' });
    }
    if (t.includes('死亡保护') || t.includes('重生')) {
      keyMoments.push({ round: i, text: t, type: 'save' });
    }
  }
  
  return {
    playerDmgDealt,
    playerDmgTaken,
    critCount,
    skillsUsed,
    healsReceived,
    companionContributions,
    dodges,
    blocks,
    statusEffectsApplied,
    keyMoments: keyMoments.slice(0, 5),
    rounds: result.rounds || 0,
    dps: result.rounds > 0 ? Math.floor(playerDmgDealt / result.rounds) : 0,
    dtps: result.rounds > 0 ? Math.floor(playerDmgTaken / result.rounds) : 0,
  };
}

/**
 * 生成战力建议
 */
export function generateAdvice(stats, player, enemy) {
  const tips = [];
  
  // DPS分析
  if (stats.dps < 5) {
    tips.push({ icon: '⚔', text: '输出不足 — 考虑提升ATK或更换武器', color: '#ff6644' });
  }
  
  // 承伤分析
  if (stats.dtps > player.maxHp * 0.15) {
    tips.push({ icon: '🛡', text: '每回合承伤过高 — 建议提升DEF或使用防御姿态', color: '#4488ff' });
  }
  
  // 暴击效率
  if (stats.rounds > 5 && stats.critCount < 2) {
    tips.push({ icon: '✦', text: '暴击率偏低 — 可以投资CRT属性或使用感知增幅', color: '#ff44aa' });
  }
  
  // 技能利用
  if (stats.rounds > 8 && stats.skillsUsed === 0) {
    tips.push({ icon: '🎯', text: '未使用主动技能 — 技能可以大幅改变战斗节奏', color: '#aa88ff' });
  }
  
  // 同伴贡献
  if (stats.rounds > 5 && stats.companionContributions === 0) {
    tips.push({ icon: '👥', text: '同伴未参战 — 提升同伴关系可解锁更强协战', color: '#ffcc44' });
  }
  
  // 战斗时间
  if (stats.rounds > 20) {
    tips.push({ icon: '⏱', text: '战斗耗时过长 — 可能需要更激进的战斗策略', color: '#888' });
  }
  
  return tips.slice(0, 3); // 最多3条建议
}

/**
 * 渲染战后分析面板
 */
export function showPostCombatAnalysis(result, rating, enemy, onClose) {
  const stats = extractCombatStats(result);
  const player = gameState.player;
  const advice = generateAdvice(stats, player, enemy);
  
  const old = document.getElementById('post-combat-analysis');
  if (old) old.remove();
  
  const overlay = document.createElement('div');
  overlay.id = 'post-combat-analysis';
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 280;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0, 0, 0, 0.85);
    animation: pca-fadeIn 0.4s;
  `;
  
  const gradeColor = rating?.color || '#888';
  const victory = result.victory;
  
  overlay.innerHTML = `
    <style>
      @keyframes pca-fadeIn { from { opacity: 0 } to { opacity: 1 } }
      @keyframes pca-bar { from { width: 0 } to { width: var(--bar-width) } }
      .pca-stat-row { display:flex;align-items:center;gap:8px;padding:4px 0; }
      .pca-stat-label { color:#888;font-size:11px;min-width:80px; }
      .pca-stat-value { color:#ddd;font-size:13px;font-weight:bold; }
      .pca-bar { height:4px;border-radius:2px;animation:pca-bar 0.6s ease-out forwards; }
    </style>
    
    <div style="max-width:440px;width:92%;max-height:85vh;overflow-y:auto;
      background:linear-gradient(180deg,rgba(10,8,15,0.98),rgba(5,4,8,0.98));
      border:1px solid ${gradeColor}30;border-radius:16px;padding:24px;
      box-shadow:0 0 40px ${gradeColor}10;">
      
      <div style="text-align:center;margin-bottom:16px;">
        <p style="color:#666;font-size:10px;letter-spacing:4px;">— 战斗分析 —</p>
        <p style="color:${gradeColor};font-size:24px;font-weight:bold;margin:4px 0;">
          ${victory ? '✓ 胜利' : '✗ 落败'} ${rating ? `· ${rating.grade}级` : ''}
        </p>
        <p style="color:#888;font-size:12px;">vs ${enemy.name} · ${stats.rounds}回合</p>
      </div>
      
      <!-- 核心数据 -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
        <div style="background:rgba(255,100,68,0.06);border:1px solid #ff664420;border-radius:8px;padding:10px;text-align:center;">
          <p style="color:#ff6644;font-size:10px;letter-spacing:2px;">伤害输出</p>
          <p style="color:#ff8866;font-size:22px;font-weight:bold;">${stats.playerDmgDealt}</p>
          <p style="color:#666;font-size:10px;">DPS: ${stats.dps}/回合</p>
        </div>
        <div style="background:rgba(68,136,255,0.06);border:1px solid #4488ff20;border-radius:8px;padding:10px;text-align:center;">
          <p style="color:#4488ff;font-size:10px;letter-spacing:2px;">承受伤害</p>
          <p style="color:#6699ff;font-size:22px;font-weight:bold;">${stats.playerDmgTaken}</p>
          <p style="color:#666;font-size:10px;">DTPS: ${stats.dtps}/回合</p>
        </div>
      </div>
      
      <!-- 战斗统计条 -->
      <div style="margin-bottom:16px;">
        ${stats.critCount > 0 ? `<div class="pca-stat-row">
          <span class="pca-stat-label">✦ 暴击次数</span>
          <span class="pca-stat-value" style="color:#ff44aa;">${stats.critCount}</span>
        </div>` : ''}
        ${stats.skillsUsed > 0 ? `<div class="pca-stat-row">
          <span class="pca-stat-label">🎯 技能使用</span>
          <span class="pca-stat-value" style="color:#aa88ff;">${stats.skillsUsed}</span>
        </div>` : ''}
        ${stats.dodges > 0 ? `<div class="pca-stat-row">
          <span class="pca-stat-label">💨 闪避次数</span>
          <span class="pca-stat-value" style="color:#ffcc44;">${stats.dodges}</span>
        </div>` : ''}
        ${stats.blocks > 0 ? `<div class="pca-stat-row">
          <span class="pca-stat-label">🛡 格挡次数</span>
          <span class="pca-stat-value" style="color:#4488ff;">${stats.blocks}</span>
        </div>` : ''}
        ${stats.healsReceived > 0 ? `<div class="pca-stat-row">
          <span class="pca-stat-label">💚 恢复次数</span>
          <span class="pca-stat-value" style="color:#44ff88;">${stats.healsReceived}</span>
        </div>` : ''}
        ${stats.companionContributions > 0 ? `<div class="pca-stat-row">
          <span class="pca-stat-label">👥 同伴协战</span>
          <span class="pca-stat-value" style="color:#ffaa44;">${stats.companionContributions}</span>
        </div>` : ''}
      </div>
      
      <!-- 关键时刻 -->
      ${stats.keyMoments.length > 0 ? `
        <div style="margin-bottom:16px;padding:10px;background:rgba(255,255,255,0.02);border-radius:8px;">
          <p style="color:#888;font-size:10px;letter-spacing:2px;margin-bottom:6px;">🔑 关键时刻</p>
          ${stats.keyMoments.map(m => 
            `<p style="color:#aaa;font-size:11px;padding:2px 0;border-left:2px solid ${m.type === 'phase' ? '#cc44ff' : m.type === 'save' ? '#ff4444' : '#ffcc44'};padding-left:8px;margin:3px 0;">
              ${m.text}
            </p>`
          ).join('')}
        </div>
      ` : ''}
      
      <!-- 战力建议 -->
      ${advice.length > 0 ? `
        <div style="margin-bottom:16px;padding:10px;background:rgba(255,204,68,0.04);border:1px solid #ffcc4415;border-radius:8px;">
          <p style="color:#aa8844;font-size:10px;letter-spacing:2px;margin-bottom:6px;">💡 战术建议</p>
          ${advice.map(a => 
            `<p style="color:${a.color};font-size:12px;padding:3px 0;">
              ${a.icon} ${a.text}
            </p>`
          ).join('')}
        </div>
      ` : ''}
      
      <button id="pca-close" style="
        display:block;margin:0 auto;background:rgba(200,200,200,0.05);border:1px solid #44444444;
        color:#888;padding:10px 40px;cursor:pointer;font-size:13px;font-family:inherit;
        border-radius:8px;letter-spacing:3px;
      ">继续探索</button>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  const close = () => {
    overlay.style.transition = 'opacity 0.3s';
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.remove();
      document.removeEventListener('keydown', keyHandler);
      if (onClose) onClose();
    }, 300);
  };
  
  const keyHandler = (e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  };
  
  document.getElementById('pca-close')?.addEventListener('click', close);
  document.addEventListener('keydown', keyHandler);
}
