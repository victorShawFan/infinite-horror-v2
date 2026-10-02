// =================================================================
// 状态效果追踪器 — 持续性增益/减益管理 + HUD显示
// =================================================================
// 管理战斗外的持续效果(诅咒/增益药水/精英debuff等)
// 提供HUD条显示当前活跃效果

import { eventBus } from './EventBus.js';

const _activeEffects = [];
let _combatCount = 0; // 战斗计数器(用于按场次消退的效果)

export const EFFECT_TYPES = {
  // 增益
  atk_boost:    { name: 'ATK增强', icon: '\u2694', color: '#ff6644', stat: 'atk', positive: true },
  def_boost:    { name: 'DEF增强', icon: '\U0001f6e1', color: '#4488ff', stat: 'def', positive: true },
  crt_boost:    { name: '暴击增强', icon: '\U0001f3af', color: '#ffcc44', stat: 'crt', positive: true },
  regen:        { name: '持续回复', icon: '\U0001f49a', color: '#44ff88', stat: 'regen', positive: true },
  exp_boost:    { name: '经验加成', icon: '\u2728', color: '#aa88ff', stat: 'exp', positive: true },
  gold_boost:   { name: '金币加成', icon: '\U0001f4b0', color: '#ffcc44', stat: 'gold', positive: true },
  // 减益
  atk_debuff:   { name: 'ATK削弱', icon: '\u2694', color: '#884444', stat: 'atk', positive: false },
  def_debuff:   { name: 'DEF削弱', icon: '\U0001f6e1', color: '#444488', stat: 'def', positive: false },
  curse:        { name: '诅咒', icon: '\U0001f441', color: '#aa44cc', stat: 'mixed', positive: false },
  poison_linger:{ name: '残留毒素', icon: '\u2620', color: '#88ff44', stat: 'poison', positive: false },
};

export function addEffect(typeId, value, durationBattles, source = '') {
  const type = EFFECT_TYPES[typeId];
  if (!type) return false;
  
  // 同类型效果不叠加,取较强的
  const existing = _activeEffects.find(e => e.typeId === typeId);
  if (existing) {
    if (Math.abs(value) > Math.abs(existing.value)) {
      existing.value = value;
      existing.remaining = durationBattles;
      existing.source = source;
    } else if (durationBattles > existing.remaining) {
      existing.remaining = durationBattles;
    }
    return true;
  }
  
  _activeEffects.push({
    typeId,
    type,
    value,
    remaining: durationBattles, // 剩余战斗场次
    source,
    addedAt: _combatCount,
  });
  
  eventBus.emit('effect:added', { typeId, value, duration: durationBattles });
  return true;
}

export function removeEffect(typeId) {
  const idx = _activeEffects.findIndex(e => e.typeId === typeId);
  if (idx >= 0) {
    const removed = _activeEffects.splice(idx, 1)[0];
    eventBus.emit('effect:removed', { typeId: removed.typeId });
    return true;
  }
  return false;
}

// 每场战斗后调用，递减持续效果
export function tickEffects() {
  _combatCount++;
  const expired = [];
  for (let i = _activeEffects.length - 1; i >= 0; i--) {
    _activeEffects[i].remaining--;
    if (_activeEffects[i].remaining <= 0) {
      expired.push(_activeEffects.splice(i, 1)[0]);
    }
  }
  for (const e of expired) {
    eventBus.emit('effect:expired', { typeId: e.typeId, name: e.type.name });
  }
  return expired;
}

export function getActiveEffects() {
  return [..._activeEffects];
}

// 获取所有活跃效果对属性的总修正
export function getEffectModifiers() {
  const mods = { atk: 0, def: 0, crt: 0, spd: 0, expPct: 0, goldPct: 0, regenPerFloor: 0 };
  for (const e of _activeEffects) {
    if (e.typeId === 'atk_boost' || e.typeId === 'atk_debuff') mods.atk += e.value;
    if (e.typeId === 'def_boost' || e.typeId === 'def_debuff') mods.def += e.value;
    if (e.typeId === 'crt_boost') mods.crt += e.value;
    if (e.typeId === 'exp_boost') mods.expPct += e.value;
    if (e.typeId === 'gold_boost') mods.goldPct += e.value;
    if (e.typeId === 'regen') mods.regenPerFloor += e.value;
    if (e.typeId === 'curse') { mods.atk += e.value; mods.def += e.value; }
  }
  return mods;
}

// 生成HUD显示条HTML(叠加在游戏画面上方)
export function renderEffectHUD() {
  if (_activeEffects.length === 0) return '';
  
  let html = '<div style="display:flex;gap:4px;flex-wrap:wrap;max-width:300px;">';
  for (const e of _activeEffects) {
    const bgColor = e.type.positive ? 'rgba(68,255,136,0.1)' : 'rgba(255,68,68,0.1)';
    const borderColor = e.type.color + '40';
    html += '<div style="background:' + bgColor + ';border:1px solid ' + borderColor + ';border-radius:4px;padding:2px 6px;font-size:10px;white-space:nowrap;">';
    html += '<span style="color:' + e.type.color + ';">' + e.type.icon + '</span> ';
    html += '<span style="color:' + (e.type.positive ? '#aaffaa' : '#ffaaaa') + ';">';
    html += (e.value > 0 ? '+' : '') + e.value + '</span>';
    html += '<span style="color:#666;"> ' + e.remaining + '\u573a</span>';
    html += '</div>';
  }
  html += '</div>';
  return html;
}

export function clearAllEffects() {
  _activeEffects.length = 0;
}

export function serializeEffects() {
  return _activeEffects.map(e => ({
    typeId: e.typeId,
    value: e.value,
    remaining: e.remaining,
    source: e.source,
  }));
}

export function deserializeEffects(data) {
  _activeEffects.length = 0;
  if (!Array.isArray(data)) return;
  for (const d of data) {
    const type = EFFECT_TYPES[d.typeId];
    if (type) {
      _activeEffects.push({
        typeId: d.typeId,
        type,
        value: d.value,
        remaining: d.remaining,
        source: d.source || '',
        addedAt: _combatCount,
      });
    }
  }
}
