import assert from 'node:assert/strict';
import { TurnBattleEngine, ACTION_KIND, TARGET_KIND } from './src/rebuild/core/TurnBattleEngine.js';

let passed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  ✅ ' + name);
  } catch (error) {
    console.error('  ❌ ' + name);
    throw error;
  }
}

const skills = {
  slash: { id: 'slash', name: '重斩', target: TARGET_KIND.SINGLE_ENEMY, power: 1.5, mpCost: 6, cooldown: 1 },
  sweep: { id: 'sweep', name: '横扫', target: TARGET_KIND.ALL_ENEMIES, power: 0.8, mpCost: 10, cooldown: 2 },
  heal: { id: 'heal', name: '治疗', target: TARGET_KIND.SINGLE_ALLY, healPower: 1.2, mpCost: 8 },
};

const hero = (overrides = {}) => ({
  id: 'zheng', name: '郑吒', hp: 120, maxHp: 120, mp: 20, maxMp: 20,
  atk: 30, def: 8, spd: 12, crit: 0, skills: ['slash', 'sweep'], ...overrides,
});
const ally = (overrides = {}) => ({
  id: 'zhan', name: '詹岚', hp: 80, maxHp: 100, mp: 20, maxMp: 20,
  atk: 18, def: 6, spd: 10, crit: 0, skills: ['heal'], ...overrides,
});
const zombie = (id, overrides = {}) => ({
  id, name: '丧尸', hp: 50, maxHp: 50, mp: 0, maxMp: 0,
  atk: 18, def: 4, spd: 6, crit: 0, skills: [], ...overrides,
});

function engine(config = {}) {
  return new TurnBattleEngine({
    party: config.party || [hero(), ally()],
    enemies: config.enemies || [zombie('z1'), zombie('z2')],
    skills,
    rng: () => 0.99,
    rules: config.rules,
  });
}

console.log('\n[ Rebuild TurnBattleEngine ]');

test('按速度排序，同速保持传入顺序', () => {
  const e = engine({ party: [hero({ spd: 10 }), ally({ spd: 10 })] });
  assert.deepEqual(e.getTurnOrder().map(x => x.id), ['zheng', 'zhan', 'z1', 'z2']);
});

test('普通攻击只伤害指定单体目标', () => {
  const e = engine();
  const result = e.act({ actorId: 'zheng', kind: ACTION_KIND.ATTACK, targetId: 'z1' });
  assert.equal(result.ok, true);
  assert.equal(e.getCombatant('z1').hp, 24);
  assert.equal(e.getCombatant('z2').hp, 50);
});

test('群体技能命中所有存活敌人并只扣一次MP', () => {
  const e = engine();
  const result = e.act({ actorId: 'zheng', kind: ACTION_KIND.SKILL, skillId: 'sweep' });
  assert.equal(result.ok, true);
  assert.equal(e.getCombatant('z1').hp, 30);
  assert.equal(e.getCombatant('z2').hp, 30);
  assert.equal(e.getCombatant('zheng').mp, 10);
  assert.equal(result.events.filter(x => x.type === 'damage').length, 2);
});

test('单体技能拒绝多个目标且不消耗MP或回合', () => {
  const e = engine();
  const before = e.getCurrentActor().id;
  const result = e.act({ actorId: 'zheng', kind: ACTION_KIND.SKILL, skillId: 'slash', targetIds: ['z1', 'z2'] });
  assert.equal(result.ok, false);
  assert.equal(result.error, 'invalid_target_count');
  assert.equal(e.getCombatant('zheng').mp, 20);
  assert.equal(e.getCurrentActor().id, before);
});

test('MP不足拒绝技能且不消耗回合', () => {
  const e = engine({ party: [hero({ mp: 5 }), ally()] });
  const result = e.act({ actorId: 'zheng', kind: ACTION_KIND.SKILL, skillId: 'slash', targetId: 'z1' });
  assert.equal(result.ok, false);
  assert.equal(result.error, 'insufficient_mp');
  assert.equal(e.getCombatant('zheng').mp, 5);
  assert.equal(e.getCurrentActor().id, 'zheng');
});

test('使用技能后进入独立冷却且重复使用不消耗MP或回合', () => {
  const e = engine();
  e.act({ actorId: 'zheng', kind: ACTION_KIND.SKILL, skillId: 'sweep' });
  assert.equal(e.getCombatant('zheng').cooldowns.sweep, 2);
  e.act({ actorId: 'zhan', kind: ACTION_KIND.DEFEND });
  e.act({ actorId: 'z1', kind: ACTION_KIND.ATTACK, targetId: 'zheng' });
  e.act({ actorId: 'z2', kind: ACTION_KIND.ATTACK, targetId: 'zheng' });
  assert.equal(e.getCurrentActor().id, 'zheng');
  assert.equal(e.getCombatant('zheng').cooldowns.sweep, 1);
  const mpBefore = e.getCombatant('zheng').mp;
  const result = e.act({ actorId: 'zheng', kind: ACTION_KIND.SKILL, skillId: 'sweep' });
  assert.equal(result.ok, false);
  assert.equal(result.error, 'skill_on_cooldown');
  assert.equal(e.getCombatant('zheng').mp, mpBefore);
  assert.equal(e.getCurrentActor().id, 'zheng');
});

test('冷却在角色自己的后续回合递减并最终恢复', () => {
  const e = engine();
  e.act({ actorId: 'zheng', kind: ACTION_KIND.SKILL, skillId: 'sweep' });
  for (let cycle = 0; cycle < 2; cycle++) {
    while (e.status === 'active' && e.getCurrentActor().id !== 'zheng') {
      const actor = e.getCurrentActor();
      if (actor.side === 'party') e.act({ actorId: actor.id, kind: ACTION_KIND.DEFEND });
      else e.act({ actorId: actor.id, kind: ACTION_KIND.ATTACK, targetId: 'zheng' });
    }
    if (cycle === 0) {
      assert.equal(e.getCombatant('zheng').cooldowns.sweep, 1);
      e.act({ actorId: 'zheng', kind: ACTION_KIND.ATTACK, targetId: 'z1' });
    }
  }
  assert.equal(e.getCombatant('zheng').cooldowns.sweep, 0);
});

test('防御使下一次受到的伤害减半', () => {
  const e = engine({ party: [hero()], enemies: [zombie('z1', { spd: 11 })] });
  e.act({ actorId: 'zheng', kind: ACTION_KIND.DEFEND });
  const result = e.act({ actorId: 'z1', kind: ACTION_KIND.ATTACK, targetId: 'zheng' });
  const damage = result.events.find(x => x.type === 'damage').amount;
  assert.equal(damage, 5);
  assert.equal(e.getCombatant('zheng').hp, 115);
});

test('防御后非法行动不会提前清除防御状态', () => {
  const e = engine({ party: [hero()], enemies: [zombie('z1', { spd: 11 })] });
  e.act({ actorId: 'zheng', kind: ACTION_KIND.DEFEND });
  e.act({ actorId: 'z1', kind: ACTION_KIND.ATTACK, targetId: 'zheng' });
  const invalid = e.act({ actorId: 'zheng', kind: ACTION_KIND.SKILL, skillId: 'slash', targetId: 'missing' });
  assert.equal(invalid.ok, false);
  assert.equal(e.getCombatant('zheng').guarding, true);
});

test('群体技能不会命中已倒下目标', () => {
  const e = engine({ enemies: [zombie('z1', { hp: 0 }), zombie('z2')] });
  const result = e.act({ actorId: 'zheng', kind: ACTION_KIND.SKILL, skillId: 'sweep' });
  assert.equal(result.ok, true);
  assert.equal(result.events.filter(event => event.type === 'damage').length, 1);
  assert.equal(e.getCombatant('z1').hp, 0);
});

test('保护节点存活时主控目标获得减伤并产生保护事件', () => {
  const core = zombie('core', {
    hp: 100, maxHp: 100, def: 0,
    protectedBy: ['node'], protectionReduction: 0.7,
  });
  const node = zombie('node', { hp: 20, maxHp: 20, def: 0 });
  const e = engine({ enemies: [core, node] });
  const protectedHit = e.act({ actorId: 'zheng', kind: ACTION_KIND.ATTACK, targetId: 'core' });
  assert.equal(protectedHit.events.find(event => event.type === 'damage').amount, 9);
  assert.equal(protectedHit.events.some(event => event.type === 'protection'), true);
});

test('保护节点死亡后主控目标恢复完整受伤', () => {
  const core = zombie('core', {
    hp: 100, maxHp: 100, def: 0,
    protectedBy: ['node'], protectionReduction: 0.7,
  });
  const node = zombie('node', { hp: 0, maxHp: 20, def: 0 });
  const e = engine({ enemies: [core, node] });
  const hit = e.act({ actorId: 'zheng', kind: ACTION_KIND.ATTACK, targetId: 'core' });
  assert.equal(hit.events.find(event => event.type === 'damage').amount, 30);
  assert.equal(hit.events.some(event => event.type === 'protection'), false);
});

test('回合环境伤害按间隔命中全队并受防御减伤', () => {
  const e = engine({
    party: [hero(), ally()],
    enemies: [zombie('z1')],
    rules: { roundHazard: { id: 'laser', name: '激光扫射', interval: 2, damage: 12, targetSide: 'party' } },
  });
  e.act({ actorId: 'zheng', kind: ACTION_KIND.DEFEND });
  e.act({ actorId: 'zhan', kind: ACTION_KIND.DEFEND });
  const enemyResult = e.act({ actorId: 'z1', kind: ACTION_KIND.ATTACK, targetId: 'zheng' });
  const hazardEvents = enemyResult.events.filter(event => event.type === 'hazard_damage');
  assert.equal(e.round, 2);
  assert.equal(hazardEvents.length, 2);
  assert.deepEqual(hazardEvents.map(event => event.amount), [6, 6]);
  assert.equal(e.getCombatant('zheng').hp, 109);
  assert.equal(e.getCombatant('zhan').hp, 74);
});

test('Boss生命低于阈值时只触发一次阶段强化', () => {
  const boss = zombie('boss', {
    name: '暴君', hp: 60, maxHp: 100, def: 0, boss: true,
    phase: 1, phaseThreshold: 0.5, phaseAtkBonus: 10,
  });
  const e = engine({ enemies: [boss] });
  const first = e.act({ actorId: 'zheng', kind: ACTION_KIND.ATTACK, targetId: 'boss' });
  assert.equal(e.getCombatant('boss').phase, 2);
  assert.equal(e.getCombatant('boss').atk, 28);
  assert.equal(first.events.filter(event => event.type === 'boss_phase').length, 1);

  e.act({ actorId: 'zhan', kind: ACTION_KIND.DEFEND });
  const enemyTurn = e.getCurrentActor();
  e.act({ actorId: enemyTurn.id, kind: ACTION_KIND.ATTACK, targetId: 'zhan' });
  const second = e.act({ actorId: 'zheng', kind: ACTION_KIND.ATTACK, targetId: 'boss' });
  assert.equal(second.events.filter(event => event.type === 'boss_phase').length, 0);
  assert.equal(e.getCombatant('boss').atk, 28);
});

test('治疗技能不能超过最大生命', () => {
  const e = engine({ party: [ally({ spd: 20 }), hero({ hp: 110 })] });
  const result = e.act({ actorId: 'zhan', kind: ACTION_KIND.SKILL, skillId: 'heal', targetId: 'zheng' });
  assert.equal(result.ok, true);
  assert.equal(e.getCombatant('zheng').hp, 120);
});

test('最后一个敌人死亡后立即判定胜利且奖励只可领取一次', () => {
  const e = engine({ enemies: [zombie('z1', { hp: 10, maxHp: 10 })] });
  e.act({ actorId: 'zheng', kind: ACTION_KIND.ATTACK, targetId: 'z1' });
  assert.equal(e.status, 'victory');
  assert.equal(e.claimResult().ok, true);
  assert.equal(e.claimResult().ok, false);
});

console.log('\n✅ ' + passed + ' turn battle checks passed');
