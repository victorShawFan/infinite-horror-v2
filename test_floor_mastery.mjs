import {
  initFloorMastery, recordFloorKill, recordFloorCollect, recordFloorEvent,
  calculateFloorStars, getFloorMasteryRewards, getFloorMasteryStatus,
  renderMasteryPopup, serializeFloorMastery, deserializeFloorMastery, resetFloorMastery,
} from './src/core/FloorMastery.js';

let passed = 0, failed = 0;
function assert(c, m) { if (c) passed++; else { failed++; console.error('  ✗', m); } }
function section(n) { console.log(`[ ${n} ]`); }

resetFloorMastery();

section('初始化');
initFloorMastery('1-1', [
  { type: 'enemy', id: 'e1' }, { type: 'enemy', id: 'e2' }, { type: 'boss', id: 'b1' },
  { type: 'item', id: 'i1' }, { type: 'item', id: 'i2' },
  { type: 'event', id: 'ev1' }, { type: 'companion', id: 'c1' },
]);
const s = getFloorMasteryStatus('1-1');
assert(s.enemies.total === 3, '3个敌人');
assert(s.items.total === 2, '2个物品');
assert(s.events.total === 2, '2个事件');

section('记录进度');
recordFloorKill('1-1');
recordFloorKill('1-1');
assert(getFloorMasteryStatus('1-1').enemies.killed === 2, '击杀2');
recordFloorCollect('1-1');
assert(getFloorMasteryStatus('1-1').items.collected === 1, '拾取1');
recordFloorEvent('1-1');
assert(getFloorMasteryStatus('1-1').events.triggered === 1, '事件1');

section('不完美评级');
const stars1 = calculateFloorStars('1-1');
assert(stars1 < 3, '未全完成<3星: ' + stars1);

section('完美评级');
recordFloorKill('1-1');
recordFloorCollect('1-1');
recordFloorEvent('1-1');
const stars2 = calculateFloorStars('1-1');
assert(stars2 === 3, '全完成3星: ' + stars2);

section('奖励计算');
const r = getFloorMasteryRewards('1-1', 5);
assert(r.stars === 3, '3星');
assert(r.exp > 0, '有经验');
assert(r.gold > 0, '有金币');
assert(r.rewardPoints > 0, '3星有奖励点');
assert(r.bonusText.length >= 3, '3条奖励文本');

section('空楼层');
initFloorMastery('test-empty', []);
const emptyStars = calculateFloorStars('test-empty');
assert(emptyStars === 3, '空楼层默认3星: ' + emptyStars);

section('渲染');
const html = renderMasteryPopup('1-1', 5);
assert(html.includes('楼 层 精 通'), '包含标题');
assert(html.includes('⭐⭐⭐'), '包含3星');
assert(html.includes('EXP'), '包含经验');

section('序列化');
const ser = serializeFloorMastery();
assert(ser['1-1'].stars === 3, '序列化保存');
resetFloorMastery();
assert(getFloorMasteryStatus('1-1') === null, '重置成功');
deserializeFloorMastery(ser);
assert(getFloorMasteryStatus('1-1').stars === 3, '反序列化恢复');

console.log(`\n══════════════════════════════════════════`);
console.log(`楼层精通测试: ${passed}通过, ${failed}失败`);
if (failed === 0) console.log('✅ 楼层精通系统全部通过');
else { console.log('❌ 有失败'); process.exit(1); }
