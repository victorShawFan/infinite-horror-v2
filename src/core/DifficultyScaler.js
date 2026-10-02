// ═══════════════════════════════════════════════════════════════
// 难度缩放器 — 根据章节动态调整敌人属性
// ═══════════════════════════════════════════════════════════════
//
// 解决问题：后期章节敌人太弱，玩家零伤通关
// 方案：按章节倍率缩放敌人属性，保持前期手感，加强后期挑战

/** 各章节敌人属性倍率 */
const CHAPTER_SCALING = {
  1: 1.0,    // 基准
  2: 1.0,    // 基准
  3: 1.0,    // 基准
  4: 1.0,    // 开始微调
  5: 1.2,    // 轻度增强
  6: 1.4,    // 中度增强
  7: 1.6,    // 明显增强
  8: 1.8,    // 显著增强
  9: 2.1,    // 高难度
  10: 2.5,   // 高难度
  11: 3.0,   // 极高难度
  12: 2.2,   // 终章难度
};

/** Boss 额外倍率 */
const BOSS_EXTRA_SCALING = {
  1: 1.0,
  2: 1.0,
  3: 1.0,
  4: 1.2,
  5: 1.3,
  6: 1.4,
  7: 1.3,
  8: 1.4,
  9: 1.5,
  10: 1.6,
  11: 1.7,
  12: 1.6,
};

/**
 * 缩放敌人属性
 * @param {object} enemy - 原始敌人数据（不会被修改）
 * @param {number} chapter - 章节号 1-12
 * @returns {object} 缩放后的敌人（浅拷贝）
 */
export function scaleEnemy(enemy, chapter) {
  const scale = CHAPTER_SCALING[chapter] || 1.0;
  const isBoss = enemy.type === 'boss';
  const bossExtra = isBoss ? (BOSS_EXTRA_SCALING[chapter] || 1.0) : 1.0;
  const totalScale = scale * bossExtra;

  return {
    ...enemy,
    hp: Math.floor(enemy.hp * totalScale),
    atk: Math.floor(enemy.atk * totalScale),
    def: Math.floor(enemy.def * totalScale),
    spd: enemy.spd || 5,
    rewards: enemy.rewards ? {
      ...enemy.rewards,
      exp: Math.floor((enemy.rewards.exp || 0) * Math.sqrt(totalScale)),
      gold: Math.floor((enemy.rewards.gold || 0) * Math.sqrt(totalScale)),
      rewardPoints: enemy.rewards.rewardPoints
        ? Math.floor(enemy.rewards.rewardPoints * Math.sqrt(totalScale))
        : undefined,
    } : enemy.rewards,
    geneLockCharge: Math.floor((enemy.geneLockCharge || 5) * Math.sqrt(totalScale)),
  };
}

/**
 * 获取章节缩放倍率（用于UI显示）
 */
export function getChapterScaling(chapter) {
  return CHAPTER_SCALING[chapter] || 1.0;
}

export { CHAPTER_SCALING, BOSS_EXTRA_SCALING };
