import { TILE, ENTITY_TYPE } from './constants.js';
const W = 21, H = 17;
function makeGrid(fill = TILE.WALL) { return Array.from({ length: H }, () => Array(W).fill(fill)); }
function carveRoom(g, x1, y1, x2, y2) { for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) if (y>=0&&y<H&&x>=0&&x<W) g[y][x] = TILE.FLOOR; }
function carveCorridor(g, x1, y1, x2, y2) { let cx=x1,cy=y1; while(cx!==x2){g[cy][cx]=TILE.FLOOR;cx+=cx<x2?1:-1;} while(cy!==y2){g[cy][cx]=TILE.FLOOR;cy+=cy<y2?1:-1;} g[cy][cx]=TILE.FLOOR; }

function f9_1(){const g=makeGrid();carveRoom(g,1,7,6,10);carveCorridor(g,6,8,10,8);carveRoom(g,10,5,16,11);carveCorridor(g,16,8,19,8);carveRoom(g,16,6,19,10);carveRoom(g,3,1,8,5);carveCorridor(g,5,5,5,7);carveRoom(g,10,13,16,16);carveCorridor(g,13,11,13,13);g[15][15]=TILE.STAIRS;return{id:'9-1',name:'陵墓复活仪式',subtitle:'回到哈姆纳塔，复活零点和詹岚。',bgColor:'#060810',theme:'scifi_base',tiles:g,width:W,height:H,playerStart:{x:3,y:8},entities:[
{type:ENTITY_TYPE.EVENT,id:'ch9_intro',name:'章节开始',x:4,y:8,sprite:'✦',color:'#ffffff',event:{type:'dialogue',lines:[{text:'新的世界展开在眼前。战斗还在继续。',speaker:'旁白'},{text:'为了活着的人——也为了已经离开的人。前进。',speaker:'郑吒'}]}},
{type:ENTITY_TYPE.ENEMY,id:'e9_1a',name:'先锋敌',x:13,y:8,sprite:'⚔',color:'#886644',hp:105,atk:38,def:15,spd:17,rewards:{exp:85,gold:57}},
{type:ENTITY_TYPE.ITEM,id:'med_9_1',name:'急救包',x:14,y:14,sprite:'♥',color:'#ff4488',itemType:'consumable',effect:{heal:115}},
{type:ENTITY_TYPE.ITEM,id:'stat_9_1',name:'属性结晶',x:18,y:7,sprite:'◆',color:'#ffcc44',itemType:'stat_boost',effect:{atk:6}},
]};}

function f9_2(){const g=makeGrid();carveRoom(g,1,1,7,6);carveCorridor(g,7,3,10,3);carveRoom(g,10,1,16,6);carveCorridor(g,13,6,13,9);carveRoom(g,10,9,16,13);carveRoom(g,1,9,7,13);carveCorridor(g,4,6,4,9);carveCorridor(g,7,11,10,11);carveRoom(g,16,10,19,15);carveCorridor(g,16,12,16,12);g[14][18]=TILE.STAIRS;return{id:'9-2',name:'主神十日整备',subtitle:'利用整备期强化队伍。',bgColor:'#060810',theme:'scifi_base',tiles:g,width:W,height:H,playerStart:{x:4,y:3},entities:[
{type:ENTITY_TYPE.ENEMY,id:'e9_2a',name:'精锐敌',x:13,y:11,sprite:'⚔',color:'#886644',hp:110,atk:40,def:16,spd:18,rewards:{exp:90,gold:59}},
{type:ENTITY_TYPE.ITEM,id:'med_9_2',name:'急救包',x:4,y:14,sprite:'♥',color:'#ff4488',itemType:'consumable',effect:{heal:115}},
]};}

function f9_3(){const g=makeGrid();carveRoom(g,1,1,5,5);carveCorridor(g,5,3,9,3);carveRoom(g,9,1,14,5);carveCorridor(g,11,5,11,9);carveRoom(g,8,9,14,13);carveRoom(g,1,8,6,12);carveCorridor(g,4,5,4,8);carveCorridor(g,6,10,8,10);carveRoom(g,15,9,19,14);carveCorridor(g,14,11,15,11);g[13][18]=TILE.STAIRS;return{id:'9-3',name:'军事基地',subtitle:'星河战队世界的军事基地。虫族正在逼近。',bgColor:'#060810',theme:'scifi_base',tiles:g,width:W,height:H,playerStart:{x:3,y:3},entities:[
{type:ENTITY_TYPE.ENEMY,id:'e9_3a',name:'特殊敌',x:11,y:9,sprite:'👤',color:'#884444',hp:115,atk:42,def:17,spd:19,rewards:{exp:95,gold:62}},
{type:ENTITY_TYPE.ENEMY,id:'e9_3b',name:'伏击敌',x:4,y:10,sprite:'🗡',color:'#884444',hp:110,atk:44,def:14,spd:21,rewards:{exp:93,gold:60}},
{type:ENTITY_TYPE.ITEM,id:'med_9_3',name:'急救包',x:14,y:14,sprite:'♥',color:'#ff4488',itemType:'consumable',effect:{heal:115}},
{type:ENTITY_TYPE.ITEM,id:'stat_9_3',name:'属性结晶',x:18,y:7,sprite:'◆',color:'#ffcc44',itemType:'stat_boost',effect:{def:6}},
]};}

function f9_4(){const g=makeGrid();carveRoom(g,1,6,6,11);carveCorridor(g,6,8,10,8);carveRoom(g,10,4,15,12);carveCorridor(g,15,8,18,8);carveRoom(g,16,5,19,11);carveRoom(g,5,1,10,3);carveCorridor(g,8,3,8,4);carveRoom(g,8,13,14,16);carveCorridor(g,11,12,11,13);g[15][13]=TILE.STAIRS;return{id:'9-4',name:'虫潮前线',subtitle:'无尽的虫潮从地平线涌来。',bgColor:'#060810',theme:'scifi_base',tiles:g,width:W,height:H,playerStart:{x:3,y:8},entities:[
{type:ENTITY_TYPE.ENEMY,id:'e9_4a',name:'重装敌',x:12,y:8,sprite:'🛡',color:'#666644',hp:125,atk:40,def:21,spd:15,rewards:{exp:100,gold:65}},
{type:ENTITY_TYPE.ITEM,id:'med_9_4',name:'急救包',x:4,y:1,sprite:'♥',color:'#ff4488',itemType:'consumable',effect:{heal:115}},
]};}

function f9_5(){const g=makeGrid();carveRoom(g,6,5,14,12);carveRoom(g,1,7,5,10);carveCorridor(g,5,8,6,8);carveRoom(g,15,7,19,10);carveCorridor(g,14,8,15,8);carveRoom(g,8,1,12,4);carveCorridor(g,10,4,10,5);carveRoom(g,8,13,12,16);carveCorridor(g,10,12,10,13);g[1][11]=TILE.STAIRS;return{id:'9-5',name:'脑虫定位',subtitle:'赵樱空感应到了脑虫的位置。',bgColor:'#060810',theme:'scifi_base',tiles:g,width:W,height:H,playerStart:{x:10,y:15},entities:[
{type:ENTITY_TYPE.ENEMY,id:'e9_5a',name:'Boss护卫',x:13,y:3,sprite:'⚔',color:'#884422',hp:130,atk:44,def:19,spd:19,rewards:{exp:103,gold:67}},
{type:ENTITY_TYPE.ITEM,id:'med_9_5',name:'急救包',x:14,y:1,sprite:'♥',color:'#ff4488',itemType:'consumable',effect:{heal:115}},
{type:ENTITY_TYPE.ITEM,id:'stat_9_5',name:'属性结晶',x:18,y:7,sprite:'◆',color:'#ffcc44',itemType:'stat_boost',effect:{spd:6}},
]};}

function f9_6(){const g=makeGrid();carveRoom(g,1,1,6,5);carveCorridor(g,6,3,10,3);carveRoom(g,10,1,16,6);carveCorridor(g,13,6,13,10);carveRoom(g,9,10,16,14);carveRoom(g,1,8,7,13);carveCorridor(g,4,5,4,8);carveCorridor(g,7,12,9,12);carveRoom(g,16,11,19,15);carveCorridor(g,16,13,16,13);g[14][18]=TILE.STAIRS;return{id:'9-6',name:'脑虫捕获撤离',subtitle:'捕获脑虫并在虫潮中撤离。',bgColor:'#060810',theme:'scifi_base',tiles:g,width:W,height:H,playerStart:{x:3,y:3},entities:[
{type:ENTITY_TYPE.BOSS,id:'boss_brainbug',name:'脑虫',x:10,y:7,sprite:'🧠',color:'#886644',hp:300,atk:28,def:10,spd:6,damageType:'psychic',weaknesses:['fire','physical'],rewards:{exp:280,gold:180,rewardPoints:450},lore:'虫族指挥中枢。精神攻击极强，但物理防御薄弱。'},
{type:ENTITY_TYPE.ENEMY,id:'e9_6a',name:'Boss护卫',x:3,y:8,sprite:'⚔',color:'#884422',hp:125,atk:42,def:19,spd:17,rewards:{exp:100,gold:65}},
{type:ENTITY_TYPE.ENEMY,id:'e9_6b',name:'Boss护卫',x:17,y:8,sprite:'⚔',color:'#884422',hp:125,atk:42,def:19,spd:17,rewards:{exp:100,gold:65}},
{type:ENTITY_TYPE.ITEM,id:'med_9_6',name:'急救包',x:4,y:1,sprite:'♥',color:'#ff4488',itemType:'consumable',effect:{heal:115}},
{type:ENTITY_TYPE.EVENT,id:'ch9_ending',name:'第9章结算',x:10,y:2,sprite:'✦',color:'#ffdd88',event:{type:'chapter_end',lines:[{text:'又一个世界的战斗结束了。但最终的战争还在前方。',speaker:'旁白'},{text:'第9关「星河远征」通关。获得基础奖励1000点。',speaker:'主神'}],flag:'ch9_complete',rewards:{rewardPoints:1000}}},
]};}

export function generateChapter9(){return{name:'第9章 · 星河远征',world:'星河战队',floors:[
f9_1(),f9_2(),f9_3(),f9_4(),f9_5(),f9_6(),
]}};
