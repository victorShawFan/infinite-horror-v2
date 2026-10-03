// ═══════════════════════════════════════════════════════════════
// 角色详情面板 — 完整的Build总览与战力分析
// ═══════════════════════════════════════════════════════════════
//
// 按 C 键打开，展示：
// 1. 完整属性明细（基础 + 装备 + 天赋 + 基因锁 + 附魔 = 最终值）
// 2. 装备一览
// 3. 血统/基因锁状态
// 4. 天赋树进度
// 5. 战斗统计摘要
// 6. 战力评分
// ═══════════════════════════════════════════════════════════════

import { gameState } from './GameState.js';
import { getEffectiveAtk, getEffectiveDef, getEffectiveCrt, getEffectiveSpd, getStatsBreakdown } from './CombatSystem.js';
import { BLOODLINE, GENE_LOCK } from './constants.js';
import { getOwnedRelics, getRelicDef, RELIC_DEFINITIONS } from './RelicSystem.js';
import { getSelectedPerks, PERK_TIERS } from './PerkSystem.js';

const BLOODLINE_NAMES = {
  [BLOODLINE.NONE]: '无血统',
  [BLOODLINE.VAMPIRE]: '吸血鬼之血',
  [BLOODLINE.MARTIAL]: '武道之体',
  [BLOODLINE.DAOIST]: '道法之魂',
  [BLOODLINE.UNDEAD]: '不死之躯',
  [BLOODLINE.DRAGON]: '龙之血脉',
  [BLOODLINE.DEMON]: '魔神之力',
  [BLOODLINE.PSYCHIC]: '念动之心',
  [BLOODLINE.CELESTIAL]: '天人之体',
};

const GENE_NAMES = {
  [GENE_LOCK.LOCKED]: '未开启',
  [GENE_LOCK.STAGE_1]: '第一阶·感知增幅',
  [GENE_LOCK.STAGE_2]: '第二阶·肌肉控制',
  [GENE_LOCK.STAGE_3]: '第三阶·模拟思维',
  [GENE_LOCK.STAGE_4]: '第四阶·入微之境',
};

/**
 * 计算综合战力评分
 */
function calculatePowerScore(player) {
  const atk = getEffectiveAtk(player);
  const def = getEffectiveDef(player);
  const crt = getEffectiveCrt(player);
  const spd = getEffectiveSpd(player);
  
  // 加权战力公式
  const score = Math.floor(
    atk * 2.0 +
    def * 1.5 +
    player.maxHp * 0.08 +
    crt * 0.5 +
    spd * 1.0 +
    (player.geneLock || 0) * 50 +
    player.level * 3
  );
  
  // 评级
  let grade, gradeColor;
  if (score >= 800) { grade = 'SSS'; gradeColor = '#ff44ff'; }
  else if (score >= 600) { grade = 'SS'; gradeColor = '#ffaa00'; }
  else if (score >= 400) { grade = 'S'; gradeColor = '#ff6644'; }
  else if (score >= 250) { grade = 'A'; gradeColor = '#ff4444'; }
  else if (score >= 150) { grade = 'B'; gradeColor = '#ffcc44'; }
  else if (score >= 80) { grade = 'C'; gradeColor = '#44ff88'; }
  else { grade = 'D'; gradeColor = '#888'; }
  
  return { score, grade, gradeColor };
}

/**
 * 展示角色详情面板
 */
export function showCharacterSheet() {
  const old = document.getElementById('character-sheet');
  if (old) { old.remove(); return; } // Toggle
  
  const p = gameState.player;
  const atk = getEffectiveAtk(p);
  const def = getEffectiveDef(p);
  const crt = getEffectiveCrt(p);
  const spd = getEffectiveSpd(p);
  const power = calculatePowerScore(p);
  
  // 属性分解
  let breakdown;
  try { breakdown = getStatsBreakdown(p); } catch { breakdown = null; }
  
  const bloodlineName = BLOODLINE_NAMES[p.activeBloodline] || '无血统';
  const geneName = GENE_NAMES[p.geneLock] || '未知';
  const stats = gameState.stats || {};
  
  // 装备信息
  const equipSlots = [
    { name: '武器', key: 'weapon', icon: '⚔' },
    { name: '护甲', key: 'armor', icon: '🛡' },
    { name: '饰品', key: 'accessory', icon: '💎' },
  ];
  
  const equipHTML = equipSlots.map(slot => {
    const eq = p[slot.key];
    if (!eq) return `<div style="color:#555;font-size:11px;padding:3px 0;">${slot.icon} ${slot.name}: — 空 —</div>`;
    const color = eq.rarity?.color || '#aaa';
    return `<div style="color:${color};font-size:11px;padding:3px 0;">${slot.icon} ${eq.displayName || eq.name} <span style="color:#666;">[${eq.rarity?.name || '普通'}]</span></div>`;
  }).join('');
  
  // 属性条可视化
  function statBar(label, icon, value, maxVal, color) {
    const pct = Math.min(100, (value / maxVal) * 100);
    return `
      <div style="display:flex;align-items:center;gap:6px;margin:3px 0;">
        <span style="font-size:12px;min-width:16px;">${icon}</span>
        <span style="color:#888;font-size:11px;min-width:30px;">${label}</span>
        <div style="flex:1;background:rgba(255,255,255,0.03);border-radius:3px;height:8px;overflow:hidden;">
          <div style="background:${color};width:${pct}%;height:100%;border-radius:3px;transition:width 0.3s;"></div>
        </div>
        <span style="color:${color};font-size:12px;font-weight:bold;min-width:35px;text-align:right;">${value}</span>
      </div>
    `;
  }
  
  const overlay = document.createElement('div');
  overlay.id = 'character-sheet';
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 400;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0, 0, 0, 0.88); animation: cs-fadeIn 0.3s;
  `;
  
  overlay.innerHTML = `
    <style>
      @keyframes cs-fadeIn { from { opacity: 0 } to { opacity: 1 } }
    </style>
    <div style="max-width:480px;width:92%;max-height:85vh;overflow-y:auto;
      background:linear-gradient(180deg,rgba(8,6,15,0.98),rgba(4,3,8,0.98));
      border:1px solid ${power.gradeColor}25;border-radius:16px;padding:24px;
      box-shadow:0 0 60px ${power.gradeColor}08;">
      
      <!-- 头部 -->
      <div style="text-align:center;margin-bottom:16px;">
        <p style="color:#666;font-size:10px;letter-spacing:4px;">— 角色详情 —</p>
        <p style="color:#ddd;font-size:22px;font-weight:bold;margin:4px 0;">
          郑吒 <span style="color:#6699ff;">Lv.${p.level}</span>
        </p>
        <p style="color:#888;font-size:12px;">
          ${bloodlineName} · ${geneName}
        </p>
        <div style="display:inline-block;margin-top:8px;padding:6px 20px;
          background:rgba(${power.grade === 'SSS' ? '255,68,255' : power.grade === 'SS' ? '255,170,0' : '255,100,68'},0.08);
          border:1px solid ${power.gradeColor}30;border-radius:20px;">
          <span style="color:${power.gradeColor};font-size:10px;letter-spacing:2px;">战力</span>
          <span style="color:${power.gradeColor};font-size:20px;font-weight:bold;margin:0 4px;">${power.score}</span>
          <span style="color:${power.gradeColor};font-size:14px;font-weight:bold;">${power.grade}</span>
        </div>
      </div>
      
      <!-- 属性 -->
      <div style="margin-bottom:16px;">
        <p style="color:#888;font-size:10px;letter-spacing:2px;margin-bottom:8px;">📊 属性明细</p>
        ${statBar('HP', '❤', p.hp, p.maxHp, '#44ff88')}
        ${p.maxMana > 0 ? statBar('MP', '💙', p.mana || 0, p.maxMana, '#4488ff') : ''}
        ${statBar('ATK', '⚔', atk, 100, '#ff6644')}
        ${statBar('DEF', '🛡', def, 80, '#4488ff')}
        ${statBar('CRT', '✦', crt, 50, '#ff44aa')}
        ${statBar('SPD', '💨', spd, 30, '#ffcc44')}
        <div style="margin-top:4px;padding:4px 8px;background:rgba(255,255,255,0.02);border-radius:4px;">
          <span style="color:#666;font-size:10px;">EXP: ${p.exp}/${p.expToNext} · Gold: ${p.gold || 0}G</span>
        </div>
      </div>
      
      <!-- 装备 -->
      <div style="margin-bottom:16px;padding:10px;background:rgba(255,255,255,0.02);border-radius:8px;">
        <p style="color:#888;font-size:10px;letter-spacing:2px;margin-bottom:6px;">🎒 装备</p>
        ${equipHTML}
      </div>
      
      <!-- 基因锁 -->
      <div style="margin-bottom:16px;padding:10px;background:rgba(255,102,0,0.04);border:1px solid #ff660015;border-radius:8px;">
        <p style="color:#ff8800;font-size:10px;letter-spacing:2px;margin-bottom:4px;">🧬 基因锁: ${geneName}</p>
        <div style="display:flex;gap:4px;">
          ${[1,2,3,4].map(i => {
            const active = (p.geneLock || 0) >= i;
            return `<div style="flex:1;height:4px;border-radius:2px;background:${active ? '#ff8800' : '#333'};"></div>`;
          }).join('')}
        </div>
        ${(p.geneLockCharge || 0) > 0 ? `<p style="color:#666;font-size:10px;margin-top:4px;">充能: ${p.geneLockCharge || 0}</p>` : ''}
      </div>
      
      <!-- 遗物 -->
      <div style="margin-bottom:16px;padding:10px;background:rgba(255,204,68,0.03);border:1px solid #ffcc4415;border-radius:8px;">
        <p style="color:#ffcc44;font-size:10px;letter-spacing:2px;margin-bottom:6px;">🏛 遗物 (\0)</p>
        \<p style="color:#555;font-size:10px;">-</p>
      </div>
      
      <!-- 天赋觉醒 -->
      <div style="margin-bottom:16px;padding:10px;background:rgba(255,136,68,0.03);border:1px solid #ff884415;border-radius:8px;">
        <p style="color:#ff8844;font-size:10px;letter-spacing:2px;margin-bottom:6px;">★ 天赋觉醒</p>
        \<p style="color:#555;font-size:10px;">-</p>
      </div>
      
      <!-- 战斗统计 -->
      <div style="margin-bottom:16px;padding:10px;background:rgba(255,255,255,0.02);border-radius:8px;">
        <p style="color:#888;font-size:10px;letter-spacing:2px;margin-bottom:6px;">⚔ 战斗统计</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;font-size:11px;">
          <span style="color:#666;">击杀:</span><span style="color:#ff6644;">${stats.enemiesKilled || 0}</span>
          <span style="color:#666;">死亡:</span><span style="color:#ff4444;">${stats.deathCount || 0}</span>
          <span style="color:#666;">步数:</span><span style="color:#aaa;">${stats.stepsWalked || 0}</span>
          <span style="color:#666;">回合:</span><span style="color:#aaa;">${stats.turnsPlayed || 0}</span>
          <span style="color:#666;">章节:</span><span style="color:#44cc88;">第${gameState.chapter || 1}章</span>
          <span style="color:#666;">金币累计:</span><span style="color:#ffcc44;">${stats.goldEarned || 0}G</span>
        </div>
      </div>
      
      <div style="text-align:center;">
        <button id="cs-close" style="
          background:transparent;border:1px solid #444;color:#888;
          padding:8px 30px;cursor:pointer;font-size:12px;font-family:inherit;
          border-radius:6px;letter-spacing:2px;
        ">关闭 (C/Esc)</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  const close = () => {
    overlay.remove();
    document.removeEventListener('keydown', keyHandler);
  };
  
  const keyHandler = (e) => {
    if (e.key === 'c' || e.key === 'C' || e.key === 'Escape') {
      e.preventDefault();
      close();
    }
  };
  
  document.getElementById('cs-close')?.addEventListener('click', close);
  document.addEventListener('keydown', keyHandler);
}
