// ═══════════════════════════════════════════════════════════════
// 战斗行动选择系统 — 回合制战术决策层
// ═══════════════════════════════════════════════════════════════
//
// 在关键战斗回合暂停，允许玩家选择：
// 1. 普通攻击（默认）
// 2. 主动技能（消耗法力/冷却）
// 3. 使用道具（消耗品）
// 4. 防御姿态（本回合减伤50%）
// 5. 逃跑（非Boss战，有失败概率）
//
// 触发条件：
// - Boss战每回合都暂停
// - 精英怪首回合暂停
// - 玩家HP<50%时暂停
// - 玩家手动设置"策略模式"时每回合暂停
// ═══════════════════════════════════════════════════════════════

import { eventBus } from './EventBus.js';
import { getEnemyIntent, renderIntentIndicator } from './EnemyIntentSystem.js';
import { gameState } from './GameState.js';
import { getAvailableSkills } from './SkillSystem.js';
import { getCurrentOrder, setOrder, renderOrderSelector, ORDER_TYPE } from './TacticalOrders.js';
import { getSyncGauge, executeSyncAttack, renderSyncGaugeHTML } from './SyncAttack.js';

// ── 行动类型 ──
export const ACTION_TYPE = {
  ATTACK:   'attack',
  SKILL:    'skill',
  ITEM:     'item',
  DEFEND:   'defend',
  FLEE:     'flee',
  SYNC:     'sync',
};

let _strategicMode = false;

export function setStrategicMode(enabled) { _strategicMode = enabled; }
export function isStrategicMode() { return _strategicMode; }

/**
 * 判断是否需要在本回合暂停选择行动
 */
export function shouldPauseForAction(round, enemy, playerHp, playerMaxHp, combatState) {
  // 策略模式：每回合暂停
  if (_strategicMode) return true;
  
  // Boss战：每回合暂停
  if (enemy.type === 'boss' || enemy.isBoss || enemy.bossId) return true;
  
  // 精英怪：首回合暂停
  if (enemy.affix && round <= 1) return true;
  
  // 低血量：暂停
  if (playerHp / playerMaxHp < 0.5) return true;
  
  // 有可用技能且非冷却中：每3回合暂停一次
  if (round > 0 && round % 3 === 0) {
    const skills = getAvailableSkills(gameState.player);
    const ready = skills.filter(s => !(combatState?.cooldowns?.[s.id] > 0));
    if (ready.length > 0) return true;
  }
  
  return false;
}

/**
 * 展示战斗行动选择面板
 * @returns {Promise<{type: string, data?: any}>} 玩家选择的行动
 */
export function showBattleActionMenu(player, enemy, round, combatState) {
  return new Promise((resolve) => {
    // Node.js 测试环境无 DOM，自动选择攻击
    if (typeof document === 'undefined' || typeof document.createElement !== 'function' || !document.body?.isConnected) {
      resolve({ type: ACTION_TYPE.ATTACK });
      return;
    }
    const old = document.getElementById('battle-action-menu');
    if (old) old.remove();
    
    const skills = getAvailableSkills(player);
    const readySkills = skills.filter(s => !(combatState?.cooldowns?.[s.id] > 0));
    const mana = player.mana || 0;
    const consumables = (player.inventory || []).filter(i => i.type === 'consumable' && i.usableInCombat !== false);
    const canFlee = !(enemy.type === 'boss' || enemy.isBoss || enemy.bossId);
    
    const overlay = document.createElement('div');
    overlay.id = 'battle-action-menu';
    overlay.style.cssText = `
      position: fixed; bottom: 0; left: 0; right: 0; z-index: 200;
      display: flex; flex-direction: column; align-items: center;
      background: linear-gradient(0deg, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 80%, transparent 100%);
      padding: 16px 16px 24px; animation: bam-slideUp 0.3s ease-out;
      pointer-events: all;
    `;
    
    // 回合信息 + 敌人意图
    let intentHtml = '';
    try {
      const intent = getEnemyIntent(enemy, round + 1, enemy.hp || enemy._currentHp || 100, enemy._maxHp || enemy.hp || 100, player.hp, player.maxHp);
      if (intent) {
        intentHtml = `
          <div style="margin-bottom:8px;display:flex;align-items:center;justify-content:center;gap:8px;">
            <span style="color:#888;font-size:10px;">敌方意图:</span>
            <div style="display:flex;align-items:center;gap:4px;padding:3px 10px;background:${intent.color}11;border:1px solid ${intent.color}33;border-radius:6px;">
              <span style="font-size:14px;">${intent.icon}</span>
              <span style="color:${intent.color};font-size:11px;font-weight:bold;">${intent.label}</span>
              <span style="color:#999;font-size:10px;">${intent.desc}</span>
            </div>
      <div id="order-selector" style="margin-top:8px;display:flex;gap:4px;justify-content:center;flex-wrap:wrap;">
        <span style="color:#666;font-size:10px;margin-right:4px;line-height:24px;">指令:</span>
        ${renderOrderSelector()}
      </div>
          </div>
        `;
      }
    } catch {}
    const roundInfo = `${intentHtml}<p style="color:#666;font-size:10px;letter-spacing:3px;margin-bottom:8px;">— 第 ${round + 1} 回合 · 选择行动 —</p>`;
    
    // 主行动按钮
    const mainActions = `
      <div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin-bottom:8px;">
        <button class="bam-btn" data-action="attack" style="background:rgba(255,100,68,0.12);border-color:#ff6644;">
          ⚔ 攻击 <span style="color:#666;font-size:10px;">(1)</span>
        </button>
        <button class="bam-btn" data-action="defend" style="background:rgba(68,136,255,0.12);border-color:#4488ff;">
          🛡 防御 <span style="color:#666;font-size:10px;">(2)</span>
        </button>
        ${canFlee ? `<button class="bam-btn" data-action="flee" style="background:rgba(100,100,100,0.08);border-color:#666;">
          💨 逃跑 <span style="color:#666;font-size:10px;">(5)</span>
        </button>` : ''}
      </div>
    `;
    
    // 技能按钮
    const skillButtons = readySkills.length > 0 ? `
      <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-bottom:6px;">
        ${readySkills.map((s, i) => {
          const canAfford = mana >= (s.manaCost || 0);
          const opacity = canAfford ? '1' : '0.4';
          return `<button class="bam-btn bam-skill" data-action="skill" data-skill-id="${s.id}" 
            style="background:rgba(170,136,255,0.1);border-color:#aa88ff;opacity:${opacity};${canAfford ? '' : 'pointer-events:none;'}"
            ${canAfford ? '' : 'disabled'}>
            ${s.name} <span style="color:#aa88ff;font-size:9px;">${s.manaCost || 0}MP</span>
            <span style="color:#666;font-size:10px;">(${String.fromCharCode(65 + i)})</span>
          </button>`;
        }).join('')}
      </div>
    ` : '';
    
    // 道具按钮
    const _describeItemEffect = (item) => {
      const eff = item.effect || {};
      const parts = [];
      if (eff.healPercent) parts.push('+' + Math.floor(eff.healPercent * 100) + '% HP');
      if (eff.manaPercent) parts.push('+' + Math.floor(eff.manaPercent * 100) + '% MP');
      if (eff.atkBoost) parts.push('ATK+' + Math.floor(eff.atkBoost * 100) + '%');
      if (eff.defBoost) parts.push('DEF+' + Math.floor(eff.defBoost * 100) + '%');
      if (eff.removeDebuff) parts.push('净化');
      return parts.join(' ') || item.desc?.slice(0, 12) || '';
    };
    const itemButtons = consumables.length > 0 ? `
      <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;">
        ${consumables.slice(0, 4).map((item, i) => {
          const effDesc = _describeItemEffect(item);
          return `<button class="bam-btn bam-item" data-action="item" data-item-idx="${i}"
            style="background:rgba(68,204,136,0.08);border-color:#44cc88;text-align:center;">
            ${item.icon || '🧪'} ${item.name} <span style="color:#666;font-size:10px;">(F${i+1})</span>
            ${effDesc ? '<br><span style="color:#44cc88;font-size:9px;">' + effDesc + '</span>' : ''}
          </button>`;
        }).join('')}
      </div>
    ` : '';
    
    // 首次战斗教程提示
    const _isFirstBattle = typeof localStorage !== 'undefined' && !localStorage.getItem('ih_tutorial_battle');
    
    overlay.innerHTML = `
      ${_isFirstBattle ? `
      <div id="bam-tutorial" style="
        position:absolute;top:20%;left:50%;transform:translateX(-50%);
        background:rgba(5,5,20,0.95);border:1px solid #ffcc4444;border-radius:12px;
        padding:16px 24px;max-width:360px;z-index:201;animation:bam-slideUp 0.4s;
        pointer-events:all;
      ">
        <p style="color:#ffcc44;font-size:11px;letter-spacing:2px;margin-bottom:6px;">💡 战术指南</p>
        <p style="color:#aaa;font-size:12px;line-height:1.8;">
          Boss战和危急时刻会暂停让你选择行动：<br>
          <span style="color:#ff6644;">⚔攻击</span> 正常出手 ·
          <span style="color:#aa88ff;">技能</span> 消耗MP释放 ·
          <span style="color:#4488ff;">🛡防御</span> 减伤50%<br>
          <span style="color:#44cc88;">📦道具</span> 使用背包物品 ·
          <span style="color:#888;">💨逃跑</span> 非Boss战可尝试
        </p>
        <button onclick="this.parentElement.remove();try{localStorage.setItem('ih_tutorial_battle','1')}catch{}" 
          style="display:block;margin:8px auto 0;background:transparent;border:1px solid #ffcc4444;
          color:#ffcc44;padding:4px 20px;cursor:pointer;font-size:11px;font-family:inherit;border-radius:4px;">
          知道了
        </button>
      </div>` : ''}
      <style>
        @keyframes bam-slideUp { from { transform: translateY(40px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .bam-btn {
          padding: 10px 18px; cursor: pointer; font-size: 13px;
          font-family: inherit; border-radius: 8px; border: 1px solid;
          color: #ddd; transition: all 0.15s; letter-spacing: 1px;
          min-width: 90px;
        }
        .bam-btn:hover:not(:disabled) { filter: brightness(1.3); transform: translateY(-1px); }
        .bam-btn:active:not(:disabled) { transform: translateY(0); filter: brightness(0.9); }
      </style>
      ${roundInfo}
      ${mainActions}
      ${skillButtons}
      ${itemButtons}
    `;
    
    document.body.appendChild(overlay);
    
    const cleanup = () => {
      overlay.remove();
      document.removeEventListener('keydown', keyHandler);
    };
    
    // 按钮点击
    overlay.querySelectorAll('.bam-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        cleanup();
        if (action === 'skill') {
          resolve({ type: ACTION_TYPE.SKILL, data: { skillId: btn.dataset.skillId } });
        } else if (action === 'item') {
          const idx = parseInt(btn.dataset.itemIdx);
          resolve({ type: ACTION_TYPE.ITEM, data: { itemIndex: idx, item: consumables[idx] } });
        } else {
          resolve({ type: action });
        }
      });
    });
    
    // 键盘快捷键
    const keyHandler = (e) => {
      const key = e.key;
      if (key === '1' || key === 'Enter') {
        cleanup(); resolve({ type: ACTION_TYPE.ATTACK });
      } else if (key === '2') {
        cleanup(); resolve({ type: ACTION_TYPE.DEFEND });
      } else if (key === '5' && canFlee) {
        cleanup(); resolve({ type: ACTION_TYPE.FLEE });
      } else if (key.toUpperCase() >= 'A' && key.toUpperCase() <= 'D') {
        const idx = key.toUpperCase().charCodeAt(0) - 65;
        if (idx < readySkills.length) {
          const s = readySkills[idx];
          if (mana >= (s.manaCost || 0)) {
            cleanup(); resolve({ type: ACTION_TYPE.SKILL, data: { skillId: s.id } });
          }
        }
      } else if (key >= 'F1' && key <= 'F4') {
        e.preventDefault();
        const idx = parseInt(key.slice(1)) - 1;
        if (idx < consumables.length) {
          cleanup(); resolve({ type: ACTION_TYPE.ITEM, data: { itemIndex: idx, item: consumables[idx] } });
        }
      }
    };
    document.addEventListener('keydown', keyHandler);
    // 战术指令按钮
    container.querySelectorAll('.order-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.order;
        if (setOrder(type)) {
          // 刷新指令显示
          const orderDiv = container.querySelector('#order-selector');
          if (orderDiv) orderDiv.innerHTML = '<span style="color:#666;font-size:10px;margin-right:4px;line-height:24px;">指令:</span>' + renderOrderSelector();
          // 重新绑定
          orderDiv?.querySelectorAll('.order-btn').forEach(b2 => {
            b2.addEventListener('click', () => { setOrder(b2.dataset.order); });
          });
        }
      });
    });
  });
}

/**
 * 应用防御行动的效果
 * @returns {object} 本回合的防御修正
 */
export function applyDefendAction() {
  return {
    damageReduction: 0.5,  // 减伤50%
    counterChance: 0.2,    // 20%概率反击
    log: { text: '🛡 采取防御姿态！受到伤害减半', type: 'defend' },
  };
}

/**
 * 尝试逃跑
 * @returns {{ success: boolean, log: object }}
 */
export function attemptFlee(player, enemy, orderFx = {}) {
  const spdDiff = (player.spd || 5) - (enemy.spd || 5);
  const baseChance = 0.4;
  const fleeBonus = orderFx.fleeBonusChance || 0; // 撤离指令加成
  const chance = Math.min(0.95, Math.max(0.1, baseChance + spdDiff * 0.05 + fleeBonus));
  const success = Math.random() < chance;
  
  return {
    success,
    log: success
      ? { text: '💨 成功脱离战斗！', type: 'flee' }
      : { text: '💨 逃跑失败！敌人穷追不舍！', type: 'danger' },
  };
}
