import assert from 'node:assert/strict';
import { getAudioCueForPresentation, getMusicThemeForScene, normalizeAudioPreference } from './src/rebuild/core/RebuildAudio.js';

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ✅ ' + name); }
  catch (error) { console.error('  ❌ ' + name); throw error; }
}

console.log('\n[ Rebuild Audio ]');

test('演出事件映射为明确音效', () => {
  assert.equal(getAudioCueForPresentation({ type: 'attack' }), 'attack');
  assert.equal(getAudioCueForPresentation({ type: 'hit', intensity: 'normal' }), 'hit');
  assert.equal(getAudioCueForPresentation({ type: 'hit', intensity: 'critical' }), 'critical');
  assert.equal(getAudioCueForPresentation({ type: 'heal' }), 'heal');
  assert.equal(getAudioCueForPresentation({ type: 'guard' }), 'guard');
  assert.equal(getAudioCueForPresentation({ type: 'protection' }), 'guard');
  assert.equal(getAudioCueForPresentation({ type: 'hazard' }), 'critical');
  assert.equal(getAudioCueForPresentation({ type: 'boss_phase' }), 'boss_phase');
});

test('纯文本飘字不重复触发音效', () => {
  assert.equal(getAudioCueForPresentation({ type: 'popup', tone: 'damage' }), null);
  assert.equal(getAudioCueForPresentation({ type: 'banner' }), null);
});

test('静音偏好兼容字符串和布尔值', () => {
  assert.equal(normalizeAudioPreference(true), true);
  assert.equal(normalizeAudioPreference('true'), true);
  assert.equal(normalizeAudioPreference(false), false);
  assert.equal(normalizeAudioPreference('false'), false);
  assert.equal(normalizeAudioPreference(null), false);
});

test('标题、主神空间、探索与战斗使用不同持续音乐主题', () => {
  assert.equal(getMusicThemeForScene('title'), 'title');
  assert.equal(getMusicThemeForScene('hub'), 'lord-god');
  assert.equal(getMusicThemeForScene('exploration', { chapter: 1 }), 'bio-horror');
  assert.equal(getMusicThemeForScene('exploration', { chapter: 3 }), 'curse-horror');
  assert.equal(getMusicThemeForScene('battle'), 'combat');
  assert.equal(getMusicThemeForScene('battle', { boss: true }), 'boss');
});

console.log('\n✅ ' + passed + ' audio checks passed');
