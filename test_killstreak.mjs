import { killStreak, STREAK_TIERS } from './src/core/KillStreak.js';

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; } else { fail++; console.error(`  ❌ ${msg}`); }
}

console.log('══════════════════════════════════════════');
console.log(' 连杀系统测试');
console.log('══════════════════════════════════════════');

// ── 基础 ──
{
  killStreak.current = 0; killStreak.best = 0; killStreak.totalKills = 0;
  assert(killStreak.getCurrentTier() === null, '0杀无等级');
  assert(killStreak.getBonus().atkPct === 0, '0杀无加成');
}

// ── 连杀阶梯 ──
{
  killStreak.current = 0;
  for (let i = 0; i < 3; i++) killStreak.recordKill();
  assert(killStreak.current === 3, '3连杀');
  const t = killStreak.getCurrentTier();
  assert(t.name === '势头正盛', '3杀应是势头正盛');
  assert(killStreak.getBonus().atkPct === 5, 'ATK+5%');
}

{
  for (let i = 0; i < 2; i++) killStreak.recordKill();
  assert(killStreak.current === 5, '5连杀');
  assert(killStreak.getCurrentTier().name === '杀意凛然', '5杀应是杀意凛然');
  assert(killStreak.getBonus().expPct === 15, 'EXP+15%');
}

{
  for (let i = 0; i < 3; i++) killStreak.recordKill();
  assert(killStreak.current === 8, '8连杀');
  assert(killStreak.getCurrentTier().name === '势不可挡', '8杀应是势不可挡');
  assert(killStreak.getBonus().crt === 5, 'CRT+5');
}

{
  for (let i = 0; i < 4; i++) killStreak.recordKill();
  assert(killStreak.current === 12, '12连杀');
  assert(killStreak.getCurrentTier().name === '神挡杀神', '12杀应是神挡杀神');
  assert(killStreak.getBonus().healPct === 2, '回血2%');
}

{
  for (let i = 0; i < 8; i++) killStreak.recordKill();
  assert(killStreak.current === 20, '20连杀');
  assert(killStreak.getCurrentTier().name === '一骑当千', '20杀应是一骑当千');
  assert(killStreak.getBonus().atkPct === 30, 'ATK+30%');
}

// ── 死亡重置 ──
{
  killStreak.recordDeath();
  assert(killStreak.current === 0, '死亡后重置为0');
  assert(killStreak.getCurrentTier() === null, '死亡后无等级');
  assert(killStreak.best === 20, '最佳记录保留');
}

// ── 显示 ──
{
  killStreak.current = 0;
  assert(killStreak.getDisplay() === null, '0杀无显示');
  
  for (let i = 0; i < 5; i++) killStreak.recordKill();
  const d = killStreak.getDisplay();
  assert(d.kills === 5, '显示5杀');
  assert(d.icon === '⚡', '显示图标');
  assert(d.color, '显示颜色');
}

// ── 序列化 ──
{
  const json = killStreak.toJSON();
  assert(json.best === 20, '序列化最佳记录');
  assert(json.totalKills > 0, '序列化总击杀');
  
  killStreak.current = 0; killStreak.best = 0; killStreak.totalKills = 0;
  killStreak.fromJSON(json);
  assert(killStreak.best === 20, '反序列化最佳记录');
}

// ── STREAK_TIERS ──
{
  assert(STREAK_TIERS.length === 5, '应有5个连杀等级');
  for (let i = 1; i < STREAK_TIERS.length; i++) {
    assert(STREAK_TIERS[i].kills > STREAK_TIERS[i-1].kills, '等级杀数应递增');
  }
}

console.log('══════════════════════════════════════════');
console.log(`${pass + fail} 项测试: ${pass} 通过, ${fail} 失败`);
if (fail === 0) console.log('✅ 连杀系统全部通过');
else { console.log('❌ 有测试失败'); process.exit(1); }
