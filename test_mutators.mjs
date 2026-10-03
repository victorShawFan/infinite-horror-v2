// test_mutators.mjs — NG+ 变异器确定性测试
import { ngPlusState, getActiveMutators, NG_MUTATORS } from './src/core/NewGamePlus.js';
import { gameState } from './src/core/GameState.js';
import { executeBattle } from './src/core/CombatSystem.js';

let pass = 0, fail = 0;
function assert(cond, msg) { if (cond) { pass++; } else { fail++; console.log('  ✗ ' + msg); } }

console.log('═══ NG+ 变异器测试 ═══\n');

// ── 变异器注册完整性 ──
console.log('[ 变异器定义 ]');
const mutatorIds = Object.keys(NG_MUTATORS);
assert(mutatorIds.length >= 6, `至少6种变异器: ${mutatorIds.length}`);
for (const [id, m] of Object.entries(NG_MUTATORS)) {
  assert(typeof m.name === 'string' && m.name.length > 0, `${id}: has name`);
  assert(typeof m.icon === 'string' && m.icon.length > 0, `${id}: has icon`);
  assert(typeof m.desc === 'string' && m.desc.length > 0, `${id}: has desc`);
}

// ── 周目0无变异器 ──
console.log('\n[ 周目0无变异 ]');
ngPlusState.cycle = 0;
assert(getActiveMutators().length === 0, '周目0无变异器');

// ── 周目1有1个变异器 ──
console.log('\n[ 周目1 ]');
ngPlusState.cycle = 1;
const m1 = getActiveMutators();
assert(m1.length === 1, `周目1: ${m1.length}个变异器`);
assert(mutatorIds.includes(m1[0]?.id), `有效变异器ID: ${m1[0]?.id}`);

// ── 周目2有2个变异器 ──
console.log('\n[ 周目2 ]');
ngPlusState.cycle = 2;
const m2 = getActiveMutators();
assert(m2.length === 2, `周目2: ${m2.length}个变异器`);
assert(m2[0].id !== m2[1].id, `两个不同变异器: ${m2[0].id} vs ${m2[1].id}`);

// ── 确定性：同一周目相同变异器 ──
console.log('\n[ 确定性 ]');
ngPlusState.cycle = 3;
const a = getActiveMutators().map(m => m.id);
const b = getActiveMutators().map(m => m.id);
assert(JSON.stringify(a) === JSON.stringify(b), '同周目结果稳定');

// ── cursed_gold 战斗测试 ──
console.log('\n[ cursed_gold 战斗 ]');
let cursedCycle = -1;
for (let c = 1; c <= 20; c++) {
  ngPlusState.cycle = c;
  if (getActiveMutators().some(m => m.id === 'cursed_gold')) { cursedCycle = c; break; }
}
if (cursedCycle > 0) {
  ngPlusState.cycle = cursedCycle;
  gameState.reset();
  const p = gameState.player;
  p.level = 10; p.atk = 50; p.def = 20; p.hp = 200; p.maxHp = 200;
  p.gold = 0;
  const testEnemy = { id: 'test_mutator', name: '测试敌', hp: 10, atk: 1, def: 0, spd: 1, rewards: { gold: 100, exp: 10 } };
  const result = await executeBattle(testEnemy);
  assert(result.victory, 'cursed_gold战斗胜利');
  assert(p.gold === 200, `cursed_gold双倍金币: ${p.gold} (期望200)`);
  assert(p.hp <= 199, `cursed_gold扣HP: ${p.hp} <= 199`);
} else {
  console.log('  (cursed_gold未在前20周目出现，跳过战斗测试)');
}

// ── phantom_pain 战斗测试 ──
console.log('\n[ phantom_pain 战斗 ]');
let painCycle = -1;
for (let c = 1; c <= 20; c++) {
  ngPlusState.cycle = c;
  if (getActiveMutators().some(m => m.id === 'phantom_pain')) { painCycle = c; break; }
}
if (painCycle > 0) {
  ngPlusState.cycle = painCycle;
  gameState.reset();
  const p = gameState.player;
  p.level = 5; p.atk = 30; p.def = 10; p.hp = 300; p.maxHp = 300;
  const testEnemy2 = { id: 'test_pain', name: '幻痛敌', hp: 50, atk: 20, def: 5, spd: 5, rewards: { gold: 50, exp: 20 } };
  for (let i = 0; i < 5; i++) {
    gameState.player.hp = 300;
    const r = await executeBattle(testEnemy2);
    assert(r.victory !== undefined, `phantom_pain不崩溃(run ${i+1})`);
  }
} else {
  console.log('  (phantom_pain未在前20周目出现，跳过)');
}

// Reset
ngPlusState.cycle = 0;

console.log(`\n═══ 变异器测试: ${pass}通过, ${fail}失败 ═══`);
process.exit(fail > 0 ? 1 : 0);
