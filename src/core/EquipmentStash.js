// ═══════════════════════════════════════════════════════════════
// 装备仓库系统 — 存储替换下来的装备，主神空间可访问
// ═══════════════════════════════════════════════════════════════
import { gameState } from './GameState.js';
import { eventBus } from './EventBus.js';
import { GAME_STATE } from './constants.js';
import { getQualityColor, getQualityName, formatEquipmentTooltip } from './EquipmentAffixes.js';
import { getEquipmentDisplayName, getEquipmentTotalStats } from './EquipmentSystem.js';

const MAX_STASH = 24;

// ── 仓库数据 ──
export function getStash() {
  if (!gameState._equipStash) gameState._equipStash = [];
  return gameState._equipStash;
}

export function addToStash(equip) {
  const stash = getStash();
  if (stash.length >= MAX_STASH) return false;
  stash.push(equip);
  eventBus.emit('stash:add', { equip });
  return true;
}

export function removeFromStash(index) {
  const stash = getStash();
  if (index < 0 || index >= stash.length) return null;
  const [removed] = stash.splice(index, 1);
  eventBus.emit('stash:remove', { equip: removed });
  return removed;
}

export function getStashSize() { return getStash().length; }
export function isStashFull() { return getStash().length >= MAX_STASH; }

// ── 序列化 ──
export function serializeStash() { return JSON.parse(JSON.stringify(getStash())); }
export function deserializeStash(data) {
  gameState._equipStash = Array.isArray(data) ? data : [];
}

// ── 仓库UI ──
export function openEquipmentStash() {
  const prevState = gameState.state;
  gameState.setState(GAME_STATE.INVENTORY);
  const overlay = document.getElementById('ui-overlay');
  const p = gameState.player;

  function _renderStash() {
    const stash = getStash();
    const slots = ['weapon', 'armor', 'accessory'];

    overlay.innerHTML = `
      <div style="position:absolute;top:0;left:0;right:0;bottom:0;
                  display:flex;align-items:center;justify-content:center;
                  background:rgba(0,0,0,0.88);" id="stash-backdrop">
        <div style="background:rgba(8,8,18,0.98);border:1px solid #665533;border-radius:16px;
                    padding:24px;max-width:620px;width:96%;max-height:85vh;overflow-y:auto;">
          <h2 style="color:#ffcc44;letter-spacing:4px;font-size:18px;text-align:center;margin-bottom:4px;">
            📦 装备仓库
          </h2>
          <p style="color:#666;font-size:11px;text-align:center;margin-bottom:16px;">
            ${stash.length}/${MAX_STASH} 格 — 点击仓库装备可与当前装备交换
          </p>

          <!-- 当前装备 -->
          <div style="margin-bottom:16px;">
            <p style="color:#aaa;font-size:12px;margin-bottom:6px;">🎯 当前装备</p>
            <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
              ${slots.map(slot => {
                const eq = p[slot];
                const label = { weapon: '⚔武器', armor: '🛡护甲', accessory: '💍饰品' }[slot];
                if (!eq) return `<div style="background:rgba(50,50,50,0.3);border:1px dashed #333;
                  border-radius:8px;padding:10px;text-align:center;">
                  <span style="color:#444;font-size:12px;">${label}: 空</span></div>`;
                const qc = getQualityColor(eq.quality) || '#aaa';
                const qn = eq.quality ? getQualityName(eq.quality) : '';
                return `<div style="background:rgba(255,204,68,0.04);border:1px solid ${qc}33;
                  border-radius:8px;padding:10px;">
                  <p style="color:#888;font-size:10px;">${label}</p>
                  <p style="color:${qc};font-size:13px;font-weight:bold;">
                    ${qn ? '['+qn+'] ' : ''}${eq.displayName || eq.name}
                  </p>
                  <p style="color:#666;font-size:10px;margin-top:2px;">
                    ${eq.atk ? 'ATK+'+eq.atk+' ' : ''}${eq.def ? 'DEF+'+eq.def+' ' : ''}
                    ${eq.maxHp ? 'HP+'+eq.maxHp+' ' : ''}${eq.spd ? 'SPD+'+eq.spd : ''}
                  </p>
                  <button class="stash-unequip" data-slot="${slot}" style="
                    margin-top:6px;background:rgba(255,100,100,0.1);border:1px solid #ff444433;
                    color:#ff8866;padding:3px 10px;font-size:10px;cursor:pointer;
                    border-radius:4px;font-family:inherit;">卸下</button>
                </div>`;
              }).join('')}
            </div>
          </div>

          <!-- 仓库格子 -->
          <div style="margin-bottom:16px;">
            <p style="color:#aaa;font-size:12px;margin-bottom:6px;">📦 仓库物品</p>
            ${stash.length === 0 ? '<p style="color:#444;font-size:12px;text-align:center;padding:20px;">仓库空空如也</p>' : ''}
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px;">
              ${stash.map((eq, i) => {
                const qc = getQualityColor(eq.quality) || '#aaa';
                const qn = eq.quality ? getQualityName(eq.quality) : '';
                const slotType = eq.slot || (eq.atk > (eq.def||0) ? 'weapon' : eq.def > 0 ? 'armor' : 'accessory');
                const slotIcon = { weapon: '⚔', armor: '🛡', accessory: '💍' }[slotType] || '?';
                return `<div style="background:rgba(255,255,255,0.02);border:1px solid ${qc}33;
                  border-radius:8px;padding:10px;cursor:pointer;transition:background 0.15s;"
                  class="stash-item" data-idx="${i}"
                  onmouseover="this.style.background='rgba(255,204,68,0.08)'"
                  onmouseout="this.style.background='rgba(255,255,255,0.02)'">
                  <p style="color:${qc};font-size:12px;font-weight:bold;">
                    ${slotIcon} ${qn ? '['+qn+'] ' : ''}${eq.displayName || eq.name}
                  </p>
                  <p style="color:#666;font-size:10px;margin-top:2px;">
                    ${eq.atk ? 'ATK+'+eq.atk+' ' : ''}${eq.def ? 'DEF+'+eq.def+' ' : ''}
                    ${eq.maxHp ? 'HP+'+eq.maxHp+' ' : ''}${eq.spd ? 'SPD+'+eq.spd : ''}
                  </p>
                  <div style="display:flex;gap:6px;margin-top:6px;">
                    <button class="stash-equip-btn" data-idx="${i}" style="
                      background:rgba(68,255,136,0.1);border:1px solid #44ff8833;
                      color:#44ff88;padding:3px 10px;font-size:10px;cursor:pointer;
                      border-radius:4px;font-family:inherit;">装备</button>
                    <button class="stash-sell-btn" data-idx="${i}" style="
                      background:rgba(255,204,68,0.08);border:1px solid #ffcc4433;
                      color:#ffcc44;padding:3px 10px;font-size:10px;cursor:pointer;
                      border-radius:4px;font-family:inherit;">分解</button>
                  </div>
                </div>`;
              }).join('')}
            </div>
          </div>

          <div style="text-align:center;">
            <button id="btn-close-stash" style="
              background:transparent;border:1px solid #444;color:#888;
              padding:8px 30px;cursor:pointer;font-size:14px;font-family:inherit;
              border-radius:6px;">关闭 (Esc)</button>
          </div>
        </div>
      </div>
    `;

    // ── Handlers ──
    const close = () => {
      overlay.innerHTML = '';
      document.removeEventListener('keydown', kh);
      gameState.setState(prevState);
    };

    // Unequip current → stash
    document.querySelectorAll('.stash-unequip').forEach(btn => {
      btn.addEventListener('click', () => {
        const slot = btn.dataset.slot;
        if (!p[slot]) return;
        if (isStashFull()) {
          // Can't unequip if stash is full
          return;
        }
        addToStash(p[slot]);
        p[slot] = null;
        _renderStash();
      });
    });

    // Equip from stash
    document.querySelectorAll('.stash-equip-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.idx);
        const eq = getStash()[idx];
        if (!eq) return;
        const slot = eq.slot || (eq.atk > (eq.def||0) ? 'weapon' : eq.def > 0 ? 'armor' : 'accessory');
        
        // Swap: current → stash, stash item → player
        const removed = removeFromStash(idx);
        if (p[slot]) {
          addToStash(p[slot]);
        }
        p[slot] = removed;
        _renderStash();
      });
    });

    // Sell from stash
    document.querySelectorAll('.stash-sell-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.idx);
        const eq = getStash()[idx];
        if (!eq) return;
        const sellGold = Math.floor(((eq.atk || 0) + (eq.def || 0) * 2 + (eq.maxHp || 0) / 5) * 3 + 10);
        const qualityMul = { rough: 0.5, fine: 1, rare: 1.5, epic: 2, legendary: 3 }[eq.quality] || 1;
        const gold = Math.floor(sellGold * qualityMul);
        p.gold = (p.gold || 0) + gold;
        gameState.stats.goldEarned = (gameState.stats.goldEarned || 0) + gold;
        
        // Give soul fragments for higher quality
        if (eq.quality === 'epic' || eq.quality === 'legendary') {
          const frags = eq.quality === 'legendary' ? 15 : 8;
          p.soulFragments = (p.soulFragments || 0) + frags;
        }
        
        removeFromStash(idx);
        _renderStash();
      });
    });

    document.getElementById('btn-close-stash')?.addEventListener('click', close);
    document.getElementById('stash-backdrop')?.addEventListener('click', (e) => {
      if (e.target.id === 'stash-backdrop') close();
    });

    const kh = (e) => {
      if (e.key === 'Escape') { document.removeEventListener('keydown', kh); close(); }
    };
    document.addEventListener('keydown', kh);
  }

  _renderStash();
}
