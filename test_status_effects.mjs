// 状态效果追踪器测试
import { addEffect, removeEffect, tickEffects, getActiveEffects, getEffectModifiers,
  renderEffectHUD, clearAllEffects, serializeEffects, deserializeEffects, EFFECT_TYPES
} from './src/core/StatusEffectTracker.js';

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) pass++;
  else { fail++; console.error('  \u274c', msg); }
}

// -- 清理 --
clearAllEffects();
assert(getActiveEffects().length === 0, 'start empty');

// -- 添加效果 --
assert(addEffect('atk_boost', 10, 3, '力量药水'), 'add atk_boost');
assert(getActiveEffects().length === 1, '1 active');
assert(getEffectModifiers().atk === 10, 'atk mod = 10');
console.log('  \u2713 添加效果正确');

// -- 同类型不叠加 --
addEffect('atk_boost', 5, 2, '弱药水');
assert(getActiveEffects().length === 1, 'still 1 (no stack)');
assert(getEffectModifiers().atk === 10, 'keeps stronger value');

addEffect('atk_boost', 15, 1, '强药水');
assert(getEffectModifiers().atk === 15, 'upgrades to stronger');
console.log('  \u2713 同类型不叠加');

// -- 多种效果 --
addEffect('def_debuff', -5, 2, '诅咒');
addEffect('crt_boost', 20, 4, '暴击油');
assert(getActiveEffects().length === 3, '3 active');
const mods = getEffectModifiers();
assert(mods.atk === 15, 'atk from boost');
assert(mods.def === -5, 'def from debuff');
assert(mods.crt === 20, 'crt from boost');
console.log('  \u2713 多种效果共存');

// -- tickEffects --
let expired = tickEffects(); // 1场战斗后
assert(expired.length === 1, '1 expired (atk_boost had 1 remaining)');
assert(getActiveEffects().length === 2, '2 remaining');

expired = tickEffects(); // 2场战斗后
assert(expired.length === 1, '1 more expired (def_debuff)');
assert(getActiveEffects().length === 1, '1 remaining (crt_boost)');
console.log('  \u2713 tickEffects递减正确');

// -- removeEffect --
assert(removeEffect('crt_boost'), 'remove crt_boost');
assert(getActiveEffects().length === 0, 'all cleared');
assert(!removeEffect('nonexistent'), 'remove nonexistent returns false');
console.log('  \u2713 手动移除正确');

// -- renderEffectHUD --
addEffect('regen', 15, 5, 'test');
const hud = renderEffectHUD();
assert(hud.length > 0, 'HUD has content');
assert(hud.includes('+15'), 'HUD shows value');
clearAllEffects();
assert(renderEffectHUD() === '', 'empty HUD when no effects');
console.log('  \u2713 HUD渲染正确');

// -- 序列化 --
addEffect('atk_boost', 10, 3);
addEffect('curse', -8, 2);
const serialized = serializeEffects();
assert(serialized.length === 2, 'serialized 2');
clearAllEffects();
assert(getActiveEffects().length === 0, 'cleared for deserialize');
deserializeEffects(serialized);
assert(getActiveEffects().length === 2, 'deserialized 2');
assert(getEffectModifiers().atk === 2, 'atk = 10 + (-8) = 2');
console.log('  \u2713 序列化/反序列化正确');

// -- EFFECT_TYPES --
const types = Object.keys(EFFECT_TYPES);
assert(types.length >= 10, 'at least 10 effect types: ' + types.length);
for (const [id, type] of Object.entries(EFFECT_TYPES)) {
  assert(type.name, id + ' has name');
  assert(type.icon, id + ' has icon');
  assert(type.color, id + ' has color');
}
console.log('  \u2713 ' + types.length + ' effect types defined');

clearAllEffects();
console.log('');
console.log('\u2550'.repeat(42));
console.log('\u72b6\u6001\u6548\u679c\u8ffd\u8e2a\u5668\u6d4b\u8bd5: ' + pass + '\u901a\u8fc7, ' + fail + '\u5931\u8d25');
if (fail === 0) console.log('\u2705 \u72b6\u6001\u6548\u679c\u8ffd\u8e2a\u5668\u5168\u90e8\u901a\u8fc7');
else { console.log('\u274c \u6709\u6d4b\u8bd5\u5931\u8d25'); process.exit(1); }
