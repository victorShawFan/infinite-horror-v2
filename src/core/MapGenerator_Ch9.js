import { TILE, ENTITY_TYPE } from './constants.js';
const W = 21, H = 17;
function makeGrid(fill = TILE.WALL) { return Array.from({ length: H }, () => Array(W).fill(fill)); }
function carveRoom(g, x1, y1, x2, y2) { for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) if (y>=0&&y<H&&x>=0&&x<W) g[y][x] = TILE.FLOOR; }
function carveCorridor(g, x1, y1, x2, y2) { let cx=x1,cy=y1; while(cx!==x2){g[cy][cx]=TILE.FLOOR;cx+=cx<x2?1:-1;} while(cy!==y2){g[cy][cx]=TILE.FLOOR;cy+=cy<y2?1:-1;} g[cy][cx]=TILE.FLOOR; }

// ═══ 9-1 陵墓复活仪式 ═══
function f9_1(){const g=makeGrid();carveRoom(g,1,7,6,10);carveCorridor(g,6,8,10,8);carveRoom(g,10,5,16,11);carveCorridor(g,16,8,19,8);carveRoom(g,16,6,19,10);carveRoom(g,3,1,8,5);carveCorridor(g,5,5,5,7);carveRoom(g,10,13,16,16);carveCorridor(g,13,11,13,13);g[15][15]=TILE.STAIRS;return{id:'9-1',name:'陵墓复活仪式',subtitle:'再次回到哈姆纳塔。这一次，要复活零点、詹岚和罗甘道。',bgColor:'#080608',theme:'tomb',tiles:g,width:W,height:H,playerStart:{x:3,y:8},entities:[
{type:ENTITY_TYPE.EVENT,id:'ch9_intro',name:'复活仪式',x:4,y:8,sprite:'✦',color:'#ffdd44',event:{type:'dialogue',lines:[{text:'郑吒再次踏入陵墓。复活真经的力量已经恢复。',speaker:'旁白'},{text:'零点、詹岚、罗甘道——三个灵魂在光芒中逐渐成形。',speaker:'旁白'},{text:'……零点。睁开眼。',speaker:'郑吒'},{text:'不必废话。告诉我现在的情况。',speaker:'零点'},{text:'（零点、詹岚、罗甘道复活成功。全队重整完毕。）',speaker:'主神'}],flag:'ch9_revival',reviveCompanions:['lingdian','zhan_lan','luogandao']}},
{type:ENTITY_TYPE.ENEMY,id:'tomb_sentinel',name:'陵墓哨兵',x:13,y:8,sprite:'💀',color:'#886633',hp:105,atk:32,def:14,spd:8,rewards:{exp:80,gold:55}},
{type:ENTITY_TYPE.ITEM,id:'medkit_ch9_1',name:'急救包',x:14,y:14,sprite:'♥',color:'#ff4488',itemType:'consumable',effect:{heal:100}},
{type:ENTITY_TYPE.ITEM,id:'atk_ch9',name:'狙击瞄准器',x:18,y:7,sprite:'◆',color:'#ff8844',itemType:'stat_boost',effect:{atk:6}},
{type:ENTITY_TYPE.ENEMY,id:'tomb_guardian',name:'陵墓看守',x:5,y:3,sprite:'💀',color:'#776633',hp:90,atk:30,def:12,spd:7,rewards:{exp:70,gold:48}},
{type:ENTITY_TYPE.EVENT,id:'revival_ceremony',name:'复活场景',x:11,y:14,sprite:'✨',color:'#ffdd44',event:{type:'dialogue',lines:[{text:'金色光芒笼罩祭坛。三个灵魂在光中重新凝聚。',speaker:'旁白'},{text:'零点第一个睁开了眼睛。冷漠的目光扫过四周——然后停在了郑吒脸上。',speaker:'旁白'},{text:'你让我等了很久。',speaker:'零点'},{text:'詹岚温柔地笑了。"谢谢你，郑吒。"',speaker:'旁白'}]}},
{type:ENTITY_TYPE.ITEM,id:'def_ch9_1',name:'能量护盾碎片',x:16,y:9,sprite:'◆',color:'#6688ff',itemType:'stat_boost',effect:{def:6}},
{type:'item',id:'lore_revival',name:'复活真经的代价',x:4,y:9,sprite:'📜',color:'#ffdd44',itemType:'lore',loreId:'lore_9_revival',description:'每次复活都要消耗巨量的奖励点。而奖励点，是用命换来的。'}]};}

// ═══ 9-2 主神十日整备 ═══
function f9_2(){const g=makeGrid();carveRoom(g,1,1,7,6);carveCorridor(g,7,3,10,3);carveRoom(g,10,1,16,6);carveCorridor(g,13,6,13,9);carveRoom(g,10,9,16,13);carveRoom(g,1,9,7,13);carveCorridor(g,4,6,4,9);carveCorridor(g,7,11,10,11);carveRoom(g,16,10,19,15);carveCorridor(g,16,12,16,12);g[14][18]=TILE.STAIRS;return{id:'9-2',name:'主神十日整备',subtitle:'十天的准备期。零点校准狙击镜，楚轩制定战术方案。',bgColor:'#060810',theme:'scifi_base',tiles:g,width:W,height:H,playerStart:{x:4,y:3},entities:[
{type:ENTITY_TYPE.EVENT,id:'prep_briefing',name:'战术整备',x:13,y:3,sprite:'📋',color:'#88aaff',event:{type:'dialogue',lines:[{text:'楚轩展开了全息地图。"星河战队世界。虫族。"',speaker:'旁白'},{text:'虫族以数量取胜，但有一个弱点——脑虫。',speaker:'楚轩'},{text:'消灭或捕获脑虫，虫群就会失去指挥。零点，你负责定点清除。',speaker:'楚轩'},{text:'明白。',speaker:'零点'}],flag:'prep_complete'}},
{type:ENTITY_TYPE.ENEMY,id:'training_drone',name:'训练靶机',x:13,y:11,sprite:'🎯',color:'#668888',hp:80,atk:20,def:8,spd:10,rewards:{exp:60,gold:40}},
{type:ENTITY_TYPE.ITEM,id:'def_ch9',name:'合金护甲片',x:4,y:11,sprite:'◆',color:'#6688ff',itemType:'stat_boost',effect:{def:6}},
{type:ENTITY_TYPE.ITEM,id:'medkit_ch9_2',name:'急救包',x:18,y:13,sprite:'♥',color:'#ff4488',itemType:'consumable',effect:{heal:100}},
{type:ENTITY_TYPE.EVENT,id:'lingdian_training',name:'零点的校准',x:3,y:4,sprite:'🎯',color:'#88aaff',event:{type:'dialogue',lines:[{text:'零点在训练场的角落独自校准狙击镜。',speaker:'旁白'},{text:'1200米。风速7。湿度43%。修正值0.3。',speaker:'零点'},{text:'（他的专注力令人敬畏。每一发子弹都是精确计算的结果。）',speaker:'旁白'}],flag:'lingdian_training'}},{type:ENTITY_TYPE.ENEMY,id:'training_bot2',name:'训练靶机β',x:6,y:3,sprite:'🎯',color:'#669988',hp:85,atk:22,def:10,spd:12,rewards:{exp:65,gold:42}}]};}

// ═══ 9-3 军事基地 ═══
function f9_3(){const g=makeGrid();carveRoom(g,1,1,5,5);carveCorridor(g,5,3,9,3);carveRoom(g,9,1,14,5);carveCorridor(g,11,5,11,9);carveRoom(g,8,9,14,13);carveRoom(g,1,8,6,12);carveCorridor(g,4,5,4,8);carveCorridor(g,6,10,8,10);carveRoom(g,15,9,19,14);carveCorridor(g,14,11,15,11);g[13][18]=TILE.STAIRS;return{id:'9-3',name:'军事基地',subtitle:'星河战队世界。人类军事基地外围已经出现虫族斥候。',bgColor:'#060810',theme:'scifi_base',tiles:g,width:W,height:H,playerStart:{x:3,y:3},entities:[
{type:ENTITY_TYPE.ENEMY,id:'warrior_bug_1',name:'战士虫',x:11,y:9,sprite:'🪲',color:'#884422',hp:90,atk:34,def:10,spd:14,rewards:{exp:70,gold:48}},
{type:ENTITY_TYPE.ENEMY,id:'hopper_bug',name:'飞行虫',x:4,y:10,sprite:'🦗',color:'#886644',hp:65,atk:30,def:4,spd:20,rewards:{exp:60,gold:40}},
{type:ENTITY_TYPE.ITEM,id:'medkit_ch9_3',name:'军用急救包',x:17,y:12,sprite:'♥',color:'#ff4488',itemType:'consumable',effect:{heal:110}},
{type:ENTITY_TYPE.ITEM,id:'spd_ch9',name:'速度强化剂',x:2,y:9,sprite:'◆',color:'#44ffaa',itemType:'stat_boost',effect:{spd:5}},
{type:ENTITY_TYPE.ENEMY,id:'bug_scout',name:'虫族斥候',x:17,y:10,sprite:'🦗',color:'#774422',hp:70,atk:28,def:6,spd:18,rewards:{exp:55,gold:38}}]};}

// ═══ 9-4 虫潮守线 ═══
function f9_4(){const g=makeGrid();carveRoom(g,1,6,6,11);carveCorridor(g,6,8,10,8);carveRoom(g,10,4,15,12);carveCorridor(g,15,8,18,8);carveRoom(g,16,5,19,11);carveRoom(g,5,1,10,3);carveCorridor(g,8,3,8,4);carveRoom(g,8,13,14,16);carveCorridor(g,11,12,11,13);g[15][13]=TILE.STAIRS;return{id:'9-4',name:'虫潮守线',subtitle:'第一波虫潮来了。王侠和霸王负责布雷和火力压制。',bgColor:'#080810',theme:'scifi_base',tiles:g,width:W,height:H,playerStart:{x:3,y:8},entities:[
{type:ENTITY_TYPE.ENEMY,id:'warrior_bug_2',name:'战士虫',x:12,y:8,sprite:'🪲',color:'#884422',hp:95,atk:36,def:12,spd:13,rewards:{exp:75,gold:50}},
{type:ENTITY_TYPE.ENEMY,id:'tanker_bug',name:'坦克虫',x:8,y:1,sprite:'🐛',color:'#665533',hp:150,atk:30,def:22,spd:5,rewards:{exp:85,gold:60}},
{type:ENTITY_TYPE.ITEM,id:'medkit_ch9_4',name:'军用急救包',x:11,y:14,sprite:'♥',color:'#ff4488',itemType:'consumable',effect:{heal:110}},
{type:ENTITY_TYPE.ITEM,id:'crt_ch9',name:'弱点分析芯片',x:18,y:7,sprite:'◆',color:'#ffcc44',itemType:'stat_boost',effect:{crt:5}},
{type:ENTITY_TYPE.ITEM,id:'chest_ch9',name:'军用物资箱',x:12,y:10,sprite:'📦',color:'#ffaa44',itemType:'chest',chestType:'silver'},{type:ENTITY_TYPE.ITEM,id:'trap_ch9_laser',name:'⚡ 激光警报',x:9,y:8,sprite:'⚡',color:'#ff2200',itemType:'trap',trapType:'laser_grid'},{type:ENTITY_TYPE.ENEMY,id:'fire_bug',name:'喷火虫',x:5,y:8,sprite:'🔥',color:'#aa4400',hp:85,atk:32,def:8,spd:12,damageType:'fire',rewards:{exp:70,gold:50}}]};}

// ═══ 9-5 多队博弈 ═══
function f9_5(){const g=makeGrid();carveRoom(g,6,5,14,12);carveRoom(g,1,7,5,10);carveCorridor(g,5,8,6,8);carveRoom(g,15,7,19,10);carveCorridor(g,14,8,15,8);carveRoom(g,8,1,12,4);carveCorridor(g,10,4,10,5);carveRoom(g,8,13,12,16);carveCorridor(g,10,12,10,13);g[1][11]=TILE.STAIRS;return{id:'9-5',name:'多队博弈',subtitle:'詹岚发现了其他轮回者队伍的痕迹。不确定是敌是友。',bgColor:'#080810',theme:'scifi_base',tiles:g,width:W,height:H,playerStart:{x:10,y:15},entities:[
{type:ENTITY_TYPE.EVENT,id:'team_strategy',name:'战术决策',x:7,y:7,sprite:'?',color:'#ffcc44',event:{type:'choice',lines:[{text:'虫潮正在逼近。楚轩提出了两套方案。',speaker:'旁白'},{text:'方案A：全员突击，以最快速度推向脑虫。方案B：分队包抄，稳扎稳打。',speaker:'楚轩'}],choices:[{id:'rush',text:'方案A — 全员突击，速战速决',effect:{atk:4,spd:2,description:'闪电战取得了先机',relationship:{bawang:'good_decision',lingdian:'good_decision'}}},{id:'flank',text:'方案B — 分队包抄，稳中求胜',effect:{def:3,hp:25,description:'稳健的战术减少了伤亡',relationship:{chuxuan:'good_decision',zhan_lan:'good_decision'}}},{id:'ask_lingdian',text:'零点，你有什么建议？',effect:{crt:3,description:'零点的洞察提供了关键情报',relationship:{lingdian:'honest_talk',lingdian:'good_decision'}}}],flag:'team_strategy_done'}},{type:ENTITY_TYPE.EVENT,id:'rival_team_signal',name:'他队信号',x:10,y:14,sprite:'📡',color:'#ff8844',event:{type:'dialogue',lines:[{text:'詹岚的精神扫描捕捉到信号。不远处有另一支轮回者队伍。',speaker:'旁白'},{text:'他们似乎也在追踪脑虫。我们必须抢先一步。',speaker:'楚轩'},{text:'明白。全队加速推进！',speaker:'郑吒'}],flag:'rival_detected'}},
{type:ENTITY_TYPE.ENEMY,id:'plasma_bug',name:'浆虫',x:3,y:8,sprite:'💥',color:'#aa6622',hp:80,atk:40,def:8,spd:7,damageType:'fire',rewards:{exp:70,gold:50}},
{type:ENTITY_TYPE.ENEMY,id:'warrior_bug_3',name:'精锐战士虫',x:17,y:8,sprite:'🪲',color:'#993322',hp:110,atk:38,def:14,spd:14,rewards:{exp:80,gold:55}},
{type:ENTITY_TYPE.ITEM,id:'medkit_ch9_5',name:'高级急救包',x:8,y:2,sprite:'♥',color:'#ff4488',itemType:'consumable',effect:{heal:130}},
{type:ENTITY_TYPE.ITEM,id:'hp_ch9',name:'生命结晶',x:10,y:8,sprite:'◆',color:'#44ff44',itemType:'stat_boost',effect:{maxHp:30}}]};}

// ═══ 9-6 脑虫捕获撤离 ═══
function f9_6(){const g=makeGrid();carveRoom(g,1,1,6,5);carveCorridor(g,6,3,10,3);carveRoom(g,10,1,16,6);carveCorridor(g,13,6,13,10);carveRoom(g,9,10,16,14);carveRoom(g,1,8,7,13);carveCorridor(g,4,5,4,8);carveCorridor(g,7,12,9,12);carveRoom(g,16,11,19,15);carveCorridor(g,16,13,16,13);g[14][18]=TILE.STAIRS;return{id:'9-6',name:'脑虫捕获撤离',subtitle:'脑虫的巢穴就在前方。零点已经就位。',bgColor:'#0a0810',theme:'scifi_base',tiles:g,width:W,height:H,playerStart:{x:3,y:3},entities:[
{type:ENTITY_TYPE.BOSS,id:'boss_brainbug',bossId:'brain_bug',traits:['shield','regen'],name:'脑虫',x:13,y:3,sprite:'🧠',color:'#886644',hp:300,atk:28,def:10,spd:6,damageType:'psychic',weaknesses:['fire','physical'],rewards:{exp:280,gold:180,rewardPoints:450},lore:'虫族指挥中枢。精神攻击极其强大，但物理防御薄弱。'},
{type:ENTITY_TYPE.ENEMY,id:'guard_bug_1',name:'护卫虫',x:4,y:10,sprite:'🪲',color:'#884422',hp:120,atk:36,def:16,spd:12,rewards:{exp:85,gold:55}},
{type:ENTITY_TYPE.ENEMY,id:'guard_bug_2',name:'护卫虫',x:17,y:13,sprite:'🪲',color:'#884422',hp:120,atk:36,def:16,spd:12,rewards:{exp:85,gold:55}},
{type:ENTITY_TYPE.ITEM,id:'medkit_ch9_6',name:'高级急救包',x:4,y:1,sprite:'♥',color:'#ff4488',itemType:'consumable',effect:{heal:130}},
{type:ENTITY_TYPE.EVENT,id:'ch9_ending',name:'第九章结算',x:13,y:12,sprite:'✦',color:'#ffdd88',event:{type:'chapter_end',lines:[{text:'脑虫被成功捕获。虫群失去指挥，开始溃散。',speaker:'旁白'},{text:'撤离成功。队伍的配合越来越默契了。',speaker:'郑吒'},{text:'现在，中洲队已经回到了完整编制。是时候面对真正的战争了。',speaker:'楚轩'},{text:'第九关「星河远征」通关。获得基础奖励1000点。',speaker:'主神'}],flag:'ch9_complete',rewards:{rewardPoints:1000}}},
{type:ENTITY_TYPE.ENEMY,id:'guard_elite',name:'精锐护卫虫',x:10,y:12,sprite:'🪲',color:'#993322',hp:135,atk:40,def:18,spd:13,rewards:{exp:95,gold:62}}]};}

export function generateChapter9(){return{name:'第九章 · 星河远征',world:'星河战队',floors:[f9_1(),f9_2(),f9_3(),f9_4(),f9_5(),f9_6()]};}
