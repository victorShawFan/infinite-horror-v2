// ═══════════════════════════════════════════════════════════════
// 潜行与弹药系统 — 第二章核心机制
// 声源潜行 / 巡逻异形警戒 / 有限弹药
// ═══════════════════════════════════════════════════════════════

import { gameState } from './GameState.js';
import { eventBus } from './EventBus.js';

// ── 常量 ──
const NOISE_NORMAL_MOVE = 10;     // 正常移动噪音
const NOISE_SNEAK_MOVE = 2;      // 潜行移动噪音
const NOISE_COMBAT = 40;         // 战斗产生噪音
const NOISE_DECAY_PER_TURN = 5;  // 每回合噪音自然衰减
const NOISE_MAX = 100;           // 噪音上限
const ALERT_THRESHOLD = 30;      // 巡逻异形警戒阈值
const ALERT_RANGE = 5;           // 巡逻异形感知半径（曼哈顿距离）

// ── 状态 ──
let noiseLevel = 0;
let isSneaking = false;
let shiftHeld = false;

// ── 弹药 ──
const AMMO_CONFIG = {
  physical: { maxAmmo: 30, reloadCost: 1 }, // 普通弹药
  fire:     { maxAmmo: 15, reloadCost: 1 }, // 火焰弹药
};

let currentAmmo = 30;
let maxAmmo = 30;
let ammoType = 'physical';

// ── 噪音系统 ──
export function getNoise() { return noiseLevel; }
export function getIsSneaking() { return isSneaking; }
export function getAmmo() { return currentAmmo; }
export function getMaxAmmo() { return maxAmmo; }

/** 设置 Shift 按下状态（由 keydown/keyup 调用） */
export function setShiftHeld(held) {
  shiftHeld = held;
  isSneaking = held;
}

/** 移动时增加噪音 */
export function onPlayerMove() {
  const noiseAdd = shiftHeld ? NOISE_SNEAK_MOVE : NOISE_NORMAL_MOVE;
  noiseLevel = Math.min(NOISE_MAX, noiseLevel + noiseAdd);
  eventBus.emit('stealth:noise', { noise: noiseLevel, sneaking: shiftHeld });
}

/** 战斗增加噪音 */
export function onCombatNoise() {
  noiseLevel = Math.min(NOISE_MAX, noiseLevel + NOISE_COMBAT);
  eventBus.emit('stealth:noise', { noise: noiseLevel, combat: true });
}

/** 每回合结束衰减噪音 */
export function decayNoise() {
  noiseLevel = Math.max(0, noiseLevel - NOISE_DECAY_PER_TURN);
}

/** 检查巡逻敌人是否被惊动 */
export function isPatrolAlerted(enemy, playerX, playerY) {
  if (!enemy.patrol) return true; // 非巡逻敌人始终激活
  const dist = Math.abs(enemy.x - playerX) + Math.abs(enemy.y - playerY);
  if (dist > (enemy.alertRange || ALERT_RANGE)) return false; // 太远
  return noiseLevel >= (enemy.alertThreshold || ALERT_THRESHOLD);
}

/** 当进入章节2时初始化弹药 */
export function initAmmo(weapon) {
  const type = weapon?.damageType || 'physical';
  const cfg = AMMO_CONFIG[type] || AMMO_CONFIG.physical;
  ammoType = type;
  maxAmmo = cfg.maxAmmo;
  currentAmmo = maxAmmo;
}

/** 消耗弹药（返回是否有弹药） */
export function consumeAmmo(count = 1) {
  if (gameState.chapter < 2) return true; // 第一章无弹药限制
  if (currentAmmo <= 0) return false;
  currentAmmo = Math.max(0, currentAmmo - count);
  eventBus.emit('ammo:consumed', { current: currentAmmo, max: maxAmmo });
  return true;
}

/** 补充弹药 */
export function reloadAmmo(amount) {
  currentAmmo = Math.min(maxAmmo, currentAmmo + amount);
  eventBus.emit('ammo:reloaded', { current: currentAmmo, max: maxAmmo });
}

/** 重置系统（章节切换时） */
export function resetStealth() {
  noiseLevel = 0;
  isSneaking = false;
  shiftHeld = false;
  currentAmmo = maxAmmo;
}

/** 切换武器时更新弹药配置 */
export function updateAmmoForWeapon(weapon) {
  if (gameState.chapter < 2) return;
  const type = weapon?.damageType || 'physical';
  const cfg = AMMO_CONFIG[type] || AMMO_CONFIG.physical;
  ammoType = type;
  maxAmmo = cfg.maxAmmo;
  currentAmmo = Math.min(currentAmmo, maxAmmo);
}

/** 序列化（加入 gameState 存档） */
export function serializeStealth() {
  return { noiseLevel, currentAmmo, maxAmmo, ammoType };
}

/** 反序列化 */
export function deserializeStealth(data) {
  if (!data) return;
  noiseLevel = data.noiseLevel || 0;
  currentAmmo = data.currentAmmo ?? 30;
  maxAmmo = data.maxAmmo ?? 30;
  ammoType = data.ammoType || 'physical';
}
