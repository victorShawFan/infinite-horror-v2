import { CHAPTER_ONE_ENCOUNTERS, createParty } from './ChapterOneBattle.js';
import { CHAPTER_TWO_ENCOUNTERS } from './ChapterTwoBattle.js';

export { CHAPTER_TWO_ENCOUNTERS };

export const ALL_REBUILD_ENCOUNTERS = Object.freeze([
  ...CHAPTER_ONE_ENCOUNTERS,
  ...CHAPTER_TWO_ENCOUNTERS,
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
  if (Number(encounter?.chapterNumber || 1) < 2) return party;
  return [
    ...party,
    ...CHAPTER_TWO_REINFORCEMENTS.map(unit => ({ ...unit, skills: [...unit.skills] })),
  ];
}
