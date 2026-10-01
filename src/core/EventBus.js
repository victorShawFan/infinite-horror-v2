// ═══════════════════════════════════════════════════════════════
// 全局事件总线 — 解耦各系统通信
// ═══════════════════════════════════════════════════════════════

class EventBus {
  constructor() {
    this._listeners = new Map();
    this._log = [];
  }

  on(event, callback, context = null) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, []);
    }
    this._listeners.get(event).push({ callback, context });
    return () => this.off(event, callback);
  }

  off(event, callback) {
    const list = this._listeners.get(event);
    if (!list) return;
    const idx = list.findIndex(l => l.callback === callback);
    if (idx >= 0) list.splice(idx, 1);
  }

  emit(event, data = {}) {
    this._log.push({ event, data, time: Date.now() });
    if (this._log.length > 500) this._log.shift();

    const list = this._listeners.get(event);
    if (!list) return;
    for (const { callback, context } of list) {
      try {
        callback.call(context, data);
      } catch (e) {
        console.error(`[EventBus] Error in handler for "${event}":`, e);
      }
    }
  }

  /** 获取最近的事件日志（调试用） */
  getLog(count = 50) {
    return this._log.slice(-count);
  }
}

export const eventBus = new EventBus();
