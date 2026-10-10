import assert from 'node:assert/strict';
import { TurnBattleEngine, ACTION_KIND } from './src/rebuild/core/TurnBattleEngine.js';
import { ITEM_CATALOG, purchaseItem, syncInventoryFromCombatant } from './src/rebuild/core/ItemSystem.js';
import { DEFAULT_PROFILE, createParty } from './src/rebuild/data/ChapterOneBattle.js';

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ✅ ' + name); }
  catch (error) { console.error('  ❌ ' + name); throw error; }
}

const hero = (overrides = {}) => ({
  id: 'hero', name: '郑吒', hp: 50, maxHp: 100, mp: 10, maxMp: 20,
  atk: 20, def: 5, spd: 10, crit: 0, skills: [], inventory: { first_aid: 1, team_spray: 1 }, ...overrides,
});
const ally = (overrides = {}) => ({ id: 'ally', name: '詹岚', hp: 40, maxHp: 80, mp: 10, maxMp: 20, atk: 10, def: 4, spd: 8, crit: 0, skills: [], ...overrides });
const enemy = () => ({ id: 'enemy', name: '丧尸', hp: 100, maxHp: 100, mp: 0, maxMp: 0, atk: 10, def: 3, spd: 5, crit: 0, skills: [] });

function engine(inventory) {
  return new TurnBattleEngine({ party: [hero(inventory ? { inventory } : {}), ally()], enemies: [enemy()], items: ITEM_CATALOG, rng: () => .99 });
}

console.log('\n[ Rebuild ItemSystem ]');
test('不同补给类型拥有不同素材标识而同类保持一致',()=>{assert.equal(ITEM_CATALOG.first_aid.visual,'medkit');assert.equal(ITEM_CATALOG.team_spray.visual,'spray');assert.notEqual(ITEM_CATALOG.first_aid.visual,ITEM_CATALOG.team_spray.visual);});

test('主神空间购买补给扣除奖励点并增加库存', () => {
  const result = purchaseItem({ rewardPoints: 300, inventory: {} }, 'first_aid', 2, ITEM_CATALOG);
  assert.equal(result.ok, true);
  assert.equal(result.profile.rewardPoints, 140);
  assert.equal(result.profile.inventory.first_aid, 2);
});

test('奖励点不足不改变库存', () => {
  const result = purchaseItem({ rewardPoints: 20, inventory: {} }, 'first_aid', 1, ITEM_CATALOG);
  assert.equal(result.ok, false);
  assert.equal(result.error, 'insufficient_points');
  assert.equal(result.profile.inventory.first_aid, undefined);
});

test('单体急救包恢复生命并消耗一个库存', () => {
  const e = engine();
  const result = e.act({ actorId: 'hero', kind: ACTION_KIND.ITEM, itemId: 'first_aid', targetId: 'hero' });
  assert.equal(result.ok, true);
  assert.equal(e.getCombatant('hero').hp, 85);
  assert.equal(e.getCombatant('hero').inventory.first_aid, 0);
  assert.equal(result.events.some(event => event.type === 'item_heal' && event.amount === 35), true);
});

test('全体喷雾恢复所有存活队员但只消耗一个', () => {
  const e = engine();
  const result = e.act({ actorId: 'hero', kind: ACTION_KIND.ITEM, itemId: 'team_spray' });
  assert.equal(result.ok, true);
  assert.equal(e.getCombatant('hero').hp, 68);
  assert.equal(e.getCombatant('ally').hp, 58);
  assert.equal(e.getCombatant('hero').inventory.team_spray, 0);
  assert.equal(result.events.filter(event => event.type === 'item_heal').length, 2);
});

test('库存不足或目标非法不消耗回合', () => {
  const e = engine({ first_aid: 0 });
  const before = e.getCurrentActor().id;
  const missing = e.act({ actorId: 'hero', kind: ACTION_KIND.ITEM, itemId: 'first_aid', targetId: 'hero' });
  assert.equal(missing.ok, false);
  assert.equal(missing.error, 'item_unavailable');
  assert.equal(e.getCurrentActor().id, before);
  const invalid = engine().act({ actorId: 'hero', kind: ACTION_KIND.ITEM, itemId: 'first_aid', targetId: 'enemy' });
  assert.equal(invalid.ok, false);
  assert.equal(invalid.error, 'invalid_target');
});

test('满血时治疗道具不会被浪费也不消耗回合', () => {
  const e = new TurnBattleEngine({
    party: [hero({ hp: 100 }), ally({ hp: 80 })],
    enemies: [enemy()],
    items: ITEM_CATALOG,
    rng: () => .99,
  });
  const before = e.getCurrentActor().id;
  const result = e.act({ actorId: 'hero', kind: ACTION_KIND.ITEM, itemId: 'team_spray' });
  assert.equal(result.ok, false);
  assert.equal(result.error, 'no_effect');
  assert.equal(e.getCombatant('hero').inventory.team_spray, 1);
  assert.equal(e.getCurrentActor().id, before);
});

test('群体治疗只产生真实恢复事件，不记录满血角色的零治疗', () => {
  const e = new TurnBattleEngine({
    party: [hero({ hp: 100 }), ally({ hp: 40 })],
    enemies: [enemy()],
    items: ITEM_CATALOG,
    rng: () => .99,
  });
  const result = e.act({ actorId: 'hero', kind: ACTION_KIND.ITEM, itemId: 'team_spray' });
  const heals = result.events.filter(event => event.type === 'item_heal');
  assert.equal(heals.length, 1);
  assert.equal(heals[0].targetId, 'ally');
  assert.equal(heals[0].amount, 18);
});

test('初始档案赠送急救包且郑吒携带档案库存进入战斗', () => {
  assert.equal(DEFAULT_PROFILE.inventory.first_aid, 1);
  const party = createParty({ ...DEFAULT_PROFILE, inventory: { first_aid: 3, team_spray: 2 } });
  const zheng = party.find(unit => unit.id === 'zheng');
  assert.deepEqual(zheng.inventory, { first_aid: 3, team_spray: 2 });
  zheng.inventory.first_aid = 0;
  assert.equal(DEFAULT_PROFILE.inventory.first_aid, 1);
});

test('战斗结算只回写郑吒剩余库存且不改变原档案对象', () => {
  const original = { rewardPoints: 200, inventory: { first_aid: 2, team_spray: 1 } };
  const next = syncInventoryFromCombatant(original, { inventory: { first_aid: 1, team_spray: 0 } });
  assert.deepEqual(next.inventory, { first_aid: 1, team_spray: 0 });
  assert.deepEqual(original.inventory, { first_aid: 2, team_spray: 1 });
});

console.log('\n✅ ' + passed + ' item checks passed');
