// ═══════════════════════════════════════════════════════════════
// 精灵渲染器 — 程序化小人偶 + 脚下全名
// ═══════════════════════════════════════════════════════════════

import { TILE_SIZE } from './constants.js';

// ── 角色外观配置 ──
const CHARACTER_LOOKS = {
  // 主角 - 深蓝连帽衫
  '郑吒': { hair: '#1a1a2a', skin: '#e8c8a0', top: '#2a3a6a', bottom: '#2a2a3a', accent: '#44aaff' },
  // 张杰 - 黑色战术服
  '张杰': { hair: '#111118', skin: '#d8b890', top: '#1a1a28', bottom: '#222230', accent: '#4488ff' },
  // 詹岚 - 灰白职业装
  '詹岚': { hair: '#2a1a10', skin: '#f0d0b0', top: '#556070', bottom: '#3a3a48', accent: '#44ff88', female: true },
  // 李萧毅 - 橘色快递服
  '李萧毅': { hair: '#1a1a1a', skin: '#e0c098', top: '#cc7722', bottom: '#3a3530', accent: '#ffaa44' },
  // 牟钢 - 迷彩军装
  '牟钢': { hair: '#0a0a0a', skin: '#c8a888', top: '#4a5530', bottom: '#3a3828', accent: '#cc8844' },
  // 楚轩 - 白色衬衫+眼镜（军师）
  '楚轩': { hair: '#1a1a1a', skin: '#e8c8a0', top: '#d0d0d0', bottom: '#2a2a38', accent: '#88ccff' },
  // 零点 - 黑色狙击手服
  '零点': { hair: '#111111', skin: '#d0b090', top: '#1a1a1a', bottom: '#1a1a22', accent: '#ff4444' },
  // 霸王 - 红色战斗服
  '霸王': { hair: '#0a0a0a', skin: '#c8a888', top: '#882222', bottom: '#2a2222', accent: '#ff6644' },
  // 赵樱空 - 黑色夜行衣
  '赵樱空': { hair: '#111118', skin: '#f0d0b8', top: '#1a1a28', bottom: '#1a1a22', accent: '#cc44cc', female: true },
  // 齐腾一 - 暗绿色猎装
  '齐腾一': { hair: '#1a1a0a', skin: '#d8b890', top: '#3a4428', bottom: '#2a2a22', accent: '#44aa44' },
  // 铭烟薇 - 紫色连衣裙
  '铭烟薇': { hair: '#2a1a18', skin: '#f0d0b8', top: '#6a3a6a', bottom: '#4a2a4a', accent: '#cc88ff', female: true },
  // 张恒 - 灰色古武袍
  '张恒': { hair: '#1a1a1a', skin: '#d8b890', top: '#4a4a4a', bottom: '#3a3a3a', accent: '#888888' },
  // 萧宏律 - 白红拉拉队服
  '萧宏律': { hair: '#2a1a10', skin: '#f0d0b8', top: '#cc2244', bottom: '#2a2a30', accent: '#ffffff', female: true },
  // 王侠 - 军绿色正装
  '王侠': { hair: '#0a0a0a', skin: '#c8a888', top: '#3a4430', bottom: '#2a3020', accent: '#668844' },
  // 程啸 - 迷彩作战服
  '程啸': { hair: '#111111', skin: '#d0b090', top: '#4a5530', bottom: '#3a4028', accent: '#aacc66' },
  // 罗甘道 - 浅蓝色T恤（新人感）
  '罗甘道': { hair: '#1a1a1a', skin: '#e8c8a0', top: '#4488aa', bottom: '#2a2a38', accent: '#66bbdd' },
  // 刘郁 - 深灰色便装
  '刘郁': { hair: '#1a1a1a', skin: '#e0c098', top: '#3a3a44', bottom: '#2a2a30', accent: '#667788', female: true },
  // 林俊天 - 黑色风衣
  '林俊天': { hair: '#111111', skin: '#d8b890', top: '#1a1a22', bottom: '#1a1a1a', accent: '#444466' },
  // 李帅西 - 黄色运动装
  '李帅西': { hair: '#1a1a0a', skin: '#d8b890', top: '#ccaa22', bottom: '#3a3828', accent: '#ffcc44' },
};

// 敌人外观
const ENEMY_LOOKS = {
  zombie: { body: '#556655', head: '#667766', eye: '#ff2222', glow: '#44ff44' },
  crawler: { body: '#553333', head: '#664444', eye: '#ffaa00', glow: '#ff4444' },
  boss: { body: '#554466', head: '#665577', eye: '#ff44ff', glow: '#ff00ff' },
  mutant: { body: '#886644', head: '#997755', eye: '#ff6600', glow: '#ffaa44' },
  facehugger: { body: '#887755', head: '#998866', eye: '#ffcc44', glow: '#ffaa00' },
  xenomorph: { body: '#222233', head: '#333344', eye: '#ccddff', glow: '#4488ff' },
  xeno_elite: { body: '#2a2a3a', head: '#3a3a4a', eye: '#88ccff', glow: '#66aaff' },
  queen: { body: '#332244', head: '#443355', eye: '#ff66ff', glow: '#ff44ff' },
  // Ch7-12 enemies
  demon: { body: '#552222', head: '#663333', eye: '#ff2222', glow: '#ff4444' },
  mech_drone: { body: '#445566', head: '#556677', eye: '#44ccff', glow: '#44aaff' },
  orc: { body: '#445533', head: '#556644', eye: '#ffaa22', glow: '#ff8822' },
  troll: { body: '#554433', head: '#665544', eye: '#ff4400', glow: '#ff6622' },
  nazgul: { body: '#222233', head: '#333344', eye: '#6622ff', glow: '#8844ff' },
  bug: { body: '#553322', head: '#664433', eye: '#ffcc44', glow: '#ffaa22' },
  dragon: { body: '#663322', head: '#774433', eye: '#ff6644', glow: '#ff4422' },
  raptor: { body: '#335522', head: '#446633', eye: '#ffee44', glow: '#ccff22' },
  nightmare_creature: { body: '#442244', head: '#553355', eye: '#ff44ff', glow: '#cc22cc' },
  spirit_entity: { body: '#334466', head: '#445577', eye: '#88ccff', glow: '#66aaff' },
  bio_elite: { body: '#445544', head: '#556655', eye: '#44ff44', glow: '#22cc22' },
  copy_fighter: { body: '#443344', head: '#554455', eye: '#ff88ff', glow: '#ff44ff' },
};

/**
 * 绘制像素风小人偶
 * @param {string} name - 角色全名，用于查找外观和显示
 * @param {string} color - 主题色（备选）
 * @param {object} options - { bob, showBase, isEnemy, enemyType, isPlayer }
 */
export function drawCharacterSprite(ctx, x, y, charOrName, color, size = TILE_SIZE * 0.6, options = {}) {
  const cx = x + TILE_SIZE / 2;
  const cy = y + TILE_SIZE / 2;
  const name = options.fullName || charOrName;
  const look = CHARACTER_LOOKS[name];
  const bobY = options.bob || 0;

  if (options.isEnemy) {
    _drawEnemySprite(ctx, x, y, charOrName, color, options);
    return;
  }

  if (look) {
    _drawHumanoidSprite(ctx, x, y, look, name, color, bobY, options);
  } else {
    // 未知角色 — 用通用小人偶
    const genericLook = { hair: '#333', skin: '#d8b890', top: color || '#888', bottom: '#333', accent: color || '#aaa' };
    _drawHumanoidSprite(ctx, x, y, genericLook, name, color, bobY, options);
  }
}

/** 绘制类人小人偶（头+身体+腿+名字） */
function _drawHumanoidSprite(ctx, x, y, look, name, color, bobY, options) {
  const cx = x + TILE_SIZE / 2;
  const baseY = y + TILE_SIZE - 6 + bobY;
  const scale = TILE_SIZE / 48; // 48px 基准
  const s = (v) => v * scale;

  // ── 脚下阴影 ──
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.ellipse(cx, baseY + 2, s(8), s(3), 0, 0, Math.PI * 2);
  ctx.fill();

  // ── 腿部 ──
  ctx.fillStyle = look.bottom;
  // 左腿
  ctx.fillRect(cx - s(5), baseY - s(10), s(4), s(10));
  // 右腿
  ctx.fillRect(cx + s(1), baseY - s(10), s(4), s(10));
  // 鞋子
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(cx - s(6), baseY - s(1), s(5), s(3));
  ctx.fillRect(cx + s(1), baseY - s(1), s(5), s(3));

  // ── 身体/上衣 ──
  ctx.fillStyle = look.top;
  const bodyTop = baseY - s(22);
  ctx.fillRect(cx - s(7), bodyTop, s(14), s(13));
  // 衣领/细节
  ctx.fillStyle = look.accent + '66';
  ctx.fillRect(cx - s(2), bodyTop, s(4), s(3));

  // ── 双臂 ──
  ctx.fillStyle = look.top;
  // 左臂
  ctx.fillRect(cx - s(10), bodyTop + s(1), s(4), s(10));
  // 右臂
  ctx.fillRect(cx + s(6), bodyTop + s(1), s(4), s(10));
  // 手
  ctx.fillStyle = look.skin;
  ctx.fillRect(cx - s(10), bodyTop + s(10), s(4), s(3));
  ctx.fillRect(cx + s(6), bodyTop + s(10), s(4), s(3));

  // ── 头部 ──
  const headY = bodyTop - s(11);
  // 头发（略大于脸，作背景）
  ctx.fillStyle = look.hair;
  roundRectFill(ctx, cx - s(6), headY - s(1), s(12), s(12), s(3));
  // 脸
  ctx.fillStyle = look.skin;
  roundRectFill(ctx, cx - s(5), headY + s(2), s(10), s(8), s(2));
  // 眼睛（根据朝向偏移瞳孔）
  const facing = options.facing || 'down';
  let eyeOX = 0, eyeOY = 0;
  if (facing === 'left') eyeOX = -s(1);
  else if (facing === 'right') eyeOX = s(1);
  else if (facing === 'up') eyeOY = -s(1);
  
  ctx.fillStyle = '#1a1a2a';
  ctx.fillRect(cx - s(3) + eyeOX, headY + s(5) + eyeOY, s(2), s(2));
  ctx.fillRect(cx + s(1) + eyeOX, headY + s(5) + eyeOY, s(2), s(2));
  // 眼白高光
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(cx - s(3) + eyeOX, headY + s(5) + eyeOY, s(1), s(1));
  ctx.fillRect(cx + s(1) + eyeOX, headY + s(5) + eyeOY, s(1), s(1));

  // ── 角色光环（玩家特有） ──
  if (options.isPlayer) {
    ctx.strokeStyle = look.accent + '44';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, baseY - s(16), s(16), 0, Math.PI * 2);
    ctx.stroke();
  }

  // ── 脚下全名 ──
  ctx.font = `bold ${Math.max(9, s(9))}px "Noto Serif SC", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillText(name, cx + 1, baseY + s(10) + 1);
  ctx.fillStyle = color || look.accent || '#e0e0e0';
  ctx.fillText(name, cx, baseY + s(10));
}

/** 绘制敌人精灵（怪物形态） */
function _drawEnemySprite(ctx, x, y, charOrName, color, options) {
  const cx = x + TILE_SIZE / 2;
  const baseY = y + TILE_SIZE - 6 + (options.bob || 0);
  const scale = TILE_SIZE / 48;
  const s = (v) => v * scale;
  const name = options.fullName || charOrName;

  // 根据名称选外观
  let look = ENEMY_LOOKS.zombie;
  if (name.includes('爬行') || name.includes('猎食')) look = ENEMY_LOOKS.crawler;
  if (name.includes('暴君') || name.includes('Boss') || options.isBoss) look = ENEMY_LOOKS.boss;
  if (name.includes('猎犬') || name.includes('变异')) look = ENEMY_LOOKS.mutant;
  // Ch2 异形系
  if (name.includes('抱脸')) look = ENEMY_LOOKS.facehugger;
  if (name.includes('异形') && !name.includes('皇后')) look = ENEMY_LOOKS.xenomorph;
  if (name.includes('禁卫') || name.includes('护卫')) look = ENEMY_LOOKS.xeno_elite;
  if (name.includes('皇后')) look = ENEMY_LOOKS.queen;
  if (name.includes('卵囊')) look = ENEMY_LOOKS.facehugger;

  // 阴影
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.ellipse(cx, baseY + 2, s(9), s(3), 0, 0, Math.PI * 2);
  ctx.fill();

  // 身体（畸形轮廓）
  ctx.fillStyle = look.body;
  roundRectFill(ctx, cx - s(7), baseY - s(22), s(14), s(20), s(3));
  
  // 头（略歪斜表示怪物感）
  ctx.fillStyle = look.head;
  roundRectFill(ctx, cx - s(6) - s(1), baseY - s(30), s(11), s(10), s(4));
  
  // 发光眼睛
  const eyePulse = 0.6 + 0.4 * Math.sin((options._time || 0) * 0.08);
  ctx.fillStyle = look.eye;
  ctx.globalAlpha = eyePulse;
  ctx.fillRect(cx - s(4), baseY - s(25), s(2), s(2));
  ctx.fillRect(cx + s(1), baseY - s(25), s(2), s(2));
  ctx.globalAlpha = 1;

  // 爪/手臂
  ctx.fillStyle = look.body;
  ctx.fillRect(cx - s(10), baseY - s(18), s(4), s(12));
  ctx.fillRect(cx + s(6), baseY - s(18), s(4), s(12));
  // 爪指
  ctx.fillStyle = '#332222';
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(cx - s(11) + i * s(1.5), baseY - s(7), s(1), s(3));
    ctx.fillRect(cx + s(6) + i * s(1.5), baseY - s(7), s(1), s(3));
  }

  // 腿
  ctx.fillStyle = look.body;
  ctx.fillRect(cx - s(5), baseY - s(4), s(4), s(6));
  ctx.fillRect(cx + s(1), baseY - s(4), s(4), s(6));

  // Boss 额外效果 — 光环
  if (options.isBoss) {
    ctx.strokeStyle = look.glow + '44';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, baseY - s(14), s(18), 0, Math.PI * 2);
    ctx.stroke();
  }

  // 脚下名字
  ctx.font = `bold ${Math.max(8, s(8))}px "Noto Serif SC", "Microsoft YaHei", sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(0,0,0,0.7)';
  ctx.fillText(name, cx + 1, baseY + s(10) + 1);
  ctx.fillStyle = color || look.glow || '#ff4444';
  ctx.fillText(name, cx, baseY + s(10));
}

// ── 图块绘制 ──

// 墙壁主题色表
const WALL_THEMES = {
  default: { base: '#1e1e2e', shadeR: 5, shadeG: 0, shadeB: 12, highlight: 'rgba(80, 80, 120, 0.12)' },
  alien_ship: { base: '#181828', shadeR: 3, shadeG: 5, shadeB: 15, highlight: 'rgba(40, 60, 120, 0.15)' },
  alien_vent: { base: '#141422', shadeR: 2, shadeG: 4, shadeB: 12, highlight: 'rgba(30, 50, 100, 0.12)' },
  alien_lab: { base: '#1a1626', shadeR: 6, shadeG: 2, shadeB: 14, highlight: 'rgba(60, 40, 100, 0.12)' },
  alien_hive: { base: '#201410', shadeR: 10, shadeG: 4, shadeB: 2, highlight: 'rgba(80, 40, 20, 0.15)' },
  // Ch3 咒怨
  juon_house:    { base: '#1a1410', shadeR: 12, shadeG: 8, shadeB: 4, highlight: 'rgba(80, 60, 40, 0.10)' },
  juon_basement: { base: '#0e0c08', shadeR: 8, shadeG: 6, shadeB: 2, highlight: 'rgba(50, 40, 20, 0.08)' },
  juon_attic:    { base: '#18140e', shadeR: 14, shadeG: 10, shadeB: 6, highlight: 'rgba(90, 70, 50, 0.12)' },
  juon_ritual:   { base: '#1a0808', shadeR: 16, shadeG: 4, shadeB: 4, highlight: 'rgba(100, 30, 30, 0.15)' },
  // Ch4 神鬼秘宝
  desert:        { base: '#2a2010', shadeR: 20, shadeG: 16, shadeB: 6, highlight: 'rgba(160, 140, 80, 0.12)' },
  desert_city:   { base: '#1e1808', shadeR: 16, shadeG: 12, shadeB: 4, highlight: 'rgba(140, 120, 60, 0.10)' },
  tomb:          { base: '#141008', shadeR: 12, shadeG: 8, shadeB: 3, highlight: 'rgba(100, 80, 40, 0.10)' },
  tomb_inner:    { base: '#100c06', shadeR: 10, shadeG: 6, shadeB: 2, highlight: 'rgba(80, 60, 30, 0.08)' },
  tomb_boss:     { base: '#180c04', shadeR: 14, shadeG: 5, shadeB: 2, highlight: 'rgba(120, 60, 20, 0.14)' },
  // Ch5 死神绝境
  modern_road:   { base: '#1a1a1a', shadeR: 8, shadeG: 8, shadeB: 8, highlight: 'rgba(100, 100, 100, 0.10)' },
  modern_city:   { base: '#181818', shadeR: 10, shadeG: 10, shadeB: 10, highlight: 'rgba(120, 120, 120, 0.08)' },
  modern_indoor: { base: '#161414', shadeR: 8, shadeG: 6, shadeB: 6, highlight: 'rgba(80, 70, 70, 0.10)' },
  mental_space:  { base: '#0a0a18', shadeR: 4, shadeG: 4, shadeB: 16, highlight: 'rgba(40, 40, 120, 0.15)' },
  // Ch6 水下
  alien_water:   { base: '#0a1018', shadeR: 4, shadeG: 8, shadeB: 14, highlight: 'rgba(30, 60, 100, 0.12)' },
  // Ch7/Ch10/Ch12 生化
  biolab:        { base: '#141410', shadeR: 10, shadeG: 10, shadeB: 4, highlight: 'rgba(80, 80, 30, 0.10)' },
  // Ch8 侏罗纪
  jungle:        { base: '#0a1408', shadeR: 4, shadeG: 14, shadeB: 3, highlight: 'rgba(30, 100, 20, 0.12)' },
  // Ch9 军事基地
  scifi_base:    { base: '#0c0c14', shadeR: 6, shadeG: 6, shadeB: 12, highlight: 'rgba(40, 50, 90, 0.12)' },
  // Ch10 魔戒
  fantasy:       { base: '#10100c', shadeR: 8, shadeG: 8, shadeB: 4, highlight: 'rgba(70, 70, 40, 0.10)' },
  // Ch11
  mech:          { base: '#0e1014', shadeR: 6, shadeG: 8, shadeB: 12, highlight: 'rgba(50, 60, 90, 0.12)' },
  nightmare:     { base: '#180810', shadeR: 14, shadeG: 4, shadeB: 10, highlight: 'rgba(100, 20, 60, 0.14)' },
  spirit:        { base: '#0c0c18', shadeR: 6, shadeG: 6, shadeB: 14, highlight: 'rgba(50, 50, 100, 0.15)' },
};

export function drawWallTile(ctx, x, y, time, theme) {
  const t = WALL_THEMES[theme] || WALL_THEMES.default;
  ctx.fillStyle = t.base;
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  const brickH = TILE_SIZE / 4;
  const brickW = TILE_SIZE / 2;
  for (let row = 0; row < 4; row++) {
    const offset = (row % 2) * (brickW / 2);
    for (let col = -1; col < 3; col++) {
      const bx = x + col * brickW + offset;
      const by = y + row * brickH;
      const shade = 25 + Math.sin(bx * 0.1 + by * 0.07) * 8;
      ctx.fillStyle = `rgb(${shade + t.shadeR}, ${shade + t.shadeG}, ${shade + t.shadeB})`;
      ctx.fillRect(bx + 1, by + 1, brickW - 2, brickH - 2);
    }
  }
  ctx.fillStyle = t.highlight;
  ctx.fillRect(x, y, TILE_SIZE, 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.fillRect(x, y + TILE_SIZE - 2, TILE_SIZE, 2);
}

const FLOOR_THEMES = {
  default: { rOff: 2, gOff: 0, bOff: 6, baseVal: 18, gridColor: 'rgba(40, 40, 55, 0.4)' },
  alien_ship: { rOff: 1, gOff: 2, bOff: 8, baseVal: 16, gridColor: 'rgba(30, 40, 70, 0.4)' },
  alien_vent: { rOff: 1, gOff: 1, bOff: 6, baseVal: 14, gridColor: 'rgba(25, 35, 60, 0.35)' },
  alien_lab: { rOff: 3, gOff: 1, bOff: 8, baseVal: 16, gridColor: 'rgba(40, 30, 60, 0.4)' },
  alien_hive: { rOff: 8, gOff: 3, bOff: 1, baseVal: 14, gridColor: 'rgba(60, 30, 20, 0.4)' },
  // Ch3 咒怨
  juon_house:    { rOff: 8, gOff: 5, bOff: 2, baseVal: 14, gridColor: 'rgba(50, 35, 20, 0.35)' },
  juon_basement: { rOff: 5, gOff: 3, bOff: 1, baseVal: 10, gridColor: 'rgba(30, 25, 15, 0.30)' },
  juon_attic:    { rOff: 10, gOff: 7, bOff: 3, baseVal: 16, gridColor: 'rgba(60, 45, 25, 0.35)' },
  juon_ritual:   { rOff: 12, gOff: 2, bOff: 2, baseVal: 12, gridColor: 'rgba(80, 20, 20, 0.40)' },
  // Ch4 神鬼秘宝
  desert:        { rOff: 16, gOff: 12, bOff: 4, baseVal: 22, gridColor: 'rgba(100, 80, 40, 0.30)' },
  desert_city:   { rOff: 14, gOff: 10, bOff: 3, baseVal: 18, gridColor: 'rgba(80, 60, 30, 0.30)' },
  tomb:          { rOff: 10, gOff: 7, bOff: 2, baseVal: 14, gridColor: 'rgba(60, 45, 20, 0.30)' },
  tomb_inner:    { rOff: 8, gOff: 5, bOff: 1, baseVal: 12, gridColor: 'rgba(50, 35, 15, 0.30)' },
  tomb_boss:     { rOff: 12, gOff: 4, bOff: 1, baseVal: 12, gridColor: 'rgba(80, 30, 15, 0.35)' },
  // Ch5 死神绝境
  modern_road:   { rOff: 6, gOff: 6, bOff: 6, baseVal: 20, gridColor: 'rgba(60, 60, 60, 0.30)' },
  modern_city:   { rOff: 8, gOff: 8, bOff: 8, baseVal: 18, gridColor: 'rgba(70, 70, 70, 0.25)' },
  modern_indoor: { rOff: 6, gOff: 4, bOff: 4, baseVal: 16, gridColor: 'rgba(50, 40, 40, 0.30)' },
  mental_space:  { rOff: 2, gOff: 2, bOff: 12, baseVal: 10, gridColor: 'rgba(20, 20, 80, 0.40)' },
  // Ch6 水下
  alien_water:   { rOff: 2, gOff: 6, bOff: 10, baseVal: 12, gridColor: 'rgba(15, 40, 70, 0.35)' },
  // Ch7/Ch10/Ch12 生化
  biolab:        { rOff: 8, gOff: 8, bOff: 2, baseVal: 14, gridColor: 'rgba(50, 50, 20, 0.30)' },
  // Ch8 侏罗纪
  jungle:        { rOff: 3, gOff: 12, bOff: 2, baseVal: 14, gridColor: 'rgba(20, 60, 15, 0.35)' },
  // Ch9 军事基地
  scifi_base:    { rOff: 4, gOff: 4, bOff: 10, baseVal: 14, gridColor: 'rgba(30, 35, 60, 0.35)' },
  // Ch10 魔戒
  fantasy:       { rOff: 6, gOff: 6, bOff: 3, baseVal: 16, gridColor: 'rgba(45, 45, 25, 0.30)' },
  // Ch11
  mech:          { rOff: 4, gOff: 6, bOff: 10, baseVal: 16, gridColor: 'rgba(35, 45, 65, 0.35)' },
  nightmare:     { rOff: 10, gOff: 2, bOff: 8, baseVal: 10, gridColor: 'rgba(60, 15, 40, 0.40)' },
  spirit:        { rOff: 4, gOff: 4, bOff: 12, baseVal: 12, gridColor: 'rgba(30, 30, 70, 0.40)' },
};

export function drawFloorTile(ctx, x, y, time, theme) {
  const ft = FLOOR_THEMES[theme] || FLOOR_THEMES.default;
  const noise = Math.sin(x * 0.15 + y * 0.12) * 3;
  const base = ft.baseVal + noise;
  ctx.fillStyle = `rgb(${base + ft.rOff}, ${base + ft.gOff}, ${base + ft.bOff})`;
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  ctx.strokeStyle = ft.gridColor;
  ctx.lineWidth = 0.5;
  ctx.strokeRect(x + 0.5, y + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
  ctx.fillStyle = 'rgba(30, 30, 45, 0.3)';
  ctx.fillRect(x + TILE_SIZE/2 - 0.5, y + 2, 1, TILE_SIZE - 4);
  ctx.fillRect(x + 2, y + TILE_SIZE/2 - 0.5, TILE_SIZE - 4, 1);
}

export function drawLavaTile(ctx, x, y, time) {
  const pulse = Math.sin(time * 0.06 + x * 0.1) * 0.5 + 0.5;
  const alpha = 0.6 + pulse * 0.4;
  ctx.fillStyle = 'rgba(60, 10, 5, 1)';
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  ctx.fillStyle = `rgba(255, 40, 20, ${alpha * 0.4})`;
  ctx.fillRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);
  const scanY = (time * 3 + y) % TILE_SIZE;
  ctx.fillStyle = `rgba(255, 200, 150, ${alpha * 0.2})`;
  ctx.fillRect(x + 4, y + scanY % (TILE_SIZE - 8) + 4, TILE_SIZE - 8, 2);
  ctx.strokeStyle = `rgba(255, 60, 40, ${0.4 + alpha * 0.3})`;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 3, y + 3, TILE_SIZE - 6, TILE_SIZE - 6);
}

export function drawStairsTile(ctx, x, y, time) {
  ctx.fillStyle = '#0f0f1c';
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  const alpha = 0.3 + 0.5 * Math.sin(time * 0.06);
  const gradient = ctx.createRadialGradient(
    x + TILE_SIZE / 2, y + TILE_SIZE / 2, 2,
    x + TILE_SIZE / 2, y + TILE_SIZE / 2, TILE_SIZE / 2
  );
  gradient.addColorStop(0, `rgba(68, 255, 255, ${alpha})`);
  gradient.addColorStop(0.5, `rgba(68, 200, 255, ${alpha * 0.4})`);
  gradient.addColorStop(1, 'rgba(68, 255, 255, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  ctx.fillStyle = `rgba(200, 255, 255, ${0.6 + alpha * 0.4})`;
  ctx.font = `bold ${TILE_SIZE * 0.4}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const floatY = Math.sin(time * 0.08) * 3;
  ctx.fillText('▲', x + TILE_SIZE / 2, y + TILE_SIZE / 2 - floatY);
  ctx.strokeStyle = `rgba(100, 255, 255, ${alpha * 0.4})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  const angle = time * 0.04;
  ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, TILE_SIZE * 0.35, angle, angle + Math.PI * 1.2);
  ctx.stroke();
}

export function drawHealthBar(ctx, x, y, ratio, width = TILE_SIZE - 8, height = 5) {
  const bx = x + 4;
  const by = y - 4;
  ctx.fillStyle = 'rgba(20, 20, 30, 0.85)';
  ctx.fillRect(bx - 1, by - 1, width + 2, height + 2);
  let c;
  if (ratio > 0.6) c = '#44cc44';
  else if (ratio > 0.3) c = '#ccaa44';
  else c = '#cc4444';
  const grad = ctx.createLinearGradient(bx, by, bx + width * ratio, by);
  grad.addColorStop(0, c);
  grad.addColorStop(1, c + 'aa');
  ctx.fillStyle = grad;
  ctx.fillRect(bx, by, width * Math.max(0, ratio), height);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.fillRect(bx, by, width * Math.max(0, ratio), height / 2);
}

// ── 工具 ──
function roundRectFill(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  ctx.fill();
}
