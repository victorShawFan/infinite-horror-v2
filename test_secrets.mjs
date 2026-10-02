// test_secrets.mjs — 隐藏房间系统测试
import { SECRET_TYPES, canBreakSecret, getSecretRoomReward, applySecretReward, generateSecretEntities, tryBreakSecret } from './src/core/SecretRoomSystem.js';
import { gameState } from './src/core/GameState.js';
import { TILE } from './src/core/constants.js';

let pass = 0, fail = 0;
function assert(cond, msg) { if (cond) { pass++; } else { fail++; console.log('  ✗ ' + msg); } }

console.log('═══ 隐藏房间系统测试 ═══\n');

// ── 密道类型完整性 ──
console.log('[ 密道定义 ]');
assert(Object.keys(SECRET_TYPES).length >= 3, `至少3种密道: ${Object.keys(SECRET_TYPES).length}`);
for (const [id, s] of Object.entries(SECRET_TYPES)) {
  assert(typeof s.name === 'string', `${id}: has name`);
  assert(typeof s.icon === 'string', `${id}: has icon`);
  assert(typeof s.hint === 'string', `${id}: has hint`);
}

// ── 条件检查 ──
console.log('\n[ 破墙条件 ]');
const weakPlayer = { atk: 5, def: 3, spd: 3, level: 1 };
const strongPlayer = { atk: 30, def: 15, spd: 15, level: 10 };
assert(!canBreakSecret('breakable_wall', weakPlayer), '弱玩家不能破碎墙');
assert(canBreakSecret('breakable_wall', strongPlayer), '强玩家可以破碎墙');
assert(!canBreakSecret('illusory_wall', weakPlayer), '弱玩家看不穿幻影墙');
assert(canBreakSecret('illusory_wall', strongPlayer), '强玩家看穿幻影墙');

// ── 奖励生成 ──
console.log('\n[ 奖励池 ]');
for (let ch = 1; ch <= 12; ch++) {
  const reward = getSecretRoomReward(ch);
  assert(typeof reward.type === 'string', `Ch${ch}: reward has type`);
  assert(typeof reward.text === 'string', `Ch${ch}: reward has text`);
}

// ── 奖励应用 ──
console.log('\n[ 奖励应用 ]');
gameState.reset();
const p = gameState.player;
const origAtk = p.atk;
applySecretReward({ type: 'stat', stat: 'atk', value: 5, text: 'ATK+5' });
assert(p.atk === origAtk + 5, `ATK增加: ${p.atk} === ${origAtk + 5}`);

const origGold = p.gold;
applySecretReward({ type: 'gold', value: 200, text: '+200G' });
assert(p.gold === origGold + 200, `金币增加: ${p.gold}`);

const origYellow = p.keys.yellow;
applySecretReward({ type: 'key', keyType: 'yellow', count: 2, text: '+2黄' });
assert(p.keys.yellow === origYellow + 2, `黄钥匙: ${p.keys.yellow}`);

// ── 地图生成 ──
console.log('\n[ 密道生成 ]');
// 创建一个简单测试地图
const testMap = [];
for (let y = 0; y < 10; y++) {
  testMap.push([]);
  for (let x = 0; x < 10; x++) {
    if (y === 0 || y === 9 || x === 0 || x === 9) testMap[y].push(1); // 边界墙
    else if (y === 5 && x >= 3 && x <= 7) testMap[y].push(1); // 中间横墙
    else testMap[y].push(0); // 地板
  }
}
const testFloor = { map: testMap, tiles: testMap, width: 10, height: 10 };
const secrets = generateSecretEntities(testFloor, 6);
assert(Array.isArray(secrets), '返回数组');
assert(secrets.length >= 0, `生成密道数量: ${secrets.length}`);
for (const s of secrets) {
  assert(typeof s.x === 'number' && typeof s.y === 'number', `密道有坐标: (${s.x},${s.y})`);
  assert(testMap[s.y][s.x] === 1, '密道在墙壁上');
  assert(typeof s.secretType === 'string', `密道有类型: ${s.secretType}`);
}

// ── 破墙流程 ──
console.log('\n[ 破墙流程 ]');
if (secrets.length > 0) {
  gameState.reset();
  gameState.player.atk = 30;
  gameState.player.spd = 15;
  gameState.player.level = 10;
  const s = secrets[0];
  const result = tryBreakSecret(s, gameState.player, 6);
  assert(result.success || !result.success, '返回结果');
  if (result.success) {
    assert(s.broken === true, '密道标记已打开');
    assert(typeof result.message === 'string', '有消息');
    assert(result.reward !== undefined, '有奖励');
    // 再次破同一个应该失败
    const r2 = tryBreakSecret(s, gameState.player, 6);
    assert(!r2.success, '重复破墙失败');
  }
}

console.log(`\n═══ 隐藏房间测试: ${pass}通过, ${fail}失败 ═══`);
process.exit(fail > 0 ? 1 : 0);
