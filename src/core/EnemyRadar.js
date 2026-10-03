// ═══════════════════════════════════════════════════════════════
// 敌人雷达系统 — 魔塔核心：一眼看出谁能打谁不能打
// ═══════════════════════════════════════════════════════════════

import { previewBattle, getEffectiveAtk, getEffectiveDef, getEffectiveCrt, getEffectiveSpd } from './CombatSystem.js';
import { scaleEnemy } from './DifficultyScaler.js';
import { TILE_SIZE } from './constants.js';

/**
 * 在每个敌人头顶显示能否击败的指示器
 * 绿色勾 = 可击败(低风险)
 * 黄色三角 = 可击败(中高风险) 
 * 红色叉 = 无法击败
 * @param {CanvasRenderingContext2D} ctx
 * @param {Array} entities
 * @param {Object} player
 * @param {number} chapter
 * @param {Object} camera - { offsetX, offsetY }
 */
export function drawEnemyRadar(ctx, entities, player, chapter, camera = { offsetX: 0, offsetY: 0 }) {
  const enemies = entities.filter(e => e.type === 'enemy' || e.type === 'boss');
  if (enemies.length === 0) return;
  
  ctx.save();
  ctx.font = 'bold 11px "Microsoft YaHei"';
  ctx.textAlign = 'center';
  
  for (const enemy of enemies) {
    const scaled = scaleEnemy(enemy, chapter);
    const preview = previewBattle(player, scaled);
    
    const px = enemy.x * TILE_SIZE + TILE_SIZE / 2 + camera.offsetX;
    const py = enemy.y * TILE_SIZE - 6 + camera.offsetY;
    
    if (preview.canWin) {
      const damageRatio = preview.totalDamage / player.maxHp;
      if (damageRatio <= 0.15) {
        // 低风险 — 绿色
        ctx.fillStyle = 'rgba(68, 204, 136, 0.85)';
        ctx.fillText('✓', px, py);
      } else if (damageRatio <= 0.5) {
        // 中风险 — 黄色
        ctx.fillStyle = 'rgba(255, 204, 68, 0.85)';
        ctx.fillText('△', px, py);
      } else {
        // 高风险 — 橙色
        ctx.fillStyle = 'rgba(255, 136, 68, 0.85)';
        ctx.fillText('⚠', px, py);
      }
      
      // 显示预计受伤(小字)
      ctx.font = '8px monospace';
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillText(`-${preview.totalDamage}`, px, py - 10);
      ctx.font = 'bold 11px "Microsoft YaHei"';
    } else {
      // 无法击败 — 红色
      ctx.fillStyle = 'rgba(255, 68, 68, 0.85)';
      ctx.fillText('✗', px, py);
      
      // 显示差距
      const atkGap = scaled.def - getEffectiveAtk(player);
      if (atkGap > 0) {
        ctx.font = '8px monospace';
        ctx.fillStyle = 'rgba(255, 100, 100, 0.5)';
        ctx.fillText(`ATK差${atkGap}`, px, py - 10);
        ctx.font = 'bold 11px "Microsoft YaHei"';
      }
    }
  }
  
  ctx.restore();
}

/**
 * 获取楼层敌人排行（按可击败→受伤少排序）
 */
export function getEnemyRanking(entities, player, chapter) {
  const enemies = entities
    .filter(e => e.type === 'enemy' || e.type === 'boss')
    .map(enemy => {
      const scaled = scaleEnemy(enemy, chapter);
      const preview = previewBattle(player, scaled);
      return {
        ...enemy,
        scaled,
        preview,
        sortKey: preview.canWin ? preview.totalDamage : Infinity,
      };
    })
    .sort((a, b) => a.sortKey - b.sortKey);
  
  return enemies;
}
