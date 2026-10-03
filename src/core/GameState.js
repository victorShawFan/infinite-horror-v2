// ═══════════════════════════════════════════════════════════════
// 游戏全局状态管理
// ═══════════════════════════════════════════════════════════════

import { GAME_STATE, GENE_LOCK, BLOODLINE } from './constants.js';
import { initTalentState, getTalentEffects } from './TalentTree.js';
import { getEquipmentTotalStats, getActiveSetBonuses } from './EquipmentSystem.js';
import { eventBus } from './EventBus.js';

class GameState {
  constructor() {
    this.state = GAME_STATE.LOADING;
    this.turn = 0;
    this.chapter = 1;
    this.nodeIndex = 0; // 当前节点 0-5 对应 1-1 到 1-6
    this.worldName = '生化危机一';

    // 玩家核心属性
    this.player = {
      name: '郑吒',
      level: 1,
      exp: 0,
      expToNext: 100,

      hp: 100, maxHp: 100,
      atk: 12, def: 8,
      spd: 10, crt: 5,
      mana: 0, maxMana: 0,
      stamina: 100, maxStamina: 100,

      // 基因锁
      geneLock: GENE_LOCK.LOCKED,
      geneLockCharge: 0,   // 充能 0-100
      geneLockActive: false,

      // 血统
      bloodlines: [],
      activeBloodline: BLOODLINE.NONE,

      // 装备栏
      weapon: null,
      armor: null,
      accessory: null,

      // 技能芯片（最多装4个）
      chips: [],
      maxChips: 4,

      // 背包
      inventory: [],
      maxInventory: 20,

      // 钥匙
      keys: { yellow: 0, blue: 0, red: 0, special: 0 },

      // 货币
      rewardPoints: 0,  // 主神奖励点
      gold: 0,

      // 位置
      x: 0, y: 0,
      facing: 'down',
    };

    // 队友状态
    this.companions = [];
    this.karma = 0;
    this.soulShards = 0;

    // 剧情标记
    this.flags = new Set();

    // 已击杀boss
    this.defeatedBosses = new Set();

    // 战斗日志
    this.combatLog = [];

    // 选择记录
    this.choices = [];

    // 统计
    this.stats = {
      enemiesKilled: 0,
      bossesKilled: 0,
      damageDealt: 0,
      damageTaken: 0,
      maxSingleHit: 0,
      criticalHits: 0,
      itemsUsed: 0,
      goldEarned: 0,
      goldSpent: 0,
      turnsPlayed: 0,
      stepsWalked: 0,
      floorsCleared: 0,
      chaptersCleared: 0,
      deathCount: 0,
      skillsUsed: 0,
      loreFound: 0,
      startTime: Date.now(),
      totalPlayTime: 0,
    };

    // 已移除的实体ID（按楼层索引存储）
    this.removedEntityIds = {};  // { floorIndex: Set<entityId> }
    this.brokenSecrets = {};     // { "chapterIdx-floorIdx": Set<secretId> }

    // 天赋树
    this.talents = initTalentState();

    // 宝石背包
    this.gemInventory = [];

    // 同伴关系值
    this.relationships = {};
  }


  /** 完全重置游戏状态（新游戏） */
  reset() {
    this.state = GAME_STATE.LOADING;
    this.turn = 0;
    this.chapter = 1;
    this.nodeIndex = 0;
    this.worldName = '生化危机一';
    this.player = {
      name: '郑吒', level: 1, exp: 0, expToNext: 100,
      hp: 100, maxHp: 100, atk: 12, def: 8, spd: 10, crt: 5,
      mana: 0, maxMana: 0, stamina: 100, maxStamina: 100,
      geneLock: GENE_LOCK.LOCKED, geneLockCharge: 0, geneLockActive: false,
      bloodlines: [], activeBloodline: BLOODLINE.NONE,
      weapon: null, armor: null, accessory: null,
      chips: [], maxChips: 4,
      inventory: [], maxInventory: 20,
      keys: { yellow: 0, blue: 0, red: 0, special: 0 },
      rewardPoints: 0, gold: 0,
      x: 0, y: 0, facing: 'down',
    };
    this.companions = [];
    this.flags = new Set();
    this.defeatedBosses = new Set();
    this.combatLog = [];
    this.choices = [];
    this.stats = { enemiesKilled: 0, bossesKilled: 0, damageDealt: 0, damageTaken: 0, maxSingleHit: 0, criticalHits: 0, itemsUsed: 0, goldEarned: 0, goldSpent: 0, turnsPlayed: 0, stepsWalked: 0, floorsCleared: 0, chaptersCleared: 0, deathCount: 0, skillsUsed: 0, loreFound: 0, startTime: Date.now(), totalPlayTime: 0 };
    this.removedEntityIds = {};
    this.talents = initTalentState();
    this.gemInventory = [];
    this.relationships = {};
  }

  setState(newState) {
    const old = this.state;
    this.state = newState;
    eventBus.emit('state:change', { from: old, to: newState });
  }

  addExp(amount) {
    this.player.exp += amount;
    while (this.player.exp >= this.player.expToNext) {
      this.player.exp -= this.player.expToNext;
      this.player.level++;
      this.player.expToNext = Math.floor(this.player.expToNext * 1.5);
      this._onLevelUp();
    }
    eventBus.emit('player:exp', { exp: this.player.exp, level: this.player.level });
  }

  _onLevelUp() {
    const p = this.player;
    p.maxHp += 8 + Math.floor(p.level * 1.5);
    p.hp = p.maxHp;
    p.atk += 2;
    p.def += 1;
    p.spd += 1;
    p.maxStamina += 5;
    p.stamina = p.maxStamina;

    // 每次升级获得1天赋点
    this.talents.points += 1;

    // 天赋被动属性加成
    const te = getTalentEffects(this.talents);
    if (te.maxHp) p.maxHp += 0; // 天赋加成已在 getEffective* 中计算
    if (te.maxMana) {
      p.maxMana = Math.max(p.maxMana, te.maxMana);
    }

    eventBus.emit('player:levelup', {
      level: p.level,
      hp: p.maxHp, atk: p.atk, def: p.def,
      talentPoints: this.talents.points,
    });
  }

  healPlayer(amount) {
    const p = this.player;
    const healed = Math.min(amount, p.maxHp - p.hp);
    p.hp += healed;
    eventBus.emit('player:heal', { amount: healed, hp: p.hp });
    return healed;
  }

  damagePlayer(amount, type = 'physical') {
    const p = this.player;
    const actual = Math.max(1, amount - this._getDefense(type));
    p.hp -= actual;
    this.stats.damageTaken += actual;
    eventBus.emit('player:damage', { amount: actual, hp: p.hp, type });
    if (p.hp <= 0) {
      p.hp = 0;
      this.stats.deathCount++;
      eventBus.emit('player:death', {});
    }
    return actual;
  }

  _getDefense(type) {
    let def = this.player.def;
    // 基因锁激活时防御加成
    if (this.player.geneLockActive) {
      def += Math.floor(def * 0.3 * this.player.geneLock);
    }
    return def;
  }

  canFight(enemy) {
    // 魔塔式预判：能否打赢
    const playerDmg = Math.max(1, this.player.atk - enemy.def);
    const enemyDmg = Math.max(1, enemy.atk - this._getDefense('physical'));
    const turnsToKill = Math.ceil(enemy.hp / playerDmg);
    const damageTaken = enemyDmg * (turnsToKill - 1); // 先手攻击
    return {
      canWin: this.player.hp > damageTaken,
      turnsToKill,
      damageToTake: damageTaken,
      damagePerHit: playerDmg,
      enemyDamagePerHit: enemyDmg,
    };
  }

  addCompanion(companion) {
    this.companions.push(companion);
    eventBus.emit('companion:join', companion);
  }

  removeCompanion(id) {
    const idx = this.companions.findIndex(c => c.id === id);
    if (idx >= 0) {
      const removed = this.companions.splice(idx, 1)[0];
      eventBus.emit('companion:leave', removed);
      return removed;
    }
    return null;
  }

  setFlag(flag) {
    this.flags.add(flag);
    eventBus.emit('flag:set', { flag });
  }

  hasFlag(flag) {
    return this.flags.has(flag);
  }

  addChoice(choiceId, option) {
    this.choices.push({ id: choiceId, option, turn: this.turn, chapter: this.chapter });
    eventBus.emit('choice:made', { id: choiceId, option });
  }

  toJSON() {
    return {
      state: this.state,
      turn: this.turn,
      chapter: this.chapter,
      nodeIndex: this.nodeIndex,
      player: { ...this.player },
      companions: this.companions.map(c => ({ ...c })),
      flags: [...this.flags],
      defeatedBosses: [...this.defeatedBosses],
      choices: [...this.choices],
      stats: { ...this.stats },
      removedEntityIds: Object.fromEntries(
        Object.entries(this.removedEntityIds).map(([k, v]) => [k, [...(v || [])]])
      ),
      shopPurchased: [...(this._shopPurchased || [])],
      brokenSecrets: Object.fromEntries(
        Object.entries(this.brokenSecrets).map(([k, v]) => [k, [...(v || [])]])
      ),
      talents: { points: this.talents.points, allocated: { ...this.talents.allocated } },
      gemInventory: [...this.gemInventory],
      relationships: { ...this.relationships },
      soulFragments: this.player.soulFragments || 0,
      karma: this.karma || 0,
      soulShards: this.soulShards || 0,
    };
  }

  save(slot = 0) {
    const key = `infinite_horror_save_${slot}`;
    localStorage.setItem(key, JSON.stringify(this.toJSON()));
    eventBus.emit('game:saved', { slot });
  }

  load(slot = 0) {
    const key = `infinite_horror_save_${slot}`;
    const data = localStorage.getItem(key);
    if (!data) return false;
    try {
      const parsed = JSON.parse(data);
      Object.assign(this.player, parsed.player);
      this.turn = parsed.turn;
      this.chapter = parsed.chapter;
      this.nodeIndex = parsed.nodeIndex;
      this.companions = parsed.companions || [];
      this.flags = new Set(parsed.flags || []);
      this.defeatedBosses = new Set(parsed.defeatedBosses || []);
      this.choices = parsed.choices || [];
      this.stats = parsed.stats || this.stats;
      // 恢复已移除实体
      this.removedEntityIds = {};
    this.brokenSecrets = {};
      if (parsed.removedEntityIds) {
        for (const [k, v] of Object.entries(parsed.removedEntityIds)) {
          this.removedEntityIds[k] = new Set(v);
        }
      }
      this._shopPurchased = new Set(parsed.shopPurchased || []);
      // 恢复已破坏密道
      this.brokenSecrets = {};
      if (parsed.brokenSecrets) {
        for (const [k, v] of Object.entries(parsed.brokenSecrets)) {
          this.brokenSecrets[k] = new Set(v);
        }
      }
      // 天赋状态
      if (parsed.talents) {
        this.talents.points = parsed.talents.points || 0;
        this.talents.allocated = parsed.talents.allocated || { combat: 0, survival: 0, technique: 0 };
        this.talents._cache = null;
      }
      this.gemInventory = parsed.gemInventory || [];
      this.relationships = parsed.relationships || {};
      this.player.soulFragments = parsed.soulFragments || 0;
      this.karma = parsed.karma || 0;
      this.soulShards = parsed.soulShards || 0;
      eventBus.emit('game:loaded', { slot });
      return true;
    } catch (e) {
      console.error('Save load failed:', e);
      return false;
    }
  }
  /** 记录实体被移除（击杀/拾取） */
  markEntityRemoved(floorIndex, entityId) {
    if (!this.removedEntityIds[floorIndex]) {
      this.removedEntityIds[floorIndex] = new Set();
    }
    this.removedEntityIds[floorIndex].add(entityId);
  }

  /** 获取某楼层已移除的实体ID */
  getRemovedEntityIds(floorIndex) {
    return this.removedEntityIds[floorIndex] || new Set();
  }

  /** 记录密道被破坏 */
  markSecretBroken(chapterIdx, floorIdx, secretId) {
    const key = `${chapterIdx}-${floorIdx}`;
    if (!this.brokenSecrets[key]) {
      this.brokenSecrets[key] = new Set();
    }
    this.brokenSecrets[key].add(secretId);
  }

  /** 获取某楼层已破坏的密道ID集合 */
  getBrokenSecrets(chapterIdx, floorIdx) {
    const key = `${chapterIdx}-${floorIdx}`;
    return this.brokenSecrets[key] || new Set();
  }
}

export const gameState = new GameState();
