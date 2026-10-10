import { ACTION_KIND, TARGET_KIND } from './TurnBattleEngine.js';

function lowestHealth(opponents) {
  return [...opponents]
    .filter(unit => unit.hp > 0)
    .sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp || String(a.id).localeCompare(String(b.id)))[0];
}

function availableSkills(actor, catalog) {
  return (actor.skills || [])
    .map(id => catalog[id])
    .filter(skill => skill && actor.mp >= (skill.mpCost || 0));
}

export function chooseEnemyAction({ actor, round, opponents, skills }) {
  const target = lowestHealth(opponents);
  if (!target) return null;
  const available = availableSkills(actor, skills);

  if (actor.boss) {
    if (Number(actor.phase || 1) >= 2 && round % 2 === 0) {
      const area = available.find(skill => skill.target === TARGET_KIND.ALL_ENEMIES);
      if (area) return { actorId: actor.id, kind: ACTION_KIND.SKILL, skillId: area.id };
    }
    const single = available.find(skill => skill.target === TARGET_KIND.SINGLE_ENEMY);
    if (single) return { actorId: actor.id, kind: ACTION_KIND.SKILL, skillId: single.id, targetId: target.id };
  }

  return { actorId: actor.id, kind: ACTION_KIND.ATTACK, targetId: target.id };
}

export function describeEnemyIntent(action, actor, opponents, skills) {
  if (!action) return actor.name + '：无可用行动';
  if (action.kind === ACTION_KIND.SKILL) {
    const skill = skills[action.skillId];
    if (skill?.target === TARGET_KIND.ALL_ENEMIES) return actor.name + '：' + skill.name + '（攻击全体）';
    const target = opponents.find(unit => unit.id === action.targetId);
    return actor.name + '：' + (skill?.name || '技能') + ' → ' + (target?.name || '未知目标');
  }
  const target = opponents.find(unit => unit.id === action.targetId);
  return actor.name + '：普通攻击 → ' + (target?.name || '未知目标');
}
