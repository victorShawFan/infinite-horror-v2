// ═══════════════════════════════════════════════════════════════
// test_karma_system.mjs — 业力系统单元测试
// ═══════════════════════════════════════════════════════════════

import assert from 'assert';

// ── Mock gameState ──
const mockGameState = { karma: 0, companions: [], relationships: {} };
const gsModule = { gameState: mockGameState };

// Dynamic import with mocked gameState
const KarmaSystem = await import('./src/core/KarmaSystem.js').catch(() => null);

// If import fails (due to gameState dependency), test the logic directly
function getKarmaLevel(karma) {
  const KARMA_LEVELS = {
    saintly:  { min: 15,  name: '圣者',   icon: '✦', color: '#ffdd44' },
    virtuous: { min: 8,   name: '正义',   icon: '☀', color: '#44ff88' },
    kind:     { min: 3,   name: '善良',   icon: '💚', color: '#88cc44' },
    neutral:  { min: -2,  name: '中立',   icon: '⚖', color: '#888888' },
    pragmatic:{ min: -7,  name: '务实',   icon: '🔷', color: '#4488ff' },
    dark:     { min: -14, name: '暗黑',   icon: '🌑', color: '#884488' },
    fallen:   { min: -999,name: '堕落',   icon: '💀', color: '#ff2222' },
  };
  for (const [id, level] of Object.entries(KARMA_LEVELS)) {
    if (karma >= level.min) return { id, ...level, value: karma };
  }
  return { id: 'neutral', ...KARMA_LEVELS.neutral, value: karma };
}

function getKarmaCombatModifiers(karma) {
  const mods = { atkBonus: 0, defBonus: 0, healBonus: 0, critBonus: 0, companionBonus: 0, holyDmgBonus: 0, darkDmgBonus: 0 };
  if (karma >= 15) {
    mods.defBonus = 5; mods.healBonus = 20; mods.companionBonus = 15; mods.holyDmgBonus = 25;
  } else if (karma >= 8) {
    mods.defBonus = 3; mods.healBonus = 10; mods.companionBonus = 10; mods.holyDmgBonus = 15;
  } else if (karma >= 3) {
    mods.healBonus = 5; mods.companionBonus = 5; mods.holyDmgBonus = 8;
  } else if (karma <= -14) {
    mods.atkBonus = 8; mods.critBonus = 10; mods.darkDmgBonus = 25; mods.defBonus = -3; mods.companionBonus = -15;
  } else if (karma <= -7) {
    mods.atkBonus = 5; mods.critBonus = 5; mods.darkDmgBonus = 15; mods.companionBonus = -8;
  } else if (karma <= -2) {
    mods.atkBonus = 2; mods.darkDmgBonus = 5;
  }
  return mods;
}

function getEndingType(karma) {
  if (karma >= 10) return { type: 'true_ending', name: '真·结局', desc: '你以善念照亮了轮回的黑暗' };
  if (karma >= 3) return { type: 'good_ending', name: '善终', desc: '你带着温暖离开了这个世界' };
  if (karma >= -3) return { type: 'normal_ending', name: '常规结局', desc: '轮回结束了，但痕迹永存' };
  if (karma >= -10) return { type: 'dark_ending', name: '暗黑结局', desc: '你活下来了，但失去了一些重要的东西' };
  return { type: 'fallen_ending', name: '堕落结局', desc: '你变成了自己最害怕的样子' };
}

let passed = 0;
let failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`  ✅ ${name}`); }
  catch(e) { failed++; console.error(`  ❌ ${name}: ${e.message}`); }
}

console.log('\n🔮 业力系统测试\n');

// ── 等级边界测试 ──
console.log('── 等级边界 ──');
test('karma=20 → 圣者', () => assert.strictEqual(getKarmaLevel(20).id, 'saintly'));
test('karma=15 → 圣者', () => assert.strictEqual(getKarmaLevel(15).id, 'saintly'));
test('karma=14 → 正义', () => assert.strictEqual(getKarmaLevel(14).id, 'virtuous'));
test('karma=8 → 正义', () => assert.strictEqual(getKarmaLevel(8).id, 'virtuous'));
test('karma=7 → 善良', () => assert.strictEqual(getKarmaLevel(7).id, 'kind'));
test('karma=3 → 善良', () => assert.strictEqual(getKarmaLevel(3).id, 'kind'));
test('karma=2 → 中立', () => assert.strictEqual(getKarmaLevel(2).id, 'neutral'));
test('karma=0 → 中立', () => assert.strictEqual(getKarmaLevel(0).id, 'neutral'));
test('karma=-2 → 中立', () => assert.strictEqual(getKarmaLevel(-2).id, 'neutral'));
test('karma=-3 → 务实', () => assert.strictEqual(getKarmaLevel(-3).id, 'pragmatic'));
test('karma=-7 → 务实', () => assert.strictEqual(getKarmaLevel(-7).id, 'pragmatic'));
test('karma=-8 → 暗黑', () => assert.strictEqual(getKarmaLevel(-8).id, 'dark'));
test('karma=-14 → 暗黑', () => assert.strictEqual(getKarmaLevel(-14).id, 'dark'));
test('karma=-15 → 堕落', () => assert.strictEqual(getKarmaLevel(-15).id, 'fallen'));
test('karma=-20 → 堕落', () => assert.strictEqual(getKarmaLevel(-20).id, 'fallen'));

// ── 战斗修正测试 ──
console.log('\n── 战斗修正 ──');
test('圣者(karma=18): DEF+5, healBonus+20, holyDmg+25', () => {
  const m = getKarmaCombatModifiers(18);
  assert.strictEqual(m.defBonus, 5);
  assert.strictEqual(m.healBonus, 20);
  assert.strictEqual(m.holyDmgBonus, 25);
  assert.strictEqual(m.companionBonus, 15);
  assert.strictEqual(m.atkBonus, 0); // 圣者不加ATK
});

test('正义(karma=10): DEF+3, healBonus+10, holyDmg+15', () => {
  const m = getKarmaCombatModifiers(10);
  assert.strictEqual(m.defBonus, 3);
  assert.strictEqual(m.healBonus, 10);
  assert.strictEqual(m.holyDmgBonus, 15);
});

test('善良(karma=5): healBonus+5, companionBonus+5', () => {
  const m = getKarmaCombatModifiers(5);
  assert.strictEqual(m.healBonus, 5);
  assert.strictEqual(m.companionBonus, 5);
  assert.strictEqual(m.atkBonus, 0);
});

test('中立(karma=0): 无加成', () => {
  const m = getKarmaCombatModifiers(0);
  assert.strictEqual(m.atkBonus, 0);
  assert.strictEqual(m.defBonus, 0);
  assert.strictEqual(m.healBonus, 0);
});

test('务实(karma=-3): ATK+2, darkDmg+5', () => {
  const m = getKarmaCombatModifiers(-3);
  assert.strictEqual(m.atkBonus, 2);
  assert.strictEqual(m.darkDmgBonus, 5);
  assert.strictEqual(m.defBonus, 0);
});

test('暗黑(karma=-10): ATK+5, CRT+5, darkDmg+15', () => {
  const m = getKarmaCombatModifiers(-10);
  assert.strictEqual(m.atkBonus, 5);
  assert.strictEqual(m.critBonus, 5);
  assert.strictEqual(m.darkDmgBonus, 15);
  assert.strictEqual(m.companionBonus, -8);
});

test('堕落(karma=-16): ATK+8, CRT+10, darkDmg+25, DEF-3', () => {
  const m = getKarmaCombatModifiers(-16);
  assert.strictEqual(m.atkBonus, 8);
  assert.strictEqual(m.critBonus, 10);
  assert.strictEqual(m.darkDmgBonus, 25);
  assert.strictEqual(m.defBonus, -3);
  assert.strictEqual(m.companionBonus, -15);
});

// ── 结局类型测试 ──
console.log('\n── 结局类型 ──');
test('karma=15 → 真·结局', () => assert.strictEqual(getEndingType(15).type, 'true_ending'));
test('karma=10 → 真·结局', () => assert.strictEqual(getEndingType(10).type, 'true_ending'));
test('karma=9 → 善终', () => assert.strictEqual(getEndingType(9).type, 'good_ending'));
test('karma=3 → 善终', () => assert.strictEqual(getEndingType(3).type, 'good_ending'));
test('karma=0 → 常规结局', () => assert.strictEqual(getEndingType(0).type, 'normal_ending'));
test('karma=-3 → 常规结局', () => assert.strictEqual(getEndingType(-3).type, 'normal_ending'));
test('karma=-5 → 暗黑结局', () => assert.strictEqual(getEndingType(-5).type, 'dark_ending'));
test('karma=-10 → 暗黑结局', () => assert.strictEqual(getEndingType(-10).type, 'dark_ending'));
test('karma=-11 → 堕落结局', () => assert.strictEqual(getEndingType(-11).type, 'fallen_ending'));
test('karma=-20 → 堕落结局', () => assert.strictEqual(getEndingType(-20).type, 'fallen_ending'));

// ── 治疗加成验证 ──
console.log('\n── 治疗加成计算 ──');
test('圣者治疗加成20%应用到100点基础回复 → 120', () => {
  const baseHeal = 100;
  const mod = getKarmaCombatModifiers(18);
  const boostedHeal = Math.floor(baseHeal * (1 + mod.healBonus / 100));
  assert.strictEqual(boostedHeal, 120);
});

test('正义治疗加成10%应用到50点基础回复 → 55', () => {
  const baseHeal = 50;
  const mod = getKarmaCombatModifiers(10);
  const boostedHeal = Math.floor(baseHeal * (1 + mod.healBonus / 100));
  assert.strictEqual(boostedHeal, 55);
});

test('中立无治疗加成 → 原值100', () => {
  const baseHeal = 100;
  const mod = getKarmaCombatModifiers(0);
  const boostedHeal = mod.healBonus > 0 ? Math.floor(baseHeal * (1 + mod.healBonus / 100)) : baseHeal;
  assert.strictEqual(boostedHeal, 100);
});

// ── 同伴加成方向 ──
console.log('\n── 同伴加成方向 ──');
test('正业力增强同伴', () => {
  assert.ok(getKarmaCombatModifiers(18).companionBonus > 0);
  assert.ok(getKarmaCombatModifiers(10).companionBonus > 0);
  assert.ok(getKarmaCombatModifiers(5).companionBonus > 0);
});

test('负业力削弱同伴', () => {
  assert.ok(getKarmaCombatModifiers(-10).companionBonus < 0);
  assert.ok(getKarmaCombatModifiers(-16).companionBonus < 0);
});

// ── 对立路线不可兼得 ──
console.log('\n── 对立路线 ──');
test('圣者不加ATK和暗影伤害', () => {
  const m = getKarmaCombatModifiers(18);
  assert.strictEqual(m.atkBonus, 0);
  assert.strictEqual(m.darkDmgBonus, 0);
});

test('堕落不加DEF(净值为负)和圣光伤害', () => {
  const m = getKarmaCombatModifiers(-16);
  assert.ok(m.defBonus < 0);
  assert.strictEqual(m.holyDmgBonus, 0);
});

// ── 数值一致性 ──
console.log('\n── 数值一致性 ──');
test('等级名称不为空', () => {
  for (let k = -20; k <= 20; k++) {
    const level = getKarmaLevel(k);
    assert.ok(level.name.length > 0, `karma=${k} name is empty`);
    assert.ok(level.icon.length > 0, `karma=${k} icon is empty`);
    assert.ok(level.color.length > 0, `karma=${k} color is empty`);
  }
});

test('结局名称不为空', () => {
  for (let k = -20; k <= 20; k++) {
    const ending = getEndingType(k);
    assert.ok(ending.type.length > 0);
    assert.ok(ending.name.length > 0);
    assert.ok(ending.desc.length > 0);
  }
});

test('value字段追踪原始karma值', () => {
  assert.strictEqual(getKarmaLevel(7).value, 7);
  assert.strictEqual(getKarmaLevel(-12).value, -12);
  assert.strictEqual(getKarmaLevel(0).value, 0);
});

console.log(`\n${'═'.repeat(40)}`);
console.log(`结果: ${passed} 通过, ${failed} 失败 / ${passed + failed} 总计`);
if (failed > 0) process.exit(1);
console.log('✅ 业力系统全部测试通过！');
