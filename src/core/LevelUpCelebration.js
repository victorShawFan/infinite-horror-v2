// ═══════════════════════════════════════════════════════════════
// 升级庆典系统 — 戏剧化的升级反馈
// ═══════════════════════════════════════════════════════════════
//
// 玩家升级时展示全屏华丽动画，包含：
// 1. 属性增长对比（旧 → 新）
// 2. 新解锁内容提示（技能/天赋/基因锁等级等）
// 3. 粒子特效和音效触发
// 4. 待分配属性点提示
// ═══════════════════════════════════════════════════════════════

import { eventBus } from './EventBus.js';
import { GENE_LOCK } from './constants.js';
import { getPendingPoints } from './StatAllocation.js';

// ── 升级标题语 ──
const LEVEL_TITLES = {
  5:  '觉醒者',
  10: '轮回战士',
  15: '精英猎人',
  20: '基因锁斗士',
  25: '深渊行者',
  30: '命运之子',
  35: '超越者',
  40: '传说级',
  45: '神域接近者',
  50: '终极形态',
};

const LEVEL_QUOTES = [
  '"每一次战斗都不会白费，力量正在觉醒。"',
  '"主神给予的考验，也是进化的阶梯。"',
  '"更强了……但还不够。下一个世界在等着。"',
  '"活下去，变得更强——这就是轮回者的宿命。"',
  '"力量的代价是无尽的战斗，但你甘之如饴。"',
  '"当恐惧不再是枷锁，而是催化剂……"',
  '"每一次升级，都是对死亡的胜利宣言。"',
  '"感觉到了吗？身体在改变，意识在扩展。"',
];

/**
 * 展示升级庆典
 * @param {object} opts
 * @param {number} opts.newLevel - 升级后的等级
 * @param {object} opts.oldStats - 升级前的属性快照 {maxHp, atk, def, spd, crt}
 * @param {object} opts.newStats - 升级后的属性 {maxHp, atk, def, spd, crt}
 * @param {number} opts.statPoints - 可分配的属性点
 * @param {string[]} opts.unlocks - 新解锁内容描述数组
 * @param {Function} opts.onClose - 关闭回调
 */
export function showLevelUpCelebration(opts) {
  const { newLevel, oldStats, newStats, statPoints, unlocks = [], onClose } = opts;
  
  // 移除旧面板
  const old = document.getElementById('level-up-celebration');
  if (old) old.remove();
  
  const title = LEVEL_TITLES[newLevel] || (newLevel >= 50 ? '终极形态' : null);
  const quote = LEVEL_QUOTES[Math.floor(Math.random() * LEVEL_QUOTES.length)];
  
  // 属性差值
  const diffs = {};
  for (const key of ['maxHp', 'atk', 'def', 'spd', 'crt']) {
    const d = (newStats[key] || 0) - (oldStats[key] || 0);
    if (d !== 0) diffs[key] = d;
  }
  
  const statNames = { maxHp: 'HP', atk: 'ATK', def: 'DEF', spd: 'SPD', crt: 'CRT' };
  const statColors = { maxHp: '#44ff88', atk: '#ff6644', def: '#4488ff', spd: '#ffcc44', crt: '#ff44aa' };
  const statIcons = { maxHp: '❤', atk: '⚔', def: '🛡', spd: '💨', crt: '✦' };
  
  const overlay = document.createElement('div');
  overlay.id = 'level-up-celebration';
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 500;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0, 0, 0, 0);
    animation: lvlup-bg 0.5s forwards;
    pointer-events: all;
  `;
  
  const statsHTML = Object.entries(diffs).map(([key, val]) => {
    const sign = val > 0 ? '+' : '';
    return `
      <div style="display:flex;align-items:center;gap:8px;padding:6px 0;">
        <span style="font-size:16px;">${statIcons[key]}</span>
        <span style="color:#888;font-size:13px;min-width:40px;">${statNames[key]}</span>
        <span style="color:#aaa;font-size:13px;">${oldStats[key] || 0}</span>
        <span style="color:#666;font-size:12px;">→</span>
        <span style="color:${statColors[key]};font-size:15px;font-weight:bold;">${newStats[key] || 0}</span>
        <span style="color:${statColors[key]};font-size:11px;opacity:0.7;">(${sign}${val})</span>
      </div>
    `;
  }).join('');
  
  const unlocksHTML = unlocks.length > 0 ? `
    <div style="margin-top:12px;padding:10px;background:rgba(255,204,68,0.06);border:1px solid #ffcc4420;border-radius:8px;">
      <p style="color:#ffcc44;font-size:11px;letter-spacing:2px;margin-bottom:6px;">🔓 新解锁</p>
      ${unlocks.map(u => `<p style="color:#ddd;font-size:12px;padding:2px 0;">• ${u}</p>`).join('')}
    </div>
  ` : '';
  
  overlay.innerHTML = `
    <style>
      @keyframes lvlup-bg { from { background: rgba(0,0,0,0) } to { background: rgba(0,0,0,0.85) } }
      @keyframes lvlup-glow { 
        0% { transform: scale(0.5) translateY(20px); opacity: 0; filter: blur(10px); }
        50% { transform: scale(1.1) translateY(-5px); opacity: 1; filter: blur(0); }
        100% { transform: scale(1) translateY(0); opacity: 1; filter: blur(0); }
      }
      @keyframes lvlup-flash { 
        0%, 100% { box-shadow: 0 0 30px rgba(255,170,0,0.1); }
        50% { box-shadow: 0 0 60px rgba(255,170,0,0.3), 0 0 120px rgba(255,68,0,0.1); }
      }
      @keyframes lvlup-number {
        0% { transform: scale(2); opacity: 0; color: #fff; }
        40% { transform: scale(0.9); opacity: 1; }
        60% { transform: scale(1.1); color: #ffaa00; }
        100% { transform: scale(1); color: #ffaa00; }
      }
      @keyframes lvlup-stat {
        from { opacity: 0; transform: translateX(-20px); }
        to { opacity: 1; transform: translateX(0); }
      }
      @keyframes lvlup-particle {
        0% { opacity: 1; transform: translateY(0) scale(1); }
        100% { opacity: 0; transform: translateY(-80px) scale(0.3); }
      }
    </style>
    
    <!-- 粒子层 -->
    <div id="lvlup-particles" style="position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;overflow:hidden;"></div>
    
    <div style="
      max-width: 380px; width: 90%; padding: 32px 24px; text-align: center;
      background: linear-gradient(180deg, rgba(20,15,5,0.98), rgba(10,8,3,0.98));
      border: 1px solid rgba(255,170,0,0.2); border-radius: 16px;
      animation: lvlup-glow 0.6s ease-out, lvlup-flash 2s infinite 0.6s;
      position: relative;
    ">
      <p style="color:#ff8800;font-size:10px;letter-spacing:6px;margin-bottom:4px;opacity:0.7;">— LEVEL UP —</p>
      
      <div style="animation: lvlup-number 0.8s ease-out;">
        <p style="font-size:48px;font-weight:900;color:#ffaa00;text-shadow:0 0 20px rgba(255,170,0,0.4);line-height:1;">
          ${newLevel}
        </p>
      </div>
      
      ${title ? `<p style="color:#ffcc44;font-size:14px;letter-spacing:4px;margin:4px 0 8px;text-shadow:0 0 10px rgba(255,204,68,0.3);">「${title}」</p>` : '<div style="height:12px;"></div>'}
      
      <p style="color:#886644;font-size:11px;font-style:italic;margin-bottom:16px;">${quote}</p>
      
      <div style="text-align:left;padding:0 12px;">
        ${statsHTML}
      </div>
      
      ${unlocksHTML}
      
      ${statPoints > 0 ? `
        <div style="margin-top:12px;padding:8px;background:rgba(68,136,255,0.08);border:1px solid #4488ff20;border-radius:6px;">
          <p style="color:#4488ff;font-size:12px;">📊 ${statPoints} 属性点待分配</p>
          <p style="color:#666;font-size:10px;">按 T 或在主神空间分配</p>
        </div>
      ` : ''}
      
      <button id="lvlup-close" style="
        margin-top:20px; background: rgba(255,170,0,0.1); border: 1px solid #ffaa0044;
        color: #ffaa00; padding: 10px 40px; cursor: pointer; font-size: 14px;
        letter-spacing: 4px; font-family: inherit; border-radius: 8px;
        transition: all 0.3s;
      ">继续</button>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  // 粒子动画
  const particleContainer = document.getElementById('lvlup-particles');
  if (particleContainer) {
    for (let i = 0; i < 20; i++) {
      setTimeout(() => {
        const p = document.createElement('div');
        const x = 20 + Math.random() * 60;
        const y = 30 + Math.random() * 40;
        const size = 4 + Math.random() * 8;
        const colors = ['#ffaa00', '#ff6600', '#ffcc44', '#ff4400', '#ffee88'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        p.style.cssText = `
          position: absolute; left: ${x}%; top: ${y}%;
          width: ${size}px; height: ${size}px; border-radius: 50%;
          background: ${color}; box-shadow: 0 0 ${size * 2}px ${color}40;
          animation: lvlup-particle ${1 + Math.random() * 2}s ease-out forwards;
          pointer-events: none;
        `;
        particleContainer.appendChild(p);
        setTimeout(() => p.remove(), 3000);
      }, i * 100);
    }
  }
  
  // 关闭逻辑
  const close = () => {
    overlay.style.transition = 'opacity 0.3s';
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.remove();
      document.removeEventListener('keydown', keyHandler);
      if (onClose) onClose();
    }, 300);
  };
  
  const keyHandler = (e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  };
  
  document.getElementById('lvlup-close')?.addEventListener('click', close);
  document.addEventListener('keydown', keyHandler);
  
  // 发送事件
  eventBus.emit('player:levelUp', { level: newLevel });
}

/**
 * 获取升级时的解锁信息
 * @param {number} level - 新等级
 * @param {object} player - 玩家对象
 * @returns {string[]} 解锁描述数组
 */
export function getLevelUnlocks(level, player) {
  const unlocks = [];
  
  // 天赋点
  if (level % 2 === 0) unlocks.push('获得 1 天赋点');
  
  // 基因锁相关提示
  if (level === 5) unlocks.push('🧬 基因锁系统开放 — 通过战斗积蓄突破能量');
  if (level === 10) unlocks.push('🧬 基因锁第一阶可达');
  if (level === 20) unlocks.push('🧬 基因锁第二阶可达');
  if (level === 35) unlocks.push('🧬 基因锁第三阶可达');
  
  // 装备槽
  if (level === 3) unlocks.push('📦 装备仓库扩容 → 12格');
  if (level === 8) unlocks.push('📦 装备仓库扩容 → 18格');
  if (level === 15) unlocks.push('📦 装备仓库扩容 → 24格');
  
  // 系统解锁
  if (level === 2) unlocks.push('⚔ 战斗姿态系统解锁');
  if (level === 4) unlocks.push('✨ 附魔系统解锁');
  if (level === 6) unlocks.push('🔮 元素系统解锁');
  if (level === 10) unlocks.push('🏆 挑战地下城解锁');
  if (level === 12) unlocks.push('🌀 深渊模式解锁');
  
  // 每5级的里程碑
  if (level % 5 === 0) unlocks.push(`⭐ 达成 Lv.${level} 里程碑！`);
  
  return unlocks;
}
