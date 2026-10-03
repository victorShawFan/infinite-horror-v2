/**
 * BFS Reachability test with key-door state
 * Verifies Ch2-6 floors are explorable with key/door system
 */
import { generateChapter2 } from './src/core/MapGenerator_Ch2.js';
import { generateChapter3 } from './src/core/MapGenerator_Ch3.js';
import { generateChapter4 } from './src/core/MapGenerator_Ch4.js';
import { generateChapter5 } from './src/core/MapGenerator_Ch5.js';
import { generateChapter6 } from './src/core/MapGenerator_Ch6.js';
import { injectKeyDoors } from './src/core/KeyDoorSystem.js';
import { injectInteractables } from './src/core/FloorInteractables.js';
import { TILE } from './src/core/constants.js';

let passed = 0;
let failed = 0;
function assert(cond, msg) { if (cond) passed++; else { failed++; console.error('FAIL:', msg); } }

function bfsWithKeys(floor, entities) {
  const start = floor.playerStart;
  const tiles = floor.tiles;
  const rows = tiles.length;
  const cols = tiles[0]?.length || 0;
  
  const doorMap = new Map();
  const keyMap = new Map();
  for (const e of entities) {
    const pos = `${e.x},${e.y}`;
    if (e.itemType === 'door') doorMap.set(pos, e);
    if (e.itemType === 'key') keyMap.set(pos, e);
  }
  
  const encodeState = (x, y, yk, bk, rk) => `${x},${y},${Math.min(yk,9)},${Math.min(bk,9)},${Math.min(rk,9)}`;
  const visited = new Set();
  const queue = [{ x: start.x, y: start.y, yk: 0, bk: 0, rk: 0 }];
  visited.add(encodeState(start.x, start.y, 0, 0, 0));
  
  let stairsReached = false;
  let reachableCount = 0;
  let bossReachable = false;
  const reachedEntities = new Set();
  
  while (queue.length > 0) {
    const { x, y, yk, bk, rk } = queue.shift();
    reachableCount++;
    
    if (tiles[y]?.[x] === TILE.STAIRS) stairsReached = true;
    
    // Check if we can reach any boss/enemy
    for (const e of entities) {
      if (e.x === x && e.y === y) {
        reachedEntities.add(e.id);
        if (e.type === 'boss') bossReachable = true;
      }
    }
    
    for (const [dx, dy] of [[0,1],[0,-1],[1,0],[-1,0]]) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;
      
      const tile = tiles[ny]?.[nx];
      if (tile === TILE.WALL || tile === TILE.VOID || tile === undefined) continue;
      
      let newYk = yk, newBk = bk, newRk = rk;
      const keyPos = `${nx},${ny}`;
      const key = keyMap.get(keyPos);
      if (key) {
        if (key.keyColor === 'yellow') newYk++;
        if (key.keyColor === 'blue') newBk++;
        if (key.keyColor === 'red') newRk++;
      }
      
      const door = doorMap.get(keyPos);
      if (door) {
        if (door.doorColor === 'yellow' && newYk > 0) newYk--;
        else if (door.doorColor === 'blue' && newBk > 0) newBk--;
        else if (door.doorColor === 'red' && newRk > 0) newRk--;
        else continue;
      }
      
      const state = encodeState(nx, ny, newYk, newBk, newRk);
      if (visited.has(state)) continue;
      visited.add(state);
      queue.push({ x: nx, y: ny, yk: newYk, bk: newBk, rk: newRk });
    }
  }
  
  return { stairsReached, reachableCount, bossReachable, reachedEntities };
}

const chapters = [
  { gen: generateChapter2, num: 2, name: 'Ch2' },
  { gen: generateChapter3, num: 3, name: 'Ch3' },
  { gen: generateChapter4, num: 4, name: 'Ch4' },
  { gen: generateChapter5, num: 5, name: 'Ch5' },
  { gen: generateChapter6, num: 6, name: 'Ch6' },
];

for (const ch of chapters) {
  const chapter = ch.gen();
  for (let f = 0; f < chapter.floors.length; f++) {
    const floor = chapter.floors[f];
    let entities = [...floor.entities.map(e => ({...e}))];
    entities = injectKeyDoors(ch.num, f, entities, floor.tiles);
    entities = injectInteractables(ch.num, f, entities, floor.tiles);
    
    const result = bfsWithKeys(floor, entities);
    const totalEntities = entities.length;
    const reachedPct = totalEntities > 0 ? Math.round(result.reachedEntities.size / totalEntities * 100) : 100;
    
    // Floors can progress via stairs OR onClear/boss-kill
    // Either stairs reachable OR boss reachable means the floor is completable
    const isCompletable = result.stairsReached || result.bossReachable || f === chapter.floors.length - 1;
    assert(result.reachableCount > 3, `${ch.name} F${f}: explorable (${result.reachableCount} tiles, ${reachedPct}% entities reachable)`);
    
    if (f < chapter.floors.length - 1) {
      // Non-final floors should have a way forward
      assert(isCompletable, `${ch.name} F${f}: completable (stairs=${result.stairsReached}, boss=${result.bossReachable})`);
    }
  }
  console.log(`${ch.name}: all floors explorable ✓`);
}

console.log(`\n✅ ${passed} passed, ❌ ${failed} failed`);
if (failed > 0) process.exit(1);
