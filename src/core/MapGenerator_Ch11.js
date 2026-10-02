import { TILE, ENTITY_TYPE } from './constants.js';
const W = 21, H = 17;
function makeGrid(fill = TILE.WALL) { return Array.from({ length: H }, () => Array(W).fill(fill)); }
function carveRoom(g, x1, y1, x2, y2) { for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) if (y>=0&&y<H&&x>=0&&x<W) g[y][x] = TILE.FLOOR; }
function carveCorridor(g, x1, y1, x2, y2) { let cx=x1,cy=y1; while(cx!==x2){g[cy][cx]=TILE.FLOOR;cx+=cx<x2?1:-1;} while(cy!==y2){g[cy][cx]=TILE.FLOOR;cy+=cy<y2?1:-1;} g[cy][cx]=TILE.FLOOR; }

// ═══ 11-1 变形金刚与罗甘道之死 ═══
function f11_1(){const g=makeGrid();carveRoom(g,1,7,6,10);carveCorridor(g,6,8,10,8);carveRoom(g,10,5,16,11);carveCorridor(g,16,8,19,8);carveRoom(g,16,6,19,10);carveRoom(g,3,1,8,5);carveCorridor(g,5,5,5,7);carveRoom(g,10,13,16,16);carveCorridor(g,13,11,13,13);g[15][15]=TILE.STAIRS;return{id:'11-1',name:'变形金刚与罗甘道之死',subtitle:'机器人的战场。罗甘道独自面对了超出他能力的敌人。',bgColor:'#080a10',theme:'mech',tiles:g,width:W,height:H,playerStart:{x:3,y:8},entities:[
{type:ENTITY_TYPE.ENEMY,id:'mech_drone',name:'机械无人机',x:13,y:8,sprite:'🤖',color:'#668888',hp:130,atk:40,def:18,spd:14,rewards:{exp:100,gold:68}},
{type:ENTITY_TYPE.EVENT,id:'luogandao_final_death',name:'罗甘道之死',x:5,y:3,sprite:'†',color:'#ff0000',event:{type:'fixed_death',lines:[{text:'罗甘道试图保护后撤的队友。但对手太强了。',speaker:'旁白'},{text:'他最后看了一眼郑吒的方向，嘴角带着微笑。',speaker:'旁白'},{text:'又是你啊……原来这就是轮回。',speaker:'罗甘道'},{text:'（罗甘道战死。）',speaker:'主神'}],flag:'luogandao_dead',companionDeath:'luogandao'}},
{type:ENTITY_TYPE.ITEM,id:'medkit_ch11_1',name:'纳米修复剂',x:14,y:14,sprite:'♥',color:'#ff4488',itemType:'consumable',effect:{heal:140}},
{type:ENTITY_TYPE.ITEM,id:'atk_ch11',name:'能量核心',x:18,y:7,sprite:'◆',color:'#ff8844',itemType:'stat_boost',effect:{atk:8}},
]};}

// ═══ 11-2 猛鬼街梦层 ═══
function f11_2(){const g=makeGrid();carveRoom(g,1,1,7,6);carveCorridor(g,7,3,10,3);carveRoom(g,10,1,16,6);carveCorridor(g,13,6,13,9);carveRoom(g,10,9,16,13);carveRoom(g,1,9,7,13);carveCorridor(g,4,6,4,9);carveCorridor(g,7,11,10,11);carveRoom(g,16,10,19,15);carveCorridor(g,16,12,16,12);g[14][18]=TILE.STAIRS;return{id:'11-2',name:'猛鬼街梦层',subtitle:'所有人都陷入了沉睡。在梦中，弗莱迪掌控一切。',bgColor:'#100810',theme:'nightmare',tiles:g,width:W,height:H,playerStart:{x:4,y:3},entities:[
{type:ENTITY_TYPE.ENEMY,id:'nightmare_shade',name:'噩梦幻影',x:13,y:3,sprite:'👻',color:'#884488',hp:100,atk:38,def:8,spd:18,damageType:'psychic',rewards:{exp:90,gold:60}},
{type:ENTITY_TYPE.ENEMY,id:'dream_trap',name:'梦境陷阱',x:4,y:11,sprite:'🕸',color:'#664466',hp:85,atk:35,def:6,spd:16,damageType:'psychic',rewards:{exp:80,gold:55}},
{type:ENTITY_TYPE.ITEM,id:'medkit_ch11_2',name:'精神稳定剂',x:18,y:13,sprite:'♥',color:'#ff4488',itemType:'consumable',effect:{heal:140}},
{type:ENTITY_TYPE.ITEM,id:'def_ch11',name:'心灵屏障',x:13,y:11,sprite:'◆',color:'#8844ff',itemType:'stat_boost',effect:{def:8}},
]};}

// ═══ 11-3 郑吒自杀破心魔 ═══
function f11_3(){const g=makeGrid();carveRoom(g,1,1,5,5);carveCorridor(g,5,3,9,3);carveRoom(g,9,1,14,5);carveCorridor(g,11,5,11,9);carveRoom(g,8,9,14,13);carveRoom(g,1,8,6,12);carveCorridor(g,4,5,4,8);carveCorridor(g,6,10,8,10);carveRoom(g,15,9,19,14);carveCorridor(g,14,11,15,11);g[13][18]=TILE.STAIRS;return{id:'11-3',name:'郑吒自杀破心魔',subtitle:'弗莱迪抓住了郑吒最深的恐惧。唯一的办法——是不再恐惧死亡。',bgColor:'#140810',theme:'nightmare',tiles:g,width:W,height:H,playerStart:{x:3,y:3},entities:[
{type:ENTITY_TYPE.BOSS,id:'boss_freddy',name:'弗莱迪',x:11,y:9,sprite:'🔪',color:'#cc4422',hp:320,atk:44,def:12,spd:18,damageType:'psychic',weaknesses:['fire'],rewards:{exp:300,gold:200,rewardPoints:400},lore:'猛鬼街的主人。在梦境中几乎无敌，但在清醒者面前不堪一击。'},
{type:ENTITY_TYPE.EVENT,id:'heart_demon',name:'心魔对决',x:4,y:10,sprite:'💔',color:'#ff4488',event:{type:'dialogue',lines:[{text:'弗莱迪化作了郑吒自己的模样。那是他最深的恐惧——成为懦夫。',speaker:'旁白'},{text:'你害怕的不是死亡。你害怕的是活着却无法保护任何人。',speaker:'心魔'},{text:'郑吒举起了武器——对准了自己。',speaker:'旁白'},{text:'（郑吒以自杀跨越心魔。这是原著中最关键的转折之一。）',speaker:'主神'}],flag:'heart_demon_defeated'}},
{type:ENTITY_TYPE.ITEM,id:'medkit_ch11_3',name:'高级急救包',x:17,y:12,sprite:'♥',color:'#ff4488',itemType:'consumable',effect:{heal:150}},
]};}

// ═══ 11-4 神鬼复活仪式 ═══
function f11_4(){const g=makeGrid();carveRoom(g,1,6,6,11);carveCorridor(g,6,8,10,8);carveRoom(g,10,4,15,12);carveCorridor(g,15,8,18,8);carveRoom(g,16,5,19,11);carveRoom(g,5,1,10,3);carveCorridor(g,8,3,8,4);carveRoom(g,8,13,14,16);carveCorridor(g,11,12,11,13);g[15][13]=TILE.STAIRS;return{id:'11-4',name:'神鬼复活仪式',subtitle:'回到神鬼世界。这一次要复活的人更多。',bgColor:'#0a0808',theme:'tomb',tiles:g,width:W,height:H,playerStart:{x:3,y:8},entities:[
{type:ENTITY_TYPE.EVENT,id:'mass_revival',name:'大规模复活',x:12,y:8,sprite:'✦',color:'#ffdd44',event:{type:'dialogue',lines:[{text:'复活真经再次启动。这一次，光芒照亮了整个祭坛。',speaker:'旁白'},{text:'萧宏律、齐腾一、铭烟薇——以及新人刘郁和林俊天。',speaker:'旁白'},{text:'（萧宏律、齐腾一、铭烟薇复活。刘郁、林俊天加入。）',speaker:'主神'}],flag:'mass_revival',reviveCompanions:['xiao_honglv','qi_tengyi','ming_yanwei'],addCompanion:{id:'liu_yu',name:'刘郁',role:'新人/生存者',alive:true}}},
{type:ENTITY_TYPE.EVENT,id:'linjuntian_join',name:'林俊天加入',x:8,y:1,sprite:'✦',color:'#88aaff',event:{type:'dialogue',lines:[{text:'一个年轻人从阴影中走出。他的眼神异常冷静。',speaker:'旁白'},{text:'我叫林俊天。主神说我会是最后活着的人之一。',speaker:'林俊天'},{text:'（林俊天加入队伍。）',speaker:'主神'}],flag:'linjuntian_joined',addCompanion:{id:'lin_juntian',name:'林俊天',role:'新人/隐藏实力',alive:true}}},
{type:ENTITY_TYPE.ENEMY,id:'tomb_revenant',name:'陵墓亡灵',x:18,y:8,sprite:'💀',color:'#886633',hp:120,atk:36,def:14,spd:10,rewards:{exp:90,gold:60}},
{type:ENTITY_TYPE.ITEM,id:'medkit_ch11_4',name:'急救包',x:11,y:14,sprite:'♥',color:'#ff4488',itemType:'consumable',effect:{heal:140}},
]};}

// ═══ 11-5 天煞队长再确认 ═══
function f11_5(){const g=makeGrid();carveRoom(g,6,5,14,12);carveRoom(g,1,7,5,10);carveCorridor(g,5,8,6,8);carveRoom(g,15,7,19,10);carveCorridor(g,14,8,15,8);carveRoom(g,8,1,12,4);carveCorridor(g,10,4,10,5);carveRoom(g,8,13,12,16);carveCorridor(g,10,12,10,13);g[1][11]=TILE.STAIRS;return{id:'11-5',name:'天煞队长再确认',subtitle:'天煞世界的引导者再次出现。他要确认——郑吒是否配得上队长之位。',bgColor:'#0a0a10',theme:'spirit',tiles:g,width:W,height:H,playerStart:{x:10,y:15},entities:[
{type:ENTITY_TYPE.EVENT,id:'captain_test',name:'队长资格考验',x:10,y:8,sprite:'✦',color:'#ffaa44',event:{type:'dialogue',lines:[{text:'引导者的声音在空间中回荡。"你已经跨过了心魔。"',speaker:'旁白'},{text:'但真正的考验不是面对恐惧。是在恐惧之后，依然选择站起来。',speaker:'引导者'},{text:'我不是为了自己站起来的。是为了他们。',speaker:'郑吒'},{text:'（队长资格再次确认。郑吒获得额外奖励。）',speaker:'主神'}],flag:'captain_confirmed',rewards:{rewardPoints:200}}},
{type:ENTITY_TYPE.ENEMY,id:'spirit_guardian',name:'试炼守护者',x:3,y:8,sprite:'👁',color:'#8888ff',hp:140,atk:42,def:16,spd:14,rewards:{exp:100,gold:70}},
{type:ENTITY_TYPE.ITEM,id:'crt_ch11',name:'洞察之眼',x:17,y:8,sprite:'◆',color:'#ffcc44',itemType:'stat_boost',effect:{crt:6}},
{type:ENTITY_TYPE.ITEM,id:'medkit_ch11_5',name:'灵泉',x:8,y:2,sprite:'♥',color:'#44ff88',itemType:'consumable',effect:{heal:150}},
]};}

// ═══ 11-6 龙骑士与完美风暴整备 ═══
function f11_6(){const g=makeGrid();carveRoom(g,1,1,6,5);carveCorridor(g,6,3,10,3);carveRoom(g,10,1,16,6);carveCorridor(g,13,6,13,10);carveRoom(g,9,10,16,14);carveRoom(g,1,8,7,13);carveCorridor(g,4,5,4,8);carveCorridor(g,7,12,9,12);carveRoom(g,16,11,19,15);carveCorridor(g,16,13,16,13);g[14][18]=TILE.STAIRS;return{id:'11-6',name:'龙骑士与完美风暴整备',subtitle:'最终战前的准备。每个人都知道——下一次世界，将决定一切。',bgColor:'#0a0a10',theme:'spirit',tiles:g,width:W,height:H,playerStart:{x:3,y:3},entities:[
{type:ENTITY_TYPE.ENEMY,id:'storm_elemental',name:'风暴元素',x:13,y:3,sprite:'🌪',color:'#4488cc',hp:150,atk:40,def:14,spd:16,damageType:'ice',rewards:{exp:110,gold:75}},
{type:ENTITY_TYPE.ENEMY,id:'dragon_rider',name:'龙骑士试炼',x:4,y:10,sprite:'🐉',color:'#cc8844',hp:170,atk:44,def:20,spd:12,rewards:{exp:120,gold:80}},
{type:ENTITY_TYPE.ITEM,id:'medkit_ch11_6',name:'生命之水',x:17,y:13,sprite:'♥',color:'#44ffaa',itemType:'consumable',effect:{heal:160}},
{type:ENTITY_TYPE.EVENT,id:'ch11_ending',name:'第十一章结算',x:13,y:12,sprite:'✦',color:'#ffdd88',event:{type:'chapter_end',lines:[{text:'所有的准备都已完成。中洲队从未如此强大过。',speaker:'旁白'},{text:'但他们即将面对的，是一切的终结。',speaker:'旁白'},{text:'第十一关「心魔与终战前奏」通关。获得基础奖励1000点。',speaker:'主神'}],flag:'ch11_complete',rewards:{rewardPoints:1000}}},
]};}

export function generateChapter11(){return{name:'第十一章 · 心魔与终战前奏',world:'猛鬼街/天煞/龙骑士',floors:[f11_1(),f11_2(),f11_3(),f11_4(),f11_5(),f11_6()]};}
