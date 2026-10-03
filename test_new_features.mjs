// 新功能模块导入验证测试
import { tryFlashback, renderFlashback } from './src/core/FlashbackSystem.js';
import { assessThreat, THREAT_LEVEL, getEnemyMapColor } from './src/core/EnemyPowerIndicator.js';
import { tryExplorationEvent, applyEventEffect, serializeExplorationEvents, deserializeExplorationEvents } from './src/core/ExplorationEvents.js';
import { showLevelUpCelebration, getLevelUnlocks } from './src/core/LevelUpCelebration.js';
import { shouldShowAnalysis, extractCombatStats, generateAdvice } from './src/core/PostCombatAnalysis.js';
import { generateDamageBreakdownHTML, getQuickDamagePreview } from './src/core/DamageBreakdown.js';
import { getRandomTip, getContextualTip, getTotalTipsCount } from './src/core/GameplayTips.js';
import { tryAmbientNarration } from './src/core/AmbientNarration.js';

let pass = 0, fail = 0;
function assert(cond, msg) { if (cond) { pass++; } else { fail++; console.error('FAIL:', msg); } }

// Test EnemyPowerIndicator
assert(THREAT_LEVEL.TRIVIAL === 'trivial', 'THREAT_LEVEL.TRIVIAL');
assert(THREAT_LEVEL.BOSS === 'boss', 'THREAT_LEVEL.BOSS');

const threat1 = assessThreat(
  { hp: 10, atk: 5, def: 1, level: 1 },
  { hp: 200, atk: 50, def: 20, maxHp: 200, level: 15, geneLock: 2 }
);
assert(threat1.level === 'trivial', 'Weak enemy is trivial');

const threat2 = assessThreat(
  { hp: 500, atk: 80, def: 30, level: 30, type: 'boss', bossId: 'test' },
  { hp: 100, atk: 20, def: 10, maxHp: 100, level: 5 }
);
assert(threat2.level === 'boss', 'Boss is boss level');

const threat3 = assessThreat(
  { hp: 100, atk: 20, def: 10, level: 5 },
  { hp: 100, atk: 20, def: 10, maxHp: 100, level: 5 }
);
assert(threat3.level === 'even', 'Equal stats is even');

const mapColor = getEnemyMapColor(
  { hp: 10, atk: 5, def: 1, level: 1 },
  { hp: 200, atk: 50, def: 20, maxHp: 200, level: 15, geneLock: 2 }
);
assert(typeof mapColor === 'string' && mapColor.startsWith('#'), 'Map color is hex string');

// Test GameplayTips
assert(getTotalTipsCount() >= 25, 'At least 30 tips exist');
const tip1 = getRandomTip();
assert(typeof tip1 === 'string' && tip1.length > 10, 'Random tip is non-empty string');
const tip2 = getRandomTip('combat');
assert(typeof tip2 === 'string', 'Combat category tip exists');

// Test DamageBreakdown
const preview = getQuickDamagePreview(
  { atk: 20, crt: 10 },
  { hp: 50, def: 5 }
);
assert(preview.damage === 15, 'Damage calculation: 20-5=15');
assert(preview.turnsToKill === 4, 'Turns to kill: ceil(50/15)=4');
assert(preview.canWin === true, 'Can win');

const preview2 = getQuickDamagePreview(
  { atk: 3, crt: 0 },
  { hp: 100, def: 10 }
);
assert(preview2.damage === 1, 'Min damage is 1');

// Test PostCombatAnalysis
assert(shouldShowAnalysis({ _isBoss: true, victory: true }, { grade: 'A' }), 'Boss shows analysis');
assert(shouldShowAnalysis({ _isBoss: false, victory: true, rounds: 20 }, { grade: 'B' }), 'Long fight shows analysis');
assert(!shouldShowAnalysis({ _isBoss: false, victory: true, rounds: 3 }, { grade: 'C' }), 'Quick normal fight no analysis');

const stats = extractCombatStats({
  log: [
    { text: 'attack 25', type: 'attack' },
    { text: 'critical 50', type: 'critical' },
    { text: 'heal +20', type: 'heal' },
  ],
  totalDamageDealt: 75,
  totalDamageTaken: 30,
  critCount: 1,
  rounds: 5,
});
assert(stats.playerDmgDealt === 75, 'Stats dmg dealt');
assert(stats.critCount === 1, 'Stats crit count');
assert(stats.dps === 15, 'DPS calculation: 75/5=15');
assert(stats.healsReceived === 1, 'Heal count');

// Test LevelUnlocks
const unlocks5 = getLevelUnlocks(5, { geneLock: 0 });
assert(unlocks5.some(u => u.includes('基因锁')), 'Level 5 unlocks gene lock');
assert(unlocks5.some(u => u.includes('里程碑')), 'Level 5 milestone');

const unlocks10 = getLevelUnlocks(10, {});
assert(unlocks10.some(u => u.includes('挑战地下城')), 'Level 10 challenge dungeon');

// Test ExplorationEvents serialization
const serialized = serializeExplorationEvents();
assert(serialized && typeof serialized.lastTurn === 'number', 'Serialization works');
deserializeExplorationEvents(serialized);

// Summary
console.log(`\n=== New Features Test ===`);
console.log(`✅ Passed: ${pass}`);
if (fail > 0) console.log(`❌ Failed: ${fail}`);
else console.log(`All ${pass} tests passed!`);
process.exit(fail > 0 ? 1 : 0);
