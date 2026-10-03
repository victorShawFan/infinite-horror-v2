// ═══════════════════════════════════════════════════════════════
// 遗物系统 — 永久被动增益，战略深度核心
// ═══════════════════════════════════════════════════════════════
//
// 灵感来源：
//   Slay the Spire 遗物 + 无限恐怖主神兑换 + 魔塔隐藏道具
//
// 获取途径：
//   1. Boss击杀后必定掉落1个
//   2. 探索事件稀有发现
//   3. 主神空间购买
//   4. 隐藏房间发现
//   5. 完成特殊成就
//
// 每个遗物有独特被动效果，无需手动激活
// 同一遗物不可重复持有
// ═══════════════════════════════════════════════════════════════

import { eventBus } from './EventBus.js';
import { gameState } from './GameState.js';

// ── 遗物稀有度 ──
export const RELIC_RARITY = {
  COMMON:    'common',    // 白色
  UNCOMMON:  'uncommon',  // 绿色
  RARE:      'rare',      // 蓝色
  EPIC:      'epic',      // 紫色
  LEGENDARY: 'legendary', // 金色
};

const RARITY_COLORS = {
  [RELIC_RARITY.COMMON]:    '#aaaaaa',
  [RELIC_RARITY.UNCOMMON]:  '#44cc88',
  [RELIC_RARITY.RARE]:      '#4488ff',
  [RELIC_RARITY.EPIC]:      '#aa44ff',
  [RELIC_RARITY.LEGENDARY]: '#ffcc44',
};

const RARITY_NAMES = {
  [RELIC_RARITY.COMMON]:    '普通',
  [RELIC_RARITY.UNCOMMON]:  '稀有',
  [RELIC_RARITY.RARE]:      '珍贵',
  [RELIC_RARITY.EPIC]:      '史诗',
  [RELIC_RARITY.LEGENDARY]: '传说',
};

// ── 遗物定义 ──
export const RELIC_DEFINITIONS = {

  // ═══ 普通遗物 ═══
  iron_heart: {
    id: 'iron_heart',
    name: '铁之心脏',
    icon: '🫀',
    desc: '每场战斗开始时恢复5%最大HP',
    lore: '从异形母巢深处取回的金属器官，接入体内后自动修复损伤。',
    rarity: RELIC_RARITY.COMMON,
    effects: { combatStartHealPct: 0.05 },
  },
  
  broken_compass: {
    id: 'broken_compass',
    name: '破碎罗盘',
    icon: '🧭',
    desc: '探索事件额外选项出现概率+20%',
    lore: '指针永远指向危险的方向——但有时候，危险等于机会。',
    rarity: RELIC_RARITY.COMMON,
    effects: { eventBonusChance: 0.2 },
  },
  
  worn_whetstone: {
    id: 'worn_whetstone',
    name: '磨损的砥石',
    icon: '🪨',
    desc: 'ATK永久+3',
    lore: '用无数次的磨砺换来的锋芒。',
    rarity: RELIC_RARITY.COMMON,
    effects: { flatAtk: 3 },
  },
  
  survivor_badge: {
    id: 'survivor_badge',
    name: '幸存者徽章',
    icon: '🎖',
    desc: 'DEF永久+3',
    lore: '每一道刮痕都是一次死里逃生的证明。',
    rarity: RELIC_RARITY.COMMON,
    effects: { flatDef: 3 },
  },
  
  faded_photograph: {
    id: 'faded_photograph',
    name: '褪色照片',
    icon: '📷',
    desc: 'HP低于30%时DEF+50%',
    lore: '照片上是等你回来的人。为了回去，你不能倒下。',
    rarity: RELIC_RARITY.COMMON,
    effects: { lowHpDefBonus: 0.5, lowHpThreshold: 0.3 },
  },
  
  energy_drink: {
    id: 'energy_drink',
    name: '永恒能量饮',
    icon: '🥤',
    desc: '每击杀一个敌人恢复3%HP',
    lore: '主神空间自动售货机里最后一瓶。喝了之后精力永远不会枯竭。',
    rarity: RELIC_RARITY.COMMON,
    effects: { killHealPct: 0.03 },
  },

  // ═══ 稀有遗物 ═══
  blood_pendant: {
    id: 'blood_pendant',
    name: '血色吊坠',
    icon: '📿',
    desc: '吸血效果：每次攻击恢复造成伤害的8%HP',
    lore: '吊坠中封印着古老血族的一滴鲜血，穿戴者获得吸血本能。',
    rarity: RELIC_RARITY.UNCOMMON,
    effects: { lifeStealPct: 0.08 },
  },
  
  ghost_lantern: {
    id: 'ghost_lantern',
    name: '鬼火灯笼',
    icon: '🏮',
    desc: '暴击伤害+30%（1.8x→2.1x）',
    lore: '忽明忽暗的磷火照亮了敌人的致命弱点。',
    rarity: RELIC_RARITY.UNCOMMON,
    effects: { critDmgBonus: 0.3 },
  },
  
  scorpion_tail: {
    id: 'scorpion_tail',
    name: '蝎尾针',
    icon: '🦂',
    desc: '攻击有15%概率施加中毒（每回合5伤害，3回合）',
    lore: '从巨型沙漠蝎上截下的尾针，毒性经过主神强化后更加猛烈。',
    rarity: RELIC_RARITY.UNCOMMON,
    effects: { poisonChance: 0.15, poisonDmg: 5, poisonDuration: 3 },
  },
  
  mirror_shard: {
    id: 'mirror_shard',
    name: '镜之碎片',
    icon: '🪞',
    desc: '受到攻击时15%概率反弹25%伤害',
    lore: '"镜中的你"碎裂时留下的碎片。映照出的不是你——是敌人即将受到的痛苦。',
    rarity: RELIC_RARITY.UNCOMMON,
    effects: { reflectChance: 0.15, reflectPct: 0.25 },
  },
  
  wind_talisman: {
    id: 'wind_talisman',
    name: '御风符',
    icon: '🌀',
    desc: 'SPD+5，双击概率提升',
    lore: '道家御风术的精华，融入护符后赋予超凡速度。',
    rarity: RELIC_RARITY.UNCOMMON,
    effects: { flatSpd: 5, doubleAttackBonus: 10 },
  },
  
  grudge_doll: {
    id: 'grudge_doll',
    name: '怨念人偶',
    icon: '🎎',
    desc: '击杀敌人后下场战斗ATK+10%（可叠加，最多30%）',
    lore: '咒怨世界带回的诅咒之物。杀戮越多，它笑得越开心。',
    rarity: RELIC_RARITY.UNCOMMON,
    effects: { killStreakAtkPct: 10, killStreakAtkCap: 30 },
  },

  // ═══ 珍贵遗物 ═══
  void_crystal: {
    id: 'void_crystal',
    name: '虚空结晶',
    icon: '💠',
    desc: '每3回合自动释放一次虚空冲击（造成ATK×40%伤害）',
    lore: '来自维度裂缝的能量结晶体，周期性释放毁灭波动。',
    rarity: RELIC_RARITY.RARE,
    effects: { autoAttackInterval: 3, autoAttackPct: 0.4 },
  },
  
  phoenix_feather: {
    id: 'phoenix_feather',
    name: '凤凰翎',
    icon: '🪶',
    desc: '每场战斗首次致死伤害时以30%HP复活（每场一次）',
    lore: '涅槃之鸟的遗羽，燃烧殆尽后重获新生。',
    rarity: RELIC_RARITY.RARE,
    effects: { deathSaveHpPct: 0.3 },
  },
  
  demon_contract: {
    id: 'demon_contract',
    name: '恶魔契约',
    icon: '📜',
    desc: 'ATK+20%，但每场战斗开始时扣除5%HP',
    lore: '"力量需要代价。" 契约上的字迹像是鲜血写成的。',
    rarity: RELIC_RARITY.RARE,
    effects: { atkPctBonus: 0.2, combatStartDamagePct: 0.05 },
  },
  
  temporal_hourglass: {
    id: 'temporal_hourglass',
    name: '时间沙漏',
    icon: '⏳',
    desc: '首回合行动两次',
    lore: '短暂扭曲时间流逝——但只有一瞬间的窗口。',
    rarity: RELIC_RARITY.RARE,
    effects: { firstTurnDoubleAction: true },
  },
  
  soul_chain: {
    id: 'soul_chain',
    name: '灵魂锁链',
    icon: '⛓',
    desc: '受到的所有伤害-10%（减伤上限生效前）',
    lore: '将灵魂束缚在物质之躯上的锁链。越痛苦，越不会死。',
    rarity: RELIC_RARITY.RARE,
    effects: { flatDmgReduction: 0.1 },
  },
  
  third_eye: {
    id: 'third_eye',
    name: '第三只眼',
    icon: '👁',
    desc: '暴击率+12%，可看到敌人下一步行动',
    lore: '精神力觉醒的标志。洞察一切，包括尚未发生的攻击。',
    rarity: RELIC_RARITY.RARE,
    effects: { flatCrt: 12, enemyIntentReveal: true },
  },

  // ═══ 史诗遗物 ═══
  gene_lock_amplifier: {
    id: 'gene_lock_amplifier',
    name: '基因锁增幅器',
    icon: '🧬',
    desc: '基因锁技能冷却-2回合，效果+25%',
    lore: '楚轩设计的纳米增幅装置，将基因锁的潜力推至新的极限。',
    rarity: RELIC_RARITY.EPIC,
    effects: { geneLockCdReduce: 2, geneLockEffectBonus: 0.25 },
  },
  
  lord_god_eye: {
    id: 'lord_god_eye',
    name: '主神之眼',
    icon: '🔮',
    desc: '战后奖励必定包含一个史诗级选项',
    lore: '主神用来观察轮回者的工具碎片。掌握它，就掌握了命运的一角。',
    rarity: RELIC_RARITY.EPIC,
    effects: { guaranteeEpicReward: true },
  },
  
  berserker_mark: {
    id: 'berserker_mark',
    name: '狂战士烙印',
    icon: '🔥',
    desc: 'HP越低ATK越高（最高+50%ATK当HP<10%）',
    lore: '这道烙印来自北欧轮回世界。愤怒是最好的武器。',
    rarity: RELIC_RARITY.EPIC,
    effects: { berserkerMaxBonus: 0.5 },
  },
  
  dimension_anchor: {
    id: 'dimension_anchor',
    name: '维度锚',
    icon: '⚓',
    desc: '免疫眩晕和冻结效果',
    lore: '将你的存在锚定在当前维度，任何控制效果都无法动摇。',
    rarity: RELIC_RARITY.EPIC,
    effects: { immuneStun: true, immuneFreeze: true },
  },
  
  blood_moon_ring: {
    id: 'blood_moon_ring',
    name: '血月指环',
    icon: '💍',
    desc: '暴击时恢复造成伤害的15%HP',
    lore: '只在血月之夜闪耀的诅咒指环。用鲜血换鲜血。',
    rarity: RELIC_RARITY.EPIC,
    effects: { critLifeStealPct: 0.15 },
  },

  // ═══ 传说遗物 ═══
  zheng_zhanchens_will: {
    id: 'zheng_zhanchens_will',
    name: '郑吒的意志',
    icon: '🗡',
    desc: 'ATK+15%, DEF+15%, HP低于50%时额外ATK+20%',
    lore: '"就算是复制体，我也不会输。就算是主神，我也要挑战到底。" ——郑吒',
    rarity: RELIC_RARITY.LEGENDARY,
    effects: { atkPctBonus: 0.15, defPctBonus: 0.15, lowHpAtkBonus: 0.2, lowHpThreshold: 0.5 },
  },
  
  chu_xuans_logic: {
    id: 'chu_xuans_logic',
    name: '楚轩的逻辑链',
    icon: '🧠',
    desc: '每3回合预判敌人行动并自动闪避一次攻击',
    lore: '"在我的计算中，一切都在预料之内。" ——楚轩',
    rarity: RELIC_RARITY.LEGENDARY,
    effects: { autoEvadeInterval: 3 },
  },
  
  zero_points_power: {
    id: 'zero_points_power',
    name: '零点之力',
    icon: '⭐',
    desc: '所有属性+10%，每次升级额外获得1属性点',
    lore: '突破了人类极限的零点——在这里，一切常识都被改写。',
    rarity: RELIC_RARITY.LEGENDARY,
    effects: { allStatsPctBonus: 0.1, bonusStatPoints: 1 },
  },
  
  infinite_loop: {
    id: 'infinite_loop',
    name: '无限之环',
    icon: '♾',
    desc: '每场战斗结束后，获得的经验值+25%',
    lore: '轮回中的轮回。每一次战斗都是成长的积累，直到无限。',
    rarity: RELIC_RARITY.LEGENDARY,
    effects: { expBonus: 0.25 },
  },
};

// ── 获取玩家已拥有的遗物列表 ──
export function getOwnedRelics() {
  return gameState.player.relics || [];
}

// ── 检查是否拥有某个遗物 ──
export function hasRelic(relicId) {
  return (gameState.player.relics || []).includes(relicId);
}

// ── 获取遗物定义 ──
export function getRelicDef(relicId) {
  return RELIC_DEFINITIONS[relicId] || null;
}

// ── 添加遗物 ──
export function addRelic(relicId) {
  if (!RELIC_DEFINITIONS[relicId]) return { success: false, reason: '遗物不存在' };
  if (hasRelic(relicId)) return { success: false, reason: '已拥有此遗物' };
  
  if (!gameState.player.relics) gameState.player.relics = [];
  gameState.player.relics.push(relicId);
  
  const def = RELIC_DEFINITIONS[relicId];
  
  // 应用永久属性加成
  if (def.effects.flatAtk) gameState.player.atk += def.effects.flatAtk;
  if (def.effects.flatDef) gameState.player.def += def.effects.flatDef;
  if (def.effects.flatSpd) gameState.player.spd += def.effects.flatSpd;
  if (def.effects.flatCrt) gameState.player.crt += def.effects.flatCrt;
  
  eventBus.emit('relic:acquired', { relicId, def });
  return { success: true, def };
}

// ── 移除遗物 ──
export function removeRelic(relicId) {
  const idx = (gameState.player.relics || []).indexOf(relicId);
  if (idx < 0) return false;
  
  const def = RELIC_DEFINITIONS[relicId];
  gameState.player.relics.splice(idx, 1);
  
  // 撤销永久属性加成
  if (def.effects.flatAtk) gameState.player.atk -= def.effects.flatAtk;
  if (def.effects.flatDef) gameState.player.def -= def.effects.flatDef;
  if (def.effects.flatSpd) gameState.player.spd -= def.effects.flatSpd;
  if (def.effects.flatCrt) gameState.player.crt -= def.effects.flatCrt;
  
  eventBus.emit('relic:removed', { relicId });
  return true;
}

// ── 获取遗物提供的战斗修正 ──
export function getRelicCombatEffects() {
  const relics = getOwnedRelics();
  const fx = {
    combatStartHealPct: 0,
    combatStartDamagePct: 0,
    lifeStealPct: 0,
    critDmgBonus: 0,
    critLifeStealPct: 0,
    poisonChance: 0,
    poisonDmg: 0,
    poisonDuration: 0,
    reflectChance: 0,
    reflectPct: 0,
    flatDmgReduction: 0,
    atkPctBonus: 0,
    defPctBonus: 0,
    allStatsPctBonus: 0,
    autoAttackInterval: 0,
    autoAttackPct: 0,
    deathSaveHpPct: 0,
    firstTurnDoubleAction: false,
    immuneStun: false,
    immuneFreeze: false,
    enemyIntentReveal: false,
    guaranteeEpicReward: false,
    geneLockCdReduce: 0,
    geneLockEffectBonus: 0,
    berserkerMaxBonus: 0,
    lowHpDefBonus: 0,
    lowHpAtkBonus: 0,
    lowHpThreshold: 0,
    killHealPct: 0,
    killStreakAtkPct: 0,
    killStreakAtkCap: 0,
    expBonus: 0,
    autoEvadeInterval: 0,
    bonusStatPoints: 0,
    doubleAttackBonus: 0,
    eventBonusChance: 0,
  };
  
  for (const rid of relics) {
    const def = RELIC_DEFINITIONS[rid];
    if (!def) continue;
    const e = def.effects;
    
    for (const key of Object.keys(fx)) {
      if (e[key] !== undefined) {
        if (typeof fx[key] === 'boolean') {
          fx[key] = fx[key] || e[key];
        } else {
          fx[key] += e[key];
        }
      }
    }
  }
  
  return fx;
}

// ── 按稀有度生成随机遗物选项（用于Boss掉落/商店） ──
export function generateRelicChoices(count = 3, minRarity = RELIC_RARITY.COMMON, source = 'boss') {
  const owned = new Set(getOwnedRelics());
  const available = Object.values(RELIC_DEFINITIONS).filter(r => !owned.has(r.id));
  
  if (available.length === 0) return [];
  
  // 根据来源调整稀有度权重
  const rarityWeights = {
    boss: { common: 0.1, uncommon: 0.3, rare: 0.35, epic: 0.2, legendary: 0.05 },
    shop: { common: 0.3, uncommon: 0.35, rare: 0.25, epic: 0.08, legendary: 0.02 },
    explore: { common: 0.4, uncommon: 0.35, rare: 0.2, epic: 0.05, legendary: 0 },
    secret: { common: 0.05, uncommon: 0.15, rare: 0.35, epic: 0.3, legendary: 0.15 },
  };
  
  const weights = rarityWeights[source] || rarityWeights.boss;
  
  // 按权重随机选择
  const choices = [];
  const usedIds = new Set();
  
  for (let i = 0; i < count && available.length > usedIds.size; i++) {
    const filtered = available.filter(r => !usedIds.has(r.id));
    const totalW = filtered.reduce((sum, r) => sum + (weights[r.rarity] || 0.1), 0);
    let roll = Math.random() * totalW;
    
    for (const r of filtered) {
      roll -= weights[r.rarity] || 0.1;
      if (roll <= 0) {
        choices.push(r);
        usedIds.add(r.id);
        break;
      }
    }
    // 如果没选到（浮点精度），选最后一个
    if (choices.length <= i && filtered.length > 0) {
      const last = filtered[filtered.length - 1];
      choices.push(last);
      usedIds.add(last.id);
    }
  }
  
  return choices;
}

// ── 渲染遗物获取面板 ──
export function renderRelicAcquirePanel(relicDef) {
  const color = RARITY_COLORS[relicDef.rarity] || '#aaa';
  const rarityName = RARITY_NAMES[relicDef.rarity] || '普通';
  
  return `
    <div style="
      max-width: 400px; padding: 28px 24px; text-align: center;
      background: linear-gradient(180deg, rgba(10,10,25,0.98), rgba(5,5,15,0.98));
      border: 2px solid ${color}66;
      border-radius: 16px;
      box-shadow: 0 0 60px ${color}22, inset 0 0 30px ${color}08;
      animation: relic-glow 2s ease-in-out infinite alternate;
    ">
      <style>
        @keyframes relic-glow {
          from { box-shadow: 0 0 60px ${color}22, inset 0 0 30px ${color}08; }
          to { box-shadow: 0 0 80px ${color}33, inset 0 0 40px ${color}11; }
        }
        @keyframes relic-icon-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      </style>
      <p style="color:${color}; font-size:10px; letter-spacing:6px; margin-bottom:12px;">
        ✦ ${rarityName}遗物 ✦
      </p>
      <div style="font-size:56px; margin: 12px 0; animation: relic-icon-float 2s ease-in-out infinite;">
        ${relicDef.icon}
      </div>
      <p style="color:${color}; font-size:18px; font-weight:bold; margin-bottom:8px; letter-spacing:2px;">
        ${relicDef.name}
      </p>
      <p style="color:#ccc; font-size:13px; margin-bottom:12px; line-height:1.6;">
        ${relicDef.desc}
      </p>
      <p style="color:#666; font-size:11px; font-style:italic; margin-bottom:16px; line-height:1.5;">
        "${relicDef.lore}"
      </p>
      <button class="relic-acquire-btn" style="
        padding: 10px 32px; font-size:14px; cursor:pointer;
        background: ${color}22; border: 1px solid ${color}66;
        color: ${color}; border-radius: 8px; font-family: inherit;
        letter-spacing: 2px; transition: all 0.2s;
      " onmouseenter="this.style.background='${color}33';this.style.transform='scale(1.05)'"
         onmouseleave="this.style.background='${color}22';this.style.transform='scale(1)'">
        获 得
      </button>
    </div>
  `;
}

// ── 渲染遗物选择面板（3选1） ──
export function renderRelicChoicePanel(choices) {
  return `
    <div style="
      max-width: 640px; padding: 24px; text-align: center;
      background: linear-gradient(180deg, rgba(10,10,25,0.98), rgba(5,5,15,0.98));
      border: 1px solid rgba(255,204,68,0.2);
      border-radius: 16px;
    ">
      <p style="color:#ffcc44; font-size:12px; letter-spacing:6px; margin-bottom:4px;">
        🏛 选 择 遗 物 🏛
      </p>
      <p style="color:#888; font-size:11px; margin-bottom:16px;">选择一件永久伴随你的遗物</p>
      <div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">
        ${choices.map((c, i) => {
          const color = RARITY_COLORS[c.rarity] || '#aaa';
          const rarityName = RARITY_NAMES[c.rarity] || '普通';
          return `
            <div class="relic-choice" data-idx="${i}" style="
              flex:1; min-width:160px; max-width:190px;
              padding:16px 12px;
              background: rgba(255,255,255,0.02);
              border: 1px solid ${color}33;
              border-radius: 12px;
              cursor: pointer; transition: all 0.2s;
            " onmouseenter="this.style.borderColor='${color}';this.style.background='rgba(255,255,255,0.06)';this.style.transform='translateY(-4px)'"
               onmouseleave="this.style.borderColor='${color}33';this.style.background='rgba(255,255,255,0.02)';this.style.transform='none'">
              <div style="font-size:36px; margin-bottom:6px;">${c.icon}</div>
              <div style="color:${color}; font-size:10px; letter-spacing:2px; margin-bottom:4px;">${rarityName}</div>
              <div style="color:${color}; font-size:14px; font-weight:bold; margin-bottom:6px;">${c.name}</div>
              <div style="color:#bbb; font-size:11px; line-height:1.5; margin-bottom:8px;">${c.desc}</div>
              <div style="color:#555; font-size:9px; font-style:italic; line-height:1.4;">"${c.lore}"</div>
            </div>
          `;
        }).join('')}
      </div>
      <p style="color:#444; font-size:9px; margin-top:16px; letter-spacing:3px;">点击选择</p>
    </div>
  `;
}

// ── 渲染遗物背包面板（在主神空间/暂停菜单查看） ──
export function renderRelicInventoryPanel() {
  const relics = getOwnedRelics();
  
  if (relics.length === 0) {
    return `
      <div style="text-align:center; padding:24px; color:#666;">
        <p style="font-size:24px; margin-bottom:8px;">🏛</p>
        <p>尚未获得任何遗物</p>
        <p style="font-size:10px; color:#555; margin-top:8px;">
          击败Boss或探索隐藏区域可获得遗物
        </p>
      </div>
    `;
  }
  
  let html = '<div style="display:flex; flex-wrap:wrap; gap:8px; justify-content:center;">';
  
  for (const rid of relics) {
    const def = RELIC_DEFINITIONS[rid];
    if (!def) continue;
    const color = RARITY_COLORS[def.rarity] || '#aaa';
    
    html += `
      <div class="relic-inv-item" title="${def.name}: ${def.desc}" style="
        width: 52px; height: 52px;
        display: flex; align-items: center; justify-content: center;
        background: rgba(0,0,0,0.3);
        border: 1px solid ${color}44;
        border-radius: 8px;
        font-size: 24px;
        cursor: help;
        transition: all 0.2s;
        position: relative;
      " onmouseenter="this.style.borderColor='${color}';this.style.transform='scale(1.1)';this.querySelector('.relic-tooltip').style.display='block'"
         onmouseleave="this.style.borderColor='${color}44';this.style.transform='scale(1)';this.querySelector('.relic-tooltip').style.display='none'">
        ${def.icon}
        <div class="relic-tooltip" style="
          display:none; position:absolute; bottom:60px; left:50%; transform:translateX(-50%);
          width:200px; padding:10px; background:rgba(5,5,15,0.98);
          border:1px solid ${color}66; border-radius:8px; z-index:300;
          pointer-events:none;
        ">
          <p style="color:${color}; font-size:12px; font-weight:bold;">${def.name}</p>
          <p style="color:#aaa; font-size:10px; margin-top:4px;">${def.desc}</p>
          <p style="color:#666; font-size:9px; margin-top:4px; font-style:italic;">"${def.lore}"</p>
        </div>
      </div>
    `;
  }
  
  html += '</div>';
  return html;
}
