// ═══════════════════════════════════════════════════════════════
// 同伴战斗对话系统 — 基于关系等级的动态对话
// ═══════════════════════════════════════════════════════════════
//
// 同伴在战斗中/后根据关系等级说出不同台词
// 关系越高，台词越有深度和情感

import { getRelationshipLevel, COMPANION_PROFILES } from './RelationshipSystem.js';

// ── 战斗中对话模板 ──
const COMBAT_LINES = {
  zhang_jie: {
    敌对: [],
    疏远: ['……'],
    中立: ['小心！', '别大意了。'],
    友好: ['跟上我的节奏！', '我来掩护！'],
    亲密: ['郑吒，我相信你！', '一起上！我给你开路！'],
    羁绊: ['这一战，我不会让你独自面对！', '就像第一次遇见你时一样……我会守住你的背后。'],
  },
  zhan_lan: {
    敌对: [],
    疏远: ['自己小心。'],
    中立: ['目标锁定。', '瞄准了。'],
    友好: ['我来提供火力支援。', '敌人的弱点在那里。'],
    亲密: ['有我看着呢，放手去打！', '我不会让任何子弹偏离方向。'],
    羁绊: ['这把枪从来不会瞄错方向——因为它知道要保护谁。', '你不会倒下的。因为我还在瞄准。'],
  },
  chuxuan: {
    敌对: ['别拖后腿。'],
    疏远: ['……效率太低了。'],
    中立: ['按计划行动。', '不要偏离策略。'],
    友好: ['这是最优解。信我。', '敌人的模式已经分析完毕。'],
    亲密: ['放心，我已经算好了每一步。', '你负责执行，我负责思考。'],
    羁绊: ['楚轩罕见地笑了一下：……这次不是计算。是因为信任。', '我第一次……不想用"效率"来衡量一场战斗。'],
  },
  li_xiaoyi: {
    敌对: [],
    疏远: ['……'],
    中立: ['我、我会加油的！', '好厉害……'],
    友好: ['郑吒哥，我来帮忙！', '我也能战斗！'],
    亲密: ['我不会再拖后腿了！', '这次换我来保护大家！'],
    羁绊: ['从那天起，我就决定了——我要变得和你一样强。不是为了自己，是为了不再让任何人牺牲。'],
  },
  mou_gang: {
    敌对: [],
    疏远: ['哼。'],
    中立: ['上吧。', '我来挡住。'],
    友好: ['兄弟们冲！', '让我来扛住这一波！'],
    亲密: ['只要我还站着，没人能碰到你们！', '牟钢在这里，防线不会破！'],
    羁绊: ['就算全世界都是敌人……只要你还在战斗，我就不会倒下。'],
  },
  lingdian: {
    敌对: ['……无意义。'],
    疏远: ['效率太低。'],
    中立: ['开始吧。', '目标确认。'],
    友好: ['配合得不错。', '你的判断力……值得信赖。'],
    亲密: ['我不是"复制体"。我是零点。你让我明白了这一点。', '这一战，为了我自己的意义。'],
    羁绊: ['我曾以为自己只是一个影子。但你告诉我——影子也有自己的光。现在，我要用这份光，守护你。'],
  },
  bawang: {
    敌对: ['闪开，别挡路。'],
    疏远: ['哼……'],
    中立: ['来战！', '拳头说话！'],
    友好: ['痛快！一起打个够！', '好对手！别让我失望！'],
    亲密: ['能和你并肩而战，是我的荣幸！', '这一拳，不只为自己——为所有同伴！'],
    羁绊: ['霸王的古武血统沸腾了。不是因为强敌——是因为背后站着值得用命去守护的人。'],
  },
  lishuaixi: {
    敌对: [],
    疏远: ['……活着就好。'],
    中立: ['小心……', '安全第一。'],
    友好: ['我来检查物资，你们放心打！', '后方交给我！'],
    亲密: ['只要大家都能活着回去，我什么都愿意做。', '我的勇气，是从你们身上学来的。'],
    羁绊: ['我不是英雄。但在这一刻，为了你们……我愿意成为英雄。'],
  },
};

// ── 战斗胜利评语 ──
const VICTORY_LINES = {
  boss_close: [
    '险胜。还好大家没事。',
    '差一点就……下次得更谨慎。',
  ],
  boss_dominant: [
    '完美击破！',
    '这就是中洲队的实力。',
  ],
  normal_close: [
    '有惊无险。',
    '还好……继续走吧。',
  ],
  normal_easy: [
    '轻松。',
    '越来越强了。',
  ],
};

/**
 * 获取同伴战斗时的随机台词
 * @param {string} companionId 
 * @param {number} relationshipValue 
 * @returns {string|null}
 */
export function getCompanionCombatLine(companionId, relationshipValue) {
  const level = getRelationshipLevel(relationshipValue);
  const lines = COMBAT_LINES[companionId]?.[level.name];
  if (!lines || lines.length === 0) return null;
  return lines[Math.floor(Math.random() * lines.length)];
}

/**
 * 获取战斗结束后的同伴评语
 * @param {boolean} isBoss 
 * @param {boolean} closeCall 是否险胜（HP < 30%）
 * @returns {string}
 */
export function getVictoryComment(isBoss, closeCall) {
  const key = isBoss 
    ? (closeCall ? 'boss_close' : 'boss_dominant')
    : (closeCall ? 'normal_close' : 'normal_easy');
  const lines = VICTORY_LINES[key];
  return lines[Math.floor(Math.random() * lines.length)];
}

/**
 * 生成战斗中的同伴对话日志
 * @param {Array} companions 存活同伴列表
 * @param {object} relationships 关系数据
 * @param {string} context 'start' | 'mid' | 'end'
 * @returns {Array} 日志条目
 */
export function generateCombatDialogue(companions, relationships, context = 'start') {
  const logs = [];
  const alive = companions.filter(c => c.alive);
  
  if (alive.length === 0) return logs;
  
  // 每次最多选1-2个同伴说话，避免刷屏
  const speakers = alive
    .filter(() => Math.random() < 0.4)
    .slice(0, 2);
  
  for (const c of speakers) {
    const relVal = relationships[c.id] || 0;
    const line = getCompanionCombatLine(c.id, relVal);
    if (line) {
      const profile = COMPANION_PROFILES[c.id];
      const name = profile?.name || c.name || c.id;
      const level = getRelationshipLevel(relVal);
      logs.push({
        text: `💬 ${name}：「${line}」`,
        type: 'companion_dialogue',
        color: level.color,
      });
    }
  }
  
  return logs;
}
