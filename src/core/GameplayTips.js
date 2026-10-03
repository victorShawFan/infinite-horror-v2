// ═══════════════════════════════════════════════════════════════
// 游戏提示系统 — 楼层加载/等待时的策略指南
// ═══════════════════════════════════════════════════════════════

const TIPS_BY_CATEGORY = {
  combat: [
    '战斗姿态(N键)会影响攻防属性——进攻姿态+20%ATK但-15%DEF，防御姿态则相反。',
    '暴击可以造成1.5倍伤害。CRT越高，暴击频率越大，投资CRT可以显著提升DPS。',
    '面对高DEF敌人时，考虑使用破甲技能或更换破甲附魔武器。',
    'Boss战中基因锁激活(G键)可以暂时大幅提升属性，但有冷却时间。',
    '元素克制关系：火克冰、冰克雷、雷克水、光克暗。利用克制可增加50%伤害。',
    '精英怪物有特殊词缀——毒、吸血、荆棘等。战前确认面板会详细显示词缀效果。',
    '同伴关系越高，协战频率和效果越强。多与同伴对话可以增进关系。',
    '战斗评级(S/A/B/C)取决于速度、受伤比、暴击率。S级评级可获得额外奖励。',
  ],
  progression: [
    '每次升级获得3个可分配属性点。按T键打开属性分配面板。',
    '天赋树分三条路线：战斗(红)、生存(绿)、技巧(蓝)。在主神空间中分配。',
    '装备词缀(前缀+后缀)会提供额外战斗效果——吸血、破甲、暴击等。',
    '附魔系统可以为装备添加元素属性和特殊效果。',
    '基因锁突破需要积累足够的充能——在高危战斗中充能最快。',
    '血统选择会永久影响角色Build。吸血鬼适合持久战，武道之体适合爆发。',
    '探索事件的选择会影响业力值。光明路线和黑暗路线有不同的被动效果。',
  ],
  survival: [
    '战前确认面板(悬浮敌人)会显示完整的战斗预测——伤害、回合数、胜率。',
    '如果敌人标记为[致命]或[危险]，建议先提升属性或更换装备再挑战。',
    'F5随时快速存档。死亡后可以读档重试，不必从头开始。',
    '每层的治疗道具是有限的。合理规划血量，不要每场战斗都硬拼。',
    '逃跑功能在非Boss战中可用，但有失败概率。速度越高越容易逃脱。',
    '仓库系统可以存放暂时不用的装备。升级后可以扩容仓库。',
    '连杀(K键查看)可以获得经验加成和小量回血。保持连杀序列很值得。',
  ],
  meta: [
    '按Tab键查看完整角色详情面板——战力评分、装备总览、基因锁进度。',
    '按H/?键查看所有快捷键。游戏有25+个快捷键供快速操作。',
    '小地图(右下角)上的敌人颜色代表威胁等级：灰色安全，红色致命。',
    '通关后解锁New Game+(周目)模式，敌人更强但可继承部分属性。',
    '每日挑战和无尽深渊是独立的挑战模式，可以用来磨练技巧和获取奖励。',
    '鼠标悬浮在任何实体上都可以看到详细信息。善用这个功能规划路线。',
  ],
};

let _shownTips = new Set();

/**
 * 获取一条随机提示
 * @param {string} category - 可选类别过滤
 * @returns {string}
 */
export function getRandomTip(category = null) {
  let pool;
  if (category && TIPS_BY_CATEGORY[category]) {
    pool = TIPS_BY_CATEGORY[category];
  } else {
    pool = Object.values(TIPS_BY_CATEGORY).flat();
  }
  
  // 优先展示未显示过的
  const unseen = pool.filter((_, i) => !_shownTips.has(i));
  if (unseen.length > 0) {
    const idx = Math.floor(Math.random() * unseen.length);
    const tip = unseen[idx];
    _shownTips.add(pool.indexOf(tip));
    return tip;
  }
  
  // 全部展示过，随机返回
  _shownTips.clear();
  return pool[Math.floor(Math.random() * pool.length)];
}

/**
 * 获取适合当前状态的提示
 */
export function getContextualTip(player, chapter) {
  // 低血量时优先生存提示
  if (player.hp < player.maxHp * 0.3) return getRandomTip('survival');
  // 新章节优先进度提示
  if (chapter <= 2) return getRandomTip('progression');
  // 中期优先战斗提示
  if (chapter >= 5 && chapter <= 9) return getRandomTip('combat');
  // 随机
  return getRandomTip();
}

/**
 * 所有提示数量
 */
export function getTotalTipsCount() {
  return Object.values(TIPS_BY_CATEGORY).flat().length;
}
