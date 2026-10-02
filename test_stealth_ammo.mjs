// 潜行与弹药系统测试
// Node.js polyfills
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

import {
  setShiftHeld, onPlayerMove, onCombatNoise, decayNoise,
  isPatrolAlerted, consumeAmmo, reloadAmmo, resetStealth, initAmmo,
  getNoise, getIsSneaking, getAmmo, getMaxAmmo,
  serializeStealth, deserializeStealth,
} from './src/core/StealthSystem.js';
import { gameState } from './src/core/GameState.js';

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; console.log(`  ✓ ${msg}`); }
  else { fail++; console.error(`  ✗ ${msg}`); }
}

console.log('═══ 潜行与弹药系统测试 ═══\n');

// ── 噪音系统 ──
console.log('=== 噪音系统 ===');
resetStealth();
assert(getNoise() === 0, '初始噪音为0');

onPlayerMove(); // 正常移动 +10
assert(getNoise() === 10, '正常移动后噪音10');

setShiftHeld(true);
assert(getIsSneaking(), 'Shift按下=潜行');
onPlayerMove(); // 潜行 +2
assert(getNoise() === 12, '潜行移动后噪音12');
setShiftHeld(false);

onCombatNoise(); // 战斗 +40
assert(getNoise() === 52, '战斗后噪音52');

decayNoise(); // -5
assert(getNoise() === 47, '衰减后噪音47');

// ── 巡逻警戒 ──
console.log('\n=== 巡逻警戒 ===');
resetStealth();
const patrolEnemy = { patrol: true, x: 5, y: 5 };
const normalEnemy = { patrol: false, x: 3, y: 3 };

assert(isPatrolAlerted(normalEnemy, 1, 1), '非巡逻敌人始终激活');
assert(!isPatrolAlerted(patrolEnemy, 3, 3), '巡逻敌人+低噪音=未惊动');

// 增加噪音超过阈值
for (let i = 0; i < 4; i++) onPlayerMove(); // 4*10 = 40 > 30
assert(isPatrolAlerted(patrolEnemy, 3, 3), '巡逻敌人+高噪音+近距离=惊动');

// 远距离
assert(!isPatrolAlerted(patrolEnemy, 20, 20), '巡逻敌人+高噪音+远距离=未惊动');

// ── 弹药系统 ──
console.log('\n=== 弹药系统 ===');
gameState.chapter = 2;
initAmmo({ damageType: 'physical' });
assert(getAmmo() === 30 && getMaxAmmo() === 30, '物理弹药初始30/30');

assert(consumeAmmo(), '消耗1发成功');
assert(getAmmo() === 29, '剩余29');

reloadAmmo(10);
assert(getAmmo() === 30, '补充后满弹(不超上限)');

// 打空
for (let i = 0; i < 30; i++) consumeAmmo();
assert(getAmmo() === 0, '打空弹药=0');
assert(!consumeAmmo(), '无弹药时消耗失败');

// 火焰弹药
initAmmo({ damageType: 'fire' });
assert(getMaxAmmo() === 15, '火焰弹药上限15');

// Ch1无弹药限制
gameState.chapter = 1;
assert(consumeAmmo(), 'Ch1无弹药限制');

// ── 序列化 ──
console.log('\n=== 序列化 ===');
gameState.chapter = 2;
resetStealth();
onPlayerMove();
onPlayerMove();
consumeAmmo(3);
const data = serializeStealth();
assert(data.noiseLevel === 20, '序列化噪音');
assert(data.currentAmmo !== undefined, '序列化弹药');

resetStealth();
assert(getNoise() === 0, '重置后噪音0');
deserializeStealth(data);
assert(getNoise() === 20, '反序列化噪音恢复');

console.log(`\n════════════════════════════════════════`);
console.log(`${pass + fail} 项测试: ${pass} 通过, ${fail} 失败`);
if (fail === 0) console.log('✅ 潜行与弹药系统测试全部通过');
else { console.error('❌ 有失败'); process.exit(1); }
