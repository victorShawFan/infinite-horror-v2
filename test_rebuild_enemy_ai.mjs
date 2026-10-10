import assert from 'node:assert/strict';
import { ACTION_KIND, TARGET_KIND } from './src/rebuild/core/TurnBattleEngine.js';
import { chooseEnemyAction, describeEnemyIntent } from './src/rebuild/core/EnemyTurnAI.js';

const skills = {
  crush: { id: 'crush', name: '粉碎重击', target: TARGET_KIND.SINGLE_ENEMY, mpCost: 8 },
  roar: { id: 'roar', name: '毁灭咆哮', target: TARGET_KIND.ALL_ENEMIES, mpCost: 14 },
};

const party = [
  { id: 'a', name: '甲', hp: 80, maxHp: 100 },
  { id: 'b', name: '乙', hp: 35, maxHp: 100 },
];

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ✅ ' + name); }
  catch (error) { console.error('  ❌ ' + name); throw error; }
}

console.log('\n[ Rebuild EnemyTurnAI ]');

test('普通敌人攻击生命比例最低的队员', () => {
  const actor = { id: 'zombie', name: '丧尸', mp: 0, skills: [], side: 'enemy' };
  const action = chooseEnemyAction({ actor, round: 1, opponents: party, skills });
  assert.deepEqual(action, { actorId: 'zombie', kind: ACTION_KIND.ATTACK, targetId: 'b' });
});

test('Boss第一阶段优先使用单体技能', () => {
  const actor = { id: 'boss', name: '暴君', mp: 30, skills: ['crush', 'roar'], side: 'enemy', boss: true, phase: 1 };
  const action = chooseEnemyAction({ actor, round: 1, opponents: party, skills });
  assert.equal(action.kind, ACTION_KIND.SKILL);
  assert.equal(action.skillId, 'crush');
  assert.equal(action.targetId, 'b');
});

test('Boss第二阶段每个偶数轮优先使用群体技能', () => {
  const actor = { id: 'boss', name: '暴君', mp: 30, skills: ['crush', 'roar'], side: 'enemy', boss: true, phase: 2 };
  const action = chooseEnemyAction({ actor, round: 2, opponents: party, skills });
  assert.equal(action.kind, ACTION_KIND.SKILL);
  assert.equal(action.skillId, 'roar');
  assert.equal(action.targetId, undefined);
});

test('MP不足时回退普通攻击', () => {
  const actor = { id: 'boss', name: '暴君', mp: 2, skills: ['crush', 'roar'], side: 'enemy', boss: true, phase: 2 };
  const action = chooseEnemyAction({ actor, round: 2, opponents: party, skills });
  assert.equal(action.kind, ACTION_KIND.ATTACK);
  assert.equal(action.targetId, 'b');
});

test('意图文案准确区分群体和单体', () => {
  const actor = { id: 'boss', name: '暴君', mp: 30, skills: ['crush', 'roar'], side: 'enemy', boss: true, phase: 2 };
  const action = chooseEnemyAction({ actor, round: 2, opponents: party, skills });
  assert.match(describeEnemyIntent(action, actor, party, skills), /全体/);
  assert.match(describeEnemyIntent({ actorId: 'boss', kind: ACTION_KIND.ATTACK, targetId: 'b' }, actor, party, skills), /乙/);
});

console.log('\n✅ ' + passed + ' enemy AI checks passed');
