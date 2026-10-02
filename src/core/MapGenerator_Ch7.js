import { TILE, ENTITY_TYPE } from './constants.js';
const W = 21, H = 17;
function makeGrid(fill = TILE.WALL) { return Array.from({ length: H }, () => Array(W).fill(fill)); }
function carveRoom(g, x1, y1, x2, y2) { for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) if (y>=0&&y<H&&x>=0&&x<W) g[y][x] = TILE.FLOOR; }
function carveCorridor(g, x1, y1, x2, y2) { let cx=x1,cy=y1; while(cx!==x2){g[cy][cx]=TILE.FLOOR;cx+=cx<x2?1:-1;} while(cy!==y2){g[cy][cx]=TILE.FLOOR;cy+=cy<y2?1:-1;} g[cy][cx]=TILE.FLOOR; }

function f7_1(){const g=makeGrid();carveRoom(g,1,7,6,10);carveCorridor(g,6,8,10,8);carveRoom(g,10,5,16,11);carveCorridor(g,16,8,19,8);carveRoom(g,16,6,19,10);carveRoom(g,3,1,8,5);carveCorridor(g,5,5,5,7);carveRoom(g,10,13,16,16);carveCorridor(g,13,11,13,13);g[15][15]=TILE.STAIRS;return{id:'7-1',name:'浣熊市降临',subtitle:'又是生化危机的世界。但这一次，有比丧尸更可怕的敌人在等待。',bgColor:'#100808',theme:'biolab',tiles:g,width:W,height:H,playerStart:{x:3,y:8},entities:[
{type:ENTITY_TYPE.EVENT,id:'ch7_intro',name:'恶魔世界传送',x:4,y:8,sprite:'✦',color:'#ffffff',event:{type:'dialogue',lines:[{text:'再次回到生化世界。但空气中弥漫着不同寻常的杀意。',speaker:'旁白'},{text:'赵樱空突然抓住了郑吒的手臂。"有人在监视我们。不是丧尸——是人。"',speaker:'旁白'},{text:'恶魔队。他们是我们的"复制体"组成的队伍。',speaker:'楚轩'},{text:'（警告：恶魔队已进入同一世界。他们拥有与中洲队相同的能力。）',speaker:'主神'}]}},
{type:ENTITY_TYPE.ENEMY,id:'zombie_v2_1',name:'T病毒变异体',x:13,y:8,sprite:'🧟',color:'#446644',hp:60,atk:20,def:6,spd:8,rewards:{exp:45,gold:30}},
{type:ENTITY_TYPE.ENEMY,id:'zombie_v2_2',name:'T病毒猎手',x:6,y:3,sprite:'🧟',color:'#557744',hp:70,atk:22,def:8,spd:7,rewards:{exp:50,gold:35}},
{type:ENTITY_TYPE.ITEM,id:'medkit_ch7_1',name:'急救包',x:14,y:14,sprite:'♥',color:'#ff4488',itemType:'consumable',effect:{heal:70}},
{type:ENTITY_TYPE.ITEM,id:'atk_ch7',name:'力量结晶',x:18,y:7,sprite:'◆',color:'#ff8844',itemType:'stat_boost',effect:{atk:4}},
]};}

function f7_2(){const g=makeGrid();carveRoom(g,1,1,7,6);carveCorridor(g,7,3,10,3);carveRoom(g,10,1,16,6);carveCorridor(g,13,6,13,9);carveRoom(g,10,9,16,13);carveRoom(g,1,9,7,13);carveCorridor(g,4,6,4,9);carveCorridor(g,7,11,10,11);carveRoom(g,16,10,19,15);carveCorridor(g,16,12,16,12);g[14][18]=TILE.STAIRS;return{id:'7-2',name:'保护剧情人物',subtitle:'在生化世界中，必须按照电影剧情保护关键角色。',bgColor:'#0e0806',theme:'biolab',tiles:g,width:W,height:H,playerStart:{x:4,y:3},entities:[
{type:ENTITY_TYPE.ENEMY,id:'licker_1',name:'舔食者',x:13,y:3,sprite:'👅',color:'#884444',hp:65,atk:24,def:5,spd:14,rewards:{exp:50,gold:35}},
{type:ENTITY_TYPE.ENEMY,id:'licker_2',name:'舔食者',x:13,y:11,sprite:'👅',color:'#884444',hp:65,atk:24,def:5,spd:14,rewards:{exp:50,gold:35}},
{type:ENTITY_TYPE.ITEM,id:'medkit_ch7_2',name:'急救包',x:18,y:12,sprite:'♥',color:'#ff4488',itemType:'consumable',effect:{heal:70}},
{type:ENTITY_TYPE.ITEM,id:'def_ch7',name:'防御结晶',x:4,y:11,sprite:'◆',color:'#6688ff',itemType:'stat_boost',effect:{def:4}},
]};}

function f7_3(){const g=makeGrid();carveRoom(g,1,1,5,5);carveCorridor(g,5,3,9,3);carveRoom(g,9,1,14,5);carveCorridor(g,11,5,11,9);carveRoom(g,8,9,14,13);carveRoom(g,1,8,6,12);carveCorridor(g,4,5,4,8);carveCorridor(g,6,10,8,10);carveRoom(g,15,9,19,14);carveCorridor(g,14,11,15,11);g[13][18]=TILE.STAIRS;return{id:'7-3',name:'恶魔队信号',subtitle:'通讯频道上突然出现了一个熟悉又陌生的声音——那是"复制体郑吒"。',bgColor:'#0c0a08',theme:'biolab',tiles:g,width:W,height:H,playerStart:{x:3,y:3},entities:[
{type:ENTITY_TYPE.EVENT,id:'demon_signal',name:'恶魔队信号',x:11,y:3,sprite:'📡',color:'#ff4444',event:{type:'dialogue',lines:[{text:'"你好啊，原版的我。"通讯器里传来与郑吒一模一样的声音。',speaker:'复制体郑吒'},{text:'他们已经锁定了我们的位置！',speaker:'赵樱空'},{text:'所有人准备战斗！不要分散！',speaker:'郑吒'}],flag:'demon_signal_heard'}},
{type:ENTITY_TYPE.ENEMY,id:'demon_scout',name:'恶魔队斥候',x:4,y:10,sprite:'👤',color:'#882222',hp:80,atk:26,def:10,spd:12,rewards:{exp:60,gold:45,rewardPoints:50}},
{type:ENTITY_TYPE.ENEMY,id:'tyrant_v2',name:'暴君改良型',x:17,y:11,sprite:'🧟',color:'#664433',hp:90,atk:25,def:12,spd:6,rewards:{exp:60,gold:40}},
{type:ENTITY_TYPE.ITEM,id:'medkit_ch7_3',name:'急救包',x:2,y:9,sprite:'♥',color:'#ff4488',itemType:'consumable',effect:{heal:80}},
]};}

function f7_4(){const g=makeGrid();carveRoom(g,1,6,6,11);carveCorridor(g,6,8,10,8);carveRoom(g,10,4,15,12);carveCorridor(g,15,8,18,8);carveRoom(g,16,5,19,11);carveRoom(g,5,1,10,3);carveCorridor(g,8,3,8,4);carveRoom(g,8,13,14,16);carveCorridor(g,11,12,11,13);g[15][13]=TILE.STAIRS;return{id:'7-4',name:'分队撤离',subtitle:'楚轩制定了撤退计划。但恶魔队比他预想的更快。',bgColor:'#0a0808',theme:'biolab',tiles:g,width:W,height:H,playerStart:{x:3,y:8},entities:[
{type:ENTITY_TYPE.EVENT,id:'sacrifice_choice',name:'断后抉择',x:6,y:6,sprite:'?',color:'#ffcc44',event:{type:'choice',lines:[{text:'恶魔队正在逼近。必须有人断后掩护撤退。',speaker:'旁白'},{text:'谁去断后，基本就回不来了。',speaker:'楚轩'}],choices:[{id:'self',text:'我来断后。你们先撤。',effect:{atk:5,description:'你的勇气激励了所有人',relationship:{zhan_lan:'save_life',chuxuan:'good_decision'},allRelationship:'protect_weak'}},{id:'together',text:'一起走。要死一起死。',effect:{def:4,hp:30,description:'团队的羁绊化为力量',allRelationship:'honest_talk'}},{id:'plan',text:'楚轩，你有什么计划？',effect:{spd:3,crt:2,description:'楚轩的计划为撤退赢得了时间',relationship:{chuxuan:'good_decision'}}}],flag:'sacrifice_choice_done'}},{type:ENTITY_TYPE.EVENT,id:'retreat_plan',name:'撤退计划',x:4,y:8,sprite:'📋',color:'#88aaff',event:{type:'dialogue',lines:[{text:'楚轩快速分析了局势。"分三组撤离。我断后。"',speaker:'旁白'},{text:'不！我来断后。你们先走。',speaker:'郑吒'}],flag:'retreat_planned'}},
{type:ENTITY_TYPE.ENEMY,id:'demon_warrior',name:'恶魔队战士',x:12,y:8,sprite:'⚔',color:'#aa2222',hp:90,atk:28,def:10,spd:11,rewards:{exp:65,gold:50,rewardPoints:60}},
{type:ENTITY_TYPE.ENEMY,id:'demon_mage',name:'恶魔队法师',x:8,y:1,sprite:'🔮',color:'#882288',hp:70,atk:30,def:6,spd:13,damageType:'dark',rewards:{exp:60,gold:45,rewardPoints:50}},
{type:ENTITY_TYPE.ITEM,id:'medkit_ch7_4',name:'大型急救包',x:11,y:14,sprite:'♥',color:'#ff4488',itemType:'consumable',effect:{heal:100}},
]};}

function f7_5(){const g=makeGrid();carveRoom(g,6,5,14,12);carveRoom(g,1,7,5,10);carveCorridor(g,5,8,6,8);carveRoom(g,15,7,19,10);carveCorridor(g,14,8,15,8);carveRoom(g,8,1,12,4);carveCorridor(g,10,4,10,5);carveRoom(g,8,13,12,16);carveCorridor(g,10,12,10,13);g[1][11]=TILE.STAIRS;return{id:'7-5',name:'团灭危机',subtitle:'恶魔队发动了总攻。一个接一个，队友们倒下了。',bgColor:'#120606',theme:'biolab',tiles:g,width:W,height:H,playerStart:{x:10,y:15},entities:[
{type:ENTITY_TYPE.EVENT,id:'team_wipe',name:'中洲队团灭',x:10,y:14,sprite:'†',color:'#ff0000',event:{type:'dialogue',lines:[{text:'恶魔队的包围圈越来越紧。队友们一个接一个地倒下。',speaker:'旁白'},{text:'赵樱空被复制体赵樱空击败——张恒被复制体张恒压制——',speaker:'旁白'},{text:'萧宏律、程啸、新人——全部阵亡。',speaker:'旁白'},{text:'只剩下詹岚和郑吒。',speaker:'旁白'}],flag:'team_wiped',killAllCompanions:true}},
{type:ENTITY_TYPE.EVENT,id:'zhanlan_death',name:'詹岚之死',x:10,y:10,sprite:'†',color:'#ff0000',event:{type:'fixed_death',lines:[{text:'詹岚用最后的力量激活了重生十字勋章——绑定在郑吒身上。',speaker:'旁白'},{text:'郑吒……活下去。把大家……都带回来。',speaker:'詹岚'},{text:'（詹岚阵亡。重生十字勋章已激活。）',speaker:'主神'}],flag:'zhanlan_dead'}},
{type:ENTITY_TYPE.ENEMY,id:'demon_elite',name:'恶魔队精锐',x:3,y:8,sprite:'⚔',color:'#cc1111',hp:100,atk:30,def:12,spd:12,rewards:{exp:70,gold:55}},
{type:ENTITY_TYPE.ENEMY,id:'demon_elite_2',name:'恶魔队精锐',x:17,y:8,sprite:'⚔',color:'#cc1111',hp:100,atk:30,def:12,spd:12,rewards:{exp:70,gold:55}},
{type:ENTITY_TYPE.ITEM,id:'medkit_ch7_5',name:'高级急救包',x:8,y:5,sprite:'♥',color:'#ff4488',itemType:'consumable',effect:{heal:120}},
]};}

function f7_6(){const g=makeGrid();carveRoom(g,1,1,6,5);carveCorridor(g,6,3,10,3);carveRoom(g,10,1,16,6);carveCorridor(g,13,6,13,10);carveRoom(g,9,10,16,14);carveRoom(g,1,8,7,13);carveCorridor(g,4,5,4,8);carveCorridor(g,7,12,9,12);carveRoom(g,16,11,19,15);carveCorridor(g,16,13,16,13);g[14][18]=TILE.STAIRS;return{id:'7-6',name:'郑吒复活与誓言',subtitle:'黑暗中，一道金光闪过。重生十字勋章启动了。',bgColor:'#0a0a14',theme:'biolab',tiles:g,width:W,height:H,playerStart:{x:3,y:3},entities:[
{type:ENTITY_TYPE.BOSS,id:'boss_copy_zhengzha',bossId:'clone_zhengzha',traits:['swift','enrage'],name:'复制体郑吒',x:13,y:3,sprite:'郑',color:'#cc2222',hp:250,atk:30,def:14,spd:13,rewards:{exp:250,gold:150,rewardPoints:400},lore:'你的复制体。拥有与你相同的能力，但更加冷酷无情。'},
{type:ENTITY_TYPE.EVENT,id:'resurrection_oath',name:'复活与誓言',x:18,y:13,sprite:'✦',color:'#ffdd44',event:{type:'dialogue',lines:[{text:'郑吒从死亡中苏醒。重生十字勋章碎裂后化为金色光芒。',speaker:'旁白'},{text:'队友们全部阵亡了。但复活真经还在。',speaker:'旁白'},{text:'我发誓——我会把你们全部带回来。每一个人。',speaker:'郑吒'},{text:'（郑吒由重生十字勋章复活。立下了复活所有队友的誓言。）',speaker:'主神'}],flag:'resurrection_oath'}},
{type:ENTITY_TYPE.EVENT,id:'ch7_ending',name:'第七章结算',x:13,y:12,sprite:'✦',color:'#ffdd88',event:{type:'chapter_end',lines:[{text:'复制体郑吒退走了。但战争远未结束。',speaker:'旁白'},{text:'郑吒独自一人站在废墟中。但他的眼中燃烧着前所未有的决意。',speaker:'旁白'},{text:'第七关「恶魔初临」通关。获得基础奖励1000点。',speaker:'主神'}],flag:'ch7_complete',rewards:{rewardPoints:1000}}},
{type:ENTITY_TYPE.ITEM,id:'medkit_ch7_6',name:'高级急救包',x:4,y:11,sprite:'♥',color:'#ff4488',itemType:'consumable',effect:{heal:120}},
]};}

export function generateChapter7(){return{name:'第七章 · 恶魔初临',world:'生化危机二',floors:[f7_1(),f7_2(),f7_3(),f7_4(),f7_5(),f7_6()]};}
