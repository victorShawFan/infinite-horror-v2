// ═══════════════════════════════════════════════════════════════
// 天赋觉醒系统 — 每5级解锁一个永久天赋，2选1
// ═══════════════════════════════════════════════════════════════
//
// 设计理念：
//   每5级(5,10,15,20,25,30,35,40)弹出天赋选择面板
//   每次提供2个互斥天赋，选一个永久生效
//   与 StatAllocation(属性点) 和 TalentTree(天赋树) 互补
//   更注重独特被动效果而非数值堆叠
// ═══════════════════════════════════════════════════════════════

import { eventBus } from './EventBus.js';
import { gameState } from './GameState.js';

// ── 天赋定义 ──
// 每个级别提供2个选择，玩家选1个
export const PERK_TIERS = {
  5: {
    label: '觉醒之始',
    choices: [
      {
        id: 'quick_learner',
        name: '快速学习者',
        icon: '📚',
        desc: '获得的经验值永久+15%',
        color: '#aa88ff',
        effect: { expMultiplier: 0.15 },
      },
      {
        id: 'battle_hardened',
        name: '百战之躯',
        icon: '🛡',
        desc: '最大HP永久+20%（基于当前值）',
        color: '#44ff88',
        effect: { maxHpPct: 0.2 },
        apply(p) { const bonus = Math.floor(p.maxHp * 0.2); p.maxHp += bonus; p.hp += bonus; },
      },
    ],
  },
  
  10: {
    label: '战意觉醒',
    choices: [
      {
        id: 'critical_mastery',
        name: '致命精通',
        icon: '🎯',
        desc: '暴击率+8%，暴击伤害+20%',
        color: '#ff4488',
        effect: { crt: 8, critDmgBonus: 0.2 },
        apply(p) { p.crt += 8; },
      },
      {
        id: 'iron_will',
        name: '钢铁意志',
        icon: '⚔',
        desc: '受到致命伤害时有20%概率存活（保留1HP），每场战斗一次',
        color: '#ffcc44',
        effect: { deathResist: 0.2 },
      },
    ],
  },
  
  15: {
    label: '血脉觉醒',
    choices: [
      {
        id: 'blood_rage',
        name: '嗜血本能',
        icon: '🩸',
        desc: '每次击杀后ATK临时+5（可叠加至+25），战斗结束重置',
        color: '#ff2244',
        effect: { killBonusAtk: 5, killBonusAtkCap: 25 },
      },
      {
        id: 'regeneration',
        name: '超级再生',
        icon: '💚',
        desc: '每回合恢复2%最大HP',
        color: '#44cc88',
        effect: { regenPct: 0.02 },
      },
    ],
  },
  
  20: {
    label: '基因突破',
    choices: [
      {
        id: 'spell_echo',
        name: '法术回响',
        icon: '🔮',
        desc: '使用技能后有30%概率不消耗冷却',
        color: '#8844ff',
        effect: { skillCdRefund: 0.3 },
      },
      {
        id: 'counter_attack',
        name: '反击本能',
        icon: '⚡',
        desc: '防御时100%反击（造成50%ATK伤害），非防御时20%反击',
        color: '#ff8844',
        effect: { counterBase: 0.2, counterDefend: 1.0, counterDmgPct: 0.5 },
      },
    ],
  },
  
  25: {
    label: '域之雏形',
    choices: [
      {
        id: 'aura_of_fear',
        name: '恐惧领域',
        icon: '👁',
        desc: '战斗开始时敌人ATK-10%，每5回合再降5%（最多-25%）',
        color: '#cc44ff',
        effect: { fearAuraBase: 0.1, fearAuraStack: 0.05, fearAuraCap: 0.25 },
      },
      {
        id: 'overcharge',
        name: '超载',
        icon: '⚡',
        desc: 'HP满时ATK+25%，HP<50%时DEF+25%',
        color: '#ffaa44',
        effect: { fullHpAtkBonus: 0.25, lowHpDefBonus: 0.25 },
      },
    ],
  },
  
  30: {
    label: '终极形态',
    choices: [
      {
        id: 'time_dilation',
        name: '时间膨胀',
        icon: '⏱',
        desc: '每5回合额外行动一次',
        color: '#44ccff',
        effect: { extraTurnInterval: 5 },
      },
      {
        id: 'soul_harvest',
        name: '灵魂收割',
        icon: '💀',
        desc: '击杀敌人时恢复20%HP+10%MP',
        color: '#ff44cc',
        effect: { killHealPct: 0.2, killManaRestorePct: 0.1 },
      },
    ],
  },
  
  35: {
    label: '超越极限',
    choices: [
      {
        id: 'unstoppable',
        name: '势不可挡',
        icon: '🔥',
        desc: '连续3次攻击后下一击必定暴击，暴击伤害+50%',
        color: '#ff4400',
        effect: { guaranteedCritAfter: 3, guaranteedCritDmgBonus: 0.5 },
      },
      {
        id: 'adaptive_armor',
        name: '自适应护甲',
        icon: '🛡',
        desc: '每次受到同类型伤害后，该类型抗性+10%（可叠加至50%）',
        color: '#4488ff',
        effect: { adaptiveResist: 0.1, adaptiveResistCap: 0.5 },
      },
    ],
  },
  
  40: {
    label: '入微之境',
    choices: [
      {
        id: 'zen_mastery',
        name: '入微·心灵之光',
        icon: '✨',
        desc: '所有属性+10%，技能冷却-1，免疫负面状态（每场一次）',
        color: '#ffffff',
        effect: { allStatsPct: 0.1, cdReduce: 1, immuneDebuffOnce: true },
        apply(p) {
          p.atk = Math.floor(p.atk * 1.1);
          p.def = Math.floor(p.def * 1.1);
          p.spd = Math.floor(p.spd * 1.1);
          p.maxHp = Math.floor(p.maxHp * 1.1);
          p.hp = Math.min(p.hp, p.maxHp);
        },
      },
      {
        id: 'final_evolution',
        name: '终极进化',
        icon: '🧬',
        desc: '攻击附带等级×2的固定真实伤害（无视防御），基因锁充能速度+50%',
        color: '#ff6600',
        effect: { trueDmgPerLevel: 2, geneLockChargeBonus: 0.5 },
      },
    ],
  },
};

// ── 获取已选天赋 ──
export function getSelectedPerks() {
  return gameState.player.perks || {};
}

// ── 检查某级别是否已选择 ──
export function hasPerkForLevel(level) {
  return !!(gameState.player.perks || {})[level];
}

// ── 选择天赋 ──
export function selectPerk(level, perkId) {
  const tier = PERK_TIERS[level];
  if (!tier) return { success: false, reason: '该等级没有天赋选择' };
  
  const perk = tier.choices.find(c => c.id === perkId);
  if (!perk) return { success: false, reason: '无效的天赋ID' };
  
  if (hasPerkForLevel(level)) return { success: false, reason: '该等级已经选择过天赋' };
  
  if (!gameState.player.perks) gameState.player.perks = {};
  gameState.player.perks[level] = perkId;
  
  // 应用立即效果
  if (perk.apply) {
    perk.apply(gameState.player);
  }
  
  eventBus.emit('perk:selected', { level, perkId, perk });
  return { success: true, perk };
}

// ── 获取所有已选天赋的战斗效果汇总 ──
export function getPerkCombatEffects() {
  const perks = getSelectedPerks();
  const fx = {
    expMultiplier: 0,
    critDmgBonus: 0,
    deathResist: 0,
    killBonusAtk: 0,
    killBonusAtkCap: 0,
    regenPct: 0,
    skillCdRefund: 0,
    counterBase: 0,
    counterDefend: 0,
    counterDmgPct: 0,
    fearAuraBase: 0,
    fearAuraStack: 0,
    fearAuraCap: 0,
    fullHpAtkBonus: 0,
    lowHpDefBonus: 0,
    extraTurnInterval: 0,
    killHealPct: 0,
    killManaRestorePct: 0,
    guaranteedCritAfter: 0,
    guaranteedCritDmgBonus: 0,
    adaptiveResist: 0,
    adaptiveResistCap: 0,
    allStatsPct: 0,
    cdReduce: 0,
    immuneDebuffOnce: false,
    trueDmgPerLevel: 0,
    geneLockChargeBonus: 0,
  };
  
  for (const [lvl, perkId] of Object.entries(perks)) {
    const tier = PERK_TIERS[lvl];
    if (!tier) continue;
    const perk = tier.choices.find(c => c.id === perkId);
    if (!perk) continue;
    
    for (const key of Object.keys(fx)) {
      if (perk.effect[key] !== undefined) {
        if (typeof fx[key] === 'boolean') {
          fx[key] = fx[key] || perk.effect[key];
        } else {
          fx[key] += perk.effect[key];
        }
      }
    }
  }
  
  return fx;
}

// ── 获取待选择的天赋级别列表 ──
export function getPendingPerkLevels() {
  const playerLevel = gameState.player.level;
  const perks = getSelectedPerks();
  const pending = [];
  
  for (const lvl of Object.keys(PERK_TIERS)) {
    if (parseInt(lvl) <= playerLevel && !perks[lvl]) {
      pending.push(parseInt(lvl));
    }
  }
  
  return pending.sort((a, b) => a - b);
}

// ── 渲染天赋选择面板 ──
export function renderPerkChoicePanel(level) {
  const tier = PERK_TIERS[level];
  if (!tier) return '';
  
  return `
    <div style="
      max-width: 520px; padding: 28px 24px; text-align: center;
      background: linear-gradient(180deg, rgba(5,5,20,0.98), rgba(10,10,30,0.98));
      border: 2px solid rgba(255,204,68,0.4);
      border-radius: 16px;
      box-shadow: 0 0 80px rgba(255,170,0,0.15), inset 0 0 40px rgba(255,170,0,0.05);
    ">
      <style>
        @keyframes perk-pulse { 0%, 100% { opacity: 0.8; } 50% { opacity: 1; } }
        .perk-card:hover { transform: translateY(-6px) scale(1.02); }
      </style>
      <p style="color:#ffcc44; font-size:10px; letter-spacing:8px; margin-bottom:4px; animation: perk-pulse 2s infinite;">
        ★ 天 赋 觉 醒 ★
      </p>
      <p style="color:#ff8844; font-size:16px; font-weight:bold; margin-bottom:4px;">
        Lv.${level} · ${tier.label}
      </p>
      <p style="color:#888; font-size:11px; margin-bottom:20px;">选择一项永久天赋</p>
      <div style="display:flex; gap:16px; justify-content:center;">
        ${tier.choices.map((c, i) => `
          <div class="perk-card perk-choice" data-idx="${i}" data-perk-id="${c.id}" style="
            flex:1; max-width:220px; padding:20px 16px;
            background: rgba(${c.color === '#ff4488' ? '255,68,136' : c.color === '#ffcc44' ? '255,204,68' : '100,100,255'},0.05);
            border: 1px solid ${c.color}44;
            border-radius: 14px;
            cursor: pointer;
            transition: all 0.3s;
          " onmouseenter="this.style.borderColor='${c.color}';this.style.background='rgba(255,255,255,0.08)'"
             onmouseleave="this.style.borderColor='${c.color}44';this.style.background='rgba(255,255,255,0.03)'">
            <div style="font-size:42px; margin-bottom:10px;">${c.icon}</div>
            <div style="color:${c.color}; font-size:15px; font-weight:bold; margin-bottom:8px; letter-spacing:1px;">
              ${c.name}
            </div>
            <div style="color:#bbb; font-size:12px; line-height:1.6;">
              ${c.desc}
            </div>
          </div>
        `).join('')}
      </div>
      <p style="color:#555; font-size:9px; margin-top:16px; letter-spacing:3px;">此选择不可撤销</p>
    </div>
  `;
}

// ── 渲染已选天赋列表（暂停菜单/状态面板） ──
export function renderPerkSummary() {
  const perks = getSelectedPerks();
  const entries = Object.entries(perks);
  
  if (entries.length === 0) {
    return '<p style="color:#666;font-size:11px;">尚未觉醒任何天赋</p>';
  }
  
  let html = '<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;">';
  
  for (const [lvl, perkId] of entries) {
    const tier = PERK_TIERS[lvl];
    if (!tier) continue;
    const perk = tier.choices.find(c => c.id === perkId);
    if (!perk) continue;
    
    html += `
      <div title="Lv.${lvl} ${perk.name}: ${perk.desc}" style="
        padding:4px 10px; border-radius:6px;
        background:${perk.color}11; border:1px solid ${perk.color}33;
        font-size:11px; cursor:help;
      ">
        <span style="font-size:14px;">${perk.icon}</span>
        <span style="color:${perk.color};">${perk.name}</span>
      </div>
    `;
  }
  
  html += '</div>';
  return html;
}
