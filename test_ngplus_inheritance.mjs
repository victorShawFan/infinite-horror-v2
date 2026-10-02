// test_ngplus_inheritance.mjs — NG+继承数据应用验证
import { ngPlusState } from './src/core/NewGamePlus.js';

let pass = 0, fail = 0;
function assert(cond, msg) { if (cond) { pass++; } else { fail++; console.log('  ✗ ' + msg); } }

console.log('═══ NG+继承验证 ═══\n');

// ── 首次通关 → 二周目继承计算 ──
console.log('[ 一周目→二周目 ]');
ngPlusState.cycle = 0;
ngPlusState.totalClears = 0;

const fakePlayer = {
  level: 20, gold: 5000, hp: 200, maxHp: 200,
  atk: 30, def: 15, exp: 0, expToNext: 200,
  activeBloodline: 'vampire',
  geneLock: 3, talentPoints: 10,
  weapon: { id: 'sword_1', name: '斩铁刀', atk: 15 },
};

const ngData = ngPlusState.completeClear(fakePlayer, { totalTime: 120000, deathCount: 1 });

// 等级继承 50%
assert(ngData.level === Math.max(1, Math.ceil(20 * 0.5)), `等级继承: ${ngData.level} === ${Math.ceil(20*0.5)}`);
// 金币继承 30%
assert(ngData.gold === Math.floor(5000 * 0.3), `金币继承: ${ngData.gold} === ${Math.floor(5000*0.3)}`);
// 血统保留
assert(ngData.bloodline === 'vampire', `血统保留: ${ngData.bloodline}`);
// 基因锁保留 100%
assert(ngData.geneLock === 3, `基因锁保留: ${ngData.geneLock}`);
// 天赋点继承 50%
assert(ngData.talentPoints === Math.max(0, Math.floor(10 * 0.5)), `天赋点: ${ngData.talentPoints} === ${Math.floor(10*0.5)}`);
// 一周目不保留武器
assert(ngData.weapon === null, `一周目不保留武器: ${JSON.stringify(ngData.weapon)}`);
// 周目+1
assert(ngData.cycle === 1, `周目: ${ngData.cycle}`);
// 敌人缩放
assert(ngData.enemyScaleBonus === 0.3, `敌人缩放: ${ngData.enemyScaleBonus}`);
// 属性基于继承等级计算
assert(ngData.maxHp > 0, `maxHp > 0: ${ngData.maxHp}`);
assert(ngData.atk > 0, `atk > 0: ${ngData.atk}`);
// 图鉴/线索保留标记
assert(ngData.keepBestiary === true, `keepBestiary: ${ngData.keepBestiary}`);
assert(ngData.keepLore === true, `keepLore: ${ngData.keepLore}`);

// ── 二周目→三周目 ──
console.log('\n[ 二周目→三周目 ]');
// cycle is now 1 after completeClear
assert(ngPlusState.cycle === 1, `cycle now 1: ${ngPlusState.cycle}`);

const fakePlayer2 = {
  level: 25, gold: 8000, hp: 300, maxHp: 300,
  atk: 45, def: 22, exp: 0, expToNext: 300,
  activeBloodline: 'dark_knight',
  geneLock: 5, talentPoints: 15,
  weapon: { id: 'sword_2', name: '灭世剑', atk: 30 },
};

const ngData2 = ngPlusState.completeClear(fakePlayer2, { totalTime: 90000, deathCount: 0 });

// 二周目保留武器
assert(ngData2.weapon !== null, `二周目保留武器: ${JSON.stringify(ngData2.weapon)}`);
// 等级继承 60%
assert(ngData2.level === Math.max(1, Math.ceil(25 * 0.6)), `等级60%: ${ngData2.level}`);
// 金币继承 40%
assert(ngData2.gold === Math.floor(8000 * 0.4), `金币40%: ${ngData2.gold}`);
// 零死亡称号
assert(ngPlusState.unlockedTitles.includes('title_pacifist'), '零死亡称号');
// 累计缩放
assert(Math.abs(ngData2.enemyScaleBonus - 0.9) < 0.001, `累计缩放 0.3+0.6: ${ngData2.enemyScaleBonus}`);

// ── 称号系统 ──
console.log('\n[ 称号系统 ]');
assert(ngPlusState.unlockedTitles.includes('title_survivor'), '通关称号已解锁');
assert(ngPlusState.unlockedTitles.includes('title_veteran'), '二周目称号已解锁');
assert(ngPlusState.totalClears === 2, `总通关: ${ngPlusState.totalClears}`);

// ── 序列化/反序列化 ──
console.log('\n[ 序列化 ]');
const json = ngPlusState.toJSON();
const backup = { ...json };
ngPlusState.fromJSON(json);
assert(ngPlusState.cycle === backup.cycle, `反序列化cycle: ${ngPlusState.cycle}`);
assert(ngPlusState.totalClears === backup.totalClears, `反序列化clears: ${ngPlusState.totalClears}`);
assert(ngPlusState.unlockedTitles.length === backup.unlockedTitles.length, `反序列化titles`);

console.log(`\n═══ NG+继承验证: ${pass}通过, ${fail}失败 ═══`);
process.exit(fail > 0 ? 1 : 0);
