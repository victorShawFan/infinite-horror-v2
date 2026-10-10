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

export const ENCOUNTER = Object.freeze({
  id: 'hive-platform',
  chapter: '第一章 · 名为生化',
  title: '蜂巢站台 · 封锁突破',
  subtitle: '红后的封锁系统已经启动。丧尸群正在从隧道两侧逼近。',
  background: '/assets/scenes/1-2_蜂巢入口_背景.jpg',
  rewards: { exp: 180, points: 240 },
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
});

export function createParty(profile) {
  return PARTY_BLUEPRINTS.map(unit => ({
    ...unit,
    skills: unit.id === 'zheng' ? [...(profile.equippedSkills || [])] : [...(unit.skills || [])],
  }));
}

export function createEncounter() {
  return {
    ...ENCOUNTER,
    rewards: { ...ENCOUNTER.rewards },
    enemies: ENCOUNTER.enemies.map(enemy => ({ ...enemy, skills: [...enemy.skills] })),
  };
}
