/**
 * Test: RewardChoiceSystem
 */
import { generateRewardChoices, applyReward, renderRewardChoicePanel } from './src/core/RewardChoiceSystem.js';

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('FAIL:', msg); }
}

// Mock player
const player = {
  hp: 80, maxHp: 100, atk: 20, def: 15, spd: 10, crt: 10,
  level: 5, gold: 100, exp: 50, stamina: 50, maxStamina: 50,
  geneLockCharge: 0, soulShards: 0, karma: 0,
};

// Test normal combat rewards
const choices = generateRewardChoices('A', false, 2, player);
assert(choices.length === 3, `Normal combat: got ${choices.length} choices`);
for (const c of choices) {
  assert(c.id, `Choice has id: ${c.id}`);
  assert(c.name, `Choice has name: ${c.name}`);
  assert(c.icon, `Choice has icon: ${c.icon}`);
  assert(c.desc, `Choice has desc`);
  assert(typeof c.apply === 'function', `Choice has apply function`);
}

// Test boss combat rewards (should include tier 3)
const bossChoices = generateRewardChoices('S', true, 5, player);
assert(bossChoices.length === 3, `Boss combat: got ${bossChoices.length} choices`);

// Test applying a reward
const atkBefore = player.atk;
const statChoice = choices.find(c => c.id.startsWith('atk_'));
if (statChoice) {
  const result = applyReward(statChoice, player);
  assert(result.success, 'Reward applied successfully');
  assert(player.atk > atkBefore, `ATK increased: ${atkBefore} → ${player.atk}`);
}

// Test rendering
const html = renderRewardChoicePanel(choices);
assert(typeof html === 'string', 'Renders to string');
assert(html.includes('reward-choice'), 'HTML contains reward-choice elements');
assert(html.includes('data-idx'), 'HTML has selection indices');

// Test different grades
for (const grade of ['SS', 'S', 'A', 'B', 'C', 'D']) {
  const gc = generateRewardChoices(grade, false, 3, player);
  assert(gc.length >= 2, `Grade ${grade}: at least 2 choices`);
}

// Test early chapter filtering
const ch1Choices = generateRewardChoices('A', false, 1, player);
const hasTier3 = ch1Choices.some(c => c.tier >= 3);
assert(!hasTier3, 'Chapter 1: no tier 3 rewards');

console.log(`\n✅ ${passed} passed, ❌ ${failed} failed`);
if (failed > 0) process.exit(1);
