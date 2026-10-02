import { fogOfWar, VISION_RADIUS, EXPLORED_ALPHA } from './src/core/FogOfWar.js';

let pass = 0, fail = 0;
function assert(c, m) { if (c) pass++; else { fail++; console.error(`  ❌ ${m}`); } }

console.log('══════════════════════════════════════════');
console.log(' 迷雾系统测试');
console.log('══════════════════════════════════════════');

// ── 初始状态 ──
{
  fogOfWar.fromJSON(null);
  assert(fogOfWar.enabled, '默认启用');
  assert(!fogOfWar.isExplored(0, 5, 5), '未探索的位置');
  assert(fogOfWar.getTileState(0, 5, 5, 0, 0) === 'hidden', '远离玩家=hidden');
}

// ── 更新视野 ──
{
  fogOfWar.updateVision(0, 5, 5);
  assert(fogOfWar.isExplored(0, 5, 5), '玩家位置已探索');
  assert(fogOfWar.isExplored(0, 6, 5), '相邻位置已探索');
  assert(fogOfWar.isExplored(0, 5, 7), '2格内已探索');
  assert(fogOfWar.isVisible(0, 5, 5, 5, 5), '玩家位置可见');
  assert(fogOfWar.isVisible(0, 6, 5, 5, 5), '相邻可见');
  assert(!fogOfWar.isVisible(0, 15, 15, 5, 5), '远处不可见');
  assert(fogOfWar.getTileState(0, 5, 5, 5, 5) === 'visible', '玩家位置=visible');
}

// ── 移动后旧位置变为explored ──
{
  fogOfWar.updateVision(0, 10, 10);
  assert(fogOfWar.isExplored(0, 5, 5), '旧位置仍是explored');
  assert(!fogOfWar.isVisible(0, 5, 5, 10, 10), '旧位置不再visible');
  assert(fogOfWar.getTileState(0, 5, 5, 10, 10) === 'explored', '旧位置=explored');
  assert(fogOfWar.isVisible(0, 10, 10, 10, 10), '新位置visible');
}

// ── 不同楼层独立 ──
{
  assert(!fogOfWar.isExplored(1, 5, 5), '楼层1未探索');
  fogOfWar.updateVision(1, 3, 3);
  assert(fogOfWar.isExplored(1, 3, 3), '楼层1探索');
  assert(fogOfWar.isExplored(0, 10, 10), '楼层0仍保留');
}

// ── 关闭迷雾 ──
{
  fogOfWar.toggle();
  assert(!fogOfWar.enabled, '关闭后disabled');
  assert(fogOfWar.isVisible(0, 99, 99, 0, 0), '关闭后全部可见');
  assert(fogOfWar.getTileState(0, 99, 99, 0, 0) === 'visible', '关闭后=visible');
  fogOfWar.toggle();
  assert(fogOfWar.enabled, '重新开启');
}

// ── 序列化 ──
{
  const json = fogOfWar.toJSON();
  assert(json.explored['0'].length > 0, '序列化楼层0');
  assert(json.explored['1'].length > 0, '序列化楼层1');
  assert(json.enabled === true, '序列化启用状态');
  
  fogOfWar.fromJSON(null); // reset
  assert(!fogOfWar.isExplored(0, 5, 5), '重置后未探索');
  
  fogOfWar.fromJSON(json);
  assert(fogOfWar.isExplored(0, 5, 5), '反序列化恢复');
}

// ── 常量 ──
assert(VISION_RADIUS === 3, '视野半径3');
assert(EXPLORED_ALPHA > 0 && EXPLORED_ALPHA < 1, '已探索透明度合理');

console.log('══════════════════════════════════════════');
console.log(`${pass + fail} 项测试: ${pass} 通过, ${fail} 失败`);
if (fail === 0) console.log('✅ 迷雾系统全部通过');
else { console.log('❌ 有测试失败'); process.exit(1); }
