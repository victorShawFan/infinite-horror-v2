// BFS可达性测试 — 第三章咒怨阴影
import { generateChapter3 } from './src/core/MapGenerator_Ch3.js';
import { TILE } from './src/core/constants.js';

function bfs(tiles, start) {
  const H = tiles.length, W = tiles[0].length;
  const visited = Array.from({ length: H }, () => Array(W).fill(false));
  const queue = [[start.x, start.y]];
  visited[start.y][start.x] = true;
  const dirs = [[0,1],[0,-1],[1,0],[-1,0]];
  while (queue.length) {
    const [cx, cy] = queue.shift();
    for (const [dx, dy] of dirs) {
      const nx = cx + dx, ny = cy + dy;
      if (nx >= 0 && nx < W && ny >= 0 && ny < H && !visited[ny][nx] && tiles[ny][nx] === TILE.FLOOR) {
        visited[ny][nx] = true;
        queue.push([nx, ny]);
      }
    }
  }
  return visited;
}

const ch3 = generateChapter3();
let allPass = true;

for (let i = 0; i < ch3.floors.length; i++) {
  const f = ch3.floors[i];
  const ps = f.playerStart;

  // Renderer 契约检查
  if (!f.tiles || typeof f.width !== 'number' || typeof f.height !== 'number') {
    console.error(`Floor ${f.id}: ✗ Renderer契约不满足 (缺tiles/width/height)`);
    allPass = false;
    continue;
  }

  if (f.tiles[ps.y][ps.x] !== TILE.FLOOR) {
    console.error(`Floor ${f.id}: ✗ playerStart(${ps.x},${ps.y}) 不是地板!`);
    allPass = false;
    continue;
  }

  const visited = bfs(f.tiles, ps);
  const ents = f.entities.filter(e => e.x !== undefined && e.y !== undefined);
  let unreachable = [];

  for (const e of ents) {
    if (!visited[e.y]?.[e.x]) unreachable.push(`${e.id}(${e.x},${e.y})`);
  }

  if (unreachable.length > 0) {
    console.error(`Floor ${f.id}: ✗ ${unreachable.length}个不可达: ${unreachable.join(', ')}`);
    allPass = false;
  } else {
    console.log(`Floor ${f.id}: ✓ playerStart可行走 + ${ents.length}个实体均BFS可达 [${f.name}]`);
  }
}

console.log();
if (allPass) {
  console.log('═══ ✅ 第三章BFS可达性全部通过 ═══');
} else {
  console.error('═══ ❌ 有不可达实体 ═══');
  process.exit(1);
}
