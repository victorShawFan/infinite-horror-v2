// ═══════════════════════════════════════════════════════════════
// Canvas2D 渲染器 — 像素风地牢 + HUD + 对话框
// ═══════════════════════════════════════════════════════════════

import { TILE_SIZE, TILE, COLORS, CANVAS_W, CANVAS_H, ENTITY_TYPE } from './constants.js';
import { assetLoader } from './AssetLoader.js';
import { gameState } from './GameState.js';
import { getEffectiveAtk, getEffectiveDef, previewBattle, getStatsBreakdown } from './CombatSystem.js';
import { drawWallTile, drawFloorTile, drawLavaTile, drawStairsTile, drawCharacterSprite, drawHealthBar } from './SpriteRenderer.js';

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    canvas.width = CANVAS_W;
    canvas.height = CANVAS_H;

    // 缩放适配窗口
    this._resize();
    window.addEventListener('resize', () => this._resize());

    // 动画
    this._time = 0;
    this._shakeX = 0;
    this._shakeY = 0;
    this._floatTexts = []; // { text, x, y, color, life }
    this._particles = [];
    this._flashColor = null;
    this._flashDuration = 0;
    this._flashStart = 0;
    this._notifications = [];  // { text, color, life }
    this._transitionAlpha = 0; // 0=无过渡, 1=全黑
    this._transitionTarget = 0;
    this._transitionSpeed = 0.03;
  }

  _resize() {
    const ratio = CANVAS_W / CANVAS_H;
    let w = window.innerWidth;
    let h = window.innerHeight;
    if (w / h > ratio) {
      w = h * ratio;
    } else {
      h = w / ratio;
    }
    this.canvas.style.width = `${Math.floor(w)}px`;
    this.canvas.style.height = `${Math.floor(h)}px`;
    this.canvas.style.marginTop = `${Math.floor((window.innerHeight - h) / 2)}px`;
  }

  shake(intensity = 3, duration = 200) {
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      if (elapsed > duration) {
        this._shakeX = 0;
        this._shakeY = 0;
        return;
      }
      const decay = 1 - elapsed / duration;
      this._shakeX = (Math.random() - 0.5) * intensity * 2 * decay;
      this._shakeY = (Math.random() - 0.5) * intensity * 2 * decay;
      requestAnimationFrame(tick);
    };
    tick();
  }

  addFloatText(text, x, y, color = COLORS.TEXT_WHITE) {
    this._floatTexts.push({ text, x, y, vy: -1.5, color, life: 60 });
  }

  addParticle(x, y, color, count = 5) {
    for (let i = 0; i < count; i++) {
      this._particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        color,
        life: 20 + Math.random() * 20,
        size: 2 + Math.random() * 3,
      });
    }
  }

  render(floor, entities, hoveredEntity = null, dialogueState = null, combatResult = null) {
    this._time++;
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(this._shakeX, this._shakeY);

    // 清屏
    ctx.fillStyle = floor?.bgColor || COLORS.BG_DARK;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // 绘制场景背景图（如果存在）
    if (floor) {
      const bgImg = assetLoader.getSceneBg(floor.id);
      if (bgImg) {
        ctx.globalAlpha = 0.35;
        ctx.drawImage(bgImg, 0, 0, CANVAS_W, CANVAS_H);
        ctx.globalAlpha = 1.0;
      }
    }

    if (!floor) {
      ctx.restore();
      return;
    }

    const p = gameState.player;

    // 计算相机偏移（玩家居中）
    // 使用平滑位置做相机，防止初始undefined
    const vx = this._playerVisualX ?? p.x;
    const vy = this._playerVisualY ?? p.y;
    const camX = vx * TILE_SIZE - CANVAS_W / 2 + TILE_SIZE / 2;
    const camY = vy * TILE_SIZE - CANVAS_H / 2 + TILE_SIZE / 2;

    ctx.save();
    ctx.translate(-camX, -camY);

    // ── 绘制地图 ──
    this._drawMap(ctx, floor);

    // ── 环境粒子（灰尘/光点） ──
    this._drawAmbientParticles(ctx, floor, p);

    // ── 战争迷雾 / 光照 ──
    this._drawFogOfWar(ctx, floor, p);

    // ── 绘制实体 ──
    this._drawEntities(ctx, entities, hoveredEntity);

    // ── 绘制玩家 ──
    this._drawPlayer(ctx, p);

    // ── 浮动文字 ──
    this._drawFloatTexts(ctx);

    // ── 粒子 ──
    this._drawParticles(ctx);

    ctx.restore();

    // ── HUD（固定位置）──
    this._drawHUD(ctx, p, floor);

    // ── 全屏闪光效果 ──
    if (this._flashColor && this._flashStart > 0) {
      const elapsed = performance.now() - this._flashStart;
      if (elapsed < this._flashDuration) {
        const alpha = 1 - elapsed / this._flashDuration;
        ctx.fillStyle = this._flashColor.replace(/[\d.]+\)$/, `${alpha * 0.3})`);
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
      } else {
        this._flashColor = null;
      }
    }

    // ── 屏幕过渡 ──
    if (this._transitionAlpha > 0.01) {
      ctx.fillStyle = `rgba(0, 0, 0, ${this._transitionAlpha})`;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    }
    // 平滑过渡
    if (Math.abs(this._transitionAlpha - this._transitionTarget) > 0.01) {
      this._transitionAlpha += (this._transitionTarget - this._transitionAlpha) * this._transitionSpeed;
    }

    // ── 暗角效果（电影感） ──
    const vignette = ctx.createRadialGradient(
      CANVAS_W / 2, CANVAS_H / 2, CANVAS_W * 0.35,
      CANVAS_W / 2, CANVAS_H / 2, CANVAS_W * 0.7
    );
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

    // ── 通知条 ──
    this._drawNotifications(ctx);

    // ── 迷你地图 ──
    this._drawMinimap(ctx, floor, entities, p);

    // ── 悬停信息 ──
    if (hoveredEntity && !dialogueState) {
      this._drawEntityTooltip(ctx, hoveredEntity);
    }

    // ── 对话框 ──
    if (dialogueState) {
      this._drawDialogue(ctx, dialogueState);
    }

    // ── 战斗结果 ──
    if (combatResult) {
      this._drawCombatResult(ctx, combatResult);
    }

    ctx.restore();
  }

  _drawMap(ctx, floor) {
    const { tiles, width, height } = floor;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const tile = tiles[y][x];
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;

        switch (tile) {
          case TILE.VOID:
            ctx.fillStyle = COLORS.BG_DARK;
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            break;
          case TILE.FLOOR:
            drawFloorTile(ctx, px, py, (x * 7 + y * 13) % 4);
            continue;
            break;
          case TILE.WALL:
            drawWallTile(ctx, px, py);
            continue;
          case TILE.STAIRS:
            drawStairsTile(ctx, px, py, this._time);
            continue;
          case TILE.LAVA:
            drawLavaTile(ctx, px, py, this._time);
            continue;
          case TILE.DOOR:
            ctx.fillStyle = COLORS.DOOR;
            break;
          case TILE.WATER:
            ctx.fillStyle = '#1a2a44';
            break;
          default:
            ctx.fillStyle = COLORS.FLOOR;
        }
        ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
      }
    }
  }

  _drawEntities(ctx, entities, hoveredEntity) {
    for (const e of entities) {
      const px = e.x * TILE_SIZE;
      const py = e.y * TILE_SIZE;

      // 底色/光环
      if (e.type === ENTITY_TYPE.ENEMY || e.type === ENTITY_TYPE.BOSS) {
        const glow = 0.15 + 0.1 * Math.sin(this._time * 0.06);
        ctx.fillStyle = `rgba(255, 60, 60, ${glow})`;
        ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
      } else if (e.type === ENTITY_TYPE.COMPANION) {
        ctx.fillStyle = 'rgba(68, 136, 255, 0.12)';
        ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
      } else if (e.type === ENTITY_TYPE.ITEM) {
        const bob = Math.sin(this._time * 0.08 + e.x) * 2;
        ctx.fillStyle = 'rgba(255, 255, 100, 0.08)';
        ctx.fillRect(px + 4, py + 4 + bob, TILE_SIZE - 8, TILE_SIZE - 8);
      }

      // 悬停高亮
      if (hoveredEntity === e) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
      }

      // 绘制精灵（小人偶）
      const bob = (e.type === ENTITY_TYPE.ITEM) ? Math.sin(this._time * 0.08 + e.x) * 2 : 0;
      const isEnemy = e.type === ENTITY_TYPE.ENEMY || e.type === ENTITY_TYPE.BOSS;
      const isItem = e.type === ENTITY_TYPE.ITEM || e.type === ENTITY_TYPE.EVENT;
      if (isItem) {
        // 物品和事件仍然用图标
        _drawItemIcon(ctx, px, py, e, this._time);
      } else {
        drawCharacterSprite(ctx, px, py, e.sprite, e.color || '#ffffff', TILE_SIZE * 0.6, {
          bob,
          fullName: e.name,
          isEnemy,
          isBoss: e.type === ENTITY_TYPE.BOSS,
          _time: this._time,
        });
      }

      // 敌人HP条
      if ((e.type === ENTITY_TYPE.ENEMY || e.type === ENTITY_TYPE.BOSS) && e.hp !== undefined) {
        const maxHp = e._maxHp || e.hp;
        const ratio = e.hp / maxHp;
        drawHealthBar(ctx, px, py, ratio);
      }
    }
  }

  _drawPlayer(ctx, p) {
    // 平滑移动插值
    if (this._playerVisualX === undefined) {
      this._playerVisualX = p.x;
      this._playerVisualY = p.y;
    }
    const lerpSpeed = 0.25;
    this._playerVisualX += (p.x - this._playerVisualX) * lerpSpeed;
    this._playerVisualY += (p.y - this._playerVisualY) * lerpSpeed;
    // 接近目标时吸附
    if (Math.abs(p.x - this._playerVisualX) < 0.05) this._playerVisualX = p.x;
    if (Math.abs(p.y - this._playerVisualY) < 0.05) this._playerVisualY = p.y;

    const px = this._playerVisualX * TILE_SIZE;
    const py = this._playerVisualY * TILE_SIZE;

    // 玩家光环
    const glowRadius = 20 + 5 * Math.sin(this._time * 0.05);
    const gradient = ctx.createRadialGradient(
      px + TILE_SIZE / 2, py + TILE_SIZE / 2, 5,
      px + TILE_SIZE / 2, py + TILE_SIZE / 2, glowRadius
    );
    gradient.addColorStop(0, 'rgba(68, 170, 255, 0.25)');
    gradient.addColorStop(1, 'rgba(68, 170, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(px - 10, py - 10, TILE_SIZE + 20, TILE_SIZE + 20);

    // 基因锁激活时的特效
    if (p.geneLockActive) {
      const lockGlow = ctx.createRadialGradient(
        px + TILE_SIZE / 2, py + TILE_SIZE / 2, 5,
        px + TILE_SIZE / 2, py + TILE_SIZE / 2, 30
      );
      lockGlow.addColorStop(0, 'rgba(255, 102, 0, 0.3)');
      lockGlow.addColorStop(1, 'rgba(255, 102, 0, 0)');
      ctx.fillStyle = lockGlow;
      ctx.fillRect(px - 15, py - 15, TILE_SIZE + 30, TILE_SIZE + 30);
    }

    // 玩家角色（小人偶）
    drawCharacterSprite(ctx, px, py, '郑吒', COLORS.PLAYER, TILE_SIZE * 0.65, {
      showBase: false,
      isPlayer: true,
      fullName: '郑吒',
    });
  }

  _drawHUD(ctx, p, floor) {
    const pad = 12;

    // ── 左上：生存状态 ──
    ctx.fillStyle = 'rgba(10, 10, 20, 0.88)';
    roundRect(ctx, pad, pad, 220, 130, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(68, 170, 255, 0.4)';
    ctx.lineWidth = 1;
    roundRect(ctx, pad, pad, 220, 130, 8);
    ctx.stroke();

    ctx.font = 'bold 14px "Microsoft YaHei"';
    ctx.fillStyle = COLORS.PLAYER;
    ctx.textAlign = 'left';
    ctx.fillText(`郑吒 Lv.${p.level}`, pad + 10, pad + 20);

    // HP条
    this._drawBar(ctx, pad + 10, pad + 30, 200, 12, p.hp, p.maxHp, COLORS.HP_BAR, '#333');
    ctx.font = '11px "Microsoft YaHei"';
    ctx.fillStyle = COLORS.TEXT_WHITE;
    ctx.fillText(`HP ${p.hp}/${p.maxHp}`, pad + 10, pad + 55);

    // 体力条
    this._drawBar(ctx, pad + 10, pad + 62, 200, 8, p.stamina, p.maxStamina, COLORS.STAMINA_BAR, '#333');
    ctx.fillText(`体力 ${p.stamina}/${p.maxStamina}`, pad + 10, pad + 82);

    // 经验条
    this._drawBar(ctx, pad + 10, pad + 90, 200, 6, p.exp, p.expToNext, '#aa88ff', '#222');
    ctx.fillText(`EXP ${p.exp}/${p.expToNext}`, pad + 10, pad + 108);

    // 基因锁状态
    if (p.geneLock > 0) {
      ctx.fillStyle = COLORS.GENE_LOCK;
      ctx.fillText(`基因锁 ${p.geneLock}阶 ${p.geneLockActive ? '●激活' : '○待机'}`, pad + 10, pad + 125);
    }

    // ── 右上：战斗属性 ──
    ctx.fillStyle = 'rgba(10, 10, 20, 0.88)';
    roundRect(ctx, CANVAS_W - 160 - pad, pad, 160, 100, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 100, 100, 0.3)';
    roundRect(ctx, CANVAS_W - 160 - pad, pad, 160, 100, 8);
    ctx.stroke();

    const rx = CANVAS_W - 150;
    ctx.font = '12px "Microsoft YaHei"';
    ctx.fillStyle = '#ff8866';
    ctx.fillText(`⚔ 攻击 ${getEffectiveAtk(p)}`, rx, pad + 20);
    ctx.fillStyle = '#6688ff';
    ctx.fillText(`🛡 防御 ${getEffectiveDef(p)}`, rx, pad + 38);
    ctx.fillStyle = '#44ffaa';
    ctx.fillText(`💨 速度 ${p.spd}`, rx, pad + 56);
    ctx.fillStyle = '#ffcc44';
    ctx.fillText(`✦ 暴击 ${p.crt}%`, rx, pad + 74);
    ctx.fillStyle = '#ffaa44';
    ctx.fillText(`💰 ${p.gold}G  ⬡${p.rewardPoints}`, rx, pad + 92);

    // ── 底部：钥匙 + 楼层信息 ──
    ctx.fillStyle = 'rgba(10, 10, 20, 0.85)';
    roundRect(ctx, pad, CANVAS_H - 40, CANVAS_W - pad * 2, 30, 6);
    ctx.fill();

    ctx.font = '12px "Microsoft YaHei"';
    ctx.textAlign = 'left';
    ctx.fillStyle = COLORS.TEXT_DIM;
    // 动态提示信息
    const tips = [
      '鼠标悬停敌人查看能否击败',
      '按 I 查看属性和装备',
      '碰怪前先看数值，打不过绕路',
      '收集晶石永久提升属性',
      '基因锁(G)开启后攻防大幅提升',
      '按 H 查看完整操作指南',
    ];
    const tipIdx = Math.floor(this._time / 300) % tips.length;
    const companionCount = (gameState.companions || []).filter(c => c.alive).length;
    
    // 楼层进度条
    const floorId = floor.id || '1-1';
    const floorNum = parseInt(floorId.split('-')[1]) || 1;
    const totalFloors = 6;
    const progressX = CANVAS_W - 180;
    const progressY = CANVAS_H - 32;
    ctx.fillStyle = 'rgba(50, 50, 70, 0.6)';
    ctx.fillRect(progressX, progressY, 120, 8);
    ctx.fillStyle = 'rgba(68, 170, 255, 0.7)';
    ctx.fillRect(progressX, progressY, 120 * (floorNum / totalFloors), 8);
    ctx.font = '10px "Microsoft YaHei"';
    ctx.fillStyle = '#888';
    ctx.textAlign = 'center';
    ctx.fillText('第一章 ' + floorNum + '/' + totalFloors, progressX + 60, progressY - 3);
    
    ctx.textAlign = 'left';
    ctx.fillText(
      `${floor.id} ${floor.name}  |  🔑 ${p.keys.yellow}/${p.keys.blue}/${p.keys.red}  |  队友×${companionCount}  |  💡 ${tips[tipIdx]}`,
      pad + 8,
      CANVAS_H - 21
    );
  }

  _drawBar(ctx, x, y, w, h, current, max, color, bgColor) {
    ctx.fillStyle = bgColor;
    roundRect(ctx, x, y, w, h, h / 2);
    ctx.fill();
    const ratio = Math.max(0, Math.min(1, current / max));
    if (ratio > 0) {
      ctx.fillStyle = color;
      roundRect(ctx, x, y, w * ratio, h, h / 2);
      ctx.fill();
    }
  }

  _drawEntityTooltip(ctx, e) {
    const p = gameState.player;
    let lines = [e.name];

    if (e.type === ENTITY_TYPE.ENEMY || e.type === ENTITY_TYPE.BOSS) {
      const preview = previewBattle(p, e);
      lines.push(`HP: ${e.hp}  ATK: ${e.atk}  DEF: ${e.def}`);
      // 描述自动换行（短句显示）
      if (e.description) {
        const desc = e.description;
        // 每40字符左右断行
        for (let i = 0; i < desc.length; i += 38) {
          lines.push(desc.slice(i, i + 38));
        }
      }
      lines.push('─────────');
      if (preview.canWin) {
        lines.push(`✓ 可击败 (${preview.turnsNeeded}回合)`);
        lines.push(`预计受伤: ${preview.totalDamage}`);
        lines.push(`战后HP: ${preview.hpAfter}/${p.maxHp}`);
        // 危险度评估
        const dangerRatio = preview.totalDamage / p.hp;
        if (dangerRatio > 0.7) {
          lines.push('⚠ 高风险 — 建议先提升属性');
        } else if (dangerRatio > 0.4) {
          lines.push('△ 中等风险 — 准备急救物品');
        } else {
          lines.push('○ 低风险 — 可放心挑战');
        }
      } else {
        lines.push(`✗ 无法击败！差距过大`);
        lines.push(`需要ATK>${e.def}才能造成伤害`);
      }
      if (e.rewards) {
        const r = e.rewards;
        lines.push(`奖励: ${r.exp || 0}EXP  ${r.gold || 0}G`);
      }
    } else if (e.type === ENTITY_TYPE.COMPANION) {
      lines.push(`角色: ${e.role}`);
      lines.push('按空格对话');
    } else if (e.type === ENTITY_TYPE.ITEM) {
      if (e.description) lines.push(e.description);
      if (e.effect) {
        if (e.effect.heal) lines.push(`恢复 ${e.effect.heal} HP`);
        if (e.effect.atk) lines.push(`攻击力 +${e.effect.atk}`);
        if (e.effect.def) lines.push(`防御力 +${e.effect.def}`);
        if (e.effect.spd) lines.push(`速度 +${e.effect.spd}`);
      }
      lines.push('移动到上面拾取');
    } else if (e.type === ENTITY_TYPE.EVENT) {
      lines.push('按空格互动');
    }

    // 获取敌人概念图
    const isEnemy = e.type === ENTITY_TYPE.ENEMY || e.type === ENTITY_TYPE.BOSS;
    const portrait = isEnemy ? assetLoader.getEnemyPortrait(e.id) : null;
    const portraitW = portrait ? 90 : 0;
    const portraitPad = portrait ? 8 : 0;

    // 绘制tooltip
    ctx.font = '13px "Microsoft YaHei"';
    const textMaxW = Math.max(...lines.map(l => ctx.measureText(l).width)) + 24;
    const maxW = textMaxW + portraitW + portraitPad;
    const h = Math.max(lines.length * 20 + 16, portrait ? 130 : 0);
    const tx = Math.min(CANVAS_W - maxW - 10, CANVAS_W / 2);
    const ty = CANVAS_H - h - 50;

    // 背景
    ctx.fillStyle = 'rgba(5, 5, 15, 0.96)';
    roundRect(ctx, tx, ty, maxW, h, 10);
    ctx.fill();
    
    // 渐变边框
    ctx.strokeStyle = e.color || '#ffffff';
    ctx.lineWidth = 2;
    roundRect(ctx, tx, ty, maxW, h, 10);
    ctx.stroke();

    // 敌人概念图
    if (portrait) {
      const px = tx + 8;
      const py = ty + 8;
      const pw = portraitW - 4;
      const ph = h - 16;
      ctx.save();
      ctx.beginPath();
      roundRect(ctx, px, py, pw, ph, 6);
      ctx.clip();
      const srcH = portrait.height * 0.6;
      ctx.drawImage(portrait, 0, 0, portrait.width, srcH, px, py, pw, ph);
      ctx.restore();
      // 概念图边框
      ctx.strokeStyle = (e.color || '#ff4444') + '66';
      ctx.lineWidth = 1;
      roundRect(ctx, px, py, pw, ph, 6);
      ctx.stroke();
    }

    const textX = tx + 12 + portraitW + portraitPad;
    ctx.textAlign = 'left';
    for (let i = 0; i < lines.length; i++) {
      ctx.fillStyle = i === 0 ? (e.color || '#ffffff') : COLORS.TEXT_DIM;
      if (lines[i].startsWith('✓')) ctx.fillStyle = COLORS.TEXT_HEAL;
      if (lines[i].startsWith('✗')) ctx.fillStyle = COLORS.TEXT_DANGER;
      if (lines[i].startsWith('⚠')) ctx.fillStyle = '#ffaa44';
      if (lines[i].startsWith('△')) ctx.fillStyle = '#ccaa44';
      if (lines[i].startsWith('○')) ctx.fillStyle = '#44cc88';
      if (lines[i].startsWith('奖励')) ctx.fillStyle = COLORS.TEXT_GOLD;
      ctx.fillText(lines[i], textX, ty + 18 + i * 20);
    }
  }

  _drawDialogue(ctx, state) {
    const { lines, currentLine, speaker } = state;
    if (currentLine >= lines.length) return;

    const line = lines[currentLine];
    const boxH = 140;
    const y = CANVAS_H - boxH - 10;
    const portraitSize = 100;
    const hasPortrait = !!assetLoader.getCharPortrait(line.speaker);
    const textStartX = hasPortrait ? 30 + portraitSize + 16 : 40;

    // 半透明背景遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
    ctx.fillRect(0, y - 20, CANVAS_W, boxH + 30);

    // 对话框背景
    ctx.fillStyle = 'rgba(8, 8, 20, 0.95)';
    roundRect(ctx, 20, y, CANVAS_W - 40, boxH, 12);
    ctx.fill();

    // 边框颜色按说话人
    let borderColor = '#666';
    if (line.speaker === '主神') borderColor = '#ffffff';
    else if (line.speaker === '郑吒') borderColor = '#44aaff';
    else if (line.speaker === '系统') borderColor = '#ff6600';
    else if (line.speaker === '旁白') borderColor = '#888';
    else if (line.speaker === '张杰') borderColor = '#4488ff';
    else if (line.speaker === '詹岚') borderColor = '#44ff88';
    else if (line.speaker === '李萧毅') borderColor = '#ffaa44';
    else if (line.speaker === '牟钢') borderColor = '#cc8844';
    else borderColor = COLORS.NPC;

    // 渐变边框效果
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    roundRect(ctx, 20, y, CANVAS_W - 40, boxH, 12);
    ctx.stroke();
    
    // 内侧光晕
    ctx.strokeStyle = borderColor + '33';
    ctx.lineWidth = 4;
    roundRect(ctx, 22, y + 2, CANVAS_W - 44, boxH - 4, 10);
    ctx.stroke();

    // 角色立绘（如果有）
    if (hasPortrait) {
      const portrait = assetLoader.getCharPortrait(line.speaker);
      const px = 30;
      const py = y + 8;
      const pw = portraitSize - 10;
      const ph = boxH - 16;
      
      // 立绘边框
      ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
      roundRect(ctx, px - 2, py - 2, pw + 4, ph + 4, 8);
      ctx.fill();
      ctx.strokeStyle = borderColor + '88';
      ctx.lineWidth = 1;
      roundRect(ctx, px - 2, py - 2, pw + 4, ph + 4, 8);
      ctx.stroke();
      
      // 绘制立绘（裁切上半身）
      ctx.save();
      ctx.beginPath();
      roundRect(ctx, px, py, pw, ph, 6);
      ctx.clip();
      // 绘制上半部分（头和上身）
      const srcH = portrait.height * 0.5;
      ctx.drawImage(portrait, 0, 0, portrait.width, srcH, px, py, pw, ph);
      ctx.restore();
    }

    // 说话人名字（带底色标签）
    if (line.speaker) {
      ctx.font = 'bold 14px "Microsoft YaHei"';
      const nameW = ctx.measureText(line.speaker).width + 16;
      ctx.fillStyle = borderColor + '33';
      roundRect(ctx, textStartX - 4, y + 10, nameW + 4, 22, 4);
      ctx.fill();
      ctx.fillStyle = borderColor;
      ctx.textAlign = 'left';
      ctx.fillText(line.speaker, textStartX + 4, y + 26);
    }

    // 对白内容（逐字打字机效果模拟 - 按时间显示字数）
    ctx.font = '16px "Microsoft YaHei"';
    ctx.fillStyle = '#e8e8f0';
    const textWidth = CANVAS_W - textStartX - 50;
    wrapText(ctx, line.text, textStartX, y + 55, textWidth, 24);

    // 提示（动态闪烁）
    const blinkAlpha = 0.4 + 0.6 * Math.abs(Math.sin(this._time * 0.05));
    ctx.font = '12px "Microsoft YaHei"';
    ctx.fillStyle = `rgba(150, 150, 170, ${blinkAlpha})`;
    ctx.textAlign = 'right';
    ctx.fillText(`▼ 点击或空格继续  (${currentLine + 1}/${lines.length})`, CANVAS_W - 40, y + boxH - 14);
  }

  _drawCombatResult(ctx, result) {
    // 全屏暗色遮罩
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
    
    const boxW = 440;
    const boxH = Math.min(380, 100 + result.log.length * 22);
    const x = (CANVAS_W - boxW) / 2;
    const y = (CANVAS_H - boxH) / 2;

    // 渐变背景
    const gradient = ctx.createLinearGradient(x, y, x, y + boxH);
    gradient.addColorStop(0, 'rgba(10, 10, 25, 0.98)');
    gradient.addColorStop(1, 'rgba(5, 5, 15, 0.98)');
    ctx.fillStyle = gradient;
    roundRect(ctx, x, y, boxW, boxH, 14);
    ctx.fill();

    // 双层边框
    const borderColor = result.victory ? '#44ff88' : '#ff4444';
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    roundRect(ctx, x, y, boxW, boxH, 14);
    ctx.stroke();
    ctx.strokeStyle = borderColor + '33';
    ctx.lineWidth = 4;
    roundRect(ctx, x + 3, y + 3, boxW - 6, boxH - 6, 11);
    ctx.stroke();

    // 顶部装饰线
    ctx.fillStyle = borderColor;
    ctx.fillRect(x + 20, y + 45, boxW - 40, 1);

    ctx.font = 'bold 20px "Noto Serif SC", "Microsoft YaHei", serif';
    ctx.fillStyle = result.victory ? '#44ff88' : '#ff4444';
    ctx.textAlign = 'center';
    ctx.fillText(result.victory ? '⚔ 战 斗 胜 利 ⚔' : '💀 战 斗 失 败 💀', CANVAS_W / 2, y + 32);
    
    // 回合数
    ctx.font = '12px "Microsoft YaHei"';
    ctx.fillStyle = '#888';
    ctx.fillText('共 ' + (result.rounds || '?') + ' 回合', CANVAS_W / 2, y + 50);

    ctx.font = '13px "Microsoft YaHei"';
    ctx.textAlign = 'left';
    const maxLines = Math.floor((boxH - 60) / 22);
    const startIdx = Math.max(0, result.log.length - maxLines);

    for (let i = startIdx; i < result.log.length; i++) {
      const entry = result.log[i];
      switch (entry.type) {
        case 'attack': case 'critical': ctx.fillStyle = '#ffcc88'; break;
        case 'enemy_attack': ctx.fillStyle = '#ff8888'; break;
        case 'victory': ctx.fillStyle = COLORS.TEXT_HEAL; break;
        case 'defeat': ctx.fillStyle = COLORS.TEXT_DANGER; break;
        case 'reward': ctx.fillStyle = COLORS.TEXT_GOLD; break;
        case 'danger': ctx.fillStyle = COLORS.TEXT_DANGER; break;
        default: ctx.fillStyle = COLORS.TEXT_DIM;
      }
      ctx.fillText(entry.text, x + 16, y + 52 + (i - startIdx) * 22);
    }

    ctx.font = '11px "Microsoft YaHei"';
    ctx.fillStyle = COLORS.TEXT_DIM;
    ctx.textAlign = 'center';
    ctx.fillText('点击或空格关闭', CANVAS_W / 2, y + boxH - 12);
  }

  _drawFloatTexts(ctx) {
    this._floatTexts = this._floatTexts.filter(ft => {
      ft.y += ft.vy;
      ft.life--;
      const alpha = ft.life / 60;
      ctx.font = 'bold 14px "Microsoft YaHei"';
      ctx.fillStyle = ft.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
      ctx.textAlign = 'center';
      ctx.fillText(ft.text, ft.x * TILE_SIZE + TILE_SIZE / 2, ft.y * TILE_SIZE);
      return ft.life > 0;
    });
  }

  _drawParticles(ctx) {
    this._particles = this._particles.filter(pt => {
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.life--;
      const alpha = pt.life / 40;
      ctx.fillStyle = pt.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
      ctx.fillRect(pt.x - pt.size / 2, pt.y - pt.size / 2, pt.size, pt.size);
      return pt.life > 0;
    });
  }

  /** 显示屏幕通知 */
  notify(text, color = '#44ff88', duration = 90) {
    this._notifications.push({ text, color, life: duration, maxLife: duration });
  }

  /** 屏幕过渡：淡入黑色 */
  fadeOut(speed = 0.05) {
    this._transitionTarget = 1;
    this._transitionSpeed = speed;
  }

  /** 屏幕过渡：淡出黑色 */
  fadeIn(speed = 0.03) {
    this._transitionTarget = 0;
    this._transitionSpeed = speed;
  }

  _drawNotifications(ctx) {
    let y = 60;
    this._notifications = this._notifications.filter(n => {
      n.life--;
      const alpha = Math.min(1, n.life / 20, (n.maxLife - (n.maxLife - n.life)) / 20);
      const finalAlpha = Math.min(alpha, n.life < 20 ? n.life / 20 : 1);

      ctx.fillStyle = `rgba(10, 10, 20, ${finalAlpha * 0.85})`;
      const textW = ctx.measureText(n.text).width || 150;
      const boxW = textW + 30;
      const boxX = (CANVAS_W - boxW) / 2;

      roundRect(ctx, boxX, y, boxW, 28, 6);
      ctx.fill();

      ctx.font = '13px "Microsoft YaHei"';
      ctx.fillStyle = n.color.replace(')', `, ${finalAlpha})`).replace('rgb', 'rgba');
      if (!n.color.startsWith('rgb')) {
        ctx.fillStyle = n.color;
        ctx.globalAlpha = finalAlpha;
      }
      ctx.textAlign = 'center';
      ctx.fillText(n.text, CANVAS_W / 2, y + 18);
      ctx.globalAlpha = 1;

      y += 34;
      return n.life > 0;
    });
  }

  _drawAmbientParticles(ctx, floor, player) {
    // 在玩家视野范围内绘制漂浮灰尘粒子
    if (!this._ambientDust) {
      this._ambientDust = [];
      for (let i = 0; i < 30; i++) {
        this._ambientDust.push({
          x: Math.random() * floor.width * TILE_SIZE,
          y: Math.random() * floor.height * TILE_SIZE,
          size: 0.5 + Math.random() * 1.5,
          speed: 0.1 + Math.random() * 0.3,
          alpha: 0.1 + Math.random() * 0.2,
          drift: Math.random() * Math.PI * 2,
        });
      }
    }
    
    const viewR = 6 * TILE_SIZE;
    const px = player.x * TILE_SIZE + TILE_SIZE / 2;
    const py = player.y * TILE_SIZE + TILE_SIZE / 2;
    
    for (const d of this._ambientDust) {
      d.y -= d.speed;
      d.x += Math.sin(this._time * 0.01 + d.drift) * 0.2;
      
      // 超出范围就重置
      if (d.y < 0) {
        d.y = floor.height * TILE_SIZE;
        d.x = Math.random() * floor.width * TILE_SIZE;
      }
      
      const dx = d.x - px;
      const dy = d.y - py;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > viewR) continue;
      
      const fadeAlpha = d.alpha * (1 - dist / viewR);
      ctx.fillStyle = 'rgba(200, 200, 220, ' + fadeAlpha + ')';
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _drawFogOfWar(ctx, floor, player) {
    const { width, height } = floor;
    const viewRadius = 5;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = x - player.x;
        const dy = y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > viewRadius + 2) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
          ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        } else if (dist > viewRadius) {
          const alpha = 0.4 + 0.45 * ((dist - viewRadius) / 2);
          ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
          ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        } else if (dist > viewRadius - 1) {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
          ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
      }
    }
    const px = player.x * TILE_SIZE + TILE_SIZE / 2;
    const py = player.y * TILE_SIZE + TILE_SIZE / 2;
    const gradient = ctx.createRadialGradient(px, py, 0, px, py, viewRadius * TILE_SIZE);
    gradient.addColorStop(0, 'rgba(255, 220, 150, 0.06)');
    gradient.addColorStop(0.5, 'rgba(255, 200, 120, 0.02)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width * TILE_SIZE, height * TILE_SIZE);
  }

  _drawMinimap(ctx, floor, entities, player) {
    const mmSize = 3;
    const mmW = floor.width * mmSize;
    const mmH = floor.height * mmSize;
    const mmX = CANVAS_W - mmW - 16;
    const mmY = CANVAS_H - mmH - 50;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    ctx.fillRect(mmX - 2, mmY - 2, mmW + 4, mmH + 4);
    ctx.strokeStyle = 'rgba(100, 100, 120, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(mmX - 2, mmY - 2, mmW + 4, mmH + 4);
    for (let y = 0; y < floor.height; y++) {
      for (let x = 0; x < floor.width; x++) {
        const tile = floor.tiles[y][x];
        switch (tile) {
          case TILE.FLOOR: ctx.fillStyle = '#222233'; break;
          case TILE.WALL: ctx.fillStyle = '#444455'; break;
          case TILE.STAIRS: ctx.fillStyle = '#44ffff'; break;
          case TILE.LAVA: ctx.fillStyle = '#ff3322'; break;
          case TILE.DOOR: ctx.fillStyle = '#886644'; break;
          default: ctx.fillStyle = '#000000'; break;
        }
        ctx.fillRect(mmX + x * mmSize, mmY + y * mmSize, mmSize, mmSize);
      }
    }
    for (const e of entities) {
      if (e.type === ENTITY_TYPE.ENEMY || e.type === ENTITY_TYPE.BOSS) ctx.fillStyle = '#ff4444';
      else if (e.type === ENTITY_TYPE.ITEM) ctx.fillStyle = '#ffcc44';
      else if (e.type === ENTITY_TYPE.COMPANION) ctx.fillStyle = '#4488ff';
      else if (e.type === ENTITY_TYPE.EVENT) ctx.fillStyle = '#ffffff';
      else continue;
      ctx.fillRect(mmX + e.x * mmSize, mmY + e.y * mmSize, mmSize, mmSize);
    }
    const blink = Math.sin(this._time * 0.15) > 0;
    if (blink) {
      ctx.fillStyle = '#44aaff';
      ctx.fillRect(mmX + player.x * mmSize - 1, mmY + player.y * mmSize - 1, mmSize + 2, mmSize + 2);
    }
  }
}


// ── 物品/事件图标绘制（不用人偶） ──
function _drawItemIcon(ctx, x, y, entity, time) {
  const cx = x + TILE_SIZE / 2;
  const cy = y + TILE_SIZE / 2;
  const bob = Math.sin(time * 0.08 + x * 0.1) * 2;

  // 脚下阴影
  ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
  ctx.beginPath();
  ctx.ellipse(cx, y + TILE_SIZE - 4, TILE_SIZE * 0.25, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // 图标底色光晕
  const glowColor = entity.color || '#ffcc44';
  const glow = ctx.createRadialGradient(cx, cy + bob, 0, cx, cy + bob, TILE_SIZE * 0.35);
  glow.addColorStop(0, glowColor + '33');
  glow.addColorStop(1, glowColor + '00');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(cx, cy + bob, TILE_SIZE * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // 图标字符
  ctx.fillStyle = entity.color || '#ffcc44';
  ctx.font = `${TILE_SIZE * 0.55}px "Noto Serif SC", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.lineWidth = 2;
  ctx.strokeText(entity.sprite, cx, cy + bob);
  ctx.fillText(entity.sprite, cx, cy + bob);
}

// ── 工具 ──

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const chars = text.split('');
  let line = '';
  let lineY = y;
  for (const char of chars) {
    const test = line + char;
    if (ctx.measureText(test).width > maxWidth) {
      ctx.fillText(line, x, lineY);
      line = char;
      lineY += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, lineY);
}
