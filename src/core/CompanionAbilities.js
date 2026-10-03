// ═══════════════════════════════════════════════════════════════
// 同伴主动技能系统 — 战斗中召唤同伴发动特殊能力
// ═══════════════════════════════════════════════════════════════
//
// 每个同伴拥有独特的主动技能，需要达到足够的关系等级才能解锁。
// 技能消耗行动冷却（CD回合），战斗中每个同伴只能发动有限次数。
// 关系等级越高，技能效果越强：
//   友好(11+): 基础版
//   亲密(41+): 强化版
//   羁绊(71+): 究极版
//
// 业力影响：正业力增强治疗/防御型技能，负业力增强攻击/暗影型技能

import { gameState } from './GameState.js';
import { getKarmaCombatModifiers } from './KarmaSystem.js';

// ── 同伴技能定义 ──
export const COMPANION_ABILITIES = {
  zhang_jie: {
    name: '队长守护',
    icon: '🛡',
    desc: '张杰挡在你身前，大幅减少下一次受到的伤害',
    type: 'defense',
    cooldown: 4,
    maxUses: 3,
    relReq: 11,
    effect(relLevel) {
      // 友好: 减伤30%, 亲密: 40%, 羁绊: 50%+反伤
      if (relLevel >= 71) return { damageReduce: 0.50, reflect: 0.15, text: '张杰以身躯为盾，挡下了致命一击！敌人被弹飞！' };
      if (relLevel >= 41) return { damageReduce: 0.40, reflect: 0, text: '张杰冲到你面前，为你挡下了重击！' };
      return { damageReduce: 0.30, reflect: 0, text: '张杰举起护盾，抵消了部分伤害。' };
    },
  },
  zhan_lan: {
    name: '精准狙击',
    icon: '🎯',
    desc: '詹岚从远处发射一枪，造成大量穿甲伤害',
    type: 'attack',
    cooldown: 3,
    maxUses: 4,
    relReq: 11,
    effect(relLevel) {
      // 友好: 80%ATK穿甲伤害, 亲密: 120%, 羁绊: 160%+必暴击
      if (relLevel >= 71) return { dmgMult: 1.6, armorPen: 0.8, crit: true, text: '詹岚瞄准了敌人的弱点——一枪命中要害！「完美射击」' };
      if (relLevel >= 41) return { dmgMult: 1.2, armorPen: 0.6, crit: false, text: '詹岚的子弹精准地穿透了敌人的防御！' };
      return { dmgMult: 0.8, armorPen: 0.4, crit: false, text: '詹岚从侧面开火，子弹击中了敌人。' };
    },
  },
  chuxuan: {
    name: '战术分析',
    icon: '🧠',
    desc: '楚轩分析敌人弱点，降低敌人防御并增加己方暴击',
    type: 'debuff',
    cooldown: 5,
    maxUses: 2,
    relReq: 11,
    effect(relLevel) {
      if (relLevel >= 71) return { enemyDefReduce: 0.30, crtBoost: 15, duration: 3, text: '「计划完成」楚轩淡淡说道。敌人的所有弱点已被看穿。' };
      if (relLevel >= 41) return { enemyDefReduce: 0.20, crtBoost: 10, duration: 2, text: '楚轩推了推眼镜："攻击那个位置。"' };
      return { enemyDefReduce: 0.10, crtBoost: 5, duration: 2, text: '楚轩指出了敌人的一个破绽。' };
    },
  },
  li_xiaoyi: {
    name: '同伴鼓舞',
    icon: '💪',
    desc: '李小意的加油声鼓舞士气，恢复HP和提升攻击',
    type: 'support',
    cooldown: 4,
    maxUses: 3,
    relReq: 11,
    effect(relLevel) {
      if (relLevel >= 71) return { healPct: 0.20, atkBoost: 8, duration: 3, text: '「郑吒哥，我们一定能赢的！」李小意的坚定信念感染了所有人。' };
      if (relLevel >= 41) return { healPct: 0.12, atkBoost: 5, duration: 2, text: '「加油！我相信你！」李小意大声喊道。' };
      return { healPct: 0.08, atkBoost: 3, duration: 2, text: '李小意在一旁为你加油打气。' };
    },
  },
  mou_gang: {
    name: '铁壁冲锋',
    icon: '🏔',
    desc: '牟刚冲向敌人，造成伤害并眩晕敌人一回合',
    type: 'attack',
    cooldown: 4,
    maxUses: 3,
    relReq: 11,
    effect(relLevel) {
      if (relLevel >= 71) return { dmgMult: 1.0, stun: 2, defBoost: 5, text: '牟刚怒吼着冲向敌人！大地在震颤！「铁山靠！」' };
      if (relLevel >= 41) return { dmgMult: 0.8, stun: 1, defBoost: 3, text: '牟刚重重撞向敌人，将其撞退！' };
      return { dmgMult: 0.6, stun: 1, defBoost: 0, text: '牟刚冲上去给了敌人一拳。' };
    },
  },
  lingdian: {
    name: '影分身',
    icon: '👥',
    desc: '零点制造分身，分担一次伤害并进行一次额外攻击',
    type: 'attack',
    cooldown: 3,
    maxUses: 3,
    relReq: 11,
    effect(relLevel) {
      if (relLevel >= 71) return { extraAtk: 2, absorb: 0.3, text: '零点分裂出两个分身——三面夹击！「我不再是影子。」' };
      if (relLevel >= 41) return { extraAtk: 1, absorb: 0.2, text: '零点的分身从侧面发起了攻击！' };
      return { extraAtk: 1, absorb: 0.1, text: '零点召唤出一个分身协助攻击。' };
    },
  },
  bawang: {
    name: '霸王拳',
    icon: '👊',
    desc: '霸王全力一击，造成巨大伤害，概率击碎敌人防御',
    type: 'attack',
    cooldown: 5,
    maxUses: 2,
    relReq: 11,
    effect(relLevel) {
      if (relLevel >= 71) return { dmgMult: 2.0, shatter: 0.5, text: '「受死吧！」霸王一拳击碎了敌人的防御！古武之力在爆发！' };
      if (relLevel >= 41) return { dmgMult: 1.5, shatter: 0.3, text: '霸王一拳打出，拳风呼啸！' };
      return { dmgMult: 1.0, shatter: 0.15, text: '霸王出拳攻击敌人。' };
    },
  },
  lishuaixi: {
    name: '战地急救',
    icon: '💊',
    desc: '李帅西使用急救包，恢复大量HP并解除负面状态',
    type: 'support',
    cooldown: 5,
    maxUses: 2,
    relReq: 11,
    effect(relLevel) {
      if (relLevel >= 71) return { healPct: 0.35, cleanse: true, defBoost: 3, text: '李帅西拿出了最好的医疗包："全套急救，包括止痛药！"' };
      if (relLevel >= 41) return { healPct: 0.25, cleanse: true, defBoost: 0, text: '李帅西迅速为你包扎伤口："撑住！"' };
      return { healPct: 0.15, cleanse: false, defBoost: 0, text: '李帅西递给你一个急救包。' };
    },
  },
};

// ── 战斗中的同伴技能状态 ──
let _combatAbilityState = {};

/**
 * 初始化战斗中的同伴技能状态
 */
export function initCombatAbilities() {
  _combatAbilityState = {};
  const companions = gameState.companions || [];
  const relationships = gameState.relationships || {};
  
  for (const c of companions) {
    if (!c.alive) continue;
    const ability = COMPANION_ABILITIES[c.id];
    if (!ability) continue;
    const rel = relationships[c.id] || 0;
    if (rel < ability.relReq) continue;
    
    _combatAbilityState[c.id] = {
      cooldown: 0,    // 当前冷却回合（0=可用）
      usesLeft: ability.maxUses,
    };
  }
  return _combatAbilityState;
}

/**
 * 获取当前可用的同伴技能
 */
export function getAvailableAbilities() {
  const result = [];
  const companions = gameState.companions || [];
  const relationships = gameState.relationships || {};
  
  for (const c of companions) {
    if (!c.alive) continue;
    const ability = COMPANION_ABILITIES[c.id];
    if (!ability) continue;
    const state = _combatAbilityState[c.id];
    if (!state) continue;
    
    const rel = relationships[c.id] || 0;
    const effect = ability.effect(rel);
    
    result.push({
      companionId: c.id,
      companionName: c.name,
      ...ability,
      effect,
      ready: state.cooldown <= 0 && state.usesLeft > 0,
      cooldownLeft: state.cooldown,
      usesLeft: state.usesLeft,
      relLevel: rel,
    });
  }
  return result;
}

/**
 * 使用同伴技能
 * @returns {{ success, log[], damage, heal, stun, defReduce, ... }}
 */
export function useCompanionAbility(companionId) {
  const state = _combatAbilityState[companionId];
  if (!state || state.cooldown > 0 || state.usesLeft <= 0) {
    return { success: false, log: [{ text: '同伴技能不可用！', type: 'warning' }] };
  }
  
  const ability = COMPANION_ABILITIES[companionId];
  if (!ability) return { success: false, log: [{ text: '未知技能', type: 'warning' }] };
  
  const rel = (gameState.relationships || {})[companionId] || 0;
  const effect = ability.effect(rel);
  const karmaMods = getKarmaCombatModifiers();
  const log = [];
  
  // 消耗冷却和使用次数
  state.cooldown = ability.cooldown;
  state.usesLeft--;
  
  log.push({ text: `${ability.icon} ${gameState.companions.find(c=>c.id===companionId)?.name || companionId} — ${ability.name}！`, type: 'companion_ability' });
  log.push({ text: effect.text, type: 'companion_dialogue' });
  
  const result = {
    success: true,
    log,
    damage: 0,
    heal: 0,
    stun: 0,
    playerDefBoost: 0,
    playerAtkBoost: 0,
    playerCrtBoost: 0,
    enemyDefReduce: 0,
    damageReduce: 0,
    reflect: 0,
    extraAttacks: 0,
    absorb: 0,
    cleanse: false,
    duration: 0,
  };
  
  // 攻击型：计算伤害
  if (effect.dmgMult) {
    const pAtk = gameState.player.atk;
    let dmg = Math.floor(pAtk * effect.dmgMult);
    // 业力暗影加成对攻击型同伴技能
    if (karmaMods.darkDmgBonus > 0 && ability.type === 'attack') {
      dmg = Math.floor(dmg * (1 + karmaMods.darkDmgBonus / 200)); // 半效
    }
    result.damage = dmg;
    log.push({ text: `造成 ${dmg} 点伤害`, type: 'damage' });
  }
  
  // 穿甲
  if (effect.armorPen) result.armorPen = effect.armorPen;
  if (effect.crit) result.forceCrit = true;
  
  // 眩晕
  if (effect.stun) {
    result.stun = effect.stun;
    log.push({ text: `敌人被眩晕 ${effect.stun} 回合！`, type: 'debuff' });
  }
  
  // 防御碎甲
  if (effect.shatter && Math.random() < effect.shatter) {
    result.enemyDefReduce = 0.25;
    log.push({ text: '敌人的防御被击碎！', type: 'debuff' });
  }
  
  // 减伤
  if (effect.damageReduce) {
    result.damageReduce = effect.damageReduce;
    log.push({ text: `下次受伤减少 ${Math.floor(effect.damageReduce * 100)}%`, type: 'buff' });
  }
  if (effect.reflect) {
    result.reflect = effect.reflect;
    log.push({ text: `反弹 ${Math.floor(effect.reflect * 100)}% 伤害`, type: 'buff' });
  }
  
  // 治疗
  if (effect.healPct) {
    let healAmt = Math.floor(gameState.player.maxHp * effect.healPct);
    // 业力治疗加成
    if (karmaMods.healBonus > 0) {
      healAmt = Math.floor(healAmt * (1 + karmaMods.healBonus / 100));
    }
    // 业力同伴加成
    if (karmaMods.companionBonus > 0) {
      healAmt = Math.floor(healAmt * (1 + karmaMods.companionBonus / 100));
    }
    result.heal = healAmt;
    log.push({ text: `恢复 ${healAmt} HP`, type: 'heal' });
  }
  
  // 增益
  if (effect.atkBoost) {
    result.playerAtkBoost = effect.atkBoost;
    result.duration = effect.duration || 2;
    log.push({ text: `ATK +${effect.atkBoost} (${result.duration}回合)`, type: 'buff' });
  }
  if (effect.defBoost) {
    result.playerDefBoost = effect.defBoost;
    log.push({ text: `DEF +${effect.defBoost}`, type: 'buff' });
  }
  if (effect.crtBoost) {
    result.playerCrtBoost = effect.crtBoost;
    result.duration = effect.duration || 2;
    log.push({ text: `CRT +${effect.crtBoost}% (${result.duration}回合)`, type: 'buff' });
  }
  
  // 减防
  if (effect.enemyDefReduce && !result.enemyDefReduce) {
    result.enemyDefReduce = effect.enemyDefReduce;
    result.duration = effect.duration || 2;
    log.push({ text: `敌人防御降低 ${Math.floor(effect.enemyDefReduce * 100)}% (${result.duration}回合)`, type: 'debuff' });
  }
  
  // 额外攻击
  if (effect.extraAtk) {
    result.extraAttacks = effect.extraAtk;
    log.push({ text: `额外攻击 ${effect.extraAtk} 次`, type: 'buff' });
  }
  if (effect.absorb) {
    result.absorb = effect.absorb;
    log.push({ text: `分身吸收 ${Math.floor(effect.absorb * 100)}% 伤害`, type: 'buff' });
  }
  
  // 净化
  if (effect.cleanse) {
    result.cleanse = true;
    log.push({ text: '负面状态已清除！', type: 'heal' });
  }
  
  return result;
}

/**
 * 每回合冷却递减
 */
export function tickAbilityCooldowns() {
  for (const id of Object.keys(_combatAbilityState)) {
    if (_combatAbilityState[id].cooldown > 0) {
      _combatAbilityState[id].cooldown--;
    }
  }
}

/**
 * 渲染战斗中可选同伴技能列表（HTML）
 */
export function renderAbilitySelector() {
  const abilities = getAvailableAbilities();
  if (abilities.length === 0) return '';
  
  let html = '<div style="margin-top:8px;border-top:1px solid #333;padding-top:8px;">';
  html += '<p style="color:#ffcc44;font-size:11px;margin-bottom:6px;">同伴技能 (数字键1-8选择)</p>';
  
  abilities.forEach((a, i) => {
    const ready = a.ready;
    const opacity = ready ? 1 : 0.4;
    const cdText = a.cooldownLeft > 0 ? `CD:${a.cooldownLeft}` : (a.usesLeft <= 0 ? '已耗尽' : '');
    html += `<div style="display:flex;align-items:center;gap:6px;padding:3px 0;opacity:${opacity};">
      <span style="color:#ffcc44;font-size:10px;width:14px;">${i + 1}</span>
      <span style="font-size:14px;">${a.icon}</span>
      <span style="color:#ccc;font-size:11px;flex:1;">${a.companionName}·${a.name}</span>
      <span style="color:#666;font-size:9px;">${cdText} [${a.usesLeft}]</span>
    </div>`;
  });
  
  html += '</div>';
  return html;
}

/**
 * 渲染同伴技能面板（非战斗时查看）
 */
export function renderAbilitiesPanel() {
  const companions = gameState.companions || [];
  const relationships = gameState.relationships || {};
  
  let html = '<div style="max-width:400px;margin:0 auto;">';
  
  for (const c of companions) {
    if (!c.alive) continue;
    const ability = COMPANION_ABILITIES[c.id];
    if (!ability) continue;
    const rel = relationships[c.id] || 0;
    const unlocked = rel >= ability.relReq;
    const effect = ability.effect(rel);
    
    const tierName = rel >= 71 ? '究极' : (rel >= 41 ? '强化' : (rel >= 11 ? '基础' : '未解锁'));
    const tierColor = rel >= 71 ? '#ffaa00' : (rel >= 41 ? '#44aaff' : (rel >= 11 ? '#44cc88' : '#555'));
    
    html += `<div style="background:rgba(255,255,255,0.03);border-radius:8px;padding:8px 10px;margin-bottom:6px;border-left:3px solid ${tierColor};">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
        <span style="font-size:16px;">${ability.icon}</span>
        <span style="color:#ccc;font-size:13px;font-weight:bold;">${c.name}·${ability.name}</span>
        <span style="color:${tierColor};font-size:10px;margin-left:auto;">${tierName}</span>
      </div>
      <p style="color:#888;font-size:10px;margin-bottom:2px;">${ability.desc}</p>
      ${unlocked ? `<p style="color:#666;font-size:9px;">CD: ${ability.cooldown}回合 · 次数: ${ability.maxUses} · 类型: ${ability.type}</p>` : `<p style="color:#555;font-size:9px;">需要关系等级 ≥ ${ability.relReq} (当前: ${rel})</p>`}
    </div>`;
  }
  
  html += '</div>';
  return html;
}
