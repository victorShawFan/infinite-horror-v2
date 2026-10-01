// ═══════════════════════════════════════════════════════════════
// 无限恐怖：中洲轮回 — 核心常量
// ═══════════════════════════════════════════════════════════════

export const TILE_SIZE = 48;
export const CANVAS_TILES_X = 21;  // 奇数保证玩家居中
export const CANVAS_TILES_Y = 15;
export const CANVAS_W = TILE_SIZE * CANVAS_TILES_X;  // 1008
export const CANVAS_H = TILE_SIZE * CANVAS_TILES_Y;  // 720

// 地图图块类型
export const TILE = {
  VOID:    0,   // 虚空/未探索
  FLOOR:   1,   // 可行走地面
  WALL:    2,   // 墙壁
  DOOR:    3,   // 门（需要钥匙或条件）
  STAIRS:  4,   // 楼梯/传送点
  WATER:   5,   // 水/障碍地形
  LAVA:    6,   // 岩浆/危险地形
  VENT:    7,   // 通风管道
};

// 实体类型
export const ENTITY_TYPE = {
  PLAYER:     'player',
  ENEMY:      'enemy',
  NPC:        'npc',
  ITEM:       'item',
  TRAP:       'trap',
  EVENT:      'event',
  BOSS:       'boss',
  COMPANION:  'companion',
};

// 战斗属性
export const STAT = {
  HP:     'hp',
  MAX_HP: 'maxHp',
  ATK:    'atk',
  DEF:    'def',
  SPD:    'spd',     // 速度/先手
  CRT:    'crt',     // 暴击率 0-100
  RES:    'res',     // 抗性
  MANA:   'mana',    // 魔力/内力
  MAX_MANA: 'maxMana',
  STAMINA: 'stamina',
  MAX_STAMINA: 'maxStamina',
};

// 伤害类型
export const DAMAGE_TYPE = {
  PHYSICAL: 'physical',
  FIRE:     'fire',
  ICE:      'ice',
  POISON:   'poison',
  PSYCHIC:  'psychic',
  DARK:     'dark',
  HOLY:     'holy',
};

// 血统类型（参考原著）
export const BLOODLINE = {
  NONE:       'none',
  VAMPIRE:    'vampire',     // 血族
  ANCIENT_WU: 'ancient_wu',  // 古武
  DAOIST:     'daoist',      // 道法
  MARTIAL:    'martial',     // 武修
  DRAGON:     'dragon',      // 龙族（后期融合）
  PSYCHIC:    'psychic',     // 精神系
};

// 基因锁阶段
export const GENE_LOCK = {
  LOCKED:   0,
  STAGE_1:  1,  // 感知与反应增强
  STAGE_2:  2,  // 肌肉控制
  STAGE_3:  3,  // 模拟思维
  STAGE_4:  4,  // 入微与心灵之光
};

// 方向
export const DIR = {
  UP:    { x: 0, y: -1 },
  DOWN:  { x: 0, y: 1 },
  LEFT:  { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

// 游戏状态
export const GAME_STATE = {
  LOADING:     'loading',
  MAIN_MENU:   'main_menu',
  EXPLORING:   'exploring',
  COMBAT:      'combat',
  DIALOGUE:    'dialogue',
  SHOP:        'shop',         // 主神空间兑换
  INVENTORY:   'inventory',
  GAME_OVER:   'game_over',
  CUTSCENE:    'cutscene',
  LORD_GOD:    'lord_god',     // 主神空间
};

// 颜色主题
export const COLORS = {
  BG_DARK:      '#0a0a0f',
  BG_MEDIUM:    '#151520',
  WALL:         '#2a2a3a',
  WALL_LIGHT:   '#3a3a4a',
  FLOOR:        '#1a1a28',
  FLOOR_LIGHT:  '#222235',
  PLAYER:       '#44aaff',
  ENEMY:        '#ff4444',
  BOSS:         '#ff44ff',
  NPC:          '#44ff88',
  COMPANION:    '#4488ff',
  ITEM_COMMON:  '#aaaaaa',
  ITEM_RARE:    '#4488ff',
  ITEM_EPIC:    '#aa44ff',
  ITEM_LEGEND:  '#ffaa00',
  HP_BAR:       '#44cc44',
  HP_LOST:      '#cc4444',
  MANA_BAR:     '#4488ff',
  STAMINA_BAR:  '#ffcc44',
  TEXT_WHITE:   '#e0e0e0',
  TEXT_DIM:     '#888888',
  TEXT_DANGER:  '#ff4444',
  TEXT_HEAL:    '#44ff88',
  TEXT_GOLD:    '#ffcc44',
  GENE_LOCK:    '#ff6600',
  LORD_GOD:     '#ffffff',
  DOOR:         '#886644',
  STAIRS:       '#44ffff',
};
