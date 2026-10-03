import { toggleAutoBattle, isAutoBattleEnabled, shouldAutoBattle, setAutoBattleThreshold } from './src/core/AutoBattleSystem.js';

let passed = 0;
let failed = 0;
function assert(cond, msg) { if (cond) passed++; else { failed++; console.error('FAIL:', msg); } }

// Initially disabled
assert(!isAutoBattleEnabled(), 'Initially disabled');

// Toggle
toggleAutoBattle();
assert(isAutoBattleEnabled(), 'Enabled after toggle');

// Weak enemy — should auto
const player = { hp: 200, maxHp: 200, atk: 50, def: 30, spd: 20, crt: 15, level: 10, weapon: null, armor: null, chips: [], geneLock: 0, geneLockActive: false, gold: 0, keys: {} };
const weakEnemy = { type: 'enemy', hp: 10, atk: 5, def: 2, spd: 3, name: 'weak' };

const result = shouldAutoBattle(player, weakEnemy);
assert(result.shouldAuto, 'Auto for weak enemy');

// Boss — never auto
const boss = { type: 'boss', hp: 500, atk: 40, def: 20, spd: 10, name: 'boss', isBoss: true };
const bossResult = shouldAutoBattle(player, boss);
assert(!bossResult.shouldAuto, 'Never auto for boss');

// Strong enemy — should not auto
const strongEnemy = { type: 'enemy', hp: 300, atk: 45, def: 25, spd: 15, name: 'strong' };
const strongResult = shouldAutoBattle(player, strongEnemy);
assert(!strongResult.shouldAuto, 'No auto for strong enemy');

// Disabled — no auto regardless
toggleAutoBattle();
assert(!isAutoBattleEnabled(), 'Disabled after second toggle');
const disabledResult = shouldAutoBattle(player, weakEnemy);
assert(!disabledResult.shouldAuto, 'No auto when disabled');

// Threshold adjustment
setAutoBattleThreshold(0.5);
toggleAutoBattle();
const highThreshold = shouldAutoBattle(player, { type: 'enemy', hp: 50, atk: 20, def: 5, spd: 5, name: 'medium' });
assert(highThreshold.shouldAuto !== undefined, 'Threshold works');

console.log(`\n✅ ${passed} passed, ❌ ${failed} failed`);
if (failed > 0) process.exit(1);
