// ═══════════════════════════════════════════════════════════════
// 故事日志 — 郑吒的轮回手记
// ═══════════════════════════════════════════════════════════════
//
// 以第一人称视角记录玩家经历的关键剧情事件
// 每个条目有日期(主神历)、标题、正文和情绪标签
// 玩家可在暂停菜单中随时翻阅
// ═══════════════════════════════════════════════════════════════

import { eventBus } from './EventBus.js';
import { gameState } from './GameState.js';

let _entries = [];

// ── 预定义日志条目（按章节和关键事件触发） ──
const JOURNAL_TEMPLATES = {
  // 第一章
  ch1_start: {
    title: '第一天',
    chapter: 1,
    text: '我在一列火车上醒来。一个叫张杰的人告诉我这是"主神空间"——一个把人扔进恐怖片世界的地方。我以为他在开玩笑，直到窗外出现了蜂巢。',
    emotion: 'fear',
    icon: '🚂',
  },
  ch1_zhang_jie_trust: {
    title: '张杰队长',
    chapter: 1,
    text: '张杰是我们的队长。他说"活着比什么都重要"。在丧尸堆里，他的背影让人安心。我决定相信他。',
    emotion: 'trust',
    icon: '🛡',
  },
  ch1_complete: {
    title: '第一次归来',
    chapter: 1,
    text: '活下来了。回到主神空间的那一刻，我的手还在发抖。但一种奇怪的感觉在心底蔓延——我变强了。',
    emotion: 'relief',
    icon: '✦',
  },
  // 第二章
  ch2_alien_fear: {
    title: '异形',
    chapter: 2,
    text: '通风管道里的嘶嘶声。黑暗中闪过的银色身影。异形比任何噩梦都可怕，因为它不在梦里——它就在你面前。',
    emotion: 'horror',
    icon: '👾',
  },
  ch2_chuxuan_arrival: {
    title: '楚轩',
    chapter: 2,
    text: '新来了一个戴眼镜的人，叫楚轩。说话总是冷冷的，像在计算什么。但他分析出了异形的巢穴结构——这个人，不简单。',
    emotion: 'curiosity',
    icon: '🧠',
  },
  // 第三章
  ch3_cursed: {
    title: '诅咒',
    chapter: 3,
    text: '伽椰子的世界。恐惧不是来自怪物，而是来自你不知道它什么时候会出现。每一个角落，每一面镜子，都可能是深渊。',
    emotion: 'dread',
    icon: '👁',
  },
  // 第五章
  ch5_zhang_jie_death: {
    title: '张杰的遗言',
    chapter: 5,
    text: '"替我看着他们。"张杰说完这句话后，笑着倒在了我怀里。从今天开始，我是队长了。但我多希望我不是。',
    emotion: 'grief',
    icon: '✝',
  },
  ch5_captain: {
    title: '新队长',
    chapter: 5,
    text: '大家看着我，眼中有期待。我不知道自己能不能做到。但张杰把这支队伍交给了我，我不能让他失望。',
    emotion: 'resolve',
    icon: '⚔',
  },
  // 第七章
  ch7_team_wiped: {
    title: '团灭',
    chapter: 7,
    text: '恶魔队。复制体。一个一个，队友倒在我面前。赵樱空、程啸、霸王……最后是詹岚。她把十字勋章绑在了我身上。我什么都做不了。',
    emotion: 'despair',
    icon: '💀',
  },
  ch7_oath: {
    title: '誓言',
    chapter: 7,
    text: '我从死亡中醒来。周围一片废墟。他们都不在了。但复活真经还在。我对着空无一人的天空发誓——我会把你们全部带回来。',
    emotion: 'determination',
    icon: '🔥',
  },
  // 第八章
  ch8_chuxuan_revive: {
    title: '第一个复活',
    chapter: 8,
    text: '楚轩睁开了眼睛。他看了看四周，然后问："发生了什么？"我笑了。这个世界上最冷静的人，也有惊讶的时刻。',
    emotion: 'hope',
    icon: '✨',
  },
  ch8_luogandao_death: {
    title: '主神的规则',
    chapter: 8,
    text: '罗甘道的身体在消散。他的奖励点不够——负数。主神的规则不讲人情。我握紧了拳头，但什么都改变不了。',
    emotion: 'anger',
    icon: '💢',
  },
  // 第十章
  ch10_five_teams: {
    title: '五队对峙',
    chapter: 10,
    text: '五支轮回者队伍齐聚。天神队、恶魔队、西洲队、东洲队——还有我们。在他们的注视下，我感受到了前所未有的压力。但中洲队不会退缩。',
    emotion: 'tension',
    icon: '⚡',
  },
  // 第十二章
  ch12_final_battle: {
    title: '最终之战',
    chapter: 12,
    text: '一切回到了原点。生化危机的世界。这一次，我不再是那个在火车上发抖的少年。',
    emotion: 'resolve',
    icon: '⚔',
  },
  ch12_chuxuan_sacrifice: {
    title: '楚轩的选择',
    chapter: 12,
    text: '"这是我自己的选择。"楚轩倒下的时候，嘴角带着微笑。他用最冷酷的计算，做了最温柔的牺牲。',
    emotion: 'sacrifice',
    icon: '🌟',
  },
  ch12_ending: {
    title: '醒来',
    chapter: 12,
    text: '白光消散后，我发现自己坐在午夜的电影院里。身边是赵樱空，还有——所有活下来的人。窗外是真实的城市，真实的月光。这一切，终于结束了……吗？',
    emotion: 'bittersweet',
    icon: '🌙',
  },
};

// ── 情绪颜色映射 ──
const EMOTION_COLORS = {
  fear: '#ff6644',
  trust: '#4488ff',
  relief: '#44ff88',
  horror: '#ff2222',
  curiosity: '#88ccff',
  dread: '#aa44cc',
  grief: '#666688',
  resolve: '#ffcc44',
  despair: '#444444',
  determination: '#ff8844',
  hope: '#44ffaa',
  anger: '#ff4444',
  tension: '#ff8800',
  sacrifice: '#ffdd88',
  bittersweet: '#8888aa',
};

/**
 * 添加日志条目
 */
export function addJournalEntry(templateId) {
  const template = JOURNAL_TEMPLATES[templateId];
  if (!template) return;
  // 避免重复
  if (_entries.some(e => e.id === templateId)) return;
  
  _entries.push({
    id: templateId,
    ...template,
    timestamp: Date.now(),
    chapterNum: gameState.chapter || template.chapter,
  });
  
  eventBus.emit('journal:new_entry', { id: templateId, title: template.title });
}

/**
 * 按章节触发批量日志
 */
export function triggerChapterJournals(chapter) {
  // Auto-add chapter start entry when entering a chapter
  const startId = `ch${chapter}_start`;
  if (JOURNAL_TEMPLATES[startId]) {
    addJournalEntry(startId);
  }
}

/**
 * 触发章节完成日志
 */
export function triggerChapterCompleteJournal(chapter) {
  const completeId = `ch${chapter}_complete`;
  if (JOURNAL_TEMPLATES[completeId]) {
    addJournalEntry(completeId);
  }
}

/**
 * 获取所有可用模板ID列表（用于测试）
 */
export function getJournalTemplateIds() {
  return Object.keys(JOURNAL_TEMPLATES);
}

/**
 * 获取所有日志条目（按章节排序）
 */
export function getJournalEntries() {
  return [..._entries].sort((a, b) => (a.chapter || 0) - (b.chapter || 0) || a.timestamp - b.timestamp);
}

/**
 * 渲染日志面板HTML
 */
export function renderJournalPanel() {
  const entries = getJournalEntries();
  
  if (entries.length === 0) {
    return `<div style="text-align:center;padding:40px;color:#555;">
      <p style="font-size:14px;">📖 轮回手记</p>
      <p style="font-size:12px;margin-top:8px;color:#444;">冒险尚未开始...</p>
    </div>`;
  }
  
  let currentChapter = -1;
  let html = '<div style="padding:12px;max-height:70vh;overflow-y:auto;">';
  html += '<h3 style="color:#ffcc44;text-align:center;letter-spacing:4px;margin-bottom:16px;">📖 郑吒的轮回手记</h3>';
  
  for (const entry of entries) {
    if (entry.chapter !== currentChapter) {
      currentChapter = entry.chapter;
      html += `<div style="margin:12px 0 8px;border-top:1px solid #222;padding-top:8px;">
        <p style="color:#666;font-size:10px;letter-spacing:3px;">第 ${currentChapter} 章</p>
      </div>`;
    }
    
    const color = EMOTION_COLORS[entry.emotion] || '#888';
    html += `
      <div style="background:rgba(255,255,255,0.02);border-left:3px solid ${color}40;
        border-radius:0 6px 6px 0;padding:10px 14px;margin:6px 0;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
          <span style="color:${color};font-size:13px;font-weight:bold;">${entry.icon} ${entry.title}</span>
        </div>
        <p style="color:#aaa;font-size:12px;line-height:1.8;font-style:italic;">${entry.text}</p>
      </div>
    `;
  }
  
  html += '</div>';
  return html;
}

// ── 序列化 ──
export function serializeJournal() {
  return { entries: _entries };
}

export function deserializeJournal(data) {
  if (data?.entries) _entries = data.entries;
}

export function resetJournal() {
  _entries = [];
}
