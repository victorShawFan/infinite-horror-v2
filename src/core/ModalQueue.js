// ═══════════════════════════════════════════════════════════════
// 统一 UI 弹窗队列 — 按优先级顺序逐个展示，防止弹窗互相覆盖
// ═══════════════════════════════════════════════════════════════
//
// 使用方法:
//   import { modalQueue } from './ModalQueue.js';
//   modalQueue.enqueue({ id: 'post-combat', priority: 10, show: (done) => { ... done(); } });
//   modalQueue.enqueue({ id: 'loot-drop', priority: 5, show: (done) => { ... done(); } });
//   modalQueue.enqueue({ id: 'level-up', priority: 8, show: (done) => { ... done(); } });
//
// show(done) — 展示弹窗，用户关闭时调用 done() 推进队列
// priority 越大越先展示
// 队列清空后 emit 'modalQueue:empty'
// ═══════════════════════════════════════════════════════════════

import { eventBus } from './EventBus.js';

class ModalQueue {
  constructor() {
    this._queue = [];
    this._processing = false;
    this._scheduled = false;
  }

  // ── 公开 API ──────────────────────────────────────────────

  /** 入队一个弹窗项 { id, priority, show(done) } */
  enqueue(item) {
    this._queue.push(item);
    this._scheduleProcess();
  }

  /** 入队并返回 Promise，在该弹窗 done() 时 resolve */
  enqueuePromise(item) {
    return new Promise((resolve) => {
      const origShow = item.show;
      this.enqueue({
        ...item,
        show(done) {
          origShow(() => {
            done();
            resolve();
          });
        },
      });
    });
  }

  /** 清空待处理队列（不影响正在展示的弹窗） */
  clear() {
    this._queue.length = 0;
  }

  /** 队列是否为空 */
  isEmpty() {
    return this._queue.length === 0;
  }

  /** 当前排队中的弹窗数量 */
  get size() {
    return this._queue.length;
  }

  // ── 内部调度 ──────────────────────────────────────────────

  /**
   * 防抖：同一帧内多次 enqueue 只触发一次处理，
   * 确保所有同帧入队项按优先级统一排序后再开始展示。
   */
  _scheduleProcess() {
    if (this._scheduled || this._processing) return;
    this._scheduled = true;
    requestAnimationFrame(() => {
      this._scheduled = false;
      this._processNext();
    });
  }

  /** 取出最高优先级项并展示，done() 后递归处理剩余 */
  _processNext() {
    if (this._processing || this._queue.length === 0) return;

    this._queue.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));
    const item = this._queue.shift();

    this._processing = true;
    item.show(() => {
      this._processing = false;
      if (this._queue.length === 0) {
        eventBus.emit('modalQueue:empty');
      } else {
        this._processNext();
      }
    });
  }
}

export const modalQueue = new ModalQueue();
