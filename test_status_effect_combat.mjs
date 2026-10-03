// 测试状态效果是否真正影响战斗属性
import { addEffect, getEffectModifiers, clearAllEffects } from './src/core/StatusEffectTracker.js';
import { getEffectiveAtk, getEffectiveDef, getEffectiveCrt, getEffectiveSpd } from './src/core/CombatSystem.js';
import { gameState } from './src/core/GameState.js';

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; }
  else { fail++; console.error('FAIL:', msg); }
}

// Setup player
gameState.player = {
  hp: 300, maxHp: 300, atk: 50, def: 25, crt: 8, spd: 6,
  mana: 30, maxMana: 30, level: 5, gold: 0, exp: 0,
  geneLock: 0, geneLockCharge: 0, geneLockActive: false,
  chips: [], inventory: [], companions: [], talents: {},
  rewardPoints: 0, activeBloodline: null,
};
gameState.stats = { enemiesKilled: 0, bossesKilled: 0, damageDealt: 0, goldEarned: 0 };

// Clear any existing effects
clearAllEffects();

// Test 1: Baseline stats
const baseAtk = getEffectiveAtk(gameState.player);
const baseDef = getEffectiveDef(gameState.player);
const baseCrt = getEffectiveCrt(gameState.player);
const baseSpd = getEffectiveSpd(gameState.player);

assert(baseAtk === 50, `Base ATK should be 50, got ${baseAtk}`);
assert(baseDef === 25, `Base DEF should be 25, got ${baseDef}`);

// Test 2: Add ATK boost
addEffect('atk_boost', 20, 3, '测试增益');
const boostedAtk = getEffectiveAtk(gameState.player);
assert(boostedAtk === 70, `Boosted ATK should be ${baseAtk + 20}, got ${boostedAtk}`);

// Test 3: Add DEF boost
addEffect('def_boost', 15, 3, '护盾');
const boostedDef = getEffectiveDef(gameState.player);
assert(boostedDef === baseDef + 15, `Boosted DEF should be ${baseDef + 15}, got ${boostedDef}`);

// Test 4: Add CRT boost
addEffect('crt_boost', 5, 3, '精准');
const boostedCrt = getEffectiveCrt(gameState.player);
assert(boostedCrt === baseCrt + 5, `Boosted CRT should be ${baseCrt + 5}, got ${boostedCrt}`);

// Test 5: Add curse (reduces both ATK and DEF)
addEffect('curse', -10, 3, '诅咒');
const cursedAtk = getEffectiveAtk(gameState.player);
const cursedDef = getEffectiveDef(gameState.player);
assert(cursedAtk === baseAtk + 20 - 10, `Cursed ATK should be ${baseAtk + 10}, got ${cursedAtk}`);
assert(cursedDef === baseDef + 15 - 10, `Cursed DEF should be ${baseDef + 5}, got ${cursedDef}`);

// Test 6: Clear effects restores baseline
clearAllEffects();
const restoredAtk = getEffectiveAtk(gameState.player);
assert(restoredAtk === baseAtk, `Restored ATK should be ${baseAtk}, got ${restoredAtk}`);

// Test 7: ATK debuff
addEffect('atk_debuff', -15, 2, '衰弱');
const debuffedAtk = getEffectiveAtk(gameState.player);
assert(debuffedAtk === baseAtk - 15, `Debuffed ATK should be ${baseAtk - 15}, got ${debuffedAtk}`);

clearAllEffects();

console.log(`\n状态效果战斗集成测试: ${pass}/${pass+fail} 通过`);
if (fail > 0) process.exit(1);
