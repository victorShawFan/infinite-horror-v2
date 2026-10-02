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

// ── 第二章实体位置验证 ──
import { generateChapter2 } from './src/core/MapGenerator_Ch2.js';
import { generateChapter3 } from './src/core/MapGenerator_Ch3.js';
import { generateChapter4 } from './src/core/MapGenerator_Ch4.js';
import { generateChapter5 } from './src/core/MapGenerator_Ch5.js';
import { generateChapter7 } from './src/core/MapGenerator_Ch7.js';
import { generateChapter8 } from './src/core/MapGenerator_Ch8.js';
import { generateChapter9 } from './src/core/MapGenerator_Ch9.js';
import { generateChapter10 } from './src/core/MapGenerator_Ch10.js';
import { generateChapter11 } from './src/core/MapGenerator_Ch11.js';
import { generateChapter12 } from './src/core/MapGenerator_Ch12.js';

console.log('\n═══ 第二章实体位置验证 ═══\n');
const ch2 = generateChapter2();

for (const f of ch2.floors) {
  const { playerStart: ps, tiles, width: w, height: h, entities } = f;
  if (!tiles || !w || !h) {
    console.error(`Floor ${f.id}: ✗ 缺少 tiles/width/height — Renderer契约不兼容!`);
    issues++;
    continue;
  }
  const visited = bfs(tiles, ps.x, ps.y, w, h);
  let floorOk = true;
  for (const e of entities.filter(e => e.x !== undefined)) {
    if (!visited[e.y]?.[e.x]) {
      console.error(`  ${f.id}: ${e.id}(${e.x},${e.y}) 不可达`);
      issues++;
      floorOk = false;
    }
  }
  if (floorOk) console.log(`Floor ${f.id}: ✓ 所有实体位置正确 [${f.name}]`);
}

// ── 第三章实体位置验证 ──
console.log('\n═══ 第三章实体位置验证 ═══\n');
const ch3 = generateChapter3();

for (const f of ch3.floors) {
  const { playerStart: ps, tiles, width: w, height: h, entities } = f;
  if (!tiles || !w || !h) {
    console.error(`Floor ${f.id}: 缺tiles/width/height`);
    issues++;
    continue;
  }
  const visited = bfs(tiles, ps.x, ps.y, w, h);
  let floorOk = true;
  for (const e of entities.filter(e => e.x !== undefined)) {
    if (!visited[e.y]?.[e.x]) {
      console.error(`  ${f.id}: ${e.id}(${e.x},${e.y}) 不可达`);
      issues++;
      floorOk = false;
    }
  }
  if (floorOk) console.log(`Floor ${f.id}: ✓ 所有实体位置正确 [${f.name}]`);
}

// ── 第四章实体位置验证 ──
console.log('\n═══ 第四章实体位置验证 ═══\n');
const ch4 = generateChapter4();
for (const f of ch4.floors) {
  const { playerStart: ps, tiles, width: w, height: h, entities } = f;
  if (!tiles || !w || !h) { console.error('Floor ' + f.id + ': 缺tiles'); issues++; continue; }
  const visited = bfs(tiles, ps.x, ps.y, w, h);
  let floorOk = true;
  for (const e of entities.filter(e => e.x !== undefined)) {
    if (!visited[e.y]?.[e.x]) { console.error('  ' + f.id + ': ' + e.id + ' 不可达'); issues++; floorOk = false; }
  }
  if (floorOk) console.log('Floor ' + f.id + ': ✓ 所有实体位置正确 [' + f.name + ']');
}

// ── Renderer 契约测试 ──
console.log('\n═══ Renderer 数据契约验证 ═══\n');
let contractOk = true;
for (const [label, chapter] of [['Ch1', ch1], ['Ch2', ch2], ['Ch3', ch3], ['Ch4', ch4], ['Ch5', generateChapter5()], ['Ch7', generateChapter7()], ['Ch8', generateChapter8()], ['Ch9', generateChapter9()], ['Ch10', generateChapter10()], ['Ch11', generateChapter11()], ['Ch12', generateChapter12()]]) {
  for (const f of chapter.floors) {
    const missing = [];
    if (!f.tiles) missing.push('tiles');
    if (typeof f.width !== 'number') missing.push('width');
    if (typeof f.height !== 'number') missing.push('height');
    if (!f.playerStart) missing.push('playerStart');
    if (missing.length) {
      console.error(`${label} Floor ${f.id}: ✗ 缺少 ${missing.join(', ')}`);
      contractOk = false;
      issues++;
    } else {
      console.log(`${label} Floor ${f.id}: ✓ tiles/width/height/playerStart`);
    }
  }
}

if (issues === 0) console.log('\n═══ ✅ 全部实体位置 + Renderer契约验证通过 ═══');
else { console.error(`\n═══ ❌ ${issues}个问题 ═══`); process.exit(1); }
