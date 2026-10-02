// test_consumables.mjs — 消耗品系统测试
import { CONSUMABLE_DEFS, addConsumable, useConsumable, getInventoryList, consumePendingBuffs, giveStarterConsumables, ensureInventory } from './src/core/ConsumableSystem.js';
import { gameState } from './src/core/GameState.js';

let pass = 0, fail = 0;
function assert(cond, msg) { if (cond) { pass++; } else { fail++; console.log('  ✗ ' + msg); } }

console.log('═══ 消耗品系统测试 ═══\n');

// ── 定义完整性 ──
console.log('[ 消耗品定义 ]');
const ids = Object.keys(CONSUMABLE_DEFS);
assert(ids.length >= 12, `至少12种消耗品: ${ids.length}`);
for (const [id, d] of Object.entries(CONSUMABLE_DEFS)) {
  assert(typeof d.name === 'string', `${id}: has name`);
  assert(typeof d.icon === 'string', `${id}: has icon`);
  assert(typeof d.desc === 'string', `${id}: has desc`);
  assert(typeof d.effect === 'object', `${id}: has effect`);
  assert(typeof d.value === 'number', `${id}: has value`);
}

// ── 背包操作 ──
console.log('\n[ 背包操作 ]');
gameState.reset();
ensureInventory();
assert(Object.keys(gameState.player.consumables).length === 0, '初始背包为空');
addConsumable('potion_small', 3);
assert(gameState.player.consumables.potion_small === 3, '添加3个小药');
addConsumable('potion_small', 2);
assert(gameState.player.consumables.potion_small === 5, '追加到5个');

// ── 使用恢复类 ──
console.log('\n[ 使用恢复药 ]');
gameState.player.hp = 50;
gameState.player.maxHp = 200;
const r1 = useConsumable('potion_small');
assert(r1.success, '使用成功');
assert(gameState.player.hp === 80, `HP恢复: ${gameState.player.hp} === 80`);
assert(gameState.player.consumables.potion_small === 4, '数量减少到4');

// ── 使用完全恢复 ──
addConsumable('elixir', 1);
gameState.player.hp = 1;
const r2 = useConsumable('elixir');
assert(r2.success, '万灵药使用成功');
assert(gameState.player.hp === 200, `完全恢复: ${gameState.player.hp}`);
assert(!gameState.player.consumables.elixir, '万灵药已消耗');

// ── 数量不足 ──
const r3 = useConsumable('elixir');
assert(!r3.success, '数量不足失败');

// ── 战斗增益 ──
console.log('\n[ 战斗增益 ]');
addConsumable('atk_tonic', 1);
const r4 = useConsumable('atk_tonic');
assert(r4.success, '力量药剂使用成功');
const buffs = consumePendingBuffs();
assert(buffs.length === 1, `1个待使用增益: ${buffs.length}`);
assert(buffs[0].stat === 'atk', `增益ATK: ${buffs[0].stat}`);
assert(buffs[0].multiplier === 1.3, `增益倍率: ${buffs[0].multiplier}`);
// 消费后清空
const buffs2 = consumePendingBuffs();
assert(buffs2.length === 0, '消费后清空');

// ── 狂战士饮剂（双重效果） ──
addConsumable('berserker_draught', 1);
const r5 = useConsumable('berserker_draught');
assert(r5.success, '狂战士饮剂使用成功');
const bBuffs = consumePendingBuffs();
assert(bBuffs.length === 1, '1个增益');
assert(bBuffs[0].multiplier === 2, 'ATK翻倍');
assert(bBuffs[0].penalty?.stat === 'def', '有DEF惩罚');

// ── 背包列表 ──
console.log('\n[ 背包列表 ]');
gameState.reset();
addConsumable('potion_small', 3);
addConsumable('atk_tonic', 1);
addConsumable('trap_detector', 2);
const list = getInventoryList();
assert(list.length === 3, `3种道具: ${list.length}`);
assert(list[0].category === 'heal', '恢复药排在前面');
assert(list[1].category === 'buff', '增益排第二');
assert(list[2].category === 'utility', '工具排第三');

// ── 初始道具 ──
console.log('\n[ 初始道具 ]');
gameState.reset();
giveStarterConsumables();
const inv = gameState.player.consumables;
assert(inv.potion_small === 3, `初始3个小药: ${inv.potion_small}`);
assert(inv.antidote === 1, `初始1个解毒: ${inv.antidote}`);

console.log(`\n═══ 消耗品测试: ${pass}通过, ${fail}失败 ═══`);
process.exit(fail > 0 ? 1 : 0);
