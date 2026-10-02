// test_stances.mjs — 战斗姿态系统测试
import { STANCES, getCurrentStance, setStance, getAvailableStances, applyStanceModifiers, getStanceId, restoreStance } from './src/core/CombatStance.js';
import { gameState } from './src/core/GameState.js';
import { executeBattle } from './src/core/CombatSystem.js';

let pass = 0, fail = 0;
function assert(cond, msg) { if (cond) { pass++; } else { fail++; console.log('  ✗ ' + msg); } }

console.log('═══ 战斗姿态系统测试 ═══\n');

// ── 姿态定义 ──
console.log('[ 姿态定义 ]');
assert(Object.keys(STANCES).length >= 6, `至少6种姿态: ${Object.keys(STANCES).length}`);
for (const [id, s] of Object.entries(STANCES)) {
  assert(typeof s.name === 'string', `${id}: has name`);
  assert(typeof s.icon === 'string', `${id}: has icon`);
  assert(typeof s.desc === 'string', `${id}: has desc`);
  assert(typeof s.modifiers === 'object', `${id}: has modifiers`);
  assert(typeof s.modifiers.atkMult === 'number', `${id}: has atkMult`);
}

// ── 默认姿态 ──
console.log('\n[ 默认姿态 ]');
restoreStance('balanced');
assert(getCurrentStance().id === 'balanced', '默认平衡姿态');
assert(getStanceId() === 'balanced', 'getStanceId正确');

// ── 切换姿态 ──
console.log('\n[ 切换姿态 ]');
assert(setStance('aggressive'), '切换猛攻');
assert(getCurrentStance().id === 'aggressive', '当前猛攻');
assert(setStance('defensive'), '切换防御');
assert(getCurrentStance().id === 'defensive', '当前防御');
assert(!setStance('nonexistent'), '无效姿态返回false');

// ── 等级限制 ──
console.log('\n[ 等级限制 ]');
gameState.reset();
gameState.player.level = 1;
const availLow = getAvailableStances();
assert(!availLow.find(s => s.id === 'reckless'), '1级不可用舍身');
assert(!availLow.find(s => s.id === 'precision'), '1级不可用精准');
gameState.player.level = 10;
const availHigh = getAvailableStances();
assert(availHigh.find(s => s.id === 'reckless'), '10级可用舍身');
assert(availHigh.find(s => s.id === 'precision'), '10级可用精准');

// ── 修正值计算 ──
console.log('\n[ 修正值 ]');
setStance('aggressive');
const aggr = applyStanceModifiers(100, 100, 10, 10);
assert(aggr.atk === 125, `猛攻ATK: ${aggr.atk} === 125`);
assert(aggr.def === 85, `猛攻DEF: ${aggr.def} === 85`);
assert(aggr.crt === 20, `猛攻CRT: ${aggr.crt} === 20`);

setStance('defensive');
const defn = applyStanceModifiers(100, 100, 10, 10);
assert(defn.atk === 80, `防御ATK: ${defn.atk} === 80`);
assert(defn.def === 130, `防御DEF: ${defn.def} === 130`);

setStance('reckless');
const reck = applyStanceModifiers(100, 100, 10, 10);
assert(reck.atk === 150, `舍身ATK: ${reck.atk} === 150`);
assert(reck.def === 70, `舍身DEF: ${reck.def} === 70`);

// ── 战斗集成 ──
console.log('\n[ 战斗集成 ]');
gameState.reset();
gameState.player.level = 10;
gameState.player.atk = 50;
gameState.player.def = 20;
gameState.player.hp = 500;
gameState.player.maxHp = 500;

const testEnemy = { id: 'stance_test', name: '测试靶', hp: 80, atk: 10, def: 5, spd: 5, rewards: { exp: 10, gold: 10 } };

// 平衡姿态
setStance('balanced');
gameState.player.hp = 500;
const r1 = executeBattle(testEnemy);
assert(r1.victory, '平衡姿态胜利');
const hp1 = gameState.player.hp;

// 猛攻姿态(应该更快结束)
setStance('aggressive');
gameState.player.hp = 500;
const r2 = executeBattle(testEnemy);
assert(r2.victory, '猛攻姿态胜利');
assert(r2.rounds <= r1.rounds || r2.rounds === r1.rounds, `猛攻回合 <= 平衡: ${r2.rounds} vs ${r1.rounds}`);

// 防御姿态(应该损失更少HP)
setStance('defensive');
gameState.player.hp = 500;
const r3 = executeBattle(testEnemy);
assert(r3.victory, '防御姿态胜利');

// 恢复默认
setStance('balanced');

console.log(`\n═══ 姿态测试: ${pass}通过, ${fail}失败 ═══`);
process.exit(fail > 0 ? 1 : 0);
