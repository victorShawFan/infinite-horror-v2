// =================================================================
// 无尽深渊模式 — 通关后解锁的无限挑战
// =================================================================
// 随机生成的无限楼层, 敌人逐层变强
// 每10层有Boss, 每5层有商店
// 记录最深层数作为成就

import { gameState } from './GameState.js';
import { eventBus } from './EventBus.js';
import { ENTITY_TYPE, TILE } from './constants.js';

// -- 深渊配置 --
const ABYSS_CONFIG = {
  startingDifficulty: 1.5,   // 初始难度倍率(比12章稍强)
  difficultyPerFloor: 0.08,  // 每层增长
  bossInterval: 10,          // 每10层Boss
  shopInterval: 5,           // 每5层商店
  eliteChance: 0.25,         // 精英出现率
  mapWidth: 18,
  mapHeight: 14,
  enemiesPerFloor: [3, 6],   // 最少~最多
  itemsPerFloor: [1, 3],
};

// -- 深渊状态 --
let _abyssState = {
  active: false,
  currentFloor: 0,
  deepestFloor: 0,
  totalKills: 0,
  totalGold: 0,
  highScore: 0,
};

// -- 敌人模板(从不同章节抽取并强化) --
const ABYSS_ENEMIES = [
  { name: '深渊感染者', sprite: '尸', color: '#668866', baseHp: 80, baseAtk: 25, baseDef: 12 },
  { name: '虚空异形', sprite: '異', color: '#4488aa', baseHp: 120, baseAtk: 30, baseDef: 15 },
  { name: '怨灵', sprite: '魂', color: '#aa44cc', baseHp: 60, baseAtk: 35, baseDef: 8 },
  { name: '沙漠骑士', sprite: '骑', color: '#cc8844', baseHp: 150, baseAtk: 28, baseDef: 20 },
  { name: '死神使者', sprite: '死', color: '#cccccc', baseHp: 90, baseAtk: 40, baseDef: 10 },
  { name: '深渊猎手', sprite: '猎', color: '#ff4444', baseHp: 110, baseAtk: 35, baseDef: 16 },
  { name: '混沌元素', sprite: '混', color: '#ff8800', baseHp: 200, baseAtk: 20, baseDef: 25 },
  { name: '虫族战士', sprite: '虫', color: '#88aa44', baseHp: 100, baseAtk: 32, baseDef: 14 },
  { name: '影子刺客', sprite: '影', color: '#333366', baseHp: 70, baseAtk: 45, baseDef: 6 },
  { name: '铁甲守卫', sprite: '甲', color: '#8888ff', baseHp: 180, baseAtk: 22, baseDef: 30 },
];

const ABYSS_BOSSES = [
  { name: '深渊领主', sprite: '魔', color: '#ff2222', baseHp: 500, baseAtk: 60, baseDef: 30 },
  { name: '虚空君王', sprite: '虚', color: '#4444ff', baseHp: 600, baseAtk: 50, baseDef: 40 },
  { name: '混沌化身', sprite: '沌', color: '#ff8800', baseHp: 800, baseAtk: 55, baseDef: 35 },
  { name: '终焉守望者', sprite: '终', color: '#ffffff', baseHp: 1000, baseAtk: 70, baseDef: 45 },
];

// -- 生成深渊楼层 --
export function generateAbyssFloor(floorNum) {
  const diffMul = ABYSS_CONFIG.startingDifficulty + (floorNum - 1) * ABYSS_CONFIG.difficultyPerFloor;
  const isBossFloor = floorNum % ABYSS_CONFIG.bossInterval === 0;
  const isShopFloor = floorNum % ABYSS_CONFIG.shopInterval === 0 && !isBossFloor;
  
  const w = ABYSS_CONFIG.mapWidth;
  const h = ABYSS_CONFIG.mapHeight;
  
  // Simple room generation
  const tiles = [];
  for (let y = 0; y < h; y++) {
    const row = [];
    for (let x = 0; x < w; x++) {
      if (x === 0 || x === w-1 || y === 0 || y === h-1) {
        row.push(TILE.WALL);
      } else {
        row.push(TILE.FLOOR);
      }
    }
    tiles.push(row);
  }
  
  // Add some random walls for cover
  const wallCount = 8 + Math.floor(Math.random() * 6);
  for (let i = 0; i < wallCount; i++) {
    const wx = 2 + Math.floor(Math.random() * (w - 4));
    const wy = 2 + Math.floor(Math.random() * (h - 4));
    if (wx !== 2 || wy !== 2) { // Don't block player start
      tiles[wy][wx] = TILE.WALL;
    }
  }
  
  // Stairs (exit to next floor)
  tiles[h-2][w-2] = TILE.STAIRS;
  
  const entities = [];
  
  if (isBossFloor) {
    // Boss floor
    const bossTemplate = ABYSS_BOSSES[Math.floor(floorNum / 10 - 1) % ABYSS_BOSSES.length];
    entities.push({
      type: ENTITY_TYPE.BOSS,
      id: 'abyss_boss_' + floorNum,
      name: bossTemplate.name + ' Lv.' + floorNum,
      sprite: bossTemplate.sprite,
      color: bossTemplate.color,
      x: Math.floor(w / 2),
      y: Math.floor(h / 2),
      hp: Math.ceil(bossTemplate.baseHp * diffMul),
      atk: Math.ceil(bossTemplate.baseAtk * diffMul),
      def: Math.ceil(bossTemplate.baseDef * diffMul),
      spd: 8 + Math.floor(floorNum / 5),
      isBoss: true,
      rewards: {
        exp: Math.ceil(200 * diffMul),
        gold: Math.ceil(150 * diffMul),
        rewardPoints: 50 + floorNum * 5,
      },
      geneLockCharge: 20 + floorNum,
      description: '\u6df1\u6e0a\u7b2c' + floorNum + '\u5c42\u7684\u5b88\u62a4\u8005\u3002\u6bcf\u4e00\u6b21\u51fa\u73b0\u90fd\u6bd4\u4e0a\u4e00\u6b21\u66f4\u5f3a\u5927\u3002',
    });
  } else {
    // Normal enemies
    const [minE, maxE] = ABYSS_CONFIG.enemiesPerFloor;
    const enemyCount = minE + Math.floor(Math.random() * (maxE - minE + 1));
    const usedPositions = new Set(['2,2', (w-2) + ',' + (h-2)]); // player start and stairs
    
    for (let i = 0; i < enemyCount; i++) {
      let ex, ey;
      for (let attempts = 0; attempts < 50; attempts++) {
        ex = 2 + Math.floor(Math.random() * (w - 4));
        ey = 2 + Math.floor(Math.random() * (h - 4));
        const key = ex + ',' + ey;
        if (!usedPositions.has(key) && tiles[ey][ex] === TILE.FLOOR) {
          usedPositions.add(key);
          break;
        }
      }
      
      const template = ABYSS_ENEMIES[Math.floor(Math.random() * ABYSS_ENEMIES.length)];
      entities.push({
        type: ENTITY_TYPE.ENEMY,
        id: 'abyss_' + floorNum + '_' + i,
        name: template.name,
        sprite: template.sprite,
        color: template.color,
        x: ex, y: ey,
        hp: Math.ceil(template.baseHp * diffMul),
        atk: Math.ceil(template.baseAtk * diffMul),
        def: Math.ceil(template.baseDef * diffMul),
        spd: 5 + Math.floor(floorNum / 10),
        rewards: {
          exp: Math.ceil(50 * diffMul),
          gold: Math.ceil(30 * diffMul),
        },
        geneLockCharge: 5 + Math.floor(floorNum / 5),
      });
    }
  }
  
  // Items
  if (!isBossFloor) {
    const [minI, maxI] = ABYSS_CONFIG.itemsPerFloor;
    const itemCount = minI + Math.floor(Math.random() * (maxI - minI + 1));
    const usedPos = new Set(entities.map(e => e.x + ',' + e.y));
    usedPos.add('2,2');
    usedPos.add((w-2) + ',' + (h-2));
    
    const itemPool = [
      { name: '\u56de\u590d\u836f\u5242', effect: { heal: Math.ceil(30 * diffMul) }, color: '#44ff88', sprite: '\u2764' },
      { name: '\u529b\u91cf\u6676\u77f3', effect: { atk: 2 + Math.floor(floorNum / 10) }, color: '#ff6644', sprite: '\u25c6' },
      { name: '\u575a\u97e7\u6676\u77f3', effect: { def: 2 + Math.floor(floorNum / 10) }, color: '#6688ff', sprite: '\u25c6' },
      { name: '\u6df1\u6e0a\u5b9d\u7bb1', effect: { gold: Math.ceil(50 * diffMul) }, color: '#ffcc44', sprite: '\u2606' },
    ];
    
    for (let i = 0; i < itemCount; i++) {
      let ix, iy;
      for (let attempts = 0; attempts < 50; attempts++) {
        ix = 2 + Math.floor(Math.random() * (w - 4));
        iy = 2 + Math.floor(Math.random() * (h - 4));
        const key = ix + ',' + iy;
        if (!usedPos.has(key) && tiles[iy][ix] === TILE.FLOOR) {
          usedPos.add(key);
          break;
        }
      }
      const item = itemPool[Math.floor(Math.random() * itemPool.length)];
      entities.push({
        type: ENTITY_TYPE.ITEM,
        id: 'abyss_item_' + floorNum + '_' + i,
        name: item.name,
        sprite: item.sprite,
        color: item.color,
        x: ix, y: iy,
        effect: item.effect,
      });
    }
  }
  
  // Shop on shop floors
  if (isShopFloor) {
    entities.push({
      type: ENTITY_TYPE.NPC,
      id: 'abyss_merchant_' + floorNum,
      name: '\u6df1\u6e0a\u5546\u4eba',
      sprite: '\u5546',
      color: '#ffcc44',
      x: Math.floor(w / 2),
      y: Math.floor(h / 2),
      dialogue: [
        { speaker: '\u6df1\u6e0a\u5546\u4eba', text: '\u6b22\u8fce\u6765\u5230\u6df1\u6e0a\u7b2c' + floorNum + '\u5c42\u3002\u4f60\u80fd\u8d70\u5230\u8fd9\u91cc\uff0c\u5df2\u7ecf\u5f88\u4e0d\u5bb9\u6613\u4e86\u3002' },
        { speaker: '\u6df1\u6e0a\u5546\u4eba', text: '\u770b\u770b\u6211\u7684\u8d27\u7269\u5427\u2014\u2014\u90fd\u662f\u6df1\u6e0a\u4e2d\u56de\u6536\u7684\u597d\u4e1c\u897f\u3002' },
      ],
      isMerchant: true,
      merchantChapter: Math.ceil(floorNum / 5),
    });
  }
  
  return {
    id: 'abyss-' + floorNum,
    name: '\u6df1\u6e0a\u7b2c' + floorNum + '\u5c42' + (isBossFloor ? ' [BOSS]' : isShopFloor ? ' [\u5546\u5e97]' : ''),
    width: w,
    height: h,
    tiles,
    entities,
    playerStart: { x: 2, y: 2 },
    theme: ['biolab', 'alien', 'cursed', 'tomb', 'reaper', 'alien', 'demon', 'ring', 'starship', 'final'][floorNum % 10],
    difficulty: diffMul,
  };
}

// -- 深渊状态管理 --
export function startAbyss() {
  _abyssState = {
    active: true,
    currentFloor: 0,
    deepestFloor: 0,
    totalKills: 0,
    totalGold: 0,
    highScore: 0,
  };
  eventBus.emit('abyss:started');
  return nextAbyssFloor();
}

export function nextAbyssFloor() {
  _abyssState.currentFloor++;
  if (_abyssState.currentFloor > _abyssState.deepestFloor) {
    _abyssState.deepestFloor = _abyssState.currentFloor;
  }
  return generateAbyssFloor(_abyssState.currentFloor);
}

export function getAbyssState() { return { ..._abyssState }; }
export function isAbyssActive() { return _abyssState.active; }

export function endAbyss(reason = 'death') {
  _abyssState.active = false;
  const score = _abyssState.currentFloor * 100 + _abyssState.totalKills * 10 + _abyssState.totalGold;
  if (score > _abyssState.highScore) _abyssState.highScore = score;
  eventBus.emit('abyss:ended', { floor: _abyssState.currentFloor, reason, score });
  return { floor: _abyssState.currentFloor, score, highScore: _abyssState.highScore };
}

export function recordAbyssKill() { _abyssState.totalKills++; }
export function recordAbyssGold(amount) { _abyssState.totalGold += amount; }

export function serializeAbyss() { return { ..._abyssState }; }
export function deserializeAbyss(data) {
  if (data) _abyssState = { ..._abyssState, ...data };
}
