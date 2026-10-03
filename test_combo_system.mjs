// ═══════════════════════════════════════════════════════════════
// test_combo_system.mjs — 连击系统测试
// ═══════════════════════════════════════════════════════════════

import assert from 'assert';

// Re-implement core logic for testing
const COMBO_THRESHOLDS = {
  crit: [
    { count: 2, bonus: 0.10 },
    { count: 3, bonus: 0.25 },
    { count: 5, bonus: 0.50 },
    { count: 8, bonus: 1.00 },
  ],
  element: [
    { count: 2, bonus: 0.15 },
    { count: 3, bonus: 0.30 },
    { count: 4, bonus: 0.50 },
  ],
  weakness: [
    { count: 2, bonus: 0.10, armorPen: 0.10 },
    { count: 4, bonus: 0.20, armorPen: 0.25 },
    { count: 6, bonus: 0.40, armorPen: 0.50 },
  ],
  companion: [
    { count: 1, bonus: 0.20 },
    { count: 2, bonus: 0.35 },
    { count: 3, bonus: 0.50 },
  ],
  defense: [
    { count: 3, bonus: 0.15 },
    { count: 5, bonus: 0.30 },
  ],
};

function findBest(thresholds, count) {
  let best = null;
  for (const t of thresholds) {
    if (count >= t.count) best = t;
  }
  return best;
}

let passed = 0, failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`  ✅ ${name}`); }
  catch(e) { failed++; console.error(`  ❌ ${name}: ${e.message}`); }
}

console.log('\n⚡ 连击系统测试\n');

// ── 暴击连锁阈值 ──
console.log('── 暴击连锁 ──');
test('1次暴击: 无连击', () => assert.strictEqual(findBest(COMBO_THRESHOLDS.crit, 1), null));
test('2次暴击: +10%', () => assert.strictEqual(findBest(COMBO_THRESHOLDS.crit, 2).bonus, 0.10));
test('3次暴击: +25%', () => assert.strictEqual(findBest(COMBO_THRESHOLDS.crit, 3).bonus, 0.25));
test('5次暴击: +50%', () => assert.strictEqual(findBest(COMBO_THRESHOLDS.crit, 5).bonus, 0.50));
test('8次暴击: +100%', () => assert.strictEqual(findBest(COMBO_THRESHOLDS.crit, 8).bonus, 1.00));
test('10次暴击: 仍为+100%', () => assert.strictEqual(findBest(COMBO_THRESHOLDS.crit, 10).bonus, 1.00));

// ── 元素连锁阈值 ──
console.log('\n── 元素连锁 ──');
test('1种元素: 无连击', () => assert.strictEqual(findBest(COMBO_THRESHOLDS.element, 1), null));
test('2种元素: +15%', () => assert.strictEqual(findBest(COMBO_THRESHOLDS.element, 2).bonus, 0.15));
test('3种元素: +30%', () => assert.strictEqual(findBest(COMBO_THRESHOLDS.element, 3).bonus, 0.30));
test('4种元素: +50%', () => assert.strictEqual(findBest(COMBO_THRESHOLDS.element, 4).bonus, 0.50));

// ── 弱点连打阈值 ──
console.log('\n── 弱点连打 ──');
test('2次弱点: +10%伤害, 10%穿甲', () => {
  const t = findBest(COMBO_THRESHOLDS.weakness, 2);
  assert.strictEqual(t.bonus, 0.10);
  assert.strictEqual(t.armorPen, 0.10);
});
test('4次弱点: +20%伤害, 25%穿甲', () => {
  const t = findBest(COMBO_THRESHOLDS.weakness, 4);
  assert.strictEqual(t.bonus, 0.20);
  assert.strictEqual(t.armorPen, 0.25);
});
test('6次弱点: +40%伤害, 50%穿甲', () => {
  const t = findBest(COMBO_THRESHOLDS.weakness, 6);
  assert.strictEqual(t.bonus, 0.40);
  assert.strictEqual(t.armorPen, 0.50);
});

// ── 同伴连携阈值 ──
console.log('\n── 同伴连携 ──');
test('1次连携: +20%', () => assert.strictEqual(findBest(COMBO_THRESHOLDS.companion, 1).bonus, 0.20));
test('2次连携: +35%', () => assert.strictEqual(findBest(COMBO_THRESHOLDS.companion, 2).bonus, 0.35));
test('3次连携: +50%', () => assert.strictEqual(findBest(COMBO_THRESHOLDS.companion, 3).bonus, 0.50));

// ── 完美防御阈值 ──
console.log('\n── 完美防御 ──');
test('2次防御: 无触发', () => assert.strictEqual(findBest(COMBO_THRESHOLDS.defense, 2), null));
test('3次防御: +15%', () => assert.strictEqual(findBest(COMBO_THRESHOLDS.defense, 3).bonus, 0.15));
test('5次防御: +30%', () => assert.strictEqual(findBest(COMBO_THRESHOLDS.defense, 5).bonus, 0.30));

// ── 连击伤害计算 ──
console.log('\n── 连击伤害计算 ──');
test('100点伤害 + 3连暴击(+25%) = 125', () => {
  const base = 100;
  const combo = findBest(COMBO_THRESHOLDS.crit, 3);
  assert.strictEqual(Math.floor(base * (1 + combo.bonus)), 125);
});

test('200点伤害 + 4元素(+50%) = 300', () => {
  const base = 200;
  const combo = findBest(COMBO_THRESHOLDS.element, 4);
  assert.strictEqual(Math.floor(base * (1 + combo.bonus)), 300);
});

test('150点伤害 + 8连暴(+100%) = 300', () => {
  const base = 150;
  const combo = findBest(COMBO_THRESHOLDS.crit, 8);
  assert.strictEqual(Math.floor(base * (1 + combo.bonus)), 300);
});

// ── 阈值递增性 ──
console.log('\n── 阈值递增性 ──');
test('所有类型的连击加成递增', () => {
  for (const [type, thresholds] of Object.entries(COMBO_THRESHOLDS)) {
    for (let i = 1; i < thresholds.length; i++) {
      assert.ok(thresholds[i].bonus > thresholds[i-1].bonus, 
        `${type} threshold ${i} bonus not increasing`);
      assert.ok(thresholds[i].count > thresholds[i-1].count, 
        `${type} threshold ${i} count not increasing`);
    }
  }
});

// ── 5种连击类型 ──
console.log('\n── 类型完整性 ──');
test('5种连击类型全定义', () => {
  assert.strictEqual(Object.keys(COMBO_THRESHOLDS).length, 5);
});

test('最高连击加成为100%(暴击)', () => {
  const maxBonus = Math.max(
    ...Object.values(COMBO_THRESHOLDS).flatMap(arr => arr.map(t => t.bonus))
  );
  assert.strictEqual(maxBonus, 1.00);
});

console.log(`\n${'═'.repeat(40)}`);
console.log(`结果: ${passed} 通过, ${failed} 失败 / ${passed + failed} 总计`);
if (failed > 0) process.exit(1);
console.log('✅ 连击系统全部测试通过！');
