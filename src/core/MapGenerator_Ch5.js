// ═══════════════════════════════════════════════════════════════
// 第五章 · 死神绝境 — 六节点地图生成
// 核心机制：因果连锁/环境死法预判/非敌人Boss/队长指令
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

// ── 5-1 高速巴士异变 ──
function generateFloor_5_1() {
  const grid = makeGrid();
  carveRoom(grid, 1, 7, 6, 10);
  carveCorridor(grid, 6, 8, 10, 8);
  carveRoom(grid, 10, 5, 15, 11);
  carveCorridor(grid, 15, 8, 19, 8);
  carveRoom(grid, 16, 6, 19, 10);
  carveRoom(grid, 3, 1, 8, 5);
  carveCorridor(grid, 5, 5, 5, 7);
  carveRoom(grid, 10, 13, 16, 16);
  carveCorridor(grid, 12, 11, 12, 13);
  grid[14][15] = TILE.STAIRS;
  return {
    id: '5-1', name: '高速巴士异变',
    subtitle: '巴士在高速公路上急转弯的一瞬间，死神的气息笼罩了所有人。',
    bgColor: '#10100c', theme: 'modern_road',
    tiles: grid, width: W, height: H, playerStart: { x: 3, y: 8 },
    entities: [
      { type: ENTITY_TYPE.EVENT, id: 'ch5_intro', name: '死神世界传送',
        x: 4, y: 8, sprite: '✦', color: '#ffffff',
        event: { type: 'dialogue', lines: [
          { text: '光芒消散时，你们坐在一辆疾驰的巴士上。窗外是高速公路。', speaker: '旁白' },
          { text: '新加入的王侠沉默不语——但她的存在似乎有些不同寻常。', speaker: '旁白' },
          { text: '这个世界……没有怪物。', speaker: '赵樱空' },
          { text: '因为"死神"就是这个世界本身。因果连锁——环境会自动杀死目标。', speaker: '张杰' },
          { text: '（主神提示：因果连锁已启动。观察环境征兆，提前预判和规避致命事件。）', speaker: '主神' },
        ] },
      },
      // 王侠临时入队
      { type: ENTITY_TYPE.COMPANION, id: 'wang_xia', name: '王侠',
        x: 2, y: 8, sprite: '侠', color: '#aabb88',
        dialogue: [
          { text: '王侠加入了队伍。', speaker: '系统' },
          { text: '（被动效果：国家计划 — DEF+2）', speaker: '系统' },
        ],
        companionData: { id: 'wang_xia', name: '王侠', passive: { def: 2 }, alive: true },
      },
      // 环境危险（以特殊敌人形式呈现）
      { type: ENTITY_TYPE.ENEMY, id: 'chain_accident_1', name: '失控卡车',
        x: 12, y: 8, sprite: '🚛', color: '#cc6644',
        hp: 50, atk: 25, def: 0, spd: 15,
        rewards: { exp: 40, gold: 30 },
        lore: '观察征兆后可以提前闪避',
      },
      { type: ENTITY_TYPE.ENEMY, id: 'chain_accident_2', name: '坠落电线',
        x: 18, y: 8, sprite: '⚡', color: '#ffdd44',
        hp: 40, atk: 30, def: 0, spd: 20,
        rewards: { exp: 45, gold: 25 },
      },
      { type: ENTITY_TYPE.ENEMY, id: 'chain_accident_3', name: '爆炸碎片',
        x: 6, y: 3, sprite: '💥', color: '#ff6644',
        hp: 35, atk: 22, def: 0, spd: 18,
        rewards: { exp: 35, gold: 25 },
      },
      { type: ENTITY_TYPE.ITEM, id: 'medkit_ch5_1', name: '急救包',
        x: 14, y: 14, sprite: '♥', color: '#ff4488',
        itemType: 'consumable', effect: { heal: 60 },
      },
      { type: ENTITY_TYPE.ITEM, id: 'spd_crystal_ch5_1', name: '速度结晶',
        x: 17, y: 9, sprite: '◆', color: '#44ffaa',
        itemType: 'stat_boost', effect: { spd: 3 },
      },
    ],
  };
}

// ── 5-2 连锁事故救援 ──
function generateFloor_5_2() {
  const grid = makeGrid();
  carveRoom(grid, 1, 1, 7, 6);
  carveCorridor(grid, 7, 3, 10, 3);
  carveRoom(grid, 10, 1, 16, 6);
  carveCorridor(grid, 13, 6, 13, 9);
  carveRoom(grid, 10, 9, 16, 13);
  carveRoom(grid, 1, 9, 7, 14);
  carveCorridor(grid, 4, 6, 4, 9);
  carveCorridor(grid, 7, 11, 10, 11);
  carveRoom(grid, 16, 10, 19, 15);
  carveCorridor(grid, 16, 12, 16, 12);
  grid[14][18] = TILE.STAIRS;
  return {
    id: '5-2', name: '连锁事故救援',
    subtitle: '火灾、爆炸、坍塌——死神的因果链像多米诺骨牌一样展开。',
    bgColor: '#121008', theme: 'modern_city',
    tiles: grid, width: W, height: H, playerStart: { x: 4, y: 3 },
    entities: [
      { type: ENTITY_TYPE.EVENT, id: 'rescue_event', name: '连锁救援',
        x: 13, y: 3, sprite: '🆘', color: '#ff4444',
        event: { type: 'dialogue', lines: [
          { text: '加油站起火了！连锁爆炸正在扩散！', speaker: '旁白' },
          { text: '所有人散开！按照我说的路线撤离！', speaker: '张杰' },
          { text: '（张杰的指挥让队伍勉强避开了最危险的爆炸区域。）', speaker: '旁白' },
        ], flag: 'rescue_done' },
      },
      { type: ENTITY_TYPE.ENEMY, id: 'gas_explosion', name: '汽油爆炸',
        x: 13, y: 11, sprite: '💥', color: '#ff8844',
        hp: 55, atk: 28, def: 0, spd: 20,
        rewards: { exp: 45, gold: 30 },
      },
      { type: ENTITY_TYPE.ENEMY, id: 'falling_debris', name: '坍塌碎石',
        x: 4, y: 12, sprite: '🪨', color: '#888866',
        hp: 60, atk: 20, def: 5, spd: 8,
        rewards: { exp: 40, gold: 30 },
      },
      // 王侠固定死亡
      { type: ENTITY_TYPE.EVENT, id: 'wang_xia_death', name: '王侠之死',
        x: 18, y: 12, sprite: '†', color: '#ff0000',
        event: { type: 'fixed_death', lines: [
          { text: '王侠冲进了坍塌的建筑——她说里面还有幸存者。', speaker: '旁白' },
          { text: '不——王侠！建筑要塌了！', speaker: '詹岚' },
          { text: '来不及了。整栋建筑轰然倒塌。', speaker: '旁白' },
          { text: '（王侠阵亡。国家计划的新人，最终也逃不过主神的规则。）', speaker: '主神' },
        ], flag: 'wang_xia_dead', companionDeath: 'wang_xia' },
      },
      { type: ENTITY_TYPE.ITEM, id: 'medkit_ch5_2', name: '急救包',
        x: 3, y: 1, sprite: '♥', color: '#ff4488',
        itemType: 'consumable', effect: { heal: 60 },
      },
      { type: ENTITY_TYPE.ITEM, id: 'def_crystal_ch5_2', name: '防御结晶',
        x: 15, y: 1, sprite: '◆', color: '#6688ff',
        itemType: 'stat_boost', effect: { def: 3 },
      },
    
      // 野外商人
      { type: ENTITY_TYPE.NPC, id: 'merchant_ch5', name: '幽灵商贩',
        x: 6, y: 5, sprite: '🏪', color: '#ffcc44', merchant: true,
        dialogue: [
          { text: '"死神的世界里……只有实力才是硬通货。来看看吧。"', speaker: '幽灵商贩' },
        ],
      },
    ],
  };
}

// ── 5-3 死神征兆分析 ──
function generateFloor_5_3() {
  const grid = makeGrid();
  carveRoom(grid, 1, 1, 6, 5);
  carveCorridor(grid, 6, 3, 10, 3);
  carveRoom(grid, 10, 1, 15, 5);
  carveCorridor(grid, 12, 5, 12, 9);
  carveRoom(grid, 9, 9, 15, 13);
  carveRoom(grid, 1, 8, 7, 12);
  carveCorridor(grid, 4, 5, 4, 8);
  carveCorridor(grid, 7, 10, 9, 10);
  carveRoom(grid, 15, 10, 19, 15);
  carveCorridor(grid, 15, 12, 15, 12);
  grid[14][18] = TILE.STAIRS;
  return {
    id: '5-3', name: '死神征兆分析',
    subtitle: '死亡前总有征兆——水渍、裂纹、温度变化。学会读懂它们，就能活下来。',
    bgColor: '#0e0e0a', theme: 'modern_indoor',
    tiles: grid, width: W, height: H, playerStart: { x: 3, y: 3 },
    entities: [
      { type: ENTITY_TYPE.EVENT, id: 'omen_tutorial', name: '征兆分析教学',
        x: 12, y: 3, sprite: '📋', color: '#ffdd88',
        event: { type: 'dialogue', lines: [
          { text: '张杰在白板上画出了因果链的分析图。', speaker: '旁白' },
          { text: '死神的因果链有一个规律——它总是从最不起眼的细节开始。', speaker: '张杰' },
          { text: '水管漏水→地面打滑→玻璃碎裂→碎片飞射。这就是一条完整的死亡链。', speaker: '张杰' },
          { text: '打断链条中的任何一环，就能阻止最终的死亡。', speaker: '张杰' },
          { text: '（获得技能"征兆分析"— 可提前预判环境危险。）', speaker: '主神' },
        ], flag: 'omen_tutorial_done' },
      },
      { type: ENTITY_TYPE.ENEMY, id: 'water_trap', name: '水管破裂陷阱',
        x: 4, y: 10, sprite: '💧', color: '#4488cc',
        hp: 45, atk: 20, def: 2, spd: 12,
        rewards: { exp: 35, gold: 25 },
      },
      { type: ENTITY_TYPE.ENEMY, id: 'glass_shatter', name: '碎玻璃飞射',
        x: 12, y: 11, sprite: '💎', color: '#aaccdd',
        hp: 40, atk: 24, def: 0, spd: 16,
        rewards: { exp: 40, gold: 25 },
      },
      { type: ENTITY_TYPE.ITEM, id: 'chip_holy', name: '圣光芯片',
        x: 18, y: 13, sprite: '💎', color: '#ffdd88',
        itemType: 'chip',
        chip: { id: 'holy', name: '圣', stat: 'atk', value: 4, damageType: 'holy' },
      },
      { type: ENTITY_TYPE.ITEM, id: 'medkit_ch5_3', name: '急救包',
        x: 2, y: 9, sprite: '♥', color: '#ff4488',
        itemType: 'consumable', effect: { heal: 60 },
      },
      { type: ENTITY_TYPE.ITEM, id: 'atk_crystal_ch5_3', name: '力量结晶',
        x: 14, y: 1, sprite: '◆', color: '#ff8844',
        itemType: 'stat_boost', effect: { atk: 4 },
      },
    ],
  };
}

// ── 5-4 队友被精神控制 ──
function generateFloor_5_4() {
  const grid = makeGrid();
  carveRoom(grid, 1, 6, 6, 11);
  carveCorridor(grid, 6, 8, 10, 8);
  carveRoom(grid, 10, 4, 15, 12);
  carveCorridor(grid, 15, 8, 18, 8);
  carveRoom(grid, 16, 5, 19, 11);
  carveRoom(grid, 5, 1, 10, 3);
  carveCorridor(grid, 8, 3, 8, 4);
  carveRoom(grid, 8, 13, 14, 16);
  carveCorridor(grid, 11, 12, 11, 13);
  grid[15][13] = TILE.STAIRS;
  return {
    id: '5-4', name: '队友被精神控制',
    subtitle: '张杰的眼神变了。那不是你认识的队长——死神的力量正在操纵他。',
    bgColor: '#0c0a0e', theme: 'modern_indoor',
    tiles: grid, width: W, height: H, playerStart: { x: 3, y: 8 },
    entities: [
      { type: ENTITY_TYPE.EVENT, id: 'mind_control', name: '精神控制发动',
        x: 4, y: 8, sprite: '🧠', color: '#aa44cc',
        event: { type: 'dialogue', lines: [
          { text: '张杰突然停下了脚步。他的瞳孔变成了深紫色。', speaker: '旁白' },
          { text: '队长？你怎么了？', speaker: '郑吒' },
          { text: '……杀了他们。全部杀了。', speaker: '张杰（被控）' },
          { text: '张杰被精神控制了！但我们不能伤害他——必须找到解除控制的方法！', speaker: '赵樱空' },
          { text: '（警告：张杰被精神控制。击败控制源可解除。不可杀死张杰。）', speaker: '主神' },
        ], flag: 'mind_control_done' },
      },
      // 精神控制源
      { type: ENTITY_TYPE.ENEMY, id: 'control_source_1', name: '精神控制节点',
        x: 12, y: 8, sprite: '🧠', color: '#9944bb',
        hp: 70, atk: 22, def: 8, spd: 10,
        damageType: 'psychic', weaknesses: ['holy'],
        rewards: { exp: 55, gold: 40 },
      },
      { type: ENTITY_TYPE.ENEMY, id: 'shadow_clone', name: '张杰的影子',
        x: 17, y: 8, sprite: '👤', color: '#443355',
        hp: 80, atk: 25, def: 10, spd: 11,
        damageType: 'psychic',
        rewards: { exp: 60, gold: 45 },
        lore: '张杰的影分身。击败它不会伤害张杰本人。',
      },
      { type: ENTITY_TYPE.ENEMY, id: 'fate_puppet', name: '因果傀儡',
        x: 8, y: 1, sprite: '🎭', color: '#886644',
        hp: 50, atk: 20, def: 5, spd: 9,
        rewards: { exp: 40, gold: 30 },
      },
      { type: ENTITY_TYPE.ITEM, id: 'medkit_ch5_4', name: '大型急救包',
        x: 11, y: 14, sprite: '♥', color: '#ff4488',
        itemType: 'consumable', effect: { heal: 80 },
      },
      { type: ENTITY_TYPE.ITEM, id: 'crt_crystal_ch5_4', name: '暴击结晶',
        x: 18, y: 6, sprite: '◆', color: '#ffcc44',
        itemType: 'stat_boost', effect: { crt: 4 },
      },
    ],
  };
}

// ── 5-5 郑吒对全队考验 ──
function generateFloor_5_5() {
  const grid = makeGrid();
  carveRoom(grid, 1, 1, 6, 6);
  carveCorridor(grid, 6, 3, 10, 3);
  carveRoom(grid, 10, 1, 16, 6);
  carveCorridor(grid, 13, 6, 13, 10);
  carveRoom(grid, 9, 10, 16, 14);
  carveRoom(grid, 1, 9, 7, 14);
  carveCorridor(grid, 4, 6, 4, 9);
  carveCorridor(grid, 7, 12, 9, 12);
  carveRoom(grid, 16, 11, 19, 16);
  carveCorridor(grid, 16, 13, 16, 13);
  grid[15][18] = TILE.STAIRS;
  return {
    id: '5-5', name: '郑吒对全队考验',
    subtitle: '张杰的精神压制不是攻击——而是考验。他要看看郑吒是否有资格成为队长。',
    bgColor: '#0a0a12', theme: 'mental_space',
    tiles: grid, width: W, height: H, playerStart: { x: 3, y: 3 },
    entities: [
      // ── 剧情选择：张杰的请求 ──
      { type: ENTITY_TYPE.EVENT, id: 'zhangjie_request', name: '张杰的请求',
        x: 4, y: 9, sprite: '?', color: '#ffcc44',
        event: {
          type: 'choice',
          lines: [
            { text: '张杰把你拉到一边。他的表情异常凝重。', speaker: '旁白' },
            { text: '郑吒……如果我出了什么事，你能替我照顾好他们吗？', speaker: '张杰' },
            { text: '（张杰的眼神里有一种你从未见过的东西——是释然。）', speaker: '旁白' },
          ],
          choices: [
            { id: 'promise', text: '我答应你。不管发生什么。',
              effect: { def: 3, hp: 20, description: '你许下了承诺，心中多了一份力量',
                relationship: { zhang_jie: 'save_life' } } },
            { id: 'refuse', text: '别说这种话。你会活着回来的。',
              effect: { atk: 4, description: '你拒绝接受这个可能性',
                relationship: { zhang_jie: 'honest_talk' } } },
            { id: 'question', text: '你是不是知道了什么？',
              effect: { crt: 3, description: '你洞察到了张杰隐藏的秘密',
                relationship: { zhang_jie: 'good_decision', chuxuan: 'good_decision' } } },
          ],
          flag: 'zhangjie_request_chosen',
        },
      },
      { type: ENTITY_TYPE.EVENT, id: 'captain_test', name: '队长考验开始',
        x: 4, y: 3, sprite: '⚔', color: '#ffcc44',
        event: { type: 'dialogue', lines: [
          { text: '张杰的念力场将所有人困住。这不是精神控制——这是考验。', speaker: '旁白' },
          { text: '郑吒。如果你想带领这支队伍，就用你的方式证明。', speaker: '张杰' },
          { text: '我不需要你的许可。我要保护每一个人——这就是我的答案。', speaker: '郑吒' },
          { text: '（队长考验开始：击败精神试炼体即为通过。）', speaker: '主神' },
        ], flag: 'captain_test_start' },
      },
      // 精神试炼体
      { type: ENTITY_TYPE.ENEMY, id: 'trial_fear', name: '恐惧之影',
        x: 13, y: 3, sprite: '😱', color: '#664488',
        hp: 70, atk: 22, def: 6, spd: 11,
        damageType: 'psychic', weaknesses: ['holy'],
        rewards: { exp: 50, gold: 35 },
      },
      { type: ENTITY_TYPE.ENEMY, id: 'trial_doubt', name: '疑虑之影',
        x: 12, y: 12, sprite: '❓', color: '#556688',
        hp: 65, atk: 20, def: 8, spd: 9,
        damageType: 'psychic',
        rewards: { exp: 50, gold: 35 },
      },
      { type: ENTITY_TYPE.ENEMY, id: 'trial_rage', name: '愤怒之影',
        x: 4, y: 12, sprite: '💢', color: '#884444',
        hp: 75, atk: 26, def: 5, spd: 12,
        damageType: 'psychic',
        rewards: { exp: 55, gold: 40 },
      },
      // 基因锁觉醒事件
      { type: ENTITY_TYPE.EVENT, id: 'genelock_stage3', name: '基因锁三阶',
        x: 18, y: 14, sprite: '🔓', color: '#ffaa44',
        event: { type: 'dialogue', lines: [
          { text: '打倒了三道心魔后，郑吒感到体内涌起前所未有的力量。', speaker: '旁白' },
          { text: '基因锁……第三阶！', speaker: '郑吒' },
          { text: '（基因锁提升至三阶。ATK/DEF大幅强化。）', speaker: '主神' },
        ], flag: 'genelock_3', effect: { geneLock: 3 } },
      },
      { type: ENTITY_TYPE.ITEM, id: 'medkit_ch5_5', name: '急救包',
        x: 2, y: 11, sprite: '♥', color: '#ff4488',
        itemType: 'consumable', effect: { heal: 70 },
      },
      // 张杰遗书线索
      { type: ENTITY_TYPE.ITEM, id: 'lore_death', name: '张杰的遗书',
        x: 11, y: 10, sprite: '✉', color: '#ffdd44',
        itemType: 'lore', loreId: 'lore_5_death',
        description: '一封写给郑吒的遗书，墨迹尚未干透。',
      },
    ],
  };
}

// ── 5-6 张杰告别与队长确认 ──
function generateFloor_5_6() {
  const grid = makeGrid();
  carveRoom(grid, 6, 5, 14, 12);
  carveRoom(grid, 1, 7, 5, 10);
  carveCorridor(grid, 5, 8, 6, 8);
  carveRoom(grid, 15, 7, 19, 10);
  carveCorridor(grid, 14, 8, 15, 8);
  carveRoom(grid, 8, 1, 12, 4);
  carveCorridor(grid, 10, 4, 10, 5);
  carveRoom(grid, 8, 13, 12, 16);
  carveCorridor(grid, 10, 12, 10, 13);
  grid[1][11] = TILE.STAIRS;
  return {
    id: '5-6', name: '张杰告别与队长确认',
    subtitle: '张杰微笑着。他知道，郑吒已经准备好了。',
    bgColor: '#0c0c14', theme: 'mental_space',
    tiles: grid, width: W, height: H, playerStart: { x: 10, y: 15 },
    entities: [
      // Boss: 张杰（非致命考验，实际是对话+仪式战）
      { type: ENTITY_TYPE.BOSS, id: 'boss_zhangjie', bossId: 'zhangjie', name: '张杰（引导者）',
        x: 10, y: 7, sprite: '张', color: '#ffaa44',
        hp: 200, atk: 25, def: 15, spd: 12,
        damageType: 'psychic',
        rewards: { exp: 200, gold: 100, rewardPoints: 300 },
        lore: '半引导者张杰的最终考验。这不是生死之战——而是意志的传承。',
      },
      // 前哨
      { type: ENTITY_TYPE.ENEMY, id: 'mental_guard_1', name: '意志守卫',
        x: 3, y: 8, sprite: '🛡', color: '#667788',
        hp: 65, atk: 20, def: 10, spd: 8,
        damageType: 'psychic',
        rewards: { exp: 45, gold: 30 },
      },
      { type: ENTITY_TYPE.ENEMY, id: 'mental_guard_2', name: '意志守卫',
        x: 17, y: 8, sprite: '🛡', color: '#667788',
        hp: 65, atk: 20, def: 10, spd: 8,
        damageType: 'psychic',
        rewards: { exp: 45, gold: 30 },
      },
      // 张杰固定死亡（Boss后触发）
      { type: ENTITY_TYPE.EVENT, id: 'zhangjie_death', name: '张杰的告别',
        x: 10, y: 5, sprite: '†', color: '#ffaa44',
        event: { type: 'fixed_death', lines: [
          { text: '张杰倒在了祭坛前。但他的脸上没有痛苦——只有欣慰。', speaker: '旁白' },
          { text: '郑吒……你通过了。从现在起，你就是中洲队的队长。', speaker: '张杰' },
          { text: '队长——！', speaker: '郑吒' },
          { text: '别哭。带着大家活下去。这是……我最后的命令。', speaker: '张杰' },
          { text: '张杰闭上了眼睛。作为半引导者，他完成了自己的使命。', speaker: '旁白' },
          { text: '（张杰牺牲。郑吒正式成为中洲队队长。）', speaker: '主神' },
        ], flag: 'zhangjie_dead', companionDeath: 'zhangjie' },
      },
      // 补给
      { type: ENTITY_TYPE.ITEM, id: 'medkit_ch5_6', name: '高级急救包',
        x: 8, y: 5, sprite: '♥', color: '#ff4488',
        itemType: 'consumable', effect: { heal: 100 },
      },
      // 结局
      { type: ENTITY_TYPE.EVENT, id: 'ch5_ending', name: '第五章结算',
        x: 10, y: 2, sprite: '✦', color: '#ffdd88',
        event: { type: 'chapter_end', lines: [
          { text: '光芒笼罩了所有人。回到主神空间时，郑吒发现自己站在了队长的位置上。', speaker: '旁白' },
          { text: '张杰不在了。但他的精神永远留在了这支队伍里。', speaker: '旁白' },
          { text: '我会保护好每一个人。这是我对你的承诺，队长。', speaker: '郑吒' },
          { text: '第五关「死神绝境」通关。获得基础奖励1000点。', speaker: '主神' },
        ], flag: 'ch5_complete', rewards: { rewardPoints: 1000 } },
      },
    ],
  };
}

export function generateChapter5() {
  return {
    name: '第五章 · 死神绝境',
    world: '死神来了二',
    floors: [
      generateFloor_5_1(), generateFloor_5_2(), generateFloor_5_3(),
      generateFloor_5_4(), generateFloor_5_5(), generateFloor_5_6(),
    ],
  };
}
