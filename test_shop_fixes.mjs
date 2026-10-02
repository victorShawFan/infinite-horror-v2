// Node.js localStorage polyfill for testing
if (typeof globalThis.localStorage === 'undefined') {
  const store = {};
  globalThis.localStorage = {
    getItem: (k) => store[k] ?? null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { for (const k in store) delete store[k]; },
  };
}
if (typeof globalThis.document === 'undefined') {
  globalThis.document = { getElementById: () => null, querySelector: () => null, querySelectorAll: () => [] };
}

// 商店修复验证测试
import { gameState } from './src/core/GameState.js';
import { purchaseItem, SHOP_ITEMS } from './src/core/LordGodSpace.js';

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; console.log(`  ✓ ${msg}`); }
  else { fail++; console.error(`  ✗ ${msg}`); }
}

console.log('═══ 商店修复验证 ═══\n');

// 重置状态
gameState.reset();
gameState.player.rewardPoints = 10000;
gameState.player.chips = [];
gameState.player.maxChips = 4;

// ── 测试1: 正常购买芯片 ──
console.log('=== 芯片购买流程 ===');
const fireChip = SHOP_ITEMS.chips[0]; // 炎属性芯片
const iceChip = SHOP_ITEMS.chips[1];  // 冰属性芯片
const critChip = SHOP_ITEMS.chips[2]; // 暴击芯片
const lifeChip = SHOP_ITEMS.chips[3]; // 生命芯片
const swiftChip = SHOP_ITEMS.chips[4]; // 迅捷芯片

let r1 = purchaseItem(fireChip);
assert(r1.success, '第1个芯片购买成功');
assert(gameState.player.chips.length === 1, '芯片数=1');

let r2 = purchaseItem(iceChip);
assert(r2.success, '第2个芯片购买成功');

let r3 = purchaseItem(critChip);
assert(r3.success, '第3个芯片购买成功');

let r4 = purchaseItem(lifeChip);
assert(r4.success, '第4个芯片购买成功');
assert(gameState.player.chips.length === 4, '芯片数=4 (满槽)');

const pointsBefore = gameState.player.rewardPoints;
let r5 = purchaseItem(swiftChip);
assert(!r5.success, '第5个芯片被拒绝（槽满）');
assert(gameState.player.rewardPoints === pointsBefore, '槽满时不扣费');
assert(gameState.player.chips.length === 4, '槽满后芯片数不变');

// 不能重复购买
let r6 = purchaseItem(fireChip);
assert(!r6.success, '不能重复购买同一芯片');

// ── 测试2: purchased 持久化 ──
console.log('\n=== purchased 持久化 ===');
// 购买一个武器
const shotgun = SHOP_ITEMS.equipment.find(e => e.id === 'weapon_shotgun');
purchaseItem(shotgun);

// 序列化
const json = gameState.toJSON();
assert(json.shopPurchased.length > 0, 'toJSON 包含 shopPurchased');
assert(json.shopPurchased.includes('chip_fire'), 'shopPurchased 包含 chip_fire');
assert(json.shopPurchased.includes('weapon_shotgun'), 'shopPurchased 包含 weapon_shotgun');

// ── 测试3: 武器CRT应计入有效暴击 ──
console.log('\n=== 武器 CRT 验证 ===');
import { getEffectiveCrt } from './src/core/CombatSystem.js';
// 装备霰弹枪（crt: 5）
gameState.player.crt = 10;
gameState.player.weapon = { name: '霰弹枪', atk: 12, crt: 5 };
gameState.player.accessory = null;
gameState.player.chips = [];
const effCrt = getEffectiveCrt(gameState.player);
assert(effCrt >= 15, `武器CRT计入有效暴击 (${effCrt} >= 15)`);

// ── 测试4: breakdown 包含 companion ──
console.log('\n=== Stats Breakdown 验证 ===');
import { getStatsBreakdown } from './src/core/CombatSystem.js';
gameState.player.weapon = { name: '手枪', atk: 5 };
gameState.player.armor = { name: '防弹衣', def: 3 };
gameState.player.activeBloodline = 'none';
gameState.player.chips = [];
const bd = getStatsBreakdown(gameState.player);
assert('companion' in bd.atk, 'breakdown.atk 有 companion 字段');
assert('companion' in bd.def, 'breakdown.def 有 companion 字段');
assert(typeof bd.atk.companion === 'number', 'companion 是数值');

console.log(`\n════════════════════════════════════════`);
console.log(`${pass + fail} 项测试: ${pass} 通过, ${fail} 失败`);
if (fail === 0) console.log('✅ 商店修复验证全部通过');
else { console.error('❌ 有失败'); process.exit(1); }
