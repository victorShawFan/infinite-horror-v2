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
};

// 敌人外观
const ENEMY_LOOKS = {
  zombie: { body: '#556655', head: '#667766', eye: '#ff2222', glow: '#44ff44' },
  crawler: { body: '#553333', head: '#664444', eye: '#ffaa00', glow: '#ff4444' },
  boss: { body: '#554466', head: '#665577', eye: '#ff44ff', glow: '#ff00ff' },
  mutant: { body: '#886644', head: '#997755', eye: '#ff6600', glow: '#ffaa44' },
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
  // 眼睛
  ctx.fillStyle = '#1a1a2a';
  ctx.fillRect(cx - s(3), headY + s(5), s(2), s(2));
  ctx.fillRect(cx + s(1), headY + s(5), s(2), s(2));
  // 眼白高光
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(cx - s(3), headY + s(5), s(1), s(1));
  ctx.fillRect(cx + s(1), headY + s(5), s(1), s(1));

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

export function drawWallTile(ctx, x, y, time) {
  ctx.fillStyle = '#1e1e2e';
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  const brickH = TILE_SIZE / 4;
  const brickW = TILE_SIZE / 2;
  for (let row = 0; row < 4; row++) {
    const offset = (row % 2) * (brickW / 2);
    for (let col = -1; col < 3; col++) {
      const bx = x + col * brickW + offset;
      const by = y + row * brickH;
      const shade = 25 + Math.sin(bx * 0.1 + by * 0.07) * 8;
      ctx.fillStyle = `rgb(${shade + 5}, ${shade}, ${shade + 12})`;
      ctx.fillRect(bx + 1, by + 1, brickW - 2, brickH - 2);
    }
  }
  ctx.fillStyle = 'rgba(80, 80, 120, 0.12)';
  ctx.fillRect(x, y, TILE_SIZE, 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.fillRect(x, y + TILE_SIZE - 2, TILE_SIZE, 2);
}

export function drawFloorTile(ctx, x, y, time) {
  const noise = Math.sin(x * 0.15 + y * 0.12) * 3;
  const base = 18 + noise;
  ctx.fillStyle = `rgb(${base + 2}, ${base}, ${base + 6})`;
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  ctx.strokeStyle = 'rgba(40, 40, 55, 0.4)';
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
