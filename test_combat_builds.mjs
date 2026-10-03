// ═══════════════════════════════════════════════════════════════
// 战斗Build差异化验证 — 验证4种血统+芯片+SPD双击
// ═══════════════════════════════════════════════════════════════

import { gameState } from './src/core/GameState.js';
import { executeBattle, previewBattle, getEffectiveAtk, getEffectiveDef, getEffectiveCrt, getEffectiveSpd } from './src/core/CombatSystem.js';

const enemy = {
  id: 'test_enemy', name: '测试僵尸', hp: 50, atk: 8, def: 5, spd: 5,
  rewards: { exp: 20, gold: 10 },
};

function resetPlayer(overrides = {}) {
  gameState.reset();
  Object.assign(gameState.player, {
    hp: 200, maxHp: 200, atk: 15, def: 10, spd: 8, crt: 10,
    mana: 0, maxMana: 0,
    ...overrides,
  });
}

let pass = 0, fail = 0;
function assert(condition, label) {
  if (condition) { pass++; console.log(`  ✓ ${label}`); }
  else { fail++; console.error(`  ✗ ${label}`); }
}

// ── 1. 无血统基线 ──
console.log('\n=== 基线（无血统）===');
resetPlayer();
const base = previewBattle(gameState.player, { ...enemy });
assert(base.canWin, '无血统可胜');
assert(base.lifeStealPerHit === 0, '无吸血');
assert(base.reflectDmg === 0, '无反伤');
assert(!base.isDaoist, '非道法');
assert(!base.isDouble, '无双击');

// ── 2. 血族（吸血） ──
console.log('\n=== 血族血统 ===');
resetPlayer({ activeBloodline: 'vampire' });
const vamp = previewBattle(gameState.player, { ...enemy });
assert(getEffectiveAtk(gameState.player) > 15, '血族ATK加成 > 基础');
assert(vamp.lifeStealPerHit > 0, '有吸血');
// 实战验证
const vampResult = await executeBattle({ ...enemy });
assert(vampResult.victory, '血族胜利');
const hasStealLog = vampResult.log.some(l => l.text.includes('吸血'));
assert(hasStealLog, '战斗日志包含吸血');

// ── 3. 武修（反伤） ──
console.log('\n=== 武修血统 ===');
resetPlayer({ activeBloodline: 'martial' });
const martEnemy = { ...enemy, atk: 20 }; // 强敌以触发反伤
const mart = previewBattle(gameState.player, martEnemy);
assert(getEffectiveDef(gameState.player) > 10, '武修DEF加成 > 基础');
assert(mart.reflectDmg > 0, '有反伤');
const martResult = await executeBattle({ ...martEnemy });
assert(martResult.victory, '武修胜利');
const hasReflectLog = martResult.log.some(l => l.text.includes('反伤'));
assert(hasReflectLog, '战斗日志包含反伤');

// ── 4. 道法（法术） ──
console.log('\n=== 道法血统 ===');
resetPlayer({ activeBloodline: 'daoist', mana: 50, maxMana: 50 });
const dao = previewBattle(gameState.player, { ...enemy });
assert(dao.isDaoist, '识别为道法');
assert(dao.spellDmgEst > 0, '有法术伤害估算');
const daoResult = await executeBattle({ ...enemy });
assert(daoResult.victory, '道法胜利');
const hasSpellLog = daoResult.log.some(l => l.text.includes('道法'));
assert(hasSpellLog, '战斗日志包含道法');
assert(gameState.player.mana < 50, '法力已消耗');

// ── 5. SPD双击 ──
console.log('\n=== SPD双击 ===');
resetPlayer({ spd: 20 }); // 2x enemy spd=5 → should trigger
const spd = previewBattle(gameState.player, { ...enemy, spd: 5 });
assert(spd.isDouble, 'SPD 2x 触发双击');
const spdResult = await executeBattle({ ...enemy, spd: 5 });
assert(spdResult.victory, 'SPD双击胜利');
const hasDoubleLog = spdResult.log.some(l => l.text.includes('二连击'));
assert(hasDoubleLog, '战斗日志包含二连击');

// ── 6. 火芯片灼烧 ──
console.log('\n=== 火芯片 ===');
resetPlayer({ chips: [{ id: 'fire', name: '炎', stat: 'atk', value: 3, damageType: 'fire' }] });
const fire = previewBattle(gameState.player, { ...enemy });
assert(fire.burnDmg > 0, '有灼烧伤害');
const fireResult = await executeBattle({ ...enemy });
assert(fireResult.victory, '火芯片胜利');
const hasBurnLog = fireResult.log.some(l => l.text.includes('灼烧'));
assert(hasBurnLog, '战斗日志包含灼烧');

// ── 7. 冰芯片减攻 ──
console.log('\n=== 冰芯片 ===');
resetPlayer({ chips: [{ id: 'ice', name: '冰', stat: 'def', value: 3, damageType: 'ice' }] });
const ice = previewBattle(gameState.player, { ...enemy });
assert(ice.hasIceChip, '识别冰芯片');
const iceResult = await executeBattle({ ...enemy });
assert(iceResult.victory, '冰芯片胜利');
const hasIceLog = iceResult.log.some(l => l.text.includes('冰芯片'));
assert(hasIceLog, '战斗日志包含冰芯片减攻');

// ── 8. 存档/读档往返 ──
console.log('\n=== 存档往返 ===');
resetPlayer({
  activeBloodline: 'vampire',
  weapon: { name: '测试枪', atk: 5 },
  armor: { name: '测试甲', def: 3 },
  accessory: { name: '测试镜', crt: 8 },
  chips: [{ id: 'fire', name: '炎', stat: 'atk', value: 3, damageType: 'fire' }],
  gold: 999, rewardPoints: 1234,
});
gameState.setFlag('test_flag');
gameState.markEntityRemoved(0, 'zombie_1');
gameState.markEntityRemoved(0, 'potion_1');

const serialized = JSON.stringify(gameState.toJSON());
const parsed = JSON.parse(serialized);

assert(parsed.player.activeBloodline === 'vampire', '血统序列化');
assert(parsed.player.weapon.name === '测试枪', '武器序列化');
assert(parsed.player.armor.def === 3, '护甲序列化');
assert(parsed.player.accessory.crt === 8, '饰品序列化');
assert(parsed.player.chips.length === 1, '芯片序列化');
assert(parsed.player.gold === 999, '金币序列化');
assert(parsed.player.rewardPoints === 1234, '奖励点序列化');
assert(parsed.flags.includes('test_flag'), '标记序列化');
assert(parsed.removedEntityIds['0'].includes('zombie_1'), '击杀实体序列化');
assert(parsed.removedEntityIds['0'].includes('potion_1'), '拾取实体序列化');

// 验证读取后状态恢复
gameState.reset();
assert(gameState.player.gold === 0, '重置后金币为0');
// 手动恢复
Object.assign(gameState.player, parsed.player);
gameState.flags = new Set(parsed.flags);
gameState.removedEntityIds = {};
for (const [k, v] of Object.entries(parsed.removedEntityIds)) {
  gameState.removedEntityIds[k] = new Set(v);
}
assert(gameState.player.gold === 999, '恢复后金币999');
assert(gameState.hasFlag('test_flag'), '恢复后标记存在');
assert(gameState.getRemovedEntityIds(0).has('zombie_1'), '恢复后击杀记录存在');

// ── 总结 ──
console.log(`\n${'═'.repeat(40)}`);
console.log(`${pass + fail} 项测试: ${pass} 通过, ${fail} 失败`);
if (fail === 0) console.log('✅ 战斗Build差异化 + 存档往返 全部通过');
else { console.log('❌ 有测试失败'); process.exit(1); }
