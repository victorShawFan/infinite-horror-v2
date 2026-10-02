// ═══════════════════════════════════════════════════════════════
// 敌人能力系统 — Boss 相位机制 + 精英特殊技
// ═══════════════════════════════════════════════════════════════
//
// 普通敌人可拥有被动特性（如：反伤、自愈、护盾、群体）
// Boss 拥有多相位（Phase），每个相位切换时触发不同行为
// 精英敌人有 1-2 个随机词缀（如：迅捷、坚韧、狂暴）

import { eventBus } from './EventBus.js';

// ── 敌人被动特性 ──
export const ENEMY_TRAITS = {
  thorns:    { id: 'thorns',    name: '荆棘',   desc: '受击时反弹 15% 伤害', reflectPct: 0.15 },
  regen:     { id: 'regen',     name: '再生',   desc: '每回合恢复 5% MaxHP', healPct: 0.05 },
  shield:    { id: 'shield',    name: '护盾',   desc: '前2回合减伤 50%', shieldRounds: 2, shieldReduce: 0.50 },
  enrage:    { id: 'enrage',    name: '狂怒',   desc: 'HP<50%时ATK +40%', threshold: 0.50, atkBonus: 0.40 },
  swift:     { id: 'swift',     name: '迅捷',   desc: '20%概率先手攻击两次', doubleChance: 0.20 },
  undying:   { id: 'undying',   name: '不死',   desc: '首次致死时恢复至 20% HP', revivePercent: 0.20 },
  poisonous: { id: 'poisonous', name: '剧毒',   desc: '攻击附加每回合 3%HP 毒伤', poisonPct: 0.03 },
  armored:   { id: 'armored',   name: '重甲',   desc: 'DEF +30%', defBonus: 0.30 },
  evasive:   { id: 'evasive',   name: '幻影',   desc: '15%概率闪避攻击', dodgeChance: 0.15 },
  vampiric:  { id: 'vampiric',  name: '吸血',   desc: '攻击恢复造成伤害的 20%', stealPct: 0.20 },
};

// ── Boss 相位定义 ──
export const BOSS_PHASES = {
  // Ch1: 暴君 T-002
  tyrant_t002: [
    { hpThreshold: 1.0, name: '威压', atkMult: 1.0, defMult: 1.0, 
      desc: '暴君以碾压般的力量进攻', specialMove: null },
    { hpThreshold: 0.5, name: '突变', atkMult: 1.3, defMult: 0.8,
      desc: '暴君身体开始异变，攻击力暴增但防御下降',
      specialMove: { name: '变异冲锋', dmgMult: 2.0, cooldown: 3, type: 'charge' } },
    { hpThreshold: 0.2, name: '暴走', atkMult: 1.6, defMult: 0.6,
      desc: '暴君完全失控，每回合双倍攻击',
      specialMove: { name: '致命撕裂', dmgMult: 2.5, cooldown: 2, type: 'frenzy' } },
  ],

  // Ch2: 异形皇后
  alien_queen: [
    { hpThreshold: 1.0, name: '巢母', atkMult: 1.0, defMult: 1.2,
      desc: '异形皇后以厚重外甲防御',
      specialMove: { name: '酸液喷射', dmgMult: 1.5, cooldown: 4, type: 'acid', dot: 3 } },
    { hpThreshold: 0.6, name: '召唤', atkMult: 1.1, defMult: 1.0,
      desc: '皇后召唤幼虫分散注意',
      specialMove: { name: '虫群涌动', dmgMult: 1.2, cooldown: 2, type: 'swarm', hits: 3 } },
    { hpThreshold: 0.25, name: '濒死暴怒', atkMult: 1.5, defMult: 0.7,
      desc: '异形皇后陷入疯狂',
      specialMove: { name: '穿刺尾刃', dmgMult: 3.0, cooldown: 3, type: 'pierce' } },
  ],

  // Ch3: 伽椰子
  kayako: [
    { hpThreshold: 1.0, name: '诅咒扩散', atkMult: 0.8, defMult: 1.5,
      desc: '伽椰子以精神攻击侵蚀',
      specialMove: { name: '怨念侵蚀', dmgMult: 1.0, cooldown: 2, type: 'psychic', debuff: { stat: 'def', value: -3 } } },
    { hpThreshold: 0.5, name: '怨灵实体化', atkMult: 1.3, defMult: 1.0,
      desc: '诅咒凝聚成实体',
      specialMove: { name: '死亡凝视', dmgMult: 2.0, cooldown: 4, type: 'instant_kill', threshold: 0.15 } },
  ],

  // Ch4: 伊莫顿
  imhotep: [
    { hpThreshold: 1.0, name: '沙漠风暴', atkMult: 1.0, defMult: 1.0,
      desc: '伊莫顿操控沙暴',
      specialMove: { name: '沙暴', dmgMult: 1.3, cooldown: 3, type: 'aoe' } },
    { hpThreshold: 0.6, name: '复活仪式', atkMult: 1.2, defMult: 1.2,
      desc: '伊莫顿开始自我恢复',
      specialMove: { name: '生命汲取', dmgMult: 1.5, cooldown: 3, type: 'drain', healPct: 0.5 } },
    { hpThreshold: 0.3, name: '法老之怒', atkMult: 1.5, defMult: 0.9,
      desc: '古埃及诅咒全面爆发',
      specialMove: { name: '瘟疫之触', dmgMult: 2.5, cooldown: 2, type: 'plague', dot: 5 } },
  ],

  // Ch7: 复制体郑吒
  clone_zhengzha: [
    { hpThreshold: 1.0, name: '镜像', atkMult: 1.0, defMult: 1.0,
      desc: '复制体模仿你的一切',
      specialMove: { name: '复制打击', dmgMult: 1.0, cooldown: 0, type: 'mirror' } },
    { hpThreshold: 0.5, name: '超越', atkMult: 1.3, defMult: 1.1,
      desc: '复制体开始超越原体',
      specialMove: { name: '基因锁·伪', dmgMult: 2.0, cooldown: 4, type: 'gene_fake' } },
    { hpThreshold: 0.2, name: '终极形态', atkMult: 1.6, defMult: 1.2,
      desc: '复制体展现真正力量',
      specialMove: { name: '灭世之光', dmgMult: 3.0, cooldown: 5, type: 'ultimate' } },
  ],

  // Ch9: 脑虫
  brain_bug: [
    { hpThreshold: 1.0, name: '心灵屏障', atkMult: 0.7, defMult: 2.0,
      desc: '脑虫用念力护盾保护自己',
      specialMove: { name: '精神控制', dmgMult: 0.5, cooldown: 3, type: 'confuse', skipTurn: true } },
    { hpThreshold: 0.4, name: '绝望呼唤', atkMult: 1.5, defMult: 1.0,
      desc: '脑虫放弃防御全力攻击',
      specialMove: { name: '脑波摧毁', dmgMult: 2.5, cooldown: 2, type: 'psychic_blast' } },
  ],

  // Ch10: 天神队先锋
  divine_vanguard: [
    { hpThreshold: 1.0, name: '天神之威', atkMult: 1.2, defMult: 1.2,
      desc: '天神队先锋展现绝对实力',
      specialMove: { name: '神力打击', dmgMult: 1.8, cooldown: 3, type: 'divine' } },
    { hpThreshold: 0.6, name: '基因锁开放', atkMult: 1.5, defMult: 1.0,
      desc: '先锋开放基因锁',
      specialMove: { name: '四阶之力', dmgMult: 2.5, cooldown: 4, type: 'gene_lock_4' } },
    { hpThreshold: 0.25, name: '殊死一搏', atkMult: 2.0, defMult: 0.8,
      desc: '先锋燃烧生命力量',
      specialMove: { name: '天罚', dmgMult: 3.5, cooldown: 3, type: 'judgment', selfDmg: 0.1 } },
  ],

  // Ch11: 弗莱迪
  freddy: [
    { hpThreshold: 1.0, name: '梦境操控', atkMult: 1.0, defMult: 1.0,
      desc: '在梦境中弗莱迪几乎无敌',
      specialMove: { name: '噩梦利爪', dmgMult: 1.5, cooldown: 2, type: 'nightmare' } },
    { hpThreshold: 0.5, name: '现实入侵', atkMult: 1.3, defMult: 1.3,
      desc: '弗莱迪将梦境侵入现实',
      specialMove: { name: '梦魇领域', dmgMult: 2.0, cooldown: 3, type: 'domain', debuff: { stat: 'atk', value: -5 } } },
  ],

  // Ch12: 复制体郑吒·终极
  clone_zhengzha_ultimate: [
    { hpThreshold: 1.0, name: '完美镜像', atkMult: 1.2, defMult: 1.2,
      desc: '终极复制体完美复刻一切',
      specialMove: { name: '全属性复制', dmgMult: 1.5, cooldown: 3, type: 'perfect_copy' } },
    { hpThreshold: 0.7, name: '融合', atkMult: 1.4, defMult: 1.4,
      desc: '融合多条血统之力',
      specialMove: { name: '血统融合', dmgMult: 2.0, cooldown: 4, type: 'bloodline_fusion', heal: 0.1 } },
    { hpThreshold: 0.4, name: '第四阶开放', atkMult: 1.8, defMult: 1.0,
      desc: '复制体突破至第四阶基因锁',
      specialMove: { name: '心灵之光·伪', dmgMult: 3.0, cooldown: 3, type: 'fake_enlightenment' } },
    { hpThreshold: 0.15, name: '最终决战', atkMult: 2.2, defMult: 0.8,
      desc: '燃烧一切的最终搏杀',
      specialMove: { name: '灭世真言', dmgMult: 4.0, cooldown: 5, type: 'extinction', selfDmg: 0.15 } },
  ],
};

// ── 精英词缀（随机附加到精英敌人） ──
export const ELITE_AFFIXES = [
  { id: 'berserker', name: '狂战士', desc: 'ATK+25%', atkMult: 1.25 },
  { id: 'ironclad',  name: '铁甲',   desc: 'DEF+30%', defMult: 1.30 },
  { id: 'speedy',    name: '疾风',   desc: 'SPD+50%', spdMult: 1.50 },
  { id: 'juggernaut',name: '主宰',   desc: 'HP+50%', hpMult: 1.50 },
  { id: 'venomous',  name: '淬毒',   desc: '攻击附加中毒', trait: 'poisonous' },
  { id: 'reflective',name: '反射',   desc: '受击反弹伤害', trait: 'thorns' },
  { id: 'draining',  name: '汲取',   desc: '攻击吸血', trait: 'vampiric' },
  { id: 'ghostly',   name: '虚体',   desc: '15%闪避', trait: 'evasive' },
];

// ── 根据Boss ID获取相位配置 ──
export function getBossPhases(bossId) {
  return BOSS_PHASES[bossId] || null;
}

// ── 获取当前相位 ──
export function getCurrentPhase(phases, currentHp, maxHp) {
  const ratio = currentHp / maxHp;
  // 从后往前找第一个满足阈值的相位
  for (let i = phases.length - 1; i >= 0; i--) {
    if (ratio <= phases[i].hpThreshold) return { phase: phases[i], index: i };
  }
  return { phase: phases[0], index: 0 };
}

// ── 应用相位的属性修正 ──
export function applyPhaseModifiers(baseStats, phase) {
  return {
    ...baseStats,
    atk: Math.floor(baseStats.atk * (phase.atkMult || 1)),
    def: Math.floor(baseStats.def * (phase.defMult || 1)),
  };
}

// ── Boss特殊技能使用判定 ──
export function shouldUseBossSpecial(phase, roundNum, lastUsedRound) {
  const special = phase.specialMove;
  if (!special) return false;
  if (lastUsedRound > 0 && (roundNum - lastUsedRound) < special.cooldown) return false;
  return true;
}

// ── 计算Boss特殊技能伤害 ──
export function calcBossSpecialDamage(bossAtk, special) {
  const baseDmg = Math.floor(bossAtk * special.dmgMult);
  const result = { damage: baseDmg, name: special.name, type: special.type };
  
  // 多段攻击
  if (special.hits) result.hits = special.hits;
  // 持续伤害
  if (special.dot) result.dot = special.dot;
  // Debuff
  if (special.debuff) result.debuff = { ...special.debuff };
  // 吸血
  if (special.healPct) result.healAmount = Math.floor(baseDmg * special.healPct);
  // 即死判定
  if (special.threshold) result.instantKillThreshold = special.threshold;
  // 跳过回合
  if (special.skipTurn) result.skipTurn = true;
  // 自伤
  if (special.selfDmg) result.selfDmg = special.selfDmg;
  
  return result;
}

// ── 处理敌人特性效果（回合内调用） ──
export function processEnemyTraits(enemy, enemyHp, maxHp, round, context) {
  const effects = { reflectDmg: 0, healAmount: 0, shieldActive: false, 
                    poisonDmg: 0, dodged: false, doubleAttack: false,
                    revived: false, log: [] };
  
  for (const traitId of enemy.traits || []) {
    const trait = ENEMY_TRAITS[traitId];
    if (!trait) continue;
    
    if (trait.reflectPct) {
      effects.reflectDmg = trait.reflectPct;
    }
    if (trait.healPct && enemyHp > 0) {
      const heal = Math.floor(maxHp * trait.healPct);
      effects.healAmount += heal;
      effects.log.push({ text: `🔄 ${enemy.name}恢复了 ${heal} HP`, type: 'enemy_heal' });
    }
    if (trait.shieldRounds && round <= trait.shieldRounds) {
      effects.shieldActive = true;
      effects.shieldReduce = trait.shieldReduce;
      effects.log.push({ text: `🛡 护盾减伤 ${Math.floor(trait.shieldReduce * 100)}%`, type: 'enemy_shield' });
    }
    if (trait.atkBonus && enemyHp / maxHp < trait.threshold) {
      effects.enraged = true;
      effects.enrageBonus = trait.atkBonus;
      if (round === Math.ceil(maxHp * trait.threshold / (context?.playerDmg || 10))) {
        effects.log.push({ text: `🔥 ${enemy.name}陷入狂怒！ATK +${Math.floor(trait.atkBonus * 100)}%`, type: 'enemy_enrage' });
      }
    }
    if (trait.doubleChance && Math.random() < trait.doubleChance) {
      effects.doubleAttack = true;
    }
    if (trait.poisonPct) {
      effects.poisonDmg = Math.max(1, Math.floor(context?.playerMaxHp * trait.poisonPct) || 3);
    }
    if (trait.dodgeChance && Math.random() < trait.dodgeChance) {
      effects.dodged = true;
      effects.log.push({ text: `👻 ${enemy.name}闪避了攻击！`, type: 'enemy_dodge' });
    }
    if (trait.stealPct) {
      effects.vampiric = trait.stealPct;
    }
    if (trait.defBonus) {
      effects.defBonus = (effects.defBonus || 0) + trait.defBonus;
    }
    if (trait.revivePercent && enemyHp <= 0 && !enemy._revived) {
      effects.revived = true;
      effects.reviveHp = Math.floor(maxHp * trait.revivePercent);
      effects.log.push({ text: `💀 ${enemy.name}从死亡中复活！`, type: 'enemy_revive' });
    }
  }
  
  return effects;
}

// ── 为精英敌人随机分配词缀 ──
export function rollEliteAffixes(count = 1) {
  const pool = [...ELITE_AFFIXES];
  const result = [];
  for (let i = 0; i < Math.min(count, pool.length); i++) {
    const idx = Math.floor(Math.random() * pool.length);
    result.push(pool.splice(idx, 1)[0]);
  }
  return result;
}

// ── 应用精英词缀到敌人数据 ──
export function applyEliteAffixes(enemy, affixes) {
  const enhanced = { ...enemy, traits: [...(enemy.traits || [])], eliteAffixes: [] };
  for (const affix of affixes) {
    enhanced.eliteAffixes.push(affix);
    if (affix.atkMult) enhanced.atk = Math.floor(enhanced.atk * affix.atkMult);
    if (affix.defMult) enhanced.def = Math.floor(enhanced.def * affix.defMult);
    if (affix.spdMult) enhanced.spd = Math.floor((enhanced.spd || 5) * affix.spdMult);
    if (affix.hpMult)  enhanced.hp  = Math.floor(enhanced.hp * affix.hpMult);
    if (affix.trait && !enhanced.traits.includes(affix.trait)) {
      enhanced.traits.push(affix.trait);
    }
    enhanced.name = `${affix.name}·${enhanced.name}`;
  }
  // 精英额外奖励
  if (enhanced.rewards) {
    enhanced.rewards = { ...enhanced.rewards };
    if (enhanced.rewards.exp) enhanced.rewards.exp = Math.floor(enhanced.rewards.exp * 1.5);
    if (enhanced.rewards.gold) enhanced.rewards.gold = Math.floor(enhanced.rewards.gold * 1.5);
    if (enhanced.rewards.rewardPoints) enhanced.rewards.rewardPoints = Math.floor(enhanced.rewards.rewardPoints * 1.3);
  }
  return enhanced;
}
