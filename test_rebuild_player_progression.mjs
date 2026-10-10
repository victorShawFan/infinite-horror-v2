import assert from 'node:assert/strict';
import { applyExperience, experienceToNextLevel, getProgressionBonuses } from './src/rebuild/core/PlayerProgression.js';
import { createParty } from './src/rebuild/data/ChapterOneBattle.js';
import { CHAPTER_ONE_ENCOUNTERS } from './src/rebuild/data/ChapterOneBattle.js';

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ✅ ' + name); }
  catch (error) { console.error('  ❌ ' + name); throw error; }
}

console.log('\n[ Rebuild PlayerProgression ]');

test('一级升级阈值明确且随等级递增', () => {
  assert.equal(experienceToNextLevel(1), 120);
  assert.equal(experienceToNextLevel(2), 200);
  assert.equal(experienceToNextLevel(3), 280);
});

test('未达到阈值时只累积经验', () => {
  const result = applyExperience({ level: 1, exp: 20 }, 50);
  assert.equal(result.profile.level, 1);
  assert.equal(result.profile.exp, 70);
  assert.equal(result.levelsGained, 0);
});

test('升级扣除当前阈值并保留溢出经验', () => {
  const result = applyExperience({ level: 1, exp: 100 }, 50);
  assert.equal(result.profile.level, 2);
  assert.equal(result.profile.exp, 30);
  assert.equal(result.levelsGained, 1);
});

test('大量经验可连续升级', () => {
  const result = applyExperience({ level: 1, exp: 0 }, 350);
  assert.equal(result.profile.level, 3);
  assert.equal(result.profile.exp, 30);
  assert.equal(result.levelsGained, 2);
});

test('等级奖励稳定转化为战斗属性', () => {
  assert.deepEqual(getProgressionBonuses(1), { maxHp: 0, atk: 0, def: 0, maxMp: 0 });
  assert.deepEqual(getProgressionBonuses(3), { maxHp: 24, atk: 6, def: 4, maxMp: 4 });
});

test('等级奖励真实写入郑吒战斗快照', () => {
  const zheng = createParty({ level: 3, equippedSkills: ['heavy_slash'] }).find(unit => unit.id === 'zheng');
  assert.equal(zheng.maxHp, 192);
  assert.equal(zheng.hp, 192);
  assert.equal(zheng.atk, 40);
  assert.equal(zheng.def, 15);
  assert.equal(zheng.maxMp, 34);
  assert.equal(zheng.mp, 34);
});

test('旧存档缺少等级字段时按一级安全迁移', () => {
  const result = applyExperience({}, 0);
  assert.equal(result.profile.level, 1);
  assert.equal(result.profile.exp, 0);
});

test('首章六场首通经验形成明确成长曲线', () => {
  let profile = { level: 1, exp: 0 };
  for (const encounter of CHAPTER_ONE_ENCOUNTERS) profile = applyExperience(profile, encounter.rewards.exp).profile;
  assert.equal(profile.level, 6);
  assert.equal(profile.exp, 110);
  assert.deepEqual(getProgressionBonuses(profile.level), { maxHp: 60, atk: 15, def: 10, maxMp: 10 });
});

console.log('\n✅ ' + passed + ' progression checks passed');
