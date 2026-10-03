/**
 * test_subplot_system.mjs
 * 支线剧情合成系统测试
 */
import { getSubplotSystem, resetSubplotSystem, CHAPTER_SUBPLOTS, RANK_ORDER } from './src/core/SubplotSystem.js';

let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; }
  else { fail++; console.error(`  ✗ ${msg}`); }
}

// === 基础获得 ===
console.log('[ 获得支线 ]');
{
  const ss = resetSubplotSystem();
  ok(ss.earn('D', 'test1'), '获得D级支线');
  ok(ss.inventory.D === 1, 'D级库存为1');
  ok(ss.earn('D', 'test2'), '获得另一个D级支线');
  ok(ss.inventory.D === 2, 'D级库存为2');
  ok(!ss.earn('D', 'test1'), '重复ID不能获得');
  ok(ss.inventory.D === 2, 'D级库存仍为2');
}

// === 合成 ===
console.log('[ 合成 ]');
{
  const ss = resetSubplotSystem();
  ss.earn('D'); ss.earn('D'); ss.earn('D');
  ok(ss.inventory.D === 3, '3个D级');
  ok(ss.synthesize('D'), '3D → 1C 成功');
  ok(ss.inventory.D === 0, 'D级归零');
  ok(ss.inventory.C === 1, 'C级为1');
  ok(!ss.synthesize('D'), 'D不足无法合成');
  
  // 连续合成
  ss.earn('D'); ss.earn('D'); ss.earn('D');
  ss.synthesize('D'); // → 2C
  ok(ss.inventory.C === 2, 'C级为2');
  ss.earn('C'); // → 3C
  ok(ss.synthesize('C'), '3C → 1B 成功');
  ok(ss.inventory.B === 1, 'B级为1');
  ok(ss.inventory.C === 0, 'C级归零');
}

// === 不能合成S以上 ===
console.log('[ 合成上限 ]');
{
  const ss = resetSubplotSystem();
  ss.inventory.S = 10;
  ok(!ss.synthesize('S'), 'S级不能继续合成');
}

// === 消耗 ===
console.log('[ 消耗 ]');
{
  const ss = resetSubplotSystem();
  ss.inventory.B = 2;
  ok(ss.consume('B', 1), '消耗1个B级');
  ok(ss.inventory.B === 1, 'B级剩余1');
  ok(!ss.consume('B', 2), '不足时消耗失败');
  ok(ss.inventory.B === 1, '库存不变');
}

// === 每章支线完整性 ===
console.log('[ 章节支线覆盖 ]');
{
  const ss = resetSubplotSystem();
  for (let ch = 1; ch <= 12; ch++) {
    const available = ss.getAvailable(ch);
    ok(available.length > 0, `Ch${ch} 有 ${available.length} 个支线`);
  }
}

// === 序列化 ===
console.log('[ 序列化 ]');
{
  const ss = resetSubplotSystem();
  ss.earn('D', 'x1'); ss.earn('C', 'x2');
  const json = ss.toJSON();
  const ss2 = resetSubplotSystem();
  ss2.fromJSON(json);
  ok(ss2.inventory.D === 1, '反序列化D级正确');
  ok(ss2.inventory.C === 1, '反序列化C级正确');
  ok(ss2.completed.has('x1'), '已完成列表保留');
}

// === 总价值计算 ===
console.log('[ 总价值 ]');
{
  const ss = resetSubplotSystem();
  ss.inventory.D = 3; // 3×1 = 3
  ss.inventory.S = 1; // 1×81 = 81
  ok(ss.getTotalValue() === 84, `总价值 = 84 (实际: ${ss.getTotalValue()})`);
}

console.log(`\n══════════════════════════════════════════`);
console.log(`支线剧情系统测试: ${pass}通过, ${fail}失败`);
if (fail === 0) console.log('✅ 全部通过');
else console.log(`⚠️  ${fail} 项需修复`);
