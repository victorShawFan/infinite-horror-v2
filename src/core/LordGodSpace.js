// ═══════════════════════════════════════════════════════════════
// 主神空间 — 第一章完成后的整备与构筑系统
// ═══════════════════════════════════════════════════════════════

import { BLOODLINE, GENE_LOCK } from './constants.js';
import { eventBus } from './EventBus.js';
import { gameState } from './GameState.js';
import { audioEngine } from './AudioEngine.js';
import { checkGeneLockAdvancement, advanceGeneLock, getGeneLockProgress, getGeneLockDescription } from './GeneLockSystem.js';
import { getAvailableSkills, SKILL_DEFINITIONS } from './SkillSystem.js';
import { enhanceEquipment, socketGem, unsocketGem, getEnhanceCost, 
         getEquipmentDisplayName, GEM_TYPES, getEquipmentTotalStats } from './EquipmentSystem.js';
import { allocateTalentPoint, resetTalents, getTalentEffects, 
         getTalentPathInfo, TALENT_PATHS } from './TalentTree.js';

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
    { id: 'atk_boost_3', name: '力量强化 III', desc: 'ATK +15', cost: 1000, effect: { atk: 15 }, requires: 'atk_boost_2' },
    { id: 'def_boost_3', name: '防御强化 III', desc: 'DEF +15', cost: 1000, effect: { def: 15 }, requires: 'def_boost_2' },
    { id: 'hp_boost_3', name: '生命强化 III', desc: 'MaxHP +200', cost: 1000, effect: { maxHp: 200 }, requires: 'hp_boost_2' },
    { id: 'mana_boost', name: '法力扩展', desc: 'MaxMana +30', cost: 500, effect: { maxMana: 30 } },
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
    { id: 'chip_poison', name: '毒素芯片', desc: 'ATK+2, 毒属性', cost: 500,
      chip: { id: 'poison', name: '毒', stat: 'atk', value: 2, damageType: 'poison' } },
    { id: 'chip_psychic', name: '念力芯片', desc: 'ATK+3, 念属性', cost: 600,
      chip: { id: 'psychic', name: '念', stat: 'atk', value: 3, damageType: 'psychic' } },
    { id: 'chip_acid_resist_shop', name: '抗酸芯片', desc: 'DEF+4, 抗酸血', cost: 450,
      chip: { id: 'acid_resist', name: '抗酸', stat: 'def', value: 4, special: 'acid_resist' } },
  ],
  // ── 装备制造 ──
  equipment: [
    { id: 'weapon_pistol_plus', name: '强化手枪', desc: 'ATK+8', cost: 300,
      weapon: { name: '强化手枪', atk: 8, damageType: 'physical' } },
    { id: 'weapon_shotgun', name: '霰弹枪', desc: 'ATK+12, CRT+5', cost: 600,
      weapon: { name: '霰弹枪', atk: 12, crt: 5, damageType: 'physical' } },
    { id: 'weapon_flamer_plus', name: '强化火焰喷射器', desc: 'ATK+14, 火属性', cost: 800,
      weapon: { name: '强化火焰喷射器', atk: 14, damageType: 'fire', spd: -1 } },
    { id: 'weapon_plasma', name: '等离子步枪', desc: 'ATK+18, CRT+8', cost: 1200,
      weapon: { name: '等离子步枪', atk: 18, crt: 8, damageType: 'physical' }, requires: 'weapon_shotgun' },
    { id: 'armor_vest', name: '防弹背心', desc: 'DEF+6', cost: 400,
      armor: { name: '防弹背心', def: 6 } },
    { id: 'armor_combat', name: '战术护甲', desc: 'DEF+10, SPD-2', cost: 700,
      armor: { name: '战术护甲', def: 10, spd: -2 } },
    { id: 'armor_exo', name: '外骨骼装甲', desc: 'DEF+15, SPD+3', cost: 1500,
      armor: { name: '外骨骼装甲', def: 15, spd: 3 }, requires: 'armor_combat' },
    { id: 'acc_scope', name: '红点瞄具', desc: 'CRT+8', cost: 350,
      accessory: { name: '红点瞄具', crt: 8 } },
    { id: 'acc_neural', name: '神经链接器', desc: 'CRT+12, SPD+3', cost: 800,
      accessory: { name: '神经链接器', crt: 12, spd: 3 }, requires: 'acc_scope' },
  ],
};

/** 已购买记录 */
// purchased 从 gameState 读取，确保存档可持久化
function getPurchased() {
  if (!gameState._shopPurchased) gameState._shopPurchased = new Set();
  return gameState._shopPurchased;
}

/**
 * 尝试购买
 * @returns {{ success, message }}
 */
export function purchaseItem(item) {
  const p = gameState.player;

  if (getPurchased().has(item.id)) {
    return { success: false, message: '已经购买过了。' };
  }

  if (item.requires && !getPurchased().has(item.requires)) {
    return { success: false, message: '需要先购买前置项目。' };
  }

  if (p.rewardPoints < item.cost) {
    return { success: false, message: `奖励点不足（需要${item.cost}，当前${p.rewardPoints}）` };
  }

  // 预检芯片槽（在扣费前）
  if (item.chip && p.chips.length >= p.maxChips) {
    return { success: false, message: '芯片槽已满（最多4个）' };
  }

  // 扣费
  p.rewardPoints -= item.cost;
  getPurchased().add(item.id);

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
    // 芯片槽已在扣费前预检
    p.chips.push(item.chip);
  }

  // 装备
  if (item.weapon) {
    p.weapon = { ...item.weapon, enhanceLevel: 0, enhanceBonuses: {}, gemSlots: [], maxGemSlots: 2 };
  }
  if (item.armor) {
    p.armor = { ...item.armor, enhanceLevel: 0, enhanceBonuses: {}, gemSlots: [], maxGemSlots: 2 };
  }
  if (item.accessory) {
    p.accessory = { ...item.accessory, enhanceLevel: 0, enhanceBonuses: {}, gemSlots: [], maxGemSlots: 1 };
  }

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
      { key: 'forge', name: '🔨 锻造', color: '#ff6644' },
      { key: 'talents', name: '🌟 天赋', color: '#ffdd44' },
      { key: 'geneLock', name: '🧬 基因锁', color: '#ff6600' },
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

    // ── 基因锁特殊页面 ──
    // ── 锻造（装备强化 + 宝石镶嵌） ──
    if (cat === 'forge') {
      const p = gameState.player;
      const slots = [
        { key: 'weapon', label: '⚔ 武器', item: p.weapon },
        { key: 'armor', label: '🛡 护甲', item: p.armor },
        { key: 'accessory', label: '💍 饰品', item: p.accessory },
      ];
      
      container.innerHTML = slots.map(slot => {
        if (!slot.item) return `<div style="background:rgba(255,255,255,0.03);border:1px solid #333;border-radius:10px;padding:16px;opacity:0.5;">
          <strong style="color:#666;">${slot.label}: 无装备</strong></div>`;
        
        const displayName = getEquipmentDisplayName(slot.item);
        const enhCost = getEnhanceCost(slot.item);
        const totalStats = getEquipmentTotalStats(slot.item);
        const gems = slot.item.gemSlots || [];
        const maxGems = slot.item.maxGemSlots || 2;
        
        return `<div class="forge-slot" data-slot="${slot.key}" style="background:rgba(255,255,255,0.03);border:1px solid #555;border-radius:10px;padding:16px;margin-bottom:8px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <strong style="color:#e0e0e0;font-size:14px;">${slot.label}: ${displayName}</strong>
          </div>
          <div style="color:#888;font-size:12px;margin-bottom:8px;">
            ${Object.entries(totalStats).filter(([k,v])=>v>0).map(([k,v])=>`${k.toUpperCase()}:${v}`).join(' | ')}
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            ${!enhCost.maxed ? `<button class="btn-enhance" data-slot="${slot.key}" style="
              background:linear-gradient(135deg,#ff6644,#ff8844);border:none;color:#fff;
              padding:8px 16px;cursor:pointer;border-radius:6px;font-size:12px;font-family:inherit;">
              🔨 强化 +${enhCost.nextLevel} (⬡${enhCost.cost}, ${Math.floor(enhCost.successRate*100)}%)
            </button>` : '<span style="color:#44ff88;font-size:12px;">✓ 满级</span>'}
            ${gems.length < maxGems ? `<button class="btn-gem" data-slot="${slot.key}" style="
              background:linear-gradient(135deg,#aa44ff,#cc66ff);border:none;color:#fff;
              padding:8px 16px;cursor:pointer;border-radius:6px;font-size:12px;font-family:inherit;">
              💎 镶嵌 (${gems.length}/${maxGems})
            </button>` : ''}
          </div>
          ${gems.length > 0 ? `<div style="margin-top:8px;display:flex;gap:4px;">
            ${gems.map((g,i) => `<span style="background:${g.color || '#666'};color:#fff;padding:2px 8px;border-radius:4px;font-size:11px;cursor:pointer;" class="btn-unsocket" data-slot="${slot.key}" data-idx="${i}">${g.name} ×</span>`).join('')}
          </div>` : ''}
        </div>`;
      }).join('');
      
      // 绑定强化按钮
      container.querySelectorAll('.btn-enhance').forEach(btn => {
        btn.addEventListener('click', () => {
          const slotKey = btn.dataset.slot;
          const equip = p[slotKey];
          if (equip) {
            const result = enhanceEquipment(equip, p);
            if (result.success) {
              audioEngine.playUI('purchase');
            }
            renderShop();
            showCategory('forge');
          }
        });
      });
      
      // 绑定宝石镶嵌（简化：依次镶嵌可用宝石）
      container.querySelectorAll('.btn-gem').forEach(btn => {
        btn.addEventListener('click', () => {
          const slotKey = btn.dataset.slot;
          const equip = p[slotKey];
          if (!equip) return;
          // 从宝石背包取第一个可用的
          const gemBag = gameState.gemInventory || [];
          if (gemBag.length > 0) {
            const gemId = gemBag.shift();
            socketGem(equip, gemId);
            audioEngine.playUI('pickup');
          }
          renderShop();
          showCategory('forge');
        });
      });
      
      // 移除宝石
      container.querySelectorAll('.btn-unsocket').forEach(btn => {
        btn.addEventListener('click', () => {
          const slotKey = btn.dataset.slot;
          const idx = parseInt(btn.dataset.idx);
          const equip = p[slotKey];
          if (equip) {
            const result = unsocketGem(equip, idx);
            if (result.success) {
              gameState.gemInventory.push(result.gem.id);
            }
          }
          renderShop();
          showCategory('forge');
        });
      });
      return;
    }

    // ── 天赋树 ──
    if (cat === 'talents') {
      const ts = gameState.talents;
      const fx = getTalentEffects(ts);
      
      container.innerHTML = `
        <div style="text-align:center;margin-bottom:16px;">
          <span style="color:#ffdd44;font-size:16px;font-weight:bold;">🌟 可用天赋点: ${ts.points}</span>
          <button id="btn-reset-talents" style="background:#ff4444;border:none;color:#fff;padding:4px 12px;border-radius:4px;font-size:11px;margin-left:12px;cursor:pointer;">重置 (⬡500)</button>
        </div>
        ${Object.entries(TALENT_PATHS).map(([pathId, path]) => {
          const info = getTalentPathInfo(ts, pathId);
          const allocated = info.allocated;
          return `<div style="background:rgba(255,255,255,0.03);border:1px solid ${path.color}30;border-radius:10px;padding:16px;margin-bottom:8px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
              <strong style="color:${path.color};font-size:14px;">${path.icon} ${path.name} (${allocated}/10)</strong>
              ${ts.points > 0 && allocated < 10 ? `<button class="btn-talent" data-path="${pathId}" style="
                background:${path.color};border:none;color:#000;padding:6px 14px;cursor:pointer;
                border-radius:6px;font-size:12px;font-weight:bold;font-family:inherit;">
                + 分配
              </button>` : ''}
            </div>
            <p style="color:#888;font-size:11px;margin-bottom:8px;">${path.desc}</p>
            <div style="background:#1a1a2a;border-radius:4px;height:6px;overflow:hidden;margin-bottom:8px;">
              <div style="background:${path.color};width:${allocated*10}%;height:100%;border-radius:4px;transition:width 0.3s;"></div>
            </div>
            <div style="display:flex;flex-wrap:wrap;gap:4px;">
              ${path.tiers.map((tier, i) => `<span style="
                background:${i < allocated ? path.color + '33' : '#1a1a2a'};
                color:${i < allocated ? path.color : '#555'};
                border:1px solid ${i < allocated ? path.color + '66' : '#333'};
                padding:2px 8px;border-radius:4px;font-size:10px;
                ${i === allocated && ts.points > 0 ? 'cursor:pointer;' : ''}
              " title="${tier.desc}">${tier.name}</span>`).join('')}
            </div>
            ${info.nextTier ? `<p style="color:#666;font-size:11px;margin-top:6px;">下一级: ${info.nextTier.name} — ${info.nextTier.desc}</p>` : 
              allocated === 10 ? `<p style="color:${path.color};font-size:11px;margin-top:6px;">★ 已解锁终极天赋！</p>` : ''}
          </div>`;
        }).join('')}
        ${Object.keys(fx).some(k => typeof fx[k] === 'number' && fx[k] > 0) ? `
          <div style="background:rgba(255,221,68,0.05);border:1px solid #ffdd4430;border-radius:10px;padding:12px;margin-top:8px;">
            <strong style="color:#ffdd44;font-size:12px;">当前天赋加成:</strong>
            <p style="color:#ccc;font-size:11px;margin-top:4px;">
              ${[
                fx.atk > 0 ? 'ATK+'+fx.atk : '',
                fx.def > 0 ? 'DEF+'+fx.def : '',
                fx.spd > 0 ? 'SPD+'+fx.spd : '',
                fx.crt > 0 ? 'CRT+'+fx.crt+'%' : '',
                fx.maxHp > 0 ? 'MaxHP+'+fx.maxHp : '',
                fx.maxMana > 0 ? 'MaxMana+'+fx.maxMana : '',
                fx.dodgeChance > 0 ? '闪避'+Math.floor(fx.dodgeChance*100)+'%' : '',
                fx.blockChance > 0 ? '格挡'+Math.floor(fx.blockChance*100)+'%' : '',
                fx.regenPercent > 0 ? '每回合回血'+Math.floor(fx.regenPercent*100)+'%' : '',
                fx.armorPen > 0 ? '破甲'+Math.floor(fx.armorPen*100)+'%' : '',
                fx.killHeal > 0 ? '击杀回血'+Math.floor(fx.killHeal*100)+'%' : '',
                fx.deathSave ? '死亡保护' : '',
              ].filter(Boolean).join(' | ')}
            </p>
          </div>` : ''}
      `;
      
      // 绑定分配按钮
      container.querySelectorAll('.btn-talent').forEach(btn => {
        btn.addEventListener('click', () => {
          const pathId = btn.dataset.path;
          const result = allocateTalentPoint(ts, pathId);
          if (result.success) {
            audioEngine.playUI('purchase');
            renderShop();
            showCategory('talents');
          }
        });
      });
      
      // 重置按钮
      const resetBtn = document.getElementById('btn-reset-talents');
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          const p = gameState.player;
          if ((p.rewardPoints || 0) < 500) return;
          const result = resetTalents(ts, 500);
          if (result.success) {
            p.rewardPoints -= 500;
            audioEngine.playUI('purchase');
            renderShop();
            showCategory('talents');
          }
        });
      }
      return;
    }

        if (cat === 'geneLock') {
      const progress = getGeneLockProgress(p);
      const check = checkGeneLockAdvancement(p);
      const desc = getGeneLockDescription(progress.currentStage);
      const nextDesc = progress.currentStage < 4 ? getGeneLockDescription(progress.currentStage + 1) : null;
      const skills = getAvailableSkills(p);
      const allSkillNames = skills.map(s => `${s.name}（${s.description || s.desc || ''}）`);

      container.innerHTML = `
        <div style="background: rgba(255,100,0,0.05); border: 1px solid #ff660040; border-radius: 12px; padding: 24px; margin-bottom: 16px;">
          <h3 style="color: #ff6600; margin-bottom: 12px;">🧬 基因锁状态</h3>
          <p style="color: #e0e0e0; margin-bottom: 8px;">
            当前阶段: <strong style="color: #ff8800;">第${progress.currentStage}阶</strong>
            ${progress.currentStage === 0 ? '（未开启）' : ''}
            ${progress.currentStage === 4 ? '（已臻巅峰）' : ''}
          </p>
          <p style="color: #aaa; font-size: 13px; margin-bottom: 8px;">${desc}</p>
          ${progress.nextThreshold ? `
            <div style="margin: 12px 0;">
              <div style="display: flex; justify-content: space-between; color: #888; font-size: 12px; margin-bottom: 4px;">
                <span>充能进度</span>
                <span>${progress.charge} / ${progress.nextThreshold} (${progress.progressPercent}%)</span>
              </div>
              <div style="background: #1a1a2a; border-radius: 4px; height: 8px; overflow: hidden;">
                <div style="background: linear-gradient(90deg, #ff6600, #ff8800); width: ${Math.min(100, progress.progressPercent)}%; height: 100%; border-radius: 4px; transition: width 0.3s;"></div>
              </div>
            </div>
          ` : ''}
          ${check.advanced ? `
            <button id="btn-gene-advance" style="
              background: linear-gradient(135deg, #ff6600, #ff8800); border: none;
              color: #fff; padding: 12px 24px; cursor: pointer; border-radius: 8px;
              font-size: 15px; font-family: inherit; margin-top: 12px; letter-spacing: 2px;
              box-shadow: 0 0 20px rgba(255,100,0,0.3);
            ">🧬 突破至第${check.newStage}阶！</button>
          ` : ''}
          ${nextDesc && !check.advanced ? `
            <p style="color: #555; font-size: 12px; margin-top: 8px;">
              下一阶: ${nextDesc}
            </p>
          ` : ''}
        </div>

        ${skills.length > 0 ? `
          <div style="background: rgba(255,100,0,0.03); border: 1px solid #ff660020; border-radius: 12px; padding: 20px;">
            <h3 style="color: #ff8800; margin-bottom: 12px;">⚔ 已解锁技能</h3>
            ${allSkillNames.map(s => `<p style="color: #ccc; font-size: 13px; margin-bottom: 6px;">• ${s}</p>`).join('')}
          </div>
        ` : `
          <div style="background: rgba(100,100,100,0.03); border: 1px solid #44444420; border-radius: 12px; padding: 20px;">
            <p style="color: #666; font-size: 13px;">开启基因锁后将解锁战斗技能。持续战斗积累充能即可突破。</p>
          </div>
        `}
      `;

      // 绑定突破按钮
      const advBtn = document.getElementById('btn-gene-advance');
      if (advBtn) {
        advBtn.addEventListener('click', () => {
          const result = advanceGeneLock(p);
          if (result.success) {
            renderShop(); // 刷新
            showCategory('geneLock');
          }
        });
      }
      return;
    }

    const items = SHOP_ITEMS[cat] || [];

    container.innerHTML = items.map(item => {
      const owned = getPurchased().has(item.id);
      const canAfford = p.rewardPoints >= item.cost;
      const needsPre = item.requires && !getPurchased().has(item.requires);

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
        if (!item || getPurchased().has(item.id)) return;
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
        if (!getPurchased().has(el.dataset.id)) {
          el.style.borderColor = '#888';
          el.style.background = 'rgba(255,255,255,0.06)';
        }
      });
      el.addEventListener('mouseout', () => {
        el.style.borderColor = getPurchased().has(el.dataset.id) ? '#333' : '#555';
        el.style.background = 'rgba(255,255,255,0.03)';
      });
    });
  }

  renderShop();
}
