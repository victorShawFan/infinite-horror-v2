import { TILE, ENTITY_TYPE } from './constants.js';
const W = 21, H = 17;
function makeGrid(fill = TILE.WALL) { return Array.from({ length: H }, () => Array(W).fill(fill)); }
function carveRoom(g, x1, y1, x2, y2) { for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) if (y>=0&&y<H&&x>=0&&x<W) g[y][x] = TILE.FLOOR; }
function carveCorridor(g, x1, y1, x2, y2) { let cx=x1,cy=y1; while(cx!==x2){g[cy][cx]=TILE.FLOOR;cx+=cx<x2?1:-1;} while(cy!==y2){g[cy][cx]=TILE.FLOOR;cy+=cy<y2?1:-1;} g[cy][cx]=TILE.FLOOR; }

function f10_1(){const g=makeGrid();carveRoom(g,1,7,6,10);carveCorridor(g,6,8,10,8);carveRoom(g,10,5,16,11);carveCorridor(g,16,8,19,8);carveRoom(g,16,6,19,10);carveRoom(g,3,1,8,5);carveCorridor(g,5,5,5,7);carveRoom(g,10,13,16,16);carveCorridor(g,13,11,13,13);g[15][15]=TILE.STAIRS;return{id:'10-1',name:'偷袭生化取样',subtitle:'回到生化世界获取复活样本。',bgColor:'#0a0806',theme:'fantasy',tiles:g,width:W,height:H,playerStart:{x:3,y:8},entities:[
{type:ENTITY_TYPE.EVENT,id:'ch10_intro',name:'章节开始',x:4,y:8,sprite:'✦',color:'#ffffff',event:{type:'dialogue',lines:[{text:'新的世界展开在眼前。战斗还在继续。',speaker:'旁白'},{text:'为了活着的人——也为了已经离开的人。前进。',speaker:'郑吒'}]}},
{type:ENTITY_TYPE.ENEMY,id:'e10_1a',name:'先锋敌',x:13,y:8,sprite:'⚔',color:'#886644',hp:110,atk:40,def:16,spd:18,rewards:{exp:90,gold:60}},
{type:ENTITY_TYPE.ITEM,id:'med_10_1',name:'急救包',x:14,y:14,sprite:'♥',color:'#ff4488',itemType:'consumable',effect:{heal:120}},
{type:ENTITY_TYPE.ITEM,id:'stat_10_1',name:'属性结晶',x:18,y:7,sprite:'◆',color:'#ffcc44',itemType:'stat_boost',effect:{atk:6}},
]};}

function f10_2(){const g=makeGrid();carveRoom(g,1,1,7,6);carveCorridor(g,7,3,10,3);carveRoom(g,10,1,16,6);carveCorridor(g,13,6,13,9);carveRoom(g,10,9,16,13);carveRoom(g,1,9,7,13);carveCorridor(g,4,6,4,9);carveCorridor(g,7,11,10,11);carveRoom(g,16,10,19,15);carveCorridor(g,16,12,16,12);g[14][18]=TILE.STAIRS;return{id:'10-2',name:'三人复活',subtitle:'复活赵樱空、张恒、程啸。',bgColor:'#0a0806',theme:'fantasy',tiles:g,width:W,height:H,playerStart:{x:4,y:3},entities:[
{type:ENTITY_TYPE.ENEMY,id:'e10_2a',name:'精锐敌',x:13,y:11,sprite:'⚔',color:'#886644',hp:115,atk:42,def:17,spd:19,rewards:{exp:95,gold:62}},
{type:ENTITY_TYPE.ITEM,id:'med_10_2',name:'急救包',x:4,y:14,sprite:'♥',color:'#ff4488',itemType:'consumable',effect:{heal:120}},
]};}

function f10_3(){const g=makeGrid();carveRoom(g,1,1,5,5);carveCorridor(g,5,3,9,3);carveRoom(g,9,1,14,5);carveCorridor(g,11,5,11,9);carveRoom(g,8,9,14,13);carveRoom(g,1,8,6,12);carveCorridor(g,4,5,4,8);carveCorridor(g,6,10,8,10);carveRoom(g,15,9,19,14);carveCorridor(g,14,11,15,11);g[13][18]=TILE.STAIRS;return{id:'10-3',name:'魔戒会议',subtitle:'五支轮回队伍在中土世界相遇。',bgColor:'#0a0806',theme:'fantasy',tiles:g,width:W,height:H,playerStart:{x:3,y:3},entities:[
{type:ENTITY_TYPE.ENEMY,id:'e10_3a',name:'特殊敌',x:11,y:9,sprite:'👤',color:'#884444',hp:120,atk:44,def:18,spd:20,rewards:{exp:100,gold:65}},
{type:ENTITY_TYPE.ENEMY,id:'e10_3b',name:'伏击敌',x:4,y:10,sprite:'🗡',color:'#884444',hp:115,atk:46,def:15,spd:22,rewards:{exp:98,gold:63}},
{type:ENTITY_TYPE.ITEM,id:'med_10_3',name:'急救包',x:14,y:14,sprite:'♥',color:'#ff4488',itemType:'consumable',effect:{heal:120}},
{type:ENTITY_TYPE.ITEM,id:'stat_10_3',name:'属性结晶',x:18,y:7,sprite:'◆',color:'#ffcc44',itemType:'stat_boost',effect:{def:6}},
]};}

function f10_4(){const g=makeGrid();carveRoom(g,1,6,6,11);carveCorridor(g,6,8,10,8);carveRoom(g,10,4,15,12);carveCorridor(g,15,8,18,8);carveRoom(g,16,5,19,11);carveRoom(g,5,1,10,3);carveCorridor(g,8,3,8,4);carveRoom(g,8,13,14,16);carveCorridor(g,11,12,11,13);g[15][13]=TILE.STAIRS;return{id:'10-4',name:'联盟与背叛',subtitle:'临时联盟在利益面前摇摇欲坠。',bgColor:'#0a0806',theme:'fantasy',tiles:g,width:W,height:H,playerStart:{x:3,y:8},entities:[
{type:ENTITY_TYPE.ENEMY,id:'e10_4a',name:'重装敌',x:12,y:8,sprite:'🛡',color:'#666644',hp:130,atk:42,def:22,spd:16,rewards:{exp:105,gold:68}},
{type:ENTITY_TYPE.ITEM,id:'med_10_4',name:'急救包',x:4,y:1,sprite:'♥',color:'#ff4488',itemType:'consumable',effect:{heal:120}},
]};}

function f10_5(){const g=makeGrid();carveRoom(g,6,5,14,12);carveRoom(g,1,7,5,10);carveCorridor(g,5,8,6,8);carveRoom(g,15,7,19,10);carveCorridor(g,14,8,15,8);carveRoom(g,8,1,12,4);carveCorridor(g,10,4,10,5);carveRoom(g,8,13,12,16);carveCorridor(g,10,12,10,13);g[1][11]=TILE.STAIRS;return{id:'10-5',name:'魔多军势',subtitle:'索伦的军队从黑门涌出。',bgColor:'#0a0806',theme:'fantasy',tiles:g,width:W,height:H,playerStart:{x:10,y:15},entities:[
{type:ENTITY_TYPE.ENEMY,id:'e10_5a',name:'Boss护卫',x:13,y:3,sprite:'⚔',color:'#884422',hp:135,atk:46,def:20,spd:20,rewards:{exp:108,gold:70}},
{type:ENTITY_TYPE.ITEM,id:'med_10_5',name:'急救包',x:14,y:1,sprite:'♥',color:'#ff4488',itemType:'consumable',effect:{heal:120}},
{type:ENTITY_TYPE.ITEM,id:'stat_10_5',name:'属性结晶',x:18,y:7,sprite:'◆',color:'#ffcc44',itemType:'stat_boost',effect:{spd:6}},
]};}

function f10_6(){const g=makeGrid();carveRoom(g,1,1,6,5);carveCorridor(g,6,3,10,3);carveRoom(g,10,1,16,6);carveCorridor(g,13,6,13,10);carveRoom(g,9,10,16,14);carveRoom(g,1,8,7,13);carveCorridor(g,4,5,4,8);carveCorridor(g,7,12,9,12);carveRoom(g,16,11,19,15);carveCorridor(g,16,13,16,13);g[14][18]=TILE.STAIRS;return{id:'10-6',name:'团战结算',subtitle:'五队大战的最终结算。',bgColor:'#0a0806',theme:'fantasy',tiles:g,width:W,height:H,playerStart:{x:3,y:3},entities:[
{type:ENTITY_TYPE.BOSS,id:'boss_tianshendui',name:'天神队长',x:10,y:7,sprite:'👑',color:'#ddaa44',hp:400,atk:35,def:16,spd:14,rewards:{exp:350,gold:250,rewardPoints:500},lore:'天神队——实力最强的轮回队伍。他们的队长拥有近乎无敌的力量。'},
{type:ENTITY_TYPE.ENEMY,id:'e10_6a',name:'Boss护卫',x:3,y:8,sprite:'⚔',color:'#884422',hp:130,atk:44,def:20,spd:18,rewards:{exp:105,gold:68}},
{type:ENTITY_TYPE.ENEMY,id:'e10_6b',name:'Boss护卫',x:17,y:8,sprite:'⚔',color:'#884422',hp:130,atk:44,def:20,spd:18,rewards:{exp:105,gold:68}},
{type:ENTITY_TYPE.ITEM,id:'med_10_6',name:'急救包',x:4,y:1,sprite:'♥',color:'#ff4488',itemType:'consumable',effect:{heal:120}},
{type:ENTITY_TYPE.EVENT,id:'ch10_ending',name:'第10章结算',x:10,y:2,sprite:'✦',color:'#ffdd88',event:{type:'chapter_end',lines:[{text:'又一个世界的战斗结束了。但最终的战争还在前方。',speaker:'旁白'},{text:'第10关「五队大战」通关。获得基础奖励1000点。',speaker:'主神'}],flag:'ch10_complete',rewards:{rewardPoints:1000}}},
]};}

export function generateChapter10(){return{name:'第10章 · 五队大战',world:'魔戒',floors:[
f10_1(),f10_2(),f10_3(),f10_4(),f10_5(),f10_6(),
]}};
