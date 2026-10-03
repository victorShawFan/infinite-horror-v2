// 测试战斗回放数据准确性
import { executeBattle } from './src/core/CombatSystem.js';
import { gameState } from './src/core/GameState.js';

let pass = 0, fail = 0;
function assert(cond, msg) { if (cond) pass++; else { fail++; console.error('FAIL:', msg); } }

gameState.player = {
  hp: 500, maxHp: 500, atk: 80, def: 30, crt: 10, spd: 8,
  mana: 50, maxMana: 50, level: 10, gold: 0, exp: 0,
  geneLock: 0, geneLockCharge: 0, geneLockActive: false,
  chips: [], inventory: [], companions: [], talents: {},
  rewardPoints: 0, activeBloodline: null,
};
gameState.stats = { enemiesKilled: 0, bossesKilled: 0, damageDealt: 0, goldEarned: 0, criticalHits: 0, maxSingleHit: 0 };
gameState.chapter = 1;

const enemy = {
  name: '测试敌人', type: 'normal',
  hp: 100, atk: 15, def: 5, spd: 4,
  rewards: { exp: 10, gold: 5 },
};

const result = await executeBattle(enemy);

assert(result.victory === true, 'Should win the battle');
assert(result.rounds > 0, `Should have rounds > 0, got ${result.rounds}`);
assert(result.totalDamageDealt > 0, `totalDamageDealt should be > 0, got ${result.totalDamageDealt}`);
assert(result.totalDamageDealt >= enemy.hp, `totalDmgDealt(${result.totalDamageDealt}) >= enemyHP(${enemy.hp})`);
assert(typeof result.critCount === 'number', 'critCount should be a number');
assert(result.log.length > 0, 'Should have log entries');

// Check that at least some log entries have damage field
const logsWithDmg = result.log.filter(l => l.damage && l.damage > 0);
assert(logsWithDmg.length > 0, `Should have log entries with damage field, got ${logsWithDmg.length}`);

// Check that attack log entries have round numbers
const attacks = result.log.filter(l => l.type === 'attack' || l.type === 'critical');
assert(attacks.length > 0, 'Should have attack log entries');
const hasRound = attacks.some(l => l.round > 0);
assert(hasRound, 'Attack logs should have round numbers');

console.log(`\n回放统计测试: ${pass}/${pass+fail} 通过`);
console.log(`  伤害: ${result.totalDamageDealt}, 回合: ${result.rounds}, 暴击: ${result.critCount}`);
if (fail > 0) process.exit(1);
