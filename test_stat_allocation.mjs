// ═══ 属性分配系统验证 ═══
import { gameState } from './src/core/GameState.js';
import {
  STAT_DEFS, BUILD_PRESETS,
  initStatAllocation, grantStatPoints, allocateStat, autoAllocate,
  getPendingPoints, getInvested, getRecommendedBuild,
  renderStatAllocationPanel, serializeStatAllocation, deserializeStatAllocation,
} from './src/core/StatAllocation.js';
import { BLOODLINE } from './src/core/constants.js';

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) pass++;
  else { fail++; console.log(`  ❌ ${msg}`); }
}

console.log('═══ 属性分配系统验证 ═══\n');

// ── 初始化 ──
console.log('── 初始化 ──');
gameState.player.level = 1;
gameState.player.maxHp = 100;
gameState.player.hp = 100;
gameState.player.atk = 10;
gameState.player.def = 5;
gameState.player.spd = 5;
gameState.player.crt = 0;
gameState.player.maxMana = 0;
gameState.player.activeBloodline = 'none';
gameState._statAllocation = null;
initStatAllocation();
assert(getPendingPoints() === 0, '初始应有0待分配点');

// ── 授予点数 ──
console.log('── 授予点数 ──');
grantStatPoints(3);
assert(getPendingPoints() === 3, '授予3点后应有3点');
grantStatPoints(3);
assert(getPendingPoints() === 6, '再授予3点后应有6点');

// ── 分配属性 ──
console.log('── 分配属性 ──');
const origAtk = gameState.player.atk;
const r1 = allocateStat('atk');
assert(r1.success, '分配ATK应成功');
assert(gameState.player.atk === origAtk + 3, `ATK应为${origAtk+3}, got ${gameState.player.atk}`);
assert(getPendingPoints() === 5, '剩余应为5点');
assert(getInvested().atk === 1, '已投入ATK应为1');

// ── 分配HP ──
const origHp = gameState.player.maxHp;
const r2 = allocateStat('maxHp');
assert(r2.success, '分配HP应成功');
assert(gameState.player.maxHp === origHp + 15, `MaxHP应为${origHp+15}, got ${gameState.player.maxHp}`);

// ── 法力需要前置条件 ──
console.log('── 前置条件验证 ──');
const r3 = allocateStat('maxMana');
assert(!r3.success, '无道法血统时分配法力应失败');

// 设置道法血统后应可以分配
gameState.player.activeBloodline = BLOODLINE.DAOIST;
const r4 = allocateStat('maxMana');
assert(r4.success, '道法血统后分配法力应成功');
assert((gameState.player.maxMana || 0) >= 8, `法力应≥8, got ${gameState.player.maxMana}`);

// ── 无点数时分配应失败 ──
console.log('── 无点数验证 ──');
// 消耗剩余点数
while (getPendingPoints() > 0) allocateStat('atk');
const r5 = allocateStat('atk');
assert(!r5.success, '无点数时分配应失败');

// ── 上限验证 ──
console.log('── 上限验证 ──');
// Reset and test max invest
gameState._statAllocation = null;
initStatAllocation();
grantStatPoints(100);
let investCount = 0;
while (true) {
  const r = allocateStat('crt');
  if (!r.success) break;
  investCount++;
}
assert(investCount === STAT_DEFS.crt.maxInvest, `CRT最多投入${STAT_DEFS.crt.maxInvest}次, got ${investCount}`);

// ── 一键分配 ──
console.log('── 一键分配 ──');
gameState._statAllocation = null;
gameState.player.activeBloodline = 'none';
initStatAllocation();
grantStatPoints(9);
const autoResult = autoAllocate('balanced');
assert(autoResult.success, '一键分配应成功');
assert(getPendingPoints() === 0, '一键分配后应无剩余点数');
const inv = getInvested();
assert(inv.atk > 0, '均衡型应分配ATK');
assert(inv.def > 0, '均衡型应分配DEF');
assert(inv.maxHp > 0, '均衡型应分配HP');

// ── 推荐方案 ──
console.log('── 推荐方案 ──');
gameState.player.activeBloodline = BLOODLINE.VAMPIRE;
assert(getRecommendedBuild() === 'berserker', '血族应推荐berserker');
gameState.player.activeBloodline = BLOODLINE.DAOIST;
assert(getRecommendedBuild() === 'caster', '道法应推荐caster');
gameState.player.activeBloodline = BLOODLINE.MARTIAL;
assert(getRecommendedBuild() === 'tank', '武修应推荐tank');

// ── 序列化/反序列化 ──
console.log('── 序列化 ──');
gameState._statAllocation = null;
initStatAllocation();
grantStatPoints(6);
allocateStat('atk');
allocateStat('def');
const serialized = serializeStatAllocation();
assert(serialized.pendingPoints === 4, '序列化点数应为4');
assert(serialized.invested.atk === 1, '序列化ATK投入应为1');

// Reset and restore
gameState._statAllocation = null;
initStatAllocation();
assert(getPendingPoints() === 0, '重置后应为0');
deserializeStatAllocation(serialized);
assert(getPendingPoints() === 4, '反序列化后应恢复4点');
assert(getInvested().atk === 1, '反序列化后ATK投入应为1');

// ── 渲染面板 ──
console.log('── 渲染面板 ──');
const html = renderStatAllocationPanel();
assert(typeof html === 'string' && html.length > 100, '面板HTML应非空');
assert(html.includes('属性分配'), '面板应包含标题');
assert(html.includes('data-stat-alloc'), '面板应包含分配按钮');

// ── 所有方案验证 ──
console.log('── 方案完整性 ──');
for (const [id, preset] of Object.entries(BUILD_PRESETS)) {
  assert(preset.name, `${id}应有名称`);
  assert(preset.desc, `${id}应有描述`);
  assert(preset.icon, `${id}应有图标`);
  assert(preset.priority, `${id}应有优先级`);
}

console.log(`\nPassed: ${pass}  Failed: ${fail}`);
if (fail > 0) {
  console.log('\n═══ ❌ 属性分配测试失败 ═══');
  process.exit(1);
} else {
  console.log('\n═══ ✅ 属性分配系统验证全部通过 ═══');
}
