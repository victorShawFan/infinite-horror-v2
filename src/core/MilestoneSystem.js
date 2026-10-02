// ═══════════════════════════════════════════════════════════════
// 里程碑/成就系统 — 给予玩家成就感和进度反馈
// ═══════════════════════════════════════════════════════════════

import { eventBus } from './EventBus.js';

export const MILESTONES = {
  // ── 战斗成就 ──
  first_blood:      { name: '初战告捷', desc: '击败第一个敌人', icon: '⚔', color: '#ff4444' },
  enemy_10:         { name: '猎手', desc: '累计击败10个敌人', icon: '🎯', color: '#ff6644' },
  enemy_50:         { name: '屠戮者', desc: '累计击败50个敌人', icon: '💀', color: '#ff4488' },
  enemy_100:        { name: '死神代行者', desc: '累计击败100个敌人', icon: '☠', color: '#ff2266' },
  first_boss:       { name: '巨兽陨落', desc: '击败第一个Boss', icon: '👑', color: '#ffaa00' },
  all_bosses:       { name: '主神认可', desc: '击败全部13个Boss', icon: '🏆', color: '#ffdd44' },
  
  // ── 成长成就 ──
  level_5:          { name: '初窥门径', desc: '达到5级', icon: '⬆', color: '#44ff88' },
  level_10:         { name: '身经百战', desc: '达到10级', icon: '⬆', color: '#44ffaa' },
  gene_lock_1:      { name: '基因觉醒', desc: '开启第一阶基因锁', icon: '🧬', color: '#ff6600' },
  gene_lock_4:      { name: '入微之境', desc: '基因锁达到第四阶', icon: '🧬', color: '#ff8800' },
  first_bloodline:  { name: '血脉传承', desc: '觉醒第一个血统', icon: '🩸', color: '#ff4488' },
  first_talent:     { name: '天赋异禀', desc: '分配第一个天赋点', icon: '🌟', color: '#ffdd44' },
  talent_max:       { name: '登峰造极', desc: '任一天赋路线满10级', icon: '★', color: '#ffdd44' },
  
  // ── 装备成就 ──
  first_enhance:    { name: '锻造新手', desc: '首次强化装备', icon: '🔨', color: '#ff6644' },
  enhance_10:       { name: '神匠', desc: '装备强化至+10', icon: '🔨', color: '#ffaa00' },
  first_gem:        { name: '宝石收藏', desc: '获得第一颗宝石', icon: '💎', color: '#aa44ff' },
  legendary_drop:   { name: '天降神兵', desc: '获得传说级装备', icon: '⚔', color: '#ffaa00' },
  
  // ── 探索成就 ──
  chapter_1:        { name: '生化危机', desc: '完成第一章', icon: '📖', color: '#4488ff' },
  chapter_6:        { name: '轮回半程', desc: '完成第六章', icon: '📖', color: '#4488ff' },
  chapter_12:       { name: '轮回终焉', desc: '完成全十二章', icon: '📖', color: '#ffdd44' },
  
  // ── 特殊成就 ──
  zero_damage:      { name: '毫发无损', desc: '在一场Boss战中未受伤', icon: '🛡', color: '#44ffcc' },
  comeback:         { name: '绝地反击', desc: '在HP<10%时击败Boss', icon: '🔥', color: '#ff4444' },
  element_master:   { name: '元素大师', desc: '触发3种不同的元素共鸣', icon: '✦', color: '#ffcc44' },
  collector:        { name: '收藏家', desc: '背包中同时拥有5件装备', icon: '📦', color: '#aa88ff' },
};

// ── 状态管理 ──
export class MilestoneTracker {
  constructor() {
    this.unlocked = new Set();
    this.pendingNotifications = [];
    this.resonanceTypes = new Set();
  }
  
  check(milestoneId) {
    if (this.unlocked.has(milestoneId)) return false;
    const milestone = MILESTONES[milestoneId];
    if (!milestone) return false;
    
    this.unlocked.add(milestoneId);
    this.pendingNotifications.push(milestone);
    eventBus.emit('milestone:unlocked', { id: milestoneId, ...milestone });
    return true;
  }
  
  getNextNotification() {
    return this.pendingNotifications.shift() || null;
  }
  
  hasNotifications() {
    return this.pendingNotifications.length > 0;
  }
  
  getUnlockedCount() {
    return this.unlocked.size;
  }
  
  getTotalCount() {
    return Object.keys(MILESTONES).length;
  }
  
  toJSON() {
    return { unlocked: [...this.unlocked], resonanceTypes: [...this.resonanceTypes] };
  }
  
  fromJSON(data) {
    this.unlocked = new Set(data?.unlocked || []);
    this.resonanceTypes = new Set(data?.resonanceTypes || []);
  }
}

// ── 全局检测函数（在关键时刻调用） ──
export function checkCombatMilestones(tracker, stats, enemy, result) {
  // First blood
  if (stats.enemiesKilled === 1) tracker.check('first_blood');
  if (stats.enemiesKilled >= 10) tracker.check('enemy_10');
  if (stats.enemiesKilled >= 50) tracker.check('enemy_50');
  if (stats.enemiesKilled >= 100) tracker.check('enemy_100');
  
  // Boss kills
  if (enemy.type === 'boss' || enemy.bossId) {
    tracker.check('first_boss');
    
    // Zero damage boss
    if (result.victory && result.log) {
      const tookDamage = result.log.some(l => l.type === 'enemy_attack' && l.text?.includes('→ 郑吒'));
      if (!tookDamage) tracker.check('zero_damage');
    }
  }
  
  // Comeback
  if (result.victory && enemy.bossId) {
    const playerHpAfter = result.log?.find(l => l.type === 'victory')?.text ? true : false;
    // Check low HP victory from log
  }
}

export function checkGrowthMilestones(tracker, player) {
  if (player.level >= 5) tracker.check('level_5');
  if (player.level >= 10) tracker.check('level_10');
  if (player.geneLock >= 1) tracker.check('gene_lock_1');
  if (player.geneLock >= 4) tracker.check('gene_lock_4');
  if (player.activeBloodline && player.activeBloodline !== 'none') tracker.check('first_bloodline');
}

export function checkEquipmentMilestones(tracker, event) {
  if (event === 'enhance') tracker.check('first_enhance');
  if (event === 'enhance_10') tracker.check('enhance_10');
  if (event === 'gem') tracker.check('first_gem');
  if (event === 'legendary') tracker.check('legendary_drop');
}

export function checkChapterMilestones(tracker, chapter) {
  if (chapter >= 1) tracker.check('chapter_1');
  if (chapter >= 6) tracker.check('chapter_6');
  if (chapter >= 12) tracker.check('chapter_12');
}

// 全局实例
export const milestoneTracker = new MilestoneTracker();
