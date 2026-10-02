// ═══════════════════════════════════════════════════════════════
// 回顾系统 — "上回轮回" 叙事回顾
// ═══════════════════════════════════════════════════════════════

/**
 * 各章概要与关键剧情节点
 * 玩家读档时显示已完成章节的回顾
 */
const CHAPTER_RECAPS = {
  1: {
    title: '第一章 · 名为生化',
    world: '生化危机世界',
    summary: '十三名陌生人在列车上醒来。主神宣布了轮回的规则——只有完成任务才能活着回去。生化危机的世界里，郑吒和张杰带领队伍穿越蜂巢，面对暴君T-002。',
    keyEvent: '张杰展现出队长的担当。牟钢、李萧毅证明了自己。',
    emotion: '恐惧中萌生的信任。',
  },
  2: {
    title: '第二章 · 异形杀戮',
    world: '异形世界',
    summary: '这一次是异形的飞船。通风管道、抱脸虫、异形皇后——每一步都可能是死亡。在巢穴深处的救援行动中，队伍付出了代价。',
    keyEvent: '新人加入，同时也有人永远留在了那里。',
    emotion: '死亡的重量开始被真实感受。',
  },
  3: {
    title: '第三章 · 咒怨阴影',
    world: '咒怨世界',
    summary: '日式恐怖的宅邸中，七波诅咒逐层袭来。佛经是唯一的线索。楚轩留下的录像揭示了更深的秘密。伽椰子的终战考验着每个人的勇气。',
    keyEvent: '楚轩的智慧初现端倪。',
    emotion: '在绝望中寻找规律——这就是轮回者的生存方式。',
  },
  4: {
    title: '第四章 · 神鬼秘宝',
    world: '木乃伊世界',
    summary: '沙漠、开罗、古老的陵墓。复活真经成为所有队伍争夺的焦点。印洲队的伏击让队伍付出了惨痛代价。伊莫顿的力量超乎想象。',
    keyEvent: '第一次遭遇其他轮回者队伍的敌意。',
    emotion: '轮回不只有怪物——人才是最危险的敌人。',
  },
  5: {
    title: '第五章 · 死神绝境',
    world: '死神来了世界',
    summary: '没有怪物，只有必然的死亡。死神的征兆无处不在，每一个选择都关乎生死。张杰做出了自己的选择，将队长的位置交给了郑吒。',
    keyEvent: '张杰告别——"你比我更适合这个位置。"',
    emotion: '告别、传承与成长。',
  },
  6: {
    title: '第六章 · 异形再临',
    world: '异形前传世界',
    summary: '实验飞船上的另一种恐怖。感染、隔离、水下通道——更强的异形在等待。程啸的救援成为转折点。',
    keyEvent: '队伍在危机中变得更加团结。',
    emotion: '面对故人的场景，用新的力量应对。',
  },
  7: {
    title: '第七章 · 恶魔初临',
    world: '生化危机2世界',
    summary: '浣熊市的噩梦重演。但这一次，恶魔队现身了——复制体郑吒是最危险的对手。团灭的危机迫在眉睫。',
    keyEvent: '郑吒在死亡中领悟，立下誓言——"我一定会变强。"',
    emotion: '至暗时刻中的不屈意志。',
  },
  8: {
    title: '第八章 · 重建中洲',
    world: '神鬼/侏罗纪世界',
    summary: '回到陵墓复活楚轩。然后是侏罗纪世界的考验——暴龙、远古巨龙。罗甘道加入队伍，霸王和王侠被复活。',
    keyEvent: '中洲队开始重建。复活不是免费的——它需要代价。',
    emotion: '失而复得的珍贵。',
  },
  9: {
    title: '第九章 · 星河远征',
    world: '星河战队世界',
    summary: '十天整备后，队伍被送往星河战队的世界。虫族的数量令人窒息。零点的狙击定点清除脑虫，多队博弈让局势更加复杂。',
    keyEvent: '零点、詹岚、罗甘道复活。全队回到完整编制。',
    emotion: '团队的力量超越个人。',
  },
  10: {
    title: '第十章 · 五队大战',
    world: '生化/魔戒世界',
    summary: '五支轮回者队伍在魔戒世界正面交锋。联盟、背叛、死战——天神队的强者现身。这是迄今为止最危险的对手。',
    keyEvent: '赵樱空、张恒、程啸被复活。队伍达到巅峰状态。',
    emotion: '战争的残酷与策略的极致。',
  },
  11: {
    title: '第十一章 · 心魔与终战前奏',
    world: '变形金刚/猛鬼街/天煞世界',
    summary: '罗甘道在变形金刚世界战死。猛鬼街的梦层中，弗莱迪抓住了每个人最深的恐惧。郑吒选择自杀来破除心魔。',
    keyEvent: '郑吒破除心魔——"不再恐惧死亡。"',
    emotion: '直面内心最深的恐惧。',
  },
  12: {
    title: '第十二章 · 生化终战',
    world: '最终战场',
    summary: '主神公布了最终规则。只有一支队伍能活着离开。楚轩制定了最后的计划——然后，一个接一个地，他们为了胜利选择了牺牲。',
    keyEvent: '郑吒独自面对复制体——另一个自己。',
    emotion: '牺牲与不屈。生命的意义在于选择。',
  },
};

/**
 * 生成"上回轮回"回顾HTML
 * @param {number} currentChapter - 当前章节号
 * @param {Array} choices - 玩家做出的选择列表
 * @returns {string} HTML字符串
 */
export function generateRecapHTML(currentChapter, choices = []) {
  if (currentChapter <= 1) return '';

  const completedChapters = [];
  for (let i = 1; i < currentChapter; i++) {
    if (CHAPTER_RECAPS[i]) completedChapters.push(CHAPTER_RECAPS[i]);
  }

  if (completedChapters.length === 0) return '';

  // 只显示最近2-3章
  const recentChapters = completedChapters.slice(-3);

  let html = `
    <div style="max-width:650px;margin:0 auto;">
      <h2 style="text-align:center;color:#ff4444;letter-spacing:8px;margin-bottom:24px;
        text-shadow:0 0 20px rgba(255,68,68,0.3);">
        — 上回轮回 —
      </h2>
  `;

  for (const ch of recentChapters) {
    html += `
      <div style="margin-bottom:20px;padding:16px 20px;background:rgba(255,255,255,0.02);
        border-left:2px solid #ff444440;border-radius:0 8px 8px 0;">
        <h3 style="color:#ff8866;font-size:15px;margin-bottom:8px;">${ch.title}</h3>
        <p style="color:#aaa;font-size:13px;line-height:1.8;margin-bottom:6px;">${ch.summary}</p>
        <p style="color:#ffcc44;font-size:12px;font-style:italic;">"${ch.emotion}"</p>
      </div>
    `;
  }

  html += '</div>';
  return html;
}

/**
 * 获取章节回顾数据
 */
export function getChapterRecap(chapter) {
  return CHAPTER_RECAPS[chapter] || null;
}

export { CHAPTER_RECAPS };
