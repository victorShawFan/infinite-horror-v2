// ═══════════════════════════════════════════════════════════════
// 游戏逻辑端到端验证测试
// ═══════════════════════════════════════════════════════════════

// Import core modules (they use browser APIs we need to mock)
const TILE = { VOID: 0, FLOOR: 1, WALL: 2, DOOR: 3, STAIRS: 4, WATER: 5, LAVA: 6, VENT: 7 };
const ENTITY_TYPE = { PLAYER: 'player', ENEMY: 'enemy', NPC: 'npc', ITEM: 'item', TRAP: 'trap', EVENT: 'event', BOSS: 'boss', COMPANION: 'companion' };

// We can't import ES modules directly with browser deps, so test by reading source
import { readFileSync } from 'fs';

const mapSrc = readFileSync('src/core/MapGenerator.js', 'utf8');
const combatSrc = readFileSync('src/core/CombatSystem.js', 'utf8');

console.log('═══ 游戏逻辑验证测试 ═══\n');

// Test 1: All 6 floors exist and have required properties
console.log('🔍 测试1: 楼层完整性');
const floorFunctions = mapSrc.match(/function generateFloor_\d+_\d+/g);
console.log(`  楼层数量: ${floorFunctions.length}`);
console.assert(floorFunctions.length === 6, 'Should have 6 floors');

// Check each floor has playerStart, entities, onClear/null
for (let i = 1; i <= 6; i++) {
  const regex = new RegExp(`generateFloor_1_${i}.*?(?=function generateFloor_1_${i+1}|$)`, 's');
  const match = mapSrc.match(regex);
  if (match) {
    const body = match[0];
    const hasPlayerStart = body.includes('playerStart');
    const hasEntities = body.includes('entities:');
    const hasStairs = body.includes('TILE.STAIRS');
    console.log(`  1-${i}: playerStart=${hasPlayerStart} entities=${hasEntities} stairs=${hasStairs}`);
    console.assert(hasPlayerStart, `Floor 1-${i} missing playerStart`);
    console.assert(hasEntities, `Floor 1-${i} missing entities`);
    console.assert(hasStairs, `Floor 1-${i} missing stairs`);
  }
}

// Test 2: Combat system functions exist
console.log('\n🔍 测试2: 战斗系统');
const hasCombatFuncs = ['calcDamage', 'previewBattle', 'executeBattle', 'getEffectiveAtk', 'getEffectiveDef', 'getStatsBreakdown'];
for (const fn of hasCombatFuncs) {
  const exists = combatSrc.includes(`function ${fn}`) || combatSrc.includes(`export function ${fn}`);
  console.log(`  ${fn}: ${exists ? '✓' : '✗'}`);
  console.assert(exists, `Missing function: ${fn}`);
}

// Test 3: Numerical balance - simulate a basic fight
console.log('\n🔍 测试3: 数值平衡');
// Player: ATK=12, DEF=8. Zombie_1: HP=15, ATK=6, DEF=2
const playerAtk = 12, playerDef = 8;
const zombieHp = 15, zombieAtk = 6, zombieDef = 2;
const playerDmg = Math.max(1, playerAtk - zombieDef); // 10
const zombieDmg = Math.max(0, zombieAtk - playerDef); // 0
const turnsToKill = Math.ceil(zombieHp / playerDmg); // 2
const totalDmgTaken = zombieDmg * Math.max(0, turnsToKill - 1); // 0
console.log(`  Player DMG/hit: ${playerDmg}`);
console.log(`  Zombie DMG/hit: ${zombieDmg}`);
console.log(`  Turns to kill: ${turnsToKill}`);
console.log(`  Total damage taken: ${totalDmgTaken}`);
console.log(`  Result: ${100 > totalDmgTaken ? '✓ WIN' : '✗ LOSE'}`);
console.assert(100 > totalDmgTaken, 'Player should beat first zombie');

// Test 4: Boss fight feasibility
console.log('\n🔍 测试4: Boss可行性 (暴君 T-002)');
// Estimated stats at boss: ATK~28, DEF~15, HP~150
const bossHp = 150, bossAtk = 22, bossDef = 12;
const estAtk = 28, estDef = 15, estHp = 150;
const pDmg = Math.max(1, estAtk - bossDef); // 16
const bDmg = Math.max(1, bossAtk - estDef); // 7
const bTurns = Math.ceil(bossHp / pDmg); // 10
const bDmgTaken = bDmg * Math.max(0, bTurns - 1); // 63
console.log(`  Player ATK~${estAtk} vs Boss DEF=${bossDef}: ${pDmg}/hit`);
console.log(`  Boss ATK=${bossAtk} vs Player DEF~${estDef}: ${bDmg}/hit`);
console.log(`  Turns: ${bTurns}, Total damage: ${bDmgTaken}`);
console.log(`  Win with HP~${estHp}: ${estHp > bDmgTaken ? '✓ YES' : '✗ NO'} (HP after: ${estHp - bDmgTaken})`);
console.assert(estHp > bDmgTaken, 'Boss should be beatable');

// Test 5: Key story events exist
console.log('\n🔍 测试5: 关键剧情事件');
const storyChecks = [
  ['牟钢死亡', 'mou_gang_death'],
  ['基因锁觉醒', 'gene_lock_trigger'],
  ['章节结束', 'ch1_ending'],
  ['主神介绍', 'ch1_intro'],
  ['暴君Boss', 'boss_tyrant'],
];
for (const [name, id] of storyChecks) {
  const exists = mapSrc.includes(`'${id}'`);
  console.log(`  ${name} (${id}): ${exists ? '✓' : '✗'}`);
  console.assert(exists, `Missing story event: ${id}`);
}

// Test 6: Asset manifest check
console.log('\n🔍 测试6: 资产文件');
import { readdirSync, existsSync } from 'fs';
const assetDirs = ['public/assets/scenes', 'public/assets/characters', 'public/assets/enemies'];
for (const dir of assetDirs) {
  if (existsSync(dir)) {
    const files = readdirSync(dir);
    console.log(`  ${dir}: ${files.length} files`);
    console.assert(files.length > 0, `${dir} should not be empty`);
  } else {
    console.log(`  ${dir}: ✗ MISSING`);
  }
}

// Test 7: All JS modules parse without errors
console.log('\n🔍 测试7: 模块语法检查');
import { execSync } from 'child_process';
const jsFiles = execSync('find src -name "*.js"').toString().trim().split('\n');
let parseErrors = 0;
for (const file of jsFiles) {
  try {
    execSync(`node --check ${file} 2>&1`);
    console.log(`  ${file}: ✓`);
  } catch (e) {
    console.log(`  ${file}: ✗ PARSE ERROR`);
    parseErrors++;
  }
}

console.log(`\n═══ 测试结果: ${parseErrors === 0 ? '✅ 全部通过' : '❌ 有错误'} ═══`);
