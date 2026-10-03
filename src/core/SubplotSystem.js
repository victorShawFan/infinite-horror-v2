// ═══════════════════════════════════════════════════════════════
// 支线剧情系统 — D/C/B/A/S 逐级合成
// ═══════════════════════════════════════════════════════════════
// 设计约束：
//   - 支线剧情分 D/C/B/A/S 五个等级
//   - 3 个低一级可合成 1 个高一级
//   - 高阶强化项同时消耗支线剧情
//   - 击杀同队成员为负奖励
// ═══════════════════════════════════════════════════════════════

import { eventBus } from './EventBus.js';
import { gameState } from './GameState.js';

export const SUBPLOT_RANKS = {
  D: { name: 'D级', color: '#888888', icon: '◇', value: 1 },
  C: { name: 'C级', color: '#44cc88', icon: '◆', value: 3 },
  B: { name: 'B级', color: '#4488ff', icon: '◈', value: 9 },
  A: { name: 'A级', color: '#cc44ff', icon: '✦', value: 27 },
  S: { name: 'S级', color: '#ffcc44', icon: '★', value: 81 },
};

const RANK_ORDER = ['D', 'C', 'B', 'A', 'S'];

// 每章可获得的支线剧情
const CHAPTER_SUBPLOTS = {
  1: [
    { id: 'ch1_rescue_research', name: '救援研究员', rank: 'D', desc: '在蜂巢中救出被困的研究人员' },
    { id: 'ch1_find_records', name: '实验记录', rank: 'D', desc: '找到 T-病毒变异体的完整研究记录' },
    { id: 'ch1_laser_perfect', name: '完美通过激光走廊', rank: 'C', desc: '全队零伤通过红后激光走廊' },
  ],
  2: [
    { id: 'ch2_silent_stealth', name: '无声穿行', rank: 'D', desc: '在通风管中不触发任何声响' },
    { id: 'ch2_save_all', name: '最大生还', rank: 'C', desc: '在巢穴救援中保护所有可救目标' },
    { id: 'ch2_queen_eye', name: '皇后之眼', rank: 'B', desc: '精准打击异形皇后弱点' },
  ],
  3: [
    { id: 'ch3_all_curse', name: '诅咒收集', rank: 'D', desc: '调查全部五处异常' },
    { id: 'ch3_sutra_guard', name: '经卷守护', rank: 'C', desc: '翻译佛经期间零失误防守' },
    { id: 'ch3_save_conflict', name: '调停冲突', rank: 'C', desc: '阻止所有队内冲突' },
    { id: 'ch3_final_seal', name: '封印诅咒', rank: 'B', desc: '在第七波诅咒中完成终极封印' },
  ],
  4: [
    { id: 'ch4_caravan_guard', name: '车队护卫', rank: 'D', desc: '全程保护沙漠车队无损失' },
    { id: 'ch4_tomb_puzzle', name: '陵墓解谜', rank: 'C', desc: '正确翻译石板并激活所有镜片' },
    { id: 'ch4_scripture', name: '真经夺取', rank: 'B', desc: '在三方混战中率先取得复活真经' },
    { id: 'ch4_imhotep', name: '击败伊莫顿', rank: 'A', desc: '不依赖真经力量直接击败伊莫顿' },
  ],
  5: [
    { id: 'ch5_save_chain', name: '因果链拆除', rank: 'D', desc: '成功拆除全部三地因果链' },
    { id: 'ch5_non_lethal', name: '非致命压制', rank: 'C', desc: '不对受控队友造成致命伤害' },
    { id: 'ch5_captain_trial', name: '队长考验', rank: 'B', desc: '以最高评分完成队长资格条件' },
    { id: 'ch5_farewell', name: '张杰的遗愿', rank: 'A', desc: '在精神压制中坚持听完全部真相' },
  ],
  6: [
    { id: 'ch6_isolation', name: '隔离成功', rank: 'D', desc: '正确辨别所有感染者' },
    { id: 'ch6_surgery', name: '手术守护', rank: 'C', desc: '保护程啸完成两次手术零中断' },
    { id: 'ch6_cross_medal', name: '十字勋章', rank: 'B', desc: '取得重生十字勋章' },
  ],
  7: [
    { id: 'ch7_protect_npc', name: '剧情人物保护', rank: 'D', desc: '维持任务人物生命至撤离点' },
    { id: 'ch7_decode', name: '通讯解析', rank: 'C', desc: '识破复制体楚轩的信息误导' },
    { id: 'ch7_last_stand', name: '最后抵抗', rank: 'A', desc: '在团灭前完成所有接力目标' },
  ],
  8: [
    { id: 'ch8_resurrect_all', name: '全员复活', rank: 'C', desc: '按计划完成全部复活仪式' },
    { id: 'ch8_training', name: '新人训练', rank: 'D', desc: '完成罗甘道协同训练' },
    { id: 'ch8_dragon', name: '屠龙', rank: 'A', desc: '在巨龙血战中破坏全部部位' },
  ],
  9: [
    { id: 'ch9_defense', name: '防线不破', rank: 'C', desc: '守住全部三段防线' },
    { id: 'ch9_brain_bug', name: '脑虫捕获', rank: 'B', desc: '零伤亡捕获脑虫' },
    { id: 'ch9_multi_team', name: '多队博弈', rank: 'A', desc: '识别全部轮回队伍计划' },
  ],
  10: [
    { id: 'ch10_sample', name: '生化取样', rank: 'C', desc: '限时潜入取得关键样本' },
    { id: 'ch10_alliance', name: '会议外交', rank: 'B', desc: '在魔戒会议中建立有利联盟' },
    { id: 'ch10_five_team', name: '五队大战胜利', rank: 'S', desc: '在五队混战中取得决定性胜利' },
  ],
  11: [
    { id: 'ch11_heartbreak', name: '心魔破除', rank: 'B', desc: '全员通过心魔试炼' },
    { id: 'ch11_awakening', name: '觉醒', rank: 'A', desc: '郑吒完成最终觉醒' },
  ],
  12: [
    { id: 'ch12_demon', name: '击败恶魔队', rank: 'A', desc: '击败恶魔队核心成员' },
    { id: 'ch12_fragment', name: '碎片摧毁', rank: 'S', desc: '摧毁主神碎片结束轮回' },
  ],
};

class SubplotSystem {
  constructor() {
    this.inventory = { D: 0, C: 0, B: 0, A: 0, S: 0 };
    this.completed = new Set(); // 已完成的支线ID
    this.totalEarned = { D: 0, C: 0, B: 0, A: 0, S: 0 };
  }

  /** 获得支线剧情 */
  earn(rank, subplotId) {
    if (subplotId && this.completed.has(subplotId)) return false;
    if (subplotId) this.completed.add(subplotId);
    this.inventory[rank] = (this.inventory[rank] || 0) + 1;
    this.totalEarned[rank] = (this.totalEarned[rank] || 0) + 1;
    eventBus.emit('subplot:earned', { rank, subplotId });
    return true;
  }

  /** 合成：3个低一级 → 1个高一级 */
  synthesize(fromRank) {
    const idx = RANK_ORDER.indexOf(fromRank);
    if (idx < 0 || idx >= RANK_ORDER.length - 1) return false;
    if ((this.inventory[fromRank] || 0) < 3) return false;
    
    const toRank = RANK_ORDER[idx + 1];
    this.inventory[fromRank] -= 3;
    this.inventory[toRank] = (this.inventory[toRank] || 0) + 1;
    eventBus.emit('subplot:synthesized', { from: fromRank, to: toRank });
    return true;
  }

  /** 消耗支线剧情（高阶强化需要） */
  consume(rank, count = 1) {
    if ((this.inventory[rank] || 0) < count) return false;
    this.inventory[rank] -= count;
    return true;
  }

  /** 检查是否有足够的支线剧情 */
  has(rank, count = 1) {
    return (this.inventory[rank] || 0) >= count;
  }

  /** 获取当前章节可完成的支线列表 */
  getAvailable(chapter) {
    const subplots = CHAPTER_SUBPLOTS[chapter] || [];
    return subplots.map(sp => ({
      ...sp,
      completed: this.completed.has(sp.id),
      rankInfo: SUBPLOT_RANKS[sp.rank],
    }));
  }

  /** 总价值（用于评分） */
  getTotalValue() {
    let total = 0;
    for (const [rank, count] of Object.entries(this.inventory)) {
      total += (SUBPLOT_RANKS[rank]?.value || 0) * count;
    }
    return total;
  }

  /** 格式化库存显示 */
  formatInventory() {
    return RANK_ORDER.map(r => {
      const info = SUBPLOT_RANKS[r];
      const count = this.inventory[r] || 0;
      return `${info.icon} ${info.name}: ${count}`;
    }).join('  ');
  }

  toJSON() {
    return {
      inventory: { ...this.inventory },
      completed: [...this.completed],
      totalEarned: { ...this.totalEarned },
    };
  }

  fromJSON(data) {
    if (!data) return;
    if (data.inventory) this.inventory = { D: 0, C: 0, B: 0, A: 0, S: 0, ...data.inventory };
    if (data.completed) this.completed = new Set(data.completed);
    if (data.totalEarned) this.totalEarned = { D: 0, C: 0, B: 0, A: 0, S: 0, ...data.totalEarned };
  }
}

// 单例
let _instance = null;
export function getSubplotSystem() {
  if (!_instance) _instance = new SubplotSystem();
  return _instance;
}
export function resetSubplotSystem() {
  _instance = new SubplotSystem();
  return _instance;
}

export { CHAPTER_SUBPLOTS, RANK_ORDER };
