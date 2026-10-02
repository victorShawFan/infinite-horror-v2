// Test: Random encounter system
import { randomEncounterManager, RANDOM_ENCOUNTERS } from './src/core/RandomEncounterSystem.js';
import { gameState } from './src/core/GameState.js';

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; }
  else { fail++; console.error('FAIL:', msg); }
}

// Test 1: Encounter definitions exist
const encounterIds = Object.keys(RANDOM_ENCOUNTERS);
assert(encounterIds.length >= 8, `Should have at least 8 encounter types, got ${encounterIds.length}`);

// Test 2: All encounters have required fields
for (const [id, enc] of Object.entries(RANDOM_ENCOUNTERS)) {
  assert(enc.name, `${id} should have name`);
  assert(enc.icon, `${id} should have icon`);
  assert(enc.type, `${id} should have type`);
  assert(enc.weight > 0, `${id} should have positive weight`);
}

// Test 3: Manager starts fresh
assert(randomEncounterManager.stepsSinceLastEncounter === 0, 'Initial steps should be 0');
assert(randomEncounterManager.totalEncounters === 0, 'Initial encounters should be 0');

// Test 4: No encounter in first few steps
for (let i = 0; i < 10; i++) {
  const enc = randomEncounterManager.onStep(1);
  assert(enc === null, `Step ${i+1}: should not trigger encounter in first 10 steps`);
}

// Test 5: Encounter can eventually trigger (simulate many steps)
let triggered = false;
for (let i = 0; i < 200; i++) {
  const enc = randomEncounterManager.onStep(1);
  if (enc !== null) {
    triggered = true;
    assert(enc.name, 'Triggered encounter should have name');
    assert(enc.type, 'Triggered encounter should have type');
    break;
  }
}
assert(triggered, 'Should trigger at least one encounter in 200 steps');

// Test 6: Choice encounters have choices
const choiceEncs = Object.values(RANDOM_ENCOUNTERS).filter(e => e.type === 'choice');
for (const enc of choiceEncs) {
  assert(enc.choices && enc.choices.length >= 2, `Choice encounter ${enc.name} should have at least 2 choices`);
  for (const ch of enc.choices) {
    assert(typeof ch.execute === 'function', `Choice ${ch.label} should have execute function`);
  }
}

// Test 7: Reward encounters have execute
const rewardEncs = Object.values(RANDOM_ENCOUNTERS).filter(e => e.type === 'reward');
for (const enc of rewardEncs) {
  assert(typeof enc.execute === 'function', `Reward encounter ${enc.name} should have execute function`);
}

// Test 8: Execute a reward encounter
gameState.player.gold = 100;
gameState.player.hp = 50;
gameState.player.maxHp = 100;
const goldResult = RANDOM_ENCOUNTERS.resource_gold.execute(gameState.player, 1);
assert(goldResult.text.includes('金币'), 'Gold encounter should mention 金币');
assert(gameState.player.gold > 100, 'Gold should increase');

// Test 9: Execute a choice encounter
const gamble = RANDOM_ENCOUNTERS.choice_gamble;
const choice0 = gamble.choices[0];
const result0 = choice0.execute(gameState.player, 1);
assert(result0.text, 'Choice execute should return text');
assert(result0.color, 'Choice execute should return color');

// Test 10: toJSON / fromJSON
const json = randomEncounterManager.toJSON();
assert(json.total >= 0, 'toJSON should have total');
assert(Array.isArray(json.recent), 'toJSON should have recent array');

const newManager = { stepsSinceLastEncounter: 0, totalEncounters: 0, recentEncounters: [] };
randomEncounterManager.fromJSON(json);
assert(randomEncounterManager.totalEncounters === json.total, 'fromJSON should restore total');

console.log(`Random encounters: ${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
