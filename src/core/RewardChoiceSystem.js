// ═══════════════════════════════════════════════════════════════
// 战后奖励选择系统 — 让每次战斗都有意义
// 灵感：魔塔 + Slay the Spire + 无限恐怖主神奖励
// ═══════════════════════════════════════════════════════════════



// ── 奖励池：按章节和战斗评级分层 ──
const REWARD_POOLS = {
  stat_boost: [
    { id: 'atk_small', name: '力量碎片', desc: '攻击力+2', icon: '⚔', color: '#ff6644', apply: (p) => { p.atk += 2; }, tier: 1 },
    { id: 'atk_medium', name: '力量结晶', desc: '攻击力+4', icon: '⚔', color: '#ff4422', apply: (p) => { p.atk += 4; }, tier: 2 },
    { id: 'def_small', name: '守护碎片', desc: '防御力+2', icon: '🛡', color: '#6688ff', apply: (p) => { p.def += 2; }, tier: 1 },
    { id: 'def_medium', name: '守护结晶', desc: '防御力+4', icon: '🛡', color: '#4466ff', apply: (p) => { p.def += 4; }, tier: 2 },
    { id: 'spd_small', name: '疾风碎片', desc: '速度+2', icon: '💨', color: '#44ffaa', apply: (p) => { p.spd += 2; }, tier: 1 },
    { id: 'crt_small', name: '锐眼碎片', desc: '暴击+3%', icon: '✦', color: '#ffcc44', apply: (p) => { p.crt += 3; }, tier: 1 },
    { id: 'hp_small', name: '生命碎片', desc: 'HP上限+15', icon: '❤', color: '#ff4488', apply: (p) => { p.maxHp += 15; p.hp += 15; }, tier: 1 },
    { id: 'hp_medium', name: '生命结晶', desc: 'HP上限+30', icon: '❤', color: '#ff2266', apply: (p) => { p.maxHp += 30; p.hp += 30; }, tier: 2 },
  ],
  
  consumable: [
    { id: 'heal_potion', name: '治愈药水', desc: '立即恢复40%HP', icon: '🧪', color: '#44ff88', apply: (p) => { p.hp = Math.min(p.maxHp, p.hp + Math.floor(p.maxHp * 0.4)); }, tier: 1 },
    { id: 'full_heal', name: '完全恢复', desc: '立即恢复100%HP', icon: '💊', color: '#44ffcc', apply: (p) => { p.hp = p.maxHp; }, tier: 3 },
    { id: 'stamina_restore', name: '精力药剂', desc: '恢复全部体力', icon: '⚡', color: '#ffaa44', apply: (p) => { p.stamina = p.maxStamina; }, tier: 1 },
    { id: 'gold_bonus', name: '藏宝图残页', desc: '获得150G', icon: '💰', color: '#ffcc44', apply: (p) => { p.gold += 150; }, tier: 1 },
    { id: 'exp_bonus', name: '经验圣水', desc: '获得100EXP', icon: '📘', color: '#aa88ff', apply: (p) => { p.exp += 100; }, tier: 1 },
  ],
  
  special: [
    { id: 'gene_charge', name: '基因锁充能', desc: '基因锁充能+30', icon: '🧬', color: '#ff6600', apply: (p) => { p.geneLockCharge = (p.geneLockCharge || 0) + 30; }, tier: 2 },
    { id: 'all_stats', name: '全属性提升', desc: 'ATK/DEF/SPD各+1', icon: '✨', color: '#ffffff', apply: (p) => { p.atk += 1; p.def += 1; p.spd += 1; }, tier: 2 },
    { id: 'crt_burst', name: '致命直觉', desc: '暴击+5%', icon: '🎯', color: '#ff8844', apply: (p) => { p.crt += 5; }, tier: 2 },
    { id: 'soul_shard', name: '灵魂碎片', desc: '获得3灵魂碎片(主神空间货币)', icon: '💎', color: '#cc44ff', apply: (p) => { p.soulShards = (p.soulShards || 0) + 3; }, tier: 3 },
    { id: 'karma_good', name: '善念之光', desc: '业力+5(影响结局)', icon: '☀', color: '#ffdd44', apply: (p) => { p.karma = (p.karma || 0) + 5; }, tier: 2 },
  ],
};

// ── 主神奖励（Boss战后独有）──
const LORD_GOD_REWARDS = [
  { id: 'bloodline_hint', name: '血统觉醒碎片', desc: '朝血统觉醒更近一步', icon: '🩸', color: '#ff2244', apply: (p) => { p.geneLockCharge = (p.geneLockCharge || 0) + 50; }, tier: 3 },
  { id: 'skill_scroll', name: '技能卷轴', desc: '随机习得一个新技能', icon: '📜', color: '#ffaa44', apply: (p) => { /* skill system handles this */ }, tier: 3 },
  { id: 'fortune', name: '主神的恩赐', desc: 'ATK+3 DEF+3 HP+20', icon: '👁', color: '#ff44ff', apply: (p) => { p.atk += 3; p.def += 3; p.maxHp += 20; p.hp += 20; }, tier: 3 },
];

/**
 * 生成战后奖励选项（3选1）
 * @param {string} combatGrade - 战斗评级 (SS/S/A/B/C/D)
 * @param {boolean} isBoss - 是否Boss战
 * @param {number} chapter - 当前章节
 * @param {Object} player - 玩家数据
 * @returns {Array} 3个奖励选项
 */
export function generateRewardChoices(combatGrade, isBoss, chapter, player) {
  const tierWeights = getTierWeights(combatGrade, isBoss);
  const pool = buildPool(chapter, player, isBoss);
  
  // 从池中按权重抽取3个不重复的奖励
  const choices = [];
  const usedIds = new Set();
  
  for (let i = 0; i < 3 && pool.length > 0; i++) {
    const picked = weightedPick(pool, tierWeights, usedIds);
    if (picked) {
      choices.push(picked);
      usedIds.add(picked.id);
    }
  }
  
  // 确保至少有3个选项
  while (choices.length < 3) {
    const fallback = REWARD_POOLS.stat_boost.find(r => !usedIds.has(r.id));
    if (fallback) { choices.push(fallback); usedIds.add(fallback.id); }
    else break;
  }
  
  return choices;
}

/**
 * 应用选中的奖励
 * @param {Object} reward - 奖励对象
 * @param {Object} player - 玩家数据
 * @returns {Object} 应用结果描述
 */
export function applyReward(reward, player) {
  try {
    reward.apply(player);
    return { success: true, text: `获得 ${reward.name}：${reward.desc}` };
  } catch (e) {
    return { success: false, text: '奖励应用失败' };
  }
}

/**
 * 渲染奖励选择面板HTML
 */
export function renderRewardChoicePanel(choices, onSelect) {
  const html = `
    <div style="
      max-width: 560px; padding: 24px; text-align: center;
      background: linear-gradient(180deg, rgba(10,10,25,0.98), rgba(5,5,15,0.98));
      border: 1px solid rgba(255,204,68,0.3);
      border-radius: 16px;
      box-shadow: 0 0 80px rgba(255,170,0,0.15);
    ">
      <p style="color:#ffcc44; font-size:12px; letter-spacing:6px; margin-bottom:4px;">⚔ 战 斗 奖 励 ⚔</p>
      <p style="color:#888; font-size:11px; margin-bottom:16px;">选择一项奖励</p>
      <div style="display:flex; gap:12px; justify-content:center; flex-wrap:wrap;">
        ${choices.map((c, i) => `
          <div class="reward-choice" data-idx="${i}" style="
            flex: 1; min-width: 140px; max-width: 170px;
            padding: 16px 12px;
            background: rgba(255,255,255,0.03);
            border: 1px solid ${c.color}33;
            border-radius: 12px;
            cursor: pointer;
            transition: all 0.2s;
          " onmouseenter="this.style.borderColor='${c.color}';this.style.background='rgba(255,255,255,0.06)';this.style.transform='translateY(-4px)'"
             onmouseleave="this.style.borderColor='${c.color}33';this.style.background='rgba(255,255,255,0.03)';this.style.transform='none'">
            <div style="font-size:32px; margin-bottom:8px;">${c.icon}</div>
            <div style="color:${c.color}; font-size:14px; font-weight:bold; margin-bottom:4px;">${c.name}</div>
            <div style="color:#999; font-size:11px; line-height:1.4;">${c.desc}</div>
            <div style="color:#555; font-size:9px; margin-top:8px; letter-spacing:2px;">
              ${'★'.repeat(c.tier)}${'☆'.repeat(3 - c.tier)}
            </div>
          </div>
        `).join('')}
      </div>
      <p style="color:#444; font-size:9px; margin-top:16px; letter-spacing:3px;">点击卡片选择</p>
    </div>
  `;
  return html;
}

// ── 内部辅助函数 ──

function getTierWeights(grade, isBoss) {
  if (isBoss) return { 1: 0.1, 2: 0.4, 3: 0.5 };
  switch (grade) {
    case 'SS': return { 1: 0.1, 2: 0.5, 3: 0.4 };
    case 'S':  return { 1: 0.2, 2: 0.5, 3: 0.3 };
    case 'A':  return { 1: 0.3, 2: 0.5, 3: 0.2 };
    case 'B':  return { 1: 0.5, 2: 0.4, 3: 0.1 };
    case 'C':  return { 1: 0.6, 2: 0.3, 3: 0.1 };
    default:   return { 1: 0.7, 2: 0.25, 3: 0.05 };
  }
}

function buildPool(chapter, player, isBoss) {
  let pool = [
    ...REWARD_POOLS.stat_boost,
    ...REWARD_POOLS.consumable,
    ...REWARD_POOLS.special,
  ];
  
  // Boss战加入主神奖励
  if (isBoss) {
    pool = [...pool, ...LORD_GOD_REWARDS];
  }
  
  // 根据章节过滤：前3章不出高级奖励
  if (chapter <= 3) {
    pool = pool.filter(r => r.tier <= 2);
  }
  
  // 如果HP已满，降低治愈奖励优先级（不移除，但降权）
  if (player.hp >= player.maxHp * 0.9) {
    pool = pool.map(r => r.id === 'heal_potion' || r.id === 'full_heal' 
      ? { ...r, _weight: 0.3 } 
      : r
    );
  }
  
  return pool;
}

function weightedPick(pool, tierWeights, usedIds) {
  const available = pool.filter(r => !usedIds.has(r.id));
  if (available.length === 0) return null;
  
  const totalWeight = available.reduce((sum, r) => {
    const tierW = tierWeights[r.tier] || 0.1;
    return sum + tierW * (r._weight || 1.0);
  }, 0);
  
  let roll = Math.random() * totalWeight;
  for (const r of available) {
    const tierW = tierWeights[r.tier] || 0.1;
    roll -= tierW * (r._weight || 1.0);
    if (roll <= 0) return r;
  }
  
  return available[available.length - 1];
}
