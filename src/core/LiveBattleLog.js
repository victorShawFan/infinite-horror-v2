// ═══════════════════════════════════════════════════════════════
// 实时战斗日志 — 战斗过程中显示滚动战报
// ═══════════════════════════════════════════════════════════════
//
// 在 async executeBattle 过程中，每次 await（行动菜单暂停）前后
// 以及战斗结束后，将 log 条目实时渲染到屏幕左侧。
// ═══════════════════════════════════════════════════════════════

const TYPE_COLORS = {
  attack: '#ff8866',
  critical: '#ff4488',
  spell: '#aa88ff',
  enemy_attack: '#4488ff',
  boss_special: '#ff2222',
  boss_dialogue: '#ffcc44',
  boss_phase: '#ff6600',
  heal: '#44ff88',
  buff: '#88ccff',
  defend: '#4488ff',
  dodge: '#88ffcc',
  block: '#6688aa',
  reflect: '#cc88ff',
  victory: '#44ff88',
  defeat: '#ff4444',
  reward: '#ffcc44',
  info: '#888888',
  separator: '#333333',
  flee: '#ffaa44',
  danger: '#ff4444',
  affix_warning: '#ff8800',
  affix_damage: '#ff6644',
  environment_debuff: '#8888ff',
  elemental_advantage: '#44ffaa',
  elemental_resonance: '#aa44ff',
  karma_effect: '#cc88ff',
  enemy_heal: '#22aa44',
  enemy_enrage: '#ff4400',
  burn: '#ff6600',
  control: '#88ddff',
};

let _panel = null;
let _logContainer = null;
let _lastLogIndex = 0;

/**
 * 创建/显示实时战报面板
 */
export function showLiveBattleLog() {
  if (typeof document === 'undefined') return;
  hideLiveBattleLog();
  
  _panel = document.createElement('div');
  _panel.id = 'live-battle-log';
  _panel.style.cssText = `
    position: fixed; left: 8px; top: 60px; bottom: 60px; width: 280px;
    z-index: 190; pointer-events: none;
    display: flex; flex-direction: column;
    background: linear-gradient(90deg, rgba(5,5,15,0.85) 0%, rgba(5,5,15,0.4) 85%, transparent 100%);
    border-radius: 0 12px 12px 0;
    padding: 12px 16px 12px 12px;
    overflow: hidden;
    animation: lbl-slideIn 0.3s ease-out;
  `;
  
  const style = document.createElement('style');
  style.textContent = `
    @keyframes lbl-slideIn { from { transform: translateX(-100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
    @keyframes lbl-fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    .lbl-entry { animation: lbl-fadeIn 0.25s ease-out; padding: 2px 0; font-size: 11px; line-height: 1.5; letter-spacing: 0.3px; }
  `;
  _panel.appendChild(style);
  
  // 标题
  const title = document.createElement('div');
  title.style.cssText = 'color:#666;font-size:9px;letter-spacing:3px;margin-bottom:6px;text-align:center;';
  title.textContent = '— 战 报 —';
  _panel.appendChild(title);
  
  _logContainer = document.createElement('div');
  _logContainer.style.cssText = 'flex:1;overflow-y:auto;overflow-x:hidden;scrollbar-width:none;';
  _logContainer.style.setProperty('-webkit-overflow-scrolling', 'touch');
  _panel.appendChild(_logContainer);
  
  document.body.appendChild(_panel);
  _lastLogIndex = 0;
}

/**
 * 追加新的战报条目
 * @param {Array} logEntries - executeBattle 返回的 log 数组
 */
export function updateLiveBattleLog(logEntries) {
  if (!_logContainer || !logEntries) return;
  
  // 只渲染新条目
  const newEntries = logEntries.slice(_lastLogIndex);
  _lastLogIndex = logEntries.length;
  
  for (const entry of newEntries) {
    if (!entry.text) continue;
    if (entry.type === 'separator') {
      const hr = document.createElement('div');
      hr.style.cssText = 'border-top:1px solid #222;margin:4px 0;';
      _logContainer.appendChild(hr);
      continue;
    }
    
    const div = document.createElement('div');
    div.className = 'lbl-entry';
    div.style.color = TYPE_COLORS[entry.type] || '#888';
    div.textContent = entry.text;
    _logContainer.appendChild(div);
  }
  
  // 自动滚到底部
  _logContainer.scrollTop = _logContainer.scrollHeight;
}

/**
 * 隐藏并清理面板
 */
export function hideLiveBattleLog() {
  if (_panel) {
    _panel.style.transition = 'opacity 0.3s, transform 0.3s';
    _panel.style.opacity = '0';
    _panel.style.transform = 'translateX(-100%)';
    setTimeout(() => { _panel?.remove(); _panel = null; }, 300);
  }
  _logContainer = null;
  _lastLogIndex = 0;
}
