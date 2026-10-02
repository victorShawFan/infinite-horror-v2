// ═══════════════════════════════════════════════════════════════
// 主神空间 — 第一章完成后的整备与构筑系统
// ═══════════════════════════════════════════════════════════════

import { BLOODLINE, GENE_LOCK } from './constants.js';
import { eventBus } from './EventBus.js';
import { gameState } from './GameState.js';
import { audioEngine } from './AudioEngine.js';

/** 主神空间商店/强化项目 */
export const SHOP_ITEMS = {
  // ── 修复 ──
  repair: [
    { id: 'repair_full', name: '完全修复', desc: '恢复全部HP', cost: 100, effect: { healFull: true } },
    { id: 'repair_trauma', name: '创伤修复', desc: '恢复50%HP + 清除负面状态', cost: 150, effect: { healPercent: 50 } },
  ],
  // ── 属性强化 ──
  enhance: [
    { id: 'atk_boost_1', name: '力量强化 I', desc: 'ATK +5', cost: 200, effect: { atk: 5 } },
    { id: 'atk_boost_2', name: '力量强化 II', desc: 'ATK +10', cost: 500, effect: { atk: 10 }, requires: 'atk_boost_1' },
    { id: 'def_boost_1', name: '防御强化 I', desc: 'DEF +5', cost: 200, effect: { def: 5 } },
    { id: 'def_boost_2', name: '防御强化 II', desc: 'DEF +10', cost: 500, effect: { def: 10 }, requires: 'def_boost_1' },
    { id: 'hp_boost_1', name: '生命强化 I', desc: 'MaxHP +50', cost: 200, effect: { maxHp: 50 } },
    { id: 'hp_boost_2', name: '生命强化 II', desc: 'MaxHP +100', cost: 500, effect: { maxHp: 100 }, requires: 'hp_boost_1' },
    { id: 'spd_boost', name: '速度强化', desc: 'SPD +5, CRT +5%', cost: 300, effect: { spd: 5, crt: 5 } },
  ],
  // ── 血统兑换 ──
  bloodline: [
    { id: 'bl_vampire', name: '血族血统', desc: 'ATK+15%, 吸血效果', cost: 800, type: BLOODLINE.VAMPIRE,
      effect: { bloodline: BLOODLINE.VAMPIRE },
      lore: '来自远古血族的力量。每次攻击恢复少量HP。' },
    { id: 'bl_ancient', name: '古武血统', desc: 'ATK+20%, 近战加成', cost: 800, type: BLOODLINE.ANCIENT_WU,
      effect: { bloodline: BLOODLINE.ANCIENT_WU },
      lore: '古武修行者的传承。近战伤害大幅提升。' },
    { id: 'bl_martial', name: '武修血统', desc: 'DEF+20%, 反伤', cost: 800, type: BLOODLINE.MARTIAL,
      effect: { bloodline: BLOODLINE.MARTIAL },
      lore: '武道修炼的结晶。防御大幅提升，被攻击时反弹少量伤害。' },
    { id: 'bl_daoist', name: '道法血统', desc: '开启法力值, 法术伤害', cost: 1000, type: BLOODLINE.DAOIST,
      effect: { bloodline: BLOODLINE.DAOIST, maxMana: 50 },
      lore: '道家法术传承。开启法力值并可使用法术攻击。' },
  ],
  // ── 技能芯片 ──
  chips: [
    { id: 'chip_fire', name: '炎属性芯片', desc: '攻击附加火焰伤害', cost: 300,
      chip: { id: 'fire', name: '炎', stat: 'atk', value: 3, damageType: 'fire' } },
    { id: 'chip_ice', name: '冰属性芯片', desc: '攻击附加冰冻效果', cost: 300,
      chip: { id: 'ice', name: '冰', stat: 'def', value: 3, damageType: 'ice' } },
    { id: 'chip_crit', name: '暴击芯片', desc: 'CRT +10%', cost: 400,
      chip: { id: 'crit', name: '暴', stat: 'crt', value: 10 } },
    { id: 'chip_life', name: '生命芯片', desc: 'MaxHP +30', cost: 250,
      chip: { id: 'life', name: '生', stat: 'maxHp', value: 30 } },
    { id: 'chip_swift', name: '迅捷芯片', desc: 'SPD +5', cost: 350,
      chip: { id: 'swift', name: '速', stat: 'spd', value: 5 } },
  ],
  // ── 装备制造 ──
  equipment: [
    { id: 'weapon_pistol_plus', name: '强化手枪', desc: 'ATK+8', cost: 300,
      weapon: { name: '强化手枪', atk: 8, damageType: 'physical' } },
    { id: 'weapon_shotgun', name: '霰弹枪', desc: 'ATK+12, CRT+5', cost: 600,
      weapon: { name: '霰弹枪', atk: 12, crt: 5, damageType: 'physical' } },
    { id: 'armor_vest', name: '防弹背心', desc: 'DEF+6', cost: 400,
      armor: { name: '防弹背心', def: 6 } },
    { id: 'armor_combat', name: '战术护甲', desc: 'DEF+10, SPD-2', cost: 700,
      armor: { name: '战术护甲', def: 10, spd: -2 } },
    { id: 'acc_scope', name: '红点瞄具', desc: 'CRT+8', cost: 350,
      accessory: { name: '红点瞄具', crt: 8 } },
  ],
};

/** 已购买记录 */
const purchased = new Set();

/**
 * 尝试购买
 * @returns {{ success, message }}
 */
export function purchaseItem(item) {
  const p = gameState.player;

  if (purchased.has(item.id)) {
    return { success: false, message: '已经购买过了。' };
  }

  if (item.requires && !purchased.has(item.requires)) {
    return { success: false, message: '需要先购买前置项目。' };
  }

  if (p.rewardPoints < item.cost) {
    return { success: false, message: `奖励点不足（需要${item.cost}，当前${p.rewardPoints}）` };
  }

  // 扣费
  p.rewardPoints -= item.cost;
  purchased.add(item.id);

  // 应用效果
  const eff = item.effect || {};
  if (eff.healFull) { p.hp = p.maxHp; }
  if (eff.healPercent) { p.hp = Math.min(p.maxHp, p.hp + Math.floor(p.maxHp * eff.healPercent / 100)); }
  if (eff.atk) p.atk += eff.atk;
  if (eff.def) p.def += eff.def;
  if (eff.spd) p.spd += eff.spd;
  if (eff.crt) p.crt += eff.crt;
  if (eff.maxHp) { p.maxHp += eff.maxHp; p.hp += eff.maxHp; }
  if (eff.maxMana) { p.maxMana += eff.maxMana; p.mana = p.maxMana; }

  // 血统
  if (eff.bloodline) {
    if (!p.bloodlines.includes(eff.bloodline)) {
      p.bloodlines.push(eff.bloodline);
    }
    p.activeBloodline = eff.bloodline;
  }

  // 芯片
  if (item.chip) {
    if (p.chips.length < p.maxChips) {
      p.chips.push(item.chip);
    } else {
      return { success: false, message: '芯片槽已满（最多4个）' };
    }
  }

  // 装备
  if (item.weapon) p.weapon = item.weapon;
  if (item.armor) p.armor = item.armor;
  if (item.accessory) p.accessory = item.accessory;

  audioEngine.playPickup();
  eventBus.emit('shop:purchase', item);
  gameState.save(0);

  return { success: true, message: `购买成功！${item.name}` };
}

/**
 * 渲染主神空间UI
 */
export function renderLordGodSpace(onClose) {
  const overlay = document.getElementById('ui-overlay');
  const p = gameState.player;

  function renderShop() {
    const categories = [
      { key: 'repair', name: '🔧 修复', color: '#44ff88' },
      { key: 'enhance', name: '⬆ 强化', color: '#ff8844' },
      { key: 'bloodline', name: '🩸 血统', color: '#ff4488' },
      { key: 'chips', name: '💎 芯片', color: '#aa44ff' },
      { key: 'equipment', name: '⚔ 装备', color: '#ffcc44' },
    ];

    overlay.innerHTML = `
      <div style="
        position: absolute; top: 0; left: 0; right: 0; bottom: 0;
        background: url('/assets/scenes/lord_god_space.jpg') center/cover no-repeat;
        overflow-y: auto; padding: 30px;
      ">
        <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0;
          background: radial-gradient(ellipse at center, rgba(5,5,15,0.7) 0%, rgba(2,2,8,0.95) 100%);
          pointer-events: none;"></div>
        <div style="max-width: 800px; margin: 0 auto; position: relative;">
          <h1 style="text-align: center; color: #ffffff; letter-spacing: 8px;
            text-shadow: 0 0 40px rgba(255,255,255,0.3); margin-bottom: 8px;">
            主 神 空 间
          </h1>
          <p style="text-align: center; color: #666; margin-bottom: 8px;">
            十天整备 · 用奖励点强化自己
          </p>
          <p style="text-align: center; color: #ffcc44; font-size: 18px; margin-bottom: 30px;">
            ⬡ 可用奖励点: <strong>${p.rewardPoints}</strong>
          </p>

          <div style="display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-bottom: 24px;">
            ${categories.map(cat => `
              <button class="cat-btn" data-cat="${cat.key}" style="
                background: rgba(255,255,255,0.05); border: 1px solid ${cat.color}40;
                color: ${cat.color}; padding: 8px 20px; cursor: pointer; border-radius: 6px;
                font-family: inherit; font-size: 14px; transition: all 0.2s;
              ">${cat.name}</button>
            `).join('')}
          </div>

          <div id="shop-items" style="
            display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
            gap: 12px;
          "></div>

          <div style="text-align: center; margin-top: 30px;">
            <button id="btn-leave-hub" style="
              background: transparent; border: 1px solid #444; color: #888;
              padding: 12px 40px; cursor: pointer; font-size: 15px;
              letter-spacing: 4px; font-family: inherit; border-radius: 8px;
            ">前往下一个世界 →</button>
          </div>

          <div style="text-align: center; margin-top: 16px;">
            <p style="color: #444; font-size: 12px;">
              当前: Lv.${p.level} | ATK ${p.atk} | DEF ${p.def} | HP ${p.hp}/${p.maxHp}
              ${p.activeBloodline !== 'none' ? ` | 血统: ${p.activeBloodline}` : ''}
              ${p.geneLock > 0 ? ` | 基因锁 ${p.geneLock}阶` : ''}
              ${p.chips.length > 0 ? ` | 芯片: ${p.chips.map(c => c.name).join(',')}` : ''}
            </p>
          </div>
        </div>
      </div>
    `;

    // 默认显示修复
    showCategory('repair');

    // 绑定分类按钮
    overlay.querySelectorAll('.cat-btn').forEach(btn => {
      btn.addEventListener('click', () => showCategory(btn.dataset.cat));
      btn.addEventListener('mouseover', () => {
        btn.style.background = 'rgba(255,255,255,0.12)';
      });
      btn.addEventListener('mouseout', () => {
        btn.style.background = 'rgba(255,255,255,0.05)';
      });
    });

    document.getElementById('btn-leave-hub').addEventListener('click', () => {
      overlay.innerHTML = '';
      if (onClose) onClose();
    });
  }

  function showCategory(cat) {
    const container = document.getElementById('shop-items');
    const items = SHOP_ITEMS[cat] || [];

    container.innerHTML = items.map(item => {
      const owned = purchased.has(item.id);
      const canAfford = p.rewardPoints >= item.cost;
      const needsPre = item.requires && !purchased.has(item.requires);

      return `
        <div class="shop-item" data-id="${item.id}" style="
          background: rgba(255,255,255,0.03); border: 1px solid ${owned ? '#333' : (canAfford && !needsPre ? '#555' : '#2a2a2a')};
          border-radius: 10px; padding: 16px; cursor: ${owned || !canAfford || needsPre ? 'default' : 'pointer'};
          transition: all 0.2s; opacity: ${owned ? 0.5 : 1};
        ">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <strong style="color: ${owned ? '#666' : '#e0e0e0'}; font-size: 14px;">${item.name}</strong>
            <span style="color: ${canAfford ? '#ffcc44' : '#ff4444'}; font-size: 13px;">
              ${owned ? '✓ 已购' : `⬡ ${item.cost}`}
            </span>
          </div>
          <p style="color: #888; font-size: 12px; margin-bottom: 4px;">${item.desc}</p>
          ${item.lore ? `<p style="color: #555; font-size: 11px; font-style: italic;">${item.lore}</p>` : ''}
          ${needsPre ? `<p style="color: #ff6644; font-size: 11px;">需要前置: ${item.requires}</p>` : ''}
        </div>
      `;
    }).join('');

    // 绑定购买
    container.querySelectorAll('.shop-item').forEach(el => {
      el.addEventListener('click', () => {
        const item = items.find(i => i.id === el.dataset.id);
        if (!item || purchased.has(item.id)) return;
        const result = purchaseItem(item);
        if (result.success) {
          renderShop(); // 刷新整个界面
        } else {
          // 显示错误提示
          el.style.borderColor = '#ff4444';
          setTimeout(() => { el.style.borderColor = '#555'; }, 500);
        }
      });
      el.addEventListener('mouseover', () => {
        if (!purchased.has(el.dataset.id)) {
          el.style.borderColor = '#888';
          el.style.background = 'rgba(255,255,255,0.06)';
        }
      });
      el.addEventListener('mouseout', () => {
        el.style.borderColor = purchased.has(el.dataset.id) ? '#333' : '#555';
        el.style.background = 'rgba(255,255,255,0.03)';
      });
    });
  }

  renderShop();
}
