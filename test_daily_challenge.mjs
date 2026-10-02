// 每日挑战测试
import { generateDailyChallenge, isDailyCompleted, completeDailyChallenge,
  getDailyRecord, serializeDaily, deserializeDaily
} from './src/core/DailyChallenge.js';
import { TILE, ENTITY_TYPE } from './src/core/constants.js';

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) pass++;
  else { fail++; console.error('  \u274c', msg); }
}

// -- 基础生成 --
const today = new Date();
const challenge = generateDailyChallenge(today);
assert(challenge.seed > 0, 'has seed');
assert(challenge.modifier, 'has modifier');
assert(challenge.modifier.name, 'modifier has name');
assert(challenge.theme, 'has theme');
assert(challenge.floors.length >= 3, 'at least 3 floors');
assert(challenge.floors.length <= 5, 'at most 5 floors');
console.log('  \u2713 \u57fa\u7840\u751f\u6210\u6b63\u786e: ' + challenge.modifier.icon + ' ' + challenge.modifier.name);

// -- 确定性(同日期同结果) --
const challenge2 = generateDailyChallenge(today);
assert(challenge.seed === challenge2.seed, 'same seed');
assert(challenge.modifier.id === challenge2.modifier.id, 'same modifier');
assert(challenge.floors.length === challenge2.floors.length, 'same floor count');
console.log('  \u2713 \u786e\u5b9a\u6027: \u540c\u65e5\u671f\u540c\u7ed3\u679c');

// -- 不同日期不同结果 --
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);
const challenge3 = generateDailyChallenge(tomorrow);
assert(challenge3.seed !== challenge.seed, 'different seed for different day');
console.log('  \u2713 \u4e0d\u540c\u65e5\u671f\u4e0d\u540c\u6311\u6218');

// -- 楼层结构 --
for (const floor of challenge.floors) {
  assert(floor.tiles.length > 0, 'floor has tiles');
  assert(floor.entities.length >= 1, 'floor has entities');
  assert(floor.playerStart, 'floor has playerStart');
  assert(floor.tiles[0][0] === TILE.WALL, 'border wall');
}
const lastFloor = challenge.floors[challenge.floors.length - 1];
const hasBoss = lastFloor.entities.some(e => e.type === ENTITY_TYPE.BOSS);
assert(hasBoss, 'last floor has boss');
console.log('  \u2713 \u697c\u5c42\u7ed3\u6784\u6b63\u786e');

// -- 完成记录 --
assert(!isDailyCompleted(today), 'not completed yet');
completeDailyChallenge(today, 120, 5000);
assert(isDailyCompleted(today), 'completed');
const record = getDailyRecord(today);
assert(record.score === 5000, 'score recorded');
assert(record.time === 120, 'time recorded');
console.log('  \u2713 \u5b8c\u6210\u8bb0\u5f55\u6b63\u786e');

// -- 序列化 --
const ser = serializeDaily();
deserializeDaily({});
assert(!isDailyCompleted(today), 'cleared');
deserializeDaily(ser);
assert(isDailyCompleted(today), 'restored');
console.log('  \u2713 \u5e8f\u5217\u5316\u6b63\u786e');

console.log('');
console.log('\u2550'.repeat(42));
console.log('\u6bcf\u65e5\u6311\u6218\u6d4b\u8bd5: ' + pass + '\u901a\u8fc7, ' + fail + '\u5931\u8d25');
if (fail === 0) console.log('\u2705 \u6bcf\u65e5\u6311\u6218\u5168\u90e8\u901a\u8fc7');
else { console.log('\u274c \u6709\u6d4b\u8bd5\u5931\u8d25'); process.exit(1); }
