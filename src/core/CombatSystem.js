// ═══════════════════════════════════════════════════════════════
// 战斗系统 — 魔塔式数值对撞 + 血统特技 + 芯片元素 + 速度双击
// ═══════════════════════════════════════════════════════════════

import { DAMAGE_TYPE, GENE_LOCK, BLOODLINE } from './constants.js';
import { eventBus } from './EventBus.js';
import { gameState } from './GameState.js';

// ── 伤害计算 ──
export function calcDamage(attacker, defender, damageType = DAMAGE_TYPE.PHYSICAL, minDmg = 1) {
  let baseDmg = Math.max(minDmg, attacker.atk - defender.def);

  const isWeak = defender.weaknesses?.includes(damageType) || false;
  if (isWeak) baseDmg = Math.floor(baseDmg * 1.5);

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
      effects.slowPct += 10; // 减少敌方攻击力10%
      effects.hasIceChip = true;
    }
  }
  return effects;
}

// ── SPD双击判定 ──
function canDoubleAttack(playerSpd, enemySpd) {
  return playerSpd >= (enemySpd || 5) * 2;
}

// ── 战斗预判 ──
export function previewBattle(player, enemy) {
  const pAtk = getEffectiveAtk(player);
  const pDef = getEffectiveDef(player);
  const pSpd = getEffectiveSpd(player);
  const pCrt = getEffectiveCrt(player);
  const chipFx = getChipEffects(player);

  // 道法血统：法术伤害（不受物防影响）
  const isDaoist = player.activeBloodline === BLOODLINE.DAOIST;
  const hasMana = player.mana > 0 && player.maxMana > 0;
  const spellCost = 8;

  // 冰芯片减敌攻
  const enemyEffAtk = chipFx.hasIceChip
    ? Math.floor(enemy.atk * (1 - chipFx.slowPct / 100))
    : enemy.atk;

  const playerDmg = Math.max(1, pAtk - enemy.def);
  const enemyDmg = Math.max(0, enemyEffAtk - pDef);
  const isDouble = canDoubleAttack(pSpd, enemy.spd || 5);

  if (playerDmg <= 0 && !(isDaoist && hasMana)) {
    return { canWin: false, totalDamage: Infinity, turnsNeeded: Infinity, rewards: enemy.rewards };
  }

  // 估算每轮有效伤害
  let effectiveDmgPerRound = playerDmg;
  if (isDouble) effectiveDmgPerRound = playerDmg * 2;
  if (chipFx.burnDmg > 0) effectiveDmgPerRound += chipFx.burnDmg;
  // 道法：如果有蓝，额外法术伤害
  let spellDmgEst = 0;
  if (isDaoist && hasMana) {
    spellDmgEst = Math.max(1, Math.floor(pAtk * 0.8) + 5 - Math.floor((enemy.res || 0) * 0.3));
    effectiveDmgPerRound += spellDmgEst;
  }

  const turnsNeeded = Math.ceil(enemy.hp / effectiveDmgPerRound);
  const enemyHits = Math.max(0, turnsNeeded - 1);

  // 武修反伤减少回合数
  let reflectDmg = 0;
  if (player.activeBloodline === BLOODLINE.MARTIAL && enemyDmg > 0) {
    reflectDmg = Math.max(1, Math.floor(enemyDmg * 0.15));
  }

  // 吸血减少总受伤
  let lifeStealPerHit = 0;
  if (player.activeBloodline === BLOODLINE.VAMPIRE) {
    lifeStealPerHit = Math.max(1, Math.floor(playerDmg * 0.1));
  }

  const totalDamage = Math.max(0, enemyDmg * enemyHits - lifeStealPerHit * enemyHits);

  // 酸血反噬（抗酸芯片减免50%）
  let acidDmg = enemy.acidBlood || 0;
  if (acidDmg > 0 && (player.chips || []).some(c => c.special === 'acid_resist')) {
    acidDmg = Math.floor(acidDmg * 0.5);
  }
  const totalWithAcid = totalDamage + acidDmg;

  return {
    canWin: player.hp > totalWithAcid,
    totalDamage: totalWithAcid,
    turnsNeeded,
    playerDmgPerHit: playerDmg,
    enemyDmgPerHit: enemyDmg,
    rewards: enemy.rewards || {},
    hpAfter: player.hp - totalWithAcid,
    acidDmg,
    // 新增详情
    isDouble,
    burnDmg: chipFx.burnDmg,
    reflectDmg,
    lifeStealPerHit,
    spellDmgEst,
    isDaoist: isDaoist && hasMana,
    hasIceChip: chipFx.hasIceChip,
    effectiveDmgPerRound,
  };
}

// ── 执行战斗 ──
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

  // 冰芯片减敌攻
  const enemyEffAtk = chipFx.hasIceChip
    ? Math.floor(enemy.atk * (1 - chipFx.slowPct / 100))
    : enemy.atk;

  if (chipFx.hasIceChip && enemy.atk !== enemyEffAtk) {
    log.push({ text: `❄ 冰芯片生效：${enemy.name}攻击力 ${enemy.atk}→${enemyEffAtk}`, type: 'buff' });
  }
  if (isDouble) {
    log.push({ text: `⚡ 速度碾压！每回合发动二连击`, type: 'buff' });
  }

  while (enemyHp > 0 && playerHp > 0) {
    round++;

    // ── 玩家物理攻击 ──
    const attackCount = isDouble ? 2 : 1;
    for (let i = 0; i < attackCount && enemyHp > 0; i++) {
      const pHit = calcDamage(
        { atk: pAtk, crt: pCrt, geneLock: p.geneLock },
        enemy,
        p.weapon?.damageType || DAMAGE_TYPE.PHYSICAL
      );
      enemyHp -= pHit.damage;

      const hitLabel = isDouble ? `[${i + 1}击] ` : '';
      log.push({
        text: `${hitLabel}郑吒 → ${enemy.name} ${pHit.damage}${pHit.isCrit ? ' 暴击！' : ''}${pHit.isWeak ? ' 弱点！' : ''}`,
        type: pHit.isCrit ? 'critical' : 'attack',
      });

      // 吸血（每次命中触发）
      if (isVampire) {
        const steal = Math.max(1, Math.floor(pHit.damage * 0.1));
        playerHp = Math.min(p.maxHp, playerHp + steal);
        log.push({ text: `🩸 吸血 +${steal} HP`, type: 'heal' });
      }
    }

    // ── 道法法术（有蓝时自动释放） ──
    if (isDaoist && playerMana >= spellCost && enemyHp > 0) {
      const spell = calcSpellDamage(
        { atk: pAtk, crt: pCrt },
        enemy
      );
      enemyHp -= spell.damage;
      playerMana -= spellCost;
      log.push({
        text: `🔥 道法·灵咒 → ${enemy.name} ${spell.damage}${spell.isCrit ? ' 暴击！' : ''} (消耗${spellCost}法力)`,
        type: 'spell',
      });
    }

    // ── 火芯片灼烧 ──
    if (chipFx.burnDmg > 0 && enemyHp > 0) {
      enemyHp -= chipFx.burnDmg;
      log.push({ text: `🔥 灼烧 ${chipFx.burnDmg}`, type: 'burn' });
    }

    if (enemyHp <= 0) break;

    // ── 敌人攻击 ──
    const eHit = calcDamage(
      { atk: enemyEffAtk, crt: enemy.crt || 0 },
      { def: pDef, res: p.res || 0 },
      enemy.damageType || DAMAGE_TYPE.PHYSICAL,
      0
    );
    playerHp -= eHit.damage;
    if (eHit.damage > 0) {
      log.push({
        text: `${enemy.name} → 郑吒 ${eHit.damage}${eHit.isCrit ? ' 暴击！' : ''}`,
        type: 'enemy_attack',
      });
    }

    // ── 武修反伤 ──
    if (isMartial && eHit.damage > 0 && enemyHp > 0) {
      const reflect = Math.max(1, Math.floor(eHit.damage * 0.15));
      enemyHp -= reflect;
      log.push({ text: `🛡 武修反伤 ${reflect}`, type: 'reflect' });
    }
  }

  const victory = enemyHp <= 0;

  if (victory) {
    p.hp = playerHp;
    p.mana = playerMana;

    // 酸血反噬（异形系敌人）
    if (enemy.acidBlood && enemy.acidBlood > 0) {
      let acidDmg = enemy.acidBlood;
      // 抗酸芯片减免50%
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
    gameState.stats.damageDealt += enemy.hp;

    const rewards = enemy.rewards || {};
    if (rewards.exp) gameState.addExp(rewards.exp);
    if (rewards.gold) p.gold += rewards.gold;
    if (rewards.rewardPoints) p.rewardPoints += rewards.rewardPoints;

    // 基因锁充能
    if (p.geneLock < GENE_LOCK.STAGE_4) {
      p.geneLockCharge += enemy.geneLockCharge || 5;
    }

    // 法力自然恢复（道法血统每场战斗恢复少量）
    if (p.activeBloodline === BLOODLINE.DAOIST && p.maxMana > 0) {
      const manaRegen = Math.min(5, p.maxMana - p.mana);
      if (manaRegen > 0) {
        p.mana += manaRegen;
        log.push({ text: `✦ 道法冥想恢复 +${manaRegen} 法力`, type: 'heal' });
      }
    }

    log.push({ text: `击败了 ${enemy.name}！`, type: 'victory' });
    if (rewards.exp) log.push({ text: `+${rewards.exp} 经验`, type: 'reward' });
    if (rewards.gold) log.push({ text: `+${rewards.gold} 金币`, type: 'reward' });
    if (rewards.rewardPoints) log.push({ text: `+${rewards.rewardPoints} 奖励点`, type: 'reward' });

    eventBus.emit('combat:victory', { enemy, rewards, log });
  } else {
    p.hp = 0;
    p.mana = playerMana;
    log.push({ text: `被 ${enemy.name} 击败了...`, type: 'defeat' });
    eventBus.emit('combat:defeat', { enemy, log });
    gameState.stats.deathCount++;
    eventBus.emit('player:death', {});
  }

  return { victory, log, rounds: round };
}

// ── 有效属性计算 ──
// 队友被动加成表
const COMPANION_BONUSES = {
  zhang_jie: { atk: 2, def: 0 },    // 张杰：战术领队，攻击支援
  zhan_lan: { atk: 0, def: 0, crt: 3 }, // 詹岚：情报分析，暴击支援
  li_xiaoyi: { atk: 1, def: 1 },    // 李萧毅：机动支援
  mou_gang: { atk: 0, def: 3 },     // 牟钢：防线坚守
  chuxuan: { atk: 0, def: 0, spd: 3 }, // 楚轩：军师，速度支援
  lingdian: { atk: 3, def: 0, crt: 5 }, // 零点：狙击手，攻击+暴击
  bawang: { atk: 2, def: 2 },       // 霸王：近战强手
  lishuaixi: { atk: 1, def: 0 },    // 李帅西：新人
};

function getCompanionBonuses(stat) {
  // Import gameState indirectly to avoid circular dependency
  try {
    const gs = gameState;
    if (!gs?.companions) return 0;
    return gs.companions
      .filter(c => c.alive)
      .reduce((sum, c) => sum + (COMPANION_BONUSES[c.id]?.[stat] || 0), 0);
  } catch { return 0; }
}

export function getEffectiveAtk(player) {
  let atk = player.atk;
  if (player.weapon) atk += player.weapon.atk || 0;
  // 队友被动加成
  atk += getCompanionBonuses('atk');

  if (player.activeBloodline === BLOODLINE.VAMPIRE) atk += Math.floor(atk * 0.15);
  if (player.activeBloodline === BLOODLINE.ANCIENT_WU) atk += Math.floor(atk * 0.2);

  if (player.geneLockActive && player.geneLock > 0) {
    atk += Math.floor(atk * 0.2 * player.geneLock);
  }

  for (const chip of player.chips || []) {
    if (chip.stat === 'atk') atk += chip.value;
  }
  return atk;
}

export function getEffectiveDef(player) {
  let def = player.def;
  if (player.armor) def += player.armor.def || 0;
  def += getCompanionBonuses('def');
  if (player.activeBloodline === BLOODLINE.MARTIAL) def += Math.floor(def * 0.2);

  if (player.geneLockActive && player.geneLock > 0) {
    def += Math.floor(def * 0.15 * player.geneLock);
  }

  for (const chip of player.chips || []) {
    if (chip.stat === 'def') def += chip.value;
  }
  return def;
}

export function getEffectiveCrt(player) {
  let crt = player.crt || 0;
  if (player.weapon?.crt) crt += player.weapon.crt;
  if (player.accessory?.crt) crt += player.accessory.crt;
  crt += getCompanionBonuses('crt');
  for (const chip of player.chips || []) {
    if (chip.stat === 'crt') crt += chip.value;
  }
  return Math.min(crt, 100);
}

export function getEffectiveSpd(player) {
  let spd = player.spd || 0;
  if (player.weapon?.spd) spd += player.weapon.spd;
  spd += getCompanionBonuses('spd');
  if (player.armor?.spd) spd += player.armor.spd;
  if (player.accessory?.spd) spd += player.accessory.spd;
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

  // 队友被动加成
  breakdown.atk.companion = getCompanionBonuses('atk');
  breakdown.def.companion = getCompanionBonuses('def');

  breakdown.atk.total = breakdown.atk.base + breakdown.atk.weapon + breakdown.atk.bloodline + breakdown.atk.geneLock + breakdown.atk.chips + breakdown.atk.companion;
  breakdown.def.total = breakdown.def.base + breakdown.def.armor + breakdown.def.bloodline + breakdown.def.geneLock + breakdown.def.chips + breakdown.def.companion;

  return breakdown;
}
