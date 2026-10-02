// 完整游戏模拟验证 — Ch1+Ch2全通关+存档+商店
globalThis.localStorage = { _data: {}, getItem(k) { return this._data[k] || null; }, setItem(k,v) { this._data[k] = v; }, removeItem(k) { delete this._data[k]; } };

import { generateChapter1 } from './src/core/MapGenerator.js';
import { generateChapter2 } from './src/core/MapGenerator_Ch2.js';
import { generateChapter3 } from './src/core/MapGenerator_Ch3.js';
import { generateChapter4 } from './src/core/MapGenerator_Ch4.js';
import { generateChapter5 } from './src/core/MapGenerator_Ch5.js';
import { generateChapter6 } from './src/core/MapGenerator_Ch6.js';
import { generateChapter7 } from './src/core/MapGenerator_Ch7.js';
import { gameState } from './src/core/GameState.js';
import { executeBattle, previewBattle, getEffectiveAtk, getEffectiveDef } from './src/core/CombatSystem.js';
import { ENTITY_TYPE } from './src/core/constants.js';
import { SHOP_ITEMS } from './src/core/LordGodSpace.js';

let pass = 0, fail = 0;
function assert(cond, msg) { if (cond) pass++; else { fail++; console.error('FAIL:', msg); } }

const ch1 = generateChapter1();
const ch2 = generateChapter2();
assert(ch1.floors.length === 6, 'Ch1 6 floors');
assert(ch2.floors.length === 6, 'Ch2 6 floors');

gameState.reset();
const p = gameState.player;

// Ch1 全通
let ch1Defeats = 0;
for (const f of ch1.floors) {
  for (const e of f.entities.filter(e => e.type === ENTITY_TYPE.ENEMY || e.type === ENTITY_TYPE.BOSS)) {
    if (!previewBattle(p, e).canWin) { ch1Defeats++; continue; }
    executeBattle({...e});
  }
  for (const e of f.entities.filter(e => e.type === ENTITY_TYPE.ITEM)) {
    if (e.effect?.heal) p.hp = Math.min(p.maxHp, p.hp + e.effect.heal);
    if (e.effect?.atk) p.atk += e.effect.atk;
    if (e.effect?.def) p.def += e.effect.def;
    if (e.effect?.spd) p.spd += e.effect.spd;
    if (e.itemType === 'weapon' && e.weapon) p.weapon = e.weapon;
    if (e.itemType === 'armor' && e.armor) p.armor = e.armor;
  }
}
assert(ch1Defeats === 0, 'Ch1 zero undefeatable');
assert(p.level >= 3, 'Ch1 end ≥ Lv3');
p.rewardPoints += 1000;

// Ch2 全通
let ch2Defeats = 0;
for (const f of ch2.floors) {
  for (const e of f.entities.filter(e => e.type === ENTITY_TYPE.ENEMY || e.type === ENTITY_TYPE.BOSS)) {
    if (!previewBattle(p, e).canWin) { ch2Defeats++; continue; }
    executeBattle({...e});
  }
  for (const e of f.entities.filter(e => e.type === ENTITY_TYPE.ITEM)) {
    if (e.effect?.heal) p.hp = Math.min(p.maxHp, p.hp + e.effect.heal);
    if (e.effect?.atk) p.atk += e.effect.atk;
    if (e.effect?.def) p.def += e.effect.def;
    if (e.itemType === 'weapon' && e.weapon) p.weapon = e.weapon;
    if (e.itemType === 'armor' && e.armor) p.armor = e.armor;
  }
}
assert(ch2Defeats === 0, 'Ch2 zero undefeatable');
assert(p.level >= 5, 'Ch2 end ≥ Lv5');

// Ch3 全通
const ch3 = generateChapter3();
assert(ch3.floors.length === 6, 'Ch3 6 floors');
p.rewardPoints += 1000;

let ch3Defeats = 0;
for (const f of ch3.floors) {
  for (const e of f.entities.filter(e => e.type === ENTITY_TYPE.ENEMY || e.type === ENTITY_TYPE.BOSS)) {
    if (!previewBattle(p, e).canWin) { ch3Defeats++; continue; }
    executeBattle({...e});
  }
  for (const e of f.entities.filter(e => e.type === ENTITY_TYPE.ITEM)) {
    if (e.effect?.heal) p.hp = Math.min(p.maxHp, p.hp + e.effect.heal);
    if (e.effect?.atk) p.atk += e.effect.atk;
    if (e.effect?.def) p.def += e.effect.def;
    if (e.effect?.spd) p.spd += e.effect.spd;
    if (e.itemType === 'weapon' && e.weapon) p.weapon = e.weapon;
    if (e.itemType === 'armor' && e.armor) p.armor = e.armor;
    if (e.itemType === 'accessory' && e.accessory) p.accessory = e.accessory;
    if (e.itemType === 'chip' && e.chip && p.chips.length < p.maxChips) p.chips.push(e.chip);
  }
}
assert(ch3Defeats === 0, 'Ch3 zero undefeatable');
assert(p.level >= 7, 'Ch3 end >= Lv7');

// Ch4 全通
const ch4 = generateChapter4();
assert(ch4.floors.length === 6, 'Ch4 6 floors');
p.rewardPoints += 1000;
let ch4Defeats = 0;
for (const f of ch4.floors) {
  for (const e of f.entities.filter(e => e.type === ENTITY_TYPE.ENEMY || e.type === ENTITY_TYPE.BOSS)) {
    if (!previewBattle(p, e).canWin) { ch4Defeats++; continue; }
    executeBattle({...e});
  }
  for (const e of f.entities.filter(e => e.type === ENTITY_TYPE.ITEM)) {
    if (e.effect?.heal) p.hp = Math.min(p.maxHp, p.hp + e.effect.heal);
    if (e.effect?.atk) p.atk += e.effect.atk;
    if (e.effect?.def) p.def += e.effect.def;
    if (e.effect?.spd) p.spd += e.effect.spd;
    if (e.effect?.maxHp) { p.maxHp += e.effect.maxHp; p.hp += e.effect.maxHp; }
    if (e.itemType === 'weapon' && e.weapon) p.weapon = e.weapon;
    if (e.itemType === 'armor' && e.armor) p.armor = e.armor;
    if (e.itemType === 'accessory' && e.accessory) p.accessory = e.accessory;
    if (e.itemType === 'chip' && e.chip && p.chips.length < p.maxChips) p.chips.push(e.chip);
  }
}
assert(ch4Defeats === 0, 'Ch4 zero undefeatable');
assert(p.level >= 8, 'Ch4 end >= Lv8');

// Ch5 全通
const ch5 = generateChapter5();
assert(ch5.floors.length === 6, 'Ch5 6 floors');
p.rewardPoints += 1000;
let ch5Defeats = 0;
for (const f of ch5.floors) {
  for (const e of f.entities.filter(e => e.type === ENTITY_TYPE.ENEMY || e.type === ENTITY_TYPE.BOSS)) {
    if (!previewBattle(p, e).canWin) { ch5Defeats++; continue; }
    executeBattle({...e});
  }
  for (const e of f.entities.filter(e => e.type === ENTITY_TYPE.ITEM)) {
    if (e.effect?.heal) p.hp = Math.min(p.maxHp, p.hp + e.effect.heal);
    if (e.effect?.atk) p.atk += e.effect.atk;
    if (e.effect?.def) p.def += e.effect.def;
    if (e.effect?.spd) p.spd += e.effect.spd;
    if (e.effect?.maxHp) { p.maxHp += e.effect.maxHp; p.hp += e.effect.maxHp; }
    if (e.effect?.crt) p.crt += e.effect.crt;
    if (e.itemType === 'weapon' && e.weapon) p.weapon = e.weapon;
    if (e.itemType === 'armor' && e.armor) p.armor = e.armor;
    if (e.itemType === 'accessory' && e.accessory) p.accessory = e.accessory;
    if (e.itemType === 'chip' && e.chip && p.chips.length < p.maxChips) p.chips.push(e.chip);
  }
}
assert(ch5Defeats === 0, 'Ch5 zero undefeatable');

// Ch6 全通
const ch6 = generateChapter6();
assert(ch6.floors.length === 6, 'Ch6 6 floors');
p.rewardPoints += 1000;
let ch6Defeats = 0;
for (const f of ch6.floors) {
  for (const e of f.entities.filter(e => e.type === ENTITY_TYPE.ENEMY || e.type === ENTITY_TYPE.BOSS)) {
    if (!previewBattle(p, e).canWin) { ch6Defeats++; continue; }
    executeBattle({...e});
  }
  for (const e of f.entities.filter(e => e.type === ENTITY_TYPE.ITEM)) {
    if (e.effect?.heal) p.hp = Math.min(p.maxHp, p.hp + e.effect.heal);
    if (e.effect?.atk) p.atk += e.effect.atk;
    if (e.effect?.def) p.def += e.effect.def;
    if (e.effect?.spd) p.spd += e.effect.spd;
    if (e.effect?.maxHp) { p.maxHp += e.effect.maxHp; p.hp += e.effect.maxHp; }
    if (e.effect?.crt) p.crt += e.effect.crt;
    if (e.itemType === 'weapon' && e.weapon) p.weapon = e.weapon;
    if (e.itemType === 'armor' && e.armor) p.armor = e.armor;
    if (e.itemType === 'chip' && e.chip && p.chips.length < p.maxChips) p.chips.push(e.chip);
  }
}
assert(ch6Defeats === 0, 'Ch6 zero undefeatable');


// Ch7 全通
const ch7 = generateChapter7();
assert(ch7.floors.length === 6, 'Ch7 6 floors');
p.rewardPoints += 1000;
let ch7Defeats = 0;
for (const f of ch7.floors) {
  for (const e of f.entities.filter(e => e.type === ENTITY_TYPE.ENEMY || e.type === ENTITY_TYPE.BOSS)) {
    if (!previewBattle(p, e).canWin) { ch7Defeats++; continue; }
    executeBattle({...e});
  }
  for (const e of f.entities.filter(e => e.type === ENTITY_TYPE.ITEM)) {
    if (e.effect?.heal) p.hp = Math.min(p.maxHp, p.hp + e.effect.heal);
    if (e.effect?.atk) p.atk += e.effect.atk;
    if (e.effect?.def) p.def += e.effect.def;
    if (e.effect?.spd) p.spd += e.effect.spd;
    if (e.effect?.maxHp) { p.maxHp += e.effect.maxHp; p.hp += e.effect.maxHp; }
    if (e.effect?.crt) p.crt += e.effect.crt;
    if (e.itemType === 'weapon' && e.weapon) p.weapon = e.weapon;
    if (e.itemType === 'armor' && e.armor) p.armor = e.armor;
    if (e.itemType === 'chip' && e.chip && p.chips.length < p.maxChips) p.chips.push(e.chip);
  }
}
assert(ch7Defeats === 0, 'Ch7 zero undefeatable');
// 存档往返
gameState.save(0);
const lvBefore = p.level;
gameState.reset();
assert(gameState.load(0), 'Load OK');
assert(gameState.player.level === lvBefore, 'Level preserved');

// 商店
assert(Object.values(SHOP_ITEMS).flat().length >= 30, '30+ shop items');

console.log(`${pass + fail} checks: ${pass} pass, ${fail} fail`);
console.log(`Ch1-7: Lv${p.level}`);
if (fail === 0) console.log('✅ 全游戏模拟通过');
else { console.log('❌ 有失败'); process.exit(1); }
