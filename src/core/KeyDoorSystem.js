// ═══════════════════════════════════════════════════════════════
// 钥匙与门系统 — 魔塔式探索机制
// ═══════════════════════════════════════════════════════════════
//
// 每个章节的楼层都有钥匙和门的分布:
// - 黄色门卡/门: 最常见，通往普通区域
// - 蓝色门卡/门: 较稀少，通往奖励区域
// - 红色门卡/门: 最稀有，通往Boss或宝箱区域
//
// 钥匙管理是核心策略：
// - 每层固定数量的钥匙，用完无法回头
// - 某些门后藏有更多钥匙（循环链）
// - Boss门通常需要红色钥匙
// - 钥匙数量决定了你能探索多少区域
//
// 门后奖励递增:
// - 黄门: 小型奖励(金币/HP药)
// - 蓝门: 中型奖励(装备/经验)
// - 红门: 大型奖励(传说装备/技能书)

import { ENTITY_TYPE } from './constants.js';
import { gameState } from './GameState.js';

// ── 门颜色定义 ──
export const DOOR_COLORS = {
  yellow: { name: '黄色', icon: '🟡', color: '#ffcc44', sprite: '🚪', tileColor: '#997722' },
  blue:   { name: '蓝色', icon: '🔵', color: '#4488ff', sprite: '🚪', tileColor: '#224488' },
  red:    { name: '红色', icon: '🔴', color: '#ff4444', sprite: '🚪', tileColor: '#882222' },
};

// ── 钥匙颜色定义 ──
export const KEY_COLORS = {
  yellow: { name: '黄色门卡', icon: '🟡', color: '#ffcc44', sprite: '🔑' },
  blue:   { name: '蓝色门卡', icon: '🔵', color: '#4488ff', sprite: '🗝' },
  red:    { name: '红色门卡', icon: '🔴', color: '#ff4444', sprite: '🗝' },
};

// ── 章节钥匙门配置表 ──
// 每个章节的每个楼层有多少钥匙和门
// 设计原则：
// 1. 每层钥匙数量 ≥ 必经之路上的门数量（保证可通关）
// 2. 多余钥匙 = 可选探索奖励
// 3. 后期章节红色钥匙/门增加
const CHAPTER_KEY_DOOR_CONFIG = {
  // Ch2: 异形 — 紧张探索，黄门为主
  2: {
    floors: [
      { keys: { yellow: 3 }, doors: { yellow: 2 }, rewards: ['gold_50', 'hp_potion'] },
      { keys: { yellow: 2, blue: 1 }, doors: { yellow: 1, blue: 1 }, rewards: ['gold_80', 'exp_30'] },
      { keys: { yellow: 3 }, doors: { yellow: 2 }, rewards: ['gold_50', 'hp_potion'] },
      { keys: { yellow: 2, blue: 1 }, doors: { yellow: 2, blue: 1 }, rewards: ['gold_100', 'atk_gem'] },
      { keys: { yellow: 3, blue: 1 }, doors: { yellow: 2, blue: 1 }, rewards: ['gold_80', 'exp_50'] },
      { keys: { yellow: 2, blue: 1, red: 1 }, doors: { yellow: 1, blue: 1, red: 1 }, rewards: ['gold_150', 'rare_equip'] },
    ],
  },
  // Ch3: 咒怨 — 阴暗迷宫，蓝门增加
  3: {
    floors: [
      { keys: { yellow: 3, blue: 1 }, doors: { yellow: 2, blue: 1 }, rewards: ['gold_80', 'hp_potion'] },
      { keys: { yellow: 2, blue: 1 }, doors: { yellow: 2, blue: 1 }, rewards: ['gold_100', 'exp_50'] },
      { keys: { yellow: 3, blue: 1 }, doors: { yellow: 2, blue: 1 }, rewards: ['gold_80', 'def_gem'] },
      { keys: { yellow: 2, blue: 2 }, doors: { yellow: 1, blue: 2 }, rewards: ['gold_120', 'exp_80'] },
      { keys: { yellow: 3, blue: 1 }, doors: { yellow: 2, blue: 1 }, rewards: ['gold_100', 'hp_potion'] },
      { keys: { yellow: 2, blue: 1, red: 1 }, doors: { yellow: 1, blue: 1, red: 1 }, rewards: ['gold_200', 'rare_equip'] },
    ],
  },
  // Ch4: 木乃伊 — 机关陷阱多
  4: {
    floors: [
      { keys: { yellow: 3 }, doors: { yellow: 2 }, rewards: ['gold_100', 'hp_potion'] },
      { keys: { yellow: 3, blue: 1 }, doors: { yellow: 2, blue: 1 }, rewards: ['gold_120', 'exp_60'] },
      { keys: { yellow: 2, blue: 1 }, doors: { yellow: 2, blue: 1 }, rewards: ['gold_100', 'spd_gem'] },
      { keys: { yellow: 3, blue: 1 }, doors: { yellow: 2, blue: 1 }, rewards: ['gold_150', 'exp_100'] },
      { keys: { yellow: 2, blue: 2 }, doors: { yellow: 2, blue: 1 }, rewards: ['gold_120', 'hp_potion'] },
      { keys: { yellow: 2, blue: 1, red: 1 }, doors: { yellow: 1, blue: 1, red: 1 }, rewards: ['gold_250', 'rare_equip'] },
    ],
  },
  // Ch5: 死神来了 — 钥匙稀缺
  5: {
    floors: [
      { keys: { yellow: 2, blue: 1 }, doors: { yellow: 2, blue: 1 }, rewards: ['gold_120', 'hp_potion'] },
      { keys: { yellow: 3, blue: 1 }, doors: { yellow: 2, blue: 1 }, rewards: ['gold_150', 'exp_80'] },
      { keys: { yellow: 2, blue: 1 }, doors: { yellow: 2, blue: 1 }, rewards: ['gold_120', 'crt_gem'] },
      { keys: { yellow: 3, blue: 2 }, doors: { yellow: 2, blue: 2 }, rewards: ['gold_200', 'exp_120'] },
      { keys: { yellow: 2, blue: 1, red: 1 }, doors: { yellow: 2, blue: 1 }, rewards: ['gold_180', 'hp_potion'] },
      { keys: { yellow: 2, blue: 1, red: 1 }, doors: { yellow: 1, blue: 1, red: 1 }, rewards: ['gold_300', 'epic_equip'] },
    ],
  },
  // Ch6-12: 后期章节，红门增加，奖励升级
  6: { floors: [
    { keys: { yellow: 3, blue: 1 }, doors: { yellow: 2, blue: 1 }, rewards: ['gold_150', 'exp_80'] },
    { keys: { yellow: 2, blue: 2 }, doors: { yellow: 2, blue: 1 }, rewards: ['gold_180', 'hp_potion'] },
    { keys: { yellow: 3, blue: 1 }, doors: { yellow: 2, blue: 1 }, rewards: ['gold_150', 'atk_gem'] },
    { keys: { yellow: 2, blue: 2, red: 1 }, doors: { yellow: 2, blue: 1, red: 1 }, rewards: ['gold_250', 'exp_150'] },
    { keys: { yellow: 3, blue: 1 }, doors: { yellow: 2, blue: 1 }, rewards: ['gold_180', 'hp_potion'] },
    { keys: { yellow: 2, blue: 1, red: 1 }, doors: { yellow: 1, blue: 1, red: 1 }, rewards: ['gold_350', 'epic_equip'] },
  ]},
  7: { floors: [
    { keys: { yellow: 3, blue: 1 }, doors: { yellow: 2, blue: 1 }, rewards: ['gold_180', 'exp_100'] },
    { keys: { yellow: 2, blue: 2 }, doors: { yellow: 2, blue: 1 }, rewards: ['gold_200', 'def_gem'] },
    { keys: { yellow: 3, blue: 1, red: 1 }, doors: { yellow: 2, blue: 1, red: 1 }, rewards: ['gold_250', 'exp_150'] },
    { keys: { yellow: 2, blue: 2 }, doors: { yellow: 2, blue: 1 }, rewards: ['gold_200', 'hp_potion'] },
    { keys: { yellow: 3, blue: 1 }, doors: { yellow: 2, blue: 1 }, rewards: ['gold_250', 'crt_gem'] },
    { keys: { yellow: 2, blue: 1, red: 1 }, doors: { yellow: 1, blue: 1, red: 1 }, rewards: ['gold_400', 'legendary_shard'] },
  ]},
  8: { floors: [
    { keys: { yellow: 3, blue: 1 }, doors: { yellow: 2, blue: 1 }, rewards: ['gold_200', 'exp_120'] },
    { keys: { yellow: 2, blue: 2, red: 1 }, doors: { yellow: 2, blue: 1, red: 1 }, rewards: ['gold_250', 'hp_potion'] },
    { keys: { yellow: 3, blue: 1 }, doors: { yellow: 2, blue: 1 }, rewards: ['gold_220', 'spd_gem'] },
    { keys: { yellow: 2, blue: 2 }, doors: { yellow: 2, blue: 2 }, rewards: ['gold_300', 'exp_200'] },
    { keys: { yellow: 3, blue: 1 }, doors: { yellow: 2, blue: 1 }, rewards: ['gold_250', 'atk_gem'] },
    { keys: { yellow: 2, blue: 1, red: 1 }, doors: { yellow: 1, blue: 1, red: 1 }, rewards: ['gold_450', 'legendary_shard'] },
  ]},
  9: { floors: [
    { keys: { yellow: 3, blue: 2 }, doors: { yellow: 2, blue: 2 }, rewards: ['gold_250', 'exp_150'] },
    { keys: { yellow: 2, blue: 2 }, doors: { yellow: 2, blue: 1 }, rewards: ['gold_280', 'hp_potion'] },
    { keys: { yellow: 3, blue: 1, red: 1 }, doors: { yellow: 2, blue: 1, red: 1 }, rewards: ['gold_300', 'def_gem'] },
    { keys: { yellow: 2, blue: 2 }, doors: { yellow: 2, blue: 2 }, rewards: ['gold_350', 'exp_250'] },
    { keys: { yellow: 3, blue: 1 }, doors: { yellow: 2, blue: 1 }, rewards: ['gold_300', 'crt_gem'] },
    { keys: { yellow: 2, blue: 2, red: 1 }, doors: { yellow: 1, blue: 2, red: 1 }, rewards: ['gold_500', 'legendary_shard'] },
  ]},
  10: { floors: [
    { keys: { yellow: 3, blue: 2 }, doors: { yellow: 2, blue: 2 }, rewards: ['gold_300', 'exp_200'] },
    { keys: { yellow: 2, blue: 2, red: 1 }, doors: { yellow: 2, blue: 1, red: 1 }, rewards: ['gold_350', 'hp_potion'] },
    { keys: { yellow: 3, blue: 1 }, doors: { yellow: 2, blue: 1 }, rewards: ['gold_300', 'spd_gem'] },
    { keys: { yellow: 2, blue: 2 }, doors: { yellow: 2, blue: 2 }, rewards: ['gold_400', 'exp_300'] },
    { keys: { yellow: 3, blue: 2, red: 1 }, doors: { yellow: 2, blue: 2, red: 1 }, rewards: ['gold_400', 'atk_gem'] },
    { keys: { yellow: 2, blue: 1, red: 1 }, doors: { yellow: 1, blue: 1, red: 1 }, rewards: ['gold_600', 'epic_equip'] },
  ]},
  11: { floors: [
    { keys: { yellow: 3, blue: 2 }, doors: { yellow: 2, blue: 2 }, rewards: ['gold_350', 'exp_250'] },
    { keys: { yellow: 2, blue: 2, red: 1 }, doors: { yellow: 2, blue: 1, red: 1 }, rewards: ['gold_400', 'def_gem'] },
    { keys: { yellow: 3, blue: 2 }, doors: { yellow: 2, blue: 2 }, rewards: ['gold_350', 'hp_potion'] },
    { keys: { yellow: 2, blue: 2 }, doors: { yellow: 2, blue: 2 }, rewards: ['gold_450', 'exp_350'] },
    { keys: { yellow: 3, blue: 1, red: 1 }, doors: { yellow: 2, blue: 1, red: 1 }, rewards: ['gold_450', 'crt_gem'] },
    { keys: { yellow: 2, blue: 2, red: 1 }, doors: { yellow: 1, blue: 2, red: 1 }, rewards: ['gold_700', 'legendary_shard'] },
  ]},
  12: { floors: [
    { keys: { yellow: 3, blue: 2, red: 1 }, doors: { yellow: 2, blue: 2, red: 1 }, rewards: ['gold_400', 'exp_300'] },
    { keys: { yellow: 2, blue: 2, red: 1 }, doors: { yellow: 2, blue: 2, red: 1 }, rewards: ['gold_450', 'hp_potion'] },
    { keys: { yellow: 3, blue: 2 }, doors: { yellow: 2, blue: 2 }, rewards: ['gold_400', 'atk_gem'] },
    { keys: { yellow: 2, blue: 2, red: 1 }, doors: { yellow: 2, blue: 2, red: 1 }, rewards: ['gold_500', 'exp_400'] },
    { keys: { yellow: 3, blue: 2, red: 1 }, doors: { yellow: 2, blue: 2, red: 1 }, rewards: ['gold_500', 'def_gem'] },
    { keys: { yellow: 2, blue: 2, red: 2 }, doors: { yellow: 1, blue: 2, red: 2 }, rewards: ['gold_800', 'legendary_shard'] },
  ]},
};

// ── 门后奖励表 ──
const DOOR_REWARDS = {
  gold_50:   { type: 'gold', value: 50 },
  gold_80:   { type: 'gold', value: 80 },
  gold_100:  { type: 'gold', value: 100 },
  gold_120:  { type: 'gold', value: 120 },
  gold_150:  { type: 'gold', value: 150 },
  gold_180:  { type: 'gold', value: 180 },
  gold_200:  { type: 'gold', value: 200 },
  gold_220:  { type: 'gold', value: 220 },
  gold_250:  { type: 'gold', value: 250 },
  gold_280:  { type: 'gold', value: 280 },
  gold_300:  { type: 'gold', value: 300 },
  gold_350:  { type: 'gold', value: 350 },
  gold_400:  { type: 'gold', value: 400 },
  gold_450:  { type: 'gold', value: 450 },
  gold_500:  { type: 'gold', value: 500 },
  gold_600:  { type: 'gold', value: 600 },
  gold_700:  { type: 'gold', value: 700 },
  gold_800:  { type: 'gold', value: 800 },
  hp_potion:   { type: 'heal', value: 0.3, text: '修复包' },
  exp_30:    { type: 'exp', value: 30 },
  exp_50:    { type: 'exp', value: 50 },
  exp_60:    { type: 'exp', value: 60 },
  exp_80:    { type: 'exp', value: 80 },
  exp_100:   { type: 'exp', value: 100 },
  exp_120:   { type: 'exp', value: 120 },
  exp_150:   { type: 'exp', value: 150 },
  exp_200:   { type: 'exp', value: 200 },
  exp_250:   { type: 'exp', value: 250 },
  exp_300:   { type: 'exp', value: 300 },
  exp_350:   { type: 'exp', value: 350 },
  exp_400:   { type: 'exp', value: 400 },
  atk_gem:   { type: 'stat', stat: 'atk', value: 3 },
  def_gem:   { type: 'stat', stat: 'def', value: 3 },
  spd_gem:   { type: 'stat', stat: 'spd', value: 2 },
  crt_gem:   { type: 'stat', stat: 'crt', value: 3 },
  rare_equip:  { type: 'equipment', quality: 'rare' },
  epic_equip:  { type: 'equipment', quality: 'epic' },
  legendary_shard: { type: 'shard', value: 25 },
};

/**
 * 为一个楼层注入钥匙和门实体
 * @param {number} chapter - 章节号(1-12)
 * @param {number} floorIndex - 楼层索引(0-5)
 * @param {Array} entities - 已有实体数组
 * @param {Array[]} tiles - 地图瓦片数组
 * @returns {Array} 添加了钥匙和门的实体数组
 */
export function injectKeyDoors(chapter, floorIndex, entities, tiles) {
  if (chapter <= 1) return entities; // Ch1已有自己的钥匙门
  
  const config = CHAPTER_KEY_DOOR_CONFIG[chapter];
  if (!config || !config.floors[floorIndex]) return entities;
  
  const floorConfig = config.floors[floorIndex];
  const { keys, doors } = floorConfig;
  
  // 收集可用的空地位置（排除已有实体、楼梯、墙壁旁边）
  const occupied = new Set();
  for (const e of entities) occupied.add(`${e.x},${e.y}`);
  
  const rows = tiles.length;
  const cols = tiles[0]?.length || 0;
  const candidates = [];
  
  for (let y = 1; y < rows - 1; y++) {
    for (let x = 1; x < cols - 1; x++) {
      if (tiles[y][x] !== 1) continue; // 只在地面上放置
      if (occupied.has(`${x},${y}`)) continue;
      // 确保不挡住关键通路（至少两个相邻地面格）
      let adjacent = 0;
      if (tiles[y-1]?.[x] === 1) adjacent++;
      if (tiles[y+1]?.[x] === 1) adjacent++;
      if (tiles[y]?.[x-1] === 1) adjacent++;
      if (tiles[y]?.[x+1] === 1) adjacent++;
      if (adjacent >= 2) candidates.push({ x, y });
    }
  }
  
  // 按距离玩家起点远近排序（近处放钥匙，远处放门）
  const playerEntity = entities.find(e => e.type === 'player');
  const px = playerEntity?.x || 1;
  const py = playerEntity?.y || 1;
  
  candidates.sort((a, b) => {
    const da = Math.abs(a.x - px) + Math.abs(a.y - py);
    const db = Math.abs(b.x - px) + Math.abs(b.y - py);
    return da - db;
  });
  
  if (candidates.length < 4) return entities; // 地图太小，跳过
  
  // 分区：前1/3放钥匙，后2/3放门
  const keyZone = candidates.slice(0, Math.floor(candidates.length * 0.4));
  const doorZone = candidates.slice(Math.floor(candidates.length * 0.4));
  
  let keyIdx = 0;
  let doorIdx = 0;
  const newEntities = [...entities];
  const usedPositions = new Set([...occupied]);
  
  // 放置钥匙
  for (const [color, count] of Object.entries(keys)) {
    for (let i = 0; i < count && keyIdx < keyZone.length; i++) {
      const pos = keyZone[keyIdx++];
      if (usedPositions.has(`${pos.x},${pos.y}`)) { keyIdx++; i--; continue; }
      usedPositions.add(`${pos.x},${pos.y}`);
      
      const colorDef = KEY_COLORS[color];
      newEntities.push({
        type: ENTITY_TYPE.ITEM,
        id: `key_${color}_${chapter}_${floorIndex}_${i}`,
        name: colorDef.name,
        x: pos.x,
        y: pos.y,
        sprite: colorDef.sprite,
        color: colorDef.color,
        itemType: 'key',
        keyColor: color,
      });
    }
  }
  
  // 放置门（门后有奖励提示）
  const rewardKeys = Object.keys(doors);
  let rewardIdx = 0;
  
  for (const [color, count] of Object.entries(doors)) {
    for (let i = 0; i < count && doorIdx < doorZone.length; i++) {
      const pos = doorZone[doorIdx++];
      if (usedPositions.has(`${pos.x},${pos.y}`)) { doorIdx++; i--; continue; }
      usedPositions.add(`${pos.x},${pos.y}`);
      
      const colorDef = DOOR_COLORS[color];
      const rewardId = floorConfig.rewards?.[rewardIdx % (floorConfig.rewards?.length || 1)] || 'gold_50';
      rewardIdx++;
      
      newEntities.push({
        type: ENTITY_TYPE.ITEM,
        id: `door_${color}_${chapter}_${floorIndex}_${i}`,
        name: `${colorDef.name}门`,
        x: pos.x,
        y: pos.y,
        sprite: colorDef.sprite,
        color: colorDef.color,
        itemType: 'door',
        doorColor: color,
        doorReward: rewardId,
      });
    }
  }
  
  return newEntities;
}

/**
 * 处理开门奖励
 * @param {string} rewardId - 奖励ID
 * @param {string} doorColor - 门颜色
 * @returns {{ text, rewards }}
 */
export function getDoorReward(rewardId, doorColor) {
  const reward = DOOR_REWARDS[rewardId];
  if (!reward) return { text: '门后空无一物。', rewards: {} };
  
  const p = gameState.player;
  const result = { text: '', rewards: {} };
  
  switch (reward.type) {
    case 'gold': {
      const gold = reward.value;
      p.gold += gold;
      result.text = `门后藏着 ${gold} 金币！`;
      result.rewards.gold = gold;
      break;
    }
    case 'heal': {
      const healAmt = Math.floor(p.maxHp * reward.value);
      p.hp = Math.min(p.maxHp, p.hp + healAmt);
      result.text = `发现了${reward.text}！恢复了 ${healAmt} HP。`;
      result.rewards.heal = healAmt;
      break;
    }
    case 'exp': {
      const exp = reward.value;
      p.exp += exp;
      result.text = `获得了 ${exp} 经验值！`;
      result.rewards.exp = exp;
      break;
    }
    case 'stat': {
      p[reward.stat] = (p[reward.stat] || 0) + reward.value;
      const statNames = { atk: '攻击', def: '防御', spd: '速度', crt: '暴击' };
      result.text = `发现增幅宝石！${statNames[reward.stat] || reward.stat} +${reward.value}`;
      result.rewards.stat = { [reward.stat]: reward.value };
      break;
    }
    case 'equipment': {
      // 生成一件装备（简化版，实际可调用LootSystem）
      result.text = `发现了一件${reward.quality === 'epic' ? '史诗' : '稀有'}级装备！`;
      result.rewards.equipment = reward.quality;
      break;
    }
    case 'shard': {
      const shards = reward.value;
      gameState.soulShards = (gameState.soulShards || 0) + shards;
      result.text = `获得了 ${shards} 灵魂碎片！`;
      result.rewards.shards = shards;
      break;
    }
  }
  
  return result;
}

/**
 * 获取玩家当前钥匙数量
 */
export function getKeyCount() {
  const keys = gameState.player.keys || {};
  return {
    yellow: keys.yellow || 0,
    blue: keys.blue || 0,
    red: keys.red || 0,
    total: (keys.yellow || 0) + (keys.blue || 0) + (keys.red || 0),
  };
}

/**
 * 初始化玩家钥匙背包
 */
export function initKeys() {
  if (!gameState.player.keys) {
    gameState.player.keys = { yellow: 0, blue: 0, red: 0 };
  }
}

/**
 * 渲染钥匙HUD（用于Canvas绘制）
 */
export function renderKeyHUD(ctx, x, y) {
  const keys = getKeyCount();
  if (keys.total === 0) return;
  
  ctx.font = '11px "Microsoft YaHei"';
  let dx = 0;
  
  if (keys.yellow > 0) {
    ctx.fillStyle = '#ffcc44';
    ctx.fillText(`🔑${keys.yellow}`, x + dx, y);
    dx += 35;
  }
  if (keys.blue > 0) {
    ctx.fillStyle = '#4488ff';
    ctx.fillText(`🗝${keys.blue}`, x + dx, y);
    dx += 35;
  }
  if (keys.red > 0) {
    ctx.fillStyle = '#ff4444';
    ctx.fillText(`🗝${keys.red}`, x + dx, y);
    dx += 35;
  }
}

/**
 * 获取章节的钥匙门统计
 */
export function getChapterKeyDoorStats(chapter) {
  const config = CHAPTER_KEY_DOOR_CONFIG[chapter];
  if (!config) return null;
  
  let totalKeys = 0, totalDoors = 0;
  for (const floor of config.floors) {
    for (const count of Object.values(floor.keys)) totalKeys += count;
    for (const count of Object.values(floor.doors)) totalDoors += count;
  }
  
  return { totalKeys, totalDoors, floors: config.floors.length };
}
