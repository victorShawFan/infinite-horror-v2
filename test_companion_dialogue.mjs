// ═══════════════════════════════════════════════════════════════
// 同伴战斗对话系统 — 单元测试
// ═══════════════════════════════════════════════════════════════

import {
  getCompanionCombatLine,
  getVictoryComment,
  generateCombatDialogue,
} from './src/core/CompanionDialogue.js';

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; } else { fail++; console.error(`  ✗ FAIL: ${msg}`); }
}

console.log('\n╔══════════════════════════════════════════╗');
console.log('║   同伴战斗对话系统测试                   ║');
console.log('╚══════════════════════════════════════════╝\n');

// ── 1. 不同关系等级返回不同风格台词 ──
console.log('▸ 关系等级台词');
const neutralLine = getCompanionCombatLine('zhang_jie', 0);
assert(neutralLine === null || typeof neutralLine === 'string', '中立等级返回字符串或null');

const friendlyLine = getCompanionCombatLine('zhang_jie', 30);
assert(typeof friendlyLine === 'string' && friendlyLine.length > 0, '友好等级返回非空字符串');

const bondLine = getCompanionCombatLine('zhang_jie', 85);
assert(typeof bondLine === 'string' && bondLine.length > 5, '羁绊等级返回长台词');

// ── 2. 不同同伴都有台词 ──
console.log('▸ 同伴覆盖');
const companions = ['zhang_jie', 'zhan_lan', 'chuxuan', 'li_xiaoyi', 'mou_gang', 'lingdian', 'bawang', 'lishuaixi'];
for (const id of companions) {
  const line = getCompanionCombatLine(id, 50); // 亲密
  assert(typeof line === 'string', `${id} 亲密等级有台词`);
}

// ── 3. 敌对等级可能返回null ──
console.log('▸ 敌对等级');
const hostileLine = getCompanionCombatLine('zhang_jie', -80);
assert(hostileLine === null || typeof hostileLine === 'string', '敌对等级返回null或字符串');

// ── 4. 胜利评语 ──
console.log('▸ 胜利评语');
assert(typeof getVictoryComment(true, true) === 'string', 'Boss险胜有评语');
assert(typeof getVictoryComment(true, false) === 'string', 'Boss完胜有评语');
assert(typeof getVictoryComment(false, true) === 'string', '普通险胜有评语');
assert(typeof getVictoryComment(false, false) === 'string', '普通轻松有评语');

// ── 5. 对话生成 ──
console.log('▸ 对话生成');
const testCompanions = [
  { id: 'zhang_jie', name: '张杰', alive: true },
  { id: 'zhan_lan', name: '詹岚', alive: true },
  { id: 'chuxuan', name: '楚轩', alive: false },
];
const testRels = { zhang_jie: 60, zhan_lan: 80, chuxuan: 40 };

// Run multiple times to account for randomness
let gotDialogue = false;
for (let i = 0; i < 20; i++) {
  const logs = generateCombatDialogue(testCompanions, testRels, 'start');
  if (logs.length > 0) gotDialogue = true;
  // Dead companions shouldn't speak
  const deadSpoke = logs.some(l => l.text.includes('楚轩'));
  assert(!deadSpoke, `第${i+1}次: 阵亡同伴不说话`);
}
assert(gotDialogue, '20次中至少有1次产生了对话');

// Empty companions
const empty = generateCombatDialogue([], {}, 'start');
assert(empty.length === 0, '无同伴时返回空数组');

// ── 6. 台词有情感色彩 ──
console.log('▸ 台词情感层次');
const neutralZL = getCompanionCombatLine('zhan_lan', 0);
const bondZL = getCompanionCombatLine('zhan_lan', 90);
// 羁绊台词应该比中立台词长
if (neutralZL && bondZL) {
  assert(bondZL.length > neutralZL.length, '羁绊台词比中立台词更丰富');
}

// ── 结果 ──
console.log(`\n══════════════════════════════════════════`);
console.log(`${pass + fail} 项测试: ${pass} 通过, ${fail} 失败`);
if (fail > 0) { console.error('❌ 存在失败测试'); process.exit(1); }
else console.log('✅ 同伴战斗对话系统全部通过');
