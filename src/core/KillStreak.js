// ═══════════════════════════════════════════════════════════════
// 连杀/战斗势头系统 — 连续击杀获得递增奖励
// ═══════════════════════════════════════════════════════════════
//
// 连续击杀敌人不死亡时，获得递增加成：
//   3连杀: ATK+5%  "势头正盛"
//   5连杀: ATK+10%, EXP+15%  "杀意凛然"  
//   8连杀: ATK+15%, EXP+25%, CRT+5  "势不可挡"
//  12连杀: ATK+20%, EXP+35%, CRT+10, 回血2%  "神挡杀神"
//  20连杀: ATK+30%, EXP+50%, CRT+15, 回血5%  "一骑当千"
//
// 死亡或休息重置连杀计数
// ═══════════════════════════════════════════════════════════════

import { eventBus } from './EventBus.js';

const STREAK_TIERS = [
  { kills: 3,  name: '势头正盛', icon: '🔥', color: '#ffaa44',
    bonus: { atkPct: 5, expPct: 0, crt: 0, healPct: 0 } },
  { kills: 5,  name: '杀意凛然', icon: '⚡', color: '#ff6644',
    bonus: { atkPct: 10, expPct: 15, crt: 0, healPct: 0 } },
  { kills: 8,  name: '势不可挡', icon: '💥', color: '#ff4444',
    bonus: { atkPct: 15, expPct: 25, crt: 5, healPct: 0 } },
  { kills: 12, name: '神挡杀神', icon: '☠', color: '#ff2222',
    bonus: { atkPct: 20, expPct: 35, crt: 10, healPct: 2 } },
  { kills: 20, name: '一骑当千', icon: '👑', color: '#ffdd00',
    bonus: { atkPct: 30, expPct: 50, crt: 15, healPct: 5 } },
];

class KillStreakTracker {
  constructor() {
    this.current = 0;
    this.best = 0;
    this.totalKills = 0;
  }

  recordKill() {
    this.current++;
    this.totalKills++;
    if (this.current > this.best) this.best = this.current;
    
    const tier = this.getCurrentTier();
    if (tier && tier.kills === this.current) {
      eventBus.emit('streak:milestone', { 
        kills: this.current, 
        tier,
      });
    }
    
    return { kills: this.current, tier };
  }

  recordDeath() {
    const lost = this.current;
    this.current = 0;
    if (lost >= 3) {
      eventBus.emit('streak:broken', { kills: lost });
    }
  }

  getCurrentTier() {
    let best = null;
    for (const tier of STREAK_TIERS) {
      if (this.current >= tier.kills) best = tier;
    }
    return best;
  }

  getBonus() {
    const tier = this.getCurrentTier();
    if (!tier) return { atkPct: 0, expPct: 0, crt: 0, healPct: 0 };
    return { ...tier.bonus };
  }

  getDisplay() {
    const tier = this.getCurrentTier();
    if (!tier) return null;
    return {
      kills: this.current,
      name: tier.name,
      icon: tier.icon,
      color: tier.color,
      bonus: tier.bonus,
    };
  }

  reset() {
    this.current = 0;
  }

  toJSON() {
    return {
      current: this.current,
      best: this.best,
      totalKills: this.totalKills,
    };
  }

  fromJSON(data) {
    if (!data) return;
    this.current = data.current || 0;
    this.best = data.best || 0;
    this.totalKills = data.totalKills || 0;
  }
}

export const killStreak = new KillStreakTracker();
export { STREAK_TIERS };
