import { TILE, ENTITY_TYPE } from './constants.js';
const W = 21, H = 17;
function makeGrid(fill = TILE.WALL) { return Array.from({ length: H }, () => Array(W).fill(fill)); }
function carveRoom(g, x1, y1, x2, y2) { for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) if (y>=0&&y<H&&x>=0&&x<W) g[y][x] = TILE.FLOOR; }
function carveCorridor(g, x1, y1, x2, y2) { let cx=x1,cy=y1; while(cx!==x2){g[cy][cx]=TILE.FLOOR;cx+=cx<x2?1:-1;} while(cy!==y2){g[cy][cx]=TILE.FLOOR;cy+=cy<y2?1:-1;} g[cy][cx]=TILE.FLOOR; }

function f8_1(){const g=makeGrid();carveRoom(g,1,7,6,10);carveCorridor(g,6,8,10,8);carveRoom(g,10,5,16,11);carveCorridor(g,16,8,19,8);carveRoom(g,16,6,19,10);carveRoom(g,3,1,8,5);carveCorridor(g,5,5,5,7);carveRoom(g,10,13,16,16);carveCorridor(g,13,11,13,13);g[15][15]=TILE.STAIRS;return{id:'8-1',name:'返回陵墓',subtitle:'郑吒独自回到了哈姆纳塔。复活真经的光芒指引着方向。',bgColor:'#0a0c06',theme:'jungle',tiles:g,width:W,height:H,playerStart:{x:3,y:8},entities:[
{type:ENTITY_TYPE.EVENT,id:'ch8_intro',name:'独自归来',x:4,y:8,sprite:'✦',color:'#ffffff',event:{type:'dialogue',lines:[{text:'一个人。郑吒独自回到了哈姆纳塔的废墟。',speaker:'旁白'},{text:'复活真经在手中微微发光。第一个要复活的人——楚轩。',speaker:'旁白'},{text:'（复活仪式开始。消耗500奖励点复活一名队友。）',speaker:'主神'}]}},
{type:ENTITY_TYPE.ENEMY,id:'tomb_guard_1',name:'陵墓守卫',x:13,y:8,sprite:'🧟',color:'#886633',hp:70,atk:22,def:10,spd:6,weaknesses:['fire'],rewards:{exp:50,gold:35}},
{type:ENTITY_TYPE.ITEM,id:'medkit_ch8_1',name:'急救包',x:14,y:14,sprite:'♥',color:'#ff4488',itemType:'consumable',effect:{heal:80}},
{type:ENTITY_TYPE.ITEM,id:'atk_ch8',name:'力量结晶',x:18,y:7,sprite:'◆',color:'#ff8844',itemType:'stat_boost',effect:{atk:5}},
]};}

function f8_2(){const g=makeGrid();carveRoom(g,1,1,7,6);carveCorridor(g,7,3,10,3);carveRoom(g,10,1,16,6);carveCorridor(g,13,6,13,9);carveRoom(g,10,9,16,13);carveRoom(g,1,9,7,13);carveCorridor(g,4,6,4,9);carveCorridor(g,7,11,10,11);carveRoom(g,16,10,19,15);carveCorridor(g,16,12,16,12);g[14][18]=TILE.STAIRS;return{id:'8-2',name:'复活楚轩',subtitle:'复活仪式完成。楚轩睁开了眼睛。',bgColor:'#0a0c06',theme:'jungle',tiles:g,width:W,height:H,playerStart:{x:4,y:3},entities:[
{type:ENTITY_TYPE.EVENT,id:'revive_chuxuan',name:'楚轩复活',x:13,y:3,sprite:'✦',color:'#ffdd44',event:{type:'dialogue',lines:[{text:'金色光芒笼罩了祭坛。楚轩的身影逐渐凝实。',speaker:'旁白'},{text:'……郑吒？发生了什么？',speaker:'楚轩'},{text:'你死了。我把你复活了。现在，我需要你的帮助。',speaker:'郑吒'},{text:'（楚轩复活成功。队伍核心军师回归。）',speaker:'主神'}],flag:'chuxuan_revived',reviveCompanion:'chuxuan'}},
{type:ENTITY_TYPE.ENEMY,id:'scarab_v2',name:'变异圣甲虫',x:13,y:11,sprite:'🪲',color:'#667744',hp:50,atk:20,def:4,spd:14,rewards:{exp:40,gold:25}},
{type:ENTITY_TYPE.ITEM,id:'medkit_ch8_2',name:'急救包',x:4,y:11,sprite:'♥',color:'#ff4488',itemType:'consumable',effect:{heal:80}},
]};}

function f8_3(){const g=makeGrid();carveRoom(g,1,1,5,5);carveCorridor(g,5,3,9,3);carveRoom(g,9,1,14,5);carveCorridor(g,11,5,11,9);carveRoom(g,8,9,14,13);carveRoom(g,1,8,6,12);carveCorridor(g,4,5,4,8);carveCorridor(g,6,10,8,10);carveRoom(g,15,9,19,14);carveCorridor(g,14,11,15,11);g[13][18]=TILE.STAIRS;return{id:'8-3',name:'侏罗纪降临',subtitle:'楚轩的计划——进入侏罗纪世界，利用主神的规则复活更多队友。',bgColor:'#0a0c06',theme:'jungle',tiles:g,width:W,height:H,playerStart:{x:3,y:3},entities:[
{type:ENTITY_TYPE.ENEMY,id:'raptor_1',name:'迅猛龙',x:11,y:9,sprite:'🦖',color:'#448844',hp:75,atk:26,def:6,spd:16,rewards:{exp:55,gold:40}},
{type:ENTITY_TYPE.ENEMY,id:'raptor_2',name:'迅猛龙',x:4,y:10,sprite:'🦖',color:'#448844',hp:75,atk:26,def:6,spd:16,rewards:{exp:55,gold:40}},
{type:ENTITY_TYPE.ITEM,id:'medkit_ch8_3',name:'急救包',x:17,y:12,sprite:'♥',color:'#ff4488',itemType:'consumable',effect:{heal:80}},
{type:ENTITY_TYPE.ITEM,id:'spd_ch8',name:'速度结晶',x:2,y:9,sprite:'◆',color:'#44ffaa',itemType:'stat_boost',effect:{spd:4}},
]};}

function f8_4(){const g=makeGrid();carveRoom(g,1,6,6,11);carveCorridor(g,6,8,10,8);carveRoom(g,10,4,15,12);carveCorridor(g,15,8,18,8);carveRoom(g,16,5,19,11);carveRoom(g,5,1,10,3);carveCorridor(g,8,3,8,4);carveRoom(g,8,13,14,16);carveCorridor(g,11,12,11,13);g[15][13]=TILE.STAIRS;return{id:'8-4',name:'新人罗甘道',subtitle:'一个叫罗甘道的新人被传送到这个世界。他对一切充满疑惑。',bgColor:'#0a0c06',theme:'jungle',tiles:g,width:W,height:H,playerStart:{x:3,y:8},entities:[
{type:ENTITY_TYPE.EVENT,id:'luogandao_arrival',name:'罗甘道到来',x:8,y:1,sprite:'✦',color:'#88aaff',event:{type:'dialogue',lines:[{text:'一道白光闪过。一个年轻人出现在丛林中，满脸困惑。',speaker:'旁白'},{text:'这……这是什么地方？你们是谁？',speaker:'罗甘道'},{text:'你是主神传送来的新人。跟着我们，别掉队。',speaker:'郑吒'},{text:'（新人罗甘道加入队伍。）',speaker:'主神'}],flag:'luogandao_joined',addCompanion:{id:'luogandao',name:'罗甘道',role:'新人',alive:true}}},{type:ENTITY_TYPE.ENEMY,id:'trex_mini',name:'霸王龙幼崽',x:12,y:8,sprite:'🦕',color:'#665533',hp:100,atk:28,def:10,spd:8,rewards:{exp:65,gold:45}},
{type:ENTITY_TYPE.ENEMY,id:'ptero',name:'翼龙',x:7,y:2,sprite:'🦅',color:'#667766',hp:55,atk:22,def:4,spd:18,rewards:{exp:45,gold:30}},
{type:ENTITY_TYPE.ITEM,id:'medkit_ch8_4',name:'急救包',x:11,y:14,sprite:'♥',color:'#ff4488',itemType:'consumable',effect:{heal:80}},
]};}

function f8_5(){const g=makeGrid();carveRoom(g,6,5,14,12);carveRoom(g,1,7,5,10);carveCorridor(g,5,8,6,8);carveRoom(g,15,7,19,10);carveCorridor(g,14,8,15,8);carveRoom(g,8,1,12,4);carveCorridor(g,10,4,10,5);carveRoom(g,8,13,12,16);carveCorridor(g,10,12,10,13);g[1][11]=TILE.STAIRS;return{id:'8-5',name:'暴龙与撤离',subtitle:'复活仪式完成。但暴龙群正在逼近，必须迅速撤离。',bgColor:'#0a0c06',theme:'jungle',tiles:g,width:W,height:H,playerStart:{x:10,y:15},entities:[
{type:ENTITY_TYPE.EVENT,id:'revive_bawang',name:'复活仪式',x:12,y:3,sprite:'✦',color:'#ffdd44',event:{type:'dialogue',lines:[{text:'又一次复活仪式。霸王和王侠的身影在金光中重现。',speaker:'旁白'},{text:'我……回来了？',speaker:'霸王'},{text:'欢迎回来。我们还有很多人要救。',speaker:'郑吒'},{text:'（霸王、王侠复活成功。）',speaker:'主神'}],flag:'bawang_revived',reviveCompanions:['bawang','wang_xia']}},
{type:ENTITY_TYPE.ENEMY,id:'raptor_alpha',name:'迅猛龙首领',x:12,y:12,sprite:'🦖',color:'#336633',hp:85,atk:28,def:8,spd:15,rewards:{exp:60,gold:45}},
{type:ENTITY_TYPE.ITEM,id:'medkit_ch8_5',name:'急救包',x:9,y:13,sprite:'♥',color:'#ff4488',itemType:'consumable',effect:{heal:90}},
]};}

function f8_6(){const g=makeGrid();carveRoom(g,1,1,6,5);carveCorridor(g,6,3,10,3);carveRoom(g,10,1,16,6);carveCorridor(g,13,6,13,10);carveRoom(g,9,10,16,14);carveRoom(g,1,8,7,13);carveCorridor(g,4,5,4,8);carveCorridor(g,7,12,9,12);carveRoom(g,16,11,19,15);carveCorridor(g,16,13,16,13);g[14][18]=TILE.STAIRS;return{id:'8-6',name:'巨龙血战与负点结算',subtitle:'最终Boss——远古巨龙。郑吒融合龙族细胞的关键一战。',bgColor:'#0a0c06',theme:'jungle',tiles:g,width:W,height:H,playerStart:{x:3,y:3},entities:[
{type:ENTITY_TYPE.BOSS,id:'boss_dragon',name:'远古巨龙',x:11,y:6,sprite:'🐉',color:'#884422',hp:350,atk:35,def:14,spd:8,weaknesses:['ice'],rewards:{exp:300,gold:200,rewardPoints:500},lore:'侏罗纪世界的终极猎食者。击败它可获得龙族细胞。'},
{type:ENTITY_TYPE.ENEMY,id:'dragon_guard',name:'龙族护卫',x:3,y:8,sprite:'🦎',color:'#775533',hp:80,atk:24,def:10,spd:7,rewards:{exp:55,gold:40}},
{type:ENTITY_TYPE.ENEMY,id:'dragon_guard_2',name:'龙族护卫',x:15,y:5,sprite:'🦎',color:'#775533',hp:80,atk:24,def:10,spd:7,rewards:{exp:55,gold:40}},
{type:ENTITY_TYPE.ITEM,id:'medkit_ch8_6',name:'高级急救包',x:6,y:3,sprite:'♥',color:'#ff4488',itemType:'consumable',effect:{heal:120}},
{type:ENTITY_TYPE.EVENT,id:'luogandao_death',name:'罗甘道抹杀',x:13,y:12,sprite:'†',color:'#ff0000',event:{type:'fixed_death',lines:[{text:'结算开始。罗甘道的奖励点为负数。',speaker:'旁白'},{text:'等等……什么意思？负数？我不想——',speaker:'罗甘道'},{text:'罗甘道的身体开始消散。主神的规则不可违抗。',speaker:'旁白'},{text:'（罗甘道因负奖励点被主神抹杀。）',speaker:'主神'}],flag:'luogandao_erased',companionDeath:'luogandao'}},{type:ENTITY_TYPE.EVENT,id:'ch8_ending',name:'第八章结算',x:10,y:2,sprite:'✦',color:'#ffdd88',event:{type:'chapter_end',lines:[{text:'巨龙倒下了。郑吒的身体中融入了龙族细胞——一种前所未有的力量。',speaker:'旁白'},{text:'楚轩、霸王、王侠——三人已经复活。但还有更多人等着我们。',speaker:'郑吒'},{text:'第八关「重建中洲」通关。获得基础奖励1000点。',speaker:'主神'}],flag:'ch8_complete',rewards:{rewardPoints:1000}}},
]};}

export function generateChapter8(){return{name:'第8章 · 重建中洲',world:'侏罗纪公园',floors:[
f8_1(),f8_2(),f8_3(),f8_4(),f8_5(),f8_6(),
]}};
