// ═══════════════════════════════════════════════════════════════
// 装备词缀系统测试
// ═══════════════════════════════════════════════════════════════

import {
  QUALITY, QUALITY_CONFIG, PREFIX_AFFIXES, SUFFIX_AFFIXES,
  rollQuality, generateAffixes, applyQualityToEquipment,
  getAffixedName, getAffixCombatEffects, getAllAffixEffects,
  getQualityColor, getQualityName, formatEquipmentTooltip
} from './src/core/EquipmentAffixes.js';

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; }
  else { fail++; console.error(`  ❌ ${msg}`); }
}

console.log('══════════════════════════════════════════');
console.log(' 装备词缀系统测试');
console.log('══════════════════════════════════════════');

// ── 品质定义 ──
{
  assert(Object.keys(QUALITY).length === 5, '应有5个品质等级');
  for (const q of Object.values(QUALITY)) {
    assert(QUALITY_CONFIG[q], `${q}应有配置`);
    assert(QUALITY_CONFIG[q].statMult > 0, `${q}属性缩放>0`);
    assert(typeof QUALITY_CONFIG[q].affixSlots === 'number', `${q}词缀槽是数字`);
  }
}

// ── 词缀池完整性 ──
{
  assert(PREFIX_AFFIXES.length >= 10, '应有10+前缀词缀');
  assert(SUFFIX_AFFIXES.length >= 8, '应有8+后缀词缀');
  
  for (const a of PREFIX_AFFIXES) {
    assert(a.id && a.name && a.stat, `前缀 ${a.id} 应有id/name/stat`);
    assert(a.range[0] <= a.range[1], `前缀 ${a.id} 范围应合法`);
    assert(a.weight > 0, `前缀 ${a.id} 权重>0`);
  }
  for (const a of SUFFIX_AFFIXES) {
    assert(a.id && a.name && a.effect, `后缀 ${a.id} 应有id/name/effect`);
    assert(a.value[0] <= a.value[1], `后缀 ${a.id} 范围应合法`);
  }
}

// ── 品质生成分布 ──
{
  const counts = { crude: 0, common: 0, fine: 0, rare: 0, legendary: 0 };
  for (let i = 0; i < 1000; i++) {
    counts[rollQuality(1)]++;
  }
  assert(counts.crude > 0, 'Ch1应生成粗糙品质');
  assert(counts.common > 0, 'Ch1应生成普通品质');
  // 低章节传奇应很少
  assert(counts.legendary < 100, 'Ch1传奇应<10%');
  
  // 高章节更多高品质
  const highCounts = { crude: 0, common: 0, fine: 0, rare: 0, legendary: 0 };
  for (let i = 0; i < 1000; i++) {
    highCounts[rollQuality(12)]++;
  }
  assert(highCounts.fine + highCounts.rare + highCounts.legendary > counts.fine + counts.rare + counts.legendary,
    'Ch12高品质应比Ch1多');
}

// ── 词缀生成 ──
{
  // 粗糙/普通不应有词缀
  const crudeAffixes = generateAffixes(QUALITY.CRUDE, 5);
  assert(!crudeAffixes.prefix && !crudeAffixes.suffix, '粗糙品质不应有词缀');
  
  const commonAffixes = generateAffixes(QUALITY.COMMON, 5);
  assert(!commonAffixes.prefix && !commonAffixes.suffix, '普通品质不应有词缀');
  
  // 精良应有1个词缀
  let fineHasAffix = false;
  for (let i = 0; i < 50; i++) {
    const fa = generateAffixes(QUALITY.FINE, 6);
    if (fa.prefix) fineHasAffix = true;
  }
  assert(fineHasAffix, '精良品质应有前缀词缀');
  
  // 稀有应有2个词缀
  let rareHasBoth = false;
  for (let i = 0; i < 50; i++) {
    const ra = generateAffixes(QUALITY.RARE, 8);
    if (ra.prefix && ra.suffix) rareHasBoth = true;
  }
  assert(rareHasBoth, '稀有品质应能有前缀+后缀');
}

// ── 装备应用品质 ──
{
  const baseWeapon = { name: '铁剑', atk: 10, def: 0, slot: 'weapon' };
  
  // 粗糙降低属性
  const crude = applyQualityToEquipment({ ...baseWeapon }, QUALITY.CRUDE, 1);
  assert(crude.atk < baseWeapon.atk, '粗糙应降低ATK');
  assert(crude.quality === QUALITY.CRUDE, '应标记粗糙品质');
  
  // 传奇提高属性
  const legend = applyQualityToEquipment({ ...baseWeapon }, QUALITY.LEGENDARY, 10);
  assert(legend.atk > baseWeapon.atk, '传奇应提高ATK');
  assert(legend.quality === QUALITY.LEGENDARY, '应标记传奇品质');
  assert(legend.displayName, '应有显示名');
}

// ── 词缀战斗效果 ──
{
  const eq = {
    name: '测试武器',
    affixes: {
      prefix: { id: 'sharp', name: '锋利的', stat: 'atk', value: 5 },
      suffix: { id: 'of_flame', name: '烈焰', effect: 'fire_dmg', value: 8, desc: '火焰伤害' },
    },
  };
  const fx = getAffixCombatEffects(eq);
  assert(fx.fireDmg === 8, '应有8点火焰伤害');
  assert(fx.iceDmg === 0, '不应有冰霜伤害');
}

// ── 多装备词缀合并 ──
{
  const player = {
    weapon: { affixes: { suffix: { effect: 'fire_dmg', value: 6 } } },
    armor: { affixes: { suffix: { effect: 'regen', value: 2 } } },
    accessory: { affixes: { suffix: { effect: 'fire_dmg', value: 4 } } },
  };
  const combined = getAllAffixEffects(player);
  assert(combined.fireDmg === 10, '火焰伤害应叠加到10');
  assert(combined.regen === 2, '再生应为2');
}

// ── 显示名生成 ──
{
  const eq = { name: '铁剑' };
  const affixes = {
    prefix: { id: 'sharp', name: '锋利的' },
    suffix: { id: 'of_flame', name: '烈焰' },
  };
  const name = getAffixedName(eq, affixes);
  assert(name === '锋利的铁剑·烈焰', '显示名应为"锋利的铁剑·烈焰"');
  
  const noAffix = getAffixedName(eq, {});
  assert(noAffix === '铁剑', '无词缀应只显示原名');
}

// ── 工具函数 ──
{
  assert(getQualityColor(QUALITY.LEGENDARY) === '#ff8800', '传奇应是橙色');
  assert(getQualityName(QUALITY.RARE) === '稀有', '稀有品质名');
}

// ── Tooltip格式 ──
{
  const eq = {
    name: '铁剑', quality: QUALITY.RARE, displayName: '锋利的铁剑·烈焰',
    atk: 15, def: 3,
    affixes: {
      prefix: { id: 'sharp', name: '锋利的', stat: 'atk', value: 5 },
      suffix: { id: 'of_flame', name: '烈焰', effect: 'fire_dmg', value: 8, desc: '火焰伤害' },
    },
  };
  const tooltip = formatEquipmentTooltip(eq);
  assert(tooltip.includes('稀有'), 'tooltip应包含品质名');
  assert(tooltip.includes('ATK'), 'tooltip应包含ATK');
  assert(tooltip.includes('烈焰'), 'tooltip应包含后缀');
}

console.log('══════════════════════════════════════════');
console.log(`${pass + fail} 项测试: ${pass} 通过, ${fail} 失败`);
if (fail === 0) console.log('✅ 装备词缀系统全部通过');
else { console.log('❌ 有测试失败'); process.exit(1); }
