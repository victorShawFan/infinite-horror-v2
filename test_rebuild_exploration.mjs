import assert from 'node:assert/strict';
import { ExplorationEngine } from './src/rebuild/core/ExplorationEngine.js';
import { createExplorationScenario } from './src/rebuild/data/ExplorationScenarios.js';
import { ALL_REBUILD_ENCOUNTERS } from './src/rebuild/data/RebuildCampaign.js';

let passed=0;function test(name,fn){try{fn();passed++;console.log('  ✅ '+name);}catch(error){console.error('  ❌ '+name);throw error;}}
const scenario={width:5,height:5,tiles:['#####','#...#','#...#','#...#','#####'],playerStart:{x:1,y:1},entities:[
  {id:'npc',type:'npc',x:2,y:1,required:true,dialogue:[{speaker:'詹岚',text:'先调查这里。'}]},
  {id:'item',type:'item',x:1,y:2,itemId:'first_aid',quantity:1},
  {id:'battle',type:'battle',x:3,y:1,requires:['npc'],encounterId:'demo'},
  {id:'exit',type:'exit',x:3,y:3},
]};

console.log('\n[ Rebuild Exploration ]');
test('WASD式移动受墙体和实体碰撞约束并记录朝向',()=>{const e=new ExplorationEngine(scenario);assert.equal(e.move(0,-1).moved,false);assert.equal(e.state.facing,'up');assert.equal(e.move(1,0).moved,false);assert.deepEqual(e.state.player,{x:1,y:1});assert.equal(e.move(0,1).moved,false);assert.equal(e.state.facing,'down');});
test('面对NPC互动返回对话、NPC持续碰撞且可重复交谈',()=>{const e=new ExplorationEngine(scenario);e.move(1,0);const talk=e.interact();assert.equal(talk.type,'dialogue');assert.equal(talk.dialogue[0].speaker,'詹岚');assert.equal(e.state.interacted.includes('npc'),true);assert.equal(e.move(1,0).moved,false);assert.equal(e.interact().type,'dialogue');e.move(0,1);assert.equal(e.interact().type,'item');e.move(0,1);e.move(1,0);e.move(1,0);e.move(0,-1);const battle=e.interact();assert.equal(battle.type,'battle');assert.equal(battle.encounterId,'demo');});
test('未完成必需对话时战斗触发器返回明确锁定原因',()=>{const e=new ExplorationEngine({...scenario,playerStart:{x:2,y:1}});e.move(1,0);const result=e.interact();assert.equal(result.type,'locked');assert.equal(result.missing.includes('npc'),true);});
test('拾取物只生效一次且快照恢复后不会重复刷新',()=>{const e=new ExplorationEngine(scenario);e.move(0,1);const first=e.interact();assert.equal(first.type,'item');assert.equal(first.itemId,'first_aid');const restored=new ExplorationEngine(scenario,e.snapshot());restored.move(0,1);assert.equal(restored.interact().type,'none');});
test('出口必须在战斗胜利后开放',()=>{const e=new ExplorationEngine({...scenario,playerStart:{x:2,y:3}});e.move(1,0);assert.equal(e.interact().type,'locked');e.markBattleCleared();assert.equal(e.interact().type,'exit');});
test('24个任务都生成NPC、物品、遭遇和出口且关键实体可达',()=>{assert.equal(ALL_REBUILD_ENCOUNTERS.length,24);for(const encounter of ALL_REBUILD_ENCOUNTERS){const s=createExplorationScenario(encounter);assert.equal(s.entities.filter(x=>x.type==='npc').length>=2,true,encounter.id+' npc');assert.equal(s.entities.some(x=>x.type==='item'),true,encounter.id+' item');assert.equal(s.entities.some(x=>x.type==='battle'),true,encounter.id+' battle');assert.equal(s.entities.some(x=>x.type==='exit'),true,encounter.id+' exit');const e=new ExplorationEngine(s);assert.equal(e.validateReachability().ok,true,encounter.id+' reachability');}});
console.log('\n✅ '+passed+' exploration checks passed');
