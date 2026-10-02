// 无尽深渊模式测试
import { generateAbyssFloor, startAbyss, nextAbyssFloor, getAbyssState,
  isAbyssActive, endAbyss, recordAbyssKill, recordAbyssGold,
  serializeAbyss, deserializeAbyss
} from './src/core/AbyssMode.js';
import { TILE, ENTITY_TYPE } from './src/core/constants.js';

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) pass++;
  else { fail++; console.error('  \u274c', msg); }
}

// -- 楼层生成 --
const floor1 = generateAbyssFloor(1);
assert(floor1.tiles.length > 0, 'has tiles');
assert(floor1.width === 18, 'width 18');
assert(floor1.height === 14, 'height 14');
assert(floor1.playerStart.x === 2 && floor1.playerStart.y === 2, 'player start');
assert(floor1.entities.length >= 1, 'has entities: ' + floor1.entities.length);
assert(floor1.name.includes('1'), 'name includes floor num');

// Verify tiles structure
assert(floor1.tiles[0][0] === TILE.WALL, 'border is wall');
assert(floor1.tiles[1][1] === TILE.FLOOR, 'interior is floor');
assert(floor1.tiles[floor1.height-2][floor1.width-2] === TILE.STAIRS, 'has stairs');
console.log('  \u2713 \u57fa\u7840\u697c\u5c42\u751f\u6210\u6b63\u786e');

// -- Boss floor --
const floor10 = generateAbyssFloor(10);
const bosses = floor10.entities.filter(e => e.type === ENTITY_TYPE.BOSS);
assert(bosses.length === 1, 'floor 10 has 1 boss: ' + bosses.length);
assert(bosses[0].isBoss, 'boss flag set');
assert(bosses[0].hp > 100, 'boss has high HP');
console.log('  \u2713 Boss\u697c\u5c42\u6b63\u786e (\u6bcf10\u5c42)');

// -- Shop floor --
const floor5 = generateAbyssFloor(5);
const merchants = floor5.entities.filter(e => e.type === ENTITY_TYPE.NPC);
assert(merchants.length >= 1, 'floor 5 has merchant');
console.log('  \u2713 \u5546\u5e97\u697c\u5c42\u6b63\u786e (\u6bcf5\u5c42)');

// -- Difficulty scaling --
const floor50 = generateAbyssFloor(50);
const floor1enemies = floor1.entities.filter(e => e.type === ENTITY_TYPE.ENEMY);
const floor50enemies = floor50.entities.filter(e => e.type === ENTITY_TYPE.ENEMY);
if (floor1enemies.length > 0 && floor50enemies.length > 0) {
  assert(floor50enemies[0].hp > floor1enemies[0].hp, 'floor 50 enemies stronger than floor 1');
  assert(floor50enemies[0].rewards.exp > floor1enemies[0].rewards.exp, 'floor 50 rewards > floor 1');
}
console.log('  \u2713 \u96be\u5ea6\u9012\u589e\u6b63\u786e');

// -- State management --
const f = startAbyss();
assert(isAbyssActive(), 'abyss active');
assert(getAbyssState().currentFloor === 1, 'floor 1');
const f2 = nextAbyssFloor();
assert(getAbyssState().currentFloor === 2, 'floor 2');
recordAbyssKill();
recordAbyssKill();
recordAbyssGold(100);
assert(getAbyssState().totalKills === 2, 'kills tracked');
assert(getAbyssState().totalGold === 100, 'gold tracked');
console.log('  \u2713 \u72b6\u6001\u7ba1\u7406\u6b63\u786e');

// -- End and scoring --
const result = endAbyss('death');
assert(!isAbyssActive(), 'abyss ended');
assert(result.floor === 2, 'ended on floor 2');
assert(result.score > 0, 'has score');
console.log('  \u2713 \u7ed3\u675f\u548c\u8bc4\u5206\u6b63\u786e');

// -- Serialization --
startAbyss();
nextAbyssFloor();
nextAbyssFloor();
const ser = serializeAbyss();
assert(ser.currentFloor === 3, 'serialized floor 3');
endAbyss();
deserializeAbyss(ser);
assert(getAbyssState().currentFloor === 3, 'deserialized floor 3');
console.log('  \u2713 \u5e8f\u5217\u5316\u6b63\u786e');

// -- Multiple floors generation --
for (let i = 1; i <= 30; i++) {
  const f = generateAbyssFloor(i);
  assert(f.tiles.length === f.height, 'floor ' + i + ' valid tiles');
  assert(f.entities.length >= 1, 'floor ' + i + ' has entities');
}
console.log('  \u2713 30\u5c42\u8fde\u7eed\u751f\u6210\u5168\u90e8\u6709\u6548');

console.log('');
console.log('\u2550'.repeat(42));
console.log('\u65e0\u5c3d\u6df1\u6e0a\u6a21\u5f0f\u6d4b\u8bd5: ' + pass + '\u901a\u8fc7, ' + fail + '\u5931\u8d25');
if (fail === 0) console.log('\u2705 \u65e0\u5c3d\u6df1\u6e0a\u6a21\u5f0f\u5168\u90e8\u901a\u8fc7');
else { console.log('\u274c \u6709\u6d4b\u8bd5\u5931\u8d25'); process.exit(1); }
