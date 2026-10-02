// ═══════════════════════════════════════════════════════════════
// 同伴关系与羁绊系统 — 单元测试
// ═══════════════════════════════════════════════════════════════

import {
  RELATIONSHIP_LEVELS,
  COMPANION_PROFILES,
  RELATIONSHIP_EVENTS,
  getRelationshipLevel,
  changeRelationship,
  getCompanionCombatBonus,
  getRelationshipSummary,
} from './src/core/RelationshipSystem.js';

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; process.stdout.write(`  ✓ ${msg}\n`); }
  else { fail++; process.stderr.write(`  ✗ FAIL: ${msg}\n`); }
}

console.log('\n╔══════════════════════════════════════════╗');
console.log('║   同伴关系系统测试                       ║');
console.log('╚══════════════════════════════════════════╝\n');

// ── 1. 关系等级查询 ──
console.log('▸ 关系等级查询');
assert(getRelationshipLevel(0).name === '中立', '0 → 中立');
assert(getRelationshipLevel(-100).name === '敌对', '-100 → 敌对');
assert(getRelationshipLevel(-51).name === '敌对', '-51 → 敌对');
assert(getRelationshipLevel(-50).name === '疏远', '-50 → 疏远');
assert(getRelationshipLevel(-11).name === '疏远', '-11 → 疏远');
assert(getRelationshipLevel(-10).name === '中立', '-10 → 中立');
assert(getRelationshipLevel(10).name === '中立', '10 → 中立');
assert(getRelationshipLevel(11).name === '友好', '11 → 友好');
assert(getRelationshipLevel(40).name === '友好', '40 → 友好');
assert(getRelationshipLevel(41).name === '亲密', '41 → 亲密');
assert(getRelationshipLevel(70).name === '亲密', '70 → 亲密');
assert(getRelationshipLevel(71).name === '羁绊', '71 → 羁绊');
assert(getRelationshipLevel(100).name === '羁绊', '100 → 羁绊');

// ── 2. 关系变更 ──
console.log('\n▸ 关系变更');
let rels = {};
const r1 = changeRelationship('zhang_jie', 'fight_together', rels);
assert(r1.newValue === 3, '并肩作战+3');
assert(r1.levelChanged === false, '等级未变');
assert(rels.zhang_jie === 3, '关系值持久化');

const r2 = changeRelationship('zhang_jie', 'save_life', rels);
assert(r2.newValue === 23, '救命后=23');
assert(r2.levelChanged === true, '升级到友好');
assert(r2.newLevelName === '友好', '等级名=友好');

// ── 3. 负面事件 ──
console.log('\n▸ 负面关系事件');
let rels2 = { chuxuan: 30 };
const r3 = changeRelationship('chuxuan', 'betray', rels2);
assert(r3.newValue === -10, '背叛：30-40=-10');
assert(r3.newLevelName === '中立', '从友好降到中立');
assert(r3.levelChanged === true, '等级变化');

// ── 4. 上下限夹紧 ──
console.log('\n▸ 值域夹紧');
let rels3 = { bawang: 95 };
changeRelationship('bawang', 'sacrifice', rels3);  // +30
assert(rels3.bawang === 100, '上限100');

let rels4 = { lingdian: -90 };
changeRelationship('lingdian', 'betray', rels4);  // -40
assert(rels4.lingdian === -100, '下限-100');

// ── 5. 无效事件 ──
console.log('\n▸ 无效事件');
const r5 = changeRelationship('zhang_jie', 'nonexistent_event', {});
assert(r5 === null, '无效事件返回null');

// ── 6. 战斗加成 ──
console.log('\n▸ 战斗加成');
assert(getCompanionCombatBonus('zhang_jie', { zhang_jie: 0 }) === 0, '中立=0加成');
assert(getCompanionCombatBonus('zhang_jie', { zhang_jie: 80 }) === 0.15, '羁绊=15%加成');
assert(getCompanionCombatBonus('zhang_jie', { zhang_jie: -60 }) === -0.10, '敌对=-10%加成');
assert(getCompanionCombatBonus('zhang_jie', { zhang_jie: 30 }) === 0.05, '友好=5%加成');
assert(getCompanionCombatBonus('zhang_jie', { zhang_jie: 50 }) === 0.10, '亲密=10%加成');
assert(getCompanionCombatBonus('unknown', {}) === 0, '未知同伴=0加成');

// ── 7. 角色档案完整性 ──
console.log('\n▸ 角色档案完整性');
const expectedProfiles = ['zhang_jie', 'zhan_lan', 'chuxuan', 'li_xiaoyi', 'mou_gang', 'lingdian', 'bawang', 'lishuaixi'];
for (const id of expectedProfiles) {
  const p = COMPANION_PROFILES[id];
  assert(p && p.name && p.title && p.personality && p.quote && p.memoir, `${id} 档案完整`);
}

// ── 8. 关系事件配置完整性 ──
console.log('\n▸ 关系事件配置');
const positiveEvents = ['save_life', 'share_item', 'good_decision', 'protect_weak', 'honest_talk', 'fight_together', 'sacrifice'];
const negativeEvents = ['abandon', 'selfish', 'lie', 'reckless', 'ignore', 'betray'];
for (const e of positiveEvents) {
  assert(RELATIONSHIP_EVENTS[e]?.value > 0, `${e} 是正面事件`);
}
for (const e of negativeEvents) {
  assert(RELATIONSHIP_EVENTS[e]?.value < 0, `${e} 是负面事件`);
}

// ── 9. 关系摘要 ──
console.log('\n▸ 关系摘要');
const testRels = { zhang_jie: 50, chuxuan: -20, zhan_lan: 80 };
const summary = getRelationshipSummary(testRels);
assert(summary.length === 3, '摘要包含3人');
const zjSummary = summary.find(s => s.id === 'zhang_jie');
assert(zjSummary.name === '张杰', '张杰名字正确');
assert(zjSummary.level === '亲密', '张杰等级=亲密');
assert(zjSummary.combatBonus === 0.10, '张杰战斗加成=10%');
assert(zjSummary.quote.includes('活着回去'), '张杰名言存在');

const cxSummary = summary.find(s => s.id === 'chuxuan');
assert(cxSummary.level === '疏远', '楚轩等级=疏远');

const zlSummary = summary.find(s => s.id === 'zhan_lan');
assert(zlSummary.level === '羁绊', '詹岚等级=羁绊');

// ── 10. 多步关系演进 ──
console.log('\n▸ 多步关系演进（模拟游戏进程）');
let gameRels = {};
// 开始：初始好感
changeRelationship('zhang_jie', 'good_decision', gameRels);
changeRelationship('zhang_jie', 'share_item', gameRels);
assert(gameRels.zhang_jie === 15, '初始好感=15');
assert(getRelationshipLevel(gameRels.zhang_jie).name === '友好', '初始为友好');

// 并肩作战10次
for (let i = 0; i < 10; i++) {
  changeRelationship('zhang_jie', 'fight_together', gameRels);
}
assert(gameRels.zhang_jie === 45, '10次战斗后=45');
assert(getRelationshipLevel(gameRels.zhang_jie).name === '亲密', '升级到亲密');

// 牺牲 → 羁绊
changeRelationship('zhang_jie', 'sacrifice', gameRels);
assert(gameRels.zhang_jie === 75, '牺牲后=75');
assert(getRelationshipLevel(gameRels.zhang_jie).name === '羁绊', '牺牲后达到羁绊');

// ── 11. 关系等级覆盖率 ──
console.log('\n▸ 关系等级全覆盖');
assert(RELATIONSHIP_LEVELS.length === 6, '共6个关系等级');
const levels = RELATIONSHIP_LEVELS.map(l => l.name);
assert(levels.includes('敌对'), '包含敌对');
assert(levels.includes('疏远'), '包含疏远');
assert(levels.includes('中立'), '包含中立');
assert(levels.includes('友好'), '包含友好');
assert(levels.includes('亲密'), '包含亲密');
assert(levels.includes('羁绊'), '包含羁绊');

// 等级区间连续性
for (let v = -100; v <= 100; v++) {
  const level = getRelationshipLevel(v);
  if (!level) { fail++; console.error(`  ✗ 值${v}无对应等级`); break; }
}
pass++;
console.log('  ✓ -100~100 每个值都有对应等级');

// ── 结果 ──
console.log('\n══════════════════════════════════════════');
console.log(`${pass + fail} 项测试: ${pass} 通过, ${fail} 失败`);
if (fail > 0) { console.error('❌ 存在失败测试'); process.exit(1); }
else console.log('✅ 同伴关系系统全部通过');
