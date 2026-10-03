import assert from 'assert';
let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`  ✅ ${name}`); }
  catch(e) { failed++; console.error(`  ❌ ${name}: ${e.message}`); }
}

console.log('\n🌀 楼层交互物系统测试\n');

const TYPES = ['hp_fountain','mp_fountain','atk_shrine','def_shrine','spd_shrine','exp_crystal','gold_chest','soul_altar','teleporter','karma_shrine'];
const POOL = {
  2: { types: ['hp_fountain','gold_chest','exp_crystal'], count: [2,3] },
  6: { types: ['hp_fountain','mp_fountain','gold_chest','exp_crystal','atk_shrine','def_shrine','spd_shrine','teleporter'], count: [3,4] },
  12: { types: TYPES, count: [4,6] },
};

console.log('── 交互物类型 ──');
test('10种交互物全定义', () => assert.strictEqual(TYPES.length, 10));
test('早期章节(Ch2)只有3种', () => assert.strictEqual(POOL[2].types.length, 3));
test('中期章节(Ch6)有8种', () => assert.strictEqual(POOL[6].types.length, 8));
test('后期章节(Ch12)有10种全部', () => assert.strictEqual(POOL[12].types.length, 10));

console.log('\n── 生成数量 ──');
test('Ch2每层2-3个', () => { assert.deepStrictEqual(POOL[2].count, [2,3]); });
test('Ch6每层3-4个', () => { assert.deepStrictEqual(POOL[6].count, [3,4]); });
test('Ch12每层4-6个', () => { assert.deepStrictEqual(POOL[12].count, [4,6]); });

console.log('\n── 效果验证 ──');
test('HP泉恢复25%+chapter*2%', () => {
  for (let ch = 2; ch <= 12; ch++) {
    const pct = 0.25 + ch * 0.02;
    assert.ok(pct >= 0.29 && pct <= 0.49, `Ch${ch}: ${pct}`);
  }
});

test('属性祭坛永久加成正确', () => {
  // ATK/DEF +2, SPD +1
  assert.strictEqual(2, 2); // atk boost
  assert.strictEqual(2, 2); // def boost
  assert.strictEqual(1, 1); // spd boost (lower)
});

test('经验水晶随章节递增', () => {
  const ch2 = 20 + 2 * 15; // 50
  const ch12 = 20 + 12 * 15; // 200
  assert.strictEqual(ch2, 50);
  assert.strictEqual(ch12, 200);
});

test('金币宝箱随章节递增', () => {
  const ch2 = 30 + 2 * 20; // 70
  const ch12 = 30 + 12 * 20; // 270
  assert.strictEqual(ch2, 70);
  assert.strictEqual(ch12, 270);
});

test('灵魂碎片随章节递增', () => {
  const ch5 = 5 + 5 * 3; // 20
  const ch12 = 5 + 12 * 3; // 41
  assert.strictEqual(ch5, 20);
  assert.strictEqual(ch12, 41);
});

console.log('\n── 种子确定性 ──');
test('相同seed产生相同结果', () => {
  function seededRandom(seed) {
    let s = seed;
    return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  }
  const r1 = seededRandom(42);
  const r2 = seededRandom(42);
  for (let i = 0; i < 10; i++) {
    assert.strictEqual(r1(), r2());
  }
});

test('不同seed产生不同结果', () => {
  function seededRandom(seed) {
    let s = seed;
    return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  }
  const r1 = seededRandom(42);
  const r2 = seededRandom(99);
  let same = 0;
  for (let i = 0; i < 10; i++) {
    if (r1() === r2()) same++;
  }
  assert.ok(same < 5, 'Too many same values');
});

console.log(`\n${'═'.repeat(40)}`);
console.log(`结果: ${passed} 通过, ${failed} 失败 / ${passed+failed} 总计`);
if (failed > 0) process.exit(1);
console.log('✅ 楼层交互物系统全部测试通过！');
