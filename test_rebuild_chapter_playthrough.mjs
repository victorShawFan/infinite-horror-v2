import assert from 'node:assert/strict';
import { TurnBattleEngine, ACTION_KIND, TARGET_KIND } from './src/rebuild/core/TurnBattleEngine.js';
import { SKILL_CATALOG } from './src/rebuild/data/SkillCatalog.js';
import { CHAPTER_ONE_ENCOUNTERS, createEncounter, createParty } from './src/rebuild/data/ChapterOneBattle.js';
import { createCampaignProgress, settleEncounter } from './src/rebuild/core/CampaignProgress.js';
import { chooseEnemyAction } from './src/rebuild/core/EnemyTurnAI.js';

const profile = {
  equippedSkills: ['heavy_slash', 'arc_sweep', 'emergency_heal'],
};

function choosePartyAction(engine, actor) {
  const allies = engine.getLiving('party');
  const enemies = engine.getLiving('enemy');
  const lowAlly = [...allies].sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
  const available = actor.skills.map(id => SKILL_CATALOG[id]).filter(skill =>
    skill && actor.mp >= skill.mpCost && (actor.cooldowns?.[skill.id] || 0) <= 0
  );

  const heal = available.find(skill => skill.healPower && lowAlly.hp / lowAlly.maxHp < 0.55);
  if (heal) return { actorId: actor.id, kind: ACTION_KIND.SKILL, skillId: heal.id, targetId: lowAlly.id };

  const aoe = available.find(skill => skill.target === TARGET_KIND.ALL_ENEMIES && enemies.length > 1);
  if (aoe) return { actorId: actor.id, kind: ACTION_KIND.SKILL, skillId: aoe.id };

  const single = available.find(skill => skill.target === TARGET_KIND.SINGLE_ENEMY);
  const target = [...enemies].sort((a, b) => a.hp - b.hp)[0];
  if (single) return { actorId: actor.id, kind: ACTION_KIND.SKILL, skillId: single.id, targetId: target.id };
  return { actorId: actor.id, kind: ACTION_KIND.ATTACK, targetId: target.id };
}

function playEncounter(encounter) {
  const engine = new TurnBattleEngine({
    party: createParty(profile),
    enemies: encounter.enemies,
    skills: SKILL_CATALOG,
    rewards: encounter.rewards,
    rng: () => 0.99,
  });
  let actions = 0;
  let bossPhaseTriggered = false;
  while (engine.status === 'active' && actions < 160) {
    const actor = engine.getCurrentActor();
    const action = actor.side === 'party'
      ? choosePartyAction(engine, actor)
      : chooseEnemyAction({ actor, round: engine.round, opponents: engine.getLiving('party'), skills: SKILL_CATALOG });
    const result = engine.act(action);
    assert.equal(result.ok, true, encounter.id + ' action must be valid');
    if (result.events.some(event => event.type === 'boss_phase')) bossPhaseTriggered = true;
    actions++;
  }
  return { engine, actions, bossPhaseTriggered };
}

console.log('\n[ Rebuild Chapter 1 playthrough ]');
let progress = createCampaignProgress();
for (const encounterData of CHAPTER_ONE_ENCOUNTERS) {
  const encounter = createEncounter(encounterData.id);
  const result = playEncounter(encounter);
  assert.equal(result.engine.status, 'victory', encounter.id + ' should be winnable');
  assert.ok(result.actions < 160, encounter.id + ' should finish without stalling');
  if (encounter.boss) assert.equal(result.bossPhaseTriggered, true, 'boss phase must trigger');
  progress = settleEncounter(progress, encounter.id, 'victory').progress;
  console.log('  ✅ ' + encounter.title + ' · ' + result.actions + ' actions');
}

assert.equal(progress.completed.length, CHAPTER_ONE_ENCOUNTERS.length);
console.log('\n✅ Chapter 1 turn-based playthrough complete');
