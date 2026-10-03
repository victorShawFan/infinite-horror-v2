// ═══════════════════════════════════════════════════════════════
// 连锁反应系统 — 技能/状态/元素之间的深层交互
// ═══════════════════════════════════════════════════════════════
//
// 当特定条件组合触发时，产生额外的战斗效果：
// 1. 元素连锁：不同元素组合产生额外效果
// 2. 状态连锁：叠加状态触发爆发效果
// 3. 同伴连锁：同伴+玩家协同触发特殊攻击
// 4. 基因锁连锁：基因锁等级提升连锁威力
// ═══════════════════════════════════════════════════════════════

import { eventBus } from './EventBus.js';
import { DAMAGE_TYPE, GENE_LOCK } from './constants.js';

// ── 元素连锁定义 ──
const ELEMENT_CHAINS = {
  'fire+ice': {
    name: '蒸汽爆裂',
    icon: '💨',
    desc: '冰火交融产生蒸汽爆炸',
    dmgMultiplier: 1.5,
    aoePercent: 0.3,  // 30%溅射
    statusEffect: 'wet', // 附加潮湿
    color: '#aaddff',
  },
  'fire+poison': {
    name: '毒焰',
    icon: '🔥',
    desc: '毒素被点燃造成持续伤害',
    dmgMultiplier: 1.3,
    dot: { damage: 8, turns: 3 },
    color: '#88cc44',
  },
  'ice+lightning': {
    name: '冰晶导电',
    icon: '⚡',
    desc: '冰面导电造成范围麻痹',
    dmgMultiplier: 1.4,
    statusEffect: 'paralyzed',
    stunChance: 0.35,
    color: '#88ccff',
  },
  'lightning+wind': {
    name: '雷暴',
    icon: '🌩',
    desc: '风助雷势，威力倍增',
    dmgMultiplier: 1.6,
    pierceDefense: 0.25, // 忽略25%防御
    color: '#ffee44',
  },
  'dark+holy': {
    name: '虚无崩坏',
    icon: '✦',
    desc: '光暗对冲产生维度裂隙',
    dmgMultiplier: 2.0,
    trueDamagePercent: 0.15, // 最大HP 15%真实伤害
    color: '#cc88ff',
  },
  'poison+dark': {
    name: '腐蚀诅咒',
    icon: '☠',
    desc: '黑暗强化毒素侵蚀灵魂',
    dmgMultiplier: 1.3,
    dot: { damage: 12, turns: 4 },
    defReduce: 0.15, // 降低15%防御
    color: '#884488',
  },
  'fire+wind': {
    name: '烈焰风暴',
    icon: '🔥',
    desc: '火借风势席卷战场',
    dmgMultiplier: 1.5,
    burnChance: 0.5,
    color: '#ff8844',
  },
  'ice+dark': {
    name: '寒冰地狱',
    icon: '❄',
    desc: '暗冰吞噬一切温暖',
    dmgMultiplier: 1.4,
    slowPercent: 0.3,
    color: '#4444cc',
  },
  'holy+lightning': {
    name: '神圣审判',
    icon: '⚡',
    desc: '天雷降世净化邪恶',
    dmgMultiplier: 1.8,
    bonusVsUndead: 2.0,
    color: '#ffffaa',
  },
  'psychic+dark': {
    name: '心灵侵蚀',
    icon: '🧠',
    desc: '黑暗入侵意识深处',
    dmgMultiplier: 1.4,
    confuseChance: 0.3,
    color: '#cc44cc',
  },
};

// ── 状态连锁定义 ──
const STATUS_CHAINS = {
  'burn+frozen': {
    name: '热力冲击',
    icon: '💥',
    desc: '极端温差造成物质碎裂',
    bonusDamage: 25,
    removeStatus: ['burn', 'frozen'],
  },
  'poison+bleed': {
    name: '致命失血',
    icon: '🩸',
    desc: '毒素加速失血，伤势急剧恶化',
    dotMultiplier: 2.0,
    healReduce: 0.5, // 降低50%治疗
  },
  'paralyzed+burn': {
    name: '电击燃烧',
    icon: '⚡',
    desc: '麻痹目标无法躲避火焰',
    guaranteeCrit: true,
    bonusDamage: 15,
  },
  'wet+lightning': {
    name: '导电体质',
    icon: '💧',
    desc: '潮湿状态下雷电伤害翻倍',
    dmgMultiplier: 2.0,
    stunDuration: 2,
  },
  'wet+ice': {
    name: '极寒冻结',
    icon: '🧊',
    desc: '潮湿目标瞬间冻结',
    freezeDuration: 2,
    defPenalty: 0.2,
  },
};

// ── 连锁反应状态追踪 ──
let _recentElements = []; // 最近3次命中的元素
let _activeStatuses = new Set(); // 当前激活的状态
let _chainCount = 0; // 本场战斗触发的连锁次数
let _chainHistory = []; // 连锁历史记录

export function resetChainState() {
  _recentElements = [];
  _activeStatuses = new Set();
  _chainCount = 0;
  _chainHistory = [];
}

// ── 记录元素命中 ──
export function recordElementHit(element) {
  if (!element || element === 'physical') return null;
  _recentElements.push(element);
  if (_recentElements.length > 5) _recentElements.shift();
  
  // 检查元素连锁
  return checkElementChain(element);
}

// ── 记录状态施加 ──
export function recordStatusApplied(status) {
  _activeStatuses.add(status);
  return checkStatusChain(status);
}

export function recordStatusRemoved(status) {
  _activeStatuses.delete(status);
}

// ── 检查元素连锁 ──
function checkElementChain(newElement) {
  // 检查最近的元素是否可以组合
  for (let i = _recentElements.length - 2; i >= Math.max(0, _recentElements.length - 4); i--) {
    const prev = _recentElements[i];
    if (prev === newElement) continue;
    
    const key1 = prev + '+' + newElement;
    const key2 = newElement + '+' + prev;
    const chain = ELEMENT_CHAINS[key1] || ELEMENT_CHAINS[key2];
    
    if (chain) {
      _chainCount++;
      const result = {
        ...chain,
        type: 'element',
        elements: [prev, newElement],
        chainIndex: _chainCount,
      };
      _chainHistory.push(result);
      eventBus.emit('combat:chain_reaction', result);
      return result;
    }
  }
  return null;
}

// ── 检查状态连锁 ──
function checkStatusChain(newStatus) {
  for (const existing of _activeStatuses) {
    if (existing === newStatus) continue;
    
    const key1 = existing + '+' + newStatus;
    const key2 = newStatus + '+' + existing;
    const chain = STATUS_CHAINS[key1] || STATUS_CHAINS[key2];
    
    if (chain) {
      _chainCount++;
      const result = {
        ...chain,
        type: 'status',
        statuses: [existing, newStatus],
        chainIndex: _chainCount,
      };
      _chainHistory.push(result);
      eventBus.emit('combat:chain_reaction', result);
      return result;
    }
  }
  return null;
}

// ── 应用连锁伤害 ──
export function applyChainDamage(chain, baseDamage, geneLock = 0) {
  let damage = baseDamage;
  
  // 元素连锁伤害倍率
  if (chain.dmgMultiplier) {
    damage = Math.floor(damage * chain.dmgMultiplier);
  }
  
  // 固定附加伤害
  if (chain.bonusDamage) {
    damage += chain.bonusDamage;
  }
  
  // 真实伤害百分比（基于最大HP）
  if (chain.trueDamagePercent) {
    // 真实伤害在调用方处理
  }
  
  // 基因锁加成
  if (geneLock >= 2) damage = Math.floor(damage * 1.1);
  if (geneLock >= 4) damage = Math.floor(damage * 1.15);
  if (geneLock >= 6) damage = Math.floor(damage * 1.2);
  
  // 连锁次数奖励（越多连锁越强）
  if (_chainCount > 2) damage = Math.floor(damage * (1 + (_chainCount - 2) * 0.05));
  
  return damage;
}

// ── 获取连锁统计 ──
export function getChainStats() {
  return {
    count: _chainCount,
    history: [..._chainHistory],
    recentElements: [..._recentElements],
  };
}

// ── 获取可能的连锁预览（战术提示用） ──
export function getChainPreview(playerElements, enemyElement) {
  const possibleChains = [];
  
  for (const pe of playerElements) {
    for (const [key, chain] of Object.entries(ELEMENT_CHAINS)) {
      const [a, b] = key.split('+');
      if ((a === pe && b === enemyElement) || (b === pe && a === enemyElement)) {
        possibleChains.push({ ...chain, playerElement: pe, enemyElement });
      }
    }
  }
  
  return possibleChains;
}

// ── 渲染连锁提示HTML ──
export function renderChainReactionHtml(chain) {
  return `
    <div style="text-align:center;padding:8px 16px;background:linear-gradient(135deg,${chain.color}22,#00000088);
      border:1px solid ${chain.color}66;border-radius:8px;margin:4px 0;">
      <div style="font-size:18px;margin-bottom:2px;">${chain.icon}</div>
      <div style="color:${chain.color};font-weight:bold;font-size:13px;">${chain.name}</div>
      <div style="color:#aaa;font-size:10px;">${chain.desc}</div>
      ${chain.dmgMultiplier ? `<div style="color:#ffcc44;font-size:10px;">伤害 ×${chain.dmgMultiplier}</div>` : ''}
    </div>
  `;
}

// ── 连锁反应日志格式化 ──
export function formatChainLog(chain) {
  let text = `${chain.icon} 连锁反应: ${chain.name}！${chain.desc}`;
  if (chain.dmgMultiplier) text += ` (伤害×${chain.dmgMultiplier})`;
  return { text, type: 'chain_reaction', color: chain.color };
}
