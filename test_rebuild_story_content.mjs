import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { CHAPTER_ONE_ENCOUNTERS } from './src/rebuild/data/ChapterOneBattle.js';

console.log('\n[ Rebuild Chapter 1 story content ]');
assert.equal(CHAPTER_ONE_ENCOUNTERS.length, 6, 'chapter one must contain six complete missions');
assert.deepEqual(CHAPTER_ONE_ENCOUNTERS.map(encounter => encounter.order), [1, 2, 3, 4, 5, 6]);
for (const encounter of CHAPTER_ONE_ENCOUNTERS) {
  assert.ok(Array.isArray(encounter.intro) && encounter.intro.length >= 2, encounter.id + ' needs at least two briefing beats');
  for (const beat of encounter.intro) {
    assert.ok(beat.speaker && beat.text, encounter.id + ' briefing beat must name speaker and text');
  }
  assert.ok(encounter.victory?.title, encounter.id + ' needs victory title');
  assert.ok(encounter.victory?.text?.length >= 20, encounter.id + ' needs meaningful victory narration');
  console.log('  ✅ ' + encounter.title + ' · ' + encounter.intro.length + '段简报');
}

const finale = CHAPTER_ONE_ENCOUNTERS.at(-1);
assert.ok(finale.epilogue?.quote && finale.epilogue?.text, 'final encounter needs chapter epilogue');
const tyrant = finale.enemies.find(enemy => enemy.id === 'tyrant');
assert.equal(tyrant.portrait, '/assets/enemies/tyrant_t002.svg', 'T-002 must use a dedicated tyrant portrait');
const securityUnits = CHAPTER_ONE_ENCOUNTERS.flatMap(encounter => encounter.enemies).filter(enemy => /防卫节点|主控守卫|激光安保/.test(enemy.name));
assert.equal(securityUnits.every(enemy => enemy.portrait === '/assets/enemies/security_drone.svg'), true, 'Red Queen security units must not look like infected humans');
for (const asset of ['/assets/enemies/tyrant_t002.svg', '/assets/enemies/security_drone.svg']) {
  const svg = readFileSync('./public' + asset, 'utf8');
  assert.match(svg, /^<svg/);
  assert.equal(svg.length > 1200, true, asset + ' detailed artwork');
}
console.log('\n✅ Chapter 1 narrative content complete');
