// ═══════════════════════════════════════════════════════════════
// 觉醒系统测试
// ═══════════════════════════════════════════════════════════════

import {
  initAwakeningState, getAwakeningStage, getAwakeningLevel,
  getNextAwakening, canAwaken, performAwakening,
  getAwakeningCombatBonuses, getAwakeningSkills,
  AWAKENING_STAGES, AWAKENING_SKILLS,
  renderAwakeningPanel, serializeAwakening, deserializeAwakening,
} from './src/core/AwakeningSystem.js';

let passed = 0, failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('FAIL:', msg); }
}

console.log('[ 觉醒系统 ]');

// Test 1: Initial state
initAwakeningState();
assert(getAwakeningLevel() === 0, '初始觉醒等级0');
assert(getAwakeningStage().name === '潜伏', '初始阶段为潜伏');

// Test 2: Awakening stages defined
assert(AWAKENING_STAGES.length === 5, '5个觉醒阶段');
assert(AWAKENING_STAGES[4].name === '完全觉醒', '最高阶段为完全觉醒');

// Test 3: Check conditions - insufficient
const player1 = { geneLock: 0, rewardPoints: 100, maxHp: 100, hp: 100, atk: 10, def: 5 };
const check1 = canAwaken(player1, 1);
assert(!check1.can, '第1章不满足初觉条件');
assert(check1.reason.includes('第3章'), '提示需要第3章');

// Test 4: Check conditions - met
const player2 = { geneLock: 1, rewardPoints: 600, maxHp: 200, hp: 200, atk: 20, def: 10 };
const check2 = canAwaken(player2, 3);
assert(check2.can, '满足初觉条件');

// Test 5: Perform awakening
const result = performAwakening(player2);
assert(result.success, '觉醒成功');
assert(result.stage.name === '初觉', '觉醒到初觉');
assert(result.bonuses.maxHp === 50, '初觉加50 MaxHP');
assert(result.bonuses.atk === 5, '初觉加5 ATK');
assert(result.skill !== null, '解锁觉醒技能');
assert(result.skill.id === 'awakening_1', '解锁基因脉冲');
assert(result.lore.includes('基因深处'), '觉醒故事文本');

// Test 6: Player stats updated
assert(player2.maxHp === 250, 'MaxHP = 200+50 = 250');
assert(player2.atk === 25, 'ATK = 20+5 = 25');
assert(player2.hp === 250, '觉醒恢复全部HP');
assert(player2.rewardPoints === 100, '扣除500奖励点: 600-500=100');

// Test 7: Level updated
assert(getAwakeningLevel() === 1, '觉醒等级1');
assert(getAwakeningStage().name === '初觉', '当前阶段初觉');

// Test 8: Combat bonuses
const bonuses = getAwakeningCombatBonuses();
assert(bonuses.maxHp === 50, '战斗加成MaxHP');
assert(bonuses.skillDmgBonus === 0.1, '技能伤害+10%');
assert(bonuses.regenPerRound === 2, '回合恢复2');

// Test 9: Unlocked skills
const skills = getAwakeningSkills();
assert(skills.length === 1, '1个觉醒技能');
assert(skills[0].name === '基因脉冲', '基因脉冲技能');

// Test 10: Cannot awaken again immediately
const check3 = canAwaken(player2, 3);
assert(!check3.can, '不能立即再次觉醒');

// Test 11: Second awakening
player2.geneLock = 2;
player2.rewardPoints = 2000;
const check4 = canAwaken(player2, 6);
assert(check4.can, '满足破境条件');
const result2 = performAwakening(player2);
assert(result2.success, '破境成功');
assert(result2.stage.name === '破境', '觉醒到破境');
assert(getAwakeningLevel() === 2, '觉醒等级2');
assert(getAwakeningSkills().length === 2, '2个觉醒技能');

// Test 12: Serialize/Deserialize
const serialized = serializeAwakening();
assert(serialized.stage === 2, '序列化觉醒等级');
assert(serialized.unlockedSkills.length === 2, '序列化技能');

initAwakeningState();
assert(getAwakeningLevel() === 0, '重置后等级0');
deserializeAwakening(serialized);
assert(getAwakeningLevel() === 2, '反序列化后等级2');
assert(getAwakeningSkills().length === 2, '反序列化后技能数');

// Test 13: Awakening skills defined correctly
assert(AWAKENING_SKILLS.awakening_1.manaCost === 25, '基因脉冲消耗25蓝');
assert(AWAKENING_SKILLS.awakening_ultimate.dmgMult === 5.0, '无限觉醒5倍伤害');
assert(AWAKENING_SKILLS.awakening_ultimate.trueDamage === true, '无限觉醒真实伤害');

// Test 14: Render panel
const panel = renderAwakeningPanel(player2, 6);
assert(panel.includes('破境'), '面板显示当前阶段');
assert(panel.includes('蜕变'), '面板显示下一阶段');
assert(panel.includes('基因脉冲'), '面板显示已解锁技能');

// Test 15: Max awakening
initAwakeningState();
const maxP = { geneLock: 5, rewardPoints: 99999, maxHp: 500, hp: 500, atk: 100, def: 80, spd: 10, crt: 20 };
for (let i = 0; i < 4; i++) {
  const r = performAwakening(maxP);
  assert(r.success, `第${i+1}次觉醒成功`);
}
assert(getAwakeningLevel() === 4, '完全觉醒等级4');
const maxNext = getNextAwakening();
assert(maxNext === null, '完全觉醒后无下一阶段');
const maxCheck = canAwaken(maxP, 12);
assert(!maxCheck.can, '无法超越完全觉醒');

// Test 16: Ultimate skill unlocked
const allSkills = getAwakeningSkills();
assert(allSkills.length === 4, '4个觉醒技能全解锁');
assert(allSkills.some(s => s.id === 'awakening_ultimate'), '无限觉醒技能已解锁');

console.log('');
console.log('══════════════════════════════════════════');
console.log(`觉醒系统测试: ${passed}通过, ${failed}失败`);
if (failed === 0) console.log('✅ 全部通过');
else { console.log('❌ 存在失败'); process.exit(1); }
