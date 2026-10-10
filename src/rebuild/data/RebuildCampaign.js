import { CHAPTER_ONE_ENCOUNTERS, createParty } from './ChapterOneBattle.js';
import { CHAPTER_TWO_ENCOUNTERS } from './ChapterTwoBattle.js';
import { CHAPTER_THREE_ENCOUNTERS } from './ChapterThreeBattle.js';

export { CHAPTER_TWO_ENCOUNTERS, CHAPTER_THREE_ENCOUNTERS };

export const ALL_REBUILD_ENCOUNTERS = Object.freeze([
  ...CHAPTER_ONE_ENCOUNTERS,
  ...CHAPTER_TWO_ENCOUNTERS,
  ...CHAPTER_THREE_ENCOUNTERS,
]);

const CHAPTER_TWO_REINFORCEMENTS = Object.freeze([
  {
    id: 'chuxuan', name: '楚轩', role: '战术演算', portrait: '/assets/characters/chuxuan.svg',
    hp: 138, maxHp: 138, mp: 34, maxMp: 34, atk: 32, def: 10, spd: 15, crit: 10,
    attackRange: 'ranged', skills: ['tactical_burst'],
  },
  {
    id: 'lingdian', name: '零点', role: '远程狙杀', portrait: '/assets/characters/lingdian.svg',
    hp: 142, maxHp: 142, mp: 36, maxMp: 36, atk: 38, def: 10, spd: 18, crit: 17,
    attackRange: 'ranged', skills: ['sniper_execution', 'crossfire'],
  },
]);

const CHAPTER_THREE_REINFORCEMENTS = Object.freeze([
  {
    id: 'zhao', name: '赵樱空', role: '精神感应', portrait: '/assets/characters/zhao_yingkong.svg',
    hp: 154, maxHp: 154, mp: 44, maxMp: 44, atk: 36, def: 12, spd: 19, crit: 16,
    skills: ['soul_sever', 'ward_break'],
  },
  {
    id: 'qiteng', name: '齐腾一', role: '灵类射手', portrait: '/assets/characters/qi_tengyi.svg',
    hp: 148, maxHp: 148, mp: 38, maxMp: 38, atk: 34, def: 11, spd: 16, crit: 12,
    attackRange: 'ranged', damageType: 'spirit', skills: ['spirit_volley'],
  },
]);

export function createRebuildEncounter(encounterId = ALL_REBUILD_ENCOUNTERS[0].id) {
  const source = ALL_REBUILD_ENCOUNTERS.find(item => item.id === encounterId) || ALL_REBUILD_ENCOUNTERS[0];
  return {
    ...source,
    rewards: { ...source.rewards },
    repeatRewards: { ...source.repeatRewards },
    rules: source.rules ? JSON.parse(JSON.stringify(source.rules)) : {},
    epilogue: source.epilogue ? {
      ...source.epilogue,
      ...(source.epilogue.stats ? { stats: [...source.epilogue.stats] } : {}),
    } : null,
    enemies: source.enemies.map(unit => ({
      ...unit,
      skills: [...(unit.skills || [])],
      protectedBy: unit.protectedBy ? [...unit.protectedBy] : undefined,
    })),
  };
}

export function createRebuildParty(profile, encounter) {
  const party = createParty(profile).map(unit => ({ ...unit, skills: [...(unit.skills || [])] }));
  const chapter = Number(encounter?.chapterNumber || 1);
  if (chapter < 2) return party;
  const chapterTwo = [
    ...party,
    ...CHAPTER_TWO_REINFORCEMENTS.map(unit => ({ ...unit, skills: [...unit.skills] })),
  ];
  if (chapter < 3) return chapterTwo;
  const byId = Object.fromEntries(chapterTwo.map(unit => [unit.id, unit]));
  const zhao = { ...CHAPTER_THREE_REINFORCEMENTS[0], skills: [...CHAPTER_THREE_REINFORCEMENTS[0].skills] };
  const qiteng = { ...CHAPTER_THREE_REINFORCEMENTS[1], skills: [...CHAPTER_THREE_REINFORCEMENTS[1].skills] };
  const lingdian = { ...byId.lingdian, skills: ['spirit_sniper', 'crossfire'] };
  if (encounter?.postSacrifice) return [byId.zheng, byId.zhan, lingdian, zhao, qiteng];
  return [byId.zheng, byId.zhan, byId.chuxuan, lingdian, zhao];
}
