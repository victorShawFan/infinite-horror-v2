// ═══════════════════════════════════════════════════════════════
// 第四章 · 神鬼秘宝 — 六节点地图生成
// 核心机制：团队战积分/古文机关/木乃伊复生/双阵营
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

// ── 4-1 沙漠车队 ──
function generateFloor_4_1() {
  const grid = makeGrid();
  // 沙漠旷野 — 宽阔地形，绿洲/帐篷
  carveRoom(grid, 1, 6, 7, 11);      // 营地
  carveCorridor(grid, 7, 8, 12, 8);  // 沙地通道
  carveRoom(grid, 12, 5, 18, 11);    // 绿洲广场
  carveRoom(grid, 1, 1, 5, 4);       // 上方帐篷
  carveCorridor(grid, 3, 4, 3, 6);
  carveRoom(grid, 15, 1, 19, 4);     // 远方沙丘
  carveCorridor(grid, 17, 4, 17, 5);
  carveRoom(grid, 8, 12, 14, 15);    // 下方车队
  carveCorridor(grid, 10, 11, 10, 12);

  grid[2][18] = TILE.STAIRS;

  return {
    id: '4-1', name: '沙漠车队',
    subtitle: '炙热的沙漠中，一支车队正在前往哈姆纳塔。空气中弥漫着古老而危险的气息。',
    bgColor: '#1a1408', theme: 'desert',
    tiles: grid, width: W, height: H, playerStart: { x: 3, y: 8 },
    entities: [
      { type: ENTITY_TYPE.EVENT, id: 'ch4_intro', name: '神鬼世界传送',
        x: 4, y: 8, sprite: '✦', color: '#ffffff',
        event: {
          type: 'dialogue',
          lines: [
            { text: '刺眼的阳光下，你们出现在一片无边的沙漠中。远处有一支骆驼商队。', speaker: '旁白' },
            { text: '队伍又多了两个新人——一个沉默寡言的青年和一个话多的胖子。', speaker: '旁白' },
            { text: '张恒。别多问。', speaker: '张恒' },
            { text: '萧宏律，请多关照！我虽然看着不像，但其实很有用的！', speaker: '萧宏律' },
            { text: '这个世界……是《木乃伊》。目标是取得复活真经。但——', speaker: '赵樱空' },
            { text: '我感应到了。另一支队伍也在这里。印洲队。', speaker: '赵樱空' },
            { text: '（主神提示：双阵营模式激活。印洲队将争夺同一目标。团战不可避免。）', speaker: '主神' },
          ],
        },
      },
      // 新队友
      { type: ENTITY_TYPE.COMPANION, id: 'zhang_heng', name: '张恒',
        x: 2, y: 8, sprite: '恒', color: '#88aa44',
        dialogue: [
          { text: '张恒加入了队伍！', speaker: '系统' },
          { text: '（被动效果：古武强化 — ATK+3）', speaker: '系统' },
        ],
        companionData: { id: 'zhang_heng', name: '张恒', passive: { atk: 3 }, alive: true },
      },
      { type: ENTITY_TYPE.COMPANION, id: 'xiao_honglv', name: '萧宏律',
        x: 4, y: 9, sprite: '萧', color: '#ddaa44',
        dialogue: [
          { text: '萧宏律加入了队伍！', speaker: '系统' },
          { text: '（被动效果：话匣子鼓舞 — SPD+2）', speaker: '系统' },
        ],
        companionData: { id: 'xiao_honglv', name: '萧宏律', passive: { spd: 2 }, alive: true },
      },
      // 沙漠敌人
      { type: ENTITY_TYPE.ENEMY, id: 'sand_scorpion_1', name: '巨型沙蝎',
        x: 14, y: 8, sprite: '🦂', color: '#cc8844',
        hp: 55, atk: 18, def: 8, spd: 6,
        damageType: 'physical',
        rewards: { exp: 40, gold: 30 },
      },
      { type: ENTITY_TYPE.ENEMY, id: 'sand_scorpion_2', name: '毒蝎',
        x: 10, y: 14, sprite: '🦂', color: '#bb7733',
        hp: 45, atk: 16, def: 6, spd: 7,
        damageType: 'poison', weaknesses: ['fire'],
        rewards: { exp: 35, gold: 25 },
      },
      { type: ENTITY_TYPE.ENEMY, id: 'desert_raider', name: '沙匪',
        x: 3, y: 2, sprite: '⚔', color: '#aa8855',
        hp: 50, atk: 15, def: 7, spd: 8,
        rewards: { exp: 35, gold: 30 },
      },
      // 补给
      { type: ENTITY_TYPE.ITEM, id: 'medkit_ch4_1', name: '急救包',
        x: 16, y: 8, sprite: '♥', color: '#ff4488',
        itemType: 'consumable', effect: { heal: 50 },
      },
      { type: ENTITY_TYPE.ITEM, id: 'atk_crystal_ch4_1', name: '力量结晶',
        x: 17, y: 2, sprite: '◆', color: '#ff8844',
        itemType: 'stat_boost', effect: { atk: 3 },
      },
    ],
  };
}

// ── 4-2 开罗情报 ──
function generateFloor_4_2() {
  const grid = makeGrid();
  // 开罗城市 — 市场/情报点
  carveRoom(grid, 1, 1, 6, 6);      // 旅馆
  carveCorridor(grid, 6, 3, 10, 3); // 街道
  carveRoom(grid, 10, 1, 15, 5);    // 市场
  carveCorridor(grid, 12, 5, 12, 8);
  carveRoom(grid, 9, 8, 15, 12);    // 情报所
  carveRoom(grid, 1, 9, 7, 13);     // 武器铺
  carveCorridor(grid, 4, 6, 4, 9);
  carveCorridor(grid, 7, 11, 9, 11);
  carveRoom(grid, 16, 8, 19, 14);   // 仓库
  carveCorridor(grid, 15, 10, 16, 10);
  carveRoom(grid, 10, 14, 15, 16);  // 地下通道
  carveCorridor(grid, 12, 12, 12, 14);

  grid[15][14] = TILE.STAIRS;

  return {
    id: '4-2', name: '开罗情报',
    subtitle: '开罗的市集人声鼎沸。但你注意到，有人在暗中跟踪你们。',
    bgColor: '#14120a', theme: 'desert_city',
    tiles: grid, width: W, height: H, playerStart: { x: 3, y: 3 },
    entities: [
      { type: ENTITY_TYPE.EVENT, id: 'cairo_intel', name: '印洲队情报',
        x: 12, y: 10, sprite: '📜', color: '#ffdd88',
        event: {
          type: 'dialogue',
          lines: [
            { text: '情报商递过来一份文件。上面标注了哈姆纳塔的位置——以及印洲队的行动路线。', speaker: '旁白' },
            { text: '印洲队的队长叫"达帕拉"。他们比我们更了解这个世界的规则。', speaker: '赵樱空' },
            { text: '一定要在他们之前找到复活真经。这是我们此行最重要的目标。', speaker: '郑吒' },
            { text: '（获得情报：印洲队动向已标记。陵墓入口情报已解锁。）', speaker: '主神' },
          ],
          flag: 'cairo_intel_done',
        },
      },
      // 暗杀者
      { type: ENTITY_TYPE.ENEMY, id: 'assassin_1', name: '印洲队斥候',
        x: 18, y: 11, sprite: '🗡', color: '#884444',
        hp: 60, atk: 20, def: 7, spd: 12,
        rewards: { exp: 50, gold: 40 },
      },
      { type: ENTITY_TYPE.ENEMY, id: 'thief_1', name: '开罗窃贼',
        x: 12, y: 3, sprite: '👤', color: '#777755',
        hp: 35, atk: 14, def: 4, spd: 10,
        rewards: { exp: 25, gold: 35 },
      },
      // 武器
      { type: ENTITY_TYPE.ITEM, id: 'desert_blade', name: '沙漠弯刀',
        x: 3, y: 11, sprite: '🗡', color: '#ddaa44',
        itemType: 'weapon',
        weapon: { name: '沙漠弯刀', atk: 16, damageType: 'physical', crt: 4 },
      },
      // 护甲
      { type: ENTITY_TYPE.ITEM, id: 'desert_armor', name: '沙漠披风',
        x: 5, y: 11, sprite: '🛡', color: '#886633',
        itemType: 'armor',
        armor: { name: '沙漠披风', def: 8, spd: 2 },
      },
      { type: ENTITY_TYPE.ITEM, id: 'medkit_ch4_2', name: '急救包',
        x: 13, y: 1, sprite: '♥', color: '#ff4488',
        itemType: 'consumable', effect: { heal: 50 },
      },
      { type: ENTITY_TYPE.ITEM, id: 'def_crystal_ch4_2', name: '防御结晶',
        x: 18, y: 14, sprite: '◆', color: '#6688ff',
        itemType: 'stat_boost', effect: { def: 3 },
      },
    ],
  };
}

// ── 4-3 陵墓机关 ──
function generateFloor_4_3() {
  const grid = makeGrid();
  // 古墓内部 — 窄通道+陷阱+祭坛
  carveRoom(grid, 1, 7, 4, 10);     // 入口
  carveCorridor(grid, 4, 8, 8, 8);  // 走廊
  carveRoom(grid, 8, 5, 12, 11);    // 中央大厅
  carveCorridor(grid, 12, 8, 16, 8);// 右通道
  carveRoom(grid, 16, 5, 19, 11);   // 机关室
  carveRoom(grid, 8, 1, 12, 4);     // 上方密室
  carveCorridor(grid, 10, 4, 10, 5);
  carveRoom(grid, 8, 12, 12, 15);   // 下方陷阱区
  carveCorridor(grid, 10, 11, 10, 12);
  carveRoom(grid, 15, 13, 19, 16);  // 右下宝库
  carveCorridor(grid, 17, 11, 17, 13);

  grid[14][18] = TILE.STAIRS;

  return {
    id: '4-3', name: '陵墓机关',
    subtitle: '哈姆纳塔的入口在你面前展开。墙壁上的象形文字似乎在警告着什么。',
    bgColor: '#0c0a06', theme: 'tomb',
    tiles: grid, width: W, height: H, playerStart: { x: 2, y: 8 },
    entities: [
      // 机关解谜事件
      { type: ENTITY_TYPE.EVENT, id: 'tomb_puzzle', name: '象形文字机关',
        x: 10, y: 8, sprite: '🔧', color: '#ddaa44',
        event: {
          type: 'dialogue',
          lines: [
            { text: '中央大厅的墙上有四组象形文字。按照正确顺序触碰才能打开内殿。', speaker: '旁白' },
            { text: '让我看看……太阳、鹰、蛇、甲虫。这是亡灵之书的开启序列。', speaker: '赵樱空' },
            { text: '（古文机关已解密。内殿通道开启。）', speaker: '主神' },
          ],
          flag: 'tomb_puzzle_solved',
        },
      },
      // 木乃伊
      { type: ENTITY_TYPE.ENEMY, id: 'mummy_soldier_1', name: '木乃伊守卫',
        x: 17, y: 7, sprite: '🧟', color: '#aa8844',
        hp: 70, atk: 20, def: 10, spd: 5,
        damageType: 'physical', weaknesses: ['fire'],
        rewards: { exp: 50, gold: 35 },
      },
      { type: ENTITY_TYPE.ENEMY, id: 'mummy_soldier_2', name: '木乃伊弓手',
        x: 10, y: 2, sprite: '🏹', color: '#998855',
        hp: 55, atk: 22, def: 6, spd: 7,
        damageType: 'physical', weaknesses: ['fire'],
        rewards: { exp: 45, gold: 35 },
      },
      { type: ENTITY_TYPE.ENEMY, id: 'scarab_swarm', name: '圣甲虫群',
        x: 10, y: 14, sprite: '🪲', color: '#667744',
        hp: 40, atk: 18, def: 3, spd: 12,
        damageType: 'poison',
        rewards: { exp: 35, gold: 20 },
      },
      // 火焰武器（对木乃伊有效）
      { type: ENTITY_TYPE.ITEM, id: 'fire_torch', name: '圣火炬',
        x: 17, y: 14, sprite: '🔥', color: '#ff8844',
        itemType: 'weapon',
        weapon: { name: '圣火炬', atk: 13, damageType: 'fire' },
      },
      { type: ENTITY_TYPE.ITEM, id: 'medkit_ch4_3', name: '急救包',
        x: 2, y: 9, sprite: '♥', color: '#ff4488',
        itemType: 'consumable', effect: { heal: 60 },
      },
      // HP晶石
      { type: ENTITY_TYPE.ITEM, id: 'hp_crystal_ch4_3', name: '生命结晶',
        x: 17, y: 15, sprite: '◆', color: '#44ff88',
        itemType: 'stat_boost', effect: { maxHp: 30 },
      },
    ],
  };
}

// ── 4-4 印洲队伏击 ──
function generateFloor_4_4() {
  const grid = makeGrid();
  // 陵墓深处 — 十字路口遭遇
  carveRoom(grid, 1, 6, 6, 10);     // 左入口
  carveCorridor(grid, 6, 8, 8, 8);
  carveRoom(grid, 8, 4, 13, 12);    // 中央战场
  carveCorridor(grid, 13, 8, 16, 8);
  carveRoom(grid, 16, 5, 19, 11);   // 右侧
  carveRoom(grid, 8, 1, 12, 3);     // 上方高台
  carveCorridor(grid, 10, 3, 10, 4);
  carveRoom(grid, 8, 13, 13, 16);   // 下方退路
  carveCorridor(grid, 10, 12, 10, 13);

  grid[15][12] = TILE.STAIRS;

  return {
    id: '4-4', name: '印洲队伏击',
    subtitle: '前方有人！是印洲队——他们已经在这里等着了！',
    bgColor: '#0e0806', theme: 'tomb',
    tiles: grid, width: W, height: H, playerStart: { x: 3, y: 8 },
    entities: [
      // 印洲队伏击事件
      { type: ENTITY_TYPE.EVENT, id: 'india_ambush', name: '印洲队伏击',
        x: 4, y: 8, sprite: '⚠', color: '#ff4444',
        event: {
          type: 'dialogue',
          lines: [
            { text: '穿过通道的瞬间，四面八方响起了脚步声。印洲队！', speaker: '旁白' },
            { text: '欢迎来到哈姆纳塔，中洲队。', speaker: '达帕拉（印洲队长）' },
            { text: '你们太慢了。但不要紧——我们可以让你们在这里永眠。', speaker: '达帕拉' },
            { text: '所有人进入战斗状态！保护好自己！', speaker: '郑吒' },
            { text: '（团队战：击败印洲队成员可获得额外积分和奖励。）', speaker: '主神' },
          ],
          flag: 'india_ambush_done',
        },
      },
      // 印洲队成员（人形敌人，更强）
      { type: ENTITY_TYPE.ENEMY, id: 'india_warrior_1', name: '印洲队·战士',
        x: 10, y: 6, sprite: '⚔', color: '#cc4444',
        hp: 80, atk: 24, def: 10, spd: 9,
        rewards: { exp: 60, gold: 50, rewardPoints: 50 },
      },
      { type: ENTITY_TYPE.ENEMY, id: 'india_warrior_2', name: '印洲队·刺客',
        x: 17, y: 8, sprite: '🗡', color: '#aa3333',
        hp: 65, atk: 28, def: 6, spd: 14,
        rewards: { exp: 55, gold: 45, rewardPoints: 40 },
      },
      { type: ENTITY_TYPE.ENEMY, id: 'india_mage', name: '印洲队·法师',
        x: 10, y: 2, sprite: '🔮', color: '#8844aa',
        hp: 55, atk: 22, def: 4, spd: 10,
        damageType: 'dark', weaknesses: ['holy'],
        rewards: { exp: 55, gold: 45, rewardPoints: 40 },
      },
      // 齐腾一固定死亡
      { type: ENTITY_TYPE.EVENT, id: 'qi_tengyi_death', name: '齐腾一之死',
        x: 10, y: 10, sprite: '†', color: '#ff0000',
        event: {
          type: 'fixed_death',
          lines: [
            { text: '混战中，齐腾一被印洲队的刺客从背后偷袭。', speaker: '旁白' },
            { text: '齐腾一！', speaker: '郑吒' },
            { text: '没关系……队长，帮我看住他们的侧翼……', speaker: '齐腾一' },
            { text: '齐腾一倒下了。但他临终前的射击为队伍争取了宝贵的时间。', speaker: '旁白' },
            { text: '（齐腾一阵亡。这是不可改变的命运。）', speaker: '主神' },
          ],
          flag: 'qi_tengyi_dead',
          companionDeath: 'qi_tengyi',
        },
      },
      // 补给
      { type: ENTITY_TYPE.ITEM, id: 'medkit_ch4_4', name: '大型急救包',
        x: 11, y: 15, sprite: '♥', color: '#ff4488',
        itemType: 'consumable', effect: { heal: 80 },
      },
      { type: ENTITY_TYPE.ITEM, id: 'crt_crystal_ch4_4', name: '暴击结晶',
        x: 18, y: 6, sprite: '◆', color: '#ffcc44',
        itemType: 'stat_boost', effect: { crt: 4 },
      },
    ],
  };
}

// ── 4-5 复活真经争夺 ──
function generateFloor_4_5() {
  const grid = makeGrid();
  // 陵墓内殿 — 真经所在
  carveRoom(grid, 1, 6, 5, 10);     // 入口
  carveCorridor(grid, 5, 8, 9, 8);
  carveRoom(grid, 9, 4, 15, 12);    // 内殿大厅
  carveCorridor(grid, 15, 8, 18, 8);
  carveRoom(grid, 16, 5, 19, 11);   // 祭坛
  carveRoom(grid, 6, 1, 11, 3);     // 上方暗道
  carveCorridor(grid, 9, 3, 9, 4);
  carveRoom(grid, 6, 13, 11, 16);   // 下方陷阱
  carveCorridor(grid, 9, 12, 9, 13);

  grid[8][18] = TILE.STAIRS;

  return {
    id: '4-5', name: '复活真经争夺',
    subtitle: '黄金棺椁前，复活真经散发着古老的光芒。但争夺才刚刚开始。',
    bgColor: '#100a04', theme: 'tomb_inner',
    tiles: grid, width: W, height: H, playerStart: { x: 2, y: 8 },
    entities: [
      // 真经发现
      { type: ENTITY_TYPE.EVENT, id: 'scripture_found', name: '复活真经',
        x: 17, y: 8, sprite: '📜', color: '#ffdd44',
        event: {
          type: 'dialogue',
          lines: [
            { text: '祭坛上，一本古老的经书泛着金色的光芒——复活真经。', speaker: '旁白' },
            { text: '这就是……复活真经。有了它，就能复活死去的队友。', speaker: '赵樱空' },
            { text: '取到了！但印洲队也在逼近——快撤！', speaker: '郑吒' },
            { text: '（获得关键道具「复活真经」— 可用于后续章节复活已故队友。）', speaker: '主神' },
          ],
          flag: 'scripture_obtained',
          rewards: { rewardPoints: 200 },
        },
      },
      // 零点固定死亡
      { type: ENTITY_TYPE.EVENT, id: 'lingdian_death', name: '零点之死',
        x: 12, y: 8, sprite: '†', color: '#ff0000',
        event: {
          type: 'fixed_death',
          lines: [
            { text: '撤退途中，达帕拉突然出现在零点面前。', speaker: '旁白' },
            { text: '你的狙击很优秀。可惜，射程不够。', speaker: '达帕拉' },
            { text: '零点——！', speaker: '郑吒' },
            { text: '零点用最后的力气开了一枪——正中达帕拉的肩膀。', speaker: '旁白' },
            { text: '队长……真经要保住。剩下的……拜托了。', speaker: '零点' },
            { text: '（零点阵亡。他的牺牲为取得复活真经争取了最后的时间。）', speaker: '主神' },
          ],
          flag: 'lingdian_dead',
          companionDeath: 'lingdian',
        },
      },
      // 印洲队精英
      { type: ENTITY_TYPE.ENEMY, id: 'india_elite_1', name: '印洲队·精锐',
        x: 12, y: 5, sprite: '⚔', color: '#cc2222',
        hp: 85, atk: 26, def: 10, spd: 10,
        rewards: { exp: 65, gold: 50, rewardPoints: 50 },
      },
      // 木乃伊
      { type: ENTITY_TYPE.ENEMY, id: 'mummy_priest', name: '木乃伊祭司',
        x: 8, y: 14, sprite: '💀', color: '#aa8844',
        hp: 75, atk: 22, def: 8, spd: 6,
        damageType: 'dark', weaknesses: ['fire', 'holy'],
        rewards: { exp: 55, gold: 40 },
      },
      // 补给
      { type: ENTITY_TYPE.ITEM, id: 'medkit_ch4_5', name: '急救包',
        x: 8, y: 1, sprite: '♥', color: '#ff4488',
        itemType: 'consumable', effect: { heal: 60 },
      },
      { type: ENTITY_TYPE.ITEM, id: 'spd_crystal_ch4_5', name: '速度结晶',
        x: 19, y: 10, sprite: '◆', color: '#44ffaa',
        itemType: 'stat_boost', effect: { spd: 3 },
      },
    ],
  };
}

// ── 4-6 伊莫顿与团战终局 ──
function generateFloor_4_6() {
  const grid = makeGrid();
  // 陵墓最深处 — 伊莫顿复活大厅
  carveRoom(grid, 6, 5, 14, 12);     // 中央祭殿
  carveRoom(grid, 1, 7, 5, 10);      // 左翼
  carveCorridor(grid, 5, 8, 6, 8);
  carveRoom(grid, 15, 7, 19, 10);    // 右翼
  carveCorridor(grid, 14, 8, 15, 8);
  carveRoom(grid, 8, 1, 12, 4);      // 上方逃生通道
  carveCorridor(grid, 10, 4, 10, 5);
  carveRoom(grid, 8, 13, 12, 16);    // 下方入口
  carveCorridor(grid, 10, 12, 10, 13);

  grid[1][11] = TILE.STAIRS;

  return {
    id: '4-6', name: '伊莫顿与团战终局',
    subtitle: '棺椁的封印被打开了。伊莫顿——三千年前被活埋的大祭司，正在复活。',
    bgColor: '#0e0604', theme: 'tomb_boss',
    tiles: grid, width: W, height: H, playerStart: { x: 10, y: 15 },
    entities: [
      // Boss前对话
      { type: ENTITY_TYPE.EVENT, id: 'imhotep_intro', name: '伊莫顿觉醒',
        x: 10, y: 14, sprite: '⚔', color: '#ffcc44',
        event: {
          type: 'dialogue',
          lines: [
            { text: '大地震颤。棺椁的盖板缓缓滑开，腐朽的气息扑面而来。', speaker: '旁白' },
            { text: '伊莫顿！他正在恢复力量！', speaker: '赵樱空' },
            { text: '印洲队也在这里——他们也想利用伊莫顿的力量！', speaker: '张恒' },
            { text: '我们两线作战。郑吒对付伊莫顿，张恒盯住印洲队残部。', speaker: '詹岚' },
            { text: '为了零点和齐腾一……这一战，我们不能输！', speaker: '郑吒' },
          ],
          flag: 'imhotep_intro_done',
        },
      },
      // Boss前哨
      { type: ENTITY_TYPE.ENEMY, id: 'mummy_elite_1', name: '木乃伊近卫',
        x: 3, y: 8, sprite: '🧟', color: '#886633',
        hp: 80, atk: 22, def: 12, spd: 6,
        damageType: 'physical', weaknesses: ['fire'],
        rewards: { exp: 55, gold: 40 },
      },
      { type: ENTITY_TYPE.ENEMY, id: 'mummy_elite_2', name: '木乃伊近卫',
        x: 17, y: 8, sprite: '🧟', color: '#886633',
        hp: 80, atk: 22, def: 12, spd: 6,
        damageType: 'physical', weaknesses: ['fire'],
        rewards: { exp: 55, gold: 40 },
      },
      // ★ Boss: 伊莫顿
      { type: ENTITY_TYPE.BOSS, id: 'boss_imhotep', bossId: 'imhotep', traits: ['regen', 'shield'], name: '伊莫顿',
        x: 10, y: 7, sprite: '👑', color: '#ddaa22',
        hp: 300, atk: 30, def: 12, spd: 10,
        damageType: 'dark', weaknesses: ['fire', 'holy'],
        sandForm: true, // 沙尘化减物理伤害
        physicalResist: 0.3,
        rewards: { exp: 250, gold: 150, rewardPoints: 400 },
        lore: '三千年前被活埋的大祭司。沙尘化时物理伤害减少。火系和圣系武器是克星。',
      },
      // Boss后补给
      { type: ENTITY_TYPE.ITEM, id: 'medkit_ch4_6', name: '高级急救包',
        x: 8, y: 5, sprite: '♥', color: '#ff4488',
        itemType: 'consumable', effect: { heal: 100 },
      },
      // 章节结束事件
      { type: ENTITY_TYPE.EVENT, id: 'ch4_ending', name: '第四章结算',
        x: 10, y: 2, sprite: '✦', color: '#ffdd88',
        event: {
          type: 'chapter_end',
          lines: [
            { text: '伊莫顿被击败了。陵墓开始崩塌。', speaker: '旁白' },
            { text: '快走！带着真经！', speaker: '张恒' },
            { text: '我们失去了零点和齐腾一……但复活真经，也许有一天能让他们回来。', speaker: '郑吒' },
            { text: '在沙漠的夕阳下，郑吒紧握着复活真经，向着远方走去。', speaker: '旁白' },
            { text: '第四关「神鬼秘宝」通关。获得基础奖励1000点。', speaker: '主神' },
          ],
          flag: 'ch4_complete',
          rewards: { rewardPoints: 1000 },
        },
      },
    ],
  };
}

// ── 导出 ──
export function generateChapter4() {
  return {
    name: '第四章 · 神鬼秘宝',
    world: '神鬼传奇一',
    floors: [
      generateFloor_4_1(),
      generateFloor_4_2(),
      generateFloor_4_3(),
      generateFloor_4_4(),
      generateFloor_4_5(),
      generateFloor_4_6(),
    ],
  };
}
