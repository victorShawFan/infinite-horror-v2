// ═══════════════════════════════════════════════════════════════
// 战斗播报系统 — 格斗游戏式华丽战斗提示
// ═══════════════════════════════════════════════════════════════
//
// 在战斗关键时刻显示大字播报：
// - 首击: FIRST BLOOD
// - 暴击连锁: CRITICAL CHAIN ×N
// - 弱点打击: WEAK POINT
// - 元素克制: ELEMENTAL CRUSH
// - 完美闪避: PERFECT DODGE
// - 绝杀: OVERKILL / EXECUTION
// - 逆转: COMEBACK
// - 一击必杀: ONE SHOT
// - 无伤通过: FLAWLESS
// ═══════════════════════════════════════════════════════════════

import { eventBus } from './EventBus.js';

// ── 播报定义 ──
const ANNOUNCEMENTS = {
  first_blood: {
    text: 'FIRST BLOOD',
    sub: '第一滴血',
    color: '#ff4444',
    size: 36,
    duration: 1200,
    shake: 3,
  },
  critical_chain_2: {
    text: 'CRITICAL ×2',
    sub: '暴击连锁',
    color: '#ffcc44',
    size: 30,
    duration: 1000,
  },
  critical_chain_3: {
    text: 'CRITICAL ×3',
    sub: '暴击风暴！',
    color: '#ff8844',
    size: 34,
    duration: 1200,
    shake: 2,
  },
  critical_chain_5: {
    text: '★ CRITICAL ×5 ★',
    sub: '暴击之王！',
    color: '#ff4444',
    size: 40,
    duration: 1500,
    shake: 4,
  },
  weak_point: {
    text: 'WEAK POINT',
    sub: '弱点命中！',
    color: '#ff8844',
    size: 28,
    duration: 800,
  },
  elemental_crush: {
    text: 'ELEMENTAL CRUSH',
    sub: '元素克制！',
    color: '#44aaff',
    size: 30,
    duration: 1000,
  },
  overkill: {
    text: 'OVERKILL',
    sub: '过量击杀',
    color: '#ff2222',
    size: 34,
    duration: 1000,
    shake: 3,
  },
  comeback: {
    text: 'COMEBACK',
    sub: '绝境逆转！',
    color: '#44ff88',
    size: 36,
    duration: 1500,
    shake: 2,
  },
  one_shot: {
    text: 'ONE SHOT',
    sub: '一击必杀！',
    color: '#ffcc44',
    size: 38,
    duration: 1200,
    shake: 4,
  },
  flawless: {
    text: '★ FLAWLESS ★',
    sub: '无伤通关！完美战斗！',
    color: '#44ffcc',
    size: 42,
    duration: 2000,
    shake: 2,
  },
  boss_down: {
    text: 'BOSS DEFEATED',
    sub: '强敌陨落',
    color: '#cc44ff',
    size: 40,
    duration: 2000,
    shake: 5,
  },
  gene_lock_burst: {
    text: 'GENE LOCK BURST',
    sub: '基因锁爆发！',
    color: '#ff6600',
    size: 36,
    duration: 1500,
    shake: 4,
  },
  kill_streak_5: {
    text: 'KILLING SPREE',
    sub: '五连杀！',
    color: '#ff4444',
    size: 32,
    duration: 1200,
    shake: 2,
  },
  kill_streak_10: {
    text: '★ UNSTOPPABLE ★',
    sub: '势不可挡！十连杀！',
    color: '#ff2222',
    size: 38,
    duration: 1500,
    shake: 4,
  },
  dodge_master: {
    text: 'DODGE MASTER',
    sub: '完美闪避',
    color: '#44ffaa',
    size: 28,
    duration: 800,
  },
};

let _announcementQueue = [];
let _currentAnnouncement = null;
let _announceEl = null;

/**
 * 触发战斗播报
 */
export function announce(type) {
  const def = ANNOUNCEMENTS[type];
  if (!def) return;
  
  // 避免重复播报（冷却300ms）
  if (_currentAnnouncement?.type === type && Date.now() - (_currentAnnouncement?.startTime || 0) < 300) return;
  
  _showAnnouncement(type, def);
}

/**
 * 根据战斗结果自动播报
 */
export function autoAnnounce(combatResult) {
  if (!combatResult) return;
  
  const { victory, rounds, hpBefore, hpAfter, maxHp, isBoss, critStreak, 
          weaknessHits, elementalHits, overkillDmg, isFirstKill, killStreak } = combatResult;
  
  if (!victory) return;
  
  // 优先级排序（只播最高优先级的1-2个）
  const announcements = [];
  
  // 一击必杀
  if (rounds <= 1) announcements.push({ type: 'one_shot', priority: 10 });
  
  // Boss击败
  if (isBoss) announcements.push({ type: 'boss_down', priority: 9 });
  
  // 无伤通关
  if (hpBefore === hpAfter || (hpAfter >= maxHp * 0.99)) announcements.push({ type: 'flawless', priority: 8 });
  
  // 绝境逆转（战前低血量但胜利）
  if (hpBefore < maxHp * 0.2 && victory) announcements.push({ type: 'comeback', priority: 7 });
  
  // 过量击杀
  if (overkillDmg && overkillDmg > 50) announcements.push({ type: 'overkill', priority: 5 });
  
  // 暴击连锁
  if (critStreak >= 5) announcements.push({ type: 'critical_chain_5', priority: 6 });
  else if (critStreak >= 3) announcements.push({ type: 'critical_chain_3', priority: 4 });
  else if (critStreak >= 2) announcements.push({ type: 'critical_chain_2', priority: 3 });
  
  // 连杀
  if (killStreak >= 10) announcements.push({ type: 'kill_streak_10', priority: 6 });
  else if (killStreak >= 5) announcements.push({ type: 'kill_streak_5', priority: 4 });
  
  // 按优先级排序，只播前2个
  announcements.sort((a, b) => b.priority - a.priority);
  for (let i = 0; i < Math.min(2, announcements.length); i++) {
    setTimeout(() => announce(announcements[i].type), i * 600);
  }
}

// ── 显示播报 ──
function _showAnnouncement(type, def) {
  // 移除旧元素
  if (_announceEl) {
    _announceEl.remove();
    _announceEl = null;
  }
  
  const el = document.createElement('div');
  el.style.cssText = `
    position: fixed;
    top: 30%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0.5);
    z-index: 9998;
    pointer-events: none;
    text-align: center;
    opacity: 0;
    transition: transform 0.15s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.1s;
  `;
  
  el.innerHTML = `
    <p style="
      font-size: ${def.size}px;
      color: ${def.color};
      font-weight: 900;
      letter-spacing: ${Math.floor(def.size / 5)}px;
      text-shadow: 0 0 ${def.size}px ${def.color}60, 
                   0 0 ${def.size * 2}px ${def.color}30,
                   2px 2px 0 rgba(0,0,0,0.8);
      font-family: 'Impact', 'Arial Black', sans-serif;
      -webkit-text-stroke: 1px ${def.color}80;
    ">${def.text}</p>
    <p style="
      font-size: 14px;
      color: ${def.color}99;
      letter-spacing: 3px;
      margin-top: 4px;
      font-family: 'Microsoft YaHei', sans-serif;
    ">${def.sub}</p>
  `;
  
  document.body.appendChild(el);
  _announceEl = el;
  _currentAnnouncement = { type, startTime: Date.now() };
  
  // 弹入动画
  requestAnimationFrame(() => {
    el.style.opacity = '1';
    el.style.transform = 'translate(-50%, -50%) scale(1)';
  });
  
  // 屏幕震动
  if (def.shake) {
    eventBus.emit('screen:shake', { intensity: def.shake, duration: 200 });
  }
  
  // 淡出
  setTimeout(() => {
    el.style.transition = 'opacity 0.4s, transform 0.4s';
    el.style.opacity = '0';
    el.style.transform = 'translate(-50%, -50%) scale(1.2) translateY(-20px)';
    setTimeout(() => {
      el.remove();
      if (_announceEl === el) _announceEl = null;
    }, 400);
  }, def.duration);
}

/**
 * 清理所有播报元素
 */
export function clearAnnouncements() {
  if (_announceEl) {
    _announceEl.remove();
    _announceEl = null;
  }
  _currentAnnouncement = null;
}
