// ═══════════════════════════════════════════════════════════════
// 第三章 · 咒怨阴影 — 六节点地图生成
// 核心机制：诅咒计数/灵类伤害/分队救援/不可击杀追猎
// ═══════════════════════════════════════════════════════════════

import { TILE, ENTITY_TYPE } from './constants.js';

const W = 21, H = 17;

function makeGrid(fill = TILE.WALL) {
  return Array.from({ length: H }, () => Array(W).fill(fill));
}

function carveRoom(grid, x1, y1, x2, y2) {
  for (let y = y1; y <= y2; y++)
    for (let x = x1; x <= x2; x++)
      if (y >= 0 && y < H && x >= 0 && x < W) grid[y][x] = TILE.FLOOR;
}

function carveCorridor(grid, x1, y1, x2, y2) {
  let cx = x1, cy = y1;
  while (cx !== x2) { grid[cy][cx] = TILE.FLOOR; cx += cx < x2 ? 1 : -1; }
  while (cy !== y2) { grid[cy][cx] = TILE.FLOOR; cy += cy < y2 ? 1 : -1; }
  grid[cy][cx] = TILE.FLOOR;
}

// ── 3-1 宅邸触发诅咒 ──
function generateFloor_3_1() {
  const grid = makeGrid();
  // 日式宅邸布局 — 玄关→走廊→大厅→楼梯
  carveRoom(grid, 1, 12, 5, 15);    // 玄关
  carveCorridor(grid, 3, 12, 3, 8); // 玄关走廊
  carveRoom(grid, 1, 5, 7, 9);      // 和室（大厅）
  carveCorridor(grid, 7, 7, 12, 7); // 横向走廊
  carveRoom(grid, 12, 4, 17, 10);   // 客厅
  carveCorridor(grid, 14, 4, 14, 2);// 上楼梯
  carveRoom(grid, 12, 1, 17, 3);    // 二楼走廊
  // 侧房
  carveRoom(grid, 8, 11, 12, 14);   // 厨房
  carveCorridor(grid, 10, 11, 10, 9);// 厨房连接
  carveCorridor(grid, 10, 9, 12, 9); 
  // 密室
  carveRoom(grid, 17, 12, 19, 15);  // 储藏室
  carveCorridor(grid, 17, 13, 14, 13);
  carveCorridor(grid, 14, 10, 14, 13);

  grid[1][16] = TILE.STAIRS;

  return {
    id: '3-1', name: '宅邸触发诅咒',
    subtitle: '推开那扇门的瞬间，一股阴冷从脚底升起。这座日式宅邸已经等待你们很久了。',
    bgColor: '#0a0a14', theme: 'juon_house',
    tiles: grid, width: W, height: H, playerStart: { x: 3, y: 14 },
    onClear: { message: '诅咒的气息越来越浓。必须在天亮前找到佛经……' },
    entities: [
      // 开场对话
      { type: ENTITY_TYPE.EVENT, id: 'ch3_intro', name: '咒怨世界传送',
        x: 3, y: 13, sprite: '✦', color: '#ffffff',
        event: {
          type: 'dialogue',
          lines: [
            { text: '白光消散，你们站在一条阴暗的日本住宅街上。空气中弥漫着潮湿和陈旧的气味。', speaker: '旁白' },
            { text: '这次的队伍比之前更大了……多了几个新面孔。', speaker: '旁白' },
            { text: '我叫赵樱空。能力是——精神力感应。我已经感受到这栋房子里有极其可怕的东西。', speaker: '赵樱空' },
            { text: '齐腾一。远程射手。别把我跟新人混在一起。', speaker: '齐腾一' },
            { text: '铭烟薇，我……我会尽量不拖后腿的。', speaker: '铭烟薇' },
            { text: '所有人注意——这个世界的敌人是灵体。物理攻击效果极差，需要灵类弹药或特殊手段。', speaker: '楚轩' },
            { text: '（主神提示：诅咒计数已启动。每经过一定回合，诅咒等级提升，灵体力量增强。）', speaker: '主神' }],
        },
      },
      // 赵樱空入队
      { type: ENTITY_TYPE.COMPANION, id: 'zhao_yingkong', name: '赵樱空',
        x: 4, y: 14, sprite: '赵', color: '#ff88cc',
        dialogue: [
          { text: '赵樱空加入了队伍！', speaker: '系统' },
          { text: '（被动效果：精神感应 — CRT+3，可感知隐藏灵体）', speaker: '系统' }],
        companionData: { id: 'zhao_yingkong', name: '赵樱空', passive: { crt: 3 }, alive: true },
      },
      // 齐腾一入队
      { type: ENTITY_TYPE.COMPANION, id: 'qi_tengyi', name: '齐腾一',
        x: 2, y: 14, sprite: '齐', color: '#88ccff',
        dialogue: [
          { text: '齐腾一加入了队伍！', speaker: '系统' },
          { text: '（被动效果：精确射击 — ATK+2，远程伤害加成）', speaker: '系统' }],
        companionData: { id: 'qi_tengyi', name: '齐腾一', passive: { atk: 2 }, alive: true },
      },
      // 灵体敌人 — 物理减伤
      { type: ENTITY_TYPE.ENEMY, id: 'ghost_child_1', name: '怨念童灵',
        x: 4, y: 7, sprite: '👻', color: '#aabbff',
        hp: 30, atk: 10, def: 2, spd: 7,
        damageType: 'spirit', weaknesses: ['spirit'],
        physicalResist: 0.5, // 物理伤害减半
        rewards: { exp: 20, gold: 15 },
      },
      { type: ENTITY_TYPE.ENEMY, id: 'ghost_child_2', name: '游荡幽影',
        x: 14, y: 6, sprite: '👤', color: '#8899cc',
        hp: 35, atk: 12, def: 3, spd: 8,
        damageType: 'spirit', weaknesses: ['spirit'],
        physicalResist: 0.5,
        rewards: { exp: 25, gold: 20 },
      },
      // 灵类弹药
      { type: ENTITY_TYPE.ITEM, id: 'spirit_ammo_1', name: '灵力弹匣',
        x: 10, y: 12, sprite: '🔮', color: '#aa88ff',
        itemType: 'ammo', effect: { ammo: 10 },
      },
      // 恢复
      { type: ENTITY_TYPE.ITEM, id: 'medkit_ch3_1', name: '急救包',
        x: 18, y: 14, sprite: '♥', color: '#ff4488',
        itemType: 'consumable', effect: { heal: 40 },
      },
      // 诅咒事件
      { type: ENTITY_TYPE.EVENT, id: 'curse_trigger_1', name: '诅咒触发',
        x: 15, y: 7, sprite: '☠', color: '#ff4444',
        event: {
          type: 'dialogue',
          lines: [
            { text: '你触碰了壁柜上的录像带。一股阴寒刺入脑海。', speaker: '旁白' },
            { text: '「——不要进来。」', speaker: '???' },
            { text: '所有人的手腕上出现了淡淡的黑色纹路。诅咒已经开始了。', speaker: '旁白' },
            { text: '（诅咒等级 +1。灵体敌人攻击力将随诅咒等级提升。）', speaker: '主神' }],
          flag: 'curse_level_1',
          rewards: { curseLevelUp: true },
        },
      },
      // ATK晶石
      { type: ENTITY_TYPE.ITEM, id: 'atk_crystal_ch3_1', name: '力量结晶',
        x: 14, y: 2, sprite: '◆', color: '#ff8844',
        itemType: 'stat_boost', effect: { atk: 3 },
      }],
  };
}

// ── 3-2 第一夜分散 ──
function generateFloor_3_2() {
  const grid = makeGrid();
  // 宅邸二楼 — 多房间、走廊分支
  carveRoom(grid, 1, 1, 5, 5);      // 左上卧室
  carveRoom(grid, 8, 1, 12, 5);     // 右上客房
  carveRoom(grid, 15, 1, 19, 5);    // 最右储物间
  carveCorridor(grid, 3, 5, 3, 8);  // 左走廊
  carveCorridor(grid, 10, 5, 10, 8);// 中走廊
  carveCorridor(grid, 17, 5, 17, 8);// 右走廊
  carveRoom(grid, 1, 8, 19, 10);    // 长走廊
  carveRoom(grid, 1, 12, 7, 15);    // 左下浴室
  carveCorridor(grid, 4, 10, 4, 12);
  carveRoom(grid, 10, 12, 15, 15);  // 下方祭室
  carveCorridor(grid, 12, 10, 12, 12);
  carveRoom(grid, 17, 12, 19, 15);  // 右下杂物间
  carveCorridor(grid, 18, 10, 18, 12);

  grid[14][12] = TILE.STAIRS;

  return {
    id: '3-2', name: '第一夜分散',
    subtitle: '夜幕降临。宅邸内的温度在下降。有什么东西……在移动。',
    bgColor: '#080810', theme: 'juon_house',
    tiles: grid, width: W, height: H, playerStart: { x: 3, y: 3 },
    onClear: { message: '第一夜过去了。但诅咒不会停止。' },
    entities: [
      // 分散事件
      { type: ENTITY_TYPE.EVENT, id: 'night_scatter', name: '夜间分散',
        x: 3, y: 4, sprite: '☽', color: '#aaaacc',
        event: {
          type: 'dialogue',
          lines: [
            { text: '走廊尽头的灯突然全灭了。黑暗中传来嘎吱嘎吱的声音。', speaker: '旁白' },
            { text: '所有人注意！不要分散！', speaker: '郑吒' },
            { text: '但已经太迟了。新人们慌乱中各自跑向了不同的房间。', speaker: '旁白' },
            { text: '……分队救援机制已激活。你需要逐个房间搜索失散的队友。', speaker: '主神' }],
          flag: 'night_scatter_done',
        },
      },
      // 铭烟薇（可救/不可救取决于是否及时到达）
      { type: ENTITY_TYPE.COMPANION, id: 'ming_yanwei', name: '铭烟薇',
        x: 2, y: 13, sprite: '铭', color: '#ffaadd',
        dialogue: [
          { text: '铭烟薇暂时加入队伍！', speaker: '系统' },
          { text: '她在发抖，但还是紧紧跟在你身后。', speaker: '旁白' },
          { text: '（被动效果：鼓舞 — 全队MaxHP+10）', speaker: '系统' }],
        companionData: { id: 'ming_yanwei', name: '铭烟薇', passive: { maxHp: 10 }, alive: true },
      },
      // 灵体
      { type: ENTITY_TYPE.ENEMY, id: 'cursed_shadow_1', name: '诅咒阴影',
        x: 10, y: 3, sprite: '🌑', color: '#554477',
        hp: 40, atk: 14, def: 3, spd: 9,
        damageType: 'spirit', weaknesses: ['spirit'],
        physicalResist: 0.5,
        rewards: { exp: 30, gold: 20 },
      },
      { type: ENTITY_TYPE.ENEMY, id: 'cursed_shadow_2', name: '诅咒阴影',
        x: 17, y: 3, sprite: '🌑', color: '#554477',
        hp: 40, atk: 14, def: 3, spd: 9,
        damageType: 'spirit', weaknesses: ['spirit'],
        physicalResist: 0.5,
        rewards: { exp: 30, gold: 20 },
      },
      { type: ENTITY_TYPE.ENEMY, id: 'hair_ghost', name: '长发怨灵',
        x: 18, y: 14, sprite: '👩', color: '#442244',
        hp: 50, atk: 16, def: 4, spd: 10,
        damageType: 'spirit', weaknesses: ['spirit'],
        physicalResist: 0.5,
        rewards: { exp: 35, gold: 25 },
      },
      // 佛珠（灵类减伤饰品）
      { type: ENTITY_TYPE.ITEM, id: 'buddhist_beads', name: '佛珠',
        x: 11, y: 14, sprite: '📿', color: '#ffdd88',
        itemType: 'accessory',
        accessory: { name: '佛珠', def: 3, spiritResist: 20, crt: 2 },
      },
      // 恢复
      { type: ENTITY_TYPE.ITEM, id: 'medkit_ch3_2', name: '急救包',
        x: 5, y: 1, sprite: '♥', color: '#ff4488',
        itemType: 'consumable', effect: { heal: 50 },
      },
      // DEF晶石
      { type: ENTITY_TYPE.ITEM, id: 'def_crystal_ch3_2', name: '防御结晶',
        x: 17, y: 9, sprite: '◆', color: '#6688ff',
        itemType: 'stat_boost', effect: { def: 3 },
      }],
  };
}

// ── 3-3 佛经线索 ──
function generateFloor_3_3() {
  const grid = makeGrid();
  // 宅邸地下室 — 暗通道+祭坛
  carveRoom(grid, 1, 1, 5, 4);     // 入口
  carveCorridor(grid, 5, 2, 9, 2); // 窄道
  carveRoom(grid, 9, 1, 13, 4);    // 书库
  carveCorridor(grid, 11, 4, 11, 8); // 下行
  carveRoom(grid, 8, 8, 14, 12);   // 祭坛厅
  carveCorridor(grid, 14, 10, 18, 10); // 右通道
  carveRoom(grid, 16, 8, 19, 13);  // 佛堂
  carveCorridor(grid, 4, 4, 4, 8);
  carveRoom(grid, 1, 8, 6, 11);    // 左储藏
  carveCorridor(grid, 3, 11, 3, 14);
  carveRoom(grid, 1, 14, 6, 16);   // 下左暗室

  grid[16][5] = TILE.STAIRS;

  return {
    id: '3-3', name: '佛经线索',
    subtitle: '地下室的墙壁上刻满了梵文。楚轩的眼神亮了起来——这是破解诅咒的关键。',
    bgColor: '#0a0810', theme: 'juon_basement',
    tiles: grid, width: W, height: H, playerStart: { x: 3, y: 2 },
    onClear: { message: '佛经上的文字若隐若现，似乎在指引方向。' },
    entities: [
      // 佛经发现事件
      { type: ENTITY_TYPE.EVENT, id: 'sutra_discovery', name: '佛经发现',
        x: 11, y: 2, sprite: '📖', color: '#ffdd88',
        event: {
          type: 'dialogue',
          lines: [
            { text: '书架上有一本被翻阅过无数次的佛经。书页间夹着手写的笔记。', speaker: '旁白' },
            { text: '这是……上一批被诅咒的人留下的。他们找到了对抗诅咒的方法。', speaker: '楚轩' },
            { text: '「伽椰子的诅咒源于极端的怨念。唯有以同等的精神力正面压制，方能暂时封印。」', speaker: '佛经笔记' },
            { text: '七波诅咒……终战时的关键情报已记录。', speaker: '楚轩' },
            { text: '（获得「佛经笔记」— 终战时可依此找到真正的出口。）', speaker: '主神' }],
          flag: 'sutra_found',
        },
      },
      // 灵体
      { type: ENTITY_TYPE.ENEMY, id: 'basement_ghost_1', name: '地缚灵',
        x: 11, y: 10, sprite: '💀', color: '#667788',
        hp: 45, atk: 15, def: 4, spd: 6,
        damageType: 'spirit', weaknesses: ['spirit'],
        physicalResist: 0.5,
        rewards: { exp: 35, gold: 25 },
      },
      { type: ENTITY_TYPE.ENEMY, id: 'basement_ghost_2', name: '暗域怨灵',
        x: 3, y: 10, sprite: '👁', color: '#775566',
        hp: 50, atk: 16, def: 5, spd: 7,
        damageType: 'spirit', weaknesses: ['spirit'],
        physicalResist: 0.5,
        rewards: { exp: 40, gold: 30 },
      },
      // 诅咒升级事件
      { type: ENTITY_TYPE.EVENT, id: 'curse_trigger_2', name: '诅咒加深',
        x: 17, y: 11, sprite: '☠', color: '#ff4444',
        event: {
          type: 'dialogue',
          lines: [
            { text: '祭坛上的蜡烛突然自燃。空气中弥漫着不祥的气息。', speaker: '旁白' },
            { text: '手腕上的黑色纹路更深了。诅咒在加速。', speaker: '旁白' },
            { text: '（诅咒等级 +1。灵体力量再次增强。）', speaker: '主神' }],
          flag: 'curse_level_2',
        },
      },
      // 灵力芯片
      { type: ENTITY_TYPE.ITEM, id: 'chip_spirit', name: '灵力芯片',
        x: 18, y: 9, sprite: '💎', color: '#aa88ff',
        itemType: 'chip',
        chip: { id: 'spirit', name: '灵', stat: 'atk', value: 4, damageType: 'spirit' },
      },
      // 回复
      { type: ENTITY_TYPE.ITEM, id: 'medkit_ch3_3', name: '急救包',
        x: 2, y: 15, sprite: '♥', color: '#ff4488',
        itemType: 'consumable', effect: { heal: 50 },
      },
      // SPD晶石
      { type: ENTITY_TYPE.ITEM, id: 'spd_crystal_ch3_3', name: '速度结晶',
        x: 5, y: 4, sprite: '◆', color: '#44ffaa',
        itemType: 'stat_boost', effect: { spd: 3 },
      },
      // 除灵师日记线索
      { type: ENTITY_TYPE.ITEM, id: 'lore_curse', name: '除灵师的日记',
        x: 19, y: 9, sprite: '📖', color: '#ffdd44',
        itemType: 'lore', loreId: 'lore_3_curse',
        description: '一本泛黄的日记，记录着对付诅咒的方法。',
      },
    
      // 野外商人
      { type: ENTITY_TYPE.NPC, id: 'merchant_ch3', name: '神秘行商人',
        x: 2, y: 3, sprite: '🏪', color: '#ffcc44', merchant: true,
        dialogue: [
          { text: '"这宅子里什么都有……要买点什么保命吗？"', speaker: '神秘行商人' }],
      }],
  };
}

// ── 3-4 新人冲突 ──
function generateFloor_3_4() {
  const grid = makeGrid();
  // 宅邸庭院+走廊
  carveRoom(grid, 1, 6, 8, 11);     // 大庭院
  carveCorridor(grid, 8, 8, 12, 8); // 连接走廊
  carveRoom(grid, 12, 5, 17, 11);   // 大广间
  carveRoom(grid, 1, 1, 6, 4);      // 上方房间
  carveCorridor(grid, 4, 4, 4, 6);
  carveRoom(grid, 14, 1, 19, 4);    // 右上房间
  carveCorridor(grid, 16, 4, 16, 5);
  carveRoom(grid, 9, 13, 15, 16);   // 下方暗室
  carveCorridor(grid, 12, 11, 12, 13);

  grid[15][14] = TILE.STAIRS;

  return {
    id: '3-4', name: '新人冲突',
    subtitle: '恐惧让人失去理智。新人中有人开始互相猜疑，而铭烟薇成了牺牲品。',
    bgColor: '#0c0a10', theme: 'juon_house',
    tiles: grid, width: W, height: H, playerStart: { x: 4, y: 8 },
    onClear: { message: '新人的恐惧快要失控了。必须稳住局面。' },
    entities: [
      // 新人冲突事件
      // ── 剧情选择：面对新人的态度 ──
      { type: ENTITY_TYPE.EVENT, id: 'newbie_attitude', name: '队伍分歧',
        x: 3, y: 6, sprite: '?', color: '#ffcc44',
        event: {
          type: 'choice',
          lines: [
            { text: '新来的队员情绪崩溃，抱怨张杰不该把大家带进这个鬼地方。', speaker: '旁白' },
            { text: '郑吒。你怎么看？', speaker: '张杰' }],
          choices: [
            { id: 'comfort', text: '安慰新人，分享物资',
              effect: { hp: 15, description: '你的善意稳定了队伍的士气',
                relationship: { zhang_jie: 'protect_weak', li_xiaoyi: 'honest_talk' },
                allRelationship: 'share_item' } },
            { id: 'discipline', text: '严厉训斥：死了就没有抱怨的机会了',
              effect: { atk: 3, description: '你的果断让新人闭上了嘴',
                relationship: { chuxuan: 'good_decision' } } },
            { id: 'ignore', text: '沉默不语，转身继续探索',
              effect: { spd: 2, description: '你选择了独行',
                allRelationship: 'ignore' } }],
          flag: 'newbie_attitude_chosen',
        },
      },
      { type: ENTITY_TYPE.EVENT, id: 'newbie_conflict', name: '新人冲突',
        x: 5, y: 8, sprite: '⚡', color: '#ff8844',
        event: {
          type: 'dialogue',
          lines: [
            { text: '新人们在争吵。恐惧和疲惫让他们的情绪到达了极限。', speaker: '旁白' },
            { text: '都怪你！是你非要进那个房间！现在诅咒加深了！', speaker: '新人甲' },
            { text: '够了！吵架解决不了任何问题！', speaker: '郑吒' },
            { text: '（选择：安抚新人还是严厉训斥？这将影响后续事件。）', speaker: '主神' }],
          flag: 'newbie_conflict_done',
        },
      },
      // 铭烟薇固定死亡事件
      { type: ENTITY_TYPE.EVENT, id: 'mingyanwei_death', name: '铭烟薇之死',
        x: 14, y: 8, sprite: '†', color: '#ff0000',
        event: {
          type: 'fixed_death',
          lines: [
            { text: '穿过走廊时，你们听到了铭烟薇的惨叫。', speaker: '旁白' },
            { text: '铭烟薇！！', speaker: '郑吒' },
            { text: '赶到时已经太迟了。新人中有人在混乱中推了她——直接撞进了伽椰子的诅咒领域。', speaker: '旁白' },
            { text: '铭烟薇……她的眼神还留在那个求救的姿势上。', speaker: '赵樱空' },
            { text: '（铭烟薇离队。这是不可改变的命运。）', speaker: '主神' },
            { text: '郑吒紧握拳头。「我发誓，不再让任何一个队友这样死去。」', speaker: '旁白' }],
          flag: 'mingyanwei_dead',
          companionDeath: 'ming_yanwei',
        },
      },
      // 灵体
      { type: ENTITY_TYPE.ENEMY, id: 'vengeful_spirit_1', name: '复仇怨灵',
        x: 3, y: 2, sprite: '👻', color: '#ff6688',
        hp: 55, atk: 18, def: 5, spd: 8,
        damageType: 'spirit', weaknesses: ['spirit'],
        physicalResist: 0.5,
        rewards: { exp: 40, gold: 30 },
      },
      { type: ENTITY_TYPE.ENEMY, id: 'vengeful_spirit_2', name: '怨恨残像',
        x: 16, y: 2, sprite: '💀', color: '#886644',
        hp: 60, atk: 17, def: 6, spd: 7,
        damageType: 'spirit', weaknesses: ['spirit'],
        physicalResist: 0.5,
        rewards: { exp: 45, gold: 30 },
      },
      // 不可击杀追猎者预告
      { type: ENTITY_TYPE.EVENT, id: 'stalker_warning', name: '楼梯声',
        x: 11, y: 13, sprite: '❗', color: '#ff4444',
        event: {
          type: 'dialogue',
          lines: [
            { text: '嘎……吱……嘎……吱……', speaker: '???' },
            { text: '从楼梯方向传来缓慢而沉重的爬行声。', speaker: '旁白' },
            { text: '不要回头。快走。', speaker: '楚轩' },
            { text: '（警告：伽椰子正在接近。她无法被击杀，只能逃离。）', speaker: '主神' }],
          flag: 'stalker_warned',
        },
      },
      // HP恢复
      { type: ENTITY_TYPE.ITEM, id: 'medkit_ch3_4', name: '大型急救包',
        x: 15, y: 10, sprite: '♥', color: '#ff4488',
        itemType: 'consumable', effect: { heal: 80 },
      },
      // CRT晶石
      { type: ENTITY_TYPE.ITEM, id: 'crt_crystal_ch3_4', name: '暴击结晶',
        x: 5, y: 1, sprite: '◆', color: '#ffcc44',
        itemType: 'stat_boost', effect: { crt: 4 },
      },
      { type: ENTITY_TYPE.ITEM, id: 'curse_ward_ring', name: '破咒之戒',
        x: 14, y: 5, sprite: '💍', color: '#aa66ff',
        itemType: 'accessory', accessory: { name: '破咒之戒', def: 3, res: 15, slot: 'accessory', desc: '能够部分抵御诅咒的神秘戒指' },
      },
],
  };
}

// ── 3-5 楚轩录像 ──
function generateFloor_3_5() {
  const grid = makeGrid();
  // 宅邸阁楼 — 狭窄空间+录像设备
  carveRoom(grid, 1, 1, 6, 5);      // 阁楼入口
  carveCorridor(grid, 6, 3, 10, 3); // 横道
  carveRoom(grid, 10, 1, 15, 6);    // 录像室
  carveCorridor(grid, 12, 6, 12, 10); // 下行通道
  carveRoom(grid, 9, 10, 16, 14);   // 下方暗室
  carveRoom(grid, 1, 8, 7, 12);     // 左侧密室
  carveCorridor(grid, 4, 5, 4, 8);
  carveCorridor(grid, 7, 11, 9, 11);
  carveRoom(grid, 16, 9, 19, 14);   // 右侧出口房
  carveCorridor(grid, 16, 12, 16, 12);

  grid[13][18] = TILE.STAIRS;

  return {
    id: '3-5', name: '楚轩录像',
    subtitle: '楚轩已经做好了决定。录像带中记录着他最后的分析——也是给你们最后的礼物。',
    bgColor: '#0a0812', theme: 'juon_attic',
    tiles: grid, width: W, height: H, playerStart: { x: 3, y: 3 },
    onClear: { message: '录像中的信息让一切变得清晰——该去面对伽椰子了。' },
    entities: [
      // 楚轩录像事件
      { type: ENTITY_TYPE.EVENT, id: 'chuxuan_video', name: '楚轩的录像',
        x: 12, y: 3, sprite: '📹', color: '#ffdd88',
        event: {
          type: 'dialogue',
          lines: [
            { text: '录像室的设备还在运转。屏幕上出现了楚轩的面容。', speaker: '旁白' },
            { text: '如果你们看到这段录像，说明我的计划已经启动了。', speaker: '楚轩（录像）' },
            { text: '伽椰子的弱点在于——她的怨念有极限。七波诅咒之后，她会显出真身。那是唯一的攻击窗口。', speaker: '楚轩（录像）' },
            { text: '郑吒，你的精神力足以压制她。零点的灵类狙击可以造成致命伤害。记住这两点。', speaker: '楚轩（录像）' },
            { text: '至于我选择死亡的原因……是为了积攒足够的主神奖励点。用我的死换取你们的装备升级。', speaker: '楚轩（录像）' },
            { text: '不要为我难过。这是最优解。', speaker: '楚轩（录像）' }],
          flag: 'chuxuan_video_watched',
          rewards: { rewardPoints: 500 },
        },
      },
      // 楚轩固定死亡
      { type: ENTITY_TYPE.EVENT, id: 'chuxuan_death', name: '楚轩的选择',
        x: 12, y: 5, sprite: '†', color: '#ff0000',
        event: {
          type: 'fixed_death',
          lines: [
            { text: '楚轩站在祭坛前，平静地面对着涌来的诅咒黑潮。', speaker: '旁白' },
            { text: '楚轩——！', speaker: '郑吒' },
            { text: '记住我说的话。不要浪费。', speaker: '楚轩' },
            { text: '黑潮吞没了他。楚轩的表情直到最后都没有变过。', speaker: '旁白' },
            { text: '（楚轩选择死亡。这是他计算出的最优策略。获得500奖励点。）', speaker: '主神' }],
          flag: 'chuxuan_dead',
          companionDeath: 'chuxuan',
        },
      },
      // 灵体
      { type: ENTITY_TYPE.ENEMY, id: 'attic_wraith_1', name: '阁楼恶灵',
        x: 4, y: 10, sprite: '👻', color: '#997788',
        hp: 55, atk: 19, def: 5, spd: 9,
        damageType: 'spirit', weaknesses: ['spirit'],
        physicalResist: 0.5,
        rewards: { exp: 45, gold: 30 },
      },
      { type: ENTITY_TYPE.ENEMY, id: 'attic_wraith_2', name: '暗影恶灵',
        x: 14, y: 12, sprite: '🌑', color: '#665577',
        hp: 60, atk: 20, def: 6, spd: 8,
        damageType: 'spirit', weaknesses: ['spirit'],
        physicalResist: 0.5,
        rewards: { exp: 50, gold: 35 },
      },
      // 灵类武器
      { type: ENTITY_TYPE.ITEM, id: 'spirit_blade', name: '退魔短刀',
        x: 2, y: 9, sprite: '🗡', color: '#cc88ff',
        itemType: 'weapon',
        weapon: { name: '退魔短刀', atk: 14, damageType: 'spirit', crt: 3, setId: 'imhotep_staff', slot: 'weapon' },
      },
      // HP
      { type: ENTITY_TYPE.ITEM, id: 'medkit_ch3_5', name: '急救包',
        x: 18, y: 10, sprite: '♥', color: '#ff4488',
        itemType: 'consumable', effect: { heal: 60 },
      },
    
      // 环境线索
      { type: ENTITY_TYPE.ITEM, id: 'lore_ch3_f5', name: '心理评估报告',
        x: 5, y: 5, sprite: '🧠', color: '#cc8844',
        itemType: 'lore', loreId: 'lore_3_zhengzha',
        description: '一份被折叠多次的心理评估文件。',
      }],
  };
}

// ── 3-6 七波诅咒终战 ──
function generateFloor_3_6() {
  const grid = makeGrid();
  // 宅邸中心 — 大祭坛+四周封锁
  carveRoom(grid, 6, 5, 14, 12);     // 中央大厅
  carveRoom(grid, 1, 7, 5, 10);      // 左翼
  carveCorridor(grid, 5, 8, 6, 8);
  carveRoom(grid, 15, 7, 19, 10);    // 右翼
  carveCorridor(grid, 14, 8, 15, 8);
  carveRoom(grid, 8, 1, 12, 4);      // 上方祈祷室
  carveCorridor(grid, 10, 4, 10, 5);
  carveRoom(grid, 8, 13, 12, 16);    // 下方入口
  carveCorridor(grid, 10, 12, 10, 13);

  grid[1][11] = TILE.STAIRS; // 通关出口

  return {
    id: '3-6', name: '七波诅咒终战',
    subtitle: '伽椰子的嘶鸣在整栋宅邸回荡。这是最后的战斗。七波诅咒，一波接一波。',
    bgColor: '#120808', theme: 'juon_ritual',
    tiles: grid, width: W, height: H, playerStart: { x: 10, y: 15 },
    entities: [
      // Boss前对话
      { type: ENTITY_TYPE.EVENT, id: 'final_prep', name: '终战准备',
        x: 10, y: 14, sprite: '⚔', color: '#ffcc44',
        event: {
          type: 'dialogue',
          lines: [
            { text: '这是中央祭坛。空气中弥漫着浓厚的怨念。', speaker: '旁白' },
            { text: '楚轩的分析是对的。七波之后，她会显出真身。那时就是我们的机会。', speaker: '郑吒' },
            { text: '我会用精神力压制她的诅咒。你专注攻击。', speaker: '赵樱空' },
            { text: '……准备好了。', speaker: '零点' },
            { text: '郑吒确立了一个原则：不抛弃任何一个队友。', speaker: '旁白' }],
          flag: 'final_prep_done',
        },
      },
      // 前哨灵体
      { type: ENTITY_TYPE.ENEMY, id: 'curse_guard_1', name: '诅咒护卫',
        x: 3, y: 8, sprite: '👻', color: '#ff6688',
        hp: 60, atk: 20, def: 6, spd: 9,
        damageType: 'spirit', weaknesses: ['spirit'],
        physicalResist: 0.5,
        rewards: { exp: 50, gold: 35 },
      },
      { type: ENTITY_TYPE.ENEMY, id: 'curse_guard_2', name: '诅咒护卫',
        x: 17, y: 8, sprite: '👻', color: '#ff6688',
        hp: 60, atk: 20, def: 6, spd: 9,
        damageType: 'spirit', weaknesses: ['spirit'],
        physicalResist: 0.5,
        rewards: { exp: 50, gold: 35 },
      },
      // ★ Boss: 伽椰子
      { type: ENTITY_TYPE.BOSS, id: 'boss_kayako', bossId: 'kayako', traits: ['evasive', 'undying'], name: '伽椰子',
        x: 10, y: 7, sprite: '👩', color: '#440022',
        hp: 250, atk: 28, def: 8, spd: 12,
        damageType: 'spirit', weaknesses: ['spirit'],
        physicalResist: 0.7, // 物理仅30%伤害
        curseWaves: 7,
        rewards: { exp: 200, gold: 100, rewardPoints: 300 },
        lore: '伽椰子的七波诅咒。每波诅咒会增强她的攻击力。第七波后显出真身，防御大幅降低。',
      },
      // 补给
      { type: ENTITY_TYPE.ITEM, id: 'medkit_ch3_6', name: '高级急救包',
        x: 8, y: 5, sprite: '♥', color: '#ff4488',
        itemType: 'consumable', effect: { heal: 100 },
      },
      // 灵力弹药
      { type: ENTITY_TYPE.ITEM, id: 'spirit_ammo_final', name: '灵力弹匣',
        x: 12, y: 5, sprite: '🔮', color: '#aa88ff',
        itemType: 'ammo', effect: { ammo: 15 },
      },
      // 章节结束事件
      { type: ENTITY_TYPE.EVENT, id: 'ch3_ending', name: '第三章结算',
        x: 10, y: 2, sprite: '✦', color: '#ffdd88',
        event: {
          type: 'chapter_end',
          lines: [
            { text: '伽椰子的怨念终于消散了。宅邸恢复了宁静。', speaker: '旁白' },
            { text: '我们失去了楚轩和铭烟薇……但活下来的人必须继续前进。', speaker: '郑吒' },
            { text: '从今天起，不再有人被抛弃。这是我的承诺。', speaker: '郑吒' },
            { text: '第三关「咒怨阴影」通关。获得基础奖励1000点。', speaker: '主神' }],
          flag: 'ch3_complete',
          rewards: { rewardPoints: 1000 },
        },
      }],
  };
}

// ── 导出 ──
export function generateChapter3() {
  return {
    name: '第三章 · 咒怨阴影',
    world: '咒怨',
    floors: [
      generateFloor_3_1(), // 宅邸触发诅咒
      generateFloor_3_2(), // 第一夜分散
      generateFloor_3_3(), // 佛经线索
      generateFloor_3_4(), // 新人冲突
      generateFloor_3_5(), // 楚轩录像
      generateFloor_3_6(), // 七波诅咒终战
    ],
  };
}
