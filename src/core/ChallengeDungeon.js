// ═══════════════════════════════════════════════════════════════
// 挑战副本系统 — 主神空间可选战斗试炼
// ═══════════════════════════════════════════════════════════════
//
// 设计理念：
//   每个章节过关后，可在主神空间选择进入"挑战副本"。
//   副本提供更高难度的连续战斗，奖励稀有装备/材料/技能点。
//   副本有层数限制，每层敌人逐渐变强，增加战术深度。
//   死亡不会game over，只会弹出退出损失部分奖励。
//
// 类型：
//   1. 无尽塔 — 无限层数，挑战最高纪录
//   2. Boss速通 — 限时重打已击败Boss
//   3. 元素试炼 — 特定元素敌人，需要对应克制
//   4. 生存挑战 — 不回血持续战斗
// ═══════════════════════════════════════════════════════════════

import { eventBus } from './EventBus.js';
import { DAMAGE_TYPE } from './constants.js';

// ── 副本定义 ──
export const CHALLENGE_TYPES = {
  ENDLESS_TOWER: 'endless_tower',
  BOSS_RUSH: 'boss_rush',
  ELEMENTAL_TRIAL: 'elemental_trial',
  SURVIVAL: 'survival',
};

// ── 无尽塔层配置 ──
function generateTowerFloor(level, chapter) {
  const baseScale = 1 + (chapter - 1) * 0.15 + (level - 1) * 0.12;
  const names = [
    '试炼魔偶', '暗影行者', '深渊守卫', '灵魂猎手', '虚空使者',
    '混沌骑士', '血族贵公', '铁甲亡魂', '诅咒巫妖', '远古石像',
    '梦魇编织者', '时空裂隙', '堕落天使', '噬魂者', '毁灭先驱',
  ];
  const sprites = ['👹', '🦇', '⚔', '💀', '🌀', '🗡', '🩸', '🛡', '☠', '🗿', '🕷', '🌑', '😈', '👻', '🔥'];
  const elements = [null, 'fire', 'ice', 'poison', 'psychic', 'dark', 'holy'];
  
  const idx = (level - 1) % names.length;
  const elIdx = Math.floor(level / 3) % elements.length;
  const isElite = level % 5 === 0;
  const isMini = level % 10 === 0;

  const enemy = {
    name: isMini ? `🌟 ${names[idx]}·精英` : names[idx],
    sprite: sprites[idx],
    color: isElite ? '#ffaa22' : '#cc4444',
    hp: Math.floor((60 + level * 18) * baseScale),
    atk: Math.floor((10 + level * 3) * baseScale),
    def: Math.floor((3 + level * 1.5) * baseScale),
    spd: Math.floor((5 + level * 0.8) * baseScale),
    damageType: elements[elIdx],
    weaknesses: elements[elIdx] ? [getWeakness(elements[elIdx])] : [],
    rewards: {
      exp: Math.floor((20 + level * 8) * baseScale),
      gold: Math.floor((15 + level * 5) * baseScale),
      rewardPoints: isElite ? Math.floor(100 * baseScale) : 0,
    },
    traits: isElite ? [pickTrait(level)] : [],
  };

  if (isMini) {
    enemy.hp = Math.floor(enemy.hp * 2);
    enemy.atk = Math.floor(enemy.atk * 1.3);
    enemy.rewards.exp = Math.floor(enemy.rewards.exp * 2);
    enemy.rewards.gold = Math.floor(enemy.rewards.gold * 2);
    enemy.rewards.rewardPoints = Math.floor(200 * baseScale);
  }

  return enemy;
}

function getWeakness(element) {
  const chart = {
    fire: 'ice', ice: 'fire', poison: 'holy', 
    psychic: 'physical', dark: 'holy', holy: 'dark',
  };
  return chart[element] || 'physical';
}

function pickTrait(level) {
  const traits = ['enrage', 'armored', 'regen', 'swift', 'evasive', 'thorns', 'undying', 'vampiric'];
  return traits[(level * 7) % traits.length];
}

// ── Boss Rush 配置 ──
function generateBossRushList(chapter, defeatedBosses) {
  const bossPool = [
    { name: '暴君 T-002', hp: 250, atk: 28, def: 12, spd: 6, chapter: 1, bossId: 'tyrant_t002', sprite: '🧟', color: '#668844' },
    { name: '异形皇后', hp: 280, atk: 30, def: 10, spd: 10, chapter: 2, bossId: 'alien_queen', sprite: '👽', color: '#446644' },
    { name: '伽椰子', hp: 220, atk: 35, def: 8, spd: 14, chapter: 3, bossId: 'kayako', sprite: '👻', color: '#664488' },
    { name: '伊莫顿', hp: 300, atk: 32, def: 15, spd: 8, chapter: 4, bossId: 'imhotep', sprite: '🏺', color: '#886644' },
    { name: '张杰（引导者）', hp: 260, atk: 34, def: 12, spd: 12, chapter: 5, bossId: 'zhangjie', sprite: '📓', color: '#444488' },
    { name: '进化异形皇后', hp: 320, atk: 36, def: 14, spd: 11, chapter: 6, bossId: 'evolved_queen', sprite: '👾', color: '#884422' },
    { name: '复制体郑吒', hp: 280, atk: 38, def: 14, spd: 13, chapter: 7, bossId: 'clone_zhengzha', sprite: '郑', color: '#cc2222' },
    { name: '远古巨龙', hp: 380, atk: 40, def: 16, spd: 8, chapter: 8, bossId: 'ancient_dragon', sprite: '🐉', color: '#884422' },
    { name: '脑虫', hp: 320, atk: 32, def: 12, spd: 6, chapter: 9, bossId: 'brain_bug', sprite: '🧠', color: '#886644' },
    { name: '天神队先锋', hp: 400, atk: 45, def: 20, spd: 16, chapter: 10, bossId: 'divine_vanguard', sprite: '⚡', color: '#ffaa22' },
    { name: '弗莱迪', hp: 340, atk: 42, def: 14, spd: 18, chapter: 11, bossId: 'freddy', sprite: '🔪', color: '#cc4422' },
    { name: '复制体郑吒·终极', hp: 550, atk: 55, def: 26, spd: 18, chapter: 12, bossId: 'clone_zhengzha_ultimate', sprite: '郑', color: '#ff0000' },
  ];

  // 只返回已击败过的boss (或者低于当前章节的)
  return bossPool
    .filter(b => b.chapter <= chapter)
    .map(b => ({
      ...b,
      type: 'boss',
      rewards: {
        exp: Math.floor(150 + b.chapter * 30),
        gold: Math.floor(100 + b.chapter * 25),
        rewardPoints: Math.floor(200 + b.chapter * 50),
      },
    }));
}

// ── 元素试炼配置 ──
const ELEMENTAL_TRIALS = {
  fire: {
    name: '🔥 烈焰试炼',
    desc: '全部火属性敌人，冰系伤害+50%',
    element: 'fire',
    bonus: { ice: 1.5 },
    waves: 5,
  },
  ice: {
    name: '❄ 寒冰试炼',
    desc: '全部冰属性敌人，火系伤害+50%',
    element: 'ice',
    bonus: { fire: 1.5 },
    waves: 5,
  },
  poison: {
    name: '☠ 剧毒试炼',
    desc: '全部毒属性敌人，圣系伤害+50%',
    element: 'poison',
    bonus: { holy: 1.5 },
    waves: 5,
  },
  psychic: {
    name: '🧠 精神试炼',
    desc: '全部精神属性敌人，物理伤害+50%',
    element: 'psychic',
    bonus: { physical: 1.5 },
    waves: 5,
  },
  dark: {
    name: '🌑 暗影试炼',
    desc: '全部暗属性敌人，圣系伤害+50%',
    element: 'dark',
    bonus: { holy: 1.5 },
    waves: 5,
  },
};

// ── 生存挑战配置 ──
function generateSurvivalWaves(chapter) {
  const waves = [];
  for (let i = 1; i <= 15; i++) {
    const scale = 1 + (chapter - 1) * 0.1 + (i - 1) * 0.08;
    const count = i <= 5 ? 1 : i <= 10 ? 2 : 3;
    const wave = [];
    for (let j = 0; j < count; j++) {
      wave.push({
        name: `生存波次${i}-${j + 1}`,
        hp: Math.floor((40 + i * 12) * scale),
        atk: Math.floor((8 + i * 2.5) * scale),
        def: Math.floor((2 + i * 1) * scale),
        spd: Math.floor((5 + i * 0.5) * scale),
        rewards: { exp: Math.floor(15 * scale), gold: Math.floor(10 * scale) },
      });
    }
    waves.push(wave);
  }
  return waves;
}

// ═══════════════════════════════════════════
// 挑战状态管理器
// ═══════════════════════════════════════════
export class ChallengeDungeonState {
  constructor() {
    this.active = false;
    this.type = null;
    this.currentWave = 0;
    this.totalRewards = { exp: 0, gold: 0, rewardPoints: 0 };
    this.highestTowerFloor = {};  // { [chapter]: maxFloor }
    this.bossRushBests = {};     // { [chapter]: bestTime }
    this.survivalRecords = {};   // { [chapter]: maxWave }
  }

  startChallenge(type, chapter) {
    this.active = true;
    this.type = type;
    this.chapter = chapter;
    this.currentWave = 0;
    this.totalRewards = { exp: 0, gold: 0, rewardPoints: 0 };
    this.startTime = Date.now();
    eventBus.emit('challenge:start', { type, chapter });
    return this.getNextEnemy();
  }

  getNextEnemy() {
    this.currentWave++;
    switch (this.type) {
      case CHALLENGE_TYPES.ENDLESS_TOWER:
        return generateTowerFloor(this.currentWave, this.chapter);
      case CHALLENGE_TYPES.BOSS_RUSH:
        return null; // boss rush uses pre-generated list
      case CHALLENGE_TYPES.SURVIVAL:
        return null; // survival uses wave system
      default:
        return generateTowerFloor(this.currentWave, this.chapter);
    }
  }

  recordVictory(enemy) {
    if (enemy.rewards) {
      this.totalRewards.exp += enemy.rewards.exp || 0;
      this.totalRewards.gold += enemy.rewards.gold || 0;
      this.totalRewards.rewardPoints += enemy.rewards.rewardPoints || 0;
    }
    eventBus.emit('challenge:wave_clear', { wave: this.currentWave, type: this.type });
  }

  endChallenge(reason = 'complete') {
    this.active = false;
    const elapsed = Date.now() - (this.startTime || Date.now());
    
    // 记录最佳成绩
    if (this.type === CHALLENGE_TYPES.ENDLESS_TOWER) {
      const key = this.chapter;
      if (!this.highestTowerFloor[key] || this.currentWave > this.highestTowerFloor[key]) {
        this.highestTowerFloor[key] = this.currentWave;
      }
    }
    if (this.type === CHALLENGE_TYPES.SURVIVAL) {
      const key = this.chapter;
      if (!this.survivalRecords[key] || this.currentWave > this.survivalRecords[key]) {
        this.survivalRecords[key] = this.currentWave;
      }
    }

    // 失败只给70%奖励
    const mult = reason === 'defeat' ? 0.7 : 1.0;
    const finalRewards = {
      exp: Math.floor(this.totalRewards.exp * mult),
      gold: Math.floor(this.totalRewards.gold * mult),
      rewardPoints: Math.floor(this.totalRewards.rewardPoints * mult),
    };

    eventBus.emit('challenge:end', { 
      type: this.type, 
      wave: this.currentWave,
      rewards: finalRewards, 
      reason, 
      elapsed 
    });

    return finalRewards;
  }

  toJSON() {
    return {
      highestTowerFloor: { ...this.highestTowerFloor },
      bossRushBests: { ...this.bossRushBests },
      survivalRecords: { ...this.survivalRecords },
    };
  }

  fromJSON(data) {
    if (!data) return;
    this.highestTowerFloor = data.highestTowerFloor || {};
    this.bossRushBests = data.bossRushBests || {};
    this.survivalRecords = data.survivalRecords || {};
  }
}

// ── 全局实例 ──
export const challengeState = new ChallengeDungeonState();

// ── 获取可用副本列表 ──
export function getAvailableChallenges(chapter, defeatedBosses) {
  const challenges = [];
  
  // 无尽塔 — 总是可用
  challenges.push({
    type: CHALLENGE_TYPES.ENDLESS_TOWER,
    name: '🗼 无尽试炼塔',
    desc: '无限层数的连续战斗，挑战你的极限！',
    subDesc: `当前最高: ${challengeState.highestTowerFloor[chapter] || 0}层`,
    cost: 0,
    unlocked: true,
  });

  // Boss速通 — 击败过Boss后解锁
  const availBosses = generateBossRushList(chapter, defeatedBosses);
  if (availBosses.length >= 2) {
    challenges.push({
      type: CHALLENGE_TYPES.BOSS_RUSH,
      name: '👑 Boss速通',
      desc: `连续挑战${availBosses.length}个已击败Boss！`,
      subDesc: challengeState.bossRushBests[chapter] ? 
        `最快: ${Math.floor(challengeState.bossRushBests[chapter] / 1000)}秒` : '尚无记录',
      cost: 50,
      unlocked: true,
      bossList: availBosses,
    });
  }

  // 元素试炼 — 第3章后解锁
  if (chapter >= 3) {
    const trialKeys = Object.keys(ELEMENTAL_TRIALS).slice(0, Math.min(chapter - 1, 5));
    for (const key of trialKeys) {
      const trial = ELEMENTAL_TRIALS[key];
      challenges.push({
        type: CHALLENGE_TYPES.ELEMENTAL_TRIAL,
        name: trial.name,
        desc: trial.desc,
        subDesc: `${trial.waves}波敌人`,
        cost: 30,
        unlocked: true,
        trialConfig: trial,
      });
    }
  }

  // 生存挑战 — 第5章后解锁
  if (chapter >= 5) {
    challenges.push({
      type: CHALLENGE_TYPES.SURVIVAL,
      name: '💀 生存挑战',
      desc: '不回血的连续战斗！坚持到最后！',
      subDesc: `当前最高: ${challengeState.survivalRecords[chapter] || 0}波`,
      cost: 80,
      unlocked: true,
    });
  }

  return challenges;
}

// ── 生成元素试炼敌人 ──
export function generateTrialEnemy(trial, wave, chapter) {
  const names = {
    fire: ['火焰精灵', '熔岩巨人', '灼热蜥蜴', '凤凰幼雏', '火山元素'],
    ice: ['冰霜精灵', '寒冰巨人', '雪原狼王', '冰晶蜘蛛', '霜冻元素'],
    poison: ['毒蛇祭司', '瘟疫使者', '剧毒蝎王', '腐蚀史莱姆', '毒雾元素'],
    psychic: ['心灵行者', '幻象师', '脑波战士', '念力守卫', '精神元素'],
    dark: ['暗影刺客', '亡灵骑士', '噩梦编织', '虚空行者', '暗影元素'],
  };
  const sprites = {
    fire: ['🔥', '🌋', '🦎', '🐦', '💥'],
    ice: ['❄', '🏔', '🐺', '🕷', '💎'],
    poison: ['🐍', '☠', '🦂', '🟢', '💀'],
    psychic: ['🧠', '👁', '💫', '🛡', '🌀'],
    dark: ['🗡', '💀', '🕸', '🌑', '👤'],
  };
  
  const element = trial.element;
  const idx = (wave - 1) % 5;
  const scale = 1 + (chapter - 1) * 0.12 + (wave - 1) * 0.15;
  
  return {
    name: (names[element] || names.fire)[idx],
    sprite: (sprites[element] || sprites.fire)[idx],
    color: { fire: '#ff4422', ice: '#44aaff', poison: '#44cc22', psychic: '#aa44ff', dark: '#886688' }[element] || '#cc4444',
    hp: Math.floor((70 + wave * 20) * scale),
    atk: Math.floor((12 + wave * 3) * scale),
    def: Math.floor((4 + wave * 1.5) * scale),
    spd: Math.floor((6 + wave * 1) * scale),
    damageType: element,
    weaknesses: [getWeakness(element)],
    rewards: {
      exp: Math.floor((25 + wave * 10) * scale),
      gold: Math.floor((20 + wave * 8) * scale),
      rewardPoints: wave === trial.waves ? Math.floor(150 * scale) : 0,
    },
    traits: wave >= 4 ? [pickTrait(wave)] : [],
  };
}

// ── Boss Rush辅助 ──
export { generateBossRushList };
