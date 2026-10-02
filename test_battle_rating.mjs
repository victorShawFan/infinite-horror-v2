import { rateBattle, recordRating, getRatingStats, resetRatingStats, formatRatingHTML, GRADE_CONFIG } from './src/core/BattleRating.js';

let pass = 0, fail = 0;
function assert(cond, msg) { if (cond) pass++; else { fail++; console.error(`  ❌ ${msg}`); } }

console.log('══════════════════════════════════════════');
console.log(' 战斗评级系统测试');
console.log('══════════════════════════════════════════');

// ── 评级等级定义 ──
assert(GRADE_CONFIG.length === 5, '应有5个评级');
assert(GRADE_CONFIG[0].grade === 'S', '最高是S');
assert(GRADE_CONFIG[4].grade === 'D', '最低是D');

// ── S级: 满血快杀 ──
{
  const r = rateBattle(
    { victory: true, rounds: 2, log: [{ type: 'critical' }, { type: 'critical' }, { type: 'critical' }] },
    { hp: 200, maxHp: 200 }
  );
  assert(r.grade === 'S', '满血2回合3暴击应是S');
  assert(r.score >= 90, '分数>=90');
  assert(r.color === '#ffdd00', 'S级金色');
}

// ── A级: 高HP中等回合 ──
{
  const r = rateBattle(
    { victory: true, rounds: 5, log: [{ type: 'critical' }] },
    { hp: 170, maxHp: 200 }
  );
  assert(r.grade === 'B' || r.grade === 'A', '高HP中回合应是B或A');
}

// ── D级: 极低HP ──
{
  const r = rateBattle(
    { victory: true, rounds: 12, log: [] },
    { hp: 10, maxHp: 200 }
  );
  assert(r.grade === 'C' || r.grade === 'D', '低HP多回合应是C或D');
}

// ── 统计 ──
{
  resetRatingStats();
  recordRating({ grade: 'S', score: 95 });
  recordRating({ grade: 'A', score: 80 });
  recordRating({ grade: 'B', score: 60 });
  const stats = getRatingStats();
  assert(stats.total === 3, '应记录3场');
  assert(stats.S === 1, '1个S');
  assert(stats.avgScore === 78, '平均78分');
  assert(stats.bestGrade === 'S', '最佳S');
}

// ── HTML生成 ──
{
  const rating = { grade: 'S', color: '#ffdd00', glow: '#ffaa00', label: '完美作战', icon: '⭐', score: 95, hpPct: 100, rounds: 2, crits: 3 };
  const html = formatRatingHTML(rating);
  assert(html.includes('S'), 'HTML包含S');
  assert(html.includes('完美作战'), 'HTML包含标签');
  assert(html.includes('95'), 'HTML包含分数');
}

console.log('══════════════════════════════════════════');
console.log(`${pass + fail} 项测试: ${pass} 通过, ${fail} 失败`);
if (fail === 0) console.log('✅ 战斗评级系统全部通过');
else { console.log('❌ 有测试失败'); process.exit(1); }
