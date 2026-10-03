/**
 * Simulated game flow test: Walk through Ch1 from start to finish
 * This tests the critical path: generate map → place player → move → fight → progress
 */
import { generateChapter1 } from './src/core/MapGenerator.js';
import { executeBattle, previewBattle } from './src/core/CombatSystem.js';
import { scaleEnemy } from './src/core/DifficultyScaler.js';
import { gameState } from './src/core/GameState.js';

let passed = 0;
let failed = 0;
function assert(cond, msg) { if (cond) passed++; else { failed++; console.error('FAIL:', msg); } }

// Initialize game state
gameState.reset();
gameState.chapter = 1;

const chapter = generateChapter1();
assert(chapter.floors.length === 6, 'Ch1 has 6 floors');

// Simulate playing through each floor
const p = gameState.player;
p.atk = 15; p.def = 10; p.hp = 100; p.maxHp = 100;
p.spd = 8; p.crt = 5; p.level = 1; p.exp = 0; p.expToNext = 50;
p.gold = 0; p.keys = { yellow: 0, blue: 0, red: 0 };
p.weapon = null; p.armor = null; p.accessory = null; p.chips = [];

let totalKills = 0;
let totalItems = 0;
let totalGoldEarned = 0;

for (let f = 0; f < chapter.floors.length; f++) {
  const floor = chapter.floors[f];
  assert(floor.playerStart, `F${f} has playerStart`);
  
  // Count enemies and items on this floor
  const enemies = floor.entities.filter(e => e.type === 'enemy' || e.type === 'boss');
  const items = floor.entities.filter(e => e.type === 'item');
  
  // Simulate collecting all items first (stat boosts)
  for (const item of items) {
    totalItems++;
    if (item.effect?.atk) p.atk += item.effect.atk;
    if (item.effect?.def) p.def += item.effect.def;
    if (item.effect?.heal) p.hp = Math.min(p.maxHp, p.hp + item.effect.heal);
    if (item.effect?.spd) p.spd += item.effect.spd;
    if (item.weapon && !p.weapon) p.weapon = item.weapon;
  }
  
  // Simulate fighting enemies from weakest to strongest
  const sortedEnemies = enemies
    .map(e => ({ ...e, scaled: scaleEnemy(e, 1) }))
    .sort((a, b) => a.scaled.hp - b.scaled.hp);
  
  for (const enemy of sortedEnemies) {
    const preview = previewBattle(p, enemy.scaled);
    if (preview.canWin) {
      // Simulate the fight
      const result = executeBattle(enemy.scaled);
      if (result.victory) {
        totalKills++;
        // Apply rewards
        const rewardExp = enemy.scaled.rewards?.exp || 0; const rewardGold = enemy.scaled.rewards?.gold || 0; if (rewardExp) {
          p.exp += rewardExp;
          // Level up check
          while (p.exp >= p.expToNext) {
            p.exp -= p.expToNext;
            p.level++;
            p.atk += 2;
            p.def += 1;
            p.maxHp += 10;
            p.hp = p.maxHp;
            p.expToNext = Math.floor(p.expToNext * 1.3);
          }
        }
        if (rewardGold > 0) {
          p.gold += rewardGold;
          totalGoldEarned += rewardGold;
        }
      }
    }
  }
  
  console.log(`F${f} "${floor.name}": ${enemies.length} enemies, ${totalKills} kills total, Lv.${p.level} ATK=${p.atk} DEF=${p.def} HP=${p.hp}/${p.maxHp}`);
}

assert(totalKills > 0, `Killed at least 1 enemy (${totalKills})`);
assert(totalItems > 0, `Collected at least 1 item (${totalItems})`);
assert(p.level > 1, `Leveled up at least once (Lv.${p.level})`);
assert(totalGoldEarned > 0, `Earned gold (${totalGoldEarned}G)`);

console.log(`\n=== Ch1 Simulation Complete ===`);
console.log(`Kills: ${totalKills}, Items: ${totalItems}, Level: ${p.level}`);
console.log(`ATK: ${p.atk}, DEF: ${p.def}, HP: ${p.hp}/${p.maxHp}`);
console.log(`Gold: ${totalGoldEarned}G`);

console.log(`\n✅ ${passed} passed, ❌ ${failed} failed`);
if (failed > 0) process.exit(1);
