import { generateChapter5 } from './src/core/MapGenerator_Ch5.js';
import { TILE } from './src/core/constants.js';
function bfs(tiles, start) {
  const H = tiles.length, W = tiles[0].length;
  const visited = Array.from({ length: H }, () => Array(W).fill(false));
  const queue = [[start.x, start.y]]; visited[start.y][start.x] = true;
  const dirs = [[0,1],[0,-1],[1,0],[-1,0]];
  while (queue.length) { const [cx, cy] = queue.shift(); for (const [dx, dy] of dirs) { const nx = cx + dx, ny = cy + dy; if (nx >= 0 && nx < W && ny >= 0 && ny < H && !visited[ny][nx] && tiles[ny][nx] === TILE.FLOOR) { visited[ny][nx] = true; queue.push([nx, ny]); } } }
  return visited;
}
const ch5 = generateChapter5();
let allPass = true;
for (const f of ch5.floors) {
  const ps = f.playerStart;
  if (!f.tiles || typeof f.width !== 'number' || typeof f.height !== 'number') { console.error(`Floor ${f.id}: ✗ Renderer契约`); allPass = false; continue; }
  if (f.tiles[ps.y][ps.x] !== TILE.FLOOR) { console.error(`Floor ${f.id}: ✗ playerStart不是地板`); allPass = false; continue; }
  const visited = bfs(f.tiles, ps);
  const ents = f.entities.filter(e => e.x !== undefined);
  const unreachable = ents.filter(e => !visited[e.y]?.[e.x]);
  if (unreachable.length > 0) { console.error(`Floor ${f.id}: ✗ ${unreachable.length}个不可达: ${unreachable.map(e=>e.id).join(', ')}`); allPass = false; }
  else console.log(`Floor ${f.id}: ✓ ${ents.length}个实体可达 [${f.name}]`);
}
console.log();
if (allPass) console.log('═══ ✅ 第五章BFS可达性全部通过 ═══');
else { console.error('═══ ❌ 有不可达实体 ═══'); process.exit(1); }
