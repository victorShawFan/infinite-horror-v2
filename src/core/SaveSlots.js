// ═══════════════════════════════════════════════════════════════
// 多存档系统 — 3个存档位 + 自动存档 + 存档预览
// ═══════════════════════════════════════════════════════════════

// ── 存档槽 ──
const MAX_SLOTS = 3;
const AUTO_SLOT = 'auto';
const SAVE_PREFIX = 'ih_save_';

// ── 获取存档列表 ──
export function getSaveSlots() {
  const slots = [];
  
  // 自动存档
  try {
    const autoData = localStorage.getItem(SAVE_PREFIX + AUTO_SLOT);
    if (autoData) {
      const parsed = JSON.parse(autoData);
      slots.push({
        id: AUTO_SLOT,
        name: '自动存档',
        icon: '🔄',
        data: parsed,
        preview: _extractPreview(parsed),
        timestamp: parsed._saveTime || 0,
      });
    }
  } catch {}
  
  // 手动存档
  for (let i = 1; i <= MAX_SLOTS; i++) {
    try {
      const data = localStorage.getItem(SAVE_PREFIX + i);
      if (data) {
        const parsed = JSON.parse(data);
        slots.push({
          id: String(i),
          name: `存档 ${i}`,
          icon: '💾',
          data: parsed,
          preview: _extractPreview(parsed),
          timestamp: parsed._saveTime || 0,
        });
      } else {
        slots.push({
          id: String(i),
          name: `存档 ${i}`,
          icon: '📁',
          data: null,
          preview: null,
          timestamp: 0,
        });
      }
    } catch {
      slots.push({ id: String(i), name: `存档 ${i}`, icon: '📁', data: null, preview: null, timestamp: 0 });
    }
  }
  
  return slots;
}

// ── 保存到槽位 ──
export function saveToSlot(slotId, gameState, additionalData = {}) {
  const saveData = {
    // 基础
    chapter: gameState.chapter || 1,
    nodeIndex: gameState.nodeIndex || 0,
    player: { ...gameState.player },
    stats: { ...gameState.stats },
    relationships: gameState.relationships || {},
    
    // 附加数据
    ...additionalData,
    
    // 元信息
    _saveTime: Date.now(),
    _version: '1.0',
    _slotId: slotId,
  };
  
  try {
    localStorage.setItem(SAVE_PREFIX + slotId, JSON.stringify(saveData));
    return { success: true, slot: slotId };
  } catch (e) {
    return { success: false, reason: '存储空间不足: ' + e.message };
  }
}

// ── 从槽位加载 ──
export function loadFromSlot(slotId) {
  try {
    const data = localStorage.getItem(SAVE_PREFIX + slotId);
    if (!data) return { success: false, reason: '空存档' };
    return { success: true, data: JSON.parse(data) };
  } catch (e) {
    return { success: false, reason: '存档损坏: ' + e.message };
  }
}

// ── 删除存档 ──
export function deleteSlot(slotId) {
  try {
    localStorage.removeItem(SAVE_PREFIX + slotId);
    return { success: true };
  } catch {
    return { success: false };
  }
}

// ── 自动存档 ──
export function autoSaveToSlot(gameState, additionalData) {
  return saveToSlot(AUTO_SLOT, gameState, additionalData);
}

// ── 提取预览信息 ──
function _extractPreview(data) {
  if (!data) return null;
  
  const p = data.player || {};
  const chapterNames = {
    1: '生化危机', 2: '异形', 3: '木乃伊归来', 4: '侏罗纪公园',
    5: '电锯惊魂', 6: '咒怨', 7: '指环王', 8: '星河战队',
    9: '死神来了', 10: '黑客帝国', 11: '迷雾', 12: '终焉',
  };
  
  return {
    chapter: data.chapter || 1,
    chapterName: chapterNames[data.chapter] || '第' + (data.chapter || 1) + '章',
    floor: data.nodeIndex || 0,
    level: p.level || 1,
    hp: p.hp || 0,
    maxHp: p.maxHp || 100,
    atk: p.atk || 0,
    def: p.def || 0,
    geneLock: p.geneLock || 0,
    playTime: data._playTime || 0,
    timestamp: data._saveTime || 0,
  };
}

// ── 渲染存档选择面板 ──
export function renderSaveLoadPanel(mode = 'save') {
  const slots = getSaveSlots();
  const isSave = mode === 'save';
  
  let html = `
    <div style="padding:16px;max-width:460px;margin:0 auto;">
      <h3 style="color:#ffcc44;text-align:center;font-size:16px;margin:0 0 16px;">
        ${isSave ? '💾 保存游戏' : '📂 读取存档'}
      </h3>
      <div style="display:flex;flex-direction:column;gap:8px;">
  `;
  
  for (const slot of slots) {
    const hasData = slot.data !== null;
    const p = slot.preview;
    
    html += `
      <div class="save-slot-btn" data-slot="${slot.id}" data-mode="${mode}"
        style="padding:12px;background:${hasData ? '#ffffff08' : '#ffffff04'};
        border:1px solid ${hasData ? '#ffffff22' : '#ffffff11'};border-radius:8px;
        cursor:pointer;transition:all 0.2s;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:18px;">${slot.icon}</span>
            <span style="color:#ddd;font-size:13px;font-weight:bold;">${slot.name}</span>
          </div>
          ${hasData ? `<span style="color:#666;font-size:9px;">${_formatTime(slot.timestamp)}</span>` : ''}
        </div>
        ${hasData && p ? `
          <div style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap;">
            <span style="padding:2px 6px;background:#ffcc4411;border-radius:3px;color:#ffcc44;font-size:10px;">
              Ch${p.chapter} ${p.chapterName}
            </span>
            <span style="padding:2px 6px;background:#44cc8811;border-radius:3px;color:#44cc88;font-size:10px;">
              Lv.${p.level}
            </span>
            <span style="padding:2px 6px;background:#ff444411;border-radius:3px;color:#ff8888;font-size:10px;">
              HP ${p.hp}/${p.maxHp}
            </span>
            <span style="padding:2px 6px;background:#4488ff11;border-radius:3px;color:#4488ff;font-size:10px;">
              ATK ${p.atk} DEF ${p.def}
            </span>
            ${p.geneLock > 0 ? `<span style="padding:2px 6px;background:#cc44cc11;border-radius:3px;color:#cc88ff;font-size:10px;">
              基因锁 ${p.geneLock}
            </span>` : ''}
          </div>
        ` : `
          <div style="color:#444;font-size:11px;margin-top:4px;font-style:italic;">
            ${isSave ? '空槽位 — 点击保存' : '无存档'}
          </div>
        `}
      </div>
    `;
  }
  
  html += `
      </div>
    </div>
    <style>
      .save-slot-btn:hover {
        border-color: #ffcc4444 !important;
        background: #ffffff0a !important;
      }
    </style>
  `;
  
  return html;
}

function _formatTime(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getMonth() + 1}/${d.getDate()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
