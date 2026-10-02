// ═══ Lore覆盖度验证 ═══
// 验证所有LORE_ENTRIES都在地图中有对应实体

import { LORE_ENTRIES } from './src/core/LoreSystem.js';
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

const chapters = [
  generateChapter1(), generateChapter2(), generateChapter3(),
  generateChapter4(), generateChapter5(), generateChapter6(),
  generateChapter7(), generateChapter8(), generateChapter9(),
  generateChapter10(), generateChapter11(), generateChapter12(),
];

// Collect all loreIds from maps
const mapLoreIds = new Set();
for (const ch of chapters) {
  for (const floor of ch.floors) {
    for (const e of (floor.entities || [])) {
      if (e && e.loreId) mapLoreIds.add(e.loreId);
    }
  }
}

// Check coverage
const allLoreIds = Object.keys(LORE_ENTRIES);
let missing = 0;
let covered = 0;

console.log('═══ Lore覆盖度验证 ═══\n');
console.log(`定义的Lore条目: ${allLoreIds.length}`);
console.log(`地图中的Lore实体: ${mapLoreIds.size}\n`);

for (const id of allLoreIds) {
  if (mapLoreIds.has(id)) {
    covered++;
  } else {
    console.log(`❌ 未在地图中放置: ${id} (Ch${LORE_ENTRIES[id].chapter}) "${LORE_ENTRIES[id].title}"`);
    missing++;
  }
}

console.log(`\n覆盖率: ${covered}/${allLoreIds.length} (${Math.round(covered/allLoreIds.length*100)}%)`);

if (missing > 0) {
  console.log(`\n═══ ❌ ${missing}条Lore未在地图中放置 ═══`);
  process.exit(1);
} else {
  console.log('\n═══ ✅ 所有Lore条目均已在地图中放置 ═══');
}
