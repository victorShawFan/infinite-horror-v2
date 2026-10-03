// ═══ 战场环境系统验证 ═══
import { BATTLE_ENVIRONMENTS, getBattleEnvironment, processEnvironmentEffect, formatEnvironmentHTML } from './src/core/BattleEnvironment.js';

let pass = 0;
let fail = 0;

function assert(cond, msg) {
  if (cond) { pass++; } 
  else { fail++; console.log(`  ❌ ${msg}`); }
}

// 1. 所有12章都有环境定义
console.log('═══ 战场环境系统验证 ═══\n');
for (let ch = 1; ch <= 12; ch++) {
  const env = getBattleEnvironment(ch);
  assert(env !== undefined, `Ch${ch}: 环境未定义`);
  assert(env.name, `Ch${ch}: 缺少名称`);
  assert(env.desc, `Ch${ch}: 缺少描述`);
  assert(env.bgGradient, `Ch${ch}: 缺少背景渐变`);
  assert(env.effects && env.effects.length > 0, `Ch${ch}: 缺少效果`);
  assert(env.particleChar, `Ch${ch}: 缺少粒子字符`);
  assert(env.particleColor, `Ch${ch}: 缺少粒子颜色`);
  
  // 验证效果结构
  for (const eff of env.effects) {
    assert(eff.type, `Ch${ch}: 效果缺少type`);
    assert(eff.chance > 0 && eff.chance < 1, `Ch${ch}: 效果chance不合理`);
    assert(eff.name, `Ch${ch}: 效果缺少name`);
    assert(eff.icon, `Ch${ch}: 效果缺少icon`);
    assert(eff.desc, `Ch${ch}: 效果缺少desc`);
  }
}

// 2. processEnvironmentEffect 不会崩溃
const mockPlayer = { hp: 100, maxHp: 100, mana: 10, maxMana: 20 };
const mockEnemy = { hp: 80 };
for (let ch = 1; ch <= 12; ch++) {
  for (let round = 1; round <= 10; round++) {
    const result = processEnvironmentEffect(ch, { ...mockPlayer }, { ...mockEnemy }, round);
    // 新API返回结构化对象，logs在result.logs中
    assert(typeof result === 'object' && result !== null, `Ch${ch} R${round}: processEnvironmentEffect should return object`);
    assert(Array.isArray(result.logs), `Ch${ch} R${round}: result.logs should be array`);
    assert(typeof result.playerHpDelta === 'number', `Ch${ch} R${round}: playerHpDelta should be number`);
    assert(typeof result.enemyHpDelta === 'number', `Ch${ch} R${round}: enemyHpDelta should be number`);
    assert(typeof result.playerAtkMod === 'number', `Ch${ch} R${round}: playerAtkMod should be number`);
    assert(typeof result.enemyAtkMod === 'number', `Ch${ch} R${round}: enemyAtkMod should be number`);
  }
}

// 3. formatEnvironmentHTML 返回非空字符串
for (let ch = 1; ch <= 12; ch++) {
  const html = formatEnvironmentHTML(ch);
  assert(typeof html === 'string' && html.length > 0, `Ch${ch}: formatEnvironmentHTML应返回非空字符串`);
}

console.log(`\nPassed: ${pass}  Failed: ${fail}`);
if (fail > 0) {
  console.log('\n═══ ❌ 测试失败 ═══');
  process.exit(1);
} else {
  console.log('\n═══ ✅ 战场环境系统验证全部通过 ═══');
}
