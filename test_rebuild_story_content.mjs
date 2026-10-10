import assert from 'node:assert/strict';
import { CHAPTER_ONE_ENCOUNTERS } from './src/rebuild/data/ChapterOneBattle.js';

console.log('\n[ Rebuild Chapter 1 story content ]');
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
console.log('\n✅ Chapter 1 narrative content complete');
