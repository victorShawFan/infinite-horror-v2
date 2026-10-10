export function experienceToNextLevel(level) {
  const normalizedLevel = Math.max(1, Math.floor(Number(level || 1)));
  return 120 + (normalizedLevel - 1) * 80;
}

export function getProgressionBonuses(level) {
  const gainedLevels = Math.max(0, Math.floor(Number(level || 1)) - 1);
  return {
    maxHp: gainedLevels * 12,
    atk: gainedLevels * 3,
    def: gainedLevels * 2,
    maxMp: gainedLevels * 2,
  };
}

export function applyExperience(profile, gainedExperience) {
  const next = {
    ...profile,
    level: Math.max(1, Math.floor(Number(profile.level || 1))),
    exp: Math.max(0, Math.floor(Number(profile.exp || 0))),
  };
  next.exp += Math.max(0, Math.floor(Number(gainedExperience || 0)));
  let levelsGained = 0;
  while (next.level < 50 && next.exp >= experienceToNextLevel(next.level)) {
    next.exp -= experienceToNextLevel(next.level);
    next.level++;
    levelsGained++;
  }
  return {
    profile: next,
    levelsGained,
    bonuses: getProgressionBonuses(next.level),
    nextLevelExp: experienceToNextLevel(next.level),
  };
}
