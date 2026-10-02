import { TILE, ENTITY_TYPE } from './constants.js';
const W = 21, H = 17;
function makeGrid(fill = TILE.WALL) { return Array.from({ length: H }, () => Array(W).fill(fill)); }
function carveRoom(g, x1, y1, x2, y2) { for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) if (y>=0&&y<H&&x>=0&&x<W) g[y][x] = TILE.FLOOR; }
function carveCorridor(g, x1, y1, x2, y2) { let cx=x1,cy=y1; while(cx!==x2){g[cy][cx]=TILE.FLOOR;cx+=cx<x2?1:-1;} while(cy!==y2){g[cy][cx]=TILE.FLOOR;cy+=cy<y2?1:-1;} g[cy][cx]=TILE.FLOOR; }

function f11_1(){const g=makeGrid();carveRoom(g,1,1,6,5);carveRoom(g,8,1,13,4);carveCorridor(g,6,3,8,3);carveRoom(g,15,1,19,5);carveCorridor(g,13,2,15,2);carveRoom(g,1,7,5,12);carveCorridor(g,3,5,3,7);carveRoom(g,7,7,13,12);carveCorridor(g,5,9,7,9);carveRoom(g,15,8,19,12);carveCorridor(g,13,10,15,10);carveRoom(g,3,14,9,16);carveCorridor(g,6,12,6,14);carveRoom(g,12,14,18,16);carveCorridor(g,9,15,12,15);g[16][17]=TILE.STAIRS;return{id:'11-1',name:'变形金刚——城市废墟',subtitle:'高楼倾倒，钢铁巨人的身影在尘埃中若隐若现。',bgColor:'#0c0c10',theme:'ruins',tiles:g,width:W,height:H,playerStart:{x:3,y:3},entities:[
{type:ENTITY_TYPE.EVENT,id:'ch11_intro',name:'连续世界开始',x:2,y:3,sprite:'✦',color:'#ffffff',event:{type:'dialogue',lines:[{text:'从五队大战归来后，主神没有给休息时间。',speaker:'旁白'},{text:'三个世界。连续投放。变形金刚。猛鬼街。天煞。',speaker:'旁白'},{text:'这不是巧合——这是主神对中洲队的终极考验。',speaker:'楚轩'},{text:'打起精神。我们会一起走过去的。',speaker:'郑吒'}]}},
{type:ENTITY_TYPE.ENEMY,id:'decepticon_1',name:'霸天虎步兵',x:10,y:2,sprite:'🤖',color:'#884444',hp:130,atk:42,def:18,spd:10,rewards:{exp:100,gold:70}},
{type:ENTITY_TYPE.ENEMY,id:'decepticon_2',name:'霸天虎重装',x:17,y:3,sprite:'🤖',color:'#aa4444',hp:160,atk:38,def:24,spd:7,rewards:{exp:110,gold:75},traits:['armored']},
{type:ENTITY_TYPE.ENEMY,id:'mech_drone',name:'无人机群',x:3,y:10,sprite:'🛸',color:'#6688cc',hp:80,atk:36,def:8,spd:20,rewards:{exp:85,gold:55}},
{type:ENTITY_TYPE.ENEMY,id:'scrap_golem',name:'废铁傀儡',x:17,y:10,sprite:'🗿',color:'#888866',hp:150,atk:34,def:22,spd:5,rewards:{exp:95,gold:65},traits:['regen']},
{type:ENTITY_TYPE.ITEM,id:'medkit_11_1',name:'纳米修复包',x:10,y:9,sprite:'♥',color:'#44ffaa',itemType:'consumable',effect:{heal:140}},
{type:ENTITY_TYPE.ITEM,id:'atk_ch11_1',name:'合金拳套',x:4,y:15,sprite:'◆',color:'#ff8844',itemType:'stat_boost',effect:{atk:8}},
{type:ENTITY_TYPE.EVENT,id:'luogandao_death_ch11',name:'罗甘道的牺牲',x:15,y:15,sprite:'†',color:'#ff0000',event:{type:'fixed_death',lines:[{text:'变形金刚世界的爆炸波及了罗甘道——他没能躲开。',speaker:'旁白'},{text:'不——罗甘道！',speaker:'郑吒'},{text:'（罗甘道在变形金刚世界中阵亡。）',speaker:'主神'}],flag:'luogandao_dead_ch11',companionDeath:'luogandao'}},
{type:ENTITY_TYPE.ITEM,id:'chest_11_1',name:'军用补给箱',x:14,y:14,sprite:'📦',color:'#ffaa44',itemType:'chest',chestType:'gold'},
]};}

function f11_2(){const g=makeGrid();carveRoom(g,1,1,7,6);carveRoom(g,9,1,14,5);carveCorridor(g,7,3,9,3);carveRoom(g,16,1,19,6);carveCorridor(g,14,3,16,3);carveRoom(g,1,8,6,13);carveCorridor(g,4,6,4,8);carveRoom(g,8,8,14,13);carveCorridor(g,6,10,8,10);carveRoom(g,16,9,19,14);carveCorridor(g,14,11,16,11);carveRoom(g,7,14,13,16);carveCorridor(g,10,13,10,14);g[16][12]=TILE.STAIRS;return{id:'11-2',name:'猛鬼街——梦境入口',subtitle:'弗莱迪的领域。一旦入睡，就进入了他的世界。',bgColor:'#100810',theme:'nightmare',tiles:g,width:W,height:H,playerStart:{x:4,y:3},entities:[
{type:ENTITY_TYPE.EVENT,id:'freddy_intro',name:'弗莱迪的欢迎',x:11,y:3,sprite:'🎭',color:'#ff4444',event:{type:'dialogue',lines:[{text:'"嘿嘿嘿……新来的孩子们。"空气中传来刮擦声。',speaker:'弗莱迪'},{text:'那个戴着铁爪手套的影子……猛鬼街的弗莱迪·克鲁格。',speaker:'旁白'},{text:'在梦中，他是神。我们必须保持清醒——或者在梦中击败他。',speaker:'楚轩'}],flag:'freddy_met'}},
{type:ENTITY_TYPE.ENEMY,id:'dream_shade_1',name:'梦魇魔影',x:4,y:10,sprite:'👻',color:'#884488',hp:110,atk:40,def:12,spd:16,damageType:'psychic',rewards:{exp:95,gold:65}},
{type:ENTITY_TYPE.ENEMY,id:'dream_shade_2',name:'噩梦行者',x:17,y:4,sprite:'😈',color:'#aa44aa',hp:120,atk:44,def:10,spd:18,damageType:'psychic',rewards:{exp:100,gold:70}},
{type:ENTITY_TYPE.ENEMY,id:'sleep_walker',name:'梦游者',x:17,y:12,sprite:'🧟',color:'#666688',hp:90,atk:30,def:14,spd:8,rewards:{exp:70,gold:50}},
{type:ENTITY_TYPE.ITEM,id:'medkit_11_2',name:'清醒药剂',x:10,y:15,sprite:'💊',color:'#44ccff',itemType:'consumable',effect:{heal:130}},
{type:ENTITY_TYPE.ITEM,id:'def_ch11',name:'梦境护符',x:2,y:11,sprite:'🛡',color:'#aa88ff',itemType:'stat_boost',effect:{def:8,res:5}},
]};}

function f11_3(){const g=makeGrid();carveRoom(g,2,2,8,6);carveRoom(g,10,1,15,5);carveCorridor(g,8,4,10,4);carveRoom(g,1,8,6,13);carveCorridor(g,4,6,4,8);carveRoom(g,8,8,14,14);carveCorridor(g,6,11,8,11);carveRoom(g,16,2,19,7);carveCorridor(g,15,4,16,4);carveRoom(g,16,10,19,14);carveCorridor(g,14,12,16,12);g[13][18]=TILE.STAIRS;return{id:'11-3',name:'梦层深处',subtitle:'梦境变得越来越扭曲。重力在改变。方向在迷失。',bgColor:'#0a0810',theme:'nightmare',tiles:g,width:W,height:H,playerStart:{x:5,y:4},entities:[
{type:ENTITY_TYPE.ENEMY,id:'nightmare_weaver',name:'噩梦编织者',x:12,y:3,sprite:'🕷',color:'#884488',hp:140,atk:42,def:14,spd:14,damageType:'psychic',rewards:{exp:110,gold:75},traits:['swift']},
{type:ENTITY_TYPE.ENEMY,id:'dream_mirror',name:'镜像自我',x:3,y:10,sprite:'🪞',color:'#aaaacc',hp:130,atk:38,def:16,spd:12,rewards:{exp:105,gold:70}},
{type:ENTITY_TYPE.ENEMY,id:'fear_manifest',name:'恐惧具象',x:17,y:5,sprite:'😱',color:'#cc4488',hp:100,atk:46,def:8,spd:20,damageType:'psychic',rewards:{exp:100,gold:68}},
{type:ENTITY_TYPE.ITEM,id:'medkit_11_3',name:'精神修复剂',x:18,y:12,sprite:'💊',color:'#44ccff',itemType:'consumable',effect:{heal:140}},
{type:ENTITY_TYPE.ITEM,id:'spd_ch11',name:'梦境轻羽',x:5,y:12,sprite:'◆',color:'#44ffaa',itemType:'stat_boost',effect:{spd:6}},
]};}

function f11_4(){const g=makeGrid();carveRoom(g,1,1,5,5);carveRoom(g,7,1,12,4);carveCorridor(g,5,3,7,3);carveRoom(g,14,1,19,5);carveCorridor(g,12,3,14,3);carveRoom(g,1,7,6,11);carveCorridor(g,3,5,3,7);carveRoom(g,8,7,14,12);carveCorridor(g,6,9,8,9);carveRoom(g,16,7,19,11);carveCorridor(g,14,9,16,9);carveRoom(g,6,13,14,16);carveCorridor(g,10,12,10,13);g[15][13]=TILE.STAIRS;return{id:'11-4',name:'天煞——武者的试炼',subtitle:'一个只属于武者的世界。这里的考验不是恐惧，而是极限。',bgColor:'#0c0a08',theme:'dojo',tiles:g,width:W,height:H,playerStart:{x:3,y:3},entities:[
{type:ENTITY_TYPE.ENEMY,id:'celestial_guard',name:'天煞守卫',x:10,y:2,sprite:'⚔',color:'#cc8844',hp:150,atk:44,def:20,spd:12,rewards:{exp:115,gold:78}},
{type:ENTITY_TYPE.ENEMY,id:'spirit_warrior',name:'武魂',x:17,y:3,sprite:'👤',color:'#88aa44',hp:130,atk:48,def:14,spd:16,rewards:{exp:110,gold:72},traits:['swift']},
{type:ENTITY_TYPE.ENEMY,id:'dragon_spirit',name:'龙魂',x:17,y:9,sprite:'🐉',color:'#ffaa22',hp:170,atk:42,def:18,spd:14,damageType:'fire',rewards:{exp:120,gold:80}},
{type:ENTITY_TYPE.EVENT,id:'mass_revival_ch11',name:'天煞试炼奖励',x:8,y:8,sprite:'✦',color:'#ffdd44',event:{type:'dialogue',lines:[{text:'天煞的试炼完成后，主神给予了特殊奖励——三个复活名额。',speaker:'旁白'},{text:'肖宏律、齐腾一、铭烟薇的身影在光中重新凝聚。',speaker:'旁白'},{text:'（肖宏律、齐腾一、铭烟薇复活成功。）',speaker:'主神'}],flag:'mass_revival_ch11',reviveCompanions:['xiao_honglv','qi_tengyi','ming_yanwei']}},
{type:ENTITY_TYPE.EVENT,id:'liu_yu_join',name:'刘郁加入',x:5,y:7,sprite:'👤',color:'#44cc88',event:{type:'dialogue',lines:[{text:'一个陌生的身影从传送门中走出——刘郁，自由联盟的幸存者。',speaker:'旁白'},{text:'我想加入你们的队伍。',speaker:'刘郁'}],flag:'liu_yu_joined',addCompanion:{id:'liu_yu',name:'刘郁',role:'support'}}},
{type:ENTITY_TYPE.EVENT,id:'lin_juntian_join',name:'林君天加入',x:18,y:10,sprite:'👤',color:'#44cc88',event:{type:'dialogue',lines:[{text:'又一个身影——林君天，前印洲队成员。',speaker:'旁白'},{text:'我也要加入。我想看看这个故事的结局。',speaker:'林君天'}],flag:'lin_juntian_joined',addCompanion:{id:'lin_juntian',name:'林君天',role:'fighter'}}},
{type:ENTITY_TYPE.ITEM,id:'medkit_11_4',name:'仙丹',x:8,y:14,sprite:'💊',color:'#ffaa44',itemType:'consumable',effect:{heal:160}},
{type:ENTITY_TYPE.ITEM,id:'crt_ch11',name:'破绽之眼',x:12,y:14,sprite:'◆',color:'#ffcc44',itemType:'stat_boost',effect:{crt:8}},
      {type:ENTITY_TYPE.ITEM,id:'set_crusader_armor',name:'十字军圣甲',x:4,y:4,sprite:'🛡',color:'#ffdd44',
       itemType:'armor',armor:{name:'十字军圣甲',def:18,maxHp:50,setId:'crusader_armor',slot:'armor',
       description:'曾属于十字军精英的圣甲，散发圣洁光辉。'}},
    ]};}

function f11_5(){const g=makeGrid();carveRoom(g,5,3,15,13);carveRoom(g,1,7,4,10);carveCorridor(g,4,8,5,8);carveRoom(g,16,7,19,10);carveCorridor(g,15,8,16,8);carveRoom(g,8,1,12,2);carveCorridor(g,10,2,10,3);carveRoom(g,8,14,12,16);carveCorridor(g,10,13,10,14);g[15][11]=TILE.STAIRS;return{id:'11-5',name:'心魔对决',subtitle:'弗莱迪找到了郑吒最深的恐惧——那些因他而死的人。',bgColor:'#100510',theme:'nightmare',tiles:g,width:W,height:H,playerStart:{x:10,y:15},entities:[
{type:ENTITY_TYPE.EVENT,id:'heart_demon_start',name:'心魔降临',x:10,y:12,sprite:'💀',color:'#ff0000',event:{type:'dialogue',lines:[{text:'弗莱迪的笑声在四周回荡。',speaker:'旁白'},{text:'"让我给你看看你最害怕的东西，小英雄。"',speaker:'弗莱迪'},{text:'雾气中走出一个个身影——张杰、齐腾一、铭烟薇——',speaker:'旁白'},{text:'那些已经死去的队友，带着空洞的眼神，缓缓逼近。',speaker:'旁白'}],flag:'heart_demon_start'}},
{type:ENTITY_TYPE.ENEMY,id:'ghost_zhangjie',name:'亡魂·张杰',x:8,y:6,sprite:'👻',color:'#884488',hp:120,atk:40,def:12,spd:14,damageType:'psychic',rewards:{exp:100,gold:68}},
{type:ENTITY_TYPE.ENEMY,id:'ghost_qitengyi',name:'亡魂·齐腾一',x:12,y:6,sprite:'👻',color:'#884488',hp:130,atk:38,def:16,spd:10,damageType:'psychic',rewards:{exp:105,gold:70}},
{type:ENTITY_TYPE.ITEM,id:'medkit_11_5',name:'灵魂修复剂',x:2,y:8,sprite:'♥',color:'#ff4488',itemType:'consumable',effect:{heal:180}},
{type:ENTITY_TYPE.ITEM,id:'hp_ch11',name:'生命结晶',x:18,y:8,sprite:'◆',color:'#44ff44',itemType:'stat_boost',effect:{maxHp:60}},
]};}

function f11_6(){const g=makeGrid();carveRoom(g,3,3,17,13);carveRoom(g,1,7,2,10);carveCorridor(g,2,8,3,8);carveRoom(g,18,7,19,10);carveCorridor(g,17,8,18,8);carveRoom(g,8,1,12,2);carveCorridor(g,10,2,10,3);carveRoom(g,8,14,12,16);carveCorridor(g,10,13,10,14);g[15][11]=TILE.STAIRS;return{id:'11-6',name:'破除心魔·觉醒',subtitle:'面对自己最深的恐惧，郑吒做出了所有人都没有预料到的选择。',bgColor:'#080514',theme:'awakening',tiles:g,width:W,height:H,playerStart:{x:10,y:15},entities:[
{type:ENTITY_TYPE.EVENT,id:'suicide_choice',name:'郑吒的抉择',x:10,y:10,sprite:'⚖',color:'#ff0000',event:{type:'choice',lines:[{text:'心魔在笑。队友们的幻象在逼近。弗莱迪在欢呼。',speaker:'旁白'},{text:'郑吒闭上了眼睛。他拔出了武器——指向自己的心脏。',speaker:'旁白'},{text:'"如果我不再恐惧死亡——你还能拿什么来吓我？"',speaker:'郑吒'}],choices:[{text:'刺穿自己的心脏 (ATK+15, CRT+10, MaxHP+80)',flag:'heart_pierced',effect:{atk:15,crt:10,maxHp:80,description:'郑吒破除心魔——不再恐惧死亡。'}},{text:'正面迎战心魔 (DEF+12, SPD+6, MaxHP+40)',flag:'face_demon',effect:{def:12,spd:6,maxHp:40,description:'正面迎战心魔——用实力证明一切。'}}],flag:'suicide_choice_done'}},
{type:ENTITY_TYPE.BOSS,id:'boss_freddy',bossId:'freddy_krueger',traits:['swift','enrage'],name:'弗莱迪·克鲁格',x:10,y:5,sprite:'🔪',color:'#ff2222',hp:380,atk:46,def:16,spd:18,damageType:'psychic',weaknesses:['fire','spirit'],rewards:{exp:400,gold:280,rewardPoints:600},lore:'猛鬼街的噩梦之主。在梦境中近乎全能。只有不再恐惧的人才能伤害他。'},
{type:ENTITY_TYPE.EVENT,id:'ch11_ending',name:'第十一章结算',x:10,y:3,sprite:'✦',color:'#ffdd88',event:{type:'chapter_end',lines:[{text:'三个世界全部通关。弗莱迪被击败。心魔被破除。',speaker:'旁白'},{text:'郑吒的眼中燃烧着决意——那是即将觉醒的力量。',speaker:'旁白'},{text:'第十一关「心魔终破」通关。获得基础奖励1200点。',speaker:'主神'}],flag:'ch11_complete',rewards:{rewardPoints:1200}}},
{type:ENTITY_TYPE.ITEM,id:'medkit_11_6',name:'觉醒药剂',x:1,y:8,sprite:'♥',color:'#ffdd44',itemType:'consumable',effect:{heal:200}},
{type:ENTITY_TYPE.ITEM,id:'res_ch11',name:'心灵屏障',x:19,y:8,sprite:'🛡',color:'#aa88ff',itemType:'stat_boost',effect:{res:10}},
]};}

export function generateChapter11(){return{name:'第十一章 · 心魔终破',world:'变形金刚/猛鬼街/天煞',floors:[f11_1(),f11_2(),f11_3(),f11_4(),f11_5(),f11_6()]};}
