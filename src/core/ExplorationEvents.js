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
import { random as seededRandom } from './RandomSystem.js';
import { gameState } from './GameState.js';

const EXPLORATION_EVENTS = {
  // ── 第1章：生化危机 ──
  1: [
    {
      id: 'zombie_corpse',
      title: '实验室中的遗骸',
      text: '蜂巢实验室走廊尽头，一具穿着白大褂的研究员尸体靠墙而坐。胸口有撕裂的咬痕，手里紧握着一张实验记录。',
      choices: [
        { text: '📋 检查记录', result: { type: 'info', text: '"T-病毒变异体对火焰有明显弱点。红后安保系统可通过C-2走廊绕过。" — 获得战术情报', effect: { nextBattleCritBonus: 10 } } },
        { text: '🔍 搜索装备', result: { type: 'loot', text: '在研究员的口袋里找到一支急救针和安保卡。', effect: { heal: 15 } } },
        { text: '🚶 默哀后离开', result: { type: 'karma', text: '"愿你安息。" 你为这位无辜的牺牲者合上了眼睛。', effect: { karma: 5 } } },
      ],
      weight: 10,
    },
    {
      id: 'emergency_cache',
      title: '安保室物资柜',
      text: '一个印有 Umbrella 标志的安保物资柜，密码锁已被暴力破坏。里面还剩下一些物资。',
      choices: [
        { text: '💊 拿走医疗包', result: { type: 'heal', text: '使用医疗包，恢复了一些生命。', effect: { healPercent: 0.2 } } },
        { text: '⚡ 拿走能量棒', result: { type: 'buff', text: '能量棒让你感觉力量充沛。下场战斗ATK+3', effect: { nextBattleAtkBonus: 3 } } },
        { text: '🔧 拿走工具', result: { type: 'gold', text: '专业工具可以在主神空间卖个好价钱。', effect: { gold: 30 } } },
      ],
      weight: 8,
    },
    {
      id: 'laser_corridor',
      title: '红后激光走廊',
      text: '走廊尽头亮起红色警报灯。地面散落着被激光切割的金属碎片——红后防御系统仍在运转。',
      choices: [
        { text: '🏃 冲过激光阵', result: { type: 'info', text: '你观察好间隙，飞身穿过。基因锁感知被激活。', effect: { nextBattleCritBonus: 15 } } },
        { text: '🔧 关闭安保系统', result: { type: 'buff', text: '你找到控制面板，关闭了激光防御。获得安保卡。', effect: { nextBattleEnemyAtkReduce: 2 } } },
        { text: '↩ 从维修通道绕行', result: { type: 'safe', text: '绕道虽远，但安全通过了。', effect: { exp: 5 } } },
      ],
      weight: 6,
    },
  ],
  // ── 第2章：异形 ──
  2: [
    {
      id: 'acid_corridor',
      title: '酸蚀走廊',
      text: '飞船走廊的金属墙壁满是腐蚀痕迹。浓烈的酸性气味刺痛鼻腔——异形曾从这里经过。地上有绿色血液。',
      choices: [
        { text: '🔥 准备火攻', result: { type: 'info', text: '你从应急柜找到火焰喷射器备件。异形惧火。', effect: { nextBattleCritBonus: 8 } } },
        { text: '🔍 追踪血迹', result: { type: 'safe', text: '血迹指向通风管——你标记了异形移动路线。', effect: { karma: 3 } } },
        { text: '⏪ 换条路走', result: { type: 'escape', text: '迂回前进虽慢，但安全第一。', effect: { exp: 8 } } },
      ],
      weight: 10,
    },
    {
      id: 'facehugger_eggs',
      title: '异形卵室',
      text: '通风管尽头是一个闷热潮湿的空间。地面排列着数十个半透明的异形卵，卵顶在微微张合。',
      choices: [
        { text: '🔥 焚烧虫卵', result: { type: 'info', text: '你用火焰将卵室烧成焦炭。减少了后续遭遇抱脸虫的风险。', effect: { nextBattleBossDmgBonus: 5 } } },
        { text: '🔍 小心取样', result: { type: 'karma', text: '楚轩说样本也许对分析异形弱点有用。你冒险取了一份。', effect: { karma: 10, heal: 5 } } },
        { text: '⚡ 全力破坏', result: { type: 'neutral', text: '你暴力摧毁了整个卵室，在废墟中发现了士兵装备。', effect: { nextBattleAtkBonus: 5 } } },
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
        { text: '🔍 搜索周围', result: { type: 'loot', text: '运气不错，找到了一些金币。', effect: { gold: 15 + Math.floor(seededRandom() * 20) } } },
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
        { text: '⚡ 快速冲过', result: { type: 'risk', text: seededRandom() > 0.4 ? '运气不错，安全通过！' : '触发了陷阱！', effect: seededRandom() > 0.4 ? { exp: 5 } : { damage: 10 } } },
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
  if (seededRandom() > chance) return null;
  
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
  let roll = seededRandom() * totalWeight;
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
  if (effect.def) player.def = Math.max(1, (player.def || 0) + effect.def);
  if (effect.atk) player.atk = Math.max(1, (player.atk || 0) + effect.atk);
  if (effect.mana) player.mana = Math.min(player.maxMana || 0, Math.max(0, (player.mana || 0) + effect.mana));
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
      const c = comps[Math.floor(seededRandom() * comps.length)];
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
    id: 'cursed_apartment',
    title: '诅咒的公寓',
    text: '推开门的瞬间温度骤降十度。传统和室中，茶杯里的茶还是温的。角落的电视机自动开启，画面是一个黑发女人……',
    choices: [
      { text: '📺 仔细观察', result: { type: 'info', text: '画面中隐约出现了逃生路线图。获得 +8% 暴击', effect: { nextBattleCritBonus: 8, exp: 5 } } },
      { text: '🔇 关掉电视', result: { type: 'risk', text: '及时切断了诅咒传播。避免了精神伤害。', effect: { nextBattleCritBonus: 5 } } },
      { text: '🏃 立刻离开', result: { type: 'gold', text: '直觉救了你。身后传来指甲抓地板的声音。但你发现了一个护符。', effect: { gold: 50, exp: 8 } } },
    ],
    weight: 8,
  },
  {
    id: 'ghost_child_stairs',
    title: '楼梯间的孩子',
    text: '一个苍白的小男孩蜷缩在楼梯角。他抬头看着你，嘴巴张开又闭上，像是想说什么。冰冷的气息笼罩着周围。',
    choices: [
      { text: '🗣 蹲下问他', result: { type: 'info', text: '"妈妈……在阁楼……不要……去……" 他消失了。获得Boss情报。', effect: { nextBattleBossDmgBonus: 5 } } },
      { text: '🤲 递出食物', result: { type: 'buff', text: '孩子眼中闪过一丝温暖，随后化为光点消散。业力上升。', effect: { nextBattleAtkBonus: 2, karma: 8 } } },
      { text: '🚶 无视通过', result: { type: 'safe', text: '你选择不与未知交互。安全但错过了什么。', effect: { exp: 3 } } },
    ],
    weight: 7,
  },
];

// 第4章: 死神绝境
EXPLORATION_EVENTS[4] = [
  {
    id: 'ancient_mechanism',
    title: '古墓机关',
    text: '墙壁上的浮雕开始缓缓移动，触发了某种古代防御机制。沙子从天花板的缝隙中倾泻而下。',
    choices: [
      { text: '🔍 研究机关原理', result: { type: 'info', text: '你发现了法老防御体系的精妙之处。CRT+8%', effect: { nextBattleCritBonus: 8, exp: 5 } } },
      { text: '⚡ 快速通过', result: { type: 'risk', text: '成功冲了过去！肾上腺素让你的反应更快。', effect: { nextBattleCritBonus: 5 } } },
      { text: '🔧 尝试解除', result: { type: 'gold', text: '机关解除后露出一个暗格，里面有金币和宝石。', effect: { gold: 50, exp: 8 } } },
    ],
    weight: 8,
  },
  {
    id: 'pharaoh_mural',
    title: '法老壁画',
    text: '一面保存完好的壁画描述着伊莫顿的复活仪式。最后一幅画中，入侵者被吞噬在黑色沙暴中。',
    choices: [
      { text: '📖 仔细研读', result: { type: 'info', text: '你理解了伊莫顿的弱点——他依赖太阳金经的反面。下场Boss战+5%伤害', effect: { nextBattleBossDmgBonus: 5 } } },
      { text: '🎨 临摹象形文字', result: { type: 'buff', text: '古老符文散发微弱光芒，给了你某种防护。DEF+2', effect: { nextBattleDefBonus: 2 } } },
      { text: '🚶 继续深入', result: { type: 'safe', text: '你记住了壁画的位置。', effect: { exp: 3 } } },
    ],
    weight: 7,
  },
];

// 第5章: 异形再临
EXPLORATION_EVENTS[5] = [
  {
    id: 'death_omen',
    title: '死神的征兆',
    text: '街道上一切看起来正常——直到你注意到一只鸽子撞上了玻璃，水管在微微渗漏，电线在风中晃动。这些都不是巧合。',
    choices: [
      { text: '🔍 分析因果链', result: { type: 'info', text: '你推演出死神的下一步设计：水+电=连锁。预知让你提前准备。', effect: { nextBattleCritBonus: 10, exp: 8 } } },
      { text: '⚠ 警告同伴', result: { type: 'buff', text: '队友们提高了警觉。全队DEF临时提升。', effect: { nextBattleDefBonus: 4, karma: 5 } } },
      { text: '🏃 快速离开', result: { type: 'safe', text: '你选择远离这个区域。安全，但也许错过了线索。', effect: { exp: 5 } } },
    ],
    weight: 8,
  },
  {
    id: 'chain_accident',
    title: '连锁事故现场',
    text: '前方道路上发生了一起离奇的交通事故。碎玻璃、漏油、断裂的电缆……死神的设计链正在展开。',
    choices: [
      { text: '🛑 阻止连锁', result: { type: 'info', text: '你切断了电缆，阻止了连锁反应。张杰投来赞许的目光。', effect: { nextBattleBossDmgBonus: 5, karma: 10 } } },
      { text: '🔧 收集材料', result: { type: 'gold', text: '事故现场的残骸中有些材料可以利用。', effect: { gold: 40, exp: 5 } } },
      { text: '↩ 绕路走', result: { type: 'safe', text: '小心绕过了危险区域。', effect: { heal: 10 } } },
    ],
    weight: 7,
  },
];

// 第6章: 恶魔初临
EXPLORATION_EVENTS[6] = [
  {
    id: 'evolved_xenomorph',
    title: '进化异形残骸',
    text: '实验船的走廊里，一具新型异形的残骸靠在墙边。它的外骨骼比你之前见过的更厚，形态也不同——更接近人类。',
    choices: [
      { text: '🔍 分析进化体', result: { type: 'info', text: '你发现了新型异形的弱点：进化让它们的酸血浓度降低了。CRT+8%', effect: { nextBattleCritBonus: 8, exp: 8 } } },
      { text: '🧪 提取样本', result: { type: 'buff', text: '楚轩说这些数据对制定战术很有帮助。ATK+3', effect: { nextBattleAtkBonus: 3 } } },
      { text: '🔥 焚烧残骸', result: { type: 'safe', text: '确保它不会再动。安全第一。', effect: { karma: 3, exp: 3 } } },
    ],
    weight: 8,
  },
  {
    id: 'sealed_lab',
    title: '封锁的实验舱',
    text: '一扇厚重的隔离门上贴着"生物危害 IV级"的标识。门缝中渗出绿色的液体。里面传来异形幼体的嘶嘶声。',
    choices: [
      { text: '💣 炸开入口', result: { type: 'info', text: '实验舱中发现了异形皇后的进化数据。Boss战伤害+5%', effect: { nextBattleBossDmgBonus: 5 } } },
      { text: '🔒 加固封锁', result: { type: 'buff', text: '你用焊枪加固了隔离门，阻止了异形扩散。DEF+3', effect: { nextBattleDefBonus: 3, karma: 5 } } },
      { text: '🚶 标记后离开', result: { type: 'safe', text: '标记了位置，留给后续处理。', effect: { exp: 5 } } },
    ],
    weight: 7,
  },
];

// 章节7-12的简洁事件
for (let ch = 7; ch <= 12; ch++) {
  if (!EXPLORATION_EVENTS[ch]) EXPLORATION_EVENTS[ch] = [];
}

EXPLORATION_EVENTS[7].push({
  id: 'raccoon_city_ruins',
  title: '浣熊市废墟',
  text: '浣熊市已经是一片废墟。追踪者的脚步声在远处回荡。墙上用血写着"恶魔队已至"。',
  choices: [
    { text: '🔍 分析血迹', result: { type: 'info', text: '血迹的方向暴露了恶魔队的行军路线。', effect: { exp: 15, karma: 5 } } },
    { text: '⚔ 搜索武器', result: { type: 'loot', text: '在警察局废墟中找到了一些弹药和装备。', effect: { gold: 60 } } },
    { text: '🛡 设置陷阱', result: { type: 'heal', text: '为可能的追踪者设下了警戒。短暂安心。', effect: { healPercent: 0.15, karma: 8 } } },
  ],
  weight: 7,
});

EXPLORATION_EVENTS[8].push({
  id: 'dinosaur_trail',
  title: '恐龙足迹',
  text: '巨大的三趾足迹深深印在泥地上，间距超过两米。空气中弥漫着原始丛林的潮湿气息。远处传来低沉的咆哮。',
  choices: [
    { text: '🔍 追踪足迹', result: { type: 'info', text: '足迹指向巨龙巢穴。你标记了安全路线。', effect: { nextBattleCritBonus: 10 } } },
    { text: '🌿 隐蔽观察', result: { type: 'buff', text: '你观察到恐龙的行为规律，找到了行动间隙。', effect: { healPercent: 0.1, exp: 10 } } },
    { text: '🦴 收集骨骼', result: { type: 'gold', text: '龙族骨骼蕴含着古老的力量，可以换取奖励点。', effect: { gold: 45 } } },
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
  id: 'alliance_meeting',
  title: '联盟会议遗址',
  text: '一处临时营地的残迹。桌上散落着五队的旗帜——天神队的金色、恶魔队的黑色……联盟已经破裂。',
  choices: [
    { text: '🔍 分析局势', result: { type: 'buff', text: '从残留物推断出各队的实力和意图。知己知彼。', effect: { nextBattleAtkBonus: 6, karma: -3 } } },
    { text: '📜 收集情报', result: { type: 'karma', text: '天神队的作战笔记揭示了他们基因锁的弱点。', effect: { karma: 15, exp: 20, healPercent: 0.1 } } },
    { text: '🚶 保持中立', result: { type: 'safe', text: '不留任何痕迹地离开。在混战中保持灵活。', effect: { exp: 5 } } },
  ],
  weight: 10,
});

EXPLORATION_EVENTS[11].push({
  id: 'nightmare_gate',
  title: '噩梦之门',
  text: '一扇半开的门后面，空间扭曲变形。现实和梦境的边界在此模糊——弗莱迪的领域近在咫尺。',
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

// ═══ 补充探索事件 — Ch7-12各增2个，增强叙事深度 ═══

EXPLORATION_EVENTS[7].push(
  {
    id: 'demon_graffiti',
    title: '墙上的涂鸦',
    text: '用黑色喷漆写成的字："你们来晚了。——复制体楚轩"。笔迹工整得令人不安。',
    choices: [
      { text: '🔍 分析笔迹', result: { type: 'info', text: '字迹中隐藏的细微抖动暴露了复制体的弱点。', effect: { nextBattleCritBonus: 12 } } },
      { text: '✋ 擦掉涂鸦', result: { type: 'karma', text: '"我们不会被恐吓。" 士气提升。', effect: { karma: 5, nextBattleAtkBonus: 2 } } },
      { text: '📷 记录情报', result: { type: 'loot', text: '这些信息将来也许有用。', effect: { exp: 12 } } },
    ],
    weight: 8,
  },
  {
    id: 'fallen_teammate_gear',
    title: '阵亡队友的遗物',
    text: '在废墟中发现了一个背包，属于之前阵亡的队友。里面还有一些物资……和一封信。',
    choices: [
      { text: '📧 阅读遗信', result: { type: 'karma', text: '"把大家都带回来。" 信上只有这一句话。', effect: { karma: 12, exp: 10 } } },
      { text: '🎒 整理物资', result: { type: 'loot', text: '医疗用品和少量弹药。在这里，每一点资源都珍贵。', effect: { healPercent: 0.12, gold: 30 } } },
      { text: '🙏 为其默哀', result: { type: 'heal', text: '短暂的默哀让你平复心情，准备好面对接下来的一切。', effect: { healPercent: 0.08, karma: 8 } } },
    ],
    weight: 9,
  }
);

EXPLORATION_EVENTS[8].push(
  {
    id: 'resurrection_altar',
    title: '复活祭坛的回响',
    text: '祭坛上还残留着微弱的金色光芒。空气中回荡着远古的低语。',
    choices: [
      { text: '🙏 触碰祭坛', result: { type: 'heal', text: '金色光芒包裹了你，生命力得到恢复。', effect: { healPercent: 0.2, karma: 5 } } },
      { text: '📖 解读符文', result: { type: 'info', text: '符文记载了复活仪式的秘密。理解加深了你的力量。', effect: { exp: 20, nextBattleAtkBonus: 3 } } },
      { text: '🔮 汲取力量', result: { type: 'buff', text: '祭坛的残余能量增强了你的属性。', effect: { nextBattleAtkBonus: 5, nextBattleCritBonus: 8 } } },
    ],
    weight: 7,
  },
  {
    id: 'dinosaur_fossil',
    title: '巨大的化石',
    text: '一具完整的恐龙化石嵌入墙壁。它的颅骨中似乎有什么东西在发光。',
    choices: [
      { text: '💎 取出发光物', result: { type: 'loot', text: '一颗远古能量结晶。蕴含着不可思议的力量。', effect: { gold: 50, exp: 15 } } },
      { text: '🔬 研究化石', result: { type: 'info', text: '了解了这种生物的弱点。对类似敌人伤害+5%', effect: { nextBattleCritBonus: 10 } } },
      { text: '🚶 保持敬畏', result: { type: 'karma', text: '有些东西不应该被打扰。', effect: { karma: 8 } } },
    ],
    weight: 6,
  }
);

EXPLORATION_EVENTS[9].push(
  {
    id: 'alien_tech',
    title: '外星科技残骸',
    text: '一块散发蓝光的金属板，上面刻满了无法辨认的符号。触碰时手指会感到刺痛。',
    choices: [
      { text: '🖐 尝试激活', result: { type: 'buff', text: '能量从金属板中涌入你的身体！短暂的力量增幅。', effect: { nextBattleAtkBonus: 6, nextBattleCritBonus: 10 } } },
      { text: '🔧 拆卸零件', result: { type: 'gold', text: '高科技零件在任何市场都有价值。', effect: { gold: 70 } } },
      { text: '📡 记录信号', result: { type: 'info', text: '信号频率暴露了附近敌人的位置。', effect: { exp: 12, nextBattleEnemyAtkReduce: 3 } } },
    ],
    weight: 7,
  },
  {
    id: 'team_traces',
    title: '中洲队的标记',
    text: '墙上刻着中洲队的暗号。"楚轩到此一游。方向：北偏西15度。"——这是楚轩的字迹。',
    choices: [
      { text: '🧭 按指示前进', result: { type: 'buff', text: '楚轩的路线果然避开了危险。体力恢复。', effect: { healPercent: 0.12, exp: 8 } } },
      { text: '📝 留下回信', result: { type: 'karma', text: '"收到。我们在路上了。" 队伍凝聚力上升。', effect: { karma: 8 } } },
      { text: '⚠ 怀疑是陷阱', result: { type: 'safe', text: '谨慎不会有错。你选择了另一条路。', effect: { exp: 5, gold: 20 } } },
    ],
    weight: 8,
  }
);

EXPLORATION_EVENTS[10].push(
  {
    id: 'war_trophy',
    title: '战利品残骸',
    text: '地上散落着其他轮回队的装备碎片。五队大战的战场上，到处都是战斗的痕迹。',
    choices: [
      { text: '🔍 搜集残骸', result: { type: 'loot', text: '从残骸中拼凑出一些可用的装备零件。', effect: { gold: 60, exp: 10 } } },
      { text: '📊 分析战术', result: { type: 'info', text: '从战斗痕迹推断出其他队伍的战术偏好。', effect: { nextBattleCritBonus: 14, nextBattleEnemyAtkReduce: 2 } } },
      { text: '🙏 为逝者致意', result: { type: 'karma', text: '无论敌友，每个轮回者都值得尊重。', effect: { karma: 12, healPercent: 0.05 } } },
    ],
    weight: 9,
  },
  {
    id: 'alliance_offer',
    title: '来自暗处的声音',
    text: '"中洲队……我们可以合作。" 一个陌生的声音从黑暗中传来。看不清对方的面容。',
    choices: [
      { text: '🤝 接受合作', result: { type: 'buff', text: '对方分享了一些战斗情报作为诚意。', effect: { nextBattleAtkBonus: 4, nextBattleCritBonus: 8, karma: -3 } } },
      { text: '🗡 拒绝并警惕', result: { type: 'safe', text: '"不需要。" 你保持了距离。信任不是轻易给的。', effect: { karma: 5 } } },
      { text: '🎯 反追踪', result: { type: 'info', text: '你顺着声音方向悄悄记下了对方的位置。', effect: { exp: 15, nextBattleCritBonus: 10 } } },
    ],
    weight: 7,
  }
);

EXPLORATION_EVENTS[11].push(
  {
    id: 'nightmare_memory',
    title: '消逝的记忆',
    text: '脑海中突然闪过一段不属于你的记忆——是另一个时间线的自己，正在经历完全不同的轮回。',
    choices: [
      { text: '🧠 吸收记忆', result: { type: 'buff', text: '另一个自己的战斗经验流入体内。', effect: { nextBattleAtkBonus: 5, nextBattleCritBonus: 10, exp: 15 } } },
      { text: '🛡 抵抗入侵', result: { type: 'karma', text: '"我是我自己。不需要别人的记忆。" 意志更加坚定。', effect: { karma: 10, healPercent: 0.1 } } },
      { text: '🌀 任其流过', result: { type: 'info', text: '记忆碎片中有关于主神的线索。', effect: { exp: 20, karma: 3 } } },
    ],
    weight: 9,
  },
  {
    id: 'power_surge',
    title: '力量暴走',
    text: '你体内的洪荒之力突然失控，能量在体表游走。痛苦……但也蕴含着突破的可能。',
    choices: [
      { text: '⚡ 引导力量', result: { type: 'buff', text: '成功将暴走的力量转化为战斗增幅！ATK大幅提升。', effect: { nextBattleAtkBonus: 8, damage: 15 } } },
      { text: '🧘 平息暴走', result: { type: 'heal', text: '深呼吸。控制。力量重新归于平静。', effect: { healPercent: 0.15, karma: 5 } } },
      { text: '🔥 释放一切', result: { type: 'risk', text: '力量狂暴释放！身体受损但战力暴增。', effect: { nextBattleAtkBonus: 12, nextBattleCritBonus: 15, damage: 25 } } },
    ],
    weight: 10,
  }
);

EXPLORATION_EVENTS[12].push(
  {
    id: 'lord_god_whisper',
    title: '主神的低语',
    text: '"你以为打败我就能改变什么吗？" 一个没有情感的声音在脑海中回响。',
    choices: [
      { text: '💬 回答它', result: { type: 'karma', text: '"不需要改变什么。只要我们活着回去就够了。" 主神沉默了。', effect: { karma: 15, exp: 20 } } },
      { text: '🤫 忽略它', result: { type: 'safe', text: '不要被精神攻击动摇。专注于眼前的战斗。', effect: { nextBattleAtkBonus: 3 } } },
      { text: '⚔ 以力量回应', result: { type: 'buff', text: '"看着吧。" 你的怒火转化为战斗意志。', effect: { nextBattleAtkBonus: 8, nextBattleCritBonus: 12, karma: -5 } } },
    ],
    weight: 10,
  },
  {
    id: 'team_final_moment',
    title: '最后的团聚',
    text: '短暂的休整时间。活着的队友们围坐在一起。没有人说话，但每个人的目光中都充满了信任。',
    choices: [
      { text: '🗣 鼓舞士气', result: { type: 'karma', text: '"最后一战了。不管结果如何——我们一起。" 全队士气高涨。', effect: { karma: 10, healPercent: 0.15, nextBattleAtkBonus: 3 } } },
      { text: '🤝 握紧拳头', result: { type: 'buff', text: '无需言语。拳头碰拳头，一切尽在不言中。', effect: { nextBattleAtkBonus: 5, nextBattleCritBonus: 8 } } },
      { text: '🌙 默默看星空', result: { type: 'heal', text: '也许这是最后一次仰望星空了。但活着的每一刻都值得珍惜。', effect: { healPercent: 0.2, karma: 8, exp: 10 } } },
    ],
    weight: 10,
  }
);

// ═══ 补充探索事件 — Ch1-Ch6各增2个，提升前期体验 ═══

// ── 第1章补充 ──
EXPLORATION_EVENTS[1].push(
  {
    id: 'distress_signal',
    title: '求救信号',
    text: '通讯器突然收到一段微弱的求救信号。"……被困在……C区……还有幸存者……"信号时断时续。',
    choices: [
      { text: '📡 追踪信号源', result: { type: 'info', text: '循着信号找到了一间密室，墙上刻着异形巢穴的弱点。', effect: { nextBattleCritBonus: 12, exp: 8 } } },
      { text: '⚠ 这可能是陷阱', result: { type: 'safe', text: '保持警惕是明智的。你绕过了那个区域。', effect: { karma: 3, exp: 3 } } },
      { text: '📢 回复信号', result: { type: 'karma', text: '"我们来了，坚持住！" 即使无人回应，你知道自己做了该做的事。', effect: { karma: 8, healPercent: 0.05 } } },
    ],
    weight: 7,
  },
  {
    id: 'acid_pool',
    title: '酸液积洼',
    text: '走廊尽头，地面被腐蚀出一个巨大的凹坑，里面满是异形的酸血。浓烈的酸味刺激着鼻腔。',
    choices: [
      { text: '🧪 收集酸液样本', result: { type: 'buff', text: '小心翼翼地收集了一些。这些酸液可以腐蚀敌人的护甲。', effect: { nextBattleAtkBonus: 4, exp: 5 } } },
      { text: '🔍 查看被腐蚀的物品', result: { type: 'loot', text: '在酸液边缘发现了半溶解的军用装备，还有些可用的零件。', effect: { gold: 40 } } },
      { text: '🚶 绕道而行', result: { type: 'safe', text: '不值得冒险。你找到了另一条更安全的路线。', effect: { exp: 3 } } },
    ],
    weight: 6,
  }
);

// ── 第2章补充 ──
EXPLORATION_EVENTS[2].push(
  {
    id: 'cursed_mirror',
    title: '诅咒之镜',
    text: '一面落满灰尘的镜子。当你走过时，镜中映出的不是你——而是一个苍白的、黑发遮面的女人。',
    choices: [
      { text: '🔍 直视镜中', result: { type: 'info', text: '女人的影像消散了。在她消失的位置，镜面上浮现出一行字——是守护符文。', effect: { nextBattleEnemyAtkReduce: 3, exp: 6 } } },
      { text: '🔨 打碎镜子', result: { type: 'risk', text: '碎裂的镜片中传出一声尖叫。诅咒似乎减弱了。', effect: { karma: -2, nextBattleAtkBonus: 3 } } },
      { text: '🙏 背诵经文', result: { type: 'karma', text: '"南无阿弥陀佛……" 古老的经文在空气中回荡，驱散了阴冷。', effect: { karma: 10, healPercent: 0.08 } } },
    ],
    weight: 8,
  },
  {
    id: 'childs_drawing',
    title: '孩子的画',
    text: '墙上贴着一幅蜡笔画——画着一个快乐的家庭。但画中父亲的位置被黑色涂鸦覆盖了。',
    choices: [
      { text: '📖 仔细研究', result: { type: 'info', text: '画的背面写着这栋房子的平面图。你发现了一条隐藏通道的标记。', effect: { gold: 35, exp: 5 } } },
      { text: '🖐 触碰黑色涂鸦', result: { type: 'risk', text: '手指触碰的瞬间，一股寒意穿过全身。但你似乎获得了短暂的灵觉。', effect: { nextBattleCritBonus: 10, damage: 8 } } },
      { text: '🙏 为这个家庭默哀', result: { type: 'karma', text: '在这个被诅咒的空间里，唯有人心的温度不变。', effect: { karma: 6, healPercent: 0.05 } } },
    ],
    weight: 7,
  }
);

// ── 第3章补充 ──
EXPLORATION_EVENTS[3].push(
  {
    id: 'hidden_passage',
    title: '隐秘甬道',
    text: '一块松动的地砖。推开后露出一条通往地下的窄道，空气中弥漫着某种植物的香气。',
    choices: [
      { text: '🔦 探索甬道', result: { type: 'loot', text: '甬道尽头是一个小型祭室，摆放着古埃及的护身符和几枚金币。', effect: { gold: 65, exp: 10, karma: 3 } } },
      { text: '📖 研究壁画', result: { type: 'info', text: '壁画描绘了击败木乃伊的仪式。知识就是力量。', effect: { nextBattleBossDmgBonus: 6, exp: 8 } } },
      { text: '🚶 记下位置离开', result: { type: 'safe', text: '也许以后再来探索。你在地图上标注了位置。', effect: { exp: 3 } } },
    ],
    weight: 7,
  },
  {
    id: 'sand_storm_warning',
    title: '沙暴预兆',
    text: '天空突然暗了下来，远处的沙丘开始移动。一场沙暴正在逼近。',
    choices: [
      { text: '🏃 寻找掩体', result: { type: 'safe', text: '及时找到了一处岩石下的庇护所。沙暴过后，你精神焕发地继续前进。', effect: { healPercent: 0.1, exp: 5 } } },
      { text: '⚡ 冲过沙暴', result: { type: 'risk', text: '沙砾割伤了皮肤，但你看到了沙暴中隐藏的遗迹入口。', effect: { damage: 12, gold: 50, nextBattleAtkBonus: 3 } } },
      { text: '🧘 原地冥想', result: { type: 'buff', text: '在风沙中冥想，感受自然的力量。精神变得更加锐利。', effect: { nextBattleCritBonus: 8, karma: 5 } } },
    ],
    weight: 6,
  }
);

// ── 第4章补充 ──
EXPLORATION_EVENTS[4].push(
  {
    id: 'apple_of_death',
    title: '死亡之苹果',
    text: '桌上摆着一颗完美的红苹果。在这个与死神相关的世界里，一切看起来正常的东西都可疑。',
    choices: [
      { text: '🍎 吃掉苹果', result: { type: 'risk', text: '苹果入口瞬间，身体感到一阵灼热。HP略有损失，但感觉力量在增长。', effect: { damage: 15, nextBattleAtkBonus: 6, nextBattleCritBonus: 8 } } },
      { text: '🔍 检查苹果', result: { type: 'info', text: '苹果表面有极微小的文字——是死神的规则漏洞！下次被攻击时自动闪避一次。', effect: { exp: 12, nextBattleCritBonus: 5 } } },
      { text: '🚫 不碰它', result: { type: 'safe', text: '在这个世界里，谨慎永远不过分。', effect: { karma: 5 } } },
    ],
    weight: 9,
  },
  {
    id: 'notebook_remnant',
    title: '残缺的笔记本',
    text: '角落里有一本破旧的笔记本，上面记录着某个轮回者的心路历程和战斗经验。',
    choices: [
      { text: '📖 通读笔记', result: { type: 'info', text: '前辈的经验弥足珍贵。你学到了一些对抗超自然存在的技巧。', effect: { exp: 15, nextBattleCritBonus: 6 } } },
      { text: '📝 撕下有用的页面', result: { type: 'loot', text: '几页记录了死神规则的细节，这些信息非常有价值。', effect: { gold: 30, nextBattleBossDmgBonus: 4 } } },
      { text: '🕯 为前辈点一根蜡烛', result: { type: 'karma', text: '笔记最后一页写着："如果有人看到这本笔记，请替我活下去。"', effect: { karma: 12, healPercent: 0.05 } } },
    ],
    weight: 8,
  }
);

// ── 第5章补充 ──
EXPLORATION_EVENTS[5].push(
  {
    id: 'egg_chamber',
    title: '异形卵室',
    text: '一间巨大的房间里摆满了异形卵。大多数已经孵化了，但还有几颗在微微颤动。',
    choices: [
      { text: '🔥 全部烧掉', result: { type: 'karma', text: '火焰吞噬了卵室。这些怪物不会再伤害任何人了。', effect: { karma: 8, exp: 10 } } },
      { text: '🔬 研究未孵化的卵', result: { type: 'info', text: '通过观察卵的结构，你发现了幼体阶段的弱点。', effect: { nextBattleCritBonus: 10, nextBattleAtkBonus: 3 } } },
      { text: '🧪 提取基因样本', result: { type: 'buff', text: '异形的基因样本蕴含着强大的适应力。这对基因锁研究有帮助。', effect: { exp: 8, gold: 35 } } },
    ],
    weight: 8,
  },
  {
    id: 'derelict_mech',
    title: '废弃的机甲',
    text: '一台半毁的战斗机甲倚靠在墙边。驾驶舱还能打开，控制台上闪着微弱的灯光。',
    choices: [
      { text: '🔧 拆卸零件', result: { type: 'loot', text: '从机甲上拆下了一些高品质零件，可以用来强化装备。', effect: { gold: 55, exp: 5 } } },
      { text: '⚡ 尝试启动', result: { type: 'risk', text: '机甲发出轰鸣后再次熄灭。但在短暂的启动中，武器系统扫描了周边区域。', effect: { nextBattleCritBonus: 12, damage: 5 } } },
      { text: '💾 下载数据', result: { type: 'info', text: '机甲的战斗记录包含了异形的移动模式和攻击规律。', effect: { exp: 12, nextBattleEnemyAtkReduce: 2 } } },
    ],
    weight: 7,
  }
);

// ── 第6章补充 ──
EXPLORATION_EVENTS[6].push(
  {
    id: 'demon_merchant',
    title: '恶魔商人',
    text: '"想要力量吗？" 一个戴着面具的身影从阴影中走出。"一切都有代价，但保证公平交易。"',
    choices: [
      { text: '💰 购买信息', result: { type: 'info', text: '商人告诉了你这层Boss的弱点和攻击模式。', effect: { gold: -30, nextBattleBossDmgBonus: 8, nextBattleCritBonus: 6 } } },
      { text: '🗡 以血换力', result: { type: 'risk', text: '商人取走了你的一些生命力，但注入了强大的恶魔能量。', effect: { damage: 20, nextBattleAtkBonus: 8, nextBattleCritBonus: 10 } } },
      { text: '🚶 谢绝离开', result: { type: 'safe', text: '"也好，我们下次再见。" 商人消失在阴影中。', effect: { karma: 5, exp: 3 } } },
    ],
    weight: 9,
  },
  {
    id: 'hellfire_spring',
    title: '地狱温泉',
    text: '一池发着暗红色光芒的温泉水。水面上升腾着硫磺蒸汽，但水温令人惊讶地舒适。',
    choices: [
      { text: '♨ 泡温泉休息', result: { type: 'heal', text: '地狱的温泉水意外地有治愈效果。伤口在愈合，疲劳在消退。', effect: { healPercent: 0.2, exp: 5 } } },
      { text: '🧪 收集温泉水', result: { type: 'buff', text: '装了一瓶地狱温泉水。下场战斗可以用来灼伤敌人。', effect: { nextBattleAtkBonus: 5, gold: 20 } } },
      { text: '🔮 研究水源', result: { type: 'info', text: '温泉水中含有微量恶魔能量。你学会了如何利用这种能量。', effect: { exp: 10, nextBattleCritBonus: 5 } } },
    ],
    weight: 7,
  }
);
