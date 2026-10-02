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

  // Ch5: 张杰（引导者）— 死亡笔记世界
  zhangjie: [
    { hpThreshold: 1.0, name: '旁观者', atkMult: 0.8, defMult: 1.5,
      desc: '张杰以引导者身份试探你',
      specialMove: { name: '死亡笔记', dmgMult: 2.0, cooldown: 5, type: 'execute', executeThreshold: 0.15 } },
    { hpThreshold: 0.5, name: '死神之翼', atkMult: 1.2, defMult: 1.0,
      desc: '张杰展现真正力量，死亡笔记的威压',
      specialMove: { name: '命运宣告', dmgMult: 1.8, cooldown: 3, type: 'fate', ignoresDef: true } },
    { hpThreshold: 0.2, name: '死之手', atkMult: 1.6, defMult: 0.8,
      desc: '张杰全力出手，引导者的最终考验',
      specialMove: { name: '寿命剥夺', dmgMult: 3.0, cooldown: 2, type: 'reaper' } },
  ],

  // Ch6: 异形再临 — 进化皇后
  evolved_queen: [
    { hpThreshold: 1.0, name: '进化体', atkMult: 1.1, defMult: 1.3,
      desc: '完全进化的异形皇后，外甲更加坚硬',
      specialMove: { name: '强酸血喷', dmgMult: 1.6, cooldown: 3, type: 'acid_evolved', dot: 4 } },
    { hpThreshold: 0.6, name: '蜂巢意志', atkMult: 1.3, defMult: 1.1,
      desc: '连接巢穴意识，异形协同攻击',
      specialMove: { name: '集群撕裂', dmgMult: 1.4, cooldown: 2, type: 'swarm_evolved', hits: 4 } },
    { hpThreshold: 0.25, name: '母体核心', atkMult: 1.7, defMult: 0.7,
      desc: '暴露核心以换取毁灭性攻击力',
      specialMove: { name: '吞噬', dmgMult: 3.5, cooldown: 3, type: 'devour', healPct: 0.3 } },
  ],

  // Ch8: 重建中洲 — 远古巨龙
  ancient_dragon: [
    { hpThreshold: 1.0, name: '龙息', atkMult: 1.2, defMult: 1.0,
      desc: '巨龙以灼热龙息横扫',
      specialMove: { name: '烈焰吐息', dmgMult: 1.3, cooldown: 4, type: 'warcry', selfBuff: { atk: 0.2 } } },
    { hpThreshold: 0.5, name: '展翅高飞', atkMult: 1.4, defMult: 1.1,
      desc: '巨龙升空俯冲攻击',
      specialMove: { name: '俯冲轰炸', dmgMult: 2.0, cooldown: 3, type: 'cavalry', hits: 2 } },
    { hpThreshold: 0.2, name: '龙之怒', atkMult: 1.8, defMult: 0.6,
      desc: '巨龙坠落大地的最终狂暴',
      specialMove: { name: '毁灭吐息', dmgMult: 3.0, cooldown: 2, type: 'berserk' } },
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
    { hpThreshold: 1.0, name: '精神网络', atkMult: 0.9, defMult: 1.3,
      desc: '脑虫通过精神网络操控虫群',
      specialMove: { name: '精神侵蚀', dmgMult: 1.4, cooldown: 3, type: 'psychic', debuff: { stat: 'atk', value: -5 } } },
    { hpThreshold: 0.5, name: '虫巢觉醒', atkMult: 1.3, defMult: 1.0,
      desc: '脑虫激活全部虫群意识',
      specialMove: { name: '意识风暴', dmgMult: 2.0, cooldown: 4, type: 'psychic_storm', hits: 3 } },
    { hpThreshold: 0.2, name: '绝望尖啸', atkMult: 1.5, defMult: 0.7,
      desc: '脑虫陷入绝境，释放毁灭性精神冲击',
      specialMove: { name: '灭绝脉冲', dmgMult: 3.0, cooldown: 2, type: 'extinction_pulse' } },
  ],

  // Ch10: 天神队先锋
  divine_vanguard: [
    { hpThreshold: 1.0, name: '审判者', atkMult: 1.1, defMult: 1.2,
      desc: '天神队先锋以绝对实力碾压',
      specialMove: { name: '圣光斩', dmgMult: 1.5, cooldown: 3, type: 'holy' } },
    { hpThreshold: 0.5, name: '基因锁·四阶', atkMult: 1.5, defMult: 1.1,
      desc: '先锋开启基因锁四阶，力量暴增',
      specialMove: { name: '次元斩击', dmgMult: 2.5, cooldown: 4, type: 'dimension_slash' } },
    { hpThreshold: 0.2, name: '终极形态', atkMult: 2.0, defMult: 0.8,
      desc: '以燃烧生命为代价的最终攻击',
      specialMove: { name: '破灭之光', dmgMult: 4.0, cooldown: 3, type: 'annihilation' } },
  ],

  // Ch11: 弗莱迪
  freddy: [
    { hpThreshold: 1.0, name: '梦境主宰', atkMult: 1.0, defMult: 1.4,
      desc: '在梦境中弗莱迪几乎无敌',
      specialMove: { name: '噩梦利爪', dmgMult: 1.6, cooldown: 3, type: 'nightmare', debuff: { stat: 'spd', value: -4 } } },
    { hpThreshold: 0.5, name: '梦境坍塌', atkMult: 1.4, defMult: 1.0,
      desc: '梦境与现实的边界开始模糊',
      specialMove: { name: '梦境囚笼', dmgMult: 2.0, cooldown: 4, type: 'dream_cage', stunChance: 0.3 } },
    { hpThreshold: 0.2, name: '现实侵蚀', atkMult: 1.7, defMult: 0.7,
      desc: '弗莱迪将梦境的恐惧带入现实',
      specialMove: { name: '恐惧实体化', dmgMult: 3.0, cooldown: 2, type: 'fear_manifest' } },
  ],

  // Ch12: 复制体郑吒·终极
  clone_zhengzha_ultimate: [
    { hpThreshold: 1.0, name: '完美镜像', atkMult: 1.2, defMult: 1.2,
      desc: '终极复制体完美复制了你的一切能力',
      specialMove: { name: '镜像反转', dmgMult: 1.5, cooldown: 2, type: 'mirror_ultimate' } },
    { hpThreshold: 0.6, name: '基因锁·五阶', atkMult: 1.6, defMult: 1.0,
      desc: '复制体突破五阶基因锁，超越原体',
      specialMove: { name: '五阶·灭世', dmgMult: 2.5, cooldown: 4, type: 'gene5_annihilate' } },
    { hpThreshold: 0.3, name: '超越者', atkMult: 2.0, defMult: 1.0,
      desc: '复制体展现超越极限的力量',
      specialMove: { name: '命运终结', dmgMult: 3.5, cooldown: 3, type: 'destiny_end' } },
    { hpThreshold: 0.1, name: '最终决战', atkMult: 2.5, defMult: 0.5,
      desc: '与原体的共鸣引发毁灭性爆发',
      specialMove: { name: '双子灭世', dmgMult: 5.0, cooldown: 5, type: 'twin_apocalypse' } },
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
