// ═══════════════════════════════════════════════════════════════
// 战斗策略系统测试 — 连锁反应 + 战术位置 + 蓄力 + 战术连携
// ═══════════════════════════════════════════════════════════════

import { resetChainState, recordElementHit, recordStatusApplied, applyChainDamage, getChainStats, formatChainLog, getChainPreview } from './src/core/ChainReaction.js';
import { resetTactics, recordTacticalAction, onDefendChosen, consumeCharge, addCharge, getChargeLevel, getCurrentPosition, switchPosition, getPositionModifier, exploitWeakness, getTacticalSummary } from './src/core/CombatTactics.js';

let passed = 0, failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('FAIL:', msg); }
}

console.log('[ 连锁反应系统 ]');

// Test 1: Element chain detection
resetChainState();
const r1 = recordElementHit('fire');
assert(r1 === null, '单元素不触发连锁');
const r2 = recordElementHit('ice');
assert(r2 !== null, '火+冰应触发连锁');
assert(r2.name === '蒸汽爆裂', '火+冰 = 蒸汽爆裂');
assert(r2.dmgMultiplier === 1.5, '蒸汽爆裂 1.5倍伤害');

// Test 2: Chain damage with gene lock
const chainDmg = applyChainDamage(r2, 100, 0);
assert(chainDmg === 150, '100基础×1.5=150');
const chainDmgGL4 = applyChainDamage(r2, 100, 4);
assert(chainDmgGL4 > 150, '基因锁4应增加伤害');

// Test 3: Chain stats
const stats = getChainStats();
assert(stats.count === 1, '触发1次连锁');
assert(stats.history.length === 1, '历史记录1条');

// Test 4: Status chain
resetChainState();
recordStatusApplied('burn');
const sc = recordStatusApplied('frozen');
assert(sc !== null, '燃烧+冰冻应触发连锁');
assert(sc.name === '热力冲击', '燃烧+冰冻 = 热力冲击');

// Test 5: Dark+Holy chain (strongest)
resetChainState();
recordElementHit('dark');
const dh = recordElementHit('holy');
assert(dh !== null, '暗+光应触发连锁');
assert(dh.dmgMultiplier === 2.0, '虚无崩坏 2x伤害');

// Test 6: Chain log format
const log = formatChainLog(dh);
assert(log.text.includes('虚无崩坏'), '日志包含连锁名');
assert(log.type === 'chain_reaction', '日志类型正确');

// Test 7: Chain preview
const previews = getChainPreview(['fire', 'lightning'], 'ice');
assert(previews.length > 0, '应有可预览的连锁');

console.log('[ 战术位置系统 ]');

// Test 8: Initial position
resetTactics();
assert(getCurrentPosition() === 'front', '初始位置为前排');
const frontMod = getPositionModifier();
assert(frontMod.atkMult === 1.15, '前排ATK+15%');
assert(frontMod.defMult === 0.9, '前排DEF-10%');

// Test 9: Switch position
const backMod = switchPosition();
assert(getCurrentPosition() === 'back', '切换到后排');
assert(backMod.atkMult === 0.85, '后排ATK-15%');
assert(backMod.defMult === 1.15, '后排DEF+15%');

console.log('[ 蓄力系统 ]');

// Test 10: Charge mechanics
resetTactics();
assert(getChargeLevel() === 0, '初始蓄力0');
const chargeLog = onDefendChosen();
assert(getChargeLevel() === 1, '防御后蓄力1');
assert(chargeLog.text.includes('蓄力'), '蓄力日志');

onDefendChosen();
onDefendChosen();
assert(getChargeLevel() === 3, '最大蓄力3');
onDefendChosen(); // Should cap at 3
assert(getChargeLevel() === 3, '蓄力上限3');

const charge = consumeCharge();
assert(charge.level === 3, '消耗3级蓄力');
assert(charge.dmgMultiplier === 2.5, '3级蓄力 2.5x');
assert(charge.critBonus === 45, '3级蓄力 +45%暴击');
assert(getChargeLevel() === 0, '消耗后归零');

console.log('[ 战术连携 ]');

// Test 11: Tactical combo detection
resetTactics();
let tc1 = recordTacticalAction('defend');
assert(tc1 === null, '不足3步不触发');
let tc2 = recordTacticalAction('defend');
assert(tc2 === null, '不足3步不触发');
let tc3 = recordTacticalAction('attack');
assert(tc3 !== null, '防防攻应触发坚壁反击');
assert(tc3.name === '坚壁反击', '坚壁反击连携');
assert(tc3.dmgMultiplier === 2.0, '坚壁反击2x');
assert(tc3.guaranteeCrit === true, '坚壁反击必暴击');

// Test 12: Another combo
resetTactics();
recordTacticalAction('attack');
recordTacticalAction('attack');
const tc4 = recordTacticalAction('attack');
assert(tc4 !== null, '攻攻攻应触发疾风连击');
assert(tc4.name === '疾风连击', '疾风连击连携');

// Test 13: Skill combo
resetTactics();
recordTacticalAction('skill');
recordTacticalAction('skill');
const tc5 = recordTacticalAction('skill');
assert(tc5 !== null, '技技技应触发法力倾泻');
assert(tc5.manaRecover === 20, '法力倾泻回蓝20');

console.log('[ 弱点利用 ]');

// Test 14: Weakness exploitation with diminishing returns
resetTactics();
const w1 = exploitWeakness('zombie_01', 'fire');
assert(w1.effectiveness === 1.5, '首次弱点利用1.5x');
const w2 = exploitWeakness('zombie_01', 'fire');
assert(w2.effectiveness < w1.effectiveness, '第二次效果递减');
const w3 = exploitWeakness('zombie_01', 'fire');
const w4 = exploitWeakness('zombie_01', 'fire');
assert(w4.diminishing === true, '多次利用标记递减');

// Test 15: Tactical summary
const summary = getTacticalSummary();
assert(summary.position !== undefined, '摘要包含位置');
assert(summary.chargeLevel !== undefined, '摘要包含蓄力');

console.log('');
console.log('══════════════════════════════════════════');
console.log(`战斗策略系统测试: ${passed}通过, ${failed}失败`);
if (failed === 0) console.log('✅ 全部通过');
else { console.log('❌ 存在失败'); process.exit(1); }
