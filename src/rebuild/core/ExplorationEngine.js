const FACING = Object.freeze({
  '0,-1': 'up', '0,1': 'down', '-1,0': 'left', '1,0': 'right',
});

function cloneState(source, scenario) {
  return {
    player: { ...(source?.player || scenario.playerStart) },
    facing: source?.facing || 'down',
    interacted: [...new Set(source?.interacted || [])],
    pickedItems: [...new Set(source?.pickedItems || [])],
    battleCleared: Boolean(source?.battleCleared),
  };
}

export class ExplorationEngine {
  constructor(scenario, savedState = null) {
    if (!scenario?.width || !scenario?.height || !Array.isArray(scenario.tiles)) throw new Error('scenario_required');
    this.scenario = scenario;
    this.state = cloneState(savedState, scenario);
  }

  _tile(x, y) {
    if (x < 0 || y < 0 || x >= this.scenario.width || y >= this.scenario.height) return '#';
    return this.scenario.tiles[y]?.[x] || '#';
  }

  _entityAt(x, y) {
    return (this.scenario.entities || []).find(entity => entity.x === x && entity.y === y);
  }

  _isEntityBlocking(entity) {
    if (!entity) return false;
    if (entity.type === 'npc' || entity.type === 'object') return true;
    if (entity.type === 'item') return !this.state.pickedItems.includes(entity.id);
    return entity.type === 'battle' || entity.type === 'exit';
  }

  move(dx, dy) {
    const key = `${Number(dx)},${Number(dy)}`;
    if (!FACING[key]) return { moved: false, reason: 'invalid_direction' };
    this.state.facing = FACING[key];
    const x = this.state.player.x + Number(dx);
    const y = this.state.player.y + Number(dy);
    if (this._tile(x, y) === '#') return { moved: false, reason: 'wall' };
    const entity = this._entityAt(x, y);
    if (this._isEntityBlocking(entity)) return { moved: false, reason: 'entity', entityId: entity.id };
    this.state.player = { x, y };
    return { moved: true, player: { ...this.state.player } };
  }

  _frontPosition() {
    const vectors = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
    const [dx, dy] = vectors[this.state.facing] || vectors.down;
    return { x: this.state.player.x + dx, y: this.state.player.y + dy };
  }

  interact() {
    const front = this._frontPosition();
    const entity = this._entityAt(front.x, front.y);
    if (!entity) return { type: 'none' };
    if (entity.type === 'npc' || entity.type === 'object') {
      if (!this.state.interacted.includes(entity.id)) this.state.interacted.push(entity.id);
      return { type: 'dialogue', entityId: entity.id, name: entity.name, dialogue: [...(entity.dialogue || [])] };
    }
    if (entity.type === 'item') {
      if (this.state.pickedItems.includes(entity.id)) return { type: 'none' };
      this.state.pickedItems.push(entity.id);
      return { type: 'item', entityId: entity.id, itemId: entity.itemId, quantity: Math.max(1, Number(entity.quantity || 1)), name: entity.name };
    }
    if (entity.type === 'battle') {
      if (this.state.battleCleared) return { type: 'cleared' };
      const missing = (entity.requires || []).filter(id => !this.state.interacted.includes(id));
      if (missing.length) return { type: 'locked', entityId: entity.id, missing, message: entity.lockedText || '先与队友汇合并调查环境。' };
      return { type: 'battle', entityId: entity.id, encounterId: entity.encounterId };
    }
    if (entity.type === 'exit') {
      if (!this.state.battleCleared) return { type: 'locked', entityId: entity.id, missing: ['battle'], message: entity.lockedText || '威胁尚未清除，出口无法使用。' };
      return { type: 'exit', entityId: entity.id };
    }
    return { type: 'none' };
  }

  markBattleCleared() { this.state.battleCleared = true; }

  snapshot() {
    return {
      player: { ...this.state.player }, facing: this.state.facing,
      interacted: [...this.state.interacted], pickedItems: [...this.state.pickedItems],
      battleCleared: this.state.battleCleared,
    };
  }

  validateReachability() {
    const queue = [{ ...this.scenario.playerStart }];
    const seen = new Set([`${queue[0].x},${queue[0].y}`]);
    while (queue.length) {
      const current = queue.shift();
      for (const [dx, dy] of [[0,-1],[0,1],[-1,0],[1,0]]) {
        const next = { x: current.x + dx, y: current.y + dy };
        const key = `${next.x},${next.y}`;
        if (seen.has(key) || this._tile(next.x, next.y) === '#') continue;
        seen.add(key); queue.push(next);
      }
    }
    const unreachable = (this.scenario.entities || []).filter(entity => !seen.has(`${entity.x},${entity.y}`)).map(entity => entity.id);
    return { ok: unreachable.length === 0, unreachable };
  }
}
