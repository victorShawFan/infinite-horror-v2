// ═══════════════════════════════════════════════════════════════
// 氛围覆盖层 — 根据章节主题的视觉氛围增强
// ═══════════════════════════════════════════════════════════════
//
// 在游戏画面上叠加大气效果：
// - 粒子（雨/雪/灰尘/孢子/能量）
// - 颜色滤镜（暗红/冷蓝/毒绿/神秘紫）
// - 动态光晕
// - 边缘暗角
// ═══════════════════════════════════════════════════════════════

import { eventBus } from './EventBus.js';

const CHAPTER_ATMOSPHERES = {
  1: {
    name: '生化危机',
    filterColor: 'rgba(0,60,0,0.05)',
    vignetteColor: 'rgba(0,20,0,0.3)',
    particles: { char: '·', color: '#44ff4440', count: 15, speed: 0.3, drift: true },
  },
  2: {
    name: '异形飞船',
    filterColor: 'rgba(0,20,40,0.08)',
    vignetteColor: 'rgba(0,10,30,0.35)',
    particles: { char: '◆', color: '#44ff8830', count: 8, speed: 0.5, drift: false },
  },
  3: {
    name: '咒怨宅邸',
    filterColor: 'rgba(30,0,50,0.08)',
    vignetteColor: 'rgba(20,0,40,0.4)',
    particles: { char: '✦', color: '#8844cc25', count: 12, speed: 0.15, drift: true },
  },
  4: {
    name: '古埃及陵墓',
    filterColor: 'rgba(40,30,10,0.06)',
    vignetteColor: 'rgba(30,20,0,0.3)',
    particles: { char: '·', color: '#cc884430', count: 20, speed: 0.2, drift: true },
  },
  5: {
    name: '死神绝境',
    filterColor: 'rgba(20,20,20,0.08)',
    vignetteColor: 'rgba(10,10,10,0.4)',
    particles: { char: '†', color: '#88888830', count: 10, speed: 0.1, drift: false },
  },
  6: {
    name: '异形再临',
    filterColor: 'rgba(0,30,20,0.07)',
    vignetteColor: 'rgba(0,15,10,0.35)',
    particles: { char: '◆', color: '#44aa8830', count: 12, speed: 0.4, drift: true },
  },
  7: {
    name: '恶魔队来袭',
    filterColor: 'rgba(50,0,0,0.08)',
    vignetteColor: 'rgba(40,0,0,0.4)',
    particles: { char: '▲', color: '#ff444430', count: 15, speed: 0.6, drift: false },
  },
  8: {
    name: '侏罗纪',
    filterColor: 'rgba(20,40,10,0.06)',
    vignetteColor: 'rgba(10,30,5,0.3)',
    particles: { char: '●', color: '#88cc4430', count: 18, speed: 0.25, drift: true },
  },
  9: {
    name: '星河远征',
    filterColor: 'rgba(10,10,40,0.07)',
    vignetteColor: 'rgba(5,5,30,0.35)',
    particles: { char: '✧', color: '#4488ff25', count: 25, speed: 0.15, drift: true },
  },
  10: {
    name: '五队大战',
    filterColor: 'rgba(30,20,10,0.06)',
    vignetteColor: 'rgba(20,10,5,0.3)',
    particles: { char: '⚡', color: '#ffcc4420', count: 10, speed: 0.8, drift: false },
  },
  11: {
    name: '心魔梦境',
    filterColor: 'rgba(20,0,30,0.09)',
    vignetteColor: 'rgba(15,0,25,0.45)',
    particles: { char: '◇', color: '#cc88ff20', count: 20, speed: 0.1, drift: true },
  },
  12: {
    name: '终战',
    filterColor: 'rgba(40,10,10,0.08)',
    vignetteColor: 'rgba(30,5,5,0.4)',
    particles: { char: '★', color: '#ff884430', count: 15, speed: 0.5, drift: false },
  },
};

let _overlay = null;
let _particleCanvas = null;
let _particleCtx = null;
let _particles = [];
let _currentChapter = 0;
let _animFrame = null;

/**
 * 设置当前章节的氛围效果
 */
export function setAtmosphere(chapter) {
  if (chapter === _currentChapter && _overlay) return;
  _currentChapter = chapter;
  
  const atmo = CHAPTER_ATMOSPHERES[chapter];
  if (!atmo) {
    removeAtmosphere();
    return;
  }
  
  // 确保覆盖层存在
  if (!_overlay || !document.body.contains(_overlay)) {
    _overlay = document.createElement('div');
    _overlay.id = 'atmosphere-overlay';
    _overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:5;pointer-events:none;';
    document.body.appendChild(_overlay);
  }
  
  // 设置滤镜和暗角
  _overlay.innerHTML = `
    <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:${atmo.filterColor};"></div>
    <div style="position:absolute;top:0;left:0;right:0;bottom:0;
      background:radial-gradient(ellipse at center,transparent 50%,${atmo.vignetteColor} 100%);"></div>
  `;
  
  // 粒子画布
  if (!_particleCanvas || !document.body.contains(_particleCanvas)) {
    _particleCanvas = document.createElement('canvas');
    _particleCanvas.id = 'atmosphere-particles';
    _particleCanvas.style.cssText = 'position:fixed;top:0;left:0;z-index:6;pointer-events:none;';
    document.body.appendChild(_particleCanvas);
  }
  
  _particleCanvas.width = window.innerWidth;
  _particleCanvas.height = window.innerHeight;
  _particleCtx = _particleCanvas.getContext('2d');
  
  // 初始化粒子
  const pc = atmo.particles;
  _particles = [];
  for (let i = 0; i < pc.count; i++) {
    _particles.push({
      x: Math.random() * _particleCanvas.width,
      y: Math.random() * _particleCanvas.height,
      vx: pc.drift ? (Math.random() - 0.5) * pc.speed : 0,
      vy: -pc.speed * (0.5 + Math.random() * 0.5),
      char: pc.char,
      color: pc.color,
      size: 8 + Math.random() * 6,
      alpha: 0.3 + Math.random() * 0.4,
      life: Math.random(), // 0-1 for fade
    });
  }
  
  // 启动动画
  if (_animFrame) cancelAnimationFrame(_animFrame);
  _animateParticles();
}

function _animateParticles() {
  if (!_particleCtx || !_particleCanvas) return;
  
  const w = _particleCanvas.width;
  const h = _particleCanvas.height;
  _particleCtx.clearRect(0, 0, w, h);
  
  for (const p of _particles) {
    p.x += p.vx;
    p.y += p.vy;
    p.life += 0.003;
    
    // 环绕
    if (p.y < -20) { p.y = h + 20; p.x = Math.random() * w; }
    if (p.y > h + 20) { p.y = -20; }
    if (p.x < -20) p.x = w + 20;
    if (p.x > w + 20) p.x = -20;
    
    const fadeAlpha = Math.sin(p.life * Math.PI) * p.alpha;
    if (fadeAlpha <= 0) { p.life = 0; continue; }
    
    _particleCtx.save();
    _particleCtx.globalAlpha = Math.min(1, fadeAlpha);
    _particleCtx.fillStyle = p.color;
    _particleCtx.font = `${p.size}px sans-serif`;
    _particleCtx.fillText(p.char, p.x, p.y);
    _particleCtx.restore();
  }
  
  _animFrame = requestAnimationFrame(_animateParticles);
}

/**
 * 移除氛围效果
 */
export function removeAtmosphere() {
  if (_animFrame) { cancelAnimationFrame(_animFrame); _animFrame = null; }
  if (_overlay) { try { _overlay.remove(); } catch {} _overlay = null; }
  if (_particleCanvas) { try { _particleCanvas.remove(); } catch {} _particleCanvas = null; }
  _particles = [];
  _currentChapter = 0;
}

/**
 * 处理窗口尺寸变化
 */
export function resizeAtmosphere() {
  if (_particleCanvas) {
    _particleCanvas.width = window.innerWidth;
    _particleCanvas.height = window.innerHeight;
  }
}

// 监听窗口大小变化
try {
  window.addEventListener('resize', resizeAtmosphere);
} catch {}
