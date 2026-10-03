// ═══════════════════════════════════════════════════════════════
// 战斗策略层 — 战术深度 + 位置系统 + 弱点利用
// ═══════════════════════════════════════════════════════════════
//
// 新增战斗维度：
// 1. 战术位置：前排/后排，影响攻防比例
// 2. 弱点系统：发现并利用敌人弱点获得额外伤害
// 3. 蓄力系统：积蓄力量释放强力一击
// 4. 反击时机：观察敌人意图选择最优应对
// 5. 战术连携：多回合策略组合触发特殊效果
// ═══════════════════════════════════════════════════════════════

import { eventBus } from './EventBus.js';

// ── 战术位置 ──
export const POSITION = {
  FRONT: 'front',
  BACK: 'back',
};

const POSITION_MODIFIERS = {
  front: { atkMult: 1.15, defMult: 0.9, desc: '前排: ATK+15% DEF-10%', icon: '⚔' },
  back:  { atkMult: 0.85, defMult: 1.15, desc: '后排: ATK-15% DEF+15%', icon: '🛡' },
};

let _currentPosition = POSITION.FRONT;
let _chargeLevel = 0; // 0-3
let _tacticalCombo = []; // 最近3个行动记录
let _weaknessExploited = new Map(); // 已利用的弱点
let _counterWindow = false; // 反击窗口

export function getCurrentPosition() { return _currentPosition; }
export function getPositionModifier() { return POSITION_MODIFIERS[_currentPosition]; }

export function switchPosition() {
  _currentPosition = _currentPosition === POSITION.FRONT ? POSITION.BACK : POSITION.FRONT;
  const mod = POSITION_MODIFIERS[_currentPosition];
  eventBus.emit('combat:position_change', { position: _currentPosition, mod });
  return mod;
}

export function resetTactics() {
  _currentPosition = POSITION.FRONT;
  _chargeLevel = 0;
  _tacticalCombo = [];
  _weaknessExploited.clear();
  _counterWindow = false;
}

// ── 蓄力系统 ──
export function getChargeLevel() { return _chargeLevel; }

export function addCharge(amount = 1) {
  _chargeLevel = Math.min(3, _chargeLevel + amount);
  eventBus.emit('combat:charge_update', { level: _chargeLevel });
  return _chargeLevel;
}

export function consumeCharge() {
  const level = _chargeLevel;
  _chargeLevel = 0;
  eventBus.emit('combat:charge_update', { level: 0 });
  return {
    level,
    dmgMultiplier: 1 + level * 0.5, // 1x, 1.5x, 2x, 2.5x
    critBonus: level * 15, // +0, +15, +30, +45%
    desc: level === 0 ? '普通攻击' : 
          level === 1 ? '蓄力一击 (×1.5)' : 
          level === 2 ? '强力打击 (×2.0)' : 
          '终极一击 (×2.5)',
    icon: ['⚔', '💫', '✨', '💥'][level],
  };
}

// ── 防御选择时自动积蓄 ──
export function onDefendChosen() {
  addCharge(1);
  return {
    text: `🔋 蓄力 +1 (当前: ${'●'.repeat(_chargeLevel)}${'○'.repeat(3 - _chargeLevel)})`,
    type: 'charge',
  };
}

// ── 战术连携 ──
const TACTICAL_COMBOS = {
  'defend,defend,attack': {
    name: '坚壁反击',
    icon: '🛡⚔',
    desc: '连续防御后发起猛烈反击',
    dmgMultiplier: 2.0,
    guaranteeCrit: true,
  },
  'attack,skill,attack': {
    name: '技攻连环',
    icon: '⚔✨⚔',
    desc: '攻击-技能-攻击的连贯打法',
    dmgMultiplier: 1.3,
    lifeSteal: 0.1,
  },
  'skill,skill,skill': {
    name: '法力倾泻',
    icon: '✨✨✨',
    desc: '连续释放技能引发法力共鸣',
    dmgMultiplier: 1.5,
    manaRecover: 20,
  },
  'defend,skill,attack': {
    name: '伺机猎杀',
    icon: '🛡✨⚔',
    desc: '观察后精准出击',
    dmgMultiplier: 1.8,
    pierceDefense: 0.3,
  },
  'attack,attack,attack': {
    name: '疾风连击',
    icon: '⚔⚔⚔',
    desc: '连续猛攻打破防线',
    dmgMultiplier: 1.2,
    bonusHits: 1,
    armorBreak: 0.15,
  },
};

export function recordTacticalAction(actionType) {
  // 规范化行动类型
  const normalized = ['attack', 'skill', 'defend'].includes(actionType) ? actionType : 'attack';
  _tacticalCombo.push(normalized);
  if (_tacticalCombo.length > 3) _tacticalCombo.shift();
  
  // 检查是否触发了战术连携
  if (_tacticalCombo.length === 3) {
    const key = _tacticalCombo.join(',');
    const combo = TACTICAL_COMBOS[key];
    if (combo) {
      eventBus.emit('combat:tactical_combo', { combo, actions: [..._tacticalCombo] });
      return { ...combo, actions: [..._tacticalCombo] };
    }
  }
  return null;
}

// ── 弱点利用 ──
export function exploitWeakness(enemyId, weaknessType) {
  const key = `${enemyId}_${weaknessType}`;
  const count = (_weaknessExploited.get(key) || 0) + 1;
  _weaknessExploited.set(key, count);
  
  // 弱点利用次数越多，效果递减
  const effectiveness = Math.max(0.5, 1.5 - (count - 1) * 0.15);
  
  return {
    effectiveness,
    bonusDmg: Math.floor(10 * effectiveness),
    exploitCount: count,
    diminishing: count > 3,
  };
}

// ── 反击时机 ──
export function setCounterWindow(active) {
  _counterWindow = active;
}

export function isCounterWindow() {
  return _counterWindow;
}

export function processCounter(enemyIntent, playerAction) {
  // 根据敌人意图和玩家行动判断是否触发反击
  if (!_counterWindow) return null;
  
  const counters = {
    // 敌人攻击时防御 → 反击
    'heavy_attack+defend': { counterDmg: 1.5, name: '完美格挡反击', icon: '🛡💥' },
    // 敌人蓄力时攻击 → 打断
    'charge+attack': { interrupt: true, bonusDmg: 1.3, name: '蓄力打断', icon: '⚔💫' },
    // 敌人防御时技能 → 破防
    'defend+skill': { pierceAll: true, name: '破防一击', icon: '✨🔓' },
    // 敌人恢复时攻击 → 追击
    'heal+attack': { bonusDmg: 1.8, preventHeal: true, name: '追击压制', icon: '⚔🚫' },
  };
  
  const key = `${enemyIntent}+${playerAction}`;
  return counters[key] || null;
}

// ── 渲染战术HUD ──
export function renderTacticsHUD() {
  const pos = POSITION_MODIFIERS[_currentPosition];
  const chargeDisplay = '●'.repeat(_chargeLevel) + '○'.repeat(3 - _chargeLevel);
  
  const comboPreview = _tacticalCombo.length >= 2 ? _getTacticalComboPreview() : '';
  
  return `
    <div style="display:flex;gap:12px;align-items:center;padding:6px 12px;
      background:rgba(0,0,0,0.6);border-radius:6px;font-size:11px;">
      <span style="color:${_currentPosition === 'front' ? '#ff8844' : '#4488ff'};">
        ${pos.icon} ${_currentPosition === 'front' ? '前排' : '后排'}
      </span>
      <span style="color:#ffcc44;">
        🔋 ${chargeDisplay}
      </span>
      ${comboPreview ? `<span style="color:#88ff88;font-size:10px;">${comboPreview}</span>` : ''}
    </div>
  `;
}

function _getTacticalComboPreview() {
  // 检查当前连携是否接近触发
  const icons = { attack: '⚔', skill: '✨', defend: '🛡' };
  const current = _tacticalCombo.map(a => icons[a] || '?').join('');
  
  // 检查可能的下一步
  const possible = [];
  for (const [key, combo] of Object.entries(TACTICAL_COMBOS)) {
    const parts = key.split(',');
    if (_tacticalCombo.length >= 2 && 
        parts[0] === _tacticalCombo[_tacticalCombo.length - 2] &&
        parts[1] === _tacticalCombo[_tacticalCombo.length - 1]) {
      possible.push({ action: parts[2], combo });
    }
  }
  
  if (possible.length > 0) {
    return `${current} → ${possible.map(p => `${icons[p.action]}${p.combo.name}`).join(' / ')}`;
  }
  return current;
}

// ── 战术总结 ──
export function getTacticalSummary() {
  return {
    position: _currentPosition,
    chargeLevel: _chargeLevel,
    comboHistory: [..._tacticalCombo],
    weaknessesExploited: _weaknessExploited.size,
    chainInfo: getChargeLevel() > 0 ? `蓄力等级 ${_chargeLevel}` : null,
  };
}
