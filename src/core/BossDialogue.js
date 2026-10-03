// ═══════════════════════════════════════════════════════════════
// Boss 战斗对话系统 — 让Boss不再沉默
// ═══════════════════════════════════════════════════════════════
//
// 每个Boss在战斗中的关键时刻说出台词：
//   1. 战斗开始时 (开场白)
//   2. 相位转换时 (觉醒/暴走台词)
//   3. HP低于阈值时 (濒死台词)
//   4. 击杀玩家时 (嘲讽)
//   5. 被击败时 (遗言)
//
// 同时根据玩家状态触发特殊对话

import { eventBus } from './EventBus.js';

// ── Boss 对话库 ──
export const BOSS_DIALOGUES = {
  // Ch1: 暴君 T-002
  tyrant_t002: {
    name: '暴君 T-002',
    icon: '🧟',
    intro: [
      '（暴君发出震耳欲聋的咆哮，浑身肌肉剧烈膨胀）',
      '杀……杀……所有活着的……都必须死……',
    ],
    phase: {
      '突变': ['嘶嗷嗷嗷！！！（身体开始不受控制地异变）', '痛苦……只有痛苦……更多的痛苦！'],
      '暴走': ['（暴君的人性已完全丧失，只剩下纯粹的杀戮本能）'],
    },
    lowHp: ['呼……呼……不可能……被人类……', '（暴君摇摇欲坠，但仍在顽强地站立）'],
    defeat: ['（暴君重重倒地，地面都在震动。T病毒的实验产物……终于安息了）'],
    killPlayer: ['（暴君站在你的尸体上发出胜利的咆哮）'],
  },

  // Ch2: 异形皇后
  alien_queen: {
    name: '异形皇后',
    icon: '👾',
    intro: [
      '（异形皇后从黑暗中缓缓现身，尾部的利刃闪着寒光）',
      '嘶嘶嘶……新的宿主……完美的基因……',
    ],
    phase: {
      '召唤': ['来吧，我的孩子们……撕碎这个入侵者……', '（无数幼虫从暗处涌出）'],
      '濒死暴怒': ['不……不允许……巢穴……不可以……毁灭！！！'],
    },
    lowHp: ['（皇后发出刺耳的尖叫，酸液从伤口不断渗出）'],
    defeat: ['（异形皇后的身躯轰然倒塌，酸血腐蚀着地面）\n你证明了……人类不是……猎物……'],
    killPlayer: ['（皇后将你的身体拖入深暗的巢穴……）'],
  },

  // Ch3: 伽椰子
  kayako: {
    name: '伽椰子',
    icon: '👻',
    intro: [
      '（楼梯上传来令人毛骨悚然的咔咔声……）',
      '啊……啊啊啊啊啊……（伽椰子以扭曲的姿态从天花板上爬下）',
      '你也来了……和我一样……被困在这里……永远……',
    ],
    phase: {
      '怨灵实体化': ['恨……恨恨恨恨恨！！！为什么只有我要留在这里！！！', '（伽椰子的怨念凝聚成实体，黑发如触手般伸展）'],
    },
    lowHp: ['为什么……你不害怕吗……', '（伽椰子的身影开始变得虚幻）'],
    defeat: ['（伽椰子缓缓消散……最后的表情，似乎带着一丝释然）\n终于……可以解脱了……谢谢你……'],
    killPlayer: ['不……你也要……和我一样……永远留在这里……'],
  },

  // Ch4: 伊莫顿
  imhotep: {
    name: '伊莫顿',
    icon: '🏺',
    intro: [
      '哈哈哈……千年沉眠，终于迎来了值得一战的对手。',
      '我是伊莫顿。曾经的大祭司，如今的不死者。你准备好面对永恒了吗？',
    ],
    phase: {
      '复活仪式': ['你以为杀得了我？我已超越死亡！', '（伊莫顿开始吟唱古埃及咒语，伤口以肉眼可见的速度愈合）'],
      '法老之怒': ['够了！让法老的怒火吞噬一切！！！', '（金字塔深处传来低沉的轰鸣，沙暴席卷而来）'],
    },
    lowHp: ['不可能……我是永恒的……这不应该……', '（伊莫顿的身体开始崩解，古老的诅咒正在消散）'],
    defeat: ['（伊莫顿跪倒在地）\n\n三千年……终于……终于结束了……\n安克苏纳蒙……我终于可以来见你了……'],
    killPlayer: ['你不过是历史长河中的一粒沙尘罢了。'],
  },

  // Ch5: 张杰（引导者）
  zhangjie: {
    name: '张杰',
    icon: '📓',
    intro: [
      '你终于来了，郑吒。我等你很久了。',
      '作为引导者，我的职责是……测试你。这次不是作为盟友，而是对手。',
      '亮出你的全力来吧。如果连我都打不过，后面的轮回，你一定会死。',
    ],
    phase: {
      '死神之翼': ['看到了吗？这就是更高层次的力量。', '（张杰背后浮现出淡金色的翅膀轮廓）'],
    },
    lowHp: ['不错……你确实变强了。也许……你真的能走到最后。'],
    defeat: ['（张杰收起架势，露出欣慰的微笑）\n\n很好，郑吒。你比我预想的更强。\n记住这种感觉——真正的战斗，才刚刚开始。'],
    killPlayer: ['太弱了。以这种实力，你根本走不到最后。\n回去修炼吧。'],
    playerLowHp: ['坚持住，郑吒！如果你连这种程度都扛不住，后面怎么办？'],
  },

  // Ch6: 异形+人类混合体BOSS
  alien_hybrid: {
    name: '进化体',
    icon: '🧬',
    intro: [
      '（一个半人半异形的生物从培养液中苏醒）',
      '我……我是什么……人类？还是异形？……都不是。我是进化。',
    ],
    phase: {},
    lowHp: ['为什么……你要杀死我……我只是想……活下去……'],
    defeat: ['（进化体倒下前伸出了手）\n如果我有选择……我想做回人类……'],
    killPlayer: ['适者生存。抱歉。'],
  },

  // Ch7: 楚轩的影子 / 恶魔队先锋
  demon_vanguard: {
    name: '恶魔队先锋',
    icon: '😈',
    intro: [
      '中洲队……哈，不过如此。',
      '你们以为自己是主角？在恶魔队眼里，你们不过是经验值。',
    ],
    phase: {},
    lowHp: ['怎么可能……你们的成长速度……超出了预计……'],
    defeat: ['（恶魔队先锋倒下）\n告诉你们的队长……恶魔队……不会这么轻易……认输的……'],
    killPlayer: ['太天真了。轮回世界不需要天真的人。'],
  },

  // Ch8: 巨龙/精灵王
  dragon_lord: {
    name: '巨龙领主',
    icon: '🐉',
    intro: [
      '（天空中传来震撼灵魂的龙吟）',
      '渺小的人类，竟敢踏入我的领地。你的勇气，值得我用全力回应。',
    ],
    phase: {
      '龙息': ['（龙焰划过天空）感受火焰的洗礼吧！'],
      '巨龙盛怒': ['（大地在龙翼的拍打下颤抖）我已万年未尝败绩！！！'],
    },
    lowHp: ['（巨龙落地，翅膀破碎）\n你……你让我流血了……有多少年……没有人能让我流血了……'],
    defeat: ['（巨龙盘卧在地）\n\n你赢了，勇士。拿去吧——这是龙族的祝福。\n愿你的火焰，比我的更加明亮。'],
    killPlayer: ['（巨龙哀鸣）又一个不自量力的冒险者倒下了……'],
  },

  // Ch9: 虫族脑虫
  brain_bug: {
    name: '脑虫',
    icon: '🧠',
    intro: [
      '（一个巨大的脑状生物在虫巢深处搏动）',
      '我能读取你的思维……你的恐惧……你的弱点……全部一览无余。',
    ],
    phase: {},
    lowHp: ['不……停止思考……你在屏蔽我的读取！？怎么可能！！'],
    defeat: ['（脑虫的精神力崩溃）\n你的意志……比我预想的……更加坚不可摧……'],
    killPlayer: ['你的思维已经被我掌控了。现在……安静地服从吧。'],
  },

  // Ch10: 洪荒/楚轩影
  chuxuan_shadow: {
    name: '楚轩之影',
    icon: '🖤',
    intro: [
      '（一个和楚轩一模一样的身影站在你面前，但眼中是空洞的黑暗）',
      '我是你最信任之人的另一面。你能打败我吗？如果你下不了手呢？',
    ],
    phase: {},
    lowHp: ['（影子的形态开始不稳定）\n不对……你不应该能伤害我……我是你的弱点才对……'],
    defeat: ['（影子消散前，露出了和楚轩一样的微笑）\n\n……你通过了考验。\n真正的楚轩，会比我更骄傲。'],
    killPlayer: ['你果然打不过你的内心。'],
  },

  // Ch11: 恶魔队队长/副队
  demon_captain: {
    name: '恶魔队队长',
    icon: '💀',
    intro: [
      '中洲队队长，终于见面了。',
      '你知道我们之间的差距吗？不是实力——是觉悟。',
      '我为了目标可以放弃一切。你呢？你的"羁绊"，只会成为你的枷锁。',
    ],
    phase: {
      '第二形态': ['有趣。让我用真正的力量来对付你。', '（恶魔队队长释放了基因锁的极限力量）'],
    },
    lowHp: ['咳……你成长得比我预想的快。也许……中洲队确实有资格走到最后。'],
    defeat: ['（恶魔队队长倒下）\n\n哈……输了就是输了。\n但记住——你选择的这条路……会比我的更难走。\n……祝你好运。'],
    killPlayer: ['羁绊就是弱点。这是你用生命证明的真理。'],
  },

  // Ch12: 主神碎片 / 最终Boss
  lord_god_core: {
    name: '主神核心',
    icon: '👁',
    intro: [
      '（空间扭曲，一个巨大的光球浮现——主神碎片的核心）',
      '█ █ █ █',
      '你以为摧毁了我，就能获得自由？',
      '我不是你的敌人。我是这个宇宙的规则。',
      '没有我的轮回，你只是一个普通人。你确定要放弃这一切？',
    ],
    phase: {
      '规则重写': ['我改写了战斗规则。看看你能否适应。', '（空间法则被扭曲，物理常数在变化）'],
      '最终审判': ['够了。接受审判吧——这是你作为轮回者的最终试炼。', '（无穷的光芒从核心中涌出）'],
    },
    lowHp: [
      '……你真的选择了这条路。',
      '很好。如果你的意志足够坚定——那就亲手毁掉我吧。',
    ],
    defeat: [
      '（主神核心开始碎裂，光芒渐渐黯淡）',
      '',
      '……恭喜你，郑吒。',
      '你证明了一件事——人类的意志，可以超越神的规则。',
      '轮回终结了。但你的故事……才刚刚开始。',
      '',
      '（光芒彻底消散。沉寂了很久很久的世界……迎来了黎明）',
    ],
    killPlayer: ['这就是违抗规则的代价。回到原点吧。'],
    playerLowHp: ['挣扎吧，轮回者。但你改变不了命运。'],
  },
};

/**
 * 获取Boss开场白
 */
export function getBossIntro(bossId) {
  const dialogues = BOSS_DIALOGUES[bossId];
  if (!dialogues?.intro) return null;
  return dialogues.intro;
}

/**
 * 获取Boss相位转换对话
 */
export function getBossPhaseDialogue(bossId, phaseName) {
  const dialogues = BOSS_DIALOGUES[bossId];
  if (!dialogues?.phase?.[phaseName]) return null;
  const lines = dialogues.phase[phaseName];
  return lines[Math.floor(Math.random() * lines.length)];
}

/**
 * 获取Boss低血量台词
 */
export function getBossLowHpLine(bossId) {
  const dialogues = BOSS_DIALOGUES[bossId];
  if (!dialogues?.lowHp) return null;
  const lines = dialogues.lowHp;
  return lines[Math.floor(Math.random() * lines.length)];
}

/**
 * 获取Boss被击败遗言
 */
export function getBossDefeatLines(bossId) {
  const dialogues = BOSS_DIALOGUES[bossId];
  if (!dialogues?.defeat) return null;
  return dialogues.defeat;
}

/**
 * 获取Boss击杀玩家台词
 */
export function getBossKillPlayerLine(bossId) {
  const dialogues = BOSS_DIALOGUES[bossId];
  if (!dialogues?.killPlayer) return null;
  const lines = Array.isArray(dialogues.killPlayer) ? dialogues.killPlayer : [dialogues.killPlayer];
  return lines[Math.floor(Math.random() * lines.length)];
}

/**
 * 获取Boss对濒死玩家的台词
 */
export function getBossPlayerLowHpLine(bossId) {
  const dialogues = BOSS_DIALOGUES[bossId];
  if (!dialogues?.playerLowHp) return null;
  const lines = Array.isArray(dialogues.playerLowHp) ? dialogues.playerLowHp : [dialogues.playerLowHp];
  return lines[Math.floor(Math.random() * lines.length)];
}

/**
 * 获取Boss信息（名称+图标）
 */
export function getBossInfo(bossId) {
  const dialogues = BOSS_DIALOGUES[bossId];
  if (!dialogues) return null;
  return { name: dialogues.name, icon: dialogues.icon };
}
