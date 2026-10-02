import { TILE, ENTITY_TYPE } from './constants.js';
const W = 21, H = 17;
function makeGrid(fill = TILE.WALL) { return Array.from({ length: H }, () => Array(W).fill(fill)); }
function carveRoom(g, x1, y1, x2, y2) { for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) if (y>=0&&y<H&&x>=0&&x<W) g[y][x] = TILE.FLOOR; }
function carveCorridor(g, x1, y1, x2, y2) { let cx=x1,cy=y1; while(cx!==x2){g[cy][cx]=TILE.FLOOR;cx+=cx<x2?1:-1;} while(cy!==y2){g[cy][cx]=TILE.FLOOR;cy+=cy<y2?1:-1;} g[cy][cx]=TILE.FLOOR; }

function f12_1(){const g=makeGrid();carveRoom(g,1,1,6,5);carveRoom(g,8,1,14,5);carveCorridor(g,6,3,8,3);carveRoom(g,16,1,19,5);carveCorridor(g,14,3,16,3);carveRoom(g,1,7,5,12);carveCorridor(g,3,5,3,7);carveRoom(g,7,7,14,12);carveCorridor(g,5,9,7,9);carveRoom(g,16,8,19,12);carveCorridor(g,14,10,16,10);carveRoom(g,4,14,10,16);carveCorridor(g,7,12,7,14);carveRoom(g,12,14,18,16);carveCorridor(g,10,15,12,15);g[16][17]=TILE.STAIRS;return{id:'12-1',name:'生化危机——最终一战序幕',subtitle:'一切的起点。生化危机——郑吒第一次踏入主神世界的地方。',bgColor:'#140808',theme:'biolab',tiles:g,width:W,height:H,playerStart:{x:3,y:3},entities:[
{type:ENTITY_TYPE.EVENT,id:'ch12_intro',name:'最终之战',x:4,y:3,sprite:'✦',color:'#ff4444',event:{type:'dialogue',lines:[{text:'一切的起点。生化危机——郑吒第一次踏入主神世界的地方。',speaker:'旁白'},{text:'如今，他将在这里结束一切。',speaker:'旁白'},{text:'中洲队 vs 恶魔队。原版 vs 复制体。',speaker:'旁白'},{text:'所有人——准备好了吗？',speaker:'郑吒'},{text:'准备好了。',speaker:'所有人'}]}},
{type:ENTITY_TYPE.ENEMY,id:'final_zombie_1',name:'终极T病毒体',x:11,y:3,sprite:'🧟',color:'#668844',hp:160,atk:48,def:20,spd:10,rewards:{exp:120,gold:85}},
{type:ENTITY_TYPE.ENEMY,id:'final_zombie_2',name:'G病毒变异体',x:18,y:3,sprite:'🧬',color:'#886644',hp:180,atk:46,def:22,spd:8,rewards:{exp:130,gold:90},traits:['regen']},
{type:ENTITY_TYPE.ENEMY,id:'bio_tyrant',name:'终极暴君',x:10,y:9,sprite:'💀',color:'#aa4422',hp:200,atk:50,def:24,spd:9,rewards:{exp:140,gold:95}},
{type:ENTITY_TYPE.ITEM,id:'medkit_12_1',name:'主神级修复剂',x:3,y:10,sprite:'♥',color:'#ff4488',itemType:'consumable',effect:{heal:200}},
{type:ENTITY_TYPE.ITEM,id:'atk_ch12_1',name:'终极力量结晶',x:18,y:10,sprite:'◆',color:'#ff8844',itemType:'stat_boost',effect:{atk:10}},
]};}

function f12_2(){const g=makeGrid();carveRoom(g,1,1,7,6);carveRoom(g,9,1,14,5);carveCorridor(g,7,4,9,4);carveRoom(g,16,2,19,6);carveCorridor(g,14,4,16,4);carveRoom(g,1,8,6,13);carveCorridor(g,4,6,4,8);carveRoom(g,8,8,14,14);carveCorridor(g,6,11,8,11);carveRoom(g,16,9,19,14);carveCorridor(g,14,11,16,11);g[13][18]=TILE.STAIRS;return{id:'12-2',name:'恶魔队前哨战',subtitle:'复制体楚轩已经设好了陷阱。但楚轩也早已算到了这一点。',bgColor:'#120606',theme:'biolab',tiles:g,width:W,height:H,playerStart:{x:4,y:4},entities:[
{type:ENTITY_TYPE.ENEMY,id:'demon_elite_12_1',name:'恶魔队精锐·剑',x:4,y:10,sprite:'⚔',color:'#cc2222',hp:170,atk:50,def:20,spd:14,rewards:{exp:130,gold:90,rewardPoints:80}},
{type:ENTITY_TYPE.ENEMY,id:'demon_elite_12_2',name:'恶魔队精锐·盾',x:17,y:4,sprite:'🛡',color:'#cc2222',hp:200,atk:40,def:28,spd:8,rewards:{exp:130,gold:90,rewardPoints:80},traits:['armored']},
{type:ENTITY_TYPE.ENEMY,id:'demon_mage_12',name:'恶魔队·暗法师',x:17,y:12,sprite:'🔮',color:'#882288',hp:140,atk:55,def:12,spd:16,damageType:'dark',rewards:{exp:125,gold:85,rewardPoints:70}},
{type:ENTITY_TYPE.ITEM,id:'medkit_12_2',name:'高级修复剂',x:3,y:12,sprite:'♥',color:'#ff4488',itemType:'consumable',effect:{heal:200}},
{type:ENTITY_TYPE.ITEM,id:'def_ch12',name:'终极防御结晶',x:10,y:12,sprite:'◆',color:'#6688ff',itemType:'stat_boost',effect:{def:10}},
]};}

function f12_3(){const g=makeGrid();carveRoom(g,2,2,8,6);carveRoom(g,10,1,16,5);carveCorridor(g,8,4,10,4);carveRoom(g,1,8,6,14);carveCorridor(g,4,6,4,8);carveRoom(g,8,8,14,14);carveCorridor(g,6,11,8,11);carveRoom(g,16,8,19,14);carveCorridor(g,14,11,16,11);g[13][18]=TILE.STAIRS;return{id:'12-3',name:'楚轩的最终计划',subtitle:'"最后一个计划——已经启动了。"',bgColor:'#0a0808',theme:'biolab',tiles:g,width:W,height:H,playerStart:{x:5,y:4},entities:[
{type:ENTITY_TYPE.EVENT,id:'final_plan',name:'最终计划启动',x:13,y:3,sprite:'📋',color:'#ffdd44',event:{type:'dialogue',lines:[{text:'楚轩在终端前输入代码。屏幕上是复杂的时间线。',speaker:'旁白'},{text:'最终计划需要三个条件——郑吒的洪荒之力、赵樱空的心灵之光、我的计算。',speaker:'楚轩'},{text:'三者合一——就能打破主神的规则。',speaker:'楚轩'},{text:'……但代价是什么？',speaker:'郑吒'},{text:'楚轩推了推眼镜，没有回答。',speaker:'旁白'}],flag:'final_plan_activated'}},
{type:ENTITY_TYPE.ENEMY,id:'copy_scout_12',name:'恶魔队斥候',x:4,y:11,sprite:'👤',color:'#882222',hp:140,atk:48,def:16,spd:18,rewards:{exp:120,gold:82}},
{type:ENTITY_TYPE.ENEMY,id:'bio_hunter_12',name:'终极猎手',x:17,y:11,sprite:'🦎',color:'#888844',hp:160,atk:52,def:18,spd:14,rewards:{exp:130,gold:88},traits:['swift']},
{type:ENTITY_TYPE.ITEM,id:'medkit_12_3',name:'主神修复剂',x:3,y:13,sprite:'♥',color:'#ff4488',itemType:'consumable',effect:{heal:220}},
{type:ENTITY_TYPE.ITEM,id:'spd_ch12',name:'速度结晶',x:18,y:12,sprite:'◆',color:'#44ffaa',itemType:'stat_boost',effect:{spd:7}},
]};}

function f12_4(){const g=makeGrid();carveRoom(g,1,1,5,5);carveRoom(g,7,1,12,4);carveCorridor(g,5,3,7,3);carveRoom(g,14,1,19,5);carveCorridor(g,12,3,14,3);carveRoom(g,1,7,6,12);carveCorridor(g,3,5,3,7);carveRoom(g,8,7,14,13);carveCorridor(g,6,9,8,9);carveRoom(g,16,7,19,13);carveCorridor(g,14,10,16,10);carveRoom(g,5,14,15,16);carveCorridor(g,10,13,10,14);g[16][14]=TILE.STAIRS;return{id:'12-4',name:'恶魔队——主力交锋',subtitle:'原版 vs 复制体。面对面。不死不休。',bgColor:'#140505',theme:'biolab',tiles:g,width:W,height:H,playerStart:{x:3,y:3},entities:[
{type:ENTITY_TYPE.ENEMY,id:'copy_zero',name:'复制体·零点',x:17,y:3,sprite:'🎯',color:'#cc2222',hp:180,atk:55,def:14,spd:18,rewards:{exp:145,gold:98,rewardPoints:100}},
{type:ENTITY_TYPE.ENEMY,id:'copy_bawang',name:'复制体·霸王',x:10,y:2,sprite:'🐯',color:'#cc6622',hp:220,atk:52,def:22,spd:10,rewards:{exp:150,gold:100,rewardPoints:100},traits:['enrage']},
{type:ENTITY_TYPE.ENEMY,id:'copy_yingkong',name:'复制体·赵樱空',x:3,y:9,sprite:'🗡',color:'#cc2266',hp:160,atk:58,def:12,spd:22,damageType:'psychic',rewards:{exp:145,gold:95,rewardPoints:100}},
{type:ENTITY_TYPE.EVENT,id:'lingdian_fall',name:'零点陨落',x:16,y:10,sprite:'†',color:'#ff0000',event:{type:'fixed_death',lines:[{text:'复制体零点的子弹击中了零点的胸口。',speaker:'旁白'},{text:'他倒下时还保持着射击姿势。',speaker:'旁白'},{text:'最后一枪……送你上路。',speaker:'零点'}],flag:'lingdian_dead',companionDeaths:['lingdian']}},
{type:ENTITY_TYPE.EVENT,id:'bawang_fall',name:'霸王陨落',x:5,y:15,sprite:'†',color:'#ff0000',event:{type:'fixed_death',lines:[{text:'霸王用身体挡住了复制体霸王的致命一击。',speaker:'旁白'},{text:'大家……先走。我还能撑一会儿……',speaker:'霸王'}],flag:'bawang_dead',companionDeaths:['bawang']}},
{type:ENTITY_TYPE.EVENT,id:'yingkong_fall',name:'赵樱空的牺牲',x:13,y:15,sprite:'†',color:'#ff0000',event:{type:'fixed_death',lines:[{text:'赵樱空释放了全部心灵之光——为最终计划提供锚点。',speaker:'旁白'},{text:'我知道代价。但我选择这样做。',speaker:'赵樱空'},{text:'郑吒……再见。',speaker:'赵樱空'}],flag:'yingkong_dead',companionDeaths:['zhao_yingkong']}},
{type:ENTITY_TYPE.EVENT,id:'zhangheng_fall',name:'张恒断后',x:10,y:3,sprite:'†',color:'#ff0000',event:{type:'fixed_death',lines:[{text:'张恒激活了所有机械装置为队友断后。',speaker:'旁白'},{text:'去吧，队长。我来挡住他们。',speaker:'张恒'}],flag:'zhangheng_dead',companionDeaths:['zhang_heng']}},
{type:ENTITY_TYPE.ITEM,id:'medkit_12_4',name:'终极修复剂',x:8,y:15,sprite:'♥',color:'#ff4488',itemType:'consumable',effect:{heal:250}},
{type:ENTITY_TYPE.ITEM,id:'hp_ch12',name:'生命极限结晶',x:12,y:15,sprite:'◆',color:'#44ff44',itemType:'stat_boost',effect:{maxHp:80}},
      {type:ENTITY_TYPE.ITEM,id:'set_lord_blade',name:'主神之刃',x:7,y:4,sprite:'⚔',color:'#ff4444',
       itemType:'weapon',weapon:{name:'主神之刃',atk:35,crt:8,spd:3,setId:'lord_blade',slot:'weapon',
       description:'从主神碎片中凝聚的终极武器。'}},
    ]};}

function f12_5(){const g=makeGrid();carveRoom(g,3,3,17,13);carveRoom(g,1,7,2,10);carveCorridor(g,2,8,3,8);carveRoom(g,18,7,19,10);carveCorridor(g,17,8,18,8);carveRoom(g,8,1,12,2);carveCorridor(g,10,2,10,3);carveRoom(g,8,14,12,16);carveCorridor(g,10,13,10,14);g[1][11]=TILE.STAIRS;return{id:'12-5',name:'最终对决',subtitle:'复制体楚轩 vs 楚轩。复制体郑吒 vs 郑吒。最终的牺牲。',bgColor:'#180505',theme:'biolab',tiles:g,width:W,height:H,playerStart:{x:10,y:15},entities:[
{type:ENTITY_TYPE.BOSS,id:'boss_copy_chuxuan',bossId:'clone_chuxuan',traits:['smart'],name:'复制体楚轩',x:6,y:6,sprite:'🧠',color:'#8822cc',hp:280,atk:50,def:18,spd:16,damageType:'psychic',weaknesses:['spirit'],rewards:{exp:350,gold:250,rewardPoints:400},lore:'恶魔队的军师。智力与原版楚轩相当，但没有人性的约束。'},
{type:ENTITY_TYPE.BOSS,id:'boss_copy_zhengzha_final',bossId:'clone_zhengzha_final',traits:['swift','enrage'],name:'复制体郑吒·终极',x:14,y:6,sprite:'郑',color:'#ff2222',hp:400,atk:56,def:20,spd:16,rewards:{exp:500,gold:350,rewardPoints:600},lore:'恶魔队队长。拥有与郑吒相同的洪荒之力，但被黑暗吞噬。'},
{type:ENTITY_TYPE.EVENT,id:'chuxuan_sacrifice',name:'楚轩的牺牲',x:10,y:10,sprite:'✦',color:'#ffdd44',event:{type:'dialogue',lines:[{text:'楚轩突然倒在地上。鲜血从口中涌出。',speaker:'旁白'},{text:'楚轩！！',speaker:'郑吒'},{text:'计划的最后一步——需要一个人作为锚点。',speaker:'楚轩'},{text:'这是我自己的选择。不是你的错。',speaker:'楚轩'},{text:'替我……看看主神空间之外的世界。',speaker:'楚轩'}],flag:'chuxuan_sacrifice',companionDeaths:['chuxuan']}},
{type:ENTITY_TYPE.ITEM,id:'medkit_12_5',name:'生命极限药剂',x:1,y:8,sprite:'♥',color:'#ff4488',itemType:'consumable',effect:{heal:300}},
{type:ENTITY_TYPE.ITEM,id:'atk_final',name:'洪荒之力碎片',x:19,y:8,sprite:'✦',color:'#ff8844',itemType:'stat_boost',effect:{atk:12,crt:8}},
]};}

function f12_6(){const g=makeGrid();carveRoom(g,4,4,16,12);carveRoom(g,1,7,3,10);carveCorridor(g,3,8,4,8);carveRoom(g,17,7,19,10);carveCorridor(g,16,8,17,8);carveRoom(g,8,1,12,3);carveCorridor(g,10,3,10,4);carveRoom(g,8,13,12,16);carveCorridor(g,10,12,10,13);g[15][11]=TILE.STAIRS;return{id:'12-6',name:'终章 · 归途',subtitle:'不是所有人都能活着走出去。但这就是——无限恐怖。',bgColor:'#100505',theme:'finale',tiles:g,width:W,height:H,playerStart:{x:10,y:14},entities:[
{type:ENTITY_TYPE.EVENT,id:'final_assembly',name:'最后的集结',x:10,y:12,sprite:'✦',color:'#ffdd44',event:{type:'dialogue',lines:[{text:'楚轩的意识化为金色光网，覆盖整个战场。',speaker:'旁白'},{text:'所有活着的队友都感受到了彼此的力量。',speaker:'旁白'},{text:'让我们——一起活着回去。所有人。一个都不能少。',speaker:'郑吒'}],flag:'final_assembly'}},
{type:ENTITY_TYPE.BOSS,id:'boss_lord_god_fragment',bossId:'lord_god_fragment',traits:['enrage','swift','regen'],name:'主神碎片',x:10,y:6,sprite:'👁',color:'#ffaa00',hp:500,atk:60,def:24,spd:14,weaknesses:['spirit','holy'],rewards:{exp:800,gold:500,rewardPoints:1000},lore:'主神存在的碎片化身。击破它，就能打开通往现实世界的大门。'},
{type:ENTITY_TYPE.EVENT,id:'ch12_ending',name:'终章结算',x:10,y:4,sprite:'✦',color:'#ffdd88',event:{type:'chapter_end',lines:[{text:'主神碎片崩溃了。空间开始震荡。',speaker:'旁白'},{text:'白光吞没了一切——',speaker:'旁白'},{text:'当郑吒再次睁开眼睛时，他看到的是——午夜的电影院。',speaker:'旁白'},{text:'身边的座位上，坐着赵樱空。还有——所有活下来的人。',speaker:'旁白'},{text:'最终关「生化终战」通关。获得基础奖励2000点。',speaker:'主神'},{text:'恭喜你完成了——无限恐怖。',speaker:'旁白'}],flag:'ch12_complete',rewards:{rewardPoints:2000}}},
{type:ENTITY_TYPE.ITEM,id:'medkit_12_final',name:'终极生命药剂',x:2,y:8,sprite:'♥',color:'#ff4488',itemType:'consumable',effect:{heal:500}},
{type:ENTITY_TYPE.ITEM,id:'all_stat_final',name:'终极全属性结晶',x:18,y:8,sprite:'✦',color:'#ffdd44',itemType:'stat_boost',effect:{atk:8,def:8,spd:5,crt:8,maxHp:60}},
]};}

export function generateChapter12(){return{name:'第十二章 · 生化终战',world:'生化危机三·最终一战',floors:[f12_1(),f12_2(),f12_3(),f12_4(),f12_5(),f12_6()]};}
