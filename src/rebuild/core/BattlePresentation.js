export function buildPresentationCues(events = []) {
  const cues = [];
  for (const event of events) {
    if (event.type === 'damage') {
      cues.push({ type: 'attack', actorId: event.actorId });
      cues.push({ type: 'hit', targetId: event.targetId, intensity: event.critical ? 'critical' : 'normal' });
      cues.push({
        type: 'popup',
        targetId: event.targetId,
        text: (event.critical ? '暴击 -' : '-') + event.amount,
        tone: event.critical ? 'critical' : 'damage',
      });
    } else if (event.type === 'heal') {
      cues.push({ type: 'cast', actorId: event.actorId });
      cues.push({ type: 'heal', targetId: event.targetId });
      if (event.amount > 0) cues.push({ type: 'popup', targetId: event.targetId, text: '+' + event.amount, tone: 'heal' });
    } else if (event.type === 'boss_phase') {
      cues.push({ type: 'boss_phase', actorId: event.actorId, phase: event.phase });
      cues.push({ type: 'banner', text: '警告 · 生化体进入狂暴阶段', tone: 'danger' });
    } else if (event.type === 'guard') {
      cues.push({ type: 'guard', actorId: event.actorId });
    } else if (event.type === 'protection') {
      cues.push({ type: 'protection', targetId: event.targetId, protectorIds: event.protectorIds });
    } else if (event.type === 'hazard_damage') {
      cues.push({ type: 'hazard', targetId: event.targetId, hazardId: event.hazardId });
      cues.push({ type: 'popup', targetId: event.targetId, text: '激光 -' + event.amount, tone: 'hazard' });
    }
  }
  return cues;
}
