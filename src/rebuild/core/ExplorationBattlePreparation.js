const ADJUSTABLE_STATS = new Set(['maxHp', 'maxMp', 'hp', 'mp', 'atk', 'def', 'spd', 'crit']);

function adjustedUnit(source, deltas = {}) {
  const unit = {
    ...source,
    skills: [...(source.skills || [])],
    inventory: { ...(source.inventory || {}) },
  };
  for (const [stat, delta] of Object.entries(deltas || {})) {
    if (!ADJUSTABLE_STATS.has(stat)) continue;
    const minimum = stat === 'atk' || stat === 'maxHp' ? 1 : 0;
    unit[stat] = Math.max(minimum, Number(unit[stat] || 0) + Number(delta || 0));
  }
  if ('maxHp' in deltas && !('hp' in deltas)) unit.hp = Math.min(unit.maxHp, Number(unit.hp || unit.maxHp));
  if ('maxMp' in deltas && !('mp' in deltas)) unit.mp = Math.min(unit.maxMp, Number(unit.mp || unit.maxMp));
  return unit;
}

export function applyBattlePreparation({ party, enemies, preparation = {} }) {
  const effects = Array.isArray(preparation.effects) ? preparation.effects : [];
  return {
    party: (party || []).map(unit => effects.reduce((current, effect) => adjustedUnit(current, effect.party), adjustedUnit(unit))),
    enemies: (enemies || []).map(unit => effects.reduce((current, effect) => adjustedUnit(current, effect.enemies), adjustedUnit(unit))),
    notes: [...(preparation.notes || [])],
  };
}
