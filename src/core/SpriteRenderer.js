// ═══════════════════════════════════════════════════════════════
// 精灵渲染器 — 增强版像素风格 + 氛围光效
// ═══════════════════════════════════════════════════════════════

import { TILE_SIZE } from './constants.js';

/** 绘制墙壁图块（有深度感的砖石纹理） */
export function drawWallTile(ctx, x, y, time) {
  // 基础色 — 暗色调
  ctx.fillStyle = '#1e1e2e';
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  
  // 砖石纹理 
  const brickH = TILE_SIZE / 4;
  const brickW = TILE_SIZE / 2;
  for (let row = 0; row < 4; row++) {
    const offset = (row % 2) * (brickW / 2);
    for (let col = -1; col < 3; col++) {
      const bx = x + col * brickW + offset;
      const by = y + row * brickH;
      // 砖块色差
      const shade = 25 + Math.sin(bx * 0.1 + by * 0.07) * 8;
      ctx.fillStyle = `rgb(${shade + 5}, ${shade}, ${shade + 12})`;
      ctx.fillRect(bx + 1, by + 1, brickW - 2, brickH - 2);
    }
  }
  
  // 顶部高光
  ctx.fillStyle = 'rgba(80, 80, 120, 0.12)';
  ctx.fillRect(x, y, TILE_SIZE, 2);
  
  // 底部阴影
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.fillRect(x, y + TILE_SIZE - 2, TILE_SIZE, 2);
}

/** 绘制地面图块（微妙金属感地板） */
export function drawFloorTile(ctx, x, y, time) {
  // 基础地板色 — 细微变化
  const noise = Math.sin(x * 0.15 + y * 0.12) * 3;
  const base = 18 + noise;
  ctx.fillStyle = `rgb(${base + 2}, ${base}, ${base + 6})`;
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  
  // 地板格纹
  ctx.strokeStyle = 'rgba(40, 40, 55, 0.4)';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(x + 0.5, y + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
  
  // 中心十字花纹
  ctx.fillStyle = 'rgba(30, 30, 45, 0.3)';
  ctx.fillRect(x + TILE_SIZE/2 - 0.5, y + 2, 1, TILE_SIZE - 4);
  ctx.fillRect(x + 2, y + TILE_SIZE/2 - 0.5, TILE_SIZE - 4, 1);
  
  // 金属高光点
  const glint = Math.sin(time * 0.02 + x * 0.3 + y * 0.2);
  if (glint > 0.85) {
    ctx.fillStyle = `rgba(100, 100, 140, ${(glint - 0.85) * 3})`;
    ctx.fillRect(x + TILE_SIZE/2, y + TILE_SIZE/2, 2, 2);
  }
}

/** 绘制岩浆/激光图块 */
export function drawLavaTile(ctx, x, y, time) {
  const pulse = Math.sin(time * 0.06 + x * 0.1) * 0.5 + 0.5;
  const alpha = 0.6 + pulse * 0.4;
  
  // 危险红色基底
  ctx.fillStyle = `rgba(60, 10, 5, 1)`;
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  
  // 脉动光效
  ctx.fillStyle = `rgba(255, 40, 20, ${alpha * 0.4})`;
  ctx.fillRect(x + 4, y + 4, TILE_SIZE - 8, TILE_SIZE - 8);
  
  // 激光扫描线
  const scanY = (time * 3 + y) % TILE_SIZE;
  ctx.fillStyle = `rgba(255, 200, 150, ${alpha * 0.2})`;
  ctx.fillRect(x + 4, y + scanY % (TILE_SIZE - 8) + 4, TILE_SIZE - 8, 2);
  
  // 危险边框闪烁
  ctx.strokeStyle = `rgba(255, 60, 40, ${0.4 + alpha * 0.3})`;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x + 3, y + 3, TILE_SIZE - 6, TILE_SIZE - 6);
  
  // 角落警示符
  ctx.fillStyle = `rgba(255, 100, 60, ${alpha * 0.6})`;
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('⚡', x + TILE_SIZE/2, y + TILE_SIZE/2 + 4);
}

/** 绘制楼梯/传送图块（动态光环） */
export function drawStairsTile(ctx, x, y, time) {
  // 暗色基底
  ctx.fillStyle = '#0f0f1c';
  ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

  // 传送光环 — 脉动
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

  // 上升箭头
  ctx.fillStyle = `rgba(200, 255, 255, ${0.6 + alpha * 0.4})`;
  ctx.font = `bold ${TILE_SIZE * 0.4}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const floatY = Math.sin(time * 0.08) * 3;
  ctx.fillText('▲', x + TILE_SIZE / 2, y + TILE_SIZE / 2 - floatY);

  // 旋转光圈
  ctx.strokeStyle = `rgba(100, 255, 255, ${alpha * 0.4})`;
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
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(cx, y + TILE_SIZE - 5, TILE_SIZE * 0.28, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // 角色底色光晕
  if (options.showBase !== false) {
    const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, TILE_SIZE * 0.4);
    glow.addColorStop(0, color + '22');
    glow.addColorStop(1, color + '00');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cx, cy, TILE_SIZE * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // 文字角色 — 带描边增强辨识度
  ctx.fillStyle = color;
  ctx.font = `bold ${size}px "Noto Serif SC", "Microsoft YaHei", serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  ctx.strokeStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.lineWidth = 3;
  ctx.strokeText(char, cx, cy + (options.bob || 0));
  ctx.fillText(char, cx, cy + (options.bob || 0));
}

/** 绘制HP条（带渐变和边框） */
export function drawHealthBar(ctx, x, y, ratio, width = TILE_SIZE - 8, height = 5) {
  const bx = x + 4;
  const by = y - 4;

  // 背景
  ctx.fillStyle = 'rgba(20, 20, 30, 0.85)';
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
