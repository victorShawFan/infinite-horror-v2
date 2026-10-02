// ═══════════════════════════════════════════════════════════════
// 新系统测试：装备强化 + 天赋树 + 敌人能力
// ═══════════════════════════════════════════════════════════════

import { enhanceEquipment, socketGem, unsocketGem, getEquipmentTotalStats, 
         getActiveSetBonuses, getEquipmentDisplayName, getEnhanceCost,
         GEM_TYPES, ENHANCE_TABLE, recalcEnhanceBonuses } from './src/core/EquipmentSystem.js';
import { initTalentState, allocateTalentPoint, resetTalents, getTalentEffects,
         getTalentPathInfo, TALENT_PATHS } from './src/core/TalentTree.js';
import { getBossPhases, getCurrentPhase, applyPhaseModifiers, shouldUseBossSpecial,
         calcBossSpecialDamage, processEnemyTraits, rollEliteAffixes, applyEliteAffixes,
         ENEMY_TRAITS, BOSS_PHASES, ELITE_AFFIXES } from './src/core/EnemyAbilitySystem.js';

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; }
  else { fail++; console.error(`❌ ${msg}`); }
}

console.log('══════════════════════════════════════════');
console.log(' 装备强化系统');
console.log('══════════════════════════════════════════');

// 基础强化
{
  const weapon = { name: '铁剑', atk: 10, def: 0, enhanceLevel: 0 };
  const player = { rewardPoints: 5000 };
  
  // +1 强化（100%成功率）
  const r1 = enhanceEquipment(weapon, player);
  assert(r1.success, '强化+1应该成功');
  assert(weapon.enhanceLevel === 1, '强化等级应为1');
  assert(weapon.enhanceBonuses.atk >= 1, '应有ATK加成');
  
  // 连续强化到+3
  enhanceEquipment(weapon, player);
  enhanceEquipment(weapon, player);
  assert(weapon.enhanceLevel >= 1, '多次强化等级应增加');
}

// 满级不能再强化
{
  const weapon = { name: '满级剑', atk: 20, enhanceLevel: 10 };
  const player = { rewardPoints: 99999 };
  const r = enhanceEquipment(weapon, player);
  assert(!r.success, '+10不能再强化');
  assert(r.reason.includes('最高'), '应提示已达最高');
}

// 费用不足
{
  const weapon = { name: '铁剑', atk: 10, enhanceLevel: 0 };
  const player = { rewardPoints: 0 };
  const r = enhanceEquipment(weapon, player);
  assert(!r.success, '费用不足应失败');
}

// 宝石镶嵌
{
  const weapon = { name: '测试剑', atk: 10, maxGemSlots: 2 };
  const r1 = socketGem(weapon, 'ruby');
  assert(r1.success, '第一颗宝石应成功');
  assert(weapon.gemSlots.length === 1, '应有1个宝石');
  
  const r2 = socketGem(weapon, 'sapphire');
  assert(r2.success, '第二颗宝石应成功');
  
  const r3 = socketGem(weapon, 'diamond');
  assert(!r3.success, '第三颗应失败（槽满）');
  
  // 移除宝石
  const r4 = unsocketGem(weapon, 0);
  assert(r4.success, '移除宝石应成功');
  assert(r4.gem.id === 'ruby', '应返回红宝石');
  assert(weapon.gemSlots.length === 1, '应剩1个宝石');
}

// 装备总属性
{
  const weapon = { name: '强化剑', atk: 15, crt: 5, enhanceLevel: 3, enhanceBonuses: {}, maxGemSlots: 2 };
  recalcEnhanceBonuses(weapon);
  socketGem(weapon, 'ruby');
  socketGem(weapon, 'diamond');
  const stats = getEquipmentTotalStats(weapon);
  assert(stats.atk > 15, '总ATK应大于基础');
  assert(stats.crt > 5, '总CRT应大于基础（有钻石+强化）');
}

// 套装效果
{
  const player = {
    weapon: { setId: 'weapon_lord_blade' },
    armor: { setId: 'armor_lord_guard' },
    accessory: null,
  };
  const bonuses = getActiveSetBonuses(player);
  assert(bonuses.atk === 8, '2件主神套装应给ATK+8');
  assert(bonuses.crt === 5, '2件主神套装应给CRT+5');
}

// 显示名
{
  const weapon = { name: '圣剑', enhanceLevel: 5, gemSlots: [{ id: 'ruby', stat: 'atk', value: 3 }] };
  const name = getEquipmentDisplayName(weapon);
  assert(name.includes('+5'), '应显示+5');
  assert(name.includes('💎'), '应显示宝石');
}

// 费用预览
{
  const weapon = { enhanceLevel: 4 };
  const preview = getEnhanceCost(weapon);
  assert(preview.cost === 400, '+5费用应为400');
  assert(preview.successRate === 0.75, '+5成功率应为75%');
}

console.log('══════════════════════════════════════════');
console.log(' 天赋树系统');
console.log('══════════════════════════════════════════');

// 初始化
{
  const ts = initTalentState();
  assert(ts.points === 0, '初始0天赋点');
  assert(ts.allocated.combat === 0, '战斗路线初始0');
}

// 分配天赋
{
  const ts = initTalentState();
  ts.points = 5;
  
  const r1 = allocateTalentPoint(ts, 'combat');
  assert(r1.success, '分配应成功');
  assert(r1.tier.name === '利刃', '第一个应是利刃');
  assert(ts.allocated.combat === 1, '战斗路线应为1');
  assert(ts.points === 4, '剩余4点');
  
  allocateTalentPoint(ts, 'combat');
  allocateTalentPoint(ts, 'survival');
  allocateTalentPoint(ts, 'technique');
  assert(ts.allocated.combat === 2, '战斗2');
  assert(ts.allocated.survival === 1, '生存1');
  assert(ts.allocated.technique === 1, '技巧1');
  assert(ts.points === 1, '剩余1点');
}

// 无点不能分配
{
  const ts = initTalentState();
  ts.points = 0;
  const r = allocateTalentPoint(ts, 'combat');
  assert(!r.success, '0点不能分配');
}

// 满10级不能继续
{
  const ts = initTalentState();
  ts.points = 20;
  ts.allocated.combat = 10;
  const r = allocateTalentPoint(ts, 'combat');
  assert(!r.success, '满10级不能继续');
}

// 效果汇总
{
  const ts = initTalentState();
  ts.points = 10;
  allocateTalentPoint(ts, 'combat'); // 利刃: ATK+3
  allocateTalentPoint(ts, 'combat'); // 精准: CRT+5%
  allocateTalentPoint(ts, 'survival'); // 坚韧: DEF+3
  const fx = getTalentEffects(ts);
  assert(fx.atk === 3, 'ATK应为3');
  assert(fx.crt === 5, 'CRT应为5');
  assert(fx.def === 3, 'DEF应为3');
}

// 重置天赋
{
  const ts = initTalentState();
  ts.points = 5;
  allocateTalentPoint(ts, 'combat');
  allocateTalentPoint(ts, 'combat');
  allocateTalentPoint(ts, 'survival');
  const r = resetTalents(ts);
  assert(r.success, '重置应成功');
  assert(r.refunded === 3, '应退还3点');
  assert(ts.points === 5, '总点数应回到5');
  assert(ts.allocated.combat === 0, '战斗应清零');
}

// 终极天赋解锁
{
  const ts = initTalentState();
  ts.points = 10;
  for (let i = 0; i < 10; i++) allocateTalentPoint(ts, 'combat');
  const fx = getTalentEffects(ts);
  assert(fx.executeDmg !== null, '应解锁灭世终极');
  assert(fx.executeDmg.interval === 5, '灭世间隔应为5');
  assert(fx.executeDmg.percent === 0.15, '灭世伤害应为15%');
}

// 路线信息
{
  const ts = initTalentState();
  ts.points = 3;
  allocateTalentPoint(ts, 'technique');
  const info = getTalentPathInfo(ts, 'technique');
  assert(info.allocated === 1, '技巧已分配1');
  assert(info.nextTier.name === '闪避本能', '下一个应是闪避');
}

console.log('══════════════════════════════════════════');
console.log(' 敌人能力系统');
console.log('══════════════════════════════════════════');

// Boss 相位存在
{
  const p = getBossPhases('tyrant_t002');
  assert(p !== null, '暴君应有相位');
  assert(p.length === 3, '暴君应有3个相位');
}

// 当前相位判定
{
  const phases = getBossPhases('alien_queen');
  const p1 = getCurrentPhase(phases, 100, 100);
  assert(p1.phase.name === '巢母', '满血应是巢母');
  
  const p2 = getCurrentPhase(phases, 50, 100);
  assert(p2.phase.name === '召唤', '50%应是召唤');
  
  const p3 = getCurrentPhase(phases, 20, 100);
  assert(p3.phase.name === '濒死暴怒', '20%应是暴怒');
}

// 属性修正
{
  const phases = getBossPhases('tyrant_t002');
  const modified = applyPhaseModifiers({ atk: 100, def: 50 }, phases[1]);
  assert(modified.atk === 130, '突变ATK应1.3x');
  assert(modified.def === 40, '突变DEF应0.8x');
}

// 特殊技能CD
{
  const phases = getBossPhases('tyrant_t002');
  const canUse = shouldUseBossSpecial(phases[1], 5, 1);
  assert(canUse, '过了CD应可使用');
  const cantUse = shouldUseBossSpecial(phases[1], 3, 2);
  assert(!cantUse, 'CD内不能用');
}

// 特殊技能伤害
{
  const phases = getBossPhases('imhotep');
  const special = phases[2].specialMove; // 瘟疫之触
  const dmg = calcBossSpecialDamage(50, special);
  assert(dmg.damage === 125, '2.5x伤害应为125');
  assert(dmg.dot === 5, '应有DOT');
}

// 终极Boss多相位
{
  const p = getBossPhases('clone_zhengzha_ultimate');
  assert(p.length === 4, '终极复制体应有4个相位');
  assert(p[3].name === '最终决战', '最后相位应是最终决战');
}

// 敌人特性处理
{
  const enemy = { name: '测试怪', traits: ['regen', 'thorns'] };
  const fx = processEnemyTraits(enemy, 80, 100, 1, { playerMaxHp: 200 });
  assert(fx.healAmount > 0, '再生应恢复HP');
  assert(fx.reflectDmg > 0, '荆棘应反伤');
}

// 精英词缀
{
  const affixes = rollEliteAffixes(2);
  assert(affixes.length === 2, '应随机2个词缀');
  assert(affixes[0].id !== affixes[1].id, '词缀应不重复');
}

// 词缀应用
{
  const enemy = { name: '僵尸', hp: 100, atk: 20, def: 10, traits: [], rewards: { exp: 50, gold: 20 } };
  const affix = ELITE_AFFIXES.find(a => a.id === 'juggernaut');
  const enhanced = applyEliteAffixes(enemy, [affix]);
  assert(enhanced.hp === 150, 'HP应×1.5');
  assert(enhanced.name.includes('主宰'), '名字应包含主宰');
  assert(enhanced.rewards.exp === 75, '奖励应×1.5');
}

// 不死特性
{
  const enemy = { name: '不死怪', traits: ['undying'], _revived: false };
  const fx = processEnemyTraits(enemy, 0, 100, 5, {});
  assert(fx.revived, '不死应触发复活');
  assert(fx.reviveHp === 20, '应恢复20%HP');
}

// 全部Boss都有定义
{
  const bossIds = Object.keys(BOSS_PHASES);
  assert(bossIds.length >= 8, '应有至少8个Boss相位定义');
  for (const id of bossIds) {
    const phases = getBossPhases(id);
    assert(phases.length >= 2, `${id}应至少2个相位`);
    assert(phases[0].hpThreshold >= 0.5, `${id}第一相位HP阈值应≥0.5`);
  }
}

console.log('══════════════════════════════════════════');
console.log(`${pass + fail} 项测试: ${pass} 通过, ${fail} 失败`);
if (fail === 0) {
  console.log('✅ 装备强化 + 天赋树 + 敌人能力 全部通过');
} else {
  console.log('❌ 有测试失败');
  process.exit(1);
}
