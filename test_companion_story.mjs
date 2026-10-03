import {
  resetCompanionStoryEvents, checkCompanionEvents, markEventTriggered,
  getCompanionStoryEvent, renderCompanionDialogue, getCompanionMemoirs,
  serializeCompanionStoryEvents, deserializeCompanionStoryEvents,
} from './src/core/CompanionStoryEvents.js';

let passed = 0, failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('FAIL:', msg); }
}

console.log('[ 同伴剧情事件 ]');

// Test 1: Chapter 1 intro events
resetCompanionStoryEvents();
const ch1Events = checkCompanionEvents({ chapter: 1, floor: 1, type: 'chapter_start', player: {}, relationships: {} });
assert(ch1Events.length > 0, '第1章有同伴事件');
assert(ch1Events.some(e => e.companion === 'zhang_jie'), '张杰第1章事件');

// Test 2: Event structure
const zjEvent = ch1Events.find(e => e.companion === 'zhang_jie');
assert(zjEvent.title === '队长的嘱托', '事件标题');
assert(zjEvent.dialogue.length >= 3, '至少3行对话');
assert(zjEvent.effect.relationship === 5, '好感+5');

// Test 3: Mark triggered
markEventTriggered(zjEvent.id);
const ch1Again = checkCompanionEvents({ chapter: 1, floor: 1, type: 'chapter_start', player: {}, relationships: {} });
assert(!ch1Again.some(e => e.id === zjEvent.id), '已触发事件不再出现');

// Test 4: Relationship-gated events
resetCompanionStoryEvents();
const lowRel = checkCompanionEvents({ chapter: 3, type: 'lord_god_space', player: {}, relationships: { zhang_jie: 5 } });
assert(!lowRel.some(e => e.title === '深夜的篝火'), '低好感不触发深夜对话');

const highRel = checkCompanionEvents({ chapter: 3, type: 'lord_god_space', player: {}, relationships: { zhang_jie: 25 } });
assert(highRel.some(e => e.title === '深夜的篝火'), '高好感触发深夜对话');

// Test 5: Death event
resetCompanionStoryEvents();
const deathEvents = checkCompanionEvents({ chapter: 5, floor: 5, type: 'story_event', player: {}, relationships: {} });
assert(deathEvents.some(e => e.title === '永别，队长'), '张杰死亡事件');
const deathEvt = deathEvents.find(e => e.title === '永别，队长');
assert(deathEvt.effect.companionDeath === 'zhang_jie', '同伴死亡标记');
assert(deathEvt.effect.karma === 20, '业力+20');
assert(deathEvt.effect.playerBuff.atk === 10, 'ATK+10永久');

// Test 6: Chuxuan analysis
resetCompanionStoryEvents();
const ch2Events = checkCompanionEvents({ chapter: 2, floor: 1, type: 'chapter_start', player: {}, relationships: {} });
assert(ch2Events.some(e => e.companion === 'chuxuan'), '楚轩第2章事件');

// Test 7: Render dialogue
const dialogueHtml = renderCompanionDialogue(zjEvent);
assert(dialogueHtml.includes('队长的嘱托'), '渲染包含标题');
assert(dialogueHtml.includes('张杰'), '渲染包含角色名');
assert(dialogueHtml.includes('活着回去'), '渲染包含对话');

// Test 8: Memoirs
resetCompanionStoryEvents();
markEventTriggered('zhang_jie_ch1_intro');
markEventTriggered('chuxuan_ch2_analysis');
const memoirs = getCompanionMemoirs();
assert(memoirs.length === 2, '2条回忆录');
assert(memoirs.some(m => m.companion === 'zhang_jie'), '张杰回忆录');

// Test 9: Serialize/Deserialize
const serialized = serializeCompanionStoryEvents();
assert(serialized.triggered.length === 2, '序列化2条');
resetCompanionStoryEvents();
deserializeCompanionStoryEvents(serialized);
const restored = getCompanionMemoirs();
assert(restored.length === 2, '反序列化后2条');

// Test 10: Zhan Lan event with condition
resetCompanionStoryEvents();
const highHpEvents = checkCompanionEvents({ 
  chapter: 1, floor: 3, type: 'after_combat', 
  player: { hp: 90, maxHp: 100 }, relationships: {} 
});
assert(!highHpEvents.some(e => e.companion === 'zhan_lan' && e.title === '远方的掩护'), '高血量不触发掩护');

const lowHpEvents = checkCompanionEvents({
  chapter: 1, floor: 3, type: 'after_combat',
  player: { hp: 20, maxHp: 100 }, relationships: {},
});
assert(lowHpEvents.some(e => e.companion === 'zhan_lan' && e.title === '远方的掩护'), '低血量触发掩护');

console.log('');
console.log('══════════════════════════════════════════');
console.log(`同伴剧情事件测试: ${passed}通过, ${failed}失败`);
if (failed === 0) console.log('✅ 全部通过');
else { console.log('❌ 存在失败'); process.exit(1); }
