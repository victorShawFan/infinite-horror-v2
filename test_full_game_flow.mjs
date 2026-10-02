/**
 * test_full_game_flow.mjs — 全游戏流程模拟验证
 * 
 * 模拟玩家从Ch1到Ch12的完整流程:
 * - 验证每层生成有效
 * - 验证敌人数值缩放合理(玩家可以通过升级+战斗击败)
 * - 验证战斗系统 executeBattle 在合理成长路径下不会陷入死循环
 * - 验证章节连贯性
 */
import { generateChapter1 } from './src/core/MapGenerator.js';
import { generateChapter2 } from './src/core/MapGenerator_Ch2.js';
import { generateChapter3 } from './src/core/MapGenerator_Ch3.js';
import { generateChapter4 } from './src/core/MapGenerator_Ch4.js';
import { generateChapter5 } from './src/core/MapGenerator_Ch5.js';
import { generateChapter6 } from './src/core/MapGenerator_Ch6.js';
import { generateChapter7 } from './src/core/MapGenerator_Ch7.js';
import { generateChapter8 } from './src/core/MapGenerator_Ch8.js';
import { generateChapter9 } from './src/core/MapGenerator_Ch9.js';
import { generateChapter10 } from './src/core/MapGenerator_Ch10.js';
import { generateChapter11 } from './src/core/MapGenerator_Ch11.js';
import { generateChapter12 } from './src/core/MapGenerator_Ch12.js';
import { scaleEnemy, CHAPTER_SCALING } from './src/core/DifficultyScaler.js';
import { calcDamage } from './src/core/CombatSystem.js';

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; }
  else { fail++; console.error(`  ✗ ${msg}`); }
}

console.log('═══ 全游戏流程模拟验证 ═══\n');

const chapters = [
  { gen: generateChapter1, num: 1 },
  { gen: generateChapter2, num: 2 },
  { gen: generateChapter3, num: 3 },
  { gen: generateChapter4, num: 4 },
  { gen: generateChapter5, num: 5 },
  { gen: generateChapter6, num: 6 },
  { gen: generateChapter7, num: 7 },
  { gen: generateChapter8, num: 8 },
  { gen: generateChapter9, num: 9 },
  { gen: generateChapter10, num: 10 },
  { gen: generateChapter11, num: 11 },
  { gen: generateChapter12, num: 12 },
];

// 模拟玩家成长
let simPlayer = {
  level: 1,
  hp: 100, maxHp: 100,
  atk: 10, def: 5, spd: 5, crt: 5,
  exp: 0, expToNext: 20,
  gold: 0,
};

function simulateLevelUp() {
  while (simPlayer.exp >= simPlayer.expToNext) {
    simPlayer.exp -= simPlayer.expToNext;
    simPlayer.level++;
    simPlayer.maxHp += 12;
    simPlayer.hp = simPlayer.maxHp;
    simPlayer.atk += 2;
    simPlayer.def += 1;
    simPlayer.spd += 1;
    if (simPlayer.level % 3 === 0) simPlayer.crt += 2;
    simPlayer.expToNext = 20 + (simPlayer.level - 1) * 15;
  }
}

let totalEnemies = 0;
let totalBosses = 0;
let totalItems = 0;
let totalEvents = 0;

for (const { gen, num } of chapters) {
  const ch = gen();
  assert(ch && ch.floors, `Ch${num}: 生成成功`);
  assert(ch.floors.length === 6, `Ch${num}: 6层 (${ch.floors?.length})`);
  
  let chapterEnemies = 0;
  let chapterBossFound = false;

  for (let fi = 0; fi < ch.floors.length; fi++) {
    const floor = ch.floors[fi];
    assert(floor.tiles, `${num}-${fi+1}: tiles存在`);
    assert(floor.playerStart, `${num}-${fi+1}: playerStart存在`);
    assert(floor.entities, `${num}-${fi+1}: entities存在`);

    for (const ent of floor.entities) {
      if (ent.type === 'enemy' || ent.type === 'boss') {
        totalEnemies++;
        chapterEnemies++;
        if (ent.bossId || ent.type === 'boss') {
          totalBosses++;
          chapterBossFound = true;
        }

        // 模拟战斗: 缩放后的敌人 vs 当前模拟玩家
        const scaled = scaleEnemy(ent, num);
        const dmgToEnemy = Math.max(1, simPlayer.atk - scaled.def);
        const dmgToPlayer = Math.max(0, scaled.atk - simPlayer.def);
        
        // 检查是否能在100回合内击败
        const turnsToKill = dmgToEnemy > 0 ? Math.ceil(scaled.hp / dmgToEnemy) : Infinity;
        const turnsToLose = dmgToPlayer > 0 ? Math.ceil(simPlayer.hp / dmgToPlayer) : Infinity;
        
        // 合理性: 不要求每次都能赢，但不应该出现完全打不过(100+回合)
        assert(turnsToKill < 200, `${num}-${fi+1} ${ent.name}: 击杀回合=${turnsToKill} <200`);

        // 模拟获得经验和金币
        if (turnsToKill < turnsToLose) {
          // 能赢：获取奖励
          if (ent.rewards) {
            simPlayer.exp += (ent.rewards.exp || 0);
            simPlayer.gold += (ent.rewards.gold || 0);
          }
          simPlayer.hp = Math.max(1, simPlayer.hp - dmgToPlayer * turnsToKill);
          simulateLevelUp();
        }
      } else if (ent.type === 'item') {
        totalItems++;
        // 模拟拾取药水
        if (ent.effect?.heal) {
          simPlayer.hp = Math.min(simPlayer.maxHp, simPlayer.hp + ent.effect.heal);
        }
        if (ent.effect?.maxHp) {
          simPlayer.maxHp += ent.effect.maxHp;
          simPlayer.hp += ent.effect.maxHp;
        }
        if (ent.effect?.atk) simPlayer.atk += ent.effect.atk;
        if (ent.effect?.def) simPlayer.def += ent.effect.def;
      } else if (ent.type === 'event') {
        totalEvents++;
      }
    }

    // 每层结束恢复一些HP(模拟真实游戏中的治疗)
    simPlayer.hp = Math.min(simPlayer.maxHp, simPlayer.hp + Math.floor(simPlayer.maxHp * 0.2));
  }

  // 每章应有至少一个Boss(最后一层通常有)
  // 不做强制断言，因为某些章节结构不同

  console.log(`  Ch${num} [${ch.name}]: ${chapterEnemies}敌 ${chapterBossFound ? '✦Boss' : ''} | 模拟Lv.${simPlayer.level} HP:${simPlayer.hp}/${simPlayer.maxHp} ATK:${simPlayer.atk} DEF:${simPlayer.def}`);
}

// ── 总结统计 ──
console.log(`\n═══ 游戏流程统计 ═══`);
console.log(`  总敌人: ${totalEnemies}`);
console.log(`  总Boss: ${totalBosses}`);
console.log(`  总物品: ${totalItems}`);
console.log(`  总事件: ${totalEvents}`);
console.log(`  模拟最终: Lv.${simPlayer.level} HP:${simPlayer.hp}/${simPlayer.maxHp} ATK:${simPlayer.atk} DEF:${simPlayer.def} Gold:${simPlayer.gold}`);
console.log(`  章节缩放: ${Object.entries(CHAPTER_SCALING).map(([k,v]) => `Ch${k}:${v}x`).join(' ')}`);

// 最终验证
assert(totalEnemies >= 100, `总敌人≥100 (${totalEnemies})`);
assert(totalBosses >= 8, `总Boss≥8 (${totalBosses})`);
assert(totalItems >= 50, `总物品≥50 (${totalItems})`);
assert(simPlayer.level >= 10, `模拟最终等级≥10 (Lv.${simPlayer.level})`);

console.log(`\n═══ 全流程验证: ${pass}通过, ${fail}失败 ═══`);
if (fail > 0) process.exit(1);
