// ═══════════════════════════════════════════════════════════════
// 同伴战后反应系统测试
// ═══════════════════════════════════════════════════════════════
import { getCompanionReaction } from './src/core/CompanionBattleReaction.js';
import { gameState } from './src/core/GameState.js';

let passed = 0, failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('  ✗ FAIL:', msg); }
}
function section(name) { console.log(`[ ${name} ]`); }

// 初始化测试状态
gameState.player = { hp: 200, maxHp: 200, atk: 100, def: 50, level: 8, geneLock: 2 };
gameState.companions = [
  { id: 'chu_xuan', name: '楚轩', alive: true },
  { id: 'zhang_jie', name: '张杰', alive: true },
  { id: 'ling_dian', name: '零点', alive: true },
  { id: 'ba_wang', name: '霸王', alive: true },
];

// ═══════════════════════════════════════════
section('Boss战必触发');
let bossTriggered = 0;
for (let i = 0; i < 20; i++) {
  const r = getCompanionReaction(
    { victory: true, _isBoss: true, rounds: 10, totalDamageDealt: 500 },
    { grade: 'A', color: '#ffcc44' }
  );
  if (r) bossTriggered++;
}
assert(bossTriggered === 20, `Boss战20/20次触发: got ${bossTriggered}`);

// ═══════════════════════════════════════════
section('Boss反应包含角色信息');
const bossReaction = getCompanionReaction(
  { victory: true, _isBoss: true, rounds: 8 },
  { grade: 'S', color: '#ff8844' }
);
assert(bossReaction !== null, '有反应');
assert(typeof bossReaction.companionName === 'string', '有同伴名');
assert(typeof bossReaction.line === 'string', '有台词');
assert(bossReaction.line.includes('「'), '台词有书名号格式');
assert(['boss_victory', 'high_rating'].includes(bossReaction.reactionType), '反应类型正确: ' + bossReaction.reactionType);

// ═══════════════════════════════════════════
section('险胜反应');
gameState.player.hp = 15; // 低于15%
const closeReaction = getCompanionReaction(
  { victory: true, rounds: 12 },
  { grade: 'C', color: '#888' }
);
assert(closeReaction !== null, '险胜有反应');
assert(closeReaction.reactionType === 'close_call', '反应类型为close_call: ' + closeReaction.reactionType);
gameState.player.hp = 200; // 恢复

// ═══════════════════════════════════════════
section('高评级反应');
const highReaction = getCompanionReaction(
  { victory: true, rounds: 5 },
  { grade: 'SS', color: '#ff4444' }
);
assert(highReaction !== null, '高评级有反应');

// ═══════════════════════════════════════════
section('快速击杀反应');
const quickReaction = getCompanionReaction(
  { victory: true, rounds: 2 },
  { grade: 'B', color: '#4488ff' }
);
assert(quickReaction !== null, '快速击杀有反应');
assert(quickReaction.reactionType === 'quick_kill', '反应类型为quick_kill: ' + quickReaction.reactionType);

// ═══════════════════════════════════════════
section('失败不触发');
const defeatReaction = getCompanionReaction(
  { victory: false, rounds: 5 },
  null
);
assert(defeatReaction === null, '战败无反应');

// ═══════════════════════════════════════════
section('无同伴不触发');
gameState.companions = [];
const noCompReaction = getCompanionReaction(
  { victory: true, _isBoss: true, rounds: 5 },
  { grade: 'S', color: '#ff8844' }
);
assert(noCompReaction === null, '无同伴无反应');

// 恢复
gameState.companions = [
  { id: 'chu_xuan', name: '楚轩', alive: true },
  { id: 'zhao_yingkong', name: '赵樱空', alive: true },
  { id: 'cheng_xiao', name: '程啸', alive: true },
];

// ═══════════════════════════════════════════
section('多同伴随机选择');
const chosen = new Set();
for (let i = 0; i < 50; i++) {
  const r = getCompanionReaction(
    { victory: true, _isBoss: true, rounds: 8 },
    { grade: 'A', color: '#ffcc44' }
  );
  if (r) chosen.add(r.companionId);
}
assert(chosen.size >= 2, `应选中至少2名不同同伴: got ${chosen.size} (${[...chosen].join(',')})`);

console.log(`\n══════════════════════════════════════════`);
console.log(`同伴反应测试: ${passed}通过, ${failed}失败`);
if (failed === 0) console.log('✅ 同伴反应系统全部通过');
else { console.log('❌ 有失败'); process.exit(1); }
