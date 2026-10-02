// =================================================================
// 战斗详情回放系统 — 逐回合战斗过程可视化
// =================================================================
// 在战斗结束后提供详细的逐回合回放面板
// 显示每回合的攻防数值、暴击/技能触发、HP变化曲线

import { gameState } from './GameState.js';
import { GAME_STATE } from './constants.js';

// -- 战斗历史记录(最近20场) --
const MAX_HISTORY = 20;
let _battleHistory = [];

export function recordBattle(result) {
  const record = {
    timestamp: Date.now(),
    enemy: result.enemy?.name || 'unknown',
    enemyOriginal: result.enemy?._originalName || result.enemy?.name || 'unknown',
    isElite: !!result.enemy?._eliteTier,
    eliteTier: result.enemy?._eliteTier || null,
    eliteAffixes: (result.enemy?._eliteAffixes || []).map(a => a.name),
    victory: result.victory,
    rounds: result.rounds || 0,
    rating: result.rating || null,
    playerHpBefore: result.playerHpBefore || 0,
    playerHpAfter: result.playerHpAfter || 0,
    playerMaxHp: result.playerMaxHp || 0,
    playerAtk: result.playerAtk || 0,
    playerDef: result.playerDef || 0,
    enemyHp: result.enemyMaxHp || 0,
    enemyAtk: result.enemyAtk || 0,
    enemyDef: result.enemyDef || 0,
    totalDamageDealt: result.totalDamageDealt || 0,
    totalDamageTaken: result.totalDamageTaken || 0,
    critCount: result.critCount || 0,
    log: (result.log || []).map(entry => ({
      text: entry.text || '',
      type: entry.type || 'normal',
      round: entry.round || 0,
      damage: entry.damage || 0,
      playerHp: entry.playerHp,
      enemyHp: entry.enemyHp,
    })),
    chapter: gameState.chapter || 1,
    floor: gameState.currentFloorIndex || 0,
  };
  _battleHistory.unshift(record);
  if (_battleHistory.length > MAX_HISTORY) _battleHistory.pop();
  return record;
}

export function getBattleHistory() {
  return _battleHistory;
}

export function clearBattleHistory() {
  _battleHistory = [];
}

// -- 打开战斗详情回放面板 --
export function showBattleReplay(battleRecord) {
  if (!battleRecord) {
    battleRecord = _battleHistory[0];
    if (!battleRecord) return;
  }
  
  const prevState = gameState.state;
  gameState.setState(GAME_STATE.INVENTORY);
  const overlay = document.getElementById('ui-overlay');
  
  const b = battleRecord;
  const hpPercent = b.playerMaxHp > 0 ? Math.round(b.playerHpAfter / b.playerMaxHp * 100) : 0;
  const dmgRatio = b.totalDamageDealt > 0 ? (b.totalDamageDealt / (b.totalDamageTaken || 1)).toFixed(1) : '\u221e';
  
  // Group log by rounds
  const roundLogs = {};
  for (const entry of b.log) {
    const r = entry.round || 0;
    if (!roundLogs[r]) roundLogs[r] = [];
    roundLogs[r].push(entry);
  }
  
  // HP curve data points
  const hpCurve = [];
  let playerHp = b.playerHpBefore;
  let enemyHp = b.enemyHp;
  hpCurve.push({ round: 0, playerHp, enemyHp });
  for (const entry of b.log) {
    if (entry.playerHp !== undefined) playerHp = entry.playerHp;
    if (entry.enemyHp !== undefined) enemyHp = entry.enemyHp;
    if (entry.round && (entry.playerHp !== undefined || entry.enemyHp !== undefined)) {
      hpCurve.push({ round: entry.round, playerHp: Math.max(0, playerHp), enemyHp: Math.max(0, enemyHp) });
    }
  }
  
  const close = () => { overlay.innerHTML = ''; gameState.setState(prevState); document.removeEventListener('keydown', _replayKh); };
  const _replayKh = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', _replayKh);
  
  const victoryColor = b.victory ? '#44ff88' : '#ff4444';
  const victoryText = b.victory ? '\u2714 \u80dc\u5229' : '\u2718 \u8d25\u5317';
  const ratingHtml = b.rating ? '<span style="color:' + (b.rating.color || '#fff') + '; font-size:24px; font-weight:bold;">' + (b.rating.grade || '') + '</span>' : '';
  
  // Build round-by-round HTML
  let roundsHtml = '';
  const maxRound = Math.max(...Object.keys(roundLogs).map(Number), 0);
  for (let r = 0; r <= maxRound; r++) {
    const entries = roundLogs[r] || [];
    if (entries.length === 0) continue;
    roundsHtml += '<div style="margin-bottom:6px; padding:4px 8px; background:rgba(255,255,255,0.02); border-left:2px solid #333; border-radius:0 4px 4px 0;">';
    roundsHtml += '<span style="color:#666; font-size:9px;">R' + r + '</span> ';
    for (const e of entries) {
      let color = '#aaa';
      if (e.type === 'player_attack' || e.type === 'damage') color = '#44aaff';
      if (e.type === 'enemy_attack') color = '#ff6644';
      if (e.type === 'critical') color = '#ffcc00';
      if (e.type === 'heal') color = '#44ff88';
      if (e.type === 'defeat') color = '#ff4444';
      if (e.type === 'victory') color = '#44ff88';
      if (e.type === 'skill') color = '#aa88ff';
      if (e.type === 'status') color = '#ff8844';
      if (e.text.includes('\u66b4\u51fb')) color = '#ffcc00';
      roundsHtml += '<span style="color:' + color + '; font-size:11px; display:block; padding:1px 0;">' + e.text + '</span>';
    }
    roundsHtml += '</div>';
  }
  
  // HP curve SVG
  const svgW = 280, svgH = 60;
  const maxHp = Math.max(b.playerMaxHp, b.enemyHp, 1);
  let playerPath = '', enemyPath = '';
  if (hpCurve.length > 1) {
    const xStep = svgW / Math.max(hpCurve.length - 1, 1);
    playerPath = hpCurve.map((p, i) => (i === 0 ? 'M' : 'L') + (i * xStep).toFixed(1) + ',' + (svgH - p.playerHp / maxHp * svgH).toFixed(1)).join(' ');
    enemyPath = hpCurve.map((p, i) => (i === 0 ? 'M' : 'L') + (i * xStep).toFixed(1) + ',' + (svgH - p.enemyHp / maxHp * svgH).toFixed(1)).join(' ');
  }
  
  // Build HTML via string concatenation to avoid template literal issues
  let replayHtml = '<div style="position:absolute;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.9);" id="replay-backdrop">';
  replayHtml += '<div style="background:rgba(8,8,18,0.98);border:1px solid #444;border-radius:16px;padding:20px;max-width:650px;width:96%;max-height:90vh;overflow-y:auto;">';
  
  // Header
  replayHtml += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">';
  replayHtml += '<div><h2 style="color:#ffcc44;font-size:16px;letter-spacing:2px;margin:0;">\u2694 \u6218\u6597\u8be6\u60c5</h2>';
  replayHtml += '<p style="color:#666;font-size:10px;">' + b.chapter + '-' + (b.floor + 1) + ' | ' + new Date(b.timestamp).toLocaleTimeString() + '</p></div>';
  replayHtml += '<div style="text-align:right;"><span style="color:' + victoryColor + ';font-size:18px;font-weight:bold;">' + victoryText + '</span> ' + ratingHtml + '</div></div>';
  
  // Stats comparison
  replayHtml += '<div style="display:flex;gap:8px;margin-bottom:12px;">';
  replayHtml += '<div style="flex:1;background:rgba(68,170,255,0.05);border:1px solid #44aaff30;border-radius:8px;padding:10px;text-align:center;">';
  replayHtml += '<p style="color:#44aaff;font-size:10px;letter-spacing:1px;margin-bottom:4px;">\u90d1\u5430</p>';
  replayHtml += '<p style="color:#ccc;font-size:12px;">ATK ' + b.playerAtk + ' \u00b7 DEF ' + b.playerDef + '</p>';
  replayHtml += '<p style="color:#44ff88;font-size:11px;">HP ' + b.playerHpBefore + ' \u2192 ' + b.playerHpAfter + ' (' + hpPercent + '%)</p></div>';
  replayHtml += '<div style="flex:1;background:rgba(255,68,68,0.05);border:1px solid #ff444430;border-radius:8px;padding:10px;text-align:center;">';
  replayHtml += '<p style="color:#ff6644;font-size:10px;letter-spacing:1px;margin-bottom:4px;">' + b.enemy + '</p>';
  replayHtml += '<p style="color:#ccc;font-size:12px;">ATK ' + b.enemyAtk + ' \u00b7 DEF ' + b.enemyDef + '</p>';
  replayHtml += '<p style="color:#ff6644;font-size:11px;">HP ' + b.enemyHp + ' \u2192 0</p>';
  if (b.isElite) {
    const eliteColor = b.eliteTier === 'legendary' ? '#ff8800' : b.eliteTier === 'elite' ? '#aa44ff' : '#4488ff';
    replayHtml += '<p style="color:' + eliteColor + ';font-size:10px;">' + b.eliteAffixes.join(' ') + '</p>';
  }
  replayHtml += '</div></div>';
  
  // Key metrics
  replayHtml += '<div style="display:flex;gap:6px;margin-bottom:12px;flex-wrap:wrap;">';
  const metrics = [
    ['\u56de\u5408', b.rounds, '#ffcc44'],
    ['\u603b\u8f93\u51fa', b.totalDamageDealt, '#44aaff'],
    ['\u603b\u627f\u53d7', b.totalDamageTaken, '#ff6644'],
    ['\u4f24\u5bb3\u6bd4', dmgRatio, '#ffcc44'],
    ['\u66b4\u51fb', b.critCount, '#ffcc00'],
  ];
  for (const [label, value, color] of metrics) {
    replayHtml += '<div style="background:rgba(255,255,255,0.03);padding:6px 10px;border-radius:6px;text-align:center;">';
    replayHtml += '<p style="color:#666;font-size:9px;">' + label + '</p>';
    replayHtml += '<p style="color:' + color + ';font-size:16px;font-weight:bold;">' + value + '</p></div>';
  }
  replayHtml += '</div>';
  
  // HP Curve
  if (hpCurve.length > 1) {
    replayHtml += '<div style="margin-bottom:12px;">';
    replayHtml += '<p style="color:#666;font-size:9px;margin-bottom:4px;">HP \u53d8\u5316\u66f2\u7ebf</p>';
    replayHtml += '<svg width="' + svgW + '" height="' + svgH + '" style="background:rgba(255,255,255,0.02);border-radius:4px;">';
    replayHtml += '<path d="' + playerPath + '" fill="none" stroke="#44aaff" stroke-width="2" opacity="0.8"/>';
    replayHtml += '<path d="' + enemyPath + '" fill="none" stroke="#ff6644" stroke-width="2" opacity="0.8"/>';
    replayHtml += '</svg>';
    replayHtml += '<div style="display:flex;gap:12px;margin-top:2px;">';
    replayHtml += '<span style="color:#44aaff;font-size:9px;">\u2014 \u73a9\u5bb6HP</span>';
    replayHtml += '<span style="color:#ff6644;font-size:9px;">\u2014 \u654c\u4ebaHP</span></div></div>';
  }
  
  // Round-by-round log
  replayHtml += '<div style="max-height:200px;overflow-y:auto;border:1px solid #222;border-radius:6px;padding:8px;background:rgba(0,0,0,0.3);">';
  replayHtml += '<p style="color:#666;font-size:9px;letter-spacing:1px;margin-bottom:6px;">\u9010\u56de\u5408\u8bb0\u5f55</p>';
  replayHtml += roundsHtml;
  replayHtml += '</div>';
  
  // Close button
  replayHtml += '<div style="text-align:center;margin-top:16px;">';
  replayHtml += '<button id="btn-close-replay" style="background:transparent;border:1px solid #444;color:#888;padding:8px 30px;cursor:pointer;font-size:14px;font-family:inherit;border-radius:6px;">\u5173\u95ed (Esc)</button>';
  replayHtml += '</div></div></div>';
  
  overlay.innerHTML = replayHtml;

  
  document.getElementById('btn-close-replay')?.addEventListener('click', close);
  document.getElementById('replay-backdrop')?.addEventListener('click', (e) => {
    if (e.target.id === 'replay-backdrop') close();
  });
}

// -- 显示战斗历史列表面板 --
export function showBattleHistoryPanel() {
  if (_battleHistory.length === 0) return;
  
  const prevState = gameState.state;
  gameState.setState(GAME_STATE.INVENTORY);
  const overlay = document.getElementById('ui-overlay');
  
  const close = () => { overlay.innerHTML = ''; gameState.setState(prevState); document.removeEventListener('keydown', _histKh); };
  const _histKh = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', _histKh);
  
  let html = '<div style="position:absolute;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.88);" id="hist-backdrop">';
  html += '<div style="background:rgba(8,8,18,0.98);border:1px solid #444;border-radius:16px;padding:20px;max-width:500px;width:96%;max-height:85vh;overflow-y:auto;">';
  html += '<h2 style="color:#ffcc44;font-size:14px;letter-spacing:2px;margin-bottom:12px;">\u2694 \u6218\u6597\u5386\u53f2 (\u6700\u8fd1' + _battleHistory.length + '\u573a)</h2>';
  
  for (let i = 0; i < _battleHistory.length; i++) {
    const b = _battleHistory[i];
    const vc = b.victory ? '#44ff88' : '#ff4444';
    const vt = b.victory ? '\u2714' : '\u2718';
    const rating = b.rating ? ' [' + b.rating.grade + ']' : '';
    html += '<div class="hist-item" data-idx="' + i + '" style="padding:6px 10px;margin-bottom:4px;background:rgba(255,255,255,0.02);border:1px solid #222;border-radius:6px;cursor:pointer;transition:background 0.15s;">';
    html += '<span style="color:' + vc + ';font-size:12px;">' + vt + '</span> ';
    html += '<span style="color:#ccc;font-size:12px;">' + b.enemy + '</span> ';
    html += '<span style="color:#666;font-size:10px;">' + b.rounds + 'R' + rating + '</span>';
    if (b.isElite) html += ' <span style="color:' + (b.eliteTier === 'legendary' ? '#ff8800' : b.eliteTier === 'elite' ? '#aa44ff' : '#4488ff') + ';font-size:10px;">\u25c6</span>';
    html += '</div>';
  }
  
  html += '<div style="text-align:center;margin-top:12px;">';
  html += '<button id="btn-close-hist" style="background:transparent;border:1px solid #444;color:#888;padding:8px 30px;cursor:pointer;font-size:14px;font-family:inherit;border-radius:6px;">\u5173\u95ed (Esc)</button>';
  html += '</div></div></div>';
  
  overlay.innerHTML = html;
  
  // Click handlers for each battle record
  overlay.querySelectorAll('.hist-item').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.dataset.idx);
      if (_battleHistory[idx]) {
        close();
        setTimeout(() => showBattleReplay(_battleHistory[idx]), 50);
      }
    });
    el.addEventListener('mouseover', () => { el.style.background = 'rgba(255,255,255,0.05)'; });
    el.addEventListener('mouseout', () => { el.style.background = 'rgba(255,255,255,0.02)'; });
  });
  
  document.getElementById('btn-close-hist')?.addEventListener('click', close);
  document.getElementById('hist-backdrop')?.addEventListener('click', (e) => {
    if (e.target.id === 'hist-backdrop') close();
  });
}

export function serializeBattleHistory() {
  return _battleHistory.slice(0, 10); // save last 10
}

export function deserializeBattleHistory(data) {
  if (Array.isArray(data)) _battleHistory = data;
}
