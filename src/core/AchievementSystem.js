// ═══════════════════════════════════════════════════════════════
// 成就系统 — 追踪和奖励玩家的里程碑
// ═══════════════════════════════════════════════════════════════
import { eventBus } from './EventBus.js';
import { gameState } from './GameState.js';

export const ACHIEVEMENTS = [
  // ── 战斗成就 ──
  { id: 'first_blood',       name: '开刃',         icon: '🗡', desc: '击败第一个敌人', category: 'combat', hidden: false },
  { id: 'kill_100',          name: '百人斩',        icon: '⚔', desc: '累计击败100个敌人', category: 'combat', hidden: false },
  { id: 'kill_500',          name: '修罗',          icon: '💀', desc: '累计击败500个敌人', category: 'combat', hidden: false },
  { id: 'boss_slayer',       name: 'Boss猎手',      icon: '👑', desc: '击败第一个Boss', category: 'combat', hidden: false },
  { id: 'all_bosses',        name: '众神黄昏',      icon: '🏆', desc: '击败所有Boss', category: 'combat', hidden: false },
  { id: 'no_damage_boss',    name: '完美战斗',      icon: '✨', desc: '无伤击败任意Boss', category: 'combat', hidden: true },
  { id: 'streak_10',         name: '势不可挡',      icon: '🔥', desc: '达成10连杀', category: 'combat', hidden: false },
  { id: 'streak_25',         name: '杀戮机器',      icon: '💥', desc: '达成25连杀', category: 'combat', hidden: false },
  { id: 'rating_s',          name: 'S级评定',       icon: '⭐', desc: '在一场战斗中获得S评定', category: 'combat', hidden: false },
  { id: 'near_death_win',    name: '绝处逢生',      icon: '💗', desc: 'HP≤10%时赢得战斗', category: 'combat', hidden: true },

  // ── 探索成就 ──
  { id: 'explorer_ch1',      name: '新手探险家',     icon: '🗺', desc: '完成第一章', category: 'explore', hidden: false },
  { id: 'explorer_ch6',      name: '老练探险家',     icon: '🧭', desc: '完成第六章', category: 'explore', hidden: false },
  { id: 'explorer_ch12',     name: '传奇探险家',     icon: '🌟', desc: '完成第十二章(通关)', category: 'explore', hidden: false },
  { id: 'secret_finder',     name: '密室发现者',     icon: '🔍', desc: '发现第一个密室', category: 'explore', hidden: false },
  { id: 'all_secrets_ch',    name: '无处隐藏',      icon: '🕵', desc: '找到一章中所有密室', category: 'explore', hidden: true },
  { id: 'trap_dodger',       name: '陷阱专家',      icon: '💨', desc: '成功闪避10个陷阱', category: 'explore', hidden: false },
  { id: 'encounter_all',     name: '百闻不如一见',   icon: '🎲', desc: '触发所有类型的随机遭遇', category: 'explore', hidden: true },

  // ── 成长成就 ──
  { id: 'level_10',          name: '初具规模',      icon: '📈', desc: '达到10级', category: 'growth', hidden: false },
  { id: 'level_30',          name: '实力派',        icon: '💪', desc: '达到30级', category: 'growth', hidden: false },
  { id: 'level_50',          name: '超越极限',      icon: '🌈', desc: '达到50级', category: 'growth', hidden: false },
  { id: 'gene_lock_2',       name: '基因觉醒',      icon: '🧬', desc: '开启第二阶基因锁', category: 'growth', hidden: false },
  { id: 'gene_lock_4',       name: '基因巅峰',      icon: '🧬', desc: '开启第四阶基因锁', category: 'growth', hidden: true },
  { id: 'full_enhance',      name: '满强化',        icon: '🔨', desc: '将任意装备强化到+10', category: 'growth', hidden: false },
  { id: 'forge_first',       name: '锻造师',        icon: '⚒', desc: '第一次锻造装备', category: 'growth', hidden: false },
  { id: 'legendary_equip',   name: '传说装备',      icon: '🏅', desc: '获得传说品质装备', category: 'growth', hidden: false },

  // ── 剧情成就 ──
  { id: 'save_all',          name: '一个都不能少',   icon: '❤', desc: '在关键抉择中选择保护所有人', category: 'story', hidden: true },
  { id: 'heart_demon',       name: '心魔终破',      icon: '🔓', desc: '破除郑吒的心魔', category: 'story', hidden: true },
  { id: 'chuxuan_plan',      name: '最终计划',      icon: '📋', desc: '见证楚轩的最终计划', category: 'story', hidden: true },
  { id: 'yingkong_love',     name: '最幸运的事',    icon: '💕', desc: '触发赵樱空的告白', category: 'story', hidden: true },
  { id: 'ng_plus',           name: '轮回者',        icon: '♻', desc: '开始NG+', category: 'story', hidden: false },
  { id: 'ng_plus_3',         name: '老轮回者',      icon: '🔄', desc: '完成3次NG+', category: 'story', hidden: true },

  // ── 收集成就 ──
  { id: 'bestiary_50',       name: '怪物学者',      icon: '📖', desc: '图鉴收录50种敌人', category: 'collect', hidden: false },
  { id: 'bestiary_full',     name: '百科全书',      icon: '📚', desc: '图鉴收录所有敌人', category: 'collect', hidden: true },
  { id: 'lore_10',           name: '历史发掘者',     icon: '📜', desc: '收集10条lore', category: 'collect', hidden: false },
  { id: 'gold_10000',        name: '万金之躯',      icon: '💰', desc: '累计获得10000金币', category: 'collect', hidden: false },
  { id: 'fragment_500',      name: '灵魂收割者',     icon: '💎', desc: '累计获得500灵魂碎片', category: 'collect', hidden: true },

  // ── 精英怪物成就 ──
  { id: 'elite_first',       name: '精英猎人',      icon: '◆', desc: '击败第一个精英怪物', category: 'combat', hidden: false },
  { id: 'elite_10',          name: '精英征服者',     icon: '◆◆', desc: '累计击败10个精英怪物', category: 'combat', hidden: false },
  { id: 'legendary_slayer',  name: '传说终结者',     icon: '★', desc: '击败一个传说级怪物', category: 'combat', hidden: true },
  { id: 'elite_no_damage',   name: '轻松碾压',      icon: '💎', desc: '无伤击败精英怪物', category: 'combat', hidden: true },
  { id: 'elite_collector',   name: '精英收藏家',     icon: '📖', desc: '击败过所有3个阶级的精英怪', category: 'collect', hidden: true },
];

class AchievementTracker {
  constructor() {
    this.unlocked = new Set();
    this.progress = {};  // { achievementId: currentValue }
    this.stats = {
      totalKills: 0,
      bossKills: 0,
      maxStreak: 0,
      trapsDodged: 0,
      secretsFound: 0,
      totalGold: 0,
      totalFragments: 0,
      encounterTypes: new Set(),
      sRatings: 0,
      nearDeathWins: 0,
      noPerfectBoss: false,
    };
  }

  isUnlocked(id) { return this.unlocked.has(id); }

  unlock(id) {
    if (this.unlocked.has(id)) return false;
    const ach = ACHIEVEMENTS.find(a => a.id === id);
    if (!ach) return false;
    this.unlocked.add(id);
    eventBus.emit('achievement:unlocked', { achievement: ach });
    return true;
  }

  // 检查并解锁基于统计的成就
  checkStats() {
    const s = this.stats;
    if (s.totalKills >= 1)   this.unlock('first_blood');
    if (s.totalKills >= 100) this.unlock('kill_100');
    if (s.totalKills >= 500) this.unlock('kill_500');
    if (s.bossKills >= 1)    this.unlock('boss_slayer');
    if (s.maxStreak >= 10)   this.unlock('streak_10');
    if (s.maxStreak >= 25)   this.unlock('streak_25');
    if (s.trapsDodged >= 10) this.unlock('trap_dodger');
    if (s.sRatings >= 1)     this.unlock('rating_s');
    if (s.nearDeathWins >= 1) this.unlock('near_death_win');
    if (s.totalGold >= 10000) this.unlock('gold_10000');
    if (s.totalFragments >= 500) this.unlock('fragment_500');
    
    const p = gameState.player;
    if (p.level >= 10) this.unlock('level_10');
    if (p.level >= 30) this.unlock('level_30');
    if (p.level >= 50) this.unlock('level_50');
  }

  // 记录击杀
  recordKill(enemy, battleResult) {
    this.stats.totalKills++;
    if (enemy.bossId) {
      this.stats.bossKills++;
      // 检查无伤Boss
      if (battleResult?.playerHp === gameState.player.maxHp) {
        this.unlock('no_damage_boss');
      }
    }
    if (battleResult?.nearDeath) this.stats.nearDeathWins++;
    if (battleResult?.rating === 'S' || battleResult?.rating === 'SS') this.stats.sRatings++;
    this.stats.totalGold += (enemy.rewards?.gold || 0);
    this.checkStats();
  }

  // 记录连杀
  recordStreak(count) {
    if (count > this.stats.maxStreak) this.stats.maxStreak = count;
    this.checkStats();
  }

  // 记录章节完成
  recordChapterComplete(chapter) {
    if (chapter >= 1)  this.unlock('explorer_ch1');
    if (chapter >= 6)  this.unlock('explorer_ch6');
    if (chapter >= 12) this.unlock('explorer_ch12');
  }

  // 记录发现密室
  recordSecretFound() {
    this.stats.secretsFound++;
    if (this.stats.secretsFound >= 1) this.unlock('secret_finder');
  }

  // 记录陷阱闪避
  recordTrapDodge() {
    this.stats.trapsDodged++;
    this.checkStats();
  }

  // 记录随机遭遇
  recordEncounter(type) {
    this.stats.encounterTypes.add(type);
    if (this.stats.encounterTypes.size >= 10) this.unlock('encounter_all');
  }

  // 记录剧情标记
  recordFlag(flag) {
    if (flag === 'suicide_choice_done' || flag === 'heart_pierced') this.unlock('heart_demon');
    if (flag === 'final_plan_activated') this.unlock('chuxuan_plan');
    if (flag === 'yingkong_confession') this.unlock('yingkong_love');
  }

  // 记录锻造
  recordForge() { this.unlock('forge_first'); }
  
  // 记录NG+
  recordNGPlus(count) {
    this.unlock('ng_plus');
    if (count >= 3) this.unlock('ng_plus_3');
  }

  // 获取解锁率
  getUnlockRate() {
    return { unlocked: this.unlocked.size, total: ACHIEVEMENTS.length };
  }

  // 获取分类成就
  getByCategory(cat) {
    return ACHIEVEMENTS.filter(a => a.category === cat).map(a => ({
      ...a,
      unlocked: this.unlocked.has(a.id),
      visible: !a.hidden || this.unlocked.has(a.id),
    }));
  }

  toJSON() {
    return {
      unlocked: [...this.unlocked],
      stats: {
        ...this.stats,
        encounterTypes: [...this.stats.encounterTypes],
      },
    };
  }

  fromJSON(data) {
    if (!data) return;
    this.unlocked = new Set(data.unlocked || []);
    if (data.stats) {
      Object.assign(this.stats, data.stats);
      this.stats.encounterTypes = new Set(data.stats.encounterTypes || []);
    }
  }
}

export const achievementTracker = new AchievementTracker();
