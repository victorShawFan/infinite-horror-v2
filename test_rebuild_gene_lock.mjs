import assert from 'node:assert/strict';
import { applyGeneLockMilestone, inferGeneLockStage, getGeneLockBonuses, GENE_LOCK_MILESTONES } from './src/rebuild/core/RebuildGeneLock.js';
import { createParty, DEFAULT_PROFILE } from './src/rebuild/data/ChapterOneBattle.js';

let passed=0;function test(name,fn){try{fn();passed++;console.log('  ✅ '+name);}catch(error){console.error('  ❌ '+name);throw error;}}
console.log('\n[ Rebuild Gene Lock ]');
test('关键生死战定义一阶与二阶基因锁里程碑',()=>{assert.equal(GENE_LOCK_MILESTONES['train-awakening'],1);assert.equal(GENE_LOCK_MILESTONES['hive-rescue'],2);});
test('只在首通里程碑时突破且重复副本不重复突破',()=>{const first=applyGeneLockMilestone({geneLockStage:0},'train-awakening',true);assert.equal(first.unlocked,true);assert.equal(first.profile.geneLockStage,1);const repeat=applyGeneLockMilestone(first.profile,'train-awakening',false);assert.equal(repeat.unlocked,false);assert.equal(repeat.profile.geneLockStage,1);});
test('旧存档根据已完成关键战补回应有基因锁阶段',()=>{assert.equal(inferGeneLockStage([],0),0);assert.equal(inferGeneLockStage(['train-awakening'],0),1);assert.equal(inferGeneLockStage(['train-awakening','hive-rescue'],0),2);assert.equal(inferGeneLockStage([],2),2);});
test('基因锁阶段提供永久战斗成长并真实进入郑吒快照',()=>{assert.deepEqual(getGeneLockBonuses(0),{maxHp:0,atk:0,def:0,spd:0,crit:0});const stage2=getGeneLockBonuses(2);assert.equal(stage2.atk>0,true);assert.equal(stage2.spd>0,true);const base=createParty(DEFAULT_PROFILE).find(x=>x.id==='zheng');const evolved=createParty({...DEFAULT_PROFILE,geneLockStage:2}).find(x=>x.id==='zheng');assert.equal(evolved.atk,base.atk+stage2.atk);assert.equal(evolved.spd,base.spd+stage2.spd);});
console.log('\n✅ '+passed+' gene lock checks passed');
