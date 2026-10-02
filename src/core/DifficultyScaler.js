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
  5: 1.15,   // 轻度增强
  6: 1.3,    // 中度增强
  7: 1.45,   // 明显增强
  8: 1.6,    // 显著增强（+Boss相位补足）
  9: 1.8,    // 高难度（+Boss相位+特性）
  10: 2.0,   // 高难度（Boss相位1.2x-2.0x补足）
  11: 2.2,   // 极高难度（Boss相位+特殊技能补足）
  12: 2.0,   // 终章（4相位Boss自带极高难度）
};

/** Boss 额外倍率 */
const BOSS_EXTRA_SCALING = {
  1: 1.0,
  2: 1.0,
  3: 1.0,
  4: 1.1,
  5: 1.15,
  6: 1.2,
  7: 1.15,   // 复制体郑吒有相位补足
  8: 1.2,
  9: 1.25,   // 脑虫有相位+特性
  10: 1.3,   // 天神队有相位+特殊技能
  11: 1.3,   // 弗莱迪有相位+闪避特性
  12: 1.3,   // 终极Boss 4相位自带高难度
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
