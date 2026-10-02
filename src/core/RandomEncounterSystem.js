// ═══════════════════════════════════════════════════════════════
// 随机遭遇系统 — 探索中触发的即时事件
// ═══════════════════════════════════════════════════════════════
//
// 在探索过程中每隔一定步数触发随机事件
// 事件类型：
//   - 资源发现：少量金币/药水/钥匙
//   - 陷阱遭遇：毒雾/落石/绊线
//   - 神秘商人：随机出售稀有物品
//   - 同伴对话：触发关系提升的随机对话
//   - 环境叙事：增加氛围的描述文本
//   - 抉择事件：有风险有回报的选择
// ═══════════════════════════════════════════════════════════════

import { eventBus } from './EventBus.js';
import { gameState } from './GameState.js';

// ── 遭遇定义 ──
const RANDOM_ENCOUNTERS = {
  // ═══════ 资源发现 ═══════
  resource_gold: {
    name: '散落的金币', icon: '💰', weight: 15, type: 'reward',
    text: '你发现了墙角散落的金币！',
    execute(p, ch) {
      const amount = 20 + ch * 15 + Math.floor(Math.random() * 30);
      p.gold = (p.gold || 0) + amount;
      return { text: `获得 ${amount} 金币`, color: '#ffcc44' };
    },
  },
  resource_heal: {
    name: '恢复泉水', icon: '💧', weight: 12, type: 'reward',
    text: '一股清泉从墙壁裂缝中涌出...',
    execute(p, ch) {
      const heal = Math.floor(p.maxHp * 0.15);
      p.hp = Math.min(p.maxHp, p.hp + heal);
      return { text: `恢复了 ${heal} HP`, color: '#44ff88' };
    },
  },
  resource_stamina: {
    name: '微风', icon: '🍃', weight: 10, type: 'reward',
    text: '一阵凉爽的微风让你精神振奋。',
    execute(p) {
      const rec = Math.min(p.maxStamina - p.stamina, 20);
      p.stamina += rec;
      return { text: `恢复了 ${rec} 体力`, color: '#ffcc44' };
    },
  },

  // ═══════ 小危险 ═══════
  trap_poison: {
    name: '毒雾', icon: '☠', weight: 8, type: 'danger',
    text: '一团淡紫色的毒雾从地缝升起！',
    execute(p, ch) {
      const dmg = 5 + ch * 3;
      p.hp = Math.max(1, p.hp - dmg);
      return { text: `受到 ${dmg} 毒伤害`, color: '#88ff00' };
    },
  },
  trap_rock: {
    name: '落石', icon: '🪨', weight: 6, type: 'danger',
    condition: (p) => p.level >= 3,
    text: '头顶的碎石突然崩落！',
    execute(p, ch) {
      const dmg = 8 + ch * 4;
      p.hp = Math.max(1, p.hp - dmg);
      return { text: `受到 ${dmg} 碎石伤害`, color: '#ff8844' };
    },
  },

  // ═══════ 抉择事件 ═══════
  choice_gamble: {
    name: '神秘宝箱', icon: '🎲', weight: 6, type: 'choice',
    text: '你发现了一个散发着奇异光芒的宝箱。打开可能获得宝物，也可能触发陷阱...',
    choices: [
      {
        label: '🔓 打开', desc: '冒险一试',
        execute(p, ch) {
          if (Math.random() < 0.6) {
            const atk = 1 + Math.floor(ch / 3);
            p.atk += atk;
            return { text: `✨ 宝箱中藏着力量结晶！ATK+${atk}`, color: '#ffcc44' };
          } else {
            const dmg = 10 + ch * 5;
            p.hp = Math.max(1, p.hp - dmg);
            return { text: `💥 宝箱是陷阱！受到 ${dmg} 伤害`, color: '#ff4444' };
          }
        },
      },
      {
        label: '🚶 离开', desc: '安全起见',
        execute() {
          return { text: '你谨慎地离开了。', color: '#888888' };
        },
      },
    ],
  },
  choice_sacrifice: {
    name: '神秘祭坛', icon: '⛩', weight: 4, type: 'choice',
    condition: (p) => p.hp >= 30 && p.level >= 5,
    text: '一座古老的祭坛散发着暗红色的光芒。"以血为代价，换取力量..."',
    choices: [
      {
        label: '🩸 献血', desc: '损失HP换取永久属性',
        execute(p, ch) {
          const hpCost = Math.floor(p.maxHp * 0.2);
          p.hp = Math.max(1, p.hp - hpCost);
          const bonus = Math.random() < 0.5 ? { stat: 'atk', value: 2 + Math.floor(ch / 4) } : { stat: 'def', value: 2 + Math.floor(ch / 4) };
          p[bonus.stat] += bonus.value;
          return { text: `献祭 ${hpCost} HP → ${bonus.stat.toUpperCase()}+${bonus.value}`, color: '#ff4488' };
        },
      },
      {
        label: '🙏 祈祷', desc: '安全但无收益',
        execute(p) {
          const heal = Math.floor(p.maxHp * 0.05);
          p.hp = Math.min(p.maxHp, p.hp + heal);
          return { text: `祈祷带来了片刻安宁。恢复 ${heal} HP`, color: '#88aaff' };
        },
      },
    ],
  },
  choice_wanderer: {
    name: '流浪旅人', icon: '🧳', weight: 5, type: 'choice',
    text: '一位衣衫褴褛的旅人蜷缩在角落。"...请给我一些金币吧..."',
    choices: [
      {
        label: '💰 施舍50G', desc: '帮助旅人',
        condition: (p) => (p.gold || 0) >= 50,
        execute(p) {
          p.gold -= 50;
          // 随机获得回报
          if (Math.random() < 0.4) {
            const def = 2;
            p.def += def;
            return { text: `旅人感激地留下了防御符文。DEF+${def}`, color: '#44ff88' };
          } else {
            return { text: '旅人连声道谢后消失在黑暗中。', color: '#888888' };
          }
        },
      },
      {
        label: '🚶 无视', desc: '继续前行',
        execute() {
          return { text: '"...也罢..."', color: '#666666' };
        },
      },
    ],
  },

  // ═══════ 环境叙事 ═══════
  lore_whisper: {
    name: '低语', icon: '👂', weight: 10, type: 'narrative',
    text: '空气中传来微弱的低语...',
    narratives: [
      '"主神创造了这个空间...但主神又是谁创造的？"',
      '"在轮回中失去的东西...真的能找回吗？"',
      '"每个从这里活着出去的人...都不再是原来的自己了。"',
      '"恐惧是进化的催化剂。基因锁的秘密就在其中。"',
      '"楚轩说过：最可怕的不是怪物，是你旁边的人。"',
      '"传说有人突破了第五阶基因锁...然后消失了。"',
      '"主神空间的尽头是什么？没有人知道。"',
      '"有人说，轮回的真相比轮回本身更令人恐惧。"',
    ],
  },

  // ═══════ 技能碎片 ═══════
  skill_fragment: {
    name: '基因锁共鸣', icon: '🧬', weight: 3, type: 'reward',
    condition: (p) => p.geneLock > 0,
    text: '你感受到基因锁的微弱共鸣...',
    execute(p) {
      p.geneLockCharge = (p.geneLockCharge || 0) + 5;
      return { text: '基因锁充能 +5', color: '#ff6600' };
    },
  },
};

// ── 随机遭遇管理器 ──
class RandomEncounterManager {
  constructor() {
    this.stepsSinceLastEncounter = 0;
    this.encounterThreshold = 15; // 每15步可能触发一次
    this.encounterChance = 0.25;  // 25%触发概率
    this.recentEncounters = [];   // 最近遭遇（防重复）
    this.totalEncounters = 0;
  }

  /** 每步调用 */
  onStep(chapter) {
    this.stepsSinceLastEncounter++;
    if (this.stepsSinceLastEncounter < this.encounterThreshold) return null;
    if (Math.random() > this.encounterChance) return null;

    const encounter = this._pickEncounter(chapter);
    if (!encounter) return null;

    this.stepsSinceLastEncounter = 0;
    this.totalEncounters++;
    this.recentEncounters.push(encounter.id);
    if (this.recentEncounters.length > 5) this.recentEncounters.shift();

    return encounter;
  }

  _pickEncounter(chapter) {
    const p = gameState.player;
    const eligible = Object.entries(RANDOM_ENCOUNTERS)
      .filter(([id, enc]) => {
        if (this.recentEncounters.includes(id)) return false;
        if (enc.condition && !enc.condition(p)) return false;
        return true;
      })
      .map(([id, enc]) => ({ id, ...enc }));

    if (eligible.length === 0) return null;

    // 加权随机选择
    const totalWeight = eligible.reduce((s, e) => s + (e.weight || 1), 0);
    let roll = Math.random() * totalWeight;
    for (const enc of eligible) {
      roll -= (enc.weight || 1);
      if (roll <= 0) return enc;
    }
    return eligible[eligible.length - 1];
  }

  toJSON() {
    return {
      steps: this.stepsSinceLastEncounter,
      total: this.totalEncounters,
      recent: [...this.recentEncounters],
    };
  }

  fromJSON(data) {
    if (!data) return;
    this.stepsSinceLastEncounter = data.steps || 0;
    this.totalEncounters = data.total || 0;
    this.recentEncounters = data.recent || [];
  }
}

export const randomEncounterManager = new RandomEncounterManager();
export { RANDOM_ENCOUNTERS };
