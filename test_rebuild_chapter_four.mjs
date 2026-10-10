import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { TurnBattleEngine, ACTION_KIND, TARGET_KIND } from './src/rebuild/core/TurnBattleEngine.js';
import { chooseEnemyAction } from './src/rebuild/core/EnemyTurnAI.js';
import { createCampaignProgress, canLaunchEncounter, settleEncounter } from './src/rebuild/core/CampaignProgress.js';
import { SKILL_CATALOG } from './src/rebuild/data/SkillCatalog.js';
import { CHAPTER_FOUR_ENCOUNTERS, ALL_REBUILD_ENCOUNTERS, createRebuildEncounter, createRebuildParty } from './src/rebuild/data/RebuildCampaign.js';

let passed=0; function test(name,fn){try{fn();passed++;console.log('  ✅ '+name);}catch(error){console.error('  ❌ '+name);throw error;}}

function choosePartyAction(engine,actor){
  const allies=engine.getLiving('party'), enemies=engine.getLiving('enemy');
  const low=[...allies].sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];
  const available=actor.skills.map(id=>SKILL_CATALOG[id]).filter(skill=>skill&&actor.mp>=(skill.mpCost||0)&&(actor.cooldowns?.[skill.id]||0)<=0);
  const heal=available.find(skill=>skill.healPower&&low.hp/low.maxHp<.5);
  if(heal)return{actorId:actor.id,kind:ACTION_KIND.SKILL,skillId:heal.id,targetId:low.id};
  const target=[...enemies].sort((a,b)=>a.hp-b.hp)[0];
  const weakness=available.find(skill=>Array.isArray(target.weaknesses)&&target.weaknesses.includes(skill.damageType));
  if(weakness)return{actorId:actor.id,kind:ACTION_KIND.SKILL,skillId:weakness.id,...(weakness.target===TARGET_KIND.SINGLE_ENEMY?{targetId:target.id}:{})};
  const aoe=available.find(skill=>skill.target===TARGET_KIND.ALL_ENEMIES&&enemies.length>1);
  if(aoe)return{actorId:actor.id,kind:ACTION_KIND.SKILL,skillId:aoe.id};
  const single=available.find(skill=>skill.target===TARGET_KIND.SINGLE_ENEMY);
  if(single)return{actorId:actor.id,kind:ACTION_KIND.SKILL,skillId:single.id,targetId:target.id};
  return{actorId:actor.id,kind:ACTION_KIND.ATTACK,targetId:target.id};
}

function playEncounter(encounter){
  const profile={level:13,equippedSkills:['psychic_lance','mind_storm','emergency_heal','heavy_slash'],inventory:{}};
  const engine=new TurnBattleEngine({party:createRebuildParty(profile,encounter),enemies:encounter.enemies,skills:SKILL_CATALOG,rules:encounter.rules,rng:()=>.99});
  let actions=0,weaknessSeen=false,regenSeen=false;
  while(engine.status==='active'&&actions<360){const actor=engine.getCurrentActor();const action=actor.side==='party'?choosePartyAction(engine,actor):chooseEnemyAction({actor,round:engine.round,opponents:engine.getLiving('party'),skills:SKILL_CATALOG});const result=engine.act(action);assert.equal(result.ok,true,encounter.id+' action');if(result.events.some(e=>e.type==='weakness'))weaknessSeen=true;if(result.events.some(e=>e.type==='regeneration'))regenSeen=true;actions++;}
  return{engine,actions,weaknessSeen,regenSeen};
}

console.log('\n[ Rebuild Chapter 4 ]');
test('第四章完整保留六节点、团战与木乃伊弱点',()=>{
  assert.equal(CHAPTER_FOUR_ENCOUNTERS.length,6);
  assert.deepEqual(CHAPTER_FOUR_ENCOUNTERS.map(e=>e.id),['desert-caravan','cairo-intel','tomb-machinery','india-ambush','resurrection-scripture','imhotep-final']);
  for(const encounter of CHAPTER_FOUR_ENCOUNTERS){assert.equal(encounter.chapterNumber,4);assert.ok(encounter.intro.length>=4);assert.ok(encounter.enemies.length>=2);}
  assert.equal(CHAPTER_FOUR_ENCOUNTERS.find(e=>e.id==='india-ambush').enemies.every(e=>e.faction==='india'),true);
  assert.equal(CHAPTER_FOUR_ENCOUNTERS.find(e=>e.id==='imhotep-final').enemies.some(e=>e.roundRegen>0&&e.weaknesses.includes('fire')),true);
});
test('沙蝎、圣甲虫与印洲队职业使用物种和职业匹配的独立画像',()=>{
  const enemies=CHAPTER_FOUR_ENCOUNTERS.flatMap(encounter=>encounter.enemies);
  assert.equal(enemies.filter(enemy=>/沙蝎|毒蝎/.test(enemy.name)).every(enemy=>enemy.portrait==='/assets/enemies/desert_scorpion.svg'),true);
  assert.equal(enemies.find(enemy=>enemy.id==='scarab-swarm').portrait,'/assets/enemies/scarab_swarm.svg');
  assert.equal(enemies.find(enemy=>enemy.id==='india-assassin').portrait,'/assets/enemies/india_assassin.svg');
  assert.equal(enemies.find(enemy=>enemy.id==='india-mage').portrait,'/assets/enemies/india_mage.svg');
  assert.equal(enemies.filter(enemy=>['india-warrior','india-elite'].includes(enemy.id)).every(enemy=>enemy.portrait==='/assets/enemies/india_warrior.svg'),true);
  for(const asset of ['desert_scorpion.svg','scarab_swarm.svg','india_assassin.svg','india_mage.svg','india_warrior.svg']){
    const svg=readFileSync('./public/assets/enemies/'+asset,'utf8');assert.match(svg,/^<svg/);assert.equal(svg.length>1100,true,asset);
  }
});
test('完成前三章后解锁第四章首场',()=>{const previous=ALL_REBUILD_ENCOUNTERS.filter(e=>e.chapterNumber!==4).map(e=>e.id);const p=createCampaignProgress({campaign:{completed:previous,unlockedIndex:17}},ALL_REBUILD_ENCOUNTERS);assert.equal(p.chapter,4);assert.equal(canLaunchEncounter(p,'desert-caravan',ALL_REBUILD_ENCOUNTERS),true);assert.equal(canLaunchEncounter(p,'cairo-intel',ALL_REBUILD_ENCOUNTERS),false);});
test('齐腾一与零点牺牲后均不进入伊莫顿终战',()=>{const profile={level:13,equippedSkills:[],inventory:{}};const ambush=createRebuildParty(profile,createRebuildEncounter('india-ambush')).map(x=>x.name);const scripture=createRebuildParty(profile,createRebuildEncounter('resurrection-scripture')).map(x=>x.name);const final=createRebuildParty(profile,createRebuildEncounter('imhotep-final')).map(x=>x.name);assert.equal(ambush.includes('齐腾一'),true);assert.equal(scripture.includes('零点'),true);assert.equal(final.includes('齐腾一'),false);assert.equal(final.includes('零点'),false);assert.equal(final.includes('张恒'),true);assert.equal(final.includes('萧宏律'),true);});
test('第四章六场可顺序通关且终战触发火焰弱点和复生',()=>{const previous=ALL_REBUILD_ENCOUNTERS.filter(e=>e.chapterNumber!==4).map(e=>e.id);let progress=createCampaignProgress({campaign:{completed:previous,unlockedIndex:previous.length}},ALL_REBUILD_ENCOUNTERS);for(const source of CHAPTER_FOUR_ENCOUNTERS){const encounter=createRebuildEncounter(source.id);const result=playEncounter(encounter);assert.equal(result.engine.status,'victory',encounter.id);assert.ok(result.engine.getLiving('party').length>0);assert.ok(result.actions<360);if(encounter.id==='imhotep-final'){assert.equal(result.weaknessSeen,true);assert.equal(result.regenSeen,true);}progress=settleEncounter(progress,encounter.id,'victory',ALL_REBUILD_ENCOUNTERS).progress;}assert.equal(progress.completed.length,ALL_REBUILD_ENCOUNTERS.length);});
console.log('\n✅ '+passed+' Chapter 4 checks passed');
