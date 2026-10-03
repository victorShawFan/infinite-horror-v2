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
  }
  
  /**
   * 添加震屏效果
   */
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
