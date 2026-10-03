// ═══════════════════════════════════════════════════════════════
// 敌人意图系统 — 类 Slay the Spire 的回合预判机制
// ═══════════════════════════════════════════════════════════════
//
// 每回合开始前计算并显示敌人下一步行动意图
// 玩家可据此做出策略决策（攻击/防御/技能/道具）
// Boss有多种行动模式且有固定循环
// ═══════════════════════════════════════════════════════════════

import { gameState } from './GameState.js';

// ── 意图类型 ──
export const INTENT_TYPE = {
  ATTACK:      'attack',      // 普通攻击
  HEAVY:       'heavy',       // 重击（高伤害）
  MULTI:       'multi',       // 多段攻击
  DEFEND:      'defend',      // 防御/加护甲
  BUFF:        'buff',        // 自我增强
  DEBUFF:      'debuff',      // 给玩家上debuff
  HEAL:        'heal',        // 自我治疗
  SPECIAL:     'special',     // Boss特殊技
  CHARGE:      'charge',      // 蓄力（下回合释放大招）
  SUMMON:      'summon',      // 召唤小怪
  FLEE:        'flee',        // 尝试逃跑
};

const INTENT_ICONS = {
  [INTENT_TYPE.ATTACK]:  '⚔',
  [INTENT_TYPE.HEAVY]:   '💥',
  [INTENT_TYPE.MULTI]:   '⚡',
  [INTENT_TYPE.DEFEND]:  '🛡',
  [INTENT_TYPE.BUFF]:    '⬆',
  [INTENT_TYPE.DEBUFF]:  '☠',
  [INTENT_TYPE.HEAL]:    '💚',
  [INTENT_TYPE.SPECIAL]: '⭐',
  [INTENT_TYPE.CHARGE]:  '🔮',
  [INTENT_TYPE.SUMMON]:  '👥',
  [INTENT_TYPE.FLEE]:    '💨',
};

const INTENT_COLORS = {
  [INTENT_TYPE.ATTACK]:  '#ff6644',
  [INTENT_TYPE.HEAVY]:   '#ff2222',
  [INTENT_TYPE.MULTI]:   '#ff8844',
  [INTENT_TYPE.DEFEND]:  '#4488ff',
  [INTENT_TYPE.BUFF]:    '#44cc88',
  [INTENT_TYPE.DEBUFF]:  '#aa44ff',
  [INTENT_TYPE.HEAL]:    '#44ff88',
  [INTENT_TYPE.SPECIAL]: '#ffcc44',
  [INTENT_TYPE.CHARGE]:  '#ff44ff',
  [INTENT_TYPE.SUMMON]:  '#888888',
  [INTENT_TYPE.FLEE]:    '#666666',
};

const INTENT_LABELS = {
  [INTENT_TYPE.ATTACK]:  '攻击',
  [INTENT_TYPE.HEAVY]:   '重击',
  [INTENT_TYPE.MULTI]:   '连击',
  [INTENT_TYPE.DEFEND]:  '防御',
  [INTENT_TYPE.BUFF]:    '强化',
  [INTENT_TYPE.DEBUFF]:  '诅咒',
  [INTENT_TYPE.HEAL]:    '治疗',
  [INTENT_TYPE.SPECIAL]: '必杀',
  [INTENT_TYPE.CHARGE]:  '蓄力',
  [INTENT_TYPE.SUMMON]:  '召唤',
  [INTENT_TYPE.FLEE]:    '逃跑',
};

// ── Boss 行动模式 ──
const BOSS_PATTERNS = {
  // 默认Boss模式: 攻击→攻击→重击→防御 循环
  default: [
    INTENT_TYPE.ATTACK,
    INTENT_TYPE.ATTACK,
    INTENT_TYPE.HEAVY,
    INTENT_TYPE.DEFEND,
  ],
  // 攻击型Boss
  aggressive: [
    INTENT_TYPE.ATTACK,
    INTENT_TYPE.HEAVY,
    INTENT_TYPE.MULTI,
    INTENT_TYPE.ATTACK,
    INTENT_TYPE.BUFF,
  ],
  // 防御型Boss
  defensive: [
    INTENT_TYPE.ATTACK,
    INTENT_TYPE.DEFEND,
    INTENT_TYPE.HEAL,
    INTENT_TYPE.ATTACK,
    INTENT_TYPE.DEBUFF,
  ],
  // 魔法型Boss  
  caster: [
    INTENT_TYPE.DEBUFF,
    INTENT_TYPE.ATTACK,
    INTENT_TYPE.CHARGE,
    INTENT_TYPE.SPECIAL,
    INTENT_TYPE.HEAL,
  ],
  // 狂暴型Boss（低HP后行动改变）
  berserker: [
    INTENT_TYPE.ATTACK,
    INTENT_TYPE.ATTACK,
    INTENT_TYPE.HEAVY,
    INTENT_TYPE.HEAVY,
    INTENT_TYPE.MULTI,
  ],
};

// ── 根据敌人信息确定Boss模式 ──
function getBossPattern(enemy) {
  if (!enemy.bossId && !enemy.isBoss) return null;
  
  const name = (enemy.name || '').toLowerCase();
  const id = (enemy.bossId || '').toLowerCase();
  
  // 根据Boss特征选择模式
  if (name.includes('异形') || name.includes('alien') || id.includes('alien')) return BOSS_PATTERNS.aggressive;
  if (name.includes('伽椰子') || name.includes('咒怨') || id.includes('grudge')) return BOSS_PATTERNS.caster;
  if (name.includes('木乃伊') || name.includes('法老') || id.includes('mummy')) return BOSS_PATTERNS.defensive;
  if (name.includes('死神') || id.includes('death')) return BOSS_PATTERNS.caster;
  if (name.includes('恶魔') || id.includes('demon')) return BOSS_PATTERNS.berserker;
  if (name.includes('主神') || id.includes('lord_god')) return BOSS_PATTERNS.aggressive;
  
  return BOSS_PATTERNS.default;
}

/**
 * 计算敌人下一回合的行动意图
 * @param {Object} enemy - 敌人数据
 * @param {number} round - 当前回合数
 * @param {number} enemyHp - 敌人当前HP
 * @param {number} enemyMaxHp - 敌人最大HP
 * @param {number} playerHp - 玩家当前HP
 * @param {number} playerMaxHp - 玩家最大HP
 * @returns {Object} { type, icon, color, label, dmgEstimate?, desc }
 */
export function getEnemyIntent(enemy, round, enemyHp, enemyMaxHp, playerHp, playerMaxHp) {
  const isBoss = !!(enemy.bossId || enemy.isBoss || enemy.type === 'boss');
  const isElite = !!(enemy.affix || enemy._eliteTier);
  
  // Boss使用固定行动模式
  if (isBoss) {
    return getBossIntent(enemy, round, enemyHp, enemyMaxHp, playerHp, playerMaxHp);
  }
  
  // 精英怪有更复杂的行为
  if (isElite) {
    return getEliteIntent(enemy, round, enemyHp, enemyMaxHp);
  }
  
  // 普通怪物：大多数时候攻击，偶尔防御/增强
  return getNormalIntent(enemy, round, enemyHp, enemyMaxHp);
}

function getBossIntent(enemy, round, enemyHp, enemyMaxHp, playerHp, playerMaxHp) {
  const pattern = getBossPattern(enemy) || BOSS_PATTERNS.default;
  const hpRatio = enemyHp / (enemyMaxHp || 1);
  
  // 低血量时行为改变
  if (hpRatio < 0.3) {
    // 30%HP以下进入狂暴模式
    const berserkerIntents = [INTENT_TYPE.HEAVY, INTENT_TYPE.MULTI, INTENT_TYPE.SPECIAL];
    const type = berserkerIntents[round % berserkerIntents.length];
    return buildIntent(type, enemy, '狂暴状态！');
  }
  
  if (hpRatio < 0.5 && round % 4 === 0) {
    // 50%HP以下偶尔治疗
    return buildIntent(INTENT_TYPE.HEAL, enemy, '尝试恢复');
  }
  
  // 正常循环
  const type = pattern[round % pattern.length];
  
  // 蓄力后下一回合必定释放特殊技
  if (type === INTENT_TYPE.CHARGE) {
    return buildIntent(type, enemy, '下回合将释放大招！');
  }
  
  return buildIntent(type, enemy);
}

function getEliteIntent(enemy, round, enemyHp, enemyMaxHp) {
  const hpRatio = enemyHp / (enemyMaxHp || 1);
  const affix = enemy.affix;
  
  // 根据词缀调整行为
  if (affix) {
    if (affix.id === 'tank' && round % 3 === 0) return buildIntent(INTENT_TYPE.DEFEND, enemy);
    if (affix.id === 'toxic' && round % 3 === 1) return buildIntent(INTENT_TYPE.DEBUFF, enemy, '释放毒素');
    if (affix.id === 'vampiric' && hpRatio < 0.5) return buildIntent(INTENT_TYPE.HEAL, enemy, '吸血治疗');
    if (affix.id === 'berserker' && hpRatio < 0.4) return buildIntent(INTENT_TYPE.HEAVY, enemy, '狂暴重击');
  }
  
  // 默认行为
  if (round % 4 === 0) return buildIntent(INTENT_TYPE.BUFF, enemy);
  if (round % 5 === 0 && hpRatio < 0.6) return buildIntent(INTENT_TYPE.HEAL, enemy);
  
  return buildIntent(Math.random() < 0.3 ? INTENT_TYPE.HEAVY : INTENT_TYPE.ATTACK, enemy);
}

function getNormalIntent(enemy, round, enemyHp, enemyMaxHp) {
  const hpRatio = enemyHp / (enemyMaxHp || 1);
  
  // 低血量时更激进
  if (hpRatio < 0.25 && Math.random() < 0.4) {
    return buildIntent(INTENT_TYPE.HEAVY, enemy, '殊死一搏');
  }
  
  // 偶尔防御
  if (round > 2 && Math.random() < 0.12) {
    return buildIntent(INTENT_TYPE.DEFEND, enemy);
  }
  
  // 大部分时间攻击
  return buildIntent(INTENT_TYPE.ATTACK, enemy);
}

function buildIntent(type, enemy, extraDesc = '') {
  const baseDmg = enemy.atk || 10;
  let dmgEstimate = 0;
  let desc = '';
  
  switch (type) {
    case INTENT_TYPE.ATTACK:
      dmgEstimate = baseDmg;
      desc = `攻击 ~${dmgEstimate}`;
      break;
    case INTENT_TYPE.HEAVY:
      dmgEstimate = Math.floor(baseDmg * 1.5);
      desc = `重击 ~${dmgEstimate}`;
      break;
    case INTENT_TYPE.MULTI:
      dmgEstimate = Math.floor(baseDmg * 0.6);
      desc = `${dmgEstimate}×3 连击`;
      break;
    case INTENT_TYPE.DEFEND:
      desc = '防御姿态 (DEF+50%)';
      break;
    case INTENT_TYPE.BUFF:
      desc = '强化自身 (ATK+20%)';
      break;
    case INTENT_TYPE.DEBUFF:
      desc = '施加诅咒';
      break;
    case INTENT_TYPE.HEAL:
      desc = '恢复HP';
      break;
    case INTENT_TYPE.SPECIAL:
      dmgEstimate = Math.floor(baseDmg * 2);
      desc = `必杀技 ~${dmgEstimate}`;
      break;
    case INTENT_TYPE.CHARGE:
      desc = '蓄力中...';
      break;
    case INTENT_TYPE.SUMMON:
      desc = '召唤援军';
      break;
    default:
      desc = '未知';
  }
  
  if (extraDesc) desc += ` (${extraDesc})`;
  
  return {
    type,
    icon: INTENT_ICONS[type] || '?',
    color: INTENT_COLORS[type] || '#888',
    label: INTENT_LABELS[type] || '未知',
    dmgEstimate,
    desc,
  };
}

/**
 * 渲染意图指示器HTML（显示在战斗HUD中）
 */
export function renderIntentIndicator(intent) {
  if (!intent) return '';
  
  return `
    <div class="enemy-intent" style="
      display:flex; align-items:center; gap:6px;
      padding: 4px 10px;
      background: ${intent.color}11;
      border: 1px solid ${intent.color}33;
      border-radius: 6px;
      animation: intent-pulse 1.5s ease-in-out infinite;
    ">
      <style>
        @keyframes intent-pulse {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
      </style>
      <span style="font-size:16px;">${intent.icon}</span>
      <div>
        <span style="color:${intent.color}; font-size:11px; font-weight:bold;">${intent.label}</span>
        <span style="color:#888; font-size:10px; margin-left:4px;">${intent.desc}</span>
      </div>
    </div>
  `;
}

/**
 * 批量计算接下来N回合的意图（用于显示多回合预判）
 */
export function getNextIntents(enemy, currentRound, count, enemyHp, enemyMaxHp, playerHp, playerMaxHp) {
  const intents = [];
  for (let i = 0; i < count; i++) {
    intents.push(getEnemyIntent(enemy, currentRound + i, enemyHp, enemyMaxHp, playerHp, playerMaxHp));
  }
  return intents;
}
