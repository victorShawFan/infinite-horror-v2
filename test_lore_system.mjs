/**
 * test_lore_system.mjs — LoreSystem 专项测试
 */
import { LORE_ENTRIES, loreTracker, formatLorePopup } from './src/core/LoreSystem.js';

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { pass++; console.log(`  ✓ ${msg}`); }
  else { fail++; console.error(`  ✗ ${msg}`); }
}

console.log('═══ LoreSystem 专项测试 ═══\n');

// --- LORE_ENTRIES 数据完整性 ---
console.log('[ LORE_ENTRIES 数据完整性 ]');
const entries = Object.values(LORE_ENTRIES);
const entryIds = Object.keys(LORE_ENTRIES);
assert(entries.length >= 10, `至少10条线索 (实际${entries.length})`);

for (const [id, e] of Object.entries(LORE_ENTRIES)) {
  assert(typeof id === 'string' && id.length > 0, `${id}: key非空`);
  assert(typeof e.title === 'string' && e.title.length > 0, `${id}: title非空`);
  assert(typeof e.text === 'string' && e.text.length > 10, `${id}: text有实质内容`);
  assert(typeof e.chapter === 'number' && e.chapter >= 1, `${id}: chapter正整数`);
  assert(typeof e.icon === 'string' && e.icon.length > 0, `${id}: icon非空`);
}

// --- loreTracker 基本逻辑 ---
console.log('\n[ loreTracker 逻辑 ]');
loreTracker.fromJSON({ discovered: [] }); // reset
assert(loreTracker.getDiscoveredCount() === 0, '重置后为0条');
assert(loreTracker.getTotalCount() === entries.length, `总数=${entries.length}`);

const firstId = entryIds[0];
const r1 = loreTracker.discover(firstId);
assert(r1 === true, `discover('${firstId}')返回true`);
assert(loreTracker.getDiscoveredCount() === 1, '发现后计数为1');

const r2 = loreTracker.discover(firstId);
assert(r2 === false, '重复发现返回false');
assert(loreTracker.getDiscoveredCount() === 1, '重复发现不增计数');

const r3 = loreTracker.discover('nonexistent_xyz');
assert(r3 === false, '不存在的id返回false');

// notification queue
assert(loreTracker.hasNotifications(), '有待展示通知');
const notif = loreTracker.getNextNotification();
assert(notif && notif.title === LORE_ENTRIES[firstId].title, '通知内容正确');

// 全部发现
for (const id of entryIds) loreTracker.discover(id);
assert(loreTracker.getDiscoveredCount() === entries.length, `全部发现后=${entries.length}`);

// 按章节查询
const ch1 = loreTracker.getDiscoveredByChapter(1);
const ch1Expected = entryIds.filter(id => LORE_ENTRIES[id].chapter === 1).length;
assert(ch1.length === ch1Expected, `ch1已发现${ch1Expected}条`);

// --- 序列化 ---
console.log('\n[ 序列化 toJSON/fromJSON ]');
const json = loreTracker.toJSON();
assert(Array.isArray(json.discovered), 'toJSON.discovered是数组');
assert(json.discovered.length === entries.length, 'toJSON包含全部id');

loreTracker.fromJSON({ discovered: [] });
assert(loreTracker.getDiscoveredCount() === 0, '重置后为0');
loreTracker.fromJSON(json);
assert(loreTracker.getDiscoveredCount() === entries.length, '反序列化后恢复');

// --- formatLorePopup ---
console.log('\n[ formatLorePopup ]');
const popup = formatLorePopup(LORE_ENTRIES[firstId]);
assert(typeof popup === 'string' && popup.length > 0, 'popup非空字符串');
assert(popup.includes(LORE_ENTRIES[firstId].title), 'popup包含标题');
assert(popup.includes(LORE_ENTRIES[firstId].icon), 'popup包含图标');

// --- 总结 ---
console.log(`\n═══ LoreSystem测试: ${pass}通过, ${fail}失败 ═══`);
if (fail > 0) process.exit(1);
