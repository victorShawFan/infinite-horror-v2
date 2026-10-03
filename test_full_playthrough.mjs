// ══════════════════════════════════════════════════════════════
// 完整通关模拟验证 — Ch1→Ch12全程战斗+升级+装备+Boss
// ══════════════════════════════════════════════════════════════
globalThis.localStorage = { _data: {}, getItem(k) { return this._data[k] || null; }, setItem(k,v) { this._data[k] = v; }, removeItem(k) { delete this._data[k]; } };
if (typeof globalThis.document === 'undefined') {
  const _mockEl = () => ({
    style:{cssText:''},
    appendChild(){}, remove(){}, addEventListener(){},
    querySelector: () => null,
    querySelectorAll: () => [],
    classList: { add(){}, remove(){} },
    innerHTML: '',
    id: '',
    dataset: {},
    textContent: '',
    firstElementChild: null,
  });
  globalThis.document = {
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    createElement: () => _mockEl(),
    body: { appendChild(){}, style:{} },
    addEventListener(){},
    removeEventListener(){},
  };
}

import { generateChapter1 } from './src/core/MapGenerator.js';
import { generateChapter2 } from './src/core/MapGenerator_Ch2.js';
import { generateChapter3 } from './src/core/MapGenerator_Ch3.js';
import { generateChapter4 } from './src/core/MapGenerator_Ch4.js';
import { generateChapter5 } from './src/core/MapGenerator_Ch5.js';
import { generateChapter6 } from './src/core/MapGenerator_Ch6.js';
import { generateChapter7 } from './src/core/MapGenerator_Ch7.js';
import { generateChapter8 } from './src/core/MapGenerator_Ch8.js';
import { generateChapter9 } from './src/core/MapGenerator_Ch9.js';
import { generateChapter10 } from './src/core/MapGenerator_Ch10.js';
import { generateChapter11 } from './src/core/MapGenerator_Ch11.js';
import { generateChapter12 } from './src/core/MapGenerator_Ch12.js';
import { gameState } from './src/core/GameState.js';
import { executeBattle, previewBattle, getEffectiveAtk, getEffectiveDef } from './src/core/CombatSystem.js';
import { ENTITY_TYPE } from './src/core/constants.js';
import { scaleEnemy } from './src/core/DifficultyScaler.js';

const generators = [
  generateChapter1, generateChapter2, generateChapter3, generateChapter4,
  generateChapter5, generateChapter6, generateChapter7, generateChapter8,
  generateChapter9, generateChapter10, generateChapter11, generateChapter12,
];

let pass = 0, fail = 0, warnings = 0;
function assert(cond, msg) { if (cond) pass++; else { fail++; console.error('  ✗', msg); } }
function warn(msg) { warnings++; console.warn('  ⚠', msg); }

console.log('═══ 完整通关模拟 ═══\n');
gameState.reset();
const p = gameState.player;

// 给玩家一些起始优势模拟正常游戏中获得的奖励点装备
p.weapon = { name: '起始手枪', atk: 3, baseAtk: 3, slot: 'weapon' };
p.armor = { name: '防弹衣', def: 2, baseDef: 2, slot: 'armor' };

let totalBattles = 0;
let totalBossKills = 0;
let totalDeaths = 0;

for (let ch = 0; ch < 12; ch++) {
  const chNum = ch + 1;
  gameState.chapter = chNum;
  const chapter = generators[ch]();
  
  assert(chapter.floors?.length === 6, `Ch${chNum} has 6 floors (got ${chapter.floors?.length})`);
  
  let chBattles = 0, chWins = 0, chBossWins = 0;
  
  for (let fi = 0; fi < chapter.floors.length; fi++) {
    const floor = chapter.floors[fi];
    assert(floor.tiles !== undefined, `Ch${chNum}-${fi+1} has tiles`);
    assert(floor.playerStart !== undefined, `Ch${chNum}-${fi+1} has playerStart`);
    
    // Fight all enemies on this floor
    const enemies = (floor.entities || []).filter(e => 
      e.type === ENTITY_TYPE.ENEMY || e.type === ENTITY_TYPE.BOSS || e.type === 'enemy' || e.type === 'boss'
    );
    
    for (const enemy of enemies) {
      const scaled = scaleEnemy(enemy, chNum);
      const preview = previewBattle(p, scaled);
      
      // Simulate combat
      const result = await executeBattle(scaled);
      totalBattles++;
      chBattles++;
      
      if (result.victory) {
        chWins++;
        // Apply rewards
        if (scaled.rewards?.exp) gameState.addExp(scaled.rewards.exp);
        if (scaled.rewards?.gold) p.gold += scaled.rewards.gold;
        if (scaled.rewards?.rewardPoints) p.rewardPoints += scaled.rewards.rewardPoints;
        
        // Heal 30% after each fight (simulating items/regen)
        p.hp = Math.min(p.maxHp, p.hp + Math.floor(p.maxHp * 0.3));
        
        if (enemy.type === ENTITY_TYPE.BOSS || enemy.type === 'boss' || enemy.bossId) {
          chBossWins++;
          totalBossKills++;
        }
      } else {
        totalDeaths++;
        // Respawn with full HP (simulating death/checkpoint)
        p.hp = p.maxHp;
      }
    }
    
    // Collect items
    const items = (floor.entities || []).filter(e => 
      e.type === ENTITY_TYPE.ITEM || e.type === 'item'
    );
    for (const item of items) {
      if (item.effect?.heal) p.hp = Math.min(p.maxHp, p.hp + item.effect.heal);
      if (item.effect?.atk) p.atk += item.effect.atk;
      if (item.effect?.def) p.def += item.effect.def;
    }
  }
  
  // Between chapters: simulate shop/upgrades
  if (chNum < 12) {
    // Upgrade weapon every 2 chapters
    if (chNum % 2 === 0) {
      const newAtk = Math.floor(p.atk * 0.4);
      p.weapon = { name: `强化武器Mk${chNum/2}`, atk: newAtk, baseAtk: newAtk, slot: 'weapon' };
    }
    // Upgrade armor every 3 chapters
    if (chNum % 3 === 0) {
      const newDef = Math.floor(p.def * 0.3);
      p.armor = { name: `强化护甲Mk${chNum/3}`, def: newDef, baseDef: newDef, slot: 'armor' };
    }
    // Full heal between chapters
    p.hp = p.maxHp;
  }
  
  const winRate = chBattles > 0 ? Math.round(chWins / chBattles * 100) : 100;
  console.log(`Ch${chNum.toString().padStart(2)}: Lv${p.level.toString().padStart(2)} HP=${p.maxHp} ATK=${getEffectiveAtk(p)} DEF=${getEffectiveDef(p)} | ${chBattles}战 ${chWins}胜(${winRate}%) ${chBossWins}Boss`);
  
  if (winRate < 50) warn(`Ch${chNum} win rate too low: ${winRate}%`);
}

console.log(`\n═══ 通关统计 ═══`);
console.log(`最终等级: Lv.${p.level}`);
console.log(`总战斗: ${totalBattles} | Boss击杀: ${totalBossKills} | 死亡: ${totalDeaths}`);
console.log(`最终属性: HP=${p.maxHp} ATK=${getEffectiveAtk(p)} DEF=${getEffectiveDef(p)}`);
console.log(`金币: ${p.gold} | 奖励点: ${p.rewardPoints}`);

assert(p.level >= 10, `Final level >= 10 (got ${p.level})`);
assert(totalBossKills >= 10, `Boss kills >= 10 (got ${totalBossKills})`);
assert(totalBattles >= 50, `Total battles >= 50 (got ${totalBattles})`);

console.log(`\n${pass} checks passed, ${fail} failed, ${warnings} warnings`);
if (fail === 0) console.log('✅ 完整通关模拟通过！');
else { console.error('❌ 有测试失败'); process.exit(1); }
