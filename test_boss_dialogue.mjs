// ═══ Boss 对话系统验证 ═══
import {
  BOSS_DIALOGUES, getBossIntro, getBossPhaseDialogue,
  getBossLowHpLine, getBossDefeatLines, getBossKillPlayerLine,
  getBossPlayerLowHpLine, getBossInfo,
} from './src/core/BossDialogue.js';

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) pass++;
  else { fail++; console.log(`  ❌ ${msg}`); }
}

console.log('═══ Boss 对话系统验证 ═══\n');

// ── 12章Boss对话完整性 ──
const expectedBosses = [
  'tyrant_t002', 'alien_queen', 'kayako', 'imhotep', 'zhangjie',
  'alien_hybrid', 'demon_vanguard', 'dragon_lord', 'brain_bug',
  'chuxuan_shadow', 'demon_captain', 'lord_god_core',
];

console.log('── 12个Boss对话定义 ──');
for (const bossId of expectedBosses) {
  const d = BOSS_DIALOGUES[bossId];
  assert(d !== undefined, `${bossId}: 对话定义应存在`);
  assert(d.name, `${bossId}: 应有名称`);
  assert(d.icon, `${bossId}: 应有图标`);
  assert(Array.isArray(d.intro) && d.intro.length > 0, `${bossId}: 应有开场白`);
  assert(Array.isArray(d.lowHp) && d.lowHp.length > 0, `${bossId}: 应有低血量台词`);
  assert(d.defeat, `${bossId}: 应有败亡台词`);
  assert(d.killPlayer, `${bossId}: 应有击杀玩家台词`);
}

// ── API测试 ──
console.log('── API调用 ──');
const intro = getBossIntro('lord_god_core');
assert(Array.isArray(intro) && intro.length >= 3, '主神核心开场白应有3句以上');

const phaseD = getBossPhaseDialogue('imhotep', '复活仪式');
assert(typeof phaseD === 'string' && phaseD.length > 0, '伊莫顿复活仪式对话应存在');

const lowHp = getBossLowHpLine('kayako');
assert(typeof lowHp === 'string', '伽椰子低血量台词应是字符串');

const defeat = getBossDefeatLines('zhangjie');
assert(defeat && defeat.length > 0, '张杰败亡台词应存在');

const kill = getBossKillPlayerLine('demon_captain');
assert(typeof kill === 'string', '恶魔队队长击杀台词应是字符串');

const plHp = getBossPlayerLowHpLine('lord_god_core');
assert(typeof plHp === 'string', '主神核心对濒死玩家台词应存在');

const info = getBossInfo('dragon_lord');
assert(info && info.name === '巨龙领主', '巨龙领主信息应正确');
assert(info && info.icon === '🐉', '巨龙领主图标应正确');

// 未知Boss应返回null
assert(getBossIntro('nonexistent') === null, '未知Boss应返回null');
assert(getBossInfo('nonexistent') === null, '未知Boss info应返回null');

// ── 特殊Boss台词深度 ──
console.log('── 叙事深度验证 ──');
const lordDefeat = getBossDefeatLines('lord_god_core');
assert(lordDefeat.length >= 5, `最终Boss败亡台词应有5句以上(实际${lordDefeat?.length})`);

const zhangjeDefeat = getBossDefeatLines('zhangjie');
assert(zhangjeDefeat.some(l => l.includes('更强')), '张杰败亡应包含认可玩家成长');

console.log(`\nPassed: ${pass}  Failed: ${fail}`);
if (fail > 0) {
  console.log('\n═══ ❌ Boss对话测试失败 ═══');
  process.exit(1);
} else {
  console.log('\n═══ ✅ Boss对话系统验证全部通过 ═══');
}
