const GHOST = '/assets/enemies/ghost_wraith.svg';
const KAYAKO = '/assets/enemies/kayako.svg';

const spirit = data => ({
  mp: 0, maxMp: 0, crit: 5, skills: [], portrait: GHOST,
  attackRange: 'ranged', damageType: 'spirit', physicalResist: 0.55,
  ...data,
});

const curseRule = (maxLevel, interval = 2, atkBonus = 1) => ({
  curseWave: { interval, maxLevel, targetSide: 'enemy', atkBonus },
});

export const CHAPTER_THREE_ENCOUNTERS = Object.freeze([
  {
    id: 'curse-house', order: 13, chapterOrder: 1, chapterNumber: 3, chapter: '第三章 · 咒怨阴影',
    title: '宅邸触咒 · 不要播放那盘录像', threat: '高危',
    subtitle: '潮湿的榻榻米下传来指甲刮擦声，手腕上的黑纹正在缓慢蔓延。',
    briefing: '物理攻击只能造成部分伤害。优先使用精神、灵类技能终结怨灵。',
    background: '/assets/scenes/3-1_宅邸触咒.svg', rules: curseRule(3, 2, 1),
    intro: [
      { speaker: '主神', text: '任务目标：在诅咒中生存七日，找到佛经，并封印伽椰子的怨念。' },
      { speaker: '赵樱空', text: '这栋房子没有活人的气息。但每一面墙后，都有东西在看着我们。' },
      { speaker: '楚轩', text: '敌人是灵体，常规武器效果有限。精神力与灵类弹药才是主要手段。' },
      { speaker: '旁白', text: '录像机自行亮起。画面里，一个白衣女人从楼梯尽头缓慢爬下。' },
    ],
    victory: { title: '诅咒已经记住你', text: '怨灵消散后，所有人的手腕都浮现出同样的黑纹。胜利没有解除诅咒，只让它靠得更近。' },
    rewards: { exp: 1080, points: 1050 }, repeatRewards: { exp: 270, points: 265 },
    enemies: [
      spirit({ id: 'child-grudge', name: '怨念童灵', role: '哭声诱导', hp: 96, maxHp: 96, atk: 28, def: 6, spd: 17 }),
      spirit({ id: 'wandering-shade', name: '游荡幽影', role: '穿墙袭击', hp: 118, maxHp: 118, atk: 30, def: 8, spd: 14 }),
    ],
  },
  {
    id: 'night-scatter', order: 14, chapterOrder: 2, chapterNumber: 3, chapter: '第三章 · 咒怨阴影',
    title: '第一夜分散 · 灯灭之后', threat: '高危',
    subtitle: '灯光熄灭的一瞬间，新人们冲向不同房间；黑暗比任何命令都更快。',
    briefing: '在诅咒强化前压低敌方数量，保护被集中攻击的队员。',
    background: '/assets/scenes/3-2_第一夜分散.svg', rules: curseRule(4, 2, 1),
    intro: [
      { speaker: '郑吒', text: '不要分散！背靠背，所有人报出自己的位置！' },
      { speaker: '铭烟薇', text: '郑吒……我听见柜子里有人叫我的名字。' },
      { speaker: '赵樱空', text: '不要回应。那不是人，它在利用记忆确定我们的位置。' },
      { speaker: '主神', text: '第一夜开始。诅咒将随战斗轮次持续增强。' },
    ],
    victory: { title: '恐惧让队伍出现裂缝', text: '失散的人被逐一找到，铭烟薇却始终不敢松开郑吒的衣角。那一夜，没有人真正睡着。' },
    rewards: { exp: 1180, points: 1120 }, repeatRewards: { exp: 295, points: 280 },
    enemies: [
      spirit({ id: 'curse-shadow-a', name: '诅咒阴影α', role: '黑暗侵蚀', hp: 116, maxHp: 116, atk: 31, def: 8, spd: 16 }),
      spirit({ id: 'hair-wraith', name: '长发怨灵', role: '束缚追猎', hp: 144, maxHp: 144, atk: 34, def: 10, spd: 15, physicalResist: 0.62 }),
      spirit({ id: 'curse-shadow-b', name: '诅咒阴影β', role: '黑暗侵蚀', hp: 116, maxHp: 116, atk: 31, def: 8, spd: 15 }),
    ],
  },
  {
    id: 'sutra-clue', order: 15, chapterOrder: 3, chapterNumber: 3, chapter: '第三章 · 咒怨阴影',
    title: '佛经线索 · 七波之后', threat: '极危',
    subtitle: '地下佛堂的经卷记录着上一批遇难者留下的唯一答案。',
    briefing: '守住祭坛，撑过递增诅咒，并保护楚轩完成佛经解析。',
    background: '/assets/scenes/3-3_佛经线索.svg', rules: curseRule(4, 2, 2),
    intro: [
      { speaker: '佛经笔记', text: '伽椰子的怨念共有七波。第七波之后，真身将短暂显现。' },
      { speaker: '楚轩', text: '也就是说，此前的攻击没有意义。我们必须把资源保留到唯一的窗口。' },
      { speaker: '詹岚', text: '这里写着精神力可以暂时压制她。我能帮赵樱空稳定结界。' },
      { speaker: '郑吒', text: '那就守住这里。无论外面出现什么，都不能让它们碰到佛经。' },
    ],
    victory: { title: '经卷写下唯一的窗口', text: '最后一页佛经被翻译完成：第七波，真身，封印解除。楚轩把这三个词刻进每个人的记忆。' },
    rewards: { exp: 1300, points: 1250 }, repeatRewards: { exp: 325, points: 315 },
    enemies: [
      spirit({ id: 'bound-ghost', name: '地缚灵', role: '祭坛封锁', hp: 168, maxHp: 168, atk: 34, def: 12, spd: 12, physicalResist: 0.62 }),
      spirit({ id: 'dark-domain', name: '暗域怨灵', role: '精神蚕食', hp: 182, maxHp: 182, atk: 36, def: 13, spd: 13, physicalResist: 0.65 }),
    ],
  },
  {
    id: 'fear-conflict', order: 16, chapterOrder: 4, chapterNumber: 3, chapter: '第三章 · 咒怨阴影',
    title: '新人冲突 · 来不及的求救', threat: '极危',
    subtitle: '真正推向铭烟薇的不是怨灵，而是被恐惧击穿的人心。',
    briefing: '抵御复仇怨灵，在更高诅咒等级下维持队伍阵线。',
    background: '/assets/scenes/3-4_新人冲突.svg', rules: curseRule(5, 2, 2),
    intro: [
      { speaker: '铭烟薇', text: '我没有碰那扇门……真的不是我，为什么你们都不相信？' },
      { speaker: '新人', text: '就是她把诅咒引过来的！把她赶出去，我们才能活！' },
      { speaker: '旁白', text: '混乱中有人猛地推了一把。铭烟薇跌入门后的黑暗，再没有回来。' },
      { speaker: '郑吒', text: '记住她的名字。我们不是因为鬼而失败，是因为先把同伴当成了代价。' },
    ],
    victory: { title: '有些死亡来自活人', text: '复仇怨灵消散，铭烟薇的位置却永远空了下来。郑吒第一次明白，队长要对每一次放弃负责。' },
    rewards: { exp: 1420, points: 1380 }, repeatRewards: { exp: 355, points: 345 },
    enemies: [
      spirit({ id: 'vengeful-a', name: '复仇怨灵α', role: '仇恨投射', hp: 178, maxHp: 178, atk: 37, def: 13, spd: 15, physicalResist: 0.65 }),
      spirit({ id: 'grudge-echo', name: '怨恨残像', role: '恐惧复制', hp: 158, maxHp: 158, atk: 38, def: 11, spd: 17, physicalResist: 0.6 }),
      spirit({ id: 'vengeful-b', name: '复仇怨灵β', role: '仇恨投射', hp: 178, maxHp: 178, atk: 37, def: 13, spd: 14, physicalResist: 0.65 }),
    ],
  },
  {
    id: 'chuxuan-tape', order: 17, chapterOrder: 5, chapterNumber: 3, chapter: '第三章 · 咒怨阴影',
    title: '楚轩录像 · 最优解的代价', threat: '极危',
    subtitle: '录像里的楚轩已经知道自己不会回去，语气却仍像在说明一道公式。',
    briefing: '在楚轩完成最终情报传递前击退阁楼恶灵。',
    background: '/assets/scenes/3-5_楚轩录像.svg', rules: curseRule(6, 2, 2),
    intro: [
      { speaker: '楚轩（录像）', text: '第七波后，郑吒的精神力负责压制，零点的灵类弹药负责终结。' },
      { speaker: '楚轩（录像）', text: '至于我选择死亡的原因——这是提高中洲队长期存活率的最优解。' },
      { speaker: '郑吒', text: '人不是公式里的数字！你凭什么替我们决定谁该死？' },
      { speaker: '楚轩', text: '因为总要有人做决定。记住我说的话，不要浪费。' },
    ],
    victory: { title: '最优解也会让人痛苦', text: '黑潮吞没楚轩前，他仍没有回头。录像继续播放，像一个迟到了很久的道歉。' },
    rewards: { exp: 1560, points: 1550 }, repeatRewards: { exp: 390, points: 390 },
    enemies: [
      spirit({ id: 'attic-wraith-a', name: '阁楼恶灵α', role: '黑潮吞噬', hp: 214, maxHp: 214, atk: 40, def: 14, spd: 16, physicalResist: 0.68 }),
      spirit({ id: 'attic-wraith-b', name: '阁楼恶灵β', role: '记忆折磨', hp: 214, maxHp: 214, atk: 40, def: 14, spd: 15, physicalResist: 0.68 }),
    ],
  },
  {
    id: 'seven-curse-seal', order: 18, chapterOrder: 6, chapterNumber: 3, chapter: '第三章 · 咒怨阴影',
    title: '七波诅咒 · 伽椰子显形', threat: '首领', boss: true, postSacrifice: true,
    subtitle: '经卷燃烧，楚轩留下的倒计时开始运转：必须活过前六波，在第七波终结怨念。',
    briefing: '前六波保留资源并清理护卫；第七波显形后集中灵类技能攻击伽椰子。',
    background: '/assets/scenes/3-6_七波诅咒.svg',
    rules: {
      curseWave: { interval: 1, maxLevel: 7, targetSide: 'enemy', atkBonus: 1, bossId: 'kayako', revealAt: 7, sealedReduction: 0.88, defLoss: 12, afterPhysicalResist: 0.2 },
    },
    intro: [
      { speaker: '赵樱空', text: '我会维持结界，但每一波都会更强。第七波之后，我最多只能压住她十秒。' },
      { speaker: '零点', text: '十秒够了。只要她真的会显形。' },
      { speaker: '詹岚', text: '楚轩的录像没有说谎。佛经也指向同一个答案——相信他最后一次。' },
      { speaker: '郑吒', text: '不是相信他的计算，是相信所有活到这里的人。中洲队，一个都不能再少。' },
    ],
    victory: { title: '从今天起，不再抛弃同伴', text: '第七波诅咒碎裂，宅邸第一次迎来真正的寂静。郑吒带着楚轩和铭烟薇的名字回到主神空间。' },
    epilogue: {
      chapterLabel: 'CHAPTER THREE COMPLETE', title: '咒怨阴影', suffix: '完',
      quote: '“活下来不是最优解。一起活下来，才是。”',
      text: '楚轩用自己的生命留下唯一的窗口，铭烟薇用死亡让中洲队看清恐惧的代价。郑吒终于立下属于队长的原则：任何时候，都不先把同伴当成可以舍弃的数字。',
      stats: ['第三章任务 6 / 6', '七波诅咒已封印', '下一世界：神鬼传奇'],
    },
    rewards: { exp: 1880, points: 1900, sideStories: { C: 1 } }, repeatRewards: { exp: 470, points: 475 },
    enemies: [
      spirit({ id: 'curse-guard-a', name: '诅咒护卫α', role: '结界侵蚀', hp: 192, maxHp: 192, atk: 35, def: 13, spd: 17, physicalResist: 0.65 }),
      spirit({
        id: 'kayako', name: '伽椰子', role: '咒怨本体', portrait: KAYAKO, hp: 480, maxHp: 480, mp: 52, maxMp: 52, atk: 35, def: 18, spd: 13, crit: 8,
        skills: ['kayako_grasp', 'curse_howl'], boss: true, phase: 1, phaseThreshold: 0.42, phaseAtkBonus: 5, physicalResist: 0.72,
      }),
      spirit({ id: 'curse-guard-b', name: '诅咒护卫β', role: '结界侵蚀', hp: 192, maxHp: 192, atk: 35, def: 13, spd: 16, physicalResist: 0.65 }),
    ],
  },
]);
