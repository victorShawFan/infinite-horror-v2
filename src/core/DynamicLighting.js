// ═══════════════════════════════════════════════════════════════
// 动态光照系统 — 视觉深度与氛围增强
// ═══════════════════════════════════════════════════════════════
//
// 为每个章节提供动态光照效果：
// - 火把/光源在角色周围创建照明半径
// - 章节特定的环境光色温
// - 楼层切换时的渐变过渡
// - Boss房间特殊光效

import { TILE_SIZE } from './constants.js';

// ── 章节光照配置 ──
const CHAPTER_LIGHTING = {
  1:  { ambient: 0.35, playerLight: 4.5, color: [40, 255, 40],    name: '生化实验室' },
  2:  { ambient: 0.25, playerLight: 4.0, color: [60, 100, 200],   name: '异形飞船' },
  3:  { ambient: 0.20, playerLight: 3.5, color: [100, 80, 160],   name: '咒怨宅邸' },
  4:  { ambient: 0.40, playerLight: 5.0, color: [200, 160, 80],   name: '古埃及陵墓' },
  5:  { ambient: 0.45, playerLight: 5.0, color: [120, 130, 160],  name: '死神领域' },
  6:  { ambient: 0.22, playerLight: 3.5, color: [40, 120, 180],   name: '深海设施' },
  7:  { ambient: 0.30, playerLight: 4.0, color: [200, 60, 40],    name: '浣熊市废墟' },
  8:  { ambient: 0.50, playerLight: 6.0, color: [120, 180, 80],   name: '中洲原野' },
  9:  { ambient: 0.35, playerLight: 4.5, color: [140, 160, 200],  name: '虫族战场' },
  10: { ambient: 0.40, playerLight: 5.0, color: [180, 140, 60],   name: '五队战场' },
  11: { ambient: 0.18, playerLight: 3.0, color: [160, 80, 200],   name: '梦境边界' },
  12: { ambient: 0.25, playerLight: 4.0, color: [200, 100, 60],   name: '主神核心' },
};

/**
 * 动态光照渲染器
 */
export class DynamicLighting {
  constructor() {
    this._lightCanvas = null;
    this._lightCtx = null;
    this._currentChapter = 0;
    this._flickerPhase = 0;
    this._transitionAlpha = 0;
  }

  /**
   * 初始化光照缓冲Canvas
   */
  init(width, height) {
    this._lightCanvas = document.createElement('canvas');
    this._lightCanvas.width = width;
    this._lightCanvas.height = height;
    this._lightCtx = this._lightCanvas.getContext('2d');
  }

  /**
   * 渲染动态光照层
   * @param {CanvasRenderingContext2D} ctx - 主画布上下文
   * @param {number} chapter - 当前章节
   * @param {number} playerScreenX - 玩家屏幕X坐标
   * @param {number} playerScreenY - 玩家屏幕Y坐标  
   * @param {number} time - 时间戳
   * @param {Array} lightSources - 额外光源 [{x, y, radius, color}]
   */
  render(ctx, chapter, playerScreenX, playerScreenY, time, lightSources = []) {
    if (!this._lightCanvas) return;
    
    const lctx = this._lightCtx;
    const w = this._lightCanvas.width;
    const h = this._lightCanvas.height;
    const config = CHAPTER_LIGHTING[chapter] || CHAPTER_LIGHTING[1];
    
    // Flicker effect for atmosphere
    this._flickerPhase += 0.03;
    const flicker = 1 + Math.sin(this._flickerPhase) * 0.03 + Math.sin(this._flickerPhase * 2.7) * 0.02;
    
    // Fill with darkness
    lctx.fillStyle = `rgba(0, 0, 0, ${1 - config.ambient})`;
    lctx.fillRect(0, 0, w, h);
    
    // Composite mode for light subtraction
    lctx.globalCompositeOperation = 'destination-out';
    
    // Player light source (torch-like)
    const lightR = config.playerLight * TILE_SIZE * flicker;
    const gradient = lctx.createRadialGradient(
      playerScreenX, playerScreenY, 0,
      playerScreenX, playerScreenY, lightR
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
    gradient.addColorStop(0.3, 'rgba(0, 0, 0, 0.8)');
    gradient.addColorStop(0.6, 'rgba(0, 0, 0, 0.4)');
    gradient.addColorStop(0.85, 'rgba(0, 0, 0, 0.1)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    lctx.fillStyle = gradient;
    lctx.beginPath();
    lctx.arc(playerScreenX, playerScreenY, lightR, 0, Math.PI * 2);
    lctx.fill();
    
    // Additional light sources (stairs, items, etc.)
    for (const src of lightSources) {
      const sr = (src.radius || 2) * TILE_SIZE * flicker * 0.8;
      const sg = lctx.createRadialGradient(src.x, src.y, 0, src.x, src.y, sr);
      sg.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
      sg.addColorStop(0.5, 'rgba(0, 0, 0, 0.2)');
      sg.addColorStop(1, 'rgba(0, 0, 0, 0)');
      lctx.fillStyle = sg;
      lctx.beginPath();
      lctx.arc(src.x, src.y, sr, 0, Math.PI * 2);
      lctx.fill();
    }
    
    lctx.globalCompositeOperation = 'source-over';
    
    // Add colored light tint
    lctx.globalCompositeOperation = 'source-atop';
    const [r, g, b] = config.color;
    lctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.15)`;
    lctx.fillRect(0, 0, w, h);
    lctx.globalCompositeOperation = 'source-over';
    
    // Apply light layer to main canvas
    ctx.drawImage(this._lightCanvas, 0, 0);
  }
}

export const dynamicLighting = new DynamicLighting();
export { CHAPTER_LIGHTING };
