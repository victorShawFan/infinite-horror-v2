/**
 * Integration test: KeyDoor + FloorInteractables injection
 * Proves that injectKeyDoors and injectInteractables ADD real entities 
 * to the actual map generator output.
 */
import { generateChapter2 } from './src/core/MapGenerator_Ch2.js';
import { injectKeyDoors, initKeys, getKeyCount } from './src/core/KeyDoorSystem.js';
import { injectInteractables, activateInteractable } from './src/core/FloorInteractables.js';

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('FAIL:', msg); }
}

// Generate a real Ch2 map
const ch2 = generateChapter2();
assert(ch2.floors.length >= 6, 'Ch2 has at least 6 floors');

// Initialize keys
initKeys();
// initKeys depends on global gameState — skip in unit test

// Test injection on each floor
let totalKeysAdded = 0;
let totalDoorsAdded = 0;
let totalInteractablesAdded = 0;

for (let i = 0; i < ch2.floors.length; i++) {
  const floor = ch2.floors[i];
  const origEntities = [...floor.entities];
  const origKeyCount = origEntities.filter(e => e.itemType === 'key').length;
  const origDoorCount = origEntities.filter(e => e.itemType === 'door').length;
  const origInteractCount = origEntities.filter(e => e.interactableType).length;
  
  // Inject key doors
  let entities = [...floor.entities.map(e => ({...e}))];
  entities = injectKeyDoors(2, i, entities, floor.tiles);
  
  const newKeyCount = entities.filter(e => e.itemType === 'key').length;
  const newDoorCount = entities.filter(e => e.itemType === 'door').length;
  totalKeysAdded += newKeyCount - origKeyCount;
  totalDoorsAdded += newDoorCount - origDoorCount;
  
  // Inject interactables
  entities = injectInteractables(2, i, entities, floor.tiles);
  const newInteractCount = entities.filter(e => e.interactableType).length;
  totalInteractablesAdded += newInteractCount - origInteractCount;
  
  // Verify injected entities are on valid tiles (not walls)
  for (const e of entities) {
    if (e.itemType === 'key' || e.itemType === 'door' || e.interactableType) {
      if (floor.tiles[e.y] && floor.tiles[e.y][e.x] !== undefined) {
        assert(floor.tiles[e.y][e.x] !== 0, `Injected entity at (${e.x},${e.y}) floor ${i} not on wall`);
      }
    }
  }
}

console.log(`Keys injected: ${totalKeysAdded}`);
console.log(`Doors injected: ${totalDoorsAdded}`);
console.log(`Interactables injected: ${totalInteractablesAdded}`);

assert(totalKeysAdded > 0, `At least one key injected in Ch2 (got ${totalKeysAdded})`);
assert(totalDoorsAdded > 0, `At least one door injected in Ch2 (got ${totalDoorsAdded})`);
assert(totalInteractablesAdded > 0, `At least one interactable injected in Ch2 (got ${totalInteractablesAdded})`);

// Test interactable activation on a floor that has interactables
let foundInteractable = false;
for (let i = 0; i < ch2.floors.length && !foundInteractable; i++) {
  let entities = [...ch2.floors[i].entities.map(e => ({...e}))];
  entities = injectInteractables(2, i, entities, ch2.floors[i].tiles);
  const interactable = entities.find(e => e.interactableType);
  if (interactable) {
    const result = activateInteractable(interactable);
    assert(result !== undefined && typeof result === 'object', 'activateInteractable returns object result');
    foundInteractable = true;
  }
}
if (!foundInteractable) {
  console.log('⚠ No interactable found in any Ch2 floor (unexpected)');
  failed++;
}

// Test Ch1 is skipped (as documented)
{
  const ch1Floor = { entities: [{ x: 3, y: 3, type: 'enemy', id: 'test' }] };
  const tiles = [[0,0,0],[0,1,0],[0,0,0]];
  const result = injectKeyDoors(1, 0, ch1Floor.entities, tiles);
  assert(result === ch1Floor.entities, 'Ch1 entities unchanged (skipped)');
  const result2 = injectInteractables(1, 0, ch1Floor.entities, tiles);
  assert(result2 === ch1Floor.entities, 'Ch1 interactables unchanged (skipped)');
}

console.log(`\n✅ ${passed} passed, ❌ ${failed} failed`);
if (failed > 0) process.exit(1);
