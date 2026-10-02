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
