/**
 * test_runtime_combat_audit.mjs
 * 战斗数值语义审计 — 源码级验证关键效果被正确消费与使用
 */
import { readFileSync, readdirSync } from 'fs';

let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log(`  ✓ ${msg}`); }
  else { fail++; console.error(`  ✗ ${msg}`); }
}

const combat = readFileSync('src/core/CombatSystem.js', 'utf8');
const gameState = readFileSync('src/core/GameState.js', 'utf8');
const loot = readFileSync('src/core/LootSystem.js', 'utf8');
const trap = readFileSync('src/core/TrapSystem.js', 'utf8');
const main = readFileSync('src/main.js', 'utf8');

// 读取所有核心文件
const allCore = readdirSync('src/core').filter(f => f.endsWith('.js')).map(f => ({
  name: f,
  code: readFileSync(`src/core/${f}`, 'utf8')
}));
const allCode = allCore.map(c => c.code).join('\n') + '\n' + main;

// ═══ 1. 首回合双行动 (firstTurnDoubleAction) ═══
console.log('[ 首回合双行动 ]');
ok(combat.includes('firstTurnDoubleAction'), 'CombatSystem 消费 firstTurnDoubleAction');
{
  // 验证它在第一回合执行额外攻击逻辑
  const m = combat.match(/firstTurnDoubleAction[\s\S]{0,500}/);
  if (m) {
    const block = m[0];
    const hasAttackLogic = block.includes('attack') || block.includes('damage') || block.includes('额外') || block.includes('行动') || block.includes('turn');
    ok(hasAttackLogic, '首回合双行动有攻击/行动逻辑');
  } else {
    ok(false, '首回合双行动代码块未匹配');
  }
}

// ═══ 2. 恐惧光环封顶 (fearAuraStack/fearAuraCap) ═══
console.log('[ 恐惧光环封顶 ]');
ok(combat.includes('fearAura'), 'CombatSystem 包含 fearAura');
{
  const hasCap = combat.includes('fearAuraCap') || (combat.includes('fearAura') && combat.includes('Math.min'));
  ok(hasCap, 'fearAura 有封顶逻辑 (Math.min 或 cap)');
  
  // 验证叠加逻辑
  const fearBlock = combat.match(/fearAura[\s\S]{0,800}/);
  if (fearBlock) {
    const hasStack = fearBlock[0].includes('stack') || fearBlock[0].includes('Stack') || fearBlock[0].includes('叠');
    ok(hasStack || fearBlock[0].includes('+=') || fearBlock[0].includes('fearAuraStack'), 'fearAura 有叠加机制');
  }
}

// ═══ 3. 双击攻击 (doubleAttackBonus) ═══
console.log('[ 双击攻击概率 ]');
ok(combat.includes('doubleAttackBonus'), 'CombatSystem 消费 doubleAttackBonus');
{
  const m = combat.match(/doubleAttackBonus[\s\S]{0,300}/);
  if (m) {
    ok(m[0].includes('Math.random') || m[0].includes('random'), '双击是概率触发（使用 Math.random）');
  } else {
    ok(false, '双击代码块未匹配');
  }
}

// ═══ 4. 低血量攻击加成 (lowHpAtkBonus) ═══
console.log('[ 低血量攻击加成 ]');
ok(combat.includes('lowHpAtkBonus'), 'CombatSystem 消费 lowHpAtkBonus');
{
  const m = combat.match(/lowHpAtkBonus[\s\S]{0,400}/);
  if (m) {
    ok(m[0].includes('hp') || m[0].includes('HP'), '低血量加成有 HP 判断');
  }
}

// ═══ 5. 经验倍率不双重应用 ═══
console.log('[ 经验倍率 ]');
{
  const expMultInCombat = (combat.match(/expMultiplier/g) || []).length;
  const expMultInGS = (gameState.match(/expMultiplier/g) || []).length;
  ok(expMultInCombat + expMultInGS > 0, '经验倍率在系统中存在');
  ok(expMultInCombat <= 3, `CombatSystem 中 expMultiplier 出现 ${expMultInCombat} 次（≤3，无双重应用）`);
}

// ═══ 6. 史诗保底 ═══
console.log('[ 史诗保底 ]');
ok(loot.includes('guaranteeEpicReward'), 'LootSystem 消费 guaranteeEpicReward');
{
  const m = loot.match(/guaranteeEpicReward[\s\S]{0,500}/);
  if (m) {
    ok(m[0].includes('epic') || m[0].includes('Epic') || m[0].includes('rarity') || m[0].includes('rare'), '史诗保底与稀有度关联');
  }
}

// ═══ 7. bonusStatPoints 语义 ═══
console.log('[ 属性加点 ]');
ok(allCode.includes('bonusStatPoints'), 'bonusStatPoints 在代码中存在');
{
  const m = gameState.match(/bonusStatPoints[\s\S]{0,400}/) || main.match(/bonusStatPoints[\s\S]{0,400}/);
  if (m) {
    const isAllocatable = m[0].includes('statPoints') || m[0].includes('allocat') || m[0].includes('unspent');
    const isDirect = m[0].includes('atk') || m[0].includes('def') || m[0].includes('ATK') || m[0].includes('DEF');
    ok(isAllocatable || isDirect, 'bonusStatPoints 有明确应用路径');
    console.log(`  ℹ️  方式: ${isAllocatable ? '可分配点' : isDirect ? '直接属性' : '未知'}`);
  }
}

// ═══ 8. eventBonusChance ═══
console.log('[ 事件奖励概率 ]');
ok(trap.includes('eventBonusChance'), 'TrapSystem 消费 eventBonusChance');

// ═══ 9. enemyIntentReveal ═══
console.log('[ 敌人意图显示 ]');
ok(combat.includes('enemyIntentReveal'), 'CombatSystem 消费 enemyIntentReveal');
{
  const m = combat.match(/enemyIntentReveal[\s\S]{0,400}/);
  if (m) {
    ok(m[0].includes('intent') || m[0].includes('Intent') || m[0].includes('预测') || m[0].includes('意图'), '意图显示有相关逻辑');
  }
}

// ═══ 10. canon_state 正史锁 ═══
console.log('[ 正史锁 canon_state ]');
{
  const hasCanon = allCode.includes('canon_state') || allCode.includes('canonState') || allCode.includes('canon');
  ok(hasCanon, 'canon_state / canonState 在系统中存在');
  
  // 验证 HP=0 不直接等于正史死亡
  const deathBlocks = allCode.match(/hp\s*[<=>]+\s*0[\s\S]{0,300}/g) || [];
  let directCanonDeath = false;
  for (const block of deathBlocks) {
    if (block.includes('canon_state') && block.includes('dead')) {
      directCanonDeath = true;
    }
  }
  ok(!directCanonDeath, 'HP=0 不直接写入正史死亡（分离设计）');
}

// ═══ 11. 张杰队长交接 (Ch5) ═══
console.log('[ 张杰Ch5队长交接 ]');
{
  let found = false;
  for (const c of allCore) {
    if (c.code.includes('队长') && (c.code.includes('张杰') || c.code.includes('Zhang'))) {
      found = true;
      break;
    }
  }
  if (!found) {
    found = main.includes('队长') && (main.includes('张杰') || main.includes('Zhang'));
  }
  ok(found, '张杰队长交接在代码中存在');
}

// ═══ 12. Ch7 结束只剩郑吒 ═══
console.log('[ Ch7结局: 只剩郑吒 ]');
{
  let found = false;
  for (const c of allCore) {
    if ((c.code.includes('复活') || c.code.includes('十字勋章') || c.code.includes('cross')) && 
        (c.code.includes('郑吒') || c.code.includes('Zheng'))) {
      found = true;
      break;
    }
  }
  ok(found, '郑吒复活/十字勋章机制在代码中存在');
}

// ═══ 13. 主神空间10日间隔 ═══
console.log('[ 主神空间10日间隔 ]');
{
  let found = false;
  const tenDays = allCode.includes('10日') || allCode.includes('十日') || allCode.includes('tenDays') || allCode.includes('10_days') || allCode.includes('restDays');
  ok(tenDays, '主神空间10日间隔在代码中被引用');
}

console.log(`\n══════════════════════════════════════════`);
console.log(`战斗数值语义审计: ${pass}通过, ${fail}失败`);
if (fail === 0) console.log('✅ 全部通过');
else console.log(`⚠️  ${fail} 项需修复`);

// Exit with failure if any tests failed
if (fail > 0) process.exit(1);
