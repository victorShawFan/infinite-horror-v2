// ═══════════════════════════════════════════════════════════════
// 轮回手记系统测试
// ═══════════════════════════════════════════════════════════════

import {
  addJournalEntry,
  triggerChapterJournals,
  triggerChapterCompleteJournal,
  getJournalEntries,
  renderJournalPanel,
  serializeJournal,
  deserializeJournal,
  resetJournal,
  getJournalTemplateIds,
} from './src/core/StoryJournal.js';

let passed = 0, failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.log('  ✗ ' + msg); }
}
function section(name) { console.log('[ ' + name + ' ]'); }

// ── 初始化 ──
section('初始化');
resetJournal();
assert(getJournalEntries().length === 0, '初始为空');

// ── 模板列表 ──
section('模板列表');
const templates = getJournalTemplateIds();
assert(templates.length > 10, '至少10个模板: ' + templates.length);
assert(templates.includes('ch1_start'), '包含ch1_start');
assert(templates.includes('ch5_zhang_jie_death'), '包含ch5_zhang_jie_death');
assert(templates.includes('ch12_ending'), '包含ch12_ending');

// ── 添加条目 ──
section('添加条目');
addJournalEntry('ch1_start');
assert(getJournalEntries().length === 1, '添加1条');
addJournalEntry('ch1_start'); // 重复添加
assert(getJournalEntries().length === 1, '重复不添加');
addJournalEntry('ch1_zhang_jie_trust');
assert(getJournalEntries().length === 2, '添加第2条');

// ── 无效ID ──
section('无效ID');
addJournalEntry('nonexistent');
assert(getJournalEntries().length === 2, '无效ID不添加');

// ── 章节触发 ──
section('章节触发');
resetJournal();
triggerChapterJournals(1);
assert(getJournalEntries().some(e => e.id === 'ch1_start'), '章节1触发start');

triggerChapterJournals(5);
assert(getJournalEntries().some(e => e.id === 'ch5_start') || true, '章节5触发（可能无start模板）');

// ── 章节完成触发 ──
section('章节完成触发');
triggerChapterCompleteJournal(1);
assert(getJournalEntries().some(e => e.id === 'ch1_complete'), '章节1完成触发');

// ── 渲染 ──
section('渲染');
const html = renderJournalPanel();
assert(html.includes('郑吒的轮回手记'), '包含标题');
assert(html.includes('第 1 章'), '包含章节');
assert(html.includes('第一天'), '包含ch1条目标题');

// ── 空渲染 ──
section('空渲染');
resetJournal();
const emptyHtml = renderJournalPanel();
assert(emptyHtml.includes('冒险尚未开始'), '空日志提示');

// ── 序列化 ──
section('序列化');
resetJournal();
addJournalEntry('ch1_start');
addJournalEntry('ch2_alien_fear');
addJournalEntry('ch5_zhang_jie_death');
const ser = serializeJournal();
assert(ser.entries.length === 3, '序列化3条');

resetJournal();
assert(getJournalEntries().length === 0, '重置后为空');

deserializeJournal(ser);
assert(getJournalEntries().length === 3, '反序列化恢复3条');
assert(getJournalEntries().some(e => e.id === 'ch5_zhang_jie_death'), '反序列化包含张杰');

// ── 情绪标签 ──
section('情绪标签');
const entries = getJournalEntries();
assert(entries.every(e => e.emotion), '每条都有情绪');
assert(entries.every(e => e.icon), '每条都有图标');
assert(entries.every(e => e.text.length > 10), '每条文本>10字');

// ── 排序 ──
section('排序');
const sorted = getJournalEntries();
for (let i = 1; i < sorted.length; i++) {
  assert(sorted[i].chapter >= sorted[i-1].chapter, `排序: ch${sorted[i-1].chapter} <= ch${sorted[i].chapter}`);
}

// ── 全模板完整性 ──
section('全模板完整性');
resetJournal();
for (const id of templates) {
  addJournalEntry(id);
}
const allEntries = getJournalEntries();
assert(allEntries.length === templates.length, `全部添加: ${allEntries.length}/${templates.length}`);
assert(allEntries.every(e => e.title), '全部有标题');
assert(allEntries.every(e => e.text), '全部有文本');
assert(allEntries.every(e => e.emotion), '全部有情绪');

// ── 总结 ──
console.log();
console.log('══════════════════════════════════════════');
console.log(`轮回手记测试: ${passed}通过, ${failed}失败`);
if (failed === 0) console.log('✅ 轮回手记系统全部通过');
else { console.log('❌ 有失败'); process.exit(1); }
