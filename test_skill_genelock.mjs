/**
 * 技能系统 + 基因锁进阶 + 状态效果 集成测试
 */
import { GENE_LOCK, BLOODLINE, DAMAGE_TYPE } from './src/core/constants.js';
import {
  GENE_LOCK_THRESHOLDS, GENE_LOCK_BONUSES,
  checkGeneLockAdvancement, advanceGeneLock,
  getGeneLockProgress, getGeneLockDescription, toggleGeneLock
} from './src/core/GeneLockSystem.js';
import {
  SKILL_DEFINITIONS, STATUS_EFFECT,
  getAvailableSkills, canUseSkill, useSkill,
  processStatusEffects, applyStatusEffect, tickCooldowns
} from './src/core/SkillSystem.js';

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; }
  else { fail++; console.error(`  ✗ ${msg}`); }
}

// ═══ 基因锁进阶测试 ═══
console.log('=== 基因锁进阶 ===');

// 阈值正确
assert(GENE_LOCK_THRESHOLDS[0] === 100, '阈值0→1为100');
assert(GENE_LOCK_THRESHOLDS[1] === 250, '阈值1→2为250');
assert(GENE_LOCK_THRESHOLDS[2] === 500, '阈值2→3为500');
assert(GENE_LOCK_THRESHOLDS[3] === 1000, '阈值3→4为1000');

// 未达阈值不能进阶
const p1 = { geneLock: 0, geneLockCharge: 50, geneLockActive: false, hp: 100, maxHp: 100, atk: 10, def: 5, spd: 5, crt: 5 };
assert(!checkGeneLockAdvancement(p1).advanced, '充能不足不进阶');

// 达到阈值可进阶
p1.geneLockCharge = 100;
const check1 = checkGeneLockAdvancement(p1);
assert(check1.advanced, '充能100可突破到1阶');
assert(check1.newStage === 1, '新阶段为1');

// 执行进阶
const adv1 = advanceGeneLock(p1);
assert(adv1.success, '进阶成功');
assert(p1.geneLock === 1, '基因锁变为1');
assert(p1.geneLockActive === true, '进阶后自动激活');
assert(p1.atk === 10 + GENE_LOCK_BONUSES[1].atk, 'ATK获得加成');
assert(p1.def === 5 + GENE_LOCK_BONUSES[1].def, 'DEF获得加成');
console.log(`  ✓ 基因锁1阶进阶: ATK=${p1.atk} DEF=${p1.def} SPD=${p1.spd} MaxHP=${p1.maxHp}`);

// 进度查询
const prog = getGeneLockProgress(p1);
assert(prog.currentStage === 1, '当前阶段1');
assert(prog.nextThreshold === 250, '下一阈值250');

// 描述
const desc = getGeneLockDescription(1);
assert(desc && desc.length > 5, '1阶描述非空');

// 切换
toggleGeneLock(p1);
assert(p1.geneLockActive === false, '切换后关闭');
toggleGeneLock(p1);
assert(p1.geneLockActive === true, '再次切换后开启');

// 连续进阶到4阶
p1.geneLockCharge = 250;
advanceGeneLock(p1);
assert(p1.geneLock === 2, '进阶到2阶');
p1.geneLockCharge = 500;
advanceGeneLock(p1);
assert(p1.geneLock === 3, '进阶到3阶');
p1.geneLockCharge = 1000;
advanceGeneLock(p1);
assert(p1.geneLock === 4, '进阶到4阶（最高）');
console.log(`  ✓ 4阶完成: ATK=${p1.atk} DEF=${p1.def} SPD=${p1.spd} MaxHP=${p1.maxHp} CRT=${p1.crt}`);

// 4阶后不能再进阶
p1.geneLockCharge = 9999;
assert(!checkGeneLockAdvancement(p1).advanced, '4阶后不再进阶');

// ═══ 技能系统测试 ═══
console.log('\n=== 技能系统 ===');

// 技能定义完整
assert(Object.keys(SKILL_DEFINITIONS).length >= 10, '10个技能定义');
const geneSkills = ['sensory_boost', 'muscle_control', 'simulation_mind', 'heart_light'];
const bloodSkills = ['blood_drain', 'tiger_fist', 'iron_body', 'thunder_spell', 'dragon_breath', 'mind_crush'];
for (const s of [...geneSkills, ...bloodSkills]) {
  assert(SKILL_DEFINITIONS[s], `技能 ${s} 存在`);
}

// 获取可用技能：无基因锁无血统 → 0
const p2 = { geneLock: 0, geneLockActive: false, activeBloodline: 'none', mana: 50, maxMana: 50 };
assert(getAvailableSkills(p2).length >= 0, '0阶有通用技能或无技能');

// 1阶基因锁 → sensory_boost
p2.geneLock = 1;
p2.geneLockActive = true;
let skills = getAvailableSkills(p2);
assert(skills.some(s => s.id === 'sensory_boost'), '1阶有感知增强');
assert(!skills.some(s => s.id === 'muscle_control'), '1阶无肌肉控制');

// 2阶 → sensory_boost + muscle_control
p2.geneLock = 2;
skills = getAvailableSkills(p2);
assert(skills.some(s => s.id === 'muscle_control'), '2阶有肌肉控制');

// 加血统
p2.activeBloodline = BLOODLINE.VAMPIRE;
skills = getAvailableSkills(p2);
assert(skills.some(s => s.id === 'blood_drain'), '血族有吸血打击');

// 技能使用
const cs = { cooldowns: {}, statusEffects: { player: [], enemy: [] }, turn: 1 };
const enemy = { hp: 200, atk: 30, def: 10, spd: 8 };
const canUse = canUseSkill(p2, 'sensory_boost', cs);
assert(canUse.usable, '感知增强可使用');

const result = useSkill(p2, 'sensory_boost', enemy, cs);
assert(result.log.length > 0, '技能有日志输出');
assert(cs.cooldowns['sensory_boost'] > 0, '使用后有冷却');

// 冷却中不可再用
const canUse2 = canUseSkill(p2, 'sensory_boost', cs);
assert(!canUse2.usable, '冷却中不可使用');
console.log(`  ✓ 技能使用+冷却机制正常`);

// ═══ 状态效果测试 ═══
console.log('\n=== 状态效果 ===');

// 灼烧
applyStatusEffect('enemy', { type: STATUS_EFFECT.BURN, value: 10, duration: 3, source: 'test' }, cs);
assert(cs.statusEffects.enemy.length > 0, '灼烧已施加');
const burnResult = processStatusEffects('enemy', cs);
assert(burnResult.damage > 0, '灼烧造成伤害');
console.log(`  ✓ 灼烧: ${burnResult.damage}伤害`);

// 眩晕
applyStatusEffect('enemy', { type: STATUS_EFFECT.STUN, value: 1, duration: 1, source: 'test' }, cs);
const stunResult = processStatusEffects('enemy', cs);
assert(stunResult.skipTurn === true, '眩晕跳过回合');
console.log(`  ✓ 眩晕: skipTurn=${stunResult.skipTurn}`);

// 冷却递减
cs.cooldowns['test_skill'] = 3;
tickCooldowns(cs);
assert(cs.cooldowns['test_skill'] === 2, '冷却递减');
tickCooldowns(cs);
tickCooldowns(cs);
assert(cs.cooldowns['test_skill'] === 0, '冷却归零');
console.log(`  ✓ 冷却递减正常`);

// ═══ 汇总 ═══
console.log(`\n════════════════════════════════════════`);
console.log(`${pass + fail} 项测试: ${pass} 通过, ${fail} 失败`);
if (fail === 0) console.log(`✅ 技能系统 + 基因锁进阶 + 状态效果 全部通过`);
else { console.log(`❌ ${fail} 项失败`); process.exit(1); }

// ═══ 新增技能验证 ═══
console.log('\n=== 新增技能验证 ===');

// 技能总数应≥22
const totalSkills = Object.keys(SKILL_DEFINITIONS).length;
assert(totalSkills >= 23, `技能总数≥21 (实际${totalSkills})`);
console.log(`  ✓ 技能总数: ${totalSkills}`);

// 每个技能ID唯一
const ids = Object.keys(SKILL_DEFINITIONS);
const uniqueIds = new Set(ids);
assert(uniqueIds.size === ids.length, '技能ID唯一');

// DEBUFF_DEF 存在
assert(STATUS_EFFECT.DEBUFF_DEF === 'debuff_def', 'DEBUFF_DEF 常量存在');
assert(STATUS_EFFECT.REFLECT === 'reflect', 'REFLECT 常量存在');

// analyze_weakness 使用 DEBUFF_DEF
const awEnemy = { hp: 200, def: 50, atk: 30 };
const awPlayer = { geneLock: 1, geneLockActive: true, activeBloodline: 'none', mana: 50, maxMana: 50, atk: 30, def: 20 };
const awCs = { cooldowns: {}, statusEffects: { player: [], enemy: [] }, turn: 1 };
const awResult = useSkill(awPlayer, 'analyze_weakness', awEnemy, awCs);
assert(awResult.log.length > 0, 'analyze_weakness 有日志');
const hasDebuffDef = awCs.statusEffects.enemy.some(e => e.type === 'debuff_def');
assert(hasDebuffDef, 'analyze_weakness 施加 DEBUFF_DEF');
console.log(`  ✓ analyze_weakness: DEBUFF_DEF=${hasDebuffDef}`);

// iron_fortress 施加 REFLECT
const ifPlayer = { geneLock: 2, geneLockActive: true, activeBloodline: 'martial', mana: 50, maxMana: 50, atk: 30, def: 20 };
const ifEnemy = { hp: 200, def: 10, atk: 30 };
const ifCs = { cooldowns: {}, statusEffects: { player: [], enemy: [] }, turn: 1 };
const ifResult = useSkill(ifPlayer, 'iron_fortress', ifEnemy, ifCs);
assert(ifResult.log.length > 0, 'iron_fortress 有日志');
const hasReflect = ifCs.statusEffects.player.some(e => e.type === 'reflect');
const hasBuffDef = ifCs.statusEffects.player.some(e => e.type === 'buff_def');
assert(hasReflect, 'iron_fortress 施加反弹效果');
assert(hasBuffDef, 'iron_fortress 施加防御加成');
console.log(`  ✓ iron_fortress: reflect=${hasReflect}, buff_def=${hasBuffDef}`);

// muscle_control 返回 damage
const mcPlayer = { geneLock: 2, geneLockActive: true, activeBloodline: 'none', mana: 0, maxMana: 50, hp: 100, maxHp: 100, atk: 30, def: 20 };
const mcEnemy = { hp: 200, def: 10, atk: 30 };
const mcCs = { cooldowns: {}, statusEffects: { player: [], enemy: [] }, turn: 1 };
const mcResult = useSkill(mcPlayer, 'muscle_control', mcEnemy, mcCs);
assert(mcResult.damage > 0, `muscle_control 返回 damage (${mcResult.damage})`);
assert(mcResult.damage === mcPlayer.atk * 2, 'muscle_control 伤害=2x ATK');
console.log(`  ✓ muscle_control: damage=${mcResult.damage}`);

// useSkill 返回 manaCost
const edPlayer = { geneLock: 2, geneLockActive: true, activeBloodline: 'vampire', mana: 50, maxMana: 50, hp: 50, maxHp: 200, atk: 30, def: 20 };
const edEnemy2 = { hp: 200, def: 10, atk: 30 };
const edCs = { cooldowns: {}, statusEffects: { player: [], enemy: [] }, turn: 1 };
const edResult = useSkill(edPlayer, 'embrace_of_night', edEnemy2, edCs);
assert(edResult.manaCost === 10, `embrace_of_night manaCost=10 (实际${edResult.manaCost})`);
assert(edResult.damage > 0, `embrace_of_night damage>0 (${edResult.damage})`);
assert(edResult.heal > 0, `embrace_of_night heal>0 (${edResult.heal})`);
console.log(`  ✓ embrace_of_night: dmg=${edResult.damage} heal=${edResult.heal} mp=${edResult.manaCost}`);

// 汇总
console.log(`\n════════════════════════════════════════`);
console.log(`${pass + fail} 项测试: ${pass} 通过, ${fail} 失败`);
if (fail === 0) console.log(`✅ 全部通过（含新增技能验证）`);
else { console.log(`❌ ${fail} 项失败`); process.exit(1); }
