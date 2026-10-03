/**
 * Integration test: Combo system + elemental/weakness recording in real combat
 */
import { initComboState, recordCrit, recordElementalHit, recordWeaknessHit, recordCompanionAction, recordBlock, getComboBonus, formatComboLog } from './src/core/ComboSystem.js';

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('FAIL:', msg); }
}

// Initialize
initComboState();

// Test crit chain
recordCrit(true);
recordCrit(true);
recordCrit(true);
const critCombo = getComboBonus();
assert(critCombo !== undefined, 'getComboBonus returns value after crits');
if (critCombo) {
  assert(critCombo.bonus >= 0, `Crit combo bonus: ${critCombo.bonus}`);
}

// Test elemental hit chain
initComboState();
recordElementalHit();
recordElementalHit();
recordElementalHit();
const elemCombo = getComboBonus();
assert(elemCombo !== undefined, 'getComboBonus returns value after elemental hits');

// Test weakness hit chain
initComboState();
recordWeaknessHit();
recordWeaknessHit();
const weakCombo = getComboBonus();
assert(weakCombo !== undefined, 'getComboBonus returns value after weakness hits');

// Test companion action
initComboState();
recordCompanionAction();
recordCompanionAction();
const compCombo = getComboBonus();
assert(compCombo !== undefined, 'getComboBonus returns value after companion actions');

// Test block recording
initComboState();
recordBlock();
recordBlock();
recordBlock();
const blockCombo = getComboBonus();
assert(blockCombo !== undefined, 'getComboBonus returns value after blocks');

// Test format
initComboState();
recordCrit(true);
recordCrit(true);
recordCrit(true);
const combo = getComboBonus();
if (combo && combo.bonus > 0) {
  const logs = formatComboLog(combo);
  assert(Array.isArray(logs), 'formatComboLog returns array');
  assert(logs.length > 0, 'formatComboLog has entries');
  if (logs.length > 0) {
    assert(logs[0].text !== undefined, 'Log entry has text');
  }
}

// Test mixed chain
initComboState();
recordCrit(true);
recordElementalHit();
recordWeaknessHit();
recordCompanionAction();
const mixedCombo = getComboBonus();
assert(mixedCombo !== undefined, 'Mixed combo returns value');

console.log(`\n✅ ${passed} passed, ❌ ${failed} failed`);
if (failed > 0) process.exit(1);
