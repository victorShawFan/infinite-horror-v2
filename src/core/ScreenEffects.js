// ═══════════════════════════════════════════════════════════════
// 画面后处理特效 — 视觉氛围增强
// ═══════════════════════════════════════════════════════════════
//
// Canvas叠加层特效：
// - 暗角（vignette）
// - 章节色调滤镜
// - 低血量红屏脉动
// - 基因锁激活光效
// - 战斗震屏
// - 楼层切换渐变
// ═══════════════════════════════════════════════════════════════

import { gameState } from './GameState.js';

export class ScreenEffects {
  constructor(canvas) {
    this._canvas = canvas;
    this._ctx = canvas.getContext('2d');
    this._effects = [];
    this._vignetteEnabled = true;
    this._screenShake = { x: 0, y: 0, intensity: 0, decay: 0.9 };
    this._flashColor = null;
    this._flashAlpha = 0;
    this._lowHpPulse = 0;
    this._geneLockGlow = 0;
    this._transitionAlpha = 0;
    this._transitionDir = 0; // 1=fade in, -1=fade out
    
    // ── 环境粒子系统 ──
    this._particles = [];
    this._maxParticles = 30;
    this._particleTimer = 0;
    
    // ── 章节色调 ──
    this._chapterTint = null; // { r, g, b, a }
    this._chapterTints = {
      1: { r: 80, g: 0, b: 0, a: 0.04 },     // 生化危机 — 暗红血腥
      2: { r: 0, g: 40, b: 60, a: 0.04 },     // 异形 — 冰冷深蓝
      3: { r: 30, g: 0, b: 50, a: 0.05 },     // 咒怨 — 阴森紫暗
      4: { r: 60, g: 40, b: 0, a: 0.04 },     // 木乃伊 — 沙漠金褐
      5: { r: 0, g: 0, b: 30, a: 0.04 },      // 死神来了 — 深沉暗蓝
      6: { r: 0, g: 50, b: 0, a: 0.04 },      // 异形再临 — 有机质绿
      7: { r: 60, g: 0, b: 20, a: 0.05 },     // 恶魔 — 地狱赤红
      8: { r: 30, g: 50, b: 20, a: 0.03 },    // 重建中洲 — 自然绿褐
      9: { r: 0, g: 10, b: 50, a: 0.04 },     // 星河远征 — 星空深蓝
      10: { r: 40, g: 0, b: 40, a: 0.04 },    // 五队大战 — 紧张紫红
      11: { r: 50, g: 30, b: 0, a: 0.05 },    // 心魔 — 焦灼橙黄
      12: { r: 255, g: 255, b: 255, a: 0.02 }, // 终章 — 白光神圣
    };
  }
  
  /**
   * 添加震屏效果
   */
  /**
   * 设置当前章节（用于色调和粒子类型）
   */
  setChapter(chapter) {
    this._chapterTint = this._chapterTints[chapter] || null;
    this._particles = []; // 切换章节时清空粒子
  }
  
  /**
   * 生成环境粒子
   */
  _spawnParticle(w, h) {
    const chapter = gameState.chapter || 1;
    const types = {
      1: { icon: '·', color: 'rgba(180,50,50,', size: 2, speedY: -0.3 },   // 血雾
      2: { icon: '·', color: 'rgba(100,200,200,', size: 1.5, speedY: 0.4 }, // 冷凝水
      3: { icon: '·', color: 'rgba(150,100,200,', size: 1, speedY: -0.2 },  // 怨气
      4: { icon: '·', color: 'rgba(200,180,100,', size: 2.5, speedY: 0.5 }, // 沙尘
      5: { icon: '·', color: 'rgba(100,100,180,', size: 1, speedY: -0.4 },  // 灵魂
      6: { icon: '·', color: 'rgba(100,200,50,', size: 1.5, speedY: 0.3 },  // 有机粒子
      7: { icon: '·', color: 'rgba(255,80,30,', size: 2, speedY: -0.5 },    // 余烬
      8: { icon: '·', color: 'rgba(100,180,80,', size: 2, speedY: 0.2 },    // 花粉
      9: { icon: '·', color: 'rgba(80,120,255,', size: 1, speedY: -0.1 },   // 星尘
      10: { icon: '·', color: 'rgba(200,80,200,', size: 1.5, speedY: -0.3 },// 杀意
      11: { icon: '·', color: 'rgba(255,180,50,', size: 2, speedY: -0.4 },  // 火星
      12: { icon: '·', color: 'rgba(255,255,200,', size: 1.5, speedY: -0.2 },// 光尘
    };
    const t = types[chapter] || types[1];
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.8,
      vy: t.speedY + (Math.random() - 0.5) * 0.3,
      life: 120 + Math.random() * 180,
      maxLife: 120 + Math.random() * 180,
      color: t.color,
      size: t.size * (0.5 + Math.random()),
    };
  }
  
  shake(intensity = 4, duration = 200) {
    this._screenShake.intensity = intensity;
    setTimeout(() => {
      this._screenShake.intensity *= 0.3;
    }, duration);
  }
  
  /**
   * 全屏闪光
   */
  flash(color = '#ffffff', duration = 150) {
    this._flashColor = color;
    this._flashAlpha = 0.4;
    setTimeout(() => { this._flashAlpha = 0; }, duration);
  }
  
  /**
   * 楼层过渡动画
   */
  startTransition(onMid) {
    this._transitionAlpha = 0;
    this._transitionDir = 1;
    
    const fadeIn = () => {
      this._transitionAlpha += 0.06;
      if (this._transitionAlpha >= 1) {
        this._transitionAlpha = 1;
        if (onMid) onMid();
        setTimeout(() => {
          this._transitionDir = -1;
          const fadeOut = () => {
            this._transitionAlpha -= 0.04;
            if (this._transitionAlpha <= 0) {
              this._transitionAlpha = 0;
              this._transitionDir = 0;
              return;
            }
            requestAnimationFrame(fadeOut);
          };
          requestAnimationFrame(fadeOut);
        }, 200);
        return;
      }
      requestAnimationFrame(fadeIn);
    };
    requestAnimationFrame(fadeIn);
  }
  
  /**
   * 每帧更新和渲染后处理
   * 在主渲染循环末尾调用
   */
  render() {
    const ctx = this._ctx;
    const w = this._canvas.width;
    const h = this._canvas.height;
    const p = gameState.player;
    
    // ── 环境粒子 ──
    this._particleTimer++;
    if (this._particleTimer % 8 === 0 && this._particles.length < this._maxParticles) {
      this._particles.push(this._spawnParticle(w, h));
    }
    for (let i = this._particles.length - 1; i >= 0; i--) {
      const pt = this._particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life--;
      if (pt.life <= 0 || pt.x < -10 || pt.x > w + 10 || pt.y < -10 || pt.y > h + 10) {
        this._particles.splice(i, 1);
        continue;
      }
      const alpha = Math.min(1, pt.life / 30) * Math.min(1, (pt.maxLife - pt.life) / 30) * 0.6;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fillStyle = pt.color + alpha + ')';
      ctx.fill();
    }
    
    // ── 章节色调滤镜 ──
    if (this._chapterTint) {
      const t = this._chapterTint;
      ctx.fillStyle = `rgba(${t.r},${t.g},${t.b},${t.a})`;
      ctx.fillRect(0, 0, w, h);
    }
    
    // ── 暗角（Vignette） ──
    if (this._vignetteEnabled) {
      const vignette = ctx.createRadialGradient(
        w / 2, h / 2, w * 0.3,
        w / 2, h / 2, w * 0.7
      );
      vignette.addColorStop(0, 'rgba(0,0,0,0)');
      vignette.addColorStop(1, 'rgba(0,0,0,0.35)');
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);
    }
    
    // ── 低血量红屏脉动 ──
    if (p && p.hp <= p.maxHp * 0.3) {
      this._lowHpPulse += 0.08;
      const intensity = 0.1 + 0.08 * Math.sin(this._lowHpPulse);
      const hpRatio = p.hp / p.maxHp;
      const alpha = intensity * (1 - hpRatio / 0.3);
      
      const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.5);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(0.6, `rgba(80,0,0,${alpha * 0.3})`);
      grad.addColorStop(1, `rgba(120,0,0,${alpha})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      
      // 边缘红色闪烁
      if (hpRatio < 0.15) {
        const edgeAlpha = alpha * 1.5;
        ctx.strokeStyle = `rgba(255,0,0,${edgeAlpha})`;
        ctx.lineWidth = 3;
        ctx.strokeRect(2, 2, w - 4, h - 4);
      }
    } else {
      this._lowHpPulse = 0;
    }
    
    // ── 基因锁激活光效 ──
    if (p && p.geneLockActive) {
      this._geneLockGlow += 0.04;
      const glow = 0.03 + 0.02 * Math.sin(this._geneLockGlow * 2);
      const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.4);
      grad.addColorStop(0, `rgba(255,170,0,${glow})`);
      grad.addColorStop(1, 'rgba(255,100,0,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
    } else {
      this._geneLockGlow = 0;
    }
    
    // ── 全屏闪光 ──
    if (this._flashAlpha > 0) {
      ctx.fillStyle = this._flashColor || 'rgba(255,255,255,0.3)';
      ctx.globalAlpha = this._flashAlpha;
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;
      this._flashAlpha *= 0.85;
      if (this._flashAlpha < 0.01) this._flashAlpha = 0;
    }
    
    // ── 楼层过渡遮罩 ──
    if (this._transitionAlpha > 0) {
      ctx.fillStyle = `rgba(0,0,0,${this._transitionAlpha})`;
      ctx.fillRect(0, 0, w, h);
    }
    
    // ── 震屏偏移 ──
    if (this._screenShake.intensity > 0.5) {
      this._screenShake.x = (Math.random() - 0.5) * this._screenShake.intensity;
      this._screenShake.y = (Math.random() - 0.5) * this._screenShake.intensity;
      this._screenShake.intensity *= this._screenShake.decay;
      this._canvas.style.transform = `translate(${this._screenShake.x}px, ${this._screenShake.y}px)`;
    } else if (this._screenShake.x !== 0 || this._screenShake.y !== 0) {
      this._screenShake.x = 0;
      this._screenShake.y = 0;
      this._canvas.style.transform = '';
    }
  }
  
  /**
   * 重置所有效果
   */
  reset() {
    this._flashAlpha = 0;
    this._transitionAlpha = 0;
    this._screenShake.intensity = 0;
    this._canvas.style.transform = '';
  }
}
