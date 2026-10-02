// ═══════════════════════════════════════════════════════════════
// 野外商人系统 — 楼层中可交互的NPC商人
// ═══════════════════════════════════════════════════════════════
import { gameState } from './GameState.js';
import { eventBus } from './EventBus.js';
import { GAME_STATE } from './constants.js';

// ── 商人库存按章节分级 ──
const MERCHANT_STOCK = {
  // 早期(Ch1-4): 基础补给
  early: [
    { id: 'heal_50',  name: '急救药剂',   price: 30,  type: 'consumable', effect: { heal: 50 },  desc: '恢复50HP' },
    { id: 'heal_100', name: '高级药剂',   price: 60,  type: 'consumable', effect: { heal: 100 }, desc: '恢复100HP' },
    { id: 'atk_gem',  name: '力量宝石',   price: 80,  type: 'gem',        gemId: 'ruby',         desc: 'ATK+3宝石' },
    { id: 'def_gem',  name: '守护宝石',   price: 80,  type: 'gem',        gemId: 'sapphire',     desc: 'DEF+3宝石' },
    { id: 'key_y',    name: '黄色钥匙',   price: 20,  type: 'key',        keyColor: 'yellow',    desc: '开启黄色门' },
  ],
  // 中期(Ch5-8): 增强补给
  mid: [
    { id: 'heal_150', name: '强效药剂',   price: 80,  type: 'consumable', effect: { heal: 150 }, desc: '恢复150HP' },
    { id: 'heal_250', name: '极效药剂',   price: 140, type: 'consumable', effect: { heal: 250 }, desc: '恢复250HP' },
    { id: 'spd_gem',  name: '迅捷宝石',   price: 100, type: 'gem',        gemId: 'topaz',        desc: 'SPD+2宝石' },
    { id: 'crt_gem',  name: '精准钻石',   price: 150, type: 'gem',        gemId: 'diamond',      desc: 'CRT+5%宝石' },
    { id: 'atk_boost',name: '力量卷轴',   price: 120, type: 'stat_boost', effect: { atk: 3 },    desc: 'ATK永久+3' },
    { id: 'def_boost',name: '防御卷轴',   price: 120, type: 'stat_boost', effect: { def: 3 },    desc: 'DEF永久+3' },
    { id: 'key_b',    name: '蓝色钥匙',   price: 40,  type: 'key',        keyColor: 'blue',      desc: '开启蓝色门' },
  ],
  // 后期(Ch9-12): 高级补给
  late: [
    { id: 'heal_300', name: '圣光药剂',   price: 150, type: 'consumable', effect: { heal: 300 }, desc: '恢复300HP' },
    { id: 'heal_full',name: '完全恢复剂', price: 300, type: 'consumable', effect: { healPercent: 1.0 }, desc: '恢复全部HP' },
    { id: 'rare_gem', name: '黑曜石',     price: 200, type: 'gem',        gemId: 'obsidian',     desc: 'ATK+5稀有宝石' },
    { id: 'hp_boost', name: '生命卷轴',   price: 150, type: 'stat_boost', effect: { maxHp: 30 }, desc: 'MaxHP永久+30' },
    { id: 'spd_boost',name: '速度卷轴',   price: 150, type: 'stat_boost', effect: { spd: 2 },    desc: 'SPD永久+2' },
    { id: 'crt_boost',name: '暴击卷轴',   price: 150, type: 'stat_boost', effect: { crt: 3 },    desc: 'CRT永久+3%' },
    { id: 'key_r',    name: '红色钥匙',   price: 80,  type: 'key',        keyColor: 'red',       desc: '开启红色门' },
    { id: 'soul_frag',name: '灵魂碎片×20',price: 200, type: 'fragments',  amount: 20,            desc: '锻造用灵魂碎片' },
  ],
};

function getStockForChapter(ch) {
  if (ch <= 4) return MERCHANT_STOCK.early;
  if (ch <= 8) return [...MERCHANT_STOCK.early, ...MERCHANT_STOCK.mid];
  return [...MERCHANT_STOCK.mid, ...MERCHANT_STOCK.late];
}

// ── 打开商人面板 ──
export function openMerchantShop(merchantName, chapter) {
  const prevState = gameState.state;
  gameState.setState(GAME_STATE.INVENTORY);
  const overlay = document.getElementById('ui-overlay');
  const stock = getStockForChapter(chapter || gameState.chapter);
  
  function _render() {
    const p = gameState.player;
    overlay.innerHTML = `
      <div style="position:absolute;top:0;left:0;right:0;bottom:0;
                  display:flex;align-items:center;justify-content:center;
                  background:rgba(0,0,0,0.85);" id="merchant-backdrop">
        <div style="background:rgba(10,10,20,0.97);border:1px solid #ffcc44;border-radius:16px;
                    padding:24px;max-width:480px;width:95%;max-height:80vh;overflow-y:auto;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
            <h2 style="color:#ffcc44;letter-spacing:4px;font-size:18px;">🏪 ${merchantName || '旅行商人'}</h2>
            <span style="color:#ffcc44;font-size:14px;">💰 ${p.gold || 0}G</span>
          </div>
          <p style="color:#666;font-size:12px;text-align:center;margin-bottom:12px;">
            "路过的旅人，要买点什么吗？"
          </p>
          <div style="display:flex;flex-direction:column;gap:8px;">
            ${stock.map(item => {
              const isBoosted = item.type === 'stat_boost';
              const purchased = isBoosted ? (gameState._merchantPurchases?.[item.id] || 0) : 0;
              const maxBuy = isBoosted ? 3 : Infinity;
              const soldOut = purchased >= maxBuy;
              const canAfford = !soldOut && (p.gold || 0) >= item.price;
              return `
                <div style="display:flex;justify-content:space-between;align-items:center;
                            background:rgba(255,255,255,0.03);border:1px solid #33333366;
                            border-radius:8px;padding:10px 14px;">
                  <div>
                    <span style="color:#ddd;font-size:14px;">${item.name}</span>
                    <span style="color:#666;font-size:11px;margin-left:8px;">${item.desc}</span>
                  </div>
                  <button class="merchant-buy" data-id="${item.id}" style="
                    background:${canAfford ? 'rgba(255,204,68,0.12)' : 'rgba(100,100,100,0.08)'};
                    border:1px solid ${canAfford ? '#ffcc4466' : '#33333366'};
                    color:${canAfford ? '#ffcc44' : '#555'};
                    padding:5px 14px;cursor:${canAfford ? 'pointer' : 'default'};
                    font-size:12px;font-family:inherit;border-radius:6px;
                    ${canAfford ? '' : 'opacity:0.5;'}
                  ">${soldOut ? '售罄' : item.price + 'G'}${isBoosted && !soldOut ? ' (' + (maxBuy - purchased) + '/' + maxBuy + ')' : ''}</button>
                </div>`;
            }).join('')}
          </div>
          <div style="text-align:center;margin-top:16px;">
            <button id="btn-close-merchant" style="
              background:transparent;border:1px solid #444;color:#888;
              padding:8px 30px;cursor:pointer;font-size:14px;font-family:inherit;
              border-radius:6px;
            ">离开 (Esc)</button>
          </div>
        </div>
      </div>
    `;
    
    // Buy handlers
    document.querySelectorAll('.merchant-buy').forEach(btn => {
      btn.addEventListener('click', () => {
        const itemDef = stock.find(s => s.id === btn.dataset.id);
        if (!itemDef || (p.gold || 0) < itemDef.price) return;
        if (itemDef.type === 'stat_boost') {
          const ct = gameState._merchantPurchases?.[itemDef.id] || 0;
          if (ct >= 3) return;
        }
        
        p.gold -= itemDef.price;
        gameState.stats.goldSpent = (gameState.stats.goldSpent || 0) + itemDef.price;
        
        // 永久属性卷轴限购
        if (itemDef.type === 'stat_boost') {
          if (!gameState._merchantPurchases) gameState._merchantPurchases = {};
          gameState._merchantPurchases[itemDef.id] = (gameState._merchantPurchases[itemDef.id] || 0) + 1;
          if (gameState._merchantPurchases[itemDef.id] >= 3) {
            // 每种卷轴限购3次
          }
        }
        
        if (itemDef.type === 'consumable') {
          // Add to inventory
          if (!p.inventory) p.inventory = [];
          p.inventory.push({ name: itemDef.name, type: 'consumable', effect: itemDef.effect });
        } else if (itemDef.type === 'gem') {
          if (!gameState.gemInventory) gameState.gemInventory = [];
          gameState.gemInventory.push(itemDef.gemId);
        } else if (itemDef.type === 'key') {
          p.keys[itemDef.keyColor] = (p.keys[itemDef.keyColor] || 0) + 1;
        } else if (itemDef.type === 'stat_boost') {
          if (itemDef.effect.atk) p.atk += itemDef.effect.atk;
          if (itemDef.effect.def) p.def += itemDef.effect.def;
          if (itemDef.effect.spd) p.spd += itemDef.effect.spd;
          if (itemDef.effect.crt) p.crt += itemDef.effect.crt;
          if (itemDef.effect.maxHp) { p.maxHp += itemDef.effect.maxHp; p.hp += itemDef.effect.maxHp; }
        } else if (itemDef.type === 'fragments') {
          p.soulFragments = (p.soulFragments || 0) + (itemDef.amount || 20);
        }
        
        eventBus.emit('merchant:purchase', { item: itemDef });
        _render();
      });
    });
    
    // Close
    const close = () => { overlay.innerHTML = ''; gameState.setState(prevState); };
    document.getElementById('btn-close-merchant')?.addEventListener('click', close);
    document.getElementById('merchant-backdrop')?.addEventListener('click', e => {
      if (e.target.id === 'merchant-backdrop') close();
    });
    const kh = (e) => { if (e.key === 'Escape') { document.removeEventListener('keydown', kh); close(); } };
    document.addEventListener('keydown', kh);
  }
  
  _render();
}
