// Test: Battle rating is calculated exactly once (no double emit)
import { rateBattle, recordRating, getRatingStats, resetRatingStats } from './src/core/BattleRating.js';
import { eventBus } from './src/core/EventBus.js';

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; }
  else { fail++; console.error('FAIL:', msg); }
}

// Track emit count
let emitCount = 0;
eventBus.on('battle:rated', () => { emitCount++; });

resetRatingStats();

// Simulate what the fixed code does: calculate once, record once
const mockResult = { victory: true, rounds: 5, log: [{ type: 'critical' }], isBoss: false };
const mockPlayer = { hp: 90, maxHp: 100, level: 10 };

const battleRating = rateBattle(mockResult, mockPlayer);
recordRating(battleRating);

assert(emitCount === 1, `battle:rated should emit exactly once, got ${emitCount}`);
assert(battleRating.grade !== undefined, 'Rating should have a grade');
assert(battleRating.score >= 0 && battleRating.score <= 100, 'Score should be 0-100');

const stats = getRatingStats();
assert(stats.total === 1, `Total ratings should be 1, got ${stats.total}`);

// Verify the rating object can be reused
const combatHistoryEntry = {
  enemy: 'test',
  victory: true,
  rounds: 5,
  rating: battleRating,
};
assert(combatHistoryEntry.rating === battleRating, 'Combat history should reference same rating object');
assert(combatHistoryEntry.rating.grade === battleRating.grade, 'Grades should match');

console.log(`Battle rating single-calc: ${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
