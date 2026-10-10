export function buildExplorationHUD(engine, scenario = engine?.scenario) {
  const requiredEntities = (scenario?.entities || []).filter(entity => entity.required);
  const interacted = new Set(engine?.state?.interacted || []);
  const discoveries = engine?.getDiscoveries?.() || { entries: [], clues: 0 };
  const preparation = engine?.getBattlePreparation?.() || { notes: [] };
  const target = engine?.getInteractionTarget?.() || null;
  return {
    target: target ? { id: target.id, type: target.type, name: target.name || '未命名目标' } : null,
    required: { completed: requiredEntities.filter(entity => interacted.has(entity.id)).length, total: requiredEntities.length },
    discoveries: { entries: discoveries.entries.map(entry => ({ ...entry })), clues: discoveries.clues },
    battleNotes: [...(preparation.notes || [])],
  };
}
