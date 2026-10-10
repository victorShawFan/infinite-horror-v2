import assert from 'node:assert/strict';
import { learnSkill, equipSkill, unequipSkill, replaceEquippedSkill } from './src/rebuild/core/SkillLearning.js';
import { SKILL_CATALOG } from './src/rebuild/data/SkillCatalog.js';

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ✅ ' + name); }
  catch (error) { console.error('  ❌ ' + name); throw error; }
}

function profile(overrides = {}) {
  return { rewardPoints: 1000, learnedSkills: ['heavy_slash'], equippedSkills: ['heavy_slash'], skillSlots: 4, ...overrides };
}

console.log('\n[ Rebuild SkillLearning ]');

test('消耗奖励点学习新技能', () => {
  const result = learnSkill(profile(), 'arc_sweep', SKILL_CATALOG);
  assert.equal(result.ok, true);
  assert.equal(result.profile.rewardPoints, 650);
  assert.equal(result.profile.learnedSkills.includes('arc_sweep'), true);
});

test('缺少前置技能时拒绝学习且不扣点数', () => {
  const p = profile({ learnedSkills: [] });
  const result = learnSkill(p, 'arc_sweep', SKILL_CATALOG);
  assert.equal(result.ok, false);
  assert.equal(result.error, 'prerequisite_missing');
  assert.equal(result.profile.rewardPoints, 1000);
});

test('奖励点不足时拒绝学习', () => {
  const result = learnSkill(profile({ rewardPoints: 100 }), 'arc_sweep', SKILL_CATALOG);
  assert.equal(result.ok, false);
  assert.equal(result.error, 'insufficient_points');
});

test('不能重复学习同一技能', () => {
  const result = learnSkill(profile(), 'heavy_slash', SKILL_CATALOG);
  assert.equal(result.ok, false);
  assert.equal(result.error, 'already_learned');
});

test('敌方专属技能不能被玩家学习', () => {
  const result = learnSkill(profile(), 'tyrant_crush', SKILL_CATALOG);
  assert.equal(result.ok, false);
  assert.equal(result.error, 'skill_not_learnable');
  assert.equal(result.profile.learnedSkills.includes('tyrant_crush'), false);
});

test('已学习技能可装备且不重复占槽', () => {
  const p = profile({ learnedSkills: ['heavy_slash', 'arc_sweep'] });
  const first = equipSkill(p, 'arc_sweep');
  const second = equipSkill(first.profile, 'arc_sweep');
  assert.equal(first.ok, true);
  assert.deepEqual(second.profile.equippedSkills, ['heavy_slash', 'arc_sweep']);
});

test('技能栏满时拒绝装备', () => {
  const p = profile({ learnedSkills: ['heavy_slash', 'arc_sweep'], equippedSkills: ['heavy_slash'], skillSlots: 1 });
  const result = equipSkill(p, 'arc_sweep');
  assert.equal(result.ok, false);
  assert.equal(result.error, 'slots_full');
});

test('已装备技能可以卸下并释放技能槽', () => {
  const result = unequipSkill(profile(), 'heavy_slash');
  assert.equal(result.ok, true);
  assert.deepEqual(result.profile.equippedSkills, []);
});

test('替换技能保持槽位顺序且要求新技能已学习', () => {
  const p = profile({ learnedSkills: ['heavy_slash', 'arc_sweep'], equippedSkills: ['heavy_slash'] });
  const result = replaceEquippedSkill(p, 'heavy_slash', 'arc_sweep');
  assert.equal(result.ok, true);
  assert.deepEqual(result.profile.equippedSkills, ['arc_sweep']);
  const invalid = replaceEquippedSkill(p, 'heavy_slash', 'blood_burst');
  assert.equal(invalid.ok, false);
  assert.equal(invalid.error, 'not_learned');
});

test('不能卸下未装备技能', () => {
  const result = unequipSkill(profile(), 'arc_sweep');
  assert.equal(result.ok, false);
  assert.equal(result.error, 'not_equipped');
});

console.log('\n✅ ' + passed + ' skill learning checks passed');
