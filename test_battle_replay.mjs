// 战斗回放系统测试
import { recordBattle, getBattleHistory, clearBattleHistory, serializeBattleHistory, deserializeBattleHistory } from './src/core/BattleReplay.js';

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) pass++;
  else { fail++; console.error('  \u274c', msg); }
}

// -- 基础记录 --
clearBattleHistory();
assert(getBattleHistory().length === 0, 'cleared');

const mockResult = {
  enemy: { name: '\u50f5\u5c38', _maxHp: 100, atk: 20, def: 10 },
  victory: true,
  rounds: 5,
  rating: { grade: 'A', color: '#44ff88' },
  log: [
    { text: '\u653b\u51fb 30\u4f24\u5bb3', type: 'player_attack', round: 1, damage: 30, playerHp: 100, enemyHp: 70 },
    { text: '\u53d7\u5230 15\u4f24\u5bb3', type: 'enemy_attack', round: 1, damage: 15, playerHp: 85, enemyHp: 70 },
    { text: '\u66b4\u51fb! 60\u4f24\u5bb3', type: 'critical', round: 2, damage: 60, playerHp: 85, enemyHp: 10 },
    { text: '\u51fb\u8d25\u4e86', type: 'victory', round: 3, damage: 10, playerHp: 70, enemyHp: 0 },
  ],
  playerHpBefore: 100,
  playerHpAfter: 70,
  playerMaxHp: 120,
  playerAtk: 50,
  playerDef: 30,
  enemyMaxHp: 100,
  enemyAtk: 20,
  enemyDef: 10,
  totalDamageDealt: 100,
  totalDamageTaken: 30,
  critCount: 1,
};

const record = recordBattle(mockResult);
assert(record.enemy === '\u50f5\u5c38', 'enemy name recorded');
assert(record.victory === true, 'victory recorded');
assert(record.rounds === 5, 'rounds recorded');
assert(record.log.length === 4, 'log entries recorded');
assert(record.playerHpBefore === 100, 'playerHpBefore');
assert(record.playerHpAfter === 70, 'playerHpAfter');
assert(record.critCount === 1, 'critCount');
console.log('  \u2713 \u57fa\u7840\u8bb0\u5f55\u6b63\u786e');

// -- \u591a\u573a\u8bb0\u5f55 --
for (let i = 0; i < 25; i++) {
  recordBattle({ ...mockResult, enemy: { name: 'E' + i } });
}
const hist = getBattleHistory();
assert(hist.length <= 20, 'max 20 records: ' + hist.length);
assert(hist[0].enemy === 'E24', 'newest first');
console.log('  \u2713 \u5386\u53f2\u8bb0\u5f55\u9650\u5236\u6b63\u786e');

// -- \u5e8f\u5217\u5316 --
const serialized = serializeBattleHistory();
assert(serialized.length <= 10, 'serialize max 10');
clearBattleHistory();
assert(getBattleHistory().length === 0, 'cleared again');
deserializeBattleHistory(serialized);
assert(getBattleHistory().length === serialized.length, 'deserialized');
console.log('  \u2713 \u5e8f\u5217\u5316/\u53cd\u5e8f\u5217\u5316\u6b63\u786e');

console.log('');
console.log('\u2550'.repeat(42));
console.log('\u6218\u6597\u56de\u653e\u7cfb\u7edf\u6d4b\u8bd5: ' + pass + '\u901a\u8fc7, ' + fail + '\u5931\u8d25');
if (fail === 0) console.log('\u2705 \u6218\u6597\u56de\u653e\u7cfb\u7edf\u5168\u90e8\u901a\u8fc7');
else { console.log('\u274c \u6709\u6d4b\u8bd5\u5931\u8d25'); process.exit(1); }
