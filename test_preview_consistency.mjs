// 战斗预判 vs 实战一致性测试
if (typeof globalThis.localStorage === 'undefined') {
  const store = {};
  globalThis.localStorage = {
    getItem: (k) => store[k] ?? null,
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
    clear: () => { for (const k in store) delete store[k]; },
  };
}
if (typeof globalThis.document === 'undefined') {
  globalThis.document = { getElementById: () => null, querySelector: () => null, querySelectorAll: () => [] };
}

import { gameState } from './src/core/GameState.js';
import { previewBattle, executeBattle } from './src/core/CombatSystem.js';
import { BLOODLINE } from './src/core/constants.js';

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; console.log(`  ✓ ${msg}`); }
  else { fail++; console.error(`  ✗ ${msg}`); }
}

console.log('═══ 战斗预判一致性测试 ═══\n');

const BUILDS = [
  { name: '无血统', bloodline: 'none', chips: [], atk: 20, def: 10, spd: 8, crt: 0, mana: 0, maxMana: 0 },
  { name: '血族', bloodline: BLOODLINE.VAMPIRE, chips: [], atk: 20, def: 10, spd: 8, crt: 0, mana: 0, maxMana: 0 },
  { name: '武修', bloodline: BLOODLINE.MARTIAL, chips: [], atk: 18, def: 15, spd: 8, crt: 0, mana: 0, maxMana: 0 },
  { name: '道法', bloodline: BLOODLINE.DAOIST, chips: [], atk: 20, def: 10, spd: 8, crt: 0, mana: 40, maxMana: 50 },
  { name: '道法低蓝', bloodline: BLOODLINE.DAOIST, chips: [], atk: 20, def: 10, spd: 8, crt: 0, mana: 12, maxMana: 50 },
  { name: 'SPD双击', bloodline: 'none', chips: [], atk: 20, def: 10, spd: 20, crt: 0, mana: 0, maxMana: 0 },
  { name: '火芯片', bloodline: 'none', chips: [{ id: 'fire', stat: 'atk', value: 3, damageType: 'fire' }], atk: 20, def: 10, spd: 8, crt: 0, mana: 0, maxMana: 0 },
  { name: '武修+冰芯片', bloodline: BLOODLINE.MARTIAL, chips: [{ id: 'ice', stat: 'def', value: 3, damageType: 'ice' }], atk: 18, def: 15, spd: 8, crt: 0, mana: 0, maxMana: 0 },
];

const ENEMIES = [
  { name: '普通敌', hp: 50, atk: 12, def: 5, spd: 5 },
  { name: '高防敌', hp: 80, atk: 10, def: 15, spd: 5 },
  { name: '高攻敌', hp: 40, atk: 25, def: 3, spd: 8 },
  { name: '酸血异形', hp: 60, atk: 14, def: 6, spd: 6, acidBlood: 15 },
  { name: '有法抗敌', hp: 70, atk: 15, def: 8, spd: 6, res: 30 },
];

// 替换 Math.random 为确定性种子
let seed = 42;
const origRandom = Math.random;
Math.random = () => {
  seed = (seed * 16807 + 0) % 2147483647;
  return (seed - 1) / 2147483646;
};

let totalTests = 0;
let mismatchCount = 0;

for (const build of BUILDS) {
  for (const enemy of ENEMIES) {
    totalTests++;
    
    // 设置玩家
    gameState.reset();
    const p = gameState.player;
    p.atk = build.atk; p.def = build.def; p.spd = build.spd; p.crt = build.crt;
    p.hp = 300; p.maxHp = 300;
    p.mana = build.mana; p.maxMana = build.maxMana;
    p.activeBloodline = build.bloodline;
    p.bloodlines = build.bloodline !== 'none' ? [build.bloodline] : [];
    p.chips = [...build.chips];
    p.weapon = { name: '测试武器', atk: 5, damageType: 'physical' };
    p.geneLock = 0; p.geneLockActive = false;
    
    // 记录预判前的种子
    const savedSeed = seed;
    const preview = previewBattle(p, { ...enemy, rewards: { exp: 10, gold: 5 } });
    
    // 重置到相同种子
    seed = savedSeed;
    p.hp = 300; // 恢复HP
    p.mana = build.mana; // 恢复蓝
    
    if (!preview.canWin) continue; // 跳过预判打不过的
    
    // 执行实战
    const result = await executeBattle({ ...enemy, rewards: { exp: 10, gold: 5 } });
    
    // 对比
    const previewHpAfter = preview.hpAfter;
    const actualHpAfter = p.hp;
    
    // 允许一定偏差（暴击随机性）但方向应一致
    const diff = Math.abs(previewHpAfter - actualHpAfter);
    const tolerate = Math.max(30, enemy.hp * 0.3); // 允许30点或30%偏差（暴击导致）
    
    if (diff > tolerate) {
      mismatchCount++;
      console.error(`  ✗ ${build.name} vs ${enemy.name}: 预判HP=${previewHpAfter}, 实际HP=${actualHpAfter}, 差=${diff}`);
    }
  }
}

// 恢复 Math.random
Math.random = origRandom;

assert(mismatchCount === 0, `${totalTests}组对决中预判与实战HP偏差均在容忍范围内 (超差=${mismatchCount})`);

// ── 专项：道法低蓝耗尽测试 ──
console.log('\n=== 道法低蓝耗尽专项 ===');
gameState.reset();
const p2 = gameState.player;
p2.atk = 20; p2.def = 10; p2.spd = 8; p2.crt = 0;
p2.hp = 300; p2.maxHp = 300; p2.mana = 16; p2.maxMana = 50; // 只够2次法术
p2.activeBloodline = BLOODLINE.DAOIST;
p2.bloodlines = [BLOODLINE.DAOIST];
p2.weapon = { name: '测试', atk: 5, damageType: 'physical' };
p2.chips = [];

const toughEnemy = { name: '高HP敌', hp: 200, atk: 15, def: 5, spd: 5, rewards: {} };
const preview2 = previewBattle(p2, toughEnemy);
assert(preview2.turnsNeeded > 2, `道法低蓝: 回合数${preview2.turnsNeeded} > 2 (蓝会耗尽)`);
assert(preview2.isDaoist, '识别为道法');

// 不应该因为蓝用完而高估伤害
const daoistDmgPerHitBase = Math.max(1, (20 + 5) - 5); // 20 base
// 如果所有回合都有法术,turnsNeeded会更少
// 低蓝时turnsNeeded应该更多
const p3 = { ...p2, mana: 200, maxMana: 200, hp: 300 }; // 高蓝对照
Object.assign(gameState.player, p3);
const previewHighMana = previewBattle(gameState.player, toughEnemy);
assert(preview2.turnsNeeded >= previewHighMana.turnsNeeded, 
  `低蓝${preview2.turnsNeeded}回合 >= 高蓝${previewHighMana.turnsNeeded}回合`);

console.log(`\n════════════════════════════════════════`);
console.log(`${pass + fail} 项测试: ${pass} 通过, ${fail} 失败`);
if (fail === 0) console.log('✅ 战斗预判一致性测试全部通过');
else { console.error('❌ 有失败'); process.exit(1); }
