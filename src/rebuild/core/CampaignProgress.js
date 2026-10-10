import { CHAPTER_ONE_ENCOUNTERS } from '../data/ChapterOneBattle.js';

function encounterIds(encounters) {
  return encounters.map(encounter => encounter.id);
}

export function createCampaignProgress(source = {}, encounters = CHAPTER_ONE_ENCOUNTERS) {
  const ids = encounterIds(encounters);
  const saved = source.campaign || source;
  let completed = Array.isArray(saved.completed)
    ? saved.completed.filter(id => ids.includes(id))
    : ids.slice(0, Math.min(Number(source.battlesWon || 0), ids.length));
  completed = [...new Set(completed)];

  const inferredUnlock = Math.min(completed.length, Math.max(0, ids.length - 1));
  const unlockedIndex = Math.max(0, Math.min(
    Number.isInteger(saved.unlockedIndex) ? saved.unlockedIndex : inferredUnlock,
    Math.max(0, ids.length - 1),
  ));
  return { chapter: 1, unlockedIndex, completed };
}

export function canLaunchEncounter(progress, encounterId, encounters = CHAPTER_ONE_ENCOUNTERS) {
  const normalized = createCampaignProgress(progress, encounters);
  const index = encounters.findIndex(encounter => encounter.id === encounterId);
  return index >= 0 && index <= normalized.unlockedIndex;
}

export function settleEncounter(progress, encounterId, result, encounters = CHAPTER_ONE_ENCOUNTERS) {
  const normalized = createCampaignProgress(progress, encounters);
  const index = encounters.findIndex(encounter => encounter.id === encounterId);
  if (index < 0) return { ok: false, error: 'encounter_not_found', progress: normalized };
  if (!canLaunchEncounter(normalized, encounterId, encounters)) {
    return { ok: false, error: 'encounter_locked', progress: normalized };
  }

  const encounter = encounters[index];
  if (result !== 'victory') {
    return { ok: true, firstClear: false, progress: normalized, rewards: { exp: 0, points: 0 } };
  }

  const firstClear = !normalized.completed.includes(encounterId);
  const completed = firstClear ? [...normalized.completed, encounterId] : [...normalized.completed];
  const nextUnlocked = firstClear
    ? Math.min(Math.max(normalized.unlockedIndex, index + 1), encounters.length - 1)
    : normalized.unlockedIndex;
  return {
    ok: true,
    firstClear,
    progress: { ...normalized, unlockedIndex: nextUnlocked, completed },
    rewards: { ...(firstClear ? encounter.rewards : encounter.repeatRewards) },
  };
}

export function getCampaignStatus(progress, encounters = CHAPTER_ONE_ENCOUNTERS) {
  const normalized = createCampaignProgress(progress, encounters);
  const completedCount = encounters.filter(encounter => normalized.completed.includes(encounter.id)).length;
  return {
    completed: completedCount === encounters.length,
    completedCount,
    totalCount: encounters.length,
    nextEncounter: encounters.find(encounter => !normalized.completed.includes(encounter.id) && canLaunchEncounter(normalized, encounter.id, encounters)) || null,
  };
}
