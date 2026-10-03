// ═══════════════════════════════════════════════════════════════
// 伤害飘字弹出系统 — 战斗中的动态伤害数字
// ═══════════════════════════════════════════════════════════════
//
// 类似暗黑破坏神/原神的伤害数字弹出效果
// - 普通伤害: 白色，正常大小
// - 暴击: 金色，放大+弹跳
// - 治疗: 绿色，向上飘
// - 元素伤害: 对应元素颜色
// - 连击: 越来越大
// ═══════════════════════════════════════════════════════════════

import { eventBus } from './EventBus.js';

const _popups = [];
let _container = null;

function _ensureContainer() {
  if (_container && document.body.contains(_container)) return;
  _container = document.createElement('div');
  _container.id = 'damage-popup-layer';
  _container.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:200;pointer-events:none;overflow:hidden;';
  document.body.appendChild(_container);
}

/**
 * 显示伤害飘字
 * @param {object} options
 * @param {number} options.value - 伤害/治疗数值
 * @param {string} options.type - 'damage'|'critical'|'heal'|'block'|'miss'|'elemental'|'combo'|'skill'
 * @param {number} [options.x] - 屏幕X位置 (默认中心偏移)
 * @param {number} [options.y] - 屏幕Y位置 (默认中上)
 * @param {string} [options.element] - 元素类型 (fire/ice/poison等)
 * @param {string} [options.text] - 自定义文字（覆盖value）
 * @param {number} [options.comboCount] - 连击数
 */
export function showDamagePopup(options = {}) {
  _ensureContainer();
  
  const {
    value = 0,
    type = 'damage',
    x = window.innerWidth * 0.5 + (Math.random() - 0.5) * 120,
    y = window.innerHeight * 0.35 + (Math.random() - 0.5) * 40,
    element = null,
    text = null,
    comboCount = 0,
  } = options;
  
  const el = document.createElement('div');
  
  // 样式根据类型
  let color, fontSize, fontWeight, displayText, extraStyle, animClass;
  
  switch (type) {
    case 'critical':
      color = '#ffcc00';
      fontSize = 28 + Math.min(comboCount * 2, 16);
      fontWeight = 'bold';
      displayText = text || value.toString();
      extraStyle = `text-shadow:0 0 12px rgba(255,200,0,0.8),0 2px 4px rgba(0,0,0,0.5);`;
      animClass = 'dmg-popup-crit';
      break;
    case 'heal':
      color = '#44ff88';
      fontSize = 20;
      fontWeight = 'bold';
      displayText = text || '+' + value;
      extraStyle = `text-shadow:0 0 8px rgba(68,255,136,0.6);`;
      animClass = 'dmg-popup-heal';
      break;
    case 'block':
      color = '#6688aa';
      fontSize = 16;
      fontWeight = 'normal';
      displayText = text || 'BLOCK';
      extraStyle = `text-shadow:0 1px 3px rgba(0,0,0,0.5);`;
      animClass = 'dmg-popup-fade';
      break;
    case 'miss':
      color = '#888';
      fontSize = 16;
      fontWeight = 'normal';
      displayText = text || 'MISS';
      extraStyle = `font-style:italic;text-shadow:0 1px 3px rgba(0,0,0,0.5);`;
      animClass = 'dmg-popup-fade';
      break;
    case 'elemental':
      const elemColors = { fire: '#ff4444', ice: '#44ccff', poison: '#44ff44', psychic: '#cc44ff', dark: '#884488', holy: '#ffff44', spirit: '#88ffcc' };
      color = elemColors[element] || '#ff8844';
      fontSize = 22;
      fontWeight = 'bold';
      displayText = text || value.toString();
      extraStyle = `text-shadow:0 0 10px ${color}80;`;
      animClass = 'dmg-popup-elem';
      break;
    case 'combo':
      color = '#ff8844';
      fontSize = 24 + Math.min(comboCount * 3, 20);
      fontWeight = 'bold';
      displayText = text || `${comboCount}HIT COMBO!`;
      extraStyle = `text-shadow:0 0 15px rgba(255,136,68,0.7);letter-spacing:3px;`;
      animClass = 'dmg-popup-combo';
      break;
    case 'skill':
      color = '#aa88ff';
      fontSize = 20;
      fontWeight = 'bold';
      displayText = text || value.toString();
      extraStyle = `text-shadow:0 0 10px rgba(170,136,255,0.7);`;
      animClass = 'dmg-popup-crit';
      break;
    default: // 普通伤害
      color = '#ffffff';
      fontSize = 18 + Math.min(Math.floor(value / 50), 10);
      fontWeight = 'bold';
      displayText = text || value.toString();
      extraStyle = `text-shadow:0 2px 4px rgba(0,0,0,0.6);`;
      animClass = 'dmg-popup-normal';
      break;
  }
  
  el.textContent = displayText;
  el.className = animClass;
  el.style.cssText = `position:absolute;left:${x}px;top:${y}px;
    color:${color};font-size:${fontSize}px;font-weight:${fontWeight};
    font-family:'Noto Sans SC',monospace;white-space:nowrap;
    transform:translate(-50%,-50%);${extraStyle}
    pointer-events:none;z-index:201;`;
  
  _container.appendChild(el);
  
  // 自动清除
  const lifetime = type === 'combo' ? 1200 : 800;
  setTimeout(() => {
    try { el.remove(); } catch {}
  }, lifetime);
}

/**
 * 从战斗日志条目推断并显示伤害飘字
 */
export function showPopupsFromLog(logEntries) {
  if (!logEntries || logEntries.length === 0) return;
  
  for (let i = 0; i < logEntries.length; i++) {
    const entry = logEntries[i];
    if (!entry || !entry.text) continue;
    
    const t = entry.text;
    const delay = i * 150; // 错开显示
    
    setTimeout(() => {
      // 解析伤害数值
      const dmgMatch = t.match(/(\d+)\s*(伤害|damage)/i) || t.match(/→.*?(\d+)/);
      const healMatch = t.match(/\+(\d+)\s*(HP|hp|回血)/);
      
      if (entry.type === 'critical' || t.includes('暴击')) {
        const val = dmgMatch ? parseInt(dmgMatch[1]) : 0;
        showDamagePopup({ value: val, type: 'critical' });
      } else if (entry.type === 'heal' || healMatch) {
        const val = healMatch ? parseInt(healMatch[1]) : 0;
        showDamagePopup({ value: val, type: 'heal' });
      } else if (entry.type === 'dodge' || t.includes('闪避')) {
        showDamagePopup({ type: 'miss' });
      } else if (entry.type === 'skill') {
        showDamagePopup({ value: 0, type: 'skill', text: t.slice(0, 20) });
      }
    }, delay);
  }
}

// 注入CSS动画
function _injectStyles() {
  if (document.getElementById('dmg-popup-styles')) return;
  const style = document.createElement('style');
  style.id = 'dmg-popup-styles';
  style.textContent = `
    @keyframes dmgNormal{0%{opacity:1;transform:translate(-50%,-50%) scale(1.2)}20%{transform:translate(-50%,-50%) scale(1)}80%{opacity:1}100%{opacity:0;transform:translate(-50%,-120%)}}
    @keyframes dmgCrit{0%{opacity:1;transform:translate(-50%,-50%) scale(2)}15%{transform:translate(-50%,-50%) scale(0.9)}30%{transform:translate(-50%,-50%) scale(1.1)}50%{transform:translate(-50%,-50%) scale(1)}80%{opacity:1}100%{opacity:0;transform:translate(-50%,-150%) scale(0.8)}}
    @keyframes dmgHeal{0%{opacity:1;transform:translate(-50%,-50%) scale(0.8)}20%{transform:translate(-50%,-50%) scale(1.1)}40%{transform:translate(-50%,-50%) scale(1)}100%{opacity:0;transform:translate(-50%,-200%)}}
    @keyframes dmgFade{0%{opacity:1;transform:translate(-50%,-50%)}100%{opacity:0;transform:translate(-50%,-100%)}}
    @keyframes dmgElem{0%{opacity:1;transform:translate(-50%,-50%) rotate(-5deg) scale(1.3)}20%{transform:translate(-50%,-50%) rotate(0) scale(1)}80%{opacity:1}100%{opacity:0;transform:translate(-50%,-150%) scale(0.7)}}
    @keyframes dmgCombo{0%{opacity:0;transform:translate(-50%,-50%) scale(0.3)}20%{opacity:1;transform:translate(-50%,-50%) scale(1.2)}40%{transform:translate(-50%,-50%) scale(1)}80%{opacity:1}100%{opacity:0;transform:translate(-50%,-50%) scale(1.5)}}
    .dmg-popup-normal{animation:dmgNormal 0.8s ease-out forwards}
    .dmg-popup-crit{animation:dmgCrit 1s ease-out forwards}
    .dmg-popup-heal{animation:dmgHeal 0.8s ease-out forwards}
    .dmg-popup-fade{animation:dmgFade 0.6s ease-out forwards}
    .dmg-popup-elem{animation:dmgElem 0.9s ease-out forwards}
    .dmg-popup-combo{animation:dmgCombo 1.2s ease-out forwards}
  `;
  document.head.appendChild(style);
}

// 初始化时注入样式
try { _injectStyles(); } catch {}

// 监听战斗事件自动触发飘字
eventBus.on('combat:log_update', (data) => {
  try {
    if (data.log && data.log.length > 0) {
      const newEntries = data.log.slice(-3); // 只处理最近3条
      showPopupsFromLog(newEntries);
    }
  } catch {}
});
