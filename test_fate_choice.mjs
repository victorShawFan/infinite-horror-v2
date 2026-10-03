import {
  resetFateChoices, checkFateChoice, makeFateChoice,
  applyFateConsequence, getChoiceHistory, hasChosenOption,
  getFateStats, renderFateChoiceUI, renderFateHistoryPanel,
  serializeFateChoices, deserializeFateChoices,
} from './src/core/FateChoiceSystem.js';

let passed = 0, failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('FAIL:', msg); }
}

console.log('[ 命运抉择系统 ]');

// Test 1: Initial state
resetFateChoices();
const stats = getFateStats();
assert(stats.total >= 7, '至少7个命运抉择');
assert(stats.made === 0, '初始0个已做');

// Test 2: Check choices by chapter
const ch1f2 = checkFateChoice(1, 2);
assert(ch1f2.length > 0, '第1章第2层有选择');
assert(ch1f2[0].title === '幸存者的请求', '幸存者的请求');

const ch5f2 = checkFateChoice(5, 2);
assert(ch5f2.length > 0, '第5章第2层有选择');
assert(ch5f2[0].title.includes('竖锯'), '竖锯的考验');

const ch12f5 = checkFateChoice(12, 5);
assert(ch12f5.length > 0, '第12章第5层有选择');
assert(ch12f5[0].title === '终极抉择', '终极抉择');

// Test 3: No choices on random floors
const ch1f1 = checkFateChoice(1, 1);
assert(ch1f1.length === 0, '第1章第1层无选择');

// Test 4: Make a choice
const result = makeFateChoice('ch1_survivor', 'help');
assert(result.success, '选择成功');
assert(result.option.text === '带上他', '选择了带上他');
assert(result.consequence.karma === 15, '业力+15');
assert(result.consequence.spd === -2, '速度-2');

// Test 5: Apply consequence
const player = { atk: 20, def: 10, maxHp: 100, hp: 100, spd: 5, gold: 0, exp: 0, karma: 0, inventory: [] };
const applied = applyFateConsequence(result.consequence, player);
assert(applied.changes.length > 0, '有属性变化');
assert(player.spd === 3, 'SPD 5-2=3');
assert(player.gold === 100, '金币+100');
assert(player.exp === 50, '经验+50');
assert(applied.narrative.includes('背起伤员'), '叙事文本');

// Test 6: Choice history
const history = getChoiceHistory();
assert(history.length === 1, '1条历史');
assert(hasChosenOption('ch1_survivor', 'help'), '记录了help选项');
assert(!hasChosenOption('ch1_survivor', 'leave'), '未选leave');

// Test 7: Cannot re-choose
const ch1f2Again = checkFateChoice(1, 2);
assert(ch1f2Again.length === 0, '已选择的不再出现');

// Test 8: Different choice
const result2 = makeFateChoice('ch1_mutation', 'inject');
assert(result2.success, '注射选择成功');
const player2 = { atk: 20, def: 10, maxHp: 100, hp: 100 };
const applied2 = applyFateConsequence(result2.consequence, player2);
assert(player2.atk === 28, 'ATK +8');
assert(player2.maxHp === 140, 'MaxHP +40');
assert(player2.def === 7, 'DEF -3');

// Test 9: Choice with item reward
resetFateChoices();
const result3 = makeFateChoice('ch1_mutation', 'save');
assert(result3.success, '保存选择成功');
assert(result3.consequence.item !== null, '有物品奖励');
assert(result3.consequence.item.name === 'T-病毒增强体', '物品名称');

// Test 10: Jigsaw trap with HP cost
resetFateChoices();
const result4 = makeFateChoice('ch5_jigsaw_trap', 'endure');
assert(result4.success, '承受痛苦选择成功');
const player3 = { atk: 30, def: 15, maxHp: 200, hp: 200, gold: 0, exp: 0, rewardPoints: 0, inventory: [] };
const applied3 = applyFateConsequence(result4.consequence, player3);
assert(player3.hp === 140, 'HP -30%: 200-60=140');
assert(player3.gold === 200, '金币+200');

// Test 11: Ring temptation choices
resetFateChoices();
const resultRing = makeFateChoice('ch7_ring_temptation', 'wear');
assert(resultRing.success, '戴上魔戒');
assert(resultRing.consequence.karma === -20, '业力-20');
assert(resultRing.consequence.atk === 15, 'ATK+15');

resetFateChoices();
const resultResist = makeFateChoice('ch7_ring_temptation', 'resist');
assert(resultResist.success, '抵抗诱惑');
assert(resultResist.consequence.karma === 20, '业力+20');
assert(resultResist.consequence.def === 5, 'DEF+5');

// Test 12: Final choice
resetFateChoices();
const resultFinal = makeFateChoice('ch12_final_choice', 'challenge');
assert(resultFinal.success, '挑战主神');
assert(resultFinal.consequence.ending === 'warrior', '勇者结局');
assert(resultFinal.consequence.triggerCombat === 'ch12_lord_god_avatar', '触发最终战');

// Test 13: Serialize/Deserialize
resetFateChoices();
makeFateChoice('ch1_survivor', 'leave');
makeFateChoice('ch2_alien_egg', 'burn');
const serialized = serializeFateChoices();
assert(serialized.history.length === 2, '序列化2条');

resetFateChoices();
assert(getChoiceHistory().length === 0, '重置后清空');
deserializeFateChoices(serialized);
assert(getChoiceHistory().length === 2, '反序列化2条');
assert(hasChosenOption('ch1_survivor', 'leave'), '恢复leave选项');

// Test 14: Render UI
const choice = checkFateChoice(3, 3);
assert(choice.length > 0, '第3章有选择');
const ui = renderFateChoiceUI(choice[0], player);
assert(ui.includes('亡者之书'), 'UI包含标题');
assert(ui.includes('诵读咒文'), 'UI包含选项');

// Test 15: Stats
resetFateChoices();
makeFateChoice('ch1_survivor', 'help');
makeFateChoice('ch1_mutation', 'destroy');
const finalStats = getFateStats();
assert(finalStats.made === 2, '做了2个选择');
assert(finalStats.totalKarma === 25, '总业力: 15+10=25');

console.log('');
console.log('══════════════════════════════════════════');
console.log(`命运抉择系统测试: ${passed}通过, ${failed}失败`);
if (failed === 0) console.log('✅ 全部通过');
else { console.log('❌ 存在失败'); process.exit(1); }
