// ═══════════════════════════════════════════════════════════════
// 回忆闪回系统 — 关键时刻的叙事深化
// ═══════════════════════════════════════════════════════════════

import { eventBus } from './EventBus.js';
import { gameState } from './GameState.js';

// ── 闪回内容库 ──
const FLASHBACK_POOL = {
  // 战斗前的激励
  pre_boss: [
    { speaker: '郑吒', text: '"活下去。这是我现在唯一能做的事。"', color: '#44aaff' },
    { speaker: '楚轩', text: '"算计到最后一步……这次不会输。"', color: '#aa88ff' },
    { speaker: '张杰', text: '"如果这是我的宿命，那我选择正面迎上。"', color: '#ff6644' },
  ],
  // 同伴阵亡
  companion_death: [
    { speaker: '旁白', text: '"有些人，走着走着就散了。在这个世界，散了就是永别。"', color: '#888888' },
    { speaker: '郑吒', text: '"我记得你说过，活着比什么都重要。可是……你自己为什么不听呢？"', color: '#44aaff' },
  ],
  // 基因锁突破
  gene_lock_advance: [
    { speaker: '旁白', text: '"当恐惧的极限被突破，人类的进化之门便会开启。"', color: '#ff8800' },
    { speaker: '郑吒', text: '"这就是……基因锁的力量吗？我能感觉到——身体里有什么东西醒了。"', color: '#ff6600' },
  ],
  // 章节转场
  chapter_transition: [
    { speaker: '主神', text: '"准备好了吗？十天后，你们将前往下一个世界。"', color: '#ff4444' },
    { speaker: '郑吒', text: '"不管是什么世界，我们都会活着回来。"', color: '#44aaff' },
    { speaker: '楚轩', text: '"情报不够，计划就不够完美。但——足够了。"', color: '#aa88ff' },
  ],
  // 探索深处
  deep_exploration: [
    { speaker: '旁白', text: '"越深入黑暗，离真相就越近。但代价也越高。"', color: '#666666' },
    { speaker: '郑吒', text: '"每一步都可能是最后一步……但不走，就永远出不去。"', color: '#44aaff' },
  ],
  // 低血量时
  near_death: [
    { speaker: '内心独白', text: '"不行……还不能倒下……他们还在等我。"', color: '#ff4444' },
    { speaker: '内心独白', text: '"主神不会让我在这里死去……因为我还没有放弃。"', color: '#ff6644' },
  ],
};

let _lastFlashbackTime = 0;
const FLASHBACK_COOLDOWN = 60000; // 至少1分钟间隔
let _shownFlashbacks = new Set();

/**
 * 尝试触发一次闪回
 * @param {string} trigger - 触发类型
 * @returns {Object|null} 闪回数据
 */
export function tryFlashback(trigger) {
  const now = Date.now();
  if (now - _lastFlashbackTime < FLASHBACK_COOLDOWN) return null;
  
  const pool = FLASHBACK_POOL[trigger];
  if (!pool || pool.length === 0) return null;
  
  // 过滤已展示过的
  const available = pool.filter((_, i) => !_shownFlashbacks.has(trigger + '_' + i));
  if (available.length === 0) return null;
  
  const idx = Math.floor(Math.random() * available.length);
  const flashback = available[idx];
  _shownFlashbacks.add(trigger + '_' + pool.indexOf(flashback));
  _lastFlashbackTime = now;
  
  return flashback;
}

/**
 * 渲染闪回面板
 */
export function renderFlashback(flashback, container) {
  if (!flashback || !container) return;
  
  const div = document.createElement('div');
  div.className = 'flashback-overlay';
  div.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:300;' +
    'display:flex;align-items:center;justify-content:center;' +
    'background:rgba(0,0,0,0);pointer-events:none;' +
    'transition:background 0.8s;';
  
  div.innerHTML = 
    '<div style="text-align:center;max-width:500px;padding:30px;opacity:0;transition:opacity 0.8s ease 0.3s;" id="fb-content">' +
    '<p style="color:' + flashback.color + ';font-size:16px;line-height:1.8;font-style:italic;letter-spacing:2px;' +
    'text-shadow:0 0 20px ' + flashback.color + '44;">' + flashback.text + '</p>' +
    '<p style="color:#555;font-size:11px;margin-top:12px;letter-spacing:3px;">—— ' + flashback.speaker + '</p>' +
    '</div>';
  
  document.body.appendChild(div);
  
  // 淡入
  requestAnimationFrame(() => {
    div.style.background = 'rgba(0,0,0,0.7)';
    const content = document.getElementById('fb-content');
    if (content) content.style.opacity = '1';
  });
  
  // 自动消失
  setTimeout(() => {
    div.style.background = 'rgba(0,0,0,0)';
    const content = document.getElementById('fb-content');
    if (content) content.style.opacity = '0';
    setTimeout(() => div.remove(), 800);
  }, 3500);
}

export function serializeFlashbacks() {
  return { shown: [..._shownFlashbacks], lastTime: _lastFlashbackTime };
}

export function deserializeFlashbacks(data) {
  if (data?.shown) _shownFlashbacks = new Set(data.shown);
  if (data?.lastTime) _lastFlashbackTime = data.lastTime;
}
