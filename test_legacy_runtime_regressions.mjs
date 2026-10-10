import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const renderer = readFileSync(new URL('./src/core/Renderer.js', import.meta.url), 'utf8');
const main = readFileSync(new URL('./src/main.js', import.meta.url), 'utf8');

console.log('\n[ Legacy runtime regression guards ]');
assert.match(
  renderer,
  /render\(floor, entities, hoveredEntity = null, dialogueState = null, combatResult = null, floorIndex = 0\)/,
  'Renderer.render must accept the floorIndex passed by main.js',
);
console.log('  ✅ Renderer receives floorIndex explicitly');

assert.match(
  main,
  /generateFloorChallenges\(gameState\.chapter, currentFloorIndex, isBossFloor\)/,
  'showFloorTitle must use currentFloorIndex instead of an undefined index variable',
);
console.log('  ✅ StarChallenge uses currentFloorIndex');
