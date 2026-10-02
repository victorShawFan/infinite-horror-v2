// ═══════════════════════════════════════════════════════════════
// 同伴关系与羁绊系统 — 角色情感深度
// ═══════════════════════════════════════════════════════════════
//
// 每个同伴有独立的关系值（-100 ~ 100）
// 关系等级影响：对话内容、战斗加成、剧情分支
// 特殊事件会大幅改变关系
// 高关系解锁同伴专属故事

import { eventBus } from './EventBus.js';

export const RELATIONSHIP_LEVELS = [
  { min: -100, max: -51, name: '敌对',   color: '#ff2222', combatBonus: -0.10, desc: '彼此间充满敌意' },
  { min: -50,  max: -11, name: '疏远',   color: '#ff6644', combatBonus: -0.05, desc: '关系冷淡，缺乏信任' },
  { min: -10,  max: 10,  name: '中立',   color: '#888888', combatBonus: 0,     desc: '普通的同伴关系' },
  { min: 11,   max: 40,  name: '友好',   color: '#44cc88', combatBonus: 0.05,  desc: '互相信任的战友' },
  { min: 41,   max: 70,  name: '亲密',   color: '#44aaff', combatBonus: 0.10,  desc: '生死相托的挚友' },
  { min: 71,   max: 100, name: '羁绊',   color: '#ffaa00', combatBonus: 0.15,  desc: '超越生死的深刻羁绊' },
];

// ── 同伴角色档案 ──
export const COMPANION_PROFILES = {
  zhang_jie: {
    name: '张杰',
    title: '第一任队长',
    personality: '沉稳可靠、父亲般的温暖',
    quote: '"活着回去，这是命令。"',
    likes: ['保护弱者', '团队合作', '冷静决策'],
    dislikes: ['无谓牺牲', '背叛', '鲁莽'],
    deathChapter: 5,
    memoir: '张杰。中洲队的第一任队长。他不是最强的，但他是最值得信赖的。在死神来了的世界里，他用自己的命换来了郑吒的成长。那天之后，郑吒明白了什么叫做"队长"。',
  },
  zhan_lan: {
    name: '詹岚',
    title: '狙击手',
    personality: '冷静精准、外冷内热',
    quote: '"瞄准的时候，心要比手更稳。"',
    likes: ['精准行动', '理性分析', '保护同伴'],
    dislikes: ['混乱', '犹豫', '浪费'],
    memoir: '詹岚。她的枪法和她的心一样，从不偏离目标。',
  },
  chuxuan: {
    name: '楚轩',
    title: '军师',
    personality: '冷酷理性、天才战术家',
    quote: '"情感是弱点，但偶尔也是力量。"',
    likes: ['完美计划', '逻辑思维', '效率'],
    dislikes: ['感情用事', '低效', '不可控因素'],
    deathChapter: 7, // 暂时死亡
    reviveChapter: 8,
    memoir: '楚轩。他用冰冷的逻辑拯救了无数次中洲队。当他选择牺牲自己的时候，所有人才意识到，那颗冰冷的心里，一直燃烧着最炽热的火焰。',
  },
  li_xiaoyi: {
    name: '李小意',
    title: '新人',
    personality: '单纯善良、成长型角色',
    quote: '"我也想变得像郑吒哥一样强！"',
    likes: ['被认可', '学习', '保护人'],
    dislikes: ['被忽视', '无力感'],
    memoir: '李小意。他是所有人的影子——每一个刚进入主神空间的普通人。他的成长，就是我们每个人的成长。',
  },
  mou_gang: {
    name: '牟刚',
    title: '重装战士',
    personality: '忠厚耿直、力量型',
    quote: '"打不过？那就再打一次。"',
    likes: ['正面对决', '兄弟义气', '简单直接'],
    dislikes: ['阴谋诡计', '伤害无辜'],
    memoir: '牟刚。他像一座山，沉默而坚定。在所有人都想逃跑的时候，他总是第一个站出来。',
  },
  lingdian: {
    name: '零点',
    title: '复制体·觉醒',
    personality: '从冷酷到有情',
    quote: '"我曾以为自己只是一个影子，但现在我知道，影子也有自己的光。"',
    likes: ['认同', '存在的意义', '战斗中的觉醒'],
    dislikes: ['被视为工具', '否定存在'],
    memoir: '零点。一个复制体的灵魂觉醒。他证明了，即使是被创造出来的生命，也能找到属于自己的意义。',
  },
  bawang: {
    name: '霸王',
    title: '古武强者',
    personality: '豪迈霸气、武痴',
    quote: '"拳头说话，比嘴巴管用。"',
    likes: ['强者', '挑战', '直来直往'],
    dislikes: ['弱者的借口', '拖泥带水'],
    memoir: '霸王。古武血统的传人。他追求的不是胜利，而是超越自己的极限。每一拳，都是他对命运的回答。',
  },
  lishuaixi: {
    name: '李帅西',
    title: '后勤支援',
    personality: '谨慎务实、生存主义',
    quote: '"活着才是最重要的。"',
    likes: ['安全', '准备充分', '团队稳定'],
    dislikes: ['冒险', '不确定性'],
    memoir: '李帅西。在英雄辈出的主神空间里，他只想活着。但就是这份对"活着"的执着，让他在关键时刻做出了最勇敢的选择。',
  },
};

// ── 关系变化事件 ──
export const RELATIONSHIP_EVENTS = {
  // 正面
  save_life:       { value: 20, text: '在危难时刻伸出援手' },
  share_item:      { value: 5,  text: '分享了物资' },
  good_decision:   { value: 10, text: '做出了正确的决策' },
  protect_weak:    { value: 8,  text: '保护了弱者' },
  honest_talk:     { value: 12, text: '坦诚相见' },
  fight_together:  { value: 3,  text: '并肩作战' },
  sacrifice:       { value: 30, text: '为同伴牺牲' },
  
  // 负面
  abandon:         { value: -25, text: '在危难时选择放弃' },
  selfish:         { value: -10, text: '自私的行为' },
  lie:             { value: -8,  text: '欺骗了同伴' },
  reckless:        { value: -5,  text: '鲁莽行事导致危险' },
  ignore:          { value: -3,  text: '忽视了同伴的感受' },
  betray:          { value: -40, text: '背叛' },
};

export function getRelationshipLevel(value) {
  for (const level of RELATIONSHIP_LEVELS) {
    if (value >= level.min && value <= level.max) return level;
  }
  return RELATIONSHIP_LEVELS[2]; // 中立
}

export function changeRelationship(companionId, eventId, relationships) {
  const event = RELATIONSHIP_EVENTS[eventId];
  if (!event) return null;
  
  if (!relationships[companionId]) relationships[companionId] = 0;
  const oldValue = relationships[companionId];
  relationships[companionId] = Math.max(-100, Math.min(100, oldValue + event.value));
  const newValue = relationships[companionId];
  
  const oldLevel = getRelationshipLevel(oldValue);
  const newLevel = getRelationshipLevel(newValue);
  const levelChanged = oldLevel.name !== newLevel.name;
  
  eventBus.emit('relationship:change', {
    companionId,
    event: eventId,
    oldValue,
    newValue,
    oldLevel: oldLevel.name,
    newLevel: newLevel.name,
    levelChanged,
    text: event.text,
  });
  
  return { oldValue, newValue, levelChanged, newLevelName: newLevel.name };
}

export function getCompanionCombatBonus(companionId, relationships) {
  const value = relationships[companionId] || 0;
  const level = getRelationshipLevel(value);
  return level.combatBonus;
}

export function getRelationshipSummary(relationships) {
  return Object.entries(relationships).map(([id, value]) => {
    const profile = COMPANION_PROFILES[id];
    const level = getRelationshipLevel(value);
    return {
      id,
      name: profile?.name || id,
      title: profile?.title || '',
      value,
      level: level.name,
      color: level.color,
      combatBonus: level.combatBonus,
      quote: profile?.quote || '',
      memoir: profile?.memoir || '',
    };
  });
}
