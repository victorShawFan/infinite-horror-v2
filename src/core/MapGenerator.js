// ═══════════════════════════════════════════════════════════════
// 地图生成器 — 生成类魔塔的多层地牢
// ═══════════════════════════════════════════════════════════════

import { TILE, ENTITY_TYPE } from './constants.js';

/**
 * 生成第一章：名为生化 的地图数据
 * 6个节点对应6层，每层是一个地牢
 */
export function generateChapter1() {
  return {
    name: '第一章 · 名为生化',
    world: '生化危机一',
    floors: [
      generateFloor_1_1(), // 列车醒来
      generateFloor_1_2(), // 蜂巢入口
      generateFloor_1_3(), // 红后机房
      generateFloor_1_4(), // 激光通道
      generateFloor_1_5(), // 丧尸与爬行者
      generateFloor_1_6(), // 六小时生存
    ],
  };
}

/** 1-1 列车醒来与规则说明 */
function generateFloor_1_1() {
  // 13x13 的列车车厢布局
  const w = 13, h = 13;
  const tiles = createGrid(w, h, TILE.WALL);

  // 挖出列车走廊
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      if (x >= 2 && x <= 10 && y >= 2 && y <= 10) {
        tiles[y][x] = TILE.FLOOR;
      }
    }
  }
  // 座位排列（用墙壁模拟）
  for (let y = 3; y <= 9; y += 2) {
    tiles[y][3] = TILE.WALL;
    tiles[y][4] = TILE.WALL;
    tiles[y][8] = TILE.WALL;
    tiles[y][9] = TILE.WALL;
  }
  // 出口
  tiles[1][6] = TILE.STAIRS;

  return {
    id: '1-1',
    name: '列车醒来与规则说明',
    subtitle: '你在一列疾驰的列车上醒来，身边是一群同样茫然的陌生人...',
    width: w, height: h, tiles,
    playerStart: { x: 6, y: 10 },
    ambience: 'train', // 环境氛围标记
    bgColor: '#0e0e18',
    entities: [
      // 张杰（队长NPC）
      { type: ENTITY_TYPE.COMPANION, id: 'zhang_jie', name: '张杰',
        x: 6, y: 8, sprite: '张', color: '#4488ff',
        role: '战术领队',
        dialogue: [
          { text: '冷静。先深呼吸。', speaker: '张杰' },
          { text: '我叫张杰。以前是特种兵，这不是我第一次来这里。', speaker: '张杰' },
          { text: '简单说——一个叫"主神"的东西把我们扔进了电影世界。《生化危机》，你看过吗？', speaker: '张杰' },
          { text: '丧尸、爬行者、暴君……这里的一切都是真的。被咬了会死，死了就永远回不去了。', speaker: '张杰' },
          { text: '活下来的人会得到奖励——可以强化身体，甚至获得超越人类的力量。', speaker: '张杰' },
          { text: '但别逞英雄。看到怪物先观察，确定打得过再上。打不过？绕路。活着比面子重要。', speaker: '张杰' },
          { text: '还有……不要离剧情角色太远，主神会扣你的命。跟紧队伍。', speaker: '张杰' },
          { text: '前方有感染者，让我开路。你跟在后面，拿到什么补给都别犹豫。我们只有彼此了。', speaker: '张杰' },
        ],
      },
      // 詹岚
      { type: ENTITY_TYPE.COMPANION, id: 'zhan_lan', name: '詹岚',
        x: 5, y: 8, sprite: '詹', color: '#44ff88',
        role: '情报分析',
        dialogue: [
          { text: '我是詹岚。昨天还在加班做PPT，今天就在僵尸堆里求生了。', speaker: '詹岚' },
          { text: '说来奇怪……到了这里之后，我的大脑变得异常清楚。可能是主神给的什么"增强"吧。', speaker: '詹岚' },
          { text: '我能分析敌人的弱点和路线。你悬停看到的情报，有一部分是我帮你整理的。', speaker: '詹岚' },
          { text: '注意那些上了锁的门——钥匙通常在死人身上或者终端机里。这里没有什么东西是白放的。', speaker: '詹岚' },
          { text: '……说实话，我很害怕。但张杰说只要活着回去就好。我信他。', speaker: '詹岚' },
        ],
      },
      // 李萧毅
      { type: ENTITY_TYPE.COMPANION, id: 'li_xiaoyi', name: '李萧毅',
        x: 7, y: 9, sprite: '李', color: '#ffaa44',
        role: '机动支援',
        dialogue: [
          { text: '嘿兄弟，别怕。我叫李萧毅，以前是个快递员。没想到送到"主神"这儿来了。', speaker: '李萧毅' },
          { text: '我跑得快，能帮你侦查前方的路。但别指望我替你打架——我这小身板扛不住。', speaker: '李萧毅' },
          { text: '对了，如果前面有激光什么的，看准节奏再走。红色的东西，一般都不是好东西。', speaker: '李萧毅' },
        ],
      },
      // 牟钢
      { type: ENTITY_TYPE.COMPANION, id: 'mou_gang', name: '牟钢',
        x: 5, y: 9, sprite: '牟', color: '#cc8844',
        role: '防线坚守',
        dialogue: [
          { text: '牟钢。退伍兵。别的不行，挨打还行。', speaker: '牟钢' },
          { text: '你长得跟我弟弟差不多大。放心，有我在前面顶着，你不会有事。', speaker: '牟钢' },
          { text: '……说起来，我弟弟还在等我回去呢。', speaker: '牟钢' },
          { text: '不管了。先把眼前的关过了再说。走！', speaker: '牟钢' },
        ],
      },
      // 教学丧尸（弱）
      { type: ENTITY_TYPE.ENEMY, id: 'zombie_1', name: '僵化感染者',
        x: 6, y: 4, sprite: '尸', color: '#668866',
        hp: 15, atk: 6, def: 2, spd: 3,
        rewards: { exp: 15, gold: 5 },
        geneLockCharge: 3,
        description: '一个穿着实验室制服的感染者。眼神空洞，皮肤呈灰绿色，嘴角还挂着不明液体。行动迟缓但会本能地扑向活物。',
      },
      { type: ENTITY_TYPE.ENEMY, id: 'zombie_2', name: '僵化感染者',
        x: 4, y: 5, sprite: '尸', color: '#668866',
        hp: 15, atk: 6, def: 2, spd: 3,
        rewards: { exp: 15, gold: 5 },
        geneLockCharge: 3,
        description: '这个感染者的白大褂上沾满了干涸的血迹。ID牌显示他曾是一名安保人员。T病毒让他变成了另一种东西。',
      },
      // 补给品
      { type: ENTITY_TYPE.ITEM, id: 'potion_1', name: '急救喷雾',
        x: 9, y: 5, sprite: '♥', color: '#ff4488',
        itemType: 'consumable', effect: { heal: 30 },
        description: '恢复30点生命值。',
      },
      // 隐藏物品：座椅下的手记
      { type: ENTITY_TYPE.EVENT, id: 'hidden_note', name: '座椅下的纸条',
        x: 3, y: 5, sprite: '📜', color: '#ccaa66',
        event: {
          type: 'investigate',
          lines: [
            { text: '你在座椅缝隙中发现了一张折叠的纸条。', speaker: '旁白' },
            { text: '"第三次了。每次醒来都是这趟列车。记住——红后的激光有规律，注意时机。" ——上一个我', speaker: '纸条' },
            { text: '这是...前一个轮回的自己留下的？', speaker: '郑吒' },
          ],
          flag: 'hidden_note_found',
          rewards: { exp: 10 },
        },
      },
      // 其他新人（叙事用）
      { type: ENTITY_TYPE.NPC, id: 'newbie_1', name: '惊慌的新人',
        x: 8, y: 9, sprite: '人', color: '#888888',
        dialogue: [
          { text: '这、这是怎么回事？我明明在家里睡觉...', speaker: '新人' },
          { text: '你冷静点。先听那边那个人说什么。', speaker: '郑吒' },
        ],
      },
      // 开场剧情事件
      { type: ENTITY_TYPE.EVENT, id: 'ch1_intro', name: '主神宣言',
        x: 6, y: 6, sprite: '!', color: '#ffffff',
        event: {
          type: 'dialogue',
          lines: [
            { text: '——欢迎来到主神空间。', speaker: '主神' },
            { text: '你们已被选中参加这场生存游戏。', speaker: '主神' },
            { text: '任务：在生化危机的世界中存活。', speaker: '主神' },
            { text: '不要偏离剧情人物太远，否则后果自负。', speaker: '主神' },
            { text: '杀死敌人会获得力量。活着回来的人，将得到奖励。', speaker: '主神' },
          ],
          flag: 'ch1_intro_seen',
        },
      },
    ],
    onClear: { nextFloor: 1, message: '你们离开列车，进入了蜂巢地下实验室的入口...' },
  };
}

/** 1-2 蜂巢入口护送 */
function generateFloor_1_2() {
  const w = 17, h = 15;
  const tiles = createGrid(w, h, TILE.WALL);

  // 大厅 + 走廊
  carveRoom(tiles, 1, 1, 7, 7);     // 入口大厅
  carveRoom(tiles, 9, 1, 15, 5);    // 安全屋
  carveRoom(tiles, 1, 9, 7, 13);    // 检查站
  carveRoom(tiles, 9, 8, 15, 13);   // 通道
  carveCorridor(tiles, 7, 3, 9, 3); // 连接
  carveCorridor(tiles, 4, 7, 4, 9);
  carveCorridor(tiles, 9, 5, 12, 8);

  tiles[1][8] = TILE.STAIRS; // 出口

  return {
    id: '1-2',
    name: '蜂巢入口护送',
    subtitle: '地下实验室的走廊弥漫着消毒水和腐臭的气味...',
    width: w, height: h, tiles,
    playerStart: { x: 4, y: 12 },
    ambience: 'hive',
    bgColor: '#0a0f12',
    entities: [
      // 调查尸体事件
      { type: ENTITY_TYPE.EVENT, id: 'body_1', name: '安保人员遗体',
        x: 3, y: 3, sprite: '†', color: '#886666',
        event: {
          type: 'investigate',
          lines: [
            { text: '一具穿着安保制服的遗体。胸口有明显的抓痕。', speaker: '旁白' },
            { text: '这里发生了什么...', speaker: '郑吒' },
          ],
          rewards: { exp: 10 },
          flag: 'body_1_investigated',
        },
      },
      { type: ENTITY_TYPE.EVENT, id: 'body_2', name: '研究员遗体',
        x: 12, y: 3, sprite: '†', color: '#886666',
        event: {
          type: 'investigate',
          lines: [
            { text: '一具白大褂的遗体，手里紧握着一张门卡。', speaker: '旁白' },
            { text: '看来这个门卡有用。', speaker: '詹岚' },
          ],
          rewards: { keys: { yellow: 1 } },
          flag: 'body_2_investigated',
        },
      },
      // 敌人 —— 更强的感染者
      { type: ENTITY_TYPE.ENEMY, id: 'zombie_3', name: '蜂巢感染者',
        x: 5, y: 5, sprite: '尸', color: '#558855',
        hp: 25, atk: 9, def: 3, spd: 4,
        rewards: { exp: 25, gold: 8 },
        geneLockCharge: 4,
        description: '在蜂巢深处游荡了太久的感染者。肌肉开始变异，攻击力比列车上的同类明显更强。皮肤下隐约可见蠕动的东西。',
      },
      { type: ENTITY_TYPE.ENEMY, id: 'zombie_4', name: '蜂巢感染者',
        x: 11, y: 10, sprite: '尸', color: '#558855',
        hp: 25, atk: 9, def: 3, spd: 4,
        rewards: { exp: 25, gold: 8 },
        geneLockCharge: 4,
        description: '这个感染者的手臂已经变形成了某种爪状结构。T病毒的进化能力令人胆寒。',
      },
      { type: ENTITY_TYPE.ENEMY, id: 'zombie_5', name: '强化感染者',
        x: 13, y: 11, sprite: '屍', color: '#448844',
        hp: 40, atk: 12, def: 5, spd: 5,
        rewards: { exp: 40, gold: 15 },
        geneLockCharge: 6,
        description: '一个彻底变异的感染者。体型比正常人大了一圈，肌肉外翻，行动虽然笨拙但每一击都足以致命。这就是T病毒的"杰作"。',
      },
      // 门
      { type: ENTITY_TYPE.ITEM, id: 'door_y1', name: '黄色门',
        x: 8, y: 3, sprite: '门', color: '#ccaa44',
        itemType: 'door', doorColor: 'yellow',
      },
      // 补给
      { type: ENTITY_TYPE.ITEM, id: 'potion_2', name: '急救喷雾',
        x: 14, y: 2, sprite: '♥', color: '#ff4488',
        itemType: 'consumable', effect: { heal: 30 },
      },
      { type: ENTITY_TYPE.ITEM, id: 'atkgem_1', name: '力量晶石',
        x: 2, y: 10, sprite: '◆', color: '#ff6644',
        itemType: 'stat_boost', effect: { atk: 3 },
        description: '永久提升3点攻击力。',
      },
      // 额外物品
      { type: ENTITY_TYPE.EVENT, id: 'hive_terminal', name: '安保终端',
        x: 14, y: 10, sprite: '🖥', color: '#44aaaa',
        event: {
          type: 'investigate',
          lines: [
            { text: '一台仍在运行的安保终端。屏幕上显示着设施地图。', speaker: '旁白' },
            { text: '这里标注了一条通向机房的路线...还有一个"红后防御系统"的警告。', speaker: '詹岚' },
            { text: '红后...电影里那个AI？这是真的？', speaker: '郑吒' },
            { text: '在这个世界里，一切都是真的。小心。', speaker: '张杰' },
          ],
          flag: 'hive_terminal_read',
          rewards: { exp: 15 },
        },
      },
      { type: ENTITY_TYPE.ITEM, id: 'stamina_potion', name: '能量饮料',
        x: 2, y: 2, sprite: '🥤', color: '#44ccaa',
        itemType: 'consumable', effect: { heal: 20 },
        description: '恢复20点HP。味道一言难尽。',
      },
    ],
    onClear: { nextFloor: 2, message: '你们深入蜂巢，来到了红后的防御区域...' },
  };
}

/** 1-3 红后机房解谜 */
function generateFloor_1_3() {
  const w = 17, h = 17;
  const tiles = createGrid(w, h, TILE.WALL);

  // 机房布局：中央大厅 + 四个终端室
  carveRoom(tiles, 5, 5, 11, 11);     // 中央
  carveRoom(tiles, 1, 1, 5, 5);       // 左上-照明
  carveRoom(tiles, 11, 1, 15, 5);     // 右上-门控
  carveRoom(tiles, 1, 11, 5, 15);     // 左下-终端
  carveRoom(tiles, 11, 11, 15, 15);   // 右下-出口
  carveCorridor(tiles, 5, 3, 5, 3);
  carveCorridor(tiles, 11, 3, 11, 3);
  carveCorridor(tiles, 3, 5, 3, 5);
  carveCorridor(tiles, 3, 11, 3, 11);
  carveCorridor(tiles, 11, 13, 11, 13);
  carveCorridor(tiles, 13, 11, 13, 11);

  tiles[15][13] = TILE.STAIRS;

  return {
    id: '1-3',
    name: '红后机房解谜',
    subtitle: '红后的安全系统仍在运行。你需要恢复三个终端的电力才能打开通道。',
    width: w, height: h, tiles,
    playerStart: { x: 8, y: 8 },
    ambience: 'machine_room',
    bgColor: '#0c0c14',
    entities: [
      // 三个终端事件
      { type: ENTITY_TYPE.EVENT, id: 'terminal_light', name: '照明终端',
        x: 3, y: 3, sprite: '⚡', color: '#ffff44',
        event: {
          type: 'puzzle',
          lines: [
            { text: '墙壁上嵌着一个布满灰尘的终端面板，上面有「蜂巢应急照明系统」的标识。', speaker: '旁白' },
            { text: '让我看看……这是应急照明的控制端口。只要接通它，就能恢复走廊的灯光。', speaker: '詹岚' },
            { text: '嗡——走廊上方的灯管开始一盏接一盏地亮起，惨白的荧光照亮了墙壁上的抓痕和血迹。', speaker: '旁白' },
            { text: '照明恢复了……但说实话，有些东西还是看不见比较好。', speaker: '詹岚' },
          ],
          flag: 'terminal_light_done',
          rewards: { exp: 20 },
        },
      },
      { type: ENTITY_TYPE.EVENT, id: 'terminal_door', name: '门控终端',
        x: 13, y: 3, sprite: '⚡', color: '#ffff44',
        event: {
          type: 'puzzle',
          requires: 'terminal_light_done',
          lines: [
            { text: '「蜂巢安保门控 - B级权限」的终端。屏幕上还残留着上一个操作者的登录信息。', speaker: '旁白' },
            { text: '照明接通后我才能读取数据。好，开始解锁……', speaker: '詹岚' },
            { text: '门控序列重启。不过主电源还没恢复——只有核心电力接通，所有安全门才能打开。', speaker: '系统' },
            { text: '还差一步。继续找主电源终端。', speaker: '詹岚' },
          ],
          flag: 'terminal_door_done',
          rewards: { exp: 20 },
        },
      },
      { type: ENTITY_TYPE.EVENT, id: 'terminal_main', name: '主电源终端',
        x: 3, y: 13, sprite: '⚡', color: '#ffff44',
        event: {
          type: 'puzzle',
          requires: 'terminal_door_done',
          lines: [
            { text: '主电源终端。这是最后一步了。', speaker: '詹岚' },
            { text: '我来操作。你掩护我。', speaker: '詹岚' },
            { text: '⚠ 警告：操作终端会引来敌人！', speaker: '系统' },
          ],
          flag: 'terminal_main_done',
          rewards: { exp: 30 },
          spawnEnemies: [
            { name: '警报触发者', x: 8, y: 6, hp: 35, atk: 11, def: 4, sprite: '尸', color: '#556655', rewards: { exp: 30, gold: 12 } },
            { name: '警报触发者', x: 6, y: 8, hp: 35, atk: 11, def: 4, sprite: '尸', color: '#556655', rewards: { exp: 30, gold: 12 } },
          ],
        },
      },
      // 敌人
      { type: ENTITY_TYPE.ENEMY, id: 'guard_1', name: '蜂巢守卫',
        x: 7, y: 6, sprite: '衛', color: '#448855',
        hp: 35, atk: 11, def: 5, spd: 5,
        rewards: { exp: 35, gold: 12 },
        geneLockCharge: 5,
        description: '穿着破损防护服的前蜂巢警卫。变异后仍保留了部分战斗本能，会举起变形的手臂格挡。比普通感染者难对付得多。',
      },
      { type: ENTITY_TYPE.ENEMY, id: 'guard_2', name: '蜂巢守卫',
        x: 9, y: 10, sprite: '衛', color: '#448855',
        hp: 35, atk: 11, def: 5, spd: 5,
        rewards: { exp: 35, gold: 12 },
        geneLockCharge: 5,
        description: '另一个变异的蜂巢警卫。防护头盔已经碎裂，露出半张扭曲的面孔。',
      },
      // 蓝钥匙
      { type: ENTITY_TYPE.ITEM, id: 'key_blue', name: '蓝色门卡',
        x: 13, y: 13, sprite: '🔑', color: '#4488ff',
        itemType: 'key', keyColor: 'blue',
      },
      // 防御宝石
      { type: ENTITY_TYPE.ITEM, id: 'defgem_1', name: '坚韧晶石',
        x: 2, y: 2, sprite: '◆', color: '#4488ff',
        itemType: 'stat_boost', effect: { def: 3 },
        description: '永久提升3点防御力。',
      },
      { type: ENTITY_TYPE.ITEM, id: 'potion_3', name: '高级急救包',
        x: 14, y: 14, sprite: '♥', color: '#ff2266',
        itemType: 'consumable', effect: { heal: 60 },
        description: '恢复60点生命值。',
      },
    ],
    onClear: { nextFloor: 3, message: '电力恢复了。通道打开了——但前方传来了奇怪的机械声...' },
  };
}

/** 1-4 激光通道 */
function generateFloor_1_4() {
  const w = 21, h = 9;
  const tiles = createGrid(w, h, TILE.WALL);

  // 长走廊
  for (let x = 1; x < w - 1; x++) {
    for (let y = 2; y <= 6; y++) {
      tiles[y][x] = TILE.FLOOR;
    }
  }
  // 激光柱（LAVA模拟）
  for (let x = 4; x < w - 4; x += 3) {
    tiles[3][x] = TILE.LAVA;
    tiles[5][x] = TILE.LAVA;
  }

  tiles[4][w - 2] = TILE.STAIRS;

  return {
    id: '1-4',
    name: '激光通道',
    subtitle: '红色的激光网在走廊中闪烁。一旦触碰，后果不堪设想。',
    width: w, height: h, tiles,
    playerStart: { x: 1, y: 4 },
    ambience: 'laser',
    bgColor: '#10080a',
    entities: [
      // 激光是即死陷阱
      { type: ENTITY_TYPE.TRAP, id: 'laser_warn', name: '⚠ 激光警告',
        x: 3, y: 4, sprite: '⚠', color: '#ff4444',
        event: {
          type: 'dialogue',
          lines: [
            { text: '前方是红后的激光防御系统！', speaker: '张杰' },
            { text: '红色方块是激光柱——碰到会受到大量伤害。', speaker: '张杰' },
            { text: '找到安全的路线穿过去！', speaker: '张杰' },
          ],
          flag: 'laser_warned',
        },
      },
      // 中途敌人
      { type: ENTITY_TYPE.ENEMY, id: 'mutant_1', name: '变异猎犬',
        x: 8, y: 4, sprite: '犬', color: '#886644',
        hp: 30, atk: 14, def: 3, spd: 8,
        rewards: { exp: 35, gold: 10 },
        geneLockCharge: 5,
        description: '被T病毒感染的实验犬。皮肤完全脱落，暴露出血红色的肌肉组织。速度极快，但身体组织脆弱——攻高防低的典型。',
      },
      { type: ENTITY_TYPE.ENEMY, id: 'mutant_2', name: '变异猎犬',
        x: 14, y: 2, sprite: '犬', color: '#886644',
        hp: 30, atk: 14, def: 3, spd: 8,
        rewards: { exp: 35, gold: 10 },
        geneLockCharge: 5,
        description: '第二只变异猎犬。它们通常成对行动——如果你看到一只，另一只一定在附近。',
      },
      // 补给
      { type: ENTITY_TYPE.ITEM, id: 'potion_4', name: '急救喷雾',
        x: 11, y: 4, sprite: '♥', color: '#ff4488',
        itemType: 'consumable', effect: { heal: 40 },
      },
      { type: ENTITY_TYPE.ITEM, id: 'spdgem_1', name: '敏捷晶石',
        x: 17, y: 6, sprite: '◆', color: '#44ffaa',
        itemType: 'stat_boost', effect: { spd: 3, crt: 5 },
        description: '永久提升3点速度和5%暴击率。',
      },
    ],
    onClear: { nextFloor: 4, message: '你穿过了激光走廊。前方传来了不属于人类的嘶吼声...' },
  };
}

/** 1-5 丧尸与爬行者 — 牟钢固定死亡 */
function generateFloor_1_5() {
  const w = 17, h = 17;
  const tiles = createGrid(w, h, TILE.WALL);

  // 终端控制室布局
  carveRoom(tiles, 1, 1, 8, 8);      // 主室
  carveRoom(tiles, 9, 1, 15, 8);     // 侧室
  carveRoom(tiles, 1, 9, 8, 15);     // 防御区
  carveRoom(tiles, 9, 9, 15, 15);    // Boss区
  carveCorridor(tiles, 8, 4, 9, 4);
  carveCorridor(tiles, 4, 8, 4, 9);
  carveCorridor(tiles, 8, 12, 9, 12);
  carveCorridor(tiles, 12, 8, 12, 9);

  tiles[15][13] = TILE.STAIRS;

  return {
    id: '1-5',
    name: '丧尸与爬行者',
    subtitle: '这是蜂巢最深处。爬行者已经苏醒了。',
    width: w, height: h, tiles,
    playerStart: { x: 4, y: 4 },
    ambience: 'deep_hive',
    bgColor: '#0a0808',
    entities: [
      // 牟钢固定死亡事件
      { type: ENTITY_TYPE.EVENT, id: 'mou_gang_death', name: '牟钢的最后防线',
        x: 4, y: 12, sprite: '!', color: '#ff8844',
        event: {
          type: 'cutscene',
          lines: [
            { text: '通风管道发出了金属扭曲的声响。不是一只——是一群。', speaker: '旁白' },
            { text: '大量爬行者从四面八方的管道中涌出，舌头在空气中疯狂抽动。', speaker: '旁白' },
            { text: '牟钢一把将你推到身后，抄起了地上的钢管。', speaker: '旁白' },
            { text: '走！带着他们走！', speaker: '牟钢' },
            { text: '牟钢！一起走！', speaker: '郑吒' },
            { text: '来不及了。这么多……我能拖住它们。', speaker: '牟钢' },
            { text: '牟钢转过头，笑了一下。那是你见过的、最平静的笑。', speaker: '旁白' },
            { text: '帮我跟我弟弟说一声——哥对不起他。', speaker: '牟钢' },
            { text: '他转身冲向了爬行者群。你听到了钢管砸在肉体上的声音，然后是嘶吼，然后是沉默。', speaker: '旁白' },
            { text: '——牟钢 · 阵亡——', speaker: '系统' },
            { text: '你没有回头。不是因为不想，而是因为他说过"不要回头"。', speaker: '旁白' },
            { text: '这是你在这个世界失去的第一个人。不会是最后一个。', speaker: '旁白' },
          ],
          flag: 'mou_gang_dead',
          removeCompanion: 'mou_gang',
        },
      },
      // 大量敌人
      { type: ENTITY_TYPE.ENEMY, id: 'crawler_1', name: '爬行者',
        x: 12, y: 3, sprite: '蟲', color: '#664444',
        hp: 50, atk: 16, def: 6, spd: 7,
        rewards: { exp: 50, gold: 20 },
        geneLockCharge: 8,
        description: '舔食者——蜂巢最深处的终极生物兵器。没有皮肤，暴露的大脑组织让它对声音极其敏感。超长的舌头可以在瞬间贯穿猎物。这就是电影中最恐怖的存在。',
      },
      { type: ENTITY_TYPE.ENEMY, id: 'crawler_2', name: '爬行者',
        x: 3, y: 11, sprite: '蟲', color: '#664444',
        hp: 50, atk: 16, def: 6, spd: 7,
        rewards: { exp: 50, gold: 20 },
        geneLockCharge: 8,
      },
      { type: ENTITY_TYPE.ENEMY, id: 'zombie_elite', name: '精英感染者',
        x: 12, y: 12, sprite: '屍', color: '#445544',
        hp: 60, atk: 14, def: 8, spd: 5,
        rewards: { exp: 45, gold: 18 },
        geneLockCharge: 6,
      },
      // 基因锁触发事件
      { type: ENTITY_TYPE.EVENT, id: 'gene_lock_trigger', name: '基因锁觉醒',
        x: 12, y: 10, sprite: '🧬', color: '#ff6600',
        event: {
          type: 'gene_lock',
          requires: 'mou_gang_dead',
          lines: [
            { text: '你停下了脚步。', speaker: '旁白' },
            { text: '牟钢最后的笑容在脑海中挥之不去。那些爬行者的嘶吼、钢管的撞击声、然后是寂静——', speaker: '旁白' },
            { text: '愤怒。不是暴怒，而是一种冰冷的、从骨髓深处涌上来的力量。', speaker: '旁白' },
            { text: '你的瞳孔收缩，心跳从180骤降到40。世界突然变慢了。', speaker: '旁白' },
            { text: '【基因锁 · 一阶觉醒】', speaker: '系统' },
            { text: '人类在死亡边缘时，隐藏在基因中的最后防线会被强行打开。', speaker: '旁白' },
            { text: '你的感知、反应和肌肉控制获得了超凡增强。按 G 键在战斗前激活。', speaker: '系统' },
            { text: '……牟钢，我记住了。', speaker: '郑吒' },
          ],
          flag: 'gene_lock_1',
          effect: { geneLock: 1 },
        },
      },
      // 补给
      { type: ENTITY_TYPE.ITEM, id: 'weapon_1', name: '安保手枪',
        x: 13, y: 2, sprite: '🔫', color: '#aaaaaa',
        itemType: 'weapon',
        weapon: { name: '安保手枪', atk: 5, damageType: 'physical', description: '蜂巢安保人员配发的手枪。' },
      },
      { type: ENTITY_TYPE.ITEM, id: 'potion_5', name: '高级急救包',
        x: 2, y: 14, sprite: '♥', color: '#ff2266',
        itemType: 'consumable', effect: { heal: 80 },
      },
      { type: ENTITY_TYPE.ITEM, id: 'atkgem_2', name: '力量晶石',
        x: 14, y: 14, sprite: '◆', color: '#ff6644',
        itemType: 'stat_boost', effect: { atk: 4 },
      },
    ],
    onClear: { nextFloor: 5, message: '你们从蜂巢深处逃出。现在，必须在六小时内赶到撤离点...' },
  };
}

/** 1-6 六小时生存回归 — 最终boss */
function generateFloor_1_6() {
  const w = 19, h = 15;
  const tiles = createGrid(w, h, TILE.WALL);

  // 城市废墟 + 最终走廊
  carveRoom(tiles, 1, 1, 9, 7);       // 起点区域
  carveRoom(tiles, 1, 8, 6, 13);      // 补给站
  carveRoom(tiles, 7, 8, 12, 13);     // 中间区
  carveRoom(tiles, 13, 1, 17, 7);     // 撤离区
  carveRoom(tiles, 13, 8, 17, 13);    // Boss区
  carveCorridor(tiles, 9, 4, 13, 4);
  carveCorridor(tiles, 6, 10, 7, 10);
  carveCorridor(tiles, 12, 10, 13, 10);

  tiles[1][16] = TILE.STAIRS;

  return {
    id: '1-6',
    name: '六小时生存回归',
    subtitle: '六小时倒计时开始了。列车就在前方，但最强的敌人也在前方等待...',
    width: w, height: h, tiles,
    playerStart: { x: 2, y: 4 },
    ambience: 'city_ruins',
    bgColor: '#0e0c0a',
    entities: [
      // 补给选择事件
      { type: ENTITY_TYPE.EVENT, id: 'supply_choice', name: '补给抉择',
        x: 3, y: 10, sprite: '?', color: '#ffcc44',
        event: {
          type: 'choice',
          lines: [
            { text: '张杰：前方发现了一批补给。但只能带走一样。', speaker: '张杰' },
            { text: '你选择带走什么？', speaker: '系统' },
          ],
          choices: [
            { text: '医疗包（恢复全部HP）', effect: { healFull: true }, id: 'supply_medical' },
            { text: '弹药箱（攻击力+6）', effect: { atk: 6 }, id: 'supply_ammo' },
            { text: '防弹衣（防御力+5）', effect: { def: 5 }, id: 'supply_armor' },
          ],
          flag: 'supply_chosen',
        },
      },
      // 强敌
      { type: ENTITY_TYPE.ENEMY, id: 'crawler_3', name: '精英爬行者',
        x: 10, y: 10, sprite: '蟲', color: '#553333',
        hp: 70, atk: 18, def: 8, spd: 8,
        rewards: { exp: 60, gold: 25 },
        geneLockCharge: 10,
        description: '一只更大、更强壮的舔食者。背部的爪子已经进化成镰刀状。这是T病毒制造的终极狩猎者。',
      },
      { type: ENTITY_TYPE.ENEMY, id: 'zombie_horde', name: '丧尸群',
        x: 15, y: 5, sprite: '群', color: '#556655',
        hp: 80, atk: 15, def: 10, spd: 3,
        rewards: { exp: 55, gold: 20 },
        geneLockCharge: 8,
        description: '十几个感染者聚集在一起，形成了一面缓慢推进的"肉墙"。单个不足为惧，但这个数量……速度慢是唯一的好消息。硬碰硬不是好主意。',
      },
      // 最终Boss
      { type: ENTITY_TYPE.BOSS, id: 'boss_tyrant', name: '暴君 T-002',
        x: 15, y: 11, sprite: '暴', color: '#ff44ff',
        hp: 150, atk: 22, def: 12, spd: 6,
        crt: 10,
        rewards: { exp: 200, gold: 100, rewardPoints: 100 },
        geneLockCharge: 20,
        description: '暴君 T-002型。伞公司投入天文数字研发的终极生物兵器。三米高的躯体布满灰色肌肉，右臂已经变异成巨大的爪状武器。它不会追踪——它只是沿着直线碾压一切。这是第一章的最终考验。建议在基因锁激活状态下挑战。',
        weaknesses: ['fire'],
        onDefeat: {
          lines: [
            { text: '暴君庞大的身躯轰然倒地。地面传来的震动让天花板上的碎片纷纷掉落。', speaker: '旁白' },
            { text: '它……它真的倒了？', speaker: '郑吒' },
            { text: '别愣着！这东西不一定死透了。快走！列车就在前面！', speaker: '张杰' },
            { text: '跑！全速！', speaker: '张杰' },
          ],
          flag: 'boss_tyrant_defeated',
        },
      },
      // 结局事件
      { type: ENTITY_TYPE.EVENT, id: 'ch1_ending', name: '列车',
        x: 16, y: 1, sprite: '🚂', color: '#44ffff',
        event: {
          type: 'chapter_end',
          requires: 'boss_tyrant_defeated',
          lines: [
            { text: '列车就在眼前。引擎已经启动，车轮在铁轨上发出了刺耳的金属声。', speaker: '旁白' },
            { text: '张杰第一个跳上了车门，回身拉住了你的手。', speaker: '旁白' },
            { text: '快上来！', speaker: '张杰' },
            { text: '你被拽上列车的瞬间，身后的蜂巢发出了最后一声轰鸣。净化程序启动了。', speaker: '旁白' },
            { text: '你透过车窗看着那座地下建筑在火焰中崩塌。牟钢的身影、那些新人的面孔……', speaker: '旁白' },
            { text: '……', speaker: '郑吒' },
            { text: '活下来的只有四个人。张杰。郑吒。詹岚。李萧毅。', speaker: '旁白' },
            { text: '白色的光芒再次降临，将列车上的一切吞噬——', speaker: '旁白' },
            { text: '"任务完成。幸存者四人。基础奖励：1000奖励点。"', speaker: '主神' },
            { text: '"下一轮试炼将在十日后开始。请利用这段时间整备。"', speaker: '主神' },
            { text: '你闭上了眼睛。列车渐渐停下。当你再次睁眼，你身处一个纯白色的空间。', speaker: '旁白' },
            { text: '——第一章 · 名为生化 · 完——', speaker: '系统' },
          ],
          flag: 'chapter_1_complete',
          rewards: { rewardPoints: 1000, exp: 500 },
        },
      },
      // 补给
      { type: ENTITY_TYPE.ITEM, id: 'potion_6', name: '超级急救包',
        x: 4, y: 12, sprite: '♥', color: '#ff0044',
        itemType: 'consumable', effect: { heal: 120 },
        description: '恢复120点生命值。',
      },
    ],
    onClear: null, // 最后一层
  };
}

/** 通用宝箱工厂 */
function makeChest(id, x, y, contents, description) {
  return {
    type: ENTITY_TYPE.ITEM, id, name: '物资箱',
    x, y, sprite: '📦', color: '#cc8844',
    itemType: 'consumable',
    effect: contents,
    description: description || '打开看看里面有什么。',
  };
}

/** 通用属性宝石工厂 */
function makeGem(id, x, y, stat, value, name, color) {
  return {
    type: ENTITY_TYPE.ITEM, id, name,
    x, y, sprite: '◆', color,
    itemType: 'stat_boost',
    effect: { [stat]: value },
    description: `永久提升${value}点${stat === 'atk' ? '攻击力' : stat === 'def' ? '防御力' : stat === 'spd' ? '速度' : '暴击率'}。`,
  };
}

// ── 工具函数 ──

function createGrid(w, h, fill) {
  return Array.from({ length: h }, () => Array(w).fill(fill));
}

function carveRoom(tiles, x1, y1, x2, y2) {
  for (let y = y1; y <= y2; y++) {
    for (let x = x1; x <= x2; x++) {
      if (y < tiles.length && x < tiles[0].length) {
        tiles[y][x] = TILE.FLOOR;
      }
    }
  }
}

function carveCorridor(tiles, x1, y1, x2, y2) {
  const sx = Math.min(x1, x2), ex = Math.max(x1, x2);
  const sy = Math.min(y1, y2), ey = Math.max(y1, y2);
  for (let y = sy; y <= ey; y++) {
    for (let x = sx; x <= ex; x++) {
      if (y < tiles.length && x < tiles[0].length) {
        tiles[y][x] = TILE.FLOOR;
      }
    }
  }
}
