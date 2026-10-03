// ═══ 附魔系统验证 ═══
import { gameState } from './src/core/GameState.js';
import {
  ENCHANT_CORES, ENCHANT_EFFECTS,
  getEnchantSuccessRate, getAvailableEnchants, applyEnchant, removeEnchant,
  getEnchantCombatBonus, serializeEnchant, deserializeEnchant,
} from './src/core/EnchantSystem.js';

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) pass++;
  else { fail++; console.log(`  ❌ ${msg}`); }
}

console.log('═══ 附魔系统验证 ═══\n');

// ── 核心定义完整性 ──
console.log('── 元素核心定义 ──');
assert(Object.keys(ENCHANT_CORES).length === 7, '应有7种元素核心');
for (const [id, core] of Object.entries(ENCHANT_CORES)) {
  assert(core.name, `${id} 应有名称`);
  assert(core.element, `${id} 应有元素`);
  assert(core.icon, `${id} 应有图标`);
}

// ── 附魔效果完整性 ──
console.log('── 附魔效果定义 ──');
assert(Object.keys(ENCHANT_EFFECTS.weapon).length === 7, '武器附魔应有7种');
assert(Object.keys(ENCHANT_EFFECTS.armor).length === 7, '护甲附魔应有7种');
assert(Object.keys(ENCHANT_EFFECTS.accessory).length === 6, '饰品附魔应有6种');

for (const slot of ['weapon', 'armor', 'accessory']) {
  for (const [id, eff] of Object.entries(ENCHANT_EFFECTS[slot])) {
    assert(eff.name, `${slot}/${id} 应有名称`);
    assert(eff.desc, `${slot}/${id} 应有描述`);
    assert(eff.icon, `${slot}/${id} 应有图标`);
  }
}

// ── 成功率计算 ──
console.log('── 成功率计算 ──');
const testWeapon = { slot: 'weapon', name: '测试剑', quality: 'rare' };
const rate = getEnchantSuccessRate(testWeapon);
assert(rate > 0.5 && rate <= 0.95, `成功率应在50-95%之间, got ${rate}`);

const enchantedWeapon = { ...testWeapon, enchant: { id: 'test' } };
const rate2 = getEnchantSuccessRate(enchantedWeapon);
assert(rate2 < rate, '已附魔装备的成功率应更低');

// ── 获取可用附魔 ──
console.log('── 可用附魔列表 ──');
const weaponEnchants = getAvailableEnchants({ slot: 'weapon' });
assert(weaponEnchants.length === 7, `武器应有7种附魔, got ${weaponEnchants.length}`);

const armorEnchants = getAvailableEnchants({ slot: 'armor' });
assert(armorEnchants.length === 7, `护甲应有7种附魔, got ${armorEnchants.length}`);

const accEnchants = getAvailableEnchants({ slot: 'accessory' });
assert(accEnchants.length === 6, `饰品应有6种附魔, got ${accEnchants.length}`);

// ── 附魔执行 ──
console.log('── 附魔执行 ──');
// 无材料时应失败
gameState.enchantCores = {};
gameState.soulShards = 0;
const r1 = applyEnchant({ slot: 'weapon', name: '测试剑', quality: 'common' }, 'fire_strike');
assert(!r1.success, '无材料时附魔应失败');

// 有材料时应可以成功（多次尝试以覆盖概率）
gameState.enchantCores = { fire_core: 10 };
gameState.soulShards = 500;
let successCount = 0;
for (let i = 0; i < 20; i++) {
  const equip = { slot: 'weapon', name: '测试剑', quality: 'common' };
  const r = applyEnchant(equip, 'fire_strike');
  if (r.success) {
    successCount++;
    assert(equip.enchant, '成功后装备应有enchant属性');
    assert(equip.enchant.name === '烈焰打击', '附魔名应为烈焰打击');
    break;
  }
}
assert(successCount > 0, '20次尝试中应至少有一次成功');

// ── 移除附魔 ──
console.log('── 移除附魔 ──');
const enchantedEquip = { slot: 'weapon', name: '🔥测试剑', _originalName: '测试剑', enchant: { id: 'fire_strike', name: '烈焰打击' }, quality: 'common' };
const prevShards = gameState.soulShards;
const rr = removeEnchant(enchantedEquip);
assert(rr.success, '移除附魔应成功');
assert(!enchantedEquip.enchant, '移除后应无enchant');
assert(enchantedEquip.name === '测试剑', '移除后应恢复原名');
assert(gameState.soulShards > prevShards, '移除后应返还碎片');

// 无附魔时移除应失败
const r3 = removeEnchant({ slot: 'weapon', name: '测试剑' });
assert(!r3.success, '无附魔时移除应失败');

// ── 战斗加成计算 ──
console.log('── 战斗加成 ──');
const testPlayer = {
  weapon: {
    slot: 'weapon', enchant: {
      effects: { bonusDmg: 5, dot: 2, element: 'fire' }
    }
  },
  armor: {
    slot: 'armor', enchant: {
      effects: { resist: 15, reflect: 3, element: 'fire' }
    }
  },
  accessory: {
    slot: 'accessory', enchant: {
      effects: { bonusAtk: 5, critBonus: 5 }
    }
  },
};
const bonus = getEnchantCombatBonus(testPlayer);
assert(bonus.bonusDmg === 5, `bonusDmg应为5, got ${bonus.bonusDmg}`);
assert(bonus.bonusAtk === 5, `bonusAtk应为5, got ${bonus.bonusAtk}`);
assert(bonus.bonusCrt === 5, `bonusCrt应为5, got ${bonus.bonusCrt}`);
assert(bonus.reflectPct === 3, `reflectPct应为3, got ${bonus.reflectPct}`);
assert(bonus.dotDmg === 2, `dotDmg应为2, got ${bonus.dotDmg}`);

// ── 序列化 ──
console.log('── 序列化 ──');
gameState.enchantCores = { fire_core: 3, ice_core: 1 };
gameState.soulShards = 42;
const serialized = serializeEnchant();
assert(serialized.enchantCores.fire_core === 3, '序列化应保留核心数');
assert(serialized.soulShards === 42, '序列化应保留碎片数');

gameState.enchantCores = {};
gameState.soulShards = 0;
deserializeEnchant(serialized);
assert(gameState.enchantCores.fire_core === 3, '反序列化应恢复核心');
assert(gameState.soulShards === 42, '反序列化应恢复碎片');

console.log(`\nPassed: ${pass}  Failed: ${fail}`);
if (fail > 0) {
  console.log('\n═══ ❌ 附魔系统测试失败 ═══');
  process.exit(1);
} else {
  console.log('\n═══ ✅ 附魔系统验证全部通过 ═══');
}
