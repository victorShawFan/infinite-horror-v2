// ═══════════════════════════════════════════════════════════════
// 可种子随机数系统 — 支持确定性测试与回放
// ═══════════════════════════════════════════════════════════════
//
// 生产环境使用 Math.random()
// 测试环境注入确定性种子 RNG
// 支持保存和恢复随机状态（用于回放/录像）
// ═══════════════════════════════════════════════════════════════

let _customRng = null;

/**
 * mulberry32 PRNG — 简单高效的32位种子随机数生成器
 */
function mulberry32(seed) {
  let s = seed | 0;
  return function() {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * 设置确定性种子（测试/回放用）
 * @param {number} seed - 随机种子
 */
export function setSeed(seed) {
  _customRng = mulberry32(seed);
}

/**
 * 清除种子，恢复 Math.random()
 */
export function clearSeed() {
  _customRng = null;
}

/**
 * 注入自定义 RNG 函数
 * @param {Function} rngFn - 返回 [0, 1) 的函数
 */
export function setCustomRng(rngFn) {
  _customRng = rngFn;
}

/**
 * 获取 [0, 1) 随机数
 * 测试模式使用种子 RNG，生产模式使用 Math.random()
 */
export function random() {
  return _customRng ? _customRng() : Math.random();
}

/**
 * 获取 [min, max] 范围内的随机整数
 */
export function randomInt(min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}

/**
 * 获取 [min, max] 范围内的随机浮点数
 */
export function randomFloat(min, max) {
  return min + random() * (max - min);
}

/**
 * 随机从数组中选择一个元素
 */
export function randomPick(arr) {
  if (!arr || arr.length === 0) return undefined;
  return arr[Math.floor(random() * arr.length)];
}

/**
 * 随机打乱数组（Fisher-Yates）
 */
export function shuffle(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * 按权重随机选择
 * @param {Array<{weight: number}>} items - 带权重的元素数组
 */
export function weightedPick(items) {
  if (!items || items.length === 0) return undefined;
  const total = items.reduce((sum, item) => sum + (item.weight || 1), 0);
  let roll = random() * total;
  for (const item of items) {
    roll -= (item.weight || 1);
    if (roll <= 0) return item;
  }
  return items[items.length - 1];
}

/**
 * 概率判定（百分比）
 * @param {number} percent - 0-100 的百分比
 */
export function chance(percent) {
  return random() * 100 < percent;
}

/**
 * 伤害浮动计算
 * @param {number} base - 基础伤害
 * @param {number} variance - 浮动幅度 (默认 0.15 = ±15%)
 */
export function damageVariance(base, variance = 0.15) {
  const multiplier = (1 - variance) + random() * (variance * 2);
  return Math.max(1, Math.floor(base * multiplier));
}

/**
 * 检查当前是否使用确定性 RNG
 */
export function isSeeded() {
  return _customRng !== null;
}
