/**
 * test_keybindings_consistency.mjs
 * 验证 src/main.js 键盘处理代码无重复 case、无不可达分支、Shift 组合键正确
 */
import { readFileSync } from 'fs';

let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; console.log(`  ✓ ${msg}`); }
  else { fail++; console.error(`  ✗ ${msg}`); }
}

const code = readFileSync('src/main.js', 'utf8');

// 提取探索模式 switch 块内所有 case
const switchMatch = code.match(/switch \(e\.key\.toLowerCase\(\)\) \{([\s\S]*?)default: return;/);
ok(switchMatch, 'switch(e.key.toLowerCase()) 块已定位');

if (switchMatch) {
  const switchBody = switchMatch[1];
  
  // 提取所有 case 'xxx' 标签
  const caseLabels = [...switchBody.matchAll(/case '([^']+)':/g)].map(m => m[1]);
  
  // 1. 无重复 case
  const seen = new Map();
  let hasDup = false;
  for (const label of caseLabels) {
    if (seen.has(label)) {
      console.error(`    重复: case '${label}' 出现 ${seen.get(label)+1} 次`);
      hasDup = true;
    }
    seen.set(label, (seen.get(label) || 0) + 1);
  }
  ok(!hasDup, '无重复 case 标签');
  
  // 2. 不含大写字母的 case（因为 key 已 toLowerCase）
  const upperCases = caseLabels.filter(l => l !== l.toLowerCase());
  ok(upperCases.length === 0, `所有 case 均为小写 (${upperCases.length === 0 ? 'OK' : '违规: ' + upperCases.join(',')})`);
  
  // 3. 不含 'tab'（Tab 已在 switch 前拦截）
  ok(!caseLabels.includes('tab'), 'switch 内无 case \'tab\'（Tab 在 switch 前处理）');
  
  // 4. 验证 case 'o' 存在（迷你地图改键）
  ok(caseLabels.includes('o'), 'case \'o\' 存在（迷你地图开关）');
}

// 5. Shift+T 和 Shift+P 在 switch 之前处理
const shiftBlock = code.match(/if \(e\.shiftKey\) \{[\s\S]*?const sk = e\.key\.toLowerCase\(\)/);
ok(shiftBlock, 'Shift 组合键块存在于 switch 前');

const shiftT = code.match(/if \(sk === 't'\)[\s\S]*?_showCombatStatsPanel/);
ok(shiftT, 'Shift+T → 战斗统计面板');

const shiftP = code.match(/if \(sk === 'p'\)[\s\S]*?showPlayerStatsPanel/);
ok(shiftP, 'Shift+P → 玩家统计面板');

// 6. F5 保存顺序：ih_abyss 和 ih_daily 在 return 之前
const f5Section = code.match(/if \(e\.key === 'F5'\) \{[\s\S]*?return;\s*\}/);
ok(f5Section, 'F5 处理块已定位');
if (f5Section) {
  const f5Code = f5Section[0];
  const abyssIdx = f5Code.indexOf('ih_abyss');
  const dailyIdx = f5Code.indexOf('ih_daily');
  const returnIdx = f5Code.lastIndexOf('return;');
  ok(abyssIdx > 0 && abyssIdx < returnIdx, 'ih_abyss 在 return 之前保存');
  ok(dailyIdx > 0 && dailyIdx < returnIdx, 'ih_daily 在 return 之前保存');
  // 无 return 后面的 localStorage
  const afterReturn = f5Code.slice(returnIdx + 7);
  ok(!afterReturn.includes('localStorage'), 'return 之后无遗留 localStorage 调用');
}

// 7. Tab 在 switch 前正确处理
const tabPre = code.match(/if \(e\.key === 'Tab'\) \{[\s\S]*?showCharacterSheet/);
ok(tabPre, 'Tab → 角色详情面板（switch 前处理）');

console.log(`\n══════════════════════════════════════════`);
console.log(`快捷键一致性测试: ${pass}通过, ${fail}失败`);
if (fail === 0) console.log('✅ 快捷键系统全部通过');
else console.log('❌ 有失败项需修复');
