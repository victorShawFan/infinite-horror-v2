// ═══════════════════════════════════════════════════════════════
// 觉醒系统 — 突破极限的力量进阶
// ═══════════════════════════════════════════════════════════════
//
// 原作对应：
//   基因锁开启 → 觉醒潜力 → 突破限界
//   每次觉醒获得永久强化 + 解锁觉醒技能 + 改变外观
//
// 觉醒条件：
//   1. 达到指定基因锁等级
//   2. 击败对应章节Boss
//   3. 消耗奖励点数
//
// 觉醒阶段：
//   初始 → 觉醒I（第3章后）→ 觉醒II（第6章后）
//   → 觉醒III（第9章后）→ 完全觉醒（第12章后）
// ═══════════════════════════════════════════════════════════════

import { eventBus } from './EventBus.js';
import { BLOODLINE, GENE_LOCK } from './constants.js';

// ── 觉醒阶段定义 ──
export const AWAKENING_STAGES = [
  {
    id: 'stage_0',
    name: '潜伏',
    desc: '力量尚未觉醒',
    icon: '○',
    color: '#888888',
    requiredChapter: 0,
    requiredGeneLock: 0,
    requiredRP: 0,
    bonuses: {},
    skillSlot: null,
  },
  {
    id: 'stage_1',
    name: '初觉',
    desc: '感应到体内沉睡的力量',
    icon: '◐',
    color: '#88aaff',
    requiredChapter: 3,
    requiredGeneLock: 1,
    requiredRP: 500,
    bonuses: {
      maxHp: 50, atk: 5, def: 3,
      skillDmgBonus: 0.1,
      regenPerRound: 2,
    },
    skillSlot: 'awakening_1',
    lore: '在无数次与死神擦肩而过后，你终于触碰到了基因深处那道门。',
  },
  {
    id: 'stage_2',
    name: '破境',
    desc: '突破第一重极限',
    icon: '◑',
    color: '#44cc88',
    requiredChapter: 6,
    requiredGeneLock: 2,
    requiredRP: 1500,
    bonuses: {
      maxHp: 120, atk: 12, def: 8, spd: 3,
      skillDmgBonus: 0.2,
      regenPerRound: 5,
      critDmgBonus: 0.15,
      chainDmgBonus: 0.1,
    },
    skillSlot: 'awakening_2',
    lore: '第二重基因锁的开启不仅提升了力量，更打开了感知世界的新维度。',
  },
  {
    id: 'stage_3',
    name: '蜕变',
    desc: '基因重组，脱胎换骨',
    icon: '◕',
    color: '#ffcc44',
    requiredChapter: 9,
    requiredGeneLock: 4,
    requiredRP: 3000,
    bonuses: {
      maxHp: 250, atk: 25, def: 18, spd: 6, crt: 10,
      skillDmgBonus: 0.35,
      regenPerRound: 10,
      critDmgBonus: 0.3,
      chainDmgBonus: 0.2,
      trueDmgPercent: 0.05,
      dmgReduce: 0.1,
    },
    skillSlot: 'awakening_3',
    lore: '血统与基因锁的共鸣达到了前所未有的高度。你不再是普通的轮回者。',
  },
  {
    id: 'stage_4',
    name: '完全觉醒',
    desc: '超越人类极限的存在',
    icon: '●',
    color: '#ff4444',
    requiredChapter: 12,
    requiredGeneLock: 5,
    requiredRP: 5000,
    bonuses: {
      maxHp: 500, atk: 50, def: 35, spd: 10, crt: 20,
      skillDmgBonus: 0.5,
      regenPerRound: 20,
      critDmgBonus: 0.5,
      chainDmgBonus: 0.3,
      trueDmgPercent: 0.1,
      dmgReduce: 0.2,
      deathResist: true,
      ultimateSkill: true,
    },
    skillSlot: 'awakening_ultimate',
    lore: '你已经站在了人类进化的巅峰。基因锁完全解放，血统力量彻底觉醒。这就是——无限恐怖中的真正强者。',
  },
];

// ── 觉醒技能定义 ──
export const AWAKENING_SKILLS = {
  awakening_1: {
    id: 'awakening_1',
    name: '基因脉冲',
    desc: '释放基因力量，造成ATK×2.0伤害并恢复15%HP',
    icon: '💫',
    manaCost: 25,
    cooldown: 5,
    dmgMult: 2.0,
    healPercent: 0.15,
    element: 'psychic',
  },
  awakening_2: {
    id: 'awakening_2',
    name: '血统共鸣',
    desc: '激活血统力量，3回合内ATK+50%、吸血+20%',
    icon: '🩸',
    manaCost: 35,
    cooldown: 8,
    buffDuration: 3,
    atkBoost: 0.5,
    lifeSteal: 0.2,
  },
  awakening_3: {
    id: 'awakening_3',
    name: '基因锁·解放',
    desc: '短暂解放更深层基因锁，全属性+30%持续4回合',
    icon: '⚡',
    manaCost: 50,
    cooldown: 12,
    buffDuration: 4,
    allStatsBoost: 0.3,
    element: 'lightning',
  },
  awakening_ultimate: {
    id: 'awakening_ultimate',
    name: '无限觉醒',
    desc: '完全释放基因力量！造成ATK×5真实伤害，无视所有防御和抗性',
    icon: '💥',
    manaCost: 80,
    cooldown: 20,
    dmgMult: 5.0,
    trueDamage: true,
    ignoreAllDefense: true,
    screenEffect: 'awakening_flash',
  },
};

// ── 觉醒状态 ──
let _awakeningState = {
  stage: 0,
  unlockedSkills: [],
  totalRP_Spent: 0,
  awakeningHistory: [],
};

export function initAwakeningState() {
  _awakeningState = {
    stage: 0,
    unlockedSkills: [],
    totalRP_Spent: 0,
    awakeningHistory: [],
  };
  return _awakeningState;
}

export function getAwakeningStage() {
  return AWAKENING_STAGES[_awakeningState.stage];
}

export function getAwakeningLevel() {
  return _awakeningState.stage;
}

export function getNextAwakening() {
  if (_awakeningState.stage >= AWAKENING_STAGES.length - 1) return null;
  return AWAKENING_STAGES[_awakeningState.stage + 1];
}

// ── 检查觉醒条件 ──
export function canAwaken(player, chapter) {
  const next = getNextAwakening();
  if (!next) return { can: false, reason: '已达到最高觉醒' };
  
  if (chapter < next.requiredChapter) {
    return { can: false, reason: `需要完成第${next.requiredChapter}章` };
  }
  if ((player.geneLock || 0) < next.requiredGeneLock) {
    return { can: false, reason: `需要基因锁等级${next.requiredGeneLock}` };
  }
  if ((player.rewardPoints || 0) < next.requiredRP) {
    return { can: false, reason: `需要${next.requiredRP}奖励点 (当前: ${player.rewardPoints || 0})` };
  }
  
  return { can: true, next };
}

// ── 执行觉醒 ──
export function performAwakening(player) {
  const next = getNextAwakening();
  if (!next) return { success: false, reason: '已达到最高觉醒' };
  
  // 扣除奖励点
  player.rewardPoints = (player.rewardPoints || 0) - next.requiredRP;
  _awakeningState.totalRP_Spent += next.requiredRP;
  
  // 提升觉醒阶段
  _awakeningState.stage++;
  
  // 应用永久属性加成
  const bonuses = next.bonuses;
  if (bonuses.maxHp) player.maxHp += bonuses.maxHp;
  if (bonuses.atk) player.atk += bonuses.atk;
  if (bonuses.def) player.def += bonuses.def;
  if (bonuses.spd) player.spd = (player.spd || 5) + bonuses.spd;
  if (bonuses.crt) player.crt = (player.crt || 0) + bonuses.crt;
  
  // 恢复全部HP
  player.hp = player.maxHp;
  
  // 解锁觉醒技能
  if (next.skillSlot && AWAKENING_SKILLS[next.skillSlot]) {
    _awakeningState.unlockedSkills.push(next.skillSlot);
  }
  
  // 记录历史
  _awakeningState.awakeningHistory.push({
    stage: _awakeningState.stage,
    name: next.name,
    timestamp: Date.now(),
  });
  
  eventBus.emit('awakening:advanced', {
    stage: _awakeningState.stage,
    definition: next,
    bonuses,
  });
  
  return {
    success: true,
    stage: next,
    bonuses,
    skill: next.skillSlot ? AWAKENING_SKILLS[next.skillSlot] : null,
    lore: next.lore,
  };
}

// ── 获取觉醒战斗加成 ──
export function getAwakeningCombatBonuses() {
  const stage = AWAKENING_STAGES[_awakeningState.stage];
  if (!stage) return {};
  return { ...stage.bonuses };
}

// ── 获取觉醒技能列表 ──
export function getAwakeningSkills() {
  return _awakeningState.unlockedSkills
    .map(id => AWAKENING_SKILLS[id])
    .filter(Boolean);
}

// ── 渲染觉醒面板 ──
export function renderAwakeningPanel(player, chapter) {
  const current = getAwakeningStage();
  const next = getNextAwakening();
  const check = next ? canAwaken(player, chapter) : { can: false };
  
  let html = `
    <div style="padding:16px;background:linear-gradient(135deg,#0a0a1a,#1a0a2e);border-radius:12px;
      border:1px solid ${current.color}44;">
      <h3 style="margin:0 0 12px;color:${current.color};text-align:center;font-size:16px;">
        ${current.icon} ${current.name} ${current.icon}
      </h3>
      <p style="color:#aaa;text-align:center;font-size:12px;margin:0 0 16px;">${current.desc}</p>
  `;
  
  // 觉醒进度条
  const progress = _awakeningState.stage / (AWAKENING_STAGES.length - 1);
  html += `
    <div style="margin-bottom:16px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
        ${AWAKENING_STAGES.map((s, i) => `
          <span style="color:${i <= _awakeningState.stage ? s.color : '#333'};font-size:14px;">${s.icon}</span>
        `).join('')}
      </div>
      <div style="height:4px;background:#222;border-radius:2px;overflow:hidden;">
        <div style="width:${progress * 100}%;height:100%;background:linear-gradient(90deg,#4488ff,${current.color});
          border-radius:2px;transition:width 0.3s;"></div>
      </div>
    </div>
  `;
  
  // 当前加成
  if (Object.keys(current.bonuses).length > 0) {
    html += `<div style="margin-bottom:12px;">
      <div style="color:#888;font-size:10px;margin-bottom:4px;">当前觉醒加成:</div>
      <div style="display:flex;flex-wrap:wrap;gap:4px;">`;
    const bonusLabels = {
      maxHp: 'MaxHP', atk: 'ATK', def: 'DEF', spd: 'SPD', crt: 'CRT',
      skillDmgBonus: '技能伤害', regenPerRound: '回合恢复', critDmgBonus: '暴击伤害',
      chainDmgBonus: '连锁伤害', trueDmgPercent: '真伤比例', dmgReduce: '减伤',
    };
    for (const [key, val] of Object.entries(current.bonuses)) {
      if (typeof val === 'number' && val > 0) {
        const label = bonusLabels[key] || key;
        const display = val < 1 ? `+${Math.floor(val * 100)}%` : `+${val}`;
        html += `<span style="padding:2px 6px;background:#ffffff11;border-radius:3px;
          color:#aaa;font-size:10px;">${label} ${display}</span>`;
      }
    }
    html += `</div></div>`;
  }
  
  // 已解锁技能
  const skills = getAwakeningSkills();
  if (skills.length > 0) {
    html += `<div style="margin-bottom:12px;">
      <div style="color:#888;font-size:10px;margin-bottom:4px;">觉醒技能:</div>`;
    for (const skill of skills) {
      html += `<div style="padding:6px 8px;background:#ffffff08;border-radius:6px;margin:2px 0;
        border-left:2px solid ${current.color};">
        <span style="font-size:14px;">${skill.icon}</span>
        <span style="color:#ddd;font-size:11px;font-weight:bold;">${skill.name}</span>
        <span style="color:#888;font-size:10px;margin-left:8px;">${skill.desc}</span>
      </div>`;
    }
    html += `</div>`;
  }
  
  // 下一阶段
  if (next) {
    html += `
      <div style="margin-top:12px;padding:10px;background:#ffffff08;border-radius:8px;
        border:1px dashed ${next.color}33;">
        <div style="color:${next.color};font-weight:bold;font-size:12px;margin-bottom:6px;">
          下一阶段: ${next.icon} ${next.name}
        </div>
        <div style="color:#888;font-size:10px;line-height:1.6;">
          ◇ 完成第 ${next.requiredChapter} 章<br>
          ◇ 基因锁等级 ${next.requiredGeneLock}<br>
          ◇ 奖励点: ${next.requiredRP} (当前: ${player.rewardPoints || 0})
        </div>
        ${check.can ? `
          <button onclick="window._performAwakening && window._performAwakening()"
            style="display:block;margin:8px auto 0;padding:8px 24px;background:linear-gradient(135deg,${next.color},${next.color}88);
            border:none;border-radius:6px;color:#fff;font-weight:bold;cursor:pointer;font-size:13px;
            letter-spacing:2px;animation:pulse 1.5s infinite;">
            ⚡ 觉 醒 ⚡
          </button>
        ` : `
          <div style="color:#666;text-align:center;font-size:10px;margin-top:6px;">
            ${check.reason || '条件未满足'}
          </div>
        `}
      </div>
    `;
  } else {
    html += `<div style="text-align:center;color:${current.color};font-size:14px;margin-top:12px;
      text-shadow:0 0 10px ${current.color};">
      已达到完全觉醒
    </div>`;
  }
  
  html += `</div>`;
  return html;
}

// ── 序列化 ──
export function serializeAwakening() {
  return { ..._awakeningState };
}

export function deserializeAwakening(data) {
  if (data) {
    _awakeningState = { ...data };
  }
}
