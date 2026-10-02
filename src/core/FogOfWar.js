// ═══════════════════════════════════════════════════════════════
// 战争迷雾系统 — 未探索区域不可见
// ═══════════════════════════════════════════════════════════════
//
// 视野范围：玩家周围3格完全可见
// 已探索区域：地形可见但实体不可见（暗色）
// 未探索区域：全黑
// ═══════════════════════════════════════════════════════════════

const VISION_RADIUS = 3;
const EXPLORED_ALPHA = 0.55; // 已探索但不在视野内的遮罩透明度

class FogOfWarState {
  constructor() {
    this._explored = {};   // { floorIndex: Set<"x,y"> }
    this._enabled = true;
  }

  /** 更新玩家位置 - 标记周围为已探索 */
  updateVision(floorIndex, px, py) {
    if (!this._explored[floorIndex]) {
      this._explored[floorIndex] = new Set();
    }
    const explored = this._explored[floorIndex];
    
    for (let dy = -VISION_RADIUS; dy <= VISION_RADIUS; dy++) {
      for (let dx = -VISION_RADIUS; dx <= VISION_RADIUS; dx++) {
        if (dx * dx + dy * dy <= VISION_RADIUS * VISION_RADIUS + 1) {
          explored.add(`${px + dx},${py + dy}`);
        }
      }
    }
  }

  /** 检查坐标是否在当前视野内 */
  isVisible(floorIndex, x, y, px, py) {
    if (!this._enabled) return true;
    const dx = x - px;
    const dy = y - py;
    return dx * dx + dy * dy <= VISION_RADIUS * VISION_RADIUS + 1;
  }

  /** 检查坐标是否已探索过 */
  isExplored(floorIndex, x, y) {
    if (!this._enabled) return true;
    return this._explored[floorIndex]?.has(`${x},${y}`) || false;
  }

  /** 获取迷雾状态: 'visible' | 'explored' | 'hidden' */
  getTileState(floorIndex, x, y, px, py) {
    if (!this._enabled) return 'visible';
    if (this.isVisible(floorIndex, x, y, px, py)) return 'visible';
    if (this.isExplored(floorIndex, x, y)) return 'explored';
    return 'hidden';
  }

  /** 切换迷雾开关 */
  toggle() {
    this._enabled = !this._enabled;
    return this._enabled;
  }

  get enabled() { return this._enabled; }

  /** 清除特定楼层 */
  clearFloor(floorIndex) {
    delete this._explored[floorIndex];
  }

  /** 序列化 */
  toJSON() {
    const result = {};
    for (const [k, v] of Object.entries(this._explored)) {
      result[k] = [...v];
    }
    return { explored: result, enabled: this._enabled };
  }

  /** 反序列化 */
  fromJSON(data) {
    this._explored = {};
    if (data?.explored) {
      for (const [k, v] of Object.entries(data.explored)) {
        this._explored[k] = new Set(v);
      }
    }
    if (typeof data?.enabled === 'boolean') {
      this._enabled = data.enabled;
    }
  }
}

export const fogOfWar = new FogOfWarState();
export { VISION_RADIUS, EXPLORED_ALPHA };
