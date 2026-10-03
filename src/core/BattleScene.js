// ═══════════════════════════════════════════════════════════════
// 战斗场景演出系统 — 专属战斗画面 + 角色动画 + 技能特效
// ═══════════════════════════════════════════════════════════════
//
// 功能：
// 1. 战斗开始时全屏切入专属战斗场景
// 2. 左侧玩家精灵 ↔ 右侧敌人精灵
// 3. 每回合攻击/技能/防御有专属动画
// 4. 伤害数字飞出 + 暴击放大 + 元素特效
// 5. Boss战专属背景 + 阶段转换动画
// 6. 胜利/失败动画
// ═══════════════════════════════════════════════════════════════

import { eventBus } from './EventBus.js';
import { BLOODLINE, GENE_LOCK } from './constants.js';

// ── 战斗场景状态 ──
let _canvas = null;
let _ctx = null;
let _active = false;
let _raf = null;
let _state = {
  player: null,
  enemy: null,
  playerHp: 0, playerMaxHp: 0,
  enemyHp: 0, enemyMaxHp: 0,
  playerMana: 0, playerMaxMana: 0,
  round: 0,
  phase: 'idle', // idle, player_attack, enemy_attack, skill, defend, victory, defeat
  phaseTimer: 0,
  particles: [],
  damageNumbers: [],
  screenShake: { x: 0, y: 0, intensity: 0, decay: 0 },
  bg: { type: 'normal', scrollX: 0 },
  playerAnim: { x: 0, y: 0, frame: 0, state: 'idle', flashTimer: 0 },
  enemyAnim: { x: 0, y: 0, frame: 0, state: 'idle', flashTimer: 0 },
  statusEffects: [],
  combo: 0,
  chapter: 1,
  isBoss: false,
  bossPhase: 0,
  overlayAlpha: 0,
  _time: 0,
};

// ── 配色方案（按章节） ──
const CHAPTER_PALETTES = {
  1:  { bg1: '#1a0a2e', bg2: '#0d0015', accent: '#8844cc', ground: '#2a1a3e' },  // 生化危机
  2:  { bg1: '#0a1a2e', bg2: '#000a15', accent: '#4488cc', ground: '#1a2a3e' },  // 异形
  3:  { bg1: '#2e1a0a', bg2: '#150a00', accent: '#cc8844', ground: '#3e2a1a' },  // 木乃伊
  4:  { bg1: '#0a2e1a', bg2: '#001a0a', accent: '#44cc88', ground: '#1a3e2a' },  // 侏罗纪
  5:  { bg1: '#2e0a0a', bg2: '#1a0000', accent: '#cc4444', ground: '#3e1a1a' },  // 电锯惊魂
  6:  { bg1: '#1a1a2e', bg2: '#0a0a1a', accent: '#6666cc', ground: '#2a2a3e' },  // 咒怨
  7:  { bg1: '#2e2e0a', bg2: '#1a1a00', accent: '#cccc44', ground: '#3e3e1a' },  // 指环王
  8:  { bg1: '#0a2e2e', bg2: '#001a1a', accent: '#44cccc', ground: '#1a3e3e' },  // 星际
  9:  { bg1: '#2e0a2e', bg2: '#1a001a', accent: '#cc44cc', ground: '#3e1a3e' },  // 死神来了
  10: { bg1: '#1a0a0a', bg2: '#0a0000', accent: '#ff4444', ground: '#2e1010' },  // 黑客帝国
  11: { bg1: '#0a0a0a', bg2: '#000000', accent: '#888888', ground: '#1a1a1a' },  // 迷雾
  12: { bg1: '#1a0000', bg2: '#0a0000', accent: '#ff0000', ground: '#2e0a0a' },  // 最终
};

// ── 血统特效配色 ──
const BLOODLINE_COLORS = {
  [BLOODLINE.VAMPIRE]:    { primary: '#cc0000', secondary: '#ff4444', particle: '#ff0000' },
  [BLOODLINE.ANCIENT_WU]: { primary: '#cc8800', secondary: '#ffaa44', particle: '#ffcc00' },
  [BLOODLINE.MARTIAL]:    { primary: '#00cc88', secondary: '#44ffaa', particle: '#00ff88' },
  [BLOODLINE.DAOIST]:     { primary: '#4488ff', secondary: '#88aaff', particle: '#44ccff' },
};

// ── 初始化 ──
export function initBattleScene(canvas) {
  _canvas = canvas;
  _ctx = canvas.getContext('2d');
}

// ── 开始战斗场景 ──
export function startBattleScene(player, enemy, chapter, isBoss = false) {
  if (!_canvas || !_ctx) return;
  _active = true;
  const w = _canvas.width;
  const h = _canvas.height;
  
  _state = {
    player, enemy,
    playerHp: player.hp, playerMaxHp: player.maxHp,
    enemyHp: enemy.hp, enemyMaxHp: enemy._maxHp || enemy.hp,
    playerMana: player.mana || 0, playerMaxMana: player.maxMana || 50,
    round: 0,
    phase: 'intro',
    phaseTimer: 60,
    particles: [],
    damageNumbers: [],
    screenShake: { x: 0, y: 0, intensity: 0, decay: 0 },
    bg: { type: isBoss ? 'boss' : 'normal', scrollX: 0 },
    playerAnim: { x: w * 0.22, y: h * 0.55, frame: 0, state: 'idle', flashTimer: 0, scale: 1 },
    enemyAnim: { x: w * 0.78, y: h * 0.55, frame: 0, state: 'idle', flashTimer: 0, scale: isBoss ? 1.4 : 1 },
    statusEffects: [],
    combo: 0,
    chapter: chapter || 1,
    isBoss,
    bossPhase: 0,
    overlayAlpha: 1, // 从黑到透明
    _time: 0,
  };
  
  if (!_raf) _renderLoop();
}

// ── 停止战斗场景 ──
export function stopBattleScene() {
  _active = false;
  if (_raf) {
    cancelAnimationFrame(_raf);
    _raf = null;
  }
}

export function isBattleSceneActive() { return _active; }

// ── 更新战斗状态 ──
export function updateBattleState(update) {
  if (!_active) return;
  
  if (update.playerHp !== undefined) {
    const oldHp = _state.playerHp;
    _state.playerHp = Math.max(0, update.playerHp);
    if (update.playerHp < oldHp) {
      const dmg = oldHp - update.playerHp;
      _addDamageNumber(dmg, _state.playerAnim.x, _state.playerAnim.y - 30, '#ff4444', update.isCrit);
      _triggerHitEffect('player', update.isCrit);
    } else if (update.playerHp > oldHp) {
      const heal = update.playerHp - oldHp;
      _addDamageNumber('+' + heal, _state.playerAnim.x, _state.playerAnim.y - 30, '#44ff88', false);
    }
  }
  
  if (update.enemyHp !== undefined) {
    const oldHp = _state.enemyHp;
    _state.enemyHp = Math.max(0, update.enemyHp);
    if (update.enemyHp < oldHp) {
      const dmg = oldHp - update.enemyHp;
      _addDamageNumber(dmg, _state.enemyAnim.x, _state.enemyAnim.y - 30, '#ffcc44', update.isCrit);
      _triggerHitEffect('enemy', update.isCrit);
      if (update.isCrit) _state.combo++;
    }
  }
  
  if (update.playerMana !== undefined) _state.playerMana = update.playerMana;
  if (update.round !== undefined) _state.round = update.round;
  if (update.bossPhase !== undefined) {
    if (update.bossPhase !== _state.bossPhase) {
      _triggerPhaseTransition(update.bossPhase);
    }
    _state.bossPhase = update.bossPhase;
  }
  
  // 播放行动动画
  if (update.action) {
    _playActionAnimation(update.action, update.actionData);
  }
}

// ── 播放胜利/失败 ──
export function playBattleResult(victory) {
  if (!_active) return;
  _state.phase = victory ? 'victory' : 'defeat';
  _state.phaseTimer = 90;
  
  if (victory) {
    // 胜利粒子爆发
    for (let i = 0; i < 40; i++) {
      _addParticle(_state.enemyAnim.x, _state.enemyAnim.y, {
        color: '#ffcc44',
        vx: (Math.random() - 0.5) * 8,
        vy: -Math.random() * 6 - 2,
        life: 40 + Math.random() * 30,
        size: 2 + Math.random() * 4,
        gravity: 0.1,
      });
    }
  } else {
    // 失败效果
    _state.screenShake = { x: 0, y: 0, intensity: 8, decay: 0.02 };
  }
}

// ── 内部：渲染循环 ──
function _renderLoop() {
  if (!_active) { _raf = null; return; }
  _raf = requestAnimationFrame(_renderLoop);
  
  const ctx = _ctx;
  const w = _canvas.width;
  const h = _canvas.height;
  _state._time++;
  
  // 更新动画
  _updateAnimations();
  
  // 屏幕震动
  ctx.save();
  if (_state.screenShake.intensity > 0) {
    _state.screenShake.x = (Math.random() - 0.5) * _state.screenShake.intensity * 2;
    _state.screenShake.y = (Math.random() - 0.5) * _state.screenShake.intensity * 2;
    _state.screenShake.intensity *= (1 - _state.screenShake.decay);
    if (_state.screenShake.intensity < 0.1) _state.screenShake.intensity = 0;
    ctx.translate(_state.screenShake.x, _state.screenShake.y);
  }
  
  // 绘制背景
  _drawBackground(ctx, w, h);
  
  // 绘制地面
  _drawGround(ctx, w, h);
  
  // 绘制角色
  _drawPlayer(ctx, w, h);
  _drawEnemy(ctx, w, h);
  
  // 绘制粒子
  _drawParticles(ctx);
  
  // 绘制伤害数字
  _drawDamageNumbers(ctx);
  
  // 绘制HUD（HP/MP条）
  _drawBattleHUD(ctx, w, h);
  
  // 回合数 + 连击
  _drawRoundInfo(ctx, w, h);
  
  // 阶段特效
  _drawPhaseEffects(ctx, w, h);
  
  // 过渡遮罩
  if (_state.overlayAlpha > 0) {
    ctx.fillStyle = `rgba(0,0,0,${_state.overlayAlpha})`;
    ctx.fillRect(0, 0, w, h);
    _state.overlayAlpha = Math.max(0, _state.overlayAlpha - 0.02);
  }
  
  ctx.restore();
}

// ── 更新动画 ──
function _updateAnimations() {
  // 玩家动画
  const pa = _state.playerAnim;
  pa.frame++;
  if (pa.state === 'attack') {
    if (pa.frame > 20) { pa.state = 'idle'; pa.x = _canvas.width * 0.22; }
    else if (pa.frame < 10) pa.x += 4; // 冲刺
    else pa.x -= 4; // 回退
  } else if (pa.state === 'hit') {
    if (pa.frame > 12) pa.state = 'idle';
  } else if (pa.state === 'skill') {
    if (pa.frame > 30) pa.state = 'idle';
  } else if (pa.state === 'defend') {
    if (pa.frame > 15) pa.state = 'idle';
  }
  if (pa.flashTimer > 0) pa.flashTimer--;
  
  // 敌人动画
  const ea = _state.enemyAnim;
  ea.frame++;
  if (ea.state === 'attack') {
    if (ea.frame > 20) { ea.state = 'idle'; ea.x = _canvas.width * 0.78; }
    else if (ea.frame < 10) ea.x -= 4;
    else ea.x += 4;
  } else if (ea.state === 'hit') {
    if (ea.frame > 12) ea.state = 'idle';
  } else if (ea.state === 'death') {
    ea.scale = Math.max(0, ea.scale - 0.02);
  }
  if (ea.flashTimer > 0) ea.flashTimer--;
  
  // 粒子更新
  _state.particles = _state.particles.filter(p => {
    p.x += p.vx;
    p.y += p.vy;
    if (p.gravity) p.vy += p.gravity;
    p.life--;
    return p.life > 0;
  });
  
  // 伤害数字更新
  _state.damageNumbers = _state.damageNumbers.filter(d => {
    d.y -= 1.5;
    d.life--;
    d.alpha = Math.max(0, d.life / d.maxLife);
    return d.life > 0;
  });
  
  // 阶段计时
  if (_state.phaseTimer > 0) _state.phaseTimer--;
}

// ── 绘制背景 ──
function _drawBackground(ctx, w, h) {
  const palette = CHAPTER_PALETTES[_state.chapter] || CHAPTER_PALETTES[1];
  
  // 渐变背景
  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  bgGrad.addColorStop(0, palette.bg1);
  bgGrad.addColorStop(1, palette.bg2);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);
  
  // 大气粒子
  _state.bg.scrollX += 0.3;
  const t = _state._time;
  for (let i = 0; i < 12; i++) {
    const x = ((i * 73 + _state.bg.scrollX) % (w + 40)) - 20;
    const y = h * 0.2 + Math.sin(t * 0.01 + i * 1.3) * h * 0.15;
    const size = 1 + Math.sin(t * 0.02 + i) * 0.5;
    ctx.globalAlpha = 0.15 + Math.sin(t * 0.015 + i) * 0.1;
    ctx.fillStyle = palette.accent;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  
  // Boss战：额外暗纹
  if (_state.isBoss) {
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = palette.accent;
    for (let i = 0; i < 6; i++) {
      const bx = w * 0.5 + Math.cos(t * 0.005 + i * 1.05) * w * 0.4;
      const by = h * 0.4 + Math.sin(t * 0.007 + i * 0.8) * h * 0.3;
      ctx.beginPath();
      ctx.arc(bx, by, 30 + Math.sin(t * 0.01 + i) * 10, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

// ── 绘制地面 ──
function _drawGround(ctx, w, h) {
  const palette = CHAPTER_PALETTES[_state.chapter] || CHAPTER_PALETTES[1];
  const groundY = h * 0.72;
  
  // 地面渐变
  const gGrad = ctx.createLinearGradient(0, groundY, 0, h);
  gGrad.addColorStop(0, palette.ground);
  gGrad.addColorStop(1, palette.bg2);
  ctx.fillStyle = gGrad;
  ctx.fillRect(0, groundY, w, h - groundY);
  
  // 透视线
  ctx.strokeStyle = palette.accent + '22';
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    const ly = groundY + i * 12;
    ctx.beginPath();
    ctx.moveTo(0, ly);
    ctx.lineTo(w, ly);
    ctx.stroke();
  }
}

// ── 绘制玩家 ──
function _drawPlayer(ctx, w, h) {
  const pa = _state.playerAnim;
  const p = _state.player;
  const t = _state._time;
  
  ctx.save();
  ctx.translate(pa.x, pa.y);
  
  // 呼吸动画
  const breathe = Math.sin(t * 0.06) * 2;
  ctx.translate(0, breathe);
  
  // 被击中闪烁
  if (pa.flashTimer > 0 && pa.flashTimer % 4 < 2) {
    ctx.globalAlpha = 0.5;
  }
  
  // 血统光环
  const bl = p.activeBloodline;
  if (bl && BLOODLINE_COLORS[bl]) {
    const bc = BLOODLINE_COLORS[bl];
    ctx.shadowColor = bc.primary;
    ctx.shadowBlur = 15 + Math.sin(t * 0.05) * 5;
    
    // 光环圈
    ctx.globalAlpha = 0.15;
    ctx.strokeStyle = bc.secondary;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 20, 35, 12, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  
  // 身体（像素风人物）
  const bodyH = 48;
  const bodyW = 28;
  
  // 阴影
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(0, 22, 18, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  
  // 基因锁等级决定轮廓颜色
  const geneLock = p.geneLock || 0;
  const bodyColor = geneLock >= 4 ? '#ffcc44' : geneLock >= 2 ? '#88ccff' : '#6688aa';
  const outlineColor = geneLock >= 4 ? '#ff8800' : geneLock >= 2 ? '#4488cc' : '#446688';
  
  // 身体轮廓
  ctx.fillStyle = outlineColor;
  ctx.fillRect(-bodyW/2 - 1, -bodyH - 1, bodyW + 2, bodyH + 2);
  ctx.fillStyle = bodyColor;
  ctx.fillRect(-bodyW/2, -bodyH, bodyW, bodyH);
  
  // 头部
  ctx.fillStyle = '#e8c4a0';
  ctx.fillRect(-10, -bodyH - 14, 20, 16);
  
  // 眼睛
  ctx.fillStyle = '#222';
  ctx.fillRect(-6, -bodyH - 8, 3, 3);
  ctx.fillRect(3, -bodyH - 8, 3, 3);
  
  // 武器（如果有）
  if (p.weapon) {
    ctx.fillStyle = '#aaaacc';
    ctx.save();
    const weaponAngle = pa.state === 'attack' ? -0.8 + pa.frame * 0.12 : -0.3 + Math.sin(t * 0.04) * 0.1;
    ctx.translate(bodyW/2 + 2, -bodyH * 0.4);
    ctx.rotate(weaponAngle);
    ctx.fillRect(-2, -24, 4, 28);
    ctx.fillStyle = '#ccddff';
    ctx.fillRect(-4, -28, 8, 6);
    ctx.restore();
  }
  
  // 技能释放特效
  if (pa.state === 'skill') {
    ctx.globalAlpha = 0.6;
    const skillColor = bl && BLOODLINE_COLORS[bl] ? BLOODLINE_COLORS[bl].primary : '#88aaff';
    ctx.strokeStyle = skillColor;
    ctx.lineWidth = 2;
    const radius = pa.frame * 2;
    ctx.beginPath();
    ctx.arc(0, -bodyH * 0.4, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  
  // 防御姿态
  if (pa.state === 'defend') {
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#4488ff';
    ctx.beginPath();
    ctx.arc(0, -bodyH * 0.3, 30 + Math.sin(t * 0.1) * 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  
  // 名字
  ctx.fillStyle = '#ffffff';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(p.name || '郑吒', 0, 30);
  
  ctx.shadowBlur = 0;
  ctx.restore();
}

// ── 绘制敌人 ──
function _drawEnemy(ctx, w, h) {
  const ea = _state.enemyAnim;
  const enemy = _state.enemy;
  const t = _state._time;
  
  ctx.save();
  ctx.translate(ea.x, ea.y);
  ctx.scale(ea.scale, ea.scale);
  
  // 呼吸
  const breathe = Math.sin(t * 0.05 + 1) * 2;
  ctx.translate(0, breathe);
  
  // 被击中闪烁
  if (ea.flashTimer > 0 && ea.flashTimer % 4 < 2) {
    ctx.globalAlpha = 0.5;
  }
  
  // 确定敌人颜色（基于类型/元素）
  const enemyElement = enemy.element || enemy.damageType || 'physical';
  const ELEM_COLORS = {
    physical: '#cc6644', fire: '#ff4400', ice: '#44aaff',
    lightning: '#ffcc00', poison: '#44cc44', dark: '#8844cc',
    holy: '#ffdd88', psychic: '#cc44cc', wind: '#88ddaa',
  };
  const enemyColor = ELEM_COLORS[enemyElement] || '#cc6644';
  const enemyDark = _darken(enemyColor, 0.4);
  
  // Boss特殊效果
  if (_state.isBoss) {
    ctx.shadowColor = enemyColor;
    ctx.shadowBlur = 20 + Math.sin(t * 0.04) * 8;
    
    // Boss光环
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = enemyColor;
    ctx.beginPath();
    ctx.arc(0, -20, 60 + Math.sin(t * 0.03) * 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  
  // 阴影
  const shadowScale = _state.isBoss ? 1.3 : 1;
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.ellipse(0, 22 * shadowScale, 22 * shadowScale, 8 * shadowScale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  
  // 身体
  const bodyH = _state.isBoss ? 60 : 44;
  const bodyW = _state.isBoss ? 36 : 26;
  
  ctx.fillStyle = enemyDark;
  ctx.fillRect(-bodyW/2 - 1, -bodyH - 1, bodyW + 2, bodyH + 2);
  ctx.fillStyle = enemyColor;
  ctx.fillRect(-bodyW/2, -bodyH, bodyW, bodyH);
  
  // 头部
  const headSize = _state.isBoss ? 24 : 18;
  ctx.fillStyle = enemyDark;
  ctx.fillRect(-headSize/2, -bodyH - headSize + 2, headSize, headSize);
  
  // 眼睛（红色发光）
  ctx.fillStyle = '#ff0000';
  ctx.shadowColor = '#ff0000';
  ctx.shadowBlur = 6;
  const eyeSize = _state.isBoss ? 4 : 3;
  ctx.fillRect(-headSize/4, -bodyH - headSize/2 - 1, eyeSize, eyeSize);
  ctx.fillRect(headSize/4 - eyeSize, -bodyH - headSize/2 - 1, eyeSize, eyeSize);
  ctx.shadowBlur = 0;
  
  // 敌人名字
  ctx.fillStyle = _state.isBoss ? '#ff4444' : '#ffcccc';
  ctx.font = _state.isBoss ? 'bold 11px monospace' : '10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(enemy.name || '???', 0, 32 * shadowScale);
  
  // Elite词缀标记
  if (enemy.affix) {
    ctx.fillStyle = '#ffaa44';
    ctx.font = '9px monospace';
    ctx.fillText('⚡ ' + (enemy.affix.name || '精英'), 0, 42 * shadowScale);
  }
  
  ctx.shadowBlur = 0;
  ctx.restore();
}

// ── 绘制战斗HUD ──
function _drawBattleHUD(ctx, w, h) {
  const hudY = 20;
  const barW = 180;
  const barH = 14;
  
  // ── 玩家HP条 ──
  const pHpRatio = _state.playerHp / _state.playerMaxHp;
  ctx.fillStyle = '#00000088';
  ctx.fillRect(16, hudY, barW + 4, barH + 18);
  
  // 名字
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px monospace';
  ctx.textAlign = 'left';
  ctx.fillText(_state.player?.name || '郑吒', 20, hudY + 10);
  ctx.fillStyle = '#888';
  ctx.font = '9px monospace';
  ctx.fillText('Lv.' + (_state.player?.level || 1), 20 + 50, hudY + 10);
  
  // HP背景
  ctx.fillStyle = '#331111';
  ctx.fillRect(20, hudY + 14, barW, barH);
  // HP前景
  const hpColor = pHpRatio > 0.5 ? '#44cc44' : pHpRatio > 0.25 ? '#ccaa44' : '#cc4444';
  ctx.fillStyle = hpColor;
  ctx.fillRect(20, hudY + 14, barW * pHpRatio, barH);
  // HP数字
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${_state.playerHp}/${_state.playerMaxHp}`, 20 + barW / 2, hudY + 14 + barH - 3);
  
  // MP条
  if (_state.playerMaxMana > 0) {
    const mpRatio = _state.playerMana / _state.playerMaxMana;
    ctx.fillStyle = '#111133';
    ctx.fillRect(20, hudY + 30, barW, 6);
    ctx.fillStyle = '#4488ff';
    ctx.fillRect(20, hudY + 30, barW * mpRatio, 6);
  }
  
  // ── 敌人HP条 ──
  const eHpRatio = _state.enemyHp / _state.enemyMaxHp;
  const eBarX = w - 16 - barW - 4;
  ctx.fillStyle = '#00000088';
  ctx.fillRect(eBarX, hudY, barW + 4, barH + 18);
  
  // 名字
  ctx.fillStyle = _state.isBoss ? '#ff4444' : '#ffcccc';
  ctx.font = _state.isBoss ? 'bold 10px monospace' : 'bold 10px monospace';
  ctx.textAlign = 'right';
  const eName = _state.enemy?.name || '???';
  ctx.fillText(eName, w - 20, hudY + 10);
  
  // Boss阶段
  if (_state.isBoss && _state.bossPhase > 0) {
    ctx.fillStyle = '#ff8844';
    ctx.font = '9px monospace';
    ctx.fillText('Phase ' + (_state.bossPhase + 1), w - 20 - ctx.measureText(eName).width - 10, hudY + 10);
  }
  
  // HP背景
  ctx.fillStyle = '#331111';
  ctx.fillRect(eBarX + 2, hudY + 14, barW, barH);
  // HP前景（从右向左减少）
  const eHpColor = _state.isBoss ? '#cc2222' : '#cc4444';
  ctx.fillStyle = eHpColor;
  ctx.fillRect(eBarX + 2 + barW * (1 - eHpRatio), hudY + 14, barW * eHpRatio, barH);
  // HP数字
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 9px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`${_state.enemyHp}/${_state.enemyMaxHp}`, eBarX + 2 + barW / 2, hudY + 14 + barH - 3);
}

// ── 绘制回合信息 ──
function _drawRoundInfo(ctx, w, h) {
  // 回合数
  ctx.fillStyle = '#ffffff44';
  ctx.font = '11px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`ROUND ${_state.round}`, w / 2, 28);
  
  // 连击
  if (_state.combo > 1) {
    ctx.fillStyle = '#ffcc44';
    ctx.font = 'bold 14px monospace';
    ctx.fillText(`${_state.combo} COMBO!`, w / 2, 48);
  }
}

// ── 绘制阶段特效 ──
function _drawPhaseEffects(ctx, w, h) {
  if (_state.phase === 'victory') {
    // 胜利文字
    ctx.save();
    ctx.globalAlpha = Math.min(1, (90 - _state.phaseTimer) / 20);
    ctx.fillStyle = '#ffcc44';
    ctx.font = 'bold 28px monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#ffcc44';
    ctx.shadowBlur = 20;
    ctx.fillText('VICTORY', w / 2, h * 0.4);
    ctx.shadowBlur = 0;
    ctx.restore();
  } else if (_state.phase === 'defeat') {
    // 失败效果
    ctx.save();
    ctx.globalAlpha = Math.min(0.6, (90 - _state.phaseTimer) / 30);
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = Math.min(1, (90 - _state.phaseTimer) / 20);
    ctx.fillStyle = '#cc2222';
    ctx.font = 'bold 24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('DEFEATED', w / 2, h * 0.4);
    ctx.restore();
  } else if (_state.phase === 'phase_transition') {
    // Boss阶段转换
    ctx.save();
    const alpha = Math.min(1, _state.phaseTimer / 15);
    ctx.globalAlpha = alpha * 0.4;
    ctx.fillStyle = '#ff0000';
    ctx.fillRect(0, 0, w, h);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#ff4444';
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('— PHASE ' + (_state.bossPhase + 1) + ' —', w / 2, h * 0.35);
    ctx.restore();
  }
}

// ── 绘制粒子 ──
function _drawParticles(ctx) {
  for (const p of _state.particles) {
    ctx.globalAlpha = Math.min(1, p.life / 10);
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ── 绘制伤害数字 ──
function _drawDamageNumbers(ctx) {
  for (const d of _state.damageNumbers) {
    ctx.save();
    ctx.globalAlpha = d.alpha;
    ctx.fillStyle = d.color;
    ctx.font = d.isCrit ? 'bold 22px monospace' : 'bold 16px monospace';
    ctx.textAlign = 'center';
    if (d.isCrit) {
      ctx.shadowColor = d.color;
      ctx.shadowBlur = 10;
    }
    ctx.fillText(d.text, d.x, d.y);
    ctx.shadowBlur = 0;
    ctx.restore();
  }
}

// ── 触发命中效果 ──
function _triggerHitEffect(target, isCrit) {
  const anim = target === 'player' ? _state.playerAnim : _state.enemyAnim;
  anim.state = 'hit';
  anim.frame = 0;
  anim.flashTimer = 12;
  
  _state.screenShake = {
    x: 0, y: 0,
    intensity: isCrit ? 6 : 3,
    decay: 0.15,
  };
  
  // 命中粒子
  const count = isCrit ? 15 : 6;
  for (let i = 0; i < count; i++) {
    _addParticle(anim.x, anim.y - 20, {
      color: isCrit ? '#ff4444' : '#ffaa88',
      vx: (Math.random() - 0.5) * (isCrit ? 6 : 4),
      vy: -Math.random() * 3 - 1,
      life: 15 + Math.random() * 10,
      size: isCrit ? 3 : 2,
      gravity: 0.15,
    });
  }
}

// ── 播放行动动画 ──
function _playActionAnimation(action, data) {
  switch (action) {
    case 'player_attack':
      _state.playerAnim.state = 'attack';
      _state.playerAnim.frame = 0;
      break;
    case 'enemy_attack':
      _state.enemyAnim.state = 'attack';
      _state.enemyAnim.frame = 0;
      break;
    case 'player_skill':
      _state.playerAnim.state = 'skill';
      _state.playerAnim.frame = 0;
      // 技能粒子
      const skillColor = data?.color || '#88aaff';
      for (let i = 0; i < 20; i++) {
        const angle = (i / 20) * Math.PI * 2;
        _addParticle(_state.playerAnim.x, _state.playerAnim.y - 20, {
          color: skillColor,
          vx: Math.cos(angle) * 3,
          vy: Math.sin(angle) * 3 - 1,
          life: 20 + Math.random() * 10,
          size: 2 + Math.random() * 2,
          gravity: 0,
        });
      }
      break;
    case 'player_defend':
      _state.playerAnim.state = 'defend';
      _state.playerAnim.frame = 0;
      break;
    case 'enemy_skill':
      _state.enemyAnim.state = 'skill';
      _state.enemyAnim.frame = 0;
      // Boss技能粒子
      for (let i = 0; i < 15; i++) {
        _addParticle(_state.enemyAnim.x, _state.enemyAnim.y - 20, {
          color: '#ff4444',
          vx: (Math.random() - 0.5) * 5,
          vy: -Math.random() * 4,
          life: 25,
          size: 3,
          gravity: 0.05,
        });
      }
      break;
    case 'enemy_death':
      _state.enemyAnim.state = 'death';
      _state.enemyAnim.frame = 0;
      // 死亡爆炸粒子
      for (let i = 0; i < 30; i++) {
        _addParticle(_state.enemyAnim.x, _state.enemyAnim.y - 20, {
          color: i % 2 === 0 ? '#ffcc44' : '#ff8844',
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8,
          life: 30 + Math.random() * 20,
          size: 2 + Math.random() * 4,
          gravity: 0.08,
        });
      }
      break;
  }
}

// ── Boss阶段转换 ──
function _triggerPhaseTransition(newPhase) {
  _state.phase = 'phase_transition';
  _state.phaseTimer = 45;
  _state.screenShake = { x: 0, y: 0, intensity: 8, decay: 0.05 };
  
  // 阶段转换粒子爆发
  for (let i = 0; i < 25; i++) {
    _addParticle(_state.enemyAnim.x, _state.enemyAnim.y - 20, {
      color: '#ff0000',
      vx: (Math.random() - 0.5) * 6,
      vy: -Math.random() * 5,
      life: 30,
      size: 3 + Math.random() * 3,
      gravity: 0.08,
    });
  }
}

// ── 辅助函数 ──
function _addParticle(x, y, opts) {
  _state.particles.push({ x, y, ...opts });
}

function _addDamageNumber(text, x, y, color, isCrit) {
  _state.damageNumbers.push({
    text: String(text),
    x: x + (Math.random() - 0.5) * 30,
    y,
    color,
    isCrit,
    life: 40,
    maxLife: 40,
    alpha: 1,
  });
}

function _darken(color, amount) {
  // 简单变暗
  const r = parseInt(color.slice(1, 3), 16);
  const g = parseInt(color.slice(3, 5), 16);
  const b = parseInt(color.slice(5, 7), 16);
  const dr = Math.floor(r * (1 - amount));
  const dg = Math.floor(g * (1 - amount));
  const db = Math.floor(b * (1 - amount));
  return `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db.toString(16).padStart(2, '0')}`;
}

// ── 导出序列化（存档） ──
export function serializeBattleScene() {
  return { active: _active };
}

export function deserializeBattleScene(data) {
  // 战斗场景不需要恢复，重新进入会重新初始化
}
