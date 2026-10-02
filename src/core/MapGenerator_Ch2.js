// ═══════════════════════════════════════════════════════════════
// 第二章 · 异形杀戮 — 六节点地图生成
// 核心机制：声源潜行/队伍分流/酸血/有限弹药
// ═══════════════════════════════════════════════════════════════

import { TILE, ENTITY_TYPE } from './constants.js';

const W = 21, H = 17;

function makeGrid(fill = TILE.VOID) {
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

// ── 2-1 飞船封锁 ──
function generateFloor_2_1() {
  const grid = makeGrid();
  // 飞船走廊布局 — 狭长通道，两侧舱室
  carveRoom(grid, 1, 7, 5, 9);    // 起始舱
  carveCorridor(grid, 5, 8, 10, 8); // 主走廊
  carveRoom(grid, 10, 6, 14, 10);  // 中央大厅
  carveCorridor(grid, 14, 8, 19, 8); // 右走廊
  carveRoom(grid, 16, 3, 19, 6);   // 上方舱室
  carveRoom(grid, 16, 10, 19, 13); // 下方舱室
  carveCorridor(grid, 18, 6, 18, 8);
  carveCorridor(grid, 18, 10, 18, 8);
  // 小侧室
  carveRoom(grid, 6, 4, 9, 6);
  carveCorridor(grid, 8, 6, 8, 8);
  carveRoom(grid, 6, 10, 9, 12);
  carveCorridor(grid, 8, 10, 8, 8);

  return {
    id: '2-1', name: '飞船封锁', subtitle: '苏拉科号的走廊一片死寂。唯一的声音是头顶日光灯管的嗡嗡声。', bgColor: '#080812', theme: 'alien_ship',
    tiles: grid, width: W, height: H, playerStart: { x: 2, y: 8 },
    entities: [
      // 开场对话
      { type: ENTITY_TYPE.EVENT, id: 'ch2_intro', name: '异形世界传送',
        x: 3, y: 8, sprite: '✦', color: '#ffffff',
        event: {
          type: 'dialogue',
          lines: [
            { text: '白色光柱将你们送到了一艘巨大的飞船内部。空气中弥漫着金属和油脂的味道。', speaker: '旁白' },
            { text: '……这是LV-426轨道上的"苏拉科"号。', speaker: '楚轩' },
            { text: '你注意到队伍中多了几个陌生面孔——楚轩、零点、霸王、李帅西，还有几个新人。', speaker: '旁白' },
            { text: '所有人注意，不要发出不必要的声响。这个世界的敌人……靠声音定位猎物。', speaker: '郑吒' },
            { text: '（主神提示：声源潜行机制已激活。移动时按Shift减速，降低被发现概率。）', speaker: '主神' },
          ],
          flag: 'ch2_intro_done',
        },
      },
      // 新队友加入
      { type: ENTITY_TYPE.COMPANION, id: 'chuxuan', name: '楚轩',
        x: 4, y: 7, sprite: '楚', color: '#ccaa44',
        role: '军师',
        dialogue: [
          { text: '这艘飞船的结构……我已经记住了。有问题可以来找我。', speaker: '楚轩' },
          { text: '酸血是异形最大的陷阱。近战击杀会溅射酸液，造成反噬伤害。保持距离。', speaker: '楚轩' },
        ],
      },
      { type: ENTITY_TYPE.COMPANION, id: 'lingdian', name: '零点',
        x: 4, y: 9, sprite: '零', color: '#88aaff',
        role: '狙击手',
        dialogue: [
          { text: '给我一个好的射击位置就行。我的子弹不会浪费。', speaker: '零点' },
        ],
      },
      // 教学敌人 — 幼年异形
      { type: ENTITY_TYPE.ENEMY, id: 'facehugger_1', name: '抱脸虫',
        x: 12, y: 7, sprite: '蛛', color: '#886644',
        hp: 10, atk: 8, def: 1, spd: 12, weaknesses: ['fire'],
        rewards: { exp: 20, gold: 5 },
        geneLockCharge: 3,
        description: '一只从卵囊中爬出的抱脸虫。体型小巧但速度惊人，会直扑面部。击杀时酸血会造成少量反噬伤害。',
        acidBlood: 2, // 酸血反噬伤害
      },
      { type: ENTITY_TYPE.ENEMY, id: 'facehugger_2', traits: ['swift'], name: '抱脸虫',
        x: 12, y: 9, sprite: '蛛', color: '#886644',
        hp: 10, atk: 8, def: 1, spd: 12, weaknesses: ['fire'],
        rewards: { exp: 20, gold: 5 },
        geneLockCharge: 3,
        description: '第二只抱脸虫。它们总是成群出现。',
        acidBlood: 2,
      },
      // 弹药补给
      { type: ENTITY_TYPE.ITEM, id: 'ammo_1', name: '脉冲步枪弹匣',
        x: 7, y: 5, sprite: '□', color: '#ffcc44',
        itemType: 'stat_boost', effect: { atk: 2 },
        description: '30发10mm无壳弹。适用于M41A脉冲步枪。',
      },
      // 急救
      { type: ENTITY_TYPE.ITEM, id: 'medkit_ch2_1', name: '医疗包',
        x: 17, y: 4, sprite: '♥', color: '#ff4488',
        itemType: 'consumable', effect: { heal: 40 },
      },
      // 走廊尽头异形
      { type: ENTITY_TYPE.ENEMY, id: 'xeno_drone_1', name: '异形工蜂',
        x: 18, y: 12, sprite: '虫', color: '#334433',
        hp: 45, atk: 15, def: 6, spd: 9, weaknesses: ['fire'], res: 10,
        rewards: { exp: 40, gold: 15 },
        geneLockCharge: 6,
        description: '一只成年工蜂异形。黑色外骨骼在灯光下泛着金属光泽，内颌可以轻松穿透装甲。近战击杀会遭受酸血反噬。',
        acidBlood: 5,
      },
      // 楼梯
      { type: ENTITY_TYPE.ITEM, id: 'stairs_2_1', name: '通往新人分队区',
        x: 19, y: 8, sprite: '▼', color: '#44ffff',
        itemType: 'stairs',
      },
    ],
  };
}

// ── 2-2 新人分队 ──
function generateFloor_2_2() {
  const grid = makeGrid();
  // 分叉走廊 — 队伍分流核心
  carveRoom(grid, 1, 7, 4, 9);    // 入口
  carveCorridor(grid, 4, 8, 8, 8); // 主走廊
  // 上路线（楚轩路线）
  carveCorridor(grid, 8, 8, 8, 4);
  carveRoom(grid, 8, 2, 13, 5);
  carveCorridor(grid, 13, 3, 17, 3);
  carveRoom(grid, 17, 1, 19, 5);
  // 下路线（郑吒路线）
  carveCorridor(grid, 8, 8, 8, 12);
  carveRoom(grid, 6, 12, 13, 15);
  carveCorridor(grid, 13, 13, 17, 13);
  carveRoom(grid, 17, 11, 19, 15);
  // 汇合点
  carveCorridor(grid, 19, 5, 19, 11);

  return {
    id: '2-2', name: '新人分队', subtitle: '走廊在这里分叉。每条路线都有它的代价和收获。', bgColor: '#080812', theme: 'alien_ship',
    tiles: grid, width: W, height: H, playerStart: { x: 2, y: 8 },
    entities: [
      // 分路选择事件
      { type: ENTITY_TYPE.EVENT, id: 'split_choice', name: '路线选择',
        x: 8, y: 8, sprite: '⚑', color: '#ffaa44',
        event: {
          type: 'choice',
          lines: [
            { text: '走廊在这里分叉。通风管道传来异形的声音——它们正在逼近。', speaker: '旁白' },
            { text: '必须分队行动。上面的控制室可以封锁舱门，下面的动力舱可以断开这一层的电力。', speaker: '楚轩' },
          ],
          choices: [
            { id: 'upper', text: '上路 — 跟随楚轩前往控制室', 
              effect: { flag: 'chose_upper_route', spd: 2, description: '楚轩的路线规划让你获得了战术优势',
                relationship: { chuxuan: 'good_decision' } } },
            { id: 'lower', text: '下路 — 率队前往动力舱', 
              effect: { flag: 'chose_lower_route', atk: 3, description: '在动力舱的危险环境中，你的战斗本能得到了磨炼',
                relationship: { mou_gang: 'good_decision', zhan_lan: 'good_decision' } } },
          ],
        },
      },
      // 上路线敌人
      { type: ENTITY_TYPE.ENEMY, id: 'xeno_scout_1', name: '异形侦察兵',
        x: 11, y: 3, sprite: '虫', color: '#445544',
        hp: 35, atk: 13, def: 4, spd: 10, weaknesses: ['fire'],
        rewards: { exp: 35, gold: 10 },
        geneLockCharge: 5,
        description: '一只快速移动的异形侦察兵。它正在通风管道中巡逻，会向蜂巢发出警报。',
        acidBlood: 4,
      },
      // 下路线敌人
      { type: ENTITY_TYPE.ENEMY, id: 'xeno_worker_1', name: '异形筑巢者',
        x: 10, y: 14, sprite: '虫', color: '#556644',
        hp: 50, atk: 12, def: 8, spd: 6, weaknesses: ['fire'], res: 15,
        rewards: { exp: 45, gold: 12 },
        geneLockCharge: 6,
        description: '一只正在构建蜂巢结构的异形筑巢者。厚重的外骨骼使它防御极高。',
        acidBlood: 6,
      },
      // 李帅西固定死亡事件
      { type: ENTITY_TYPE.EVENT, id: 'lishuaixi_death', name: '李帅西遇袭',
        x: 18, y: 13, sprite: '!', color: '#ff4444',
        event: {
          type: 'dialogue',
          lines: [
            { text: '一声惨叫从黑暗中传来——', speaker: '旁白' },
            { text: '李帅西！', speaker: '郑吒' },
            { text: '你赶到时，一只异形已经将他拖入通风管道。鲜血在金属地板上拖出长长的痕迹。', speaker: '旁白' },
            { text: '（李帅西 阵亡）', speaker: '旁白' },
            { text: '……继续前进。我们不能停下来。', speaker: '郑吒' },
          ],
          flag: 'lishuaixi_dead',
          removeCompanion: 'lishuaixi',
        },
      },
      // 补给
      { type: ENTITY_TYPE.ITEM, id: 'crystal_ch2_1', name: '异形结晶',
        x: 18, y: 3, sprite: '◆', color: '#44ffaa',
        itemType: 'stat_boost', effect: { def: 3 },
        description: '异形外骨骼碎片形成的结晶体。蕴含防御特性。',
      },
      { type: ENTITY_TYPE.ITEM, id: 'medkit_ch2_2', name: '医疗包',
        x: 7, y: 14, sprite: '♥', color: '#ff4488',
        itemType: 'consumable', effect: { heal: 50 },
      },
      // 楼梯
      { type: ENTITY_TYPE.ITEM, id: 'stairs_2_2', name: '通往通风管潜行区',
        x: 19, y: 8, sprite: '▼', color: '#44ffff',
        itemType: 'stairs',
      },
      { type: ENTITY_TYPE.ITEM, id: 'lore_weyland', name: '韦兰备忘录',
        x: 19, y: 1, sprite: '📋', color: '#ffcc44',
        itemType: 'lore', loreId: 'lore_2_weyland',
        description: '一份韦兰集团的内部备忘录。',
      },
    ],
  };
}

// ── 2-3 通风管潜行 ──
function generateFloor_2_3() {
  const grid = makeGrid();
  // 蛇形通风管道 — 潜行核心
  carveRoom(grid, 1, 1, 4, 3);
  carveCorridor(grid, 4, 2, 10, 2);
  carveCorridor(grid, 10, 2, 10, 6);
  carveCorridor(grid, 10, 6, 4, 6);
  carveCorridor(grid, 4, 6, 4, 10);
  carveCorridor(grid, 4, 10, 14, 10);
  carveCorridor(grid, 14, 10, 14, 14);
  carveRoom(grid, 14, 14, 19, 16);
  // 侧室
  carveRoom(grid, 12, 2, 15, 5);
  carveCorridor(grid, 12, 4, 10, 4);
  carveRoom(grid, 6, 12, 9, 14);
  carveCorridor(grid, 6, 10, 6, 12);

  return {
    id: '2-3', name: '通风管潜行', subtitle: '通风管道内伸手不见五指。金属管壁上传来异形爬行的刮擦声。', bgColor: '#060610', theme: 'alien_vent',
    tiles: grid, width: W, height: H, playerStart: { x: 2, y: 2 },
    entities: [
      { type: ENTITY_TYPE.EVENT, id: 'stealth_tutorial', name: '潜行提示',
        x: 3, y: 2, sprite: '?', color: '#ffcc44',
        event: {
          type: 'dialogue',
          lines: [
            { text: '通风管道内空间狭窄。异形在管壁上爬行，任何声响都会招来杀身之祸。', speaker: '旁白' },
            { text: '（提示：按Shift键减速潜行。被标记为"巡逻"的异形在察觉声源前不会主动攻击。）', speaker: '主神' },
          ],
          flag: 'stealth_tutorial_done',
        },
      },
      // 巡逻异形（潜行通过或战斗）
      { type: ENTITY_TYPE.ENEMY, id: 'xeno_patrol_1', name: '巡逻异形',
        x: 7, y: 2, sprite: '虫', color: '#334433',
        hp: 40, atk: 14, def: 5, spd: 8, weaknesses: ['fire'], res: 10,
        rewards: { exp: 35, gold: 10 },
        geneLockCharge: 5,
        description: '一只在通风管中巡逻的异形。如果不发出声响，也许可以避开它。',
        patrol: true,
        acidBlood: 4,
      },
      { type: ENTITY_TYPE.ENEMY, id: 'xeno_patrol_2', name: '巡逻异形',
        x: 7, y: 6, sprite: '虫', color: '#334433',
        hp: 40, atk: 14, def: 5, spd: 8, weaknesses: ['fire'], res: 10,
        rewards: { exp: 35, gold: 10 },
        geneLockCharge: 5,
        description: '又一只巡逻异形。它的头颅缓慢转动，在黑暗中搜索猎物。',
        patrol: true,
        acidBlood: 4,
      },
      // 固定伏击
      { type: ENTITY_TYPE.ENEMY, id: 'xeno_ambush_1', name: '伏击异形',
        x: 10, y: 10, sprite: '虫', color: '#553333',
        hp: 55, atk: 18, def: 6, spd: 11, weaknesses: ['fire'],
        rewards: { exp: 50, gold: 18 },
        geneLockCharge: 8,
        description: '从天花板突然掉落的异形！它一直潜伏在这里等待猎物经过。',
        acidBlood: 5,
      },
      // 晶石
      { type: ENTITY_TYPE.ITEM, id: 'crystal_ch2_2', name: '速度结晶',
        x: 14, y: 3, sprite: '◆', color: '#44ffaa',
        itemType: 'stat_boost', effect: { spd: 3 },
      },
      // 芯片掉落
      { type: ENTITY_TYPE.ITEM, id: 'chip_acid_resist', name: '抗酸芯片',
        x: 8, y: 13, sprite: '⬡', color: '#44cc88',
        itemType: 'chip',
        chip: { id: 'acid_resist', name: '抗酸', stat: 'def', value: 4, special: 'acid_resist' },
        description: '从异形外骨骼中提取的特殊芯片。减少酸血反噬伤害。',
      },
      { type: ENTITY_TYPE.ITEM, id: 'medkit_ch2_3', name: '医疗包',
        x: 16, y: 15, sprite: '♥', color: '#ff4488',
        itemType: 'consumable', effect: { heal: 50 },
      },
      // 楼梯
      { type: ENTITY_TYPE.ITEM, id: 'stairs_2_3', name: '通往隔离区',
        x: 18, y: 15, sprite: '▼', color: '#44ffff',
        itemType: 'stairs',
      },
    ],
  };
}

// ── 2-4 抱脸虫隔离 ──
function generateFloor_2_4() {
  const grid = makeGrid();
  // 实验室 + 隔离舱布局
  carveRoom(grid, 1, 6, 5, 10);   // 入口
  carveCorridor(grid, 5, 8, 9, 8);
  carveRoom(grid, 9, 4, 13, 7);   // 实验室A
  carveRoom(grid, 9, 9, 13, 12);  // 实验室B
  carveCorridor(grid, 11, 7, 11, 9); // 连接
  carveCorridor(grid, 13, 6, 17, 6);
  carveRoom(grid, 15, 2, 19, 5);  // 隔离舱
  carveCorridor(grid, 13, 11, 17, 11);
  carveRoom(grid, 15, 11, 19, 15); // 出口区

  return {
    id: '2-4', name: '抱脸虫隔离', subtitle: '隔离实验室充满了未知的恐惧。那些卵囊……似乎在呼吸。', bgColor: '#0a0810', theme: 'alien_lab',
    tiles: grid, width: W, height: H, playerStart: { x: 3, y: 8 },
    entities: [
      // 卵囊群
      { type: ENTITY_TYPE.ENEMY, id: 'egg_cluster_1', name: '异形卵囊群',
        x: 11, y: 5, sprite: '卵', color: '#665533',
        hp: 30, atk: 0, def: 2, spd: 0,
        rewards: { exp: 15, gold: 5 },
        geneLockCharge: 2,
        description: '一堆粘液覆盖的异形卵囊。如果不销毁，会持续孵化抱脸虫。接近时卵瓣会缓缓张开。',
        weaknesses: ['fire'],
      },
      { type: ENTITY_TYPE.ENEMY, id: 'facehugger_3', name: '抱脸虫',
        x: 10, y: 6, sprite: '蛛', color: '#886644',
        hp: 10, atk: 10, def: 1, spd: 14, weaknesses: ['fire'],
        rewards: { exp: 20, gold: 5 },
        geneLockCharge: 3,
        description: '从卵囊中爬出的抱脸虫。速度极快——必须在它扑到脸上前击杀。',
        acidBlood: 2,
      },
      { type: ENTITY_TYPE.ENEMY, id: 'facehugger_4', name: '抱脸虫',
        x: 12, y: 10, sprite: '蛛', color: '#886644',
        hp: 10, atk: 10, def: 1, spd: 14, weaknesses: ['fire'],
        rewards: { exp: 20, gold: 5 },
        geneLockCharge: 3,
        acidBlood: 2,
      },
      // 霸王固定死亡
      { type: ENTITY_TYPE.EVENT, id: 'bawang_death', name: '霸王遇袭',
        x: 17, y: 3, sprite: '!', color: '#ff4444',
        event: {
          type: 'dialogue',
          lines: [
            { text: '隔离舱内——霸王正在检查一个卵囊。', speaker: '旁白' },
            { text: '不要靠近那个——！', speaker: '郑吒' },
            { text: '卵囊骤然炸开。抱脸虫以惊人的速度扑向霸王的面部。一切发生在零点几秒之间。', speaker: '旁白' },
            { text: '（霸王 阵亡）', speaker: '旁白' },
            { text: '……', speaker: '郑吒' },
          ],
          flag: 'bawang_dead',
          removeCompanion: 'bawang',
        },
      },
      // 武器掉落
      { type: ENTITY_TYPE.ITEM, id: 'weapon_flamer', name: '火焰喷射器',
        x: 17, y: 14, sprite: '⚔', color: '#ff8844',
        itemType: 'weapon',
        weapon: { name: '火焰喷射器', atk: 10, damageType: 'fire', spd: -2 },
        description: '海军陆战队标配M240火焰喷射器。对异形极其有效。',
      },
      { type: ENTITY_TYPE.ITEM, id: 'medkit_ch2_4', name: '强效医疗包',
        x: 3, y: 9, sprite: '♥', color: '#ff4488',
        itemType: 'consumable', effect: { heal: 60 },
      },
      // 楼梯
      { type: ENTITY_TYPE.ITEM, id: 'stairs_2_4', name: '通往巢穴救援',
        x: 18, y: 13, sprite: '▼', color: '#44ffff',
        itemType: 'stairs',
      },
    ],
  };
}

// ── 2-5 巢穴救援 ──
function generateFloor_2_5() {
  const grid = makeGrid();
  // 蜂巢结构 — 有机曲线布局
  carveRoom(grid, 1, 7, 4, 9);
  carveCorridor(grid, 4, 8, 7, 8);
  carveRoom(grid, 7, 4, 11, 7);   // 外巢
  carveRoom(grid, 7, 9, 11, 12);  // 下层
  carveCorridor(grid, 9, 7, 9, 9);
  carveCorridor(grid, 11, 6, 15, 6);
  carveRoom(grid, 13, 2, 18, 5);  // 育成区
  carveCorridor(grid, 11, 11, 15, 11);
  carveRoom(grid, 13, 11, 18, 15); // 蜂巢核心
  carveCorridor(grid, 16, 5, 16, 11);

  return {
    id: '2-5', name: '巢穴救援', subtitle: '有机质覆盖了一切。这里是异形的王国。人类的残骸散落在粘液之间。', bgColor: '#0c0808', theme: 'alien_hive',
    tiles: grid, width: W, height: H, playerStart: { x: 2, y: 8 },
    entities: [
      // 异形战士群
      { type: ENTITY_TYPE.ENEMY, id: 'xeno_warrior_1', name: '异形战士',
        x: 9, y: 5, sprite: '獸', color: '#443322',
        hp: 65, atk: 20, def: 8, spd: 9, weaknesses: ['fire'], res: 15,
        rewards: { exp: 60, gold: 22 },
        geneLockCharge: 10,
        description: '成年异形战士。比工蜂更大、更强壮。它的尾巴可以轻松穿透钢板。',
        acidBlood: 8,
      },
      { type: ENTITY_TYPE.ENEMY, id: 'xeno_warrior_2', name: '异形战士',
        x: 10, y: 11, sprite: '獸', color: '#443322',
        hp: 65, atk: 20, def: 8, spd: 9, weaknesses: ['fire'], res: 15,
        rewards: { exp: 60, gold: 22 },
        geneLockCharge: 10,
        acidBlood: 8,
      },
      { type: ENTITY_TYPE.ENEMY, id: 'xeno_elite', name: '禁卫异形',
        x: 15, y: 3, sprite: '衞', color: '#553322',
        hp: 80, atk: 22, def: 10, spd: 10, weaknesses: ['fire'], res: 20,
        rewards: { exp: 75, gold: 30 },
        geneLockCharge: 12,
        description: '皇后的护卫。外骨骼异常坚硬，头冠上有独特的刃状突起。',
        acidBlood: 10,
      },
      // 牟钢救援事件（如果从Ch1存活） — 实际本章是新人死亡
      { type: ENTITY_TYPE.EVENT, id: 'newbie_deaths', name: '新人阵亡',
        x: 16, y: 12, sprite: '!', color: '#ff4444',
        event: {
          type: 'dialogue',
          lines: [
            { text: '蜂巢核心散落着人类的残骸。你认出了其中几个新人的装备。', speaker: '旁白' },
            { text: '……他们已经被异形带回来了。作为"宿主"。', speaker: '楚轩' },
            { text: '（多名新人 阵亡）', speaker: '旁白' },
            { text: '我们必须找到出路。继续深入只会送命。', speaker: '零点' },
          ],
          flag: 'newbie_deaths_seen',
        },
      },
      // 补给
      { type: ENTITY_TYPE.ITEM, id: 'crystal_ch2_3', name: '攻击结晶',
        x: 15, y: 14, sprite: '◆', color: '#ff8866',
        itemType: 'stat_boost', effect: { atk: 4 },
      },
      { type: ENTITY_TYPE.ITEM, id: 'medkit_ch2_5', name: '强效医疗包',
        x: 8, y: 10, sprite: '♥', color: '#ff4488',
        itemType: 'consumable', effect: { heal: 70 },
      },
      // 基因锁二阶觉醒（如果一阶已开）
      { type: ENTITY_TYPE.EVENT, id: 'gene_lock_stage2', name: '基因锁进阶',
        x: 16, y: 8, sprite: '🧬', color: '#ff6600',
        event: {
          type: 'gene_lock',
          requires: 'gene_lock_1',
          lines: [
            { text: '面对成群的异形，你体内的基因锁再次共鸣。', speaker: '旁白' },
            { text: '你能感受到肌肉纤维在分子层面重组——第二阶，肌肉控制。', speaker: '旁白' },
            { text: '（基因锁提升至二阶。ATK/DEF进一步强化。）', speaker: '主神' },
          ],
          flag: 'gene_lock_stage2',
          effect: { geneLock: 2 },
        },
      },
      // 楼梯
      { type: ENTITY_TYPE.ITEM, id: 'stairs_2_5', name: '通往皇后巢穴',
        x: 17, y: 14, sprite: '▼', color: '#44ffff',
        itemType: 'stairs',
      },
    ],
  };
}

// ── 2-6 皇后与撤离 ──
function generateFloor_2_6() {
  const grid = makeGrid();
  // 皇后巢穴 — 开阔大厅
  carveRoom(grid, 1, 6, 5, 10);    // 入口通道
  carveCorridor(grid, 5, 8, 8, 8);
  carveRoom(grid, 6, 1, 19, 16);   // 巨大巢穴大厅
  // 柱子/障碍（用墙壁表示）
  grid[4][10] = TILE.WALL; grid[4][14] = TILE.WALL;
  grid[8][10] = TILE.WALL; grid[8][14] = TILE.WALL;
  grid[12][10] = TILE.WALL; grid[12][14] = TILE.WALL;

  return {
    id: '2-6', name: '皇后与撤离', subtitle: '巢穴的中心。皇后的嘶鸣在整个舱室回荡。这是最后的战斗。', bgColor: '#100808', theme: 'alien_hive',
    tiles: grid, width: W, height: H, playerStart: { x: 3, y: 8 },
    entities: [
      // 异形守卫
      { type: ENTITY_TYPE.ENEMY, id: 'queen_guard_1', name: '皇后护卫',
        x: 8, y: 5, sprite: '衞', color: '#553322',
        hp: 70, atk: 20, def: 9, spd: 9, weaknesses: ['fire'], res: 15,
        rewards: { exp: 65, gold: 25 },
        geneLockCharge: 10,
        acidBlood: 8,
      },
      { type: ENTITY_TYPE.ENEMY, id: 'queen_guard_2', name: '皇后护卫',
        x: 8, y: 11, sprite: '衞', color: '#553322',
        hp: 70, atk: 20, def: 9, spd: 9, weaknesses: ['fire'], res: 15,
        rewards: { exp: 65, gold: 25 },
        geneLockCharge: 10,
        acidBlood: 8,
      },
      // BOSS — 异形皇后
      { type: ENTITY_TYPE.BOSS, id: 'boss_queen', bossId: 'alien_queen', traits: ['thorns', 'enrage'], name: '异形皇后',
        x: 15, y: 8, sprite: '皇', color: '#ff44ff',
        hp: 250, atk: 28, def: 15, spd: 7, crt: 12,
        weaknesses: ['fire'],
        res: 25,
        rewards: { exp: 300, gold: 300, rewardPoints: 300 },
        geneLockCharge: 30,
        description: '异形皇后。体型是普通异形的五倍，头冠如同王冠般展开。它不仅是战士，更是整个蜂巢的核心意志。尾刺可以瞬间贯穿装甲车，酸血喷溅范围极广。火焰是唯一可靠的弱点。建议在基因锁激活状态、装备火焰喷射器后挑战。',
        acidBlood: 15,
        onDefeat: {
          lines: [
            { text: '异形皇后发出震耳欲聋的嘶鸣，庞大的身躯轰然倒下。酸血从伤口喷涌而出，在金属地板上灼烧出巨大的坑洞。', speaker: '旁白' },
            { text: '……快走。飞船的自毁程序已经启动了。', speaker: '楚轩' },
            { text: '零点，掩护！', speaker: '郑吒' },
          ],
          flag: 'boss_queen_defeated',
        },
      },
      // 楚轩与郑吒决裂事件
      { type: ENTITY_TYPE.EVENT, id: 'chuxuan_split', name: '楚轩决裂',
        x: 17, y: 8, sprite: '!', color: '#ffaa44',
        event: {
          type: 'dialogue',
          requires: 'boss_queen_defeated',
          lines: [
            { text: '在撤离的混乱中，楚轩停下脚步，转身面对郑吒。', speaker: '旁白' },
            { text: '……我要带走异形的样本。这是我们唯一的机会。', speaker: '楚轩' },
            { text: '那东西会杀死所有人！', speaker: '郑吒' },
            { text: '所有人迟早都会死。但有了这个样本……', speaker: '楚轩' },
            { text: '（楚轩与郑吒产生了分歧。这将影响未来的队伍走向。）', speaker: '旁白' },
          ],
          flag: 'chuxuan_split',
        },
      },
      // 章节结束触发
      { type: ENTITY_TYPE.EVENT, id: 'ch2_ending', name: '撤离飞船',
        x: 18, y: 8, sprite: '▶', color: '#44ffff',
        event: {
          type: 'chapter_end',
          requires: 'boss_queen_defeated',
          lines: [
            { text: '逃生舱弹射出去的瞬间，身后的飞船化为一团巨大的火球。', speaker: '旁白' },
            { text: '存活者：郑吒、张杰、詹岚、楚轩、零点', speaker: '旁白' },
            { text: '阵亡者：李萧毅、李帅西、霸王、其他新人', speaker: '旁白' },
            { text: '……白色的光柱将你们带回了主神空间。', speaker: '旁白' },
          ],
          flag: 'ch2_complete',
        },
      },
      // 补给（boss前最后机会）
      { type: ENTITY_TYPE.ITEM, id: 'medkit_ch2_6', name: '军用急救包',
        x: 7, y: 8, sprite: '♥', color: '#ff4488',
        itemType: 'consumable', effect: { heal: 80 },
      },
      { type: ENTITY_TYPE.ITEM, id: 'crystal_ch2_4', name: '暴击结晶',
        x: 12, y: 3, sprite: '◆', color: '#ffcc44',
        itemType: 'stat_boost', effect: { crt: 5 },
      },
    ],
  };
}

// ── 导出 ──
export function generateChapter2() {
  return {
    name: '第二章 · 异形杀戮',
    world: '异形一',
    floors: [
      generateFloor_2_1(), // 飞船封锁
      generateFloor_2_2(), // 新人分队
      generateFloor_2_3(), // 通风管潜行
      generateFloor_2_4(), // 抱脸虫隔离
      generateFloor_2_5(), // 巢穴救援
      generateFloor_2_6(), // 皇后与撤离
    ],
  };
}
