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
]};}

// ═══ 10-2 三人复活 ═══
function f10_2(){const g=makeGrid();carveRoom(g,1,1,7,6);carveCorridor(g,7,3,10,3);carveRoom(g,10,1,16,6);carveCorridor(g,13,6,13,9);carveRoom(g,10,9,16,13);carveRoom(g,1,9,7,13);carveCorridor(g,4,6,4,9);carveCorridor(g,7,11,10,11);carveRoom(g,16,10,19,15);carveCorridor(g,16,12,16,12);g[14][18]=TILE.STAIRS;return{id:'10-2',name:'三人复活',subtitle:'赵樱空、张恒、程啸——三道金光同时亮起。',bgColor:'#0a0a08',theme:'biolab',tiles:g,width:W,height:H,playerStart:{x:4,y:3},entities:[
{type:ENTITY_TYPE.EVENT,id:'revive_three',name:'三人复活仪式',x:13,y:3,sprite:'✦',color:'#ffdd44',event:{type:'dialogue',lines:[{text:'三道金光同时照亮了祭坛。赵樱空、张恒、程啸的身影逐渐凝实。',speaker:'旁白'},{text:'……我又做了一个很长的梦。',speaker:'赵樱空'},{text:'欢迎回来。你们三个。',speaker:'郑吒'},{text:'（赵樱空、张恒、程啸复活成功。中洲队全员归队。）',speaker:'主神'}],flag:'three_revived',reviveCompanions:['zhao_yingkong','zhang_heng','cheng_xiao']}},
{type:ENTITY_TYPE.ENEMY,id:'bio_guard_2',name:'生化守卫',x:13,y:11,sprite:'🧟',color:'#668844',hp:110,atk:36,def:14,spd:11,rewards:{exp:85,gold:58}},
{type:ENTITY_TYPE.ITEM,id:'medkit_ch10_2',name:'急救包',x:4,y:11,sprite:'♥',color:'#ff4488',itemType:'consumable',effect:{heal:120}},
]};}

// ═══ 10-3 魔戒会议 ═══
function f10_3(){const g=makeGrid();carveRoom(g,1,1,5,5);carveCorridor(g,5,3,9,3);carveRoom(g,9,1,14,5);carveCorridor(g,11,5,11,9);carveRoom(g,8,9,14,13);carveRoom(g,1,8,6,12);carveCorridor(g,4,5,4,8);carveCorridor(g,6,10,8,10);carveRoom(g,15,9,19,14);carveCorridor(g,14,11,15,11);g[13][18]=TILE.STAIRS;return{id:'10-3',name:'魔戒会议',subtitle:'瑞文戴尔。楚轩已经开始分析五队的战力布局。',bgColor:'#0a0c10',theme:'fantasy',tiles:g,width:W,height:H,playerStart:{x:3,y:3},entities:[
{type:ENTITY_TYPE.EVENT,id:'lotr_briefing',name:'战力分析',x:11,y:3,sprite:'📋',color:'#88aaff',event:{type:'dialogue',lines:[{text:'五支轮回者队伍同时进入魔戒世界。',speaker:'旁白'},{text:'天神队是最大的威胁。他们的实力远超其他队伍。',speaker:'楚轩'},{text:'我们需要联盟。至少在面对魔多之前。',speaker:'郑吒'}],flag:'lotr_briefing'}},
{type:ENTITY_TYPE.ENEMY,id:'orc_scout',name:'兽人斥候',x:4,y:10,sprite:'👹',color:'#886644',hp:100,atk:34,def:12,spd:12,rewards:{exp:80,gold:52}},
{type:ENTITY_TYPE.ENEMY,id:'orc_warrior',name:'兽人战士',x:17,y:12,sprite:'👹',color:'#886644',hp:115,atk:36,def:14,spd:10,rewards:{exp:88,gold:58}},
{type:ENTITY_TYPE.ITEM,id:'def_ch10',name:'秘银护甲片',x:2,y:9,sprite:'◆',color:'#6688ff',itemType:'stat_boost',effect:{def:7}},
]};}

// ═══ 10-4 五队接触 ═══
function f10_4(){const g=makeGrid();carveRoom(g,1,6,6,11);carveCorridor(g,6,8,10,8);carveRoom(g,10,4,15,12);carveCorridor(g,15,8,18,8);carveRoom(g,16,5,19,11);carveRoom(g,5,1,10,3);carveCorridor(g,8,3,8,4);carveRoom(g,8,13,14,16);carveCorridor(g,11,12,11,13);g[15][13]=TILE.STAIRS;return{id:'10-4',name:'五队接触',subtitle:'战场上出现了其他轮回者队伍。有人试图联盟，有人选择背叛。',bgColor:'#0a0c10',theme:'fantasy',tiles:g,width:W,height:H,playerStart:{x:3,y:8},entities:[
{type:ENTITY_TYPE.ENEMY,id:'rival_fighter',name:'敌队战士',x:12,y:8,sprite:'⚔',color:'#cc6622',hp:130,atk:40,def:16,spd:13,rewards:{exp:100,gold:68,rewardPoints:80}},
{type:ENTITY_TYPE.ENEMY,id:'rival_mage',name:'敌队法师',x:8,y:1,sprite:'🔮',color:'#8844aa',hp:95,atk:44,def:10,spd:15,damageType:'dark',rewards:{exp:95,gold:65,rewardPoints:70}},
{type:ENTITY_TYPE.ITEM,id:'medkit_ch10_4',name:'精灵草药',x:11,y:14,sprite:'♥',color:'#44ff88',itemType:'consumable',effect:{heal:130}},
{type:ENTITY_TYPE.ITEM,id:'spd_ch10',name:'精灵轻靴',x:18,y:7,sprite:'◆',color:'#44ffaa',itemType:'stat_boost',effect:{spd:6}},
]};}

// ═══ 10-5 魔多战场 ═══
function f10_5(){const g=makeGrid();carveRoom(g,6,5,14,12);carveRoom(g,1,7,5,10);carveCorridor(g,5,8,6,8);carveRoom(g,15,7,19,10);carveCorridor(g,14,8,15,8);carveRoom(g,8,1,12,4);carveCorridor(g,10,4,10,5);carveRoom(g,8,13,12,16);carveCorridor(g,10,12,10,13);g[1][11]=TILE.STAIRS;return{id:'10-5',name:'魔多战场',subtitle:'黑暗之门打开。魔多军势如潮水般涌来。',bgColor:'#0c0808',theme:'fantasy',tiles:g,width:W,height:H,playerStart:{x:10,y:15},entities:[
{type:ENTITY_TYPE.ENEMY,id:'nazgul',name:'戒灵',x:10,y:8,sprite:'👻',color:'#442266',hp:160,atk:42,def:18,spd:14,damageType:'dark',weaknesses:['spirit'],rewards:{exp:120,gold:80}},
{type:ENTITY_TYPE.ENEMY,id:'uruk_captain',name:'强兽人队长',x:3,y:8,sprite:'👹',color:'#aa4422',hp:140,atk:38,def:20,spd:9,rewards:{exp:105,gold:70}},
{type:ENTITY_TYPE.ITEM,id:'medkit_ch10_5',name:'精灵草药',x:17,y:8,sprite:'♥',color:'#44ff88',itemType:'consumable',effect:{heal:140}},
]};}

// ═══ 10-6 团战结算 ═══
function f10_6(){const g=makeGrid();carveRoom(g,1,1,6,5);carveCorridor(g,6,3,10,3);carveRoom(g,10,1,16,6);carveCorridor(g,13,6,13,10);carveRoom(g,9,10,16,14);carveRoom(g,1,8,7,13);carveCorridor(g,4,5,4,8);carveCorridor(g,7,12,9,12);carveRoom(g,16,11,19,15);carveCorridor(g,16,13,16,13);g[14][18]=TILE.STAIRS;return{id:'10-6',name:'团战结算',subtitle:'天神队的强者现身了。这是最危险的对手。',bgColor:'#0c0808',theme:'fantasy',tiles:g,width:W,height:H,playerStart:{x:3,y:3},entities:[
{type:ENTITY_TYPE.BOSS,id:'boss_god_team',name:'天神队先锋',x:13,y:3,sprite:'⚡',color:'#ffaa22',hp:400,atk:45,def:20,spd:16,rewards:{exp:350,gold:250,rewardPoints:500},lore:'天神队——最强的轮回者队伍。他们的先锋拥有超越想象的战力。'},
{type:ENTITY_TYPE.ENEMY,id:'mordor_troll',name:'魔多巨魔',x:4,y:10,sprite:'👹',color:'#775533',hp:180,atk:40,def:24,spd:6,rewards:{exp:110,gold:75}},
{type:ENTITY_TYPE.ITEM,id:'medkit_ch10_6',name:'生命之水',x:17,y:13,sprite:'♥',color:'#44ffaa',itemType:'consumable',effect:{heal:160}},
{type:ENTITY_TYPE.EVENT,id:'ch10_ending',name:'第十章结算',x:13,y:12,sprite:'✦',color:'#ffdd88',event:{type:'chapter_end',lines:[{text:'天神队暂时撤退了。但所有人都知道——这只是开始。',speaker:'旁白'},{text:'中洲队全员归队。但最终的战争，还在前方。',speaker:'郑吒'},{text:'第十关「五队大战」通关。获得基础奖励1000点。',speaker:'主神'}],flag:'ch10_complete',rewards:{rewardPoints:1000}}},
]};}

export function generateChapter10(){return{name:'第十章 · 五队大战',world:'魔戒',floors:[f10_1(),f10_2(),f10_3(),f10_4(),f10_5(),f10_6()]};}
