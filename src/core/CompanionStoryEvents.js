// ═══════════════════════════════════════════════════════════════
// 同伴剧情事件系统 — 深度角色互动与成长
// ═══════════════════════════════════════════════════════════════
//
// 在特定条件下触发同伴的个人故事事件：
// 1. 章节专属对话 — 根据剧情进展
// 2. 关系等级触发 — 达到一定好感度
// 3. 战斗后互动 — 根据战斗表现
// 4. 主神空间深夜对话 — 休整时的心灵交流
// 5. 死亡/离别/重逢 — 关键转折点
// ═══════════════════════════════════════════════════════════════

import { eventBus } from './EventBus.js';

// ── 同伴故事事件定义 ──
const COMPANION_STORY_EVENTS = {
  // ── 张杰 ──
  zhang_jie_ch1_intro: {
    companion: 'zhang_jie',
    trigger: { chapter: 1, floor: 1, type: 'chapter_start' },
    title: '队长的嘱托',
    dialogue: [
      { speaker: '张杰', text: '听着，新人。在这个世界里，信任是比武器更重要的东西。', emotion: 'serious' },
      { speaker: '张杰', text: '我不要求你理解，但请你记住——活着回去，不只是为了自己。', emotion: 'warm' },
      { speaker: '你', text: '（张杰的眼神中有一种让人安心的力量）', emotion: 'thoughtful' },
    ],
    effect: { relationship: +5, playerBuff: { def: +2, duration: 'chapter' } },
    unlockCondition: null,
  },
  zhang_jie_ch3_trust: {
    companion: 'zhang_jie',
    trigger: { chapter: 3, type: 'lord_god_space', minRelationship: 20 },
    title: '深夜的篝火',
    dialogue: [
      { speaker: '张杰', text: '睡不着？', emotion: 'calm' },
      { speaker: '你', text: '张杰……你害怕吗？每次进入恐怖片世界的时候。', emotion: 'curious' },
      { speaker: '张杰', text: '（沉默了一会儿）当然害怕。但比起害怕，我更害怕失去你们。', emotion: 'melancholy' },
      { speaker: '张杰', text: '我当过兵。战场上，恐惧不会消失，但它会变成保护战友的力量。', emotion: 'serious' },
      { speaker: '你', text: '……我明白了。', emotion: 'determined' },
      { speaker: '张杰', text: '（拍了拍你的肩膀）走吧，明天还有硬仗要打。', emotion: 'smile' },
    ],
    effect: { relationship: +10, unlockSkill: 'team_spirit', narrative: '你和张杰的关系更近了一步。他的话语让你对即将到来的战斗充满信心。' },
  },
  zhang_jie_death: {
    companion: 'zhang_jie',
    trigger: { chapter: 5, floor: 5, type: 'story_event', required: true },
    title: '永别，队长',
    dialogue: [
      { speaker: '旁白', text: '死神的阴影终于追上了你们。张杰挡在了你的面前。', emotion: 'dark' },
      { speaker: '张杰', text: '（用尽最后的力气微笑）终于……轮到我保护你们了。', emotion: 'pain_smile' },
      { speaker: '张杰', text: '郑吒……从今天起，你是队长了。', emotion: 'final' },
      { speaker: '你', text: '队长！不——！', emotion: 'anguish' },
      { speaker: '旁白', text: '张杰闭上了眼睛。他的脸上，是一种如释重负的安详。', emotion: 'solemn' },
      { speaker: '旁白', text: '中洲队第一任队长，张杰。享年35岁。', emotion: 'memorial' },
    ],
    effect: { 
      companionDeath: 'zhang_jie',
      relationship: 'max',
      karma: +20,
      playerBuff: { atk: +10, permanent: true, desc: '张杰的遗志' },
      narrative: '张杰走了。但他留下的不只是悲伤——还有你必须扛起的责任。',
      unlockAchievement: 'farewell_captain',
    },
  },
  
  // ── 楚轩 ──
  chuxuan_ch2_analysis: {
    companion: 'chuxuan',
    trigger: { chapter: 2, floor: 1, type: 'chapter_start' },
    title: '军师的分析',
    dialogue: [
      { speaker: '楚轩', text: '（推了推眼镜）根据我的分析，这次任务的存活率——', emotion: 'cold' },
      { speaker: '你', text: '……多少？', emotion: 'nervous' },
      { speaker: '楚轩', text: '58.3%。但如果你们听我的指挥，可以提升到72%。', emotion: 'analytical' },
      { speaker: '楚轩', text: '条件很简单：不要让感情影响判断。', emotion: 'stern' },
    ],
    effect: { relationship: +3, playerBuff: { crt: +5, duration: 'chapter' } },
  },
  chuxuan_ch4_warmth: {
    companion: 'chuxuan',
    trigger: { chapter: 4, type: 'lord_god_space', minRelationship: 30 },
    title: '冰山的裂缝',
    dialogue: [
      { speaker: '旁白', text: '深夜，你发现楚轩独自坐在角落，看着一张照片。', emotion: 'quiet' },
      { speaker: '你', text: '楚轩，那是……', emotion: 'surprised' },
      { speaker: '楚轩', text: '（迅速收起照片）……没什么。', emotion: 'flustered' },
      { speaker: '你', text: '（你看到了——那是一个小女孩的照片）', emotion: 'thoughtful' },
      { speaker: '楚轩', text: '……她是我妹妹。进入轮回空间之前，她得了重病。', emotion: 'rare_emotion' },
      { speaker: '楚轩', text: '我的一切计算，都是为了回到现实世界。为了她。', emotion: 'determined' },
      { speaker: '你', text: '（原来如此……冰冷的外表下，藏着这样的温柔）', emotion: 'moved' },
    ],
    effect: { relationship: +15, narrative: '你看到了楚轩隐藏在理性外表下的柔软。他并不像表面那样冷血。' },
  },
  
  // ── 詹岚 ──
  zhan_lan_ch1_sniper: {
    companion: 'zhan_lan',
    trigger: { chapter: 1, floor: 3, type: 'after_combat', condition: 'player_low_hp' },
    title: '远方的掩护',
    dialogue: [
      { speaker: '旁白', text: '就在你即将被包围的时刻，一声清脆的枪响划破空气。', emotion: 'tense' },
      { speaker: '詹岚', text: '（通讯器）别回头，我在掩护你。', emotion: 'calm' },
      { speaker: '你', text: '谢了！', emotion: 'relieved' },
      { speaker: '詹岚', text: '不用谢。下次——别把自己搞成活靶子。', emotion: 'slight_smile' },
    ],
    effect: { relationship: +8, playerBuff: { hp_restore: 0.15, desc: '詹岚的掩护' } },
  },
  zhan_lan_ch6_fear: {
    companion: 'zhan_lan',
    trigger: { chapter: 6, floor: 2, type: 'exploration' },
    title: '狙击手的恐惧',
    dialogue: [
      { speaker: '旁白', text: '咒怨的世界。连詹岚握枪的手都在微微颤抖。', emotion: 'dark' },
      { speaker: '詹岚', text: '……枪对鬼魂没用。这是我第一次……感到这么无力。', emotion: 'vulnerable' },
      { speaker: '你', text: '没关系。这次换我来保护你。', emotion: 'determined' },
      { speaker: '詹岚', text: '（沉默片刻）……谢谢。', emotion: 'grateful' },
    ],
    effect: { relationship: +12, narrative: '在詹岚最脆弱的时刻，你选择了站在她身边。' },
  },
  
  // ── 李小意 ──
  li_xiaoyi_ch1_admire: {
    companion: 'li_xiaoyi',
    trigger: { chapter: 1, type: 'after_combat', condition: 'player_ss_rating' },
    title: '新人的崇拜',
    dialogue: [
      { speaker: '李小意', text: '郑吒哥好厉害！刚才的战斗简直太帅了！', emotion: 'excited' },
      { speaker: '你', text: '没什么，多练习就好了。', emotion: 'modest' },
      { speaker: '李小意', text: '我也要努力！总有一天，我也要变得像你一样强！', emotion: 'determined' },
      { speaker: '你', text: '（这个孩子……提醒了你，为什么要变强）', emotion: 'warm' },
    ],
    effect: { relationship: +5, narrative: '李小意的纯真让你想起了进入轮回之前的自己。' },
  },
};

// ── 事件状态追踪 ──
let _triggeredEvents = new Set();
let _eventQueue = [];

export function resetCompanionStoryEvents() {
  _triggeredEvents = new Set();
  _eventQueue = [];
}

// ── 检查触发条件 ──
export function checkCompanionEvents(context) {
  const { chapter, floor, type, player, relationships } = context;
  const available = [];
  
  for (const [id, event] of Object.entries(COMPANION_STORY_EVENTS)) {
    if (_triggeredEvents.has(id)) continue;
    
    const t = event.trigger;
    
    // 章节匹配
    if (t.chapter !== undefined && t.chapter !== chapter) continue;
    
    // 楼层匹配
    if (t.floor !== undefined && t.floor !== floor) continue;
    
    // 类型匹配
    if (t.type !== undefined && t.type !== type) continue;
    
    // 关系值条件
    if (t.minRelationship !== undefined) {
      const rel = relationships?.[event.companion] || 0;
      if (rel < t.minRelationship) continue;
    }
    
    // 特殊条件
    if (t.condition === 'player_low_hp' && player && player.hp / player.maxHp > 0.3) continue;
    if (t.condition === 'player_ss_rating' && player?._lastRating !== 'SS') continue;
    
    available.push({ id, ...event });
  }
  
  return available;
}

// ── 标记事件已触发 ──
export function markEventTriggered(eventId) {
  _triggeredEvents.add(eventId);
}

// ── 获取同伴故事事件定义 ──
export function getCompanionStoryEvent(eventId) {
  return COMPANION_STORY_EVENTS[eventId] || null;
}

// ── 渲染对话面板 ──
export function renderCompanionDialogue(event) {
  const emotionColors = {
    serious: '#4488cc', warm: '#ffaa44', calm: '#88cc88', curious: '#aa88ff',
    melancholy: '#6688aa', determined: '#ff8844', smile: '#ffcc44', cold: '#88aacc',
    analytical: '#44aaff', nervous: '#cc8844', thoughtful: '#8888cc', quiet: '#666688',
    surprised: '#ff8866', flustered: '#cc6688', rare_emotion: '#ffaa88', moved: '#88aaff',
    tense: '#cc4444', relieved: '#44cc88', slight_smile: '#88ccaa', dark: '#444466',
    vulnerable: '#8866aa', grateful: '#88aacc', excited: '#ffcc44', modest: '#88aa88',
    pain_smile: '#cc8888', final: '#ff6644', anguish: '#cc2222', solemn: '#666688',
    memorial: '#888888', stern: '#668888',
  };
  
  let html = `
    <div style="max-width:500px;margin:0 auto;padding:16px;">
      <h3 style="color:#ffcc44;text-align:center;font-size:16px;margin:0 0 16px;
        letter-spacing:2px;">${event.title}</h3>
      <div style="display:flex;flex-direction:column;gap:12px;">
  `;
  
  for (const line of event.dialogue) {
    const isNarrator = line.speaker === '旁白';
    const isPlayer = line.speaker === '你';
    const color = emotionColors[line.emotion] || '#cccccc';
    
    if (isNarrator) {
      html += `
        <div style="padding:8px 12px;color:#888;font-style:italic;font-size:12px;
          text-align:center;line-height:1.8;">
          ${line.text}
        </div>
      `;
    } else {
      html += `
        <div style="display:flex;align-items:flex-start;gap:8px;
          ${isPlayer ? 'flex-direction:row-reverse;' : ''}">
          <div style="min-width:36px;height:36px;border-radius:50%;
            background:${color}22;border:1px solid ${color}44;
            display:flex;align-items:center;justify-content:center;
            font-size:14px;flex-shrink:0;">
            ${isPlayer ? '🧑' : line.speaker === '张杰' ? '👨‍✈️' : line.speaker === '楚轩' ? '🧠' : line.speaker === '詹岚' ? '🎯' : line.speaker === '李小意' ? '👦' : '👤'}
          </div>
          <div style="padding:8px 12px;background:#ffffff08;border-radius:8px;
            ${isPlayer ? 'border-right:2px solid ' + color + ';' : 'border-left:2px solid ' + color + ';'}
            max-width:380px;">
            <div style="color:${color};font-size:10px;font-weight:bold;margin-bottom:2px;">
              ${line.speaker}
            </div>
            <div style="color:#ddd;font-size:12px;line-height:1.7;">
              ${line.text}
            </div>
          </div>
        </div>
      `;
    }
  }
  
  // 效果预览
  if (event.effect) {
    const effects = [];
    if (event.effect.relationship) effects.push(`好感度 ${event.effect.relationship > 0 ? '+' : ''}${event.effect.relationship}`);
    if (event.effect.playerBuff) {
      const b = event.effect.playerBuff;
      if (b.atk) effects.push(`ATK +${b.atk}`);
      if (b.def) effects.push(`DEF +${b.def}`);
      if (b.crt) effects.push(`CRT +${b.crt}%`);
    }
    if (event.effect.narrative) effects.push('📖 ' + event.effect.narrative.slice(0, 30) + '…');
    
    if (effects.length > 0) {
      html += `
        <div style="margin-top:8px;padding:8px;background:#ffcc4411;border-radius:6px;
          border:1px solid #ffcc4422;">
          <div style="display:flex;flex-wrap:wrap;gap:4px;justify-content:center;">
            ${effects.map(e => `<span style="padding:2px 8px;background:#ffffff08;border-radius:4px;
              color:#88cc88;font-size:10px;">${e}</span>`).join('')}
          </div>
        </div>
      `;
    }
  }
  
  html += `</div></div>`;
  return html;
}

// ── 获取同伴回忆录（全部） ──
export function getCompanionMemoirs() {
  const memoirs = [];
  for (const [id, event] of Object.entries(COMPANION_STORY_EVENTS)) {
    if (_triggeredEvents.has(id) && event.dialogue) {
      memoirs.push({
        id,
        companion: event.companion,
        title: event.title,
        chapter: event.trigger.chapter,
      });
    }
  }
  return memoirs;
}

// ── 序列化 ──
export function serializeCompanionStoryEvents() {
  return { triggered: [..._triggeredEvents] };
}

export function deserializeCompanionStoryEvents(data) {
  if (data?.triggered) {
    _triggeredEvents = new Set(data.triggered);
  }
}
