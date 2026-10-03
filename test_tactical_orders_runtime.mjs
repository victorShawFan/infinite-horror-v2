// ═══════════════════════════════════════════════════════════════
// 战术指令运行时测试 — 验证四类指令真实生效
// ═══════════════════════════════════════════════════════════════
import {
  ORDER_TYPE,
  getCurrentOrder,
  setOrder,
  resetOrders,
  getOrderCombatEffect,
  tickOrderCooldown,
  renderOrderSelector,
  getOrderDescription,
} from './src/core/TacticalOrders.js';

import { getEffectiveAtk } from './src/core/CombatSystem.js';
import { attemptFlee } from './src/core/BattleActionMenu.js';
import { gameState } from './src/core/GameState.js';

let passed = 0, failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('  ✗ FAIL:', msg); }
}
function section(name) { console.log(`[ ${name} ]`); }

// ═══════════════════════════════════════════
section('基础指令切换');
resetOrders();
assert(getCurrentOrder().type === ORDER_TYPE.FOCUS_FIRE, '默认集火');
assert(setOrder(ORDER_TYPE.RETREAT) === true, '设置撤离成功');
assert(getCurrentOrder().type === ORDER_TYPE.RETREAT, '当前为撤离');
// 冷却期不能切换
assert(setOrder(ORDER_TYPE.COVER) === false, '冷却期不能切换');
tickOrderCooldown();
tickOrderCooldown();
assert(setOrder(ORDER_TYPE.COVER) === true, '冷却结束后可切换');

// ═══════════════════════════════════════════
section('集火效果');
resetOrders();
setOrder(ORDER_TYPE.FOCUS_FIRE);
const focusFx = getOrderCombatEffect();
assert(focusFx.companionDmgMult === 1.3, '集火同伴伤害1.3x');
assert(focusFx.companionDefMult === 0.8, '集火同伴防御0.8x');

// ═══════════════════════════════════════════
section('撤离效果 — 逃跑加成');
resetOrders();
setOrder(ORDER_TYPE.RETREAT);
const retreatFx = getOrderCombatEffect();
assert(retreatFx.fleeBonusChance === 0.2, '撤离加成0.2');
assert(retreatFx.companionDmgMult === 0.5, '撤离同伴伤害0.5x');
assert(retreatFx.companionDefMult === 1.5, '撤离同伴防御1.5x');

// 蒙特卡洛验证：撤离指令让逃跑概率确实更高
const trials = 10000;
let baseFlees = 0, bonusFlees = 0;
const testPlayer = { spd: 5, hp: 100, maxHp: 100 };
const testEnemy = { spd: 5, hp: 50, atk: 10, def: 5 };
for (let i = 0; i < trials; i++) {
  if (attemptFlee(testPlayer, testEnemy, {}).success) baseFlees++;
  if (attemptFlee(testPlayer, testEnemy, { fleeBonusChance: 0.2 }).success) bonusFlees++;
}
const baseRate = baseFlees / trials;
const bonusRate = bonusFlees / trials;
assert(bonusRate > baseRate, `撤离提高逃跑率: base=${(baseRate*100).toFixed(1)}% bonus=${(bonusRate*100).toFixed(1)}%`);
assert(Math.abs(baseRate - 0.4) < 0.05, `基础逃跑率约40%: ${(baseRate*100).toFixed(1)}%`);
assert(Math.abs(bonusRate - 0.6) < 0.05, `加成逃跑率约60%: ${(bonusRate*100).toFixed(1)}%`);

// ═══════════════════════════════════════════
section('掩护效果');
resetOrders();
setOrder(ORDER_TYPE.COVER);
const coverFx = getOrderCombatEffect();
assert(coverFx.playerDamageReduce === 0.2, '掩护减伤20%');
assert(coverFx.companionDmgMult === 0.7, '掩护同伴输出降低');

// ═══════════════════════════════════════════
section('互动效果');
resetOrders();
setOrder(ORDER_TYPE.INTERACT);
const interactFx = getOrderCombatEffect();
assert(interactFx.healChance === 0.3, '互动30%治疗概率');
assert(interactFx.healAmount === 10, '互动治疗量10');

// ═══════════════════════════════════════════
section('ATK修正 — 集火同伴贡献');
resetOrders();
// 初始化测试玩家
gameState.player = { hp: 100, maxHp: 100, atk: 50, def: 20, spd: 5, crt: 5, level: 5, bloodline: null };
gameState.companions = [{ id: 'zhang_jie', name: '张杰', alive: true }];

setOrder(ORDER_TYPE.FOCUS_FIRE);
const atkFocus = getEffectiveAtk(gameState.player);

resetOrders();
tickOrderCooldown(); tickOrderCooldown();
setOrder(ORDER_TYPE.RETREAT);
const atkRetreat = getEffectiveAtk(gameState.player);

assert(atkFocus > atkRetreat, `集火ATK(${atkFocus}) > 撤离ATK(${atkRetreat})`);

// ═══════════════════════════════════════════
section('UI渲染');
resetOrders();
gameState.companions = [{ id: 'zhang_jie', name: '张杰', alive: true }];
const html = renderOrderSelector();
assert(html.includes('集火'), '包含集火按钮');
assert(html.includes('撤离'), '包含撤离按钮');
assert(html.includes('掩护'), '包含掩护按钮');
assert(html.includes('互动'), '包含互动按钮');

const desc = getOrderDescription();
assert(desc.includes('集火'), '描述包含当前指令');

// ═══════════════════════════════════════════
section('冷却系统');
resetOrders();
setOrder(ORDER_TYPE.RETREAT);
assert(setOrder(ORDER_TYPE.FOCUS_FIRE) === false, '冷却中不能切换');
tickOrderCooldown();
assert(setOrder(ORDER_TYPE.FOCUS_FIRE) === false, '1回合后仍不能切');
tickOrderCooldown();
assert(setOrder(ORDER_TYPE.FOCUS_FIRE) === true, '2回合后可切');

console.log(`\n══════════════════════════════════════════`);
console.log(`战术指令运行时测试: ${passed}通过, ${failed}失败`);
if (failed === 0) console.log('✅ 战术指令系统全部通过');
else { console.log('❌ 有失败'); process.exit(1); }
