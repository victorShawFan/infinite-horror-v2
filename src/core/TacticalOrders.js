// ═══════════════════════════════════════════════════════════════
// 队伍战术指令 — 队长对同伴发出简短命令
// ═══════════════════════════════════════════════════════════════
// 设计约束：
//   方向键/快捷轮发出"集火、撤离、掩护、互动"
//   玩家不能直接操控楚轩做每个决定
//   关键布局按剧情触发，但玩家负责按时执行
// ═══════════════════════════════════════════════════════════════

import { eventBus } from './EventBus.js';
import { gameState } from './GameState.js';

export const ORDER_TYPE = {
  FOCUS_FIRE: 'focus_fire',   // 集火 — 全队集中攻击当前目标
  RETREAT:    'retreat',       // 撤离 — 减少同伴受伤风险，降低输出
  COVER:      'cover',         // 掩护 — 同伴优先防御，给玩家减伤
  INTERACT:   'interact',      // 互动 — 同伴执行环境互动（解锁/治疗）
};

const ORDER_INFO = {
  [ORDER_TYPE.FOCUS_FIRE]: {
    name: '集火',
    icon: '⚔',
    color: '#ff4444',
    desc: '全队集中攻击目标',
    combatEffect: { companionDmgMult: 1.3, companionDefMult: 0.8 },
  },
  [ORDER_TYPE.RETREAT]: {
    name: '撤离',
    icon: '🏃',
    color: '#44ccff',
    desc: '降低伤害风险，减少输出',
    combatEffect: { companionDmgMult: 0.5, companionDefMult: 1.5, fleeBonusChance: 0.2 },
  },
  [ORDER_TYPE.COVER]: {
    name: '掩护',
    icon: '🛡',
    color: '#44ff88',
    desc: '同伴掩护，玩家减伤',
    combatEffect: { playerDamageReduce: 0.2, companionDmgMult: 0.7 },
  },
  [ORDER_TYPE.INTERACT]: {
    name: '互动',
    icon: '🔧',
    color: '#ffcc44',
    desc: '同伴协助环境互动',
    combatEffect: { healChance: 0.3, healAmount: 10 },
  },
};

let _currentOrder = ORDER_TYPE.FOCUS_FIRE; // 默认集火
let _orderCooldown = 0;

export function getCurrentOrder() {
  return { type: _currentOrder, ...ORDER_INFO[_currentOrder] };
}

export function setOrder(orderType) {
  if (_orderCooldown > 0) return false;
  if (!ORDER_INFO[orderType]) return false;
  
  _currentOrder = orderType;
  _orderCooldown = 2; // 2回合冷却
  eventBus.emit('order:issued', { type: orderType, info: ORDER_INFO[orderType] });
  return true;
}

export function tickOrderCooldown() {
  if (_orderCooldown > 0) _orderCooldown--;
}

export function getOrderCombatEffect() {
  return ORDER_INFO[_currentOrder]?.combatEffect || {};
}

export function resetOrders() {
  _currentOrder = ORDER_TYPE.FOCUS_FIRE;
  _orderCooldown = 0;
}

/** 渲染指令选择器HTML（用于战斗HUD） */
export function renderOrderSelector() {
  const aliveCount = (gameState.companions || []).filter(c => c.alive).length;
  if (aliveCount === 0) return '';
  
  return Object.entries(ORDER_INFO).map(([type, info]) => {
    const active = _currentOrder === type;
    return `<button class="order-btn" data-order="${type}" style="
      background: ${active ? info.color + '22' : 'rgba(255,255,255,0.03)'};
      border: 1px solid ${active ? info.color : '#333'};
      color: ${active ? info.color : '#666'};
      padding: 4px 10px; cursor: pointer; border-radius: 4px;
      font-size: 11px; font-family: inherit; transition: all 0.2s;
      ${_orderCooldown > 0 && !active ? 'opacity:0.4;pointer-events:none;' : ''}
    ">${info.icon} ${info.name}</button>`;
  }).join(' ');
}

export function getOrderDescription() {
  const info = ORDER_INFO[_currentOrder];
  if (!info) return '';
  return `${info.icon} 当前指令: ${info.name} — ${info.desc}`;
}
