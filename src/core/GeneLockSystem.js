// ═══════════════════════════════════════════════════════════════
// 无限恐怖：中洲轮回 — 基因锁进阶系统
// ═══════════════════════════════════════════════════════════════

import { GENE_LOCK } from './constants.js';

// ── 进阶所需充能阈值 ──────────────────────────────────────────
export const GENE_LOCK_THRESHOLDS = {
  [GENE_LOCK.LOCKED]:  100,   // LOCKED  → 第一阶（约第 3-4 章）
  [GENE_LOCK.STAGE_1]: 250,   // 第一阶 → 第二阶（约第 5-6 章）
  [GENE_LOCK.STAGE_2]: 500,   // 第二阶 → 第三阶（约第 8-9 章）
  [GENE_LOCK.STAGE_3]: 1000,  // 第三阶 → 第四阶（约第 11-12 章）
};

// ── 每阶进阶时的永久属性加成 ────────────────────────────────────
export const GENE_LOCK_BONUSES = {
  [GENE_LOCK.STAGE_1]: {
    atk: 5, def: 3, spd: 2, maxHp: 30,
  },
  [GENE_LOCK.STAGE_2]: {
    atk: 8, def: 5, spd: 3, maxHp: 50, crt: 5,
  },
  [GENE_LOCK.STAGE_3]: {
    atk: 12, def: 8, spd: 5, maxHp: 80, crt: 8, maxMana: 20,
  },
  [GENE_LOCK.STAGE_4]: {
    atk: 20, def: 15, spd: 8, maxHp: 150, crt: 15, maxMana: 50,
  },
};

// ── 各阶段能力描述（中文） ──────────────────────────────────────
const STAGE_DESCRIPTIONS = {
  [GENE_LOCK.LOCKED]:
    '基因锁尚未开启。在生死之间的极限中积蓄力量，方能触及人类潜能的门扉。',
  [GENE_LOCK.STAGE_1]:
    '第一阶·感知增强：五感大幅提升，反应速度超越常人极限，能够捕捉到子弹轨迹。',
  [GENE_LOCK.STAGE_2]:
    '第二阶·肌肉控制：完全掌控身体每一束肌纤维，力量与协调性达到人类巅峰，可施展高阶武技。',
  [GENE_LOCK.STAGE_3]:
    '第三阶·模拟思维：脑域开发跃升，可在瞬间同时运行多条思维链，预判敌人行动并制定最优战术。',
  [GENE_LOCK.STAGE_4]:
    '第四阶·入微之境：洞察万物本质，心灵之光初现，攻防一体浑然天成，已触及非人领域的门槛。',
};

// ── 阶段中文名称 ────────────────────────────────────────────────
const STAGE_NAMES = {
  [GENE_LOCK.LOCKED]:  '未开启',
  [GENE_LOCK.STAGE_1]: '第一阶',
  [GENE_LOCK.STAGE_2]: '第二阶',
  [GENE_LOCK.STAGE_3]: '第三阶',
  [GENE_LOCK.STAGE_4]: '第四阶',
};

/**
 * 检测玩家是否满足基因锁进阶条件
 * @param {object} player - gameState.player
 * @returns {{ advanced: boolean, newStage: number|null, bonuses: object|null, message: string }}
 */
export function checkGeneLockAdvancement(player) {
  const currentStage = player.geneLock;

  // 已达最高阶，无法继续进阶
  if (currentStage >= GENE_LOCK.STAGE_4) {
    return {
      advanced: false,
      newStage: null,
      bonuses: null,
      message: '基因锁已达第四阶·入微之境，无法继续突破。',
    };
  }

  const threshold = GENE_LOCK_THRESHOLDS[currentStage];
  const charge = player.geneLockCharge;

  if (charge < threshold) {
    const remaining = threshold - charge;
    return {
      advanced: false,
      newStage: null,
      bonuses: null,
      message: `充能不足，距离下一阶突破还需 ${remaining} 点（当前 ${charge}/${threshold}）。`,
    };
  }

  // 满足条件，返回即将进阶的信息
  const newStage = currentStage + 1;
  const bonuses = GENE_LOCK_BONUSES[newStage];
  const stageName = STAGE_NAMES[newStage];

  return {
    advanced: true,
    newStage,
    bonuses,
    message: `基因锁充能已满！可突破至${stageName}。`,
  };
}

/**
 * 执行基因锁进阶，将永久属性加成写入玩家状态
 * @param {object} player - gameState.player（会被直接修改）
 * @returns {{ success: boolean, newStage: number|null, bonuses: object|null, message: string }}
 */
export function advanceGeneLock(player) {
  const check = checkGeneLockAdvancement(player);

  if (!check.advanced) {
    return { success: false, newStage: null, bonuses: null, message: check.message };
  }

  const threshold = GENE_LOCK_THRESHOLDS[player.geneLock];
  const { newStage, bonuses } = check;

  // 扣除消耗的充能值
  player.geneLockCharge -= threshold;

  // 提升基因锁阶段
  player.geneLock = newStage;

  // 应用永久属性加成
  for (const [stat, value] of Object.entries(bonuses)) {
    player[stat] = (player[stat] || 0) + value;
  }

  // maxHp/maxMana 增长后同步回满当前值
  if (bonuses.maxHp)   player.hp   = player.maxHp;
  if (bonuses.maxMana)  player.mana = player.maxMana;

  // 进阶后自动激活基因锁
  player.geneLockActive = true;

  const stageName = STAGE_NAMES[newStage];
  const bonusLines = Object.entries(bonuses)
    .map(([k, v]) => `${k}+${v}`)
    .join('、');

  return {
    success: true,
    newStage,
    bonuses,
    message: `基因锁突破至${stageName}！永久增益：${bonusLines}。`,
  };
}

/**
 * 获取当前基因锁进度信息
 * @param {object} player - gameState.player
 * @returns {{ currentStage: number, charge: number, nextThreshold: number|null, progressPercent: number }}
 */
export function getGeneLockProgress(player) {
  const currentStage = player.geneLock;
  const charge = player.geneLockCharge;

  // 已满阶
  if (currentStage >= GENE_LOCK.STAGE_4) {
    return {
      currentStage,
      charge,
      nextThreshold: null,
      progressPercent: 100,
    };
  }

  const nextThreshold = GENE_LOCK_THRESHOLDS[currentStage];
  const progressPercent = Math.min(100, Math.floor((charge / nextThreshold) * 100));

  return {
    currentStage,
    charge,
    nextThreshold,
    progressPercent,
  };
}

/**
 * 获取指定基因锁阶段的中文能力描述
 * @param {number} stage - GENE_LOCK 枚举值
 * @returns {string}
 */
export function getGeneLockDescription(stage) {
  return STAGE_DESCRIPTIONS[stage] || '未知阶段。';
}

/**
 * 切换基因锁激活状态（仅已开启基因锁的玩家可用）
 * @param {object} player - gameState.player（会被直接修改）
 * @returns {{ active: boolean, message: string }}
 */
export function toggleGeneLock(player) {
  if (player.geneLock <= GENE_LOCK.LOCKED) {
    return {
      active: false,
      message: '基因锁尚未开启，无法激活。',
    };
  }

  player.geneLockActive = !player.geneLockActive;
  const stageName = STAGE_NAMES[player.geneLock];

  return {
    active: player.geneLockActive,
    message: player.geneLockActive
      ? `基因锁（${stageName}）已激活，战斗属性获得增幅。`
      : `基因锁（${stageName}）已关闭。`,
  };
}
