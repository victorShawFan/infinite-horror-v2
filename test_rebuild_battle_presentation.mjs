import assert from 'node:assert/strict';
import { buildPresentationCues } from './src/rebuild/core/BattlePresentation.js';

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ✅ ' + name); }
  catch (error) { console.error('  ❌ ' + name); throw error; }
}

console.log('\n[ Rebuild BattlePresentation ]');

test('伤害事件生成攻击、受击和伤害数字', () => {
  const cues = buildPresentationCues([{ type: 'damage', actorId: 'a', targetId: 'b', amount: 27, critical: false }]);
  assert.deepEqual(cues.map(cue => cue.type), ['attack', 'hit', 'popup']);
  assert.equal(cues[2].text, '-27');
  assert.equal(cues[2].tone, 'damage');
});

test('暴击伤害生成更强烈的表现', () => {
  const cues = buildPresentationCues([{ type: 'damage', actorId: 'a', targetId: 'b', amount: 88, critical: true }]);
  assert.equal(cues.find(cue => cue.type === 'hit').intensity, 'critical');
  assert.equal(cues.find(cue => cue.type === 'popup').tone, 'critical');
  assert.equal(cues.find(cue => cue.type === 'popup').text, '暴击 -88');
});

test('治疗事件生成治疗光效和绿色数字', () => {
  const cues = buildPresentationCues([{ type: 'heal', actorId: 'a', targetId: 'b', amount: 24 }]);
  assert.deepEqual(cues.map(cue => cue.type), ['cast', 'heal', 'popup']);
  assert.equal(cues[2].text, '+24');
  assert.equal(cues[2].tone, 'heal');
});

test('Boss阶段事件生成全屏警报与Boss爆发', () => {
  const cues = buildPresentationCues([{ type: 'boss_phase', actorId: 'boss', phase: 2, atkBonus: 10 }]);
  assert.deepEqual(cues.map(cue => cue.type), ['boss_phase', 'banner']);
  assert.match(cues[1].text, /狂暴/);
});

test('零治疗量不显示误导性的加血数字', () => {
  const cues = buildPresentationCues([{ type: 'heal', actorId: 'a', targetId: 'b', amount: 0 }]);
  assert.equal(cues.some(cue => cue.type === 'popup'), false);
});

console.log('\n✅ ' + passed + ' presentation checks passed');
