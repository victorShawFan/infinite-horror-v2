// ═══════════════════════════════════════════════════════════════
// 环境叙事系统 — 散落的文字线索深化世界观
// ═══════════════════════════════════════════════════════════════
//
// 玩家在各楼层发现的文本线索：
// - 研究日志、求救信、队员笔记
// - 主神世界的规则碎片
// - 角色背景补全

import { eventBus } from './EventBus.js';

// ── 章节相关的环境文本 ──
export const LORE_ENTRIES = {
  // ── 第一章: 生化危机 ──
  'lore_1_research': {
    title: '实验日志 #0047',
    text: '威廉·博金博士的笔记："T病毒的变异速度超出了预期。地下设施已经完全失控。红后的隔离协议是我们最后的防线——但它不区分感染者和幸存者。"',
    chapter: 1,
    icon: '📋',
  },
  'lore_1_survivor': {
    title: '幸存者涂鸦',
    text: '墙上用鲜血写着几个字："不要相信红后。出口在——" 文字到这里就断了。旁边有指甲刮过的痕迹。',
    chapter: 1,
    icon: '🩸',
  },
  'lore_1_zhushen': {
    title: '主神碎片 #001',
    text: '"轮回任务是对灵魂的筛选。只有在死亡边缘依然选择战斗的人，才有资格进化。基因锁不是奖赏——它是进化的门槛。"',
    chapter: 1,
    icon: '✦',
  },

  // ── 第二章: 异形 ──
  'lore_2_weyland': {
    title: '韦兰集团内部备忘录',
    text: '"异形的酸血液是已知最具腐蚀性的有机物质。严禁在船舱内对异形活体进行解剖。任何违反此规定的人员将被即时终止合同。"——附注：合同终止通常意味着投入气闸。',
    chapter: 2,
    icon: '📋',
  },
  'lore_2_chuxuan_note': {
    title: '楚轩的分析笔记',
    text: '"异形的社会结构高度等级化。皇后是唯一的繁殖体，控制着整个蜂巢的情绪和行动。如果能定点清除皇后，蜂巢将陷入混乱——但接近皇后的难度是指数级的。"',
    chapter: 2,
    icon: '🔬',
  },

  // ── 第三章: 咒怨 ──
  'lore_3_curse': {
    title: '除灵师的日记',
    text: '"第七波诅咒是最可怕的。不是因为它最强——而是因为它会让你忘记自己在对抗什么。你会开始怀疑一切。怀疑你的队友。怀疑你自己。然后，当你不再反抗的那一刻，她就会出现在你身后。"',
    chapter: 3,
    icon: '📖',
  },

  // ── 第四章: 木乃伊 ──
  'lore_4_scripture': {
    title: '复活真经残页',
    text: '"死亡不是终点，但复活也不是免费的。每一次打开冥界之门，都需要等价的灵魂能量。主神提供的奖励点本质上就是——提纯后的灵魂碎片。"',
    chapter: 4,
    icon: '📜',
  },

  // ── 第五章: 死神来了 ──
  'lore_5_death': {
    title: '张杰的遗书',
    text: '"郑吒：如果你读到这封信，说明我已经不在了。不要为我难过。从你第一次拿起武器的那一刻，我就知道你会成为比我更好的队长。保护好每一个人。——张杰"',
    chapter: 5,
    icon: '✉',
  },

  // ── 第七章: 恶魔队 ──
  'lore_7_copy': {
    title: '复制体研究报告',
    text: '"复制体拥有原体的全部记忆和能力，但缺少一样东西——与同伴的羁绊。这就是为什么复制体郑吒永远无法真正超越原体。力量可以复制，但真正的力量——信任、牺牲、羁绊——是不可复制的。"',
    chapter: 7,
    icon: '🔬',
  },

  // ── 第十章: 五队大战 ──
  'lore_10_teams': {
    title: '轮回者观察报告',
    text: '"五支队伍的存在不是巧合。主神设计了一个完美的生存竞技场——只有最强的队伍才能最终活下来。但主神没有预料到的是……有些队伍会选择合作而非杀戮。这是bug，还是进化？"',
    chapter: 10,
    icon: '📋',
  },

  // ── 第十二章: 终章 ──
  'lore_12_truth': {
    title: '主神的真相',
    text: '"主神不是神。它是一个古老文明留下的进化加速器。它的目的不是折磨人类——而是在无尽的轮回中，筛选出能够超越物种极限的个体。基因锁的第四阶只是开始。真正的终点……是成为新的主神。"',
    chapter: 12,
    icon: '✦',
  },

  // ── 第二章补充: 异形 ──
  'lore_2_facehugger': {
    title: '寄生体观察笔记',
    text: '"面抱虫的寄生过程极其精密——它会在宿主体内植入一个完整的胚胎工厂。值得注意的是，异形的基因会与宿主基因融合。这意味着——如果宿主足够强大，诞生的异形也会获得宿主的能力。"',
    chapter: 2,
    icon: '🔬',
  },

  // ── 第三章补充: 咒怨 ──
  'lore_3_zhengzha': {
    title: '郑吒的心理评估',
    text: '"进入恐怖片世界后，郑吒的肾上腺素水平异常稳定。普通人在面对超自然恐惧时会崩溃，但他的大脑似乎天生具备压制恐惧的机制。基因锁的初步觉醒——从接纳恐惧开始。"',
    chapter: 3,
    icon: '🧠',
  },

  // ── 第四章补充: 木乃伊 ──
  'lore_4_imhotep': {
    title: '伊莫顿的石刻',
    text: '"以爱之名行复活之术，以仇恨为代价驱动力量。三千年的等待教会我一件事——死亡只是暂停，真正的终结是被遗忘。"——伊莫顿祭司铭文，翻译自古埃及文。',
    chapter: 4,
    icon: '🏛',
  },

  // ── 第五章补充: 死神来了 ──
  'lore_5_fate': {
    title: '命运偏差记录',
    text: '"主神记录显示：在死神来了世界中，队员们第一次开始质疑死亡的随机性。命运不是不可改变的——但改变命运需要付出的代价，往往比死亡更沉重。这个认知本身就是一种进化。"',
    chapter: 5,
    icon: '⚖',
  },

  // ── 第六章: 异形再临 ──
  'lore_6_queen': {
    title: '异形皇后进化记录',
    text: '"皇后的进化速度令人恐惧。第二次遭遇异形群落时，它们已经学会了设陷阱、迂回包抄、甚至利用通风管道发起精准打击。异形不是在狩猎——它们在进行战术演习。"',
    chapter: 6,
    icon: '👑',
  },
  'lore_6_facility': {
    title: '深海设施最终警告',
    text: '紧急广播循环播放："注意：B区已全面沦陷。所有人员撤离至C区安全舱。重复：不要尝试营救B区人员。他们已经不是人类了。舱门将在120秒后永久封锁。"',
    chapter: 6,
    icon: '🚨',
  },

  // ── 第七章补充: 恶魔队 ──
  'lore_7_demon': {
    title: '恶魔队的存在意义',
    text: '"主神为什么要创造恶魔队？答案很简单——没有对手的进化是虚假的。复制体的存在迫使每一个轮回者面对最可怕的敌人：另一个自己。打败自己的复制品，就是超越自己。"',
    chapter: 7,
    icon: '👤',
  },

  // ── 第八章: 侏罗纪/中洲 ──
  'lore_8_map': {
    title: '中洲地图残片',
    text: '一张褪色的羊皮卷，上面用精灵文标注了几个关键位置：刚铎白城、魔多黑门、法贡森林。有人用现代笔迹在角落写道："甘道夫说过——真正的旅程不在于目的地，而在于你在路上变成了什么样的人。"',
    chapter: 8,
    icon: '🗺',
  },
  'lore_8_gandalf': {
    title: '甘道夫的预言',
    text: '"来自另一个世界的旅人啊，你们的到来不是偶然。有一股超越中洲所有力量的意志在操纵着命运的丝线。但记住——即便是最渺小的人，也能改变未来的走向。"——迈雅·甘道夫',
    chapter: 8,
    icon: '🧙',
  },

  // ── 第九章: 星河战队 ──
  'lore_9_bug': {
    title: '虫族通讯截获',
    text: '情报部门截获了一段虫族脑虫的精神波动翻译："这些两脚生物不同寻常。它们的个体弱小得可笑，但它们的集体意志——那种愿意为彼此赴死的疯狂——让我感到了一种陌生的情绪。恐惧。"',
    chapter: 9,
    icon: '🛸',
  },
  'lore_9_orbital': {
    title: '轨道轰炸申请书',
    text: '"请求对克伦达苏星球表面执行全面轨道轰炸。原因：虫族数量已超出地面部队控制范围。附注：请确认地面幸存者已全部撤离。如果无法确认……也请执行轰炸。——里科中尉"',
    chapter: 9,
    icon: '💥',
  },

  // ── 第十章补充: 五队大战 ──
  'lore_10_alliance': {
    title: '临时同盟协议书',
    text: '"鉴于当前局势，天神队与中州队达成临时停火协议。条款如下：一、战斗期间互不攻击；二、资源按贡献分配；三、协议在主神任务结束时自动失效。补充：所有签署者心知肚明——这份协议的墨迹干了之前就会被撕毁。"',
    chapter: 10,
    icon: '📜',
  },

  // ── 第十一章: 基因锁突破 ──
  'lore_11_gene': {
    title: '第四阶基因锁突破笔记',
    text: '"第三阶是身体的极限。第四阶是意志的极限。突破的关键不在于更强的力量，而在于一个足以撼动灵魂的信念。我的信念是什么？是带所有人活着回去。每一个人。——郑吒"',
    chapter: 11,
    icon: '🧬',
  },
  'lore_11_shadow': {
    title: '影子郑吒的独白',
    text: '"我拥有他所有的记忆。我知道他珍视的每一个人。但我不理解——为什么要为注定会死的人拼命？这不合逻辑。这不符合进化的方向。除非……进化的终点不是个体的强大，而是某种我无法计算的东西。"',
    chapter: 11,
    icon: '🌑',
  },

  // ── 第十二章补充: 终章 ──
  'lore_12_zhushen_log': {
    title: '主神异常进化路径日志',
    text: '"观察对象：郑吒。异常标记：进化路径偏离所有预设模型。常规进化路径是通过杀戮获取力量。但此对象的力量增长与同伴存活率呈正相关。结论：这是一种未知的进化模式。建议——继续观察。"',
    chapter: 12,
    icon: '⚙',
  },
};

// ── 已发现的线索追踪 ──
class LoreTracker {
  constructor() {
    this.discovered = new Set();
    this.pendingNotifications = [];
  }

  discover(loreId) {
    if (this.discovered.has(loreId)) return false;
    const entry = LORE_ENTRIES[loreId];
    if (!entry) return false;

    this.discovered.add(loreId);
    this.pendingNotifications.push(entry);
    eventBus.emit('lore:discovered', { id: loreId, ...entry });
    return true;
  }

  getNextNotification() {
    return this.pendingNotifications.shift() || null;
  }

  hasNotifications() {
    return this.pendingNotifications.length > 0;
  }

  getDiscoveredCount() {
    return this.discovered.size;
  }

  getTotalCount() {
    return Object.keys(LORE_ENTRIES).length;
  }

  getDiscoveredByChapter(chapter) {
    return [...this.discovered]
      .filter(id => LORE_ENTRIES[id]?.chapter === chapter)
      .map(id => ({ id, ...LORE_ENTRIES[id] }));
  }

  toJSON() {
    return { discovered: [...this.discovered] };
  }

  fromJSON(data) {
    this.discovered = new Set(data?.discovered || []);
  }
}

export const loreTracker = new LoreTracker();

/**
 * 生成线索弹窗HTML
 */
export function formatLorePopup(entry) {
  return `
    <div style="
      max-width:500px;padding:24px;background:rgba(10,10,15,0.98);
      border:1px solid #44444480;border-radius:12px;
      box-shadow:0 0 30px rgba(255,204,68,0.1);
    ">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
        <span style="font-size:24px;">${entry.icon}</span>
        <div>
          <p style="color:#ffcc44;font-size:10px;letter-spacing:2px;">发现线索</p>
          <h3 style="color:#e0e0e0;font-size:16px;margin:0;">${entry.title}</h3>
        </div>
      </div>
      <p style="color:#aaa;font-size:13px;line-height:1.8;font-style:italic;">
        ${entry.text}
      </p>
      <p style="color:#555;font-size:10px;text-align:center;margin-top:12px;">
        空格键关闭
      </p>
    </div>
  `;
}
