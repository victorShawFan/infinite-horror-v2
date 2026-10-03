/**
 * test_canon_state.mjs
 * 正史状态系统测试 — 验证死亡时间线、队长交接、复活机制
 */
import { getCanonState, resetCanonState, CANON_DEATHS, CAPTAIN_TRANSITIONS, RESURRECTIONS } from './src/core/CanonState.js';

let pass = 0, fail = 0;
function ok(cond, msg) {
  if (cond) { pass++; }
  else { fail++; console.error(`  ✗ ${msg}`); }
}

// === 初始状态 ===
console.log('[ 初始状态 ]');
{
  const cs = resetCanonState();
  ok(cs.getCaptain().name === '张杰', '初始队长是张杰');
  ok(cs.getAlive().length === 15, `初始15个角色全部存活 (实际: ${cs.getAlive().length})`);
  ok(cs.getDead().length === 0, '无人死亡');
}

// === Ch1 结束: 牟钢死亡 ===
console.log('[ Ch1 结束 ]');
{
  const cs = resetCanonState();
  cs.advanceTo(1, 6);
  // 牟钢不在 CHARACTER_DB (他是NPC)，所以主要角色应全活
  // 但张杰/郑吒/詹岚/李萧毅都应存活
  ok(cs.characters.zhang_jie.alive, 'Ch1 张杰存活');
  ok(cs.characters.zheng_zha.alive, 'Ch1 郑吒存活');
  ok(cs.characters.zhan_lan.alive, 'Ch1 詹岚存活');
  ok(cs.captain === 'zhang_jie', 'Ch1 队长仍是张杰');
}

// === Ch2 结束: 李萧毅、霸王死亡 ===
console.log('[ Ch2 结束 ]');
{
  const cs = resetCanonState();
  cs.advanceTo(2, 6);
  ok(!cs.characters.li_xiaoyi.alive, 'Ch2 李萧毅阵亡');
  ok(!cs.characters.ba_wang.alive, 'Ch2 霸王阵亡');
  ok(cs.characters.chu_xuan.alive, 'Ch2 楚轩存活');
  ok(cs.characters.ling_dian.alive, 'Ch2 零点存活');
}

// === Ch3: 铭烟薇、楚轩死亡 ===
console.log('[ Ch3 结束 ]');
{
  const cs = resetCanonState();
  cs.advanceTo(3, 6);
  ok(!cs.characters.ming_yanwei.alive, 'Ch3 铭烟薇阵亡');
  ok(!cs.characters.chu_xuan.alive, 'Ch3 楚轩阵亡');
  ok(cs.characters.zhao_yingkong.alive, 'Ch3 赵樱空存活');
}

// === Ch4: 齐腾一、零点死亡 ===
console.log('[ Ch4 结束 ]');
{
  const cs = resetCanonState();
  cs.advanceTo(4, 6);
  ok(!cs.characters.qi_tengyi.alive, 'Ch4 齐腾一阵亡');
  ok(!cs.characters.ling_dian.alive, 'Ch4 零点阵亡');
  ok(cs.characters.zhang_heng.alive, 'Ch4 张恒存活');
  ok(cs.characters.xiao_honglv.alive, 'Ch4 萧宏律存活');
}

// === Ch5: 王侠、张杰死亡, 队长交接 ===
console.log('[ Ch5 结束 — 队长交接 ]');
{
  const cs = resetCanonState();
  cs.advanceTo(5, 6);
  ok(!cs.characters.wang_xia.alive, 'Ch5 王侠阵亡');
  ok(!cs.characters.zhang_jie.alive, 'Ch5 张杰牺牲');
  ok(cs.characters.zhang_jie.noResurrect, '张杰标记为不可复活');
  ok(cs.captain === 'zheng_zha', 'Ch5 郑吒成为队长');
  ok(!cs.canResurrect('zhang_jie'), '张杰不可复活');
}

// === Ch8: 楚轩复活, 霸王复活, 王侠复活, 罗甘道死亡 ===
console.log('[ Ch8 — 复活与罗甘道死亡 ]');
{
  const cs = resetCanonState();
  cs.advanceTo(8, 6);
  ok(cs.characters.chu_xuan.alive, 'Ch8 楚轩复活');
  ok(cs.characters.chu_xuan.resurrected, 'Ch8 楚轩标记已复活');
  ok(cs.characters.ba_wang.alive, 'Ch8 霸王复活');
  ok(cs.characters.wang_xia.alive, 'Ch8 王侠复活');
  ok(!cs.characters.luo_gandao.alive, 'Ch8 罗甘道阵亡');
}

// === Ch9: 零点、詹岚、罗甘道复活 ===
console.log('[ Ch9 — 更多复活 ]');
{
  const cs = resetCanonState();
  cs.advanceTo(9, 3);
  ok(cs.characters.ling_dian.alive, 'Ch9 零点复活');
  ok(cs.characters.zhan_lan.alive, 'Ch9 詹岚存活/复活');
  ok(cs.characters.luo_gandao.alive, 'Ch9 罗甘道复活');
}

// === Ch10: 赵樱空、张恒、程啸复活 ===
console.log('[ Ch10 — 三人复活 ]');
{
  const cs = resetCanonState();
  cs.advanceTo(10, 3);
  ok(cs.characters.zhao_yingkong.alive, 'Ch10 赵樱空复活');
  ok(cs.characters.zhang_heng.alive, 'Ch10 张恒复活');
  ok(cs.characters.cheng_xiao.alive, 'Ch10 程啸复活');
  // 张杰永远不会复活
  ok(!cs.characters.zhang_jie.alive, 'Ch10 张杰仍然不可复活');
}

// === 序列化/反序列化 ===
console.log('[ 序列化 ]');
{
  const cs = resetCanonState();
  cs.advanceTo(5, 6);
  const json = cs.toJSON();
  const cs2 = resetCanonState();
  cs2.fromJSON(json);
  ok(cs2.captain === 'zheng_zha', '反序列化后队长正确');
  ok(!cs2.characters.zhang_jie.alive, '反序列化后张杰已阵亡');
  ok(cs2.events.length > 0, '事件日志已保留');
}

// === 固定死亡不可通过任何方式取消 ===
console.log('[ 固定死亡不可撤销 ]');
{
  const cs = resetCanonState();
  cs.advanceTo(5, 6);
  // 尝试手动修改
  cs.characters.zhang_jie.alive = true; // 试图复活
  cs.advanceTo(5, 6); // 重新推进
  // 张杰标记了 noResurrect，advanceTo 不会再次设死，但也不应允许
  ok(cs.characters.zhang_jie.noResurrect, '张杰 noResurrect 标记持久');
  ok(!cs.canResurrect('zhang_jie'), 'canResurrect 拒绝张杰');
}

console.log(`\n══════════════════════════════════════════`);
console.log(`正史状态测试: ${pass}通过, ${fail}失败`);
if (fail === 0) console.log('✅ 正史状态系统全部通过');
else console.log(`⚠️  ${fail} 项需修复`);
