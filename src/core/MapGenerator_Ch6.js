// ═══════════════════════════════════════════════════════════════
// 第六章 · 异形再临 — 六节点地图生成
// 核心机制：队长视野/异形进化/医疗救援/分区封锁
// ═══════════════════════════════════════════════════════════════
import { TILE, ENTITY_TYPE } from './constants.js';
const W = 21, H = 17;
function makeGrid(fill = TILE.WALL) { return Array.from({ length: H }, () => Array(W).fill(fill)); }
function carveRoom(g, x1, y1, x2, y2) { for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) if (y>=0&&y<H&&x>=0&&x<W) g[y][x] = TILE.FLOOR; }
function carveCorridor(g, x1, y1, x2, y2) { let cx=x1,cy=y1; while(cx!==x2){g[cy][cx]=TILE.FLOOR;cx+=cx<x2?1:-1;} while(cy!==y2){g[cy][cx]=TILE.FLOOR;cy+=cy<y2?1:-1;} g[cy][cx]=TILE.FLOOR; }

function generateFloor_6_1() {
  const g = makeGrid(); carveRoom(g,1,7,6,10); carveCorridor(g,6,8,10,8); carveRoom(g,10,5,16,11); carveCorridor(g,16,8,19,8); carveRoom(g,16,6,19,10); carveRoom(g,3,1,8,5); carveCorridor(g,5,5,5,7); carveRoom(g,10,13,16,16); carveCorridor(g,13,11,13,13); g[15][15]=TILE.STAIRS;
  return { id:'6-1', name:'实验船醒来', subtitle:'你们在一艘废弃的太空实验船上醒来。这是……异形四号的世界。', bgColor:'#080812', theme:'alien_ship', tiles:g, width:W, height:H, playerStart:{x:3,y:8}, entities:[
    { type:ENTITY_TYPE.EVENT, id:'ch6_intro', name:'异形再临传送', x:4,y:8, sprite:'✦', color:'#ffffff', event:{type:'dialogue',lines:[
      {text:'又一次传送。但这次的飞船……充满了不祥的气息。',speaker:'旁白'},
      {text:'这是USM Auriga号。异形克隆实验船。',speaker:'赵樱空'},
      {text:'程啸？你是新来的？',speaker:'郑吒'},
      {text:'程啸。武器专家。别担心，我比看起来靠谱。',speaker:'程啸'},
      {text:'作为新队长，郑吒开始系统地分配任务和制定战术。',speaker:'旁白'},
      {text:'（队长视野已激活。郑吒可以查看更多战场信息。）',speaker:'主神'}]}},
    { type:ENTITY_TYPE.COMPANION, id:'cheng_xiao', name:'程啸', x:2,y:8, sprite:'啸', color:'#cc8844', dialogue:[{text:'程啸加入了队伍！',speaker:'系统'},{text:'（被动效果：武器专家 — ATK+3, CRT+2）',speaker:'系统'}], companionData:{id:'cheng_xiao',name:'程啸',passive:{atk:3,crt:2},alive:true}},
    { type:ENTITY_TYPE.ENEMY, id:'xeno_v4_1', name:'异形幼体', x:13,y:8, sprite:'🦎', color:'#446644', hp:55, atk:18, def:5, spd:12, acidBlood:8, rewards:{exp:40,gold:30}},
    { type:ENTITY_TYPE.ENEMY, id:'xeno_v4_2', name:'异形幼体', x:6,y:3, sprite:'🦎', color:'#446644', hp:55, atk:18, def:5, spd:12, acidBlood:8, rewards:{exp:40,gold:30}},
    { type:ENTITY_TYPE.ITEM, id:'medkit_ch6_1', name:'急救包', x:14,y:14, sprite:'♥', color:'#ff4488', itemType:'consumable', effect:{heal:60}},
    { type:ENTITY_TYPE.ITEM, id:'atk_crystal_ch6_1', name:'力量结晶', x:18,y:7, sprite:'◆', color:'#ff8844', itemType:'stat_boost', effect:{atk:4}}]};
}

function generateFloor_6_2() {
  const g = makeGrid(); carveRoom(g,1,1,7,6); carveCorridor(g,7,3,10,3); carveRoom(g,10,1,16,6); carveCorridor(g,13,6,13,9); carveRoom(g,10,9,16,13); carveRoom(g,1,9,7,13); carveCorridor(g,4,6,4,9); carveCorridor(g,7,11,10,11); carveRoom(g,16,10,19,15); carveCorridor(g,16,12,16,12); g[14][18]=TILE.STAIRS;
  return { id:'6-2', name:'新人筛选', subtitle:'作为队长，郑吒必须评估每个人的能力和心理素质。', bgColor:'#080810', theme:'alien_ship', tiles:g, width:W, height:H, playerStart:{x:4,y:3}, entities:[
    { type:ENTITY_TYPE.EVENT, id:'screening', name:'新人筛选', x:13,y:3, sprite:'📋', color:'#88aaff', event:{type:'dialogue',lines:[
      {text:'郑吒把所有人集合起来，逐一了解每人的能力。',speaker:'旁白'},
      {text:'从今天起，我来安排战术部署。每个人按照自己的特长行动。',speaker:'郑吒'},
      {text:'（队长指令系统强化。队友被动效果提升10%。）',speaker:'主神'}],flag:'screening_done'}},
    { type:ENTITY_TYPE.ENEMY, id:'xeno_worker_1', name:'异形工蜂', x:13,y:11, sprite:'🐛', color:'#558844', hp:60, atk:20, def:6, spd:10, acidBlood:10, rewards:{exp:45,gold:30}},
    { type:ENTITY_TYPE.ENEMY, id:'xeno_worker_2', name:'异形工蜂', x:4,y:11, sprite:'🐛', color:'#558844', hp:60, atk:20, def:6, spd:10, acidBlood:10, rewards:{exp:45,gold:30}},
    { type:ENTITY_TYPE.ITEM, id:'medkit_ch6_2', name:'急救包', x:18,y:12, sprite:'♥', color:'#ff4488', itemType:'consumable', effect:{heal:60}},
    { type:ENTITY_TYPE.ITEM, id:'def_crystal_ch6_2', name:'防御结晶', x:3,y:1, sprite:'◆', color:'#6688ff', itemType:'stat_boost', effect:{def:4}},
  
      // 环境线索
      { type: ENTITY_TYPE.ITEM, id: 'lore_ch6_f2', name: '皇后进化记录',
        x: 5, y: 5, sprite: '👑', color: '#ffaa00',
        itemType: 'lore', loreId: 'lore_6_queen',
        description: '一份来自科研部门的紧急报告，纸张被抓出了爪痕。',
      }]};
}

function generateFloor_6_3() {
  const g = makeGrid(); carveRoom(g,1,1,5,5); carveCorridor(g,5,3,9,3); carveRoom(g,9,1,14,5); carveCorridor(g,11,5,11,9); carveRoom(g,8,9,14,13); carveRoom(g,1,8,6,12); carveCorridor(g,4,5,4,8); carveCorridor(g,6,10,8,10); carveRoom(g,15,9,19,14); carveCorridor(g,14,11,15,11); g[13][18]=TILE.STAIRS;
  return { id:'6-3', name:'感染隔离', subtitle:'船上有人被异形寄生了。必须在破体而出之前隔离感染者。', bgColor:'#0a0810', theme:'alien_lab', tiles:g, width:W, height:H, playerStart:{x:3,y:3}, entities:[
    { type:ENTITY_TYPE.EVENT, id:'infection', name:'感染警报', x:11,y:3, sprite:'⚠', color:'#ff4444', event:{type:'dialogue',lines:[
      {text:'医疗扫描显示：有两名新人体内检测到异形胚胎。',speaker:'旁白'},
      {text:'隔离！立刻隔离！赵樱空，用精神力确认感染状态！',speaker:'郑吒'},
      {text:'确认了。他们还有时间——但必须尽快找到医疗设备。',speaker:'赵樱空'}],flag:'infection_alert'}},
    { type:ENTITY_TYPE.ENEMY, id:'chestburster', name:'破体异形', x:11,y:11, sprite:'🐍', color:'#664422', hp:40, atk:24, def:2, spd:15, acidBlood:12, rewards:{exp:40,gold:25}},
    { type:ENTITY_TYPE.ENEMY, id:'xeno_drone_1', name:'异形无人机', x:4,y:10, sprite:'🦟', color:'#445544', hp:50, atk:19, def:4, spd:13, acidBlood:8, rewards:{exp:40,gold:30}},
    { type:ENTITY_TYPE.ITEM, id:'medkit_ch6_3', name:'大型急救包', x:17,y:12, sprite:'♥', color:'#ff4488', itemType:'consumable', effect:{heal:80}},
    { type:ENTITY_TYPE.ITEM, id:'antiacid_chip', name:'高级抗酸芯片', x:2,y:10, sprite:'💎', color:'#44cc88', itemType:'chip', chip:{id:'acid_resist_v2',name:'抗酸+',stat:'def',value:5,special:'acid_resist'}}]};
}

function generateFloor_6_4() {
  const g = makeGrid(); carveRoom(g,1,6,5,10); carveCorridor(g,5,8,9,8); carveRoom(g,9,4,14,12); carveCorridor(g,14,8,18,8); carveRoom(g,15,5,19,11); carveRoom(g,6,1,11,3); carveCorridor(g,9,3,9,4); carveRoom(g,7,13,13,16); carveCorridor(g,10,12,10,13); g[15][12]=TILE.STAIRS;
  return { id:'6-4', name:'水下通道', subtitle:'前方的通道被水淹没了。异形在水中更加危险。', bgColor:'#060810', theme:'alien_water', tiles:g, width:W, height:H, playerStart:{x:3,y:8}, entities:[
    { type:ENTITY_TYPE.ENEMY, id:'xeno_swimmer_1', name:'水生异形', x:11,y:8, sprite:'🦈', color:'#336655', hp:70, atk:22, def:7, spd:11, acidBlood:10, weaknesses:['fire'], rewards:{exp:50,gold:35}},
    { type:ENTITY_TYPE.ENEMY, id:'xeno_swimmer_2', name:'水生异形', x:17,y:8, sprite:'🦈', color:'#336655', hp:70, atk:22, def:7, spd:11, acidBlood:10, weaknesses:['fire'], rewards:{exp:50,gold:35}},
    { type:ENTITY_TYPE.ENEMY, id:'xeno_drone_2', name:'异形猎手', x:9,y:1, sprite:'🐛', color:'#445544', hp:65, atk:24, def:6, spd:12, acidBlood:10, rewards:{exp:50,gold:35}},
    { type:ENTITY_TYPE.ITEM, id:'medkit_ch6_4', name:'急救包', x:10,y:14, sprite:'♥', color:'#ff4488', itemType:'consumable', effect:{heal:70}},
    { type:ENTITY_TYPE.ITEM, id:'spd_crystal_ch6_4', name:'速度结晶', x:18,y:6, sprite:'◆', color:'#44ffaa', itemType:'stat_boost', effect:{spd:3}}]};
}

function generateFloor_6_5() {
  const g = makeGrid(); carveRoom(g,1,1,6,5); carveCorridor(g,6,3,10,3); carveRoom(g,10,1,16,6); carveCorridor(g,13,6,13,10); carveRoom(g,9,10,16,14); carveRoom(g,1,8,7,13); carveCorridor(g,4,5,4,8); carveCorridor(g,7,12,9,12); carveRoom(g,16,11,19,15); carveCorridor(g,16,13,16,13); g[14][18]=TILE.STAIRS;
  return { id:'6-5', name:'程啸救援', subtitle:'程啸被困在了异形巢穴深处。作为队长，郑吒必须去救他。', bgColor:'#0a0808', theme:'alien_hive', tiles:g, width:W, height:H, playerStart:{x:3,y:3}, entities:[
    { type:ENTITY_TYPE.EVENT, id:'ch6_rescue_choice', name:'救援决策', x:6,y:3, sprite:'?', color:'#ffcc44', event:{type:'choice',lines:[
      {text:'程啸被困在水下通道。时间不多了。',speaker:'旁白'},
      {text:'分队去救，主力会削弱。不救的话……',speaker:'郑吒'}],
      choices:[
        {id:'rescue',text:'全力救援程啸',effect:{hp:20,description:'没有人会被抛下',allRelationship:'save_life'}},
        {id:'mission',text:'以大局为重，继续推进',effect:{atk:4,description:'理性的选择',relationship:{chuxuan:'good_decision'}}},
        {id:'volunteer',text:'我一个人去，你们继续',effect:{spd:3,def:2,description:'独自完成不可能的任务',allRelationship:'protect_weak'}}],
      flag:'ch6_rescue_done'}},
    { type:ENTITY_TYPE.EVENT, id:'rescue_chengxiao', name:'程啸求救', x:4,y:3, sprite:'📡', color:'#cc8844', event:{type:'dialogue',lines:[
      {text:'通讯频道传来程啸断断续续的声音。',speaker:'旁白'},
      {text:'队长……这里到处都是蛋。我……我被黏住了。',speaker:'程啸'},
      {text:'坚持住！我来了！',speaker:'郑吒'}],flag:'rescue_start'}},
    { type:ENTITY_TYPE.ENEMY, id:'xeno_guard_1', name:'异形禁卫', x:13,y:3, sprite:'🦎', color:'#557744', hp:80, atk:24, def:8, spd:10, acidBlood:12, rewards:{exp:55,gold:40}},
    { type:ENTITY_TYPE.ENEMY, id:'xeno_guard_2', name:'异形禁卫', x:12,y:12, sprite:'🦎', color:'#557744', hp:80, atk:24, def:8, spd:10, acidBlood:12, rewards:{exp:55,gold:40}},
    { type:ENTITY_TYPE.ENEMY, id:'egg_cluster', name:'异形卵囊群', x:4,y:11, sprite:'🥚', color:'#665544', hp:30, atk:15, def:2, spd:5, rewards:{exp:25,gold:15}},
    { type:ENTITY_TYPE.ITEM, id:'medkit_ch6_5', name:'急救包', x:18,y:13, sprite:'♥', color:'#ff4488', itemType:'consumable', effect:{heal:70}},
    { type:ENTITY_TYPE.ITEM, id:'crt_crystal_ch6_5', name:'暴击结晶', x:2,y:10, sprite:'◆', color:'#ffcc44', itemType:'stat_boost', effect:{crt:4}},
      {type:ENTITY_TYPE.ITEM,id:'set_motion_tracker',name:'动态追踪器',x:14,y:3,sprite:'💍',color:'#44ddff',
       itemType:'accessory',accessory:{name:'动态追踪器',spd:3,crt:5,setId:'motion_tracker',slot:'accessory',
       description:'能感知附近一切生命活动的追踪装置。'}},
    
      // 环境线索
      { type: ENTITY_TYPE.ITEM, id: 'lore_ch6_f5', name: '设施警告',
        x: 5, y: 5, sprite: '🚨', color: '#ff4444',
        itemType: 'lore', loreId: 'lore_6_facility',
        description: '墙上的紧急广播终端仍在循环播放。',
      }]};
}

function generateFloor_6_6() {
  const g = makeGrid(); carveRoom(g,6,5,14,12); carveRoom(g,1,7,5,10); carveCorridor(g,5,8,6,8); carveRoom(g,15,7,19,10); carveCorridor(g,14,8,15,8); carveRoom(g,8,1,12,4); carveCorridor(g,10,4,10,5); carveRoom(g,8,13,12,16); carveCorridor(g,10,12,10,13); g[1][11]=TILE.STAIRS;
  return { id:'6-6', name:'新生异形与逃生艇', subtitle:'新生异形——人类与异形的混合体。它比任何异形都更聪明、更危险。', bgColor:'#100808', theme:'alien_hive', tiles:g, width:W, height:H, playerStart:{x:10,y:15}, entities:[
    { type:ENTITY_TYPE.EVENT, id:'newborn_intro', name:'新生异形出现', x:10,y:14, sprite:'⚔', color:'#ffcc44', event:{type:'dialogue',lines:[
      {text:'巢穴最深处，一个从未见过的生物缓缓站起。它有着人类的体型……和异形的力量。',speaker:'旁白'},
      {text:'新生异形。人类基因和异形基因的完美融合。',speaker:'赵樱空'},
      {text:'击败它，然后登上逃生艇！',speaker:'郑吒'}],flag:'newborn_intro_done'}},
    { type:ENTITY_TYPE.ENEMY, id:'xeno_elite', name:'异形禁卫', x:3,y:8, sprite:'🦎', color:'#557744', hp:80, atk:24, def:8, spd:10, acidBlood:12, rewards:{exp:55,gold:40}},
    { type:ENTITY_TYPE.ENEMY, id:'xeno_elite_2', name:'异形禁卫', x:17,y:8, sprite:'🦎', color:'#557744', hp:80, atk:24, def:8, spd:10, acidBlood:12, rewards:{exp:55,gold:40}},
    { type:ENTITY_TYPE.BOSS, id:'boss_newborn',bossId:'evolved_queen',traits:['thorns','enrage'],damageType:'poison', name:'新生异形', x:10,y:7, sprite:'👾', color:'#884422', hp:280, atk:32, def:12, spd:13, acidBlood:20, weaknesses:['fire'], rewards:{exp:250,gold:150,rewardPoints:400}, lore:'人类与异形的混合体。极高攻击力和酸血伤害。火焰是弱点。'},
    { type:ENTITY_TYPE.ITEM, id:'medkit_ch6_6', name:'高级急救包', x:8,y:5, sprite:'♥', color:'#ff4488', itemType:'consumable', effect:{heal:100}},
    // 重生十字勋章
    { type:ENTITY_TYPE.EVENT, id:'ch6_ending', name:'第六章结算', x:10,y:2, sprite:'✦', color:'#ffdd88', event:{type:'chapter_end',lines:[
      {text:'新生异形被击败了。逃生艇成功脱离。',speaker:'旁白'},
      {text:'在飞船残骸中，赵樱空找到了一枚金色十字勋章——重生十字勋章。',speaker:'旁白'},
      {text:'有了这个……加上复活真经……我们可以复活已故的队友。',speaker:'郑吒'},
      {text:'作为队长，郑吒第一次成功带领全队无人阵亡地完成了任务。',speaker:'旁白'},
      {text:'第六关「异形再临」通关。获得基础奖励1000点。获得关键道具「重生十字勋章」。',speaker:'主神'}],flag:'ch6_complete',rewards:{rewardPoints:1000}}}]};
}

export function generateChapter6() {
  return { name:'第六章 · 异形再临', world:'异形四', floors:[
    generateFloor_6_1(), generateFloor_6_2(), generateFloor_6_3(),
    generateFloor_6_4(), generateFloor_6_5(), generateFloor_6_6()]};
}
