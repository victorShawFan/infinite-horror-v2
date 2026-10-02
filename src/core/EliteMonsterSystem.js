// =================================================================
// 精英怪物系统 — 随机词缀强化怪物 + 丰厚奖励
// =================================================================
// 任何普通敌人都有概率升级为精英怪，获得1-3个随机词缀
// 精英怪拥有更高属性、特殊能力和更好的掉落

import { eventBus } from './EventBus.js';

// -- 精英词缀定义 --
export const ELITE_AFFIXES = {
  berserker: {
    name: '狂暴', icon: '\U0001f525', color: '#ff4444',
    desc: 'ATK+40%, 低血量时再+30%',
    apply: (e) => { e.atk = Math.ceil(e.atk * 1.4); },
    combatMod: (e, hp, maxHp) => {
      if (hp < maxHp * 0.3) return { atkMul: 1.3, desc: '狂暴觉醒！ATK暴增' };
      return null;
    },
  },
  venomous: {
    name: '剧毒', icon: '\u2620', color: '#88ff44',
    desc: '攻击附加毒素，每回合损失5%MaxHP',
    apply: (e) => { e.atk = Math.ceil(e.atk * 1.1); },
    onHitPlayer: (playerState, _round) => {
      const poisonDmg = Math.ceil(playerState.maxHp * 0.05);
      return { type: 'poison', damage: poisonDmg, text: '\u6bd2\u7d20\u4fb5\u8680 -' + poisonDmg + 'HP' };
    },
  },
  swift: {
    name: '迅捷', icon: '\u26a1', color: '#44ccff',
    desc: 'SPD+60%, 有15%概率连击',
    apply: (e) => { e.spd = Math.ceil(e.spd * 1.6); },
    doubleStrikeChance: 0.15,
  },
  vampiric: {
    name: '嗜血', icon: '\U0001fa78', color: '#cc44aa',
    desc: '每次攻击吸取20%伤害为HP',
    apply: (e) => { e.hp = Math.ceil(e.hp * 1.1); },
    lifestealRatio: 0.20,
  },
  ironhide: {
    name: '铁壁', icon: '\U0001f6e1', color: '#8888ff',
    desc: 'DEF+50%, 每3回合格挡一次攻击',
    apply: (e) => { e.def = Math.ceil(e.def * 1.5); },
    blockEveryN: 3,
  },
  regenerator: {
    name: '再生', icon: '\U0001f49a', color: '#44ff88',
    desc: '每回合恢复3%MaxHP',
    regenPercent: 0.03,
  },
  thorns: {
    name: '荆棘', icon: '\U0001f335', color: '#ff8844',
    desc: '被攻击时反弹15%伤害',
    thornPercent: 0.15,
  },
  shielded: {
    name: '护盾', icon: '\U0001f537', color: '#4488ff',
    desc: '战斗开始时拥有30%MaxHP的护盾',
    apply: (e) => { e._eliteShield = Math.ceil(e.hp * 0.3); },
  },
  commander: {
    name: '统领', icon: '\U0001f451', color: '#ffcc44',
    desc: 'ATK/DEF+20%, 击败后附近敌人弱化',
    apply: (e) => { e.atk = Math.ceil(e.atk * 1.2); e.def = Math.ceil(e.def * 1.2); },
    onDeathEffect: 'weaken_nearby',
  },
  mimic: {
    name: '拟态', icon: '\U0001f3ad', color: '#aa88ff',
    desc: '适应玩家攻击属性，抗性随战斗变化',
    adaptResist: true,
  },
  explosive: {
    name: '爆裂', icon: '\U0001f4a5', color: '#ff6600',
    desc: '死亡时爆炸，造成25%MaxHP伤害',
    onDeathDamagePercent: 0.25,
  },
  cursed: {
    name: '诅咒', icon: '\U0001f441', color: '#aa44cc',
    desc: '战斗后降低玩家ATK 10%(持续3场)',
    onDefeatDebuff: { stat: 'atk', percent: -0.10, duration: 3, name: '诅咒衰弱' },
  },
};

// -- 精英阶级 --
export const ELITE_TIERS = {
  rare:      { name: '稀有',   affixCount: 1, statMul: 1.3, rewardMul: 2.0, color: '#4488ff', icon: '\u25c6', chance: 0.15 },
  elite:     { name: '精英',   affixCount: 2, statMul: 1.6, rewardMul: 3.0, color: '#aa44ff', icon: '\u25c6\u25c6', chance: 0.08 },
  legendary: { name: '传说级', affixCount: 3, statMul: 2.0, rewardMul: 5.0, color: '#ff8800', icon: '\u2605', chance: 0.03 },
};

function getEliteChance(chapter, difficulty) {
  const diffMul = { easy: 0.6, normal: 1.0, hard: 1.3, nightmare: 1.8 }[difficulty] || 1.0;
  const chapterMul = 1 + (chapter - 1) * 0.05;
  return diffMul * chapterMul;
}

function pickAffixes(count, rng) {
  const allIds = Object.keys(ELITE_AFFIXES);
  const picked = [];
  const available = [...allIds];
  for (let i = 0; i < count && available.length > 0; i++) {
    const idx = Math.floor(rng() * available.length);
    picked.push(available.splice(idx, 1)[0]);
  }
  return picked;
}

export function tryUpgradeToElite(enemy, chapter = 1, difficulty = 'normal', rng = Math.random) {
  if (enemy.isBoss || enemy.boss || enemy.isMiniBoss) return enemy;
  if (enemy._eliteTier) return enemy;
  const chanceMul = getEliteChance(chapter, difficulty);
  for (const [tierId, tier] of [['legendary', ELITE_TIERS.legendary], ['elite', ELITE_TIERS.elite], ['rare', ELITE_TIERS.rare]]) {
    if (rng() < tier.chance * chanceMul) {
      return upgradeEnemy(enemy, tierId, tier, rng);
    }
  }
  return enemy;
}

export function forceUpgradeToElite(enemy, tierId = 'rare', rng = Math.random) {
  if (enemy._eliteTier) return enemy;
  const tier = ELITE_TIERS[tierId];
  if (!tier) return enemy;
  return upgradeEnemy(enemy, tierId, tier, rng);
}

function upgradeEnemy(enemy, tierId, tier, rng) {
  const upgraded = { ...enemy };
  upgraded.hp = Math.ceil(upgraded.hp * tier.statMul);
  upgraded.atk = Math.ceil(upgraded.atk * tier.statMul);
  upgraded.def = Math.ceil(upgraded.def * tier.statMul);
  upgraded.spd = Math.ceil((upgraded.spd || 5) * (1 + (tier.statMul - 1) * 0.5));
  if (upgraded.rewards) {
    upgraded.rewards = {
      ...upgraded.rewards,
      exp: Math.ceil((upgraded.rewards.exp || 0) * tier.rewardMul),
      gold: Math.ceil((upgraded.rewards.gold || 0) * tier.rewardMul),
    };
  }
  const affixIds = pickAffixes(tier.affixCount, rng);
  const affixes = affixIds.map(id => ({ id, ...ELITE_AFFIXES[id] }));
  for (const affix of affixes) {
    if (affix.apply) affix.apply(upgraded);
  }
  upgraded._eliteTier = tierId;
  upgraded._eliteTierData = tier;
  upgraded._eliteAffixes = affixes;
  upgraded._eliteAffixIds = affixIds;
  upgraded.name = tier.icon + ' ' + upgraded.name;
  upgraded.color = tier.color;
  upgraded._originalName = enemy.name;
  upgraded.geneLockCharge = Math.ceil((upgraded.geneLockCharge || 5) * 1.5);
  eventBus.emit('elite:spawned', { enemy: upgraded, tier: tierId, affixes: affixIds });
  return upgraded;
}

export function getEliteDescription(enemy) {
  if (!enemy._eliteTier) return '';
  const tier = enemy._eliteTierData;
  const affixes = enemy._eliteAffixes || [];
  return '\u3010' + tier.name + '\u3011' + affixes.map(a => a.icon + a.name).join(' ');
}

export function getEliteCombatEffects(enemy) {
  if (!enemy._eliteTier) return null;
  const affixes = enemy._eliteAffixes || [];
  return {
    doubleStrikeChance: affixes.reduce((sum, a) => sum + (a.doubleStrikeChance || 0), 0),
    lifestealRatio: affixes.reduce((sum, a) => sum + (a.lifestealRatio || 0), 0),
    thornPercent: affixes.reduce((sum, a) => sum + (a.thornPercent || 0), 0),
    regenPercent: affixes.reduce((sum, a) => sum + (a.regenPercent || 0), 0),
    blockEveryN: affixes.find(a => a.blockEveryN)?.blockEveryN || 0,
    shieldHp: enemy._eliteShield || 0,
    onDeathDamagePercent: affixes.reduce((sum, a) => sum + (a.onDeathDamagePercent || 0), 0),
    onDeathEffect: affixes.find(a => a.onDeathEffect)?.onDeathEffect || null,
    onDefeatDebuff: affixes.find(a => a.onDefeatDebuff)?.onDefeatDebuff || null,
    onHitPlayer: affixes.filter(a => a.onHitPlayer).map(a => a.onHitPlayer),
    combatMods: affixes.filter(a => a.combatMod).map(a => a.combatMod),
    adaptResist: affixes.some(a => a.adaptResist),
    hasAffix: (id) => (enemy._eliteAffixIds || []).includes(id),
  };
}

export function formatEliteTooltip(enemy) {
  if (!enemy._eliteTier) return '';
  const tier = enemy._eliteTierData;
  const affixes = enemy._eliteAffixes || [];
  const rgb = tier.color === '#4488ff' ? '68,136,255' : tier.color === '#aa44ff' ? '170,68,255' : '255,136,0';
  let html = '<div style="margin-top:6px; padding:6px 8px; background:rgba(' + rgb + ',0.1); border:1px solid ' + tier.color + '40; border-radius:4px;">';
  html += '<span style="color:' + tier.color + '; font-size:11px; font-weight:bold;">' + tier.icon + ' ' + tier.name + '\u602a\u7269</span>';
  html += '<div style="margin-top:4px;">';
  for (const a of affixes) {
    html += '<span style="color:' + a.color + '; font-size:10px; display:inline-block; margin:1px 4px 1px 0; padding:1px 4px; border:1px solid ' + a.color + '30; border-radius:3px;">' + a.icon + ' ' + a.name + '</span>';
  }
  html += '</div>';
  html += '<p style="color:#999; font-size:9px; margin-top:3px;">' + affixes.map(a => a.desc).join(' \u00b7 ') + '</p>';
  html += '<p style="color:#ffcc44; font-size:9px; margin-top:2px;">\u5956\u52b1 \u00d7' + tier.rewardMul + '</p>';
  html += '</div>';
  return html;
}

let _eliteKills = { rare: 0, elite: 0, legendary: 0 };

export function recordEliteKill(tierId) {
  if (_eliteKills[tierId] !== undefined) _eliteKills[tierId]++;
  eventBus.emit('elite:killed', { tier: tierId });
}

export function getEliteStats() { return { ..._eliteKills }; }
export function resetEliteStats() { _eliteKills = { rare: 0, elite: 0, legendary: 0 }; }
export function serializeEliteStats() { return { ..._eliteKills }; }
export function deserializeEliteStats(data) {
  if (data) _eliteKills = { rare: data.rare || 0, elite: data.elite || 0, legendary: data.legendary || 0 };
}
