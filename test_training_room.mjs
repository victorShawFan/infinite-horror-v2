// ═══════════════════════════════════════════════════════════════
// 训练房系统测试
// ═══════════════════════════════════════════════════════════════
import {
  recordChapterEnemies,
  recordEncounteredEnemy,
  getTrainingEnemies,
  createTrainingEnemy,
  recordTrainingResult,
  getTrainingHistory,
  serializeTrainingRoom,
  deserializeTrainingRoom,
  renderTrainingRoomPanel,
} from './src/core/TrainingRoom.js';

let passed = 0, failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; }
  else { failed++; console.error('  ✗ FAIL:', msg); }
}
function section(name) { console.log(`[ ${name} ]`); }

// ═══════════════════════════════════════════
section('初始状态');
assert(getTrainingEnemies().length === 0, '初始无训练敌人');
assert(getTrainingHistory().length === 0, '初始无训练历史');

// ═══════════════════════════════════════════
section('战斗中记录遭遇');
recordEncounteredEnemy({ name: '爬行者', hp: 50, maxHp: 50, atk: 10, def: 3, spd: 5, type: 'enemy', color: '#444' });
recordEncounteredEnemy({ name: '抱脸虫', hp: 30, maxHp: 30, atk: 15, def: 1, spd: 8, type: 'enemy', color: '#666' });
recordEncounteredEnemy({ name: '爬行者', hp: 50, maxHp: 50, atk: 10, def: 3 }); // 重复，应去重
// 章节结束时还有一个存活敌人
recordChapterEnemies([{ name: '异形女皇', hp: 200, maxHp: 200, atk: 30, def: 15, isBoss: true, type: 'boss', color: '#f00' }]);

const enemies = getTrainingEnemies();
assert(enemies.length === 3, '合并后应有3个敌人（2遭遇+1存活）: got ' + enemies.length);
assert(enemies[0].name === '爬行者', '第一个是战斗中遇到的爬行者');
assert(enemies[2].name === '异形女皇', '第三个是存活的Boss');
assert(enemies.every(e => e.isTraining), '所有训练敌人标记isTraining');

// ═══════════════════════════════════════════
section('创建训练敌人');
const trainEnemy = createTrainingEnemy(enemies[0]);
assert(trainEnemy.isTraining === true, '训练敌人标记isTraining');
assert(trainEnemy._noReward === true, '标记_noReward');
assert(trainEnemy._noExp === true, '标记_noExp');
assert(trainEnemy._noLoot === true, '标记_noLoot');
assert(trainEnemy.hp === trainEnemy.maxHp, 'HP恢复满');

// ═══════════════════════════════════════════
section('训练历史记录');
recordTrainingResult({ name: '爬行者' }, { victory: true, rounds: 3, totalDamageDealt: 120, totalDamageTaken: 20 });
recordTrainingResult({ name: '抱脸虫' }, { victory: false, rounds: 5, totalDamageDealt: 80, totalDamageTaken: 100 });
const history = getTrainingHistory();
assert(history.length === 2, '训练历史2条');
assert(history[0].victory === true, '第一条胜利');
assert(history[1].victory === false, '第二条失败');
assert(history[0].rounds === 3, '回合数正确');

// 测试历史上限
for (let i = 0; i < 25; i++) {
  recordTrainingResult({ name: '测试' + i }, { victory: true, rounds: 1, totalDamageDealt: 10, totalDamageTaken: 0 });
}
assert(getTrainingHistory().length === 20, '历史上限20条: got ' + getTrainingHistory().length);

// ═══════════════════════════════════════════
section('序列化与反序列化');
const serialized = serializeTrainingRoom();
assert(serialized.lastEnemies.length === 3, '序列化敌人数');
assert(serialized.history.length === 20, '序列化历史数');

// 模拟清空后恢复
deserializeTrainingRoom({ lastEnemies: [{ name: '测试恢复', hp: 100, maxHp: 100, atk: 20, def: 5 }], history: [{ enemyName: '测试', victory: true, rounds: 2 }] });
assert(getTrainingEnemies().length === 1, '反序列化敌人恢复');
assert(getTrainingHistory().length === 1, '反序列化历史恢复');

// 恢复原数据
deserializeTrainingRoom(serialized);

// ═══════════════════════════════════════════
section('渲染面板');
const html = renderTrainingRoomPanel();
assert(html.includes('训练房'), '面板包含标题');
assert(html.includes('爬行者'), '面板包含敌人名');
assert(html.includes('异形女皇'), '面板包含Boss');
assert(html.includes('BOSS'), '面板包含Boss标签');

// ═══════════════════════════════════════════
section('训练敌人不应被记录');
recordEncounteredEnemy({ name: '训练幽灵', hp: 50, atk: 10, isTraining: true }); // 应被忽略
recordChapterEnemies([]);
const afterTraining = getTrainingEnemies();
assert(!afterTraining.some(e => e.name === '训练幽灵'), '训练敌人不进入遭遇列表');

console.log(`\n══════════════════════════════════════════`);
console.log(`训练房测试: ${passed}通过, ${failed}失败`);
if (failed === 0) console.log('✅ 训练房系统全部通过');
else { console.log('❌ 有失败'); process.exit(1); }
