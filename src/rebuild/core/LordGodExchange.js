const BODY = Object.freeze({
  intelligence: { id:'intelligence', name:'智力', category:'body', icon:'智', baseCost:55, maxRank:20, perRank:{ maxMp:1, crit:1 }, desc:'提高思考与战场判断，增加精神容量和暴击率。' },
  spirit:       { id:'spirit', name:'精神力', category:'body', icon:'神', baseCost:65, maxRank:20, perRank:{ maxMp:4 }, desc:'扩大精神能量上限，为技能与能量体系提供支撑。' },
  cellular:     { id:'cellular', name:'细胞活力', category:'body', icon:'生', baseCost:60, maxRank:20, perRank:{ maxHp:10 }, desc:'增强伤势承受与恢复能力，提高最大生命。' },
  nerve:        { id:'nerve', name:'神经反应速度', category:'body', icon:'速', baseCost:70, maxRank:20, perRank:{ spd:1, crit:1 }, desc:'提高出手顺序和捕捉弱点的能力。' },
  muscle:       { id:'muscle', name:'肌肉组织强度', category:'body', icon:'力', baseCost:70, maxRank:20, perRank:{ atk:2, def:1 }, desc:'直接强化近战力量与身体抗冲击能力。' },
  immunity:     { id:'immunity', name:'免疫力强度', category:'body', icon:'抗', baseCost:60, maxRank:20, perRank:{ maxHp:6, def:1 }, desc:'提高对感染、毒素和异常损伤的承受力。' },
});

const UNIQUE = Object.freeze({
  'vampire-baron': { id:'vampire-baron', name:'血族男爵变异血统', category:'bloodline', icon:'血', cost:850, sideStory:{D:1}, bonuses:{maxHp:24,maxMp:12,atk:4,crit:3}, grantsSkills:['red_flame'], desc:'以血族能量强化生命力，并开放血炎类技能。' },
  'basic-qi': { id:'basic-qi', name:'初级气功强化', category:'energy', icon:'气', cost:700, sideStory:{D:1}, bonuses:{maxMp:18,atk:3,def:2}, grantsSkills:['inner_burst'], desc:'在体内建立内力循环，兼顾持久战和爆发。' },
  'desert-eagle-infinite': { id:'desert-eagle-infinite', name:'无限弹药沙漠之鹰', category:'equipment', slot:'weapon', range:'ranged', icon:'枪', cost:220, bonuses:{atk:5,crit:4}, attackRange:'ranged', desc:'可靠的无限弹药侧武器，适合初期远程构筑。' },
  'gauss-sniper': { id:'gauss-sniper', name:'高斯狙击步枪', category:'equipment', slot:'weapon', range:'ranged', icon:'狙', cost:2400, sideStory:{C:1}, bonuses:{atk:12,crit:11,spd:-1}, attackRange:'ranged', desc:'将战斗转化为远距离弱点狙杀。' },
  'na-ring': { id:'na-ring', name:'纳戒', category:'equipment', slot:'weapon', range:'melee', icon:'戒', cost:1400, sideStory:{C:1}, bonuses:{atk:7,def:3,crit:4}, damageType:'spirit', desc:'内力驱动的修真灵器，近战攻击可以伤害灵体。' },
  'tiger-soul-blade': { id:'tiger-soul-blade', name:'虎魄刀', category:'equipment', slot:'weapon', range:'melee', icon:'虎', cost:4000, sideStory:{B:1}, bonuses:{atk:15,crit:7,def:-1}, desc:'以中正内力压制戾气，换取极高的近战输出。' },
  'dragon-crystal': { id:'dragon-crystal', name:'龙晶防护', category:'equipment', slot:'armor', range:'defense', icon:'晶', cost:3200, sideStory:{B:1}, bonuses:{maxHp:38,def:10}, desc:'以能量驱动的高阶防护道具，显著提升生存能力。' },
});

export const LORD_GOD_EXCHANGE = Object.freeze({ ...BODY, ...UNIQUE });

function clonedProfile(profile) {
  return {
    ...profile,
    sideStories:{D:0,C:0,B:0,A:0,S:0,...(profile.sideStories||{})},
    bodyRanks:{...(profile.bodyRanks||{})},
    ownedEnhancements:[...(profile.ownedEnhancements||[])],
    ownedEquipment:[...(profile.ownedEquipment||[])],
    learnedSkills:[...(profile.learnedSkills||[])],
  };
}

function requiredSideStoryMissing(profile, required={}) {
  return Object.entries(required).some(([rank,count])=>Number(profile.sideStories?.[rank]||0)<Number(count||0));
}

export function getEnhancementPrice(profile, enhancementId) {
  const entry=LORD_GOD_EXCHANGE[enhancementId];
  if(!entry)return 0;
  if(entry.category!=='body')return entry.cost||0;
  return entry.baseCost*Math.max(1,Number(profile.bodyRanks?.[entry.id]||0)+1);
}

export function purchaseEnhancement(profile, enhancementId) {
  const next=clonedProfile(profile);
  const entry=LORD_GOD_EXCHANGE[enhancementId];
  if(!entry)return{ok:false,error:'enhancement_not_found',profile:next};
  const spent=getEnhancementPrice(next,enhancementId);
  if(entry.category==='body'){
    const rank=Number(next.bodyRanks[entry.id]||0);
    if(rank>=entry.maxRank)return{ok:false,error:'max_rank',profile:next};
  }else if(next.ownedEnhancements.includes(entry.id)||next.ownedEquipment.includes(entry.id)){
    return{ok:false,error:'already_owned',profile:next};
  }
  if(Number(next.rewardPoints||0)<spent)return{ok:false,error:'insufficient_points',profile:next};
  if(requiredSideStoryMissing(next,entry.sideStory))return{ok:false,error:'insufficient_side_story',profile:next};
  next.rewardPoints-=spent;
  for(const[rank,count]of Object.entries(entry.sideStory||{}))next.sideStories[rank]-=count;
  if(entry.category==='body')next.bodyRanks[entry.id]=Number(next.bodyRanks[entry.id]||0)+1;
  else if(entry.category==='equipment'){
    next.ownedEquipment.push(entry.id);
    if(entry.slot==='weapon')next.equippedWeapon=entry.id;
    if(entry.slot==='armor')next.equippedArmor=entry.id;
  }else next.ownedEnhancements.push(entry.id);
  for(const skillId of entry.grantsSkills||[])if(!next.learnedSkills.includes(skillId))next.learnedSkills.push(skillId);
  return{ok:true,entry,spent,profile:next};
}

export function equipOwnedEquipment(profile, equipmentId) {
  const next=clonedProfile(profile);
  const entry=UNIQUE[equipmentId];
  if(!entry||entry.category!=='equipment')return{ok:false,error:'equipment_not_found',profile:next};
  if(!next.ownedEquipment.includes(equipmentId))return{ok:false,error:'equipment_not_owned',profile:next};
  if(entry.slot==='weapon')next.equippedWeapon=equipmentId;
  else if(entry.slot==='armor')next.equippedArmor=equipmentId;
  return{ok:true,entry,profile:next};
}

function addBonuses(target,bonuses={}){for(const[stat,value]of Object.entries(bonuses))target[stat]=(target[stat]||0)+Number(value||0);}

export function getLordGodBonuses(profile) {
  const bonuses={maxHp:0,maxMp:0,atk:0,def:0,spd:0,crit:0,attackRange:null,damageType:null};
  for(const[id,rank]of Object.entries(profile.bodyRanks||{})){
    const entry=BODY[id];if(!entry)continue;
    const scaled=Object.fromEntries(Object.entries(entry.perRank).map(([stat,value])=>[stat,value*Number(rank||0)]));
    addBonuses(bonuses,scaled);
  }
  for(const id of profile.ownedEnhancements||[])addBonuses(bonuses,UNIQUE[id]?.bonuses);
  for(const id of [profile.equippedWeapon,profile.equippedArmor].filter(Boolean)){
    const entry=UNIQUE[id];if(!entry)continue;addBonuses(bonuses,entry.bonuses);
    if(entry.attackRange)bonuses.attackRange=entry.attackRange;
    if(entry.damageType)bonuses.damageType=entry.damageType;
  }
  return bonuses;
}
