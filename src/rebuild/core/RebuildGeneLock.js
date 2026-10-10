export const GENE_LOCK_MILESTONES=Object.freeze({
  'train-awakening':1,
  'hive-rescue':2,
});

const STAGE_BONUSES=Object.freeze({
  0:{maxHp:0,atk:0,def:0,spd:0,crit:0},
  1:{maxHp:10,atk:2,def:0,spd:2,crit:2},
  2:{maxHp:24,atk:5,def:2,spd:4,crit:4},
});

export function getGeneLockBonuses(stage){
  const normalized=Math.max(0,Math.min(2,Math.floor(Number(stage||0))));
  return{...STAGE_BONUSES[normalized]};
}

export function inferGeneLockStage(completedEncounterIds=[],savedStage=0){
  const completed=new Set(completedEncounterIds||[]);
  let inferred=Math.max(0,Math.floor(Number(savedStage||0)));
  for(const[encounterId,stage]of Object.entries(GENE_LOCK_MILESTONES)){
    if(completed.has(encounterId))inferred=Math.max(inferred,stage);
  }
  return inferred;
}

export function applyGeneLockMilestone(profile,encounterId,firstClear){
  const next={...profile,geneLockStage:Math.max(0,Math.floor(Number(profile.geneLockStage||0)))};
  const milestone=Number(GENE_LOCK_MILESTONES[encounterId]||0);
  if(!firstClear||milestone<=next.geneLockStage)return{unlocked:false,stage:next.geneLockStage,profile:next};
  next.geneLockStage=milestone;
  return{unlocked:true,stage:milestone,bonuses:getGeneLockBonuses(milestone),profile:next};
}
