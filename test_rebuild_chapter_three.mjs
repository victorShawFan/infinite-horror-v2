import assert from 'node:assert/strict';
import { TurnBattleEngine, ACTION_KIND, TARGET_KIND } from './src/rebuild/core/TurnBattleEngine.js';
import { chooseEnemyAction } from './src/rebuild/core/EnemyTurnAI.js';
import { createCampaignProgress, canLaunchEncounter, settleEncounter } from './src/rebuild/core/CampaignProgress.js';
import { SKILL_CATALOG } from './src/rebuild/data/SkillCatalog.js';
import {
  CHAPTER_THREE_ENCOUNTERS, ALL_REBUILD_ENCOUNTERS,
  createRebuildEncounter, createRebuildParty,
} from './src/rebuild/data/RebuildCampaign.js';

let passed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ✅ ' + name); }
  catch (error) { console.error('  ❌ ' + name); throw error; }
}

function choosePartyAction(engine, actor) {
  const allies = engine.getLiving('party');
  const enemies = engine.getLiving('enemy');
  const lowAlly = [...allies].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
  const available = actor.skills.map(id => SKILL_CATALOG[id]).filter(skill =>
    skill && actor.mp >= (skill.mpCost || 0) && (actor.cooldowns?.[skill.id] || 0) <= 0
  );
  const heal = available.find(skill => skill.healPower && lowAlly.hp / lowAlly.maxHp < 0.5);
  if (heal) return { actorId: actor.id, kind: ACTION_KIND.SKILL, skillId: heal.id, targetId: lowAlly.id };
  const spiritAoe = available.find(skill => skill.damageType === 'spirit' && skill.target === TARGET_KIND.ALL_ENEMIES && enemies.length > 1);
  if (spiritAoe) return { actorId: actor.id, kind: ACTION_KIND.SKILL, skillId: spiritAoe.id };
  const spiritSingle = available.find(skill => skill.damageType === 'spirit' && skill.target === TARGET_KIND.SINGLE_ENEMY);
  const target = [...enemies].sort((a, b) => a.hp - b.hp)[0];
  if (spiritSingle) return { actorId: actor.id, kind: ACTION_KIND.SKILL, skillId: spiritSingle.id, targetId: target.id };
  const aoe = available.find(skill => skill.target === TARGET_KIND.ALL_ENEMIES && enemies.length > 1);
  if (aoe) return { actorId: actor.id, kind: ACTION_KIND.SKILL, skillId: aoe.id };
  const single = available.find(skill => skill.target === TARGET_KIND.SINGLE_ENEMY);
  if (single) return { actorId: actor.id, kind: ACTION_KIND.SKILL, skillId: single.id, targetId: target.id };
  return { actorId: actor.id, kind: ACTION_KIND.ATTACK, targetId: target.id };
}

function playEncounter(encounter) {
  const profile = {
    level: 10,
    equippedSkills: ['psychic_lance', 'mind_storm', 'emergency_heal', 'heavy_slash'],
    inventory: {},
  };
  const engine = new TurnBattleEngine({
    party: createRebuildParty(profile, encounter), enemies: encounter.enemies,
    skills: SKILL_CATALOG, rules: encounter.rules, rng: () => 0.99,
  });
  let actions = 0;
  let maxCurseLevel = 0;
  let revealSeen = false;
  while (engine.status === 'active' && actions < 320) {
    const actor = engine.getCurrentActor();
    const action = actor.side === 'party'
      ? choosePartyAction(engine, actor)
      : chooseEnemyAction({ actor, round: engine.round, opponents: engine.getLiving('party'), skills: SKILL_CATALOG });
    const result = engine.act(action);
    assert.equal(result.ok, true, encounter.id + ' action must be valid');
    maxCurseLevel = Math.max(maxCurseLevel, engine.ruleState.curseLevel);
    if (result.events.some(event => event.type === 'curse_reveal')) revealSeen = true;
    actions++;
  }
  return { engine, actions, maxCurseLevel, revealSeen };
}

console.log('\n[ Rebuild Chapter 3 ]');

test('第三章完整保留六节点与灵体战斗信息', () => {
  assert.equal(CHAPTER_THREE_ENCOUNTERS.length, 6);
  assert.deepEqual(CHAPTER_THREE_ENCOUNTERS.map(item => item.id), [
    'curse-house', 'night-scatter', 'sutra-clue',
    'fear-conflict', 'chuxuan-tape', 'seven-curse-seal',
  ]);
  for (const encounter of CHAPTER_THREE_ENCOUNTERS) {
    assert.equal(encounter.chapterNumber, 3);
    assert.ok(encounter.intro.length >= 4, encounter.id + ' intro');
    assert.ok(encounter.enemies.length >= 2, encounter.id + ' enemies');
    assert.ok(encounter.enemies.every(enemy => Number(enemy.physicalResist || 0) > 0), encounter.id + ' spirit resistance');
  }
});

test('完成前两章后解锁第三章首场且后续仍锁定', () => {
  const previousIds = ALL_REBUILD_ENCOUNTERS.filter(item => item.chapterNumber !== 3).map(item => item.id);
  const progress = createCampaignProgress({ campaign: { completed: previousIds, unlockedIndex: 11 } }, ALL_REBUILD_ENCOUNTERS);
  assert.equal(canLaunchEncounter(progress, 'curse-house', ALL_REBUILD_ENCOUNTERS), true);
  assert.equal(canLaunchEncounter(progress, 'night-scatter', ALL_REBUILD_ENCOUNTERS), false);
  assert.equal(progress.chapter, 3);
});

test('楚轩在第五场牺牲后不会出现在终战编队', () => {
  const profile = { level: 10, equippedSkills: ['psychic_lance'], inventory: {} };
  const before = createRebuildParty(profile, createRebuildEncounter('chuxuan-tape')).map(unit => unit.name);
  const final = createRebuildParty(profile, createRebuildEncounter('seven-curse-seal')).map(unit => unit.name);
  assert.equal(before.includes('楚轩'), true);
  assert.equal(before.includes('赵樱空'), true);
  assert.equal(final.includes('楚轩'), false);
  assert.equal(final.includes('齐腾一'), true);
});

test('第三章六场可顺序通关且终战必须经历七波显形', () => {
  const previousIds = ALL_REBUILD_ENCOUNTERS.filter(item => item.chapterNumber !== 3).map(item => item.id);
  let progress = createCampaignProgress({ campaign: { completed: previousIds, unlockedIndex: previousIds.length } }, ALL_REBUILD_ENCOUNTERS);
  for (const source of CHAPTER_THREE_ENCOUNTERS) {
    const encounter = createRebuildEncounter(source.id);
    const result = playEncounter(encounter);
    assert.equal(result.engine.status, 'victory', encounter.id + ' should be winnable');
    assert.ok(result.engine.getLiving('party').length > 0, encounter.id + ' must leave a survivor');
    assert.ok(result.actions < 320, encounter.id + ' should finish');
    if (encounter.id === 'seven-curse-seal') {
      assert.equal(result.maxCurseLevel, 7);
      assert.equal(result.revealSeen, true);
    }
    const settlement = settleEncounter(progress, encounter.id, 'victory', ALL_REBUILD_ENCOUNTERS);
    assert.equal(settlement.ok, true);
    progress = settlement.progress;
  }
  assert.equal(progress.completed.length, ALL_REBUILD_ENCOUNTERS.length);
});

console.log('\n✅ ' + passed + ' Chapter 3 checks passed');
