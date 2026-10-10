function cloneProfile(profile) {
  return {
    ...profile,
    learnedSkills: [...(profile.learnedSkills || [])],
    equippedSkills: [...(profile.equippedSkills || [])],
  };
}

export function learnSkill(profile, skillId, catalog) {
  const next = cloneProfile(profile);
  const skill = catalog[skillId];
  if (!skill) return { ok: false, error: 'skill_not_found', profile: next };
  if (skill.learnable === false) return { ok: false, error: 'skill_not_learnable', profile: next };
  if (next.learnedSkills.includes(skillId)) return { ok: false, error: 'already_learned', profile: next };
  if (skill.prerequisite && !next.learnedSkills.includes(skill.prerequisite)) {
    return { ok: false, error: 'prerequisite_missing', prerequisite: skill.prerequisite, profile: next };
  }
  if ((next.rewardPoints || 0) < (skill.cost || 0)) return { ok: false, error: 'insufficient_points', profile: next };

  next.rewardPoints -= skill.cost || 0;
  next.learnedSkills.push(skillId);
  return { ok: true, skill, profile: next };
}

export function equipSkill(profile, skillId) {
  const next = cloneProfile(profile);
  if (!next.learnedSkills.includes(skillId)) return { ok: false, error: 'not_learned', profile: next };
  if (next.equippedSkills.includes(skillId)) return { ok: true, profile: next };
  if (next.equippedSkills.length >= (next.skillSlots || 4)) return { ok: false, error: 'slots_full', profile: next };
  next.equippedSkills.push(skillId);
  return { ok: true, profile: next };
}

export function unequipSkill(profile, skillId) {
  const next = cloneProfile(profile);
  next.equippedSkills = next.equippedSkills.filter(id => id !== skillId);
  return { ok: true, profile: next };
}
