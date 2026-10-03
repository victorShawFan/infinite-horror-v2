// ═══════════════════════════════════════════════════════════════
// 世界状态仪表盘 — 轮回进度与全局态势感知
// ═══════════════════════════════════════════════════════════════
//
// 在主神空间/章节转换时展示：
// 1. 当前轮回进度（12章总览）
// 2. 队伍状态（存活/阵亡同伴）
// 3. 世界线影响（业力路线偏好）
// 4. 敌人势力评估
// 5. 叙事摘要
// ═══════════════════════════════════════════════════════════════

import { gameState } from './GameState.js';
import { GENE_LOCK, BLOODLINE } from './constants.js';

// ── 章节信息 ──
const CHAPTER_INFO = {
  1:  { name: '异形一', world: 'USCSS诺斯特罗莫号', icon: '👽', color: '#44cc88' },
  2:  { name: '咒怨', world: '日本伽椰子之屋', icon: '👻', color: '#cc44ff' },
  3:  { name: '神鬼秘宝', world: '埃及金字塔', icon: '🏺', color: '#ffcc44' },
  4:  { name: '死神绝境', world: '死神领域', icon: '💀', color: '#ff4444' },
  5:  { name: '异形再临', world: 'LV-426殖民地', icon: '🛸', color: '#44cccc' },
  6:  { name: '恶魔初临', world: '地狱之门', icon: '🔥', color: '#ff6600' },
  7:  { name: '重建中洲', world: '中洲大陆', icon: '🏰', color: '#6699ff' },
  8:  { name: '星河远征', world: '星际舰队', icon: '🌌', color: '#4488ff' },
  9:  { name: '五队大战', world: '异空间', icon: '⚔', color: '#ff4444' },
  10: { name: '心魔与终战前奏', world: '精神世界', icon: '🌀', color: '#aa44ff' },
  11: { name: '生化终战', world: '末日地球', icon: '☣', color: '#44ff44' },
  12: { name: '终局', world: '主神空间·核心', icon: '✦', color: '#ffaa00' },
};

// ── 世界线评语 ──
function getWorldLineComment(karma) {
  if (karma >= 80) return { text: '「光明之道」— 你选择了守护与牺牲', color: '#ffcc44', icon: '✦' };
  if (karma >= 40) return { text: '「正义之途」— 正直而有原则的轮回者', color: '#44ff88', icon: '☀' };
  if (karma >= 0) return { text: '「平衡之路」— 在善恶之间寻找答案', color: '#888', icon: '☯' };
  if (karma >= -40) return { text: '「实用主义」— 生存第一，手段次之', color: '#ffaa44', icon: '◇' };
  return { text: '「暗影之道」— 为了力量，不惜一切', color: '#ff4444', icon: '🌑' };
}

/**
 * 展示世界状态仪表盘
 */
export function showWorldDashboard(onClose) {
  const old = document.getElementById('world-dashboard');
  if (old) old.remove();
  
  const p = gameState.player;
  const chapter = gameState.chapter || 1;
  const karma = gameState.karma || 0;
  const companions = gameState.companions || [];
  const aliveComps = companions.filter(c => c.alive);
  const deadComps = companions.filter(c => !c.alive);
  const worldLine = getWorldLineComment(karma);
  
  // 章节进度条
  const chapterProgressHTML = Object.entries(CHAPTER_INFO).map(([num, info]) => {
    const n = parseInt(num);
    const isCurrent = n === chapter;
    const isComplete = n < chapter;
    const isFuture = n > chapter;
    const opacity = isFuture ? '0.3' : '1';
    const bg = isCurrent ? `rgba(${hexToRgb(info.color)},0.15)` : isComplete ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.3)';
    const border = isCurrent ? info.color + '60' : isComplete ? '#33333380' : 'transparent';
    
    return `
      <div style="opacity:${opacity};background:${bg};border:1px solid ${border};
        border-radius:6px;padding:4px 6px;text-align:center;min-width:55px;
        ${isCurrent ? 'box-shadow:0 0 10px ' + info.color + '20;' : ''}">
        <span style="font-size:${isCurrent ? '14px' : '11px'};">${info.icon}</span>
        <p style="color:${isCurrent ? info.color : isComplete ? '#666' : '#444'};font-size:9px;margin-top:2px;">
          ${isComplete ? '✓' : isCurrent ? '▶' : '·'} ${n}
        </p>
      </div>
    `;
  }).join('');
  
  // 同伴状态
  const companionHTML = aliveComps.length > 0 ? aliveComps.map(c => 
    `<span style="color:#44aaff;font-size:11px;padding:2px 6px;background:rgba(68,170,255,0.06);border-radius:4px;margin:2px;">${c.name}</span>`
  ).join('') : '<span style="color:#666;font-size:11px;">— 暂无队友 —</span>';
  
  const deadHTML = deadComps.length > 0 ? 
    `<p style="color:#ff4444;font-size:10px;margin-top:4px;">阵亡: ${deadComps.map(c => c.name).join('、')}</p>` : '';
  
  const overlay = document.createElement('div');
  overlay.id = 'world-dashboard';
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 350;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0, 0, 0, 0.9); animation: wd-fadeIn 0.5s;
  `;
  
  const chInfo = CHAPTER_INFO[chapter] || CHAPTER_INFO[1];
  
  overlay.innerHTML = `
    <style>
      @keyframes wd-fadeIn { from { opacity: 0 } to { opacity: 1 } }
      @keyframes wd-pulse { 0%,100%{opacity:0.6}50%{opacity:1} }
    </style>
    <div style="max-width:520px;width:94%;max-height:88vh;overflow-y:auto;
      background:linear-gradient(180deg,rgba(5,5,15,0.98),rgba(2,2,8,0.98));
      border:1px solid ${chInfo.color}20;border-radius:20px;padding:28px 24px;
      box-shadow:0 0 80px ${chInfo.color}08;">
      
      <!-- 标题 -->
      <div style="text-align:center;margin-bottom:20px;">
        <p style="color:#555;font-size:10px;letter-spacing:6px;animation:wd-pulse 2s infinite;">— 主神空间 · 世界态势 —</p>
        <p style="color:${chInfo.color};font-size:28px;font-weight:bold;margin:8px 0;text-shadow:0 0 20px ${chInfo.color}30;">
          ${chInfo.icon} ${chInfo.name}
        </p>
        <p style="color:#888;font-size:12px;">${chInfo.world}</p>
      </div>
      
      <!-- 轮回进度 -->
      <div style="margin-bottom:20px;">
        <p style="color:#666;font-size:10px;letter-spacing:2px;margin-bottom:8px;">🔄 轮回进度 — 第 ${chapter}/12 章</p>
        <div style="display:flex;gap:4px;flex-wrap:wrap;justify-content:center;">
          ${chapterProgressHTML}
        </div>
        <div style="margin-top:8px;background:#222;border-radius:4px;height:6px;overflow:hidden;">
          <div style="background:linear-gradient(90deg,${chInfo.color},${chInfo.color}88);
            width:${(chapter / 12) * 100}%;height:100%;border-radius:4px;transition:width 0.5s;"></div>
        </div>
      </div>
      
      <!-- 世界线 -->
      <div style="margin-bottom:16px;padding:12px;background:rgba(${hexToRgb(worldLine.color)},0.04);
        border:1px solid ${worldLine.color}15;border-radius:10px;text-align:center;">
        <span style="font-size:16px;">${worldLine.icon}</span>
        <p style="color:${worldLine.color};font-size:13px;margin-top:4px;">${worldLine.text}</p>
        <p style="color:#666;font-size:10px;margin-top:2px;">业力值: ${karma}</p>
      </div>
      
      <!-- 队伍 -->
      <div style="margin-bottom:16px;padding:12px;background:rgba(255,255,255,0.02);border-radius:10px;">
        <p style="color:#888;font-size:10px;letter-spacing:2px;margin-bottom:6px;">👥 队伍成员</p>
        <div style="display:flex;flex-wrap:wrap;gap:4px;align-items:center;">
          <span style="color:#ffaa00;font-size:12px;padding:2px 8px;background:rgba(255,170,0,0.08);border-radius:4px;border:1px solid #ffaa0020;">
            ⭐ 郑吒 Lv.${p.level}
          </span>
          ${companionHTML}
        </div>
        ${deadHTML}
      </div>
      
      <!-- 角色概览 -->
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:20px;">
        <div style="text-align:center;padding:8px;background:rgba(255,100,68,0.04);border-radius:8px;">
          <p style="color:#ff6644;font-size:18px;font-weight:bold;">${p.atk}</p>
          <p style="color:#666;font-size:10px;">ATK</p>
        </div>
        <div style="text-align:center;padding:8px;background:rgba(68,136,255,0.04);border-radius:8px;">
          <p style="color:#4488ff;font-size:18px;font-weight:bold;">${p.def}</p>
          <p style="color:#666;font-size:10px;">DEF</p>
        </div>
        <div style="text-align:center;padding:8px;background:rgba(68,255,136,0.04);border-radius:8px;">
          <p style="color:#44ff88;font-size:18px;font-weight:bold;">${p.hp}/${p.maxHp}</p>
          <p style="color:#666;font-size:10px;">HP</p>
        </div>
      </div>
      
      <button id="wd-close" style="
        display:block;margin:0 auto;
        background:linear-gradient(180deg,rgba(${hexToRgb(chInfo.color)},0.1),rgba(${hexToRgb(chInfo.color)},0.05));
        border:1px solid ${chInfo.color}30;color:${chInfo.color};
        padding:12px 50px;cursor:pointer;font-size:14px;font-family:inherit;
        border-radius:10px;letter-spacing:4px;transition:all 0.2s;
      ">进入世界</button>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  const close = () => {
    overlay.style.transition = 'opacity 0.4s';
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.remove();
      document.removeEventListener('keydown', keyHandler);
      if (onClose) onClose();
    }, 400);
  };
  
  const keyHandler = (e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  };
  
  document.getElementById('wd-close')?.addEventListener('click', close);
  document.addEventListener('keydown', keyHandler);
}

// Helper: hex color to rgb string
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16) || 100;
  const g = parseInt(hex.slice(3, 5), 16) || 100;
  const b = parseInt(hex.slice(5, 7), 16) || 100;
  return `${r},${g},${b}`;
}
