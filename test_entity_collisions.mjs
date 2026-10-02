/**
 * 实体碰撞检测测试 — 全12章72层
 * 验证:
 *   1. playerStart在地图范围内且为FLOOR
 *   2. 实体坐标在地图范围内
 *   3. 实体不在WALL上
 *   4. 实体坐标 ≠ playerStart
 *   5. 同层实体坐标唯一（无重叠）
 *   6. 同章实体ID唯一
 */
import { TILE } from './src/core/constants.js';
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
function assert(cond, msg) {
  if (cond) { pass++; }
  else { fail++; console.error(`  ✗ ${msg}`); }
}

const chapters = [
  generateChapter1(), generateChapter2(), generateChapter3(),
  generateChapter4(), generateChapter5(), generateChapter6(),
  generateChapter7(), generateChapter8(), generateChapter9(),
  generateChapter10(), generateChapter11(), generateChapter12(),
];

let totalEntities = 0;

for (const ch of chapters) {
  const chapterIds = new Set();
  console.log(`\n${ch.name}`);

  for (const floor of ch.floors) {
    const { tiles, width, height, playerStart, entities, id } = floor;

    // playerStart
    assert(
      playerStart.x >= 0 && playerStart.x < width && playerStart.y >= 0 && playerStart.y < height,
      `${id}: playerStart(${playerStart.x},${playerStart.y}) 超出地图范围 ${width}x${height}`
    );
    assert(
      tiles[playerStart.y][playerStart.x] !== TILE.WALL,
      `${id}: playerStart(${playerStart.x},${playerStart.y}) 在墙上`
    );

    const posSet = new Set();
    let floorOk = true;

    for (const e of entities) {
      if (!e) { assert(false, `${id}: undefined实体（稀疏数组残留）`); floorOk = false; continue; }
      totalEntities++;

      // 范围
      assert(
        e.x >= 0 && e.x < width && e.y >= 0 && e.y < height,
        `${id}: ${e.id}(${e.x},${e.y}) 超出地图范围`
      );

      // 不在墙上
      if (tiles[e.y] && tiles[e.y][e.x] !== undefined) {
        assert(
          tiles[e.y][e.x] !== TILE.WALL,
          `${id}: ${e.id}(${e.x},${e.y}) 在墙上`
        );
      }

      // 不与playerStart重合
      assert(
        !(e.x === playerStart.x && e.y === playerStart.y),
        `${id}: ${e.id}(${e.x},${e.y}) 与playerStart重合`
      );

      // 同层坐标唯一
      const posKey = `${e.x},${e.y}`;
      assert(
        !posSet.has(posKey),
        `${id}: ${e.id}(${e.x},${e.y}) 坐标与同层其他实体重叠`
      );
      posSet.add(posKey);

      // 同章ID唯一
      assert(
        !chapterIds.has(e.id),
        `${id}: 实体ID '${e.id}' 在本章重复`
      );
      chapterIds.add(e.id);
    }

    if (floorOk) {
      console.log(`  ${id}: ✓ ${entities.length}个实体无碰撞 [${floor.name}]`);
    }
  }
}

console.log(`\n════════════════════════════════════════`);
console.log(`${pass + fail} 项检查: ${pass} 通过, ${fail} 失败`);
console.log(`总实体数: ${totalEntities}`);
if (fail === 0) console.log(`✅ 全12章实体碰撞检测通过`);
else { console.log(`❌ ${fail} 项失败`); process.exit(1); }
