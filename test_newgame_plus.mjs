/**
 * test_newgame_plus.mjs — 二周目(New Game+)系统测试
 */
import { ngPlusState, formatClearScreen, formatCycleInfo, TITLES } from './src/core/NewGamePlus.js';

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; console.log(`  ✓ ${msg}`); }
  else { fail++; console.error(`  ✗ ${msg}`); }
}

console.log('═══ 二周目(NG+)系统测试 ═══\n');

// ── 初始状态 ──
console.log('[ 初始状态 ]');
ngPlusState.fromJSON(null); // 完全重置
assert(ngPlusState.cycle === 0, '初始周目=0');
assert(ngPlusState.totalClears === 0, '初始通关=0');
assert(ngPlusState.unlockedTitles.length === 0, '初始无称号');
assert(ngPlusState.getEnemyScaleBonus() === 0, '首周目无额外缩放');

// ── 称号系统 ──
console.log('\n[ 称号系统 ]');
assert(Object.keys(TITLES).length >= 6, `至少6种称号 (${Object.keys(TITLES).length})`);
for (const [id, t] of Object.entries(TITLES)) {
  assert(typeof t.name === 'string', `${id}: name`);
  assert(typeof t.icon === 'string', `${id}: icon`);
}

assert(ngPlusState.unlockTitle('title_survivor') === true, '解锁幸存者称号');
assert(ngPlusState.unlockTitle('title_survivor') === false, '重复解锁返回false');
assert(ngPlusState.unlockedTitles.length === 1, '称号数=1');

assert(ngPlusState.setActiveTitle('title_survivor') === true, '设置展示称号');
assert(ngPlusState.getActiveTitleInfo().name === '轮回幸存者', '获取称号信息');
assert(ngPlusState.setActiveTitle('title_legend') === false, '未解锁称号不可设置');

// ── 通关继承计算 ──
console.log('\n[ 通关继承 ]');
ngPlusState.fromJSON(null); // 重置
const playerState = {
  level: 20,
  gold: 5000,
  activeBloodline: 'vampire',
  geneLock: 3,
  talentPoints: 10,
  weapon: { name: '测试剑', atk: 15 },
};
const gameStats = {
  totalTime: 30 * 60 * 1000, // 30分钟
  deathCount: 0,
  kills: 150,
  maxDamage: 200,
  goldEarned: 8000,
};

const ngData = ngPlusState.completeClear(playerState, gameStats);
assert(ngPlusState.cycle === 1, '通关后cycle=1');
assert(ngPlusState.totalClears === 1, '通关次数=1');
assert(ngData.cycle === 1, '继承数据cycle=1');
assert(ngData.level === Math.ceil(20 * 0.5), `继承等级=${ngData.level} (预期${Math.ceil(20*0.5)})`);
assert(ngData.gold === Math.floor(5000 * 0.3), `继承金币=${ngData.gold} (预期${Math.floor(5000*0.3)})`);
assert(ngData.bloodline === 'vampire', '继承血统');
assert(ngData.geneLock === 3, '继承基因锁');
assert(ngData.weapon === null, '一周目不继承武器');
assert(ngData.enemyScaleBonus === 0.3, '敌人+30%');
assert(ngPlusState.unlockedTitles.includes('title_survivor'), '解锁幸存者称号');
assert(ngPlusState.unlockedTitles.includes('title_speedrun'), '30分通关解锁速通称号');
assert(ngPlusState.unlockedTitles.includes('title_pacifist'), '零死亡解锁不杀称号');

// ── 二周目→三周目 ──
console.log('\n[ 二周目通关 ]');
assert(ngPlusState.getEnemyScaleBonus() === 0.3, '二周目额外缩放0.3');
const ngData2 = ngPlusState.completeClear({ ...playerState, level: 25 }, { ...gameStats, deathCount: 3, totalTime: 90 * 60 * 1000 });
assert(ngPlusState.cycle === 2, '二周目通关后cycle=2');
assert(ngData2.weapon !== null, '二周目保留武器');
assert(Math.abs(ngData2.enemyScaleBonus - 0.9) < 0.01, '敌人+90% (0.3+0.6)');
assert(ngPlusState.unlockedTitles.includes('title_veteran'), '解锁百战老兵');
assert(!ngPlusState.unlockedTitles.includes('title_legend'), '尚未解锁传说(需3周目)');

// ── 三周目 ──
console.log('\n[ 三周目通关 ]');
const ngData3 = ngPlusState.completeClear(playerState, gameStats);
assert(ngPlusState.cycle === 3, '三周目通关后cycle=3');
assert(ngPlusState.unlockedTitles.includes('title_legend'), '解锁传说轮回者');

// ── 序列化 ──
console.log('\n[ 序列化 ]');
const json = ngPlusState.toJSON();
assert(json.cycle === 3, 'toJSON cycle=3');
assert(json.totalClears === 3, 'toJSON clears=3');
assert(json.unlockedTitles.length >= 4, 'toJSON titles保留');

ngPlusState.fromJSON(null);
assert(ngPlusState.cycle === 0, '重置后cycle=0');
ngPlusState.fromJSON(json);
assert(ngPlusState.cycle === 3, '恢复后cycle=3');
assert(ngPlusState.totalClears === 3, '恢复后clears=3');

// ── 面板渲染 ──
console.log('\n[ 面板渲染 ]');
const clearHtml = formatClearScreen(ngData, gameStats);
assert(typeof clearHtml === 'string' && clearHtml.includes('轮回完结'), '通关面板');

const cycleInfo = formatCycleInfo();
assert(typeof cycleInfo === 'string' && cycleInfo.length > 0, '周目信息非空');

// ── 总结 ──
console.log(`\n═══ NG+测试: ${pass}通过, ${fail}失败 ═══`);
if (fail > 0) process.exit(1);
