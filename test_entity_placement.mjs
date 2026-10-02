// 实体位置验证 — BFS方式(匹配MapGenerator的tiles格式)
import { generateChapter1 } from './src/core/MapGenerator.js';
import { TILE } from './src/core/constants.js';

const WALKABLE = new Set([TILE.FLOOR, TILE.DOOR, TILE.STAIRS, TILE.VENT]);

function bfs(tiles, startX, startY, w, h) {
  const visited = Array.from({ length: h }, () => Array(w).fill(false));
  if (startY < 0 || startY >= h || startX < 0 || startX >= w) return visited;
  const queue = [[startX, startY]];
  visited[startY][startX] = true;
  const dirs = [[0,1],[0,-1],[1,0],[-1,0]];
  while (queue.length > 0) {
    const [cx, cy] = queue.shift();
    for (const [dx, dy] of dirs) {
      const nx = cx + dx, ny = cy + dy;
      if (nx >= 0 && nx < w && ny >= 0 && ny < h && !visited[ny][nx]) {
        const tile = tiles[ny][nx];
        if (WALKABLE.has(tile)) {
          visited[ny][nx] = true;
          queue.push([nx, ny]);
        }
      }
    }
  }
  return visited;
}

console.log('═══ 实体位置验证 ═══\n');
const ch1 = generateChapter1();
let issues = 0;

for (const f of ch1.floors) {
  const { playerStart: ps, tiles, width: w, height: h, entities } = f;
  const visited = bfs(tiles, ps.x, ps.y, w, h);
  let floorOk = true;
  for (const e of entities.filter(e => e.x !== undefined)) {
    if (!visited[e.y]?.[e.x]) {
      console.error(`  ${f.id}: ${e.id}(${e.x},${e.y}) 不可达`);
      issues++;
      floorOk = false;
    }
  }
  if (floorOk) console.log(`Floor ${f.id}: ✓ 所有实体位置正确`);
}

if (issues === 0) console.log('\n═══ ✅ 实体位置验证全部通过 ═══');
else { console.error(`\n═══ ❌ ${issues}个问题 ═══`); process.exit(1); }
