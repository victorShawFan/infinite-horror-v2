// ═══════════════════════════════════════════════════════════════
// 战斗动画系统 — 让战斗不只是数字闪过
// ═══════════════════════════════════════════════════════════════

import { TILE_SIZE, COLORS } from './constants.js';
import { audioEngine } from './AudioEngine.js';

/**
 * 战斗动画控制器
 * 管理战斗时的视觉序列：震屏、闪光、连击数字、特效
 */
export class CombatAnimator {
  constructor(renderer) {
    this.renderer = renderer;
    this._queue = [];      // 动画队列
    this._active = null;   // 当前播放中的动画
    this._onComplete = null;
  }

  /**
   * 播放战斗动画序列
   * @param {Object} combatResult - executeBattle 的返回结果
   * @param {Object} enemy - 敌人数据
   * @param {Function} onComplete - 动画结束回调
   */
  playCombatSequence(combatResult, enemy, onComplete) {
    this._queue = [];
    this._onComplete = onComplete;

    const { log, victory, rounds } = combatResult;
    const ex = enemy.x * TILE_SIZE + TILE_SIZE / 2;
    const ey = enemy.y * TILE_SIZE + TILE_SIZE / 2;

    // 开场震屏
    this._queue.push({ type: 'shake', intensity: 3, duration: 150, delay: 0 });

    // 逐回合播放伤害数字
    let delay = 200;
    let roundIdx = 0;
    for (const entry of log) {
      if (entry.type === 'attack' || entry.type === 'critical') {
        roundIdx++;
        this._queue.push({
          type: 'playerAttack',
          text: `-${entry.text.match(/造成 (\d+)/)?.[1] || '?'}`,
          x: enemy.x, y: enemy.y,
          isCrit: entry.type === 'critical',
          delay,
        });
        if (entry.type === 'critical') {
          this._queue.push({ type: 'shake', intensity: 6, duration: 200, delay: delay + 50 });
          this._queue.push({ type: 'flash', color: 'rgba(255, 200, 50, 0.2)', duration: 150, delay });
        }
        delay += 250;
      } else if (entry.type === 'enemy_attack') {
        this._queue.push({
          type: 'enemyAttack',
          text: `-${entry.text.match(/造成 (\d+)/)?.[1] || '?'}`,
          delay,
        });
        this._queue.push({ type: 'shake', intensity: 2, duration: 100, delay: delay + 50 });
        delay += 200;
      }

      // 限制最多显示的回合数，避免太长
      if (roundIdx > 6) {
        this._queue.push({
          type: 'text',
          text: `...共 ${rounds} 回合`,
          x: enemy.x, y: enemy.y - 1,
          color: 'rgb(180, 180, 180)',
          delay,
        });
        delay += 300;
        break;
      }
    }

    // 结局
    if (victory) {
      this._queue.push({
        type: 'victory',
        text: '击 败 ！',
        x: enemy.x, y: enemy.y - 0.5,
        delay,
      });
      this._queue.push({
        type: 'particles',
        x: ex, y: ey,
        color: 'rgb(255, 100, 50)',
        count: 15,
        delay,
      });
      this._queue.push({ type: 'shake', intensity: 5, duration: 300, delay });
    } else {
      this._queue.push({
        type: 'defeat',
        text: '被击败...',
        delay,
      });
      this._queue.push({ type: 'shake', intensity: 8, duration: 500, delay });
    }

    // 总结延迟后结束
    this._queue.push({ type: 'done', delay: delay + 600 });

    // 开始播放
    this._startTime = performance.now();
    this._playQueue();
  }

  _playQueue() {
    if (this._queue.length === 0) {
      if (this._onComplete) this._onComplete();
      return;
    }

    const now = performance.now();
    const elapsed = now - this._startTime;

    // 处理所有已到达 delay 的动画
    while (this._queue.length > 0 && this._queue[0].delay <= elapsed) {
      const anim = this._queue.shift();
      this._executeAnim(anim);
      if (anim.type === 'done') return;
    }

    requestAnimationFrame(() => this._playQueue());
  }

  _executeAnim(anim) {
    switch (anim.type) {
      case 'shake':
        this.renderer.shake(anim.intensity, anim.duration);
        break;

      case 'playerAttack':
        this.renderer.addFloatText(
          anim.text,
          anim.x, anim.y - 0.3,
          anim.isCrit ? 'rgb(255, 200, 50)' : 'rgb(255, 150, 80)'
        );
        audioEngine.playHit(anim.isCrit);
        break;

      case 'enemyAttack':
        // 显示在玩家附近
        const px = window._gamePlayerX || 0;
        const py = window._gamePlayerY || 0;
        this.renderer.addFloatText(anim.text, px, py - 0.3, 'rgb(255, 80, 80)');
        audioEngine.playDamage();
        break;

      case 'victory':
        this.renderer.addFloatText(anim.text, anim.x, anim.y, 'rgb(68, 255, 136)');
        audioEngine.playPickup();
        break;

      case 'defeat':
        audioEngine.playDamage();
        break;

      case 'text':
        this.renderer.addFloatText(anim.text, anim.x, anim.y, anim.color);
        break;

      case 'particles':
        this.renderer.addParticle(anim.x, anim.y, anim.color, anim.count);
        break;

      case 'flash':
        // 全屏闪光效果
        this.renderer._flashColor = anim.color;
        this.renderer._flashDuration = anim.duration;
        this.renderer._flashStart = performance.now();
        break;

      case 'done':
        if (this._onComplete) this._onComplete();
        break;
    }
  }
}
