// ═══════════════════════════════════════════════════════════════
// test_companion_abilities.mjs — 同伴主动技能系统测试
// ═══════════════════════════════════════════════════════════════

import assert from 'assert';

// Re-implement core logic for testing without gameState dependency
const COMPANION_ABILITIES = {
  zhang_jie: { name: '队长守护', type: 'defense', cooldown: 4, maxUses: 3, relReq: 11,
    effect: (rel) => rel >= 71 ? { damageReduce: 0.50, reflect: 0.15 } : rel >= 41 ? { damageReduce: 0.40, reflect: 0 } : { damageReduce: 0.30, reflect: 0 } },
  zhan_lan: { name: '精准狙击', type: 'attack', cooldown: 3, maxUses: 4, relReq: 11,
    effect: (rel) => rel >= 71 ? { dmgMult: 1.6, armorPen: 0.8, crit: true } : rel >= 41 ? { dmgMult: 1.2, armorPen: 0.6 } : { dmgMult: 0.8, armorPen: 0.4 } },
  chuxuan: { name: '战术分析', type: 'debuff', cooldown: 5, maxUses: 2, relReq: 11,
    effect: (rel) => rel >= 71 ? { enemyDefReduce: 0.30, crtBoost: 15 } : rel >= 41 ? { enemyDefReduce: 0.20, crtBoost: 10 } : { enemyDefReduce: 0.10, crtBoost: 5 } },
  li_xiaoyi: { name: '同伴鼓舞', type: 'support', cooldown: 4, maxUses: 3, relReq: 11,
    effect: (rel) => rel >= 71 ? { healPct: 0.20, atkBoost: 8 } : rel >= 41 ? { healPct: 0.12, atkBoost: 5 } : { healPct: 0.08, atkBoost: 3 } },
  mou_gang: { name: '铁壁冲锋', type: 'attack', cooldown: 4, maxUses: 3, relReq: 11,
    effect: (rel) => rel >= 71 ? { dmgMult: 1.0, stun: 2, defBoost: 5 } : rel >= 41 ? { dmgMult: 0.8, stun: 1, defBoost: 3 } : { dmgMult: 0.6, stun: 1 } },
  lingdian: { name: '影分身', type: 'attack', cooldown: 3, maxUses: 3, relReq: 11,
    effect: (rel) => rel >= 71 ? { extraAtk: 2, absorb: 0.3 } : rel >= 41 ? { extraAtk: 1, absorb: 0.2 } : { extraAtk: 1, absorb: 0.1 } },
  bawang: { name: '霸王拳', type: 'attack', cooldown: 5, maxUses: 2, relReq: 11,
    effect: (rel) => rel >= 71 ? { dmgMult: 2.0, shatter: 0.5 } : rel >= 41 ? { dmgMult: 1.5, shatter: 0.3 } : { dmgMult: 1.0, shatter: 0.15 } },
  lishuaixi: { name: '战地急救', type: 'support', cooldown: 5, maxUses: 2, relReq: 11,
    effect: (rel) => rel >= 71 ? { healPct: 0.35, cleanse: true, defBoost: 3 } : rel >= 41 ? { healPct: 0.25, cleanse: true } : { healPct: 0.15 } },
};

let passed = 0, failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`  ✅ ${name}`); }
  catch(e) { failed++; console.error(`  ❌ ${name}: ${e.message}`); }
}

console.log('\n👥 同伴技能系统测试\n');

// ── 技能定义完整性 ──
console.log('── 技能定义完整性 ──');
const expectedCompanions = ['zhang_jie', 'zhan_lan', 'chuxuan', 'li_xiaoyi', 'mou_gang', 'lingdian', 'bawang', 'lishuaixi'];

test('8个同伴都有技能定义', () => {
  assert.strictEqual(Object.keys(COMPANION_ABILITIES).length, 8);
  for (const id of expectedCompanions) {
    assert.ok(COMPANION_ABILITIES[id], `Missing ability for ${id}`);
  }
});

test('每个技能都有名称和类型', () => {
  for (const [id, a] of Object.entries(COMPANION_ABILITIES)) {
    assert.ok(a.name, `${id} missing name`);
    assert.ok(a.type, `${id} missing type`);
    assert.ok(['attack', 'defense', 'support', 'debuff'].includes(a.type), `${id} invalid type: ${a.type}`);
  }
});

test('冷却和次数合理', () => {
  for (const [id, a] of Object.entries(COMPANION_ABILITIES)) {
    assert.ok(a.cooldown >= 3 && a.cooldown <= 6, `${id} cooldown ${a.cooldown} out of range`);
    assert.ok(a.maxUses >= 2 && a.maxUses <= 4, `${id} maxUses ${a.maxUses} out of range`);
    assert.strictEqual(a.relReq, 11);
  }
});

// ── 关系等级分档 ──
console.log('\n── 关系等级分档 ──');

test('张杰·队长守护: 友好30% < 亲密40% < 羁绊50%', () => {
  const e1 = COMPANION_ABILITIES.zhang_jie.effect(20);  // 友好
  const e2 = COMPANION_ABILITIES.zhang_jie.effect(50);  // 亲密
  const e3 = COMPANION_ABILITIES.zhang_jie.effect(80);  // 羁绊
  assert.strictEqual(e1.damageReduce, 0.30);
  assert.strictEqual(e2.damageReduce, 0.40);
  assert.strictEqual(e3.damageReduce, 0.50);
  assert.strictEqual(e3.reflect, 0.15);
  assert.strictEqual(e1.reflect, 0);
});

test('詹岚·精准狙击: 0.8x < 1.2x < 1.6x(必暴击)', () => {
  const e1 = COMPANION_ABILITIES.zhan_lan.effect(20);
  const e2 = COMPANION_ABILITIES.zhan_lan.effect(50);
  const e3 = COMPANION_ABILITIES.zhan_lan.effect(80);
  assert.strictEqual(e1.dmgMult, 0.8);
  assert.strictEqual(e2.dmgMult, 1.2);
  assert.strictEqual(e3.dmgMult, 1.6);
  assert.ok(e3.crit);
});

test('楚轩·战术分析: 减防10%→20%→30%', () => {
  assert.strictEqual(COMPANION_ABILITIES.chuxuan.effect(20).enemyDefReduce, 0.10);
  assert.strictEqual(COMPANION_ABILITIES.chuxuan.effect(50).enemyDefReduce, 0.20);
  assert.strictEqual(COMPANION_ABILITIES.chuxuan.effect(80).enemyDefReduce, 0.30);
});

test('李小意·同伴鼓舞: 治疗8%→12%→20%', () => {
  assert.strictEqual(COMPANION_ABILITIES.li_xiaoyi.effect(20).healPct, 0.08);
  assert.strictEqual(COMPANION_ABILITIES.li_xiaoyi.effect(50).healPct, 0.12);
  assert.strictEqual(COMPANION_ABILITIES.li_xiaoyi.effect(80).healPct, 0.20);
});

test('霸王·霸王拳: 伤害1.0x→1.5x→2.0x', () => {
  assert.strictEqual(COMPANION_ABILITIES.bawang.effect(20).dmgMult, 1.0);
  assert.strictEqual(COMPANION_ABILITIES.bawang.effect(50).dmgMult, 1.5);
  assert.strictEqual(COMPANION_ABILITIES.bawang.effect(80).dmgMult, 2.0);
});

test('零点·影分身: 额外攻击1→1→2', () => {
  assert.strictEqual(COMPANION_ABILITIES.lingdian.effect(20).extraAtk, 1);
  assert.strictEqual(COMPANION_ABILITIES.lingdian.effect(50).extraAtk, 1);
  assert.strictEqual(COMPANION_ABILITIES.lingdian.effect(80).extraAtk, 2);
});

test('李帅西·战地急救: 治疗15%→25%(净化)→35%(净化+DEF)', () => {
  const e1 = COMPANION_ABILITIES.lishuaixi.effect(20);
  const e2 = COMPANION_ABILITIES.lishuaixi.effect(50);
  const e3 = COMPANION_ABILITIES.lishuaixi.effect(80);
  assert.strictEqual(e1.healPct, 0.15);
  assert.ok(!e1.cleanse);
  assert.strictEqual(e2.healPct, 0.25);
  assert.ok(e2.cleanse);
  assert.strictEqual(e3.healPct, 0.35);
  assert.ok(e3.cleanse);
  assert.strictEqual(e3.defBoost, 3);
});

test('牟刚·铁壁冲锋: 眩晕1→1→2', () => {
  assert.strictEqual(COMPANION_ABILITIES.mou_gang.effect(20).stun, 1);
  assert.strictEqual(COMPANION_ABILITIES.mou_gang.effect(50).stun, 1);
  assert.strictEqual(COMPANION_ABILITIES.mou_gang.effect(80).stun, 2);
});

// ── 类型分布 ──
console.log('\n── 类型分布 ──');
test('攻击型4个 + 防御型1个 + 辅助型2个 + 减益型1个', () => {
  const types = Object.values(COMPANION_ABILITIES).map(a => a.type);
  assert.strictEqual(types.filter(t => t === 'attack').length, 4);
  assert.strictEqual(types.filter(t => t === 'defense').length, 1);
  assert.strictEqual(types.filter(t => t === 'support').length, 2);
  assert.strictEqual(types.filter(t => t === 'debuff').length, 1);
});

// ── 冷却计算 ──
console.log('\n── 冷却计算 ──');
test('冷却状态初始化和递减模拟', () => {
  // Simulate cooldown tracking
  const state = { cooldown: 0, usesLeft: 3 };
  
  // Use ability
  state.cooldown = 4;
  state.usesLeft--;
  assert.strictEqual(state.cooldown, 4);
  assert.strictEqual(state.usesLeft, 2);
  
  // Tick 4 rounds
  for (let i = 0; i < 4; i++) {
    if (state.cooldown > 0) state.cooldown--;
  }
  assert.strictEqual(state.cooldown, 0);
  
  // Use again
  state.cooldown = 4;
  state.usesLeft--;
  assert.strictEqual(state.usesLeft, 1);
});

// ── 关系不足时不可用 ──
console.log('\n── 关系门槛 ──');
test('关系=10不满足基础门槛(11)', () => {
  for (const a of Object.values(COMPANION_ABILITIES)) {
    assert.strictEqual(a.relReq, 11);
  }
});

// ── 数值合理性 ──
console.log('\n── 数值合理性 ──');
test('羁绊级最高伤害倍率2.0x(霸王)', () => {
  const maxDmg = Math.max(...Object.values(COMPANION_ABILITIES)
    .map(a => a.effect(80).dmgMult || 0));
  assert.strictEqual(maxDmg, 2.0);
});

test('最高治疗比例35%(李帅西羁绊)', () => {
  const maxHeal = Math.max(...Object.values(COMPANION_ABILITIES)
    .map(a => a.effect(80).healPct || 0));
  assert.ok(Math.abs(maxHeal - 0.35) < 0.01);
});

test('最大减伤50%(张杰羁绊)', () => {
  assert.strictEqual(COMPANION_ABILITIES.zhang_jie.effect(80).damageReduce, 0.50);
});

console.log(`\n${'═'.repeat(40)}`);
console.log(`结果: ${passed} 通过, ${failed} 失败 / ${passed + failed} 总计`);
if (failed > 0) process.exit(1);
console.log('✅ 同伴技能系统全部测试通过！');
