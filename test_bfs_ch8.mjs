// ═══ 第八章 BFS 可达性 + 实体位置验证 ═══
import { generateChapter8 } from './src/core/MapGenerator_Ch8.js';
import { TILE, ENTITY_TYPE } from './src/core/constants.js';

function bfs(tiles, sx, sy) {
  const H = tiles.length, W = tiles[0].length;
  const visited = Array.from({ length: H }, () => Array(W).fill(false));
  const queue = [[sx, sy]];
  visited[sy][sx] = true;
  while (queue.length) {
    const [cx, cy] = queue.shift();
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nx = cx + dx, ny = cy + dy;
      if (nx >= 0 && nx < W && ny >= 0 && ny < H && !visited[ny][nx] && tiles[ny][nx] !== 0) {
        visited[ny][nx] = true;
        queue.push([nx, ny]);
      }
    }
  }
  return visited;
}

let pass = 0, fail = 0;

const ch = generateChapter8();
console.log(`═══ 第八章「${ch.name}」BFS 可达性验证 ═══\n`);

for (const floor of ch.floors) {
  const { tiles, playerStart, entities, id, name } = floor;
  const H = tiles.length, W = tiles[0].length;

  // Verify playerStart is walkable
  const startTile = tiles[playerStart.y][playerStart.x];
  if (startTile === 0) {
    console.log(`${id}: ✗ playerStart(${playerStart.x},${playerStart.y}) 在墙上!`);
    fail++;
    continue;
  }

  // BFS from playerStart
  const reachable = bfs(tiles, playerStart.x, playerStart.y);
  let allOk = true;
  let entityCount = 0;

  for (const e of entities) {
    entityCount++;
    if (!reachable[e.y][e.x]) {
      console.log(`  ✗ ${e.name}(${e.x},${e.y}) 不可达!`);
      allOk = false;
      fail++;
    }
    // Also check entity is not on a wall
    if (tiles[e.y][e.x] === 0) {
      console.log(`  ✗ ${e.name}(${e.x},${e.y}) 在墙上!`);
      allOk = false;
      fail++;
    }
  }

  // Verify stairs exist and is reachable (except final floor)
  let stairsOk = true;
  let stairsFound = false;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (tiles[y][x] === 3) { // STAIRS
        stairsFound = true;
        if (!reachable[y][x]) {
          console.log(`  ✗ 楼梯(${x},${y}) 不可达!`);
          stairsOk = false;
          fail++;
        }
      }
    }
  }

  // Verify tiles/width/height/playerStart contract
  if (!tiles || !floor.width || !floor.height || !playerStart) {
    console.log(`  ✗ Renderer 契约缺失`);
    allOk = false;
    fail++;
  }

  if (allOk && stairsOk) {
    console.log(`Floor ${id}: ✓ playerStart可行走 + ${entityCount}个实体均BFS可达 [${name}]`);
    pass++;
  }
}

console.log(`\n═══ ${pass + fail === 0 ? '无楼层' : fail === 0 ? '✅ 第八章BFS可达性全部通过' : `❌ ${fail}项失败`} ═══`);
process.exit(fail > 0 ? 1 : 0);
