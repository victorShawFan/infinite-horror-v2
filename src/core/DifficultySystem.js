// ═══════════════════════════════════════════════════════════════
// 难度系统 + 怪物图鉴
// ═══════════════════════════════════════════════════════════════
//
// 四档难度影响：敌人倍率、经验/金币倍率、特殊词缀触发率
// 怪物图鉴：记录已战斗过的敌人，展示弱点/统计信息

import { eventBus } from './EventBus.js';

// ── 难度档位 ──
export const DIFFICULTY = {
  EASY:   'easy',
  NORMAL: 'normal',
  HARD:   'hard',
  NIGHTMARE: 'nightmare',
};

export const DIFFICULTY_CONFIG = {
  [DIFFICULTY.EASY]: {
    name: '新手',
    icon: '🌱',
    color: '#44cc44',
    description: '敌人较弱，适合体验剧情',
    enemyHpMult: 0.7,
    enemyAtkMult: 0.7,
    enemyDefMult: 0.8,
    expMult: 0.8,
    goldMult: 1.0,
    affixChance: 0,       // 精英词缀触发概率
    bossHpMult: 0.75,
    bossAtkMult: 0.75,
  },
  [DIFFICULTY.NORMAL]: {
    name: '普通',
    icon: '⚔',
    color: '#dddd44',
    description: '标准数值体验',
    enemyHpMult: 1.0,
    enemyAtkMult: 1.0,
    enemyDefMult: 1.0,
    expMult: 1.0,
    goldMult: 1.0,
    affixChance: 0.1,
    bossHpMult: 1.0,
    bossAtkMult: 1.0,
  },
  [DIFFICULTY.HARD]: {
    name: '困难',
    icon: '💀',
    color: '#ff6644',
    description: '敌人强化，需要精打细算',
    enemyHpMult: 1.4,
    enemyAtkMult: 1.3,
    enemyDefMult: 1.2,
    expMult: 1.3,
    goldMult: 1.3,
    affixChance: 0.25,
    bossHpMult: 1.5,
    bossAtkMult: 1.3,
  },
  [DIFFICULTY.NIGHTMARE]: {
    name: '噩梦',
    icon: '🔥',
    color: '#ff2222',
    description: '极限数值挑战，每一步都是生死',
    enemyHpMult: 1.8,
    enemyAtkMult: 1.6,
    enemyDefMult: 1.4,
    expMult: 1.6,
    goldMult: 1.6,
    affixChance: 0.4,
    bossHpMult: 2.0,
    bossAtkMult: 1.6,
  },
};

// ── 精英词缀系统 ──
export const ENEMY_AFFIXES = {
  swift:     { name: '迅捷',   icon: '⚡', color: '#44ffff', spdMult: 1.5, desc: '速度+50%' },
  armored:   { name: '铁壁',   icon: '🛡', color: '#6688ff', defMult: 1.8, desc: '防御+80%' },
  vampiric:  { name: '吸血',   icon: '🩸', color: '#ff4488', lifeSteal: 0.15, desc: '每回合吸血15%伤害' },
  berserker: { name: '狂暴',   icon: '🔥', color: '#ff4400', atkMult: 1.5, hpMult: 0.7, desc: 'ATK+50% HP-30%' },
  thorny:    { name: '荆棘',   icon: '🌿', color: '#44ff44', reflectPct: 0.2, desc: '反弹20%受到的伤害' },
  shadowy:   { name: '暗影',   icon: '🌑', color: '#8844aa', dodgeChance: 0.25, desc: '25%几率闪避攻击' },
  toxic:     { name: '剧毒',   icon: '☠', color: '#88ff00', poisonDmg: 0.05, desc: '每回合造成5%最大HP的毒伤' },
  commander: { name: '统帅',   icon: '👑', color: '#ffaa00', allStatMult: 1.2, desc: '全属性+20%' },
};

// ── 当前难度 ──
let currentDifficulty = DIFFICULTY.NORMAL;

export function setDifficulty(diff) {
  if (!DIFFICULTY_CONFIG[diff]) return false;
  currentDifficulty = diff;
  eventBus.emit('difficulty:changed', { difficulty: diff });
  return true;
}

export function getDifficulty() {
  return currentDifficulty;
}

export function getDifficultyConfig() {
  return DIFFICULTY_CONFIG[currentDifficulty];
}

/**
 * 应用难度缩放到敌人数据
 * @param {Object} enemy - 原始敌人数据
 * @returns {Object} - 缩放后的敌人数据(不改原始)
 */
export function applyDifficultyScaling(enemy) {
  const cfg = getDifficultyConfig();
  const isBoss = !!enemy.bossId;
  const scaled = { ...enemy };

  // 基础数值缩放
  scaled.hp = Math.ceil(enemy.hp * (isBoss ? cfg.bossHpMult : cfg.enemyHpMult));
  scaled.atk = Math.ceil(enemy.atk * (isBoss ? cfg.bossAtkMult : cfg.enemyAtkMult));
  scaled.def = Math.ceil(enemy.def * cfg.enemyDefMult);

  // 精英词缀(非Boss)
  if (!isBoss && Math.random() < cfg.affixChance) {
    const affixKeys = Object.keys(ENEMY_AFFIXES);
    const affixId = affixKeys[Math.floor(Math.random() * affixKeys.length)];
    const affix = ENEMY_AFFIXES[affixId];
    scaled.affix = { id: affixId, ...affix };
    scaled.name = `${affix.icon}${scaled.name}`;

    if (affix.spdMult) scaled.spd = Math.ceil((scaled.spd || 5) * affix.spdMult);
    if (affix.defMult) scaled.def = Math.ceil(scaled.def * affix.defMult);
    if (affix.atkMult) scaled.atk = Math.ceil(scaled.atk * affix.atkMult);
    if (affix.hpMult) scaled.hp = Math.ceil(scaled.hp * affix.hpMult);
    if (affix.allStatMult) {
      scaled.hp = Math.ceil(scaled.hp * affix.allStatMult);
      scaled.atk = Math.ceil(scaled.atk * affix.allStatMult);
      scaled.def = Math.ceil(scaled.def * affix.allStatMult);
    }
  }

  // 经验/金币缩放
  if (scaled.rewards) {
    scaled.rewards = { ...scaled.rewards };
    scaled.rewards.exp = Math.ceil((scaled.rewards.exp || 0) * cfg.expMult);
    scaled.rewards.gold = Math.ceil((scaled.rewards.gold || 0) * cfg.goldMult);
  }

  return scaled;
}

// ═══ 怪物图鉴 ═══

class Bestiary {
  constructor() {
    this.entries = new Map(); // id -> { enemy, kills, totalDmgDealt, totalDmgTaken, firstMet }
  }

  /** 记录一次战斗 */
  record(enemy, result) {
    const baseId = enemy.bossId || enemy.id;
    if (!this.entries.has(baseId)) {
      this.entries.set(baseId, {
        name: enemy.name.replace(/^[⚡🛡🩸🔥🌿🌑☠👑]/, ''), // 去词缀icon
        sprite: enemy.sprite,
        color: enemy.color,
        baseHp: enemy.hp,
        baseAtk: enemy.atk,
        baseDef: enemy.def,
        damageType: enemy.damageType || 'physical',
        weaknesses: enemy.weaknesses || [],
        element: enemy.element || enemy.damageType || 'physical',
        isBoss: !!enemy.bossId,
        kills: 0,
        defeats: 0,
        totalDmgDealt: 0,
        totalDmgTaken: 0,
        firstMet: Date.now(),
      });
    }
    const entry = this.entries.get(baseId);
    if (result.victory) {
      entry.kills++;
      entry.totalDmgDealt += (result.damageDealt || 0);
      entry.totalDmgTaken += (result.damageTaken || 0);
    } else {
      entry.defeats++;
    }
  }

  /** 获取已遇到的怪物总数 */
  getDiscoveredCount() { return this.entries.size; }

  /** 获取图鉴条目列表 */
  getEntries() { return [...this.entries.values()]; }

  /** 按ID查询 */
  getEntry(id) { return this.entries.get(id) || null; }

  /** 获取已击杀的Boss列表 */
  getDefeatedBosses() {
    return this.getEntries().filter(e => e.isBoss && e.kills > 0);
  }

  /** 序列化 */
  toJSON() {
    const obj = {};
    for (const [k, v] of this.entries) obj[k] = v;
    return obj;
  }

  fromJSON(data) {
    this.entries.clear();
    if (data && typeof data === 'object') {
      for (const [k, v] of Object.entries(data)) {
        this.entries.set(k, v);
      }
    }
  }
}

export const bestiary = new Bestiary();

/**
 * 生成图鉴面板HTML
 */
export function formatBestiaryPanel() {
  const entries = bestiary.getEntries();
  if (entries.length === 0) {
    return '<p style="color:#555;text-align:center;margin:20px 0;">尚未遭遇任何怪物</p>';
  }

  const bosses = entries.filter(e => e.isBoss);
  const normals = entries.filter(e => !e.isBoss);

  let html = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">`;
  for (const e of [...bosses, ...normals]) {
    const winRate = e.kills + e.defeats > 0
      ? Math.floor(e.kills / (e.kills + e.defeats) * 100)
      : 0;
    const weakStr = (e.weaknesses || []).map(w => {
      const labels = { fire: '🔥火', ice: '❄冰', spirit: '👻灵', lightning: '⚡雷' };
      return labels[w] || w;
    }).join(' ') || '无';
    const borderColor = e.isBoss ? '#ff6644' : '#444';

    html += `
      <div style="padding:8px;background:rgba(255,255,255,0.03);border:1px solid ${borderColor};border-radius:6px;">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
          <span style="font-size:18px;">${e.sprite || '?'}</span>
          <span style="color:${e.color || '#ccc'};font-size:13px;font-weight:bold;">${e.name}</span>
          ${e.isBoss ? '<span style="color:#ff4444;font-size:10px;background:rgba(255,0,0,0.1);padding:1px 4px;border-radius:3px;">BOSS</span>' : ''}
        </div>
        <div style="color:#888;font-size:11px;line-height:1.6;">
          HP:${e.baseHp} ATK:${e.baseAtk} DEF:${e.baseDef}<br>
          弱点: <span style="color:#ffaa44;">${weakStr}</span><br>
          击杀: ${e.kills}次 胜率: <span style="color:${winRate >= 50 ? '#44cc44' : '#ff4444'};">${winRate}%</span>
        </div>
      </div>`;
  }
  html += '</div>';
  return html;
}

/**
 * 格式化难度选择面板HTML
 */
export function formatDifficultySelector() {
  let html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">';
  for (const [id, cfg] of Object.entries(DIFFICULTY_CONFIG)) {
    const isActive = currentDifficulty === id;
    html += `
      <div class="diff-option" data-diff="${id}" style="
        padding:12px;border-radius:8px;cursor:pointer;
        background:${isActive ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)'};
        border:2px solid ${isActive ? cfg.color : '#333'};
        transition: all 0.2s;
      ">
        <div style="text-align:center;margin-bottom:6px;">
          <span style="font-size:24px;">${cfg.icon}</span>
        </div>
        <div style="text-align:center;color:${cfg.color};font-size:14px;font-weight:bold;">${cfg.name}</div>
        <p style="text-align:center;color:#888;font-size:11px;margin-top:4px;">${cfg.description}</p>
        <div style="color:#666;font-size:10px;text-align:center;margin-top:6px;">
          敌HP×${cfg.enemyHpMult} ATK×${cfg.enemyAtkMult}<br>
          经验×${cfg.expMult} 金币×${cfg.goldMult}
        </div>
      </div>`;
  }
  html += '</div>';
  return html;
}
