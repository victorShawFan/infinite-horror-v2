import { TILE, ENTITY_TYPE } from './constants.js';
const W = 21, H = 17;
function makeGrid(fill = TILE.WALL) { return Array.from({ length: H }, () => Array(W).fill(fill)); }
function carveRoom(g, x1, y1, x2, y2) { for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) if (y>=0&&y<H&&x>=0&&x<W) g[y][x] = TILE.FLOOR; }
function carveCorridor(g, x1, y1, x2, y2) { let cx=x1,cy=y1; while(cx!==x2){g[cy][cx]=TILE.FLOOR;cx+=cx<x2?1:-1;} while(cy!==y2){g[cy][cx]=TILE.FLOOR;cy+=cy<y2?1:-1;} g[cy][cx]=TILE.FLOOR; }

// ═══ 12-1 最终规则公布 ═══
function f12_1(){const g=makeGrid();carveRoom(g,1,7,6,10);carveCorridor(g,6,8,10,8);carveRoom(g,10,5,16,11);carveCorridor(g,16,8,19,8);carveRoom(g,16,6,19,10);carveRoom(g,3,1,8,5);carveCorridor(g,5,5,5,7);carveRoom(g,10,13,16,16);carveCorridor(g,13,11,13,13);g[15][15]=TILE.STAIRS;return{id:'12-1',name:'最终规则公布',subtitle:'主神公布了最终一战的规则。只有一支队伍能活着离开。',bgColor:'#100808',theme:'biolab',tiles:g,width:W,height:H,playerStart:{x:3,y:8},entities:[
{type:ENTITY_TYPE.EVENT,id:'ch12_intro',name:'最终规则',x:4,y:8,sprite:'✦',color:'#ff4444',event:{type:'dialogue',lines:[{text:'（最终轮回任务公布。生化危机世界——最终一战。）',speaker:'主神'},{text:'只有一支队伍能活着离开这个世界。其余所有人——都会死。',speaker:'主神'},{text:'楚轩早就预料到了这一刻。所有的准备，都是为了今天。',speaker:'旁白'},{text:'各位……最后一战了。',speaker:'郑吒'}],flag:'final_rules'}},
{type:ENTITY_TYPE.ENEMY,id:'bio_elite_1',name:'生化精锐',x:13,y:8,sprite:'🧟',color:'#886644',hp:150,atk:44,def:20,spd:12,rewards:{exp:120,gold:80}},
{type:ENTITY_TYPE.ITEM,id:'medkit_ch12_1',name:'超级急救包',x:14,y:14,sprite:'♥',color:'#ff4488',itemType:'consumable',effect:{heal:160}},
{type:ENTITY_TYPE.ITEM,id:'atk_ch12',name:'洪荒之力结晶',x:18,y:7,sprite:'◆',color:'#ff4422',itemType:'stat_boost',effect:{atk:10}},
]};}

// ═══ 12-2 楚轩分队布局 ═══
function f12_2(){const g=makeGrid();carveRoom(g,1,1,7,6);carveCorridor(g,7,3,10,3);carveRoom(g,10,1,16,6);carveCorridor(g,13,6,13,9);carveRoom(g,10,9,16,13);carveRoom(g,1,9,7,13);carveCorridor(g,4,6,4,9);carveCorridor(g,7,11,10,11);carveRoom(g,16,10,19,15);carveCorridor(g,16,12,16,12);g[14][18]=TILE.STAIRS;return{id:'12-2',name:'楚轩分队布局',subtitle:'楚轩的最后一个计划。把所有人分配到最合适的位置。',bgColor:'#100808',theme:'biolab',tiles:g,width:W,height:H,playerStart:{x:4,y:3},entities:[
{type:ENTITY_TYPE.EVENT,id:'chuxuan_plan',name:'楚轩的布局',x:13,y:3,sprite:'📋',color:'#88aaff',event:{type:'dialogue',lines:[{text:'楚轩在全息地图上标出了每个人的位置。',speaker:'旁白'},{text:'零点负责高点狙击。霸王和王侠守住西线。赵樱空随郑吒行动。',speaker:'楚轩'},{text:'如果我的计算没错——我们的胜率是……不，没有胜率。',speaker:'楚轩'},{text:'那就创造一个。',speaker:'郑吒'}],flag:'final_plan'}},
{type:ENTITY_TYPE.ENEMY,id:'bio_elite_2',name:'生化精锐',x:13,y:11,sprite:'🧟',color:'#886644',hp:145,atk:42,def:18,spd:13,rewards:{exp:115,gold:78}},
{type:ENTITY_TYPE.ENEMY,id:'copy_soldier',name:'恶魔队战兵',x:4,y:11,sprite:'⚔',color:'#cc2222',hp:130,atk:40,def:16,spd:14,rewards:{exp:105,gold:72}},
{type:ENTITY_TYPE.ITEM,id:'medkit_ch12_2',name:'超级急救包',x:18,y:13,sprite:'♥',color:'#ff4488',itemType:'consumable',effect:{heal:160}},
]};}

// ═══ 12-3 亚当补全战线 ═══
function f12_3(){const g=makeGrid();carveRoom(g,1,1,5,5);carveCorridor(g,5,3,9,3);carveRoom(g,9,1,14,5);carveCorridor(g,11,5,11,9);carveRoom(g,8,9,14,13);carveRoom(g,1,8,6,12);carveCorridor(g,4,5,4,8);carveCorridor(g,6,10,8,10);carveRoom(g,15,9,19,14);carveCorridor(g,14,11,15,11);g[13][18]=TILE.STAIRS;return{id:'12-3',name:'亚当补全战线',subtitle:'亚当——主神系统的终极创造物。它开始行动了。',bgColor:'#140808',theme:'biolab',tiles:g,width:W,height:H,playerStart:{x:3,y:3},entities:[
{type:ENTITY_TYPE.BOSS,id:'boss_adam',name:'亚当',x:11,y:9,sprite:'☠',color:'#cc0000',hp:450,atk:48,def:22,spd:14,rewards:{exp:400,gold:300,rewardPoints:500},lore:'主神的终极创造物。拥有无法计算的战斗力。'},
{type:ENTITY_TYPE.ENEMY,id:'adam_spawn',name:'亚当触手',x:4,y:10,sprite:'🦑',color:'#aa2222',hp:100,atk:38,def:10,spd:16,rewards:{exp:80,gold:55}},
{type:ENTITY_TYPE.ITEM,id:'medkit_ch12_3',name:'生命之泉',x:17,y:12,sprite:'♥',color:'#44ffaa',itemType:'consumable',effect:{heal:180}},
{type:ENTITY_TYPE.ITEM,id:'def_ch12',name:'最终防御结晶',x:2,y:9,sprite:'◆',color:'#4444ff',itemType:'stat_boost',effect:{def:10}},
]};}

// ═══ 12-4 队员接力牺牲 ═══
function f12_4(){const g=makeGrid();carveRoom(g,1,6,6,11);carveCorridor(g,6,8,10,8);carveRoom(g,10,4,15,12);carveCorridor(g,15,8,18,8);carveRoom(g,16,5,19,11);carveRoom(g,5,1,10,3);carveCorridor(g,8,3,8,4);carveRoom(g,8,13,14,16);carveCorridor(g,11,12,11,13);g[15][13]=TILE.STAIRS;return{id:'12-4',name:'队员接力牺牲',subtitle:'一个接一个。他们为了最终的胜利，选择了牺牲。',bgColor:'#140808',theme:'biolab',tiles:g,width:W,height:H,playerStart:{x:3,y:8},entities:[
{type:ENTITY_TYPE.EVENT,id:'sacrifice_wave',name:'牺牲连锁',x:12,y:8,sprite:'†',color:'#ff0000',event:{type:'dialogue',lines:[{text:'楚轩倒下了。他的计划在最后一刻完成——用自己的死换来了关键情报。',speaker:'旁白'},{text:'零点的狙击枪响了最后一次。他用身体挡住了致命一击。',speaker:'旁白'},{text:'霸王、王侠、詹岚、齐腾一、萧宏律、铭烟薇——一个接一个倒下。',speaker:'旁白'},{text:'（大量队友在最终战中牺牲。这是无法改变的命运。）',speaker:'主神'}],flag:'mass_sacrifice',companionDeaths:['chuxuan','lingdian','bawang','wang_xia','zhan_lan','qi_tengyi','xiao_honglv','ming_yanwei']}},
{type:ENTITY_TYPE.ENEMY,id:'copy_chuxuan',name:'复制体楚轩',x:8,y:1,sprite:'楚',color:'#cc2222',hp:200,atk:46,def:18,spd:16,rewards:{exp:150,gold:100}},
{type:ENTITY_TYPE.ITEM,id:'medkit_ch12_4',name:'最终急救包',x:11,y:14,sprite:'♥',color:'#ff4488',itemType:'consumable',effect:{heal:200}},
]};}

// ═══ 12-5 郑吒对复制体 ═══
function f12_5(){const g=makeGrid();carveRoom(g,6,5,14,12);carveRoom(g,1,7,5,10);carveCorridor(g,5,8,6,8);carveRoom(g,15,7,19,10);carveCorridor(g,14,8,15,8);carveRoom(g,8,1,12,4);carveCorridor(g,10,4,10,5);carveRoom(g,8,13,12,16);carveCorridor(g,10,12,10,13);g[1][11]=TILE.STAIRS;return{id:'12-5',name:'郑吒对复制体',subtitle:'只剩下郑吒一个人了。面对最强的敌人——另一个自己。',bgColor:'#180808',theme:'biolab',tiles:g,width:W,height:H,playerStart:{x:10,y:15},entities:[
{type:ENTITY_TYPE.EVENT,id:'yingkong_light',name:'赵樱空的心灵之光',x:10,y:14,sprite:'💫',color:'#ffdd88',event:{type:'dialogue',lines:[{text:'赵樱空倒在郑吒身边。她的副人格在最后一刻觉醒。',speaker:'旁白'},{text:'心灵之光——把我所有的感情都给你。',speaker:'赵樱空'},{text:'一道光芒注入郑吒体内。他的力量发生了质变。',speaker:'旁白'},{text:'（赵樱空的心灵之光使郑吒进阶。赵樱空、张恒、程啸阵亡。）',speaker:'主神'}],flag:'spirit_light',companionDeaths:['zhao_yingkong','zhang_heng','cheng_xiao']}},
{type:ENTITY_TYPE.BOSS,id:'boss_copy_final',name:'复制体郑吒·终极',x:10,y:5,sprite:'郑',color:'#ff0000',hp:500,atk:52,def:24,spd:18,rewards:{exp:500,gold:400,rewardPoints:800},lore:'你的完美复制体。拥有你所有的能力，以及你所缺少的冷酷。这是最终的决斗。'},
{type:ENTITY_TYPE.ITEM,id:'medkit_ch12_5',name:'最终生命之泉',x:17,y:8,sprite:'♥',color:'#44ffaa',itemType:'consumable',effect:{heal:250}},
]};}

// ═══ 12-6 三人存活与结局 ═══
function f12_6(){const g=makeGrid();carveRoom(g,1,1,6,5);carveCorridor(g,6,3,10,3);carveRoom(g,10,1,16,6);carveCorridor(g,13,6,13,10);carveRoom(g,9,10,16,14);carveRoom(g,1,8,7,13);carveCorridor(g,4,5,4,8);carveCorridor(g,7,12,9,12);carveRoom(g,16,11,19,15);carveCorridor(g,16,13,16,13);g[14][18]=TILE.STAIRS;return{id:'12-6',name:'三人存活与结局',subtitle:'战斗结束了。在这场轮回中，只有三个人活着走了出来。',bgColor:'#080808',theme:'biolab',tiles:g,width:W,height:H,playerStart:{x:3,y:3},entities:[
{type:ENTITY_TYPE.EVENT,id:'final_survivors',name:'最终幸存者',x:13,y:3,sprite:'✦',color:'#ffdd44',event:{type:'dialogue',lines:[{text:'复制体郑吒倒下了。战斗终于结束。',speaker:'旁白'},{text:'郑吒环顾四周。满地都是曾经的战友。',speaker:'旁白'},{text:'只有三个人站着——郑吒、刘郁、林俊天。',speaker:'旁白'},{text:'活着的人……要替死去的人好好活下去。',speaker:'郑吒'}],flag:'survivors_confirmed'}},
{type:ENTITY_TYPE.ENEMY,id:'final_remnant',name:'最终残敌',x:4,y:10,sprite:'🧟',color:'#664433',hp:120,atk:36,def:14,spd:10,rewards:{exp:80,gold:55}},
{type:ENTITY_TYPE.ITEM,id:'medkit_ch12_6',name:'最终急救包',x:17,y:13,sprite:'♥',color:'#ff4488',itemType:'consumable',effect:{heal:200}},
{type:ENTITY_TYPE.EVENT,id:'ch12_ending',name:'最终章结算',x:13,y:12,sprite:'✦',color:'#ffdd88',event:{type:'chapter_end',lines:[{text:'白光笼罩了一切。主神的声音最后一次响起。',speaker:'旁白'},{text:'恭喜通关。最终轮回任务完成。',speaker:'主神'},{text:'郑吒、刘郁、林俊天——三人被传送回了现实世界。',speaker:'旁白'},{text:'无限恐怖·中洲轮回 —— 全篇完。',speaker:'旁白'}],flag:'game_complete',rewards:{rewardPoints:2000}}},
]};}

export function generateChapter12(){return{name:'第十二章 · 生化终战',world:'生化危机三·最终一战',floors:[f12_1(),f12_2(),f12_3(),f12_4(),f12_5(),f12_6()]};}
