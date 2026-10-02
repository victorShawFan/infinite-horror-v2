// ═══════════════════════════════════════════════════════════════
// 战斗系统 — 魔塔式数值对撞 + 技能 + 基因锁爆发
// ═══════════════════════════════════════════════════════════════

import { DAMAGE_TYPE, GENE_LOCK } from './constants.js';
import { eventBus } from './EventBus.js';
import { gameState } from './GameState.js';

/**
 * 计算单次攻击伤害
 * @param {Object} attacker - { atk, crt, skills[], geneLock, bloodline }
 * @param {Object} defender - { def, res, weaknesses[] }
 * @param {string} damageType
 * @returns {{ damage: number, isCrit: boolean, isWeak: boolean }}
 */
export function calcDamage(attacker, defender, damageType = DAMAGE_TYPE.PHYSICAL, minDmg = 1) {
  let baseDmg = Math.max(minDmg, attacker.atk - defender.def);

  // 属性克制
  const isWeak = defender.weaknesses?.includes(damageType) || false;
  if (isWeak) baseDmg = Math.floor(baseDmg * 1.5);

  // 暴击判定
  const critRoll = Math.random() * 100;
  const isCrit = critRoll < (attacker.crt || 0);
  if (isCrit) baseDmg = Math.floor(baseDmg * 1.8);

  // 抗性减伤
  if (defender.res && damageType !== DAMAGE_TYPE.PHYSICAL) {
    baseDmg = Math.max(1, Math.floor(baseDmg * (100 - defender.res) / 100));
  }

  return { damage: Math.max(minDmg, baseDmg), isCrit, isWeak };
}

/**
 * 魔塔式战斗预判 — 在碰怪前就能看到结果
 * @param {Object} player - 玩家属性
 * @param {Object} enemy - 敌人属性
 * @returns {{ canWin, totalDamage, turnsNeeded, rewards }}
 */
export function previewBattle(player, enemy) {
  const pAtk = getEffectiveAtk(player);
  const pDef = getEffectiveDef(player);

  const playerDmg = Math.max(1, pAtk - enemy.def);
  const enemyDmg = Math.max(0, enemy.atk - pDef);

  if (playerDmg <= 0) {
    return { canWin: false, totalDamage: Infinity, turnsNeeded: Infinity, rewards: enemy.rewards };
  }

  const turnsNeeded = Math.ceil(enemy.hp / playerDmg);
  // 敌人先手次数 = turnsNeeded - 1（玩家先攻）
  const enemyHits = Math.max(0, turnsNeeded - 1);
  const totalDamage = enemyDmg * enemyHits;

  return {
    canWin: player.hp > totalDamage,
    totalDamage,
    turnsNeeded,
    playerDmgPerHit: playerDmg,
    enemyDmgPerHit: enemyDmg,
    rewards: enemy.rewards || {},
    hpAfter: player.hp - totalDamage,
  };
}

/**
 * 执行战斗（自动回合制对撞）
 */
export function executeBattle(enemy) {
  const p = gameState.player;
  const preview = previewBattle(p, enemy);
  const log = [];

  if (!preview.canWin) {
    return { victory: false, log: [{ text: `${enemy.name}的防御太高了，无法造成有效伤害！`, type: 'danger' }] };
  }

  let enemyHp = enemy.hp;
  let playerHp = p.hp;
  let round = 0;

  while (enemyHp > 0 && playerHp > 0) {
    round++;

    // 玩家攻击
    const pHit = calcDamage(
      { atk: getEffectiveAtk(p), crt: p.crt, geneLock: p.geneLock },
      enemy,
      p.weapon?.damageType || DAMAGE_TYPE.PHYSICAL
    );
    enemyHp -= pHit.damage;
    log.push({
      text: `郑吒 对 ${enemy.name} 造成 ${pHit.damage} 伤害${pHit.isCrit ? '（暴击！）' : ''}${pHit.isWeak ? '（弱点！）' : ''}`,
      type: pHit.isCrit ? 'critical' : 'attack',
    });

    if (enemyHp <= 0) break;

    // 敌人攻击
    const eHit = calcDamage(
      { atk: enemy.atk, crt: enemy.crt || 0 },
      { def: getEffectiveDef(p), res: p.res || 0 },
      enemy.damageType || DAMAGE_TYPE.PHYSICAL,
      0  // 魔塔规则：DEF ≥ 敌ATK时受伤为0
    );
    playerHp -= eHit.damage;
    log.push({
      text: `${enemy.name} 对 郑吒 造成 ${eHit.damage} 伤害${eHit.isCrit ? '（暴击！）' : ''}`,
      type: 'enemy_attack',
    });
  }

  const victory = enemyHp <= 0;

  if (victory) {
    // 应用结果
    p.hp = playerHp;
    
    // 血族吸血效果
    if (p.activeBloodline === 'vampire') {
      const lifeSteal = Math.floor(enemy.hp * 0.08);
      p.hp = Math.min(p.maxHp, p.hp + lifeSteal);
      if (lifeSteal > 0) {
        log.push({ text: `血族吸血：恢复 ${lifeSteal} HP`, type: 'heal' });
      }
    }
    
    gameState.stats.enemiesKilled++;
    gameState.stats.damageDealt += enemy.hp;

    // 发放奖励
    const rewards = enemy.rewards || {};
    if (rewards.exp) gameState.addExp(rewards.exp);
    if (rewards.gold) p.gold += rewards.gold;
    if (rewards.rewardPoints) p.rewardPoints += rewards.rewardPoints;

    // 基因锁充能
    if (p.geneLock < GENE_LOCK.STAGE_4) {
      p.geneLockCharge += enemy.geneLockCharge || 5;
      if (p.geneLockCharge >= 100 && p.geneLock === GENE_LOCK.LOCKED) {
        // 首次开启条件：需要特定剧情触发
      }
    }

    log.push({ text: `击败了 ${enemy.name}！`, type: 'victory' });
    if (rewards.exp) log.push({ text: `获得 ${rewards.exp} 经验`, type: 'reward' });
    if (rewards.gold) log.push({ text: `获得 ${rewards.gold} 金币`, type: 'reward' });
    if (rewards.rewardPoints) log.push({ text: `获得 ${rewards.rewardPoints} 奖励点`, type: 'reward' });

    eventBus.emit('combat:victory', { enemy, rewards, log });
  } else {
    p.hp = 0;
    log.push({ text: `被 ${enemy.name} 击败了...`, type: 'defeat' });
    eventBus.emit('combat:defeat', { enemy, log });
    gameState.stats.deathCount++;
    eventBus.emit('player:death', {});
  }

  return { victory, log, rounds: round };
}

/**
 * 获取有效攻击力（含装备、血统、基因锁加成）
 */
export function getEffectiveAtk(player) {
  let atk = player.atk;

  // 武器加成
  if (player.weapon) atk += player.weapon.atk || 0;

  // 血统加成
  if (player.activeBloodline === 'vampire') {
    const bonus = Math.floor(atk * 0.15);
    atk += bonus;
  }
  if (player.activeBloodline === 'ancient_wu') {
    const bonus = Math.floor(atk * 0.2);
    atk += bonus;
  }

  // 基因锁加成
  if (player.geneLockActive && player.geneLock > 0) {
    atk += Math.floor(atk * 0.2 * player.geneLock);
  }

  // 技能芯片加成
  for (const chip of player.chips || []) {
    if (chip.stat === 'atk') atk += chip.value;
  }

  return atk;
}

/**
 * 获取有效防御力
 */
export function getEffectiveDef(player) {
  let def = player.def;

  if (player.armor) def += player.armor.def || 0;
  if (player.activeBloodline === 'martial') def += Math.floor(def * 0.2);

  if (player.geneLockActive && player.geneLock > 0) {
    def += Math.floor(def * 0.15 * player.geneLock);
  }

  for (const chip of player.chips || []) {
    if (chip.stat === 'def') def += chip.value;
  }

  return def;
}

/**
 * 获取属性加成详细分解
 */
export function getStatsBreakdown(player) {
  const breakdown = {
    atk: { base: player.atk, weapon: 0, bloodline: 0, geneLock: 0, chips: 0, total: 0 },
    def: { base: player.def, armor: 0, bloodline: 0, geneLock: 0, chips: 0, total: 0 },
  };

  // 武器
  if (player.weapon) breakdown.atk.weapon = player.weapon.atk || 0;
  if (player.armor) breakdown.def.armor = player.armor.def || 0;

  // 血统
  let atkWithWeapon = breakdown.atk.base + breakdown.atk.weapon;
  let defWithArmor = breakdown.def.base + breakdown.def.armor;
  if (player.activeBloodline === 'vampire') breakdown.atk.bloodline = Math.floor(atkWithWeapon * 0.15);
  if (player.activeBloodline === 'ancient_wu') breakdown.atk.bloodline = Math.floor(atkWithWeapon * 0.2);
  if (player.activeBloodline === 'martial') breakdown.def.bloodline = Math.floor(defWithArmor * 0.2);

  // 基因锁
  if (player.geneLockActive && player.geneLock > 0) {
    breakdown.atk.geneLock = Math.floor((atkWithWeapon + breakdown.atk.bloodline) * 0.2 * player.geneLock);
    breakdown.def.geneLock = Math.floor((defWithArmor + breakdown.def.bloodline) * 0.15 * player.geneLock);
  }

  // 芯片
  for (const chip of player.chips || []) {
    if (chip.stat === 'atk') breakdown.atk.chips += chip.value;
    if (chip.stat === 'def') breakdown.def.chips += chip.value;
  }

  breakdown.atk.total = breakdown.atk.base + breakdown.atk.weapon + breakdown.atk.bloodline + breakdown.atk.geneLock + breakdown.atk.chips;
  breakdown.def.total = breakdown.def.base + breakdown.def.armor + breakdown.def.bloodline + breakdown.def.geneLock + breakdown.def.chips;

  return breakdown;
}
