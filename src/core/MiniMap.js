// ═══════════════════════════════════════════════════════════════
// 迷你地图 — 角落实时小地图 + 迷雾系统
// ═══════════════════════════════════════════════════════════════
//
// 右上角半透明小地图:
// - 2px/格 超紧凑
// - 已探索区域正常显示，未探索为迷雾
// - 玩家白色闪烁点、敌人红点、物品黄点、楼梯绿点
// - Tab键切换显示/隐藏

const MINI_CELL = 2;       // 每格像素
const MINI_PADDING = 8;    // 内边距
const MINI_MARGIN = 12;    // 距屏幕边距
const FOG_RADIUS = 4;      // 玩家视野半径(格)

export class MiniMap {
  constructor() {
    this.visible = true;
    this.explored = new Set(); // "x,y" strings
    this.canvas = null;
    this.ctx = null;
    this.opacity = 0.7;
    this._blink = 0;
  }

  /** 创建小地图canvas并挂载 */
  init(parentElement) {
    if (this.canvas) this.canvas.remove();
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = `
      position: absolute; top: ${MINI_MARGIN}px; right: ${MINI_MARGIN}px;
      pointer-events: none; z-index: 50;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 4px;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(2px);
      transition: opacity 0.3s;
    `;
    parentElement.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
  }

  /** 清除已探索区域 */
  reset() {
    this.explored.clear();
  }

  /** 切换显示 */
  toggle() {
    this.visible = !this.visible;
    if (this.canvas) {
      this.canvas.style.opacity = this.visible ? String(this.opacity) : '0';
    }
  }

  /** 更新玩家位置 — 扩展已探索区域 */
  updateExplored(px, py) {
    for (let dy = -FOG_RADIUS; dy <= FOG_RADIUS; dy++) {
      for (let dx = -FOG_RADIUS; dx <= FOG_RADIUS; dx++) {
        if (dx * dx + dy * dy <= FOG_RADIUS * FOG_RADIUS) {
          this.explored.add(`${px + dx},${py + dy}`);
        }
      }
    }
  }

  /**
   * 绘制小地图
   * @param {Object} floor - { tiles, width, height }
   * @param {Object} player - { x, y }
   * @param {Array} entities - [{ x, y, type, ... }]
   */
  draw(floor, player, entities) {
    if (!this.canvas || !this.ctx || !floor) return;
    this._blink = (this._blink + 1) % 60;

    const w = floor.width || floor.tiles[0]?.length || 20;
    const h = floor.height || floor.tiles.length || 18;
    const cw = w * MINI_CELL + MINI_PADDING * 2;
    const ch = h * MINI_CELL + MINI_PADDING * 2;

    if (this.canvas.width !== cw || this.canvas.height !== ch) {
      this.canvas.width = cw;
      this.canvas.height = ch;
    }

    const ctx = this.ctx;
    ctx.clearRect(0, 0, cw, ch);

    // 更新探索
    this.updateExplored(player.x, player.y);

    // 绘制地图格
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const isExplored = this.explored.has(`${x},${y}`);
        const tile = floor.tiles[y]?.[x];
        const px = MINI_PADDING + x * MINI_CELL;
        const py = MINI_PADDING + y * MINI_CELL;

        if (!isExplored) {
          // 迷雾 — 深色
          ctx.fillStyle = 'rgba(20,20,30,0.9)';
          ctx.fillRect(px, py, MINI_CELL, MINI_CELL);
          continue;
        }

        if (tile === 0 || tile === 2) {
          // 墙壁/虚空
          ctx.fillStyle = '#1a1a2a';
        } else if (tile === 1) {
          // 地板
          ctx.fillStyle = '#2a2a3a';
        } else if (tile === 3) {
          // 楼梯
          ctx.fillStyle = '#226622';
        } else {
          ctx.fillStyle = '#2a2a3a';
        }
        ctx.fillRect(px, py, MINI_CELL, MINI_CELL);
      }
    }

    // 绘制实体(仅已探索区域)
    for (const ent of entities) {
      if (!this.explored.has(`${ent.x},${ent.y}`)) continue;
      const px = MINI_PADDING + ent.x * MINI_CELL;
      const py = MINI_PADDING + ent.y * MINI_CELL;

      if (ent.type === 'enemy' || ent.type === 'boss') {
        ctx.fillStyle = ent.bossId ? '#ff2222' : '#cc4444';
      } else if (ent.type === 'item') {
        ctx.fillStyle = '#ccaa44';
      } else if (ent.type === 'event') {
        ctx.fillStyle = '#4488cc';
      } else if (ent.type === 'npc') {
        ctx.fillStyle = '#44cc88';
      } else {
        ctx.fillStyle = '#666666';
      }
      ctx.fillRect(px, py, MINI_CELL, MINI_CELL);
    }

    // 绘制玩家(白色闪烁)
    const playerAlpha = this._blink < 30 ? 1.0 : 0.5;
    ctx.fillStyle = `rgba(255,255,255,${playerAlpha})`;
    const ppx = MINI_PADDING + player.x * MINI_CELL;
    const ppy = MINI_PADDING + player.y * MINI_CELL;
    ctx.fillRect(ppx - 1, ppy - 1, MINI_CELL + 2, MINI_CELL + 2);
  }

  /** 序列化已探索数据 */
  toJSON() {
    return { explored: [...this.explored] };
  }

  fromJSON(data) {
    this.explored.clear();
    if (data?.explored) {
      for (const k of data.explored) this.explored.add(k);
    }
  }

  destroy() {
    if (this.canvas) {
      this.canvas.remove();
      this.canvas = null;
      this.ctx = null;
    }
  }
}
