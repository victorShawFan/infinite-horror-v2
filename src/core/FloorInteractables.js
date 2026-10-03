// ═══════════════════════════════════════════════════════════════
// 楼层交互物系统 — 魔塔式探索元素
// ═══════════════════════════════════════════════════════════════
//
// 在探索中增加多种可交互物体:
// - 生命泉: 恢复一定比例HP
// - 法力泉: 恢复一定比例MP
// - 属性祭坛: 永久提升1点属性
// - 经验水晶: 获得大量经验
// - 传送阵: 在同层两点间传送
// - 隐藏墙壁: 可以破坏的墙壁，通向秘密区域
//
// 交互物生成规则:
// - 每层随机分配2-4个交互物
// - 后期章节出现更强的交互物
// - 部分交互物需要满足条件

import { ENTITY_TYPE } from './constants.js';
import { gameState } from './GameState.js';

// ── 交互物类型定义 ──
export const INTERACTABLE_TYPES = {
  hp_fountain: {
    name: '生命之泉',
    sprite: '💧',
    color: '#44ff88',
    desc: '清澈的泉水散发着治愈的气息',
    category: 'heal',
  },
  mp_fountain: {
    name: '法力之泉', 
    sprite: '💜',
    color: '#8844ff',
    desc: '紫色的能量从泉水中溢出',
    category: 'heal',
  },
  atk_shrine: {
    name: '力量祭坛',
    sprite: '⚔',
    color: '#ff6644',
    desc: '古老的祭坛上刻着力量符文',
    category: 'stat',
    stat: 'atk',
  },
  def_shrine: {
    name: '防御祭坛',
    sprite: '🛡',
    color: '#6688ff',
    desc: '坚固的石碑散发着防护光芒',
    category: 'stat',
    stat: 'def',
  },
  spd_shrine: {
    name: '速度祭坛',
    sprite: '💨',
    color: '#44ffaa',
    desc: '微风环绕的祭坛，令人感到轻盈',
    category: 'stat',
    stat: 'spd',
  },
  exp_crystal: {
    name: '经验水晶',
    sprite: '💎',
    color: '#aa88ff',
    desc: '蕴含丰富经验的水晶',
    category: 'exp',
  },
  gold_chest: {
    name: '宝箱',
    sprite: '📦',
    color: '#ffcc44',
    desc: '精致的宝箱，里面藏着金币',
    category: 'gold',
  },
  soul_altar: {
    name: '灵魂祭坛',
    sprite: '🔮',
    color: '#ff44aa',
    desc: '暗紫色的祭坛，可以转化灵魂碎片',
    category: 'shard',
  },
  teleporter: {
    name: '传送阵',
    sprite: '🌀',
    color: '#44aaff',
    desc: '环形光阵，似乎可以传送到某处',
    category: 'teleport',
  },
  karma_shrine: {
    name: '道德之碑',
    sprite: '⚖',
    color: '#ffcc44',
    desc: '刻满古文的石碑，似乎在审视你的灵魂',
    category: 'karma',
  },
};

// ── 章节交互物配置 ──
// 每个章节可以出现的交互物类型和权重
const CHAPTER_INTERACTABLE_POOL = {
  2:  { types: ['hp_fountain', 'gold_chest', 'exp_crystal'], countPerFloor: [2, 3] },
  3:  { types: ['hp_fountain', 'mp_fountain', 'gold_chest', 'exp_crystal', 'atk_shrine'], countPerFloor: [2, 3] },
  4:  { types: ['hp_fountain', 'mp_fountain', 'gold_chest', 'exp_crystal', 'atk_shrine', 'def_shrine'], countPerFloor: [2, 4] },
  5:  { types: ['hp_fountain', 'mp_fountain', 'gold_chest', 'exp_crystal', 'atk_shrine', 'def_shrine', 'spd_shrine'], countPerFloor: [2, 4] },
  6:  { types: ['hp_fountain', 'mp_fountain', 'gold_chest', 'exp_crystal', 'atk_shrine', 'def_shrine', 'spd_shrine', 'teleporter'], countPerFloor: [3, 4] },
  7:  { types: ['hp_fountain', 'mp_fountain', 'gold_chest', 'exp_crystal', 'atk_shrine', 'def_shrine', 'spd_shrine', 'teleporter', 'soul_altar'], countPerFloor: [3, 4] },
  8:  { types: ['hp_fountain', 'mp_fountain', 'gold_chest', 'exp_crystal', 'atk_shrine', 'def_shrine', 'spd_shrine', 'teleporter', 'soul_altar'], countPerFloor: [3, 5] },
  9:  { types: ['hp_fountain', 'mp_fountain', 'gold_chest', 'exp_crystal', 'atk_shrine', 'def_shrine', 'spd_shrine', 'teleporter', 'soul_altar', 'karma_shrine'], countPerFloor: [3, 5] },
  10: { types: ['hp_fountain', 'mp_fountain', 'gold_chest', 'exp_crystal', 'atk_shrine', 'def_shrine', 'spd_shrine', 'teleporter', 'soul_altar', 'karma_shrine'], countPerFloor: [3, 5] },
  11: { types: ['hp_fountain', 'mp_fountain', 'gold_chest', 'exp_crystal', 'atk_shrine', 'def_shrine', 'spd_shrine', 'teleporter', 'soul_altar', 'karma_shrine'], countPerFloor: [3, 5] },
  12: { types: ['hp_fountain', 'mp_fountain', 'gold_chest', 'exp_crystal', 'atk_shrine', 'def_shrine', 'spd_shrine', 'teleporter', 'soul_altar', 'karma_shrine'], countPerFloor: [4, 6] },
};

/**
 * 使用确定性伪随机数（基于章节和楼层种子）
 */
function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

/**
 * 为一个楼层生成交互物实体
 * @param {number} chapter - 章节号
 * @param {number} floorIndex - 楼层索引
 * @param {Array} entities - 已有实体
 * @param {Array[]} tiles - 地图瓦片
 * @returns {Array} 添加了交互物的实体数组
 */
export function injectInteractables(chapter, floorIndex, entities, tiles) {
  if (chapter <= 1) return entities; // Ch1 has its own events
  
  const pool = CHAPTER_INTERACTABLE_POOL[chapter];
  if (!pool) return entities;
  
  const rand = seededRandom(chapter * 1000 + floorIndex * 100 + 42);
  const [minCount, maxCount] = pool.countPerFloor;
  const count = minCount + Math.floor(rand() * (maxCount - minCount + 1));
  
  // 收集可用位置
  const occupied = new Set();
  for (const e of entities) occupied.add(`${e.x},${e.y}`);
  
  const rows = tiles.length;
  const cols = tiles[0]?.length || 0;
  const candidates = [];
  
  for (let y = 1; y < rows - 1; y++) {
    for (let x = 1; x < cols - 1; x++) {
      if (tiles[y][x] !== 1) continue;
      if (occupied.has(`${x},${y}`)) continue;
      let adjacent = 0;
      if (tiles[y-1]?.[x] === 1) adjacent++;
      if (tiles[y+1]?.[x] === 1) adjacent++;
      if (tiles[y]?.[x-1] === 1) adjacent++;
      if (tiles[y]?.[x+1] === 1) adjacent++;
      if (adjacent >= 2) candidates.push({ x, y });
    }
  }
  
  // Shuffle candidates using seeded random
  for (let i = candidates.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  
  if (candidates.length < count) return entities;
  
  const newEntities = [...entities];
  const usedTypes = new Set();
  let teleporterPair = null;
  
  for (let i = 0; i < count && i < candidates.length; i++) {
    // Pick a random type from the pool
    let typeId;
    let attempts = 0;
    do {
      typeId = pool.types[Math.floor(rand() * pool.types.length)];
      attempts++;
    } while (usedTypes.has(typeId) && typeId !== 'gold_chest' && typeId !== 'hp_fountain' && attempts < 20);
    
    if (typeId !== 'gold_chest' && typeId !== 'hp_fountain') usedTypes.add(typeId);
    
    const typeDef = INTERACTABLE_TYPES[typeId];
    if (!typeDef) continue;
    
    const pos = candidates[i];
    
    // Handle teleporter pairs
    if (typeId === 'teleporter') {
      if (!teleporterPair && i + 1 < candidates.length) {
        const pairPos = candidates[i + 1];
        teleporterPair = { fromX: pos.x, fromY: pos.y, toX: pairPos.x, toY: pairPos.y };
        
        // Add both teleporters
        newEntities.push({
          type: ENTITY_TYPE.EVENT,
          id: `teleporter_a_${chapter}_${floorIndex}`,
          name: typeDef.name + ' A',
          x: pos.x, y: pos.y,
          sprite: typeDef.sprite,
          color: typeDef.color,
          interactableType: typeId,
          teleportTarget: { x: pairPos.x, y: pairPos.y },
          eventType: 'interactable',
        });
        newEntities.push({
          type: ENTITY_TYPE.EVENT,
          id: `teleporter_b_${chapter}_${floorIndex}`,
          name: typeDef.name + ' B',
          x: pairPos.x, y: pairPos.y,
          sprite: typeDef.sprite,
          color: typeDef.color,
          interactableType: typeId,
          teleportTarget: { x: pos.x, y: pos.y },
          eventType: 'interactable',
        });
        i++; // Skip next candidate (used for pair)
        continue;
      } else {
        continue; // Can't create pair, skip
      }
    }
    
    newEntities.push({
      type: ENTITY_TYPE.EVENT,
      id: `interactable_${typeId}_${chapter}_${floorIndex}_${i}`,
      name: typeDef.name,
      x: pos.x, y: pos.y,
      sprite: typeDef.sprite,
      color: typeDef.color,
      interactableType: typeId,
      eventType: 'interactable',
    });
  }
  
  return newEntities;
}

/**
 * 处理交互物的效果
 * @param {Object} entity - 交互物实体
 * @returns {{ text, consumed }}
 */
export function activateInteractable(entity) {
  const typeId = entity.interactableType;
  const typeDef = INTERACTABLE_TYPES[typeId];
  if (!typeDef) return { text: '无法互动。', consumed: false };
  
  const p = gameState.player;
  const chapter = gameState.chapter || 1;
  
  switch (typeDef.category) {
    case 'heal': {
      if (typeId === 'hp_fountain') {
        const healPct = 0.25 + chapter * 0.02; // 25-49%
        const healAmt = Math.floor(p.maxHp * healPct);
        p.hp = Math.min(p.maxHp, p.hp + healAmt);
        return { text: `${typeDef.name}恢复了 ${healAmt} HP！`, consumed: true, floatText: `+${healAmt} HP`, floatColor: '#44ff88' };
      }
      if (typeId === 'mp_fountain') {
        if (!p.maxMana || p.maxMana <= 0) return { text: '你还没有解锁法力。', consumed: false };
        const mpPct = 0.30 + chapter * 0.02;
        const mpAmt = Math.floor(p.maxMana * mpPct);
        p.mana = Math.min(p.maxMana, (p.mana || 0) + mpAmt);
        return { text: `${typeDef.name}恢复了 ${mpAmt} 法力！`, consumed: true, floatText: `+${mpAmt} MP`, floatColor: '#8844ff' };
      }
      break;
    }
    case 'stat': {
      const stat = typeDef.stat;
      const boost = stat === 'spd' ? 1 : 2;
      p[stat] = (p[stat] || 0) + boost;
      const statNames = { atk: '攻击', def: '防御', spd: '速度' };
      return { text: `${typeDef.name}！${statNames[stat]} 永久 +${boost}！`, consumed: true, floatText: `${statNames[stat]}+${boost}`, floatColor: typeDef.color };
    }
    case 'exp': {
      const exp = 20 + chapter * 15;
      p.exp += exp;
      return { text: `${typeDef.name}蕴含的能量涌入身体！+${exp} EXP`, consumed: true, floatText: `+${exp} EXP`, floatColor: '#aa88ff' };
    }
    case 'gold': {
      const gold = 30 + chapter * 20;
      p.gold += gold;
      return { text: `${typeDef.name}里装满了金币！+${gold} G`, consumed: true, floatText: `+${gold}G`, floatColor: '#ffcc44' };
    }
    case 'shard': {
      const shards = 5 + chapter * 3;
      gameState.soulShards = (gameState.soulShards || 0) + shards;
      return { text: `${typeDef.name}转化出 ${shards} 灵魂碎片！`, consumed: true, floatText: `+${shards}碎片`, floatColor: '#ff44aa' };
    }
    case 'teleport': {
      if (entity.teleportTarget) {
        return { 
          text: '传送阵激活！你被传送到了另一端。', 
          consumed: false, // 传送阵不消失
          teleport: entity.teleportTarget,
          floatText: '传送！', 
          floatColor: '#44aaff' 
        };
      }
      return { text: '传送阵似乎已经失效了。', consumed: false };
    }
    case 'karma': {
      // 道德之碑：随机+1或-1业力，取决于玩家选择
      const currentKarma = gameState.karma || 0;
      gameState.karma = currentKarma + 1; // 默认善念
      return { 
        text: '你在道德之碑前沉思，心中升起一丝善念。业力 +1', 
        consumed: true, 
        floatText: '业力+1', 
        floatColor: '#ffcc44',
        isKarma: true,
      };
    }
  }
  
  return { text: '无法互动。', consumed: false };
}
