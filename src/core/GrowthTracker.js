// =================================================================
// 角色成长轨迹 — 记录每章结束时的属性快照
// =================================================================
// 在章节通关时自动拍摄属性快照
// 提供成长曲线可视化和里程碑回顾

import { eventBus } from './EventBus.js';

let _snapshots = [];
let _milestones = [];

export function recordChapterSnapshot(chapter, playerData) {
  _snapshots.push({
    chapter,
    timestamp: Date.now(),
    level: playerData.level || 1,
    hp: playerData.maxHp || 100,
    atk: playerData.atk || 10,
    def: playerData.def || 5,
    spd: playerData.spd || 5,
    crt: playerData.crt || 0,
    gold: playerData.gold || 0,
    geneLock: playerData.geneLock || 0,
    bloodline: playerData.activeBloodline || 'none',
    kills: playerData._totalKills || 0,
    deaths: playerData._totalDeaths || 0,
    weapon: playerData.weapon?.name || null,
    armor: playerData.armor?.name || null,
  });
  eventBus.emit('growth:snapshot', { chapter });
}

export function recordMilestone(text, chapter, type = 'general') {
  _milestones.push({ text, chapter, type, timestamp: Date.now() });
}

export function getSnapshots() { return [..._snapshots]; }
export function getMilestones() { return [..._milestones]; }

// 获取两个快照之间的成长量
export function getGrowthBetween(fromChapter, toChapter) {
  const from = _snapshots.find(s => s.chapter === fromChapter);
  const to = _snapshots.find(s => s.chapter === toChapter);
  if (!from || !to) return null;
  return {
    levelGain: to.level - from.level,
    hpGain: to.hp - from.hp,
    atkGain: to.atk - from.atk,
    defGain: to.def - from.def,
    from, to,
  };
}

// 生成成长曲线SVG数据
export function getGrowthCurveData() {
  if (_snapshots.length < 2) return null;
  const maxAtk = Math.max(..._snapshots.map(s => s.atk));
  const maxDef = Math.max(..._snapshots.map(s => s.def));
  const maxHp = Math.max(..._snapshots.map(s => s.hp));
  
  const w = 300, h = 80;
  const step = w / Math.max(_snapshots.length - 1, 1);
  
  const atkPath = _snapshots.map((s, i) => (i === 0 ? 'M' : 'L') + (i * step).toFixed(1) + ',' + (h - s.atk / maxAtk * h * 0.9).toFixed(1)).join(' ');
  const defPath = _snapshots.map((s, i) => (i === 0 ? 'M' : 'L') + (i * step).toFixed(1) + ',' + (h - s.def / maxDef * h * 0.9).toFixed(1)).join(' ');
  const hpPath = _snapshots.map((s, i) => (i === 0 ? 'M' : 'L') + (i * step).toFixed(1) + ',' + (h - s.hp / maxHp * h * 0.9).toFixed(1)).join(' ');
  
  return { w, h, atkPath, defPath, hpPath, snapshots: _snapshots };
}

// 生成成长面板HTML
export function renderGrowthPanel() {
  if (_snapshots.length === 0) return '<p style="color:#666;text-align:center;">\u5c1a\u65e0\u6210\u957f\u8bb0\u5f55</p>';
  
  const latest = _snapshots[_snapshots.length - 1];
  const first = _snapshots[0];
  const curve = getGrowthCurveData();
  
  let html = '<div style="max-width:400px;margin:0 auto;">';
  
  // Current stats
  html += '<div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;justify-content:center;">';
  const stats = [
    ['Lv', latest.level, '#ffcc44'],
    ['HP', latest.hp, '#44ff88'],
    ['ATK', latest.atk, '#ff6644'],
    ['DEF', latest.def, '#4488ff'],
  ];
  for (const [label, val, color] of stats) {
    const gain = val - first[label.toLowerCase()] || 0;
    html += '<div style="background:rgba(255,255,255,0.03);padding:6px 10px;border-radius:6px;text-align:center;min-width:60px;">';
    html += '<p style="color:#666;font-size:9px;">' + label + '</p>';
    html += '<p style="color:' + color + ';font-size:16px;font-weight:bold;">' + val + '</p>';
    if (gain > 0) html += '<p style="color:#44ff88;font-size:9px;">+' + gain + '</p>';
    html += '</div>';
  }
  html += '</div>';
  
  // Growth curve SVG
  if (curve) {
    html += '<div style="margin-bottom:12px;text-align:center;">';
    html += '<p style="color:#666;font-size:9px;margin-bottom:4px;">\u6210\u957f\u66f2\u7ebf</p>';
    html += '<svg width="' + curve.w + '" height="' + curve.h + '" style="background:rgba(255,255,255,0.02);border-radius:4px;">';
    html += '<path d="' + curve.atkPath + '" fill="none" stroke="#ff6644" stroke-width="2" opacity="0.8"/>';
    html += '<path d="' + curve.defPath + '" fill="none" stroke="#4488ff" stroke-width="2" opacity="0.8"/>';
    html += '<path d="' + curve.hpPath + '" fill="none" stroke="#44ff88" stroke-width="1.5" opacity="0.6" stroke-dasharray="4,2"/>';
    html += '</svg>';
    html += '<div style="display:flex;gap:8px;justify-content:center;margin-top:2px;">';
    html += '<span style="color:#ff6644;font-size:9px;">\u2014 ATK</span>';
    html += '<span style="color:#4488ff;font-size:9px;">\u2014 DEF</span>';
    html += '<span style="color:#44ff88;font-size:9px;">--- HP</span>';
    html += '</div></div>';
  }
  
  // Snapshot list
  html += '<div style="max-height:150px;overflow-y:auto;">';
  for (const s of [..._snapshots].reverse()) {
    html += '<div style="padding:4px 8px;border-left:2px solid #333;margin-bottom:3px;font-size:10px;">';
    html += '<span style="color:#ffcc44;">Ch' + s.chapter + '</span> ';
    html += '<span style="color:#aaa;">Lv.' + s.level + '</span> ';
    html += '<span style="color:#ff6644;">ATK ' + s.atk + '</span> ';
    html += '<span style="color:#4488ff;">DEF ' + s.def + '</span> ';
    html += '<span style="color:#44ff88;">HP ' + s.hp + '</span>';
    if (s.weapon) html += ' <span style="color:#665533;">' + s.weapon + '</span>';
    html += '</div>';
  }
  html += '</div>';
  
  // Milestones
  if (_milestones.length > 0) {
    html += '<div style="margin-top:8px;border-top:1px solid #222;padding-top:8px;">';
    html += '<p style="color:#666;font-size:9px;margin-bottom:4px;">\u91cc\u7a0b\u7891</p>';
    for (const m of [..._milestones].reverse().slice(0, 5)) {
      html += '<p style="color:#888;font-size:10px;">\u2022 Ch' + m.chapter + ': ' + m.text + '</p>';
    }
    html += '</div>';
  }
  
  html += '</div>';
  return html;
}

export function clearGrowthData() { _snapshots = []; _milestones = []; }
export function serializeGrowth() { return { snapshots: _snapshots, milestones: _milestones }; }
export function deserializeGrowth(data) {
  if (data) {
    _snapshots = data.snapshots || [];
    _milestones = data.milestones || [];
  }
}
