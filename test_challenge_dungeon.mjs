// ═══════════════════════════════════════════════════════════════
// 挑战副本系统测试
// ═══════════════════════════════════════════════════════════════

import { 
  CHALLENGE_TYPES, challengeState, getAvailableChallenges,
  generateTrialEnemy, generateBossRushList, ChallengeDungeonState
} from './src/core/ChallengeDungeon.js';

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; }
  else { fail++; console.error(`  ❌ ${msg}`); }
}

console.log('══════════════════════════════════════════');
console.log(' 挑战副本系统测试');
console.log('══════════════════════════════════════════');

// ── 基本类型 ──
{
  assert(CHALLENGE_TYPES.ENDLESS_TOWER === 'endless_tower', '无尽塔类型');
  assert(CHALLENGE_TYPES.BOSS_RUSH === 'boss_rush', 'Boss速通类型');
  assert(CHALLENGE_TYPES.ELEMENTAL_TRIAL === 'elemental_trial', '元素试炼类型');
  assert(CHALLENGE_TYPES.SURVIVAL === 'survival', '生存挑战类型');
}

// ── 无尽塔敌人生成 ──
{
  const state = new ChallengeDungeonState();
  const enemy = state.startChallenge(CHALLENGE_TYPES.ENDLESS_TOWER, 1);
  assert(enemy, '应生成第1层敌人');
  assert(enemy.hp > 0, '敌人HP>0');
  assert(enemy.atk > 0, '敌人ATK>0');
  assert(enemy.name, '敌人应有名字');
  assert(enemy.rewards, '敌人应有奖励');
  assert(enemy.rewards.exp > 0, '经验奖励>0');
  
  // 后续层数应更强
  const enemy5 = state.getNextEnemy();
  const enemy10 = state.getNextEnemy();
  const enemy20 = state.getNextEnemy();
  assert(state.currentWave === 4, '应在第4波');
  
  state.recordVictory(enemy);
  assert(state.totalRewards.exp > 0, '累积奖励应>0');
  
  const rewards = state.endChallenge('complete');
  assert(rewards.exp > 0, '最终奖励经验>0');
  assert(!state.active, '结束后应不活跃');
}

// ── 高章节敌人缩放 ──
{
  const state = new ChallengeDungeonState();
  const enemyCh1 = state.startChallenge(CHALLENGE_TYPES.ENDLESS_TOWER, 1);
  state.endChallenge();
  
  const state2 = new ChallengeDungeonState();
  const enemyCh6 = state2.startChallenge(CHALLENGE_TYPES.ENDLESS_TOWER, 6);
  state2.endChallenge();
  
  assert(enemyCh6.hp > enemyCh1.hp, 'Ch6层1敌人应比Ch1强');
  assert(enemyCh6.atk > enemyCh1.atk, 'Ch6层1ATK应比Ch1强');
}

// ── 精英层与Mini-Boss ──
{
  const state = new ChallengeDungeonState();
  state.startChallenge(CHALLENGE_TYPES.ENDLESS_TOWER, 3);
  let enemies = [];
  for (let i = 0; i < 10; i++) {
    enemies.push(state.getNextEnemy());
  }
  // 第5波(index 4)应是精英 (wave 6 since startChallenge already set wave to 1)
  // Let me check: startChallenge returns wave 1, getNextEnemy increments to 2,3,...
  // So after 10 getNextEnemy calls, wave = 11
  // Wave 5 = enemies[3] (4th getNextEnemy = wave 5)
  const wave5Enemy = enemies[3]; // wave 5
  assert(wave5Enemy.traits.length > 0, '第5波应是精英(有词缀)');
  state.endChallenge();
}

// ── Boss Rush ──
{
  const bosses = generateBossRushList(6, new Set());
  assert(bosses.length === 6, '6章应有6个可重打Boss');
  assert(bosses[0].name === '暴君 T-002', '第一个Boss应是暴君');
  assert(bosses[0].bossId === 'tyrant_t002', '应有正确bossId');
  assert(bosses[0].rewards, 'Boss应有奖励');
  
  const bosses12 = generateBossRushList(12, new Set());
  assert(bosses12.length === 12, '12章应有12个Boss');
}

// ── 元素试炼敌人 ──
{
  const trial = { element: 'fire', waves: 5, bonus: { ice: 1.5 } };
  const enemy1 = generateTrialEnemy(trial, 1, 3);
  assert(enemy1.damageType === 'fire', '火试炼敌人应是火属性');
  assert(enemy1.weaknesses.includes('ice'), '火敌应弱冰');
  assert(enemy1.name, '应有名字');
  
  const enemy5 = generateTrialEnemy(trial, 5, 3);
  assert(enemy5.hp > enemy1.hp, '高波次敌人应更强');
  assert(enemy5.rewards.rewardPoints > 0, '最后一波应有RP奖励');
}

// ── 可用副本列表 ──
{
  // Ch1: 只有无尽塔
  const ch1 = getAvailableChallenges(1, new Set());
  assert(ch1.length >= 1, 'Ch1应至少有1个副本');
  assert(ch1[0].type === CHALLENGE_TYPES.ENDLESS_TOWER, '应有无尽塔');
  
  // Ch6: 应有更多选择
  const ch6 = getAvailableChallenges(6, new Set(['boss_tyrant']));
  assert(ch6.length >= 3, 'Ch6应有3+个副本');
  
  // Ch8: 应有生存挑战
  const ch8 = getAvailableChallenges(8, new Set());
  const hasSurvival = ch8.some(c => c.type === CHALLENGE_TYPES.SURVIVAL);
  assert(hasSurvival, 'Ch8应有生存挑战');
}

// ── 失败奖励折扣 ──
{
  const state = new ChallengeDungeonState();
  state.startChallenge(CHALLENGE_TYPES.ENDLESS_TOWER, 5);
  state.totalRewards = { exp: 1000, gold: 500, rewardPoints: 200 };
  const defeatRewards = state.endChallenge('defeat');
  assert(defeatRewards.exp === 700, '失败应得70%经验');
  assert(defeatRewards.gold === 350, '失败应得70%金币');
}

// ── 序列化 ──
{
  const state = new ChallengeDungeonState();
  state.highestTowerFloor = { 1: 15, 3: 22 };
  state.survivalRecords = { 5: 8 };
  const json = state.toJSON();
  
  const state2 = new ChallengeDungeonState();
  state2.fromJSON(json);
  assert(state2.highestTowerFloor[1] === 15, '序列化应保存塔记录');
  assert(state2.highestTowerFloor[3] === 22, '序列化应保存Ch3塔记录');
  assert(state2.survivalRecords[5] === 8, '序列化应保存生存记录');
}

// ── 最高记录更新 ──
{
  const state = new ChallengeDungeonState();
  state.startChallenge(CHALLENGE_TYPES.ENDLESS_TOWER, 2);
  // Simulate reaching floor 10
  for (let i = 0; i < 9; i++) state.getNextEnemy();
  state.endChallenge('defeat');
  assert(state.highestTowerFloor[2] === 10, '应记录10层');
  
  // 再打一次，只到第5层
  state.startChallenge(CHALLENGE_TYPES.ENDLESS_TOWER, 2);
  for (let i = 0; i < 4; i++) state.getNextEnemy();
  state.endChallenge('defeat');
  assert(state.highestTowerFloor[2] === 10, '不应降低记录(仍是10)');
  
  // 突破到15层
  state.startChallenge(CHALLENGE_TYPES.ENDLESS_TOWER, 2);
  for (let i = 0; i < 14; i++) state.getNextEnemy();
  state.endChallenge('complete');
  assert(state.highestTowerFloor[2] === 15, '应更新到15层');
}

console.log('══════════════════════════════════════════');
console.log(`${pass + fail} 项测试: ${pass} 通过, ${fail} 失败`);
if (fail === 0) console.log('✅ 挑战副本系统全部通过');
else { console.log('❌ 有测试失败'); process.exit(1); }
