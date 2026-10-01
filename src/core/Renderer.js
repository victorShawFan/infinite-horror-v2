// ═══════════════════════════════════════════════════════════════
// Canvas2D 渲染器 — 像素风地牢 + HUD + 对话框
// ═══════════════════════════════════════════════════════════════

import { TILE_SIZE, TILE, COLORS, CANVAS_W, CANVAS_H, ENTITY_TYPE } from './constants.js';
import { gameState } from './GameState.js';
import { getEffectiveAtk, getEffectiveDef, previewBattle } from './CombatSystem.js';
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

    if (!floor) {
      ctx.restore();
      return;
    }

    const p = gameState.player;

    // 计算相机偏移（玩家居中）
    const camX = p.x * TILE_SIZE - CANVAS_W / 2 + TILE_SIZE / 2;
    const camY = p.y * TILE_SIZE - CANVAS_H / 2 + TILE_SIZE / 2;

    ctx.save();
    ctx.translate(-camX, -camY);

    // ── 绘制地图 ──
    this._drawMap(ctx, floor);

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

      // 绘制精灵（带阴影和描边的汉字）
      const bob = (e.type === ENTITY_TYPE.ITEM) ? Math.sin(this._time * 0.08 + e.x) * 2 : 0;
      drawCharacterSprite(ctx, px, py, e.sprite, e.color || '#ffffff', TILE_SIZE * 0.6, { bob });

      // 敌人HP条
      if ((e.type === ENTITY_TYPE.ENEMY || e.type === ENTITY_TYPE.BOSS) && e.hp !== undefined) {
        const maxHp = e._maxHp || e.hp;
        const ratio = e.hp / maxHp;
        drawHealthBar(ctx, px, py, ratio);
      }
    }
  }

  _drawPlayer(ctx, p) {
    const px = p.x * TILE_SIZE;
    const py = p.y * TILE_SIZE;

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

    // 玩家角色（精细绘制）
    drawCharacterSprite(ctx, px, py, '郑', COLORS.PLAYER, TILE_SIZE * 0.65, { showBase: false });
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
    const companionCount = (gs.companions || []).filter(c => c.alive).length;
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
      if (e.description) lines.push(e.description);
      lines.push('─────────');
      if (preview.canWin) {
        lines.push(`✓ 可击败 (${preview.turnsNeeded}回合)`);
        lines.push(`预计受伤: ${preview.totalDamage}  |  战后HP: ${preview.hpAfter}`);
      } else {
        lines.push(`✗ 无法击败！差距过大`);
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

    // 绘制tooltip
    ctx.font = '13px "Microsoft YaHei"';
    const maxW = Math.max(...lines.map(l => ctx.measureText(l).width)) + 24;
    const h = lines.length * 20 + 16;
    const tx = Math.min(CANVAS_W - maxW - 10, CANVAS_W / 2);
    const ty = CANVAS_H - h - 50;

    ctx.fillStyle = 'rgba(5, 5, 15, 0.95)';
    roundRect(ctx, tx, ty, maxW, h, 8);
    ctx.fill();
    ctx.strokeStyle = e.color || '#ffffff';
    ctx.lineWidth = 1.5;
    roundRect(ctx, tx, ty, maxW, h, 8);
    ctx.stroke();

    ctx.textAlign = 'left';
    for (let i = 0; i < lines.length; i++) {
      ctx.fillStyle = i === 0 ? (e.color || '#ffffff') : COLORS.TEXT_DIM;
      if (lines[i].startsWith('✓')) ctx.fillStyle = COLORS.TEXT_HEAL;
      if (lines[i].startsWith('✗')) ctx.fillStyle = COLORS.TEXT_DANGER;
      if (lines[i].startsWith('奖励')) ctx.fillStyle = COLORS.TEXT_GOLD;
      ctx.fillText(lines[i], tx + 12, ty + 18 + i * 20);
    }
  }

  _drawDialogue(ctx, state) {
    const { lines, currentLine, speaker } = state;
    if (currentLine >= lines.length) return;

    const line = lines[currentLine];
    const boxH = 120;
    const y = CANVAS_H - boxH - 10;

    // 暗色对话框
    ctx.fillStyle = 'rgba(5, 5, 15, 0.95)';
    roundRect(ctx, 20, y, CANVAS_W - 40, boxH, 12);
    ctx.fill();

    // 边框颜色按说话人
    let borderColor = '#666';
    if (line.speaker === '主神') borderColor = COLORS.LORD_GOD;
    else if (line.speaker === '郑吒') borderColor = COLORS.PLAYER;
    else if (line.speaker === '系统') borderColor = COLORS.GENE_LOCK;
    else if (line.speaker === '旁白') borderColor = '#888';
    else borderColor = COLORS.NPC;

    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    roundRect(ctx, 20, y, CANVAS_W - 40, boxH, 12);
    ctx.stroke();

    // 说话人名字
    if (line.speaker) {
      ctx.font = 'bold 14px "Microsoft YaHei"';
      ctx.fillStyle = borderColor;
      ctx.textAlign = 'left';
      ctx.fillText(line.speaker, 40, y + 24);
    }

    // 对白内容
    ctx.font = '16px "Microsoft YaHei"';
    ctx.fillStyle = COLORS.TEXT_WHITE;
    wrapText(ctx, line.text, 40, y + 50, CANVAS_W - 80, 22);

    // 提示
    ctx.font = '11px "Microsoft YaHei"';
    ctx.fillStyle = COLORS.TEXT_DIM;
    ctx.textAlign = 'right';
    const dots = '.'.repeat(1 + (Math.floor(this._time / 30) % 3));
    ctx.fillText(`点击或空格继续${dots}  (${currentLine + 1}/${lines.length})`, CANVAS_W - 40, y + boxH - 12);
  }

  _drawCombatResult(ctx, result) {
    const boxW = 400;
    const boxH = Math.min(350, 80 + result.log.length * 22);
    const x = (CANVAS_W - boxW) / 2;
    const y = (CANVAS_H - boxH) / 2;

    ctx.fillStyle = 'rgba(5, 5, 15, 0.96)';
    roundRect(ctx, x, y, boxW, boxH, 12);
    ctx.fill();

    ctx.strokeStyle = result.victory ? COLORS.TEXT_HEAL : COLORS.TEXT_DANGER;
    ctx.lineWidth = 2;
    roundRect(ctx, x, y, boxW, boxH, 12);
    ctx.stroke();

    ctx.font = 'bold 16px "Microsoft YaHei"';
    ctx.fillStyle = result.victory ? COLORS.TEXT_HEAL : COLORS.TEXT_DANGER;
    ctx.textAlign = 'center';
    ctx.fillText(result.victory ? '⚔ 战 斗 胜 利 ⚔' : '💀 战 斗 失 败 💀', CANVAS_W / 2, y + 28);

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
