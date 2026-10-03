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

    // 逐回合播放伤害数字和特效
    let delay = 200;
    let roundIdx = 0;
    for (const entry of log) {
      const dmgMatch = entry.text.match(/(\d+)/);
      const dmgText = dmgMatch ? dmgMatch[1] : '?';

      if (entry.type === 'attack' || entry.type === 'critical') {
        roundIdx++;
        this._queue.push({
          type: 'playerAttack',
          text: `-${dmgText}`,
          x: enemy.x, y: enemy.y,
          isCrit: entry.type === 'critical',
          delay,
        });
        if (entry.type === 'critical') {
          this._queue.push({ type: 'shake', intensity: 6, duration: 200, delay: delay + 50 });
          this._queue.push({ type: 'flash', color: 'rgba(255, 200, 50, 0.2)', duration: 150, delay });
        }
        delay += 220;
      } else if (entry.type === 'enemy_attack') {
        this._queue.push({
          type: 'enemyAttack',
          text: `-${dmgText}`,
          delay,
        });
        this._queue.push({ type: 'shake', intensity: 2, duration: 100, delay: delay + 50 });
        delay += 200;
      } else if (entry.type === 'heal') {
        // 吸血/回复 — 绿色浮字在玩家头上
        const px = window._gamePlayerX || 0;
        const py = window._gamePlayerY || 0;
        this._queue.push({ type: 'text', text: `+${dmgText} HP`, x: px, y: py - 0.5, color: 'rgb(100, 255, 140)', delay });
        delay += 150;
      } else if (entry.type === 'spell') {
        // 法术 — 紫色浮字在敌人头上 + 闪光
        this._queue.push({ type: 'text', text: `✦ -${dmgText}`, x: enemy.x, y: enemy.y - 0.5, color: 'rgb(180, 120, 255)', delay });
        this._queue.push({ type: 'flash', color: 'rgba(150, 80, 255, 0.15)', duration: 120, delay });
        delay += 220;
      } else if (entry.type === 'burn') {
        // 灼烧 — 橙色浮字
        this._queue.push({ type: 'text', text: `🔥 -${dmgText}`, x: enemy.x, y: enemy.y - 0.3, color: 'rgb(255, 130, 50)', delay });
        this._queue.push({ type: 'particles', x: enemy.x * TILE_SIZE + TILE_SIZE / 2, y: enemy.y * TILE_SIZE + TILE_SIZE / 2, color: 'rgb(255, 100, 30)', count: 4, delay });
        delay += 180;
      } else if (entry.type === 'reflect') {
        // 反伤 — 蓝色浮字在敌人头上
        this._queue.push({ type: 'text', text: `🛡 -${dmgText}`, x: enemy.x, y: enemy.y - 0.3, color: 'rgb(100, 150, 255)', delay });
        this._queue.push({ type: 'shake', intensity: 1, duration: 80, delay });
        delay += 150;
      } else if (entry.type === 'buff') {
        const shortText = entry.text.length > 16 ? entry.text.slice(0, 16) + '…' : entry.text;
        const px = window._gamePlayerX || 0;
        const py = window._gamePlayerY || 0;
        this._queue.push({ type: 'text', text: shortText, x: px, y: py - 0.8, color: 'rgb(100, 200, 255)', delay });
        delay += 200;
      } else if (entry.type === 'geneLock') {
        // 基因锁充能 — 橙色浮字
        const px = window._gamePlayerX || 0;
        const py = window._gamePlayerY || 0;
        this._queue.push({ type: 'text', text: '⚡基因锁充能', x: px, y: py - 0.6, color: 'rgb(255, 102, 0)', delay });
        delay += 150;
      } else if (entry.type === 'geneLock_advance') {
        // 基因锁突破！— 强烈特效
        const px = window._gamePlayerX || 0;
        const py = window._gamePlayerY || 0;
        this._queue.push({ type: 'text', text: '🧬 基因锁突破！', x: px, y: py - 1, color: 'rgb(255, 136, 0)', delay });
        this._queue.push({ type: 'flash', color: 'rgba(255, 136, 0, 0.3)', duration: 400, delay });
        this._queue.push({ type: 'shake', intensity: 8, duration: 400, delay });
        this._queue.push({ type: 'particles', x: px * TILE_SIZE + TILE_SIZE/2, y: py * TILE_SIZE + TILE_SIZE/2, color: 'rgb(255, 136, 0)', count: 20, delay });
        delay += 500;
      } else if (entry.type === 'skill') {
        // 技能释放 — 黄色浮字
        const shortText = entry.text.length > 20 ? entry.text.slice(0, 20) + '…' : entry.text;
        const px = window._gamePlayerX || 0;
        const py = window._gamePlayerY || 0;
        this._queue.push({ type: 'text', text: shortText, x: px, y: py - 0.7, color: 'rgb(255, 170, 68)', delay });
        this._queue.push({ type: 'flash', color: 'rgba(255, 170, 68, 0.1)', duration: 150, delay });
        delay += 250;
      } else if (entry.type === 'control') {
        // 控制效果 — 紫色浮字
        this._queue.push({ type: 'text', text: '💫 控制！', x: enemy.x, y: enemy.y - 0.5, color: 'rgb(170, 136, 255)', delay });
        delay += 200;
      } else if (entry.type === 'dodge') {
        // 闪避 — 青色浮字
        const px = window._gamePlayerX || 0;
        const py = window._gamePlayerY || 0;
        this._queue.push({ type: 'text', text: '🌀 闪避！', x: px, y: py - 0.5, color: 'rgb(68, 255, 204)', delay });
        delay += 200;
      } else if (entry.type === 'debuff') {
        // 减益 — 红紫色浮字
        const shortText = entry.text.length > 16 ? entry.text.slice(0, 16) + '…' : entry.text;
        this._queue.push({ type: 'text', text: shortText, x: enemy.x, y: enemy.y - 0.6, color: 'rgb(255, 102, 136)', delay });
        delay += 180;
      } else if (entry.type === 'poison') {
        // 中毒 — 绿色浮字
        const dmgMatch2 = entry.text.match(/(\d+)/);
        this._queue.push({ type: 'text', text: '☠ -' + (dmgMatch2 ? dmgMatch2[1] : '?'), x: enemy.x, y: enemy.y - 0.3, color: 'rgb(136, 255, 68)', delay });
        this._queue.push({ type: 'particles', x: enemy.x * TILE_SIZE + TILE_SIZE/2, y: enemy.y * TILE_SIZE + TILE_SIZE/2, color: 'rgb(100, 200, 50)', count: 3, delay });
        delay += 180;
      } else if (entry.type === 'info') {
        // 信息 — 灰蓝色简短
        const px = window._gamePlayerX || 0;
        const py = window._gamePlayerY || 0;
        this._queue.push({ type: 'text', text: entry.text.slice(0, 20), x: px, y: py - 0.9, color: 'rgb(136, 170, 204)', delay });
        delay += 150;
      } else if (entry.type === 'boss_phase') {
        // Boss相位切换 — 红紫闪光 + 震屏
        this._queue.push({ type: 'text', text: entry.text.slice(0, 24), x: enemy.x, y: enemy.y - 0.8, color: 'rgb(255, 68, 136)', delay });
        this._queue.push({ type: 'flash', color: 'rgba(255, 68, 136, 0.3)', delay });
        this._queue.push({ type: 'shake', intensity: 4, delay });
        this._queue.push({ type: 'particles', x: enemy.x * TILE_SIZE + TILE_SIZE/2, y: enemy.y * TILE_SIZE + TILE_SIZE/2, color: 'rgb(255, 68, 136)', count: 12, delay });
        delay += 500;
      } else if (entry.type === 'boss_special') {
        // Boss特殊技能 — 红色大字 + 强震
        this._queue.push({ type: 'text', text: entry.text.slice(0, 20), x: enemy.x, y: enemy.y - 0.5, color: 'rgb(255, 34, 102)', delay });
        this._queue.push({ type: 'flash', color: 'rgba(255, 0, 0, 0.4)', delay });
        this._queue.push({ type: 'shake', intensity: 6, delay });
        delay += 400;
      } else if (entry.type === 'block') {
        // 格挡 — 蓝色盾牌
        const px = window._gamePlayerX || 0;
        const py = window._gamePlayerY || 0;
        this._queue.push({ type: 'text', text: '🛡 格挡！', x: px, y: py - 0.5, color: 'rgb(68, 136, 255)', delay });
        this._queue.push({ type: 'particles', x: px * TILE_SIZE + TILE_SIZE/2, y: py * TILE_SIZE + TILE_SIZE/2, color: 'rgb(68, 136, 255)', count: 6, delay });
        delay += 200;
      } else if (entry.type === 'talent_save') {
        // 天赋死亡保护 — 金色大闪
        const px = window._gamePlayerX || 0;
        const py = window._gamePlayerY || 0;
        this._queue.push({ type: 'text', text: '🌟 重生！', x: px, y: py - 0.8, color: 'rgb(255, 221, 68)', delay });
        this._queue.push({ type: 'flash', color: 'rgba(255, 221, 68, 0.5)', delay });
        this._queue.push({ type: 'particles', x: px * TILE_SIZE + TILE_SIZE/2, y: py * TILE_SIZE + TILE_SIZE/2, color: 'rgb(255, 221, 68)', count: 15, delay });
        delay += 600;
      } else if (entry.type === 'elemental_advantage') {
        // 元素克制 — 橙色
        this._queue.push({ type: 'text', text: '✦ 元素克制！', x: enemy.x, y: enemy.y - 0.7, color: 'rgb(255, 136, 68)', delay });
        delay += 200;
      } else if (entry.type === 'elemental_resonance') {
        // 元素共鸣 — 金色闪光
        const px = window._gamePlayerX || 0;
        const py = window._gamePlayerY || 0;
        this._queue.push({ type: 'text', text: entry.text.slice(0, 18), x: px, y: py - 0.9, color: 'rgb(255, 204, 68)', delay });
        this._queue.push({ type: 'flash', color: 'rgba(255, 204, 68, 0.2)', delay });
        delay += 300;
      } else if (entry.type === 'loot' || entry.type === 'loot_equipment') {
        // 掉落 — 金色浮字
        const px = window._gamePlayerX || 0;
        const py = window._gamePlayerY || 0;
        const lootColor = entry.color || 'rgb(255, 204, 68)';
        this._queue.push({ type: 'text', text: entry.text.slice(0, 24), x: px, y: py - 0.3, color: lootColor, delay });
        delay += 200;
      } else if (entry.type === 'skill') {
        // 技能 — 蓝紫色浮字在敌人头上 + 闪光
        this._queue.push({ type: 'text', text: entry.text.slice(0, 20), x: enemy.x, y: enemy.y - 0.5, color: 'rgb(130, 170, 255)', delay });
        this._queue.push({ type: 'flash', color: 'rgba(100, 130, 255, 0.12)', duration: 120, delay });
        delay += 200;
      } else if (entry.type === 'relic_attack') {
        // 遗物自动攻击 — 紫色浮字
        this._queue.push({ type: 'text', text: entry.text.slice(0, 18), x: enemy.x, y: enemy.y - 0.4, color: 'rgb(180, 100, 255)', delay });
        delay += 180;
      } else if (entry.type === 'relic_save' || entry.type === 'talent_save') {
        // 死亡拯救 — 强烈金色闪光
        const px = window._gamePlayerX || 0;
        const py = window._gamePlayerY || 0;
        this._queue.push({ type: 'text', text: entry.text.slice(0, 24), x: px, y: py - 1, color: 'rgb(255, 215, 0)', delay });
        this._queue.push({ type: 'flash', color: 'rgba(255, 215, 0, 0.4)', duration: 400, delay });
        this._queue.push({ type: 'shake', intensity: 4, duration: 200, delay });
        this._queue.push({
          type: 'particles',
          x: px * TILE_SIZE + TILE_SIZE / 2,
          y: py * TILE_SIZE + TILE_SIZE / 2,
          color: 'rgb(255, 215, 0)', count: 12, delay
        });
        delay += 500;
      } else if (entry.type === 'relic_buff') {
        // 遗物被动效果 — 淡紫色
        const px = window._gamePlayerX || 0;
        const py = window._gamePlayerY || 0;
        this._queue.push({ type: 'text', text: entry.text.slice(0, 16), x: px, y: py - 0.6, color: 'rgb(170, 130, 255)', delay });
        delay += 120;
      } else if (entry.type === 'poison') {
        // 中毒 — 绿色浮字在敌人/玩家头上
        this._queue.push({ type: 'text', text: entry.text.slice(0, 16), x: enemy.x, y: enemy.y - 0.3, color: 'rgb(100, 255, 80)', delay });
        delay += 150;
      } else if (entry.type === 'dodge') {
        // 闪避 — 白色浮字
        const px = window._gamePlayerX || 0;
        const py = window._gamePlayerY || 0;
        this._queue.push({ type: 'text', text: '💨 闪避！', x: px, y: py - 0.5, color: 'rgb(200, 230, 255)', delay });
        delay += 150;
      } else if (entry.type === 'debuff') {
        // 负面效果 — 红紫色浮字
        this._queue.push({ type: 'text', text: entry.text.slice(0, 16), x: enemy.x, y: enemy.y - 0.3, color: 'rgb(200, 80, 160)', delay });
        delay += 150;
      } else if (entry.type === 'block') {
        // 格挡 — 蓝白色
        const px = window._gamePlayerX || 0;
        const py = window._gamePlayerY || 0;
        this._queue.push({ type: 'text', text: entry.text.slice(0, 16), x: px, y: py - 0.5, color: 'rgb(150, 200, 255)', delay });
        this._queue.push({ type: 'flash', color: 'rgba(150, 200, 255, 0.1)', duration: 100, delay });
        delay += 150;
      } else if (entry.type === 'enemy_revive') {
        // 敌人复活 — 紫色闪光
        this._queue.push({ type: 'text', text: '💀 复活！', x: enemy.x, y: enemy.y - 0.5, color: 'rgb(255, 68, 255)', delay });
        this._queue.push({ type: 'flash', color: 'rgba(255, 68, 255, 0.3)', delay });
        delay += 400;
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
        // 全局震屏后处理
        try { if (window._screenEffects) window._screenEffects.shake(anim.intensity, anim.duration); } catch {}
        break;

      case 'playerAttack':
        this.renderer.addFloatText(
          anim.text,
          anim.x, anim.y - 0.3,
          anim.isCrit ? 'rgb(255, 200, 50)' : 'rgb(255, 150, 80)'
        );
        audioEngine.playHit(anim.isCrit);
        // 更新战斗HUD - 敌人受伤
        try {
          const dmg = parseInt(anim.text.replace(/[^0-9]/g, '')) || 0;
          if (window._combatHUD && window._updateCombatHUDDelta) {
            window._updateCombatHUDDelta('enemy', -dmg);
          }
        } catch {}
        break;

      case 'enemyAttack':
        // 更新战斗HUD - 玩家受伤
        try {
          const dmg = parseInt(anim.text.replace(/[^0-9]/g, '')) || 0;
          if (window._combatHUD && window._updateCombatHUDDelta) {
            window._updateCombatHUDDelta('player', -dmg);
          }
        } catch {}
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
        // 全局闪光后处理
        try { if (window._screenEffects) window._screenEffects.flash(anim.color, anim.duration); } catch {}
        break;

      case 'done':
        if (this._onComplete) this._onComplete();
        break;
    }
  }
}
