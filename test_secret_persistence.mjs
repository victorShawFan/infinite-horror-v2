// Test: Secret room broken state persistence through save/load
import { gameState } from './src/core/GameState.js';

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; }
  else { fail++; console.error('FAIL:', msg); }
}

// Test 1: markSecretBroken and getBrokenSecrets
gameState.markSecretBroken(1, 2, 'breakable_wall_1');
gameState.markSecretBroken(1, 2, 'hidden_door_1');
gameState.markSecretBroken(3, 0, 'illusory_wall_1');

const broken_1_2 = gameState.getBrokenSecrets(1, 2);
assert(broken_1_2.has('breakable_wall_1'), 'Should have breakable_wall_1 in ch1-floor2');
assert(broken_1_2.has('hidden_door_1'), 'Should have hidden_door_1 in ch1-floor2');
assert(broken_1_2.size === 2, 'ch1-floor2 should have 2 broken secrets');

const broken_3_0 = gameState.getBrokenSecrets(3, 0);
assert(broken_3_0.has('illusory_wall_1'), 'Should have illusory_wall_1 in ch3-floor0');

const broken_5_5 = gameState.getBrokenSecrets(5, 5);
assert(broken_5_5.size === 0, 'Empty floor should have 0 broken secrets');

// Test 2: toJSON serialization
const json = gameState.toJSON();
assert(json.brokenSecrets !== undefined, 'toJSON should include brokenSecrets');
assert(Array.isArray(json.brokenSecrets['1-2']), 'brokenSecrets 1-2 should be array');
assert(json.brokenSecrets['1-2'].includes('breakable_wall_1'), 'Serialized should include breakable_wall_1');
assert(json.brokenSecrets['3-0'].includes('illusory_wall_1'), 'Serialized should include illusory_wall_1');

// Test 3: Simulate save/load round-trip
// Reset brokenSecrets
gameState.brokenSecrets = {};
assert(gameState.getBrokenSecrets(1, 2).size === 0, 'After reset, should be empty');

// Load from the serialized data (simulate)
if (json.brokenSecrets) {
  for (const [k, v] of Object.entries(json.brokenSecrets)) {
    gameState.brokenSecrets[k] = new Set(v);
  }
}
const restored = gameState.getBrokenSecrets(1, 2);
assert(restored.has('breakable_wall_1'), 'After restore, should have breakable_wall_1');
assert(restored.has('hidden_door_1'), 'After restore, should have hidden_door_1');
assert(gameState.getBrokenSecrets(3, 0).has('illusory_wall_1'), 'After restore, should have illusory_wall_1');

console.log(`Secret persistence: ${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
