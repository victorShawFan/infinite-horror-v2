import { readFileSync } from 'fs';

const TILE = { VOID: 0, FLOOR: 1, WALL: 2, DOOR: 3, STAIRS: 4, WATER: 5, LAVA: 6, VENT: 7 };

const mapSrc = readFileSync('src/core/MapGenerator.js', 'utf8');

console.log('═══ 地图连通性验证 ═══\n');

// Parse each floor
const floorDefs = [
  { name: '1-1', w: 13, h: 13, start: [6, 10], stairs: [6, 1] },
  { name: '1-2', w: 17, h: 15, start: [4, 12], stairs: [8, 1] },
  { name: '1-3', w: 17, h: 17, start: [8, 8], stairs: [13, 15] },
  { name: '1-4', w: 21, h: 9, start: [1, 4], stairs: [19, 4] },
  { name: '1-5', w: 17, h: 17, start: [4, 4], stairs: [13, 15] },
  { name: '1-6', w: 19, h: 15, start: [2, 4], stairs: [16, 1] },
];

// Extract room and corridor definitions for each floor
function parseFloor(floorNum) {
  const regex = new RegExp(`function generateFloor_1_${floorNum}\\(\\)(.*?)(?=function generateFloor_1_${floorNum + 1}|function makeChest|$)`, 's');
  const match = mapSrc.match(regex);
  if (!match) return null;
  
  const body = match[1];
  const def = floorDefs[floorNum - 1];
  const tiles = Array.from({ length: def.h }, () => Array(def.w).fill(TILE.WALL));
  
  // Parse carveRoom
  const rooms = [...body.matchAll(/carveRoom\(tiles,\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+)\)/g)];
  for (const m of rooms) {
    const [, x1, y1, x2, y2] = m.map(Number);
    for (let y = y1; y <= y2; y++)
      for (let x = x1; x <= x2; x++)
        if (y < def.h && x < def.w) tiles[y][x] = TILE.FLOOR;
  }
  
  // Parse carveCorridor
  const corrs = [...body.matchAll(/carveCorridor\(tiles,\s*(\d+),\s*(\d+),\s*(\d+),\s*(\d+)\)/g)];
  for (const m of corrs) {
    const [, x1, y1, x2, y2] = m.map(Number);
    const sx = Math.min(x1, x2), ex = Math.max(x1, x2);
    const sy = Math.min(y1, y2), ey = Math.max(y1, y2);
    for (let y = sy; y <= ey; y++)
      for (let x = sx; x <= ex; x++)
        if (y < def.h && x < def.w) tiles[y][x] = TILE.FLOOR;
  }
  
  // Parse STAIRS
  const stairsMatches = [...body.matchAll(/tiles\[(\d+)\]\[(\d+(?:\s*-\s*\d+)?)\]\s*=\s*TILE\.STAIRS/g)];
  for (const m of stairsMatches) {
    let y = parseInt(m[1]);
    let xExpr = m[2].trim();
    let x = xExpr.includes('-') ? eval(xExpr.replace('w', def.w)) : parseInt(xExpr);
    if (y < def.h && x < def.w) tiles[y][x] = TILE.STAIRS;
  }
  
  // Parse DOOR
  const doorMatches = [...body.matchAll(/tiles\[(\d+)\]\[(\d+)\]\s*=\s*TILE\.DOOR/g)];
  for (const m of doorMatches) {
    const y = parseInt(m[1]), x = parseInt(m[2]);
    if (y < def.h && x < def.w) tiles[y][x] = TILE.DOOR;
  }
  
  // Parse LAVA
  for (const m of body.matchAll(/tiles\[(\d+)\]\[(\d+)\]\s*=\s*TILE\.LAVA/g)) {
    const y = parseInt(m[1]), x = parseInt(m[2]);
    if (y < def.h && x < def.w) tiles[y][x] = TILE.LAVA;
  }
  
  // Floor 1-1 special: inline carving (not carveRoom)
  if (floorNum === 1) {
    for (let y = 2; y <= 10; y++)
      for (let x = 2; x <= 10; x++)
        tiles[y][x] = TILE.FLOOR;
  }
  
  // Floor 1-1 special: seat walls
  if (floorNum === 1) {
    for (const y of [3, 5, 7, 9]) {
      if (y < def.h) {
        if (3 < def.w) tiles[y][3] = TILE.WALL;
        if (4 < def.w) tiles[y][4] = TILE.WALL;
        if (8 < def.w) tiles[y][8] = TILE.WALL;
        if (9 < def.w) tiles[y][9] = TILE.WALL;
      }
    }
  }
  
  // Floor 1-4 special: corridor carved with loop (not carveRoom)
  if (floorNum === 4) {
    for (let x = 1; x < def.w - 1; x++) {
      for (let y = 2; y <= 6; y++) {
        tiles[y][x] = TILE.FLOOR;
      }
    }
    // LAVA
    for (let x = 4; x < def.w - 4; x += 3) {
      tiles[3][x] = TILE.LAVA;
      tiles[5][x] = TILE.LAVA;
    }
    tiles[4][def.w - 2] = TILE.STAIRS;
  }
  
  return { tiles, def };
}

// BFS pathfinding
function findPath(tiles, sx, sy, tx, ty, w, h) {
  const walkable = t => t !== TILE.WALL && t !== TILE.VOID;
  const visited = Array.from({ length: h }, () => Array(w).fill(false));
  const queue = [[sx, sy, 0]];
  visited[sy][sx] = true;
  
  while (queue.length > 0) {
    const [x, y, dist] = queue.shift();
    if (x === tx && y === ty) return dist;
    
    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || nx >= w || ny < 0 || ny >= h) continue;
      if (visited[ny][nx]) continue;
      if (!walkable(tiles[ny][nx])) continue;
      visited[ny][nx] = true;
      queue.push([nx, ny, dist + 1]);
    }
  }
  
  return -1; // No path
}

let allPassed = true;

for (let i = 1; i <= 6; i++) {
  const result = parseFloor(i);
  if (!result) {
    console.log(`Floor 1-${i}: ✗ Failed to parse`);
    allPassed = false;
    continue;
  }
  
  const { tiles, def } = result;
  const [sx, sy] = def.start;
  const [tx, ty] = def.stairs;
  
  // Check start is walkable
  const startTile = tiles[sy]?.[sx];
  const stairsTile = tiles[ty]?.[tx];
  
  const dist = findPath(tiles, sx, sy, tx, ty, def.w, def.h);
  
  if (dist > 0) {
    console.log(`Floor ${def.name}: ✓ 通路存在 (${dist}步从起点到楼梯)`);
    console.log(`  起点(${sx},${sy})=${startTile === 1 ? 'FLOOR' : startTile} → 楼梯(${tx},${ty})=${stairsTile === 4 ? 'STAIRS' : stairsTile}`);
  } else {
    console.log(`Floor ${def.name}: ✗ 无法到达楼梯！`);
    console.log(`  起点(${sx},${sy})=${startTile} 楼梯(${tx},${ty})=${stairsTile}`);
    allPassed = false;
  }
}

console.log(`\n═══ 结果: ${allPassed ? '✅ 全部通路验证通过' : '❌ 存在不可达楼梯'} ═══`);
process.exit(allPassed ? 0 : 1);
