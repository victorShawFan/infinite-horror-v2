// ═══════════════════════════════════════════════════════════════
// 战斗特效增强 — 提升打击感的微交互层
// ═══════════════════════════════════════════════════════════════
//
// 1. 击中暂停帧 (Hit Stop) — 暴击/重击时短暂冻结画面
// 2. 伤害冲击波 (Impact Wave) — 命中时从击中点扩散的圆环
// 3. 血花粒子 (Blood Particles) — 受伤时飞溅的粒子
// 4. 残影效果 (Ghost Trail) — 闪避/高速移动时的残影
// 5. 元素特效 (Elemental Burst) — 火/冰/毒/雷触发时的屏幕染色
// ═══════════════════════════════════════════════════════════════

import { eventBus } from './EventBus.js';

// ── 击中暂停帧 ──
let _hitStopActive = false;
let _hitStopEndTime = 0;

export function triggerHitStop(durationMs = 60) {
  _hitStopActive = true;
  _hitStopEndTime = performance.now() + durationMs;
}

export function isHitStopped() {
  if (!_hitStopActive) return false;
  if (performance.now() >= _hitStopEndTime) {
    _hitStopActive = false;
    return false;
  }
  return true;
}

// ── 冲击波 ──
const _waves = [];

export function spawnImpactWave(x, y, color = '#ffffff', maxRadius = 40) {
  _waves.push({
    x, y, color,
    radius: 5,
    maxRadius,
    alpha: 0.8,
    lineWidth: 3,
  });
}

export function updateAndDrawWaves(ctx) {
  for (let i = _waves.length - 1; i >= 0; i--) {
    const w = _waves[i];
    w.radius += 3;
    w.alpha -= 0.04;
    w.lineWidth = Math.max(0.5, w.lineWidth - 0.1);
    
    if (w.alpha <= 0 || w.radius >= w.maxRadius) {
      _waves.splice(i, 1);
      continue;
    }
    
    ctx.save();
    ctx.strokeStyle = w.color;
    ctx.globalAlpha = w.alpha;
    ctx.lineWidth = w.lineWidth;
    ctx.beginPath();
    ctx.arc(w.x, w.y, w.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

// ── 粒子系统 ──
const _particles = [];

export function spawnParticles(x, y, count, options = {}) {
  const {
    color = '#ff4444',
    speed = 3,
    size = 2,
    lifetime = 30,
    gravity = 0.1,
    spread = Math.PI * 2,
    direction = 0,
  } = options;
  
  for (let i = 0; i < count; i++) {
    const angle = direction + (Math.random() - 0.5) * spread;
    const spd = speed * (0.5 + Math.random() * 0.5);
    _particles.push({
      x, y,
      vx: Math.cos(angle) * spd,
      vy: Math.sin(angle) * spd,
      color,
      size: size * (0.5 + Math.random()),
      alpha: 1,
      lifetime,
      age: 0,
      gravity,
    });
  }
}

export function updateAndDrawParticles(ctx) {
  for (let i = _particles.length - 1; i >= 0; i--) {
    const p = _particles[i];
    p.age++;
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.gravity;
    p.vx *= 0.98;
    p.alpha = Math.max(0, 1 - p.age / p.lifetime);
    p.size *= 0.97;
    
    if (p.age >= p.lifetime || p.alpha <= 0) {
      _particles.splice(i, 1);
      continue;
    }
    
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// ── 元素爆发（全屏染色） ──
let _elementalFlash = null;

const ELEMENT_COLORS = {
  fire:    'rgba(255,100,0,0.15)',
  ice:     'rgba(100,200,255,0.12)',
  poison:  'rgba(100,255,50,0.12)',
  thunder: 'rgba(255,255,100,0.15)',
  dark:    'rgba(100,0,150,0.12)',
  holy:    'rgba(255,255,200,0.15)',
};

export function triggerElementalFlash(element, durationMs = 300) {
  const color = ELEMENT_COLORS[element] || 'rgba(255,255,255,0.1)';
  _elementalFlash = {
    color,
    startTime: performance.now(),
    duration: durationMs,
  };
}

export function drawElementalFlash(ctx, w, h) {
  if (!_elementalFlash) return;
  const elapsed = performance.now() - _elementalFlash.startTime;
  if (elapsed >= _elementalFlash.duration) {
    _elementalFlash = null;
    return;
  }
  
  const progress = elapsed / _elementalFlash.duration;
  const alpha = Math.sin(progress * Math.PI); // 从0到1再到0
  
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = _elementalFlash.color;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}

// ── 残影 ──
const _ghosts = [];

export function addGhostTrail(x, y, sprite, color = '#44aaff') {
  _ghosts.push({
    x, y, sprite, color,
    alpha: 0.6,
    age: 0,
    lifetime: 12,
  });
}

export function updateAndDrawGhosts(ctx, tileSize) {
  for (let i = _ghosts.length - 1; i >= 0; i--) {
    const g = _ghosts[i];
    g.age++;
    g.alpha = Math.max(0, 0.6 * (1 - g.age / g.lifetime));
    
    if (g.age >= g.lifetime) {
      _ghosts.splice(i, 1);
      continue;
    }
    
    ctx.save();
    ctx.globalAlpha = g.alpha;
    ctx.fillStyle = g.color;
    ctx.font = `${tileSize * 0.7}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(g.sprite || '●', g.x * tileSize + tileSize / 2, g.y * tileSize + tileSize / 2);
    ctx.restore();
  }
}

// ── 聚合绘制 ──
export function drawAllCombatFX(ctx, canvasW, canvasH) {
  updateAndDrawWaves(ctx);
  updateAndDrawParticles(ctx);
  drawElementalFlash(ctx, canvasW, canvasH);
}

// ── 战斗事件监听 ──
export function initCombatFXListeners() {
  eventBus.on('combat:hit', (data) => {
    const { x, y, damage, critical, element } = data || {};
    if (critical) {
      triggerHitStop(80);
      spawnImpactWave(x, y, '#ffcc44', 50);
      spawnParticles(x, y, 12, { color: '#ffcc44', speed: 4, size: 3 });
    } else {
      spawnImpactWave(x, y, '#ffffff', 30);
      spawnParticles(x, y, 6, { color: '#ff6644', speed: 2, size: 2 });
    }
    if (element) {
      triggerElementalFlash(element, 200);
    }
  });
  
  eventBus.on('combat:dodge', (data) => {
    const { x, y } = data || {};
    if (x !== undefined && y !== undefined) {
      addGhostTrail(x, y, '影', '#44aaff');
    }
  });
  
  eventBus.on('combat:death', (data) => {
    const { x, y } = data || {};
    triggerHitStop(120);
    spawnImpactWave(x || 0, y || 0, '#ff0000', 60);
    spawnParticles(x || 0, y || 0, 20, { color: '#ff2222', speed: 5, size: 4, lifetime: 40 });
  });
}
