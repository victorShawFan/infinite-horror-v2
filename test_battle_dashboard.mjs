// ═══════════════════════════════════════════════════════════════
// 战斗统计仪表板测试
// ═══════════════════════════════════════════════════════════════
import { calculatePowerRating, renderBattleStatsDashboard, getBattleDashboardSummary } from './src/core/BattleStatsDashboard.js';
import { gameState } from './src/core/GameState.js';

let passed = 0, failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('  ✗ FAIL:', msg); }
}
function section(name) { console.log(`[ ${name} ]`); }

// ═══════════════════════════════════════════
section('战力计算');
gameState.player = {
  hp: 200, maxHp: 200, atk: 100, def: 50, spd: 10, crt: 15,
  level: 8, geneLock: 2, geneLockCharge: 300, mana: 30, maxMana: 30,
  gold: 5000, rewardPoints: 3000,
  bloodline: null, talents: { points: 0, allocated: { combat: 3, survival: 2, technique: 1 } },
};
gameState.stats = {
  enemiesKilled: 80, bossesKilled: 6, damageDealt: 15000,
  deathCount: 2, maxKillStreak: 12, maxSingleHit: 350,
  goldEarned: 8000, roomsExplored: 45, sRatings: 8,
};
gameState.companions = [
  { id: 'zhang_jie', name: '张杰', alive: false },
  { id: 'chu_xuan', name: '楚轩', alive: true },
];

const power = calculatePowerRating(gameState.player);
assert(power.total > 0, '总战力 > 0: ' + power.total);
assert(typeof power.grade === 'string', '有评级: ' + power.grade);
assert(power.offense > 0, '攻击力 > 0: ' + power.offense);
assert(power.defense > 0, '防御力 > 0: ' + power.defense);
assert(power.breakdown.atk > 0, '攻击分解正确');
assert(power.breakdown.def > 0, '防御分解正确');
assert(power.breakdown.geneLock === 2, '基因锁阶段正确');

// ═══════════════════════════════════════════
section('评级范围');
// 低属性 → D/C
const weakPlayer = { ...gameState.player, atk: 10, def: 5, maxHp: 50, level: 1, geneLock: 0, crt: 0, spd: 3 };
const weakPower = calculatePowerRating(weakPlayer);
assert(['D', 'C'].includes(weakPower.grade), '低属性玩家评级D/C: ' + weakPower.grade);

// 高属性 → S/SS/SSS
const strongPlayer = { ...gameState.player, atk: 500, def: 300, maxHp: 1500, level: 15, geneLock: 4, crt: 40, spd: 25 };
const strongPower = calculatePowerRating(strongPlayer);
assert(['S', 'SS', 'SSS'].includes(strongPower.grade), '高属性玩家评级S+: ' + strongPower.grade);

// ═══════════════════════════════════════════
section('面板渲染');
const html = renderBattleStatsDashboard();
assert(html.includes('战斗仪表板'), '包含标题');
assert(html.includes('ATK'), '包含ATK');
assert(html.includes('DEF'), '包含DEF');
assert(html.includes('基因锁'), '包含基因锁');
assert(html.includes('击杀敌人'), '包含击杀统计');
assert(html.includes('成长趋势'), '包含成长趋势');
assert(html.includes('评级分布'), '包含评级分布');
assert(html.includes('天赋路线'), '包含天赋路线');
assert(html.includes('svg'), '包含雷达图SVG');

// ═══════════════════════════════════════════
section('摘要');
const summary = getBattleDashboardSummary();
assert(summary.includes('战力'), '摘要包含战力');
assert(summary.includes('ATK'), '摘要包含ATK');

console.log(`\n══════════════════════════════════════════`);
console.log(`战斗仪表板测试: ${passed}通过, ${failed}失败`);
if (failed === 0) console.log('✅ 战斗仪表板全部通过');
else { console.log('❌ 有失败'); process.exit(1); }
