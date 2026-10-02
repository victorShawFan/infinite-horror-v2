/**
 * test_difficulty_bestiary.mjs — 难度系统 + 怪物图鉴专项测试
 */
import {
  DIFFICULTY, DIFFICULTY_CONFIG, ENEMY_AFFIXES,
  setDifficulty, getDifficulty, getDifficultyConfig,
  applyDifficultyScaling, bestiary, formatBestiaryPanel,
  formatDifficultySelector
} from './src/core/DifficultySystem.js';

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; console.log(`  ✓ ${msg}`); }
  else { fail++; console.error(`  ✗ ${msg}`); }
}

console.log('═══ 难度系统 + 怪物图鉴测试 ═══\n');

// ── 难度配置完整性 ──
console.log('[ 难度配置 ]');
const diffs = Object.keys(DIFFICULTY);
assert(diffs.length === 4, `4档难度 (${diffs.length})`);
for (const d of Object.values(DIFFICULTY)) {
  const cfg = DIFFICULTY_CONFIG[d];
  assert(cfg, `${d}: 配置存在`);
  assert(typeof cfg.name === 'string', `${d}: name`);
  assert(typeof cfg.enemyHpMult === 'number', `${d}: enemyHpMult`);
  assert(typeof cfg.expMult === 'number', `${d}: expMult`);
}

// ── 切换难度 ──
console.log('\n[ 难度切换 ]');
assert(setDifficulty(DIFFICULTY.HARD) === true, '切换到困难');
assert(getDifficulty() === DIFFICULTY.HARD, '当前为困难');
assert(getDifficultyConfig().name === '困难', '配置为困难');
assert(setDifficulty('invalid_diff') === false, '无效难度返回false');

// ── 难度缩放 ──
console.log('\n[ 难度缩放 ]');
setDifficulty(DIFFICULTY.EASY);
const testEnemy = { id: 'test_zombie', hp: 100, atk: 20, def: 10, spd: 5, rewards: { exp: 50, gold: 30 } };
const easy = applyDifficultyScaling(testEnemy);
assert(easy.hp === Math.ceil(100 * 0.7), `EASY HP: ${easy.hp}=${Math.ceil(100*0.7)}`);
assert(easy.atk === Math.ceil(20 * 0.7), `EASY ATK: ${easy.atk}=${Math.ceil(20*0.7)}`);

setDifficulty(DIFFICULTY.NIGHTMARE);
// Seed Math.random to avoid flaky affix rolls
const _origRandom = Math.random;
Math.random = () => 0.99; // always > affixChance, so no affix
const nightmare = applyDifficultyScaling(testEnemy);
assert(nightmare.hp === Math.ceil(100 * 1.8), `NIGHTMARE HP: ${nightmare.hp}=${Math.ceil(100*1.8)}`);
assert(nightmare.rewards.exp === Math.ceil(50 * 1.6), `NIGHTMARE EXP: ${nightmare.rewards.exp}=${Math.ceil(50*1.6)}`);

// Boss 缩放
const testBoss = { ...testEnemy, bossId: 'boss_test' };
const nightmareBoss = applyDifficultyScaling(testBoss);
assert(nightmareBoss.hp === Math.ceil(100 * 2.0), `Boss NIGHTMARE HP: ${nightmareBoss.hp}=${Math.ceil(100*2.0)}`);
Math.random = _origRandom; // restore

// ── 精英词缀 ──
console.log('\n[ 精英词缀 ]');
assert(Object.keys(ENEMY_AFFIXES).length >= 8, `至少8种词缀 (${Object.keys(ENEMY_AFFIXES).length})`);
for (const [id, a] of Object.entries(ENEMY_AFFIXES)) {
  assert(typeof a.name === 'string', `${id}: name`);
  assert(typeof a.icon === 'string', `${id}: icon`);
  assert(typeof a.desc === 'string', `${id}: desc`);
}

// ── 怪物图鉴 ──
console.log('\n[ 怪物图鉴 ]');
bestiary.fromJSON({});
assert(bestiary.getDiscoveredCount() === 0, '初始为空');

bestiary.record({ id: 'zombie_1', name: '丧尸', sprite: '🧟', hp: 50, atk: 10, def: 5 }, { victory: true, damageDealt: 50, damageTaken: 15 });
assert(bestiary.getDiscoveredCount() === 1, '记录后为1');

bestiary.record({ id: 'zombie_1', name: '丧尸', sprite: '🧟', hp: 50, atk: 10, def: 5 }, { victory: true, damageDealt: 50, damageTaken: 10 });
assert(bestiary.getDiscoveredCount() === 1, '同类不增');
const entry = bestiary.getEntry('zombie_1');
assert(entry && entry.kills === 2, '击杀次数=2');

bestiary.record({ id: 'zombie_1', name: '丧尸', sprite: '🧟', hp: 50, atk: 10, def: 5 }, { victory: false });
assert(entry.defeats === 1, '战败次数=1');

bestiary.record({ bossId: 'boss_queen', id: 'queen', name: '异形皇后', sprite: '👾', hp: 500, atk: 60, def: 30 }, { victory: true, damageDealt: 500, damageTaken: 100 });
assert(bestiary.getDefeatedBosses().length === 1, '击败Boss=1');

// 序列化
const json = bestiary.toJSON();
bestiary.fromJSON({});
assert(bestiary.getDiscoveredCount() === 0, '重置后=0');
bestiary.fromJSON(json);
assert(bestiary.getDiscoveredCount() === 2, '恢复后=2');

// ── 面板渲染 ──
console.log('\n[ 面板渲染 ]');
const panel = formatBestiaryPanel();
assert(typeof panel === 'string' && panel.length > 0, '图鉴面板非空');
assert(panel.includes('丧尸'), '包含丧尸');
assert(panel.includes('BOSS'), '包含BOSS标签');

const selector = formatDifficultySelector();
assert(typeof selector === 'string' && selector.includes('普通'), '难度选择器包含普通');

// ── 总结 ──
console.log(`\n═══ 难度+图鉴测试: ${pass}通过, ${fail}失败 ═══`);
if (fail > 0) process.exit(1);
