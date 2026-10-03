// ═══════════════════════════════════════════════════════════════
// 地图装饰系统 — 每章专属视觉元素 + 环境细节
// ═══════════════════════════════════════════════════════════════
//
// 在地砖和墙砖之上绘制章节特有的装饰元素：
// 血迹、裂缝、蛛网、苔藓、发光符文、科技面板等
// 让每章的视觉风格独特且沉浸
// ═══════════════════════════════════════════════════════════════

import { TILE_SIZE } from './constants.js';

// ── 章节装饰配置 ──
const CHAPTER_DECORATIONS = {
  1: { // 生化危机
    wallDecor: ['blood_splatter', 'crack', 'biohazard_sign', 'broken_pipe'],
    floorDecor: ['blood_pool', 'shell_casings', 'broken_glass', 'footprint'],
    wallColor: '#3a2828', floorAccent: '#442222',
    ambientObjects: ['flickering_light', 'dripping_pipe'],
  },
  2: { // 异形
    wallDecor: ['alien_resin', 'vent_grate', 'warning_stripe', 'claw_marks'],
    floorDecor: ['acid_stain', 'cable', 'puddle', 'grate'],
    wallColor: '#282838', floorAccent: '#1a2233',
    ambientObjects: ['sparking_wire', 'steam_vent'],
  },
  3: { // 木乃伊
    wallDecor: ['hieroglyph', 'scarab', 'torch_sconce', 'sand_pile'],
    floorDecor: ['sand_drift', 'pottery_shard', 'gold_dust', 'bone'],
    wallColor: '#3a3020', floorAccent: '#332a18',
    ambientObjects: ['torch_flicker', 'dust_mote'],
  },
  4: { // 侏罗纪
    wallDecor: ['vine', 'fern', 'moss', 'claw_mark_large'],
    floorDecor: ['leaf', 'puddle_green', 'root', 'egg_fragment'],
    wallColor: '#223322', floorAccent: '#1a2a1a',
    ambientObjects: ['firefly', 'falling_leaf'],
  },
  5: { // 电锯惊魂
    wallDecor: ['gear', 'chain', 'blood_writing', 'rusty_pipe'],
    floorDecor: ['blood_trail', 'glass_shard', 'wire', 'gear_piece'],
    wallColor: '#2a2222', floorAccent: '#331818',
    ambientObjects: ['sparking_trap', 'drip_red'],
  },
  6: { // 咒怨
    wallDecor: ['hair_strand', 'hand_print', 'crack_dark', 'kanji'],
    floorDecor: ['water_stain', 'hair_pile', 'shadow_mark', 'ofuda'],
    wallColor: '#1a1a2a', floorAccent: '#0a0a1a',
    ambientObjects: ['cold_breath', 'flicker_dark'],
  },
  7: { // 指环王
    wallDecor: ['elvish_carving', 'moss_thick', 'root_growth', 'rune_stone'],
    floorDecor: ['fallen_leaf', 'acorn', 'grass_tuft', 'pebble'],
    wallColor: '#2a3020', floorAccent: '#1a2818',
    ambientObjects: ['firefly_gold', 'floating_seed'],
  },
  8: { // 星际
    wallDecor: ['tech_panel', 'vent_port', 'warning_light', 'conduit'],
    floorDecor: ['wire_bundle', 'bolt', 'chip', 'energy_line'],
    wallColor: '#1a2030', floorAccent: '#0a1828',
    ambientObjects: ['hologram_flicker', 'energy_pulse'],
  },
  9: { // 死神来了
    wallDecor: ['crack_ominous', 'peeling_paint', 'photo', 'clock'],
    floorDecor: ['newspaper', 'coin', 'cigarette', 'stain'],
    wallColor: '#2a2428', floorAccent: '#221a22',
    ambientObjects: ['shadow_shift', 'wind_gust'],
  },
  10: { // 黑客帝国
    wallDecor: ['code_rain', 'glitch_patch', 'circuit', 'matrix_symbol'],
    floorDecor: ['data_stream', 'pixel_fragment', 'energy_dot', 'code_line'],
    wallColor: '#0a1a0a', floorAccent: '#001a00',
    ambientObjects: ['code_particle', 'glitch_flash'],
  },
  11: { // 迷雾
    wallDecor: ['fog_tendril', 'scratch', 'damp_stain', 'web'],
    floorDecor: ['puddle_grey', 'ash', 'feather', 'mist_pool'],
    wallColor: '#1a1a1a', floorAccent: '#222222',
    ambientObjects: ['fog_drift', 'shadow_move'],
  },
  12: { // 最终
    wallDecor: ['void_crack', 'energy_rune', 'mirror_shard', 'time_fracture'],
    floorDecor: ['crystal_shard', 'void_puddle', 'star_fragment', 'dimensional_tear'],
    wallColor: '#1a0a1a', floorAccent: '#0a001a',
    ambientObjects: ['void_particle', 'reality_flicker'],
  },
};

// ── 伪随机种子（确保同一地图同一位置装饰一致） ──
function _hash(x, y, seed) {
  let h = seed;
  h = ((h << 5) - h + x) | 0;
  h = ((h << 5) - h + y) | 0;
  h = ((h << 5) - h + (x * y)) | 0;
  return (h >>> 0) / 4294967296;
}

// ── 绘制墙壁装饰 ──
export function drawWallDecoration(ctx, x, y, chapter, seed) {
  const config = CHAPTER_DECORATIONS[chapter] || CHAPTER_DECORATIONS[1];
  const rnd = _hash(x, y, seed || chapter * 31);
  
  // 30% 的墙砖有装饰
  if (rnd > 0.3) return;
  
  const decorType = config.wallDecor[Math.floor(rnd * 100) % config.wallDecor.length];
  const px = x * TILE_SIZE;
  const py = y * TILE_SIZE;
  
  ctx.save();
  ctx.globalAlpha = 0.3 + rnd * 0.3;
  
  switch (decorType) {
    case 'blood_splatter':
      ctx.fillStyle = '#661111';
      for (let i = 0; i < 3; i++) {
        const bx = px + 4 + _hash(x, y, i + 100) * (TILE_SIZE - 8);
        const by = py + 4 + _hash(x, y, i + 200) * (TILE_SIZE - 8);
        ctx.beginPath();
        ctx.arc(bx, by, 1 + _hash(x, y, i + 300) * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    case 'crack':
      ctx.strokeStyle = '#111111';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(px + TILE_SIZE * 0.3, py + TILE_SIZE * 0.2);
      ctx.lineTo(px + TILE_SIZE * 0.5, py + TILE_SIZE * 0.5);
      ctx.lineTo(px + TILE_SIZE * 0.7, py + TILE_SIZE * 0.8);
      ctx.stroke();
      break;
    case 'hieroglyph':
      ctx.fillStyle = '#886644';
      ctx.font = `${TILE_SIZE * 0.3}px serif`;
      const glyphs = ['𓀀', '𓁹', '𓃭', '𓆣', '𓇳', '☥', '𓊝'];
      ctx.fillText(glyphs[Math.floor(rnd * 70) % glyphs.length], px + 4, py + TILE_SIZE * 0.6);
      break;
    case 'alien_resin':
      ctx.fillStyle = '#334422';
      ctx.beginPath();
      ctx.ellipse(px + TILE_SIZE / 2, py + TILE_SIZE * 0.7, TILE_SIZE * 0.3, TILE_SIZE * 0.15, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'code_rain':
      ctx.fillStyle = '#00ff00';
      ctx.font = '8px monospace';
      ctx.globalAlpha = 0.15;
      for (let i = 0; i < 4; i++) {
        const cx = px + 2 + i * (TILE_SIZE / 4);
        for (let j = 0; j < 3; j++) {
          const ch = String.fromCharCode(0x30A0 + _hash(x + i, y + j, 50) * 96);
          ctx.fillText(ch, cx, py + 6 + j * 8);
        }
      }
      break;
    case 'vine':
    case 'moss':
      ctx.fillStyle = '#336633';
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const lx = px + _hash(x, y, i * 7) * TILE_SIZE;
        const ly = py + _hash(x, y, i * 11) * TILE_SIZE;
        ctx.rect(lx, ly, 2, 3);
      }
      ctx.fill();
      break;
    case 'tech_panel':
      ctx.strokeStyle = '#334466';
      ctx.lineWidth = 1;
      ctx.strokeRect(px + 4, py + 4, TILE_SIZE - 8, TILE_SIZE - 8);
      ctx.fillStyle = '#224466';
      ctx.fillRect(px + 6, py + 6, 3, 3);
      ctx.fillStyle = '#44aaff';
      ctx.globalAlpha = 0.3 + Math.sin(Date.now() * 0.003 + x * 7) * 0.2;
      ctx.fillRect(px + 12, py + 6, 3, 3);
      break;
    case 'void_crack':
      ctx.strokeStyle = '#8844cc';
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.moveTo(px + TILE_SIZE * 0.2, py + TILE_SIZE * 0.1);
      ctx.quadraticCurveTo(px + TILE_SIZE * 0.5, py + TILE_SIZE * 0.5, px + TILE_SIZE * 0.8, py + TILE_SIZE * 0.9);
      ctx.stroke();
      // 虚空发光
      ctx.fillStyle = '#cc88ff';
      ctx.globalAlpha = 0.2 + Math.sin(Date.now() * 0.005 + x) * 0.1;
      ctx.beginPath();
      ctx.arc(px + TILE_SIZE * 0.5, py + TILE_SIZE * 0.5, 3, 0, Math.PI * 2);
      ctx.fill();
      break;
    default:
      // 通用装饰：小污渍
      ctx.fillStyle = config.wallColor;
      ctx.beginPath();
      ctx.arc(px + TILE_SIZE * 0.5, py + TILE_SIZE * 0.5, 2, 0, Math.PI * 2);
      ctx.fill();
  }
  
  ctx.restore();
}

// ── 绘制地板装饰 ──
export function drawFloorDecoration(ctx, x, y, chapter, seed) {
  const config = CHAPTER_DECORATIONS[chapter] || CHAPTER_DECORATIONS[1];
  const rnd = _hash(x, y, (seed || chapter * 17) + 999);
  
  // 20% 的地砖有装饰
  if (rnd > 0.2) return;
  
  const decorType = config.floorDecor[Math.floor(rnd * 100) % config.floorDecor.length];
  const px = x * TILE_SIZE;
  const py = y * TILE_SIZE;
  
  ctx.save();
  ctx.globalAlpha = 0.2 + rnd * 0.2;
  
  switch (decorType) {
    case 'blood_pool':
      ctx.fillStyle = '#551111';
      ctx.beginPath();
      ctx.ellipse(px + TILE_SIZE / 2, py + TILE_SIZE / 2, TILE_SIZE * 0.25, TILE_SIZE * 0.15, rnd * Math.PI, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'shell_casings':
      ctx.fillStyle = '#998844';
      for (let i = 0; i < 3; i++) {
        const sx = px + 4 + _hash(x, y, i + 400) * (TILE_SIZE - 8);
        const sy = py + 4 + _hash(x, y, i + 500) * (TILE_SIZE - 8);
        ctx.fillRect(sx, sy, 2, 1);
      }
      break;
    case 'sand_drift':
      ctx.fillStyle = '#887755';
      ctx.beginPath();
      ctx.moveTo(px, py + TILE_SIZE * 0.8);
      ctx.quadraticCurveTo(px + TILE_SIZE * 0.5, py + TILE_SIZE * 0.6, px + TILE_SIZE, py + TILE_SIZE * 0.85);
      ctx.lineTo(px + TILE_SIZE, py + TILE_SIZE);
      ctx.lineTo(px, py + TILE_SIZE);
      ctx.fill();
      break;
    case 'data_stream':
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 0.5;
      ctx.globalAlpha = 0.1;
      ctx.beginPath();
      ctx.moveTo(px + rnd * TILE_SIZE, py);
      ctx.lineTo(px + rnd * TILE_SIZE, py + TILE_SIZE);
      ctx.stroke();
      break;
    case 'crystal_shard':
      ctx.fillStyle = '#cc88ff';
      ctx.globalAlpha = 0.3 + Math.sin(Date.now() * 0.004 + x * 3 + y * 5) * 0.15;
      const cx = px + TILE_SIZE * 0.3 + rnd * TILE_SIZE * 0.4;
      const cy = py + TILE_SIZE * 0.3 + rnd * TILE_SIZE * 0.4;
      ctx.beginPath();
      ctx.moveTo(cx, cy - 4);
      ctx.lineTo(cx + 3, cy);
      ctx.lineTo(cx, cy + 4);
      ctx.lineTo(cx - 3, cy);
      ctx.closePath();
      ctx.fill();
      break;
    default:
      // 通用地面细节
      ctx.fillStyle = config.floorAccent;
      ctx.globalAlpha = 0.15;
      ctx.fillRect(px + 4 + rnd * 8, py + 4 + rnd * 8, 3, 3);
  }
  
  ctx.restore();
}

// ── 获取章节装饰配置 ──
export function getChapterDecorations(chapter) {
  return CHAPTER_DECORATIONS[chapter] || CHAPTER_DECORATIONS[1];
}
