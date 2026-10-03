// ═══════════════════════════════════════════════════════════════
// 敌人情报系统测试
// ═══════════════════════════════════════════════════════════════

import {
  recordEncounter, recordKill, recordDiscovery,
  getIntelCombatBonus, getEnemyIntel, getAllIntel, getIntelStats,
  renderIntelPanel, getPreBattleIntelHTML,
  serializeIntel, deserializeIntel, resetIntel,
  INTEL_LEVEL,
} from './src/core/EnemyIntelSystem.js';

let passed = 0, failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.log('  ✗ ' + msg); }
}
function section(name) { console.log('[ ' + name + ' ]'); }

const mockEnemy = { id: 'zombie_soldier-1', name: '丧尸士兵', sprite: '🧟', hp: 50, atk: 10, def: 5, spd: 3, weaknesses: ['fire'], traits: ['slow'], damageType: 'physical' };
const mockBoss = { id: 'alien_queen-1', name: '异形女王', sprite: '👾', hp: 500, atk: 80, def: 40, spd: 8, weaknesses: ['fire', 'psychic'], traits: ['regen', 'summon'], bossId: 'alien_queen' };

// ── 初始化 ──
section('初始化');
resetIntel();
assert(getIntelStats().total === 0, '初始为空');

// ── 记录遭遇 ──
section('记录遭遇');
recordEncounter(mockEnemy);
assert(getIntelStats().total === 1, '记录1种');
const intel1 = getEnemyIntel(mockEnemy);
assert(intel1 !== null, '可查询');
assert(intel1.level === INTEL_LEVEL.UNKNOWN, '初始为未知');
assert(intel1.encounters === 1, '遭遇1次');

// 重复遭遇不重复创建
recordEncounter(mockEnemy);
assert(getIntelStats().total === 1, '不重复创建');
assert(getEnemyIntel(mockEnemy).encounters === 2, '遭遇2次');

// ── 记录击杀 ──
section('记录击杀');
recordKill(mockEnemy, { chapter: 1, rounds: 5, damageDealt: 100, damageTaken: 30 });
const intel2 = getEnemyIntel(mockEnemy);
assert(intel2.kills === 1, '击杀1次');
assert(intel2.level === INTEL_LEVEL.BASIC, '升级到初识');
assert(intel2.snapshot !== null, '有属性快照');
assert(intel2.snapshot.hp === 50, '快照HP正确');

// ── 情报发现 ──
section('情报发现');
recordDiscovery(mockEnemy, 'stats', '属性已确认');
assert(intel2.discoveredStats === true, '属性已发现');

recordKill(mockEnemy, { chapter: 1, rounds: 4 });
recordDiscovery(mockEnemy, 'weakness', '火焰攻击效果极佳');
const intel3 = getEnemyIntel(mockEnemy);
assert(intel3.level === INTEL_LEVEL.FAMILIAR, '升级到熟悉');
assert(intel3.discoveredWeakness === true, '弱点已发现');

// ── 精通等级 ──
section('精通等级');
recordKill(mockEnemy, { chapter: 2, rounds: 3 });
recordDiscovery(mockEnemy, 'pattern', '攻击模式规律');
const intel4 = getEnemyIntel(mockEnemy);
assert(intel4.level === INTEL_LEVEL.MASTERED, '升级到精通');
assert(intel4.kills === 3, '击杀3次');
assert(intel4.bestTime === 3, '最快3回合');

// ── 战斗加成 ──
section('战斗加成');
const bonus0 = getIntelCombatBonus({ name: 'unknown_entity' });
assert(bonus0.dmgBonus === 0, '未知敌人无加成');

const bonus3 = getIntelCombatBonus(mockEnemy);
assert(bonus3.dmgBonus === 0.08, '精通加成8%');
assert(bonus3.defBonus === 0.05, '精通减伤5%');
assert(bonus3.label !== null, '有标签');

// ── Boss情报 ──
section('Boss情报');
recordEncounter(mockBoss);
recordKill(mockBoss, { chapter: 2, rounds: 15 });
const bossIntel = getEnemyIntel(mockBoss);
assert(bossIntel.level === INTEL_LEVEL.BASIC, 'Boss首杀为初识');

// ── 统计 ──
section('统计');
const stats = getIntelStats();
assert(stats.total === 2, '总计2种');
assert(stats.mastered === 1, '精通1种');
assert(stats.basic === 1, '初识1种');

// ── 渲染 ──
section('渲染');
const html = renderIntelPanel();
assert(html.includes('敌人情报图鉴'), '包含标题');
assert(html.includes('丧尸士兵'), '包含敌人名');
assert(html.includes('精通'), '包含精通等级');

const preHtml = getPreBattleIntelHTML(mockEnemy);
assert(preHtml.includes('★★★'), '预战显示精通');

const unknownHtml = getPreBattleIntelHTML({ name: 'new_enemy' });
assert(unknownHtml.includes('未知'), '预战显示未知');

// ── 序列化 ──
section('序列化');
const ser = serializeIntel();
assert(ser.db !== undefined, '有数据库');

resetIntel();
assert(getIntelStats().total === 0, '重置后为空');

deserializeIntel(ser);
assert(getIntelStats().total === 2, '反序列化恢复2种');
assert(getEnemyIntel(mockEnemy).level === INTEL_LEVEL.MASTERED, '精通等级保留');

// ── 空面板 ──
section('空面板');
resetIntel();
const emptyHtml = renderIntelPanel();
assert(emptyHtml.includes('尚未收集'), '空面板提示');

// ── 总结 ──
console.log();
console.log('══════════════════════════════════════════');
console.log(`敌人情报测试: ${passed}通过, ${failed}失败`);
if (failed === 0) console.log('✅ 敌人情报系统全部通过');
else { console.log('❌ 有失败'); process.exit(1); }
