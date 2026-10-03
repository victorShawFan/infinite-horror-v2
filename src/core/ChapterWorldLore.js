// ═══════════════════════════════════════════════════════════════
// 章节世界观描述 — 丰富每个章节的叙事深度
// ═══════════════════════════════════════════════════════════════
//
// 每个章节都有：
// - 电影世界名称和描述
// - 核心威胁描述
// - 中洲队的目标
// - 关键角色/怪物介绍
// - 章节特殊机制说明
// - 情感基调和氛围词

export const CHAPTER_LORE = {
  1: {
    title: '第一章',
    world: '生化危机',
    subtitle: '恐怖的序幕',
    setting: '浣熊市的废墟中，T病毒已经将整座城市变成了活死人的炼狱。',
    threat: '僵尸成群结队在街头游荡，暴君T-002在暗处徘徊。',
    objective: '活过72小时，找到主神空间的出口。这是你作为轮回者的第一次试炼。',
    atmosphere: '压抑、紧张、黑暗',
    bgColor: '#1a0a0a',
    accentColor: '#ff4444',
    quote: '"当你凝视深渊的时候，深渊也在凝视着你。"',
    tips: ['注意保存体力，不要和每个敌人硬碰硬', '搜索房间可能找到钥匙和补给'],
  },
  2: {
    title: '第二章',
    world: '异形',
    subtitle: '太空中无人能听到你的尖叫',
    setting: 'LV-426星球的异形巢穴。酸性血液的蒸汽在金属走廊中弥漫。',
    threat: '异形战士从通风管道中涌出，而皇后正在巢穴深处等待。',
    objective: '穿越异形巢穴，击败异形皇后，保护同伴存活。',
    atmosphere: '幽闭、恐惧、黑暗中的未知',
    bgColor: '#0a0a15',
    accentColor: '#44ff88',
    quote: '"在太空中，没有人能听到你的尖叫。"',
    tips: ['异形弱火属性', '通风管道中可能有伏击'],
  },
  3: {
    title: '第三章',
    world: '咒怨',
    subtitle: '诅咒不会因为不信而消失',
    setting: '东京的一栋普通公寓楼，但每一层都弥漫着不详的气息。伽椰子的怨念已经渗透了整栋建筑。',
    threat: '伽椰子可以从任何阴暗的角落出现，俊雄在天花板上爬行。',
    objective: '找到解除诅咒的方法，在咒怨吞噬你之前逃出去。',
    atmosphere: '阴森、压迫、日式恐怖',
    bgColor: '#0a0a0a',
    accentColor: '#888888',
    quote: '"有些地方……不该有人去。"',
    tips: ['精神类攻击很强，注意防御', '不要在黑暗中停留太久'],
  },
  4: {
    title: '第四章',
    world: '木乃伊',
    subtitle: '古老的诅咒从未消散',
    setting: '埃及的古墓深处，法老的诅咒依然笼罩着这片沙漠。伊莫顿从棺椁中苏醒。',
    threat: '伊莫顿拥有再生能力和强大的魔法。沙尘暴随时可能吞噬一切。',
    objective: '深入古墓，找到太阳金经，封印伊莫顿。',
    atmosphere: '神秘、宏大、古老',
    bgColor: '#1a1508',
    accentColor: '#ffcc44',
    quote: '"死亡只是另一段旅程的开始。"',
    tips: ['伊莫顿有护盾和再生能力，需要持续输出', '古墓中有隐藏宝藏'],
  },
  5: {
    title: '第五章',
    world: '死神来了',
    subtitle: '命运无法逃避',
    setting: '看似平凡的现代城市，但死神的设计已经开始运转。每一个角落都隐藏着致命的连锁反应。',
    threat: '不是怪物，而是命运本身。死神通过一系列巧合的意外来收割灵魂。',
    objective: '打破死神的设计链，保护中洲队的每一个成员活到最后。',
    atmosphere: '日常恐怖、草木皆兵',
    bgColor: '#0a0a12',
    accentColor: '#4488ff',
    quote: '"张杰用最后的力气推开了郑吒——队长的责任，到最后一刻。"',
    tips: ['张杰将在本章牺牲，这是剧情必然', '注意陷阱！这个世界到处都是连锁陷阱'],
  },
  6: {
    title: '第六章',
    world: '异形II',
    subtitle: '这一次，是战争',
    setting: '回到异形的世界。这次不再是逃跑，而是正面迎战。新生异形比上次更加强大。',
    threat: '进化后的异形拥有更高的智慧和酸血攻击。新生异形是人类与异形的混合体。',
    objective: '彻底清除异形威胁，击败进化体。',
    atmosphere: '战争、对抗、硬核',
    bgColor: '#0a0f0a',
    accentColor: '#ff8844',
    quote: '"这一次，我们不再逃跑。"',
    tips: ['火属性依然克制异形', '传送阵会在本章出现'],
  },
  7: {
    title: '第七章',
    world: '恶魔初临',
    subtitle: '镜中的敌人',
    setting: '恶魔队首次现身。你的复制体——另一个郑吒，站在你的面前。',
    threat: '复制体拥有和你相同的能力，但更加冷酷。恶魔队的先锋比你想象的更强。',
    objective: '面对自己的影子，击败复制体郑吒。',
    atmosphere: '对峙、镜像、身份认同',
    bgColor: '#120a0a',
    accentColor: '#cc2222',
    quote: '"当你面对另一个自己的时候，你才真正知道自己是谁。"',
    tips: ['复制体了解你的战斗方式，需要改变战术', '关系好的同伴会在关键时刻帮助你'],
  },
  8: {
    title: '第八章',
    world: '侏罗纪公园',
    subtitle: '生命会找到出路',
    setting: '恐龙重新统治的岛屿。中洲队必须在巨型捕食者的领地中求生。',
    threat: '远古巨龙是这个世界最强大的存在。暴龙和迅猛龙成群出没。',
    objective: '穿越恐龙岛，击败远古巨龙，获得龙族细胞。',
    atmosphere: '原始、狂野、壮阔',
    bgColor: '#0a120a',
    accentColor: '#44cc44',
    quote: '"生命会找到出路……但有时候，出路就是战斗。"',
    tips: ['巨龙弱冰属性', '楚轩将在本章回归'],
  },
  9: {
    title: '第九章',
    world: '星河战队',
    subtitle: '星际远征',
    setting: '外太空的虫族星球。无数的虫族战士从地下涌出，脑虫在深处指挥着一切。',
    threat: '虫族以数量取胜，而脑虫的精神攻击可以直接摧毁意志。',
    objective: '深入虫巢，消灭脑虫指挥中枢。',
    atmosphere: '太空歌剧、虫群恐惧',
    bgColor: '#08080f',
    accentColor: '#886644',
    quote: '"我们为了全人类的未来而战。"',
    tips: ['脑虫弱物理和火属性', '精神防御很重要'],
  },
  10: {
    title: '第十章',
    world: '五队大战',
    subtitle: '最强的敌人是人类自己',
    setting: '魔戒世界。但真正的威胁不是索伦，而是天神队——最强的轮回者队伍。',
    threat: '天神队先锋拥有超越想象的基因锁力量。这是轮回者之间的终极对决。',
    objective: '在五队混战中存活，击败天神队先锋。',
    atmosphere: '史诗对决、最强碰撞',
    bgColor: '#0f0a05',
    accentColor: '#ffaa22',
    quote: '"弱者没有活下去的权利——这是天神队的铁律。"',
    tips: ['天神队先锋有基因锁三阶', '同伴羁绊技能在本章很关键'],
  },
  11: {
    title: '第十一章',
    world: '心魔终破',
    subtitle: '在梦境中击败恐惧',
    setting: '弗莱迪的噩梦世界与变形金刚的战场交织。心灵的恐惧比任何敌人都更致命。',
    threat: '弗莱迪在梦境中近乎全能。只有克服内心的恐惧才能伤害他。',
    objective: '进入噩梦深处，直面内心的恐惧，击败弗莱迪。',
    atmosphere: '超现实、心理恐怖、梦境',
    bgColor: '#0a0510',
    accentColor: '#ff2222',
    quote: '"一、二，弗莱迪来找你……"',
    tips: ['精神属性在本章极其重要', '不要恐惧，恐惧是弗莱迪的力量来源'],
  },
  12: {
    title: '第十二章',
    world: '最终一战',
    subtitle: '轮回的终点',
    setting: '所有的轮回在此刻汇聚。恶魔队与中洲队的最终决战。主神的真相即将揭开。',
    threat: '复制体楚轩、终极复制体郑吒、主神碎片——三层Boss依次出现。',
    objective: '击败恶魔队，粉碎主神碎片，打开通往现实世界的大门。',
    atmosphere: '终章、史诗、壮烈',
    bgColor: '#100505',
    accentColor: '#ff4444',
    quote: '"十二个世界。无数次生死。这一次，我们回家。"',
    tips: ['准备好最强装备和最高属性', '业力值将决定你的最终结局'],
  },
};

/**
 * 获取章节世界观信息
 */
export function getChapterLore(chapter) {
  return CHAPTER_LORE[chapter] || CHAPTER_LORE[1];
}

/**
 * 渲染章节介绍卡片HTML
 */
export function renderChapterIntroCard(chapter) {
  const lore = getChapterLore(chapter);
  return `<div style="
    max-width: 500px; text-align: center; padding: 30px;
    background: linear-gradient(180deg, ${lore.bgColor}ee 0%, ${lore.bgColor}cc 100%);
    border: 1px solid ${lore.accentColor}40;
    border-radius: 16px;
    box-shadow: 0 0 60px ${lore.accentColor}20;
  ">
    <p style="color: ${lore.accentColor}; font-size: 12px; letter-spacing: 6px; margin-bottom: 8px;">${lore.title}</p>
    <h1 style="
      color: #eee; font-size: 32px; letter-spacing: 4px;
      text-shadow: 0 0 20px ${lore.accentColor}40;
      margin-bottom: 4px;
    ">${lore.world}</h1>
    <p style="color: ${lore.accentColor}; font-size: 14px; letter-spacing: 2px; margin-bottom: 20px;">${lore.subtitle}</p>
    
    <div style="width: 60%; height: 1px; background: linear-gradient(90deg, transparent, ${lore.accentColor}60, transparent); margin: 0 auto 20px;"></div>
    
    <p style="color: #999; font-size: 13px; line-height: 1.8; margin-bottom: 16px;">${lore.setting}</p>
    <p style="color: #777; font-size: 12px; line-height: 1.6; margin-bottom: 20px;"><span style="color:${lore.accentColor};">⚠ 威胁：</span>${lore.threat}</p>
    <p style="color: #888; font-size: 12px; line-height: 1.6; margin-bottom: 20px;"><span style="color:#44aaff;">✦ 目标：</span>${lore.objective}</p>
    
    <div style="width: 40%; height: 1px; background: linear-gradient(90deg, transparent, #333, transparent); margin: 0 auto 16px;"></div>
    
    <p style="color: #555; font-size: 11px; font-style: italic; margin-bottom: 12px;">${lore.quote}</p>
    
    ${lore.tips.length > 0 ? `<div style="background: rgba(255,255,255,0.03); border-radius: 8px; padding: 8px; margin-top: 12px;">
      <p style="color: #666; font-size: 10px; margin-bottom: 4px;">💡 提示</p>
      ${lore.tips.map(t => `<p style="color:#555;font-size:10px;">· ${t}</p>`).join('')}
    </div>` : ''}
  </div>`;
}

/**
 * 获取章节氛围色（用于Renderer调色）
 */
export function getChapterAtmosphereColors(chapter) {
  const lore = getChapterLore(chapter);
  return {
    bg: lore.bgColor,
    accent: lore.accentColor,
    atmosphere: lore.atmosphere,
  };
}
