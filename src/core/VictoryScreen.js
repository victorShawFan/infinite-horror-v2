// ═══════════════════════════════════════════════════════════════
// Boss 击败特写画面 — 电影级胜利结算
// ═══════════════════════════════════════════════════════════════
//
// Boss战结束后展示全屏胜利画面：
// 1. Boss击败动画（震屏+名字消散）
// 2. 战斗评级（S/A/B/C/D）大字展示
// 3. 详细战斗数据逐行飞入
// 4. 获得奖励列表
// 5. 名言/感悟文字
// ═══════════════════════════════════════════════════════════════

import { eventBus } from './EventBus.js';

const BOSS_VICTORY_QUOTES = {
  1: '"活下来了……这不是梦。这就是轮回。"',
  2: '"在异形的巢穴中，我学会了什么叫恐惧……也学会了克服它。"',
  3: '"诅咒散去的那一刻，阳光似乎从未如此刺眼。"',
  4: '"沙漠的风带走了太多。但复活真经……值得这一切代价。"',
  5: '"张杰走了。从今天起，我必须成为值得信赖的队长。"',
  6: '"异形的世界第二次来临。这一次，我们更强了。"',
  7: '"几乎全军覆没……但只要还有一个人活着，中洲队就不会倒。"',
  8: '"楚轩回来了。罗甘道的代价……也许是必须的。"',
  9: '"最终兵器……人类创造出来毁灭自己的东西。"',
  10: '"五队大战。在所有轮回者中，中洲队——不会输。"',
  11: '"天堂与地狱的分界，原来就在一念之间。"',
  12: '"一切结束了。白光中，我看见了所有人的笑脸。"',
};

const GRADE_CONFIG = {
  SS: { color: '#ffdd44', glow: '#ffdd44', text: 'SS', sub: '传说级', size: 72 },
  S:  { color: '#ff8844', glow: '#ff8844', text: 'S',  sub: '完美', size: 64 },
  A:  { color: '#ff4444', glow: '#ff4444', text: 'A',  sub: '优秀', size: 56 },
  B:  { color: '#4488ff', glow: '#4488ff', text: 'B',  sub: '良好', size: 48 },
  C:  { color: '#44cc88', glow: '#44cc88', text: 'C',  sub: '及格', size: 44 },
  D:  { color: '#888888', glow: '#888888', text: 'D',  sub: '勉强', size: 40 },
};

/**
 * 显示Boss击败特写画面
 * @param {Object} options
 * @param {string} options.bossName - Boss名字
 * @param {string} options.bossSprite - Boss图标
 * @param {number} options.chapter - 章节号
 * @param {Object} options.rating - 战斗评级 { grade, color }
 * @param {Object} options.stats - 战斗数据 { rounds, damageDealt, damageTaken, critHits, companionActions }
 * @param {Object} options.rewards - 奖励 { exp, gold, rewardPoints, drops }
 * @param {Function} options.onClose - 关闭回调
 */
export function showBossVictoryScreen(options) {
  const {
    bossName, bossSprite, chapter, rating, stats, rewards, onClose
  } = options;

  const overlay = document.getElementById('ui-overlay');
  if (!overlay) return;

  const gradeConfig = GRADE_CONFIG[rating?.grade] || GRADE_CONFIG.C;
  const quote = BOSS_VICTORY_QUOTES[chapter] || '"又一次轮回，结束了。"';

  // 构建HTML
  overlay.innerHTML = `
    <div id="boss-victory" style="
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      background: rgba(5,5,15,0.97);
      animation: fadeIn 0.5s;
      cursor: pointer;
    ">
      <!-- Boss击败标题 -->
      <div id="bv-title" style="
        opacity: 0; transform: scale(1.5);
        transition: opacity 0.6s, transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        text-align: center; margin-bottom: 20px;
      ">
        <p style="font-size: 48px; margin-bottom: 4px;">${bossSprite || '💀'}</p>
        <h1 style="
          font-size: 28px; color: #ff444488; letter-spacing: 8px;
          text-decoration: line-through; text-decoration-color: #ff4444;
        ">${bossName}</h1>
        <p style="color: #ff4444; font-size: 12px; letter-spacing: 6px; margin-top: 8px;">
          ─── 击 败 ───
        </p>
      </div>

      <!-- 战斗评级 -->
      <div id="bv-grade" style="
        opacity: 0; transform: scale(0.3);
        transition: opacity 0.4s, transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        text-align: center; margin-bottom: 24px;
      ">
        <p style="
          font-size: ${gradeConfig.size}px;
          color: ${gradeConfig.color};
          font-weight: 900;
          text-shadow: 0 0 40px ${gradeConfig.glow}60, 0 0 80px ${gradeConfig.glow}30;
          font-family: 'Impact', 'Arial Black', sans-serif;
          letter-spacing: 4px;
        ">${gradeConfig.text}</p>
        <p style="color: ${gradeConfig.color}88; font-size: 14px; letter-spacing: 4px;">
          ${gradeConfig.sub}
        </p>
      </div>

      <!-- 战斗数据 -->
      <div id="bv-stats" style="
        opacity: 0; transform: translateY(20px);
        transition: opacity 0.5s, transform 0.5s;
        display: flex; gap: 16px; flex-wrap: wrap; justify-content: center;
        max-width: 500px; margin-bottom: 20px;
      ">
        ${_statBox('回合数', stats?.rounds || 0, '#888')}
        ${_statBox('总伤害', stats?.damageDealt || 0, '#ff8844')}
        ${_statBox('受到伤害', stats?.damageTaken || 0, '#ff4444')}
        ${_statBox('暴击次数', stats?.critHits || 0, '#ffcc44')}
      </div>

      <!-- 奖励 -->
      <div id="bv-rewards" style="
        opacity: 0; transform: translateY(20px);
        transition: opacity 0.5s, transform 0.5s;
        display: flex; gap: 16px; justify-content: center; margin-bottom: 24px;
      ">
        ${rewards?.exp ? `<span style="color:#aa88ff;font-size:16px;font-weight:bold;">+${rewards.exp} EXP</span>` : ''}
        ${rewards?.gold ? `<span style="color:#ffcc44;font-size:16px;font-weight:bold;">+${rewards.gold} G</span>` : ''}
        ${rewards?.rewardPoints ? `<span style="color:#ff8844;font-size:16px;font-weight:bold;">+${rewards.rewardPoints} RP</span>` : ''}
      </div>

      <!-- 名言 -->
      <div id="bv-quote" style="
        opacity: 0; transition: opacity 1s;
        max-width: 400px; text-align: center;
      ">
        <p style="
          color: #666; font-size: 13px; font-style: italic; line-height: 1.8;
          border-left: 2px solid #333; padding-left: 12px;
        ">${quote}</p>
      </div>

      <!-- 继续提示 -->
      <p id="bv-continue" style="
        color: #333; font-size: 11px; margin-top: 32px;
        opacity: 0; transition: opacity 0.5s;
        letter-spacing: 3px;
      ">点击任意处继续</p>
    </div>
  `;

  // 逐步显示动画
  setTimeout(() => {
    const title = document.getElementById('bv-title');
    if (title) { title.style.opacity = '1'; title.style.transform = 'scale(1)'; }
  }, 200);

  setTimeout(() => {
    const grade = document.getElementById('bv-grade');
    if (grade) { grade.style.opacity = '1'; grade.style.transform = 'scale(1)'; }
    // 评级弹入时震屏
    eventBus.emit('screen:shake', { intensity: 4, duration: 200 });
  }, 800);

  setTimeout(() => {
    const s = document.getElementById('bv-stats');
    if (s) { s.style.opacity = '1'; s.style.transform = 'translateY(0)'; }
  }, 1300);

  setTimeout(() => {
    const r = document.getElementById('bv-rewards');
    if (r) { r.style.opacity = '1'; r.style.transform = 'translateY(0)'; }
  }, 1700);

  setTimeout(() => {
    const q = document.getElementById('bv-quote');
    if (q) q.style.opacity = '1';
  }, 2200);

  setTimeout(() => {
    const c = document.getElementById('bv-continue');
    if (c) c.style.opacity = '1';
  }, 3000);

  // 点击关闭
  const close = () => {
    overlay.innerHTML = '';
    document.removeEventListener('keydown', kh);
    if (onClose) onClose();
  };
  const kh = (e) => {
    if (['Escape', 'Enter', ' '].includes(e.key)) close();
  };

  // 延迟注册点击（防止意外立即关闭）
  setTimeout(() => {
    document.getElementById('boss-victory')?.addEventListener('click', close);
    document.addEventListener('keydown', kh);
  }, 2000);
}

function _statBox(label, value, color) {
  return `<div style="
    background: rgba(255,255,255,0.02); border: 1px solid ${color}20;
    border-radius: 8px; padding: 8px 16px; text-align: center; min-width: 80px;
  ">
    <p style="color: #555; font-size: 10px; letter-spacing: 1px;">${label}</p>
    <p style="color: ${color}; font-size: 20px; font-weight: bold;">${value}</p>
  </div>`;
}
