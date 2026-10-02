// ═══════════════════════════════════════════════════════════════
// 关系系统全流程演进测试 — 模拟12章游戏中的关系变化
// ═══════════════════════════════════════════════════════════════

import { changeRelationship, getRelationshipLevel, getRelationshipSummary, COMPANION_PROFILES } from './src/core/RelationshipSystem.js';
import { getCompanionCombatLine, generateCombatDialogue } from './src/core/CompanionDialogue.js';

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; } else { fail++; console.error(`  ✗ FAIL: ${msg}`); }
}

console.log('\n╔══════════════════════════════════════════╗');
console.log('║   关系系统全流程演进测试                 ║');
console.log('╚══════════════════════════════════════════╝\n');

// 模拟12章关系变化
const rels = {};

// ── Ch1: 初始队友加入 ──
console.log('▸ 第1章: 初始队友');
changeRelationship('zhang_jie', 'good_decision', rels);
changeRelationship('zhang_jie', 'share_item', rels);
changeRelationship('zhan_lan', 'share_item', rels);
changeRelationship('li_xiaoyi', 'share_item', rels);
changeRelationship('mou_gang', 'share_item', rels);
assert(rels.zhang_jie === 15, '张杰初始好感=15');
assert(rels.zhan_lan === 5, '詹岚初始好感=5');

// 第1章战斗 (约15场)
for (let i = 0; i < 15; i++) {
  changeRelationship('zhang_jie', 'fight_together', rels);
  changeRelationship('zhan_lan', 'fight_together', rels);
  changeRelationship('li_xiaoyi', 'fight_together', rels);
  changeRelationship('mou_gang', 'fight_together', rels);
}
assert(getRelationshipLevel(rels.zhang_jie).name === '亲密', 'Ch1后张杰达到亲密');
assert(getRelationshipLevel(rels.zhan_lan).name === '亲密', 'Ch1后詹岚达到亲密');

// ── Ch2: 楚轩加入 + 选择 ──
console.log('▸ 第2章: 楚轩加入');
changeRelationship('chuxuan', 'honest_talk', rels);
changeRelationship('chuxuan', 'good_decision', rels); // 上路选择
for (let i = 0; i < 17; i++) {
  for (const id of ['zhang_jie', 'zhan_lan', 'li_xiaoyi', 'mou_gang', 'chuxuan']) {
    changeRelationship(id, 'fight_together', rels);
  }
}
assert(rels.chuxuan > 30, '楚轩Ch2后好感>30');

// ── Ch3-4: 持续战斗 ──
console.log('▸ 第3-4章: 深入探索');
for (let ch = 0; ch < 2; ch++) {
  for (let i = 0; i < 15; i++) {
    for (const id of ['zhang_jie', 'zhan_lan', 'li_xiaoyi', 'mou_gang', 'chuxuan']) {
      changeRelationship(id, 'fight_together', rels);
    }
  }
}

// ── Ch5: 张杰牺牲 ──
console.log('▸ 第5章: 张杰牺牲');
changeRelationship('zhang_jie', 'save_life', rels); // 张杰的请求选择
changeRelationship('zhang_jie', 'sacrifice', rels);  // 张杰阵亡
assert(rels.zhang_jie === 100, '张杰牺牲后达到上限100');
assert(getRelationshipLevel(rels.zhang_jie).name === '羁绊', '张杰达到羁绊');

// ── Ch7: 团灭+詹岚牺牲 ──
console.log('▸ 第7章: 团灭事件');
// 断后选择（自己断后）
changeRelationship('zhan_lan', 'save_life', rels);
changeRelationship('zhan_lan', 'sacrifice', rels); // 詹岚牺牲
assert(rels.zhan_lan === 100, '詹岚牺牲后达到上限');

// ── Ch8-9: 复活+新战斗 ──
console.log('▸ 第8-9章: 复活与重建');
changeRelationship('chuxuan', 'save_life', rels); // 楚轩复活
changeRelationship('lingdian', 'honest_talk', rels);
changeRelationship('lingdian', 'save_life', rels); // 零点复活
for (let i = 0; i < 20; i++) {
  for (const id of ['chuxuan', 'lingdian', 'bawang']) {
    changeRelationship(id, 'fight_together', rels);
  }
}

// ── 最终状态验证 ──
console.log('\n▸ 最终关系状态');
const summary = getRelationshipSummary(rels);
const bondCount = summary.filter(r => r.value >= 71).length;
const friendCount = summary.filter(r => r.value >= 11 && r.value < 71).length;

console.log(`  羁绊: ${bondCount}, 友好以上: ${friendCount}`);
for (const r of summary) {
  console.log(`  ${r.name}: ${r.value} (${r.level}) ${r.value >= 71 ? '✦' : ''}`);
}

assert(bondCount >= 2, '至少2个羁绊同伴(张杰+詹岚)');
assert(summary.every(r => r.value >= -100 && r.value <= 100), '所有值在合法范围内');

// ── 对话测试 ──
console.log('\n▸ 对话系统与关系联动');
for (const r of summary) {
  const line = getCompanionCombatLine(r.id, r.value);
  if (r.value >= 71) {
    assert(line !== null, `${r.name}(羁绊)有战斗台词`);
    assert(line.length > 10, `${r.name}(羁绊)台词够长`);
  }
}

// ── 结果 ──
console.log(`\n══════════════════════════════════════════`);
console.log(`${pass + fail} 项测试: ${pass} 通过, ${fail} 失败`);
if (fail > 0) { console.error('❌ 存在失败测试'); process.exit(1); }
else console.log('✅ 关系系统全流程演进测试通过');
