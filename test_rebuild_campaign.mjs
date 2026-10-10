import assert from 'node:assert/strict';
import {
  createCampaignProgress,
  canLaunchEncounter,
  settleEncounter,
  getCampaignStatus,
  getEncounterMode,
} from './src/rebuild/core/CampaignProgress.js';
import { CHAPTER_ONE_ENCOUNTERS } from './src/rebuild/data/ChapterOneBattle.js';

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ✅ ' + name); }
  catch (error) { console.error('  ❌ ' + name); throw error; }
}

const ids = CHAPTER_ONE_ENCOUNTERS.map(encounter => encounter.id);

console.log('\n[ Rebuild ChapterOneCampaign ]');

test('新档案只解锁第一场任务', () => {
  const progress = createCampaignProgress();
  assert.equal(canLaunchEncounter(progress, ids[0], CHAPTER_ONE_ENCOUNTERS), true);
  assert.equal(canLaunchEncounter(progress, ids[1], CHAPTER_ONE_ENCOUNTERS), false);
});

test('不能结算尚未解锁的任务', () => {
  const result = settleEncounter(createCampaignProgress(), ids[1], 'victory', CHAPTER_ONE_ENCOUNTERS);
  assert.equal(result.ok, false);
  assert.equal(result.error, 'encounter_locked');
});

test('首次胜利记录完成并解锁下一场', () => {
  const result = settleEncounter(createCampaignProgress(), ids[0], 'victory', CHAPTER_ONE_ENCOUNTERS);
  assert.equal(result.ok, true);
  assert.equal(result.firstClear, true);
  assert.equal(result.progress.completed.includes(ids[0]), true);
  assert.equal(canLaunchEncounter(result.progress, ids[1], CHAPTER_ONE_ENCOUNTERS), true);
  assert.equal(result.rewards.points, CHAPTER_ONE_ENCOUNTERS[0].rewards.points);
});

test('失败不解锁下一场且不给奖励', () => {
  const result = settleEncounter(createCampaignProgress(), ids[0], 'defeat', CHAPTER_ONE_ENCOUNTERS);
  assert.equal(result.ok, true);
  assert.equal(result.rewards.points, 0);
  assert.equal(canLaunchEncounter(result.progress, ids[1], CHAPTER_ONE_ENCOUNTERS), false);
});

test('重复挑战只获得明确配置的较低奖励', () => {
  const first = settleEncounter(createCampaignProgress(), ids[0], 'victory', CHAPTER_ONE_ENCOUNTERS);
  const repeat = settleEncounter(first.progress, ids[0], 'victory', CHAPTER_ONE_ENCOUNTERS);
  assert.equal(repeat.firstClear, false);
  assert.equal(repeat.rewards.points, CHAPTER_ONE_ENCOUNTERS[0].repeatRewards.points);
  assert.deepEqual(repeat.progress.completed, [ids[0]]);
});

test('已完成任务明确标记为历史副本而非伪装成主线首通',()=>{const first=settleEncounter(createCampaignProgress(),ids[0],'victory',CHAPTER_ONE_ENCOUNTERS);assert.equal(getEncounterMode(first.progress,ids[0],CHAPTER_ONE_ENCOUNTERS),'replay');assert.equal(getEncounterMode(first.progress,ids[1],CHAPTER_ONE_ENCOUNTERS),'first-clear');});

test('依次完成全部六场后章节状态为完成', () => {
  let progress = createCampaignProgress();
  for (const id of ids) progress = settleEncounter(progress, id, 'victory', CHAPTER_ONE_ENCOUNTERS).progress;
  const status = getCampaignStatus(progress, CHAPTER_ONE_ENCOUNTERS);
  assert.equal(status.completed, true);
  assert.equal(status.completedCount, ids.length);
  assert.equal(status.nextEncounter, null);
});

test('首领首通发放稀缺支线剧情而重复副本不复制',()=>{let progress=createCampaignProgress();let result;for(const id of ids){result=settleEncounter(progress,id,'victory',CHAPTER_ONE_ENCOUNTERS);progress=result.progress;}assert.equal(result.rewards.sideStories.D,1);const replay=settleEncounter(progress,ids.at(-1),'victory',CHAPTER_ONE_ENCOUNTERS);assert.deepEqual(replay.rewards.sideStories,{});});

test('旧存档缺失campaign字段时可安全迁移', () => {
  const progress = createCampaignProgress({ battlesWon: 2 });
  assert.deepEqual(progress.completed, ids.slice(0, 2));
  assert.equal(progress.unlockedIndex, 2);
});

console.log('\n✅ ' + passed + ' campaign checks passed');
