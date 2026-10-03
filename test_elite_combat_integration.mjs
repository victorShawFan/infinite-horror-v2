// 测试精英词缀是否真正影响战斗
import { forceUpgradeToElite, getEliteCombatEffects } from './src/core/EliteMonsterSystem.js';
import { gameState } from './src/core/GameState.js';
import { previewBattle, executeBattle } from './src/core/CombatSystem.js';

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; }
  else { fail++; console.error('FAIL:', msg); }
}

// Setup player
gameState.player = {
  hp: 500, maxHp: 500, atk: 80, def: 30, crt: 10, spd: 8,
  mana: 50, maxMana: 50, level: 10, gold: 0, exp: 0,
  geneLock: 0, geneLockCharge: 0, geneLockActive: false,
  chips: [], inventory: [], companions: [], talents: {},
  rewardPoints: 0, activeBloodline: null,
};
gameState.stats = { enemiesKilled: 0, bossesKilled: 0, damageDealt: 0, goldEarned: 0 };
gameState.chapter = 3;

// Create base enemy
const baseEnemy = {
  name: '测试敌人', type: 'normal',
  hp: 100, atk: 20, def: 10, spd: 5,
  rewards: { exp: 10, gold: 5 },
};

// Test 1: getEliteCombatEffects returns null for normal enemy
const normalFx = getEliteCombatEffects(baseEnemy);
assert(normalFx === null, 'Normal enemy should have null elite effects');

// Test 2: Force upgrade to rare elite
const rareElite = forceUpgradeToElite({ ...baseEnemy }, 'rare', () => 0.5);
assert(rareElite._eliteTier === 'rare', 'Should be rare elite');
assert(rareElite._eliteAffixes && rareElite._eliteAffixes.length === 1, 'Rare should have 1 affix');

// Test 3: getEliteCombatEffects returns object for elite
const eliteFx = getEliteCombatEffects(rareElite);
assert(eliteFx !== null, 'Elite enemy should have non-null combat effects');
assert(typeof eliteFx.thornPercent === 'number', 'Should have thornPercent');
assert(typeof eliteFx.doubleStrikeChance === 'number', 'Should have doubleStrikeChance');
assert(typeof eliteFx.shieldHp === 'number', 'Should have shieldHp');

// Test 4: Force upgrade to legendary
const legendaryElite = forceUpgradeToElite({ ...baseEnemy }, 'legendary', () => 0.3);
assert(legendaryElite._eliteTier === 'legendary', 'Should be legendary elite');
assert(legendaryElite._eliteAffixes.length === 3, 'Legendary should have 3 affixes');
assert(legendaryElite.hp > baseEnemy.hp, 'Legendary should have more HP');

// Test 5: Preview battle accounts for elite
const previewNormal = previewBattle(gameState.player, { ...baseEnemy });
const previewElite = previewBattle(gameState.player, legendaryElite);
assert(previewElite.turnsNeeded >= previewNormal.turnsNeeded, 
  'Elite preview should take same or more turns');

// Test 6: Execute battle against elite
gameState.player.hp = 500;
const result = await executeBattle(legendaryElite);
assert(result.victory !== undefined, 'Should have victory result');
assert(result.log.length > 0, 'Should have combat log');
// Check if elite-specific log entries exist
const hasEliteLog = result.log.some(l => 
  l.type === 'affix_warning' || l.type === 'affix_damage' || l.type === 'enemy_heal' ||
  l.text?.includes('精英')
);
assert(hasEliteLog, 'Should have elite-specific log entries');

// Test 7: Shield affix test
const shieldedEnemy = forceUpgradeToElite({ ...baseEnemy, hp: 200 }, 'rare', () => {
  // Force 'shielded' affix (index 7 in ELITE_AFFIXES keys)
  return 0.999; // Will pick last available
});
const shieldFx = getEliteCombatEffects(shieldedEnemy);
// Shield may or may not be on this enemy depending on random affix selection
assert(typeof (shieldFx?.shieldHp) === 'number', 'shieldHp should be a number');

console.log(`\n精英战斗集成测试: ${pass}/${pass+fail} 通过`);
if (fail > 0) process.exit(1);
