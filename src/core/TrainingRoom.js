// ═══════════════════════════════════════════════════════════════
// 训练房 — 主神空间中回放上一场敌人进行练习
// ═══════════════════════════════════════════════════════════════
// 设计约束：
//   训练房可回放上一场敌人，但不给奖励点，避免无限刷取
// ═══════════════════════════════════════════════════════════════

import { eventBus } from './EventBus.js';
import { gameState } from './GameState.js';

let _lastEnemies = []; // 上一章遇到的敌人记录
let _chapterEncountered = []; // 本章遭遇过的所有敌人（战斗时记录，避免击杀后丢失）
let _trainingHistory = []; // 训练记录

/**
 * 记录单个遭遇的敌人（战斗前调用，避免被击杀后从 entities 中移除导致丢失）
 */
export function recordEncounteredEnemy(enemy) {
  if (!enemy || enemy.isTraining) return;
  const name = enemy.name;
  // 去重
  if (_chapterEncountered.some(e => e.name === name)) return;
  _chapterEncountered.push({
    name: enemy.name,
    hp: enemy.maxHp || enemy.hp,
    maxHp: enemy.maxHp || enemy.hp,
    atk: enemy.atk,
    def: enemy.def,
    spd: enemy.spd || 5,
    type: enemy.type || 'enemy',
    sprite: enemy.sprite,
    color: enemy.color,
    isBoss: enemy.isBoss || enemy.bossId,
    bossId: enemy.bossId,
    affix: enemy.affix,
    abilities: enemy.abilities,
  });
}

/**
 * 记录遭遇的敌人（每章结束时调用）
 * 优先使用战斗时记录的遭遇列表，补充章节结束时仍存活的
 */
export function recordChapterEnemies(enemies) {
  // 合并：战斗中记录的 + 章节结束时仍存活的
  const alive = (enemies || []).map(e => ({
    name: e.name,
    hp: e.maxHp || e.hp,
    maxHp: e.maxHp || e.hp,
    atk: e.atk,
    def: e.def,
    spd: e.spd || 5,
    type: e.type || 'enemy',
    sprite: e.sprite,
    color: e.color,
    isBoss: e.isBoss || e.bossId,
    bossId: e.bossId,
    affix: e.affix,
    abilities: e.abilities,
  }));
  const merged = [..._chapterEncountered];
  for (const e of alive) {
    if (!merged.some(m => m.name === e.name)) merged.push(e);
  }
  _lastEnemies = merged;
  _chapterEncountered = []; // 重置本章记录
}

/**
 * 获取可训练的敌人列表
 */
export function getTrainingEnemies() {
  return _lastEnemies.map(e => ({
    ...e,
    isTraining: true, // 标记为训练模式
  }));
}

/**
 * 创建训练用敌人副本（不给奖励）
 */
export function createTrainingEnemy(template) {
  return {
    ...template,
    hp: template.maxHp,
    isTraining: true,
    _noReward: true, // 标记不给奖励
    _noExp: true,     // 不给经验
    _noLoot: true,    // 不给掉落
  };
}

/**
 * 记录训练结果
 */
export function recordTrainingResult(enemy, result) {
  _trainingHistory.push({
    enemyName: enemy.name,
    victory: result.victory,
    rounds: result.rounds,
    damage: result.totalDamageDealt,
    taken: result.totalDamageTaken,
    timestamp: Date.now(),
  });
  // 只保留最近20条
  if (_trainingHistory.length > 20) _trainingHistory = _trainingHistory.slice(-20);
}

/**
 * 获取训练历史
 */
export function getTrainingHistory() {
  return [..._trainingHistory];
}

/**
 * 渲染训练房面板HTML
 */
export function renderTrainingRoomPanel(onSelectEnemy) {
  const enemies = getTrainingEnemies();
  const history = getTrainingHistory();
  
  if (enemies.length === 0) {
    return `
      <div style="text-align:center;padding:30px;">
        <p style="color:#888;font-size:14px;">🏋 训练房暂无可用敌人</p>
        <p style="color:#555;font-size:12px;margin-top:8px;">完成第一章后，上一章遇到的敌人将出现在这里</p>
      </div>
    `;
  }
  
  const enemyCards = enemies.map((e, i) => {
    const typeColor = e.isBoss ? '#ff4444' : e.affix ? '#ffaa00' : '#888';
    const typeLabel = e.isBoss ? 'BOSS' : e.affix ? '精英' : '普通';
    return `
      <div class="training-enemy" data-idx="${i}" style="
        background: rgba(255,255,255,0.03); border: 1px solid ${typeColor}30;
        border-radius: 8px; padding: 12px; cursor: pointer; transition: all 0.2s;
        display: flex; align-items: center; gap: 12px;
      " onmouseover="this.style.borderColor='${typeColor}'"
         onmouseout="this.style.borderColor='${typeColor}30'">
        <div style="
          width: 40px; height: 40px; border-radius: 50%;
          background: ${e.color || '#444'}22; border: 2px solid ${e.color || '#444'};
          display: flex; align-items: center; justify-content: center;
          font-size: 18px;
        ">${e.sprite || '?'}</div>
        <div style="flex:1;">
          <div style="display:flex;justify-content:space-between;">
            <strong style="color:#e0e0e0;font-size:13px;">${e.name}</strong>
            <span style="color:${typeColor};font-size:10px;border:1px solid ${typeColor}40;padding:1px 6px;border-radius:3px;">${typeLabel}</span>
          </div>
          <p style="color:#888;font-size:11px;margin-top:4px;">
            HP:${e.maxHp} ATK:${e.atk} DEF:${e.def || 0} SPD:${e.spd}
          </p>
        </div>
      </div>
    `;
  }).join('');
  
  const historyHTML = history.length > 0 ? `
    <div style="margin-top:16px;border-top:1px solid #222;padding-top:12px;">
      <p style="color:#666;font-size:10px;letter-spacing:2px;margin-bottom:8px;">最近训练记录</p>
      ${history.slice(-5).reverse().map(h => `
        <div style="display:flex;justify-content:space-between;padding:4px 0;color:#555;font-size:11px;">
          <span>${h.victory ? '✓' : '✗'} vs ${h.enemyName}</span>
          <span>${h.rounds}回合 | 输出${h.damage} | 承伤${h.taken}</span>
        </div>
      `).join('')}
    </div>
  ` : '';
  
  return `
    <div style="padding:12px;">
      <h3 style="color:#ffcc44;text-align:center;letter-spacing:4px;margin-bottom:8px;">🏋 训练房</h3>
      <p style="color:#666;font-size:11px;text-align:center;margin-bottom:16px;">
        回放上一章敌人进行练习 · 不消耗资源，不获得奖励
      </p>
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${enemyCards}
      </div>
      ${historyHTML}
    </div>
  `;
}

// 序列化
export function serializeTrainingRoom() {
  return { lastEnemies: _lastEnemies, history: _trainingHistory, encountered: _chapterEncountered };
}

export function deserializeTrainingRoom(data) {
  if (!data) return;
  if (data.lastEnemies) _lastEnemies = data.lastEnemies;
  if (data.history) _trainingHistory = data.history;
  if (data.encountered) _chapterEncountered = data.encountered;
}
