/**
 * 真实 BFS 可达性验证 — 直接 import MapGenerator，零硬编码
 * 从 playerStart BFS 扩散，验证每个 entity 都可达
 */
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

const chapter = generateChapter1();
let totalIssues = 0;

for (let i = 0; i < chapter.floors.length; i++) {
  const floor = chapter.floors[i];
  const { tiles, entities, playerStart, width, height, name } = floor;
  const w = width || tiles[0].length;
  const h = height || tiles.length;

  const psTile = tiles[playerStart.y]?.[playerStart.x];
  if (!WALKABLE.has(psTile)) {
    console.log(`  1-${i+1} ✗ playerStart(${playerStart.x},${playerStart.y}) tile=${psTile} 不可行走! [${name}]`);
    totalIssues++;
    continue;
  }

  const visited = bfs(tiles, playerStart.x, playerStart.y, w, h);

  let floorOk = true;
  for (const e of entities) {
    const { x, y, id, name: eName } = e;
    const tile = tiles[y]?.[x];
    if (tile === undefined || tile === TILE.WALL || tile === TILE.VOID) {
      console.log(`  1-${i+1} ✗ (${x},${y}) tile=${tile} 在墙/虚空上 → ${eName} [${id}]`);
      floorOk = false;
      totalIssues++;
    } else if (!visited[y]?.[x]) {
      console.log(`  1-${i+1} ✗ (${x},${y}) BFS不可达(被隔离) → ${eName} [${id}]`);
      floorOk = false;
      totalIssues++;
    }
  }
  if (floorOk) {
    console.log(`Floor 1-${i+1}: ✓ playerStart可行走 + ${entities.length}个实体均BFS可达 [${name}]`);
  }
}

console.log(`\n═══ ${totalIssues === 0 ? '✅ BFS可达性全部通过' : `❌ ${totalIssues}个问题`} ═══`);
process.exit(totalIssues > 0 ? 1 : 0);
