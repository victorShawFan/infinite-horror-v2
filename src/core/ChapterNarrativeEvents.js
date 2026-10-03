// ═══════════════════════════════════════════════════════════════
// 章节叙事事件 — 每章独特的故事性遭遇
// ═══════════════════════════════════════════════════════════════
//
// 每个章节有3-5个独特的叙事事件
// 这些事件在特定楼层或条件下触发
// 包含选择、对话、后果，增加世界观深度

import { eventBus } from './EventBus.js';
import { gameState } from './GameState.js';

export const CHAPTER_NARRATIVES = {
  1: [
    {
      id: 'ch1_survivor', floor: 2, once: true,
      title: '幸存者',
      text: '你在走廊拐角发现了一个瑟瑟发抖的保护伞员工。他的制服上满是血迹，眼神中充满恐惧。\n\n"求……求你带我走……我知道安全出口在哪……"',
      choices: [
        { text: '带上他', result: { text: '"谢谢你！安全出口在B3层……记住，别走红色走廊。"\n\n（获得地图提示：第3层某些区域有隐藏通道）', gold: 30, hint: true } },
        { text: '太危险了，你自己走', result: { text: '他露出绝望的表情，默默转身走进了黑暗中。\n\n你隐约听到身后传来一声惨叫……', karma: -1 } },
        { text: '搜查他身上的物资', result: { text: '你从他身上找到了一张门卡和少量补给。他没有反抗，只是用空洞的眼神看着你。', gold: 50, hp: 15, karma: -2 } },
      ],
    },
    {
      id: 'ch1_terminal', floor: 4, once: true,
      title: '监控终端',
      text: '一台还在运作的监控终端显示着蜂巢各层的画面。你可以花时间查看……',
      choices: [
        { text: '查看全部楼层', result: { text: '你仔细查看了每一层的画面。B6层……那里有一个巨大的身影在移动。\n\n（获知Boss位置和部分敌人分布）', revealMap: true, stamina: -5 } },
        { text: '只看出口路线', result: { text: '你快速确认了出口方向。时间不多了。', hint: true } },
        { text: '破坏终端', result: { text: '你砸碎了屏幕。至少僵尸们不会通过监控找到你了。\n\n……等等，僵尸又不会看监控。', } },
      ],
    },
    {
      id: 'ch1_diary', floor: 3, once: true,
      title: '研究员日记',
      text: '一本染血的日记本。最后一页的字迹颤抖而潦草：\n\n"T病毒不是意外泄露的。威斯克……他知道会发生什么。他需要实验数据。我们所有人……都只是他的实验材料。"\n\n"如果有人看到这段话，请记住：B6层的暴君……它怕火。"',
      choices: [
        { text: '记住这个信息', result: { text: '（获得战术提示：暴君T-002弱火属性）\n\n你小心翼翼地合上日记本。这些人的牺牲……不能白费。', lore: true } },
      ],
    },
  ],
  2: [
    {
      id: 'ch2_facehugger', floor: 2, once: true,
      title: '孵化室',
      text: '你误入了异形的孵化室。数十个卵在微微搏动，最近的一个已经开始裂开……\n\n抱脸虫正在破壳而出。',
      choices: [
        { text: '趁它还没出来，烧掉卵', result: { text: '你用身上的燃料引燃了最近的几个卵。异形卵在火焰中发出刺耳的尖叫。\n\n这下安全了……至少这个房间。', exp: 30, karma: 1 } },
        { text: '悄悄绕过去', result: { text: '你屏住呼吸，贴着墙壁小心翼翼地绕过孵化室。\n\n身后传来卵壳破裂的声音……还好它没注意到你。', } },
        { text: '抓一只活体研究', result: { text: '你试图捕获一只抱脸虫……它的速度远超预期！\n\n你勉强躲开了它的扑击，但手臂被酸液溅到了。', hp: -15, exp: 50 } },
      ],
    },
    {
      id: 'ch2_android', floor: 4, once: true,
      title: '仿生人',
      text: '一个仿生人坐在走廊尽头。他的身体已经被酸液腐蚀了一半，但仍在微笑。\n\n"我是Bishop型号。我的首要指令是……保护人类。即使……即使我已经无法移动了。"\n\n"前方有一只成年异形巡逻。它的行动路线是固定的。如果你等它经过……大约30秒的窗口。"',
      choices: [
        { text: '谢谢你，Bishop', result: { text: '"不用谢。这是……我存在的意义。"\n\nBishop的眼中的光芒渐渐暗淡下去。\n\n（获得战术提示：下一层有安全通过路线）', hint: true, karma: 1 } },
        { text: '有什么有用的东西吗', result: { text: 'Bishop递给你一个小型设备。"这是运动追踪器。它能探测到异形的位置。"\n\n（获得装备加成：SPD+2 持续本章）', spd: 2 } },
      ],
    },
  ],
  3: [
    {
      id: 'ch3_mirror', floor: 2, once: true,
      title: '走廊尽头的镜子',
      text: '一面落地镜立在走廊尽头。镜中的你……似乎在做着不同的动作。\n\n当你仔细看时，镜中的你突然露出了诡异的微笑。',
      choices: [
        { text: '打碎镜子', result: { text: '碎片散落一地。每一块碎片中都映着不同的你——有的在哭，有的在笑，有的……已经死了。\n\n一阵寒意从脚底升起。', def: 2, karma: 0 } },
        { text: '转身离开', result: { text: '你转身离开。身后传来轻轻的敲击声——像是有人在敲镜子的内侧。\n\n你没有回头。', } },
        { text: '对着镜子说话', result: { text: '"你是谁？"\n\n镜中的你缓缓张开嘴：\n\n"我是你最害怕变成的样子。"\n\n（精神力提升：CRT+3%）', crt: 3 } },
      ],
    },
    {
      id: 'ch3_child', floor: 3, once: true,
      title: '空房间里的孩子',
      text: '一个小男孩坐在空荡荡的房间中央，抱着一只破旧的布偶。\n\n"哥哥……你能看到我吗？"\n\n他的身体是半透明的。',
      choices: [
        { text: '"我能看到你。你叫什么名字？"', result: { text: '"我叫俊雄……妈妈说我不能离开这里。"\n\n"但是……如果你够强的话……也许你能让妈妈不再生气了。"\n\n（获得关于伽椰子的线索）', lore: true, karma: 1 } },
        { text: '保持警惕，这可能是陷阱', result: { text: '你退后一步。男孩歪着头看着你，然后——消失了。\n\n在他坐过的地方，留下了一个小小的护符。\n\n（获得饰品：怨念护符 DEF+3）', def: 3 } },
      ],
    },
  ],
  4: [
    {
      id: 'ch4_hieroglyph', floor: 2, once: true,
      title: '古老的壁画',
      text: '墙壁上刻满了古埃及象形文字和壁画。其中一幅描绘了一位祭司被活埋的场景……\n\n你突然意识到，那就是伊莫顿的故事。',
      choices: [
        { text: '仔细研读壁画', result: { text: '壁画记载了伊莫顿的弱点：他的力量来自月光。在地下深处，他的力量会减弱。\n\n（获得Boss战术提示）', lore: true, exp: 20 } },
        { text: '寻找隐藏机关', result: { text: '你按下了壁画中一个突出的浮雕。墙壁缓缓移开，露出了一个隐藏的宝箱！', gold: 80, hp: 20 } },
      ],
    },
  ],
  5: [
    {
      id: 'ch5_notebook', floor: 2, once: true,
      title: '死亡笔记',
      text: '你在地上发现了一本黑色笔记本。封面上写着"Death Note"。\n\n你知道这意味着什么。如果写上名字……',
      choices: [
        { text: '销毁笔记本', result: { text: '你毫不犹豫地把笔记本撕碎。这种东西太危险了，即使在轮回世界也不能留。\n\n张杰远处微微点头。', karma: 2, exp: 40 } },
        { text: '保管但不使用', result: { text: '你把笔记本收了起来。也许以后会有用……\n\n但你内心隐隐感到不安。', atk: 3, karma: -1 } },
        { text: '写下一个名字', result: { text: '你的手在颤抖。这种力量……太诱人了。\n\n但你最终放下了笔。不，这不是你应该走的路。\n\n（意志坚定：DEF+5）', def: 5 } },
      ],
    },
  ],
  6: [
    {
      id: 'ch6_lab', floor: 3, once: true,
      title: '进化实验室',
      text: '这里是深海设施的核心实验室。培养液中漂浮着各种异形与人类的混合体……\n\n大部分都已经死了。但有一个——它的手指在微微颤动。',
      choices: [
        { text: '释放它', result: { text: '你打碎了培养容器。那个生物睁开了眼睛——人类的眼睛。\n\n"谢谢你……"它用沙哑的声音说，然后安静地闭上了眼。\n\n你感到内心某个地方被触动了。', karma: 2, maxHp: 15 } },
        { text: '检查实验数据', result: { text: '数据表明这些实验是为了创造"完美生命体"。实验代号：Prometheus。\n\n（获得知识：第6章BOSS弱点）', lore: true, exp: 30 } },
      ],
    },
  ],
  7: [
    {
      id: 'ch7_demon_note', floor: 2, once: true,
      title: '恶魔队留言',
      text: '墙上用血写着一行字：\n\n"中洲队——你们还不够格。想知道真正的强者是什么样吗？来找我们。"\n\n——恶魔队',
      choices: [
        { text: '用你的武器在旁边刻下回应', result: { text: '你在血字旁边刻下：\n\n"我们来了。"\n\n（士气提升：ATK+2 本章有效）', atk: 2 } },
        { text: '分析笔迹获取信息', result: { text: '楚轩走过来看了一眼："这是恶魔队副队长的笔迹。他们在试图激怒我们。"\n\n"但从字迹来看……他们也在焦虑。"', lore: true } },
      ],
    },
  ],
  8: [
    {
      id: 'ch8_elf_spring', floor: 3, once: true,
      title: '精灵泉',
      text: '森林深处有一泓发着银光的泉水。精灵族的古老传说中，饮用此泉可以看到真实的自己。',
      choices: [
        { text: '饮用泉水', result: { text: '泉水入口清冽。你闭上眼睛——看到了无数个轮回中的自己。\n\n每一个你都在战斗。每一个你都在坚持。\n\n你感到前所未有的平静和力量。', maxHp: 25, atk: 2, def: 2 } },
        { text: '用泉水清洗伤口', result: { text: '伤口以肉眼可见的速度愈合。精灵泉的治愈力确实名不虚传。', hp: 999 } },
        { text: '装一瓶带走', result: { text: '你小心翼翼地装了一瓶泉水。也许在最危急的时刻会用得上。', consumable: true } },
      ],
    },
  ],
  9: [
    {
      id: 'ch9_captured', floor: 2, once: true,
      title: '被俘的战友',
      text: '虫族监牢中关着一个人类士兵。他已经精疲力竭，但看到你时眼中燃起了希望。\n\n"轮回者……？求你……帮帮我……虫族要用我做实验……"',
      choices: [
        { text: '破坏监牢救他', result: { text: '"谢谢你！"\n他从怀中掏出一块闪光的碎片。\n"这是我在虫巢中心捡到的。也许对你有用。"\n\n（获得灵魂碎片×15）', shards: 15, karma: 2 } },
        { text: '先问清情报再决定', result: { text: '"虫巢中心有一只巨大的脑虫……它能控制所有虫族。如果杀了它……"\n\n（获得Boss位置和弱点提示）', lore: true } },
      ],
    },
  ],
  10: [
    {
      id: 'ch10_chuxuan_real', floor: 4, once: true,
      title: '楚轩的真实想法',
      text: '楚轩独自站在悬崖边，看着远方。\n\n"郑吒，你来了。"\n\n他转过身，罕见地露出了一丝脆弱的表情。\n\n"如果我告诉你……我也会害怕。你会怎么想？"',
      choices: [
        { text: '"害怕是人之常情"', result: { text: '楚轩沉默了很久。\n\n"……谢谢。这是我这几个轮回听到的最有用的话。"\n\n他推了推眼镜，恢复了平时的表情。但你知道——你们之间多了一些什么。\n\n（楚轩好感度大幅提升）', relationship: { chuxuan: 20 }, karma: 2 } },
        { text: '"楚轩，你不是一个人"', result: { text: '楚轩微微愣住。然后轻轻笑了。\n\n"你知道吗，你是第一个对我说这句话的人。"\n\n（楚轩好感度大幅提升）', relationship: { chuxuan: 25 } } },
      ],
    },
  ],
  11: [
    {
      id: 'ch11_final_camp', floor: 1, once: true,
      title: '最后的营地',
      text: '恶魔队的前哨已经被清理。你们在此处建立了最后的据点。\n\n每个同伴都在做着战前的准备。这可能是最后一次安宁的时刻了。',
      choices: [
        { text: '和每个人聊聊', result: { text: '你和每个同伴都说了几句话。\n\n张杰："保重。"\n瞻兰："我的子弹……够用。"\n楚轩推了推眼镜，没说话，但微微点了点头。\n\n这就够了。', karma: 3, allRelationship: 5 } },
        { text: '独自准备', result: { text: '你检查了所有装备，活动了一下身体。\n\n最后看了一眼星空。不管结果如何——你不后悔走到这里。', atk: 3, def: 3 } },
      ],
    },
  ],
  12: [
    {
      id: 'ch12_final_choice', floor: 3, once: true,
      title: '最终选择',
      text: '主神空间的核心前，你停下了脚步。\n\n一个声音在你脑海中回响：\n\n"你可以选择留在轮回中。无尽的战斗，无尽的成长，无尽的可能性。或者——摧毁我，回到那个普通的世界。"\n\n"你选择哪个？"',
      choices: [
        { text: '"我选择自由"', result: { text: '"有趣。你知道吗？每一百个轮回者中，只有三个人会做出和你一样的选择。"\n\n"那些选择留下的人……最终都变成了我的一部分。"\n\n"而你……你值得拥有真正的结局。"\n\n（获得最终增益：全属性+5）', atk: 5, def: 5, maxHp: 50, spd: 3, crt: 5 } },
        { text: '"我选择战斗到底"', result: { text: '"又一个选择战斗的人。"\n\n"但你和其他人不同。你的眼中……没有贪婪。只有坚定。"\n\n"好吧。让我看看你的坚定……值多少斤。"\n\n（获得终极姿态：ATK+10 DEF+10）', atk: 10, def: 10 } },
      ],
    },
  ],
};

/**
 * 获取当前章节和楼层的叙事事件
 */
export function getChapterNarrative(chapter, floor) {
  const events = CHAPTER_NARRATIVES[chapter];
  if (!events) return null;
  
  // 找到匹配楼层的未触发事件
  const triggered = gameState._triggeredNarratives || new Set();
  for (const evt of events) {
    if (evt.floor === floor && !triggered.has(evt.id)) {
      return evt;
    }
  }
  return null;
}

/**
 * 标记叙事事件为已触发
 */
export function markNarrativeTriggered(eventId) {
  if (!gameState._triggeredNarratives) gameState._triggeredNarratives = new Set();
  gameState._triggeredNarratives.add(eventId);
}

/**
 * 应用叙事选择的效果
 */
export function applyNarrativeResult(result) {
  const p = gameState.player;
  const effects = [];
  
  if (result.gold) { p.gold = (p.gold || 0) + result.gold; effects.push(`+${result.gold}G`); }
  if (result.exp) { p.exp += result.exp; effects.push(`+${result.exp} EXP`); }
  if (result.hp) { 
    if (result.hp > 0) p.hp = Math.min(p.maxHp, p.hp + result.hp);
    else p.hp = Math.max(1, p.hp + result.hp);
    effects.push(`HP ${result.hp > 0 ? '+' : ''}${result.hp}`); 
  }
  if (result.maxHp) { p.maxHp += result.maxHp; p.hp = Math.min(p.maxHp, p.hp + result.maxHp); effects.push(`MaxHP +${result.maxHp}`); }
  if (result.atk) { p.atk += result.atk; effects.push(`ATK +${result.atk}`); }
  if (result.def) { p.def += result.def; effects.push(`DEF +${result.def}`); }
  if (result.spd) { p.spd += result.spd; effects.push(`SPD +${result.spd}`); }
  if (result.crt) { p.crt = (p.crt || 0) + result.crt; effects.push(`CRT +${result.crt}%`); }
  if (result.shards) { gameState.soulShards = (gameState.soulShards || 0) + result.shards; effects.push(`灵魂碎片 +${result.shards}`); }
  if (result.karma) { gameState.karma = (gameState.karma || 0) + result.karma; }
  if (result.relationship) {
    for (const [id, val] of Object.entries(result.relationship)) {
      const comp = (gameState.companions || []).find(c => c.id === id);
      if (comp) { comp.relationship = (comp.relationship || 0) + val; }
    }
  }
  if (result.allRelationship) {
    for (const comp of (gameState.companions || [])) {
      comp.relationship = (comp.relationship || 0) + result.allRelationship;
    }
  }
  
  return effects;
}

/**
 * 序列化已触发事件
 */
export function serializeNarratives() {
  return Array.from(gameState._triggeredNarratives || []);
}

export function deserializeNarratives(data) {
  gameState._triggeredNarratives = new Set(data || []);
}
