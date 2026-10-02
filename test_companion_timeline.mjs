// ═══ 中洲队时间线验证 — 验证Ch7-Ch12同伴状态符合原著 ═══
import { generateChapter7 } from './src/core/MapGenerator_Ch7.js';
import { generateChapter8 } from './src/core/MapGenerator_Ch8.js';
import { generateChapter9 } from './src/core/MapGenerator_Ch9.js';
import { generateChapter10 } from './src/core/MapGenerator_Ch10.js';
import { generateChapter11 } from './src/core/MapGenerator_Ch11.js';
import { generateChapter12 } from './src/core/MapGenerator_Ch12.js';

let pass = 0, fail = 0;
function assert(cond, msg) { if (cond) { pass++; } else { fail++; console.error('FAIL:', msg); } }

function findEvents(chapter) {
  const events = [];
  for (const floor of chapter.floors) {
    for (const e of floor.entities) {
      if (e.type === 'event' && e.event) {
        events.push({ floor: floor.id, ...e.event, id: e.id });
      }
    }
  }
  return events;
}

// Ch7: killAllCompanions
const ch7 = generateChapter7();
const ch7Events = findEvents(ch7);
assert(ch7Events.some(e => e.killAllCompanions === true), 'Ch7 has killAllCompanions');
assert(ch7.floors.length === 6, 'Ch7 has 6 floors');

// Ch8: revive chuxuan, revive bawang+wangxia, add luogandao, kill luogandao
const ch8 = generateChapter8();
const ch8Events = findEvents(ch8);
assert(ch8Events.some(e => e.reviveCompanion === 'chuxuan'), 'Ch8 revives chuxuan');
assert(ch8Events.some(e => e.reviveCompanions?.includes('bawang')), 'Ch8 revives bawang');
assert(ch8Events.some(e => e.reviveCompanions?.includes('wang_xia')), 'Ch8 revives wangxia');
assert(ch8Events.some(e => e.addCompanion?.id === 'luogandao'), 'Ch8 adds luogandao');
assert(ch8Events.some(e => e.companionDeath === 'luogandao'), 'Ch8 kills luogandao');

// Ch9: revive lingdian, zhanlan, luogandao
const ch9 = generateChapter9();
const ch9Events = findEvents(ch9);
assert(ch9Events.some(e => e.reviveCompanions?.includes('lingdian')), 'Ch9 revives lingdian');
assert(ch9Events.some(e => e.reviveCompanions?.includes('zhan_lan')), 'Ch9 revives zhanlan');
assert(ch9Events.some(e => e.reviveCompanions?.includes('luogandao')), 'Ch9 revives luogandao');

// Ch10: revive zhao_yingkong, zhang_heng, cheng_xiao
const ch10 = generateChapter10();
const ch10Events = findEvents(ch10);
assert(ch10Events.some(e => e.reviveCompanions?.includes('zhao_yingkong')), 'Ch10 revives zhao_yingkong');
assert(ch10Events.some(e => e.reviveCompanions?.includes('zhang_heng')), 'Ch10 revives zhang_heng');
assert(ch10Events.some(e => e.reviveCompanions?.includes('cheng_xiao')), 'Ch10 revives cheng_xiao');

// Ch11: luogandao death, mass revival, liu_yu + lin_juntian join
const ch11 = generateChapter11();
const ch11Events = findEvents(ch11);
assert(ch11Events.some(e => e.companionDeath === 'luogandao'), 'Ch11 kills luogandao');
assert(ch11Events.some(e => e.reviveCompanions?.includes('xiao_honglv')), 'Ch11 revives xiao_honglv');
assert(ch11Events.some(e => e.reviveCompanions?.includes('qi_tengyi')), 'Ch11 revives qi_tengyi');
assert(ch11Events.some(e => e.reviveCompanions?.includes('ming_yanwei')), 'Ch11 revives ming_yanwei');
assert(ch11Events.some(e => e.addCompanion?.id === 'liu_yu'), 'Ch11 adds liu_yu');
assert(ch11Events.some(e => e.addCompanion?.id === 'lin_juntian'), 'Ch11 adds lin_juntian');

// Ch12: mass sacrifice, final survivors should be zhengzha, liu_yu, lin_juntian
const ch12 = generateChapter12();
const ch12Events = findEvents(ch12);
const allDeaths12 = ch12Events.flatMap(e => e.companionDeaths || []);
assert(allDeaths12.includes('chuxuan'), 'Ch12 kills chuxuan');
assert(allDeaths12.includes('lingdian'), 'Ch12 kills lingdian');
assert(allDeaths12.includes('bawang'), 'Ch12 kills bawang');
assert(allDeaths12.includes('zhao_yingkong'), 'Ch12 kills zhao_yingkong');
assert(allDeaths12.includes('zhang_heng'), 'Ch12 kills zhang_heng');
assert(!allDeaths12.includes('liu_yu'), 'Ch12 liu_yu survives (not in deaths)');
assert(!allDeaths12.includes('lin_juntian'), 'Ch12 lin_juntian survives (not in deaths)');

console.log(`\n${pass + fail} checks: ${pass} pass, ${fail} fail`);
if (fail === 0) console.log('✅ 中洲队时间线验证通过 — 原著一致性确认');
else { console.log('❌ 时间线不一致'); process.exit(1); }
