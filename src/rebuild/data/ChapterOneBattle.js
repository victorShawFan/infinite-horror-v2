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
    id: 'tyrant-final',
    order: 3,
    chapter: '第一章 · 名为生化',
    title: '六小时归途 · 暴君追猎',
    subtitle: '倒计时最后三分钟，T-002撕开闸门挡住了回归列车。',
    briefing: '暴君拥有极高生命和阶段爆发。保留治疗与MP，撑过它的狂暴期。',
    background: '/assets/scenes/1-6_六小时回归_背景.jpg',
    threat: '首领',
    boss: true,
    rewards: { exp: 420, points: 620 },
    repeatRewards: { exp: 100, points: 150 },
    enemies: [
      {
        id: 'tyrant', name: '暴君 T-002', role: '生化终结者', portrait: '/assets/enemies/tyrant.jpg',
        hp: 390, maxHp: 390, mp: 40, maxMp: 40, atk: 34, def: 13, spd: 10, crit: 7,
        skills: ['tyrant_crush', 'tyrant_roar'], boss: true, phase: 1,
        phaseThreshold: 0.5, phaseAtkBonus: 10,
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
