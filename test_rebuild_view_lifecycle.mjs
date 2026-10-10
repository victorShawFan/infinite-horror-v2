import assert from 'node:assert/strict';
import { BattleViewLifecycle } from './src/rebuild/core/BattleViewLifecycle.js';

console.log('\n[ Rebuild BattleViewLifecycle ]');
const lifecycle=new BattleViewLifecycle();
const first=lifecycle.begin();
assert.equal(lifecycle.isCurrent(first),true);
lifecycle.leave();
assert.equal(lifecycle.isCurrent(first),false,'离开战斗后旧异步回调必须失效');
const second=lifecycle.begin();
assert.equal(lifecycle.isCurrent(second),true);
assert.equal(lifecycle.isCurrent(first),false,'新战斗不得复用旧会话令牌');
console.log('  ✅ stale battle renders are invalidated');
