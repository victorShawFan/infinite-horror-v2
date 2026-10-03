import {
  addSyncGauge, getSyncGauge, executeSyncAttack, getSyncAttackInfo,
  renderSyncGaugeHTML, resetSyncGauge, serializeSync, deserializeSync,
} from './src/core/SyncAttack.js';
import { gameState } from './src/core/GameState.js';

let passed = 0, failed = 0;
function assert(cond, msg) { if (cond) passed++; else { failed++; console.log('  ✗ ' + msg); } }
function section(name) { console.log('[ ' + name + ' ]'); }

// Setup
gameState.player = { atk: 50, def: 20, hp: 200, maxHp: 200, level: 5 };
gameState.companions = [
  { id: 'zhang_jie', name: '张杰', alive: true },
  { id: 'zhan_lan', name: '詹岚', alive: true },
];
gameState.relationships = { zhang_jie: { level: 50 }, zhan_lan: { level: 30 } };

section('初始化');
resetSyncGauge();
const g0 = getSyncGauge();
assert(g0.current === 0, '初始为0');
assert(g0.ready === false, '未就绪');

section('累积');
addSyncGauge(30, 'test');
assert(getSyncGauge().current === 30, '增加到30');
addSyncGauge(50, 'test');
assert(getSyncGauge().current === 80, '增加到80');
assert(getSyncGauge().ready === true, '80已就绪');

section('上限');
addSyncGauge(999, 'test');
assert(getSyncGauge().current === 100, '不超过100');

section('执行');
const enemy = { name: '测试敌人', hp: 500, atk: 30, def: 10 };
const result = executeSyncAttack(enemy);
assert(result !== null, '有结果');
assert(result.damage > 0, '有伤害: ' + result.damage);
assert(result.name !== undefined, '有名字: ' + result.name);
assert(result.dialogue !== undefined, '有对白');
assert(getSyncGauge().current === 0, '消耗后归零');

section('不足时无法执行');
resetSyncGauge();
addSyncGauge(50, 'test');
const noResult = executeSyncAttack(enemy);
assert(noResult === null, '不足时返回null');

section('信息预览');
resetSyncGauge();
addSyncGauge(100, 'test');
const info = getSyncAttackInfo();
assert(info.name !== undefined, '有攻击名');
assert(info.companionName !== undefined, '有同伴名');

section('渲染');
const html = renderSyncGaugeHTML();
assert(html.includes('协同'), '包含协同');
assert(html.includes('READY'), '包含READY');

section('序列化');
resetSyncGauge();
addSyncGauge(60, 'test');
const ser = serializeSync();
assert(ser.gauge === 60, '序列化60');
resetSyncGauge();
assert(getSyncGauge().current === 0, '重置后0');
deserializeSync(ser);
assert(getSyncGauge().current === 60, '反序列化60');

console.log();
console.log('══════════════════════════════════════════');
console.log(`协同攻击测试: ${passed}通过, ${failed}失败`);
if (failed === 0) console.log('✅ 协同攻击系统全部通过');
else { console.log('❌ 有失败'); process.exit(1); }
