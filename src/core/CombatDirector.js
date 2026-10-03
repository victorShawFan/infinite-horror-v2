// ═══════════════════════════════════════════════════════════════
// 战斗导演系统 — 统一控制战斗节奏、演出和叙事
// ═══════════════════════════════════════════════════════════════
//
// 功能：
// 1. 根据战斗情况动态调整演出节奏
// 2. 在关键时刻插入特写镜头/叙事文本
// 3. Boss战多阶段转换特效
// 4. 连杀/连锁/逆转等高光时刻捕获
// 5. 战斗总结生成（用于战后分析）
// ═══════════════════════════════════════════════════════════════

import { eventBus } from './EventBus.js';

// ── 战斗状态追踪 ──
let _directorState = {
  active: false,
  round: 0,
  highlights: [],  // 战斗高光时刻
  tension: 0,      // 紧张度 0-100
  momentum: 0,     // 势头（正=玩家优势，负=敌方优势）
  lastCritRound: -1,
  consecutiveCrits: 0,
  playerLowHpRounds: 0,
  comebackActive: false,
  killStreakInBattle: 0,
  chainReactions: 0,
  totalDmgDealt: 0,
  totalDmgTaken: 0,
  maxSingleHit: 0,
  turnsDefended: 0,
  skillsUsed: 0,
  isBoss: false,
  bossPhaseChanges: [],
  narrativeQueue: [],
};

export function initDirector(isBoss = false) {
  _directorState = {
    active: true,
    round: 0,
    highlights: [],
    tension: isBoss ? 30 : 0,
    momentum: 0,
    lastCritRound: -1,
    consecutiveCrits: 0,
    playerLowHpRounds: 0,
    comebackActive: false,
    killStreakInBattle: 0,
    chainReactions: 0,
    totalDmgDealt: 0,
    totalDmgTaken: 0,
    maxSingleHit: 0,
    turnsDefended: 0,
    skillsUsed: 0,
    isBoss,
    bossPhaseChanges: [],
    narrativeQueue: [],
  };
}

export function stopDirector() {
  _directorState.active = false;
}

// ── 事件处理 ──
export function directorOnRound(round, playerHp, playerMaxHp, enemyHp, enemyMaxHp) {
  if (!_directorState.active) return [];
  _directorState.round = round;
  
  const events = [];
  const playerHpPct = playerHp / playerMaxHp;
  const enemyHpPct = enemyHp / enemyMaxHp;
  
  // 紧张度计算
  _directorState.tension = Math.floor(
    (1 - playerHpPct) * 40 +
    (1 - enemyHpPct) * 20 +
    (_directorState.isBoss ? 20 : 0) +
    Math.min(20, round * 2)
  );
  
  // 势头计算
  const dmgRatio = _directorState.totalDmgDealt / Math.max(1, _directorState.totalDmgTaken);
  _directorState.momentum = Math.floor((dmgRatio - 1) * 30);
  
  // 低血量警告
  if (playerHpPct < 0.25) {
    _directorState.playerLowHpRounds++;
    if (_directorState.playerLowHpRounds === 1) {
      events.push({
        type: 'danger_warning',
        text: '⚠ 生命值危急！',
        color: '#ff4444',
        priority: 'high',
      });
    }
  } else {
    if (_directorState.playerLowHpRounds > 2) {
      _directorState.comebackActive = true;
    }
    _directorState.playerLowHpRounds = 0;
  }
  
  // 逆转判定
  if (_directorState.comebackActive && playerHpPct > 0.5 && enemyHpPct < 0.3) {
    _directorState.comebackActive = false;
    events.push({
      type: 'comeback',
      text: '🔥 绝地反击！',
      color: '#ffcc44',
      priority: 'high',
    });
    _addHighlight('comeback', round, '从濒死到反杀');
  }
  
  // Boss低血量特写
  if (_directorState.isBoss && enemyHpPct < 0.15 && enemyHpPct > 0) {
    events.push({
      type: 'boss_low_hp',
      text: '💀 Boss 即将倒下！全力进攻！',
      color: '#ff8844',
      priority: 'medium',
    });
  }
  
  // 长回合叙事
  if (round === 10 && _directorState.isBoss) {
    events.push({
      type: 'narrative',
      text: '这场战斗已经持续了很久，双方都已筋疲力尽……',
      color: '#aaaaaa',
      priority: 'low',
    });
  }
  if (round === 20) {
    events.push({
      type: 'narrative',
      text: '这是一场意志的较量。谁先倒下，谁就输了。',
      color: '#888888',
      priority: 'low',
    });
  }
  
  return events;
}

export function directorOnDamage(source, target, damage, isCrit, isSkill) {
  if (!_directorState.active) return [];
  const events = [];
  
  if (source === 'player') {
    _directorState.totalDmgDealt += damage;
    if (damage > _directorState.maxSingleHit) {
      _directorState.maxSingleHit = damage;
      if (damage > 50) {
        events.push({
          type: 'max_hit',
          text: `💥 最高伤害! ${damage}`,
          color: '#ffcc44',
          priority: 'medium',
        });
      }
    }
    
    // 暴击连击
    if (isCrit) {
      if (_directorState.lastCritRound === _directorState.round - 1 || _directorState.lastCritRound === _directorState.round) {
        _directorState.consecutiveCrits++;
      } else {
        _directorState.consecutiveCrits = 1;
      }
      _directorState.lastCritRound = _directorState.round;
      
      if (_directorState.consecutiveCrits >= 3) {
        events.push({
          type: 'crit_chain',
          text: `⚡ ${_directorState.consecutiveCrits}连暴击!`,
          color: '#ff8844',
          priority: 'high',
        });
        _addHighlight('crit_chain', _directorState.round, `${_directorState.consecutiveCrits}连暴击`);
      }
    }
    
    if (isSkill) _directorState.skillsUsed++;
  } else {
    _directorState.totalDmgTaken += damage;
  }
  
  return events;
}

export function directorOnChainReaction(chain) {
  if (!_directorState.active) return [];
  _directorState.chainReactions++;
  
  _addHighlight('chain_reaction', _directorState.round, chain.name);
  
  if (_directorState.chainReactions >= 3) {
    return [{
      type: 'chain_master',
      text: `✨ 连锁大师！(${_directorState.chainReactions}次)`,
      color: '#88aaff',
      priority: 'medium',
    }];
  }
  return [];
}

export function directorOnBossPhase(phase, phaseName) {
  if (!_directorState.active) return [];
  _directorState.bossPhaseChanges.push({ phase, name: phaseName, round: _directorState.round });
  
  _addHighlight('boss_phase', _directorState.round, `Boss进入${phaseName}阶段`);
  
  return [{
    type: 'boss_phase',
    text: `— ${phaseName} —`,
    color: '#ff4444',
    priority: 'critical',
  }];
}

export function directorOnDefend() {
  if (!_directorState.active) return [];
  _directorState.turnsDefended++;
  return [];
}

export function directorOnVictory(rounds) {
  if (!_directorState.active) return [];
  _addHighlight('victory', rounds, '战斗胜利');
  return generateBattleSummary(true, rounds);
}

export function directorOnDefeat(rounds) {
  if (!_directorState.active) return [];
  _addHighlight('defeat', rounds, '战斗失败');
  return generateBattleSummary(false, rounds);
}

// ── 战斗总结 ──
function generateBattleSummary(victory, rounds) {
  const s = _directorState;
  
  // 战斗评价
  let rating = 'C';
  let ratingDesc = '普通';
  const dmgRatio = s.totalDmgDealt / Math.max(1, s.totalDmgTaken);
  
  if (victory) {
    if (dmgRatio > 5 && rounds < 5) { rating = 'SS'; ratingDesc = '完美碾压'; }
    else if (dmgRatio > 3 && rounds < 8) { rating = 'S'; ratingDesc = '压倒性胜利'; }
    else if (dmgRatio > 2) { rating = 'A'; ratingDesc = '漂亮的胜利'; }
    else if (dmgRatio > 1.2) { rating = 'B'; ratingDesc = '艰难的胜利'; }
    else { rating = 'C'; ratingDesc = '惨胜'; }
    
    if (s.comebackActive || s.playerLowHpRounds > 3) {
      ratingDesc = '绝地逆转！';
      if (rating === 'C') rating = 'B';
    }
  } else {
    rating = 'D';
    ratingDesc = '战败';
  }
  
  // 战斗标签
  const tags = [];
  if (s.consecutiveCrits >= 3) tags.push(`⚡ ${s.consecutiveCrits}连暴击`);
  if (s.chainReactions > 0) tags.push(`🔗 ${s.chainReactions}次连锁`);
  if (s.skillsUsed > 3) tags.push(`✨ 技能专家(${s.skillsUsed}次)`);
  if (s.turnsDefended > 2) tags.push(`🛡 防御大师(${s.turnsDefended}次)`);
  if (s.maxSingleHit > 80) tags.push(`💥 最高伤害:${s.maxSingleHit}`);
  if (rounds <= 3 && victory) tags.push('⚔ 速杀');
  if (rounds >= 15 && victory) tags.push('🏆 持久战');
  if (s.playerLowHpRounds > 3 && victory) tags.push('🔥 绝境逆转');
  if (s.bossPhaseChanges.length >= 2) tags.push('👑 多阶段突破');
  
  // 叙事评价
  let narrative = '';
  if (victory) {
    if (rating === 'SS') narrative = '这场战斗展现了绝对的实力差距。对手甚至无法触及你的衣角。';
    else if (rating === 'S') narrative = '干净利落的胜利。你的战术和实力都远超对手。';
    else if (rating === 'A') narrative = '一场精彩的战斗。你证明了自己的实力。';
    else if (rating === 'B') narrative = '这场战斗并不轻松，但你最终还是赢了。每一道伤疤都是勋章。';
    else narrative = '你勉强赢了，但代价不小。下次需要更好的准备。';
    
    if (s.comebackActive) narrative = '从死亡边缘爬回来——这才是真正的轮回者。'+narrative;
  } else {
    narrative = '这次失败并非终点。每一次倒下，都是为了下一次更强地站起来。';
  }
  
  return [{
    type: 'battle_summary',
    rating,
    ratingDesc,
    tags,
    narrative,
    stats: {
      rounds,
      totalDmgDealt: s.totalDmgDealt,
      totalDmgTaken: s.totalDmgTaken,
      maxSingleHit: s.maxSingleHit,
      skillsUsed: s.skillsUsed,
      chainReactions: s.chainReactions,
      bossPhases: s.bossPhaseChanges.length,
    },
    highlights: [...s.highlights],
  }];
}

// ── 辅助 ──
function _addHighlight(type, round, desc) {
  _directorState.highlights.push({ type, round, desc, time: Date.now() });
}

// ── 获取当前紧张度 ──
export function getTension() { return _directorState.tension; }
export function getMomentum() { return _directorState.momentum; }

// ── 渲染战斗总结面板 ──
export function renderBattleSummaryPanel(summary) {
  if (!summary || summary.type !== 'battle_summary') return '';
  
  const ratingColors = { SS: '#ffcc00', S: '#ff8844', A: '#44cc88', B: '#4488ff', C: '#888888', D: '#cc4444' };
  const color = ratingColors[summary.rating] || '#888';
  
  let html = `
    <div style="padding:20px;max-width:420px;margin:0 auto;text-align:center;">
      <!-- 评级 -->
      <div style="margin-bottom:16px;">
        <div style="font-size:48px;font-weight:bold;color:${color};
          text-shadow:0 0 20px ${color}88;letter-spacing:4px;
          animation:ratingPulse 1s ease-out;">${summary.rating}</div>
        <div style="color:${color};font-size:14px;margin-top:4px;">${summary.ratingDesc}</div>
      </div>
      
      <!-- 统计 -->
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:16px;">
        <div style="padding:8px;background:#ffffff08;border-radius:6px;">
          <div style="color:#888;font-size:9px;">回合数</div>
          <div style="color:#ddd;font-size:16px;font-weight:bold;">${summary.stats.rounds}</div>
        </div>
        <div style="padding:8px;background:#ffffff08;border-radius:6px;">
          <div style="color:#888;font-size:9px;">总输出</div>
          <div style="color:#ff8844;font-size:16px;font-weight:bold;">${summary.stats.totalDmgDealt}</div>
        </div>
        <div style="padding:8px;background:#ffffff08;border-radius:6px;">
          <div style="color:#888;font-size:9px;">总承伤</div>
          <div style="color:#ff4444;font-size:16px;font-weight:bold;">${summary.stats.totalDmgTaken}</div>
        </div>
      </div>
      
      <!-- 最高伤害 -->
      ${summary.stats.maxSingleHit > 0 ? `
        <div style="margin-bottom:12px;padding:6px;background:#ffcc4411;border-radius:4px;">
          <span style="color:#888;font-size:10px;">最高单次伤害:</span>
          <span style="color:#ffcc44;font-size:14px;font-weight:bold;margin-left:8px;">💥 ${summary.stats.maxSingleHit}</span>
        </div>
      ` : ''}
      
      <!-- 战斗标签 -->
      ${summary.tags.length > 0 ? `
        <div style="display:flex;flex-wrap:wrap;gap:4px;justify-content:center;margin-bottom:12px;">
          ${summary.tags.map(t => `<span style="padding:3px 8px;background:#ffffff11;border-radius:12px;
            color:#ddd;font-size:10px;">${t}</span>`).join('')}
        </div>
      ` : ''}
      
      <!-- 叙事评价 -->
      <p style="color:#aaa;font-size:11px;line-height:1.7;margin:0;font-style:italic;
        border-top:1px solid #ffffff11;padding-top:12px;">
        ${summary.narrative}
      </p>
      
      <!-- 高光时刻 -->
      ${summary.highlights.length > 0 ? `
        <div style="margin-top:12px;text-align:left;">
          <div style="color:#666;font-size:9px;margin-bottom:4px;">战斗亮点:</div>
          ${summary.highlights.slice(0, 5).map(h => `
            <div style="padding:2px 0;color:#888;font-size:10px;">
              R${h.round}: ${h.desc}
            </div>
          `).join('')}
        </div>
      ` : ''}
    </div>
    <style>
      @keyframes ratingPulse { 
        0% { transform: scale(2); opacity: 0; }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); opacity: 1; }
      }
    </style>
  `;
  
  return html;
}

// ── 获取导演状态（调试用） ──
export function getDirectorState() {
  return { ..._directorState };
}
