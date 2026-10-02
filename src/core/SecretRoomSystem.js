// ═══════════════════════════════════════════════════════════════
// 隐藏房间系统 — 密道、可破坏墙壁、隐藏宝藏
// ═══════════════════════════════════════════════════════════════
//
// 类型:
// - 碎墙: 看似普通墙壁，攻击或互动后碎裂，露出密道
// - 暗门: 满足条件后打开的通道(如击败特定敌人、拥有特定物品)
// - 密室: 含有额外奖励的隐藏区域

import { TILE, ENTITY_TYPE } from './constants.js';
import { eventBus } from './EventBus.js';
import { gameState } from './GameState.js';

// ── 碎墙/密门定义 ──
export const SECRET_TYPES = {
  breakable_wall: {
    name: '碎裂墙壁', icon: '🧱', color: '#887766',
    desc: '看似普通的墙壁，实际可以击碎',
    requirement: 'atk', // ATK达到一定值可破
    minStat: 15,
    hint: '这面墙上有细微的裂缝...',
  },
  hidden_door: {
    name: '暗门', icon: '🚪', color: '#665544',
    desc: '隐藏在墙壁中的通道',
    requirement: 'flag', // 需要特定flag
    hint: '墙壁上似乎有不自然的接缝...',
  },
  illusory_wall: {
    name: '幻影墙', icon: '👻', color: '#8888aa',
    desc: '以魔法伪装的虚假墙壁',
    requirement: 'perception', // SPD/等级达标
    minStat: 8,
    hint: '微风从墙壁的方向吹来...',
  },
};

// ── 密室奖励池 ──
const SECRET_ROOM_REWARDS = {
  early: [ // Ch1-4
    { type: 'stat', stat: 'atk', value: 3, text: '⚔ 隐藏宝箱中藏着力量结晶！ATK+3' },
    { type: 'stat', stat: 'def', value: 3, text: '🛡 密室中的防御符文赐予你力量！DEF+3' },
    { type: 'stat', stat: 'maxHp', value: 40, text: '❤ 远古药剂恢复并强化你的体质！MaxHP+40' },
    { type: 'gold', value: 200, text: '💰 发现了藏匿的金币宝箱！+200G' },
    { type: 'key', keyType: 'yellow', count: 3, text: '🔑 墙壁后藏着一串钥匙！+3黄钥匙' },
    { type: 'consumable', id: 'potion_medium', count: 2, text: '🧪 发现了两瓶回复药！' },
  ],
  mid: [ // Ch5-8
    { type: 'stat', stat: 'atk', value: 5, text: '⚔ 远古武器精华被你吸收！ATK+5' },
    { type: 'stat', stat: 'def', value: 4, text: '🛡 护甲碎片融入你的防御！DEF+4' },
    { type: 'stat', stat: 'maxHp', value: 80, text: '❤ 生命之泉恢复你的极限！MaxHP+80' },
    { type: 'gold', value: 500, text: '💰 发现了精英怪的宝藏！+500G' },
    { type: 'key', keyType: 'blue', count: 2, text: '🔑 蓝色钥匙隐藏在此！+2蓝钥匙' },
    { type: 'consumable', id: 'potion_large', count: 1, text: '🧪 发现了大型回复药！' },
    { type: 'consumable', id: 'berserker_draught', count: 1, text: '🔥 发现了狂战士饮剂！' },
  ],
  late: [ // Ch9-12
    { type: 'stat', stat: 'atk', value: 8, text: '⚔ 终极力量注入你的身体！ATK+8' },
    { type: 'stat', stat: 'def', value: 6, text: '🛡 不朽护盾碎片融入你！DEF+6' },
    { type: 'stat', stat: 'maxHp', value: 150, text: '❤ 超越极限的生命力！MaxHP+150' },
    { type: 'gold', value: 1000, text: '💰 远古宝库的一部分！+1000G' },
    { type: 'key', keyType: 'red', count: 1, text: '🔑 稀有的红钥匙！+1红钥匙' },
    { type: 'consumable', id: 'elixir', count: 1, text: '✨ 传说中的万灵药！' },
  ],
};

/**
 * 检查玩家是否满足破墙条件
 */
export function canBreakSecret(secretType, player) {
  const def = SECRET_TYPES[secretType];
  if (!def) return false;
  
  switch (def.requirement) {
    case 'atk':
      return player.atk >= (def.minStat || 0);
    case 'perception':
      return (player.spd || 10) >= (def.minStat || 0) || player.level >= (def.minStat || 0);
    case 'flag':
      return true; // flag检查在其他地方处理
    default:
      return true;
  }
}

/**
 * 获取密室奖励
 */
export function getSecretRoomReward(chapter) {
  const pool = chapter <= 4 ? SECRET_ROOM_REWARDS.early
    : chapter <= 8 ? SECRET_ROOM_REWARDS.mid
    : SECRET_ROOM_REWARDS.late;
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * 应用密室奖励
 */
export function applySecretReward(reward) {
  const p = gameState.player;
  switch (reward.type) {
    case 'stat':
      if (reward.stat === 'maxHp') { p.maxHp += reward.value; p.hp += reward.value; }
      else if (reward.stat === 'atk') p.atk += reward.value;
      else if (reward.stat === 'def') p.def += reward.value;
      else if (reward.stat === 'spd') p.spd = (p.spd || 10) + reward.value;
      break;
    case 'gold':
      p.gold += reward.value;
      gameState.stats.goldEarned += reward.value;
      break;
    case 'key':
      p.keys[reward.keyType] = (p.keys[reward.keyType] || 0) + (reward.count || 1);
      break;
    case 'consumable':
      // 动态import避免ESM循环依赖
      import('./ConsumableSystem.js').then(m => {
        m.addConsumable(reward.id, reward.count || 1);
      }).catch(() => { /* fallback via eventBus */ });
      break;
  }
  gameState.stats.secretsFound = (gameState.stats.secretsFound || 0) + 1;
  eventBus.emit('secret:found', { reward });
}

/**
 * 在地图上生成隐藏入口
 * 找到墙壁旁边有空地的位置，标记为可破坏
 * @returns {Array} 密道实体列表
 */
export function generateSecretEntities(floor, chapter = 1) {
  if (!floor || !floor.map) return [];
  
  const map = floor.map;
  const secrets = [];
  const secretCount = Math.min(2, Math.floor(0.5 + chapter * 0.12));
  
  // 找到适合放置碎墙的位置（墙壁且两侧有空地）
  const candidates = [];
  for (let y = 2; y < map.length - 2; y++) {
    for (let x = 2; x < map[0].length - 2; x++) {
      if (map[y][x] !== TILE.WALL) continue;
      // 水平碎墙：左右都是空地
      if (map[y][x-1] === TILE.FLOOR && map[y][x+1] === TILE.FLOOR) {
        candidates.push({ x, y, direction: 'horizontal' });
      }
      // 垂直碎墙：上下都是空地
      if (map[y-1]?.[x] === TILE.FLOOR && map[y+1]?.[x] === TILE.FLOOR) {
        candidates.push({ x, y, direction: 'vertical' });
      }
    }
  }
  
  // 随机选择
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  
  const typeKeys = Object.keys(SECRET_TYPES);
  for (let i = 0; i < secretCount && i < candidates.length; i++) {
    const pos = candidates[i];
    const secretType = typeKeys[Math.floor(Math.random() * typeKeys.length)];
    const def = SECRET_TYPES[secretType];
    
    secrets.push({
      x: pos.x,
      y: pos.y,
      secretType,
      name: def.name,
      icon: def.icon,
      hint: def.hint,
      broken: false,
    });
  }
  
  return secrets;
}

/**
 * 尝试破坏密墙
 * @returns {{ success: boolean, message: string, reward?: object }}
 */
export function tryBreakSecret(secret, player, chapter = 1, chapterIdx = 0, floorIdx = 0) {
  if (secret.broken) return { success: false, message: '已经被打开了' };
  
  const def = SECRET_TYPES[secret.secretType];
  if (!def) return { success: false, message: '无效的密道类型' };
  
  if (!canBreakSecret(secret.secretType, player)) {
    return {
      success: false,
      message: def.hint + ` (需要${def.requirement === 'atk' ? 'ATK≥' + def.minStat : def.requirement === 'perception' ? 'SPD/等级≥' + def.minStat : '特定条件'})`,
    };
  }
  
  const reward = getSecretRoomReward(chapter);
  applySecretReward(reward);
  secret.broken = true;

  // 持久化到 GameState (跨存档保留)
  gameState.markSecretBroken(chapterIdx, floorIdx, secret.id || secret.secretType);
  
  return {
    success: true,
    message: `${def.icon} ${def.name}被打开了！\n${reward.text}`,
    reward,
  };
}


// ── 从存档恢复已破坏密道 ──
export function restoreBrokenSecrets(floor, chapterIdx, floorIdx) {
  if (!floor || !floor._secrets) return;
  const brokenSet = gameState.getBrokenSecrets(chapterIdx, floorIdx);
  if (brokenSet.size === 0) return;
  for (const secret of floor._secrets) {
    const key = secret.id || secret.secretType;
    if (brokenSet.has(key)) {
      secret.broken = true;
    }
  }
}
