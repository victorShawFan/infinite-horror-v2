// ═══════════════════════════════════════════════════════════════
// 星级挑战系统 — 每层可选挑战目标 + 星级奖励
// ═══════════════════════════════════════════════════════════════
//
// 每层有3个可选挑战目标（类似手游关卡星级）：
// ★ 基础：完成本层（击败所有敌人或到达出口）
// ★★ 进阶：满足特定条件（限时/无伤/技能/连锁等）
// ★★★ 大师：满足严苛条件（极限挑战）
//
// 累计星数解锁额外奖励（装备/技能/遗物/金币）
// ═══════════════════════════════════════════════════════════════

import { eventBus } from './EventBus.js';

// ── 挑战类型 ──
export const CHALLENGE_TYPES = {
  CLEAR:        { id: 'clear',       name: '通关',     desc: '完成本层', icon: '✓' },
  NO_DAMAGE:    { id: 'no_damage',   name: '无伤通关',  desc: '本层不受任何伤害', icon: '💎' },
  TIME_LIMIT:   { id: 'time_limit',  name: '限时通关',  desc: '在指定回合内完成', icon: '⏱' },
  ALL_ENEMIES:  { id: 'all_enemies', name: '全歼',     desc: '击败本层所有敌人', icon: '⚔' },
  NO_ITEMS:     { id: 'no_items',    name: '空手通关',  desc: '不使用任何消耗品', icon: '🤚' },
  CHAIN_3:      { id: 'chain_3',     name: '连锁大师',  desc: '触发3次以上连锁反应', icon: '🔗' },
  CRIT_5:       { id: 'crit_5',      name: '暴击风暴',  desc: '打出5次以上暴击', icon: '⚡' },
  DEFEND_NONE:  { id: 'defend_none', name: '全攻无守',  desc: '不使用防御行动', icon: '🗡' },
  SKILL_MASTER: { id: 'skill_master',name: '技能大师',  desc: '使用3种以上不同技能', icon: '✨' },
  FIRST_STRIKE: { id: 'first_strike',name: '先发制人',  desc: '在敌人攻击前击败它', icon: '🎯' },
  LOW_HP_CLEAR: { id: 'low_hp_clear',name: '红血通关',  desc: 'HP低于30%时击败最后一个敌人', icon: '❤' },
  PERFECT_BOSS: { id: 'perfect_boss',name: '完美Boss战', desc: '无伤击败Boss', icon: '👑' },
};

// ── 根据章节和楼层生成挑战 ──
export function generateFloorChallenges(chapter, floorIndex, isBossFloor = false) {
  const challenges = [];
  
  // ★ 基础挑战（总是有）
  challenges.push({
    star: 1,
    ...CHALLENGE_TYPES.CLEAR,
    completed: false,
  });
  
  // ★★ 进阶挑战（根据章节和楼层选择）
  const advancedPool = isBossFloor 
    ? [CHALLENGE_TYPES.NO_DAMAGE, CHALLENGE_TYPES.TIME_LIMIT, CHALLENGE_TYPES.SKILL_MASTER]
    : [CHALLENGE_TYPES.ALL_ENEMIES, CHALLENGE_TYPES.TIME_LIMIT, CHALLENGE_TYPES.CRIT_5, 
       CHALLENGE_TYPES.CHAIN_3, CHALLENGE_TYPES.NO_ITEMS];
  
  const advIdx = (chapter * 7 + floorIndex * 3) % advancedPool.length;
  const advChallenge = advancedPool[advIdx];
  
  let advParams = {};
  if (advChallenge.id === 'time_limit') {
    advParams.maxRounds = Math.max(5, 15 - Math.floor(chapter / 3));
  }
  
  challenges.push({
    star: 2,
    ...advChallenge,
    params: advParams,
    completed: false,
  });
  
  // ★★★ 大师挑战
  const masterPool = isBossFloor
    ? [CHALLENGE_TYPES.PERFECT_BOSS, CHALLENGE_TYPES.FIRST_STRIKE]
    : [CHALLENGE_TYPES.NO_DAMAGE, CHALLENGE_TYPES.DEFEND_NONE, CHALLENGE_TYPES.LOW_HP_CLEAR,
       CHALLENGE_TYPES.SKILL_MASTER];
  
  const masterIdx = (chapter * 11 + floorIndex * 5) % masterPool.length;
  challenges.push({
    star: 3,
    ...masterPool[masterIdx],
    completed: false,
  });
  
  return challenges;
}

// ── 评估挑战完成 ──
export function evaluateChallenges(challenges, battleResult) {
  if (!challenges || !battleResult) return challenges;
  
  const r = battleResult;
  
  for (const ch of challenges) {
    switch (ch.id) {
      case 'clear':
        ch.completed = r.victory === true;
        break;
      case 'no_damage':
        ch.completed = r.victory && (r.totalDamageTaken || 0) === 0;
        break;
      case 'time_limit':
        ch.completed = r.victory && (r.rounds || 999) <= (ch.params?.maxRounds || 10);
        break;
      case 'all_enemies':
        ch.completed = r.victory && r.allEnemiesCleared !== false;
        break;
      case 'no_items':
        ch.completed = r.victory && (r.itemsUsed || 0) === 0;
        break;
      case 'chain_3':
        ch.completed = r.victory && (r.chainReactions || 0) >= 3;
        break;
      case 'crit_5':
        ch.completed = r.victory && (r.critCount || 0) >= 5;
        break;
      case 'defend_none':
        ch.completed = r.victory && (r.defendActions || 0) === 0;
        break;
      case 'skill_master':
        ch.completed = r.victory && (r.uniqueSkillsUsed || 0) >= 3;
        break;
      case 'first_strike':
        ch.completed = r.victory && (r.rounds || 999) <= 1;
        break;
      case 'low_hp_clear':
        ch.completed = r.victory && r.finalHpPercent !== undefined && r.finalHpPercent < 0.3;
        break;
      case 'perfect_boss':
        ch.completed = r.victory && r._isBoss && (r.totalDamageTaken || 0) === 0;
        break;
    }
  }
  
  return challenges;
}

// ── 计算星数 ──
export function countStars(challenges) {
  return challenges.filter(c => c.completed).length;
}

// ── 星数奖励里程碑 ──
export const STAR_MILESTONES = [
  { stars: 5,   reward: { gold: 200 },           desc: '5星: 200金币' },
  { stars: 15,  reward: { gold: 500, exp: 100 }, desc: '15星: 500金币 + 100经验' },
  { stars: 30,  reward: { gold: 1000, rewardPoints: 100 }, desc: '30星: 1000金币 + 100奖励点' },
  { stars: 50,  reward: { gold: 2000, rewardPoints: 200, item: 'rare_gem' }, desc: '50星: 大奖' },
  { stars: 80,  reward: { gold: 3000, rewardPoints: 500 }, desc: '80星: 丰厚奖励' },
  { stars: 120, reward: { gold: 5000, rewardPoints: 1000 }, desc: '120星: 终极奖励' },
  { stars: 180, reward: { gold: 10000, rewardPoints: 2000, item: 'legendary_relic' }, desc: '180星: 传说遗物' },
  { stars: 216, reward: { gold: 20000, rewardPoints: 5000, title: '完美主义者' }, desc: '全星收集: 完美主义者称号' },
];

// ── 状态管理 ──
let _starData = {}; // { "ch1_f0": { challenges: [...], stars: 0 } }
let _totalStars = 0;
let _claimedMilestones = new Set();

export function initStarChallenge() {
  _starData = {};
  _totalStars = 0;
  _claimedMilestones = new Set();
}

export function getFloorStarData(chapter, floorIndex) {
  const key = `ch${chapter}_f${floorIndex}`;
  return _starData[key] || null;
}

export function setFloorStarData(chapter, floorIndex, challenges) {
  const key = `ch${chapter}_f${floorIndex}`;
  const stars = countStars(challenges);
  _starData[key] = { challenges, stars };
  _recalcTotalStars();
  
  if (stars > 0) {
    eventBus.emit('star:earned', { chapter, floor: floorIndex, stars, total: _totalStars });
  }
}

function _recalcTotalStars() {
  _totalStars = Object.values(_starData).reduce((sum, d) => sum + (d.stars || 0), 0);
}

export function getTotalStars() { return _totalStars; }

// ── 检查可领取的里程碑 ──
export function getAvailableMilestones() {
  return STAR_MILESTONES.filter(m => _totalStars >= m.stars && !_claimedMilestones.has(m.stars));
}

export function claimMilestone(stars) {
  const m = STAR_MILESTONES.find(s => s.stars === stars);
  if (!m || _totalStars < stars || _claimedMilestones.has(stars)) return null;
  _claimedMilestones.add(stars);
  return m.reward;
}

// ── 渲染楼层挑战HUD ──
export function renderFloorChallengeHUD(challenges) {
  if (!challenges || challenges.length === 0) return '';
  
  return `
    <div style="padding:6px 10px;background:rgba(0,0,0,0.6);border-radius:6px;
      display:flex;gap:8px;align-items:center;font-size:10px;">
      ${challenges.map(c => `
        <span style="color:${c.completed ? '#ffcc44' : '#444'};
          text-decoration:${c.completed ? 'none' : 'none'};"
          title="${c.desc}">
          ${c.completed ? '★' : '☆'} ${c.icon}
        </span>
      `).join('')}
      <span style="color:#888;font-size:9px;">${countStars(challenges)}/3</span>
    </div>
  `;
}

// ── 渲染星数总览 ──
export function renderStarOverview() {
  const milestones = STAR_MILESTONES;
  let html = `
    <div style="padding:12px;">
      <div style="text-align:center;margin-bottom:12px;">
        <span style="color:#ffcc44;font-size:24px;">★</span>
        <span style="color:#ffcc44;font-size:20px;font-weight:bold;margin-left:4px;">${_totalStars}</span>
        <span style="color:#888;font-size:12px;margin-left:4px;">/ 216</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:6px;">
  `;
  
  for (const m of milestones) {
    const claimed = _claimedMilestones.has(m.stars);
    const available = _totalStars >= m.stars && !claimed;
    const locked = _totalStars < m.stars;
    
    html += `
      <div style="padding:6px 10px;background:${available ? '#ffcc4411' : '#ffffff06'};
        border-radius:6px;display:flex;justify-content:space-between;align-items:center;
        border:1px solid ${available ? '#ffcc4433' : 'transparent'};">
        <div>
          <span style="color:${claimed ? '#44cc88' : locked ? '#444' : '#ffcc44'};font-size:11px;">
            ${claimed ? '✓' : '★'} ${m.stars}星
          </span>
          <span style="color:#888;font-size:10px;margin-left:8px;">${m.desc}</span>
        </div>
        ${available ? '<span style="color:#ffcc44;font-size:10px;cursor:pointer;">领取</span>' : ''}
        ${claimed ? '<span style="color:#44cc88;font-size:10px;">已领取</span>' : ''}
      </div>
    `;
  }
  
  html += `</div></div>`;
  return html;
}

// ── 序列化 ──
export function serializeStarChallenge() {
  return {
    data: _starData,
    claimed: [..._claimedMilestones],
  };
}

export function deserializeStarChallenge(saved) {
  if (saved?.data) _starData = saved.data;
  if (saved?.claimed) _claimedMilestones = new Set(saved.claimed);
  _recalcTotalStars();
}
