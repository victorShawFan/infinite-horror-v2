// 角色成长轨迹测试
import { recordChapterSnapshot, recordMilestone, getSnapshots, getMilestones,
  getGrowthBetween, getGrowthCurveData, renderGrowthPanel,
  clearGrowthData, serializeGrowth, deserializeGrowth
} from './src/core/GrowthTracker.js';

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) pass++;
  else { fail++; console.error('  \u274c', msg); }
}

clearGrowthData();
assert(getSnapshots().length === 0, 'start empty');

// -- 记录快照 --
recordChapterSnapshot(1, { level: 5, maxHp: 120, atk: 20, def: 10, spd: 5, crt: 3, gold: 100 });
recordChapterSnapshot(2, { level: 10, maxHp: 200, atk: 40, def: 20, spd: 8, crt: 8, gold: 500 });
recordChapterSnapshot(3, { level: 15, maxHp: 300, atk: 65, def: 35, spd: 12, crt: 12, gold: 1200 });
assert(getSnapshots().length === 3, '3 snapshots');
console.log('  \u2713 快照记录正确');

// -- 里程碑 --
recordMilestone('开启第一阶基因锁', 2, 'gene_lock');
recordMilestone('获得血族血统', 3, 'bloodline');
assert(getMilestones().length === 2, '2 milestones');
console.log('  \u2713 里程碑记录正确');

// -- 成长量计算 --
const growth = getGrowthBetween(1, 3);
assert(growth !== null, 'growth data exists');
assert(growth.levelGain === 10, 'level gain = 10');
assert(growth.atkGain === 45, 'atk gain = 45');
assert(growth.defGain === 25, 'def gain = 25');
assert(growth.hpGain === 180, 'hp gain = 180');
console.log('  \u2713 成长量计算正确');

// -- 成长曲线 --
const curve = getGrowthCurveData();
assert(curve !== null, 'has curve data');
assert(curve.atkPath.startsWith('M'), 'atk path valid');
assert(curve.defPath.startsWith('M'), 'def path valid');
assert(curve.hpPath.startsWith('M'), 'hp path valid');
assert(curve.w === 300, 'curve width');
console.log('  \u2713 成长曲线数据正确');

// -- 面板渲染 --
const panel = renderGrowthPanel();
assert(panel.length > 100, 'panel has content');
assert(panel.includes('ATK'), 'panel shows ATK');
assert(panel.includes('DEF'), 'panel shows DEF');
console.log('  \u2713 面板HTML渲染正确');

// -- 序列化 --
const ser = serializeGrowth();
assert(ser.snapshots.length === 3, 'serialized 3 snapshots');
assert(ser.milestones.length === 2, 'serialized 2 milestones');
clearGrowthData();
assert(getSnapshots().length === 0, 'cleared');
deserializeGrowth(ser);
assert(getSnapshots().length === 3, 'deserialized 3 snapshots');
assert(getMilestones().length === 2, 'deserialized 2 milestones');
console.log('  \u2713 序列化/反序列化正确');

// -- 空数据处理 --
clearGrowthData();
const emptyPanel = renderGrowthPanel();
assert(emptyPanel.includes('\u5c1a\u65e0'), 'empty panel shows message');
const emptyGrowth = getGrowthBetween(1, 2);
assert(emptyGrowth === null, 'null growth when no data');
const emptyCurve = getGrowthCurveData();
assert(emptyCurve === null, 'null curve when no data');
console.log('  \u2713 空数据处理正确');

console.log('');
console.log('\u2550'.repeat(42));
console.log('\u89d2\u8272\u6210\u957f\u8f68\u8ff9\u6d4b\u8bd5: ' + pass + '\u901a\u8fc7, ' + fail + '\u5931\u8d25');
if (fail === 0) console.log('\u2705 \u89d2\u8272\u6210\u957f\u8f68\u8ff9\u5168\u90e8\u901a\u8fc7');
else { console.log('\u274c \u6709\u6d4b\u8bd5\u5931\u8d25'); process.exit(1); }
