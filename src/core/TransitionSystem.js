import { getChapterLore, renderChapterIntroCard } from './ChapterWorldLore.js';
// ═══════════════════════════════════════════════════════════════
// 场景转换系统 — 层间/章间过渡动画与叙事文字
// ═══════════════════════════════════════════════════════════════
//
// 提供三种转场效果：
// 1. fadeBlack — 黑幕淡入/淡出 + 中央文字
// 2. slideWipe — 横向擦除
// 3. chapterIntro — 章节标题卡片(大标题+世界观描述+悬念副标)

/**
 * 淡入黑幕 + 居中文字 + 淡出
 * @param {HTMLElement} container - overlay容器
 * @param {Object} opts - { title, subtitle, duration, onMidpoint, onComplete }
 */
export function fadeBlackTransition(container, opts = {}) {
  const {
    title = '',
    subtitle = '',
    duration = 2000,
    onMidpoint = null,
    onComplete = null,
  } = opts;

  const div = document.createElement('div');
  div.style.cssText = `
    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    background: #000; opacity: 0; z-index: 999;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    transition: opacity ${duration/4}ms ease-in-out;
    pointer-events: all;
  `;
  div.innerHTML = `
    <h2 style="
      color: #ff4444; font-size: 28px; letter-spacing: 8px;
      text-shadow: 0 0 30px rgba(255,68,68,0.4);
      opacity: 0; transition: opacity ${duration/4}ms ease ${duration/4}ms;
    " id="trans-title">${title}</h2>
    <p style="
      color: #666; font-size: 14px; letter-spacing: 4px; margin-top: 12px;
      opacity: 0; transition: opacity ${duration/4}ms ease ${duration/3}ms;
    " id="trans-subtitle">${subtitle}</p>
  `;
  container.appendChild(div);

  // Phase 1: fade in
  requestAnimationFrame(() => {
    div.style.opacity = '1';
    const titleEl = div.querySelector('#trans-title');
    const subEl = div.querySelector('#trans-subtitle');
    if (titleEl) titleEl.style.opacity = '1';
    if (subEl) subEl.style.opacity = '1';
  });

  // Phase 2: midpoint callback (switch floor data)
  setTimeout(() => {
    if (onMidpoint) onMidpoint();
  }, duration / 2);

  // Phase 3: fade out
  setTimeout(() => {
    div.style.opacity = '0';
  }, duration * 0.75);

  // Phase 4: cleanup
  setTimeout(() => {
    div.remove();
    if (onComplete) onComplete();
  }, duration);
}

/**
 * 章节标题卡片 — 大字标题 + 世界描述 + 章数
 */
export function chapterIntroTransition(container, opts = {}) {
  // 使用章节世界观数据增强
  try {
    const chapterLore = getChapterLore(opts.chapter || 1);
    if (chapterLore && !opts.subtitle) {
      opts.subtitle = chapterLore.subtitle || '';
    }
    if (chapterLore && !opts.quote) {
      opts.quote = chapterLore.quote || '';
    }
  } catch {}

  const {
    chapterNum = 1,
    chapterName = '',
    worldName = '',
    subtitle = '',
    duration = 4000,
    onComplete = null,
  } = opts;

  const div = document.createElement('div');
  div.style.cssText = `
    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    background: radial-gradient(ellipse at center, rgba(15,5,5,0.98) 0%, rgba(0,0,0,1) 100%);
    z-index: 999; display: flex; flex-direction: column; align-items: center; justify-content: center;
    pointer-events: all;
  `;

  // Chapter number with animation
  div.innerHTML = `
    <div style="text-align: center; opacity: 0; transform: translateY(20px); transition: all 0.8s ease;" id="ci-container">
      <p style="
        color: #ff444480; font-size: 12px; letter-spacing: 12px;
        text-transform: uppercase; margin-bottom: 16px;
      ">第 ${chapterNum} 章</p>
      <h1 style="
        color: #ff4444; font-size: 48px; letter-spacing: 10px; font-weight: 900;
        text-shadow: 0 0 60px rgba(255,68,68,0.3), 0 0 120px rgba(255,68,68,0.1);
        margin-bottom: 12px;
      ">${chapterName}</h1>
      <p style="
        color: #886644; font-size: 16px; letter-spacing: 6px; margin-bottom: 24px;
      ">${worldName}</p>
      <div style="width: 200px; height: 1px; background: linear-gradient(90deg, transparent, #ff444444, transparent); margin: 0 auto 20px;"></div>
      <p style="
        color: #555; font-size: 13px; letter-spacing: 3px; max-width: 500px;
        line-height: 1.8; font-style: italic;
      ">${subtitle}</p>
    </div>
  `;
  container.appendChild(div);

  // Animate in
  requestAnimationFrame(() => {
    const ci = div.querySelector('#ci-container');
    if (ci) {
      ci.style.opacity = '1';
      ci.style.transform = 'translateY(0)';
    }
  });

  // Fade out
  setTimeout(() => {
    div.style.transition = 'opacity 0.8s ease';
    div.style.opacity = '0';
  }, duration - 800);

  // Cleanup
  setTimeout(() => {
    div.remove();
    if (onComplete) onComplete();
  }, duration);
}

/**
 * 楼层间快速转场 — 暗影滑入/滑出
 */
export function floorTransition(container, opts = {}) {
  const {
    floorName = '',
    duration = 1200,
    onMidpoint = null,
    onComplete = null,
  } = opts;

  const div = document.createElement('div');
  div.style.cssText = `
    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    background: #000; z-index: 999;
    clip-path: circle(0% at 50% 50%);
    transition: clip-path ${duration/3}ms ease-in;
    display: flex; align-items: center; justify-content: center;
    pointer-events: all;
  `;
  div.innerHTML = `<p style="color:#666;font-size:13px;letter-spacing:4px;opacity:0;transition:opacity 0.3s ease 0.2s;" id="ft-text">${floorName}</p>`;
  container.appendChild(div);

  // Expand circle
  requestAnimationFrame(() => {
    div.style.clipPath = 'circle(100% at 50% 50%)';
    const txt = div.querySelector('#ft-text');
    if (txt) txt.style.opacity = '1';
  });

  // Midpoint
  setTimeout(() => {
    if (onMidpoint) onMidpoint();
  }, duration / 2);

  // Shrink circle back
  setTimeout(() => {
    div.style.transition = `clip-path ${duration/3}ms ease-out`;
    div.style.clipPath = 'circle(0% at 50% 50%)';
  }, duration * 0.65);

  // Cleanup
  setTimeout(() => {
    div.remove();
    if (onComplete) onComplete();
  }, duration);
}

/**
 * 死亡特效 — 红色脉冲 + 碎裂效果
 */
export function deathTransition(container, opts = {}) {
  const {
    duration = 2500,
    onComplete = null,
  } = opts;

  const div = document.createElement('div');
  div.style.cssText = `
    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    z-index: 999; pointer-events: all;
  `;

  // Red vignette pulse
  div.innerHTML = `
    <div style="
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      background: radial-gradient(ellipse at center, transparent 40%, rgba(180,0,0,0.6) 100%);
      animation: deathPulse 0.5s ease-in-out 3;
    "></div>
    <style>
      @keyframes deathPulse {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 1; }
      }
    </style>
  `;
  container.appendChild(div);

  setTimeout(() => {
    div.style.transition = `opacity 0.5s ease`;
    div.style.opacity = '0';
  }, duration - 500);

  setTimeout(() => {
    div.remove();
    if (onComplete) onComplete();
  }, duration);
}

/**
 * 胜利特效 — 金色光芒
 */
export function victoryFlash(container, duration = 800) {
  const div = document.createElement('div');
  div.style.cssText = `
    position: absolute; top: 0; left: 0; right: 0; bottom: 0;
    background: radial-gradient(ellipse at center, rgba(255,204,68,0.3) 0%, transparent 70%);
    z-index: 998; pointer-events: none;
    opacity: 1; transition: opacity ${duration}ms ease;
  `;
  container.appendChild(div);
  requestAnimationFrame(() => { div.style.opacity = '0'; });
  setTimeout(() => div.remove(), duration);
}
