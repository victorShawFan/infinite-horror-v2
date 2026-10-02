import { getActiveMutators } from './NewGamePlus.js';
// ═══════════════════════════════════════════════════════════════
// 战斗系统 — 魔塔式数值对撞 + 血统特技 + 芯片元素 + 速度双击
//            + 主动技能 + 状态效果 + 基因锁进阶
// ═══════════════════════════════════════════════════════════════

import { DAMAGE_TYPE, GENE_LOCK, BLOODLINE } from './constants.js';
import { eventBus } from './EventBus.js';
import { gameState } from './GameState.js';
import { checkGeneLockAdvancement, advanceGeneLock } from './GeneLockSystem.js';
import {
  getAvailableSkills, canUseSkill, useSkill,
  processStatusEffects, applyStatusEffect, tickCooldowns,
  STATUS_EFFECT
} from './SkillSystem.js';
import { getTalentEffects } from './TalentTree.js';
import { getEquipmentTotalStats, getActiveSetBonuses } from './EquipmentSystem.js';
import {
  getBossPhases, getCurrentPhase, applyPhaseModifiers,
  shouldUseBossSpecial, calcBossSpecialDamage, processEnemyTraits
} from './EnemyAbilitySystem.js';
import { calcElementalModifier, getPlayerActiveElements, getEnemyElement, checkElementalResonance, ELEMENT_INFO } from './ElementalSystem.js';
import { generateLoot, formatLootLog, applyLoot } from './LootSystem.js';
import { getCompanionCombatBonus } from './RelationshipSystem.js';
import { generateCombatDialogue, getVictoryComment } from './CompanionDialogue.js';
import { COMPANION_PROFILES } from './RelationshipSystem.js';

// ── 伤害计算 ──
export function calcDamage(attacker, defender, damageType = DAMAGE_TYPE.PHYSICAL, minDmg = 1) {
  let baseDmg = Math.max(minDmg, attacker.atk - defender.def);

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

  const critRoll = Math.random() * 100;
  const isCrit = critRoll < (attacker.crt || 0);
  if (isCrit) baseDmg = Math.floor(baseDmg * 1.8);

  if (defender.res && damageType !== DAMAGE_TYPE.PHYSICAL) {
    baseDmg = Math.max(1, Math.floor(baseDmg * (100 - defender.res) / 100));
  }

  return { damage: Math.max(minDmg, baseDmg), isCrit, isWeak };
}

// ── 法术伤害（道法血统, 忽视物防, 走法抗） ──
function calcSpellDamage(caster, target) {
  const spellPower = Math.floor(caster.atk * 0.8) + 5;
  const magicDef = target.res || 0;
  let dmg = Math.max(1, spellPower - Math.floor(magicDef * 0.3));
  const isCrit = Math.random() * 100 < (caster.crt || 0);
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
  const pAtk = getEffectiveAtk(player);
  const pDef = getEffectiveDef(player);
  const pSpd = getEffectiveSpd(player);
  const pCrt = getEffectiveCrt(player);
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
export function executeBattle(enemy) {
  const p = gameState.player;
  const preview = previewBattle(p, enemy);
  const log = [];

  if (!preview.canWin) {
    return { victory: false, log: [{ text: `${enemy.name}的防御太高了，无法造成有效伤害！`, type: 'danger' }] };
  }

  let enemyHp = enemy.hp;
  let playerHp = p.hp;
  let playerMana = p.mana || 0;
  let round = 0;
  const pAtk = getEffectiveAtk(p);
  const pDef = getEffectiveDef(p);
  const pCrt = getEffectiveCrt(p);
  const pSpd = getEffectiveSpd(p);
  const chipFx = getChipEffects(p);
  const isDouble = canDoubleAttack(pSpd, enemy.spd || 5);
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

  // ── Boss 相位系统 ──
  const bossPhases = enemy.bossId ? getBossPhases(enemy.bossId) : null;
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

  while (enemyHp > 0 && playerHp > 0) {
    round++;
    // ── 精英词缀: 每回合效果 ──
    if (affix) {
      // 剧毒: 每回合毒伤
      if (affix.poisonDmg && playerHp > 0) {
        const toxicDmg = Math.max(1, Math.floor(p.maxHp * affix.poisonDmg));
        playerHp -= toxicDmg;
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

    combatState.turn = round;

    // ── 天赋：每回合生命恢复 ──
    if (talentFx.regenPercent && playerHp > 0) {
      const regenAmt = Math.max(1, Math.floor(p.maxHp * talentFx.regenPercent));
      playerHp = Math.min(p.maxHp, playerHp + regenAmt);
      if (round <= 6) log.push({ text: `💚 天赋恢复 +${regenAmt} HP`, type: 'heal' });
    }
    // ── 元素共鸣：净化回血 ──
    if (resonanceHealPct > 0 && playerHp > 0) {
      const resHeal = Math.max(1, Math.floor(p.maxHp * resonanceHealPct));
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
          log.push({ text: `  ${ph.desc}`, type: 'boss_phase' });
        }
      }
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

    // ── 玩家回合：尝试使用技能 ──
    const skill = pickBestSkill(p, enemy, combatState, enemyHp, playerHp);
    if (skill) {
      // 创建临时player/enemy对象以避免修改实际状态
      const tempPlayer = { ...p, hp: playerHp, mana: playerMana, atk: pAtk, def: pDef, crt: pCrt, spd: pSpd };
      const tempEnemy = { ...enemy, hp: enemyHp };
      const skillResult = useSkill(tempPlayer, skill.id, tempEnemy, combatState);
        gameState.stats.skillsUsed++;
      for (const entry of skillResult.log) log.push(entry);

      // 应用技能效果
      if (skillResult.damage) enemyHp -= skillResult.damage;
      if (skillResult.heal) playerHp = Math.min(p.maxHp, playerHp + skillResult.heal);
      if (skillResult.manaCost) playerMana -= skillResult.manaCost;
    }

    if (enemyHp <= 0) break;

    // ── 玩家物理攻击 ──
    // 检查是否有 muscle_control buff（下次攻击双倍）
    let atkMultiplier = 1;
    const mcBuff = (combatState.statusEffects?.player || []).find(e => e.type === STATUS_EFFECT.BUFF_ATK);
    if (mcBuff && mcBuff.value > 50) atkMultiplier = 2; // muscle_control gives 100% buff

    // ── 敌人特性：狂怒（低HP增攻） ──
    let enemyEnrageMult = 1;
    if ((enemy.traits || []).includes('enrage') && enemyHp < enemyMaxHp * 0.5) {
      enemyEnrageMult = 1.4;
      if (round <= 6 || round === Math.ceil(enemyMaxHp * 0.5 / 77)) {
        log.push({ text: `🔥 ${enemy.name}陷入狂怒！ATK +40%`, type: 'enemy_enrage' });
      }
    }

    // ── 天赋：狂暴（低HP加攻） ──
    let berserkMult = 1;
    if (talentFx.berserkerThreshold && playerHp < p.maxHp * talentFx.berserkerThreshold) {
      berserkMult = 1 + talentFx.berserkerAtkBonus;
      if (round <= 6 || round % 5 === 0) log.push({ text: `🔥 狂暴！ATK +${Math.floor(talentFx.berserkerAtkBonus * 100)}%`, type: 'buff' });
    }
    // ── 天赋：连锁暴击 ──
    let chainCritBonus = lastCrit ? (talentFx.chainCrit || 0) : 0;
    lastCrit = false;

    const attackCount = isDouble ? 2 : 1;
    for (let i = 0; i < attackCount && enemyHp > 0; i++) {
      // 应用破甲（天赋 + 装备 + 共鸣叠加）
      let totalArmorPen = (talentFx.armorPen || 0) + (equipArmorPenPct / 100) + resonanceArmorIgnore;
      totalArmorPen = Math.min(totalArmorPen, 0.80); // 上限80%
      const armorPenDef = totalArmorPen > 0 ? Math.floor(enemy.def * (1 - totalArmorPen)) : enemy.def;
      const pHit = calcDamage(
        { atk: Math.floor(pAtk * atkMultiplier * berserkMult), crt: pCrt + chainCritBonus, geneLock: p.geneLock },
        { ...enemy, def: bossPhases ? effectiveEnemyDef : armorPenDef },
        p.weapon?.damageType || DAMAGE_TYPE.PHYSICAL
      );
      // ── 精英词缀: 暗影闪避 ──
      if (affix && affix.dodgeChance && Math.random() < affix.dodgeChance) {
        if (round <= 6 || i === 0) log.push({ text: `🌑 【${affix.name}】闪避了攻击！`, type: 'affix_dodge' });
        continue; // skip this hit entirely
      }
      
      enemyHp -= pHit.damage;

      const hitLabel = isDouble ? `[${i + 1}击] ` : '';
      const multiLabel = atkMultiplier > 1 ? ' 💪强化！' : '';
      if (pHit.isCrit) { lastCrit = true; gameState.stats.criticalHits++; }
      // 天赋：暴击伤害加成
      let finalDmg = pHit.damage;
      if (pHit.isCrit && talentFx.critDmgBonus > 0) {
        const bonus = Math.floor(pHit.damage * talentFx.critDmgBonus);
        finalDmg += bonus;
        enemyHp -= bonus; // 额外扣除
      }
      // 元素共鸣额外伤害
      if (resonanceBonusDmg > 0) {
        const resBonus = Math.floor(pHit.damage * resonanceBonusDmg);
        finalDmg += resBonus;
        enemyHp -= resBonus;
      }
      log.push({
        text: `${hitLabel}郑吒 → ${enemy.name} ${finalDmg}${pHit.isCrit ? ' 暴击！' : ''}${pHit.isWeak ? ' 弱点！' : ''}${multiLabel}`,
        type: pHit.isCrit ? 'critical' : 'attack',
      });
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

    // ── 道法法术 ──
    if (isDaoist && playerMana >= spellCost && enemyHp > 0) {
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

    // ── 敌人回合：检查眩晕/冻结 ──
    let enemyStunned = (combatState.statusEffects?.enemy || []).some(
      e => e.type === STATUS_EFFECT.STUN || e.type === STATUS_EFFECT.FREEZE
    );
    // 元素共鸣眩晕概率
    if (!enemyStunned && resonanceStunChance > 0 && Math.random() < resonanceStunChance) {
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
          playerHp -= totalSpecialDmg;
          log.push({ text: `💥 ${special.name}！→ 郑吒 ${totalSpecialDmg}`, type: 'boss_special' });
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
          if (playerHp <= 0) break;
        }
      }

      // ── 天赋：闪避 ──
      const dodgeRoll = Math.random();
      if (talentFx.dodgeChance > 0 && dodgeRoll < talentFx.dodgeChance) {
        log.push({ text: `💨 天赋闪避！躲开了 ${enemy.name} 的攻击`, type: 'dodge' });
      } else {

      // ── 敌人特性：幻影闪避 ──
      // ── 敌人特性: 幻影闪避（evasive trait） ──
      const enemyDodged = (enemy.traits || []).includes('evasive') && Math.random() < 0.15;
      if (enemyDodged) {
        log.push({ text: `💨 ${enemy.name} 幻影闪避！避开了反击`, type: 'dodge' });
      }

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
        playerHp -= eHit.damage;
        if (eHit.damage > 0) {
          log.push({
            text: `${enemy.name} → 郑吒 ${eHit.damage}${eHit.isCrit ? ' 暴击！' : ''}`,
            type: 'enemy_attack',
          });
          // ── NG+ 变异器: 幻痛 ──
          if (getActiveMutators().some(m => m.id === 'phantom_pain') && Math.random() < 0.10) {
            const phantomDmg = eHit.damage;
            playerHp -= phantomDmg;
            log.push({ text: `💀 幻痛！额外 ${phantomDmg} 伤害`, type: 'affix_damage' });
          }
        }
      }

      // ── 天赋：格挡 ──
      let blocked = false;
      if (talentFx.blockChance > 0 && !dodgeBuff && Math.random() < talentFx.blockChance) {
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

      // ── 天赋：受暴击减伤 ──
      if (eHit.isCrit && talentFx.critDmgReduce > 0 && !dodgeBuff) {
        const reduce = Math.floor(eHit.damage * talentFx.critDmgReduce);
        playerHp += reduce;
      }

      // ── 武修反伤 ──
      if (isMartial && !dodgeBuff && eHit.damage > 0 && enemyHp > 0) {
        const reflect = Math.max(1, Math.floor(eHit.damage * 0.15));
        enemyHp -= reflect;
        log.push({ text: `🛡 武修反伤 ${reflect}`, type: 'reflect' });
      }

      // ── 敌人特性：迅捷（20%双击） ──
      if ((enemy.traits || []).includes('swift') && Math.random() < 0.20 && enemyHp > 0 && playerHp > 0) {
        const eHit2 = calcDamage(
          { atk: Math.floor((bossPhases ? effectiveEnemyAtk : enemyEffAtk) * enemyEnrageMult), crt: enemy.crt || 0 },
          { def: pDef, res: p.res || 0 },
          enemy.damageType || DAMAGE_TYPE.PHYSICAL, 0
        );
        playerHp -= eHit2.damage;
        if (eHit2.damage > 0) log.push({ text: `⚡ ${enemy.name}二连击！${eHit2.damage}`, type: 'enemy_attack' });
      }

      // ── 敌人特性：吸血 ──
      if ((enemy.traits || []).includes('vampiric') && eHit && eHit.damage > 0 && enemyHp > 0) {
        const vampHeal = Math.max(1, Math.floor(eHit.damage * 0.20));
        enemyHp = Math.min(enemyMaxHp, enemyHp + vampHeal);
        if (round <= 6) log.push({ text: `🩸 ${enemy.name}吸血 +${vampHeal}`, type: 'enemy_heal' });
      }

      // ── 敌人特性：剧毒 ──
      if ((enemy.traits || []).includes('poisonous') && playerHp > 0) {
        const poisonDmg = Math.max(1, Math.floor(p.maxHp * 0.03));
        playerHp -= poisonDmg;
        if (round <= 6) log.push({ text: `☠ 中毒！-${poisonDmg} HP`, type: 'poison' });
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
    if (enemy.bossId || enemy.type === 'boss') gameState.stats.bossesKilled++;
    gameState.stats.damageDealt += enemy.hp;

    const rewards = enemy.rewards || {};
    if (rewards.exp) gameState.addExp(rewards.exp);
    if (rewards.gold) p.gold += rewards.gold;
    if (rewards.rewardPoints) p.rewardPoints += rewards.rewardPoints;

    // ── 战利品掉落系统 ──
    try {
      const loot = generateLoot(enemy, gameState.chapter || 1);
      if (loot.length > 0) {
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
        if (Math.random() < 0.35) {
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
            if (rewards.exp) gameState.addExp(rewards.exp);
            if (rewards.gold) p.gold += rewards.gold;
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

  return { victory: enemyHp <= 0, log, rounds: round };
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
    return totalBonus / alive.length;
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
