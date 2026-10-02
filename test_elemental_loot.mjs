// ═══════════════════════════════════════════════════════════════
// 元素交互系统 + 战利品系统 测试
// ═══════════════════════════════════════════════════════════════
globalThis.localStorage = { _data: {}, getItem(k) { return this._data[k] || null; }, setItem(k,v) { this._data[k] = v; }, removeItem(k) { delete this._data[k]; } };

import { calcElementalModifier, checkElementalResonance, getPlayerActiveElements,
         getEnemyElement, ELEMENT_ADVANTAGE, ELEMENT_RESONANCE, ELEMENT_INFO } from './src/core/ElementalSystem.js';
import { generateLoot, formatLootLog, applyLoot, RARITY, DROP_RATES } from './src/core/LootSystem.js';
import { DAMAGE_TYPE } from './src/core/constants.js';
import { gameState } from './src/core/GameState.js';

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; } else { fail++; console.error(`❌ ${msg}`); }
}

console.log('══════════════════════════════════════════');
console.log(' 元素交互系统');
console.log('══════════════════════════════════════════');

// 基础相克
{
  const r = calcElementalModifier(DAMAGE_TYPE.FIRE, DAMAGE_TYPE.ICE);
  assert(r.multiplier === 1.5, '火克冰应1.5x');
  assert(r.isAdvantage, '火克冰应isAdvantage');
}

// 反向被克
{
  const r = calcElementalModifier(DAMAGE_TYPE.ICE, DAMAGE_TYPE.FIRE);
  assert(r.multiplier === 0.75, '冰被火克应0.75x');
  assert(r.isResist, '冰被火克应isResist');
}

// 同元素抗性
{
  const r = calcElementalModifier(DAMAGE_TYPE.FIRE, DAMAGE_TYPE.FIRE);
  assert(r.multiplier === 0.7, '同火应0.7x');
  assert(r.isResist, '同火应isResist');
}

// 物理无元素效果
{
  const r = calcElementalModifier(DAMAGE_TYPE.PHYSICAL, DAMAGE_TYPE.FIRE);
  assert(r.multiplier === 1.0, '物理无元素效果');
}

// 高级三角
{
  const r1 = calcElementalModifier(DAMAGE_TYPE.HOLY, DAMAGE_TYPE.DARK);
  assert(r1.isAdvantage, '圣克暗');
  const r2 = calcElementalModifier(DAMAGE_TYPE.DARK, DAMAGE_TYPE.SPIRIT);
  assert(r2.isAdvantage, '暗克灵');
  const r3 = calcElementalModifier(DAMAGE_TYPE.SPIRIT, DAMAGE_TYPE.HOLY);
  assert(r3.isAdvantage, '灵克圣');
}

// 念力三角
{
  const r1 = calcElementalModifier(DAMAGE_TYPE.POISON, DAMAGE_TYPE.PSYCHIC);
  assert(r1.isAdvantage, '毒克念');
  const r2 = calcElementalModifier(DAMAGE_TYPE.PSYCHIC, DAMAGE_TYPE.FIRE);
  assert(r2.isAdvantage, '念克火');
}

// 无关联元素无效果
{
  const r = calcElementalModifier(DAMAGE_TYPE.FIRE, DAMAGE_TYPE.DARK);
  assert(r.multiplier === 1.0, '火暗无特殊关系');
}

// 元素共鸣
{
  const r1 = checkElementalResonance(['fire', 'ice']);
  assert(r1.length === 1, '火冰应触发共鸣');
  assert(r1[0].name === '蒸汽爆裂', '应为蒸汽爆裂');
  
  const r2 = checkElementalResonance(['poison', 'fire']);
  assert(r2.length === 1 && r2[0].name === '毒雾引燃', '毒火共鸣');
  
  const r3 = checkElementalResonance(['dark', 'poison']);
  assert(r3.length === 1 && r3[0].name === '深渊腐蚀', '暗毒共鸣');
}

// 多元素共鸣
{
  const r = checkElementalResonance(['fire', 'ice', 'psychic']);
  assert(r.length >= 2, '三元素应触发多个共鸣');
}

// 单元素无共鸣
{
  const r = checkElementalResonance(['fire']);
  assert(r.length === 0, '单元素无共鸣');
}

// 玩家元素
{
  const player = { weapon: { damageType: 'fire' }, chips: [{ damageType: 'ice' }], activeBloodline: 'daoist' };
  const elements = getPlayerActiveElements(player);
  assert(elements.includes('fire'), '应含武器火');
  assert(elements.includes('ice'), '应含芯片冰');
  assert(elements.includes('spirit'), '应含道法灵');
}

// 元素信息完整
{
  const allTypes = Object.values(DAMAGE_TYPE);
  for (const t of allTypes) {
    assert(ELEMENT_INFO[t], `${t}应有元素信息`);
  }
}

console.log('══════════════════════════════════════════');
console.log(' 战利品系统');
console.log('══════════════════════════════════════════');

// 基础掉落
{
  const enemy = { name: '测试怪', type: 'enemy' };
  // 运行100次检查掉落
  let gotConsumable = false, gotGem = false, gotEquip = false;
  for (let i = 0; i < 100; i++) {
    const loot = generateLoot(enemy, 6);
    for (const l of loot) {
      if (l.type === 'consumable') gotConsumable = true;
      if (l.type === 'gem') gotGem = true;
      if (l.type === 'equipment') gotEquip = true;
    }
  }
  assert(gotConsumable, '100次中应有消耗品掉落');
  assert(gotGem, '100次中应有宝石掉落');
  // 装备概率低，不一定掉
}

// Boss 保底宝石
{
  let gotGem = false;
  for (let i = 0; i < 10; i++) {
    const loot = generateLoot({ name: 'Boss', type: 'boss', bossId: 'test' }, 5);
    if (loot.some(l => l.type === 'gem')) gotGem = true;
  }
  assert(gotGem, 'Boss应保底掉宝石');
}

// 掉落日志格式化
{
  const drops = [
    { type: 'consumable', name: '小型修复包' },
    { type: 'gem', name: '红宝石', gemId: 'ruby' },
    { type: 'equipment', equipment: { name: '锋利的激光刃', rarity: 'epic', rarityColor: '#aa44ff', atk: 15, crt: 5 } },
  ];
  const logs = formatLootLog(drops);
  assert(logs.length === 3, '应有3条日志');
  assert(logs[0].text.includes('修复包'), '消耗品日志');
  assert(logs[1].text.includes('红宝石'), '宝石日志');
  assert(logs[2].text.includes('激光刃'), '装备日志');
}

// 装备稀有度
{
  assert(RARITY.COMMON.statMult === 1.0, '普通1.0x');
  assert(RARITY.LEGENDARY.statMult === 2.0, '传说2.0x');
  assert(RARITY.LEGENDARY.affixCount === 3, '传说3词缀');
}

// 生成装备有属性
{
  let foundEquip = false;
  for (let i = 0; i < 200; i++) {
    const loot = generateLoot({ name: 'Boss', type: 'boss', bossId: 'test' }, 10);
    const equips = loot.filter(l => l.type === 'equipment');
    if (equips.length > 0) {
      const e = equips[0].equipment;
      assert(e.name, '装备应有名字');
      assert(e.rarity, '装备应有稀有度');
      assert(e.maxGemSlots >= 1, '装备应有宝石槽');
      assert(e.slot, '装备应有槽位');
      foundEquip = true;
      break;
    }
  }
  assert(foundEquip, '200次Boss战应掉装备');
}

// 应用掉落物
{
  gameState.reset();
  const p = gameState.player;
  const drops = [
    { type: 'gem', gemId: 'ruby' },
    { type: 'consumable', name: '修复包', effect: { healPercent: 0.2 } },
  ];
  applyLoot(drops, p, gameState);
  assert(gameState.gemInventory.length === 1, '应有1个宝石');
  assert(gameState.gemInventory[0] === 'ruby', '应是红宝石');
  assert(p.inventory.length === 1, '背包应有1个物品');
}

console.log('══════════════════════════════════════════');
console.log(`${pass + fail} 项测试: ${pass} 通过, ${fail} 失败`);
if (fail === 0) {
  console.log('✅ 元素交互 + 战利品系统 全部通过');
} else {
  console.log('❌ 有测试失败');
  process.exit(1);
}
