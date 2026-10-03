import { getActiveMutators } from './NewGamePlus.js';
import { getOrderCombatEffect, tickOrderCooldown } from './TacticalOrders.js';
import { getEffectModifiers, addEffect as addStatusEffect } from './StatusEffectTracker.js';
// ═══════════════════════════════════════════════════════════════
// 战斗系统 — 魔塔式数值对撞 + 血统特技 + 芯片元素 + 速度双击
//            + 主动技能 + 状态效果 + 基因锁进阶
// ═══════════════════════════════════════════════════════════════

import { DAMAGE_TYPE, GENE_LOCK, BLOODLINE } from './constants.js';
import { eventBus } from './EventBus.js';
import { gameState } from './GameState.js';
import { checkGeneLockAdvancement, advanceGeneLock } from './GeneLockSystem.js';
import {
  getAvailableSkills, canUseSkill, useSkill, STATUS_EFFECT,
  processStatusEffects, applyStatusEffect, tickCooldowns
} from './SkillSystem.js';
import { getTalentEffects } from './TalentTree.js';
import { getEquipmentTotalStats, getActiveSetBonuses } from './EquipmentSystem.js';
import {
  getBossPhases, getCurrentPhase, applyPhaseModifiers,
  shouldUseBossSpecial, calcBossSpecialDamage, processEnemyTraits
} from './EnemyAbilitySystem.js';
import { calcElementalModifier, getPlayerActiveElements, getEnemyElement, checkElementalResonance, ELEMENT_INFO } from './ElementalSystem.js';
import { generateLoot, formatLootLog, applyLoot } from './LootSystem.js';
import { applyStanceModifiers, getCurrentStance } from './CombatStance.js';
import { killStreak } from './KillStreak.js';
import { getAllAffixEffects } from './EquipmentAffixes.js';
import { getCompanionCombatBonus } from './RelationshipSystem.js';
import { getEliteCombatEffects, recordEliteKill } from './EliteMonsterSystem.js';
import { generateCombatDialogue, getVictoryComment } from './CompanionDialogue.js';
import { COMPANION_PROFILES } from './RelationshipSystem.js';
import { processEnvironmentEffect } from './BattleEnvironment.js';
import { getBossIntro, getBossPhaseDialogue, getBossLowHpLine, getBossDefeatLines, getBossKillPlayerLine, getBossPlayerLowHpLine } from './BossDialogue.js';
import { getEnchantCombatBonus } from './EnchantSystem.js';
import { initCombatAbilities, getAvailableAbilities, useCompanionAbility, tickAbilityCooldowns } from './CompanionAbilities.js';
import { initComboState, recordCrit, recordElementalHit, recordWeaknessHit, recordCompanionAction, recordBlock, getComboBonus, formatComboLog } from './ComboSystem.js';
import { getKarmaCombatModifiers, getKarmaLevel } from './KarmaSystem.js';
import { shouldPauseForAction, showBattleActionMenu, applyDefendAction, attemptFlee, ACTION_TYPE } from './BattleActionMenu.js';
import { getRelicCombatEffects, hasRelic } from './RelicSystem.js';
import { getPerkCombatEffects } from './PerkSystem.js';
import { getEnemyIntent } from './EnemyIntentSystem.js';
import { random as seededRandom, chance as seededChance } from './RandomSystem.js';

// ── 伤害计算 ──
export function calcDamage(attacker, defender, damageType = DAMAGE_TYPE.PHYSICAL, minDmg = 1) {
  let baseDmg = Math.max(minDmg, attacker.atk - defender.def);
  // 伤害浮动 ±15%，增加战斗不确定性
  const variance = 0.85 + seededRandom() * 0.30;
  baseDmg = Math.max(minDmg, Math.floor(baseDmg * variance));

  const isWeak = defender.weaknesses?.includes(damageType) || false;
  if (isWeak) baseDmg = Math.floor(baseDmg * 1.5);

  // 元素相克
  const elemMod = calcElementalModifier(damageType, defender.damageType || defender.element);
  if (elemMod.multiplier !== 1.0) {
    baseDmg = Math.max(minDmg, Math.floor(baseDmg * elemMod.multiplier));
  }

  // 灵体物理减伤
  if (defender.physicalResist && damageType === DAMAGE_TYPE.PHYSICAL) {
    baseDmg = Math.max(minDmg, Math.floor(baseDmg * (1 - defender.physicalResist)));
  }

  const critRoll = seededRandom() * 100;
  const isCrit = critRoll < (attacker.crt || 0);
  if (isCrit) baseDmg = Math.floor(baseDmg * 1.8);

  if (defender.res && damageType !== DAMAGE_TYPE.PHYSICAL) {
    baseDmg = Math.max(1, Math.floor(baseDmg * (100 - defender.res) / 100));
  }

  const elemAdvantage = elemMod.multiplier > 1.0;
  return { damage: Math.max(minDmg, baseDmg), isCrit, isWeak, elemAdvantage };
}

// ── 法术伤害（道法血统, 忽视物防, 走法抗） ──
function calcSpellDamage(caster, target) {
  const spellPower = Math.floor(caster.atk * 0.8) + 5;
  const magicDef = target.res || 0;
  let dmg = Math.max(1, spellPower - Math.floor(magicDef * 0.3));
  const isCrit = seededRandom() * 100 < (caster.crt || 0);
  if (isCrit) dmg = Math.floor(dmg * 1.6);
  return { damage: dmg, isCrit, isSpell: true };
}

// ── 芯片元素效果 ──
function getChipEffects(player) {
  const effects = { burnDmg: 0, slowPct: 0, hasFireChip: false, hasIceChip: false };
  for (const chip of player.chips || []) {
    if (chip.damageType === 'fire' || chip.id === 'fire') {
      effects.burnDmg += 2 + Math.floor(player.atk * 0.05);
      effects.hasFireChip = true;
    }
    if (chip.damageType === 'ice' || chip.id === 'ice') {
      effects.slowPct += 10;
      effects.hasIceChip = true;
    }
  }
  return effects;
}

// ── SPD双击判定 ──
function canDoubleAttack(playerSpd, enemySpd) {
  return playerSpd >= (enemySpd || 5) * 2;
}

// ── 战斗预判（保持原有接口兼容） ──
export function previewBattle(player, enemy) {
  // 应用战斗姿态修正（与executeBattle保持一致）
  const _rawAtk = getEffectiveAtk(player);
  const _rawDef = getEffectiveDef(player);
  const _rawSpd = getEffectiveSpd(player);
  const _rawCrt = getEffectiveCrt(player);
  const stanceMod = applyStanceModifiers(_rawAtk, _rawDef, _rawCrt, _rawSpd);
  const pAtk = stanceMod.atk;
  const pDef = stanceMod.def;
  const pSpd = stanceMod.spd;
  const pCrt = stanceMod.crt;
  const chipFx = getChipEffects(player);

  const isDaoist = player.activeBloodline === BLOODLINE.DAOIST;
  const hasMana = player.mana > 0 && player.maxMana > 0;
  const spellCost = 8;

  const enemyEffAtk = chipFx.hasIceChip
    ? Math.floor(enemy.atk * (1 - chipFx.slowPct / 100))
    : enemy.atk;

  let playerDmg = Math.max(1, pAtk - enemy.def);
  const weaponDmgType = player.weapon?.damageType || 'physical';
  if (enemy.physicalResist && weaponDmgType === 'physical') {
    playerDmg = Math.max(1, Math.floor(playerDmg * (1 - enemy.physicalResist)));
  }
  const enemyDmg = Math.max(0, enemyEffAtk - pDef);
  const isDouble = canDoubleAttack(pSpd, enemy.spd || 5);

  // 计算技能加成估算
  const skills = getAvailableSkills(player);
  const hasSkills = skills.length > 0;

  if (playerDmg <= 0 && !(isDaoist && hasMana) && !hasSkills) {
    return { canWin: false, totalDamage: Infinity, turnsNeeded: Infinity, rewards: enemy.rewards };
  }

  let spellDmgEst = 0;
  if (isDaoist && hasMana) {
    spellDmgEst = Math.max(1, Math.floor(pAtk * 0.8) + 5 - Math.floor((enemy.res || 0) * 0.3));
  }
  let reflectDmg = 0;
  if (player.activeBloodline === BLOODLINE.MARTIAL && enemyDmg > 0) {
    reflectDmg = Math.max(1, Math.floor(enemyDmg * 0.15));
  }
  let lifeStealPerHit = 0;
  if (player.activeBloodline === BLOODLINE.VAMPIRE) {
    lifeStealPerHit = Math.max(1, Math.floor(playerDmg * 0.1));
  }

  // 逐回合确定性模拟
  let simEnemyHp = enemy.hp;
  let simMana = player.mana || 0;
  let turnsNeeded = 0;
  let totalPlayerDmgTaken = 0;
  let totalLifeSteal = 0;
  const maxTurns = 200;

  while (simEnemyHp > 0 && turnsNeeded < maxTurns) {
    turnsNeeded++;
    const hits = isDouble ? 2 : 1;
    for (let i = 0; i < hits && simEnemyHp > 0; i++) {
      simEnemyHp -= playerDmg;
      if (lifeStealPerHit > 0) totalLifeSteal += lifeStealPerHit;
    }
    if (isDaoist && simMana >= spellCost && simEnemyHp > 0) {
      simEnemyHp -= spellDmgEst;
      simMana -= spellCost;
    }
    if (chipFx.burnDmg > 0 && simEnemyHp > 0) simEnemyHp -= chipFx.burnDmg;
    if (reflectDmg > 0 && simEnemyHp > 0) simEnemyHp -= reflectDmg;
    if (simEnemyHp > 0) totalPlayerDmgTaken += enemyDmg;
  }

  let effectiveDmgPerRound = playerDmg * (isDouble ? 2 : 1) + chipFx.burnDmg + reflectDmg;
  if (isDaoist && hasMana) effectiveDmgPerRound += spellDmgEst;

  const totalDamage = Math.max(0, totalPlayerDmgTaken - totalLifeSteal);

  let acidDmg = enemy.acidBlood || 0;
  if (acidDmg > 0 && (player.chips || []).some(c => c.special === 'acid_resist')) {
    acidDmg = Math.floor(acidDmg * 0.5);
  }
  const totalWithAcid = totalDamage + acidDmg;

  // ── 调整预判：Boss相位+敌人特性增加实际伤害 ──
  let adjustedDmg = totalWithAcid;
  const traits = enemy.traits || [];
  
  if (enemy.bossId) adjustedDmg = Math.floor(adjustedDmg * 1.5);
  if (traits.includes('thorns')) adjustedDmg = Math.floor(adjustedDmg * 1.15);
  if (traits.includes('regen')) adjustedDmg = Math.floor(adjustedDmg * 1.20);
  if (traits.includes('undying')) adjustedDmg = Math.floor(adjustedDmg * 1.25);
  if (traits.includes('swift')) adjustedDmg = Math.floor(adjustedDmg * 1.10);
  if (traits.includes('enrage')) adjustedDmg = Math.floor(adjustedDmg * 1.20);
  if (traits.includes('poisonous')) adjustedDmg = Math.floor(adjustedDmg * 1.10);
  if (traits.includes('shield')) adjustedDmg = Math.floor(adjustedDmg * 1.10);

  // 精英词缀预判调整
  const affix = enemy.affix || null;
  const elitePrev = getEliteCombatEffects(enemy);
  if (affix) {
    // 暗影闪避：部分攻击会miss，实际击杀更慢
    if (affix.dodgeChance) {
      const effectiveHits = 1 - affix.dodgeChance;
      adjustedDmg = Math.floor(adjustedDmg / effectiveHits); // 更多回合 = 更多受伤
    }
    // 敌方吸血：敌人回血延长战斗
    if (affix.lifeSteal) {
      adjustedDmg = Math.floor(adjustedDmg * (1 + affix.lifeSteal * 0.5));
    }
    // 剧毒：每回合毒伤
    if (affix.poisonDmg) {
      const toxicPerRound = Math.max(1, Math.floor(player.maxHp * affix.poisonDmg));
      adjustedDmg += toxicPerRound * turnsNeeded;
    }
    // 荆棘反伤
    if (affix.reflectPct) {
      adjustedDmg += Math.floor(enemy.hp * affix.reflectPct * 0.3);
    }
  }

  // 预判标签
  const warnings = [];
  if (enemy.bossId) warnings.push('Boss多相位');
  if (affix) warnings.push(affix.icon + affix.name);
  for (const t of traits) {
    const names = { thorns:'荆棘', regen:'再生', undying:'不死', swift:'迅捷', 
                    enrage:'狂怒', evasive:'闪避', shield:'护盾', poisonous:'剧毒',
                    armored:'重甲', vampiric:'吸血' };
    if (names[t]) warnings.push(names[t]);
  }

  return {
    canWin: player.hp > adjustedDmg,
    totalDamage: adjustedDmg,
    turnsNeeded,
    playerDmgPerHit: playerDmg,
    enemyDmgPerHit: enemyDmg,
    rewards: enemy.rewards || {},
    hpAfter: player.hp - adjustedDmg,
    acidDmg,
    isDouble,
    burnDmg: chipFx.burnDmg,
    reflectDmg,
    lifeStealPerHit,
    spellDmgEst,
    isDaoist: isDaoist && hasMana,
    hasIceChip: chipFx.hasIceChip,
    effectiveDmgPerRound,
    hasSkills,
    availableSkills: skills.map(s => s.name),
    warnings,
    originalDamage: totalWithAcid,
  };
}

// ── 技能AI：选择最佳技能使用 ──
function pickBestSkill(player, enemy, combatState, enemyHp, playerHp) {
  const skills = getAvailableSkills(player);
  if (skills.length === 0) return null;

  // 优先级：治疗（低血时）> 爆发伤害 > 减伤 > 增益
  const lowHp = playerHp < player.maxHp * 0.4;

  for (const skill of skills) {
    const check = canUseSkill(player, skill.id, combatState);
    if (!check.usable) continue;

    // 低血量优先治疗技能
    if (lowHp && skill.id === 'heart_light') return skill;
    if (lowHp && skill.id === 'iron_body') return skill;
    if (lowHp && skill.id === 'blood_drain') return skill;
  }

  // 非低血量时，优先爆发伤害技能
  const dmgSkills = ['tiger_fist', 'thunder_spell', 'dragon_breath', 'mind_crush', 'muscle_control'];
  for (const sid of dmgSkills) {
    const skill = skills.find(s => s.id === sid);
    if (skill) {
      const check = canUseSkill(player, sid, combatState);
      if (check.usable) return skill;
    }
  }

  // 增益技能
  const buffSkills = ['sensory_boost', 'simulation_mind'];
  for (const sid of buffSkills) {
    const skill = skills.find(s => s.id === sid);
    if (skill) {
      const check = canUseSkill(player, sid, combatState);
      if (check.usable) return skill;
    }
  }

  return null;
}

// ── 执行战斗（增强版：技能 + 状态效果 + 基因锁进阶） ──
export async function executeBattle(enemy) {
  const p = gameState.player;
  const preview = previewBattle(p, enemy);
  const log = [];

  // 记录姿态
  const stance = getCurrentStance();
  if (stance.id !== 'balanced') {
    log.push({ text: `${stance.icon} 姿态: ${stance.name}`, type: 'buff' });
  }
  
  // 初始化同伴技能
  try { initCombatAbilities(); } catch {}
  try { initComboState(); } catch {}

  // ── 业力系统战斗修正 ──
  let karmaHealBonus = 0;
  let karmaCompanionBonus = 0;
  let karmaHolyDmg = 0;
  let karmaDarkDmg = 0;
  try {
    const karmaLevel = getKarmaLevel();
    const karmaMods = getKarmaCombatModifiers();
    karmaHealBonus = karmaMods.healBonus || 0;
    karmaCompanionBonus = karmaMods.companionBonus || 0;
    karmaHolyDmg = karmaMods.holyDmgBonus || 0;
    karmaDarkDmg = karmaMods.darkDmgBonus || 0;
    if (karmaLevel.id !== 'neutral') {
      log.push({ text: `${karmaLevel.icon} 业力: ${karmaLevel.name} — 影响战斗属性`, type: 'karma_effect' });
    }
  } catch {}

  if (!preview.canWin) {
    return { victory: false, log: [{ text: `${enemy.name}的防御太高了，无法造成有效伤害！`, type: 'danger' }] };
  }

  let enemyHp = enemy.hp;
  let playerHp = p.hp;
  let playerMana = p.mana || 0;
  let round = 0;
  let _totalDmgDealt = 0, _totalDmgTaken = 0, _critHits = 0;
  let _lootDrops = [];
  // 应用战斗姿态修正
  const _rawAtk = getEffectiveAtk(p);
  const _rawDef = getEffectiveDef(p);
  const _rawCrt = getEffectiveCrt(p);
  const _rawSpd = getEffectiveSpd(p);
  const stanceMod = applyStanceModifiers(_rawAtk, _rawDef, _rawCrt, _rawSpd);
  const pAtk = stanceMod.atk;
  const pDef = stanceMod.def;
  const pCrt = stanceMod.crt;
  const pSpd = stanceMod.spd;
  const stanceCritDmgBonus = stanceMod.critDmgBonus || 0;
  // 连杀加成
  const streakBonus = killStreak.getBonus();
  // 装备词缀战斗效果
  const affixFx = getAllAffixEffects(p);
  if (affixFx.allStats > 0) {
    stanceMod.atk += affixFx.allStats;
    stanceMod.def += affixFx.allStats;
  }
  if (streakBonus.atkPct > 0) {
    stanceMod.atk = Math.floor(stanceMod.atk * (1 + streakBonus.atkPct / 100));
    stanceMod.crt = stanceMod.crt + (streakBonus.crt || 0);
  }
  const chipFx = getChipEffects(p);
  // ── 附魔战斗加成 ──
  let enchantFx = { bonusDmg: 0, bonusAtk: 0, bonusDef: 0, bonusSpd: 0, bonusCrt: 0, lifeStealPct: 0, reflectPct: 0, dotDmg: 0, dotChance: 0, manaGain: 0, healPct: 0, armorPenPct: 0, dodgeBonus: 0, regenBonus: 0, manaRegenBonus: 0, skillBoost: 0 };
  try { enchantFx = getEnchantCombatBonus(p); } catch {}
  if (enchantFx.bonusAtk) stanceMod.atk += enchantFx.bonusAtk;
  if (enchantFx.bonusDef) stanceMod.def += enchantFx.bonusDef;
  if (enchantFx.bonusCrt) stanceMod.crt += enchantFx.bonusCrt;
  if (enchantFx.bonusSpd) stanceMod.spd = (stanceMod.spd || pSpd) + enchantFx.bonusSpd;
  if (enchantFx.bonusAtk || enchantFx.bonusDef || enchantFx.bonusCrt) {
    log.push({ text: '✨ 附魔效果激活', type: 'buff' });
  }
  // ── 遗物系统战斗效果 ──
  let relicFx = {};
  try { relicFx = getRelicCombatEffects(); } catch {}
  // 遗物ATK/DEF百分比加成
  if (relicFx.atkPctBonus) stanceMod.atk = Math.floor(stanceMod.atk * (1 + relicFx.atkPctBonus));
  if (relicFx.defPctBonus) stanceMod.def = Math.floor(stanceMod.def * (1 + relicFx.defPctBonus));
  if (relicFx.allStatsPctBonus) {
    stanceMod.atk = Math.floor(stanceMod.atk * (1 + relicFx.allStatsPctBonus));
    stanceMod.def = Math.floor(stanceMod.def * (1 + relicFx.allStatsPctBonus));
    stanceMod.spd = Math.floor((stanceMod.spd || pSpd) * (1 + relicFx.allStatsPctBonus));
  }
  // 遗物战斗开始治疗/扣血
  if (relicFx.combatStartHealPct > 0) {
    const relicHeal = Math.floor(p.maxHp * relicFx.combatStartHealPct);
    playerHp = Math.min(p.maxHp, playerHp + relicHeal);
    log.push({ text: '🫀 遗物效果：恢复 ' + relicHeal + ' HP', type: 'heal' });
  }
  if (relicFx.combatStartDamagePct > 0) {
    const relicDmg = Math.floor(p.maxHp * relicFx.combatStartDamagePct);
    playerHp = Math.max(1, playerHp - relicDmg);
    log.push({ text: '📜 恶魔契约：消耗 ' + relicDmg + ' HP 换取力量', type: 'danger' });
  }
  let relicDeathSaveUsed = false;
  // ── 天赋觉醒战斗效果 ──
  let perkFx = {};
  try { perkFx = getPerkCombatEffects(); } catch {}
  let perkKillBonusAtk = 0; // 嗜血本能叠加
  let perkConsecutiveHits = 0; // 势不可挡连击计数
  let perkDeathResistUsed = false;
  let perkImmunedOnce = false;
  let perkAdaptiveResists = {}; // 自适应护甲记录
  let relicKillStreak = 0;          // 遗物连杀计数
  // 恐惧领域：降低敌人ATK
  // ── 天赋：全属性加成 ──
  if (perkFx.allStatsPct > 0) {
    stanceMod.atk = Math.floor(stanceMod.atk * (1 + perkFx.allStatsPct));
    stanceMod.def = Math.floor(stanceMod.def * (1 + perkFx.allStatsPct));
    stanceMod.spd = Math.floor((stanceMod.spd || pSpd) * (1 + perkFx.allStatsPct));
  }
  // ── 天赋：冷却缩减 ──
  if (perkFx.cdReduce > 0) {
    for (const sid of Object.keys(combatState.cooldowns || {})) {
      combatState.cooldowns[sid] = Math.max(0, combatState.cooldowns[sid] - perkFx.cdReduce);
    }
  }
  // ── 天赋：恐惧领域（初始 + 可叠加） ──
  let _fearAuraReduction = 0;
  if (perkFx.fearAuraBase > 0) {
    _fearAuraReduction = perkFx.fearAuraBase;
    const fearReduce = Math.floor(enemy.atk * _fearAuraReduction);
    effectiveEnemyAtk = Math.max(1, (effectiveEnemyAtk || enemyEffAtk) - fearReduce);
    log.push({ text: '👁 恐惧领域：敌人ATK-' + fearReduce, type: 'debuff' });
  }
  let relicAutoEvadeCounter = 0;
  let _relicKillStreakAtkBonus = 0;
  const isDouble = canDoubleAttack(pSpd + (enchantFx.bonusSpd || 0), enemy.spd || 5);
  const isDaoist = p.activeBloodline === BLOODLINE.DAOIST;
  const isVampire = p.activeBloodline === BLOODLINE.VAMPIRE;
  const isMartial = p.activeBloodline === BLOODLINE.MARTIAL;
  const spellCost = 8;

  // 初始化战斗状态（技能冷却 + 状态效果）
  const combatState = {
    cooldowns: {},
    statusEffects: { player: [], enemy: [] },
    turn: 0,
  };

  // 冰芯片减敌攻
  const enemyEffAtk = chipFx.hasIceChip
    ? Math.floor(enemy.atk * (1 - chipFx.slowPct / 100))
    : enemy.atk;

  
  // ── 精英词缀战斗效果 ──
  const affix = enemy.affix || null;
  // ── 精英词缀完整效果 ──
  const eliteFx = getEliteCombatEffects(enemy);
  let eliteShield = eliteFx ? eliteFx.shieldHp : 0;
  if (eliteFx && enemy._eliteTier) {
    log.push({ text: `⚠ ${enemy._eliteTierData?.name || '精英'}怪物！词缀效果已激活`, type: 'affix_warning' });
  }
  if (affix) {
    log.push({ text: `⚠ 精英敌人【${affix.name}】${affix.desc}`, type: 'affix_warning' });
  }

if (chipFx.hasIceChip && enemy.atk !== enemyEffAtk) {
    log.push({ text: `❄ 冰芯片生效：${enemy.name}攻击力 ${enemy.atk}→${enemyEffAtk}`, type: 'buff' });
  }
  if (isDouble) {
    log.push({ text: `⚡ 速度碾压！每回合发动二连击`, type: 'buff' });
  }

  // ── 天赋效果（被动） ──
  let talentFx = {};
  try { talentFx = getTalentEffects(gameState.talents) || {}; } catch {}
  let deathSaveUsed = false;
  let lastCrit = false;  // 用于连锁暴击
  let _companionStunLeft = 0;
  let _companionDmgReduce = 0;

  // ── Boss 相位系统 ──
  const bossPhases = enemy.bossId ? getBossPhases(enemy.bossId) : null;
  // ── Boss 开场白 ──
  if (enemy.bossId) {
    try {
      const introLines = getBossIntro(enemy.bossId);
      if (introLines) {
        log.push({ text: '', type: 'separator' });
        for (const line of introLines) {
          if (line) log.push({ text: line, type: 'boss_dialogue' });
        }
        log.push({ text: '', type: 'separator' });
      }
    } catch {}
  }
  let currentPhaseIdx = -1;
  let bossSpecialLastUsed = 0;
  const enemyMaxHp = enemy.hp;
  let effectiveEnemyAtk = enemyEffAtk;
  let effectiveEnemyDef = enemy.def;

  // 展示可用技能
  const availSkills = getAvailableSkills(p);
  if (availSkills.length > 0) {
    log.push({ text: `🎯 可用技能：${availSkills.map(s => s.name).join('、')}`, type: 'info' });
  }

  // ── 同伴战斗对话 ──
  try {
    const combatDialogues = generateCombatDialogue(
      gameState.companions || [], gameState.relationships || {}, 'start'
    );
    for (const d of combatDialogues) log.push(d);
  } catch {}

  // ── 装备词缀：吸血和破甲 ──
  let equipLifeStealPct = 0;
  let equipArmorPenPct = 0;
  if (p.weapon?.lifeStealPct) equipLifeStealPct += p.weapon.lifeStealPct;
  if (p.armor?.lifeStealPct) equipLifeStealPct += p.armor.lifeStealPct;
  if (p.accessory?.lifeStealPct) equipLifeStealPct += p.accessory.lifeStealPct;
  if (p.weapon?.armorPenPct) equipArmorPenPct += p.weapon.armorPenPct;
  if (p.armor?.armorPenPct) equipArmorPenPct += p.armor.armorPenPct;
  if (p.accessory?.armorPenPct) equipArmorPenPct += p.accessory.armorPenPct;
  if (equipLifeStealPct > 0) log.push({ text: `🩸 装备吸血 ${equipLifeStealPct}%`, type: 'buff' });
    // ── 遗物吸血百分比 ──
    if (relicFx.lifeStealPct > 0) {
      equipLifeStealPct += relicFx.lifeStealPct * 100;
    }
    // ── 遗物暴击吸血 ──
    let relicCritLifeStealPct = relicFx.critLifeStealPct || 0;
  if (equipArmorPenPct > 0) log.push({ text: `🔪 装备破甲 ${equipArmorPenPct}%`, type: 'buff' });

  // ── 元素共鸣状态 ──
  let resonanceBonusDmg = 0;
  let resonanceArmorIgnore = 0;
  let resonanceDotMult = 1.0;
  let resonanceStunChance = 0;
  let resonanceHealPct = 0;
  let resonanceCleanse = false;
  let resonancePurify = false;

  // ── 元素相克提示 ──
  try {
    const playerElements = getPlayerActiveElements(p);
    const enemyElem = getEnemyElement(enemy);
    if (playerElements.length > 0 && enemyElem !== 'physical') {
      for (const pe of playerElements) {
        const mod = calcElementalModifier(pe, enemyElem);
        if (mod.isAdvantage) log.push({ text: `✦ 元素克制！${mod.text}`, type: 'elemental_advantage' });
        if (mod.isResist) log.push({ text: `⚠ 元素抗性：${mod.text}`, type: 'elemental_resist' });
      }
    }
    // 元素共鸣 — 记录并应用实际效果
    const resonances = checkElementalResonance(playerElements);
    for (const r of resonances) {
      log.push({ text: `${r.icon} 元素共鸣【${r.name}】激活！`, type: 'elemental_resonance' });
      if (r.bonusDmgPct) resonanceBonusDmg += r.bonusDmgPct;
      if (r.armorIgnore) resonanceArmorIgnore = Math.max(resonanceArmorIgnore, r.armorIgnore);
      if (r.dotMultiplier) resonanceDotMult = Math.max(resonanceDotMult, r.dotMultiplier);
      if (r.stunChance) resonanceStunChance = Math.max(resonanceStunChance, r.stunChance);
      if (r.healPct) resonanceHealPct += r.healPct;
      if (r.cleanse) resonanceCleanse = true;
      if (r.purify) resonancePurify = true;
    }
  } catch {}

  // ── 战前自动使用消耗品（HP<50%时使用修复包） ──
  try {
    const inv = p.inventory || [];
    if (playerHp < p.maxHp * 0.5) {
      const healIdx = inv.findIndex(item => item.type === 'consumable' && item.effect?.healPercent);
      if (healIdx >= 0) {
        const item = inv[healIdx];
        const healAmt = Math.floor(p.maxHp * item.effect.healPercent);
        playerHp = Math.min(p.maxHp, playerHp + healAmt);
        inv.splice(healIdx, 1);
        log.push({ text: `📦 战前使用 ${item.name}！恢复 ${healAmt} HP`, type: 'heal' });
      }
    }
  } catch {}
    // ── 同伴技能自动触发（每3回合或低血量） ──
    try {
      const avail = getAvailableAbilities().filter(a => a.ready);
      if (avail.length > 0 && (round % 3 === 1 || playerHp < p.maxHp * 0.3)) {
        let chosen = avail[0];
        if (playerHp < p.maxHp * 0.4) {
          const healer = avail.find(a => a.type === 'support');
          if (healer) chosen = healer;
        }
        const caResult = useCompanionAbility(chosen.companionId);
        if (caResult.success) {
          for (const l of caResult.log) log.push(l);
          if (caResult.damage > 0) { enemyHp = Math.max(0, enemyHp - caResult.damage); _totalDmgDealt += caResult.damage; }
          if (caResult.heal > 0) playerHp = Math.min(p.maxHp, playerHp + caResult.heal);
          if (caResult.stun > 0) _companionStunLeft = caResult.stun;
          _companionDmgReduce = caResult.damageReduce || 0;
          try { recordCompanionAction(); } catch {}
        }
      }
    } catch {}


  let envCritBonus = 0;
  let envAtkMod = 0;
  let envDefMod = 0;
  let bossLowHpTriggered = false;
  let playerLowHpBossLineTriggered = false;
  while (enemyHp > 0 && playerHp > 0) {
    tickOrderCooldown();
    round++;
    // ── 天赋：恐惧领域叠加（每5回合） ──
    if (perkFx.fearAuraStack > 0 && round > 0 && round % 5 === 0) {
      const cap = perkFx.fearAuraCap || 0.25;
      _fearAuraReduction = Math.min(cap, _fearAuraReduction + perkFx.fearAuraStack);
      const stackReduce = Math.floor(enemy.atk * perkFx.fearAuraStack);
      effectiveEnemyAtk = Math.max(1, effectiveEnemyAtk - stackReduce);
      if (round <= 30) log.push({ text: '👁 恐惧领域叠加！敌人ATK再降' + stackReduce, type: 'debuff' });
    }
    // 遗物狂战士效果：HP越低ATK越高
    let berserkerAtkMod = 0;
    if (relicFx.berserkerMaxBonus > 0) {
      const hpRatio = playerHp / p.maxHp;
      if (hpRatio < 0.5) {
        berserkerAtkMod = Math.floor(stanceMod.atk * relicFx.berserkerMaxBonus * (1 - hpRatio * 2));
      }
    }
    // ── 遗物：低血量攻击加成 ──
    let relicLowHpAtkMod = 0;
    if (relicFx.lowHpAtkBonus > 0 && (playerHp / p.maxHp) < (relicFx.lowHpThreshold || 0.3)) {
      relicLowHpAtkMod = Math.floor(stanceMod.atk * relicFx.lowHpAtkBonus);
    }
    // 遗物低血量防御加成
    let relicLowHpDefMod = 0;
    if (relicFx.lowHpDefBonus > 0 && (playerHp / p.maxHp) < (relicFx.lowHpThreshold || 0.3)) {
      relicLowHpDefMod = Math.floor(stanceMod.def * relicFx.lowHpDefBonus);
    }
    // 遗物自动攻击
    if (relicFx.autoAttackInterval > 0 && round > 0 && round % relicFx.autoAttackInterval === 0 && enemyHp > 0) {
      const autoDmg = Math.floor(stanceMod.atk * relicFx.autoAttackPct);
      enemyHp = Math.max(0, enemyHp - autoDmg);
      _totalDmgDealt += autoDmg;
      log.push({ text: '💠 虚空冲击！造成 ' + autoDmg + ' 伤害', type: 'relic_attack' });
    }
    // 遗物自动闪避计数
    relicAutoEvadeCounter++;
    // ── 天赋每回合效果 ──
    // 超级再生
    if (perkFx.regenPct > 0 && playerHp > 0 && playerHp < p.maxHp) {
      const regenHp = Math.max(1, Math.floor(p.maxHp * perkFx.regenPct));
      playerHp = Math.min(p.maxHp, playerHp + regenHp);
      if (round <= 3) log.push({ text: '💚 再生：+' + regenHp + ' HP', type: 'heal' });
    }
    // 时间膨胀(额外行动) — 标记
    let perkExtraTurn = false;
    if (perkFx.extraTurnInterval > 0 && round > 0 && round % perkFx.extraTurnInterval === 0) {
      perkExtraTurn = true;
    }
    // 过载效果
    let perkOverchargeAtk = 0;
    let perkOverchargeDef = 0;
    if (perkFx.fullHpAtkBonus > 0 && playerHp >= p.maxHp) {
      perkOverchargeAtk = Math.floor(stanceMod.atk * perkFx.fullHpAtkBonus);
    }
    if (perkFx.lowHpDefBonus > 0 && playerHp < p.maxHp * 0.5) {
      perkOverchargeDef = Math.floor(stanceMod.def * perkFx.lowHpDefBonus);
    }
    // ── 遗物：吸血（每轮标记，在攻击后处理） ──
    // ── 遗物：毒攻（标记，在攻击后处理） ──
    // ── 遗物：反伤（标记，在受击后处理） ──
    // ── 遗物：连杀ATK加成 ──
    let relicKillStreakAtk = 0;
    if (relicFx.killStreakAtkPct > 0 && relicKillStreak > 0) {
      relicKillStreakAtk = Math.min(
        Math.floor(stanceMod.atk * relicFx.killStreakAtkCap / 100),
        Math.floor(stanceMod.atk * relicFx.killStreakAtkPct * relicKillStreak / 100)
      );
    }
    // ── 遗物：首回合双击 ──
    let relicFirstTurnDouble = false;
    if (relicFx.firstTurnDoubleAction && round === 1) {
      relicFirstTurnDouble = true;
    }
    // ── 遗物：免疫眩晕/冻结 ──
    if (relicFx.immuneStun || relicFx.immuneFreeze) {
      const pEffects = combatState.statusEffects?.player || [];
      for (let i = pEffects.length - 1; i >= 0; i--) {
        if (relicFx.immuneStun && pEffects[i].type === 'stun') {
          pEffects.splice(i, 1);
          if (round <= 3) log.push({ text: '💎 遗物免疫眩晕！', type: 'relic_buff' });
        }
        if (relicFx.immuneFreeze && pEffects[i].type === 'freeze') {
          pEffects.splice(i, 1);
          if (round <= 3) log.push({ text: '💎 遗物免疫冻结！', type: 'relic_buff' });
        }
      }
    }
    // ── 天赋：免疫首次负面效果 ──
    if (perkFx.immuneDebuffOnce && !perkImmunedOnce) {
      const pEffects = combatState.statusEffects?.player || [];
      const debuffTypes = ['debuff_atk', 'debuff_def', 'stun', 'freeze', 'burn', 'poison'];
      for (let i = pEffects.length - 1; i >= 0; i--) {
        if (debuffTypes.includes(pEffects[i].type)) {
          pEffects.splice(i, 1);
          perkImmunedOnce = true;
          log.push({ text: '🌟 天赋免疫！抵消了一次负面效果！', type: 'talent_save' });
          break;
        }
      }
    }
    // ── 天赋：真实伤害 ──
    let perkTrueDmg = 0;
    if (perkFx.trueDmgPerLevel > 0) {
      perkTrueDmg = perkFx.trueDmgPerLevel * (p.level || 1);
    }
    // 同伴技能冷却
    try { tickAbilityCooldowns(); } catch {}
    // 每回合重置环境修正
    envCritBonus = 0;
    envAtkMod = 0;
    envDefMod = 0;

    // ── 战场环境效果（结构化数值同步）──
    let envSkipPlayer = false;
    try {
      const envResult = processEnvironmentEffect(
        gameState.chapter,
        { hp: playerHp, maxHp: p.maxHp, mana: playerMana, maxMana: p.maxMana || 0 },
        { hp: enemyHp },
        round
      );
      // 同步HP/法力变化
      if (envResult.playerHpDelta) {
        playerHp = Math.max(1, Math.min(p.maxHp, playerHp + envResult.playerHpDelta));
      }
      if (envResult.enemyHpDelta) {
        enemyHp = Math.max(1, enemyHp + envResult.enemyHpDelta);
      }
      if (envResult.manaDelta) {
        playerMana = Math.min(p.maxMana || 0, Math.max(0, playerMana + envResult.manaDelta));
      }
      // 同步临时属性修正（每回合环境效果，叠加到有效值）
      if (envResult.enemyAtkMod) {
        effectiveEnemyAtk = Math.max(1, effectiveEnemyAtk + envResult.enemyAtkMod);
      }
      if (envResult.enemyDefMod) {
        effectiveEnemyDef = Math.max(0, effectiveEnemyDef + envResult.enemyDefMod);
      }
      // 环境暴击加成存入本回合变量
      envCritBonus = envResult.playerCritMod || 0;
      envAtkMod = envResult.playerAtkMod || 0;
      envDefMod = envResult.playerDefMod || 0;
      // 眩晕跳过标记
      if (envResult.skipPlayerTurn) envSkipPlayer = true;
      // 日志
      for (const envLog of envResult.logs) {
        if (round <= 6) log.push(envLog);
      }
      if (playerHp <= 0 || enemyHp <= 0) { break; }
    } catch(e) { /* environment is non-critical */ }

    // ── 精英词缀: 每回合效果 ──
    if (affix) {
      // 剧毒: 每回合毒伤
      if (affix.poisonDmg && playerHp > 0) {
        const toxicDmg = Math.max(1, Math.floor(p.maxHp * affix.poisonDmg));
        playerHp -= toxicDmg;
      eventBus.emit('combat:player_hurt', { });
        if (round <= 6) log.push({ text: `☠ 【${affix.name}】毒素 -${toxicDmg} HP`, type: 'affix_damage' });
        if (playerHp <= 0) break;
      }
      // 吸血: 每回合恢复
      if (affix.lifeSteal && enemyHp > 0) {
        const healAmt = Math.max(1, Math.floor(effectiveEnemyAtk * affix.lifeSteal));
        enemyHp = Math.min(enemyMaxHp, enemyHp + healAmt);
        if (round <= 6) log.push({ text: `🩸 【${affix.name}】吸血 +${healAmt} HP`, type: 'affix_heal' });
      }
    }
    // ── 精英词缀: 回合效果 ──
    if (eliteFx) {
      // 精英再生
      if (eliteFx.regenPercent > 0 && enemyHp > 0 && enemyHp < enemyMaxHp) {
        const eliteRegen = Math.max(1, Math.floor(enemyMaxHp * eliteFx.regenPercent));
        enemyHp = Math.min(enemyMaxHp, enemyHp + eliteRegen);
        if (round <= 6) log.push({ text: `💚 精英再生 +${eliteRegen} HP`, type: 'enemy_heal' });
      }
      // 精英onHitPlayer效果（毒素等）
      for (const onHit of (eliteFx.onHitPlayer || [])) {
        if (typeof onHit === 'function' && playerHp > 0) {
          try {
            const hitResult = onHit({ maxHp: p.maxHp, hp: playerHp }, round);
            if (hitResult && hitResult.damage) {
              playerHp -= hitResult.damage;
              if (round <= 6) log.push({ text: `☠ ${hitResult.text || '精英词缀伤害 -' + hitResult.damage}`, type: 'affix_damage' });
            }
          } catch {}
        }
      }
      // 精英combatMods（狂暴觉醒等）
      for (const modFn of (eliteFx.combatMods || [])) {
        if (typeof modFn === 'function') {
          try {
            const modResult = modFn(enemy, enemyHp, enemyMaxHp);
            if (modResult && modResult.atkMul && !enemy._eliteEnraged) {
              effectiveEnemyAtk = Math.floor(effectiveEnemyAtk * modResult.atkMul);
              enemy._eliteEnraged = true;
              log.push({ text: `🔥 ${modResult.desc || '精英觉醒！'}`, type: 'affix_warning' });
            }
          } catch {}
        }
      }
    }

    combatState.turn = round;

    // ── 天赋：每回合生命恢复 ──
    // 附魔回血
    if (enchantFx.regenBonus > 0 && playerHp > 0) {
      let enchRegen = Math.max(1, Math.floor(p.maxHp * enchantFx.regenBonus / 100));
      if (karmaHealBonus > 0) enchRegen = Math.floor(enchRegen * (1 + karmaHealBonus / 100));
      playerHp = Math.min(p.maxHp, playerHp + enchRegen);
      if (round <= 4) log.push({ text: '✨ 附魔恢复 +' + enchRegen + ' HP', type: 'heal' });
    }
    // 附魔法力回复(每回合)
    if (enchantFx.manaRegenBonus > 0 && playerMana < (p.maxMana || 0)) {
      playerMana = Math.min(p.maxMana || 0, playerMana + enchantFx.manaRegenBonus);
    }
    if (talentFx.regenPercent && playerHp > 0) {
      let regenAmt = Math.max(1, Math.floor(p.maxHp * talentFx.regenPercent));
      if (karmaHealBonus > 0) regenAmt = Math.floor(regenAmt * (1 + karmaHealBonus / 100));
      playerHp = Math.min(p.maxHp, playerHp + regenAmt);
      if (round <= 6) log.push({ text: `💚 天赋恢复 +${regenAmt} HP`, type: 'heal' });
    }
    // ── 元素共鸣：净化回血 ──
    if (resonanceHealPct > 0 && playerHp > 0) {
      let resHeal = Math.max(1, Math.floor(p.maxHp * resonanceHealPct));
      if (karmaHealBonus > 0) resHeal = Math.floor(resHeal * (1 + karmaHealBonus / 100));
      playerHp = Math.min(p.maxHp, playerHp + resHeal);
      if (round <= 6) log.push({ text: `✨ 共鸣净化 +${resHeal} HP`, type: 'heal' });
    }
    // ── 天赋：每回合法力恢复 ──
    if (talentFx.manaRegen && playerMana < (p.maxMana || 0)) {
      playerMana = Math.min(p.maxMana, playerMana + talentFx.manaRegen);
      if (round <= 6) log.push({ text: `💙 天赋恢复 +${talentFx.manaRegen} 法力`, type: 'heal' });
    }

    // ── Boss 相位检测 ──
    if (bossPhases && enemyHp > 0) {
      const phaseInfo = getCurrentPhase(bossPhases, enemyHp, enemyMaxHp);
      if (phaseInfo.index !== currentPhaseIdx) {
        currentPhaseIdx = phaseInfo.index;
        const ph = phaseInfo.phase;
        effectiveEnemyAtk = Math.floor(enemyEffAtk * (ph.atkMult || 1));
        effectiveEnemyDef = Math.floor(enemy.def * (ph.defMult || 1));
        if (round > 1) {
          log.push({ text: ``, type: 'separator' });
          log.push({ text: `⚠ ${enemy.name}进入【${ph.name}】阶段！`, type: 'boss_phase' });
          eventBus.emit('combat:boss_phase', { phase: ph, enemy });
          log.push({ text: `  ${ph.desc}`, type: 'boss_phase' });
        }
          try { const _pd = getBossPhaseDialogue(enemy.bossId, ph.name); if (_pd) log.push({ text: "「" + _pd + "」", type: "boss_dialogue" }); } catch {}
      }
    }

    
    // ── Boss 低血量对话 ──
    if (enemy.bossId && !bossLowHpTriggered && enemyHp > 0 && enemyHp < enemy.hp * 0.20) {
      bossLowHpTriggered = true;
      try {
        const lowHpLine = getBossLowHpLine(enemy.bossId);
        if (lowHpLine) {
          log.push({ text: '', type: 'separator' });
          log.push({ text: '「' + lowHpLine + '」', type: 'boss_dialogue' });
        }
      } catch {}
    }
    // ── Boss 对濒死玩家的嘲讽 ──
    if (enemy.bossId && !playerLowHpBossLineTriggered && playerHp > 0 && playerHp < p.maxHp * 0.20) {
      playerLowHpBossLineTriggered = true;
      try {
        const plLine = getBossPlayerLowHpLine(enemy.bossId);
        if (plLine) log.push({ text: '「' + plLine + '」', type: 'boss_dialogue' });
      } catch {}
    }

    // ── 敌人特性：每回合再生 ──
    if ((enemy.traits || []).includes('regen') && enemyHp > 0 && enemyHp < enemyMaxHp) {
      const regenAmt = Math.max(1, Math.floor(enemyMaxHp * 0.05));
      enemyHp = Math.min(enemyMaxHp, enemyHp + regenAmt);
      if (round <= 6) log.push({ text: `🔄 ${enemy.name}再生 +${regenAmt} HP`, type: 'enemy_heal' });
    }
    // ── 敌人特性：护盾（前2回合减伤） ──

    // ── 天赋：处决伤害（每N回合） ──
    if (talentFx.executeDmg && round % talentFx.executeDmg.interval === 0 && enemyHp > 0) {
      const execDmg = Math.max(1, Math.floor(enemyHp * talentFx.executeDmg.percent));
      enemyHp -= execDmg;
      log.push({ text: `⚔ 灭世之力！真实伤害 ${execDmg}`, type: 'critical' });
      eventBus.emit('combat:critical', { damage: playerDmg });
      if (enemyHp <= 0) break;
    }

    // ── 天赋：额外回合（每N回合） ──
    // (标记，在本回合结束时额外执行一次攻击)

    // ── 回合开始：处理玩家状态效果 ──
    const playerEffects = processStatusEffects('player', combatState);
    for (const entry of playerEffects.log) log.push(entry);
    if (playerEffects.damage) {
      playerHp -= playerEffects.damage;
      if (playerHp <= 0) break;
    }

    // ── 回合开始：处理敌人状态效果 ──
    const enemyEffects = processStatusEffects('enemy', combatState);
    for (const entry of enemyEffects.log) log.push(entry);
    if (enemyEffects.damage) {
      enemyHp -= enemyEffects.damage;
      if (enemyHp <= 0) break;
    }

    // ── 玩家行动选择（战术菜单） ──
    let _actionChoice = null;
    let _defendActive = false;
    if (shouldPauseForAction(round, enemy, playerHp, p.maxHp, combatState)) {
      // 更新实时战报
      eventBus.emit('combat:log_update', { log: [...log], round, playerHp, enemyHp, playerMaxHp: p.maxHp, enemyMaxHp, playerMana, statusEffects: combatState.statusEffects, relicFx: relicFx || {}, perkFx: perkFx || {} });
      _actionChoice = await showBattleActionMenu(
        { ...p, hp: playerHp, mana: playerMana },
        { ...enemy, hp: enemyHp },
        round,
        combatState
      );
      // 处理逃跑
      if (_actionChoice.type === ACTION_TYPE.FLEE) {
        const fleeResult = attemptFlee(p, enemy);
        log.push(fleeResult.log);
        if (fleeResult.success) {
          p.hp = playerHp;
          p.mana = playerMana;
          return { victory: false, fled: true, log, rounds: round };
        }
        // 逃跑失败，本回合跳过攻击，直接承受敌人攻击
        _actionChoice = { type: '_flee_failed' };
      }
      // 处理防御
      if (_actionChoice.type === ACTION_TYPE.DEFEND) {
        const defendResult = applyDefendAction();
        _defendActive = true;
        log.push(defendResult.log);
        // 防御回合跳过攻击阶段，但仍然处理被动效果
      }
      // 处理道具使用
      if (_actionChoice.type === ACTION_TYPE.ITEM && _actionChoice.data?.item) {
        const usedItem = _actionChoice.data.item;
        const inv = p.inventory || [];
        const itemIdx = inv.indexOf(usedItem);
        if (itemIdx >= 0) {
          if (usedItem.effect?.healPercent) {
            const healAmt = Math.floor(p.maxHp * usedItem.effect.healPercent);
            playerHp = Math.min(p.maxHp, playerHp + healAmt);
            log.push({ text: '📦 使用 ' + usedItem.name + '！恢复 ' + healAmt + ' HP', type: 'heal' });
          }
          if (usedItem.effect?.manaPercent) {
            const manaAmt = Math.floor((p.maxMana || 0) * usedItem.effect.manaPercent);
            playerMana = Math.min(p.maxMana || 0, playerMana + manaAmt);
            log.push({ text: '📦 使用 ' + usedItem.name + '！恢复 ' + manaAmt + ' MP', type: 'heal' });
          }
          if (usedItem.effect?.atkBoost) {
            const boostAmt = Math.floor(pAtk * usedItem.effect.atkBoost);
            stanceMod.atk += boostAmt;
            log.push({ text: '📦 使用 ' + usedItem.name + '！ATK+' + boostAmt + ' (' + Math.floor(usedItem.effect.atkBoost * 100) + '%)', type: 'buff' });
          }
          if (usedItem.effect?.defBoost) {
            const defBoostAmt = Math.floor(pDef * usedItem.effect.defBoost);
            stanceMod.def += defBoostAmt;
            log.push({ text: '📦 使用 ' + usedItem.name + '！DEF+' + defBoostAmt, type: 'buff' });
          }
          if (usedItem.effect?.removeDebuff) {
            // 清除玩家负面状态
            combatState.statusEffects.player = (combatState.statusEffects.player || []).filter(e => e.type !== 'debuff');
            log.push({ text: '📦 ' + usedItem.name + ' 清除负面状态！', type: 'buff' });
          }
          // 更新ConsumableSystem统计
          try { gameState.stats.consumablesUsed = (gameState.stats.consumablesUsed || 0) + 1; } catch {}
          inv.splice(itemIdx, 1);
        }
        // 使用道具后仍可正常攻击，不跳过
        _actionChoice = { type: ACTION_TYPE.ATTACK };
      }
    }

    // ── 玩家回合：尝试使用技能 ──
    const _skipPlayerAttack = _defendActive || (_actionChoice && _actionChoice.type === '_flee_failed');
    let skill = null;
    if (!_skipPlayerAttack) {
      if (_actionChoice && _actionChoice.type === ACTION_TYPE.SKILL && _actionChoice.data?.skillId) {
        // 玩家手动选择了技能
        const selectedSkill = getAvailableSkills(p).find(s => s.id === _actionChoice.data.skillId);
        if (selectedSkill) {
          const check = canUseSkill(p, selectedSkill.id, combatState);
          if (check.usable) skill = selectedSkill;
        }
      } else {
        // 自动选择最佳技能（非策略模式或玩家选择普攻时仍自动释放）
        skill = _actionChoice?.type === ACTION_TYPE.ATTACK ? null : pickBestSkill(p, enemy, combatState, enemyHp, playerHp);
      }
    }
    if (skill) {
      // 创建临时player/enemy对象以避免修改实际状态
      const tempPlayer = { ...p, hp: playerHp, mana: playerMana, atk: pAtk, def: pDef, crt: pCrt, spd: pSpd };
      const tempEnemy = { ...enemy, hp: enemyHp };
      const skillResult = useSkill(tempPlayer, skill.id, tempEnemy, combatState);
        gameState.stats.skillsUsed++;
      for (const entry of skillResult.log) log.push(entry);

      // 应用技能效果
      if (skillResult.damage) {
        // 遗物：基因锁效果增强
        let finalSkillDmg = skillResult.damage;
        if (relicFx.geneLockEffectBonus > 0 && skill.type === 'gene_lock') {
          const bonus = Math.floor(finalSkillDmg * relicFx.geneLockEffectBonus);
          finalSkillDmg += bonus;
          if (round <= 8) log.push({ text: '🧬 基因锁增幅 +' + bonus + ' 伤害', type: 'relic_buff' });
        }
        enemyHp -= finalSkillDmg;
      }
      if (skillResult.heal) {
        let skillHeal = skillResult.heal;
        if (karmaHealBonus > 0) skillHeal = Math.floor(skillHeal * (1 + karmaHealBonus / 100));
        playerHp = Math.min(p.maxHp, playerHp + skillHeal);
      }
      if (skillResult.manaCost) playerMana -= skillResult.manaCost;
      // ── 天赋：法术回响(30%不消耗冷却) ──
      if (perkFx.skillCdRefund > 0 && seededRandom() < perkFx.skillCdRefund) {
        combatState.cooldowns[skill.id] = 0;
        log.push({ text: '🔮 法术回响！技能冷却重置！', type: 'buff' });
      }
      // ── 遗物：基因锁技能冷却缩减 ──
      if (relicFx.geneLockCdReduce > 0 && skill.type === 'gene_lock') {
        combatState.cooldowns[skill.id] = Math.max(0, (combatState.cooldowns[skill.id] || 0) - relicFx.geneLockCdReduce);
      }
    }

    if (enemyHp <= 0) break;

    // ── 天赋：真实伤害(每次攻击附加) ──
    if (perkTrueDmg > 0 && enemyHp > 0) {
      enemyHp = Math.max(0, enemyHp - perkTrueDmg);
      _totalDmgDealt += perkTrueDmg;
      if (round <= 6) log.push({ text: `⚡ 真实伤害 ${perkTrueDmg}`, type: 'skill' });
    }

    // ── 遗物：攻击附毒 ──
    if (relicFx.poisonChance > 0 && seededRandom() < relicFx.poisonChance && enemyHp > 0) {
      const existing = (combatState.statusEffects?.enemy || []).find(e => e.type === 'poison');
      if (!existing) {
        if (!combatState.statusEffects.enemy) combatState.statusEffects.enemy = [];
        combatState.statusEffects.enemy.push({
          type: 'poison', value: relicFx.poisonDmg || 5,
          duration: relicFx.poisonDuration || 3, source: 'relic_scorpion'
        });
        log.push({ text: `🦂 蝎尾毒素发动！每回合${relicFx.poisonDmg || 5}伤害`, type: 'poison' });
      }
    }

    if (enemyHp <= 0) break;

    // ── 每回合共享变量（物理攻击和敌人攻击都需要） ──
    let atkMultiplier = 1;
    const mcBuff = (combatState.statusEffects?.player || []).find(e => e.type === STATUS_EFFECT.BUFF_ATK);
    if (mcBuff && mcBuff.value > 50) atkMultiplier = 2;

    let enemyEnrageMult = 1;
    if ((enemy.traits || []).includes('enrage') && enemyHp < enemyMaxHp * 0.5) {
      enemyEnrageMult = 1.4;
      if (round <= 6 || round === Math.ceil(enemyMaxHp * 0.5 / 77)) {
        log.push({ text: `🔥 ${enemy.name}陷入狂怒！ATK +40%`, type: 'enemy_enrage' });
      }
    }

    let berserkMult = 1;
    if (talentFx.berserkerThreshold && playerHp < p.maxHp * talentFx.berserkerThreshold) {
      berserkMult = 1 + talentFx.berserkerAtkBonus;
      if (round <= 6 || round % 5 === 0) log.push({ text: `🔥 狂暴！ATK +${Math.floor(talentFx.berserkerAtkBonus * 100)}%`, type: 'buff' });
    }
    let chainCritBonus = lastCrit ? (talentFx.chainCrit || 0) : 0;
    lastCrit = false;

    // ── 环境眩晕：跳过玩家回合 ──
    if (envSkipPlayer) {
      if (round <= 6) log.push({ text: '⚡ 你被环境效果击晕，本回合无法行动！', type: 'environment_debuff' });
    }

    // ── 玩家物理攻击 ──
    if (_skipPlayerAttack) {
      // 防御/逃跑失败：跳过物理攻击，仅保留被动效果
      if (_defendActive && round <= 6) {
        log.push({ text: '🛡 防御姿态：本回合不发动攻击', type: 'defend' });
      }
    } else {
    const attackCount = envSkipPlayer ? 0 : ((isDouble || relicFirstTurnDouble || (relicFx.doubleAttackBonus > 0 && seededRandom() * 100 < relicFx.doubleAttackBonus)) ? 2 : 1);
    for (let i = 0; i < attackCount && enemyHp > 0; i++) {
      // 应用破甲（天赋 + 装备 + 共鸣叠加）
      let totalArmorPen = (talentFx.armorPen || 0) + (equipArmorPenPct / 100) + resonanceArmorIgnore + (affixFx.ignoreDefPct / 100);
      totalArmorPen = Math.min(totalArmorPen, 0.80); // 上限80%
      const armorPenDef = totalArmorPen > 0 ? Math.floor(enemy.def * (1 - totalArmorPen)) : enemy.def;
      const pHit = calcDamage(
        { atk: Math.max(1, Math.floor(pAtk * atkMultiplier * berserkMult) + envAtkMod + perkKillBonusAtk + (relicKillStreakAtk || 0) + (perkOverchargeAtk || 0) + (relicLowHpAtkMod || 0)),
          crt: pCrt + chainCritBonus + envCritBonus + (perkFx.guaranteedCritAfter > 0 && perkConsecutiveHits >= perkFx.guaranteedCritAfter ? 100 : 0),
          _critDmgBonus: (perkFx.critDmgBonus || 0) + (perkFx.guaranteedCritDmgBonus || 0) + (relicFx.critDmgBonus || 0),
          geneLock: p.geneLock },
        { ...enemy, def: bossPhases ? effectiveEnemyDef : armorPenDef },
        p.weapon?.damageType || DAMAGE_TYPE.PHYSICAL
      );
      // ── 敌人特性: 幻影闪避（evasive trait）──
      if ((enemy.traits || []).includes('evasive') && seededRandom() < 0.15) {
        if (round <= 6 || i === 0) log.push({ text: `💨 ${enemy.name} 幻影闪避！躲开了攻击`, type: 'dodge' });
        continue; // skip this hit entirely
      }
      // ── 精英词缀: 暗影闪避 ──
      if (affix && affix.dodgeChance && seededRandom() < affix.dodgeChance) {
        if (round <= 6 || i === 0) log.push({ text: `🌑 【${affix.name}】闪避了攻击！`, type: 'affix_dodge' });
        continue; // skip this hit entirely
      }
      
      enemyHp -= pHit.damage;

      const hitLabel = isDouble ? `[${i + 1}击] ` : '';
      const multiLabel = atkMultiplier > 1 ? ' 💪强化！' : '';
      if (pHit.isCrit) { lastCrit = true; gameState.stats.criticalHits++; }
      try { recordCrit(pHit.isCrit); } catch {}
      try { if (pHit.isWeak) recordWeaknessHit(); } catch {}
      try { if (pHit.elemAdvantage) recordElementalHit(); } catch {}
      // 天赋：暴击伤害加成
      let finalDmg = pHit.damage;
      if (pHit.isCrit && (talentFx.critDmgBonus > 0 || stanceCritDmgBonus > 0)) {
        const bonus = Math.floor(pHit.damage * (talentFx.critDmgBonus + stanceCritDmgBonus));
        finalDmg += bonus;
        enemyHp -= bonus; // 额外扣除
      }
      // 元素共鸣额外伤害
      if (resonanceBonusDmg > 0) {
        const resBonus = Math.floor(pHit.damage * resonanceBonusDmg);
        finalDmg += resBonus;
        enemyHp -= resBonus;
      }
            // 附魔额外伤害
      if (enchantFx.bonusDmg > 0 && i === 0) {
        enemyHp -= enchantFx.bonusDmg;
        _totalDmgDealt += enchantFx.bonusDmg;
        if (round <= 4) log.push({ text: '✨ 附魔伤害 +' + enchantFx.bonusDmg, type: 'buff' });
      }
      // 附魔吸血
      if (enchantFx.healPct > 0 && pHit.damage > 0) {
        const enchHeal = Math.max(1, Math.floor(pHit.damage * enchantFx.healPct / 100));
        playerHp = Math.min(p.maxHp, playerHp + enchHeal);
        if (round <= 3) log.push({ text: '✨ 附魔回复 +' + enchHeal + ' HP', type: 'heal' });
      }
      // 附魔法力回复
      if (enchantFx.manaGain > 0 && i === 0) {
        playerMana = Math.min(p.maxMana || 0, playerMana + enchantFx.manaGain);
      }
// 装备词缀额外伤害
      const affixExtraDmg = (affixFx.fireDmg || 0) + (affixFx.iceDmg || 0) + (affixFx.poisonDmg || 0) + (affixFx.holyDmg || 0);
      if (affixExtraDmg > 0 && i === 0) {
        finalDmg += affixExtraDmg;
        enemyHp -= affixExtraDmg;
        if (round <= 4) {
          const types = [];
          if (affixFx.fireDmg) types.push('🔥' + affixFx.fireDmg);
          if (affixFx.iceDmg) types.push('❄' + affixFx.iceDmg);
          if (affixFx.poisonDmg) types.push('☠' + affixFx.poisonDmg);
          if (affixFx.holyDmg) types.push('✦' + affixFx.holyDmg);
          log.push({ text: '词缀伤害: ' + types.join(' '), type: 'buff' });
        }
      }
      // 词缀无视防御（已通过armorPen处理）
      // 词缀吸血
      if (affixFx.lifestealPct > 0 && finalDmg > 0) {
        const affixSteal = Math.max(1, Math.floor(finalDmg * affixFx.lifestealPct / 100));
        playerHp = Math.min(p.maxHp, playerHp + affixSteal);
        if (round <= 4 && i === 0) log.push({ text: '🩸 词缀吸血 +' + affixSteal + ' HP', type: 'heal' });
      }
      log.push({
        text: `${hitLabel}郑吒 → ${enemy.name} ${finalDmg}${pHit.isCrit ? ' 暴击！' : ''}${pHit.isWeak ? ' 弱点！' : ''}${multiLabel}`,
        type: pHit.isCrit ? 'critical' : 'attack',
        damage: finalDmg,
        playerHp, enemyHp, round,
      });
      _totalDmgDealt += finalDmg;
      // 连击加成
      try {
        const combo = getComboBonus();
        if (combo && combo.bonus > 0 && i === 0) {
          const comboDmgBonus = Math.floor(finalDmg * combo.bonus);
          if (comboDmgBonus > 0) {
            enemyHp -= comboDmgBonus;
            _totalDmgDealt += comboDmgBonus;
            for (const cl of formatComboLog(combo)) log.push(cl);
          }
        }
      } catch {};
      if (pHit.isCrit) _critHits++;
      try { recordCrit(true); } catch {}
      if (finalDmg > gameState.stats.maxSingleHit) gameState.stats.maxSingleHit = finalDmg;

      // 装备吸血
      if (equipLifeStealPct > 0 && pHit.damage > 0) {
        const equipSteal = Math.max(1, Math.floor(pHit.damage * equipLifeStealPct / 100));
        playerHp = Math.min(p.maxHp, playerHp + equipSteal);
        if (round <= 6) log.push({ text: `🩸 装备吸血 +${equipSteal} HP`, type: 'heal' });
      }
      // 血统吸血
      if (isVampire) {
        const steal = Math.max(1, Math.floor(pHit.damage * 0.1));
        playerHp = Math.min(p.maxHp, playerHp + steal);
        log.push({ text: `🩸 吸血 +${steal} HP`, type: 'heal' });
      }

      // ── 敌人特性：荆棘反伤 ──
      if ((enemy.traits || []).includes('thorns') && pHit.damage > 0) {
        const thornDmg = Math.max(1, Math.floor(pHit.damage * 0.15));
        playerHp -= thornDmg;
        if (round <= 6 || i === 0) log.push({ text: `🌿 荆棘反弹 ${thornDmg}！`, type: 'reflect' });
      }
      // ── 精英词缀: 荆棘反伤 ──
      // ── 精英词缀: 护盾吸收 ──
      if (eliteShield > 0 && pHit.damage > 0) {
        const absorbed = Math.min(eliteShield, pHit.damage);
        eliteShield -= absorbed;
        enemyHp += absorbed;
        if (round <= 4) log.push({ text: `🔷 护盾吸收 ${absorbed}！剩余 ${eliteShield}`, type: 'affix_warning' });
      }
      // ── 精英词缀: 格挡 ──
      if (eliteFx && eliteFx.blockEveryN > 0 && round % eliteFx.blockEveryN === 0 && pHit.damage > 0) {
        const blockAmt = Math.floor(pHit.damage * 0.7);
        enemyHp += blockAmt;
        if (round <= 6) log.push({ text: `🛡 精英格挡！减免 ${blockAmt}`, type: 'affix_warning' });
      }
      // ── 精英词缀: 荆棘反伤 ──
      if (eliteFx && eliteFx.thornPercent > 0 && pHit.damage > 0 && playerHp > 0) {
        const thornDmg = Math.max(1, Math.floor(pHit.damage * eliteFx.thornPercent));
        playerHp -= thornDmg;
        if (round <= 6 || i === 0) log.push({ text: `🌵 荆棘反伤 ${thornDmg}！`, type: 'affix_damage' });
      }
      if (affix && affix.reflectPct && pHit.damage > 0) {
        const affixThornDmg = Math.max(1, Math.floor(pHit.damage * affix.reflectPct));
        playerHp -= affixThornDmg;
        if (round <= 6 || i === 0) log.push({ text: `🌿 【${affix.name}】反刺 ${affixThornDmg}！`, type: 'affix_damage' });
      }

      // ── 敌人特性：护盾（前2回合减伤50%） ──
      if ((enemy.traits || []).includes('shield') && round <= 2 && pHit.damage > 0) {
        const shieldRestore = Math.floor(pHit.damage * 0.5);
        enemyHp += shieldRestore;
        if (i === 0) log.push({ text: `🛡 护盾减免 ${shieldRestore}！`, type: 'enemy_shield' });
      }
    }

    } // end of !_skipPlayerAttack physical attack block

    // ── 道法法术 ── (also skip if defending)
    if (!_skipPlayerAttack && isDaoist && playerMana >= spellCost && enemyHp > 0) {
      const spell = calcSpellDamage({ atk: pAtk, crt: pCrt }, enemy);
      enemyHp -= spell.damage;
      playerMana -= spellCost;
      log.push({
        text: `🔥 道法·灵咒 → ${enemy.name} ${spell.damage}${spell.isCrit ? ' 暴击！' : ''} (消耗${spellCost}法力)`,
        type: 'spell',
      });
    }

    // ── 火芯片灼烧（共鸣加成） ──
    if (chipFx.burnDmg > 0 && enemyHp > 0) {
      const burnFinal = resonanceDotMult > 1.0 ? Math.floor(chipFx.burnDmg * resonanceDotMult) : chipFx.burnDmg;
      enemyHp -= burnFinal;
      log.push({ text: `🔥 灼烧 ${burnFinal}${resonanceDotMult > 1.0 ? ' (共鸣强化)' : ''}`, type: 'burn' });
    }

    // ── 天赋：节奏打击（每N回合额外一击） ──
    if (talentFx.rhythmStrike > 0 && round % talentFx.rhythmStrike === 0 && enemyHp > 0) {
      const rhythmHit = calcDamage(
        { atk: Math.floor(pAtk * berserkMult), crt: pCrt, geneLock: p.geneLock },
        { ...enemy, def: bossPhases ? effectiveEnemyDef : enemy.def },
        p.weapon?.damageType || DAMAGE_TYPE.PHYSICAL
      );
      enemyHp -= rhythmHit.damage;
      log.push({ text: `⚔ 节奏打击！额外攻击 ${rhythmHit.damage}${rhythmHit.isCrit ? ' 暴击！' : ''}`, type: 'critical' });
    }

    if (enemyHp <= 0) break;

    // ── 遗物：敌人意图揭示 ──
    if (relicFx.enemyIntentReveal && round <= 8) {
      try {
        const intent = getEnemyIntent(enemy, round, enemyHp, enemyMaxHp);
        if (intent && intent.text) {
          log.push({ text: '🔮 洞察之眼：' + intent.text, type: 'relic_buff' });
        }
      } catch {}
    }

    // ── 敌人回合：检查眩晕/冻结 ──
    let enemyStunned = (combatState.statusEffects?.enemy || []).some(
      e => e.type === STATUS_EFFECT.STUN || e.type === STATUS_EFFECT.FREEZE
    );
    // 元素共鸣眩晕概率
    if (!enemyStunned && resonanceStunChance > 0 && seededRandom() < resonanceStunChance) {
      enemyStunned = true;
      if (round <= 8) log.push({ text: `❄ 冻结思维！${enemy.name}被冻结！`, type: 'control' });
    }

    if (!enemyStunned) {
      // ── Boss 特殊技能 ──
      if (bossPhases && currentPhaseIdx >= 0) {
        const phase = bossPhases[currentPhaseIdx];
        if (shouldUseBossSpecial(phase, round, bossSpecialLastUsed)) {
          const special = calcBossSpecialDamage(effectiveEnemyAtk, phase.specialMove);
          bossSpecialLastUsed = round;
          let totalSpecialDmg = special.damage;
          // 多段攻击
          if (special.hits) totalSpecialDmg = Math.floor(special.damage / special.hits) * special.hits;
          // 天赋 lastStand 减伤
          if (talentFx.lastStand && playerHp < p.maxHp * talentFx.lastStand.threshold) {
            totalSpecialDmg = Math.floor(totalSpecialDmg * (1 - talentFx.lastStand.dmgReduce));
          }
          const _finalBossSpecialDmg = _defendActive ? Math.floor(totalSpecialDmg * 0.5) : totalSpecialDmg;
          playerHp -= _finalBossSpecialDmg;
          log.push({ text: `💥 ${special.name}！→ 郑吒 ${_finalBossSpecialDmg}${_defendActive ? ' (🛡减半)' : ''}`, type: 'boss_special' });
          // 自伤
          if (special.selfDmg) {
            const selfHurt = Math.floor(enemyMaxHp * special.selfDmg);
            enemyHp -= selfHurt;
            log.push({ text: `🩸 ${enemy.name}自伤 ${selfHurt}`, type: 'enemy_hurt' });
          }
          // 吸血
          if (special.healAmount) {
            enemyHp = Math.min(enemyMaxHp, enemyHp + special.healAmount);
            log.push({ text: `💚 ${enemy.name}恢复 ${special.healAmount}`, type: 'enemy_heal' });
          }
          if (playerHp <= 0 && talentFx.deathSave && !deathSaveUsed) {
            deathSaveUsed = true;
            playerHp = 1;
            log.push({ text: `🌟 天赋【重生】发动！保留1HP！`, type: 'talent_save' });
          }
          // 天赋：钢铁意志(20%概率存活)
          if (playerHp <= 0 && perkFx.deathResist > 0 && !perkDeathResistUsed && seededRandom() < perkFx.deathResist) {
            perkDeathResistUsed = true;
            playerHp = 1;
            log.push({ text: '🌟 钢铁意志！以不屈之心存活！(1HP)', type: 'talent_save' });
          }
          // 遗物：凤凰之羽(死亡拯救)
          if (playerHp <= 0 && relicFx.deathSaveHpPct > 0 && !deathSaveUsed) {
            deathSaveUsed = true;
            playerHp = Math.max(1, Math.floor(p.maxHp * relicFx.deathSaveHpPct));
            log.push({ text: `🔥 凤凰之羽发动！HP恢复至${playerHp}！`, type: 'relic_save' });
          }
          if (playerHp <= 0) break;
        }
      }

      // ── 天赋：闪避 ──
      const dodgeRoll = seededRandom();
      if (talentFx.dodgeChance > 0 && dodgeRoll < talentFx.dodgeChance) {
        log.push({ text: `💨 天赋闪避！躲开了 ${enemy.name} 的攻击`, type: 'dodge' });
      } else {



      // ── 敌人攻击（含狂怒加成） ──
      const eHit = calcDamage(
        { atk: Math.floor((bossPhases ? effectiveEnemyAtk : enemyEffAtk) * enemyEnrageMult), crt: enemy.crt || 0 },
        { def: pDef, res: p.res || 0 },
        enemy.damageType || DAMAGE_TYPE.PHYSICAL,
        0
      );

      // 检查玩家闪避（simulation_mind效果）
      const dodgeBuff = (combatState.statusEffects?.player || []).find(
        e => e.type === STATUS_EFFECT.BUFF_DEF && e.value >= 100
      );
      if (dodgeBuff) {
        log.push({ text: `🌀 模拟思维预判！闪避了 ${enemy.name} 的攻击`, type: 'dodge' });
      } else {
        // 防御姿态减伤
        const _actualEnemyDmg = _defendActive ? Math.floor(eHit.damage * 0.5) : eHit.damage;
        playerHp -= _actualEnemyDmg;
        if (_actualEnemyDmg > 0) {
          const _defendLabel = _defendActive ? ' (🛡减半)' : '';
          log.push({
            text: `${enemy.name} → 郑吒 ${_actualEnemyDmg}${eHit.isCrit ? ' 暴击！' : ''}${_defendLabel}`,
            type: 'enemy_attack',
          });
          // 附魔反伤
          if (enchantFx.reflectPct > 0 && _actualEnemyDmg > 0) {
            const enchReflectDmg = Math.max(1, Math.floor(_actualEnemyDmg * enchantFx.reflectPct / 100));
            enemyHp -= enchReflectDmg;
            if (round <= 4) log.push({ text: '✨ 附魔反弹 ' + enchReflectDmg, type: 'buff' });
          }
          // ── NG+ 变异器: 幻痛 ──
          if (getActiveMutators().some(m => m.id === 'phantom_pain') && seededRandom() < 0.10) {
            const phantomDmg = eHit.damage;
            playerHp -= phantomDmg;
            log.push({ text: `💀 幻痛！额外 ${phantomDmg} 伤害`, type: 'affix_damage' });
          }
        }
      }

      // ── 防御反击（含天赋强化） ──
      {
        let counterChance = 0.2;
        let counterPct = 0.3;
        if (perkFx.counterDefend > 0 && _defendActive) {
          counterChance = perkFx.counterDefend; // 防御时100%反击
          counterPct = perkFx.counterDmgPct || 0.5;
        } else if (perkFx.counterBase > 0 && !_defendActive) {
          counterChance = perkFx.counterBase; // 非防御时20%反击
          counterPct = perkFx.counterDmgPct || 0.5;
        }
        if ((_defendActive || perkFx.counterBase > 0) && seededRandom() < counterChance && enemyHp > 0) {
          const counterDmg = Math.max(1, Math.floor(pAtk * counterPct));
          enemyHp -= counterDmg;
          _totalDmgDealt += counterDmg;
          log.push({ text: '🛡⚔ ' + (_defendActive ? '防御' : '天赋') + '反击！' + counterDmg, type: 'reflect' });
        }
      }

      // ── 天赋：格挡 ──
      let blocked = false;
      if (talentFx.blockChance > 0 && !dodgeBuff && seededRandom() < talentFx.blockChance) {
        const blockAmt = Math.floor(eHit.damage * talentFx.blockReduce);
        playerHp += blockAmt; // 返还已扣除的部分
        blocked = true;
        log.push({ text: `🛡 格挡！减免 ${blockAmt} 伤害`, type: 'block' });
        // 格挡反击
        if (talentFx.blockCounter > 0 && enemyHp > 0) {
          const counterDmg = Math.max(1, Math.floor(eHit.damage * talentFx.blockCounter));
          enemyHp -= counterDmg;
          log.push({ text: `⚔ 格挡反击 ${counterDmg}`, type: 'reflect' });
        }
      }

      // ── 天赋：最后防线减伤 ──
      if (talentFx.lastStand && !dodgeBuff && !blocked && playerHp > 0 && playerHp < p.maxHp * talentFx.lastStand.threshold) {
        const lsReduce = Math.floor(eHit.damage * talentFx.lastStand.dmgReduce);
        playerHp += lsReduce;
        if (round <= 6) log.push({ text: `🌟 最后防线减伤 ${lsReduce}`, type: 'buff' });
      }

      // ── 天赋：死亡保护 ──
      if (playerHp <= 0 && talentFx.deathSave && !deathSaveUsed) {
        deathSaveUsed = true;
        playerHp = 1;
        log.push({ text: `🌟 天赋【重生】发动！保留1HP！`, type: 'talent_save' });
      }
      // ── 天赋：钢铁意志 ──
      if (playerHp <= 0 && perkFx.deathResist > 0 && !perkDeathResistUsed && seededRandom() < perkFx.deathResist) {
        perkDeathResistUsed = true;
        playerHp = 1;
        log.push({ text: '🌟 钢铁意志发动！保留1HP！', type: 'talent_save' });
      }
      // ── 遗物：凤凰之羽 ──
      if (playerHp <= 0 && relicFx.deathSaveHpPct > 0 && !deathSaveUsed) {
        deathSaveUsed = true;
        playerHp = Math.max(1, Math.floor(p.maxHp * relicFx.deathSaveHpPct));
        log.push({ text: `🔥 凤凰之羽！HP恢复至${playerHp}！`, type: 'relic_save' });
      }

      // ── 天赋：受暴击减伤 ──
      if (eHit.isCrit && talentFx.critDmgReduce > 0 && !dodgeBuff) {
        const reduce = Math.floor(eHit.damage * talentFx.critDmgReduce);
        playerHp += reduce;
      }

      // ── 天赋：势不可挡(连续攻击后必暴击) ──
      perkConsecutiveHits++;

      // ── 遗物：反伤处理 ──
      if (relicFx.reflectChance > 0 && eHit.damage > 0 && seededRandom() < relicFx.reflectChance && enemyHp > 0) {
        const relicReflect = Math.max(1, Math.floor(eHit.damage * relicFx.reflectPct));
        enemyHp -= relicReflect;
        _totalDmgDealt += relicReflect;
        if (round <= 6) log.push({ text: `🪞 镜之碎片反弹 ${relicReflect}`, type: 'reflect' });
      }
      // ── 遗物：减伤 ──
      if (relicFx.flatDmgReduction > 0 && eHit.damage > 0) {
        const dmgReduce = Math.floor(eHit.damage * relicFx.flatDmgReduction);
        playerHp += dmgReduce; // 返还已扣除的部分
        if (round <= 4) log.push({ text: `💎 遗物减伤 ${dmgReduce}`, type: 'relic_buff' });
      }
      // ── 天赋：自适应护甲 ──
      if (perkFx.adaptiveResist > 0 && eHit.damage > 0) {
        const dmgType = enemy.damageType || 'physical';
        if (!perkAdaptiveResists[dmgType]) perkAdaptiveResists[dmgType] = 0;
        const cap = perkFx.adaptiveResistCap || 0.5;
        if (perkAdaptiveResists[dmgType] < cap) {
          perkAdaptiveResists[dmgType] = Math.min(cap, perkAdaptiveResists[dmgType] + perkFx.adaptiveResist);
          const resistPct = Math.floor(perkAdaptiveResists[dmgType] * 100);
          if (round <= 8) log.push({ text: `🛡 自适应护甲：${dmgType}抗性${resistPct}%`, type: 'buff' });
        }
        // 应用减伤
        const adaptReduce = Math.floor(eHit.damage * perkAdaptiveResists[dmgType]);
        playerHp += adaptReduce;
      }
      // ── 遗物：自动闪避 ──
      if (relicFx.autoEvadeInterval > 0 && relicAutoEvadeCounter % relicFx.autoEvadeInterval === 0 && eHit.damage > 0) {
        playerHp += eHit.damage; // 返还全部伤害
        log.push({ text: '💨 遗物自动闪避！', type: 'dodge' });
      }
      // ── 技能反弹效果(铁壁等) ──
      {
        const reflectEff = (combatState.statusEffects?.player || []).find(e => e.type === 'reflect');
        if (reflectEff && eHit.damage > 0 && enemyHp > 0) {
          const skillReflect = Math.max(1, Math.floor(eHit.damage * reflectEff.value / 100));
          enemyHp -= skillReflect;
          _totalDmgDealt += skillReflect;
          log.push({ text: `🛡 铁壁反弹 ${skillReflect}！`, type: 'reflect' });
        }
      }
      // ── 武修反伤 ──
      if (isMartial && !dodgeBuff && eHit.damage > 0 && enemyHp > 0) {
        const reflect = Math.max(1, Math.floor(eHit.damage * 0.15));
        enemyHp -= reflect;
        log.push({ text: `🛡 武修反伤 ${reflect}`, type: 'reflect' });
      }

      // ── 精英词缀: 连击 ──
      if (eliteFx && eliteFx.doubleStrikeChance > 0 && seededRandom() < eliteFx.doubleStrikeChance && enemyHp > 0 && playerHp > 0) {
        const dsHit = calcDamage(
          { atk: Math.floor((bossPhases ? effectiveEnemyAtk : enemyEffAtk) * enemyEnrageMult), crt: enemy.crt || 0 },
          { def: pDef, res: p.res || 0 },
          enemy.damageType || DAMAGE_TYPE.PHYSICAL, 0
        );
        const _dsDmg = _defendActive ? Math.floor(dsHit.damage * 0.5) : dsHit.damage;
        playerHp -= _dsDmg;
        if (_dsDmg > 0) log.push({ text: `⚡ 精英连击！${_dsDmg}${_defendActive ? ' (🛡减半)' : ''}`, type: 'enemy_attack' });
      }
      // ── 精英词缀: 嗜血 ──
      if (eliteFx && eliteFx.lifestealRatio > 0 && eHit && eHit.damage > 0 && enemyHp > 0) {
        const eliteVamp = Math.max(1, Math.floor(eHit.damage * eliteFx.lifestealRatio));
        enemyHp = Math.min(enemyMaxHp, enemyHp + eliteVamp);
        if (round <= 6) log.push({ text: `🩸 精英吸血 +${eliteVamp}`, type: 'enemy_heal' });
      }
      // ── 敌人特性：迅捷（20%双击） ──
      if ((enemy.traits || []).includes('swift') && seededRandom() < 0.20 && enemyHp > 0 && playerHp > 0) {
        const eHit2 = calcDamage(
          { atk: Math.floor((bossPhases ? effectiveEnemyAtk : enemyEffAtk) * enemyEnrageMult), crt: enemy.crt || 0 },
          { def: pDef, res: p.res || 0 },
          enemy.damageType || DAMAGE_TYPE.PHYSICAL, 0
        );
        const _swiftDmg = _defendActive ? Math.floor(eHit2.damage * 0.5) : eHit2.damage;
        playerHp -= _swiftDmg;
        if (_swiftDmg > 0) log.push({ text: `⚡ ${enemy.name}二连击！${_swiftDmg}${_defendActive ? ' (🛡减半)' : ''}`, type: 'enemy_attack' });
      }

      // ── 敌人特性：吸血 ──
      if ((enemy.traits || []).includes('vampiric') && eHit && eHit.damage > 0 && enemyHp > 0) {
        const vampHeal = Math.max(1, Math.floor(eHit.damage * 0.20));
        enemyHp = Math.min(enemyMaxHp, enemyHp + vampHeal);
        if (round <= 6) log.push({ text: `🩸 ${enemy.name}吸血 +${vampHeal}`, type: 'enemy_heal' });
      }

      // ── 敌人特性：剧毒 ──
      if ((enemy.traits || []).includes('poisonous') && playerHp > 0) {
        const _rawPoisonDmg = Math.max(1, Math.floor(p.maxHp * 0.03));
        const poisonDmg = _defendActive ? Math.max(1, Math.floor(_rawPoisonDmg * 0.75)) : _rawPoisonDmg;
        playerHp -= poisonDmg;
        if (round <= 6) log.push({ text: `☠ 中毒！-${poisonDmg} HP${_defendActive ? ' (🛡减轻)' : ''}`, type: 'poison' });
      }

      } // close talent dodge else
    } else {
      log.push({ text: `💫 ${enemy.name} 处于控制状态，无法行动！`, type: 'control' });
    }

    // ── 回合结束：冷却递减 ──
    tickCooldowns(combatState);
  }

  // ── 敌人特性：不死（首次击杀恢复20%HP） ──
  if (enemyHp <= 0 && (enemy.traits || []).includes('undying') && !enemy._revived) {
    enemy._revived = true;
    const reviveHp = Math.floor(enemyMaxHp * 0.20);
    enemyHp = reviveHp;
    log.push({ text: `💀 ${enemy.name}从死亡中复活！HP恢复至${reviveHp}`, type: 'enemy_revive' });
    // 继续战斗 — 简化处理：额外几回合
    for (let extraRound = 0; extraRound < 10 && enemyHp > 0 && playerHp > 0; extraRound++) {
      const pExtra = calcDamage(
        { atk: pAtk, crt: pCrt, geneLock: p.geneLock },
        { ...enemy, def: bossPhases ? effectiveEnemyDef : enemy.def },
        p.weapon?.damageType || DAMAGE_TYPE.PHYSICAL
      );
      enemyHp -= pExtra.damage;
      if (enemyHp <= 0) break;
      const eExtra = calcDamage(
        { atk: bossPhases ? effectiveEnemyAtk : enemyEffAtk, crt: enemy.crt || 0 },
        { def: pDef, res: p.res || 0 },
        enemy.damageType || DAMAGE_TYPE.PHYSICAL, 0
      );
      playerHp -= eExtra.damage;
    }
  }

  const victory = enemyHp <= 0;

  if (victory) {
    p.hp = playerHp;
    p.mana = playerMana;

    // 酸血反噬
    if (enemy.acidBlood && enemy.acidBlood > 0) {
      let acidDmg = enemy.acidBlood;
      const hasAcidResist = (p.chips || []).some(c => c.special === 'acid_resist');
      if (hasAcidResist) {
        acidDmg = Math.floor(acidDmg * 0.5);
        log.push({ text: `🛡 抗酸芯片减免酸血伤害`, type: 'buff' });
      }
      if (acidDmg > 0) {
        p.hp = Math.max(1, p.hp - acidDmg);
        log.push({ text: `☠ 酸血反噬 ${acidDmg}！`, type: 'burn' });
      }
    }

    gameState.stats.enemiesKilled++;
    // ── 精英词缀: 死亡效果 ──
    if (eliteFx && enemy._eliteTier) {
      try { recordEliteKill(enemy._eliteTier); } catch {}
      // 爆裂词缀
      if (eliteFx.onDeathDamagePercent > 0) {
        const deathDmg = Math.max(1, Math.floor(p.maxHp * eliteFx.onDeathDamagePercent));
        p.hp = Math.max(1, (p.hp || playerHp) - deathDmg);
        playerHp = p.hp;
        log.push({ text: `💥 精英爆裂！-${deathDmg} HP`, type: 'affix_damage' });
      }
      // 诅咒词缀
      if (eliteFx.onDefeatDebuff) {
        try {
          const db = eliteFx.onDefeatDebuff;
          
          addStatusEffect('atk_debuff', Math.floor(p.atk * (db.percent || -0.1)), db.duration || 3, db.name || '诅咒');
          log.push({ text: `👁 ${db.name || '诅咒'}！ATK降低${db.duration || 3}场`, type: 'affix_warning' });
        } catch {}
      }
    }
    if (enemy.bossId || enemy.type === 'boss') gameState.stats.bossesKilled++;
    gameState.stats.damageDealt += enemy.hp;

    const rewards = enemy.rewards || {};
    if (rewards.exp) {
      // 天赋/遗物经验加成
      const expMult = 1 + (perkFx.expMultiplier || 0) + (relicFx.expBonus || 0);
      const boostedExp = Math.floor(rewards.exp * expMult);
      gameState.addExp(boostedExp);
      if (expMult > 1) rewards._expBoost = boostedExp - rewards.exp;
      rewards.exp = boostedExp;
    }
    if (rewards.gold) {
      // NG+ 变异器: 诅咒黄金 — 拾取战斗金币双倍但扣1HP
      if (getActiveMutators().some(m => m.id === 'cursed_gold')) {
        rewards.gold = Math.floor(rewards.gold * 2);
        p.hp = Math.max(1, p.hp - 1);
      }
      p.gold += rewards.gold; gameState.stats.goldEarned += rewards.gold;
    }
    if (rewards.rewardPoints) p.rewardPoints += rewards.rewardPoints;

    // ── 战利品掉落系统 ──
    try {
      const loot = generateLoot(enemy, gameState.chapter || 1, { guaranteeEpic: relicFx.guaranteeEpicReward || false });
      if (loot.length > 0) {
        _lootDrops = loot;
        const lootLogs = formatLootLog(loot);
        for (const ll of lootLogs) log.push(ll);
        applyLoot(loot, p, gameState);
      }
    } catch {}

    // ── 天赋：击杀回血 ──
    if (talentFx.killHeal > 0) {
      const killHealAmt = Math.max(1, Math.floor(p.maxHp * talentFx.killHeal));
      p.hp = Math.min(p.maxHp, playerHp + killHealAmt);
      playerHp = p.hp;
      log.push({ text: `💚 天赋击杀回血 +${killHealAmt}`, type: 'heal' });
    }
    // ── 天赋：嗜血本能 ──
    if (perkFx.killBonusAtk > 0) {
      const cap = perkFx.killBonusAtkCap || 25;
      if (perkKillBonusAtk < cap) {
        perkKillBonusAtk = Math.min(cap, perkKillBonusAtk + perkFx.killBonusAtk);
        log.push({ text: `🩸 嗜血本能！ATK临时+${perkKillBonusAtk}`, type: 'buff' });
      }
    }
    // ── 天赋：灵魂收割 ──
    if (perkFx.killHealPct > 0) {
      const soulHeal = Math.max(1, Math.floor(p.maxHp * perkFx.killHealPct));
      playerHp = Math.min(p.maxHp, playerHp + soulHeal);
      p.hp = playerHp;
      log.push({ text: `💀 灵魂收割！+${soulHeal}HP`, type: 'heal' });
    }
    if (perkFx.killManaRestorePct > 0 && p.maxMana > 0) {
      const manaRestore = Math.max(1, Math.floor(p.maxMana * perkFx.killManaRestorePct));
      p.mana = Math.min(p.maxMana, (p.mana || 0) + manaRestore);
      playerMana = p.mana;
      log.push({ text: `💀 灵魂收割！+${manaRestore}MP`, type: 'heal' });
    }
    // ── 遗物：击杀回血 ──
    if (relicFx.killHealPct > 0) {
      const relicKillHeal = Math.max(1, Math.floor(p.maxHp * relicFx.killHealPct));
      playerHp = Math.min(p.maxHp, playerHp + relicKillHeal);
      p.hp = playerHp;
      log.push({ text: `💎 遗物击杀回血 +${relicKillHeal}`, type: 'heal' });
    }
    // ── 遗物：连杀记录 ──
    relicKillStreak++;
    // ── 天赋：基因锁充能加速 ──
    if (perkFx.geneLockChargeBonus > 0) {
      const bonusCharge = Math.floor((enemy.geneLockCharge || 5) * perkFx.geneLockChargeBonus);
      p.geneLockCharge += bonusCharge;
      log.push({ text: `⚡ 天赋基因锁充能加速 +${bonusCharge}`, type: 'geneLock' });
    }

    // ── 基因锁充能 + 进阶检测 ──
    if (p.geneLock < GENE_LOCK.STAGE_4) {
      const chargeGain = enemy.geneLockCharge || 5;
      p.geneLockCharge += chargeGain;
      log.push({ text: `⚡ 基因锁充能 +${chargeGain} (${p.geneLockCharge})`, type: 'geneLock' });

      // 检测是否可以进阶
      const advCheck = checkGeneLockAdvancement(p);
      if (advCheck.advanced) {
        const advResult = advanceGeneLock(p);
        if (advResult.success) {
          log.push({ text: ``, type: 'separator' });
          log.push({ text: `🧬 ═══ 基因锁突破！═══`, type: 'geneLock_advance' });
          log.push({ text: `🧬 ${advResult.message}`, type: 'geneLock_advance' });
          const b = advResult.bonuses;
          const bonusTexts = [];
          if (b.atk) bonusTexts.push(`ATK+${b.atk}`);
          if (b.def) bonusTexts.push(`DEF+${b.def}`);
          if (b.spd) bonusTexts.push(`SPD+${b.spd}`);
          if (b.maxHp) bonusTexts.push(`MaxHP+${b.maxHp}`);
          if (b.crt) bonusTexts.push(`CRT+${b.crt}`);
          if (b.maxMana) bonusTexts.push(`MaxMana+${b.maxMana}`);
          log.push({ text: `🧬 永久加成：${bonusTexts.join(' / ')}`, type: 'geneLock_advance' });
          log.push({ text: `🧬 ═══════════════════`, type: 'geneLock_advance' });

          // 更新当前战斗中的HP（进阶时回满）
          playerHp = p.hp;
          p.hp = playerHp;
        }
      }
    }

    // 法力自然恢复
    if (p.activeBloodline === BLOODLINE.DAOIST && p.maxMana > 0) {
      const manaRegen = Math.min(5, p.maxMana - p.mana);
      if (manaRegen > 0) {
        p.mana += manaRegen;
        log.push({ text: `✦ 道法冥想恢复 +${manaRegen} 法力`, type: 'heal' });
      }
    }

    log.push({ text: `击败了 ${enemy.name}！`, type: 'victory' });
    // 同伴胜利评语
    try {
      const closeCall = playerHp < p.maxHp * 0.3;
      const isBoss = !!enemy.bossId;
      const comment = getVictoryComment(isBoss, closeCall);
      log.push({ text: `💬 ${comment}`, type: 'companion_dialogue' });
    } catch {}
    if (rewards.exp) log.push({ text: `+${rewards.exp} 经验`, type: 'reward' });
    if (rewards.gold) log.push({ text: `+${rewards.gold} 金币`, type: 'reward' });
    if (rewards.rewardPoints) log.push({ text: `+${rewards.rewardPoints} 奖励点`, type: 'reward' });

    eventBus.emit('combat:victory', { enemy, rewards, log });
  } else {
    // ── 同伴救援机会（高关系限定）──
    let companionRescue = false;
    try {
      const aliveComps = (gameState.companions || []).filter(c => c.alive);
      const bondCompanions = aliveComps.filter(c => 
        (gameState.relationships?.[c.id] || 0) >= 71
      );
      // 羁绊同伴有35%概率救援（最多尝试3次）
      for (const bc of bondCompanions.slice(0, 3)) {
        if (seededRandom() < 0.35) {
          companionRescue = true;
          const profile = COMPANION_PROFILES?.[bc.id];
          const name = profile?.name || bc.name || bc.id;
          playerHp = Math.max(1, Math.floor(p.maxHp * 0.15));
          p.hp = playerHp;
          log.push({ text: ``, type: 'separator' });
          log.push({ text: `✦ ${name}的羁绊之力发动！`, type: 'companion_rescue' });
          log.push({ text: `💬 ${name}：「我不会让你倒下的！」`, type: 'companion_dialogue', color: '#ffaa00' });
          log.push({ text: `HP恢复至 ${playerHp}！`, type: 'heal' });
          // 继续战斗几回合
          for (let extra = 0; extra < 5 && enemyHp > 0 && playerHp > 0; extra++) {
            const pRes = calcDamage(
              { atk: Math.floor(pAtk * 1.2), crt: pCrt + 10, geneLock: p.geneLock },
              { ...enemy, def: bossPhases ? effectiveEnemyDef : enemy.def },
              p.weapon?.damageType || DAMAGE_TYPE.PHYSICAL
            );
            enemyHp -= pRes.damage;
            log.push({ text: `⚔ 绝地反击！${pRes.damage}${pRes.isCrit ? ' 暴击！' : ''}`, type: 'critical' });
            if (enemyHp <= 0) break;
            const eRes = calcDamage(
              { atk: bossPhases ? effectiveEnemyAtk : enemyEffAtk, crt: enemy.crt || 0 },
              { def: Math.floor(pDef * 1.3), res: p.res || 0 },
              enemy.damageType || DAMAGE_TYPE.PHYSICAL, 0
            );
            playerHp -= eRes.damage;
          }
          if (enemyHp <= 0) {
            p.hp = Math.max(1, playerHp);
            gameState.stats.enemiesKilled++;
            const rewards = enemy.rewards || {};
            if (rewards.exp) {
      const expMult2 = 1 + (perkFx.expMultiplier || 0) + (relicFx.expBonus || 0);
      const boostedExp2 = Math.floor(rewards.exp * expMult2);
      gameState.addExp(boostedExp2);
    }
            if (rewards.gold) {
              if (getActiveMutators().some(m => m.id === 'cursed_gold')) {
                rewards.gold = Math.floor(rewards.gold * 2);
                p.hp = Math.max(1, p.hp - 1);
              }
              p.gold += rewards.gold; gameState.stats.goldEarned += rewards.gold;
            }
            log.push({ text: `✦ 在${name}的支援下击败了 ${enemy.name}！`, type: 'victory' });
            eventBus.emit('combat:victory', { enemy, rewards, log });
            return { victory: true, log, rounds: round, companionRescue: true };
          }
          p.hp = Math.max(0, playerHp);
          break;
        }
      }
    } catch {}
    
    if (!companionRescue || p.hp <= 0) {
      p.hp = 0;
      p.mana = playerMana;
      log.push({ text: `被 ${enemy.name} 击败了...`, type: 'defeat' });
      eventBus.emit('combat:defeat', { enemy, log });
      gameState.stats.deathCount++;
      eventBus.emit('player:death', {});
    }
  }

  // Compute stats from log
  // 从日志回补统计（仅当内联追踪未覆盖时补充）
  if (_totalDmgDealt === 0 && _totalDmgTaken === 0) {
    for (const entry of log) {
      if (entry.type === 'attack' || entry.type === 'player_attack' || entry.type === 'critical' || entry.type === 'skill_damage') {
        _totalDmgDealt += (entry.damage || 0);
        if (entry.type === 'critical' || (entry.text && entry.text.includes('暴击'))) _critHits++;
      }
      if (entry.type === 'enemy_attack' || entry.type === 'damage_taken') {
        _totalDmgTaken += (entry.damage || 0);
      try { recordBlock(); } catch {}
      }
    }
  }
  // 回退计算：如果日志无damage字段，用HP差推算
  if (_totalDmgDealt === 0 && victory) {
    _totalDmgDealt = enemy.hp; // 至少打完了enemy全部HP
  }
  if (_totalDmgTaken === 0 && playerHp < p.maxHp) {
    _totalDmgTaken = p.maxHp - Math.max(0, playerHp);
  }
  
  // ── Boss 终局对话 ──
  if (enemy.bossId) {
    try {
      if (enemyHp <= 0) {
        const defeatLines = getBossDefeatLines(enemy.bossId);
        if (defeatLines) {
          log.push({ text: '', type: 'separator' });
          for (const line of (Array.isArray(defeatLines) ? defeatLines : [defeatLines])) {
            if (line) log.push({ text: line, type: 'boss_dialogue' });
          }
        }
      } else if (playerHp <= 0) {
        const killLine = getBossKillPlayerLine(enemy.bossId);
        if (killLine) {
          log.push({ text: '', type: 'separator' });
          log.push({ text: '「' + killLine + '」', type: 'boss_dialogue' });
        }
      }
    } catch {}
  }

  // 最终战报更新
  eventBus.emit('combat:log_update', { log: [...log], round, playerHp, enemyHp, playerMaxHp: p.maxHp, enemyMaxHp, playerMana, final: true, statusEffects: combatState.statusEffects, relicFx: relicFx || {}, perkFx: perkFx || {} });
  return { victory: enemyHp <= 0, log, rounds: round, totalDamageDealt: _totalDmgDealt, totalDamageTaken: _totalDmgTaken, critCount: _critHits, drops: _lootDrops };
}

// ── 有效属性计算 ──
const COMPANION_BONUSES = {
  zhang_jie: { atk: 2, def: 0 },
  zhan_lan: { atk: 0, def: 0, crt: 3 },
  li_xiaoyi: { atk: 1, def: 1 },
  mou_gang: { atk: 0, def: 3 },
  chuxuan: { atk: 0, def: 0, spd: 3 },
  lingdian: { atk: 3, def: 0, crt: 5 },
  bawang: { atk: 2, def: 2 },
  lishuaixi: { atk: 1, def: 0 },
};

function getCompanionBonuses(stat) {
  try {
    const gs = gameState;
    if (!gs?.companions) return 0;
    return gs.companions
      .filter(c => c.alive)
      .reduce((sum, c) => sum + (COMPANION_BONUSES[c.id]?.[stat] || 0), 0);
  } catch { return 0; }
}

// ── 关系加成：存活同伴的关系等级平均加成 ──
function getRelationshipMultiplier() {
  try {
    const gs = gameState;
    if (!gs?.companions || !gs.relationships) return 0;
    const alive = gs.companions.filter(c => c.alive);
    if (alive.length === 0) return 0;
    const totalBonus = alive.reduce((sum, c) => sum + getCompanionCombatBonus(c.id, gs.relationships), 0);
    let relMult = totalBonus / alive.length;
    // 业力同伴加成
    try {
      const km = getKarmaCombatModifiers();
      if (km.companionBonus) relMult *= (1 + km.companionBonus / 100);
    } catch {}
    return relMult;
  } catch { return 0; }
}

// ── 高关系同伴团队士气加成 ──
// 当3+同伴达到亲密以上时，额外提供团队士气
export function getTeamMoraleBonus() {
  try {
    const gs = gameState;
    if (!gs?.companions || !gs.relationships) return { atkPct: 0, defPct: 0, crtFlat: 0 };
    const alive = gs.companions.filter(c => c.alive);
    const highRel = alive.filter(c => (gs.relationships[c.id] || 0) >= 41); // 亲密+
    const bondCount = alive.filter(c => (gs.relationships[c.id] || 0) >= 71).length; // 羁绊
    
    if (highRel.length >= 3) {
      return {
        atkPct: 0.03 * highRel.length,  // 每个亲密+同伴+3% ATK
        defPct: 0.02 * highRel.length,  // 每个亲密+同伴+2% DEF
        crtFlat: bondCount * 2,          // 每个羁绊同伴+2% CRT
      };
    }
    return { atkPct: 0, defPct: 0, crtFlat: 0 };
  } catch { return { atkPct: 0, defPct: 0, crtFlat: 0 }; }
}

export function getEffectiveAtk(player) {
  let atk = player.atk;
  if (player.weapon) {
    atk += player.weapon.atk || 0;
    // 强化加成
    if (player.weapon.enhanceBonuses?.atk) atk += player.weapon.enhanceBonuses.atk;
    // 宝石加成
    for (const gem of player.weapon.gemSlots || []) {
      if (gem.stat === 'atk') atk += gem.value;
    }
  }
  atk += getCompanionBonuses('atk');
  // 天赋加成
  try {
    const te = getTalentEffects(gameState.talents);
    atk += te.atk || 0;
  } catch {}
  // 套装加成
  try {
    const sb = getActiveSetBonuses(player);
    atk += sb.atk || 0;
  } catch {}
  if (player.activeBloodline === BLOODLINE.VAMPIRE) atk += Math.floor(atk * 0.15);
  if (player.activeBloodline === BLOODLINE.ANCIENT_WU) atk += Math.floor(atk * 0.2);
  if (player.geneLockActive && player.geneLock > 0) {
    atk += Math.floor(atk * 0.2 * player.geneLock);
  }
  for (const chip of player.chips || []) {
    if (chip.stat === 'atk') atk += chip.value;
  }
  // 关系加成（百分比）
  const relMul = getRelationshipMultiplier();
  if (relMul !== 0) atk = Math.max(1, Math.floor(atk * (1 + relMul)));
  // 团队士气加成
  const morale = getTeamMoraleBonus();
  if (morale.atkPct > 0) atk = Math.max(1, Math.floor(atk * (1 + morale.atkPct)));
  // 状态效果修正
  try {
    const statusMods = getEffectModifiers();
    if (statusMods.atk) atk += statusMods.atk;
  } catch {}
  // 战术指令加成
  try {
    const orderFx = getOrderCombatEffect();
    if (orderFx.companionDmgMult && orderFx.companionDmgMult !== 1) {
      const companionAtk = Math.floor(atk * 0.1 * (orderFx.companionDmgMult - 1));
      atk += companionAtk;
    }
  } catch {}
  // 业力系统加成
  try {
    const karmaMods = getKarmaCombatModifiers();
    if (karmaMods.atkBonus) atk += karmaMods.atkBonus;
  } catch {}
  return atk;
}

export function getEffectiveDef(player) {
  let def = player.def;
  if (player.armor) {
    def += player.armor.def || 0;
    if (player.armor.enhanceBonuses?.def) def += player.armor.enhanceBonuses.def;
    for (const gem of player.armor.gemSlots || []) {
      if (gem.stat === 'def') def += gem.value;
    }
  }
  def += getCompanionBonuses('def');
  try {
    const te = getTalentEffects(gameState.talents);
    def += te.def || 0;
  } catch {}
  try {
    const sb = getActiveSetBonuses(player);
    def += sb.def || 0;
  } catch {}
  if (player.activeBloodline === BLOODLINE.MARTIAL) def += Math.floor(def * 0.2);
  if (player.geneLockActive && player.geneLock > 0) {
    def += Math.floor(def * 0.15 * player.geneLock);
  }
  for (const chip of player.chips || []) {
    if (chip.stat === 'def') def += chip.value;
  }
  // 关系加成（百分比）
  const relMulDef = getRelationshipMultiplier();
  if (relMulDef !== 0) def = Math.max(1, Math.floor(def * (1 + relMulDef)));
  // 团队士气加成
  const moraleDef = getTeamMoraleBonus();
  if (moraleDef.defPct > 0) def = Math.max(1, Math.floor(def * (1 + moraleDef.defPct)));
  // 状态效果修正
  try {
    const statusMods = getEffectModifiers();
    if (statusMods.def) def += statusMods.def;
  } catch {}
  // 业力系统加成
  try {
    const karmaMods = getKarmaCombatModifiers();
    if (karmaMods.defBonus) def += karmaMods.defBonus;
  } catch {}
  return def;
}

export function getEffectiveCrt(player) {
  let crt = player.crt || 0;
  if (player.weapon?.crt) crt += player.weapon.crt;
  if (player.accessory?.crt) crt += player.accessory.crt;
  crt += getCompanionBonuses('crt');
  try {
    const te = getTalentEffects(gameState.talents);
    crt += te.crt || 0;
  } catch {}
  try {
    const sb = getActiveSetBonuses(player);
    crt += sb.crt || 0;
  } catch {}
  for (const chip of player.chips || []) {
    if (chip.stat === 'crt') crt += chip.value;
  }
  // 团队士气CRT加成
  try { crt += getTeamMoraleBonus().crtFlat; } catch {}
  // 状态效果修正
  try {
    const statusMods = getEffectModifiers();
    if (statusMods.crt) crt += statusMods.crt;
  } catch {}
  // 业力系统加成
  try {
    const karmaMods = getKarmaCombatModifiers();
    if (karmaMods.critBonus) crt += karmaMods.critBonus;
  } catch {}

  return Math.min(crt, 100);
}

export function getEffectiveSpd(player) {
  let spd = player.spd || 0;
  if (player.weapon?.spd) spd += player.weapon.spd;
  spd += getCompanionBonuses('spd');
  if (player.armor?.spd) spd += player.armor.spd;
  if (player.accessory?.spd) spd += player.accessory.spd;
  try {
    const te = getTalentEffects(gameState.talents);
    spd += te.spd || 0;
  } catch {}
  try {
    const sb = getActiveSetBonuses(player);
    spd += sb.spd || 0;
  } catch {}
  for (const chip of player.chips || []) {
    if (chip.stat === 'spd') spd += chip.value;
  }
  // 状态效果修正
  try {
    const statusMods = getEffectModifiers();
    if (statusMods.spd) spd += statusMods.spd;
  } catch {}
  return spd;
}

export function getStatsBreakdown(player) {
  const breakdown = {
    atk: { base: player.atk, weapon: 0, bloodline: 0, geneLock: 0, chips: 0, total: 0 },
    def: { base: player.def, armor: 0, bloodline: 0, geneLock: 0, chips: 0, total: 0 },
  };

  if (player.weapon) breakdown.atk.weapon = player.weapon.atk || 0;
  if (player.armor) breakdown.def.armor = player.armor.def || 0;

  let atkWithWeapon = breakdown.atk.base + breakdown.atk.weapon;
  let defWithArmor = breakdown.def.base + breakdown.def.armor;
  if (player.activeBloodline === BLOODLINE.VAMPIRE) breakdown.atk.bloodline = Math.floor(atkWithWeapon * 0.15);
  if (player.activeBloodline === BLOODLINE.ANCIENT_WU) breakdown.atk.bloodline = Math.floor(atkWithWeapon * 0.2);
  if (player.activeBloodline === BLOODLINE.MARTIAL) breakdown.def.bloodline = Math.floor(defWithArmor * 0.2);

  if (player.geneLockActive && player.geneLock > 0) {
    breakdown.atk.geneLock = Math.floor((atkWithWeapon + breakdown.atk.bloodline) * 0.2 * player.geneLock);
    breakdown.def.geneLock = Math.floor((defWithArmor + breakdown.def.bloodline) * 0.15 * player.geneLock);
  }

  for (const chip of player.chips || []) {
    if (chip.stat === 'atk') breakdown.atk.chips += chip.value;
    if (chip.stat === 'def') breakdown.def.chips += chip.value;
  }

  breakdown.atk.companion = getCompanionBonuses('atk');
  breakdown.def.companion = getCompanionBonuses('def');

  breakdown.atk.total = breakdown.atk.base + breakdown.atk.weapon + breakdown.atk.bloodline + breakdown.atk.geneLock + breakdown.atk.chips + breakdown.atk.companion;
  breakdown.def.total = breakdown.def.base + breakdown.def.armor + breakdown.def.bloodline + breakdown.def.geneLock + breakdown.def.chips + breakdown.def.companion;

  return breakdown;
}
