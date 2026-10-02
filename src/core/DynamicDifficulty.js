// =================================================================
// 动态难度自适应系统 — 根据玩家表现自动微调
// =================================================================
// 在玩家选择的难度基础上，根据实时表现进行微调:
// - 连续胜利且无伤: 微增敌人属性
// - 连续死亡: 微降敌人属性 + 增加掉落
// - 确保玩家始终有挑战但不至于卡关

import { eventBus } from './EventBus.js';

// 动态难度系数 (0.7 ~ 1.3, 默认1.0)
let _dynamicFactor = 1.0;
let _consecutiveEasyWins = 0; // 连续轻松胜利(损失<20%HP)
let _consecutiveDeaths = 0;   // 连续死亡
let _totalWins = 0;
let _totalLosses = 0;
let _enabled = true;

// 配置
const CONFIG = {
  minFactor: 0.75,        // 最低难度系数
  maxFactor: 1.30,        // 最高难度系数
  easyWinThreshold: 0.20, // HP损失低于此比例视为轻松胜利
  increaseStep: 0.03,     // 每次轻松胜利增加的系数
  decreaseStep: 0.05,     // 每次死亡减少的系数
  resetOnDeath: true,      // 死亡时重置连胜计数
  easyWinStreak: 3,       // 连续几场轻松胜利才调整
  deathStreak: 2,         // 连续几次死亡才调整
};

export function recordVictory(hpLostPercent) {
  if (!_enabled) return;
  _totalWins++;
  _consecutiveDeaths = 0;
  
  if (hpLostPercent < CONFIG.easyWinThreshold) {
    _consecutiveEasyWins++;
    if (_consecutiveEasyWins >= CONFIG.easyWinStreak) {
      _dynamicFactor = Math.min(CONFIG.maxFactor, _dynamicFactor + CONFIG.increaseStep);
      _consecutiveEasyWins = 0;
      eventBus.emit('difficulty:adjusted', { direction: 'up', factor: _dynamicFactor });
    }
  } else {
    _consecutiveEasyWins = Math.max(0, _consecutiveEasyWins - 1);
  }
}

export function recordDeath() {
  if (!_enabled) return;
  _totalLosses++;
  _consecutiveDeaths++;
  _consecutiveEasyWins = 0;
  
  if (_consecutiveDeaths >= CONFIG.deathStreak) {
    _dynamicFactor = Math.max(CONFIG.minFactor, _dynamicFactor - CONFIG.decreaseStep);
    _consecutiveDeaths = 0;
    eventBus.emit('difficulty:adjusted', { direction: 'down', factor: _dynamicFactor });
  }
}

export function getDynamicFactor() {
  return _enabled ? _dynamicFactor : 1.0;
}

export function getDynamicDifficultyInfo() {
  const pct = Math.round((_dynamicFactor - 1.0) * 100);
  let label, color;
  if (pct > 10) { label = '\u56f0\u96be'; color = '#ff4444'; }
  else if (pct > 3) { label = '\u7565\u96be'; color = '#ff8844'; }
  else if (pct < -10) { label = '\u964d\u4f4e'; color = '#44ff88'; }
  else if (pct < -3) { label = '\u7565\u6613'; color = '#88ff44'; }
  else { label = '\u6807\u51c6'; color = '#aaaaaa'; }
  
  return {
    factor: _dynamicFactor,
    percent: pct,
    label,
    color,
    enabled: _enabled,
    wins: _totalWins,
    losses: _totalLosses,
    streak: { easyWins: _consecutiveEasyWins, deaths: _consecutiveDeaths },
  };
}

export function setDynamicDifficultyEnabled(enabled) {
  _enabled = !!enabled;
  if (!_enabled) _dynamicFactor = 1.0;
}

export function resetDynamicDifficulty() {
  _dynamicFactor = 1.0;
  _consecutiveEasyWins = 0;
  _consecutiveDeaths = 0;
  _totalWins = 0;
  _totalLosses = 0;
}

export function serializeDynamicDifficulty() {
  return {
    factor: _dynamicFactor,
    easyWins: _consecutiveEasyWins,
    deaths: _consecutiveDeaths,
    totalWins: _totalWins,
    totalLosses: _totalLosses,
    enabled: _enabled,
  };
}

export function deserializeDynamicDifficulty(data) {
  if (!data) return;
  _dynamicFactor = data.factor || 1.0;
  _consecutiveEasyWins = data.easyWins || 0;
  _consecutiveDeaths = data.deaths || 0;
  _totalWins = data.totalWins || 0;
  _totalLosses = data.totalLosses || 0;
  _enabled = data.enabled !== false;
}

// 应用动态难度到敌人属性
export function applyDynamicScaling(enemy) {
  if (!_enabled || _dynamicFactor === 1.0) return enemy;
  
  const f = _dynamicFactor;
  return {
    ...enemy,
    hp: Math.ceil(enemy.hp * f),
    atk: Math.ceil(enemy.atk * f),
    def: Math.ceil(enemy.def * (1 + (f - 1) * 0.5)), // DEF调整幅度小一些
    // 奖励反向调整: 难度越高奖励越多
    rewards: enemy.rewards ? {
      ...enemy.rewards,
      exp: Math.ceil((enemy.rewards.exp || 0) * (1 + (f - 1) * 0.5)),
      gold: Math.ceil((enemy.rewards.gold || 0) * (1 + (f - 1) * 0.3)),
    } : enemy.rewards,
  };
}
