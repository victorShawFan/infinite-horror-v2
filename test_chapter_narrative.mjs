// ═══════════════════════════════════════════════════════════════
// 章节叙事完整性验证 — 确保12章都有丰富的故事内容
// ═══════════════════════════════════════════════════════════════

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

let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; } else { fail++; console.error('FAIL:', msg); } }

const generators = [
  generateChapter1, generateChapter2, generateChapter3, generateChapter4,
  generateChapter5, generateChapter6, generateChapter7, generateChapter8,
  generateChapter9, generateChapter10, generateChapter11, generateChapter12,
];

for (let i = 0; i < 12; i++) {
  const ch = generators[i]();
  const chNum = i + 1;
  console.log(`[ 第${chNum}章: ${ch.name} ]`);
  
  // 基本结构
  ok(ch.name && ch.name.length > 3, `Ch${chNum}: 有章节名`);
  ok(ch.floors && ch.floors.length >= 5, `Ch${chNum}: 至少5层 (实际${ch.floors?.length})`);
  
  let totalEnemies = 0, totalBosses = 0, totalItems = 0, totalEvents = 0, totalCompanions = 0;
  let hasDialogue = false, hasChapterEnd = false;
  
  for (const floor of ch.floors) {
    // 楼层基本属性
    ok(floor.id && floor.name, `Ch${chNum} ${floor.id}: 有名字`);
    ok(floor.subtitle && floor.subtitle.length > 5, `Ch${chNum} ${floor.id}: 有副标题`);
    ok(floor.tiles && floor.tiles.length > 0, `Ch${chNum} ${floor.id}: 有地图`);
    ok(floor.playerStart, `Ch${chNum} ${floor.id}: 有起始位置`);
    ok(floor.entities && floor.entities.length > 0, `Ch${chNum} ${floor.id}: 有实体`);
    
    // 统计实体
    for (const e of (floor.entities || [])) {
      if (e.type === 'enemy') totalEnemies++;
      if (e.type === 'boss') totalBosses++;
      if (e.type === 'item') totalItems++;
      if (e.type === 'event') totalEvents++;
      if (e.type === 'companion') totalCompanions++;
      
      // 检查对话事件
      if (e.event?.lines?.length > 0) hasDialogue = true;
      if (e.event?.type === 'chapter_end') hasChapterEnd = true;
    }
  }
  
  // 内容丰富度
  ok(totalEnemies >= 6, `Ch${chNum}: 至少6个敌人 (实际${totalEnemies})`);
  ok(totalBosses >= 1, `Ch${chNum}: 至少1个Boss (实际${totalBosses})`);
  ok(totalItems >= 3, `Ch${chNum}: 至少3个物品 (实际${totalItems})`);
  ok(totalEvents >= 1, `Ch${chNum}: 至少1个事件 (实际${totalEvents})`);
  ok(hasDialogue, `Ch${chNum}: 有对话剧情`);
  ok(hasChapterEnd, `Ch${chNum}: 有章节结算事件`);
  
  // 楼层过渡叙事
  const floorTransitions = ch.floors.filter(f => f.onClear).length;
  ok(floorTransitions >= 2, `Ch${chNum}: 至少2个楼层过渡文本 (实际${floorTransitions})`);
  
  console.log(`  → ${totalEnemies}敌 ${totalBosses}Boss ${totalItems}物 ${totalEvents}事 ${totalCompanions}伴 ${floorTransitions}过渡`);
}

console.log(`\n══════════════════════════════════════════`);
console.log(`章节叙事完整性: ${pass}通过, ${fail}失败`);
if (fail === 0) console.log('✅ 全12章叙事验证通过');
else { console.log(`⚠️  ${fail} 项需修复`); process.exit(1); }
