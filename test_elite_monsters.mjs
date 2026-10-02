// =================================================================
// 精英怪物系统测试
// =================================================================
import { ELITE_AFFIXES, ELITE_TIERS, tryUpgradeToElite, forceUpgradeToElite,
  getEliteDescription, getEliteCombatEffects, formatEliteTooltip,
  recordEliteKill, getEliteStats, resetEliteStats, serializeEliteStats, deserializeEliteStats
} from './src/core/EliteMonsterSystem.js';

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; }
  else { fail++; console.error('  \u274c', msg); }
}

// \u2500\u2500 \u8bcd\u7f00\u5b9a\u4e49 \u2500\u2500
const affixKeys = Object.keys(ELITE_AFFIXES);
assert(affixKeys.length >= 10, '\u81f3\u5c1112\u4e2a\u7cbe\u82f1\u8bcd\u7f00: ' + affixKeys.length);
for (const [id, affix] of Object.entries(ELITE_AFFIXES)) {
  assert(affix.name, id + ' has name');
  assert(affix.icon, id + ' has icon');
  assert(affix.color, id + ' has color');
  assert(affix.desc, id + ' has desc');
}
console.log('  \u2713 ' + affixKeys.length + ' affixes all have required fields');

// \u2500\u2500 \u9636\u7ea7\u5b9a\u4e49 \u2500\u2500
assert(ELITE_TIERS.rare, 'rare tier exists');
assert(ELITE_TIERS.elite, 'elite tier exists');
assert(ELITE_TIERS.legendary, 'legendary tier exists');
assert(ELITE_TIERS.rare.affixCount === 1, 'rare = 1 affix');
assert(ELITE_TIERS.elite.affixCount === 2, 'elite = 2 affixes');
assert(ELITE_TIERS.legendary.affixCount === 3, 'legendary = 3 affixes');
assert(ELITE_TIERS.rare.rewardMul < ELITE_TIERS.elite.rewardMul, 'elite reward > rare');
assert(ELITE_TIERS.elite.rewardMul < ELITE_TIERS.legendary.rewardMul, 'legendary reward > elite');
console.log('  \u2713 elite tiers correct');

// \u2500\u2500 \u5347\u7ea7\u6d41\u7a0b \u2500\u2500
const baseEnemy = { name: '\u50f5\u5316\u611f\u67d3\u8005', hp: 100, atk: 20, def: 10, spd: 5, rewards: { exp: 50, gold: 30 }, geneLockCharge: 5 };

// Force upgrade to rare
const rare = forceUpgradeToElite({ ...baseEnemy }, 'rare');
assert(rare._eliteTier === 'rare', 'forced rare tier');
assert(rare._eliteAffixes.length === 1, 'rare has 1 affix');
assert(rare.hp > baseEnemy.hp, 'rare HP increased');
assert(rare.atk > baseEnemy.atk, 'rare ATK increased');
assert(rare.rewards.exp > baseEnemy.rewards.exp, 'rare exp increased');
assert(rare.rewards.gold > baseEnemy.rewards.gold, 'rare gold increased');
console.log('  \u2713 rare upgrade works');

// Force upgrade to elite
const elite = forceUpgradeToElite({ ...baseEnemy }, 'elite');
assert(elite._eliteTier === 'elite', 'forced elite tier');
assert(elite._eliteAffixes.length === 2, 'elite has 2 affixes');
assert(elite.hp > rare.hp || elite.atk > rare.atk, 'elite stronger than rare');
console.log('  \u2713 elite upgrade works');

// Force upgrade to legendary
const legend = forceUpgradeToElite({ ...baseEnemy }, 'legendary');
assert(legend._eliteTier === 'legendary', 'forced legendary tier');
assert(legend._eliteAffixes.length === 3, 'legendary has 3 affixes');
assert(legend.rewards.exp >= baseEnemy.rewards.exp * 4, 'legendary reward >=5x');
console.log('  \u2713 legendary upgrade works');

// Boss should not upgrade
const boss = { ...baseEnemy, isBoss: true };
const bossResult = tryUpgradeToElite(boss, 1, 'normal', () => 0.001);
assert(!bossResult._eliteTier, 'boss not upgraded');
console.log('  \u2713 boss immune to upgrade');

// No double upgrade
const already = forceUpgradeToElite({ ...baseEnemy }, 'rare');
const doubled = forceUpgradeToElite(already, 'legendary');
assert(doubled._eliteTier === 'rare', 'no double upgrade');
console.log('  \u2713 no double upgrade');

// \u2500\u2500 tryUpgradeToElite with deterministic rng \u2500\u2500
// rng() = 0.001 should always trigger legendary (chance 0.03 * mul)
const triggered = tryUpgradeToElite({ ...baseEnemy }, 5, 'hard', () => 0.001);
assert(triggered._eliteTier === 'legendary', 'very low rng triggers legendary: got ' + triggered._eliteTier);

// rng() = 0.99 should not trigger any
const notTriggered = tryUpgradeToElite({ ...baseEnemy }, 1, 'easy', () => 0.99);
assert(!notTriggered._eliteTier, 'high rng no upgrade');
console.log('  \u2713 tryUpgradeToElite probability works');

// \u2500\u2500 Combat effects \u2500\u2500
const effects = getEliteCombatEffects(legend);
assert(effects !== null, 'legendary has combat effects');
assert(typeof effects.doubleStrikeChance === 'number', 'has doubleStrikeChance');
assert(typeof effects.lifestealRatio === 'number', 'has lifestealRatio');
assert(typeof effects.thornPercent === 'number', 'has thornPercent');
assert(typeof effects.hasAffix === 'function', 'hasAffix is function');

const noEffects = getEliteCombatEffects(baseEnemy);
assert(noEffects === null, 'normal enemy has no elite effects');
console.log('  \u2713 combat effects API correct');

// \u2500\u2500 Description \u2500\u2500
const desc = getEliteDescription(legend);
assert(desc.length > 0, 'elite has description');
assert(desc.includes('\u4f20\u8bf4\u7ea7'), 'description mentions tier');

const noDesc = getEliteDescription(baseEnemy);
assert(noDesc === '', 'normal enemy empty description');
console.log('  \u2713 description API correct');

// \u2500\u2500 Tooltip \u2500\u2500
const tooltip = formatEliteTooltip(elite);
assert(tooltip.includes('\u7cbe\u82f1'), 'tooltip has tier name');
assert(tooltip.includes('\u5956\u52b1'), 'tooltip has reward info');

const noTooltip = formatEliteTooltip(baseEnemy);
assert(noTooltip === '', 'normal enemy empty tooltip');
console.log('  \u2713 tooltip formatting works');

// \u2500\u2500 Stats tracking \u2500\u2500
resetEliteStats();
let stats = getEliteStats();
assert(stats.rare === 0 && stats.elite === 0 && stats.legendary === 0, 'stats reset');
recordEliteKill('rare');
recordEliteKill('rare');
recordEliteKill('elite');
stats = getEliteStats();
assert(stats.rare === 2, 'rare kills = 2');
assert(stats.elite === 1, 'elite kills = 1');

// Serialize/deserialize
const serialized = serializeEliteStats();
resetEliteStats();
assert(getEliteStats().rare === 0, 'reset works');
deserializeEliteStats(serialized);
assert(getEliteStats().rare === 2, 'deserialized rare = 2');
console.log('  \u2713 stats tracking + persistence works');

// \u2500\u2500 Affix diversity: all affixes can appear \u2500\u2500
const seen = new Set();
for (let i = 0; i < 200; i++) {
  const e = forceUpgradeToElite({ ...baseEnemy, _eliteTier: undefined }, 'legendary', Math.random);
  // Reset for next iteration
  delete e._eliteTier;
  for (const a of (e._eliteAffixes || [])) seen.add(a.id);
}
assert(seen.size >= 8, 'at least 8 distinct affixes seen in 200 rolls: ' + seen.size);
console.log('  \u2713 affix diversity: ' + seen.size + ' distinct affixes seen');

console.log('');
console.log('\u2550'.repeat(42));
console.log('\u7cbe\u82f1\u602a\u7269\u7cfb\u7edf\u6d4b\u8bd5: ' + pass + '\u901a\u8fc7, ' + fail + '\u5931\u8d25');
if (fail === 0) console.log('\u2705 \u7cbe\u82f1\u602a\u7269\u7cfb\u7edf\u5168\u90e8\u901a\u8fc7');
else { console.log('\u274c \u6709\u6d4b\u8bd5\u5931\u8d25'); process.exit(1); }
