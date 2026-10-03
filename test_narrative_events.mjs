// ═══ 章节叙事事件验证 ═══
import { gameState } from './src/core/GameState.js';
import {
  CHAPTER_NARRATIVES, getChapterNarrative, markNarrativeTriggered,
  applyNarrativeResult, serializeNarratives, deserializeNarratives,
} from './src/core/ChapterNarrativeEvents.js';

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) pass++;
  else { fail++; console.log(`  ❌ ${msg}`); }
}

console.log('═══ 章节叙事事件验证 ═══\n');

// ── 12章覆盖率 ──
console.log('── 12章覆盖率 ──');
for (let ch = 1; ch <= 12; ch++) {
  const events = CHAPTER_NARRATIVES[ch];
  assert(Array.isArray(events) && events.length > 0, `第${ch}章应有叙事事件`);
  for (const evt of events) {
    assert(evt.id, `Ch${ch}: 事件应有ID`);
    assert(evt.title, `Ch${ch}: 事件应有标题`);
    assert(evt.text, `Ch${ch}: 事件应有文本`);
    assert(evt.floor > 0, `Ch${ch}: 事件应有楼层`);
    assert(Array.isArray(evt.choices) && evt.choices.length > 0, `Ch${ch} ${evt.id}: 应有选择`);
    for (const choice of evt.choices) {
      assert(choice.text, `Ch${ch} ${evt.id}: 选择应有文本`);
      assert(choice.result, `Ch${ch} ${evt.id}: 选择应有结果`);
      assert(choice.result.text, `Ch${ch} ${evt.id}: 结果应有文本`);
    }
  }
}

// ── 事件获取 ──
console.log('── 事件获取 ──');
gameState._triggeredNarratives = new Set();
const evt = getChapterNarrative(1, 2);
assert(evt !== null, 'Ch1 Floor2应有事件');
assert(evt.id === 'ch1_survivor', '应获取幸存者事件');

// 触发后不应再获取
markNarrativeTriggered('ch1_survivor');
const evt2 = getChapterNarrative(1, 2);
assert(evt2 === null, '已触发事件不应再获取');

// 不同楼层的事件仍可获取
const evt3 = getChapterNarrative(1, 4);
assert(evt3 !== null, 'Ch1 Floor4应仍有事件');

// ── 效果应用 ──
console.log('── 效果应用 ──');
gameState.player.gold = 100;
gameState.player.hp = 50;
gameState.player.maxHp = 100;
gameState.player.atk = 10;
gameState.player.exp = 0;
gameState.soulShards = 0;
gameState.karma = 0;

const effects1 = applyNarrativeResult({ gold: 50, exp: 30, text: 'test' });
assert(gameState.player.gold === 150, '金币应+50');
assert(gameState.player.exp === 30, '经验应+30');
assert(effects1.includes('+50G'), '效果文字应包含金币');
assert(effects1.includes('+30 EXP'), '效果文字应包含经验');

const effects2 = applyNarrativeResult({ atk: 3, def: 2, hp: -15, text: 'test' });
assert(gameState.player.atk === 13, 'ATK应+3');
assert(gameState.player.hp === 35, 'HP应-15');

const effects3 = applyNarrativeResult({ shards: 15, karma: 2, text: 'test' });
assert(gameState.soulShards === 15, '碎片应+15');
assert(gameState.karma === 2, '业力应+2');

// ── 序列化 ──
console.log('── 序列化 ──');
gameState._triggeredNarratives = new Set(['ch1_survivor', 'ch2_facehugger']);
const serialized = serializeNarratives();
assert(serialized.length === 2, '应有2个已触发事件');

gameState._triggeredNarratives = new Set();
deserializeNarratives(serialized);
assert(gameState._triggeredNarratives.has('ch1_survivor'), '反序列化应恢复ch1事件');
assert(gameState._triggeredNarratives.has('ch2_facehugger'), '反序列化应恢复ch2事件');

// ── 总事件数统计 ──
console.log('── 事件统计 ──');
let totalEvents = 0;
let totalChoices = 0;
for (let ch = 1; ch <= 12; ch++) {
  totalEvents += CHAPTER_NARRATIVES[ch].length;
  totalChoices += CHAPTER_NARRATIVES[ch].reduce((s, e) => s + e.choices.length, 0);
}
assert(totalEvents >= 15, `应至少有15个叙事事件(实际${totalEvents})`);
assert(totalChoices >= 30, `应至少有30个选择(实际${totalChoices})`);
console.log(`  总计: ${totalEvents}个事件, ${totalChoices}个选择`);

console.log(`\nPassed: ${pass}  Failed: ${fail}`);
if (fail > 0) {
  console.log('\n═══ ❌ 叙事事件测试失败 ═══');
  process.exit(1);
} else {
  console.log('\n═══ ✅ 章节叙事事件验证全部通过 ═══');
}
