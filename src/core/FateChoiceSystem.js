// ═══════════════════════════════════════════════════════════════
// 命运抉择系统 — 关键叙事分支 + 道德抉择 + 后果系统
// ═══════════════════════════════════════════════════════════════
//
// 在关键剧情节点触发选择事件：
// 1. 每个选择都有明确的后果（属性/剧情/同伴/道德值）
// 2. 选择会影响后续事件和结局
// 3. 部分选择会解锁隐藏路线或物品
// 4. 道德值（业力）系统与选择联动
//
// 原作精神：
//   - 为了活下去你能放弃多少？
//   - 强者的责任与弱者的挣扎
//   - 人性在极限环境下的抉择
// ═══════════════════════════════════════════════════════════════

import { eventBus } from './EventBus.js';

// ── 抉择数据定义 ──
const FATE_CHOICES = {
  // ── 第1章：生化危机 ──
  ch1_survivor: {
    id: 'ch1_survivor',
    chapter: 1, floor: 2,
    title: '幸存者的请求',
    desc: '一个受伤的幸存者挡在你面前，哀求你带上他。他会拖累你的行动速度，但他声称知道一条安全通道。',
    icon: '🧑',
    choices: [
      {
        id: 'help',
        text: '带上他',
        icon: '🤝',
        consequence: {
          karma: +15,
          spd: -2,
          unlockEvent: 'ch1_secret_path',
          narrative: '你背起伤员，他虽然气息微弱，但指引了一条避开大量丧尸的路线。',
          reward: { gold: 100, exp: 50 },
        },
      },
      {
        id: 'leave',
        text: '独自前进',
        icon: '🚶',
        consequence: {
          karma: -10,
          spd: +1,
          narrative: '你转身离去，身后传来绝望的呼喊。活着比什么都重要——你这样告诉自己。',
          reward: { gold: 0, exp: 20 },
        },
      },
      {
        id: 'mercy',
        text: '给他一把武器',
        icon: '🔫',
        consequence: {
          karma: +5,
          narrative: '你留下一把手枪和几发子弹。"自己保重。"这是你能做的极限。',
          reward: { gold: 0, exp: 30 },
          unlockEvent: 'ch1_survivor_returns',
        },
      },
    ],
  },
  ch1_mutation: {
    id: 'ch1_mutation',
    chapter: 1, floor: 4,
    title: '异变的选择',
    desc: '你发现了一管标注"T-病毒增强体"的针剂。注射可能大幅强化身体，也可能带来不可预知的变异。',
    icon: '💉',
    choices: [
      {
        id: 'inject',
        text: '注射',
        icon: '💪',
        consequence: {
          atk: +8, maxHp: +40, def: -3,
          karma: -5,
          statusEffect: 'mutation_instability',
          narrative: '你咬牙注射了针剂。剧烈的疼痛之后，你感到前所未有的力量涌遍全身。但你的手偶尔会不受控制地颤抖。',
        },
      },
      {
        id: 'destroy',
        text: '销毁',
        icon: '🔥',
        consequence: {
          karma: +10,
          narrative: '你将针剂摔碎在地。有些力量，不值得用人性去交换。',
          reward: { exp: 40 },
        },
      },
      {
        id: 'save',
        text: '保存备用',
        icon: '🎒',
        consequence: {
          item: { id: 'tvirus_serum', name: 'T-病毒增强体', type: 'consumable', usableInCombat: true,
            effect: { atkBoost: 0.3 }, desc: '战斗中使用：ATK+30%持续本场战斗' },
          narrative: '你小心翼翼地将针剂放入背包。也许在生死关头，它会是最后的底牌。',
        },
      },
    ],
  },
  
  // ── 第2章：异形 ──
  ch2_alien_egg: {
    id: 'ch2_alien_egg',
    chapter: 2, floor: 3,
    title: '异形卵室',
    desc: '你发现一间充满异形卵的房间。可以绕过它们，也可以用手边的燃料彻底烧毁——但火光可能引来猎手。',
    icon: '🥚',
    choices: [
      {
        id: 'burn',
        text: '焚烧卵室',
        icon: '🔥',
        consequence: {
          karma: +5,
          triggerCombat: 'ch2_xenomorph_hunter',
          narrative: '火焰吞噬了卵室，酸液四溅。但高温和气味引来了一头更凶猛的猎手型异形！',
          reward: { exp: 80, gold: 60 },
        },
      },
      {
        id: 'sneak',
        text: '悄悄绕过',
        icon: '🤫',
        consequence: {
          narrative: '你屏住呼吸，小心翼翼地穿过卵室。幸好没有惊动任何东西。',
          reward: { exp: 20 },
        },
      },
      {
        id: 'harvest',
        text: '采集酸液',
        icon: '🧪',
        consequence: {
          karma: -5,
          item: { id: 'alien_acid', name: '异形酸液', type: 'consumable', usableInCombat: true,
            effect: { trueDamageFlat: 30 }, desc: '投掷酸液：无视防御造成30点伤害' },
          narrative: '你冒险采集了一瓶异形酸液。这东西能溶解任何已知材料。',
          reward: { exp: 30 },
        },
      },
    ],
  },
  
  // ── 第3章：木乃伊 ──
  ch3_curse_tablet: {
    id: 'ch3_curse_tablet',
    chapter: 3, floor: 3,
    title: '亡者之书',
    desc: '你在祭坛发现一块刻满象形文字的石板。文字似乎记载着古老的诅咒，但也蕴含着力量的秘密。',
    icon: '📜',
    choices: [
      {
        id: 'read',
        text: '诵读咒文',
        icon: '📖',
        consequence: {
          atk: +5, maxMana: +20,
          statusEffect: 'cursed_knowledge',
          karma: -5,
          narrative: '你诵读了石板上的文字。古老的知识涌入脑海，但一股不祥的力量也缠绕上了你的灵魂。',
        },
      },
      {
        id: 'break',
        text: '打碎石板',
        icon: '💥',
        consequence: {
          karma: +10,
          narrative: '你举起石板重重摔下。碎片中似乎传来远古亡灵的叹息。',
          reward: { exp: 30, gold: 40 },
        },
      },
    ],
  },
  
  // ── 第5章：电锯惊魂 ──
  ch5_jigsaw_trap: {
    id: 'ch5_jigsaw_trap',
    chapter: 5, floor: 2,
    title: '竖锯的考验',
    desc: '"活着还是死去，你要做出选择。"——面前的装置很明确：自愿承受痛苦以换取通过的钥匙，或者在限时内找到另一条路。',
    icon: '🎭',
    choices: [
      {
        id: 'endure',
        text: '承受痛苦',
        icon: '😣',
        consequence: {
          hpCost: 0.3, // 失去30% HP
          karma: +15,
          reward: { gold: 200 },
          item: { id: 'jigsaw_key', name: '竖锯之钥', type: 'key', desc: '可以打开本章隐藏房间' },
          narrative: '你咬紧牙关，让铁丝刺入手臂。鲜血滴落，但你握住了钥匙。竖锯的声音响起："恭喜你，你值得活下去。"',
        },
      },
      {
        id: 'search',
        text: '限时搜索',
        icon: '🔍',
        consequence: {
          spd: -1, // 紧张导致速度下降
          narrative: '你在倒计时中疯狂搜索，最终从一堆残骸中找到了备用出口。但紧张的情绪还在影响你的行动。',
          reward: { exp: 40 },
        },
      },
      {
        id: 'refuse',
        text: '拒绝游戏',
        icon: '✋',
        consequence: {
          karma: +5,
          triggerCombat: 'ch5_trap_guardian',
          narrative: '"你选择不参与游戏？那就用自己的方式通过吧。"机关启动，一个铁面守卫缓缓走出暗处。',
        },
      },
    ],
  },
  
  // ── 第7章：指环王 ──
  ch7_ring_temptation: {
    id: 'ch7_ring_temptation',
    chapter: 7, floor: 4,
    title: '至尊魔戒的呢喃',
    desc: '你在战场残骸中发现了至尊魔戒的碎片复制品。它散发着诱人的力量波动。戴上它可以获得隐身能力，但代价是……',
    icon: '💍',
    choices: [
      {
        id: 'wear',
        text: '戴上魔戒',
        icon: '💍',
        consequence: {
          atk: +15, crt: +10,
          karma: -20,
          statusEffect: 'ring_corruption',
          narrative: '你将戒指套在手指上。瞬间，力量如潮水般涌来。但你似乎听到了来自远处的黑暗低语……',
          unlockEvent: 'ch7_dark_path',
        },
      },
      {
        id: 'resist',
        text: '抵抗诱惑',
        icon: '🛡',
        consequence: {
          karma: +20,
          def: +5,
          narrative: '你用尽全力将戒指扔进裂谷。"不，这种力量我不需要。"你感到内心前所未有的坚定。',
          reward: { exp: 100, rewardPoints: 50 },
        },
      },
    ],
  },
  
  // ── 第10章：黑客帝国 ──
  ch10_red_blue_pill: {
    id: 'ch10_red_blue_pill',
    chapter: 10, floor: 1,
    title: '红药丸还是蓝药丸',
    desc: '你面前放着两颗药丸。红色药丸让你看到恐怖片世界的真相——可能获得破格的力量，也可能失去理智。蓝色药丸让你保持现状。',
    icon: '💊',
    choices: [
      {
        id: 'red',
        text: '红色药丸',
        icon: '🔴',
        consequence: {
          atk: +20, def: +10, crt: +15,
          maxHp: -30,
          statusEffect: 'truth_awakened',
          karma: 0,
          narrative: '你吞下红色药丸。世界在你眼前剥离了一层，数据流和现实交错。你能看到敌人的"代码"——弱点、攻击模式，一切无所遁形。但这也意味着你更深地陷入了主神的游戏中。',
          unlockEvent: 'ch10_matrix_vision',
        },
      },
      {
        id: 'blue',
        text: '蓝色药丸',
        icon: '🔵',
        consequence: {
          maxHp: +50, def: +5,
          karma: +5,
          narrative: '你选择了蓝色药丸。有些真相，不知道也许更好。你感到一阵平静，身体似乎也更加坚韧了。',
          reward: { exp: 60 },
        },
      },
    ],
  },
  
  // ── 第12章：最终 ──
  ch12_final_choice: {
    id: 'ch12_final_choice',
    chapter: 12, floor: 5,
    title: '终极抉择',
    desc: '主神向你展示了一个选择：你可以选择回到现实世界，彻底脱离轮回。或者留在轮回空间，继续变强，直到有一天挑战主神本体。',
    icon: '⚡',
    choices: [
      {
        id: 'return',
        text: '回归现实',
        icon: '🌅',
        consequence: {
          karma: +30,
          ending: 'peaceful',
          narrative: '你选择了回归。光芒笼罩全身，你感到轮回空间在身后缓缓关闭。从此以后，你是一个活在人间的传说。',
        },
      },
      {
        id: 'challenge',
        text: '挑战主神',
        icon: '⚔',
        consequence: {
          atk: +30, def: +20, maxHp: +200,
          karma: +10,
          ending: 'warrior',
          triggerCombat: 'ch12_lord_god_avatar',
          narrative: '"很好。"主神的声音没有任何感情，"那就让我见证你进化的极限。"空间震颤，主神的投影凝聚成实体。这将是最终之战。',
        },
      },
      {
        id: 'transcend',
        text: '超越一切',
        icon: '✦',
        condition: { minGeneLock: 5, minKarma: 50 },
        consequence: {
          allStats: +50,
          karma: +50,
          ending: 'transcend',
          narrative: '你闭上双眼，不是选择逃离，也不是选择战斗——而是超越。你的意识扩散开来，与轮回空间融为一体。你不再是轮回者，你成为了新的规则。',
          unlockEvent: 'ch12_true_ending',
        },
      },
    ],
  },
};

// ── 抉择状态 ──
let _choiceHistory = []; // { choiceId, optionId, chapter, timestamp }
let _pendingChoices = new Set(); // 待触发的抉择

export function resetFateChoices() {
  _choiceHistory = [];
  _pendingChoices = new Set();
}

// ── 检查当前楼层是否有命运抉择 ──
export function checkFateChoice(chapter, floor) {
  const choices = Object.values(FATE_CHOICES).filter(c => 
    c.chapter === chapter && c.floor === floor
  );
  
  // 排除已做过的选择
  return choices.filter(c => !_choiceHistory.some(h => h.choiceId === c.id));
}

// ── 获取抉择定义 ──
export function getFateChoice(id) {
  return FATE_CHOICES[id] || null;
}

// ── 做出选择 ──
export function makeFateChoice(choiceId, optionId) {
  const choice = FATE_CHOICES[choiceId];
  if (!choice) return { success: false, reason: '无效的抉择' };
  
  const option = choice.choices.find(c => c.id === optionId);
  if (!option) return { success: false, reason: '无效的选项' };
  
  // 检查条件
  if (option.condition) {
    // 条件检查在调用方处理
  }
  
  // 记录选择
  _choiceHistory.push({
    choiceId,
    optionId,
    chapter: choice.chapter,
    timestamp: Date.now(),
  });
  
  eventBus.emit('fate:choice_made', {
    choice,
    option,
    consequence: option.consequence,
  });
  
  return {
    success: true,
    choice,
    option,
    consequence: option.consequence,
  };
}

// ── 应用选择后果到玩家 ──
export function applyFateConsequence(consequence, player) {
  const changes = [];
  
  if (consequence.atk) { player.atk += consequence.atk; changes.push(`ATK ${consequence.atk > 0 ? '+' : ''}${consequence.atk}`); }
  if (consequence.def) { player.def += consequence.def; changes.push(`DEF ${consequence.def > 0 ? '+' : ''}${consequence.def}`); }
  if (consequence.maxHp) { player.maxHp += consequence.maxHp; player.hp = Math.min(player.hp, player.maxHp); changes.push(`MaxHP ${consequence.maxHp > 0 ? '+' : ''}${consequence.maxHp}`); }
  if (consequence.spd) { player.spd = (player.spd || 5) + consequence.spd; changes.push(`SPD ${consequence.spd > 0 ? '+' : ''}${consequence.spd}`); }
  if (consequence.crt) { player.crt = (player.crt || 0) + consequence.crt; changes.push(`CRT ${consequence.crt > 0 ? '+' : ''}${consequence.crt}`); }
  if (consequence.maxMana) { player.maxMana = (player.maxMana || 0) + consequence.maxMana; changes.push(`MaxMana +${consequence.maxMana}`); }
  if (consequence.allStats) {
    player.atk += consequence.allStats;
    player.def += consequence.allStats;
    player.maxHp += consequence.allStats;
    player.spd = (player.spd || 5) + Math.floor(consequence.allStats / 5);
    changes.push(`全属性 +${consequence.allStats}`);
  }
  
  if (consequence.hpCost) {
    const cost = Math.floor(player.maxHp * consequence.hpCost);
    player.hp = Math.max(1, player.hp - cost);
    changes.push(`HP -${cost}`);
  }
  
  if (consequence.reward) {
    if (consequence.reward.gold) { player.gold = (player.gold || 0) + consequence.reward.gold; changes.push(`金币 +${consequence.reward.gold}`); }
    if (consequence.reward.exp) { player.exp = (player.exp || 0) + consequence.reward.exp; changes.push(`经验 +${consequence.reward.exp}`); }
    if (consequence.reward.rewardPoints) { player.rewardPoints = (player.rewardPoints || 0) + consequence.reward.rewardPoints; changes.push(`奖励点 +${consequence.reward.rewardPoints}`); }
  }
  
  return {
    changes,
    narrative: consequence.narrative,
    item: consequence.item || null,
    triggerCombat: consequence.triggerCombat || null,
    ending: consequence.ending || null,
    karma: consequence.karma || 0,
  };
}

// ── 获取选择历史 ──
export function getChoiceHistory() {
  return [..._choiceHistory];
}

// ── 检查是否做过特定选择 ──
export function hasChosenOption(choiceId, optionId) {
  return _choiceHistory.some(h => h.choiceId === choiceId && h.optionId === optionId);
}

// ── 获取统计 ──
export function getFateStats() {
  const total = Object.keys(FATE_CHOICES).length;
  const made = _choiceHistory.length;
  let totalKarma = 0;
  for (const h of _choiceHistory) {
    const choice = FATE_CHOICES[h.choiceId];
    const option = choice?.choices.find(c => c.id === h.optionId);
    totalKarma += option?.consequence?.karma || 0;
  }
  return { total, made, remaining: total - made, totalKarma };
}

// ── 渲染命运抉择面板 ──
export function renderFateChoiceUI(choice, player) {
  let html = `
    <div style="padding:0;max-width:500px;margin:0 auto;">
      <div style="text-align:center;margin-bottom:16px;">
        <div style="font-size:32px;margin-bottom:8px;">${choice.icon}</div>
        <h2 style="margin:0;color:#ffcc44;font-size:18px;letter-spacing:2px;">${choice.title}</h2>
      </div>
      <p style="color:#ccc;font-size:12px;line-height:1.8;text-align:center;margin:0 0 20px;
        padding:12px;background:#ffffff08;border-radius:8px;border-left:3px solid #ffcc4444;">
        ${choice.desc}
      </p>
      <div style="display:flex;flex-direction:column;gap:8px;">
  `;
  
  for (const option of choice.choices) {
    // 检查条件
    let disabled = false;
    let conditionText = '';
    if (option.condition) {
      if (option.condition.minGeneLock && (player.geneLock || 0) < option.condition.minGeneLock) {
        disabled = true;
        conditionText = `需要基因锁 ${option.condition.minGeneLock}`;
      }
      if (option.condition.minKarma) {
        conditionText = `需要业力 ${option.condition.minKarma}+`;
      }
    }
    
    // 后果预览
    const c = option.consequence;
    const previews = [];
    if (c.atk) previews.push(`ATK${c.atk > 0 ? '+' : ''}${c.atk}`);
    if (c.def) previews.push(`DEF${c.def > 0 ? '+' : ''}${c.def}`);
    if (c.maxHp) previews.push(`MaxHP${c.maxHp > 0 ? '+' : ''}${c.maxHp}`);
    if (c.spd) previews.push(`SPD${c.spd > 0 ? '+' : ''}${c.spd}`);
    if (c.crt) previews.push(`CRT${c.crt > 0 ? '+' : ''}${c.crt}`);
    if (c.karma > 0) previews.push(`业力+${c.karma}`);
    if (c.karma < 0) previews.push(`业力${c.karma}`);
    if (c.hpCost) previews.push(`HP -${Math.floor(c.hpCost * 100)}%`);
    if (c.item) previews.push(`获得: ${c.item.name}`);
    if (c.triggerCombat) previews.push('⚔ 战斗');
    if (c.allStats) previews.push(`全属性+${c.allStats}`);
    
    html += `
      <button class="fate-choice-btn" data-choice-id="${choice.id}" data-option-id="${option.id}"
        ${disabled ? 'disabled' : ''}
        style="padding:12px 16px;background:linear-gradient(135deg,#1a1a2e,#16213e);
        border:1px solid #ffffff22;border-radius:8px;cursor:${disabled ? 'not-allowed' : 'pointer'};
        text-align:left;transition:all 0.2s;opacity:${disabled ? '0.5' : '1'};
        font-family:inherit;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
          <span style="font-size:18px;">${option.icon}</span>
          <span style="color:#fff;font-size:14px;font-weight:bold;">${option.text}</span>
        </div>
        ${previews.length > 0 ? `
          <div style="display:flex;flex-wrap:wrap;gap:4px;margin-left:26px;">
            ${previews.map(p => `<span style="padding:1px 6px;background:#ffffff11;border-radius:3px;
              color:${p.includes('-') ? '#ff6644' : '#88cc88'};font-size:10px;">${p}</span>`).join('')}
          </div>
        ` : ''}
        ${conditionText ? `<div style="color:#ff6644;font-size:10px;margin-left:26px;margin-top:2px;">${conditionText}</div>` : ''}
      </button>
    `;
  }
  
  html += `
      </div>
    </div>
    <style>
      .fate-choice-btn:hover:not(:disabled) {
        border-color: #ffcc4444;
        background: linear-gradient(135deg, #1a1a3e, #1e2a4e);
        transform: translateX(4px);
      }
    </style>
  `;
  
  return html;
}

// ── 获取命运抉择面板（历史回顾用） ──
export function renderFateHistoryPanel() {
  if (_choiceHistory.length === 0) {
    return '<p style="color:#666;text-align:center;">尚无命运抉择记录</p>';
  }
  
  let html = '<div style="display:flex;flex-direction:column;gap:8px;">';
  for (const h of _choiceHistory) {
    const choice = FATE_CHOICES[h.choiceId];
    const option = choice?.choices.find(c => c.id === h.optionId);
    if (!choice || !option) continue;
    
    html += `
      <div style="padding:8px 12px;background:#ffffff08;border-radius:6px;border-left:3px solid #ffcc44;">
        <div style="color:#ffcc44;font-size:12px;font-weight:bold;">${choice.icon} ${choice.title}</div>
        <div style="color:#aaa;font-size:11px;margin-top:2px;">选择: ${option.icon} ${option.text}</div>
        <div style="color:#888;font-size:10px;margin-top:2px;font-style:italic;">${option.consequence.narrative?.slice(0, 60)}…</div>
      </div>
    `;
  }
  html += '</div>';
  return html;
}

// ── 序列化 ──
export function serializeFateChoices() {
  return { history: [..._choiceHistory] };
}

export function deserializeFateChoices(data) {
  if (data?.history) {
    _choiceHistory = [...data.history];
  }
}
