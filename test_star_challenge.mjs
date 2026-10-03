import {
  initStarChallenge, generateFloorChallenges, evaluateChallenges,
  countStars, setFloorStarData, getFloorStarData, getTotalStars,
  getAvailableMilestones, claimMilestone, renderFloorChallengeHUD,
  renderStarOverview, serializeStarChallenge, deserializeStarChallenge,
  STAR_MILESTONES, CHALLENGE_TYPES,
} from './src/core/StarChallenge.js';

let passed = 0, failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('FAIL:', msg); }
}

console.log('[ 星级挑战系统 ]');

// Test 1: Generate challenges
initStarChallenge();
const ch = generateFloorChallenges(1, 0, false);
assert(ch.length === 3, '3个挑战');
assert(ch[0].star === 1, '第1个是基础');
assert(ch[1].star === 2, '第2个是进阶');
assert(ch[2].star === 3, '第3个是大师');
assert(ch[0].id === 'clear', '基础=通关');

// Test 2: Boss floor challenges
const bossCh = generateFloorChallenges(1, 5, true);
assert(bossCh.length === 3, 'Boss也有3个挑战');

// Test 3: Evaluate - victory
const evaluated = evaluateChallenges([...ch], { victory: true, totalDamageTaken: 0 });
assert(evaluated[0].completed === true, '通关完成');

// Test 4: Evaluate - no damage
const evalNoDmg = evaluateChallenges(
  generateFloorChallenges(1, 0),
  { victory: true, totalDamageTaken: 0, rounds: 3, critCount: 6 }
);
const clearCompleted = evalNoDmg.filter(c => c.completed).length;
assert(clearCompleted >= 1, '至少1星完成');

// Test 5: Count stars
const stars = countStars(evaluated);
assert(stars >= 1, '至少1星');

// Test 6: Set and get floor data
setFloorStarData(1, 0, evaluated);
const data = getFloorStarData(1, 0);
assert(data !== null, '有楼层数据');
assert(data.stars >= 1, '记录星数');

// Test 7: Total stars
const total = getTotalStars();
assert(total >= 1, '总星数>=1');

// Test 8: Multiple floors
for (let f = 1; f < 6; f++) {
  const chs = generateFloorChallenges(1, f);
  chs[0].completed = true; // 至少通关
  if (f % 2 === 0) chs[1].completed = true; // 偶数层多1星
  setFloorStarData(1, f, chs);
}
assert(getTotalStars() >= 6, '多层累积星数');

// Test 9: Milestones
initStarChallenge();
for (let i = 0; i < 5; i++) {
  const chs = [{ completed: true }, { completed: true }, { completed: true }];
  setFloorStarData(1, i, chs);
}
assert(getTotalStars() === 15, '5×3=15星');
const milestones = getAvailableMilestones();
assert(milestones.length >= 2, '至少2个里程碑可领 (5星和15星)');

// Test 10: Claim milestone
const reward = claimMilestone(5);
assert(reward !== null, '5星奖励');
assert(reward.gold === 200, '200金币');
const again = claimMilestone(5);
assert(again === null, '不能重复领取');

// Test 11: Render HUD
const challenges = generateFloorChallenges(3, 2);
challenges[0].completed = true;
const hud = renderFloorChallengeHUD(challenges);
assert(hud.includes('★'), 'HUD包含完成星');
assert(hud.includes('☆'), 'HUD包含未完成星');

// Test 12: Render overview
const overview = renderStarOverview();
assert(overview.includes(String(getTotalStars())), '总览包含总星数');

// Test 13: Challenge types
assert(Object.keys(CHALLENGE_TYPES).length >= 12, '至少12种挑战类型');

// Test 14: Milestones defined
assert(STAR_MILESTONES.length >= 8, '至少8个里程碑');
assert(STAR_MILESTONES[STAR_MILESTONES.length - 1].stars === 216, '最高216星 (72层×3)');

// Test 15: Serialize/Deserialize
const serialized = serializeStarChallenge();
assert(serialized.data !== undefined, '序列化数据');
assert(serialized.claimed.length >= 1, '序列化已领取');

initStarChallenge();
assert(getTotalStars() === 0, '重置后0星');
deserializeStarChallenge(serialized);
assert(getTotalStars() > 0, '反序列化后恢复星数');

console.log('');
console.log('══════════════════════════════════════════');
console.log(`星级挑战系统测试: ${passed}通过, ${failed}失败`);
if (failed === 0) console.log('✅ 全部通过');
else { console.log('❌ 存在失败'); process.exit(1); }
