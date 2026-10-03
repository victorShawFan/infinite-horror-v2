// ═══════════════════════════════════════════════════════════════
// 成就通知系统 — 优雅的弹出式成就解锁提示
// ═══════════════════════════════════════════════════════════════

import { eventBus } from './EventBus.js';
import { ACHIEVEMENTS } from './AchievementSystem.js';

let _notifyQueue = [];
let _isShowing = false;

// ── 触发成就通知 ──
export function showAchievementNotify(achievementId) {
  const ach = ACHIEVEMENTS.find(a => a.id === achievementId);
  if (!ach) return;
  
  _notifyQueue.push(ach);
  if (!_isShowing) _showNext();
}

// ── 批量检查并通知 ──
export function checkAndNotifyAchievements(unlockedIds, previouslyUnlocked) {
  const prev = new Set(previouslyUnlocked || []);
  for (const id of unlockedIds) {
    if (!prev.has(id)) {
      showAchievementNotify(id);
    }
  }
}

function _showNext() {
  if (_notifyQueue.length === 0) {
    _isShowing = false;
    return;
  }
  _isShowing = true;
  const ach = _notifyQueue.shift();
  _renderNotification(ach);
}

function _renderNotification(ach) {
  if (typeof document === 'undefined') return;
  
  const existing = document.getElementById('achievement-notify');
  if (existing) existing.remove();
  
  const div = document.createElement('div');
  div.id = 'achievement-notify';
  div.style.cssText = `
    position: fixed; top: 20px; right: 20px; z-index: 500;
    background: linear-gradient(135deg, #1a1a2e, #16213e);
    border: 1px solid #ffcc4444;
    border-radius: 12px;
    padding: 12px 20px;
    display: flex; align-items: center; gap: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.5), 0 0 30px rgba(255,204,68,0.1);
    animation: achSlideIn 0.4s ease-out;
    pointer-events: none;
    max-width: 320px;
  `;
  
  const isHidden = ach.hidden;
  
  div.innerHTML = `
    <div style="font-size: 28px; flex-shrink: 0;
      animation: achBounce 0.5s ease-out 0.3s both;">
      ${ach.icon}
    </div>
    <div>
      <div style="color: #ffcc44; font-size: 10px; letter-spacing: 2px; margin-bottom: 2px;">
        ${isHidden ? '🔓 隐藏成就解锁!' : '🏆 成就解锁!'}
      </div>
      <div style="color: #ffffff; font-size: 14px; font-weight: bold;">
        ${ach.name}
      </div>
      <div style="color: #888; font-size: 10px; margin-top: 2px;">
        ${ach.desc}
      </div>
    </div>
    <style>
      @keyframes achSlideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes achBounce {
        0% { transform: scale(0); }
        60% { transform: scale(1.3); }
        100% { transform: scale(1); }
      }
      @keyframes achSlideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    </style>
  `;
  
  document.body.appendChild(div);
  
  // 3秒后淡出
  setTimeout(() => {
    div.style.animation = 'achSlideOut 0.3s ease-in forwards';
    setTimeout(() => {
      div.remove();
      _showNext();
    }, 300);
  }, 3000);
}

// ── 监听EventBus成就事件 ──
export function initAchievementNotifications() {
  eventBus.on('achievement:unlocked', (data) => {
    if (data?.id) showAchievementNotify(data.id);
  });
}
