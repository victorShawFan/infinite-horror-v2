// ═══════════════════════════════════════════════════════════════
// 战场环境效果系统 — 让每章战斗有独特氛围和机制
// ═══════════════════════════════════════════════════════════════
//
// 每个章节的战斗场景有不同的环境效果：
// - 视觉背景色和粒子
// - 战斗机制修改（DoT、属性增减等）
// - 特殊回合事件
//
// 这些效果在战斗预览和实战中都会体现。

import { eventBus } from './EventBus.js';

// ── 章节战场环境定义 ──
export const BATTLE_ENVIRONMENTS = {
  1: {
    name: '生化实验室',
    desc: '密闭空间中弥漫着T病毒。',
    bgGradient: 'linear-gradient(180deg, #1a0808 0%, #0a1a0a 100%)',
    ambientColor: '#44ff4420',
    effects: [
      { type: 'dot', chance: 0.15, damage: 3, name: '病毒感染', icon: '☣', desc: '每回合可能受到3点病毒伤害' },
    ],
    particleChar: '☣',
    particleColor: '#44ff44',
  },
  2: {
    name: '异形巢穴',
    desc: '酸液从天花板滴落，异形的嘶叫声此起彼伏。',
    bgGradient: 'linear-gradient(180deg, #0a0a1a 0%, #001a00 100%)',
    ambientColor: '#44ff8820',
    effects: [
      { type: 'acid_floor', chance: 0.10, damage: 5, name: '酸液溅射', icon: '💧', desc: '酸液偶尔溅到双方，造成5点伤害' },
    ],
    particleChar: '◆',
    particleColor: '#44ff88',
  },
  3: {
    name: '咒怨宅邸',
    desc: '阴冷的气息渗入骨髓。恐惧本身就是武器。',
    bgGradient: 'linear-gradient(180deg, #0a0010 0%, #1a0020 100%)',
    ambientColor: '#8844cc20',
    effects: [
      { type: 'fear', chance: 0.12, atkReduction: 2, name: '恐惧侵蚀', icon: '👁', desc: '恐惧可能降低攻击力2点（持续1回合）' },
    ],
    particleChar: '✦',
    particleColor: '#8844cc',
  },
  4: {
    name: '古埃及陵墓',
    desc: '远古的诅咒在空气中弥漫。沙砾不断从裂缝中涌出。',
    bgGradient: 'linear-gradient(180deg, #1a1008 0%, #0e0604 100%)',
    ambientColor: '#ddaa4420',
    effects: [
      { type: 'sandstorm', chance: 0.10, spdReduction: 1, name: '沙暴干扰', icon: '🌪', desc: '沙暴可能降低双方速度1点' },
    ],
    particleChar: '⬥',
    particleColor: '#ddaa44',
  },
  5: {
    name: '死神领域',
    desc: '命运的丝线在空中若隐若现。每一刻都可能是最后一刻。',
    bgGradient: 'linear-gradient(180deg, #08080f 0%, #0a0a18 100%)',
    ambientColor: '#8899bb20',
    effects: [
      { type: 'fate', chance: 0.08, critBonus: 10, name: '命运之眼', icon: '⚖', desc: '偶尔触发命运之眼，暴击率+10%持续1回合' },
    ],
    particleChar: '†',
    particleColor: '#8899bb',
  },
  6: {
    name: '深海设施',
    desc: '海水渗透，金属锈蚀。异形的进化让空气充满危险。',
    bgGradient: 'linear-gradient(180deg, #050a1a 0%, #001a10 100%)',
    ambientColor: '#2288aa20',
    effects: [
      { type: 'corrosion', chance: 0.12, defReduction: 2, name: '腐蚀环境', icon: '🔬', desc: '腐蚀可能降低双方防御2点（持续1回合）' },
    ],
    particleChar: '🫧',
    particleColor: '#2288aa',
  },
  7: {
    name: '浣熊市废墟',
    desc: '恶魔队的气息笼罩着战场。空气中充满了敌意和杀气。',
    bgGradient: 'linear-gradient(180deg, #1a0505 0%, #0a0000 100%)',
    ambientColor: '#ff444420',
    effects: [
      { type: 'killing_intent', chance: 0.10, atkBonus: 3, name: '杀意共鸣', icon: '🔥', desc: '战场杀意偶尔激发双方攻击力+3（持续1回合）' },
    ],
    particleChar: '🔥',
    particleColor: '#ff4444',
  },
  8: {
    name: '中洲原野',
    desc: '广袤的原野上，龙的吐息和精灵的歌声交织。',
    bgGradient: 'linear-gradient(180deg, #0a1a08 0%, #081a18 100%)',
    ambientColor: '#88cc4420',
    effects: [
      { type: 'nature_healing', chance: 0.10, heal: 5, name: '自然之力', icon: '🍃', desc: '大自然偶尔恢复双方5点HP' },
    ],
    particleChar: '🍃',
    particleColor: '#88cc44',
  },
  9: {
    name: '虫族战场',
    desc: '脚下的虫巢在震动。成千上万的虫族在地底蠕动。',
    bgGradient: 'linear-gradient(180deg, #1a1a0a 0%, #0a0a00 100%)',
    ambientColor: '#aaff2220',
    effects: [
      { type: 'tremor', chance: 0.08, stunChance: 0.15, name: '地面震颤', icon: '💥', desc: '虫巢震动有概率眩晕（跳过回合）' },
    ],
    particleChar: '★',
    particleColor: '#aaccff',
  },
  10: {
    name: '五队战场',
    desc: '多支轮回者队伍的力量在此碰撞。压力前所未有。',
    bgGradient: 'linear-gradient(180deg, #1a0a00 0%, #0a0010 100%)',
    ambientColor: '#ffaa2220',
    effects: [
      { type: 'pressure', chance: 0.10, allBonus: 2, name: '战场压迫', icon: '⚔', desc: '战场压力偶尔提升双方全属性+2（持续1回合）' },
    ],
    particleChar: '⚔',
    particleColor: '#ffaa22',
  },
  11: {
    name: '梦境边界',
    desc: '现实与梦境的边界在此模糊。心灵之战在所难免。',
    bgGradient: 'linear-gradient(180deg, #100020 0%, #000a1a 100%)',
    ambientColor: '#cc66ff20',
    effects: [
      { type: 'psychic_field', chance: 0.12, manaRegen: 3, name: '精神力场', icon: '🧠', desc: '精神力场偶尔恢复3点法力' },
    ],
    particleChar: '◉',
    particleColor: '#cc66ff',
  },
  12: {
    name: '主神核心',
    desc: '这是最终的战场。主神的意志在此具现化。一切的终结。',
    bgGradient: 'linear-gradient(180deg, #1a0808 0%, #080008 100%)',
    ambientColor: '#ff664420',
    effects: [
      { type: 'lord_god_will', chance: 0.15, randomBuff: true, name: '主神意志', icon: '👁', desc: '主神意志随机强化或削弱战斗者' },
    ],
    particleChar: '💀',
    particleColor: '#ff6644',
  },
};

/**
 * 获取当前章节的战场环境
 * @param {number} chapter - 章节号
 * @returns {Object} 环境配置
 */
export function getBattleEnvironment(chapter) {
  return BATTLE_ENVIRONMENTS[chapter] || BATTLE_ENVIRONMENTS[1];
}

/**
 * 处理回合环境效果
 * @param {number} chapter - 章节号
 * @param {Object} player - 玩家数据
 * @param {Object} enemy - 敌人数据
 * @param {number} round - 当前回合
 * @returns {Array} 触发的效果日志
 */
/**
 * 处理回合环境效果 — 返回结构化数值变化
 * @param {number} chapter - 章节号
 * @param {Object} player - { hp, maxHp, mana, maxMana }
 * @param {Object} enemy - { hp }
 * @param {number} round - 当前回合
 * @returns {Object} { logs, playerHpDelta, enemyHpDelta, manaDelta, playerAtkMod, playerDefMod, enemyAtkMod, enemyDefMod, playerSpdMod, playerCritMod, skipPlayerTurn, skipEnemyTurn }
 */
export function processEnvironmentEffect(chapter, player, enemy, round) {
  const env = getBattleEnvironment(chapter);
  const logs = [];
  const result = {
    logs,
    playerHpDelta: 0,
    enemyHpDelta: 0,
    manaDelta: 0,
    playerAtkMod: 0,    // 本回合临时攻击力加减
    playerDefMod: 0,    // 本回合临时防御加减
    enemyAtkMod: 0,
    enemyDefMod: 0,
    playerSpdMod: 0,
    enemySpdMod: 0,
    playerCritMod: 0,   // 暴击率加成（百分比）
    skipPlayerTurn: false,
    skipEnemyTurn: false,
  };
  
  for (const effect of env.effects) {
    if (Math.random() > effect.chance) continue;
    
    switch (effect.type) {
      case 'dot': {
        // Ch1 病毒：仅伤害玩家
        const dmg = effect.damage;
        const actualDmg = Math.min(dmg, player.hp + result.playerHpDelta - 1); // 保底1HP
        if (actualDmg > 0) result.playerHpDelta -= actualDmg;
        logs.push({ text: `${effect.icon} ${effect.name}！受到 ${actualDmg} 点环境伤害`, type: 'environment' });
        break;
      }
      case 'acid_floor': {
        // Ch2 酸液：双方受伤
        const dmg = effect.damage;
        const pDmg = Math.min(dmg, player.hp + result.playerHpDelta - 1);
        const eDmg = Math.min(dmg, enemy.hp + result.enemyHpDelta - 1);
        if (pDmg > 0) result.playerHpDelta -= pDmg;
        if (eDmg > 0) result.enemyHpDelta -= eDmg;
        logs.push({ text: `${effect.icon} ${effect.name}！双方各受 ${dmg} 点伤害`, type: 'environment' });
        break;
      }
      case 'fear': {
        // Ch3 恐惧：降低玩家攻击力
        result.playerAtkMod -= effect.atkReduction;
        logs.push({ text: `${effect.icon} ${effect.name}！攻击力 -${effect.atkReduction}`, type: 'environment_debuff' });
        break;
      }
      case 'sandstorm': {
        // Ch4 沙暴：降低双方速度
        result.playerSpdMod -= effect.spdReduction;
        result.enemySpdMod -= effect.spdReduction;
        logs.push({ text: `${effect.icon} ${effect.name}！双方速度 -${effect.spdReduction}`, type: 'environment_debuff' });
        break;
      }
      case 'fate': {
        // Ch5 命运之眼：暴击率提升
        result.playerCritMod += effect.critBonus;
        logs.push({ text: `${effect.icon} ${effect.name}！暴击率 +${effect.critBonus}%`, type: 'environment_buff' });
        break;
      }
      case 'corrosion': {
        // Ch6 腐蚀：降低双方防御
        result.playerDefMod -= effect.defReduction;
        result.enemyDefMod -= effect.defReduction;
        logs.push({ text: `${effect.icon} ${effect.name}！双方防御 -${effect.defReduction}`, type: 'environment_debuff' });
        break;
      }
      case 'killing_intent': {
        // Ch7 杀意共鸣：双方攻击力提升
        result.playerAtkMod += effect.atkBonus;
        result.enemyAtkMod += effect.atkBonus;
        logs.push({ text: `${effect.icon} ${effect.name}！双方攻击力 +${effect.atkBonus}`, type: 'environment_buff' });
        break;
      }
      case 'nature_healing': {
        // Ch8 自然之力：双方恢复HP
        const pHeal = Math.min(effect.heal, (player.maxHp || 999) - player.hp - result.playerHpDelta);
        if (pHeal > 0) result.playerHpDelta += pHeal;
        // 也治疗敌人
        result.enemyHpDelta += effect.heal;
        logs.push({ text: `${effect.icon} ${effect.name}！双方恢复 ${effect.heal} HP`, type: 'environment_heal' });
        break;
      }
      case 'tremor': {
        // Ch9 虫巢震颤：有概率眩晕玩家（跳过回合）
        if (Math.random() < effect.stunChance) {
          result.skipPlayerTurn = true;
          logs.push({ text: `${effect.icon} ${effect.name}！你被震倒，本回合无法行动！`, type: 'environment_debuff' });
        } else {
          logs.push({ text: `${effect.icon} ${effect.name}！地面轻微颤动`, type: 'environment' });
        }
        break;
      }
      case 'pressure': {
        // Ch10 多队压力：双方攻击和暴击上升
        result.playerAtkMod += effect.atkBonus || 2;
        result.enemyAtkMod += effect.atkBonus || 2;
        result.playerCritMod += 5;
        logs.push({ text: `${effect.icon} ${effect.name}！战场气势提升，双方攻击力 +${effect.atkBonus || 2}`, type: 'environment_buff' });
        break;
      }
      case 'psychic_field': {
        // Ch11 精神力场：恢复法力
        if (player.maxMana > 0) {
          const manaGain = Math.min(effect.manaRegen, player.maxMana - (player.mana || 0) - result.manaDelta);
          if (manaGain > 0) result.manaDelta += manaGain;
        }
        logs.push({ text: `${effect.icon} ${effect.name}！精神力恢复 +${effect.manaRegen}`, type: 'environment_buff' });
        break;
      }
      case 'lord_god_will': {
        // Ch12 主神意志：随机强化或削弱
        const isPositive = Math.random() > 0.5;
        if (isPositive) {
          result.playerAtkMod += 3;
          result.playerDefMod += 2;
          logs.push({ text: `${effect.icon} 主神意志：获得祝福！攻击+3 防御+2`, type: 'environment_buff' });
        } else {
          result.playerAtkMod -= 2;
          result.enemyAtkMod += 3;
          logs.push({ text: `${effect.icon} 主神意志：受到诅咒！攻击-2 敌人攻击+3`, type: 'environment_debuff' });
        }
        break;
      }
    }
  }
  
  return result;
}

/**
 * 生成战斗环境描述HTML（用于战前预览）
 */
export function formatEnvironmentHTML(chapter) {
  const env = getBattleEnvironment(chapter);
  if (!env) return '';
  
  const effectsHTML = env.effects.map(e => 
    `<span style="color:#888;font-size:10px;">${e.icon} ${e.name}: ${e.desc}</span>`
  ).join('<br>');
  
  return `
    <div style="
      background: ${env.bgGradient}; 
      border: 1px solid ${env.ambientColor};
      border-radius: 6px; padding: 8px 10px; margin-top: 8px;
    ">
      <p style="color:#999;font-size:11px;margin-bottom:4px;">
        🌍 <span style="color:#aaa;">${env.name}</span>
      </p>
      <p style="color:#666;font-size:10px;font-style:italic;margin-bottom:4px;">
        ${env.desc}
      </p>
      ${effectsHTML}
    </div>
  `;
}
