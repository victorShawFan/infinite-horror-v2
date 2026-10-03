// ═══════════════════════════════════════════════════════════════
// 陷阱与宝藏系统 — 增强探索策略深度
// ═══════════════════════════════════════════════════════════════
//
// 类型: 地板陷阱(踩到触发) / 宝箱(有锁/有陷阱) / 隐藏通道 / 环境危害
// 玩家可通过高SPD闪避陷阱、用钥匙/芯片解除、或硬扛

import { getRelicCombatEffects } from './RelicSystem.js';
import { eventBus } from './EventBus.js';
import { addConsumable } from './ConsumableSystem.js';
import { gameState } from './GameState.js';
import { getEffectiveSpd, getEffectiveDef } from './CombatSystem.js';

// ── 陷阱定义 ──
export const TRAP_TYPES = {
  spike: {
    name: '地刺陷阱', icon: '🗡', color: '#ff4444',
    desc: '隐藏的地刺从地面弹出',
    baseDamage: 15, dodgeDC: 8,
    category: 'physical',
  },
  poison_gas: {
    name: '毒雾陷阱', icon: '☠', color: '#88ff44',
    desc: '释放腐蚀性毒气',
    baseDamage: 10, dodgeDC: 6,
    category: 'poison',
    statusEffect: { type: 'poison', turns: 3, dmgPerTurn: 5 },
  },
  laser_grid: {
    name: '激光网格', icon: '⚡', color: '#ff2200',
    desc: '高能激光从墙壁射出',
    baseDamage: 25, dodgeDC: 12,
    category: 'energy',
  },
  pit: {
    name: '落穴', icon: '🕳', color: '#885522',
    desc: '伪装的深坑',
    baseDamage: 20, dodgeDC: 10,
    category: 'physical',
    dropToFloor: true, // 掉到下一层（如果有）
  },
  alarm: {
    name: '警报装置', icon: '🔔', color: '#ffcc00',
    desc: '触发警报，附近敌人增强',
    baseDamage: 0, dodgeDC: 5,
    category: 'alert',
    areaEffect: { enemyAtkBuff: 0.15, range: 3 },
  },
  curse: {
    name: '诅咒符文', icon: '💀', color: '#aa44ff',
    desc: '远古诅咒削弱你的力量',
    baseDamage: 5, dodgeDC: 14,
    category: 'magic',
    debuff: { atk: -3, def: -2, duration: 'floor' },
  },
  mimic: {
    name: '拟态宝箱', icon: '📦', color: '#ff8800',
    desc: '看似宝箱实为怪物',
    baseDamage: 0, dodgeDC: 0,
    category: 'combat',
    spawnEnemy: true,
  },
};

// ── 宝箱类型 ──
export const CHEST_TYPES = {
  wooden: {
    name: '木箱', icon: '📦', color: '#aa8844',
    lockLevel: 0, // 无锁
    trapChance: 0.1,
    lootTable: 'common',
  },
  iron: {
    name: '铁箱', icon: '🗃', color: '#8888aa',
    lockLevel: 1, // 需要黄钥匙
    trapChance: 0.2,
    lootTable: 'uncommon',
  },
  golden: {
    name: '金箱', icon: '✨', color: '#ffcc44',
    lockLevel: 2, // 需要蓝钥匙
    trapChance: 0.3,
    lootTable: 'rare',
  },
  cursed: {
    name: '诅咒宝箱', icon: '💀', color: '#aa44ff',
    lockLevel: 0,
    trapChance: 0.8,
    lootTable: 'rare_cursed', // 高奖励但高风险
  },
};

// ── 宝箱奖励池 ──
const CHEST_LOOT = {
  common: [
    { type: 'gold', min: 20, max: 60 },
    { type: 'heal', value: 30 },
    { type: 'key', keyType: 'yellow', count: 1 },
    { type: 'exp', min: 15, max: 40 },
    { type: 'consumable', consumableId: 'potion_small', count: 1 },
    { type: 'consumable', consumableId: 'antidote', count: 1 },
  ],
  uncommon: [
    { type: 'gold', min: 50, max: 150 },
    { type: 'heal', value: 80 },
    { type: 'stat', stat: 'atk', value: 2 },
    { type: 'stat', stat: 'def', value: 2 },
    { type: 'key', keyType: 'blue', count: 1 },
    { type: 'exp', min: 40, max: 80 },
    { type: 'consumable', consumableId: 'potion_medium', count: 1 },
    { type: 'consumable', consumableId: 'atk_tonic', count: 1 },
    { type: 'consumable', consumableId: 'trap_detector', count: 1 },
  ],
  rare: [
    { type: 'gold', min: 150, max: 400 },
    { type: 'stat', stat: 'atk', value: 5 },
    { type: 'stat', stat: 'def', value: 4 },
    { type: 'stat', stat: 'maxHp', value: 30 },
    { type: 'key', keyType: 'red', count: 1 },
    { type: 'exp', min: 80, max: 160 },
    { type: 'rewardPoints', min: 5, max: 15 },
    { type: 'consumable', consumableId: 'potion_large', count: 1 },
    { type: 'consumable', consumableId: 'berserker_draught', count: 1 },
    { type: 'consumable', consumableId: 'teleport_stone', count: 1 },
  ],
  rare_cursed: [
    { type: 'gold', min: 300, max: 800 },
    { type: 'stat', stat: 'atk', value: 8 },
    { type: 'stat', stat: 'def', value: 6 },
    { type: 'stat', stat: 'maxHp', value: 60 },
    { type: 'rewardPoints', min: 10, max: 30 },
  ],
};

/**
 * 判定是否闪避陷阱
 * @param {string} trapType - 陷阱类型ID
 * @param {object} player - 玩家状态
 * @returns {{ dodged: boolean, roll: number, dc: number }}
 */
export function rollTrapDodge(trapType, player) {
  const trap = TRAP_TYPES[trapType];
  if (!trap) return { dodged: true, roll: 20, dc: 0 };
  const spd = getEffectiveSpd(player);
  // d20 + SPD修正 >= DC
  const roll = Math.floor(Math.random() * 20) + 1 + Math.floor(spd / 3);
  return { dodged: roll >= trap.dodgeDC, roll, dc: trap.dodgeDC };
}

/**
 * 计算陷阱伤害（考虑防御和章节缩放）
 */
export function calcTrapDamage(trapType, chapter = 1) {
  const trap = TRAP_TYPES[trapType];
  if (!trap) return 0;
  const p = gameState.player;
  const def = getEffectiveDef(p);
  const chapterScale = 1 + (chapter - 1) * 0.1;
  const rawDmg = Math.ceil(trap.baseDamage * chapterScale);
  // 物理陷阱受防御减免，其他类型减免一半
  const defReduce = trap.category === 'physical' ? def : Math.floor(def * 0.5);
  return Math.max(1, rawDmg - defReduce);
}

/**
 * 触发陷阱效果
 * @returns {{ damage: number, dodged: boolean, effect: string, statusEffect?: object }}
 */
export function triggerTrap(trapType, chapter = 1) {
  const trap = TRAP_TYPES[trapType];
  if (!trap) return { damage: 0, dodged: true, effect: '' };

  const p = gameState.player;
  const dodgeResult = rollTrapDodge(trapType, p);

  if (dodgeResult.dodged) {
    gameState.stats.trapsEvaded = (gameState.stats.trapsEvaded || 0) + 1;
    return {
      damage: 0,
      dodged: true,
      effect: `💨 ${trap.icon} ${trap.name}: 闪避成功! (${dodgeResult.roll} vs DC${dodgeResult.dc})`,
      roll: dodgeResult,
    };
  }

  const damage = calcTrapDamage(trapType, chapter);
  p.hp = Math.max(1, p.hp - damage);
  gameState.stats.trapsTriggered = (gameState.stats.trapsTriggered || 0) + 1;

  const result = {
    damage,
    dodged: false,
    effect: `${trap.icon} ${trap.name}: 受到 ${damage} 点伤害! (${dodgeResult.roll} vs DC${dodgeResult.dc})`,
    roll: dodgeResult,
  };

  // 附加状态效果
  if (trap.statusEffect) {
    result.statusEffect = { ...trap.statusEffect };
    result.effect += ` [${trap.statusEffect.type} ${trap.statusEffect.turns}回合]`;
  }

  // 附加debuff
  if (trap.debuff) {
    if (trap.debuff.atk) p.atk = Math.max(1, p.atk + trap.debuff.atk);
    if (trap.debuff.def) p.def = Math.max(0, p.def + trap.debuff.def);
    result.debuff = { ...trap.debuff };
    result.effect += ` [ATK${trap.debuff.atk || 0} DEF${trap.debuff.def || 0}]`;
  }

  eventBus.emit('trap:triggered', { type: trapType, damage, dodged: false });
  return result;
}

/**
 * 打开宝箱
 * @returns {{ success: boolean, loot: object[], trapResult?: object, message: string }}
 */
export function openChest(chestType, chapter = 1) {
  const chest = CHEST_TYPES[chestType];
  if (!chest) return { success: false, loot: [], message: '无效宝箱' };

  const p = gameState.player;

  // 检查钥匙
  if (chest.lockLevel > 0) {
    const keyTypes = ['yellow', 'blue', 'red'];
    const neededKey = keyTypes[chest.lockLevel - 1];
    if (!p.keys[neededKey] || p.keys[neededKey] <= 0) {
      return { success: false, loot: [], message: `需要${neededKey === 'yellow' ? '黄' : neededKey === 'blue' ? '蓝' : '红'}钥匙` };
    }
    p.keys[neededKey]--;
  }

  // 陷阱检测
  let trapResult = null;
  if (Math.random() < chest.trapChance) {
    const trapTypes = Object.keys(TRAP_TYPES).filter(t => t !== 'alarm' && t !== 'mimic');
    const randomTrap = trapTypes[Math.floor(Math.random() * trapTypes.length)];
    trapResult = triggerTrap(randomTrap, chapter);
  }

  // 生成奖励
  const pool = CHEST_LOOT[chest.lootTable] || CHEST_LOOT.common;
  let numLoot = chest.lootTable.includes('rare') ? 2 : 1;
  // 遗物：破碎罗盘——探索事件额外奖励概率
  try {
    const _relicFx = getRelicCombatEffects();
    if (_relicFx.eventBonusChance > 0 && Math.random() < _relicFx.eventBonusChance) {
      numLoot++;
    }
  } catch {}
  const loot = [];

  for (let i = 0; i < numLoot; i++) {
    const template = pool[Math.floor(Math.random() * pool.length)];
    const item = { ...template };
    if (item.min !== undefined && item.max !== undefined) {
      item.value = item.min + Math.floor(Math.random() * (item.max - item.min + 1));
    }
    loot.push(item);
    applyChestLoot(item);
  }

  gameState.stats.chestsOpened = (gameState.stats.chestsOpened || 0) + 1;
  eventBus.emit('chest:opened', { type: chestType, loot, hadTrap: !!trapResult });

  return {
    success: true,
    loot,
    trapResult,
    message: formatChestResult(loot, trapResult),
  };
}

/** 应用宝箱奖励到玩家 */
function applyChestLoot(item) {
  const p = gameState.player;
  switch (item.type) {
    case 'gold':
      p.gold += item.value;
      gameState.stats.goldEarned += item.value;
      break;
    case 'heal':
      p.hp = Math.min(p.maxHp, p.hp + item.value);
      break;
    case 'exp':
      gameState.addExp(item.value);
      break;
    case 'key':
      p.keys[item.keyType] = (p.keys[item.keyType] || 0) + (item.count || 1);
      break;
    case 'stat':
      if (item.stat === 'maxHp') { p.maxHp += item.value; p.hp += item.value; }
      else if (item.stat === 'atk') p.atk += item.value;
      else if (item.stat === 'def') p.def += item.value;
      else if (item.stat === 'spd') p.spd = (p.spd || 10) + item.value;
      break;
    case 'rewardPoints':
      p.rewardPoints = (p.rewardPoints || 0) + item.value;
      break;
    case 'consumable':
      addConsumable(item.consumableId, item.count || 1);
      break;
  }
}

/** 格式化宝箱结果为显示文本 */
function formatChestResult(loot, trapResult) {
  let msg = '';
  if (trapResult) {
    msg += trapResult.effect + '\n';
  }
  const lootTexts = loot.map(item => {
    switch (item.type) {
      case 'gold': return `💰 +${item.value}G`;
      case 'heal': return `❤ +${item.value}HP`;
      case 'exp': return `✦ +${item.value}EXP`;
      case 'key': return `🔑 +${item.count || 1}${item.keyType === 'yellow' ? '黄' : item.keyType === 'blue' ? '蓝' : '红'}钥匙`;
      case 'stat': return `⬆ ${item.stat.toUpperCase()} +${item.value}`;
      case 'rewardPoints': return `🏆 +${item.value}RP`;
      case 'consumable': return `📦 ${item.consumableId} x${item.count || 1}`;
      default: return `? ${item.type}`;
    }
  });
  msg += '获得: ' + lootTexts.join(', ');
  return msg;
}

/**
 * 检测某个tile是否有隐藏陷阱
 * 用于地图生成时标记陷阱位置
 */
export function generateFloorTraps(floorEntities, chapter = 1) {
  const traps = [];
  const emptyTiles = []; // 需要从外部获取

  // 陷阱密度：根据章节递增
  const trapCount = Math.min(3, Math.floor(1 + chapter * 0.3));
  const trapTypeKeys = Object.keys(TRAP_TYPES).filter(t => t !== 'mimic');

  for (let i = 0; i < trapCount; i++) {
    const trapType = trapTypeKeys[Math.floor(Math.random() * trapTypeKeys.length)];
    traps.push({
      type: 'trap',
      trapType,
      visible: false, // 隐藏直到触发或被发现
      triggered: false,
    });
  }

  return traps;
}
