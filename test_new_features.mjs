// ═══════════════════════════════════════════════════════════════
// 新功能综合测试 — 商人/仓库/套装/同伴/任务
// ═══════════════════════════════════════════════════════════════
import { gameState } from './src/core/GameState.js';
import { openMerchantShop } from './src/core/FieldMerchant.js';
import { getStash, addToStash, removeFromStash, isStashFull, serializeStash, deserializeStash } from './src/core/EquipmentStash.js';
import { EQUIPMENT_SETS, getActiveSetBonuses, formatSetBonusHTML } from './src/core/EquipmentSystem.js';
import { getCompanionCombatBonuses, getCompanionBattleCry, formatCompanionCombatHTML } from './src/core/CompanionCombat.js';
import { getCurrentQuests, formatQuestPanelHTML } from './src/core/QuestTracker.js';

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; }
  else { fail++; console.error('❌', msg); }
}

// ── Reset state ──
gameState.reset();
gameState.chapter = 1;

// ═══ Equipment Stash ═══
console.log('\n═══ 装备仓库测试 ═══');

// Stash starts empty
assert(getStash().length === 0, 'stash starts empty');
assert(!isStashFull(), 'stash not full initially');

// Add items
const sword = { name: '测试剑', atk: 10, slot: 'weapon' };
const armor = { name: '测试甲', def: 8, slot: 'armor' };
assert(addToStash(sword), 'can add sword to stash');
assert(addToStash(armor), 'can add armor to stash');
assert(getStash().length === 2, 'stash has 2 items');

// Remove item
const removed = removeFromStash(0);
assert(removed && removed.name === '测试剑', 'removed correct item');
assert(getStash().length === 1, 'stash has 1 item after removal');

// Serialize/Deserialize
const serialized = serializeStash();
assert(Array.isArray(serialized), 'serialize returns array');
deserializeStash([{ name: 'A' }, { name: 'B' }, { name: 'C' }]);
assert(getStash().length === 3, 'deserialize restores items');

// Fill to max
deserializeStash([]);
for (let i = 0; i < 24; i++) addToStash({ name: `item${i}` });
assert(isStashFull(), 'stash full at 24');
assert(!addToStash({ name: 'overflow' }), 'cannot add to full stash');

// Clean up
deserializeStash([]);

// ═══ Equipment Sets ═══
console.log('\n═══ 套装系统测试 ═══');

assert(Object.keys(EQUIPMENT_SETS).length >= 5, 'at least 5 equipment sets defined');
assert(EQUIPMENT_SETS.umbrella_corp, 'umbrella_corp set exists');
assert(EQUIPMENT_SETS.alien_hunter, 'alien_hunter set exists');
assert(EQUIPMENT_SETS.lord_god, 'lord_god set exists');

// Test set bonus calculation
const p = gameState.player;
p.weapon = { name: 'test_w', setId: 'lord_blade', atk: 10 };
p.armor = { name: 'test_a', setId: 'lord_guard', def: 10 };
p.accessory = null;
const bonuses2 = getActiveSetBonuses(p);
assert(bonuses2.atk >= 8, '2-piece lord_god gives ATK bonus');
assert(bonuses2.crt >= 5, '2-piece lord_god gives CRT bonus');

p.accessory = { name: 'test_acc', setId: 'lord_ring', crt: 5 };
const bonuses3 = getActiveSetBonuses(p);
assert(bonuses3.atk >= 15, '3-piece lord_god gives bigger ATK');
assert(bonuses3.spd >= 5, '3-piece lord_god gives SPD');

// Reset equipment
p.weapon = null; p.armor = null; p.accessory = null;

// Format set HTML
const html = formatSetBonusHTML(p);
assert(typeof html === 'string', 'formatSetBonusHTML returns string');

// ═══ Companion Combat ═══
console.log('\n═══ 同伴战斗支援测试 ═══');

// Add companions
gameState.companions = [
  { id: 'zhang_jie', name: '张杰', alive: true },
  { id: 'zhan_lan', name: '詹岚', alive: true },
  { id: 'mou_gang', name: '牟钢', alive: true },
];
gameState.relationships = { zhang_jie: 50, zhan_lan: 25, mou_gang: 45 };

const combatBonuses = getCompanionCombatBonuses();
assert(combatBonuses.activeSkills.length > 0, 'has active companion skills');
assert(combatBonuses.atk >= 0, 'companion bonuses has atk field');
assert(combatBonuses.def >= 0, 'companion bonuses has def field');

// Battle cry
const cry = getCompanionBattleCry('测试怪');
assert(cry === null || (cry.speaker && cry.text), 'battle cry has speaker and text');

// Dead companion gives no bonuses
gameState.companions[0].alive = false;
const bonusesAfterDeath = getCompanionCombatBonuses();
const zhangJieSkills = bonusesAfterDeath.activeSkills.filter(s => s.companion === '张杰');
assert(zhangJieSkills.length === 0, 'dead companion gives no skills');

// Format HTML
const compHTML = formatCompanionCombatHTML();
assert(typeof compHTML === 'string' && compHTML.length > 0, 'formatCompanionCombatHTML returns content');

// ═══ Quest Tracker ═══
console.log('\n═══ 任务追踪测试 ═══');

gameState.chapter = 1;
const quests1 = getCurrentQuests();
assert(quests1, 'chapter 1 quests exist');
assert(quests1.main, 'chapter 1 has main quest');
assert(quests1.sub.length > 0, 'chapter 1 has sub quests');

gameState.chapter = 12;
const quests12 = getCurrentQuests();
assert(quests12, 'chapter 12 quests exist');
assert(quests12.main.includes('主神') || quests12.main.includes('恶魔') || quests12.main.includes('最终'), 'chapter 12 main quest is about final battle');

const questHTML = formatQuestPanelHTML();
assert(typeof questHTML === 'string' && questHTML.length > 0, 'formatQuestPanelHTML returns content');

// All chapters have quests
for (let ch = 1; ch <= 12; ch++) {
  gameState.chapter = ch;
  const q = getCurrentQuests();
  assert(q && q.main, `chapter ${ch} has main quest`);
}

// ═══ Summary ═══
console.log(`\n══════════════════════════════════════════`);
console.log(`新功能测试: ${pass}通过, ${fail}失败`);
if (fail > 0) { console.log('❌ 有测试失败'); process.exit(1); }
else console.log('✅ 新功能综合测试全部通过');
