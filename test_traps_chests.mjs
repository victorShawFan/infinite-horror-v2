// test_traps_chests.mjs — 陷阱与宝箱系统测试
import { TRAP_TYPES, CHEST_TYPES, triggerTrap, rollTrapDodge, calcTrapDamage, openChest } from './src/core/TrapSystem.js';
import { gameState } from './src/core/GameState.js';

let pass = 0, fail = 0;
function assert(cond, msg) { if (cond) { pass++; } else { fail++; console.log('  ✗ ' + msg); } }

console.log('═══ 陷阱与宝箱系统测试 ═══\n');

// ── 陷阱类型完整性 ──
console.log('[ 陷阱定义 ]');
assert(Object.keys(TRAP_TYPES).length >= 6, `至少6种陷阱: ${Object.keys(TRAP_TYPES).length}`);
for (const [id, t] of Object.entries(TRAP_TYPES)) {
  assert(typeof t.name === 'string', `${id}: has name`);
  assert(typeof t.icon === 'string', `${id}: has icon`);
  assert(typeof t.baseDamage === 'number', `${id}: has baseDamage`);
  assert(typeof t.dodgeDC === 'number', `${id}: has dodgeDC`);
}

// ── 宝箱类型完整性 ──
console.log('\n[ 宝箱定义 ]');
assert(Object.keys(CHEST_TYPES).length >= 4, `至少4种宝箱: ${Object.keys(CHEST_TYPES).length}`);
for (const [id, c] of Object.entries(CHEST_TYPES)) {
  assert(typeof c.name === 'string', `${id}: has name`);
  assert(typeof c.trapChance === 'number' && c.trapChance >= 0 && c.trapChance <= 1, `${id}: valid trapChance`);
  assert(typeof c.lootTable === 'string', `${id}: has lootTable`);
}

// ── 陷阱伤害计算 ──
console.log('\n[ 陷阱伤害 ]');
gameState.reset();
gameState.player.def = 5;
const spikeDmg1 = calcTrapDamage('spike', 1);
assert(spikeDmg1 > 0, `地刺Ch1伤害 > 0: ${spikeDmg1}`);
const spikeDmg5 = calcTrapDamage('spike', 5);
assert(spikeDmg5 >= spikeDmg1, `Ch5伤害 >= Ch1: ${spikeDmg5} >= ${spikeDmg1}`);

// ── 陷阱触发 ──
console.log('\n[ 陷阱触发 ]');
gameState.reset();
gameState.player.hp = 200;
gameState.player.maxHp = 200;
// Force dodge fail by seeding Math.random
const origRandom = Math.random;
Math.random = () => 0.01; // Very low roll → miss dodge
const trapResult = triggerTrap('spike', 1);
assert(!trapResult.dodged, `低骰点触发陷阱: dodged=${trapResult.dodged}`);
assert(trapResult.damage > 0, `陷阱造成伤害: ${trapResult.damage}`);
assert(gameState.player.hp < 200, `HP减少: ${gameState.player.hp}`);

// Force dodge success
Math.random = () => 0.99; // High roll → dodge
gameState.player.hp = 200;
const trapResult2 = triggerTrap('spike', 1);
assert(trapResult2.dodged, `高骰点闪避: dodged=${trapResult2.dodged}`);
assert(trapResult2.damage === 0, `闪避无伤害: ${trapResult2.damage}`);
assert(gameState.player.hp === 200, `HP不变: ${gameState.player.hp}`);
Math.random = origRandom;

// ── 宝箱开启 ──
console.log('\n[ 宝箱开启 ]');
gameState.reset();
gameState.player.gold = 100;
const origRandom2 = Math.random;
Math.random = () => 0.99; // No trap, last loot in pool
const chestResult = openChest('wooden', 1);
assert(chestResult.success, '木箱开启成功');
assert(chestResult.loot.length >= 1, `至少1个奖励: ${chestResult.loot.length}`);
assert(typeof chestResult.message === 'string', '有结果消息');
Math.random = origRandom2;

// ── 锁定宝箱 ──
console.log('\n[ 锁定宝箱 ]');
gameState.reset();
gameState.player.keys.yellow = 0;
const lockedResult = openChest('iron', 1);
assert(!lockedResult.success, '无钥匙打不开铁箱');
assert(lockedResult.message.includes('钥匙'), `提示需要钥匙: ${lockedResult.message}`);

gameState.player.keys.yellow = 1;
Math.random = () => 0.99;
const unlockedResult = openChest('iron', 1);
assert(unlockedResult.success, '有钥匙可开铁箱');
assert(gameState.player.keys.yellow === 0, '钥匙被消耗');
Math.random = origRandom2;

// ── 诅咒宝箱高陷阱率 ──
console.log('\n[ 诅咒宝箱 ]');
Math.random = () => 0.5; // 0.5 < cursed trapChance 0.8, should trigger trap
gameState.reset();
gameState.player.hp = 200;
gameState.player.maxHp = 200;
const cursedResult = openChest('cursed', 1);
assert(cursedResult.success, '诅咒箱开启');
assert(cursedResult.trapResult !== null, '诅咒箱有陷阱');
Math.random = origRandom2;

// ── 统计追踪 ──
console.log('\n[ 统计追踪 ]');
assert(typeof gameState.stats.trapsTriggered === 'number' || typeof gameState.stats.trapsEvaded === 'number', '有陷阱统计');
assert(typeof gameState.stats.chestsOpened === 'number', '有宝箱统计');

console.log(`\n═══ 陷阱与宝箱测试: ${pass}通过, ${fail}失败 ═══`);
process.exit(fail > 0 ? 1 : 0);
