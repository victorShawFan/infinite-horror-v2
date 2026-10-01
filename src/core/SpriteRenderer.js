// ═══════════════════════════════════════════════════════════════
// 精细像素渲染 — 用Canvas绘制带纹理的精致图块和角色
// ═══════════════════════════════════════════════════════════════

import { TILE_SIZE } from './constants.js';

// 预渲染纹理缓存
const _cache = new Map();

/** 获取或创建指定key的缓存 canvas */
function getCached(key, w, h, drawFn) {
  if (_cache.has(key)) return _cache.get(key);
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  drawFn(ctx, w, h);
  _cache.set(key, c);
  return c;
}

/** 绘制墙壁图块（带砖石纹理） */
export function drawWallTile(ctx, x, y) {
  const tile = getCached('wall', TILE_SIZE, TILE_SIZE, (c, w, h) => {
    // 基底
    c.fillStyle = '#2a2a3a';
    c.fillRect(0, 0, w, h);
    // 砖块线
    c.strokeStyle = '#353548';
    c.lineWidth = 1;
    for (let row = 0; row < 3; row++) {
      const ry = row * 16 + 2;
      c.strokeRect(row % 2 === 0 ? 2 : 14, ry, 22, 14);
      c.strokeRect(row % 2 === 0 ? 26 : 2, ry, 22, 14);
    }
    // 顶部高光
    c.fillStyle = '#3a3a50';
    c.fillRect(0, 0, w, 3);
    // 左侧高光
    c.fillStyle = '#333348';
    c.fillRect(0, 0, 3, h);
    // 底部阴影
    c.fillStyle = '#1a1a28';
    c.fillRect(0, h - 2, w, 2);
    // 随机杂点
    for (let i = 0; i < 8; i++) {
      c.fillStyle = `rgba(${50 + Math.random() * 20}, ${50 + Math.random() * 20}, ${70 + Math.random() * 20}, 0.3)`;
      c.fillRect(Math.random() * w | 0, Math.random() * h | 0, 2, 2);
    }
  });
  ctx.drawImage(tile, x, y);
}

/** 绘制地板图块（带裂纹纹理） */
export function drawFloorTile(ctx, x, y, variant = 0) {
  const key = `floor_${variant % 4}`;
  const tile = getCached(key, TILE_SIZE, TILE_SIZE, (c, w, h) => {
    // 基底
    const v = variant % 4;
    c.fillStyle = v < 2 ? '#1a1a28' : '#1e1e2c';
    c.fillRect(0, 0, w, h);
    // 网格线
    c.strokeStyle = 'rgba(60, 60, 80, 0.15)';
    c.lineWidth = 0.5;
    c.strokeRect(1, 1, w - 2, h - 2);
    // 细微裂纹
    c.strokeStyle = 'rgba(40, 40, 55, 0.4)';
    c.lineWidth = 0.5;
    c.beginPath();
    if (v === 0) { c.moveTo(10, 10); c.lineTo(30, 25); c.lineTo(40, 20); }
    if (v === 1) { c.moveTo(5, 35); c.lineTo(20, 20); c.lineTo(35, 30); }
    if (v === 2) { c.moveTo(15, 5); c.lineTo(25, 30); }
    if (v === 3) { c.moveTo(35, 5); c.lineTo(15, 40); }
    c.stroke();
    // 锈迹/污渍
    if (v === 1 || v === 3) {
      c.fillStyle = 'rgba(80, 50, 40, 0.08)';
      c.beginPath();
      c.arc(20 + v * 5, 24, 8, 0, Math.PI * 2);
      c.fill();
    }
  });
  ctx.drawImage(tile, x, y);
}

/** 绘制岩浆/激光图块（动态） */
export function drawLavaTile(ctx, x, y, time) {
  // 激光红色脉动
  const alpha = 0.4 + 0.4 * Math.sin(time * 0.12 + x * 0.01);
  ctx.fillStyle = '#1a1a28';
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  // 核心光芒
  ctx.fillStyle = `rgba(255, 40, 20, ${alpha})`;
  ctx.fillRect(x + 6, y + 6, TILE_SIZE - 12, TILE_SIZE - 12);
  // 外层光晕
  ctx.fillStyle = `rgba(255, 80, 40, ${alpha * 0.3})`;
  ctx.fillRect(x + 2, y + 2, TILE_SIZE - 4, TILE_SIZE - 4);
  // 扫描线效果
  ctx.fillStyle = `rgba(255, 200, 150, ${alpha * 0.15})`;
  const scanY = (time * 2 + y) % TILE_SIZE;
  ctx.fillRect(x + 4, y + scanY, TILE_SIZE - 8, 2);
  // 边框
  ctx.strokeStyle = `rgba(255, 60, 40, ${0.5 + alpha * 0.3})`;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);
}

/** 绘制楼梯图块（动态闪烁） */
export function drawStairsTile(ctx, x, y, time) {
  ctx.fillStyle = '#1a1a28';
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

  // 传送光环
  const alpha = 0.3 + 0.5 * Math.sin(time * 0.06);
  const gradient = ctx.createRadialGradient(
    x + TILE_SIZE / 2, y + TILE_SIZE / 2, 2,
    x + TILE_SIZE / 2, y + TILE_SIZE / 2, TILE_SIZE / 2
  );
  gradient.addColorStop(0, `rgba(68, 255, 255, ${alpha})`);
  gradient.addColorStop(0.6, `rgba(68, 200, 255, ${alpha * 0.3})`);
  gradient.addColorStop(1, 'rgba(68, 255, 255, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

  // 上升箭头
  ctx.fillStyle = `rgba(200, 255, 255, ${0.6 + alpha * 0.4})`;
  ctx.font = `bold ${TILE_SIZE * 0.45}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('▲', x + TILE_SIZE / 2, y + TILE_SIZE / 2 - Math.sin(time * 0.08) * 3);

  // 旋转光圈
  ctx.strokeStyle = `rgba(100, 255, 255, ${alpha * 0.5})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  const angle = time * 0.04;
  ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, TILE_SIZE * 0.35, angle, angle + Math.PI * 1.2);
  ctx.stroke();
}

/** 绘制角色精灵（带阴影和光晕） */
export function drawCharacterSprite(ctx, x, y, char, color, size = TILE_SIZE * 0.6, options = {}) {
  const cx = x + TILE_SIZE / 2;
  const cy = y + TILE_SIZE / 2;

  // 脚下阴影
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  ctx.beginPath();
  ctx.ellipse(cx, y + TILE_SIZE - 6, TILE_SIZE * 0.3, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // 角色底色圆
  if (options.showBase !== false) {
    ctx.fillStyle = `${color}22`;
    ctx.beginPath();
    ctx.arc(cx, cy, TILE_SIZE * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // 文字角色
  ctx.fillStyle = color;
  ctx.font = `bold ${size}px "Microsoft YaHei", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 文字描边增加辨识度
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.lineWidth = 3;
  ctx.strokeText(char, cx, cy + (options.bob || 0));
  ctx.fillText(char, cx, cy + (options.bob || 0));
}

/** 绘制HP条（带渐变和边框） */
export function drawHealthBar(ctx, x, y, ratio, width = TILE_SIZE - 8, height = 5) {
  const bx = x + 4;
  const by = y - 4;

  // 背景
  ctx.fillStyle = 'rgba(20, 20, 30, 0.8)';
  ctx.fillRect(bx - 1, by - 1, width + 2, height + 2);

  // HP颜色
  let color;
  if (ratio > 0.6) color = '#44cc44';
  else if (ratio > 0.3) color = '#ccaa44';
  else color = '#cc4444';

  // HP渐变
  const grad = ctx.createLinearGradient(bx, by, bx + width * ratio, by);
  grad.addColorStop(0, color);
  grad.addColorStop(1, color + 'aa');

  ctx.fillStyle = grad;
  ctx.fillRect(bx, by, width * Math.max(0, ratio), height);

  // 高光
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.fillRect(bx, by, width * Math.max(0, ratio), height / 2);
}
