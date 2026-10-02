// ═══════════════════════════════════════════════════════════════
// Canvas2D 渲染器 — 像素风地牢 + HUD + 对话框
// ═══════════════════════════════════════════════════════════════

import { TILE_SIZE, TILE, COLORS, CANVAS_W, CANVAS_H, ENTITY_TYPE } from './constants.js';
import { getInventoryList } from './ConsumableSystem.js';
import { assetLoader } from './AssetLoader.js';
import { gameState } from './GameState.js';
import { atmosphereRenderer } from './AtmosphereSystem.js';
import { getNoise, getIsSneaking, getAmmo, getMaxAmmo } from './StealthSystem.js';
import { getEffectiveAtk, getEffectiveDef, getEffectiveCrt, getEffectiveSpd, previewBattle, getStatsBreakdown } from './CombatSystem.js';
import { getGeneLockProgress } from './GeneLockSystem.js';
import { getTalentEffects } from './TalentTree.js';
import { scaleEnemy } from './DifficultyScaler.js';
import { getAvailableSkills } from './SkillSystem.js';
import { getPlayerPowerRating, getEnemyPowerRating, comparePower } from './PowerRating.js';
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
    this._saveIndicator = 0; // countdown frames
    this._particles = [];
    this._ambientParticles = [];
    this._ambientTimer = 0;
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

  addFloatText(text, x, y, color = COLORS.TEXT_WHITE, opts = {}) {
    const isCrit = opts.crit || text.includes('暴击') || text.includes('LEVEL');
    const isHeal = opts.heal || text.includes('+') && text.includes('HP');
    this._floatTexts.push({ 
      text, x, y, 
      vy: isCrit ? -2.0 : isHeal ? -1.0 : -1.5, 
      color, 
      life: isCrit ? 75 : 60,
      maxLife: isCrit ? 75 : 60,
      fontSize: isCrit ? 18 : isHeal ? 13 : 14,
      scale: isCrit ? 1.3 : 1.0,
      bounce: isCrit,
    });
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
    this._floorIndex = floorIndex || 0;
    this._drawMap(ctx, floor);
    this._drawFog(ctx, floor, p);

    // ── 环境粒子（灰尘/光点） ──
    this._drawAmbientParticles(ctx, floor, p);

    // ── 战争迷雾 / 光照 ──
    this._drawFogOfWar(ctx, floor, p);

    // ── 绘制实体 ──
    // ── 密道提示渲染 ──
    try {
      if (floor._secrets) {
        const p = gameState.player;
        for (const s of floor._secrets) {
          if (s.broken) continue;
          const dist = Math.abs(s.x - p.x) + Math.abs(s.y - p.y);
          if (dist <= 3) {
            const px = s.x * TILE_SIZE;
            const py = s.y * TILE_SIZE;
            const pulse = 0.03 + 0.02 * Math.sin(this._time * 0.08 + s.x * 5 + s.y * 3);
            ctx.fillStyle = `rgba(255, 220, 150, ${pulse})`;
            ctx.fillRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
          }
        }
      }
    } catch {}

    this._drawEntities(ctx, entities, hoveredEntity);

    // ── 绘制玩家 ──
    this._drawPlayer(ctx, p);

    // ── 浮动文字 ──
    this._drawFloatTexts(ctx);

    // ── 粒子 ──
    this._drawParticles(ctx);
    this._updateAmbientParticles(ctx, floor);

    ctx.restore();

    // ── 大气效果层 ──
    try { atmosphereRenderer.render(ctx, this.canvas.width, this.canvas.height); } catch {}

    // ── HUD（固定位置）──
    this._entities = entities;
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

    // ── 胶片颗粒（恐怖氛围） ──
    if (this._time % 2 === 0) {  // 每隔一帧更新，减少性能消耗
      ctx.globalAlpha = 0.03;
      for (let i = 0; i < 50; i++) {
        const gx = Math.random() * CANVAS_W;
        const gy = Math.random() * CANVAS_H;
        const gs = Math.random() * 2;
        ctx.fillStyle = Math.random() > 0.5 ? '#ffffff' : '#000000';
        ctx.fillRect(gx, gy, gs, gs);
      }
      ctx.globalAlpha = 1;
    }

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
            drawFloorTile(ctx, px, py, (x * 7 + y * 13) % 4, floor?.theme);
            continue;
            break;
          case TILE.WALL:
            drawWallTile(ctx, px, py, 0, floor?.theme);
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


  _drawFog(ctx, floor, p) {
    if (!fogOfWar.enabled) return;
    const { width, height } = floor;
    const fi = this._floorIndex || 0;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const state = fogOfWar.getTileState(fi, x, y, p.x, p.y);
        if (state === 'visible') continue;
        
        const px = x * TILE_SIZE;
        const py = y * TILE_SIZE;
        
        if (state === 'hidden') {
          ctx.fillStyle = '#050508';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        } else {
          // explored - dim overlay
          ctx.fillStyle = 'rgba(5, 5, 8, ' + EXPLORED_ALPHA + ')';
          ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
        }
      }
    }
  }

  _drawEntities(ctx, entities, hoveredEntity) {
    const p = gameState.player;
    const fi = this._floorIndex || 0;
    for (const e of entities) {
      // 迷雾中的实体不显示
      if (fogOfWar.enabled && !fogOfWar.isVisible(fi, e.x, e.y, p.x, p.y)) continue;
      const px = e.x * TILE_SIZE;
      const py = e.y * TILE_SIZE;

      // 底色/光环
      if (e.type === ENTITY_TYPE.ENEMY || e.type === ENTITY_TYPE.BOSS) {
        // 难度色彩: 绿=轻松 黄=匹配 红=困难 紫=极难
        const p_ = gameState.player;
        const pAtk = getEffectiveAtk(p_);
        const pDef = getEffectiveDef(p_);
        const dmgTo = Math.max(1, pAtk - (e.def || 0));
        const dmgFrom = Math.max(0, (e.atk || 0) - pDef);
        const turnsToKill = dmgTo > 0 ? Math.ceil((e.hp || 50) / dmgTo) : 999;
        const turnsToLose = dmgFrom > 0 ? Math.ceil(p_.hp / dmgFrom) : 999;
        const ratio = turnsToKill / Math.max(1, turnsToLose);
        let glowR, glowG, glowB;
        if (ratio < 0.3) { glowR=60; glowG=200; glowB=60; }         // 轻松
        else if (ratio < 0.7) { glowR=200; glowG=200; glowB=60; }   // 匹配
        else if (ratio < 1.0) { glowR=255; glowG=120; glowB=40; }   // 困难
        else if (ratio < 2.0) { glowR=255; glowG=60; glowB=60; }    // 极难
        else { glowR=180; glowG=40; glowB=200; }                     // 致命
        const glow = 0.15 + 0.1 * Math.sin(this._time * 0.06);
        ctx.fillStyle = `rgba(${glowR}, ${glowG}, ${glowB}, ${glow})`;
        ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
        // 精英词缀标记
        if (e.affix) {
          ctx.font = '8px sans-serif';
          ctx.fillStyle = e.affix.color || '#ffaa00';
          ctx.textAlign = 'right';
          ctx.fillText(e.affix.icon || '★', px + TILE_SIZE - 2, py + 10);
          ctx.textAlign = 'left';
        }
      } else if (e.type === ENTITY_TYPE.COMPANION) {
        ctx.fillStyle = 'rgba(68, 136, 255, 0.12)';
        ctx.fillRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4);
      } else if (e.type === ENTITY_TYPE.TRAP) {
        // 隐藏陷阱: 玩家距离<=2时显示微弱光芒作为提示
        const p_ = gameState.player;
        const dist = Math.abs(e.x - p_.x) + Math.abs(e.y - p_.y);
        if (dist <= 2 || e.visible) {
          const pulse = 0.05 + 0.04 * Math.sin(this._time * 0.12 + e.x * 3);
          ctx.fillStyle = `rgba(255, 60, 40, ${pulse})`;
          ctx.fillRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
          // 近距离显示警告标记
          if (dist <= 1) {
            ctx.font = '10px sans-serif';
            ctx.fillStyle = 'rgba(255, 80, 40, 0.6)';
            ctx.textAlign = 'center';
            ctx.fillText('⚠', px + TILE_SIZE / 2, py + TILE_SIZE / 2 + 3);
            ctx.textAlign = 'left';
          }
        }
      } else if (e.isChest) {
        // 宝箱特效
        const shimmer = 0.1 + 0.06 * Math.sin(this._time * 0.06 + e.y * 2);
        ctx.fillStyle = `rgba(255, 204, 68, ${shimmer})`;
        ctx.fillRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
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
      const isItem = e.type === ENTITY_TYPE.ITEM || e.type === ENTITY_TYPE.EVENT || e.type === ENTITY_TYPE.TRAP;
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
      facing: p.facing || 'down',
    });
  }

  _drawHUD(ctx, p, floor) {
    const pad = 12;

    // ── 左上：生存状态 ──
    ctx.fillStyle = 'rgba(10, 10, 20, 0.88)';
    const hudH = p.maxMana > 0 ? 155 : 130;
    roundRect(ctx, pad, pad, 220, hudH, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(68, 170, 255, 0.4)';
    ctx.lineWidth = 1;
    roundRect(ctx, pad, pad, 220, hudH, 8);
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

    // 法力条（道法血统时显示）
    if (p.maxMana > 0) {
      this._drawBar(ctx, pad + 10, pad + 88, 200, 8, p.mana || 0, p.maxMana, COLORS.MANA_BAR, '#222');
      ctx.fillStyle = '#88aaff';
      ctx.fillText(`MP ${p.mana || 0}/${p.maxMana}`, pad + 10, pad + 108);
    }

    // 经验条
    const manaOffset = p.maxMana > 0 ? 25 : 0;
    this._drawBar(ctx, pad + 10, pad + 90 + manaOffset, 200, 6, p.exp, p.expToNext, '#aa88ff', '#222');
    ctx.fillStyle = COLORS.TEXT_WHITE;
    ctx.fillText(`EXP ${p.exp}/${p.expToNext}`, pad + 10, pad + 108 + manaOffset);

    // 基因锁状态 + 充能进度 + 技能
    {
      const glProgress = getGeneLockProgress(p);
      const skills = getAvailableSkills(p);
      ctx.fillStyle = COLORS.GENE_LOCK;
      if (p.geneLock > 0) {
        ctx.fillText(`基因锁 ${p.geneLock}阶 ${p.geneLockActive ? '●激活' : '○待机'}`, pad + 10, pad + 125 + manaOffset);
      }
      // 充能进度条（未满4阶时显示）
      if (p.geneLock < 4) {
        const barX = pad + 10;
        const barY = pad + 130 + manaOffset;
        const barW = 120;
        const barH = 4;
        ctx.fillStyle = '#1a1a2a';
        ctx.fillRect(barX, barY, barW, barH);
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(barX, barY, barW * Math.min(1, glProgress.progressPercent / 100), barH);
        ctx.fillStyle = '#888';
        ctx.font = '9px monospace';
        ctx.fillText(`充能 ${glProgress.charge}/${glProgress.nextThreshold || '∞'}`, barX + barW + 4, barY + 4);
        ctx.font = '12px monospace';
      }
      // 可用技能数
      if (skills.length > 0) {
        ctx.fillStyle = '#ff8800';
        ctx.fillText(`⚔ ${skills.length}个技能`, pad + 10, pad + 145 + manaOffset);
      }
    }

    // ── 右上：战斗属性 ──
    ctx.fillStyle = 'rgba(10, 10, 20, 0.88)';
    roundRect(ctx, CANVAS_W - 160 - pad, pad, 160, 165, 8);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 100, 100, 0.3)';
    roundRect(ctx, CANVAS_W - 160 - pad, pad, 160, 165, 8);
    ctx.stroke();

    const rx = CANVAS_W - 150;
    ctx.font = '12px "Microsoft YaHei"';
    ctx.fillStyle = '#ff8866';
    ctx.fillText(`⚔ 攻击 ${getEffectiveAtk(p)}`, rx, pad + 20);
    ctx.fillStyle = '#6688ff';
    ctx.fillText(`🛡 防御 ${getEffectiveDef(p)}`, rx, pad + 38);
    ctx.fillStyle = '#44ffaa';
    ctx.fillText(`💨 速度 ${getEffectiveSpd(p)}`, rx, pad + 56);
    ctx.fillStyle = '#ffcc44';
    ctx.fillText(`✦ 暴击 ${getEffectiveCrt(p)}%`, rx, pad + 74);
    ctx.fillStyle = '#ffaa44';
    ctx.fillText(`💰 ${p.gold}G  ⬡${p.rewardPoints}`, rx, pad + 92);
    ctx.fillStyle = '#666';
    ctx.fillText(`回合 ${gameState.stats.turnsPlayed}`, rx, pad + 110);
    // 连杀指示器
    const streak = killStreak.getDisplay();
    if (streak) {
      ctx.fillStyle = streak.color;
      ctx.fillText(streak.icon + ' ' + streak.name + ' x' + streak.kills, rx, pad + 128);
    }

    // 姿态指示器
    const stance = getCurrentStance();
    if (stance && stance.id !== 'balanced') {
      ctx.fillStyle = stance.color || '#888';
      ctx.fillText('⚔ ' + stance.name, rx + 80, pad + 128);
    }

    // 战力评估
    try {
      const pr = getPlayerPowerRating(p);
      ctx.fillStyle = pr.rank.color;
      ctx.font = 'bold 11px "Microsoft YaHei"';
      ctx.fillText('战力 ' + pr.rank.name + ' ' + pr.total, rx, pad + 145);
    } catch {}

    // ── 下方：楼层信息条 ──
    {
      const floorName = floor?.name || '';
      const floorEnemies = (this._entities || []).filter(e => e.type === 'enemy' || e.type === 'boss').length;
      const floorItems = (this._entities || []).filter(e => e.type === 'item' || e.type === 'stat_boost' || e.type === 'consumable' || e.type === 'key' || e.type === 'weapon' || e.type === 'armor').length;
      
      if (floorName) {
        ctx.save();
        ctx.font = '11px "Microsoft YaHei"';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        let infoText = floorName;
        if (floorEnemies > 0) infoText += ` · ⚔${floorEnemies}`;
        if (floorItems > 0) infoText += ` · ✦${floorItems}`;
        ctx.fillText(infoText, CANVAS_W / 2, CANVAS_H - 8);
        ctx.restore();
      }
    }

    // 存档指示器
    if (this._saveIndicator > 0) {
      this._saveIndicator--;
      const alpha = Math.min(1, this._saveIndicator / 30);
      ctx.save();
      ctx.font = '12px "Microsoft YaHei"';
      ctx.fillStyle = `rgba(136, 136, 136, ${alpha})`;
      ctx.textAlign = 'right';
      ctx.fillText('💾', CANVAS_W - pad - 5, CANVAS_H - pad - 5);
      ctx.restore();
    }

    // 天赋点提醒
    try {
      const tp = gameState.talents?.points || 0;
      if (tp > 0) {
        ctx.fillStyle = '#ffdd44';
        ctx.fillText(`🌟 ${tp}天赋点可用`, rx, pad + 128);
      }
    } catch {}

    // ── 潜行/弹药 HUD（Ch2+）──
    if (gameState.chapter >= 2) {
      const stX = CANVAS_W - 160 - pad;
      const stY = pad + 130;
      ctx.fillStyle = 'rgba(10, 10, 20, 0.85)';
      roundRect(ctx, stX, stY, 160, 52, 8);
      ctx.fill();
      ctx.strokeStyle = getIsSneaking() ? 'rgba(80, 200, 120, 0.5)' : 'rgba(100, 100, 100, 0.3)';
      roundRect(ctx, stX, stY, 160, 52, 8);
      ctx.stroke();

      // 噪音条
      const noise = getNoise();
      const noiseColor = noise > 60 ? '#ff4444' : noise > 30 ? '#ffaa44' : '#44ff88';
      ctx.font = '11px "Microsoft YaHei"';
      ctx.textAlign = 'left';
      ctx.fillStyle = noiseColor;
      ctx.fillText(`${getIsSneaking() ? '🤫' : '👂'} 噪音 ${noise}`, stX + 10, stY + 16);
      this._drawBar(ctx, stX + 10, stY + 20, 140, 6, noise, 100, noiseColor, '#222');

      // 弹药
      const ammo = getAmmo();
      const ammoMax = getMaxAmmo();
      const ammoColor = ammo <= 5 ? '#ff4444' : ammo <= 15 ? '#ffaa44' : '#aaddff';
      ctx.fillStyle = ammoColor;
      ctx.fillText(`🔫 弹药 ${ammo}/${ammoMax}`, stX + 10, stY + 44);
    }

    // ── 消耗品快捷栏（底部上方）──
    try {
      const items = getInventoryList().slice(0, 4); // 最多显示4个
      if (items.length > 0) {
        const qX = CANVAS_W - pad - items.length * 42 - 8;
        const qY = CANVAS_H - 78;
        ctx.fillStyle = 'rgba(10, 10, 20, 0.82)';
        roundRect(ctx, qX, qY, items.length * 42 + 8, 32, 6);
        ctx.fill();
        ctx.strokeStyle = 'rgba(68, 204, 136, 0.3)';
        roundRect(ctx, qX, qY, items.length * 42 + 8, 32, 6);
        ctx.stroke();
        items.forEach((item, i) => {
          ctx.font = '14px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillStyle = item.color || '#ccc';
          ctx.fillText(item.icon, qX + 16 + i * 42, qY + 17);
          ctx.font = '9px "Microsoft YaHei"';
          ctx.fillStyle = '#888';
          ctx.fillText('×' + item.count, qX + 32 + i * 42, qY + 26);
        });
        ctx.font = '8px "Microsoft YaHei"';
        ctx.textAlign = 'right';
        ctx.fillStyle = '#555';
        ctx.fillText('Q=道具', qX - 4, qY + 22);
        ctx.textAlign = 'left';
      }
    } catch {}
    
    // ── 待生效增益指示器 ──
    try {
      const buffs = gameState._pendingBuffs || [];
      if (buffs.length > 0) {
        const bX = pad;
        const bY = CANVAS_H - 78;
        ctx.fillStyle = 'rgba(10, 20, 10, 0.85)';
        roundRect(ctx, bX, bY, buffs.length * 50 + 10, 30, 6);
        ctx.fill();
        ctx.strokeStyle = 'rgba(68, 204, 102, 0.4)';
        roundRect(ctx, bX, bY, buffs.length * 50 + 10, 30, 6);
        ctx.stroke();
        ctx.font = '10px "Microsoft YaHei"';
        ctx.textAlign = 'left';
        buffs.forEach((b, i) => {
          ctx.fillStyle = '#44cc66';
          ctx.fillText('⚔ ' + (b.stat || '').toUpperCase(), bX + 6 + i * 50, bY + 20);
        });
      }
    } catch {}

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
      const scaledE = scaleEnemy(e, (gameState.chapter || 1));
      const preview = previewBattle(p, scaledE);
      lines.push(`HP: ${e.hp}  ATK: ${e.atk}  DEF: ${e.def}`);
      if (e.weaknesses?.length) {
        const wMap = { fire: '🔥火', ice: '❄冰', poison: '☠毒', psychic: '🧠念', dark: '🌑暗', holy: '✦圣' };
        lines.push('弱点: ' + e.weaknesses.map(w => wMap[w] || w).join(' '));
      }
      if (e.res) lines.push(`法抗: ${e.res}%`);
      if (e.acidBlood) lines.push(`☠ 酸血: 击杀后反噬${e.acidBlood}伤害`);
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
      // 显示特性和Boss相位警告
      if (preview.warnings && preview.warnings.length > 0) {
        lines.push('特性: ' + preview.warnings.join(' / '));
      }
      if (e.rewards) {
        const r = e.rewards;
        lines.push(`奖励: ${r.exp || 0}EXP  ${r.gold || 0}G`);
      }
      // 战力对比
      try {
        const cmp = comparePower(p, scaledE);
        lines.push(cmp.verdictIcon + ' 战力 ' + cmp.player.total + ' vs ' + cmp.enemy.total + ' — ' + cmp.verdict);
      } catch {}
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
      if (lines[i].includes('弱点')) ctx.fillStyle = '#ff8844';
      if (lines[i].includes('暴击')) ctx.fillStyle = '#ffcc00';
      if (lines[i].includes('吸血')) ctx.fillStyle = '#ff44aa';
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
        case 'attack': ctx.fillStyle = '#ffcc88'; break;
        case 'critical': ctx.fillStyle = '#ffaa00'; break;
        case 'enemy_attack': ctx.fillStyle = '#ff8888'; break;
        case 'victory': ctx.fillStyle = COLORS.TEXT_HEAL; break;
        case 'defeat': ctx.fillStyle = COLORS.TEXT_DANGER; break;
        case 'reward': ctx.fillStyle = COLORS.TEXT_GOLD; break;
        case 'danger': ctx.fillStyle = COLORS.TEXT_DANGER; break;
        case 'heal': ctx.fillStyle = '#88ffaa'; break;
        case 'buff': ctx.fillStyle = '#66ccff'; break;
        case 'spell': ctx.fillStyle = '#cc88ff'; break;
        case 'burn': ctx.fillStyle = '#ff8833'; break;
        case 'reflect': ctx.fillStyle = '#6699ff'; break;
        case 'geneLock': ctx.fillStyle = '#ff6600'; break;
        case 'geneLock_advance': ctx.fillStyle = '#ff8800'; break;
        case 'skill': ctx.fillStyle = '#ffaa44'; break;
        case 'control': ctx.fillStyle = '#aa88ff'; break;
        case 'dodge': ctx.fillStyle = '#44ffcc'; break;
        case 'debuff': ctx.fillStyle = '#ff6688'; break;
        case 'poison': ctx.fillStyle = '#88ff44'; break;
        case 'info': ctx.fillStyle = '#88aacc'; break;
        case 'separator': ctx.fillStyle = '#333'; break;
        // ── 新系统颜色 ──
        case 'boss_phase': ctx.fillStyle = '#ff4488'; break;
        case 'boss_special': ctx.fillStyle = '#ff2266'; break;
        case 'block': ctx.fillStyle = '#4488ff'; break;
        case 'talent_save': ctx.fillStyle = '#ffdd44'; break;
        case 'enemy_heal': ctx.fillStyle = '#44ff88'; break;
        case 'enemy_enrage': ctx.fillStyle = '#ff6644'; break;
        case 'enemy_dodge': ctx.fillStyle = '#aaaaaa'; break;
        case 'enemy_shield': ctx.fillStyle = '#6688cc'; break;
        case 'enemy_revive': ctx.fillStyle = '#ff44ff'; break;
        case 'enemy_hurt': ctx.fillStyle = '#ff8844'; break;
        case 'elemental_advantage': ctx.fillStyle = '#ff8844'; break;
        case 'elemental_resist': ctx.fillStyle = '#6688aa'; break;
        case 'elemental_resonance': ctx.fillStyle = '#ffcc44'; break;
        case 'loot': ctx.fillStyle = '#ffcc44'; break;
        case 'loot_equipment': ctx.fillStyle = entry.color || '#aa44ff'; break;
        case 'companion_dialogue': ctx.fillStyle = entry.color || '#aaccff'; break;
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
      ft.vy *= 0.98; // gentle deceleration
      ft.life--;
      const alpha = Math.min(1, ft.life / (ft.maxLife * 0.4));
      const progress = 1 - (ft.life / ft.maxLife);
      // Bounce scale animation for crits
      let scale = ft.scale || 1.0;
      if (ft.bounce && progress < 0.15) {
        scale = ft.scale * (1 + 0.3 * Math.sin(progress / 0.15 * Math.PI));
      }
      const size = Math.round((ft.fontSize || 14) * scale);
      ctx.save();
      ctx.font = `bold ${size}px "Microsoft YaHei"`;
      // Text outline for better readability
      ctx.strokeStyle = `rgba(0,0,0,${alpha * 0.8})`;
      ctx.lineWidth = 3;
      ctx.textAlign = 'center';
      const tx = ft.x * TILE_SIZE + TILE_SIZE / 2;
      const ty = ft.y * TILE_SIZE;
      ctx.strokeText(ft.text, tx, ty);
      ctx.fillStyle = ft.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
      ctx.fillText(ft.text, tx, ty);
      ctx.restore();
      return ft.life > 0;
    });
  }

  _updateAmbientParticles(ctx, floor) {
    this._ambientTimer++;
    // Spawn ambient particles occasionally
    if (this._ambientTimer % 8 === 0 && this._ambientParticles.length < 30) {
      const theme = floor?.theme || 'default';
      let color, size;
      if (theme.startsWith('alien_hive')) {
        color = `rgba(${80 + Math.random()*40}, ${30 + Math.random()*20}, ${10 + Math.random()*10},`;
        size = 1.5 + Math.random() * 2;
      } else if (theme.startsWith('alien')) {
        color = `rgba(${30 + Math.random()*20}, ${40 + Math.random()*30}, ${80 + Math.random()*40},`;
        size = 1 + Math.random() * 1.5;
      } else if (theme.startsWith('juon')) {
        color = `rgba(${60 + Math.random()*30}, ${40 + Math.random()*20}, ${50 + Math.random()*30},`;
        size = 0.8 + Math.random() * 1;
      } else if (theme.startsWith('desert') || theme.startsWith('tomb')) {
        color = `rgba(${120 + Math.random()*40}, ${100 + Math.random()*30}, ${50 + Math.random()*20},`;
        size = 1 + Math.random() * 1.5;
      } else if (theme.startsWith('modern')) {
        color = `rgba(${80 + Math.random()*30}, ${80 + Math.random()*30}, ${90 + Math.random()*30},`;
        size = 0.5 + Math.random() * 0.8;
      } else if (theme === 'mental_space' || theme === 'spirit') {
        color = `rgba(${40 + Math.random()*20}, ${40 + Math.random()*20}, ${120 + Math.random()*60},`;
        size = 1 + Math.random() * 2;
      } else if (theme === 'biolab') {
        color = `rgba(${60 + Math.random()*40}, ${80 + Math.random()*40}, ${30 + Math.random()*20},`;
        size = 1 + Math.random() * 1.5;
      } else if (theme === 'jungle') {
        color = `rgba(${30 + Math.random()*20}, ${80 + Math.random()*40}, ${20 + Math.random()*15},`;
        size = 1.5 + Math.random() * 2;
      } else if (theme === 'scifi_base' || theme === 'mech') {
        color = `rgba(${40 + Math.random()*20}, ${50 + Math.random()*20}, ${90 + Math.random()*40},`;
        size = 0.8 + Math.random() * 1;
      } else if (theme === 'fantasy') {
        color = `rgba(${60 + Math.random()*30}, ${70 + Math.random()*30}, ${40 + Math.random()*20},`;
        size = 1 + Math.random() * 1.5;
      } else if (theme === 'nightmare') {
        color = `rgba(${100 + Math.random()*50}, ${20 + Math.random()*20}, ${60 + Math.random()*40},`;
        size = 1.5 + Math.random() * 2;
      } else {
        color = `rgba(${150 + Math.random()*50}, ${150 + Math.random()*50}, ${160 + Math.random()*50},`;
        size = 0.8 + Math.random() * 1.2;
      }
      this._ambientParticles.push({
        x: Math.random() * CANVAS_W,
        y: Math.random() * CANVAS_H,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -0.1 - Math.random() * 0.2,
        size,
        color,
        life: 120 + Math.random() * 120,
        maxLife: 120 + Math.random() * 120,
      });
    }
    // Draw ambient particles
    this._ambientParticles = this._ambientParticles.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      const alpha = Math.min(0.3, (p.life / p.maxLife) * 0.3);
      ctx.fillStyle = p.color + alpha + ')';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      return p.life > 0;
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

  /** 全屏闪光效果 */
  flash(color, duration = 200) {
    this._flashColor = color;
    this._flashDuration = duration;
    this._flashStart = performance.now();
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
    const pulse = 0.5 + 0.5 * Math.sin(this._time * 0.08);
    for (const e of entities) {
      if (e.type === ENTITY_TYPE.ENEMY || e.type === ENTITY_TYPE.BOSS) ctx.fillStyle = '#ff4444';
      else if (e.type === ENTITY_TYPE.TRAP) { 
        // 隐藏陷阱在小地图不显示(除非已可见)
        if (!e.visible) continue;
        ctx.fillStyle = '#ff6622';
      }
      else if (e.type === ENTITY_TYPE.ITEM) ctx.fillStyle = '#ffcc44';
      else if (e.type === ENTITY_TYPE.COMPANION) ctx.fillStyle = '#4488ff';
      else if (e.type === ENTITY_TYPE.EVENT) ctx.fillStyle = '#ffffff';
      else continue;
      const eSize = mmSize + (e.type === ENTITY_TYPE.BOSS ? pulse * 2 : 0);
      ctx.fillRect(mmX + e.x * mmSize, mmY + e.y * mmSize, eSize, eSize);
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
