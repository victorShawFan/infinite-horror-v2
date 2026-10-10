export const DEFAULT_PROFILE = Object.freeze({
  rewardPoints: 900,
  learnedSkills: ['heavy_slash'],
  equippedSkills: ['heavy_slash'],
  skillSlots: 4,
  battlesWon: 0,
});

export const PARTY_BLUEPRINTS = Object.freeze([
  {
    id: 'zheng', name: '郑吒', role: '近战突击', portrait: '/assets/characters/zheng_zha.jpg',
    hp: 168, maxHp: 168, mp: 30, maxMp: 30, atk: 34, def: 11, spd: 14, crit: 8,
  },
  {
    id: 'zhang', name: '张杰', role: '远程压制', portrait: '/assets/characters/zhang_jie.jpg',
    hp: 126, maxHp: 126, mp: 28, maxMp: 28, atk: 29, def: 8, spd: 16, crit: 12,
    skills: ['precision_shot', 'suppressive_fire'],
  },
  {
    id: 'zhan', name: '詹岚', role: '精神辅助', portrait: '/assets/characters/zhan_lan.jpg',
    hp: 108, maxHp: 108, mp: 40, maxMp: 40, atk: 23, def: 7, spd: 12, crit: 5,
    skills: ['psychic_lance', 'emergency_heal'],
  },
]);

export const CHAPTER_ONE_ENCOUNTERS = Object.freeze([
  {
    id: 'train-awakening',
    order: 1,
    chapter: '第一章 · 名为生化',
    title: '列车醒来 · 第一次杀戮',
    subtitle: '车厢门被撞开。规则尚未听完，死亡已经闯入了列车。',
    briefing: '保护仍在昏迷的新人，适应主神赋予的战斗本能。',
    intro: [
      { speaker: '张杰', text: '想活下去，就别把这里当成电影。被它们咬中，你连后悔的时间都没有。' },
      { speaker: '詹岚', text: '后面的新人还没醒。郑吒，我们必须把感染者挡在这节车厢外。' },
      { speaker: '郑吒', text: '我明白了……害怕没有用。至少这一次，我要自己选择怎么活。' },
    ],
    victory: {
      title: '第一次握紧武器',
      text: '尸体倒在车门前，郑吒的双手仍在发抖。但这一次，他没有闭上眼睛。',
    },
    background: '/assets/scenes/1-1_列车醒来_背景.jpg',
    threat: '低危',
    rewards: { exp: 90, points: 160 },
    repeatRewards: { exp: 28, points: 45 },
    enemies: [
      {
        id: 'train-worker', name: '感染工人', role: '迟缓撕咬', portrait: '/assets/enemies/zombie_worker.jpg',
        hp: 76, maxHp: 76, mp: 0, maxMp: 0, atk: 18, def: 6, spd: 7, crit: 2, skills: [],
      },
      {
        id: 'train-guard', name: '失控警卫', role: '快速扑击', portrait: '/assets/enemies/zombie_guard.jpg',
        hp: 58, maxHp: 58, mp: 0, maxMp: 0, atk: 19, def: 5, spd: 11, crit: 3, skills: [],
      },
    ],
  },
  {
    id: 'hive-platform',
    order: 2,
    chapter: '第一章 · 名为生化',
    title: '蜂巢站台 · 封锁突破',
    subtitle: '红后的封锁系统已经启动。丧尸群正在从隧道两侧逼近。',
    briefing: '利用群体技能撕开包围，在更多感染者抵达前进入蜂巢。',
    intro: [
      { speaker: '主神', text: '支线目标更新：在红后封锁完成前突破蜂巢站台。失败扣除奖励点。' },
      { speaker: '张杰', text: '数量太多，别一个一个磨。用你刚从主神那里换来的招式，撕开一条路。' },
      { speaker: '郑吒', text: '原来强化不是纸面上的数字……我能感觉到那股力量正在身体里等待。' },
    ],
    victory: {
      title: '力量开始有了形状',
      text: '横扫的冲击撕开尸群，中洲队第一次用主动选择的强化改变了原本的死亡路线。',
    },
    background: '/assets/scenes/1-2_蜂巢入口_背景.jpg',
    threat: '中危',
    rewards: { exp: 180, points: 240 },
    repeatRewards: { exp: 55, points: 70 },
    enemies: [
      {
        id: 'guard-a', name: '感染警卫', role: '快速袭击', portrait: '/assets/enemies/zombie_guard.jpg',
        hp: 72, maxHp: 72, mp: 0, maxMp: 0, atk: 20, def: 6, spd: 13, crit: 4, skills: [],
      },
      {
        id: 'worker', name: '感染工人', role: '腐化抓击', portrait: '/assets/enemies/zombie_worker.jpg',
        hp: 90, maxHp: 90, mp: 0, maxMp: 0, atk: 24, def: 8, spd: 8, crit: 3, skills: [],
      },
      {
        id: 'guard-b', name: '狂躁警卫', role: '高速突袭', portrait: '/assets/enemies/zombie_guard.jpg',
        hp: 66, maxHp: 66, mp: 0, maxMp: 0, atk: 22, def: 5, spd: 11, crit: 5, skills: [],
      },
    ],
  },
  {
    id: 'red-queen-core',
    order: 3,
    chapter: '第一章 · 名为生化',
    title: '红后机房 · 关闭防御',
    subtitle: '红后将维护机器人改写成杀戮程序，机房正在逐段封死。',
    briefing: '优先击破高速防卫节点，再集中火力摧毁主控守卫。',
    intro: [
      { speaker: '红后', text: '你们都会死在这里。概率已经计算完毕，继续前进没有意义。' },
      { speaker: '詹岚', text: '她在逼我们慌乱。两个高速节点负责锁定目标，中间那个才是主控。' },
      { speaker: '郑吒', text: '概率不是结果。只要我们还在行动，她的计算就没有结束。' },
    ],
    victory: {
      title: '让机器重新计算',
      text: '最后一个防卫节点熄灭时，红后的声音第一次出现停顿。中洲队用行动制造了计算之外的答案。',
    },
    background: '/assets/scenes/1-3_红后机房_背景.jpg',
    threat: '中危',
    rewards: { exp: 220, points: 280 },
    repeatRewards: { exp: 65, points: 80 },
    enemies: [
      {
        id: 'node-left', name: '防卫节点α', role: '高速锁定', portrait: '/assets/enemies/zombie_guard.jpg',
        hp: 78, maxHp: 78, mp: 0, maxMp: 0, atk: 22, def: 7, spd: 16, crit: 6, skills: [],
      },
      {
        id: 'core-guard', name: '主控守卫', role: '重甲镇压', portrait: '/assets/enemies/zombie_worker.jpg',
        hp: 148, maxHp: 148, mp: 0, maxMp: 0, atk: 27, def: 13, spd: 7, crit: 3, skills: [],
      },
      {
        id: 'node-right', name: '防卫节点β', role: '高速锁定', portrait: '/assets/enemies/zombie_guard.jpg',
        hp: 78, maxHp: 78, mp: 0, maxMp: 0, atk: 22, def: 7, spd: 15, crit: 6, skills: [],
      },
    ],
  },
  {
    id: 'laser-corridor',
    order: 4,
    chapter: '第一章 · 名为生化',
    title: '激光走廊 · 生存判定',
    subtitle: '红色光束封闭了走廊，安保单元正将所有活体标记为入侵者。',
    briefing: '敌方速度极高。观察意图，利用防御承受锁定攻击，再抓住冷却空档反击。',
    intro: [
      { speaker: '张杰', text: '别只看伤害。高速敌人先出手，轮到你时要判断是攻击，还是先把人保下来。' },
      { speaker: '詹岚', text: '激光在重复三段循环。防住第一轮，我们就能找到它的攻击空档。' },
      { speaker: '郑吒', text: '力量不是每一回合都向前冲。该挡的时候挡住，也是为了让所有人走出去。' },
    ],
    victory: {
      title: '通过不可能的走廊',
      text: '最后一道激光从背后合拢。郑吒没有回头，因为这一次走廊里没有留下任何同伴。',
    },
    background: '/assets/scenes/1-4_激光走廊_背景.jpg',
    threat: '高危',
    rewards: { exp: 270, points: 340 },
    repeatRewards: { exp: 78, points: 95 },
    enemies: [
      {
        id: 'laser-a', name: '激光安保α', role: '高速切割', portrait: '/assets/enemies/zombie_guard.jpg',
        hp: 96, maxHp: 96, mp: 0, maxMp: 0, atk: 30, def: 8, spd: 19, crit: 7, skills: [],
      },
      {
        id: 'laser-b', name: '激光安保β', role: '交叉锁定', portrait: '/assets/enemies/zombie_guard.jpg',
        hp: 112, maxHp: 112, mp: 0, maxMp: 0, atk: 28, def: 10, spd: 18, crit: 5, skills: [],
      },
    ],
  },
  {
    id: 'crawler-outbreak',
    order: 5,
    chapter: '第一章 · 名为生化',
    title: '终端控制室 · 爬行者爆发',
    subtitle: '培养槽全部破裂，爬行者在天花板与管线之间高速移动。',
    briefing: '先用群体技能清理感染者，避免爬行者在低血目标上完成连续猎杀。',
    intro: [
      { speaker: '詹岚', text: '它们不是普通丧尸。速度、力量、攻击方式都已经越过了人的范围。' },
      { speaker: '张杰', text: '别让伤员单独暴露。爬行者会盯住最虚弱的人，一旦倒一个，阵线就会崩。' },
      { speaker: '郑吒', text: '那就不让任何人落单。中洲队，一起杀出去。' },
    ],
    victory: {
      title: '中洲队第一次并肩',
      text: '爬行者从天花板坠落，中洲队仍站在同一条战线上。郑吒第一次真正喊出了“我们”。',
    },
    background: '/assets/scenes/1-5_终端控制室_背景.jpg',
    threat: '高危',
    rewards: { exp: 330, points: 410 },
    repeatRewards: { exp: 90, points: 115 },
    enemies: [
      {
        id: 'crawler-a', name: '爬行者α', role: '弱点猎杀', portrait: '/assets/enemies/crawler.jpg',
        hp: 142, maxHp: 142, mp: 0, maxMp: 0, atk: 30, def: 10, spd: 18, crit: 8, skills: [],
      },
      {
        id: 'infected-support', name: '感染维护员', role: '腐化纠缠', portrait: '/assets/enemies/zombie_worker.jpg',
        hp: 118, maxHp: 118, mp: 0, maxMp: 0, atk: 25, def: 10, spd: 8, crit: 3, skills: [],
      },
      {
        id: 'crawler-b', name: '爬行者β', role: '弱点猎杀', portrait: '/assets/enemies/crawler.jpg',
        hp: 132, maxHp: 132, mp: 0, maxMp: 0, atk: 29, def: 9, spd: 17, crit: 8, skills: [],
      },
    ],
  },
  {
    id: 'tyrant-final',
    order: 6,
    chapter: '第一章 · 名为生化',
    title: '六小时归途 · 暴君追猎',
    subtitle: '倒计时最后三分钟，T-002撕开闸门挡住了回归列车。',
    briefing: '暴君拥有极高生命和阶段爆发。保留治疗与MP，撑过它的狂暴期。',
    intro: [
      { speaker: '红后', text: '警告。T-002限制解除。目标：消灭所有未经授权的生命体。' },
      { speaker: '詹岚', text: '列车还有三分钟启动。如果在这里倒下，前面做的一切都没有意义。' },
      { speaker: '张杰', text: '它半血以后会更危险。别贪攻击，留住治疗和防御，这不是一个人的战斗。' },
      { speaker: '郑吒', text: '我不会再让任何人替我决定谁该死。三分钟——足够了。' },
    ],
    victory: {
      title: '活着回到主神空间',
      text: '暴君在列车灯光中倒下。白色光柱落下时，郑吒终于明白：力量的意义不是活得更久，而是让身边的人也能回去。',
    },
    epilogue: {
      quote: '“欢迎回到主神空间。存活人数：三。”',
      text: '这是中洲队第一次以自己的选择改变轮回。十天之后，他们仍会被送往下一个恐怖世界；但从这一刻起，他们不再只是等待剧情发生的人。',
    },
    background: '/assets/scenes/1-6_六小时回归_背景.jpg',
    threat: '首领',
    boss: true,
    rewards: { exp: 420, points: 620 },
    repeatRewards: { exp: 100, points: 150 },
    enemies: [
      {
        // 旧 tyrant.jpg 内容实际是蜘蛛怪，禁止继续误用；在原创暴君资产完成前
        // 使用感染者全身图配合 Boss 卡视觉处理，避免错误物种直接进入成品。
        id: 'tyrant', name: '暴君 T-002', role: '生化终结者', portrait: '/assets/enemies/zombie_worker.jpg',
        hp: 370, maxHp: 370, mp: 40, maxMp: 40, atk: 34, def: 13, spd: 10, crit: 7,
        skills: ['tyrant_crush', 'tyrant_roar'], boss: true, phase: 1,
        phaseThreshold: 0.5, phaseAtkBonus: 8,
      },
      {
        id: 'crawler', name: '爬行者', role: '侧翼猎杀', portrait: '/assets/enemies/crawler.jpg',
        hp: 122, maxHp: 122, mp: 0, maxMp: 0, atk: 28, def: 9, spd: 17, crit: 8, skills: [],
      },
    ],
  },
]);

export const ENCOUNTER = CHAPTER_ONE_ENCOUNTERS[1];

export function createParty(profile) {
  return PARTY_BLUEPRINTS.map(unit => ({
    ...unit,
    skills: unit.id === 'zheng' ? [...(profile.equippedSkills || [])] : [...(unit.skills || [])],
  }));
}

export function createEncounter(encounterId = ENCOUNTER.id) {
  const source = CHAPTER_ONE_ENCOUNTERS.find(item => item.id === encounterId) || ENCOUNTER;
  return {
    ...source,
    rewards: { ...source.rewards },
    repeatRewards: { ...source.repeatRewards },
    enemies: source.enemies.map(enemy => ({ ...enemy, skills: [...enemy.skills] })),
  };
}
