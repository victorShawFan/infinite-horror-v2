import { ExplorationEngine } from '../core/ExplorationEngine.js';

const DIRECTIONS = Object.freeze([[0,-1],[0,1],[-1,0],[1,0]]);

function key(position) { return `${position.x},${position.y}`; }

function stateFor(engine) {
  return {
    player: { ...engine.state.player }, facing: engine.state.facing,
    interacted: [...engine.state.interacted], pickedItems: [...engine.state.pickedItems],
    battleCleared: engine.state.battleCleared,
  };
}

function progressFor(engine, scenario) {
  const required = (scenario.entities || []).filter(entity => entity.required);
  const completed = required.filter(entity => engine.state.interacted.includes(entity.id)).length;
  return { required: completed, requiredTotal: required.length, discoveries: engine.getDiscoveries().entries.length, battleCleared: engine.state.battleCleared };
}

function isBlocking(entity, engine) {
  if (!entity) return false;
  if (entity.type === 'item') return !engine.state.pickedItems.includes(entity.id);
  return ['npc','object','battle','exit'].includes(entity.type);
}

function pathToNeighbor(engine, scenario, target) {
  const entityAt = new Map((scenario.entities || []).map(entity => [key(entity), entity]));
  const goals = new Set(DIRECTIONS.map(([dx,dy]) => `${target.x+dx},${target.y+dy}`));
  const start = { ...engine.state.player };
  const startKey = key(start);
  if (goals.has(startKey)) return [];
  const queue = [start];
  const parent = new Map([[startKey, null]]);
  let found = null;
  while (queue.length && !found) {
    const current = queue.shift();
    for (const [dx,dy] of DIRECTIONS) {
      const next = { x: current.x + dx, y: current.y + dy };
      const nextKey = key(next);
      if (parent.has(nextKey)) continue;
      const tile = scenario.tiles[next.y]?.[next.x] || '#';
      if (tile === '#' || isBlocking(entityAt.get(nextKey), engine)) continue;
      parent.set(nextKey, key(current));
      if (goals.has(nextKey)) { found = nextKey; break; }
      queue.push(next);
    }
  }
  if (!found) return null;
  const reversed = [];
  for (let cursor = found; cursor !== startKey; cursor = parent.get(cursor)) {
    const [x,y] = cursor.split(',').map(Number);
    reversed.push({ x, y });
  }
  return reversed.reverse();
}

function policyTargets(scenario, strategy) {
  const entities = scenario.entities || [];
  const battle = entities.find(entity => entity.type === 'battle');
  const exit = entities.find(entity => entity.type === 'exit');
  const investigation = strategy === 'completionist'
    ? entities.filter(entity => !['battle','exit'].includes(entity.type))
    : entities.filter(entity => entity.required);
  return [...investigation, battle, exit].filter(Boolean);
}

export function runExplorationPolicy({ scenario, strategy = 'mainline', maxSteps = 1000 }) {
  const engine = new ExplorationEngine(scenario);
  const trajectory = [];
  const events = [];
  const visited = new Set();
  let invalidMoves = 0;
  let steps = 0;
  let battlePreparation = { effects: [], notes: [] };
  let termination = 'policy_exhausted';

  const record = (action, event) => {
    const row = { state: stateFor(engine), action, event, progress: progressFor(engine, scenario), timingMs: 0 };
    trajectory.push(row);
    if (event) events.push({ ...event });
  };

  for (const target of policyTargets(scenario, strategy)) {
    if (steps >= maxSteps) { termination = 'step_limit'; break; }
    const path = pathToNeighbor(engine, scenario, target);
    if (path === null) { termination = `unreachable:${target.id}`; break; }
    for (const next of path) {
      const dx = next.x - engine.state.player.x;
      const dy = next.y - engine.state.player.y;
      const result = engine.move(dx,dy);
      steps++;
      if (!result.moved) invalidMoves++;
      record({ type:'move', dx, dy }, { type: result.moved ? 'moved' : 'move_blocked', reason: result.reason });
      if (steps >= maxSteps) break;
    }
    if (steps >= maxSteps) { termination = 'step_limit'; break; }

    const dx = target.x - engine.state.player.x;
    const dy = target.y - engine.state.player.y;
    const facing = engine.move(dx,dy);
    steps++;
    record({ type:'face', targetId:target.id }, { type:'target_faced', targetId:target.id, reason:facing.reason });
    const result = engine.interact();
    steps++;
    visited.add(target.id);

    if (result.type === 'battle') {
      battlePreparation = engine.getBattlePreparation();
      record({ type:'interact', targetId:target.id }, { type:'battle_started', targetId:target.id, encounterId:result.encounterId });
      engine.markBattleCleared();
      record({ type:'resolve_battle', result:'victory' }, { type:'battle_cleared', targetId:target.id });
    } else {
      record({ type:'interact', targetId:target.id }, { ...result, targetId:target.id });
    }
    if (result.type === 'exit') { termination = 'exit_reached'; break; }
    if (result.type === 'locked') { termination = `locked:${target.id}`; break; }
  }

  const discoveries = engine.getDiscoveries();
  const required = (scenario.entities || []).filter(entity => entity.required);
  const requiredCompleted = required.filter(entity => engine.state.interacted.includes(entity.id)).length;
  return {
    status: termination === 'exit_reached' ? 'completed' : 'incomplete',
    termination, trajectory, events, battlePreparation, snapshot: engine.snapshot(),
    metrics: {
      steps, invalidMoves, cluesFound: discoveries.clues,
      requiredCompletion: required.length ? requiredCompleted / required.length : 1,
      entityCoverage: (scenario.entities || []).length ? visited.size / scenario.entities.length : 1,
    },
  };
}
