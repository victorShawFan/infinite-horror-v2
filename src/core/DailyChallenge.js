// =================================================================
// 每日挑战系统 — 每天一个独特的挑战关卡
// =================================================================
// 基于日期种子生成的固定挑战
// 全球所有玩家同一天面对相同挑战
// 记录完成时间和评分排名

import { ENTITY_TYPE, TILE } from './constants.js';

// 日期种子随机数生成器
function seededRandom(seed) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function getDateSeed(date) {
  const d = date || new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

// -- 每日挑战修饰词 --
const DAILY_MODIFIERS = [
  { id: 'glass_cannon', name: '\u7834\u574f\u4e4b\u529b', desc: 'ATK\u00d72 DEF\u00f72', icon: '\U0001f4a5', playerMod: { atkMul: 2.0, defMul: 0.5 } },
  { id: 'iron_wall', name: '\u94c1\u58c1\u4e4b\u76fe', desc: 'DEF\u00d72 ATK\u00f72', icon: '\U0001f6e1', playerMod: { atkMul: 0.5, defMul: 2.0 } },
  { id: 'speed_demon', name: '\u95ea\u7535\u6218\u795e', desc: 'SPD\u00d73 HP\u00f72', icon: '\u26a1', playerMod: { spdMul: 3.0, hpMul: 0.5 } },
  { id: 'vampire', name: '\u5438\u8840\u9b3c', desc: '\u6bcf\u6b21\u653b\u51fb\u5438\u884030% \u4f46HP-40%', icon: '\U0001fa78', playerMod: { hpMul: 0.6, lifesteal: 0.3 } },
  { id: 'critical_master', name: '\u66b4\u51fb\u5927\u5e08', desc: 'CRT+50% \u66b4\u51fb\u4f24\u5bb3\u00d73', icon: '\U0001f3af', playerMod: { crtBonus: 50, critDmgMul: 3.0 } },
  { id: 'swarm', name: '\u866b\u6d77\u6218\u672f', desc: '\u654c\u4eba\u6570\u91cf\u00d72 \u4f46\u5c5e\u6027\u00f72', icon: '\U0001f41b', enemyMod: { countMul: 2, statMul: 0.5 } },
  { id: 'elite_only', name: '\u7cbe\u82f1\u4e4b\u591c', desc: '\u6240\u6709\u654c\u4eba\u5747\u4e3a\u7cbe\u82f1', icon: '\u25c6', enemyMod: { allElite: true } },
  { id: 'no_healing', name: '\u6b7b\u4ea1\u884c\u519b', desc: '\u65e0\u6cd5\u56de\u590dHP', icon: '\u2620', playerMod: { noHeal: true } },
  { id: 'gold_rush', name: '\u6dd8\u91d1\u70ed', desc: '\u91d1\u5e01\u00d75 \u4f46\u654c\u4ebaATK+50%', icon: '\U0001f4b0', enemyMod: { atkMul: 1.5 }, rewardMod: { goldMul: 5 } },
  { id: 'ascension', name: '\u98de\u5347', desc: '\u6bcf\u5c42\u5c5e\u6027+10% \u654c\u4eba\u4e5f+10%', icon: '\u2b06', progressMod: { statGainPerFloor: 0.10 } },
];

// -- 每日挑战章节主题 --
const DAILY_THEMES = [
  { name: '\u751f\u5316\u5371\u673a', theme: 'biolab', enemyPool: ['zombie', 'mutant', 'guard'] },
  { name: '\u5f02\u5f62\u98de\u8239', theme: 'alien', enemyPool: ['alien', 'facehugger', 'queen'] },
  { name: '\u5492\u6028\u51b6\u5b85', theme: 'cursed', enemyPool: ['ghost', 'cursed', 'spirit'] },
  { name: '\u53e4\u57ce\u5bc6\u5ba4', theme: 'tomb', enemyPool: ['mummy', 'knight', 'scarab'] },
  { name: '\u6df1\u6e0a', theme: 'final', enemyPool: ['demon', 'void', 'chaos'] },
];

// -- 生成今日挑战 --
export function generateDailyChallenge(date) {
  const seed = getDateSeed(date);
  const rng = seededRandom(seed);
  
  const modIdx = Math.floor(rng() * DAILY_MODIFIERS.length);
  const themeIdx = Math.floor(rng() * DAILY_THEMES.length);
  const modifier = DAILY_MODIFIERS[modIdx];
  const theme = DAILY_THEMES[themeIdx];
  
  const floorCount = 3 + Math.floor(rng() * 3); // 3-5 floors
  const baseDifficulty = 1.2 + rng() * 0.8; // 1.2 ~ 2.0
  
  const floors = [];
  for (let i = 0; i < floorCount; i++) {
    const isBoss = i === floorCount - 1;
    const diffMul = baseDifficulty + i * 0.15;
    const w = 16, h = 12;
    
    // Generate tiles
    const tiles = [];
    for (let y = 0; y < h; y++) {
      const row = [];
      for (let x = 0; x < w; x++) {
        if (x === 0 || x === w-1 || y === 0 || y === h-1) row.push(TILE.WALL);
        else row.push(TILE.FLOOR);
      }
      tiles.push(row);
    }
    
    // Random walls
    for (let j = 0; j < 5 + Math.floor(rng() * 4); j++) {
      const wx = 2 + Math.floor(rng() * (w - 4));
      const wy = 2 + Math.floor(rng() * (h - 4));
      if (wx !== 2 || wy !== 2) tiles[wy][wx] = TILE.WALL;
    }
    if (i < floorCount - 1) tiles[h-2][w-2] = TILE.STAIRS;
    
    const entities = [];
    const usedPos = new Set(['2,2', (w-2) + ',' + (h-2)]);
    
    const enemyCount = isBoss ? 1 : 3 + Math.floor(rng() * 3);
    for (let j = 0; j < enemyCount; j++) {
      let ex, ey;
      for (let a = 0; a < 30; a++) {
        ex = 2 + Math.floor(rng() * (w - 4));
        ey = 2 + Math.floor(rng() * (h - 4));
        if (!usedPos.has(ex + ',' + ey) && tiles[ey][ex] === TILE.FLOOR) { usedPos.add(ex + ',' + ey); break; }
      }
      const baseHp = isBoss ? 400 : 60 + Math.floor(rng() * 60);
      const baseAtk = isBoss ? 45 : 15 + Math.floor(rng() * 20);
      const baseDef = isBoss ? 25 : 5 + Math.floor(rng() * 15);
      entities.push({
        type: isBoss ? ENTITY_TYPE.BOSS : ENTITY_TYPE.ENEMY,
        id: 'daily_' + i + '_' + j,
        name: isBoss ? '\u6bcf\u65e5Boss' : '\u6311\u6218\u654c\u4eba',
        sprite: isBoss ? '\u9b54' : '\u6575',
        color: isBoss ? '#ff2222' : '#cc6644',
        x: ex, y: ey,
        hp: Math.ceil(baseHp * diffMul),
        atk: Math.ceil(baseAtk * diffMul),
        def: Math.ceil(baseDef * diffMul),
        spd: 5 + Math.floor(rng() * 5),
        isBoss: !!isBoss,
        rewards: { exp: Math.ceil((isBoss ? 200 : 50) * diffMul), gold: Math.ceil((isBoss ? 100 : 30) * diffMul) },
        geneLockCharge: isBoss ? 20 : 5,
      });
    }
    
    // Items
    if (!isBoss) {
      const ix = 2 + Math.floor(rng() * (w - 4));
      const iy = 2 + Math.floor(rng() * (h - 4));
      if (tiles[iy][ix] === TILE.FLOOR && !usedPos.has(ix + ',' + iy)) {
        entities.push({
          type: ENTITY_TYPE.ITEM, id: 'daily_item_' + i,
          name: '\u56de\u590d\u836f\u5242', sprite: '\u2764', color: '#44ff88',
          x: ix, y: iy, effect: { heal: Math.ceil(50 * diffMul) },
        });
      }
    }
    
    floors.push({
      id: 'daily-' + (i + 1),
      name: (isBoss ? 'BOSS: ' : '') + theme.name + ' ' + (i + 1) + '/' + floorCount,
      width: w, height: h, tiles, entities,
      playerStart: { x: 2, y: 2 },
      theme: theme.theme,
    });
  }
  
  return {
    seed,
    date: new Date().toISOString().split('T')[0],
    modifier,
    theme,
    floors,
    floorCount,
    baseDifficulty,
    completed: false,
    bestTime: null,
    bestScore: null,
  };
}

// -- 判断今天是否已完成 --
let _dailyCompletion = {};

export function isDailyCompleted(date) {
  const key = getDateSeed(date);
  return !!_dailyCompletion[key];
}

export function completeDailyChallenge(date, time, score) {
  const key = getDateSeed(date);
  const prev = _dailyCompletion[key];
  if (!prev || score > prev.score) {
    _dailyCompletion[key] = { time, score, completedAt: Date.now() };
  }
  return _dailyCompletion[key];
}

export function getDailyRecord(date) {
  return _dailyCompletion[getDateSeed(date)] || null;
}

export function serializeDaily() { return { ..._dailyCompletion }; }
export function deserializeDaily(data) { if (data) _dailyCompletion = data; }
