import assert from 'node:assert/strict';
import { runExplorationPolicy } from './src/rebuild/testing/ExplorationPolicyRunner.js';
import { createExplorationScenario } from './src/rebuild/data/ExplorationScenarios.js';
import { ALL_REBUILD_ENCOUNTERS } from './src/rebuild/data/RebuildCampaign.js';

let passed=0;
function test(name,fn){try{fn();passed++;console.log('  ✅ '+name);}catch(error){console.error('  ❌ '+name);throw error;}}

console.log('\n[ Rebuild Exploration Policy Rollouts ]');
const chapterOne=ALL_REBUILD_ENCOUNTERS.filter(encounter=>Number(encounter.chapterNumber||1)===1);
const chapterTwo=ALL_REBUILD_ENCOUNTERS.filter(encounter=>Number(encounter.chapterNumber||1)===2);

test('主线策略跑完第一章六场的调查、接敌、返图与撤离',()=>{
  for(const encounter of chapterOne){
    const result=runExplorationPolicy({scenario:createExplorationScenario(encounter),strategy:'mainline'});
    assert.equal(result.status,'completed',encounter.id+' '+result.termination);
    assert.equal(result.events.some(event=>event.type==='battle_started'),true,encounter.id+' battle');
    assert.equal(result.events.some(event=>event.type==='battle_cleared'),true,encounter.id+' battle return');
    assert.equal(result.events.at(-1).type,'exit',encounter.id+' exit');
    assert.equal(result.metrics.requiredCompletion,1,encounter.id+' required');
    assert.equal(result.metrics.cluesFound,0,encounter.id+' mainline skips optional clue');
  }
});

test('全调查策略发现六场战术线索并带入对应战前收益',()=>{
  for(const encounter of chapterOne){
    const result=runExplorationPolicy({scenario:createExplorationScenario(encounter),strategy:'completionist'});
    assert.equal(result.status,'completed',encounter.id+' '+result.termination);
    assert.equal(result.metrics.cluesFound>=1,true,encounter.id+' clue');
    assert.equal(result.battlePreparation.notes.length>=1,true,encounter.id+' battle preparation');
    assert.equal(result.metrics.entityCoverage,1,encounter.id+' entity coverage');
  }
});

test('策略轨迹记录状态、动作、事件、进度与终止原因',()=>{
  const result=runExplorationPolicy({scenario:createExplorationScenario(chapterOne[0]),strategy:'completionist'});
  assert.equal(result.trajectory.length>0,true);
  const sample=result.trajectory.find(step=>step.event?.type==='dialogue');
  assert.equal(Boolean(sample?.state&&sample?.action&&sample?.progress),true);
  assert.equal(Number.isFinite(sample.timingMs),true);
  assert.equal(result.termination,'exit_reached');
  assert.equal(result.metrics.invalidMoves,0);
});

test('第二章六张异形飞船地图可完成主线与全调查路线',()=>{
  for(const encounter of chapterTwo){
    const scenario=createExplorationScenario(encounter);
    const mainline=runExplorationPolicy({scenario,strategy:'mainline'});
    assert.equal(mainline.status,'completed',encounter.id+' mainline '+mainline.termination);
    assert.equal(mainline.metrics.requiredCompletion,1,encounter.id+' required');
    const completionist=runExplorationPolicy({scenario,strategy:'completionist'});
    assert.equal(completionist.status,'completed',encounter.id+' completionist '+completionist.termination);
    assert.equal(completionist.metrics.cluesFound>=1,true,encounter.id+' clue');
    assert.equal(completionist.battlePreparation.notes.length>=1,true,encounter.id+' preparation');
    assert.equal(completionist.metrics.entityCoverage,1,encounter.id+' coverage');
  }
});

console.log('\n✅ '+passed+' rollout checks passed');
