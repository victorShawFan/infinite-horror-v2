/**
 * Structural integration test: All 12 chapters generate valid maps
 */
import { generateChapter1 } from './src/core/MapGenerator.js';
import { generateChapter2 } from './src/core/MapGenerator_Ch2.js';
import { generateChapter3 } from './src/core/MapGenerator_Ch3.js';
import { generateChapter4 } from './src/core/MapGenerator_Ch4.js';
import { generateChapter5 } from './src/core/MapGenerator_Ch5.js';
import { generateChapter6 } from './src/core/MapGenerator_Ch6.js';
import { generateChapter7 } from './src/core/MapGenerator_Ch7.js';
import { generateChapter8 } from './src/core/MapGenerator_Ch8.js';
import { generateChapter9 } from './src/core/MapGenerator_Ch9.js';
import { generateChapter10 } from './src/core/MapGenerator_Ch10.js';
import { generateChapter11 } from './src/core/MapGenerator_Ch11.js';
import { generateChapter12 } from './src/core/MapGenerator_Ch12.js';

const generators = [
  generateChapter1, generateChapter2, generateChapter3, generateChapter4,
  generateChapter5, generateChapter6, generateChapter7, generateChapter8,
  generateChapter9, generateChapter10, generateChapter11, generateChapter12,
];

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('FAIL:', msg); }
}

for (let ch = 0; ch < 12; ch++) {
  const chNum = ch + 1;
  try {
    const chapter = generators[ch]();
    assert(chapter !== undefined, `Ch${chNum} generates a chapter object`);
    assert(chapter.floors !== undefined, `Ch${chNum} has floors array`);
    assert(chapter.floors.length >= 6, `Ch${chNum} has >= 6 floors (got ${chapter.floors.length})`);
    assert(chapter.world !== undefined, `Ch${chNum} has world name`);
    
    let allFloorsOk = true;
    for (let f = 0; f < chapter.floors.length; f++) {
      const floor = chapter.floors[f];
      if (!floor) { allFloorsOk = false; console.error(`Ch${chNum} floor ${f} is null`); continue; }
      if (!floor.tiles || !floor.tiles.length) { allFloorsOk = false; console.error(`Ch${chNum} floor ${f} has no tiles`); continue; }
      if (!floor.entities) { allFloorsOk = false; console.error(`Ch${chNum} floor ${f} has no entities`); continue; }
      if (!floor.playerStart) { allFloorsOk = false; console.error(`Ch${chNum} floor ${f} has no playerStart`); continue; }
      
      // Verify player start is on a walkable tile
      const ps = floor.playerStart;
      const tileAtStart = floor.tiles[ps.y]?.[ps.x];
      if (tileAtStart === 0) {
        console.error(`Ch${chNum} floor ${f}: playerStart (${ps.x},${ps.y}) is on a wall!`);
        allFloorsOk = false;
      }
      
      // Verify at least one entity exists
      if (floor.entities.length === 0 && f < chapter.floors.length - 1) {
        console.error(`Ch${chNum} floor ${f}: no entities (mid-chapter floor)`);
      }
    }
    assert(allFloorsOk, `Ch${chNum} all floors structurally valid`);
    
    // Report summary
    const enemies = chapter.floors.reduce((sum, f) => sum + (f?.entities?.filter(e => e.type === 'enemy' || e.type === 'boss').length || 0), 0);
    const items = chapter.floors.reduce((sum, f) => sum + (f?.entities?.filter(e => e.type === 'item').length || 0), 0);
    console.log(`Ch${chNum} "${chapter.world}": ${chapter.floors.length} floors, ${enemies} enemies, ${items} items`);
  } catch (e) {
    failed++;
    console.error(`FAIL: Ch${chNum} generation threw: ${e.message}`);
  }
}

console.log(`\n✅ ${passed} passed, ❌ ${failed} failed`);
if (failed > 0) process.exit(1);
