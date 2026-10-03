// ═══════════════════════════════════════════════════════════════
// 主动技能系统 — 基因锁技能 + 血统技能 + 状态效果
// ═══════════════════════════════════════════════════════════════
//
// 设计说明：
//   本模块为回合制战斗提供主动技能层，与 CombatSystem.js 的自动
//   对撞互补。每个技能由 SKILL_DEFINITIONS 静态定义，运行时通过
//   combatState.cooldowns / combatState.statusEffects 追踪状态。
//
// combatState 结构约定：
//   {
//     cooldowns:     { [skillId]: 剩余冷却回合数 },
//     statusEffects: { player: [], enemy: [] },
//     turn:          当前回合数,
//   }
// ═══════════════════════════════════════════════════════════════

import { BLOODLINE, GENE_LOCK, DAMAGE_TYPE } from './constants.js';

// ─────────────────────────────────────────────
// 状态效果类型常量
// ─────────────────────────────────────────────
export const STATUS_EFFECT = {
  BURN:       'burn',        // 每回合火焰伤害
  FREEZE:     'freeze',      // 冻结：跳过下一回合
  POISON:     'poison',      // 每回合毒伤害（可叠加）
  STUN:       'stun',        // 眩晕：跳过下一回合
  BUFF_ATK:   'buff_atk',   // 攻击力加成
  BUFF_DEF:   'buff_def',   // 防御力加成
  BUFF_CRT:   'buff_crt',   // 暴击率加成
  DEBUFF_ATK: 'debuff_atk', // 攻击力削弱
};

// ─────────────────────────────────────────────
// 技能定义
// ─────────────────────────────────────────────
// 所有技能统一结构：
//   id         - 唯一标识
//   name       - 中文名称
//   desc       - 技能描述
//   type       - 'gene_lock' | 'bloodline'
//   unlockReq  - 解锁条件 { geneLock?, bloodline? }
//   manaCost   - 法力消耗
//   cooldown   - 冷却回合数
//   execute    - (player, enemy, combatState) => { log[], effects[] }
// ─────────────────────────────────────────────

export const SKILL_DEFINITIONS = {

  // ═══════════════════════════════════════════
  // 基因锁技能 — 按阶段解锁
  // ═══════════════════════════════════════════

  /** 第一阶段：感知增幅 — 暴击率 +30%，持续3回合 */
  sensory_boost: {
    id: 'sensory_boost',
    name: '感知增幅',
    desc: '开启基因锁第一阶感知，暴击率+30%持续3回合',
    type: 'gene_lock',
    unlockReq: { geneLock: GENE_LOCK.STAGE_1 },
    manaCost: 0,
    cooldown: 5,
    execute(player, _enemy, _combatState) {
      const log = [];
      const effects = [];

      log.push({ text: '🧬 基因锁·感知增幅！暴击率大幅提升！', type: 'skill' });

      effects.push({
        target: 'player',
        effect: { type: STATUS_EFFECT.BUFF_CRT, value: 30, duration: 3, source: 'sensory_boost' },
      });

      return { log, effects };
    },
  },

  /** 第二阶段：肌肉控制 — 下一次攻击伤害翻倍 */
  muscle_control: {
    id: 'muscle_control',
    name: '肌肉控制',
    desc: '精确控制每一根肌纤维，下一次攻击造成2倍伤害',
    type: 'gene_lock',
    unlockReq: { geneLock: GENE_LOCK.STAGE_2 },
    manaCost: 0,
    cooldown: 4,
    execute(player, enemy, _combatState) {
      const log = [];
      const effects = [];

      // 直接对敌人造成 2x 攻击伤害
      const damage = player.atk * 2;
      enemy.hp = Math.max(0, (enemy.hp || 0) - damage);

      log.push({ text: `🧬 基因锁·肌肉控制！全力一击造成 ${damage} 伤害！`, type: 'skill' });

      return { log, effects };
    },
  },

  /** 第三阶段：模拟思维 — 预判敌人攻击，闪避下一击 */
  simulation_mind: {
    id: 'simulation_mind',
    name: '模拟思维',
    desc: '在脑内模拟千种可能，完美闪避敌人下一次攻击',
    type: 'gene_lock',
    unlockReq: { geneLock: GENE_LOCK.STAGE_3 },
    manaCost: 0,
    cooldown: 6,
    execute(player, _enemy, _combatState) {
      const log = [];
      const effects = [];

      log.push({ text: '🧬 基因锁·模拟思维！看穿了敌人的攻击轨迹！', type: 'skill' });

      // 给予玩家超高防御buff模拟完美闪避（100%减伤=跳过敌人攻击）
      effects.push({
        target: 'player',
        effect: { type: STATUS_EFFECT.BUFF_DEF, value: 9999, duration: 1, source: 'simulation_mind' },
      });

      return { log, effects };
    },
  },

  /** 第四阶段：心灵之光 — 恢复30%HP + 全属性+20%持续3回合 */
  heart_light: {
    id: 'heart_light',
    name: '心灵之光',
    desc: '基因锁最终阶，生命之光涌现：恢复30%HP，全属性+20%持续3回合',
    type: 'gene_lock',
    unlockReq: { geneLock: GENE_LOCK.STAGE_4 },
    manaCost: 0,
    cooldown: 8,
    execute(player, _enemy, _combatState) {
      const log = [];
      const effects = [];

      // 立即恢复30%最大HP
      const healAmount = Math.floor(player.maxHp * 0.3);
      player.hp = Math.min(player.maxHp, player.hp + healAmount);

      log.push({ text: `🧬 基因锁·心灵之光！恢复 ${healAmount} HP！`, type: 'heal' });
      log.push({ text: '🧬 全属性提升20%！', type: 'skill' });

      // 全属性+20%持续3回合
      effects.push({
        target: 'player',
        effect: { type: STATUS_EFFECT.BUFF_ATK, value: 20, duration: 3, source: 'heart_light' },
      });
      effects.push({
        target: 'player',
        effect: { type: STATUS_EFFECT.BUFF_DEF, value: 20, duration: 3, source: 'heart_light' },
      });
      effects.push({
        target: 'player',
        effect: { type: STATUS_EFFECT.BUFF_CRT, value: 20, duration: 3, source: 'heart_light' },
      });

      return { log, effects };
    },
  },

  // ═══════════════════════════════════════════
  // 血统技能 — 按血统类型解锁
  // ═══════════════════════════════════════════

  /** 血族·吸血之触 — 造成伤害并回复伤害量50%的HP */
  blood_drain: {
    id: 'blood_drain',
    name: '吸血之触',
    desc: '汲取敌人生命精华，造成伤害并回复伤害量50%的HP',
    type: 'bloodline',
    unlockReq: { bloodline: BLOODLINE.VAMPIRE },
    manaCost: 0,
    cooldown: 3,
    execute(player, enemy, _combatState) {
      const log = [];
      const effects = [];

      const damage = player.atk;
      enemy.hp = Math.max(0, (enemy.hp || 0) - damage);

      const healAmount = Math.floor(damage * 0.5);
      player.hp = Math.min(player.maxHp, player.hp + healAmount);

      log.push({ text: `🩸 吸血之触！造成 ${damage} 伤害，回复 ${healAmount} HP！`, type: 'skill' });

      return { log, effects };
    },
  },

  /** 古武·虎拳 — 3倍攻击力单体重击 */
  tiger_fist: {
    id: 'tiger_fist',
    name: '虎拳',
    desc: '古武秘传绝技，凝聚全身力量的一击，造成3倍攻击力伤害',
    type: 'bloodline',
    unlockReq: { bloodline: BLOODLINE.ANCIENT_WU },
    manaCost: 0,
    cooldown: 4,
    execute(player, enemy, _combatState) {
      const log = [];
      const effects = [];

      const damage = player.atk * 3;
      enemy.hp = Math.max(0, (enemy.hp || 0) - damage);

      log.push({ text: `🐯 古武·虎拳！重击造成 ${damage} 伤害！`, type: 'skill' });

      return { log, effects };
    },
  },

  /** 武修·铁布衫 — 所有受到的伤害减少50%，持续3回合 */
  iron_body: {
    id: 'iron_body',
    name: '铁布衫',
    desc: '武修护体真气，所有受到的伤害减少50%持续3回合',
    type: 'bloodline',
    unlockReq: { bloodline: BLOODLINE.MARTIAL },
    manaCost: 0,
    cooldown: 5,
    execute(player, _enemy, _combatState) {
      const log = [];
      const effects = [];

      log.push({ text: '🛡 武修·铁布衫！防御力大幅提升！', type: 'skill' });

      // 50%减伤用防御加成百分比表示
      effects.push({
        target: 'player',
        effect: { type: STATUS_EFFECT.BUFF_DEF, value: 50, duration: 3, source: 'iron_body' },
      });

      return { log, effects };
    },
  },

  /** 道法·雷咒 — 法术伤害=ATK*1.5，无视物防 */
  thunder_spell: {
    id: 'thunder_spell',
    name: '雷咒',
    desc: '召唤天雷轰击，法术伤害=攻击力×1.5，无视物理防御',
    type: 'bloodline',
    unlockReq: { bloodline: BLOODLINE.DAOIST },
    manaCost: 15,
    cooldown: 3,
    execute(player, enemy, _combatState) {
      const log = [];
      const effects = [];

      // 无视DEF，纯法术伤害
      const damage = Math.floor(player.atk * 1.5);
      enemy.hp = Math.max(0, (enemy.hp || 0) - damage);

      log.push({ text: `⚡ 道法·雷咒！天雷造成 ${damage} 法术伤害！（无视物防）`, type: 'spell' });

      return { log, effects };
    },
  },

  /** 龙族·龙息 — 火焰伤害 + 灼烧3回合 */
  dragon_breath: {
    id: 'dragon_breath',
    name: '龙息',
    desc: '喷吐龙炎，造成火焰伤害并使敌人灼烧3回合',
    type: 'bloodline',
    unlockReq: { bloodline: BLOODLINE.DRAGON },
    manaCost: 20,
    cooldown: 4,
    execute(player, enemy, _combatState) {
      const log = [];
      const effects = [];

      // 初始火焰伤害
      const damage = Math.floor(player.atk * 1.2);
      enemy.hp = Math.max(0, (enemy.hp || 0) - damage);

      log.push({ text: `🐉 龙息！火焰造成 ${damage} 伤害！`, type: 'skill' });

      // 灼烧效果：每回合ATK*0.3的持续伤害，持续3回合
      const burnDmg = Math.max(1, Math.floor(player.atk * 0.3));
      effects.push({
        target: 'enemy',
        effect: { type: STATUS_EFFECT.BURN, value: burnDmg, duration: 3, source: 'dragon_breath' },
      });

      log.push({ text: `🔥 敌人陷入灼烧！每回合 ${burnDmg} 火伤害，持续3回合`, type: 'burn' });

      return { log, effects };
    },
  },

  /** 精神系·心灵碾压 — 精神伤害 + 眩晕1回合 */
  mind_crush: {
    id: 'mind_crush',
    name: '心灵碾压',
    desc: '释放精神冲击波，造成精神伤害并眩晕敌人1回合',
    type: 'bloodline',
    unlockReq: { bloodline: BLOODLINE.PSYCHIC },
    manaCost: 12,
    cooldown: 3,
    execute(player, enemy, _combatState) {
      const log = [];
      const effects = [];

      // 精神伤害基于ATK，无视普通DEF
      const damage = Math.floor(player.atk * 1.1);
      enemy.hp = Math.max(0, (enemy.hp || 0) - damage);

      log.push({ text: `🧠 心灵碾压！精神冲击造成 ${damage} 伤害！`, type: 'skill' });

      // 眩晕效果
      effects.push({
        target: 'enemy',
        effect: { type: STATUS_EFFECT.STUN, value: 0, duration: 1, source: 'mind_crush' },
      });

      log.push({ text: '💫 敌人被眩晕了！下回合无法行动', type: 'debuff' });

      return { log, effects };
    },
  },

  // ═══════════════════════════════════════════
  // 通用技能 — 无需特殊解锁
  // ═══════════════════════════════════════════

  /** 急速突刺 — 高速近战攻击 */
  quick_strike: {
    id: 'quick_strike',
    name: '急速突刺',
    desc: '以极快速度攻击，造成120%ATK伤害，25%概率追加一击',
    type: 'gene_lock',
    unlockReq: { geneLock: 0 },
    manaCost: 0,
    cooldown: 2,
    execute(player, enemy, _cs) {
      const log = [];
      const effects = [];
      const dmg = Math.floor(player.atk * 1.2);
      enemy.hp = Math.max(0, (enemy.hp || 0) - dmg);
      log.push({ text: '⚡ 急速突刺！造成 ' + dmg + ' 伤害！', type: 'skill' });
      if (Math.random() < 0.25) {
        const bonus = Math.floor(player.atk * 0.6);
        enemy.hp = Math.max(0, (enemy.hp || 0) - bonus);
        log.push({ text: '⚡⚡ 追加攻击！额外 ' + bonus + ' 伤害！', type: 'critical' });
      }
      return { log, effects };
    },
  },

  /** 战吼 — 提升自身ATK和CRT */
  war_cry: {
    id: 'war_cry',
    name: '战吼',
    desc: '激发战意，ATK+25%和CRT+15%持续4回合',
    type: 'gene_lock',
    unlockReq: { geneLock: 0 },
    manaCost: 0,
    cooldown: 6,
    execute(player, _enemy, _cs) {
      const log = [];
      const effects = [];
      log.push({ text: '🔊 战吼！力量在沸腾！', type: 'skill' });
      effects.push({
        target: 'player',
        effect: { type: 'buff_atk', value: Math.floor(player.atk * 0.25), duration: 4, source: 'war_cry' },
      });
      effects.push({
        target: 'player',
        effect: { type: 'buff_crt', value: 15, duration: 4, source: 'war_cry' },
      });
      return { log, effects };
    },
  },

  /** 弱点分析 — 降低敌人防御 */
  analyze_weakness: {
    id: 'analyze_weakness',
    name: '弱点分析',
    desc: '分析敌人弱点，降低敌人DEF 40%持续3回合',
    type: 'gene_lock',
    unlockReq: { geneLock: 1 },
    manaCost: 0,
    cooldown: 5,
    execute(_player, enemy, _cs) {
      const log = [];
      const effects = [];
      const defReduce = Math.floor((enemy.def || 0) * 0.4);
      log.push({ text: '🔍 弱点分析！发现了敌人的防御缺陷！DEF-' + defReduce, type: 'skill' });
      effects.push({
        target: 'enemy',
        effect: { type: 'debuff_atk', value: -defReduce, duration: 3, source: 'analyze_weakness' },
      });
      return { log, effects };
    },
  },

  // ═══════════════════════════════════════════
  // 血统技能 — 按血统解锁
  // ═══════════════════════════════════════════

  /** 血族：暗夜之拥 — 大量吸血 */
  embrace_of_night: {
    id: 'embrace_of_night',
    name: '暗夜之拥',
    desc: '释放血族之力，造成150%ATK暗属性伤害，恢复伤害的40%HP',
    type: 'bloodline',
    unlockReq: { bloodline: 'vampire' },
    manaCost: 10,
    cooldown: 5,
    execute(player, enemy, _cs) {
      const log = [];
      const effects = [];
      const dmg = Math.floor(player.atk * 1.5);
      enemy.hp = Math.max(0, (enemy.hp || 0) - dmg);
      const heal = Math.floor(dmg * 0.4);
      player.hp = Math.min(player.maxHp || 999, (player.hp || 0) + heal);
      log.push({ text: '🩸 暗夜之拥！造成 ' + dmg + ' 暗属性伤害，恢复 ' + heal + ' HP！', type: 'skill' });
      return { log, effects };
    },
  },

  /** 古武：碎岩拳 — 无视防御的物理攻击 */
  shatter_fist: {
    id: 'shatter_fist',
    name: '碎岩拳',
    desc: '古武绝技，造成200%ATK伤害（无视50%防御）',
    type: 'bloodline',
    unlockReq: { bloodline: 'ancient_wu' },
    manaCost: 0,
    cooldown: 4,
    execute(player, enemy, _cs) {
      const log = [];
      const effects = [];
      const rawDmg = Math.floor(player.atk * 2.0);
      const defIgnore = Math.floor((enemy.def || 0) * 0.5);
      const actualDmg = Math.max(1, rawDmg - (enemy.def || 0) + defIgnore);
      enemy.hp = Math.max(0, (enemy.hp || 0) - actualDmg);
      log.push({ text: '👊 碎岩拳！无视防御造成 ' + actualDmg + ' 伤害！', type: 'skill' });
      return { log, effects };
    },
  },

  /** 武修：铁壁 — 大幅提升防御 */
  iron_fortress: {
    id: 'iron_fortress',
    name: '铁壁',
    desc: '武修防御术，DEF+80%持续3回合，被攻击时反弹15%伤害',
    type: 'bloodline',
    unlockReq: { bloodline: 'martial' },
    manaCost: 0,
    cooldown: 5,
    execute(player, _enemy, _cs) {
      const log = [];
      const effects = [];
      const defBuff = Math.floor((player.def || 10) * 0.8);
      log.push({ text: '🛡 铁壁！防御力大幅提升！DEF+' + defBuff, type: 'skill' });
      effects.push({
        target: 'player',
        effect: { type: 'buff_def', value: defBuff, duration: 3, source: 'iron_fortress' },
      });
      return { log, effects };
    },
  },

  /** 道法：天雷咒 — AOE雷属性伤害 */
  heavenly_thunder: {
    id: 'heavenly_thunder',
    name: '天雷咒',
    desc: '召唤天雷，造成180%ATK雷属性伤害，30%概率眩晕1回合',
    type: 'bloodline',
    unlockReq: { bloodline: 'daoist' },
    manaCost: 15,
    cooldown: 4,
    execute(player, enemy, _cs) {
      const log = [];
      const effects = [];
      const dmg = Math.floor(player.atk * 1.8);
      enemy.hp = Math.max(0, (enemy.hp || 0) - dmg);
      log.push({ text: '⚡ 天雷咒！雷霆降世造成 ' + dmg + ' 伤害！', type: 'skill' });
      if (Math.random() < 0.3) {
        effects.push({
          target: 'enemy',
          effect: { type: 'stun', value: 0, duration: 1, source: 'heavenly_thunder' },
        });
        log.push({ text: '💫 雷击眩晕！敌人无法行动！', type: 'debuff' });
      }
      return { log, effects };
    },
  },

  /** 道法：金光咒 — 治疗+净化 */
  golden_light: {
    id: 'golden_light',
    name: '金光咒',
    desc: '道法治愈术，恢复30%MaxHP并清除所有负面状态',
    type: 'bloodline',
    unlockReq: { bloodline: 'daoist' },
    manaCost: 12,
    cooldown: 6,
    execute(player, _enemy, combatState) {
      const log = [];
      const effects = [];
      const heal = Math.floor((player.maxHp || 100) * 0.3);
      player.hp = Math.min(player.maxHp || 999, (player.hp || 0) + heal);
      log.push({ text: '✨ 金光咒！恢复 ' + heal + ' HP！', type: 'skill' });
      // 清除负面状态
      if (combatState && combatState.statusEffects) {
        const before = (combatState.statusEffects.player || []).length;
        combatState.statusEffects.player = (combatState.statusEffects.player || []).filter(e =>
          !['burn', 'freeze', 'poison', 'stun', 'debuff_atk'].includes(e.type)
        );
        const cleared = before - combatState.statusEffects.player.length;
        if (cleared > 0) {
          log.push({ text: '💫 净化！清除了 ' + cleared + ' 个负面效果！', type: 'buff' });
        }
      }
      return { log, effects };
    },
  },

  // ═══════════════════════════════════════════
  // 高阶基因锁技能
  // ═══════════════════════════════════════════

  /** 第二阶：连环斩 — 多段攻击 */
  chain_slash: {
    id: 'chain_slash',
    name: '连环斩',
    desc: '基因锁加速出手，连续攻击3次，每次造成80%ATK伤害',
    type: 'gene_lock',
    unlockReq: { geneLock: 2 },
    manaCost: 0,
    cooldown: 4,
    execute(player, enemy, _cs) {
      const log = [];
      const effects = [];
      let total = 0;
      for (let i = 0; i < 3; i++) {
        const dmg = Math.floor(player.atk * 0.8);
        enemy.hp = Math.max(0, (enemy.hp || 0) - dmg);
        total += dmg;
      }
      log.push({ text: '🗡🗡🗡 连环斩！三连击造成 ' + total + ' 总伤害！', type: 'skill' });
      return { log, effects };
    },
  },

  /** 第三阶：零点狙击 — 必定暴击的精准攻击 */
  zero_shot: {
    id: 'zero_shot',
    name: '零点狙击',
    desc: '模拟思维锁定弱点，必定暴击，造成250%ATK伤害',
    type: 'gene_lock',
    unlockReq: { geneLock: 3 },
    manaCost: 0,
    cooldown: 6,
    execute(player, enemy, _cs) {
      const log = [];
      const effects = [];
      const dmg = Math.floor(player.atk * 2.5);
      enemy.hp = Math.max(0, (enemy.hp || 0) - dmg);
      log.push({ text: '🎯 零点狙击！精准命中要害！' + dmg + ' 暴击伤害！', type: 'critical' });
      return { log, effects };
    },
  },

  /** 第四阶：洪荒之力 — 终极技能 */
  primordial_force: {
    id: 'primordial_force',
    name: '洪荒之力',
    desc: '释放洪荒之力，造成400%ATK伤害，但自身受到20%MaxHP反噬',
    type: 'gene_lock',
    unlockReq: { geneLock: 4 },
    manaCost: 0,
    cooldown: 8,
    execute(player, enemy, _cs) {
      const log = [];
      const effects = [];
      const dmg = Math.floor(player.atk * 4.0);
      enemy.hp = Math.max(0, (enemy.hp || 0) - dmg);
      const backlash = Math.floor((player.maxHp || 100) * 0.2);
      player.hp = Math.max(1, (player.hp || 0) - backlash);
      log.push({ text: '🌋 洪荒之力爆发！造成 ' + dmg + ' 毁灭性伤害！', type: 'skill' });
      log.push({ text: '💔 力量反噬！自身受到 ' + backlash + ' 伤害', type: 'danger' });
      return { log, effects };
    },
  },
};

// ─────────────────────────────────────────────
// 辅助函数
// ─────────────────────────────────────────────

/**
 * 初始化战斗状态（如果 combatState 未包含技能追踪字段）
 * 调用方可在开战时调用，也可由各 API 内部自动补全
 */
function ensureCombatState(combatState) {
  if (!combatState.cooldowns) combatState.cooldowns = {};
  if (!combatState.statusEffects) combatState.statusEffects = { player: [], enemy: [] };
  if (combatState.turn == null) combatState.turn = 0;
  return combatState;
}

/**
 * 判断玩家是否满足技能解锁条件
 */
function isSkillUnlocked(player, skillDef) {
  const req = skillDef.unlockReq;
  if (req.geneLock != null && (player.geneLock || 0) < req.geneLock) return false;
  if (req.bloodline != null && player.activeBloodline !== req.bloodline) return false;
  return true;
}

// ─────────────────────────────────────────────
// 导出 API
// ─────────────────────────────────────────────

/**
 * 获取玩家当前可用的所有技能列表
 *
 * 返回值: SkillDef[]，每个技能定义对象附加 `locked` 字段
 *   - 已解锁的基因锁技能（geneLock >= 阶段要求）
 *   - 已解锁的血统技能（activeBloodline 匹配）
 *
 * @param {Object} player - 玩家对象
 * @returns {Object[]} 可用技能定义数组
 */
export function getAvailableSkills(player) {
  const available = [];

  for (const skillDef of Object.values(SKILL_DEFINITIONS)) {
    if (isSkillUnlocked(player, skillDef)) {
      available.push(skillDef);
    }
  }

  return available;
}

/**
 * 检查指定技能是否可以使用
 *
 * 检查项：
 *   1. 技能是否存在
 *   2. 玩家是否解锁该技能
 *   3. 冷却是否完毕
 *   4. 法力是否足够
 *
 * @param {Object}  player      - 玩家对象
 * @param {string}  skillId     - 技能ID
 * @param {Object}  combatState - 战斗状态
 * @returns {{ usable: boolean, reason: string }}
 */
export function canUseSkill(player, skillId, combatState) {
  ensureCombatState(combatState);

  const skillDef = SKILL_DEFINITIONS[skillId];
  if (!skillDef) {
    return { usable: false, reason: '技能不存在' };
  }

  // 解锁检查
  if (!isSkillUnlocked(player, skillDef)) {
    return { usable: false, reason: '技能未解锁' };
  }

  // 冷却检查
  const cd = combatState.cooldowns[skillId] || 0;
  if (cd > 0) {
    return { usable: false, reason: `冷却中（剩余${cd}回合）` };
  }

  // 法力检查
  const mana = player.mana || 0;
  if (skillDef.manaCost > 0 && mana < skillDef.manaCost) {
    return { usable: false, reason: `法力不足（需要${skillDef.manaCost}，当前${mana}）` };
  }

  return { usable: true, reason: '' };
}

/**
 * 释放技能
 *
 * 流程：
 *   1. 可用性校验（canUseSkill）
 *   2. 扣除法力
 *   3. 执行技能效果（execute）
 *   4. 设置冷却
 *   5. 自动应用产出的状态效果
 *
 * @param {Object}  player      - 玩家对象（会被原地修改 hp/mana 等）
 * @param {string}  skillId     - 技能ID
 * @param {Object}  enemy       - 敌人对象（会被原地修改 hp 等）
 * @param {Object}  combatState - 战斗状态
 * @returns {{ log: Object[], effects: Object[] }} 战斗日志和产出的效果
 */
export function useSkill(player, skillId, enemy, combatState) {
  ensureCombatState(combatState);

  // 可用性校验
  const check = canUseSkill(player, skillId, combatState);
  if (!check.usable) {
    return {
      log: [{ text: `⚠ 无法使用技能：${check.reason}`, type: 'warning' }],
      effects: [],
    };
  }

  const skillDef = SKILL_DEFINITIONS[skillId];

  // 扣除法力
  if (skillDef.manaCost > 0) {
    player.mana = (player.mana || 0) - skillDef.manaCost;
  }

  // 执行技能逻辑
  const result = skillDef.execute(player, enemy, combatState);
  const log = result.log || [];
  const effects = result.effects || [];

  // 设置冷却
  combatState.cooldowns[skillId] = skillDef.cooldown;

  // 自动应用所有产出的状态效果
  for (const entry of effects) {
    const target = entry.target === 'player' ? player : enemy;
    const targetKey = entry.target === 'player' ? 'player' : 'enemy';
    applyStatusEffect(
      { entity: target, key: targetKey },
      entry.effect,
      combatState
    );
  }

  return { log, effects };
}

/**
 * 为目标添加状态效果
 *
 * 规则：
 *   - poison 可叠加（同源也可多层）
 *   - 同源同类型的其他效果会刷新（取更高值和更长持续时间）
 *   - 不同源的同类型效果共存
 *
 * @param {Object|string} target      - 目标实体或 { entity, key }
 * @param {Object}        effect      - { type, value, duration, source }
 * @param {Object}        [combatState] - 战斗状态（可选，直接操作内部数组时可省）
 */
export function applyStatusEffect(target, effect, combatState) {
  // 兼容两种调用方式：直接传 entity 或 { entity, key }
  let targetKey, targetEntity;
  if (target && target.key) {
    targetKey = target.key;
    targetEntity = target.entity;
  } else {
    // 无 key 时视为 enemy（向后兼容）
    targetKey = 'enemy';
    targetEntity = target;
  }

  if (combatState) {
    ensureCombatState(combatState);
    const list = combatState.statusEffects[targetKey];

    // 毒可叠加，其他同源刷新
    if (effect.type === STATUS_EFFECT.POISON) {
      list.push({ ...effect });
    } else {
      const existing = list.find(
        (e) => e.type === effect.type && e.source === effect.source
      );
      if (existing) {
        existing.value = Math.max(existing.value, effect.value);
        existing.duration = Math.max(existing.duration, effect.duration);
      } else {
        list.push({ ...effect });
      }
    }
  }
}

/**
 * 回合开始时处理目标身上的所有状态效果
 *
 * 处理顺序：
 *   1. 冻结/眩晕 → 判定是否跳过回合
 *   2. 灼烧/中毒 → 扣除HP
 *   3. 所有效果持续时间 -1，过期移除
 *
 * @param {Object} target      - { entity, key } 或直接实体（key 默认 'enemy'）
 * @param {Object} combatState - 战斗状态
 * @returns {{ log: Object[], skipTurn: boolean }}
 */
export function processStatusEffects(target, combatState) {
  ensureCombatState(combatState);

  // 支持字符串key或对象 { key, entity }
  let targetKey;
  if (typeof target === 'string') {
    targetKey = target;
  } else if (target && target.key) {
    targetKey = target.key;
  } else {
    targetKey = 'enemy';
  }

  const log = [];
  let skipTurn = false;
  let damage = 0; // 总伤害（由调用方扣血）

  const effects = combatState.statusEffects[targetKey];
  if (!effects || effects.length === 0) {
    return { log, skipTurn, damage };
  }

  // ── 处理每个效果 ──
  for (const eff of effects) {
    switch (eff.type) {
      // 冻结：跳过回合
      case STATUS_EFFECT.FREEZE:
        skipTurn = true;
        log.push({ text: `❄ ${targetKey === 'player' ? '你' : '敌人'}被冻结，无法行动！`, type: 'debuff' });
        break;

      // 眩晕：跳过回合
      case STATUS_EFFECT.STUN:
        skipTurn = true;
        log.push({ text: `💫 ${targetKey === 'player' ? '你' : '敌人'}处于眩晕状态，无法行动！`, type: 'debuff' });
        break;

      // 灼烧：每回合火伤（返回伤害，不直接扣血）
      case STATUS_EFFECT.BURN: {
        const dmg = eff.value;
        damage += dmg;
        log.push({ text: `🔥 灼烧造成 ${dmg} 伤害！（剩余${eff.duration}回合）`, type: 'burn' });
        break;
      }

      // 中毒：每回合毒伤（返回伤害，不直接扣血）
      case STATUS_EFFECT.POISON: {
        const dmg = eff.value;
        damage += dmg;
        log.push({ text: `☠ 中毒造成 ${dmg} 伤害！（剩余${eff.duration}回合）`, type: 'poison' });
        break;
      }

      // Buff/Debuff 仅做提示，实际数值修正由战斗计算时查询
      case STATUS_EFFECT.BUFF_ATK:
        log.push({ text: `⬆ 攻击力+${eff.value}%（剩余${eff.duration}回合）`, type: 'buff' });
        break;
      case STATUS_EFFECT.BUFF_DEF:
        log.push({ text: `⬆ 防御力+${eff.value}%（剩余${eff.duration}回合）`, type: 'buff' });
        break;
      case STATUS_EFFECT.BUFF_CRT:
        log.push({ text: `⬆ 暴击率+${eff.value}%（剩余${eff.duration}回合）`, type: 'buff' });
        break;
      case STATUS_EFFECT.DEBUFF_ATK:
        log.push({ text: `⬇ 攻击力-${eff.value}%（剩余${eff.duration}回合）`, type: 'debuff' });
        break;
    }
  }

  // ── 持续时间递减 & 过期清理 ──
  for (let i = effects.length - 1; i >= 0; i--) {
    effects[i].duration--;
    if (effects[i].duration <= 0) {
      const expired = effects[i];
      effects.splice(i, 1);
      log.push({
        text: `✦ ${_effectName(expired.type)} 效果消失了`,
        type: 'info',
      });
    }
  }

  return { log, skipTurn, damage };
}

/**
 * 回合结束时将所有冷却 -1
 *
 * @param {Object} combatState - 战斗状态
 */
export function tickCooldowns(combatState) {
  ensureCombatState(combatState);
  for (const skillId of Object.keys(combatState.cooldowns)) {
    if (combatState.cooldowns[skillId] > 0) {
      combatState.cooldowns[skillId]--;
    }
  }
}

/**
 * 查询目标身上指定类型的状态效果总增益值
 * 用于战斗计算时叠加 buff/debuff
 *
 * @param {string} targetKey   - 'player' | 'enemy'
 * @param {string} effectType  - STATUS_EFFECT 中的类型
 * @param {Object} combatState - 战斗状态
 * @returns {number} 效果数值之和（百分比）
 */
export function getEffectValue(targetKey, effectType, combatState) {
  ensureCombatState(combatState);
  const effects = combatState.statusEffects[targetKey] || [];
  let total = 0;
  for (const eff of effects) {
    if (eff.type === effectType) {
      total += eff.value;
    }
  }
  return total;
}

// ─────────────────────────────────────────────
// 内部工具函数
// ─────────────────────────────────────────────

/** 状态效果中文名映射 */
function _effectName(type) {
  const names = {
    [STATUS_EFFECT.BURN]:       '灼烧',
    [STATUS_EFFECT.FREEZE]:     '冻结',
    [STATUS_EFFECT.POISON]:     '中毒',
    [STATUS_EFFECT.STUN]:       '眩晕',
    [STATUS_EFFECT.BUFF_ATK]:   '攻击强化',
    [STATUS_EFFECT.BUFF_DEF]:   '防御强化',
    [STATUS_EFFECT.BUFF_CRT]:   '暴击强化',
    [STATUS_EFFECT.DEBUFF_ATK]: '攻击削弱',
  };
  return names[type] || type;
}
