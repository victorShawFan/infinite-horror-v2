export const ACTION_KIND = Object.freeze({
  ATTACK: 'attack',
  SKILL: 'skill',
  DEFEND: 'defend',
  ITEM: 'item',
  FLEE: 'flee',
});

export const TARGET_KIND = Object.freeze({
  SINGLE_ENEMY: 'single_enemy',
  ALL_ENEMIES: 'all_enemies',
  SINGLE_ALLY: 'single_ally',
  ALL_ALLIES: 'all_allies',
  SELF: 'self',
});

function cloneCombatant(source, side, stableIndex) {
  const maxHp = Math.max(1, Number(source.maxHp ?? source.hp ?? 1));
  const maxMp = Math.max(0, Number(source.maxMp ?? source.mp ?? 0));
  return {
    ...source,
    side,
    stableIndex,
    maxHp,
    hp: Math.max(0, Math.min(maxHp, Number(source.hp ?? maxHp))),
    maxMp,
    mp: Math.max(0, Math.min(maxMp, Number(source.mp ?? maxMp))),
    atk: Math.max(1, Number(source.atk ?? 1)),
    def: Math.max(0, Number(source.def ?? 0)),
    spd: Math.max(0, Number(source.spd ?? 0)),
    crit: Math.max(0, Number(source.crit ?? 0)),
    skills: [...(source.skills || [])],
    inventory: { ...(source.inventory || {}) },
    cooldowns: { ...(source.cooldowns || {}) },
    guarding: false,
  };
}

export class TurnBattleEngine {
  constructor({ party, enemies, skills = {}, items = {}, rng = Math.random, rewards = {}, rules = {} }) {
    if (!Array.isArray(party) || party.length === 0) throw new Error('party_required');
    if (!Array.isArray(enemies) || enemies.length === 0) throw new Error('enemies_required');

    this.skills = skills;
    this.items = items;
    this.rng = rng;
    this.rewards = { exp: 0, points: 0, ...rewards };
    this.rules = rules || {};
    this.round = 1;
    this.status = 'active';
    this.resultClaimed = false;
    this.combatants = [
      ...party.map((unit, index) => cloneCombatant(unit, 'party', index)),
      ...enemies.map((unit, index) => cloneCombatant(unit, 'enemy', party.length + index)),
    ];
    this.turnOrder = this._createTurnOrder();
    this.turnCursor = 0;
  }

  _createTurnOrder() {
    return [...this.combatants].sort((a, b) => b.spd - a.spd || a.stableIndex - b.stableIndex);
  }

  getTurnOrder() {
    return this.turnOrder.filter(unit => unit.hp > 0);
  }

  getCombatant(id) {
    return this.combatants.find(unit => unit.id === id);
  }

  getCurrentActor() {
    if (this.status !== 'active') return null;
    this._skipInvalidTurns();
    return this.turnOrder[this.turnCursor] || null;
  }

  getLiving(side) {
    return this.combatants.filter(unit => unit.side === side && unit.hp > 0);
  }

  _skipInvalidTurns(events = []) {
    let guard = 0;
    while (this.turnOrder[this.turnCursor]?.hp <= 0 && guard < this.turnOrder.length) {
      this._advanceCursor(events);
      guard++;
    }
  }

  _advanceCursor(events = []) {
    this.turnCursor++;
    if (this.turnCursor >= this.turnOrder.length) {
      this.turnCursor = 0;
      this.round++;
      this._applyRoundRules(events);
    }
    const nextActor = this.turnOrder[this.turnCursor];
    if (nextActor?.hp > 0) this._tickCooldowns(nextActor);
  }

  _tickCooldowns(actor) {
    for (const [skillId, remaining] of Object.entries(actor.cooldowns || {})) {
      actor.cooldowns[skillId] = Math.max(0, Number(remaining || 0) - 1);
    }
  }

  _finishTurn(actor, events) {
    this._advanceCursor(events);
    this._checkOutcome(events);
    if (this.status === 'active') this._skipInvalidTurns(events);
  }

  _applyRoundRules(events) {
    const hazard = this.rules.roundHazard;
    if (!hazard || this.round % Math.max(1, Number(hazard.interval || 1)) !== 0) return;
    const side = hazard.targetSide || 'party';
    for (const target of this.getLiving(side)) {
      let amount = Math.max(1, Number(hazard.damage || 1));
      if (target.guarding) amount = Math.max(1, Math.floor(amount * 0.5));
      target.hp = Math.max(0, target.hp - amount);
      events.push({
        type: 'hazard_damage',
        hazardId: hazard.id,
        hazardName: hazard.name,
        targetId: target.id,
        amount,
        defeated: target.hp === 0,
      });
    }
  }

  _oppositeSide(side) {
    return side === 'party' ? 'enemy' : 'party';
  }

  _validateSingleTarget(actor, action, expectedSide) {
    if (Array.isArray(action.targetIds) && action.targetIds.length !== 1) {
      return { error: 'invalid_target_count' };
    }
    const targetId = action.targetId || action.targetIds?.[0];
    const target = this.getCombatant(targetId);
    if (!target || target.hp <= 0 || target.side !== expectedSide) return { error: 'invalid_target' };
    return { target };
  }

  _dealDamage(actor, target, power, events, skillId = null) {
    const raw = Math.floor(actor.atk * power);
    const critical = this.rng() < actor.crit / 100;
    const critMultiplier = critical ? 1.5 : 1;
    let amount = Math.max(1, Math.floor(raw * critMultiplier) - target.def);
    const protectorIds = Array.isArray(target.protectedBy) ? target.protectedBy : [];
    const activeProtectors = protectorIds.filter(id => this.getCombatant(id)?.hp > 0);
    if (activeProtectors.length > 0) {
      const reduction = Math.min(0.95, Math.max(0, Number(target.protectionReduction || 0.5)));
      amount = Math.max(1, Math.floor(amount * (1 - reduction)));
      events.push({
        type: 'protection',
        targetId: target.id,
        protectorIds: activeProtectors,
        reduction,
      });
    }
    if (target.guarding) amount = Math.max(1, Math.floor(amount * 0.5));
    target.hp = Math.max(0, target.hp - amount);
    events.push({
      type: 'damage', actorId: actor.id, targetId: target.id,
      skillId, amount, critical, defeated: target.hp === 0,
    });
    this._checkBossPhase(target, events);
  }

  _checkBossPhase(target, events) {
    if (!target.boss || target.hp <= 0 || Number(target.phase || 1) >= 2) return;
    const threshold = Number(target.phaseThreshold ?? 0.5);
    if (target.hp / target.maxHp > threshold) return;
    target.phase = 2;
    const atkBonus = Math.max(0, Number(target.phaseAtkBonus || 0));
    target.atk += atkBonus;
    events.push({
      type: 'boss_phase',
      actorId: target.id,
      phase: 2,
      atkBonus,
    });
  }

  _heal(actor, target, healPower, events, skillId) {
    const amount = Math.max(1, Math.floor(actor.atk * healPower));
    const applied = Math.min(amount, target.maxHp - target.hp);
    target.hp += applied;
    events.push({ type: 'heal', actorId: actor.id, targetId: target.id, skillId, amount: applied });
  }

  _checkOutcome(events) {
    if (this.getLiving('enemy').length === 0) {
      this.status = 'victory';
      events.push({ type: 'battle_end', result: 'victory' });
    } else if (this.getLiving('party').length === 0) {
      this.status = 'defeat';
      events.push({ type: 'battle_end', result: 'defeat' });
    }
  }

  act(action) {
    if (this.status !== 'active') return { ok: false, error: 'battle_finished', events: [] };
    const actor = this.getCurrentActor();
    if (!actor || action.actorId !== actor.id) return { ok: false, error: 'not_actor_turn', events: [] };
    const events = [{ type: 'action_start', actorId: actor.id, kind: action.kind }];

    if (action.kind === ACTION_KIND.DEFEND) {
      actor.guarding = true;
      events.push({ type: 'guard', actorId: actor.id });
    } else if (action.kind === ACTION_KIND.ATTACK) {
      const validation = this._validateSingleTarget(actor, action, this._oppositeSide(actor.side));
      if (validation.error) return { ok: false, error: validation.error, events: [] };
      actor.guarding = false;
      this._dealDamage(actor, validation.target, 1, events);
    } else if (action.kind === ACTION_KIND.SKILL) {
      const skill = this.skills[action.skillId];
      if (!skill || !actor.skills.includes(skill.id)) return { ok: false, error: 'skill_unavailable', events: [] };
      if ((actor.cooldowns?.[skill.id] || 0) > 0) return { ok: false, error: 'skill_on_cooldown', events: [] };
      if (actor.mp < (skill.mpCost || 0)) return { ok: false, error: 'insufficient_mp', events: [] };

      let targets;
      if (skill.target === TARGET_KIND.SINGLE_ENEMY || skill.target === TARGET_KIND.SINGLE_ALLY) {
        const expectedSide = skill.target === TARGET_KIND.SINGLE_ENEMY ? this._oppositeSide(actor.side) : actor.side;
        const validation = this._validateSingleTarget(actor, action, expectedSide);
        if (validation.error) return { ok: false, error: validation.error, events: [] };
        targets = [validation.target];
      } else if (skill.target === TARGET_KIND.ALL_ENEMIES) {
        targets = this.getLiving(this._oppositeSide(actor.side));
      } else if (skill.target === TARGET_KIND.ALL_ALLIES) {
        targets = this.getLiving(actor.side);
      } else if (skill.target === TARGET_KIND.SELF) {
        targets = [actor];
      } else {
        return { ok: false, error: 'invalid_skill_target', events: [] };
      }

      actor.guarding = false;
      actor.mp -= skill.mpCost || 0;
      actor.cooldowns[skill.id] = Math.max(0, Number(skill.cooldown || 0));
      events[0].skillId = skill.id;
      for (const target of targets) {
        if (skill.healPower) this._heal(actor, target, skill.healPower, events, skill.id);
        else this._dealDamage(actor, target, skill.power || 1, events, skill.id);
      }
    } else if (action.kind === ACTION_KIND.ITEM) {
      const item = this.items[action.itemId];
      if (!item || (actor.inventory?.[action.itemId] || 0) <= 0) {
        return { ok: false, error: 'item_unavailable', events: [] };
      }
      let targets;
      if (item.target === TARGET_KIND.SINGLE_ALLY) {
        const validation = this._validateSingleTarget(actor, action, actor.side);
        if (validation.error) return { ok: false, error: validation.error, events: [] };
        targets = [validation.target];
      } else if (item.target === TARGET_KIND.ALL_ALLIES) {
        targets = this.getLiving(actor.side);
      } else {
        return { ok: false, error: 'invalid_item_target', events: [] };
      }
      if (!targets.some(target => target.hp < target.maxHp)) {
        return { ok: false, error: 'no_effect', events: [] };
      }
      actor.guarding = false;
      actor.inventory[action.itemId]--;
      events[0].itemId = item.id;
      events.push({ type: 'item_use', actorId: actor.id, itemId: item.id });
      for (const target of targets) {
        const applied = Math.min(item.healFlat || 0, target.maxHp - target.hp);
        target.hp += applied;
        if (applied > 0) {
          events.push({ type: 'item_heal', actorId: actor.id, targetId: target.id, itemId: item.id, amount: applied });
        }
      }
    } else {
      return { ok: false, error: 'unsupported_action', events: [] };
    }

    this._checkOutcome(events);
    if (this.status === 'active') this._finishTurn(actor, events);
    return { ok: true, events, status: this.status };
  }

  claimResult() {
    if (this.status === 'active') return { ok: false, error: 'battle_active' };
    if (this.resultClaimed) return { ok: false, error: 'already_claimed' };
    this.resultClaimed = true;
    return { ok: true, result: this.status, rewards: { ...this.rewards } };
  }
}
