// ═══════════════════════════════════════════════════════════════
// 新手引导系统 — 第一次游戏时的渐进式教程
// ═══════════════════════════════════════════════════════════════

import { eventBus } from './EventBus.js';

const TUTORIAL_STEPS = [
  {
    id: 'move',
    trigger: 'game_start',
    text: '使用 WASD 或方向键移动郑吒。',
    highlight: '控制',
    delay: 2000,
  },
  {
    id: 'look_enemy',
    trigger: 'first_move',
    text: '红色光环的是敌人。颜色越深越危险。走向敌人可以发起战斗。',
    highlight: '敌人',
    delay: 0,
  },
  {
    id: 'combat_preview',
    trigger: 'first_combat_confirm',
    text: '战斗前会显示双方属性对比和预测结果。确认可以获胜再开打！',
    highlight: '战斗',
    delay: 0,
  },
  {
    id: 'item_pickup',
    trigger: 'first_item',
    text: '黄色光点是道具。走过去自动拾取。药水恢复HP，宝石永久提升属性。',
    highlight: '道具',
    delay: 0,
  },
  {
    id: 'key_door',
    trigger: 'first_key',
    text: '钥匙可以打开对应颜色的门。合理规划钥匙使用路线！',
    highlight: '钥匙',
    delay: 0,
  },
  {
    id: 'status_panel',
    trigger: 'first_level_up',
    text: '按 I 查看状态和装备，按 B 查看怪物图鉴，按 S 查看统计。',
    highlight: '面板',
    delay: 500,
  },
  {
    id: "stat_alloc",
    trigger: "first_level_up",
    text: "升级获得3属性点！按 U 打开属性分配面板，选择你的成长方向。",
    highlight: "属性分配",
    delay: 3000,
  },
  {
    id: 'stairs',
    trigger: 'first_stairs',
    text: '绿色格子是楼梯。走上去进入下一层。记住先清理本层的资源！',
    highlight: '楼梯',
    delay: 0,
  },
  {
    id: 'companion',
    trigger: 'first_companion',
    text: '蓝色光点是队友。靠近可以对话。按 R 查看同伴关系面板。',
    highlight: '同伴',
    delay: 0,
  },
];

class TutorialManager {
  constructor() {
    this.completed = new Set();
    this.currentStep = null;
    this.active = true;  // 首次游戏开启
    this._popupEl = null;
    this._hideTimer = null;
  }

  /** 检查是否已完成所有引导 */
  isComplete() {
    return this.completed.size >= TUTORIAL_STEPS.length;
  }

  /** 禁用引导(老玩家跳过) */
  disable() {
    this.active = false;
  }

  /** 触发教程步骤 */
  trigger(triggerId) {
    if (!this.active || this.isComplete()) return;
    
    const step = TUTORIAL_STEPS.find(s => s.trigger === triggerId && !this.completed.has(s.id));
    if (!step) return;

    this.completed.add(step.id);
    this.currentStep = step;

    const delay = step.delay || 0;
    setTimeout(() => this._showTip(step), delay);
  }

  _showTip(step) {
    // 创建浮动提示
    this._hideTip();

    const overlay = document.getElementById('ui-overlay');
    if (!overlay) return;

    const tip = document.createElement('div');
    tip.id = 'tutorial-tip';
    tip.style.cssText = `
      position: absolute; bottom: 160px; left: 50%; transform: translateX(-50%);
      background: rgba(10,10,30,0.95); border: 1px solid rgba(68,170,255,0.4);
      border-radius: 10px; padding: 12px 20px; max-width: 400px;
      pointer-events: none; z-index: 100;
      animation: tutorialFadeIn 0.5s ease;
      box-shadow: 0 0 20px rgba(68,170,255,0.15);
    `;
    tip.innerHTML = `
      <style>
        @keyframes tutorialFadeIn { from { opacity: 0; transform: translateX(-50%) translateY(10px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
        @keyframes tutorialFadeOut { from { opacity: 1; } to { opacity: 0; } }
      </style>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
        <span style="color:#44aaff;font-size:12px;font-weight:bold;">💡 ${step.highlight}</span>
      </div>
      <p style="color:#ccc;font-size:13px;line-height:1.6;">${step.text}</p>
    `;
    overlay.appendChild(tip);
    this._popupEl = tip;

    // 5秒后自动消失
    this._hideTimer = setTimeout(() => this._hideTip(), 5000);
  }

  _hideTip() {
    if (this._hideTimer) clearTimeout(this._hideTimer);
    if (this._popupEl) {
      this._popupEl.style.animation = 'tutorialFadeOut 0.3s ease forwards';
      const el = this._popupEl;
      setTimeout(() => el.remove(), 300);
      this._popupEl = null;
    }
  }

  toJSON() {
    return { completed: [...this.completed], active: this.active };
  }

  fromJSON(data) {
    this.completed = new Set(data?.completed || []);
    this.active = data?.active ?? true;
    // 如果已经完成过一轮，默认关闭
    if (this.completed.size >= 3) this.active = false;
  }
}

export const tutorialManager = new TutorialManager();
