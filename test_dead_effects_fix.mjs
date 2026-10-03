// 验证10个之前"定义但未消费"的效果现在都已正确接入
import { getPerkCombatEffects, PERK_TIERS, selectPerk } from './src/core/PerkSystem.js';
import { getRelicCombatEffects, addRelic, RELIC_DEFINITIONS } from './src/core/RelicSystem.js';
import { gameState } from './src/core/GameState.js';
import { generateLoot } from './src/core/LootSystem.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
let passed = 0, failed = 0;
function check(name, cond) {
  if (cond) { passed++; }
  else { failed++; console.log(`❌ ${name}`); }
}

gameState.reset();

// Perk/Relic key existence
const perkFx = getPerkCombatEffects();
const relicFx = getRelicCombatEffects();
check('perkFx has fearAuraStack', 'fearAuraStack' in perkFx);
check('perkFx has fearAuraCap', 'fearAuraCap' in perkFx);
check('perkFx has expMultiplier', 'expMultiplier' in perkFx);
check('relicFx has lowHpAtkBonus', 'lowHpAtkBonus' in relicFx);
check('relicFx has doubleAttackBonus', 'doubleAttackBonus' in relicFx);
check('relicFx has enemyIntentReveal', 'enemyIntentReveal' in relicFx);
check('relicFx has firstTurnDoubleAction', 'firstTurnDoubleAction' in relicFx);
check('relicFx has geneLockEffectBonus', 'geneLockEffectBonus' in relicFx);
check('relicFx has guaranteeEpicReward', 'guaranteeEpicReward' in relicFx);
check('relicFx has bonusStatPoints', 'bonusStatPoints' in relicFx);

// Source code consumption checks
const combatSrc = readFileSync(join(__dirname, 'src/core/CombatSystem.js'), 'utf8');
const gameStateSrc = readFileSync(join(__dirname, 'src/core/GameState.js'), 'utf8');
const lootSrc = readFileSync(join(__dirname, 'src/core/LootSystem.js'), 'utf8');

check('CS: fearAuraStack consumed', combatSrc.includes('fearAuraStack'));
check('CS: fearAuraCap consumed', combatSrc.includes('fearAuraCap'));
check('CS: lowHpAtkBonus consumed', combatSrc.includes('lowHpAtkBonus'));
check('CS: doubleAttackBonus consumed', combatSrc.includes('doubleAttackBonus'));
check('CS: enemyIntentReveal consumed', combatSrc.includes('enemyIntentReveal'));
check('CS: relicFirstTurnDouble in attackCount', combatSrc.includes('relicFirstTurnDouble'));
check('CS: expMultiplier consumed', combatSrc.includes('expMultiplier'));
check('CS: relicFx.expBonus consumed', combatSrc.includes('relicFx.expBonus'));
check('CS: geneLockEffectBonus consumed', combatSrc.includes('geneLockEffectBonus'));
check('CS: guaranteeEpic passed to loot', combatSrc.includes('guaranteeEpic'));
check('Loot: accepts guaranteeEpic', lootSrc.includes('options.guaranteeEpic'));
check('GS: bonusStatPoints on levelup', gameStateSrc.includes('bonusStatPoints'));

// Functional: expMultiplier perk
gameState.reset();
gameState.player.level = 4;
selectPerk(5, 'quick_learner');
const perkFx2 = getPerkCombatEffects();
check('quick_learner expMultiplier=0.15', Math.abs(perkFx2.expMultiplier - 0.15) < 0.001);

// Functional: guaranteeEpic loot
const epicLoot = generateLoot({ type: 'normal', rewards: {} }, 6, { guaranteeEpic: true });
check('guaranteeEpic forces equipment', epicLoot.some(d => d.type === 'equipment'));

// Functional: flatAtk on relic acquire
gameState.reset();
const atkBefore = gameState.player.atk;
addRelic('worn_whetstone');
check('worn_whetstone +3 ATK', gameState.player.atk === atkBefore + 3);

// Functional: bonusStatPoints on levelup
const bspRelic = Object.values(RELIC_DEFINITIONS).find(r => r.effects.bonusStatPoints > 0);
if (bspRelic) {
  gameState.reset();
  addRelic(bspRelic.id);
  const baseAtk = gameState.player.atk;
  gameState.addExp(gameState.player.expToNext + 1);
  // Normal levelup gives +2 ATK, bonusStatPoints should add more
  check('bonusStatPoints extra atk (' + bspRelic.id + ')', gameState.player.atk >= baseAtk + 3);
}

console.log(`\n✅ ${passed} passed, ❌ ${failed} failed`);
