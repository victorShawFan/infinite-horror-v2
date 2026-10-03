// ═══════════════════════════════════════════════════════════════
// 集成接线验证 — 确认所有系统运行时真正互联互通
// ═══════════════════════════════════════════════════════════════

import { gameState } from './src/core/GameState.js';
import { executeBattle } from './src/core/CombatSystem.js';
import { autoAnnounce } from './src/core/CombatAnnouncer.js';
import { recordEncounter, recordKill, getEnemyIntel } from './src/core/EnemyIntelSystem.js';
import { addSyncGauge, getSyncGauge, resetSyncGauge } from './src/core/SyncAttack.js';
import { initFloorMastery, recordFloorKill, calculateFloorStars, getFloorMasteryRewards } from './src/core/FloorMastery.js';
import { addJournalEntry, triggerChapterCompleteJournal } from './src/core/StoryJournal.js';
import { renderProgressDashboard } from './src/core/ProgressDashboard.js';

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.error('FAIL:', msg); } }

// ── Setup ──
gameState.player = {
  hp: 300, maxHp: 300, atk: 80, def: 40, crt: 15, spd: 8,
  mana: 50, maxMana: 50, level: 5, gold: 500, exp: 0,
  geneLock: 0, geneLockCharge: 0, geneLockActive: false,
  chips: [], inventory: [], companions: [], talents: {},
  rewardPoints: 100, activeBloodline: null, expToNext: 200,
};
gameState.stats = {
  enemiesKilled: 0, bossesKilled: 0, damageDealt: 0, goldEarned: 0,
  floorsCleared: 0, deathCount: 0, chaptersCleared: 0,
  criticalHits: 0, startTime: Date.now(), turnsPlayed: 0,
  stepsWalked: 0, consumablesUsed: 0, skillsUsed: 0,
};
gameState.companions = [];
gameState.relationships = {};
gameState.chapter = 1;

// ═══ 1. SyncAttack 集成 ═══
console.log('[ SyncAttack 集成 ]');
resetSyncGauge();
const sg0 = getSyncGauge();
ok(sg0.current === 0, 'resetSyncGauge 归零');
addSyncGauge(50, 'test');
const sg1 = getSyncGauge();
ok(sg1.current === 50, 'addSyncGauge 累加');
addSyncGauge(60, 'test2');
const sg2 = getSyncGauge();
ok(sg2.ready === true, '达到100阈值 ready');

// ═══ 2. EnemyIntel 集成 ═══
console.log('[ EnemyIntel 集成 ]');
const testEnemy = { name: '测试僵尸', type: 'enemy', hp: 100, atk: 20, def: 10 };
recordEncounter(testEnemy);
const intel1 = getEnemyIntel(testEnemy);
ok(intel1.encounters >= 1, 'recordEncounter 记录遭遇');
recordKill(testEnemy);
const intel2 = getEnemyIntel(testEnemy);
ok(intel2.kills >= 1, 'recordKill 记录击杀');

// ═══ 3. FloorMastery 集成 ═══
console.log('[ FloorMastery 集成 ]');
const testEntities = [
  { type: 'enemy', id: 'e1' },
  { type: 'enemy', id: 'e2' },
  { type: 'item', id: 'i1' },
  { type: 'event', id: 'ev1' },
];
initFloorMastery('test-floor', testEntities);
recordFloorKill('test-floor');
recordFloorKill('test-floor');
const stars1 = calculateFloorStars('test-floor');
ok(stars1 >= 1, '击杀全部后至少1星');

const rewards = getFloorMasteryRewards('test-floor', 1, true);
ok(rewards.exp > 0 || rewards.stars > 0, '精通有奖励');

// 重复领奖应返回0
const rewards2 = getFloorMasteryRewards('test-floor', 1, true);
ok(rewards2.exp === 0, '重复领奖返回0');

// ═══ 4. StoryJournal 集成 ═══
console.log('[ StoryJournal 集成 ]');
addJournalEntry('ch1_start');
addJournalEntry('ch1_first_battle');
triggerChapterCompleteJournal(1);
// Should not throw

// ═══ 5. CombatAnnouncer 集成 ═══
console.log('[ CombatAnnouncer 集成 ]');
const mockResult = {
  victory: true,
  rounds: 5,
  log: [
    { text: '攻击 → 造成 35 伤害', type: 'attack' },
    { text: '暴击！造成 70 伤害', type: 'critical' },
  ],
  critCount: 3,
  totalDamageDealt: 200,
  totalDamageTaken: 30,
};
// autoAnnounce should not throw
try { autoAnnounce(mockResult); ok(true, 'autoAnnounce 无抛出'); } catch (e) { ok(false, 'autoAnnounce 抛出: ' + e.message); }

// ═══ 6. ProgressDashboard 集成 ═══
console.log('[ ProgressDashboard 集成 ]');
const dashHtml = renderProgressDashboard();
ok(typeof dashHtml === 'string' && dashHtml.length > 100, '成长面板渲染HTML');
ok(dashHtml.includes('成 长 仪 表 盘'), '面板含标题');

// ═══ 7. Combat 执行 ═══
console.log('[ Combat 执行 ]');
resetSyncGauge();
const combatEnemy = { name: '弱化僵尸', hp: 50, atk: 5, def: 2, spd: 3 };
const result = await executeBattle(combatEnemy);
ok(result.victory === true, '战斗胜利');
ok(result.rounds >= 1, '至少1回合');
ok(result.log.length > 0, '战斗日志非空');

// ═══ 结果 ═══
console.log(`\n══════════════════════════════════════════`);
console.log(`集成接线验证: ${pass}通过, ${fail}失败`);
if (fail === 0) console.log('✅ 全部通过');
else { console.log(`⚠️  ${fail} 项需修复`); process.exit(1); }
