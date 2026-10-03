// ═══════════════════════════════════════════════════════════════
// 楼层精通系统 — 完美探索奖励
// ═══════════════════════════════════════════════════════════════
//
// 每层有三个精通条件：
// 1. 全歼：击败所有敌人
// 2. 搜刮：拾取所有物品
// 3. 发现：触发所有事件/对话
//
// 达成条件获得星级评价(0-3星)和额外奖励
// 达成3星解锁特殊成就

import { eventBus } from './EventBus.js';
import { gameState } from './GameState.js';

// ── 精通记录 ──
let _masteryData = {};
// 格式: { '1-1': { enemies: { total: 5, killed: 5 }, items: { total: 3, collected: 3 }, events: { total: 2, triggered: 2 }, stars: 3 } }

/**
 * 初始化楼层精通追踪
 */
export function initFloorMastery(floorId, entities) {
  const enemies = entities.filter(e => e.type === 'enemy' || e.type === 'boss').length;
  const items = entities.filter(e => e.type === 'item').length;
  const events = entities.filter(e => e.type === 'event' || e.type === 'companion').length;
  
  _masteryData[floorId] = {
    enemies: { total: enemies, killed: 0 },
    items: { total: items, collected: 0 },
    events: { total: events, triggered: 0 },
    stars: 0,
    completed: false,
  };
}

/**
 * 记录击杀
 */
export function recordFloorKill(floorId) {
  const m = _masteryData[floorId];
  if (m) m.enemies.killed = Math.min(m.enemies.total, m.enemies.killed + 1);
}

/**
 * 记录拾取
 */
export function recordFloorCollect(floorId) {
  const m = _masteryData[floorId];
  if (m) m.items.collected = Math.min(m.items.total, m.items.collected + 1);
}

/**
 * 记录事件触发
 */
export function recordFloorEvent(floorId) {
  const m = _masteryData[floorId];
  if (m) m.events.triggered = Math.min(m.events.total, m.events.triggered + 1);
}

/**
 * 计算楼层星级
 */
export function calculateFloorStars(floorId) {
  const m = _masteryData[floorId];
  if (!m) return 0;
  
  let stars = 0;
  if (m.enemies.total === 0 || m.enemies.killed >= m.enemies.total) stars++;
  if (m.items.total === 0 || m.items.collected >= m.items.total) stars++;
  if (m.events.total === 0 || m.events.triggered >= m.events.total) stars++;
  
  m.stars = stars;
  m.completed = true;
  return stars;
}

/**
 * 获取精通奖励
 */
export function getFloorMasteryRewards(floorId, chapter) {
  const stars = calculateFloorStars(floorId);
  const baseExp = 10 + chapter * 5;
  const baseGold = 20 + chapter * 10;
  
  const rewards = {
    stars,
    exp: stars * baseExp,
    gold: stars * baseGold,
    rewardPoints: stars === 3 ? 50 + chapter * 10 : 0,
    bonusText: [],
  };
  
  if (stars >= 1) rewards.bonusText.push('⭐ 全歼奖励');
  if (stars >= 2) rewards.bonusText.push('⭐ 搜刮奖励');
  if (stars >= 3) {
    rewards.bonusText.push('⭐ 完美探索');
    rewards.bonusText.push('🏆 +' + rewards.rewardPoints + '奖励点');
  }
  
  return rewards;
}

/**
 * 获取楼层精通状态
 */
export function getFloorMasteryStatus(floorId) {
  return _masteryData[floorId] || null;
}

/**
 * 渲染精通结果弹窗HTML
 */
export function renderMasteryPopup(floorId, chapter) {
  const m = _masteryData[floorId];
  if (!m) return '';
  
  const rewards = getFloorMasteryRewards(floorId, chapter);
  const starDisplay = '⭐'.repeat(rewards.stars) + '☆'.repeat(3 - rewards.stars);
  
  const pctEnemy = m.enemies.total > 0 ? Math.floor(m.enemies.killed / m.enemies.total * 100) : 100;
  const pctItems = m.items.total > 0 ? Math.floor(m.items.collected / m.items.total * 100) : 100;
  const pctEvents = m.events.total > 0 ? Math.floor(m.events.triggered / m.events.total * 100) : 100;
  
  const barColor = (pct) => pct >= 100 ? '#44ff88' : pct >= 50 ? '#ffcc44' : '#ff4444';
  
  return `
    <div style="text-align:center;padding:16px;">
      <p style="font-size:28px;letter-spacing:4px;margin-bottom:4px;">${starDisplay}</p>
      <p style="color:#888;font-size:11px;letter-spacing:2px;margin-bottom:12px;">楼 层 精 通</p>
      
      <div style="display:flex;flex-direction:column;gap:8px;max-width:280px;margin:0 auto;">
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="color:#ff4444;font-size:12px;width:60px;">⚔ 全歼</span>
          <div style="flex:1;height:8px;background:#111;border-radius:4px;overflow:hidden;">
            <div style="height:100%;width:${pctEnemy}%;background:${barColor(pctEnemy)};border-radius:4px;transition:width 0.5s;"></div>
          </div>
          <span style="color:#888;font-size:10px;width:40px;text-align:right;">${m.enemies.killed}/${m.enemies.total}</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="color:#ffcc44;font-size:12px;width:60px;">📦 搜刮</span>
          <div style="flex:1;height:8px;background:#111;border-radius:4px;overflow:hidden;">
            <div style="height:100%;width:${pctItems}%;background:${barColor(pctItems)};border-radius:4px;transition:width 0.5s;"></div>
          </div>
          <span style="color:#888;font-size:10px;width:40px;text-align:right;">${m.items.collected}/${m.items.total}</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;">
          <span style="color:#44aaff;font-size:12px;width:60px;">💬 发现</span>
          <div style="flex:1;height:8px;background:#111;border-radius:4px;overflow:hidden;">
            <div style="height:100%;width:${pctEvents}%;background:${barColor(pctEvents)};border-radius:4px;transition:width 0.5s;"></div>
          </div>
          <span style="color:#888;font-size:10px;width:40px;text-align:right;">${m.events.triggered}/${m.events.total}</span>
        </div>
      </div>
      
      ${rewards.exp > 0 || rewards.gold > 0 ? `
      <div style="margin-top:12px;display:flex;justify-content:center;gap:12px;">
        ${rewards.exp > 0 ? '<span style="color:#aa88ff;font-size:12px;">+' + rewards.exp + ' EXP</span>' : ''}
        ${rewards.gold > 0 ? '<span style="color:#ffcc44;font-size:12px;">+' + rewards.gold + 'G</span>' : ''}
        ${rewards.rewardPoints > 0 ? '<span style="color:#ff8844;font-size:12px;">+' + rewards.rewardPoints + 'RP</span>' : ''}
      </div>` : ''}
    </div>
  `;
}

// ── 序列化 ──
export function serializeFloorMastery() {
  return { ..._masteryData };
}

export function deserializeFloorMastery(data) {
  if (data) _masteryData = { ...data };
}

export function resetFloorMastery() {
  _masteryData = {};
}
