// ═══════════════════════════════════════════════════════════════
// 世界地图 — 轮回进度总览
// ═══════════════════════════════════════════════════════════════
//
// 显示12章轮回之旅的进度概览：
// - 已完成章节（绿色+评级）
// - 当前章节（金色高亮+动画）
// - 未解锁章节（灰色锁定）
// - 每章世界名称、Boss名字、关键事件标记
// ═══════════════════════════════════════════════════════════════

import { gameState } from './GameState.js';

const CHAPTER_DATA = [
  { ch: 1,  name: '名为生化',     world: '生化危机',     boss: '暴君 T-002',    icon: '🧟', color: '#44cc88' },
  { ch: 2,  name: '异形杀戮',     world: '异形',         boss: '异形皇后',      icon: '👾', color: '#4488ff' },
  { ch: 3,  name: '咒怨阴影',     world: '咒怨',         boss: '伽椰子',        icon: '👁', color: '#aa44cc' },
  { ch: 4,  name: '神鬼秘宝',     world: '木乃伊',       boss: '伊莫顿',        icon: '🏛', color: '#ffcc44' },
  { ch: 5,  name: '死神绝境',     world: '死神来了',     boss: '死神规则',      icon: '💀', color: '#ff4444' },
  { ch: 6,  name: '异形再临',     world: '异形2',        boss: '新生异形',      icon: '🥚', color: '#448844' },
  { ch: 7,  name: '恶魔初临',     world: '生化危机2',    boss: '恶魔队',        icon: '😈', color: '#ff2222' },
  { ch: 8,  name: '重建中洲',     world: '侏罗纪公园',   boss: '暴龙',          icon: '🦖', color: '#88cc44' },
  { ch: 9,  name: '最终兵器',     world: '终结者',       boss: 'T-1000',        icon: '🤖', color: '#888888' },
  { ch: 10, name: '五队大战',     world: '星球大战',     boss: '五队混战',      icon: '⭐', color: '#ffaa44' },
  { ch: 11, name: '善恶之巅',     world: '天堂与地狱',   boss: '路西法',        icon: '👼', color: '#ff88cc' },
  { ch: 12, name: '最终轮回',     world: '无限恐怖',     boss: '洪荒',          icon: '🌟', color: '#ffdd44' },
];

/**
 * 渲染世界地图面板HTML
 */
export function renderWorldMap() {
  const maxUnlocked = parseInt(localStorage.getItem('ih_max_chapter') || '1');
  const currentCh = gameState.chapter || 1;
  
  let html = '<div style="padding:16px;max-height:80vh;overflow-y:auto;">';
  html += '<h2 style="color:#ff4444;text-align:center;letter-spacing:6px;margin-bottom:4px;">🌍 轮 回 之 路</h2>';
  html += `<p style="color:#666;text-align:center;font-size:11px;margin-bottom:16px;">
    已完成 ${Math.max(0, maxUnlocked - 1)}/12 章 · 当前: 第${currentCh}章
  </p>`;
  
  // 时间线样式
  html += '<div style="position:relative;max-width:420px;margin:0 auto;">';
  
  // 连接线
  html += '<div style="position:absolute;left:20px;top:0;bottom:0;width:2px;background:linear-gradient(to bottom, #44cc8840, #ff444440, #ffcc4440);"></div>';
  
  for (const chData of CHAPTER_DATA) {
    const isComplete = chData.ch < maxUnlocked;
    const isCurrent = chData.ch === currentCh;
    const isLocked = chData.ch > maxUnlocked;
    
    let nodeColor = '#333';
    let borderColor = '#333';
    let textColor = '#444';
    let bgOpacity = '0.02';
    
    if (isComplete) {
      nodeColor = chData.color;
      borderColor = chData.color + '60';
      textColor = '#aaa';
      bgOpacity = '0.04';
    } else if (isCurrent) {
      nodeColor = '#ffcc44';
      borderColor = '#ffcc44';
      textColor = '#fff';
      bgOpacity = '0.08';
    }
    
    html += `<div style="
      display:flex;gap:12px;align-items:flex-start;margin-bottom:12px;
      padding:10px 12px 10px 36px;position:relative;
      background:rgba(255,255,255,${bgOpacity});
      border:1px solid ${borderColor};
      border-radius:8px;
      ${isCurrent ? 'box-shadow:0 0 20px ' + nodeColor + '20;' : ''}
      ${isLocked ? 'opacity:0.4;' : ''}
    ">
      <!-- 时间线节点 -->
      <div style="
        position:absolute;left:12px;top:14px;
        width:16px;height:16px;border-radius:50%;
        background:${isLocked ? '#222' : nodeColor};
        border:2px solid ${nodeColor};
        ${isCurrent ? 'animation:pulse 1s infinite;box-shadow:0 0 10px ' + nodeColor + ';' : ''}
      "></div>
      
      <div style="flex:1;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <span style="color:${textColor};font-size:13px;font-weight:bold;">
            ${isLocked ? '🔒' : chData.icon} 第${chData.ch}章 · ${chData.name}
          </span>
          ${isComplete ? '<span style="color:#44cc88;font-size:10px;">✓ 完成</span>' : ''}
          ${isCurrent ? '<span style="color:#ffcc44;font-size:10px;animation:pulse 0.8s infinite;">▶ 进行中</span>' : ''}
        </div>
        
        ${!isLocked ? `
        <p style="color:#666;font-size:10px;margin-top:2px;">
          ${chData.world} · Boss: ${chData.boss}
        </p>` : `
        <p style="color:#444;font-size:10px;margin-top:2px;">??? · ???</p>`}
      </div>
    </div>`;
  }
  
  html += '</div>'; // timeline container
  html += '</div>'; // main container
  return html;
}
