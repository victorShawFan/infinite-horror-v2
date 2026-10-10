import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TurnBattleEngine, ACTION_KIND, TARGET_KIND } from './src/rebuild/core/TurnBattleEngine.js';
import { chooseEnemyAction } from './src/rebuild/core/EnemyTurnAI.js';
import { createCampaignProgress, canLaunchEncounter, settleEncounter } from './src/rebuild/core/CampaignProgress.js';
import { SKILL_CATALOG } from './src/rebuild/data/SkillCatalog.js';
import { CHAPTER_ONE_ENCOUNTERS } from './src/rebuild/data/ChapterOneBattle.js';
import {
  CHAPTER_TWO_ENCOUNTERS,
  ALL_REBUILD_ENCOUNTERS,
  createRebuildEncounter,
  createRebuildParty,
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
    skill && actor.mp >= skill.mpCost && (actor.cooldowns?.[skill.id] || 0) <= 0
  );
  const heal = available.find(skill => skill.healPower && lowAlly.hp / lowAlly.maxHp < 0.52);
  if (heal) return { actorId: actor.id, kind: ACTION_KIND.SKILL, skillId: heal.id, targetId: lowAlly.id };
  const aoe = available.find(skill => skill.target === TARGET_KIND.ALL_ENEMIES && enemies.length > 1);
  if (aoe) return { actorId: actor.id, kind: ACTION_KIND.SKILL, skillId: aoe.id };
  const single = available.find(skill => skill.target === TARGET_KIND.SINGLE_ENEMY);
  const target = [...enemies].sort((a, b) => a.hp - b.hp)[0];
  if (single) return { actorId: actor.id, kind: ACTION_KIND.SKILL, skillId: single.id, targetId: target.id };
  return { actorId: actor.id, kind: ACTION_KIND.ATTACK, targetId: target.id };
}

function playEncounter(encounter) {
  const profile = {
    level: 6,
    equippedSkills: ['heavy_slash', 'arc_sweep', 'blood_burst', 'emergency_heal'],
    inventory: {},
  };
  const engine = new TurnBattleEngine({
    party: createRebuildParty(profile, encounter),
    enemies: encounter.enemies,
    skills: SKILL_CATALOG,
    rules: encounter.rules,
    rng: () => 0.99,
  });
  let actions = 0;
  let bossPhaseTriggered = false;
  while (engine.status === 'active' && actions < 240) {
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

console.log('\n[ Rebuild Chapter 2 ]');

test('第二章保留旧版六节点且每场都有完整叙事与敌群', () => {
  assert.equal(CHAPTER_TWO_ENCOUNTERS.length, 6);
  assert.deepEqual(CHAPTER_TWO_ENCOUNTERS.map(item => item.id), [
    'ship-lockdown', 'split-corridor', 'vent-hunt',
    'quarantine-lab', 'hive-rescue', 'queen-evacuation',
  ]);
  for (const encounter of CHAPTER_TWO_ENCOUNTERS) {
    assert.match(encounter.chapter, /第二章/);
    assert.ok(encounter.intro.length >= 3, encounter.id + ' intro');
    assert.ok(encounter.enemies.length >= 2, encounter.id + ' enemies');
    assert.ok(encounter.victory?.text, encounter.id + ' victory text');
  }
});

test('异形、抱脸虫与皇后使用各自独立画像而不是复用爬行者或暴君', () => {
  const portraits = new Set(CHAPTER_TWO_ENCOUNTERS.flatMap(encounter => encounter.enemies.map(enemy => enemy.portrait)));
  assert.equal([...portraits].some(path => /crawler.jpg|tyrant.jpg/.test(path)), false);
  for (const asset of ['/assets/enemies/alien_drone.svg', '/assets/enemies/facehugger.svg', '/assets/enemies/alien_queen.svg']) {
    assert.equal(portraits.has(asset), true, asset + ' referenced');
    const svg = readFileSync('./public' + asset, 'utf8');
    assert.match(svg, /^<svg/);
    assert.equal(svg.length > 1200, true, asset + ' detailed artwork');
  }
});

test('旧存档完成第一章后自动解锁第二章第一场', () => {
  const firstChapterIds = CHAPTER_ONE_ENCOUNTERS.map(item => item.id);
  const saved = { campaign: { chapter: 1, unlockedIndex: 5, completed: firstChapterIds } };
  const migrated = createCampaignProgress(saved, ALL_REBUILD_ENCOUNTERS);
  assert.equal(canLaunchEncounter(migrated, 'ship-lockdown', ALL_REBUILD_ENCOUNTERS), true);
  assert.equal(canLaunchEncounter(migrated, 'split-corridor', ALL_REBUILD_ENCOUNTERS), false);
});

test('首章终战结算后档案立即切换到第二章', () => {
  const beforeFinale = createCampaignProgress({
    campaign: { completed: CHAPTER_ONE_ENCOUNTERS.slice(0, -1).map(item => item.id), unlockedIndex: 5 },
  }, ALL_REBUILD_ENCOUNTERS);
  const result = settleEncounter(beforeFinale, 'tyrant-final', 'victory', ALL_REBUILD_ENCOUNTERS);
  assert.equal(result.ok, true);
  assert.equal(result.progress.unlockedIndex, 6);
  assert.equal(result.progress.chapter, 2);
});

test('第二章编队加入楚轩和零点，首章仍保持原三人队', () => {
  const profile = { level: 6, equippedSkills: ['heavy_slash'], inventory: {} };
  const chapterOneParty = createRebuildParty(profile, createRebuildEncounter('train-awakening'));
  const chapterTwoParty = createRebuildParty(profile, createRebuildEncounter('ship-lockdown'));
  assert.deepEqual(chapterOneParty.map(unit => unit.name), ['郑吒', '张杰', '詹岚']);
  assert.deepEqual(chapterTwoParty.map(unit => unit.name), ['郑吒', '张杰', '詹岚', '楚轩', '零点']);
  assert.equal(chapterTwoParty.find(unit => unit.id === 'lingdian').attackRange, 'ranged');
});

test('统一战役克隆不向首章终章注入空统计覆盖默认文案', () => {
  const firstFinale = createRebuildEncounter('tyrant-final');
  assert.equal(Object.hasOwn(firstFinale.epilogue, 'stats'), false);
  const secondFinale = createRebuildEncounter('queen-evacuation');
  assert.equal(secondFinale.epilogue.stats.length, 3);
});

test('近战击杀异形触发酸血反噬，远程击杀不会触发', () => {
  const melee = new TurnBattleEngine({
    party: [{ id: 'melee', name: '郑吒', hp: 100, maxHp: 100, atk: 50, def: 5, spd: 10, attackRange: 'melee' }],
    enemies: [{ id: 'xeno', name: '异形', hp: 10, maxHp: 10, atk: 1, def: 0, spd: 1, onDefeatDamage: 9 }],
    rng: () => 0.99,
  });
  const meleeResult = melee.act({ actorId: 'melee', kind: ACTION_KIND.ATTACK, targetId: 'xeno' });
  assert.equal(melee.getCombatant('melee').hp, 91);
  assert.equal(meleeResult.events.some(event => event.type === 'retaliation_damage' && event.amount === 9), true);

  const ranged = new TurnBattleEngine({
    party: [{ id: 'ranged', name: '零点', hp: 100, maxHp: 100, atk: 50, def: 5, spd: 10, attackRange: 'ranged' }],
    enemies: [{ id: 'xeno', name: '异形', hp: 10, maxHp: 10, atk: 1, def: 0, spd: 1, onDefeatDamage: 9 }],
    rng: () => 0.99,
  });
  const rangedResult = ranged.act({ actorId: 'ranged', kind: ACTION_KIND.ATTACK, targetId: 'xeno' });
  assert.equal(ranged.getCombatant('ranged').hp, 100);
  assert.equal(rangedResult.events.some(event => event.type === 'retaliation_damage'), false);
});

test('第二章六场可按顺序真实通关且皇后进入二阶段', () => {
  let progress = createCampaignProgress({
    campaign: { completed: CHAPTER_ONE_ENCOUNTERS.map(item => item.id), unlockedIndex: 6 },
  }, ALL_REBUILD_ENCOUNTERS);
  for (const source of CHAPTER_TWO_ENCOUNTERS) {
    const encounter = createRebuildEncounter(source.id);
    const result = playEncounter(encounter);
    assert.equal(result.engine.status, 'victory', encounter.id + ' should be winnable');
    assert.ok(result.engine.getLiving('party').length > 0, encounter.id + ' victory must leave a survivor');
    assert.ok(result.actions < 240, encounter.id + ' should finish');
    if (encounter.boss) assert.equal(result.bossPhaseTriggered, true);
    const settlement = settleEncounter(progress, encounter.id, 'victory', ALL_REBUILD_ENCOUNTERS);
    assert.equal(settlement.ok, true);
    progress = settlement.progress;
  }
  const throughChapterTwo = ALL_REBUILD_ENCOUNTERS.filter(item => Number(item.chapterNumber || 1) <= 2).length;
  assert.equal(progress.completed.length, throughChapterTwo);
});

console.log('\n✅ ' + passed + ' Chapter 2 checks passed');
