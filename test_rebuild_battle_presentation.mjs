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

test('保护与环境危害生成独立视觉提示', () => {
  const cues = buildPresentationCues([
    { type: 'protection', targetId: 'core', protectorIds: ['left', 'right'], reduction: 0.7 },
    { type: 'hazard_damage', hazardId: 'laser', hazardName: '激光扫射', targetId: 'hero', amount: 12 },
  ]);
  assert.equal(cues.some(cue => cue.type === 'protection'), true);
  assert.equal(cues.some(cue => cue.type === 'hazard'), true);
  assert.equal(cues.find(cue => cue.type === 'popup')?.text, '激光 -12');
});

test('零治疗量不显示误导性的加血数字', () => {
  const cues = buildPresentationCues([{ type: 'heal', actorId: 'a', targetId: 'b', amount: 0 }]);
  assert.equal(cues.some(cue => cue.type === 'popup'), false);
});

test('道具治疗使用独立施放提示并复用治疗反馈', () => {
  const cues = buildPresentationCues([
    { type: 'item_use', actorId: 'hero', itemId: 'first_aid' },
    { type: 'item_heal', actorId: 'hero', targetId: 'ally', itemId: 'first_aid', amount: 35 },
  ]);
  assert.deepEqual(cues.map(cue => cue.type), ['item', 'heal', 'popup']);
  assert.equal(cues[0].actorId, 'hero');
  assert.equal(cues[2].text, '+35');
});

console.log('\n✅ ' + passed + ' presentation checks passed');
