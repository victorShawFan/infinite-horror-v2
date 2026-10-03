// ═══ 战场环境数值实战同步验证 ═══
// 用固定随机数验证环境效果确实改变了HP/法力/属性值

import { processEnvironmentEffect, BATTLE_ENVIRONMENTS } from './src/core/BattleEnvironment.js';

let pass = 0;
let fail = 0;

function assert(cond, msg) {
  if (cond) { pass++; }
  else { fail++; console.log(`  ❌ ${msg}`); }
}

console.log('═══ 战场环境数值实战同步验证 ═══\n');

// 测试1：Ch1 病毒伤害确实减少playerHpDelta
console.log('── 测试1: Ch1 病毒DoT数值同步 ──');
{
  // 运行多次，确保至少有一次触发
  let triggered = false;
  for (let i = 0; i < 200; i++) {
    const r = processEnvironmentEffect(1, { hp: 50, maxHp: 100, mana: 0, maxMana: 0 }, { hp: 80 }, 1);
    if (r.playerHpDelta < 0) {
      triggered = true;
      assert(r.playerHpDelta === -3, `Ch1 病毒伤害应为-3, got ${r.playerHpDelta}`);
      assert(r.logs.length > 0, 'Ch1 应有日志');
      break;
    }
  }
  assert(triggered, 'Ch1 病毒DoT应在200次内至少触发一次(chance=0.15)');
}

// 测试2：Ch2 酸液同时伤害双方
console.log('── 测试2: Ch2 酸液双方伤害 ──');
{
  let triggered = false;
  for (let i = 0; i < 200; i++) {
    const r = processEnvironmentEffect(2, { hp: 50, maxHp: 100, mana: 0, maxMana: 0 }, { hp: 80 }, 1);
    if (r.playerHpDelta < 0 || r.enemyHpDelta < 0) {
      triggered = true;
      assert(r.playerHpDelta <= -5, `Ch2 酸液对玩家伤害应≤-5, got ${r.playerHpDelta}`);
      assert(r.enemyHpDelta <= -5, `Ch2 酸液对敌人伤害应≤-5, got ${r.enemyHpDelta}`);
      break;
    }
  }
  assert(triggered, 'Ch2 酸液应在200次内至少触发一次');
}

// 测试3：Ch3 恐惧降攻击力
console.log('── 测试3: Ch3 恐惧降攻击力 ──');
{
  let triggered = false;
  for (let i = 0; i < 200; i++) {
    const r = processEnvironmentEffect(3, { hp: 50, maxHp: 100, mana: 0, maxMana: 0 }, { hp: 80 }, 1);
    if (r.playerAtkMod < 0) {
      triggered = true;
      assert(r.playerAtkMod === -2, `Ch3 恐惧atkMod应为-2, got ${r.playerAtkMod}`);
      break;
    }
  }
  assert(triggered, 'Ch3 恐惧效果应在200次内触发');
}

// 测试4：Ch5 命运之眼暴击加成
console.log('── 测试4: Ch5 命运之眼暴击 ──');
{
  let triggered = false;
  for (let i = 0; i < 300; i++) {
    const r = processEnvironmentEffect(5, { hp: 50, maxHp: 100, mana: 0, maxMana: 0 }, { hp: 80 }, 1);
    if (r.playerCritMod > 0) {
      triggered = true;
      assert(r.playerCritMod === 10, `Ch5 critMod应为10, got ${r.playerCritMod}`);
      break;
    }
  }
  assert(triggered, 'Ch5 命运之眼应在300次内触发(chance=0.08)');
}

// 测试5：Ch8 自然治愈恢复HP
console.log('── 测试5: Ch8 自然治愈HP回复 ──');
{
  let triggered = false;
  for (let i = 0; i < 200; i++) {
    const r = processEnvironmentEffect(8, { hp: 50, maxHp: 100, mana: 0, maxMana: 0 }, { hp: 80 }, 1);
    if (r.playerHpDelta > 0) {
      triggered = true;
      assert(r.playerHpDelta === 5, `Ch8 治愈量应为5, got ${r.playerHpDelta}`);
      assert(r.enemyHpDelta > 0, 'Ch8 敌人也应被治愈');
      break;
    }
  }
  assert(triggered, 'Ch8 自然治愈应在200次内触发');
}

// 测试6：Ch9 震颤眩晕
console.log('── 测试6: Ch9 震颤眩晕跳过回合 ──');
{
  let triggered = false;
  for (let i = 0; i < 500; i++) {
    const r = processEnvironmentEffect(9, { hp: 50, maxHp: 100, mana: 0, maxMana: 0 }, { hp: 80 }, 1);
    if (r.skipPlayerTurn) {
      triggered = true;
      assert(r.skipPlayerTurn === true, 'Ch9 skipPlayerTurn应为true');
      break;
    }
  }
  assert(triggered, 'Ch9 震颤眩晕应在500次内触发(0.08*0.15)');
}

// 测试7：Ch11 精神力场恢复法力
console.log('── 测试7: Ch11 精神力场法力恢复 ──');
{
  let triggered = false;
  for (let i = 0; i < 200; i++) {
    const r = processEnvironmentEffect(11, { hp: 50, maxHp: 100, mana: 5, maxMana: 20 }, { hp: 80 }, 1);
    if (r.manaDelta > 0) {
      triggered = true;
      assert(r.manaDelta === 3, `Ch11 mana恢复应为3, got ${r.manaDelta}`);
      break;
    }
  }
  assert(triggered, 'Ch11 精神力场应在200次内触发');
}

// 测试8：Ch12 主神意志随机buff/debuff
console.log('── 测试8: Ch12 主神意志 ──');
{
  let buffTriggered = false;
  let debuffTriggered = false;
  for (let i = 0; i < 300; i++) {
    const r = processEnvironmentEffect(12, { hp: 50, maxHp: 100, mana: 0, maxMana: 0 }, { hp: 80 }, 1);
    if (r.playerAtkMod > 0) buffTriggered = true;
    if (r.playerAtkMod < 0 || r.enemyAtkMod > 0) debuffTriggered = true;
    if (buffTriggered && debuffTriggered) break;
  }
  assert(buffTriggered, 'Ch12 主神祝福应在300次内触发');
  assert(debuffTriggered, 'Ch12 主神诅咒应在300次内触发');
}

// 测试9：保底1HP — 病毒不会杀死低HP玩家
console.log('── 测试9: 保底1HP验证 ──');
{
  let triggered = false;
  for (let i = 0; i < 200; i++) {
    const r = processEnvironmentEffect(1, { hp: 2, maxHp: 100, mana: 0, maxMana: 0 }, { hp: 80 }, 1);
    if (r.playerHpDelta < 0) {
      triggered = true;
      // hp=2, damage=3, 但保底后只扣1（保留1HP）
      assert(r.playerHpDelta >= -1, `保底1HP: playerHpDelta应≥-1, got ${r.playerHpDelta}`);
      break;
    }
  }
  assert(triggered, '保底1HP测试应在200次内触发');
}

// 测试10：所有章节效果返回正确字段类型
console.log('── 测试10: 字段类型完整性 ──');
for (let ch = 1; ch <= 12; ch++) {
  const r = processEnvironmentEffect(ch, { hp: 50, maxHp: 100, mana: 10, maxMana: 20 }, { hp: 80 }, 1);
  assert(typeof r.playerHpDelta === 'number', `Ch${ch} playerHpDelta type`);
  assert(typeof r.enemyHpDelta === 'number', `Ch${ch} enemyHpDelta type`);
  assert(typeof r.manaDelta === 'number', `Ch${ch} manaDelta type`);
  assert(typeof r.playerAtkMod === 'number', `Ch${ch} playerAtkMod type`);
  assert(typeof r.playerDefMod === 'number', `Ch${ch} playerDefMod type`);
  assert(typeof r.enemyAtkMod === 'number', `Ch${ch} enemyAtkMod type`);
  assert(typeof r.enemyDefMod === 'number', `Ch${ch} enemyDefMod type`);
  assert(typeof r.playerCritMod === 'number', `Ch${ch} playerCritMod type`);
  assert(typeof r.skipPlayerTurn === 'boolean', `Ch${ch} skipPlayerTurn type`);
  assert(Array.isArray(r.logs), `Ch${ch} logs is array`);
}

console.log(`\nPassed: ${pass}  Failed: ${fail}`);
if (fail > 0) {
  console.log('\n═══ ❌ 环境数值同步测试失败 ═══');
  process.exit(1);
} else {
  console.log('\n═══ ✅ 环境数值实战同步验证全部通过 ═══');
}
