import { TILE, ENTITY_TYPE } from './constants.js';
const W = 21, H = 17;
function makeGrid(fill = TILE.WALL) { return Array.from({ length: H }, () => Array(W).fill(fill)); }
function carveRoom(g, x1, y1, x2, y2) { for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) if (y>=0&&y<H&&x>=0&&x<W) g[y][x] = TILE.FLOOR; }
function carveCorridor(g, x1, y1, x2, y2) { let cx=x1,cy=y1; while(cx!==x2){g[cy][cx]=TILE.FLOOR;cx+=cx<x2?1:-1;} while(cy!==y2){g[cy][cx]=TILE.FLOOR;cy+=cy<y2?1:-1;} g[cy][cx]=TILE.FLOOR; }

// ═══ 10-1 偷袭生化取样 ═══
function f10_1(){const g=makeGrid();carveRoom(g,1,7,6,10);carveCorridor(g,6,8,10,8);carveRoom(g,10,5,16,11);carveCorridor(g,16,8,19,8);carveRoom(g,16,6,19,10);carveRoom(g,3,1,8,5);carveCorridor(g,5,5,5,7);carveRoom(g,10,13,16,16);carveCorridor(g,13,11,13,13);g[15][15]=TILE.STAIRS;return{id:'10-1',name:'偷袭生化取样',subtitle:'楚轩的计划：偷回生化世界取复活必需的生物样本。',bgColor:'#0a0808',theme:'biolab',tiles:g,width:W,height:H,playerStart:{x:3,y:8},entities:[
{type:ENTITY_TYPE.EVENT,id:'ch10_intro',name:'偷袭计划',x:4,y:8,sprite:'📋',color:'#88aaff',event:{type:'dialogue',lines:[{text:'楚轩展开了作战计划。"我们需要回生化世界取样。"',speaker:'旁白'},{text:'赵樱空、张恒、程啸——他们的复活需要基因样本。',speaker:'楚轩'},{text:'速战速决。不要惊动恶魔队。',speaker:'郑吒'}],flag:'ch10_started'}},
{type:ENTITY_TYPE.ENEMY,id:'bio_guard_1',name:'生化实验体',x:13,y:8,sprite:'🧟',color:'#668844',hp:120,atk:38,def:16,spd:10,rewards:{exp:95,gold:65}},
{type:ENTITY_TYPE.ITEM,id:'medkit_ch10_1',name:'急救包',x:14,y:14,sprite:'♥',color:'#ff4488',itemType:'consumable',effect:{heal:120}},
{type:ENTITY_TYPE.ITEM,id:'atk_ch10',name:'魔力结晶',x:18,y:7,sprite:'◆',color:'#ff8844',itemType:'stat_boost',effect:{atk:7}},
{type:ENTITY_TYPE.ENEMY,id:'bio_drone',name:'生化无人机',x:5,y:3,sprite:'🤖',color:'#668844',hp:100,atk:34,def:12,spd:14,rewards:{exp:80,gold:55}},
{type:ENTITY_TYPE.ENEMY,id:'bio_mutant',name:'变异猎手',x:12,y:14,sprite:'🦎',color:'#668844',hp:110,atk:36,def:14,spd:12,rewards:{exp:85,gold:60},traits:['regen']},
{type:ENTITY_TYPE.EVENT,id:'team_intel',name:'敌队情报',x:7,y:3,sprite:'📋',color:'#88aaff',event:{type:'dialogue',lines:[{text:'楚轩收集到了五支队伍的情报。',speaker:'旁白'},{text:'天使队——擅长光明魔法。恶魔队——我们的老对手。',speaker:'楚轩'},{text:'东征队——剑士为主。自由队——散兵游勇。',speaker:'楚轩'},{text:'西游队——他们很强。但最危险的，还是恶魔队。',speaker:'楚轩'}]}},
{type:'item',id:'lore_teams',name:'五队情报总汇',x:16,y:6,sprite:'📝',color:'#88aaff',itemType:'lore',loreId:'lore_10_teams',description:'楚轩整理的五支轮回者队伍详细情报。每支队伍的能力、弱点和可能的战术。'},
{type:ENTITY_TYPE.ITEM,id:'def_ch10_1',name:'反冲装甲',x:4,y:9,sprite:'◆',color:'#6688ff',itemType:'stat_boost',effect:{def:7}}]};}

// ═══ 10-2 三人复活 ═══
function f10_2(){const g=makeGrid();carveRoom(g,1,1,7,6);carveCorridor(g,7,3,10,3);carveRoom(g,10,1,16,6);carveCorridor(g,13,6,13,9);carveRoom(g,10,9,16,13);carveRoom(g,1,9,7,13);carveCorridor(g,4,6,4,9);carveCorridor(g,7,11,10,11);carveRoom(g,16,10,19,15);carveCorridor(g,16,12,16,12);g[14][18]=TILE.STAIRS;return{id:'10-2',name:'三人复活',subtitle:'赵樱空、张恒、程啸——三道金光同时亮起。',bgColor:'#0a0a08',theme:'biolab',tiles:g,width:W,height:H,playerStart:{x:4,y:3},entities:[
{type:ENTITY_TYPE.EVENT,id:'revive_three',name:'三人复活仪式',x:13,y:3,sprite:'✦',color:'#ffdd44',event:{type:'dialogue',lines:[{text:'三道金光同时照亮了祭坛。赵樱空、张恒、程啸的身影逐渐凝实。',speaker:'旁白'},{text:'……我又做了一个很长的梦。',speaker:'赵樱空'},{text:'欢迎回来。你们三个。',speaker:'郑吒'},{text:'（赵樱空、张恒、程啸复活成功。中洲队全员归队。）',speaker:'主神'}],flag:'three_revived',reviveCompanions:['zhao_yingkong','zhang_heng','cheng_xiao']}},
{type:ENTITY_TYPE.ENEMY,id:'bio_guard_2',name:'生化守卫',x:13,y:11,sprite:'🧟',color:'#668844',hp:110,atk:36,def:14,spd:11,rewards:{exp:85,gold:58}},
{type:ENTITY_TYPE.ITEM,id:'medkit_ch10_2',name:'急救包',x:4,y:11,sprite:'♥',color:'#ff4488',itemType:'consumable',effect:{heal:120}},
{type:ENTITY_TYPE.EVENT,id:'yingkong_return',name:'赵樱空的归来',x:11,y:11,sprite:'💭',color:'#ff88aa',event:{type:'dialogue',lines:[{text:'赵樱空睁开眼的第一件事，是看向郑吒。',speaker:'旁白'},{text:'……又做了一个很长的梦。梦里，我看到你一个人在战斗。',speaker:'赵樱空'},{text:'现在不是一个人了。',speaker:'郑吒'},{text:'嗯。',speaker:'赵樱空'}],flag:'yingkong_returned'}},{type:ENTITY_TYPE.ITEM,id:'hp_ch10',name:'生命结晶',x:18,y:13,sprite:'◆',color:'#44ff44',itemType:'stat_boost',effect:{maxHp:40}}]};}

// ═══ 10-3 魔戒会议 ═══
function f10_3(){const g=makeGrid();carveRoom(g,1,1,5,5);carveCorridor(g,5,3,9,3);carveRoom(g,9,1,14,5);carveCorridor(g,11,5,11,9);carveRoom(g,8,9,14,13);carveRoom(g,1,8,6,12);carveCorridor(g,4,5,4,8);carveCorridor(g,6,10,8,10);carveRoom(g,15,9,19,14);carveCorridor(g,14,11,15,11);g[13][18]=TILE.STAIRS;return{id:'10-3',name:'魔戒会议',subtitle:'瑞文戴尔。楚轩已经开始分析五队的战力布局。',bgColor:'#0a0c10',theme:'fantasy',tiles:g,width:W,height:H,playerStart:{x:3,y:3},entities:[
{type:ENTITY_TYPE.EVENT,id:'ch10_alliance',name:'联盟决策',x:6,y:3,sprite:'?',color:'#ffcc44',event:{type:'choice',lines:[{text:'五支队伍在中土集结。',speaker:'旁白'},{text:'先手出击还是暗中结盟？',speaker:'楚轩'}],choices:[{id:'alliance',text:'结盟对抗最大威胁',effect:{def:4,hp:30,description:'战略缓冲',relationship:{chuxuan:'good_decision',zhan_lan:'good_decision'}}},{id:'solo',text:'单打独斗',effect:{atk:5,description:'独立作战',relationship:{bawang:'good_decision',lingdian:'good_decision'}}},{id:'spy',text:'派零点潜入',effect:{crt:4,spd:2,description:'情报扭转局势',relationship:{lingdian:'save_life'}}}],flag:'ch10_alliance_done'}},{type:ENTITY_TYPE.EVENT,id:'lotr_briefing',name:'战力分析',x:11,y:3,sprite:'📋',color:'#88aaff',event:{type:'dialogue',lines:[{text:'五支轮回者队伍同时进入魔戒世界。',speaker:'旁白'},{text:'天神队是最大的威胁。他们的实力远超其他队伍。',speaker:'楚轩'},{text:'我们需要联盟。至少在面对魔多之前。',speaker:'郑吒'}],flag:'lotr_briefing'}},
{type:ENTITY_TYPE.ENEMY,id:'orc_scout',name:'兽人斥候',x:4,y:10,sprite:'👹',color:'#886644',hp:100,atk:34,def:12,spd:12,rewards:{exp:80,gold:52}},
{type:ENTITY_TYPE.ENEMY,id:'orc_warrior',name:'兽人战士',x:17,y:12,sprite:'👹',color:'#886644',hp:115,atk:36,def:14,spd:10,rewards:{exp:88,gold:58}},
{type:ENTITY_TYPE.ITEM,id:'def_ch10',name:'秘银护甲片',x:2,y:9,sprite:'◆',color:'#6688ff',itemType:'stat_boost',effect:{def:7}},
{type:ENTITY_TYPE.ITEM,id:'trap_ch10_curse',name:'💀 远古诅咒',x:5,y:3,sprite:'💀',color:'#aa44ff',itemType:'trap',trapType:'curse'},{type:ENTITY_TYPE.ITEM,id:'chest_ch10',name:'精灵宝箱',x:16,y:13,sprite:'📦',color:'#44ffaa',itemType:'chest',chestType:'gold'},{type:ENTITY_TYPE.ITEM,id:'medkit_10_3',name:'精灵草药',x:18,y:12,sprite:'♥',color:'#44ff88',itemType:'consumable',effect:{heal:120}},{type:'item',id:'lore_teams_detail',name:'轮回者观察报告',x:3,y:10,sprite:'📋',color:'#ffdd44',itemType:'lore',loreId:'lore_10_teams',description:'一份关于五支队伍的观察报告。'},
      {type:ENTITY_TYPE.ITEM,id:'set_zhongzhou_plate',name:'中洲铁甲',x:14,y:5,sprite:'🛡',color:'#ffcc44',
       itemType:'armor',armor:{name:'中洲铁甲',def:16,maxHp:40,setId:'zhongzhou_plate',slot:'armor',
       description:'中洲精锐部队的制式护甲，防护优秀。'}},
{type:ENTITY_TYPE.ITEM,id:'divine_ring_drop',name:'天神戒指',x:11,y:8,sprite:'💍',color:'#ffcc44',itemType:'accessory',accessory:{name:'天神戒指',atk:6,crt:8,spd:2,slot:'accessory',desc:'蕴含强大力量的戒指'}}
]};}

// ═══ 10-4 五队接触 ═══
function f10_4(){const g=makeGrid();carveRoom(g,1,6,6,11);carveCorridor(g,6,8,10,8);carveRoom(g,10,4,15,12);carveCorridor(g,15,8,18,8);carveRoom(g,16,5,19,11);carveRoom(g,5,1,10,3);carveCorridor(g,8,3,8,4);carveRoom(g,8,13,14,16);carveCorridor(g,11,12,11,13);g[15][13]=TILE.STAIRS;return{id:'10-4',name:'五队接触',subtitle:'战场上出现了其他轮回者队伍。有人试图联盟，有人选择背叛。',bgColor:'#0a0c10',theme:'fantasy',tiles:g,width:W,height:H,playerStart:{x:3,y:8},entities:[
{type:ENTITY_TYPE.ENEMY,id:'rival_fighter',name:'敌队战士',x:12,y:8,sprite:'⚔',color:'#cc6622',hp:130,atk:40,def:16,spd:13,rewards:{exp:100,gold:68,rewardPoints:80}},
{type:ENTITY_TYPE.ENEMY,id:'rival_mage',name:'敌队法师',x:8,y:1,sprite:'🔮',color:'#8844aa',hp:95,atk:44,def:10,spd:15,damageType:'dark',rewards:{exp:95,gold:65,rewardPoints:70}},
{type:ENTITY_TYPE.ITEM,id:'medkit_ch10_4',name:'精灵草药',x:11,y:14,sprite:'♥',color:'#44ff88',itemType:'consumable',effect:{heal:130}},
{type:ENTITY_TYPE.ITEM,id:'spd_ch10',name:'精灵轻靴',x:18,y:7,sprite:'◆',color:'#44ffaa',itemType:'stat_boost',effect:{spd:6}},
{type:ENTITY_TYPE.ENEMY,id:'rival_assassin',name:'敌队刺客',x:17,y:9,sprite:'🗡',color:'#cc4444',hp:85,atk:44,def:8,spd:20,rewards:{exp:90,gold:62,rewardPoints:60}},
      // 野外商人  
      { type: ENTITY_TYPE.NPC, id: 'merchant_ch10', name: '跨界旅行商',
        x: 5, y: 8, sprite: '🏪', color: '#ffcc44', merchant: true,
        dialogue: [
          { text: '"五支队伍混战之际，正是补给的好时机。"', speaker: '跨界旅行商' }],
      },
    
      // 环境线索
      { type: ENTITY_TYPE.ITEM, id: 'lore_ch10_f4', name: '同盟协议',
        x: 16, y: 8, sprite: '📜', color: '#44cccc',
        itemType: 'lore', loreId: 'lore_10_alliance',
        description: '一份已经被撕掉一角的临时协议。',
      }]};}

// ═══ 10-5 魔多战场 ═══
function f10_5(){const g=makeGrid();carveRoom(g,6,5,14,12);carveRoom(g,1,7,5,10);carveCorridor(g,5,8,6,8);carveRoom(g,15,7,19,10);carveCorridor(g,14,8,15,8);carveRoom(g,8,1,12,4);carveCorridor(g,10,4,10,5);carveRoom(g,8,13,12,16);carveCorridor(g,10,12,10,13);g[1][11]=TILE.STAIRS;return{id:'10-5',name:'魔多战场',subtitle:'黑暗之门打开。魔多军势如潮水般涌来。',bgColor:'#0c0808',theme:'fantasy',tiles:g,width:W,height:H,playerStart:{x:10,y:15},entities:[
{type:ENTITY_TYPE.ENEMY,id:'nazgul',name:'戒灵',x:10,y:8,sprite:'👻',color:'#442266',hp:160,atk:42,def:18,spd:14,damageType:'dark',weaknesses:['spirit'],rewards:{exp:120,gold:80}},
{type:ENTITY_TYPE.ENEMY,id:'uruk_captain',name:'强兽人队长',x:3,y:8,sprite:'👹',color:'#aa4422',hp:140,atk:38,def:20,spd:9,rewards:{exp:105,gold:70}},
{type:ENTITY_TYPE.ITEM,id:'medkit_ch10_5',name:'精灵草药',x:17,y:8,sprite:'♥',color:'#44ff88',itemType:'consumable',effect:{heal:140}},
{type:ENTITY_TYPE.EVENT,id:'mordor_strategy',name:'战场决策',x:10,y:5,sprite:'⚖',color:'#ffcc44',event:{type:'choice',lines:[{text:'魔多军势如潮水般涌来。必须做出选择。',speaker:'旁白'},{text:'我们可以正面迎敌，也可以绕到侧翼。',speaker:'楚轩'}],choices:[{text:'正面迎敌 (ATK+6, 士气高昂)',flag:'frontal_assault',effect:{atk:6,description:'正面突击鼓舞了全队士气'}},{text:'侧翼包抄 (SPD+4, CRT+4, 出其不意)',flag:'flank_attack',effect:{spd:4,crt:4,description:'侧翼奇袭打了敌人一个措手不及'}}],flag:'mordor_strategy_done'}},{type:ENTITY_TYPE.ENEMY,id:'orc_shaman',name:'兽人萨满',x:16,y:8,sprite:'🔮',color:'#886644',hp:100,atk:36,def:10,spd:12,damageType:'dark',rewards:{exp:85,gold:58}}]};}

// ═══ 10-6 团战结算 ═══
function f10_6(){const g=makeGrid();carveRoom(g,1,1,6,5);carveCorridor(g,6,3,10,3);carveRoom(g,10,1,16,6);carveCorridor(g,13,6,13,10);carveRoom(g,9,10,16,14);carveRoom(g,1,8,7,13);carveCorridor(g,4,5,4,8);carveCorridor(g,7,12,9,12);carveRoom(g,16,11,19,15);carveCorridor(g,16,13,16,13);g[14][18]=TILE.STAIRS;return{id:'10-6',name:'团战结算',subtitle:'天神队的强者现身了。这是最危险的对手。',bgColor:'#0c0808',theme:'fantasy',tiles:g,width:W,height:H,playerStart:{x:3,y:3},entities:[
{type:ENTITY_TYPE.BOSS,id:'boss_god_team',bossId:'divine_vanguard',traits:['enrage'],name:'天神队先锋',x:13,y:3,sprite:'⚡',color:'#ffaa22',hp:350,atk:40,def:18,spd:16,rewards:{exp:350,gold:250,rewardPoints:500},lore:'天神队——最强的轮回者队伍。他们的先锋拥有超越想象的战力。'},
{type:ENTITY_TYPE.ENEMY,id:'mordor_troll',name:'魔多巨魔',x:4,y:10,sprite:'👹',color:'#775533',hp:180,atk:40,def:24,spd:6,rewards:{exp:110,gold:75}},
{type:ENTITY_TYPE.ITEM,id:'medkit_ch10_6',name:'生命之水',x:17,y:13,sprite:'♥',color:'#44ffaa',itemType:'consumable',effect:{heal:160}},
{type:ENTITY_TYPE.EVENT,id:'ch10_ending',name:'第十章结算',x:13,y:12,sprite:'✦',color:'#ffdd88',event:{type:'chapter_end',lines:[{text:'天神队暂时撤退了。但所有人都知道——这只是开始。',speaker:'旁白'},{text:'中洲队全员归队。但最终的战争，还在前方。',speaker:'郑吒'},{text:'第十关「五队大战」通关。获得基础奖励1000点。',speaker:'主神'}],flag:'ch10_complete',rewards:{rewardPoints:1000}}},
{type:ENTITY_TYPE.ITEM,id:'crt_ch10',name:'神射之眼',x:4,y:1,sprite:'◆',color:'#ffcc44',itemType:'stat_boost',effect:{crt:5}}]};}

export function generateChapter10() {
  const floors = [f10_1(), f10_2(), f10_3(), f10_4(), f10_5(), f10_6()];
  const _msgs = ["生化世界的样本获取成功。但代价不小。","三人的复活改变了队伍的力量对比。","魔戒会议上的决策将影响一切。","五支轮回队的接触让气氛紧张到了极点。","魔多的战场上，最终的对决即将到来。"];
  for (let i = 0; i < Math.min(floors.length - 1, _msgs.length); i++) {
    if (!floors[i].onClear) floors[i].onClear = { message: _msgs[i] };
  }
  return { name: '第十章 · 五队大战', world: '魔戒', floors };
}
