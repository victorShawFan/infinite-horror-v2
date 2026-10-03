// ═══════════════════════════════════════════════════════════════
// 探索事件系统 — 战斗间隙的丰富互动
// ═══════════════════════════════════════════════════════════════
//
// 在玩家探索楼层时随机触发文本事件，提供：
// - 叙事片段（增加沉浸感）
// - 选择分支（影响属性/资源）
// - 隐藏发现（稀有道具/情报）
// - 环境危机（陷阱预警/紧急战斗前buff）
// ═══════════════════════════════════════════════════════════════

import { eventBus } from './EventBus.js';
import { gameState } from './GameState.js';

const EXPLORATION_EVENTS = {
  // ── 第1章：异形 ──
  1: [
    {
      id: 'alien_corpse',
      title: '走廊尽头的尸体',
      text: '你发现一具穿着太空服的尸体。面罩碎裂，表情扭曲——死前经历了极度恐惧。手里紧握着一张便签。',
      choices: [
        { text: '📋 检查便签', result: { type: 'info', text: '"他们不怕火……但怕酸。左边的管道里有应急清洗液。" — 获得战术情报', effect: { nextBattleCritBonus: 10 } } },
        { text: '🔍 搜索装备', result: { type: 'loot', text: '在尸体的工具腰带里找到一瓶修复液。', effect: { heal: 15 } } },
        { text: '🚶 默哀后离开', result: { type: 'karma', text: '"愿你安息。" 业力微微上升。', effect: { karma: 5 } } },
      ],
      weight: 10,
    },
    {
      id: 'emergency_cache',
      title: '应急物资柜',
      text: '一个印有 USCSS 标志的应急柜，密码锁已被暴力破坏。里面还剩下一些物资。',
      choices: [
        { text: '💊 拿走医疗包', result: { type: 'heal', text: '使用医疗包，恢复了一些生命。', effect: { healPercent: 0.2 } } },
        { text: '⚡ 拿走能量棒', result: { type: 'buff', text: '能量棒让你感觉力量充沛。下场战斗ATK+3', effect: { nextBattleAtkBonus: 3 } } },
        { text: '🔧 拿走工具', result: { type: 'gold', text: '专业工具可以在主神空间卖个好价钱。', effect: { gold: 30 } } },
      ],
      weight: 8,
    },
    {
      id: 'alien_nest_warning',
      title: '粘液痕迹',
      text: '地板上出现了大片暗色粘液，空气中弥漫着刺鼻的酸味。这是异形巢穴的边缘。',
      choices: [
        { text: '⚠ 小心前进', result: { type: 'info', text: '你提高了警惕，下场战斗中更容易发现敌人弱点。', effect: { nextBattleCritBonus: 15 } } },
        { text: '🔥 制作简易火把', result: { type: 'buff', text: '火光让异形暂时退避。下场战斗敌人ATK-2', effect: { nextBattleEnemyAtkReduce: 2 } } },
        { text: '↩ 寻找绕路', result: { type: 'safe', text: '多走了一段路，但避开了直接冲突。', effect: { exp: 5 } } },
      ],
      weight: 6,
    },
  ],
  // ── 第2章：咒怨 ──
  2: [
    {
      id: 'haunted_room',
      title: '诡异的日式房间',
      text: '推开门，里面是一间传统和室。茶杯中的茶还是温的，角落的电视机自动开启，画面是一个黑发女人……',
      choices: [
        { text: '📺 继续观看', result: { type: 'info', text: '画面中隐约出现了逃生路线图。获得 +8% 暴击', effect: { nextBattleCritBonus: 8 } } },
        { text: '🔇 关掉电视', result: { type: 'safe', text: '及时切断了诅咒传播。避免了精神伤害。', effect: { karma: 3 } } },
        { text: '🏃 立刻离开', result: { type: 'escape', text: '直觉救了你。身后传来指甲抓地板的声音。', effect: { exp: 8 } } },
      ],
      weight: 10,
    },
    {
      id: 'ghost_child',
      title: '楼梯间的孩子',
      text: '一个苍白的小男孩蜷缩在楼梯角。他抬头看着你，嘴巴张开又闭上，像是想说什么。',
      choices: [
        { text: '🗣 蹲下问他', result: { type: 'info', text: '"妈妈……在阁楼……不要……去……" 他消失了。获得Boss情报。', effect: { nextBattleBossDmgBonus: 5 } } },
        { text: '🤲 递出食物', result: { type: 'karma', text: '孩子眼中闪过一丝温暖，随后化为光点消散。业力显著上升。', effect: { karma: 10, heal: 5 } } },
        { text: '🚶 无视通过', result: { type: 'neutral', text: '你选择不与未知交互。安全但错过了什么。', effect: {} } },
      ],
      weight: 8,
    },
  ],
  // ── 通用事件（所有章节） ──
  0: [
    {
      id: 'meditation',
      title: '短暂的宁静',
      text: '在一个相对安全的角落，你找到了片刻喘息的机会。是休息恢复，还是利用这段时间锻炼？',
      choices: [
        { text: '🧘 冥想恢复', result: { type: 'heal', text: '静下心来，伤口在缓慢愈合。', effect: { healPercent: 0.15 } } },
        { text: '⚔ 练习技巧', result: { type: 'buff', text: '对战斗技巧的理解更深了。获得少量经验。', effect: { exp: 10 } } },
        { text: '🔍 搜索周围', result: { type: 'loot', text: '运气不错，找到了一些金币。', effect: { gold: 15 + Math.floor(Math.random() * 20) } } },
      ],
      weight: 5,
    },
    {
      id: 'team_talk',
      title: '队友对话',
      text: '同行的队友似乎想聊聊。在这种绝望的环境中，交流既是慰藉也是情报。',
      choices: [
        { text: '💬 聊聊战斗策略', result: { type: 'buff', text: '"我观察了那些怪物的行动模式……" 下场战斗CRT+5%', effect: { nextBattleCritBonus: 5 } } },
        { text: '💬 聊聊过去', result: { type: 'relationship', text: '彼此的信任加深了。队友协战意愿增加。', effect: { companionBonus: true } } },
        { text: '🤫 保持沉默', result: { type: 'safe', text: '沉默中蕴含着理解。', effect: { karma: 2 } } },
      ],
      weight: 4,
    },
    {
      id: 'mysterious_merchant',
      title: '神秘旅人',
      text: '"活着的轮回者？有趣。" 一个戴兜帽的人影从暗处走出。"我有些东西……但需要交换。"',
      choices: [
        { text: '💰 用金币交易 (40G)', result: { type: 'trade', text: '"成交。" 他递过一瓶闪光液体。', effect: { gold: -40, healPercent: 0.3 }, condition: (p) => (p.gold || 0) >= 40 } },
        { text: '📖 交换情报', result: { type: 'info', text: '"前方Boss弱火元素。" 有价值的情报。', effect: { nextBattleCritBonus: 12 } } },
        { text: '🚫 拒绝', result: { type: 'safe', text: '他耸耸肩，融入阴影中消失了。', effect: {} } },
      ],
      weight: 3,
    },
    {
      id: 'trap_warning',
      title: '可疑的走廊',
      text: '前方地面有规律的裂缝，墙壁上有些不自然的小孔。这看起来像是某种机关。',
      choices: [
        { text: '🔍 仔细观察后通过', result: { type: 'safe', text: '你发现了机关的触发规律，安全通过。获得经验。', effect: { exp: 8 } } },
        { text: '⚡ 快速冲过', result: { type: 'risk', text: Math.random() > 0.4 ? '运气不错，安全通过！' : '触发了陷阱！', effect: Math.random() > 0.4 ? { exp: 5 } : { damage: 10 } } },
        { text: '↩ 寻找其他路径', result: { type: 'safe', text: '绕道但安全。', effect: {} } },
      ],
      weight: 5,
    },
  ],
};

// ── 事件触发概率（每次移动后） ──
const BASE_EVENT_CHANCE = 0.08;  // 8%基础概率
let _lastEventTurn = 0;
let _shownEventIds = new Set();

/**
 * 尝试触发探索事件
 * @returns {object|null} 事件数据或null
 */
export function tryExplorationEvent() {
  const turn = gameState.stats?.turnsPlayed || 0;
  
  // 冷却：至少间隔5回合
  if (turn - _lastEventTurn < 5) return null;
  
  // 概率判定
  const chance = BASE_EVENT_CHANCE + (turn - _lastEventTurn - 5) * 0.02; // 越久越可能
  if (Math.random() > chance) return null;
  
  // 获取可用事件池
  const chapter = gameState.chapter || 1;
  const chapterEvents = EXPLORATION_EVENTS[chapter] || [];
  const universalEvents = EXPLORATION_EVENTS[0] || [];
  const allEvents = [...chapterEvents, ...universalEvents].filter(e => !_shownEventIds.has(e.id));
  
  if (allEvents.length === 0) {
    // 重置已展示列表（允许重复）
    _shownEventIds.clear();
    return null;
  }
  
  // 加权随机选择
  const totalWeight = allEvents.reduce((sum, e) => sum + (e.weight || 1), 0);
  let roll = Math.random() * totalWeight;
  let selected = allEvents[0];
  for (const evt of allEvents) {
    roll -= evt.weight || 1;
    if (roll <= 0) { selected = evt; break; }
  }
  
  _shownEventIds.add(selected.id);
  _lastEventTurn = turn;
  
  return selected;
}

/**
 * 渲染探索事件面板
 */
export function renderExplorationEvent(event, onChoice) {
  const old = document.getElementById('exploration-event');
  if (old) old.remove();
  
  const panel = document.createElement('div');
  panel.id = 'exploration-event';
  panel.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 250;
    display: flex; align-items: center; justify-content: center;
    background: rgba(0, 0, 0, 0.8);
    animation: expevt-fadeIn 0.4s;
  `;
  
  const choicesHTML = event.choices.map((c, i) => {
    const disabled = c.condition && !c.condition(gameState.player);
    return `
      <button class="expevt-choice" data-idx="${i}" 
        style="display:block;width:100%;text-align:left;padding:12px 16px;margin-bottom:6px;
        background:rgba(255,255,255,0.03);border:1px solid #333;border-radius:8px;
        color:${disabled ? '#555' : '#ccc'};font-size:13px;cursor:${disabled ? 'not-allowed' : 'pointer'};
        font-family:inherit;transition:all 0.15s;line-height:1.5;
        ${disabled ? 'opacity:0.5;' : ''}"
        ${disabled ? 'disabled' : ''}>
        ${c.text}
      </button>
    `;
  }).join('');
  
  panel.innerHTML = `
    <style>
      @keyframes expevt-fadeIn { from { opacity: 0 } to { opacity: 1 } }
      .expevt-choice:hover:not(:disabled) { background: rgba(255,255,255,0.06) !important; border-color: #555 !important; }
    </style>
    <div style="max-width:440px;width:90%;background:linear-gradient(180deg,rgba(15,12,8,0.98),rgba(8,6,4,0.98));
      border:1px solid rgba(200,160,80,0.15);border-radius:16px;padding:28px 24px;
      box-shadow:0 0 40px rgba(200,160,80,0.05);">
      
      <p style="color:#aa8844;font-size:10px;letter-spacing:4px;margin-bottom:4px;">— 探索事件 —</p>
      <p style="color:#ddc088;font-size:18px;font-weight:bold;margin-bottom:12px;">${event.title}</p>
      <p style="color:#998866;font-size:13px;line-height:1.8;margin-bottom:20px;">${event.text}</p>
      
      ${choicesHTML}
    </div>
  `;
  
  document.body.appendChild(panel);
  
  // 处理选择
  panel.querySelectorAll('.expevt-choice').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      const idx = parseInt(btn.dataset.idx);
      const choice = event.choices[idx];
      if (!choice) return;
      
      // 显示结果
      _showEventResult(panel, choice.result, () => {
        panel.remove();
        if (onChoice) onChoice(choice, choice.result);
      });
    });
  });
  
  // 数字键快捷键
  const keyHandler = (e) => {
    const num = parseInt(e.key);
    if (num >= 1 && num <= event.choices.length) {
      const choice = event.choices[num - 1];
      if (choice.condition && !choice.condition(gameState.player)) return;
      document.removeEventListener('keydown', keyHandler);
      _showEventResult(panel, choice.result, () => {
        panel.remove();
        if (onChoice) onChoice(choice, choice.result);
      });
    }
  };
  document.addEventListener('keydown', keyHandler);
}

/**
 * 应用事件效果到玩家
 */
export function applyEventEffect(effect, player) {
  if (!effect) return;
  
  if (effect.heal) player.hp = Math.min(player.maxHp, player.hp + effect.heal);
  if (effect.healPercent) player.hp = Math.min(player.maxHp, player.hp + Math.floor(player.maxHp * effect.healPercent));
  if (effect.damage) player.hp = Math.max(1, player.hp - effect.damage);
  if (effect.gold) player.gold = Math.max(0, (player.gold || 0) + effect.gold);
  if (effect.exp) gameState.addExp(effect.exp);
  if (effect.karma) gameState.karma = (gameState.karma || 0) + effect.karma;
  
  // 临时战斗buff存到gameState
  if (effect.nextBattleCritBonus) gameState._tempCombatBuffs = gameState._tempCombatBuffs || {};
  if (effect.nextBattleCritBonus) gameState._tempCombatBuffs.critBonus = (gameState._tempCombatBuffs.critBonus || 0) + effect.nextBattleCritBonus;
  if (effect.nextBattleAtkBonus) { gameState._tempCombatBuffs = gameState._tempCombatBuffs || {}; gameState._tempCombatBuffs.atkBonus = (gameState._tempCombatBuffs.atkBonus || 0) + effect.nextBattleAtkBonus; }
  if (effect.nextBattleEnemyAtkReduce) { gameState._tempCombatBuffs = gameState._tempCombatBuffs || {}; gameState._tempCombatBuffs.enemyAtkReduce = (gameState._tempCombatBuffs.enemyAtkReduce || 0) + effect.nextBattleEnemyAtkReduce; }
  if (effect.nextBattleBossDmgBonus) { gameState._tempCombatBuffs = gameState._tempCombatBuffs || {}; gameState._tempCombatBuffs.bossDmgBonus = (gameState._tempCombatBuffs.bossDmgBonus || 0) + effect.nextBattleBossDmgBonus; }
  if (effect.companionBonus) {
    // 随机增加一个同伴关系
    const comps = (gameState.companions || []).filter(c => c.alive);
    if (comps.length > 0) {
      const c = comps[Math.floor(Math.random() * comps.length)];
      const rels = gameState.relationships || {};
      if (rels[c.id]) rels[c.id] = Math.min(100, (rels[c.id] || 0) + 5);
    }
  }
}

// 内部：显示事件结果
function _showEventResult(panel, result, onDone) {
  const inner = panel.querySelector('div > div') || panel.firstElementChild;
  if (!inner) { onDone(); return; }
  
  // 替换内容为结果
  const resultDiv = document.createElement('div');
  resultDiv.style.cssText = 'animation: expevt-fadeIn 0.3s;';
  resultDiv.innerHTML = `
    <p style="color:#ccc;font-size:14px;line-height:1.8;margin-bottom:20px;">${result.text}</p>
    <button id="expevt-ok" style="
      display:block;margin:0 auto;background:rgba(200,160,80,0.1);border:1px solid #aa884444;
      color:#aa8844;padding:10px 40px;cursor:pointer;font-size:13px;font-family:inherit;
      border-radius:8px;letter-spacing:3px;
    ">继续</button>
  `;
  
  // 清空选项区域，保留标题
  const choiceButtons = panel.querySelectorAll('.expevt-choice');
  choiceButtons.forEach(b => b.remove());
  
  // 添加结果
  inner.appendChild(resultDiv);
  
  const closeHandler = () => {
    document.removeEventListener('keydown', closeKey);
    onDone();
  };
  const closeKey = (e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
      e.preventDefault();
      closeHandler();
    }
  };
  
  document.getElementById('expevt-ok')?.addEventListener('click', closeHandler);
  document.addEventListener('keydown', closeKey);
}

// ── 序列化 ──
export function serializeExplorationEvents() {
  return { shownIds: [..._shownEventIds], lastTurn: _lastEventTurn };
}

export function deserializeExplorationEvents(data) {
  if (!data) return;
  _shownEventIds = new Set(data.shownIds || []);
  _lastEventTurn = data.lastTurn || 0;
}

// ── 追加章节事件 ──
// 第3章: 神鬼秘宝
EXPLORATION_EVENTS[3] = [
  {
    id: 'ancient_trap',
    title: '古代机关',
    text: '墙壁上的浮雕开始缓缓移动，似乎触发了某种古代防御机制。沙子从天花板的缝隙中倾泻而下。',
    choices: [
      { text: '🔍 研究机关原理', result: { type: 'info', text: '你发现了机关的精妙之处。这种设计思路对战斗也有启发。CRT+8%', effect: { nextBattleCritBonus: 8, exp: 5 } } },
      { text: '⚡ 快速通过', result: { type: 'risk', text: '成功冲了过去！肾上腺素让你的反应更快。', effect: { nextBattleCritBonus: 5 } } },
      { text: '🔧 尝试解除', result: { type: 'gold', text: '机关解除后露出一个暗格，里面有金币和宝石。', effect: { gold: 50, exp: 8 } } },
    ],
    weight: 8,
  },
  {
    id: 'mummy_warning',
    title: '壁画上的警告',
    text: '一面保存完好的壁画描述着守墓者的力量。最后一幅画中，入侵者被吞噬在金色的光芒中。',
    choices: [
      { text: '📖 仔细研读', result: { type: 'info', text: '你理解了守墓者的弱点——他们依赖共鸣能量。下场Boss战+5%伤害', effect: { nextBattleBossDmgBonus: 5 } } },
      { text: '🎨 临摹符文', result: { type: 'buff', text: '符文散发微弱光芒，似乎给了你某种防护。DEF+2', effect: { nextBattleAtkBonus: 2 } } },
      { text: '🚶 继续前进', result: { type: 'safe', text: '你记住了壁画的位置。', effect: { exp: 3 } } },
    ],
    weight: 7,
  },
];

// 第4章: 死神绝境
EXPLORATION_EVENTS[4] = [
  {
    id: 'death_note_page',
    title: '黑色笔记本残页',
    text: '地上散落着几页黑色纸张，上面写满了名字。你能感受到其中蕴含的不祥力量。',
    choices: [
      { text: '📜 阅读内容', result: { type: 'info', text: '名字旁边标注了死因规则。这是极其珍贵的情报。下场战斗CRT+12%', effect: { nextBattleCritBonus: 12, karma: -3 } } },
      { text: '🔥 立刻烧毁', result: { type: 'karma', text: '火焰将纸页化为灰烬。你做了正确的事。业力大幅上升。', effect: { karma: 15, heal: 10 } } },
      { text: '📦 收入背包', result: { type: 'loot', text: '也许以后用得上……但你感到一阵寒意。', effect: { nextBattleAtkBonus: 5, karma: -8 } } },
    ],
    weight: 10,
  },
  {
    id: 'shinigami_glimpse',
    title: '模糊的身影',
    text: '角落里，一个苍白的身影一闪而过。空气中传来沙沙的写字声，然后一切归于寂静。',
    choices: [
      { text: '🔍 追上去看看', result: { type: 'risk', text: '你什么都没追到，但在墙角发现了一些金币。', effect: { gold: 25 } } },
      { text: '🧘 保持冷静', result: { type: 'safe', text: '你控制住了恐惧。精神力得到了锻炼。', effect: { exp: 10, healPercent: 0.05 } } },
      { text: '🏃 反方向逃', result: { type: 'escape', text: '明智的选择。有些东西不该去招惹。', effect: {} } },
    ],
    weight: 6,
  },
];

// 第5章: 异形再临
EXPLORATION_EVENTS[5] = [
  {
    id: 'xenomorph_molt',
    title: '脱落的外骨骼',
    text: '一具完整的异形外骨骼躺在走廊中央。它的主人在某处进化成了更危险的形态。',
    choices: [
      { text: '🔬 分析弱点', result: { type: 'info', text: '外骨骼的关节处最薄弱。针对性攻击可以更有效。ATK+3', effect: { nextBattleAtkBonus: 3, exp: 8 } } },
      { text: '🛡 制作护甲', result: { type: 'buff', text: '用外骨骼碎片加固了你的装备。DEF临时+2', effect: { nextBattleAtkBonus: 2, def: 1 } } },
      { text: '🧪 提取酸液', result: { type: 'loot', text: '小心翼翼地提取了一瓶异形酸血。可用作攻击增强。', effect: { nextBattleAtkBonus: 4 } } },
    ],
    weight: 9,
  },
];

// 第6章: 恶魔初临
EXPLORATION_EVENTS[6] = [
  {
    id: 'demonic_altar',
    title: '恶魔祭坛',
    text: '房间中央是一座黑石祭坛，上面放着一颗跳动的暗红色宝石。空气中弥漫着硫磺的气味。',
    choices: [
      { text: '💎 触碰宝石', result: { type: 'risk', text: '黑暗能量涌入你的身体！力量暴增但精神受创。', effect: { nextBattleAtkBonus: 8, damage: 15, karma: -10 } } },
      { text: '🔥 摧毁祭坛', result: { type: 'karma', text: '祭坛崩塌，邪恶的气息消散。你感到一阵轻松。', effect: { karma: 12, healPercent: 0.1 } } },
      { text: '📖 研究铭文', result: { type: 'info', text: '铭文记载了恶魔的召唤规则和弱点。知识就是力量。', effect: { nextBattleCritBonus: 10, exp: 12 } } },
    ],
    weight: 8,
  },
];

// 章节7-12的简洁事件
for (let ch = 7; ch <= 12; ch++) {
  if (!EXPLORATION_EVENTS[ch]) EXPLORATION_EVENTS[ch] = [];
}

EXPLORATION_EVENTS[7].push({
  id: 'middle_earth_ruins',
  title: '中洲废墟',
  text: '断壁残垣中，一面完整的浮雕讲述着远古的战争。这里曾是人类最辉煌的文明中心。',
  choices: [
    { text: '📖 铭记历史', result: { type: 'info', text: '历史的教训让你更加坚定。意志增强。', effect: { exp: 15, karma: 5 } } },
    { text: '🔍 搜索遗物', result: { type: 'loot', text: '在废墟中找到了一些有价值的文明碎片。', effect: { gold: 60 } } },
    { text: '🧘 默祷', result: { type: 'heal', text: '在这片土地上的冥想带来了内心的平静。', effect: { healPercent: 0.15, karma: 8 } } },
  ],
  weight: 7,
});

EXPLORATION_EVENTS[8].push({
  id: 'star_map',
  title: '星际航图',
  text: '控制台上显示着错综复杂的星际航线。部分路线标记着"危险"和"未知"。',
  choices: [
    { text: '📡 下载数据', result: { type: 'info', text: '航线数据暗示了前方敌人的部署位置。', effect: { nextBattleCritBonus: 10 } } },
    { text: '⚡ 修改航线', result: { type: 'buff', text: '调整后的航线避开了最危险的区域。', effect: { healPercent: 0.1, exp: 10 } } },
    { text: '🔌 取走零件', result: { type: 'gold', text: '控制台的精密零件价值不菲。', effect: { gold: 45 } } },
  ],
  weight: 7,
});

EXPLORATION_EVENTS[9].push({
  id: 'team_ambush',
  title: '其他轮回队的痕迹',
  text: '地上有打斗的痕迹和血迹。不是异形的，是人类的。看来其他轮回队已经在附近了。',
  choices: [
    { text: '🔍 分析战斗痕迹', result: { type: 'info', text: '从痕迹推断出对方的战斗风格。知己知彼。CRT+12%', effect: { nextBattleCritBonus: 12 } } },
    { text: '⚠ 加强警戒', result: { type: 'buff', text: '你的注意力达到巅峰，不会被偷袭。', effect: { nextBattleAtkBonus: 3, nextBattleCritBonus: 5 } } },
    { text: '🏃 快速离开', result: { type: 'safe', text: '不与其他队伍纠缠，保存实力迎接真正的威胁。', effect: { healPercent: 0.08 } } },
  ],
  weight: 9,
});

EXPLORATION_EVENTS[10].push({
  id: 'inner_demon',
  title: '镜中的自己',
  text: '一面完整的镜子立在走廊中央。镜中的你，表情冰冷，眼中没有任何情感。',
  choices: [
    { text: '🗡 打碎镜子', result: { type: 'buff', text: '碎片散落，心魔暂时退却。攻击力暴增。', effect: { nextBattleAtkBonus: 6, karma: -3 } } },
    { text: '🧘 直面心魔', result: { type: 'karma', text: '"我不会成为你。" 内心的力量在觉醒。', effect: { karma: 15, exp: 20, healPercent: 0.1 } } },
    { text: '🚶 别过头走过', result: { type: 'safe', text: '有些东西等你准备好了再面对。', effect: { exp: 5 } } },
  ],
  weight: 10,
});

EXPLORATION_EVENTS[11].push({
  id: 'biochem_lab',
  title: '生化实验室',
  text: '残破的实验室里，试管中还有残留的各色液体。有些在发出诡异的荧光。',
  choices: [
    { text: '🧪 分析样本', result: { type: 'info', text: '这是病毒的弱点样本！对最终Boss可能有用。', effect: { nextBattleBossDmgBonus: 8, exp: 15 } } },
    { text: '💉 注射强化剂', result: { type: 'risk', text: '身体短暂强化，但有副作用。', effect: { nextBattleAtkBonus: 6, nextBattleCritBonus: 8, damage: 10 } } },
    { text: '💣 摧毁一切', result: { type: 'karma', text: '不能让这些东西落入任何人手中。', effect: { karma: 10, exp: 8 } } },
  ],
  weight: 8,
});

EXPLORATION_EVENTS[12].push({
  id: 'final_crossroads',
  title: '最终抉择之路',
  text: '走廊分成两条路。左边传来低沉的嗡鸣——那是主神的力量。右边一片寂静，但空气中有自由的气息。',
  choices: [
    { text: '⬅ 走向主神之力', result: { type: 'buff', text: '主神的力量灌注你的身体。在终局之战中更加强大。', effect: { nextBattleAtkBonus: 10, nextBattleCritBonus: 15, karma: -5 } } },
    { text: '➡ 走向自由', result: { type: 'karma', text: '选择自己的道路。内心的平静赋予了真正的力量。', effect: { karma: 20, healPercent: 0.2, exp: 25 } } },
    { text: '⏸ 驻足沉思', result: { type: 'info', text: '在抉择中获得了平衡。两种力量都给了你一些眷顾。', effect: { nextBattleAtkBonus: 5, karma: 5, healPercent: 0.1 } } },
  ],
  weight: 10,
});
