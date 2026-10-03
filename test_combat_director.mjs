import {
  initDirector, stopDirector, directorOnRound, directorOnDamage,
  directorOnChainReaction, directorOnBossPhase, directorOnDefend,
  directorOnVictory, directorOnDefeat, getTension, getMomentum,
  renderBattleSummaryPanel, getDirectorState,
} from './src/core/CombatDirector.js';

let passed = 0, failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('FAIL:', msg); }
}

console.log('[ 战斗导演系统 ]');

// Test 1: Init
initDirector(false);
assert(getDirectorState().active, '导演激活');
assert(getDirectorState().isBoss === false, '非Boss战');

// Test 2: Round events - normal
const r1 = directorOnRound(1, 100, 100, 80, 100);
assert(Array.isArray(r1), '返回事件数组');
assert(getTension() >= 0, '紧张度非负');

// Test 3: Low HP warning
const r2 = directorOnRound(5, 20, 100, 50, 100);
assert(r2.some(e => e.type === 'danger_warning'), '低血量警告');
assert(getTension() > 30, '低血量时紧张度升高');

// Test 4: Damage tracking
const d1 = directorOnDamage('player', 'enemy', 50, false, false);
assert(getDirectorState().totalDmgDealt === 50, '玩家输出记录');
const d2 = directorOnDamage('player', 'enemy', 80, true, false);
assert(getDirectorState().maxSingleHit === 80, '最高伤害');
assert(d2.some(e => e.type === 'max_hit'), '最高伤害事件');

// Test 5: Crit chain
initDirector(false);
directorOnDamage('player', 'enemy', 30, true, false);
directorOnRound(1, 80, 100, 70, 100);
directorOnDamage('player', 'enemy', 30, true, false);
directorOnRound(2, 80, 100, 50, 100);
const d3 = directorOnDamage('player', 'enemy', 30, true, false);
assert(d3.some(e => e.type === 'crit_chain'), '3连暴击事件');

// Test 6: Chain reaction tracking
initDirector(false);
const cr = directorOnChainReaction({ name: '蒸汽爆裂' });
assert(getDirectorState().chainReactions === 1, '连锁计数');
directorOnChainReaction({ name: '毒焰' });
const cr3 = directorOnChainReaction({ name: '雷暴' });
assert(cr3.some(e => e.type === 'chain_master'), '连锁大师事件');

// Test 7: Boss phase change
initDirector(true);
assert(getDirectorState().isBoss, 'Boss战标记');
const bp = directorOnBossPhase(1, '突变');
assert(bp.some(e => e.type === 'boss_phase'), 'Boss阶段事件');
assert(bp[0].text.includes('突变'), '阶段名称');

// Test 8: Defend tracking
initDirector(false);
directorOnDefend();
directorOnDefend();
assert(getDirectorState().turnsDefended === 2, '防御回合记录');

// Test 9: Victory summary
initDirector(false);
directorOnDamage('player', 'enemy', 200, true, false);
directorOnDamage('player', 'enemy', 100, false, true);
directorOnDamage('enemy', 'player', 50, false, false);
const victory = directorOnVictory(5);
assert(victory.length === 1, '一条总结');
assert(victory[0].type === 'battle_summary', '总结类型');
assert(victory[0].rating !== undefined, '有评级');
assert(victory[0].stats.totalDmgDealt === 300, '总输出300');
assert(victory[0].stats.totalDmgTaken === 50, '总承伤50');
assert(victory[0].narrative.length > 0, '有叙事文本');

// Test 10: Defeat summary
initDirector(false);
directorOnDamage('enemy', 'player', 100, false, false);
const defeat = directorOnDefeat(8);
assert(defeat[0].rating === 'D', '战败D评级');

// Test 11: Comeback detection
initDirector(false);
directorOnRound(1, 15, 100, 80, 100); // Low HP (playerLowHpRounds=1)
directorOnRound(2, 12, 100, 60, 100); // Still low (=2)
directorOnRound(3, 10, 100, 40, 100); // Very low (=3)
// Round 4: HP recovers → comebackActive=true, then comeback triggers immediately
const comeback = directorOnRound(4, 60, 100, 20, 100);
assert(comeback.some(e => e.type === 'comeback'), '逆转事件');

// Test 12: Boss low HP
initDirector(true);
const bossLow = directorOnRound(8, 50, 100, 10, 100);
assert(bossLow.some(e => e.type === 'boss_low_hp'), 'Boss低血量事件');

// Test 13: Rating calculation
initDirector(false);
directorOnDamage('player', 'enemy', 500, true, false);
directorOnDamage('enemy', 'player', 50, false, false);
const ssVic = directorOnVictory(3);
assert(ssVic[0].rating === 'SS', 'SS评级 (高伤害比+速杀)');

// Test 14: Render summary
const panel = renderBattleSummaryPanel(ssVic[0]);
assert(panel.includes('SS'), '面板包含评级');
assert(panel.includes('完美碾压'), '面板包含评价');

// Test 15: Tags generation
initDirector(false);
directorOnDamage('player', 'enemy', 300, true, false);
directorOnDamage('player', 'enemy', 300, true, true);
directorOnDamage('player', 'enemy', 300, true, true);
directorOnDamage('player', 'enemy', 300, true, true);
directorOnDamage('player', 'enemy', 300, true, true);
directorOnDefend();
directorOnDefend();
directorOnDefend();
directorOnChainReaction({ name: 'test' });
const richVic = directorOnVictory(2);
assert(richVic[0].tags.length > 0, '有战斗标签');

// Test 16: Stop director
stopDirector();
assert(!getDirectorState().active, '导演停止');

console.log('');
console.log('══════════════════════════════════════════');
console.log(`战斗导演系统测试: ${passed}通过, ${failed}失败`);
if (failed === 0) console.log('✅ 全部通过');
else { console.log('❌ 存在失败'); process.exit(1); }
