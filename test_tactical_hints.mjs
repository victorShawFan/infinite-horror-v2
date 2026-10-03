// ═══ 战术提示系统验证 ═══
import { gameState } from './src/core/GameState.js';
import { generateTacticalHints, formatTacticalHintsHTML } from './src/core/TacticalHints.js';

let pass = 0, fail = 0;
function assert(cond, msg) { if (cond) pass++; else { fail++; console.log(`  ❌ ${msg}`); } }

console.log('═══ 战术提示验证 ═══\n');

// Set chapter for weapon hint
gameState.chapter = 3;

const mockPlayer = { hp: 80, maxHp: 100, atk: 15, def: 10, spd: 10, crt: 5, level: 3, weapon: null, inventory: [] };
const mockEnemy = { hp: 50, atk: 12, def: 5, name: '测试怪', weaknesses: ['fire'] };
const mockPreview = { canWin: true, hpAfter: 60, turnsNeeded: 3, totalDamage: 20, playerDmgPerHit: 10, enemyDmgPerHit: 4 };

// Basic generation
const hints = generateTacticalHints(mockPlayer, mockEnemy, mockPreview);
assert(Array.isArray(hints), 'hints应该是数组');
assert(hints.length >= 1 && hints.length <= 3, '1-3条提示');

for (const h of hints) {
  assert(h.icon && h.text && h.color, 'hint字段完整');
}

assert(hints.some(h => h.text.includes('弱')), '应有弱点提示');
assert(hints.some(h => h.text.includes('武器')), '应有装备武器提示');

// Low HP
const lowHints = generateTacticalHints({ ...mockPlayer, hp: 20 }, mockEnemy, mockPreview);
assert(lowHints.some(h => h.text.includes('HP')), '低HP应有警告');

// Lose scenario
const loseHints = generateTacticalHints(mockPlayer, mockEnemy, { ...mockPreview, canWin: false });
assert(loseHints.some(h => h.text.includes('不足')), '必败应有提示');

// Boss
const bossHints = generateTacticalHints(mockPlayer, { ...mockEnemy, bossId: 'test' }, mockPreview);
assert(bossHints.some(h => h.text.includes('Boss') || h.text.includes('阶段')), 'Boss应有提示');

// Elite
const eliteHints = generateTacticalHints(mockPlayer, { ...mockEnemy, _eliteTier: 1 }, mockPreview);
assert(eliteHints.some(h => h.text.includes('精英')), '精英应有提示');

// HTML
assert(formatTacticalHintsHTML(hints).includes('战术提示'), 'HTML应含标题');
assert(formatTacticalHintsHTML([]) === '', '空数组应返回空');

console.log(`\nPassed: ${pass}  Failed: ${fail}`);
if (fail > 0) { process.exit(1); } else { console.log('\n═══ ✅ 战术提示验证全部通过 ═══'); }
