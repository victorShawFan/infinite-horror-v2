// 动态难度自适应系统测试
import { recordVictory, recordDeath, getDynamicFactor, getDynamicDifficultyInfo,
  resetDynamicDifficulty, applyDynamicScaling, serializeDynamicDifficulty,
  deserializeDynamicDifficulty, setDynamicDifficultyEnabled
} from './src/core/DynamicDifficulty.js';

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) pass++;
  else { fail++; console.error('  \u274c', msg); }
}

// -- 初始状态 --
resetDynamicDifficulty();
assert(getDynamicFactor() === 1.0, 'initial factor = 1.0');
assert(getDynamicDifficultyInfo().label === '\u6807\u51c6', 'initial label = standard');
console.log('  \u2713 初始状态正确');

// -- 连续轻松胜利提升难度 --
for (let i = 0; i < 3; i++) recordVictory(0.05); // 3场轻松胜利
assert(getDynamicFactor() > 1.0, 'factor increased after 3 easy wins: ' + getDynamicFactor().toFixed(3));
console.log('  \u2713 连续轻松胜利提升难度');

// -- 连续死亡降低难度 --
resetDynamicDifficulty();
recordDeath();
recordDeath(); // 2次死亡
assert(getDynamicFactor() < 1.0, 'factor decreased after 2 deaths: ' + getDynamicFactor().toFixed(3));
console.log('  \u2713 连续死亡降低难度');

// -- 不超过上下限 --
resetDynamicDifficulty();
for (let i = 0; i < 100; i++) recordVictory(0.01);
assert(getDynamicFactor() <= 1.30, 'max factor cap: ' + getDynamicFactor().toFixed(3));

resetDynamicDifficulty();
for (let i = 0; i < 100; i++) recordDeath();
assert(getDynamicFactor() >= 0.75, 'min factor cap: ' + getDynamicFactor().toFixed(3));
console.log('  \u2713 上下限正确');

// -- applyDynamicScaling --
resetDynamicDifficulty();
for (let i = 0; i < 6; i++) recordVictory(0.01); // increase factor
const factor = getDynamicFactor();
const enemy = { hp: 100, atk: 20, def: 10, rewards: { exp: 50, gold: 30 } };
const scaled = applyDynamicScaling(enemy);
assert(scaled.hp > 100, 'scaled HP increased');
assert(scaled.atk > 20, 'scaled ATK increased');
assert(scaled.rewards.exp > 50, 'scaled exp increased (reward bonus)');
console.log('  \u2713 动态缩放应用正确');

// -- 禁用时factor=1.0 --
setDynamicDifficultyEnabled(false);
assert(getDynamicFactor() === 1.0, 'disabled = 1.0');
const unscaled = applyDynamicScaling(enemy);
assert(unscaled.hp === 100, 'no scaling when disabled');
setDynamicDifficultyEnabled(true);
console.log('  \u2713 禁用/启用正确');

// -- 序列化 --
resetDynamicDifficulty();
for (let i = 0; i < 3; i++) recordVictory(0.05);
recordDeath();
const ser = serializeDynamicDifficulty();
assert(ser.totalWins === 3, 'serialized wins = 3');
assert(ser.totalLosses === 1, 'serialized losses = 1');
const savedFactor = ser.factor;
resetDynamicDifficulty();
deserializeDynamicDifficulty(ser);
assert(Math.abs(getDynamicFactor() - savedFactor) < 0.001, 'deserialized factor matches');
console.log('  \u2713 序列化/反序列化正确');

// -- getDynamicDifficultyInfo --
resetDynamicDifficulty();
for (let i = 0; i < 20; i++) recordVictory(0.01);
const info = getDynamicDifficultyInfo();
assert(info.percent > 0, 'info shows positive percent');
assert(info.wins === 20, 'info wins = 20');
assert(['\u56f0\u96be', '\u7565\u96be'].includes(info.label), 'label is harder: ' + info.label);
console.log('  \u2713 难度信息API正确');

console.log('');
console.log('\u2550'.repeat(42));
console.log('\u52a8\u6001\u96be\u5ea6\u7cfb\u7edf\u6d4b\u8bd5: ' + pass + '\u901a\u8fc7, ' + fail + '\u5931\u8d25');
if (fail === 0) console.log('\u2705 \u52a8\u6001\u96be\u5ea6\u7cfb\u7edf\u5168\u90e8\u901a\u8fc7');
else { console.log('\u274c \u6709\u6d4b\u8bd5\u5931\u8d25'); process.exit(1); }
