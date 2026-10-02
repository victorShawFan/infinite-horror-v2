// ═══════════════════════════════════════════════════════════════
// 标题画面特效 — 粒子漂浮 + 发光脉动 + 打字机字幕
// ═══════════════════════════════════════════════════════════════

/**
 * 在指定容器内创建一个全屏Canvas粒子层 + CSS脉动效果
 * @param {HTMLElement} container - 标题画面容器
 */
export function initTitleFX(container) {
  // ─── 粒子Canvas层 ───
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;';
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // ─── 粒子池 ───
  const PARTICLE_COUNT = 60;
  const particles = [];

  function spawnParticle() {
    const types = ['ember', 'dust', 'glyph'];
    const type = types[Math.floor(Math.random() * types.length)];
    const p = {
      x: Math.random() * canvas.width,
      y: canvas.height + 10,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -(0.3 + Math.random() * 0.7),
      size: type === 'glyph' ? 14 : (2 + Math.random() * 3),
      alpha: 0.1 + Math.random() * 0.5,
      life: 200 + Math.random() * 300,
      age: 0,
      type,
      color: type === 'ember' 
        ? `hsl(${Math.random() * 30}, 90%, ${50 + Math.random() * 30}%)`
        : type === 'dust'
        ? `hsl(220, 40%, ${50 + Math.random() * 30}%)`
        : '#ff444466',
      glyph: type === 'glyph' ? '✦◆⚡☠♦⬡'.charAt(Math.floor(Math.random() * 6)) : null,
      pulse: Math.random() * Math.PI * 2,
    };
    return p;
  }

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const p = spawnParticle();
    p.y = Math.random() * canvas.height; // 初始散布
    p.age = Math.random() * p.life;
    particles.push(p);
  }

  // ─── 粒子渲染循环 ───
  let animId;
  function drawParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.age++;
      p.pulse += 0.03;

      // 生命周期淡入淡出
      const lifeRatio = p.age / p.life;
      const fadeIn = Math.min(1, p.age / 30);
      const fadeOut = lifeRatio > 0.7 ? 1 - (lifeRatio - 0.7) / 0.3 : 1;
      const alpha = p.alpha * fadeIn * fadeOut * (0.7 + 0.3 * Math.sin(p.pulse));

      if (p.age > p.life || p.y < -20) {
        particles[i] = spawnParticle();
        continue;
      }

      ctx.globalAlpha = alpha;

      if (p.type === 'glyph') {
        ctx.font = `${p.size}px sans-serif`;
        ctx.fillStyle = p.color;
        ctx.fillText(p.glyph, p.x, p.y);
      } else if (p.type === 'ember') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        // 余晖
        ctx.globalAlpha = alpha * 0.3;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    animId = requestAnimationFrame(drawParticles);
  }
  drawParticles();

  // ─── 标题脉动CSS注入 ───
  if (!document.getElementById('title-fx-style')) {
    const style = document.createElement('style');
    style.id = 'title-fx-style';
    style.textContent = `
      @keyframes titlePulse {
        0%   { text-shadow: 0 0 40px rgba(255,68,68,0.4), 0 0 80px rgba(255,68,68,0.2); }
        50%  { text-shadow: 0 0 60px rgba(255,68,68,0.6), 0 0 120px rgba(255,68,68,0.3), 0 0 200px rgba(255,100,50,0.1); }
        100% { text-shadow: 0 0 40px rgba(255,68,68,0.4), 0 0 80px rgba(255,68,68,0.2); }
      }
      @keyframes subtitleFade {
        0%   { opacity: 0; transform: translateY(10px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      @keyframes btnAppear {
        0%   { opacity: 0; transform: translateY(20px); }
        100% { opacity: 1; transform: translateY(0); }
      }
      .title-fx-glow {
        animation: titlePulse 3s ease-in-out infinite;
      }
      .title-fx-subtitle {
        animation: subtitleFade 1.5s ease-out 0.5s both;
      }
      .title-fx-btn {
        animation: btnAppear 0.8s ease-out both;
      }
    `;
    document.head.appendChild(style);
  }

  // 返回cleanup函数
  return function cleanup() {
    cancelAnimationFrame(animId);
    window.removeEventListener('resize', resize);
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
  };
}

/**
 * 战斗伤害数字飘动效果
 * 在指定位置创建飘动的伤害数字
 */
export function spawnDamageNumber(container, x, y, text, options = {}) {
  const {
    color = '#ff4444',
    fontSize = 20,
    critical = false,
    heal = false,
  } = options;

  const el = document.createElement('div');
  const finalSize = critical ? fontSize * 1.5 : fontSize;
  const finalColor = heal ? '#44ff88' : color;
  
  el.textContent = critical ? `💥 ${text}` : heal ? `💚 +${text}` : text;
  el.style.cssText = `
    position: absolute;
    left: ${x}px;
    top: ${y}px;
    font-size: ${finalSize}px;
    font-weight: 900;
    color: ${finalColor};
    text-shadow: 0 0 8px ${finalColor}88, 2px 2px 4px rgba(0,0,0,0.8);
    pointer-events: none;
    z-index: 100;
    transition: all 1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
    opacity: 1;
    ${critical ? 'transform: scale(1.2);' : ''}
  `;
  container.appendChild(el);

  // 向上飘动 + 淡出
  requestAnimationFrame(() => {
    el.style.top = `${y - 60 - Math.random() * 30}px`;
    el.style.left = `${x + (Math.random() - 0.5) * 40}px`;
    el.style.opacity = '0';
    el.style.transform = critical ? 'scale(0.8)' : 'scale(0.7)';
  });

  setTimeout(() => el.remove(), 1100);
}

/**
 * 屏幕震动效果
 */
export function screenShake(element, intensity = 5, duration = 300) {
  const startTime = Date.now();
  const originalTransform = element.style.transform || '';

  function shake() {
    const elapsed = Date.now() - startTime;
    if (elapsed > duration) {
      element.style.transform = originalTransform;
      return;
    }
    const decay = 1 - elapsed / duration;
    const dx = (Math.random() - 0.5) * 2 * intensity * decay;
    const dy = (Math.random() - 0.5) * 2 * intensity * decay;
    element.style.transform = `${originalTransform} translate(${dx}px, ${dy}px)`;
    requestAnimationFrame(shake);
  }
  shake();
}

/**
 * 屏幕闪光效果
 */
export function screenFlash(container, color = '#ffffff', duration = 200) {
  const flash = document.createElement('div');
  flash.style.cssText = `
    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    background: ${color}; opacity: 0.6; pointer-events: none; z-index: 99;
    transition: opacity ${duration}ms ease-out;
  `;
  container.appendChild(flash);
  requestAnimationFrame(() => { flash.style.opacity = '0'; });
  setTimeout(() => flash.remove(), duration + 50);
}
