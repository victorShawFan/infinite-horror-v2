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
  assert.equal(cues.find(cue => cue.type === 'popup')?.text, '激光扫射 -12');
});

test('异形酸血反噬与蜂巢环境使用真实名称而非固定激光文案', () => {
  const cues = buildPresentationCues([
    { type: 'retaliation_damage', sourceId: 'xeno', targetId: 'hero', amount: 9 },
    { type: 'hazard_damage', hazardId: 'hive-hunt', hazardName: '蜂巢追猎', targetId: 'hero', amount: 11 },
  ]);
  assert.equal(cues.some(cue => cue.type === 'retaliation' && cue.targetId === 'hero'), true);
  assert.equal(cues.find(cue => cue.tone === 'acid')?.text, '酸血 -9');
  assert.equal(cues.find(cue => cue.tone === 'hazard')?.text, '蜂巢追猎 -11');
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

test('灵体抗性、诅咒波次和第七波显形都有独立视觉信息', () => {
  const cues = buildPresentationCues([
    { type: 'resistance', targetId: 'ghost', damageType: 'physical', reduction: 0.6 },
    { type: 'curse_seal', targetId: 'kayako', reduction: 0.85 },
    { type: 'curse_wave', level: 3, maxLevel: 7, atkBonus: 2 },
    { type: 'curse_reveal', actorId: 'kayako', actorName: '伽椰子', level: 7 },
  ]);
  assert.equal(cues.some(cue => cue.type === 'resistance' && cue.targetId === 'ghost'), true);
  assert.equal(cues.some(cue => cue.type === 'curse_seal' && cue.targetId === 'kayako'), true);
  assert.equal(cues.some(cue => cue.type === 'banner' && /第 3 波/.test(cue.text)), true);
  assert.equal(cues.some(cue => cue.type === 'curse_reveal' && cue.actorId === 'kayako'), true);
  assert.equal(cues.some(cue => cue.type === 'banner' && /显形/.test(cue.text)), true);
});

test('弱点伤害和Boss复生生成不同战斗反馈', () => {
  const cues = buildPresentationCues([
    { type: 'weakness', targetId: 'mummy', damageType: 'fire', multiplier: 1.35 },
    { type: 'regeneration', targetId: 'imhotep', amount: 18 },
  ]);
  assert.equal(cues.some(cue => cue.type === 'weakness' && cue.targetId === 'mummy'), true);
  assert.equal(cues.some(cue => cue.type === 'popup' && /弱点/.test(cue.text)), true);
  assert.equal(cues.some(cue => cue.type === 'heal' && cue.targetId === 'imhotep'), true);
  assert.equal(cues.some(cue => cue.type === 'popup' && cue.text === '复生 +18'), true);
});

console.log('\n✅ ' + passed + ' presentation checks passed');
