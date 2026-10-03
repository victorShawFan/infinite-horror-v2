import {
  getChapterEnvironment, checkEnvironmentHazard, applyEnvironmentEffect,
  clearEnvironmentEffects, renderEnvironmentInfo, getFloorNarrative,
  CHAPTER_ENVIRONMENTS,
} from './src/core/EnvironmentHazards.js';

let passed = 0, failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('FAIL:', msg); }
}

console.log('[ 环境危害系统 ]');

// Test 1: All 12 chapters have environments
for (let ch = 1; ch <= 12; ch++) {
  const env = getChapterEnvironment(ch);
  assert(env !== undefined, `第${ch}章有环境定义`);
  assert(env.name && env.name.length > 0, `第${ch}章有名称`);
  assert(env.hazards.length >= 2, `第${ch}章至少2种危害`);
  assert(env.narrative.length > 0, `第${ch}章有叙事`);
  assert(env.ambient !== undefined, `第${ch}章有氛围参数`);
}

// Test 2: Hazard structure
const ch1 = getChapterEnvironment(1);
assert(ch1.name === '拉昆市废墟', '第1章名称');
assert(ch1.hazards[0].id === 'toxic_gas', '毒气危害');
assert(ch1.hazards[0].effect.hpLossPerTurn === 2, '毒气每回合2伤害');

// Test 3: Apply hazard effect
const player = { hp: 100, maxHp: 100, atk: 20, def: 10, spd: 5, crt: 10 };
const hazard = ch1.hazards[0]; // toxic_gas
const changes = applyEnvironmentEffect(hazard, player);
assert(changes.length > 0, '有变化');
assert(player.hp < 100, 'HP减少');

// Test 4: Speed penalty
const ch4 = getChapterEnvironment(4);
const swamp = ch4.hazards[0]; // swamp
const player2 = { hp: 100, maxHp: 100, spd: 10 };
applyEnvironmentEffect(swamp, player2);
assert(player2._envSpd === -4, '沼泽SPD-4');

// Test 5: Clear effects
clearEnvironmentEffects(player2);
assert(player2._envSpd === undefined, '清除环境效果');

// Test 6: Render info
const info = renderEnvironmentInfo(5);
assert(info.includes('竖锯迷宫'), '渲染包含迷宫名');
assert(info.includes('绊线'), '渲染包含危害名');

// Test 7: Floor narratives
const narr1 = getFloorNarrative(1, 0);
assert(narr1.length > 0, '第1章楼层叙事');
assert(narr1.includes('铁门') || narr1.includes('腐'), '第1章叙事内容');

const narr5 = getFloorNarrative(5, 3);
assert(narr5.includes('猪头') || narr5.includes('镜子') || narr5.includes('电视'), '第5章叙事');

const narr12 = getFloorNarrative(12, 4);
assert(narr12.includes('最后') || narr12.includes('轮回') || narr12.includes('终焉') || narr12.includes('所有'), '第12章叙事');

// Test 8: All chapters have floor narratives
for (let ch = 1; ch <= 12; ch++) {
  const narr = getFloorNarrative(ch, 0);
  assert(narr && narr.length > 0, `第${ch}章有楼层叙事`);
}

// Test 9: Special chapter environments
const ch10 = getChapterEnvironment(10);
assert(ch10.name === '矩阵', '第10章矩阵');
assert(ch10.hazards.some(h => h.id === 'bullet_time'), '子弹时间危害');

const ch12 = getChapterEnvironment(12);
assert(ch12.name === '终焉之地', '第12章终焉之地');
assert(ch12.ambient.darkness > 0.5, '终焉高黑暗度');

console.log('');
console.log('══════════════════════════════════════════');
console.log(`环境危害系统测试: ${passed}通过, ${failed}失败`);
if (failed === 0) console.log('✅ 全部通过');
else { console.log('❌ 存在失败'); process.exit(1); }
