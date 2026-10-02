// ═══════════════════════════════════════════════════════════════
// 二周目系统 (New Game+) — 通关后以更强姿态再次轮回
// ═══════════════════════════════════════════════════════════════
//
// 通关12章后解锁：保留部分属性，敌人全线增强，
// 解锁隐藏对话/线索/Boss变体，追加「真·终局」
//
// 周目数: 0=首次, 1=二周目, 2=三周目...
// 每周目 enemyScaleMult +0.3, 保留项递增

import { eventBus } from './EventBus.js';

// ── 周目继承规则 ──
const CARRY_OVER = {
  0: { // 一周目→二周目
    keepLevel: true,        // 保留等级
    keepLevelPct: 0.5,      // 等级保留50% (向上取整)
    keepGold: true,
    keepGoldPct: 0.3,       // 金币保留30%
    keepWeapon: false,       // 不保留装备
    keepBloodline: true,     // 保留血统
    keepGeneLock: true,      // 保留基因锁阶数
    keepGeneLockPct: 1.0,   // 100%
    keepTalentPoints: true,  // 保留天赋点(但重置分配)
    keepTalentPct: 0.5,     // 50%
    keepBestiary: true,      // 保留图鉴
    keepLore: true,          // 保留线索发现
    enemyScaleBonus: 0.3,   // 敌人额外+30%
    newRewards: ['title_survivor', 'unlock_nightmare'], // 解锁称号+噩梦难度
  },
  1: { // 二周目→三周目
    keepLevel: true,
    keepLevelPct: 0.6,
    keepGold: true,
    keepGoldPct: 0.4,
    keepWeapon: true,        // 保留武器
    keepBloodline: true,
    keepGeneLock: true,
    keepGeneLockPct: 1.0,
    keepTalentPoints: true,
    keepTalentPct: 0.7,
    keepBestiary: true,
    keepLore: true,
    enemyScaleBonus: 0.6,
    newRewards: ['title_veteran', 'unlock_true_ending'],
  },
  // 3周目+: 通用规则
  default: {
    keepLevel: true,
    keepLevelPct: 0.7,
    keepGold: true,
    keepGoldPct: 0.5,
    keepWeapon: true,
    keepBloodline: true,
    keepGeneLock: true,
    keepGeneLockPct: 1.0,
    keepTalentPoints: true,
    keepTalentPct: 0.8,
    keepBestiary: true,
    keepLore: true,
    enemyScaleBonus: 0.3,  // 每周目递增+30%
    newRewards: [],
  },
};

// ── 称号系统 ──
export const TITLES = {
  title_survivor:  { name: '轮回幸存者', icon: '🏆', desc: '完成首次通关', color: '#ffcc44' },
  title_veteran:   { name: '百战老兵',   icon: '⚔',  desc: '完成二周目',   color: '#ff6644' },
  title_legend:    { name: '传说轮回者', icon: '👑', desc: '完成三周目+',  color: '#ff2222' },
  title_speedrun:  { name: '疾风轮回',   icon: '⚡', desc: '60分钟内通关', color: '#44ffff' },
  title_pacifist:  { name: '不杀之道',   icon: '🕊',  desc: '零死亡通关',   color: '#44ff44' },
  title_collector: { name: '全知者',     icon: '📖', desc: '收集全部线索', color: '#aa88ff' },
};

// ── 状态 ──
class NewGamePlusState {
  constructor() {
    this.cycle = 0;           // 当前周目 (0=首次)
    this.totalClears = 0;     // 总通关次数
    this.unlockedTitles = []; // 已解锁称号
    this.activeTitle = null;  // 当前展示称号
    this.bestClearTime = null;// 最快通关时间(ms)
    this.totalPlayTime = 0;   // 总游戏时间(ms)
  }

  /** 获取当前周目的继承规则 */
  getCarryOverRules() {
    return CARRY_OVER[this.cycle] || CARRY_OVER.default;
  }

  /** 获取当前敌人额外缩放 */
  getEnemyScaleBonus() {
    if (this.cycle === 0) return 0;
    let bonus = 0;
    for (let i = 0; i < this.cycle; i++) {
      const rules = CARRY_OVER[i] || CARRY_OVER.default;
      bonus += rules.enemyScaleBonus;
    }
    return bonus;
  }

  /** 解锁称号 */
  unlockTitle(titleId) {
    if (!TITLES[titleId]) return false;
    if (this.unlockedTitles.includes(titleId)) return false;
    this.unlockedTitles.push(titleId);
    eventBus.emit('title:unlocked', { id: titleId, ...TITLES[titleId] });
    return true;
  }

  /** 设置展示称号 */
  setActiveTitle(titleId) {
    if (titleId && !this.unlockedTitles.includes(titleId)) return false;
    this.activeTitle = titleId;
    return true;
  }

  /** 获取展示称号信息 */
  getActiveTitleInfo() {
    if (!this.activeTitle) return null;
    return { id: this.activeTitle, ...TITLES[this.activeTitle] };
  }

  /**
   * 通关时调用 — 计算继承数据
   * @param {Object} playerState - 当前玩家完整状态
   * @param {Object} gameStats - 游戏统计(时间/死亡等)
   * @returns {Object} 二周目初始数据
   */
  calculateNewGamePlus(playerState, gameStats) {
    const rules = this.getCarryOverRules();
    const result = {
      cycle: this.cycle + 1,
      // 等级继承
      level: rules.keepLevel
        ? Math.max(1, Math.ceil(playerState.level * rules.keepLevelPct))
        : 1,
      // 金币继承
      gold: rules.keepGold
        ? Math.floor(playerState.gold * rules.keepGoldPct)
        : 0,
      // 血统继承
      bloodline: rules.keepBloodline ? playerState.activeBloodline : null,
      // 基因锁继承
      geneLock: rules.keepGeneLock
        ? Math.floor(playerState.geneLock * rules.keepGeneLockPct)
        : 0,
      // 天赋点继承
      talentPoints: rules.keepTalentPoints
        ? Math.max(0, Math.floor((playerState.talentPoints || 0) * rules.keepTalentPct))
        : 0,
      // 武器继承
      weapon: rules.keepWeapon ? playerState.weapon : null,
      // 新解锁奖励
      rewards: rules.newRewards || [],
      // 保留图鉴/线索标记
      keepBestiary: !!rules.keepBestiary,
      keepLore: !!rules.keepLore,
      // 敌人增强倍率
      enemyScaleBonus: this.getEnemyScaleBonus() + rules.enemyScaleBonus,
    };

    // 基于等级计算继承属性
    const baseHp = 100, baseAtk = 10, baseDef = 5;
    const lvl = result.level;
    result.hp = baseHp + (lvl - 1) * 12;
    result.maxHp = result.hp;
    result.atk = baseAtk + (lvl - 1) * 2;
    result.def = baseDef + (lvl - 1) * 1;
    result.exp = 0;
    result.expToNext = 20 + (lvl - 1) * 15;

    return result;
  }

  /**
   * 执行通关流程
   */
  completeClear(playerState, gameStats) {
    this.totalClears++;
    if (gameStats?.totalTime) {
      this.totalPlayTime += gameStats.totalTime;
      if (!this.bestClearTime || gameStats.totalTime < this.bestClearTime) {
        this.bestClearTime = gameStats.totalTime;
      }
    }

    // 解锁称号
    const rules = this.getCarryOverRules();
    for (const r of (rules.newRewards || [])) {
      if (r.startsWith('title_')) this.unlockTitle(r);
    }

    // 速通称号
    if (gameStats?.totalTime && gameStats.totalTime < 60 * 60 * 1000) {
      this.unlockTitle('title_speedrun');
    }
    // 零死亡称号
    if (gameStats?.deathCount === 0) {
      this.unlockTitle('title_pacifist');
    }

    // 三周目+称号
    if (this.cycle >= 2) {
      this.unlockTitle('title_legend');
    }

    const ngPlusData = this.calculateNewGamePlus(playerState, gameStats);
    this.cycle++;
    return ngPlusData;
  }

  toJSON() {
    return {
      cycle: this.cycle,
      totalClears: this.totalClears,
      unlockedTitles: [...this.unlockedTitles],
      activeTitle: this.activeTitle,
      bestClearTime: this.bestClearTime,
      totalPlayTime: this.totalPlayTime,
    };
  }

  fromJSON(data) {
    if (!data) { this.cycle = 0; this.totalClears = 0; this.unlockedTitles = []; this.activeTitle = null; this.bestClearTime = null; this.totalPlayTime = 0; return; }
    this.cycle = data.cycle || 0;
    this.totalClears = data.totalClears || 0;
    this.unlockedTitles = data.unlockedTitles || [];
    this.activeTitle = data.activeTitle || null;
    this.bestClearTime = data.bestClearTime || null;
    this.totalPlayTime = data.totalPlayTime || 0;
  }
}

export const ngPlusState = new NewGamePlusState();

/**
 * 格式化通关结算面板
 */

// ═══════════════════════════════════════════════════════════════
// 周目变异器 — 每次轮回的独特游戏体验修改
// ═══════════════════════════════════════════════════════════════
export const NG_MUTATORS = {
  // 二周目变异器
  speed_demon: { 
    name: '疾风模式', icon: '⚡', 
    desc: '所有敌人速度+30%, 但掉落经验+20%',
    apply: (enemy) => { enemy.spd = Math.ceil((enemy.spd || 5) * 1.3); if (enemy.rewards?.exp) enemy.rewards.exp = Math.floor(enemy.rewards.exp * 1.2); }
  },
  glass_cannon: { 
    name: '玻璃大炮', icon: '💥', 
    desc: '敌人攻击+50%, HP-30%',
    apply: (enemy) => { enemy.atk = Math.ceil(enemy.atk * 1.5); enemy.hp = Math.floor(enemy.hp * 0.7); }
  },
  iron_fortress: { 
    name: '铁壁堡垒', icon: '🛡', 
    desc: '敌人防御+80%, 但攻击-20%',
    apply: (enemy) => { enemy.def = Math.ceil(enemy.def * 1.8); enemy.atk = Math.floor(enemy.atk * 0.8); }
  },
  elite_invasion: { 
    name: '精英入侵', icon: '👑', 
    desc: '精英词缀出现率翻倍',
    // Applied in DifficultyScaler, not per-enemy
  },
  cursed_gold: { 
    name: '诅咒黄金', icon: '💰', 
    desc: '金币掉落+100%, 但每次拾取扣1HP',
  },
  phantom_pain: {
    name: '幻痛', icon: '💀',
    desc: '战斗受伤后有10%几率额外受到等量伤害',
  },
};

/**
 * 获取当前周目激活的变异器列表
 * 每个新周目随机激活 1-2 个变异器
 */
export function getActiveMutators() {
  if (ngPlusState.cycle <= 0) return [];
  // 使用周目数作为种子，保证同一周目相同变异器
  const seed = ngPlusState.cycle * 31;
  const keys = Object.keys(NG_MUTATORS);
  const count = Math.min(ngPlusState.cycle, 2); // 最多2个
  const selected = [];
  for (let i = 0; i < count; i++) {
    const idx = (seed + i * 17) % keys.length;
    if (!selected.includes(keys[idx])) selected.push(keys[idx]);
  }
  return selected.map(k => ({ id: k, ...NG_MUTATORS[k] }));
}

export function formatClearScreen(ngPlusData, gameStats) {
  // 显示下一周目变异器
  const mutators = getActiveMutators();
  const mutatorHtml = mutators.length > 0 
    ? '<div style="margin-top:16px;"><p style="color:#ff8844;font-size:12px;letter-spacing:2px;margin-bottom:8px;">🎲 下一周目变异</p>' +
      mutators.map(m => '<div style="display:inline-block;background:rgba(255,136,68,0.1);border:1px solid rgba(255,136,68,0.3);border-radius:6px;padding:4px 10px;margin:2px;"><span style="font-size:14px;">' + m.icon + '</span> <span style="color:#ffaa44;font-size:12px;">' + m.name + '</span> <span style="color:#888;font-size:10px;">— ' + m.desc + '</span></div>').join('') +
      '</div>'
    : '';
  const rules = CARRY_OVER[ngPlusState.cycle - 1] || CARRY_OVER.default;
  const timeStr = gameStats?.totalTime
    ? `${Math.floor(gameStats.totalTime / 60000)}分${Math.floor((gameStats.totalTime % 60000) / 1000)}秒`
    : '未记录';

  let html = `
    <div style="text-align:center;margin-bottom:20px;">
      <h2 style="color:#ffcc44;letter-spacing:6px;margin-bottom:8px;">🏆 轮回完结</h2>
      <p style="color:#888;font-size:13px;">第 ${ngPlusState.totalClears} 次通关 · 用时 ${timeStr}</p>
      ${gameStats?.deathCount === 0 ? '<p style="color:#44ff44;font-size:12px;">🕊 零死亡通关！</p>' : ''}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">
      <div style="background:rgba(255,255,255,0.03);border:1px solid #333;border-radius:8px;padding:12px;">
        <h3 style="color:#44aaff;font-size:13px;margin-bottom:8px;">📊 本次统计</h3>
        <p style="color:#aaa;font-size:12px;line-height:1.8;">
          击杀: ${gameStats?.kills || 0}<br>
          死亡: ${gameStats?.deathCount || 0}<br>
          最高伤害: ${gameStats?.maxDamage || 0}<br>
          金币: ${gameStats?.goldEarned || 0}G
        </p>
      </div>
      <div style="background:rgba(255,255,255,0.03);border:1px solid #333;border-radius:8px;padding:12px;">
        <h3 style="color:#ffaa44;font-size:13px;margin-bottom:8px;">🔄 二周目继承</h3>
        <p style="color:#aaa;font-size:12px;line-height:1.8;">
          等级: Lv.${ngPlusData.level}<br>
          金币: ${ngPlusData.gold}G<br>
          ${ngPlusData.bloodline ? '血统: 保留<br>' : ''}
          ${ngPlusData.geneLock > 0 ? '基因锁: ' + ngPlusData.geneLock + '阶<br>' : ''}
          敌人强化: +${Math.floor(ngPlusData.enemyScaleBonus * 100)}%
        </p>
      </div>
    </div>`;

  // 新解锁称号
  const newTitles = (ngPlusData.rewards || []).filter(r => r.startsWith('title_') && TITLES[r]);
  if (newTitles.length > 0) {
    html += '<div style="text-align:center;margin-bottom:16px;">';
    for (const t of newTitles) {
      const title = TITLES[t];
      html += `<p style="color:${title.color};font-size:14px;">${title.icon} 解锁称号: ${title.name}</p>`;
    }
    html += '</div>';
  }

  return html;
}

/**
 * 格式化周目信息（状态面板用）
 */
export function formatCycleInfo() {
  if (ngPlusState.cycle === 0 && ngPlusState.totalClears === 0) return '';
  
  const titleInfo = ngPlusState.getActiveTitleInfo();
  const scaleBonus = ngPlusState.getEnemyScaleBonus();

  let html = `<div style="margin-top:8px;padding:8px;background:rgba(255,204,68,0.05);border:1px solid rgba(255,204,68,0.2);border-radius:6px;">`;
  html += `<span style="color:#ffcc44;font-size:12px;">🔄 ${ngPlusState.cycle > 0 ? '第' + (ngPlusState.cycle + 1) + '周目' : '首次轮回'}</span>`;
  if (titleInfo) {
    html += ` <span style="color:${titleInfo.color};font-size:11px;">${titleInfo.icon} ${titleInfo.name}</span>`;
  }
  if (scaleBonus > 0) {
    html += `<br><span style="color:#ff6644;font-size:10px;">敌人强化: +${Math.floor(scaleBonus * 100)}%</span>`;
  }
  html += `<br><span style="color:#666;font-size:10px;">通关: ${ngPlusState.totalClears}次`;
  if (ngPlusState.bestClearTime) {
    html += ` · 最快: ${Math.floor(ngPlusState.bestClearTime / 60000)}分`;
  }
  html += `</span></div>`;
  return html;
}
