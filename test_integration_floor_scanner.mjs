/**
 * Integration test: FloorScanner with real map data
 */
import { generateChapter2 } from './src/core/MapGenerator_Ch2.js';
import { injectKeyDoors } from './src/core/KeyDoorSystem.js';
import { injectInteractables } from './src/core/FloorInteractables.js';
import { scanFloor, renderFloorOverview } from './src/core/FloorScanner.js';

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('FAIL:', msg); }
}

const ch2 = generateChapter2();
const floor = ch2.floors[0];
let entities = [...floor.entities.map(e => ({...e}))];
entities = injectKeyDoors(2, 0, entities, floor.tiles);
entities = injectInteractables(2, 0, entities, floor.tiles);

// Simulate a player
const mockPlayer = {
  x: floor.playerStart.x,
  y: floor.playerStart.y,
  hp: 100, maxHp: 100,
  atk: 25, def: 15, spd: 12, crt: 10,
  level: 5, gold: 200, exp: 50,
};

const scanData = scanFloor(entities, mockPlayer);
assert(scanData !== undefined, 'scanFloor returns data');
assert(typeof scanData === 'object', 'scanFloor returns object');

// Check scan data has expected properties
if (scanData.enemies !== undefined) {
  assert(typeof scanData.enemies === 'number' || Array.isArray(scanData.enemies), 'Has enemies info');
  passed++;
}

const html = renderFloorOverview(scanData);
assert(typeof html === 'string', 'renderFloorOverview returns string');
assert(html.length > 50, 'Overview HTML has substantial content');
assert(html.includes('<'), 'Overview contains HTML tags');

console.log(`Scan data keys: ${Object.keys(scanData).join(', ')}`);
console.log(`Overview HTML length: ${html.length}`);

console.log(`\n✅ ${passed} passed, ❌ ${failed} failed`);
if (failed > 0) process.exit(1);
