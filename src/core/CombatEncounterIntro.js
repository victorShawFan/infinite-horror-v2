// ═══════════════════════════════════════════════════════════════
// 战斗入场特写 — 遭遇敌人时的戏剧化入场演出
// ═══════════════════════════════════════════════════════════════
//
// 参考: Persona系列遭遇演出、Darkest Dungeon惊吓入场
// 根据敌人类型（普通/精英/Boss）使用不同入场强度
// 普通敌人: 快速闪切(0.4秒)
// 精英敌人: 中等演出(0.8秒)
// Boss: 完整演出(1.5秒) 含分镜震动和标题
// ═══════════════════════════════════════════════════════════════

import { audioEngine } from './AudioEngine.js';

const ENCOUNTER_STYLES = {
  normal: {
    duration: 400,
    flashColor: 'rgba(255,255,255,0.3)',
    showName: false,
    shake: false,
    slashAnim: true,
  },
  elite: {
    duration: 800,
    flashColor: 'rgba(180,100,255,0.4)',
    showName: true,
    shake: true,
    slashAnim: true,
    borderColor: '#cc44ff',
  },
  boss: {
    duration: 1500,
    flashColor: 'rgba(255,30,30,0.5)',
    showName: true,
    shake: true,
    slashAnim: true,
    borderColor: '#ff2222',
    fullIntro: true,
  },
};

/**
 * 播放战斗入场动画
 * @returns {Promise<void>} 动画结束后resolve
 */
export function playEncounterIntro(enemy, player) {
  const isBoss = !!(enemy.type === 'boss' || enemy.isBoss || enemy.bossId);
  const isElite = !!(enemy.affix && !isBoss);
  const style = isBoss ? ENCOUNTER_STYLES.boss : isElite ? ENCOUNTER_STYLES.elite : ENCOUNTER_STYLES.normal;
  
  return new Promise((resolve) => {
    // 普通敌人：快速闪白 + 斜线切割效果
    if (!isBoss && !isElite) {
      const flash = document.createElement('div');
      flash.style.cssText = `position:fixed;top:0;left:0;right:0;bottom:0;z-index:9998;
        background:${style.flashColor};pointer-events:none;
        animation:encounterFlash ${style.duration}ms ease-out forwards;`;
      
      // 斜线切割效果
      const slash = document.createElement('div');
      slash.style.cssText = `position:fixed;top:-10%;left:-50%;width:200%;height:120%;z-index:9998;
        background:linear-gradient(135deg, transparent 48%, rgba(255,255,255,0.8) 49%, rgba(255,255,255,0.8) 51%, transparent 52%);
        pointer-events:none;transform:translateX(-100%);
        animation:encounterSlash ${style.duration * 0.8}ms ease-out forwards;`;
      
      const styleEl = document.createElement('style');
      styleEl.textContent = `
        @keyframes encounterFlash{0%{opacity:1}100%{opacity:0}}
        @keyframes encounterSlash{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}
      `;
      document.head.appendChild(styleEl);
      document.body.appendChild(flash);
      document.body.appendChild(slash);
      
      try { audioEngine.play('encounter'); } catch {}
      
      setTimeout(() => {
        flash.remove();
        slash.remove();
        styleEl.remove();
        resolve();
      }, style.duration);
      return;
    }
    
    // 精英/Boss：完整演出
    const overlay = document.createElement('div');
    overlay.id = 'encounter-intro';
    overlay.style.cssText = `position:fixed;top:0;left:0;right:0;bottom:0;z-index:9998;
      background:rgba(0,0,0,0.95);display:flex;align-items:center;justify-content:center;
      pointer-events:none;`;
    
    const tierColor = isBoss ? '#ff2222' : '#cc44ff';
    const tierLabel = isBoss ? '💀 BOSS' : '⚡ ELITE';
    const tierGlow = isBoss ? 'rgba(255,30,30,0.6)' : 'rgba(180,100,255,0.5)';
    
    overlay.innerHTML = `
      <div style="position:absolute;top:0;left:0;right:0;bottom:0;overflow:hidden;">
        <!-- 对角线分割 -->
        <div style="position:absolute;top:0;left:0;width:55%;height:100%;
          background:linear-gradient(135deg,rgba(20,40,80,0.8),rgba(10,20,40,0.9));
          clip-path:polygon(0 0, 85% 0, 55% 100%, 0 100%);
          animation:slideInLeft 0.4s ease-out;">
          <div style="position:absolute;top:50%;left:30%;transform:translate(-50%,-50%);text-align:center;">
            <p style="color:#44aaff;font-size:12px;letter-spacing:4px;margin-bottom:4px;opacity:0;animation:fadeIn 0.3s 0.3s forwards;">中 洲 队</p>
            <p style="color:#88ccff;font-size:28px;font-weight:bold;letter-spacing:6px;opacity:0;animation:fadeIn 0.3s 0.4s forwards;
              text-shadow:0 0 20px rgba(68,170,255,0.5);">郑 吒</p>
            <p style="color:#668899;font-size:10px;margin-top:8px;opacity:0;animation:fadeIn 0.3s 0.5s forwards;">
              Lv.${player?.level || 1} · ATK ${player?.atk || 0} · DEF ${player?.def || 0}
            </p>
          </div>
        </div>
        
        <div style="position:absolute;top:0;right:0;width:55%;height:100%;
          background:linear-gradient(135deg,rgba(60,10,10,0.9),rgba(30,5,5,0.8));
          clip-path:polygon(30% 0, 100% 0, 100% 100%, 0% 100%);
          animation:slideInRight 0.4s ease-out;">
          <div style="position:absolute;top:50%;left:65%;transform:translate(-50%,-50%);text-align:center;">
            <p style="color:${tierColor};font-size:12px;letter-spacing:4px;margin-bottom:4px;opacity:0;animation:fadeIn 0.3s 0.3s forwards;">
              ${tierLabel}
            </p>
            <p style="color:#ff8866;font-size:28px;font-weight:bold;letter-spacing:6px;opacity:0;animation:fadeIn 0.3s 0.4s forwards;
              text-shadow:0 0 20px ${tierGlow};">${enemy.name}</p>
            <p style="color:#886655;font-size:10px;margin-top:8px;opacity:0;animation:fadeIn 0.3s 0.5s forwards;">
              HP ${enemy.hp || enemy.maxHp || '???'} · ATK ${enemy.atk || '??'} · DEF ${enemy.def || '??'}
            </p>
          </div>
        </div>
        
        <!-- 中央VS -->
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:10;
          opacity:0;animation:vsAppear 0.4s 0.2s forwards;">
          <div style="width:64px;height:64px;border:3px solid ${tierColor};border-radius:50%;
            display:flex;align-items:center;justify-content:center;
            background:rgba(0,0,0,0.8);box-shadow:0 0 30px ${tierGlow};">
            <span style="color:${tierColor};font-size:22px;font-weight:bold;letter-spacing:2px;">VS</span>
          </div>
        </div>
        
        <!-- 横线装饰 -->
        <div style="position:absolute;top:50%;left:0;right:0;height:2px;
          background:linear-gradient(90deg,transparent,${tierColor}60,transparent);
          opacity:0;animation:lineFlash 0.3s 0.6s forwards;"></div>
      </div>
      
      <style>
        @keyframes slideInLeft{from{transform:translateX(-100%)}to{transform:translateX(0)}}
        @keyframes slideInRight{from{transform:translateX(100%)}to{transform:translateX(0)}}
        @keyframes vsAppear{0%{opacity:0;transform:translate(-50%,-50%) scale(3)}60%{opacity:1;transform:translate(-50%,-50%) scale(0.9)}100%{opacity:1;transform:translate(-50%,-50%) scale(1)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes lineFlash{0%{opacity:0;transform:scaleX(0)}100%{opacity:0.6;transform:scaleX(1)}}
      </style>
    `;
    
    document.body.appendChild(overlay);
    
    try { audioEngine.play(isBoss ? 'boss_encounter' : 'encounter'); } catch {}
    
    // 屏幕震动效果
    if (style.shake) {
      const body = document.body;
      const origTransform = body.style.transform;
      let shakeCount = 0;
      const shakeInterval = setInterval(() => {
        const x = (Math.random() - 0.5) * 6;
        const y = (Math.random() - 0.5) * 6;
        body.style.transform = `translate(${x}px,${y}px)`;
        shakeCount++;
        if (shakeCount > 8) {
          clearInterval(shakeInterval);
          body.style.transform = origTransform || '';
        }
      }, 50);
    }
    
    // 退场
    const exitTime = isBoss ? 1200 : 600;
    setTimeout(() => {
      overlay.style.transition = 'opacity 0.3s';
      overlay.style.opacity = '0';
      setTimeout(() => {
        overlay.remove();
        resolve();
      }, 300);
    }, exitTime);
  });
}

/**
 * 检测是否需要播放入场动画（避免训练模式、挑战副本重复播放）
 */
export function shouldPlayEncounterIntro(enemy) {
  if (enemy.isTraining || enemy._noReward) return false;
  // Boss 和精英必播
  if (enemy.type === 'boss' || enemy.isBoss || enemy.bossId) return true;
  if (enemy.affix) return true;
  // 普通敌人 50% 概率播放简化版
  return Math.random() < 0.5;
}
