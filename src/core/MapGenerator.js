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
          { text: '听好了，我们被"主神"带到了这里。', speaker: '张杰' },
          { text: '规则很简单：活下来，完成任务，不要脱离剧情人物太远。', speaker: '张杰' },
          { text: '每打倒一个敌人，你会变得更强。但不要莽撞。', speaker: '张杰' },
          { text: '看到敌人先估算一下——能不能打得过，要不要绕路。', speaker: '张杰' },
        ],
      },
      // 詹岚
      { type: ENTITY_TYPE.COMPANION, id: 'zhan_lan', name: '詹岚',
        x: 5, y: 8, sprite: '詹', color: '#44ff88',
        role: '情报分析',
        dialogue: [
          { text: '我叫詹岚。看起来我们得合作才能活下去。', speaker: '詹岚' },
          { text: '我会帮你分析路线，但战斗得靠你自己。', speaker: '詹岚' },
        ],
      },
      // 李萧毅
      { type: ENTITY_TYPE.COMPANION, id: 'li_xiaoyi', name: '李萧毅',
        x: 7, y: 9, sprite: '李', color: '#ffaa44',
        role: '机动支援',
        dialogue: [
          { text: '嘿，别紧张。跟紧队伍就好。', speaker: '李萧毅' },
        ],
      },
      // 牟钢
      { type: ENTITY_TYPE.COMPANION, id: 'mou_gang', name: '牟钢',
        x: 5, y: 9, sprite: '牟', color: '#cc8844',
        role: '防线坚守',
        dialogue: [
          { text: '正面交给我。', speaker: '牟钢' },
        ],
      },
      // 教学丧尸（弱）
      { type: ENTITY_TYPE.ENEMY, id: 'zombie_1', name: '僵化感染者',
        x: 6, y: 4, sprite: '尸', color: '#668866',
        hp: 15, atk: 6, def: 2, spd: 3,
        rewards: { exp: 15, gold: 5 },
        geneLockCharge: 3,
        description: '行动迟缓的感染者，最基础的威胁。',
      },
      { type: ENTITY_TYPE.ENEMY, id: 'zombie_2', name: '僵化感染者',
        x: 4, y: 5, sprite: '尸', color: '#668866',
        hp: 15, atk: 6, def: 2, spd: 3,
        rewards: { exp: 15, gold: 5 },
        geneLockCharge: 3,
        description: '行动迟缓的感染者。',
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
            { text: '"第三次了。每次醒来都是这趟列车。记住——红后的激光有规律，注意时机。 ——上一个'我'"', speaker: '纸条' },
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
      },
      { type: ENTITY_TYPE.ENEMY, id: 'zombie_4', name: '蜂巢感染者',
        x: 11, y: 10, sprite: '尸', color: '#558855',
        hp: 25, atk: 9, def: 3, spd: 4,
        rewards: { exp: 25, gold: 8 },
        geneLockCharge: 4,
      },
      { type: ENTITY_TYPE.ENEMY, id: 'zombie_5', name: '强化感染者',
        x: 13, y: 11, sprite: '屍', color: '#448844',
        hp: 40, atk: 12, def: 5, spd: 5,
        rewards: { exp: 40, gold: 15 },
        geneLockCharge: 6,
        description: '经过T病毒强化的感染者，攻击力明显提升。',
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
            { text: '应急照明终端。需要接通才能看清后面的路。', speaker: '詹岚' },
            { text: '已恢复应急照明！', speaker: '系统' },
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
            { text: '门控系统终端。照明接通后可以操作。', speaker: '詹岚' },
            { text: '门控已恢复！还需要主电源。', speaker: '系统' },
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
      },
      { type: ENTITY_TYPE.ENEMY, id: 'guard_2', name: '蜂巢守卫',
        x: 9, y: 10, sprite: '衛', color: '#448855',
        hp: 35, atk: 11, def: 5, spd: 5,
        rewards: { exp: 35, gold: 12 },
        geneLockCharge: 5,
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
        description: 'T病毒变异的猎犬，攻击力高但防御薄弱。',
      },
      { type: ENTITY_TYPE.ENEMY, id: 'mutant_2', name: '变异猎犬',
        x: 14, y: 2, sprite: '犬', color: '#886644',
        hp: 30, atk: 14, def: 3, spd: 8,
        rewards: { exp: 35, gold: 10 },
        geneLockCharge: 5,
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
            { text: '大量爬行者从通风管道涌出！', speaker: '旁白' },
            { text: '牟钢挡在了最前面。', speaker: '旁白' },
            { text: '你们先走！我来断后！', speaker: '牟钢' },
            { text: '牟钢...！', speaker: '郑吒' },
            { text: '不要回头！记住，活着才有意义！', speaker: '牟钢' },
            { text: '——牟钢 阵亡——', speaker: '系统' },
            { text: '这是你第一次失去队友。在这个世界里，死亡是真实的。', speaker: '旁白' },
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
        description: '蜂巢深处的终极生物兵器，速度和攻击力都极高。',
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
            { text: '牟钢的死在你心中引起了巨大的波动。', speaker: '旁白' },
            { text: '一股奇异的力量从体内涌出——', speaker: '旁白' },
            { text: '【基因锁 · 一阶开启】', speaker: '系统' },
            { text: '感知与反应得到了超凡增强。你感受到了前所未有的力量。', speaker: '旁白' },
            { text: '（攻击力+20%，防御力+15%，可在战斗中激活）', speaker: '系统' },
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
      },
      { type: ENTITY_TYPE.ENEMY, id: 'zombie_horde', name: '丧尸群',
        x: 15, y: 5, sprite: '群', color: '#556655',
        hp: 80, atk: 15, def: 10, spd: 3,
        rewards: { exp: 55, gold: 20 },
        geneLockCharge: 8,
        description: '一大群缓慢但强壮的丧尸。',
      },
      // 最终Boss
      { type: ENTITY_TYPE.BOSS, id: 'boss_tyrant', name: '暴君 T-002',
        x: 15, y: 11, sprite: '暴', color: '#ff44ff',
        hp: 150, atk: 22, def: 12, spd: 6,
        crt: 10,
        rewards: { exp: 200, gold: 100, rewardPoints: 100 },
        geneLockCharge: 20,
        description: '伞公司的终极生物兵器。极高的生命值和攻击力。',
        weaknesses: ['fire'],
        onDefeat: {
          lines: [
            { text: '暴君倒下了！', speaker: '旁白' },
            { text: '快！列车就在前方！', speaker: '张杰' },
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
            { text: '你们登上了列车。', speaker: '旁白' },
            { text: '活下来的只有四个人：张杰、郑吒、詹岚、李萧毅。', speaker: '旁白' },
            { text: '牟钢和其他新人...永远留在了那个地方。', speaker: '旁白' },
            { text: '白色的光芒将你们吞没——', speaker: '旁白' },
            { text: '——欢迎回到主神空间。', speaker: '主神' },
            { text: '任务完成。基础奖励：1000点。', speaker: '主神' },
            { text: '第一章 · 名为生化 — 完 —', speaker: '系统' },
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
