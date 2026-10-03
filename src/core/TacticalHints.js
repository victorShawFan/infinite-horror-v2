// ═══════════════════════════════════════════════════════════════
// 战术提示系统 — 智能战斗建议
// ═══════════════════════════════════════════════════════════════
//
// 根据玩家当前状态、装备、天赋和敌人特性，
// 在战前确认面板中提供1-2条简洁的战术建议。
// 帮助新手理解系统联动，对老手也提供提醒价值。

import { gameState } from './GameState.js';
import { getEffectiveAtk, getEffectiveDef } from './CombatSystem.js';
import { getTalentEffects } from './TalentTree.js';
import { getCurrentStance } from './CombatStance.js';
import { getActiveEffects } from './StatusEffectTracker.js';

/**
 * 生成战术提示
 * @param {Object} player - 玩家数据
 * @param {Object} enemy - 缩放后的敌人数据
 * @param {Object} preview - 战斗预判结果
 * @returns {Array<{icon: string, text: string, color: string}>}
 */
export function generateTacticalHints(player, enemy, preview) {
  const hints = [];
  
  // 1. HP 过低警告
  if (player.hp < player.maxHp * 0.3) {
    hints.push({
      icon: '⚠',
      text: 'HP不足30%，建议先使用回复药或寻找泉水',
      color: '#ff6644',
    });
  }
  
  // 2. 敌人弱点提示
  if (enemy.weaknesses?.length) {
    const weaknessNames = {
      fire: '🔥火焰', ice: '❄冰冻', poison: '☠毒素',
      psychic: '🧠念力', dark: '🌑暗影', holy: '✦圣光',
      spirit: '👻灵魂',
    };
    const wStr = enemy.weaknesses.map(w => weaknessNames[w] || w).join('/');
    hints.push({
      icon: '🎯',
      text: `敌人弱${wStr}，相应属性攻击可造成额外伤害`,
      color: '#ffaa44',
    });
  }
  
  // 3. 姿态建议
  const stance = getCurrentStance();
  if (enemy.atk > player.atk * 1.5 && stance.id !== 'defensive') {
    hints.push({
      icon: '🛡',
      text: '敌人攻击力很高，可考虑切换防御姿态(D键)',
      color: '#6688ff',
    });
  } else if (enemy.def > 15 && stance.id !== 'aggressive') {
    hints.push({
      icon: '⚔',
      text: '敌人防御很高，可考虑切换攻击姿态(D键)突破',
      color: '#ff6644',
    });
  }
  
  // 4. 精英怪提醒
  if (enemy._eliteTier) {
    hints.push({
      icon: '💎',
      text: '精英怪物奖励加倍，值得一战！但要注意特殊词缀',
      color: '#aa66ff',
    });
  }
  
  // 5. Boss 战提示
  if (enemy.bossId) {
    hints.push({
      icon: '👑',
      text: 'Boss有多个阶段！HP降低时会变强，注意留足药水',
      color: '#ffcc44',
    });
  }
  
  // 6. 天赋未分配提示
  const talents = gameState.talents;
  if (talents && talents.points >= 3) {
    hints.push({
      icon: '✦',
      text: `你有${talents.points}个未分配的天赋点(T键打开天赋树)`,
      color: '#44ccff',
    });
  }
  
  // 7. 装备空栏提示
  if (!player.weapon && gameState.chapter >= 2) {
    hints.push({
      icon: '🗡',
      text: '你还没有装备武器！找到武器后在背包(I键)中装备',
      color: '#ffaa00',
    });
  }
  
  // 8. 消耗品提示
  if (player.hp < player.maxHp * 0.5 && (player.inventory || []).some(i => i.effect?.heal)) {
    hints.push({
      icon: '🧪',
      text: 'HP不足一半，可在战前使用背包中的回复药(I键)',
      color: '#44ff88',
    });
  }
  
  // 9. 必败局提示
  if (!preview.canWin) {
    hints.push({
      icon: '🚫',
      text: '当前数值不足以击败此敌人，先提升等级或装备再来',
      color: '#ff4444',
    });
  }
  
  // 10. 险胜提示
  if (preview.canWin && preview.hpAfter < player.maxHp * 0.15) {
    hints.push({
      icon: '💊',
      text: '战后HP极低，务必确保战后有恢复手段',
      color: '#ff8844',
    });
  }
  
  // 限制最多返回3条提示
  return hints.slice(0, 3);
}

/**
 * 渲染战术提示HTML
 */
export function formatTacticalHintsHTML(hints) {
  if (!hints || hints.length === 0) return '';
  
  return `
    <div style="
      margin-top: 8px; padding: 6px 10px;
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.06);
      border-radius: 6px;
    ">
      <p style="color:#555;font-size:9px;letter-spacing:2px;margin-bottom:4px;">💡 战术提示</p>
      ${hints.map(h => `
        <p style="color:${h.color};font-size:10px;line-height:1.6;margin:2px 0;">
          ${h.icon} ${h.text}
        </p>
      `).join('')}
    </div>
  `;
}
