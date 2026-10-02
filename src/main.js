
// ── 全局错误恢复 ──
window.onerror = (msg, src, line, col, err) => {
  console.error('Game error:', msg, src, line, col, err);
  try {
    const overlay = document.getElementById('ui-overlay');
    if (overlay) {
      overlay.innerHTML = '<div style="position:fixed;top:0;left:0;right:0;bottom:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,0.9);z-index:9999;">' +
        '<p style="color:#ff4444;font-size:18px;margin-bottom:12px;">⚠ 遇到了一个问题</p>' +
        '<p style="color:#888;font-size:12px;max-width:400px;text-align:center;word-break:break-all;">' + msg + '</p>' +
        '<div style="display:flex;gap:12px;margin-top:20px;">' +
        '<button onclick="location.reload()" style="background:rgba(255,68,68,0.15);border:1px solid #ff4444;color:#ff4444;padding:10px 24px;cursor:pointer;font-size:14px;border-radius:8px;">刷新页面</button>' +
        '<button onclick="this.parentElement.parentElement.parentElement.innerHTML=\'\'" style="background:transparent;border:1px solid #444;color:#888;padding:8px 20px;cursor:pointer;font-size:12px;border-radius:6px;">忽略</button>' +
        '</div></div>';
    }
  } catch {}
  return true; // Prevent default error handling
};
window.addEventListener('unhandledrejection', (e) => {
  console.error('Unhandled promise rejection:', e.reason);
});

// ═══════════════════════════════════════════════════════════════
// 无限恐怖：中洲轮回 — 主入口
// 2D俯视角 Roguelike + 魔塔式数值战斗 + 叙事选择

// ═══════════════════════════════════════════════════════════════

import { TILE, TILE_SIZE, ENTITY_TYPE, GAME_STATE, GENE_LOCK, COLORS, CANVAS_W, CANVAS_H } from './core/constants.js';
import { eventBus } from './core/EventBus.js';
import { gameState } from './core/GameState.js';
import { Renderer } from './core/Renderer.js';
import { executeBattle, previewBattle, getEffectiveAtk, getEffectiveDef, getEffectiveCrt, getEffectiveSpd } from './core/CombatSystem.js';
import { generateChapter1 } from './core/MapGenerator.js';
import { generateChapter2 } from './core/MapGenerator_Ch2.js';
import { generateChapter3 } from './core/MapGenerator_Ch3.js';
import { generateChapter4 } from './core/MapGenerator_Ch4.js';
import { generateChapter5 } from './core/MapGenerator_Ch5.js';
import { generateChapter6 } from './core/MapGenerator_Ch6.js';
import { generateChapter7 } from './core/MapGenerator_Ch7.js';
import { generateChapter8 } from './core/MapGenerator_Ch8.js';
import { generateChapter9 } from './core/MapGenerator_Ch9.js';
import { generateChapter10 } from './core/MapGenerator_Ch10.js';
import { generateChapter11 } from './core/MapGenerator_Ch11.js';
import { generateChapter12 } from './core/MapGenerator_Ch12.js';
import {
  setShiftHeld, onPlayerMove, onCombatNoise, decayNoise,
  isPatrolAlerted, consumeAmmo, reloadAmmo, resetStealth, initAmmo,
  getNoise, getIsSneaking, getAmmo, getMaxAmmo,
  serializeStealth, deserializeStealth,
  updateAmmoForWeapon,
} from './core/StealthSystem.js';
import { audioEngine } from './core/AudioEngine.js';
import { scaleEnemy } from './core/DifficultyScaler.js';
import { getGeneLockProgress, getGeneLockDescription } from './core/GeneLockSystem.js';
import { generateRecapHTML } from './core/RecapSystem.js';
import { getAvailableSkills, SKILL_DEFINITIONS } from './core/SkillSystem.js';
import { renderLordGodSpace } from './core/LordGodSpace.js';
import { CombatAnimator } from './core/CombatAnimation.js';
import { showOpeningCutscene, showChapter2Cutscene, showChapter3Cutscene, showChapter4Cutscene, showChapter5Cutscene, showChapter6Cutscene, showChapter7Cutscene, showChapter8Cutscene, showChapter9Cutscene, showChapter10Cutscene, showChapter11Cutscene, showChapter12Cutscene } from './core/Cutscene.js';
import { assetLoader } from './core/AssetLoader.js';
import { milestoneTracker, checkCombatMilestones, checkGrowthMilestones, checkChapterMilestones, checkEquipmentMilestones, MILESTONES } from './core/MilestoneSystem.js';
import { getTalentEffects, TALENT_PATHS } from './core/TalentTree.js';
import { getEquipmentDisplayName, getEquipmentTotalStats } from './core/EquipmentSystem.js';
import { getPlayerActiveElements, ELEMENT_INFO, checkElementalResonance } from './core/ElementalSystem.js';
import { changeRelationship, getRelationshipLevel, getRelationshipSummary, COMPANION_PROFILES } from './core/RelationshipSystem.js';
import { loreTracker, LORE_ENTRIES, formatLorePopup } from './core/LoreSystem.js';
import { bestiary, getDifficulty, setDifficulty, getDifficultyConfig, applyDifficultyScaling, formatBestiaryPanel, formatDifficultySelector, DIFFICULTY, DIFFICULTY_CONFIG } from './core/DifficultySystem.js';
import { initPanelContext, showInventoryPanel, showStatsPanel, showBestiaryPanel, showRelationshipPanel, showHelpPanel, showFullMap, showCombatLog, showAchievementPanel, showSettingsPanel, showForgePanel } from './core/UIPanels.js';
import { ngPlusState, formatClearScreen, formatCycleInfo, TITLES, getActiveMutators } from './core/NewGamePlus.js';
import { fadeBlackTransition, chapterIntroTransition, floorTransition, victoryFlash } from './core/TransitionSystem.js';
import { MiniMap } from './core/MiniMap.js';
import { openCodex } from './core/Codex.js';
import { recordChapterSnapshot, recordMilestone, serializeGrowth, deserializeGrowth, renderGrowthPanel } from './core/GrowthTracker.js';
import { recordVictory as ddRecordVictory, recordDeath as ddRecordDeath, getDynamicFactor, applyDynamicScaling, serializeDynamicDifficulty, deserializeDynamicDifficulty, getDynamicDifficultyInfo } from './core/DynamicDifficulty.js';
import { generateAbyssFloor, startAbyss, nextAbyssFloor, getAbyssState, isAbyssActive, endAbyss, serializeAbyss, deserializeAbyss } from './core/AbyssMode.js';
import { generateDailyChallenge, isDailyCompleted, completeDailyChallenge, getDailyRecord, serializeDaily, deserializeDaily } from './core/DailyChallenge.js';
import { addEffect, tickEffects, getActiveEffects, getEffectModifiers, renderEffectHUD, serializeEffects, deserializeEffects, clearAllEffects } from './core/StatusEffectTracker.js';
import { recordBattle, showBattleReplay, showBattleHistoryPanel, serializeBattleHistory, deserializeBattleHistory } from './core/BattleReplay.js';
import { tryUpgradeToElite, getEliteDescription, recordEliteKill, getEliteStats, resetEliteStats, serializeEliteStats, deserializeEliteStats } from './core/EliteMonsterSystem.js';
import { atmosphereRenderer } from './core/AtmosphereSystem.js';
import { tutorialManager } from './core/TutorialSystem.js';
import { triggerTrap as fireTrap, openChest, TRAP_TYPES, CHEST_TYPES } from './core/TrapSystem.js';
import { addConsumable, useConsumable, getInventoryList, consumePendingBuffs, giveStarterConsumables, CONSUMABLE_DEFS } from './core/ConsumableSystem.js';
import { generateSecretEntities, tryBreakSecret, restoreBrokenSecrets, SECRET_TYPES } from './core/SecretRoomSystem.js';
import { randomEncounterManager } from './core/RandomEncounterSystem.js';
import { getCurrentStance, setStance, getAvailableStances, getStanceId, restoreStance } from './core/CombatStance.js';
import { challengeState, CHALLENGE_TYPES } from './core/ChallengeDungeon.js';
import { achievementTracker } from './core/AchievementSystem.js';
import { getQualityColor, getQualityName, formatEquipmentTooltip, getAllAffixEffects } from './core/EquipmentAffixes.js';
import { killStreak } from './core/KillStreak.js';
import { rateBattle, recordRating, formatRatingHTML, getRatingStats } from './core/BattleRating.js';
import { fogOfWar } from './core/FogOfWar.js';
import { openMerchantShop } from './core/FieldMerchant.js';
import { getStash, addToStash, removeFromStash, isStashFull, openEquipmentStash, serializeStash, deserializeStash } from './core/EquipmentStash.js';
import { getCompanionCombatBonuses, getCompanionBattleCry, formatCompanionCombatHTML } from './core/CompanionCombat.js';
import { drawQuestHUD, formatQuestPanelHTML } from './core/QuestTracker.js';
import { initTitleFX, spawnDamageNumber, screenShake, screenFlash } from './core/TitleScreenFX.js';

// ── 全局状态 ──
let renderer;
let chapter;
let currentFloorIndex = 0;
let entities = [];      // 当前层的活实体
let dialogueState = null;  // { lines, currentLine }
let combatResult = null;
let choiceState = null;    // { choices, callback }
let hoveredEntity = null;
let gameStarted = false;
let menuState = 'title'; // 'title' | 'playing'
let combatAnimator = null;
let combatHistory = []; // 战斗历史记录

// ── 自动保存 ──
// 锻造台全局入口，供LordGodSpace调用
window._showForgePanel = showForgePanel;

// 成就解锁通知
eventBus.on('achievement:unlocked', ({ achievement }) => {
  const notif = document.createElement('div');
  notif.style.cssText = 'position:fixed;top:20px;right:20px;z-index:99999;' +
    'background:linear-gradient(135deg,rgba(20,15,5,0.95),rgba(30,20,8,0.95));' +
    'border:1px solid #ffcc44;border-radius:12px;padding:16px 24px;' +
    'box-shadow:0 0 30px rgba(255,200,68,0.3);' +
    'animation:achSlideIn 0.5s ease;max-width:320px;';
  notif.innerHTML = `<div style="display:flex;align-items:center;gap:12px;">` +
    `<span style="font-size:32px;">${achievement.icon}</span>` +
    `<div><p style="color:#ffcc44;font-size:11px;letter-spacing:3px;margin-bottom:4px;">🏆 成就解锁</p>` +
    `<p style="color:#e8d8c0;font-size:15px;font-weight:bold;">${achievement.name}</p>` +
    `<p style="color:#888;font-size:12px;margin-top:2px;">${achievement.desc}</p></div></div>`;
  const style = document.createElement('style');
  style.textContent = '@keyframes achSlideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}';
  document.head.appendChild(style);
  document.body.appendChild(notif);
  setTimeout(() => { notif.style.transition = 'opacity 0.5s'; notif.style.opacity = '0'; setTimeout(() => notif.remove(), 600); }, 3500);
});
let _lastAutoSave = 0;
function autoSave(reason = '') {
  const now = Date.now();
  if (now - _lastAutoSave < 2000) return; // 防抖: 2秒内不重复保存
  _lastAutoSave = now;
  try {
    gameState.save(0);
    localStorage.setItem('ih_milestones', JSON.stringify(milestoneTracker.toJSON()));
    localStorage.setItem('ih_lore', JSON.stringify(loreTracker.toJSON()));
    localStorage.setItem('ih_tutorial', JSON.stringify(tutorialManager.toJSON()));
    localStorage.setItem('ih_streak', JSON.stringify(killStreak.toJSON()));
    localStorage.setItem('ih_bestiary', JSON.stringify(bestiary.toJSON()));
    localStorage.setItem('ih_challenge', JSON.stringify(challengeState.toJSON()));
    localStorage.setItem('ih_elite', JSON.stringify(serializeEliteStats()));
    localStorage.setItem('ih_battle_history', JSON.stringify(serializeBattleHistory()));
    localStorage.setItem('ih_status_effects', JSON.stringify(serializeEffects()));
    localStorage.setItem('ih_dynamic_diff', JSON.stringify(serializeDynamicDifficulty()));
    localStorage.setItem('ih_growth', JSON.stringify(serializeGrowth()));
    localStorage.setItem('ih_abyss', JSON.stringify(serializeAbyss()));
    localStorage.setItem('ih_daily', JSON.stringify(serializeDaily()));    // 设置持久化：难度 + 音量 + 迷雾
    try {
      const settingsData = {
        difficulty: getDifficulty(),
        volume: audioEngine.masterGain?.gain?.value ?? 0.5,
        fog: fogOfWar.enabled !== false
      };
      localStorage.setItem('ih_settings', JSON.stringify(settingsData));
    } catch {}
    // 随机遭遇持久化
    try {
      localStorage.setItem('ih_encounters', JSON.stringify(randomEncounterManager.toJSON()));
    // 成就持久化
    try {
      localStorage.setItem('ih_achievements', JSON.stringify(achievementTracker.toJSON()));
    } catch {}
    // 装备仓库持久化
    try {
      localStorage.setItem('ih_equip_stash', JSON.stringify(serializeStash()));
    } catch {}
    } catch {}
    try { renderer.showSaveIndicator(); } catch {}
    if (reason) console.log('[AutoSave]', reason);
  } catch (e) {
    console.warn('[AutoSave] failed:', e);
  }
}
let gameLoopRunning = false; // 防止gameLoop重复启动

// ── 初始化 ──

// ═══════════════════════════════════════════════════════════
// 装备比较面板 — 让玩家选择保留或替换
// ═══════════════════════════════════════════════════════════
function _showEquipCompare(current, newEquip, slot, itemEntity) {
  const overlay = document.getElementById('ui-overlay');
  const p = gameState.player;
  
  function statLine(label, curVal, newVal) {
    curVal = curVal || 0;
    newVal = newVal || 0;
    const diff = newVal - curVal;
    const color = diff > 0 ? '#44ff88' : diff < 0 ? '#ff4444' : '#888';
    const sign = diff > 0 ? '+' : '';
    return '<tr><td style="color:#aaa;">' + label + '</td>' +
      '<td style="text-align:right;color:#888;">' + curVal + '</td>' +
      '<td style="text-align:center;font-size:11px;">→</td>' +
      '<td style="text-align:right;color:' + color + ';">' + newVal +
      (diff !== 0 ? ' (' + sign + diff + ')' : '') + '</td></tr>';
  }

  const qColorCur = getQualityColor(current.quality) || '#aaa';
  const qColorNew = getQualityColor(newEquip.quality) || '#aaa';
  const qNameCur = current.quality ? getQualityName(current.quality) : '';
  const qNameNew = newEquip.quality ? getQualityName(newEquip.quality) : '';
  const slotLabel = { weapon: '⚔ 武器', armor: '🛡 护甲', accessory: '💍 饰品' }[slot] || slot;

  overlay.innerHTML = `
    <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.85);
      display:flex;align-items:center;justify-content:center;" id="equip-compare-backdrop">
      <div style="background:rgba(10,10,20,0.97);border:1px solid #555;border-radius:16px;
        padding:24px;max-width:500px;width:90%;">
        <h3 style="text-align:center;color:#ffcc44;letter-spacing:3px;margin-bottom:16px;">
          ${slotLabel} 替换确认
        </h3>
        <div style="display:grid;grid-template-columns:1fr auto 1fr;gap:8px;align-items:start;">
          <div style="background:rgba(255,100,100,0.06);border:1px solid rgba(255,100,100,0.2);
            border-radius:10px;padding:12px;">
            <p style="color:#ff8866;font-size:12px;margin-bottom:6px;">当前装备</p>
            <p style="color:${qColorCur};font-weight:bold;font-size:13px;">
              ${qNameCur ? '[' + qNameCur + '] ' : ''}${current.displayName || current.name}
            </p>
          </div>
          <div style="display:flex;align-items:center;color:#666;font-size:20px;">→</div>
          <div style="background:rgba(68,255,100,0.06);border:1px solid rgba(68,255,100,0.2);
            border-radius:10px;padding:12px;">
            <p style="color:#44ff88;font-size:12px;margin-bottom:6px;">新装备</p>
            <p style="color:${qColorNew};font-weight:bold;font-size:13px;">
              ${qNameNew ? '[' + qNameNew + '] ' : ''}${newEquip.displayName || newEquip.name}
            </p>
          </div>
        </div>
        
        <table style="width:100%;margin:12px 0;font-size:13px;border-collapse:collapse;">
          ${statLine('ATK', current.atk, newEquip.atk)}
          ${statLine('DEF', current.def, newEquip.def)}
          ${statLine('MaxHP', current.maxHp, newEquip.maxHp)}
          ${statLine('SPD', current.spd, newEquip.spd)}
          ${statLine('CRT', current.crt, newEquip.crt)}
        </table>

        ${newEquip.affixes?.suffix ? '<p style="color:#4488ff;font-size:12px;text-align:center;margin-bottom:12px;">✦ ' + newEquip.affixes.suffix.desc + '</p>' : ''}

        <div style="display:flex;gap:12px;justify-content:center;margin-top:8px;">
          <button id="btn-equip-new" style="background:rgba(68,255,100,0.15);border:2px solid #44ff88;
            color:#44ff88;padding:10px 24px;cursor:pointer;font-size:14px;font-weight:bold;
            font-family:inherit;border-radius:8px;">✓ 装备新的</button>
          <button id="btn-stash-old" style="background:rgba(255,204,68,0.12);border:1px solid #ffcc4455;
            color:#ffcc44;padding:10px 24px;cursor:pointer;font-size:14px;
            font-family:inherit;border-radius:8px;">📦 存入仓库</button>
          <button id="btn-keep-old" style="background:rgba(100,100,100,0.1);border:1px solid #555;
            color:#888;padding:10px 24px;cursor:pointer;font-size:14px;
            font-family:inherit;border-radius:8px;">✗ 分解旧的</button>
        </div>
        <p style="color:#444;font-size:10px;text-align:center;margin-top:8px;">1 = 装备新的 · 2 = 存入仓库 · 3 = 分解旧的</p>
      </div>
    </div>
  `;

  const close = () => {
    overlay.innerHTML = '';
    document.removeEventListener('keydown', kh);
  };

  document.getElementById('btn-equip-new').addEventListener('click', () => {
    // Store old equipment in stash if there's room
    if (!isStashFull()) {
      addToStash(p[slot]);
    }
    p[slot] = newEquip;
    renderer.addFloatText('装备替换: ' + (newEquip.displayName || newEquip.name), 
      itemEntity.x, itemEntity.y, 'rgb(68, 255, 100)');
    close();
  });

  document.getElementById('btn-stash-old')?.addEventListener('click', () => {
    if (isStashFull()) {
      renderer.addFloatText('仓库已满', itemEntity.x, itemEntity.y, 'rgb(255, 100, 100)');
      return;
    }
    addToStash(p[slot]);
    p[slot] = newEquip;
    renderer.addFloatText('旧装备已存入仓库', itemEntity.x, itemEntity.y, 'rgb(255, 204, 68)');
    close();
  });

  document.getElementById('btn-keep-old').addEventListener('click', () => {
    // 卖掉新装备获得金币
    const sellGold = Math.floor((newEquip.atk || 0) + (newEquip.def || 0) * 2 + (newEquip.maxHp || 0) / 5) * 3 + 10;
    p.gold = (p.gold || 0) + sellGold;
    gameState.stats.goldEarned = (gameState.stats.goldEarned || 0) + sellGold;
    renderer.addFloatText('分解: +' + sellGold + 'G', itemEntity.x, itemEntity.y, 'rgb(255, 204, 68)');
    close();
  });

  const kh = (e) => {
    if (e.key === '1') document.getElementById('btn-equip-new')?.click();
    if (e.key === '2') document.getElementById('btn-stash-old')?.click();
    if (e.key === '3') document.getElementById('btn-keep-old')?.click();
    if (e.key === 'Escape') document.getElementById('btn-keep-old')?.click();
  };
  document.addEventListener('keydown', kh);
}

// ═══════════════════════════════════════════════════════════
// 挑战副本战斗循环
// ═══════════════════════════════════════════════════════════
function _showChallengePreBattle(overlay, enemy, challenge) {
  const p = gameState.player;
  const preview = previewBattle(p, enemy);

  overlay.innerHTML = `
    <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(5,5,15,0.95);overflow-y:auto;padding:30px;">
      <div style="max-width:600px;margin:0 auto;">
        <h2 style="text-align:center;color:#ff4444;letter-spacing:4px;margin-bottom:8px;">
          ⚔ ${challenge.name} — 第${challengeState.currentWave}波
        </h2>
        <p style="text-align:center;color:#888;font-size:12px;margin-bottom:20px;">
          累积奖励: ${challengeState.totalRewards.exp}EXP / ${challengeState.totalRewards.gold}G
        </p>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;">
          <div style="background:rgba(68,170,255,0.08);border:1px solid rgba(68,170,255,0.2);border-radius:10px;padding:16px;">
            <h3 style="color:#44aaff;font-size:14px;margin-bottom:8px;">你的状态</h3>
            <p style="color:#aaa;font-size:13px;line-height:2;">
              HP: ${p.hp}/${p.maxHp}<br>
              ATK:${p.atk} DEF:${p.def} SPD:${p.spd || 5}
            </p>
          </div>
          <div style="background:rgba(255,68,68,0.08);border:1px solid rgba(255,68,68,0.2);border-radius:10px;padding:16px;">
            <h3 style="color:#ff4444;font-size:14px;margin-bottom:8px;">${enemy.sprite || '👹'} ${enemy.name}</h3>
            <p style="color:#aaa;font-size:13px;line-height:2;">
              HP:${enemy.hp} ATK:${enemy.atk} DEF:${enemy.def} SPD:${enemy.spd || 5}
              ${enemy.damageType ? '<br>属性: ' + enemy.damageType : ''}
              ${enemy.weaknesses?.length ? '<br>弱点: ' + enemy.weaknesses.join(', ') : ''}
            </p>
          </div>
        </div>

        <div style="text-align:center;margin-bottom:20px;">
          <p style="color:${preview.canWin ? '#44ff88' : '#ff4444'};font-size:14px;">
            预测: ${preview.canWin ? '✓ 可以胜利 (~' + preview.turnsNeeded + '回合)' : '✗ 可能失败'}
          </p>
        </div>

        <div style="display:flex;gap:12px;justify-content:center;">
          <button id="ch-fight" style="background:#cc2222;color:white;border:none;padding:12px 30px;border-radius:8px;cursor:pointer;font-size:15px;">
            ⚔ 战斗
          </button>
          <button id="ch-retreat" style="background:#444;color:#aaa;border:1px solid #555;padding:12px 30px;border-radius:8px;cursor:pointer;font-size:15px;">
            🏃 撤退 (保留70%奖励)
          </button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('ch-fight').addEventListener('click', () => {
    _executeChallengeRound(overlay, enemy, challenge);
  });

  document.getElementById('ch-retreat').addEventListener('click', () => {
    const rewards = challengeState.endChallenge('retreat');
    _showChallengeResults(overlay, rewards, 'retreat', challenge);
  });
}

function _executeChallengeRound(overlay, enemy, challenge) {
  const result = executeBattle(enemy);
  
  if (result.victory) {
    challengeState.recordVictory(enemy);
    
    // 恢复部分HP（挑战副本给10%回血）
    const p = gameState.player;
    const healAmt = Math.floor(p.maxHp * 0.1);
    p.hp = Math.min(p.maxHp, p.hp + healAmt);

    // 获取下一个敌人
    const nextEnemy = challengeState.getNextEnemy();
    if (nextEnemy) {
      _showChallengePreBattle(overlay, nextEnemy, challenge);
    } else {
      const rewards = challengeState.endChallenge('complete');
      _showChallengeResults(overlay, rewards, 'complete', challenge);
    }
  } else {
    const rewards = challengeState.endChallenge('defeat');
    _showChallengeResults(overlay, rewards, 'defeat', challenge);
  }
}

function _showChallengeResults(overlay, rewards, reason, challenge) {
  const reasonText = { complete: '🎉 挑战完成！', defeat: '💀 战斗失败', retreat: '🏃 战略撤退' };
  const reasonColor = { complete: '#44ff88', defeat: '#ff4444', retreat: '#ffaa44' };

  overlay.innerHTML = `
    <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:rgba(5,5,15,0.95);display:flex;align-items:center;justify-content:center;">
      <div style="max-width:500px;text-align:center;">
        <h2 style="color:${reasonColor[reason] || '#fff'};letter-spacing:4px;margin-bottom:16px;">
          ${reasonText[reason] || '挑战结束'}
        </h2>
        <p style="color:#888;font-size:14px;margin-bottom:24px;">
          ${challenge.name} — 到达第${challengeState.currentWave}波
        </p>

        <div style="background:rgba(255,255,255,0.03);border:1px solid #333;border-radius:10px;padding:20px;margin-bottom:24px;">
          <h3 style="color:#ffcc44;margin-bottom:12px;">📦 获得奖励</h3>
          <p style="color:#aaa;font-size:15px;line-height:2;">
            经验值: <strong style="color:#aa88ff;">+${rewards.exp}</strong><br>
            金币: <strong style="color:#ffcc44;">+${rewards.gold}G</strong><br>
            ${rewards.rewardPoints > 0 ? '奖励点: <strong style="color:#ff8844;">+' + rewards.rewardPoints + 'RP</strong>' : ''}
          </p>
          ${reason === 'defeat' || reason === 'retreat' ? '<p style="color:#ff8844;font-size:12px;margin-top:8px;">（因未完成扣除30%奖励）</p>' : ''}
        </div>

        <button id="ch-close" style="background:#333;color:#e0e0e0;border:1px solid #555;padding:12px 40px;border-radius:8px;cursor:pointer;font-size:15px;">
          返回主神空间
        </button>
      </div>
    </div>
  `;

  document.getElementById('ch-close').addEventListener('click', () => {
    // 发放奖励
    autoSave('挑战副本结束');
    eventBus.emit('challenge:end', { rewards, reason, type: challenge.type, wave: challengeState.currentWave });
    // 返回主神空间
    // renderLordGodSpace is imported at module scope
    if (typeof renderLordGodSpace === 'function') {
      renderLordGodSpace(window._onLordGodClose);
    } else {
      overlay.innerHTML = '';
    }
  });
}




window.addEventListener('load', async () => {
  const canvas = document.getElementById('game-canvas');
  renderer = new Renderer(canvas);

  const fill = document.querySelector('#loading-bar .fill');
  const loadingText = document.querySelector('#loading-screen .loading-text');
  
  // 加载提示
  const LOADING_TIPS = [
    '💡 悬停敌人可查看战斗预判',
    '💡 按H查看完整操作指南',
    '💡 基因锁(G键)在关键战斗前记得激活',
    '💡 战前按Q使用增益药剂',
    '💡 装备仓库(B键)可存放替换的装备',
    '💡 隐藏房间中常有稀有物品',
    '💡 注意敌人弱点属性，克制伤害翻倍',
    '💡 商人NPC(🏪)出售独家道具',
    '💡 同伴关系越高，战斗加成越强',
    '💡 连杀不断可获得额外奖励',
    '💡 按J查看成就，收集隐藏成就',
    '💡 T键打开战斗统计面板',
    '💡 C键打开知识典籍——查看世界观和同伴档案',
    '💡 F键查看战斗回放——回顾每场战斗的详细过程',
    '💡 精英怪(◆标记)更强但奖励更丰厚',
    '💡 传说级(★)精英怪有3个词缀和5倍奖励',
    '💡 状态效果会在屏幕左上角显示——注意持续时间',
    '💡 难度会根据你的表现动态微调',
    '💡 通关后可解锁无尽深渊模式',
    '💡 每天有不同的每日挑战——相同日期相同关卡',
    '💡 按R查看同伴关系——高关系同伴提供强力战斗支援',
    '💡 锻造可以将低品质装备升级为高品质',
    '💡 天赋树有三条路线——战斗/生存/技巧,选择你的风格',
  ];
  let tipIdx = 0;
  const tipInterval = setInterval(() => {
    if (loadingText) loadingText.textContent = LOADING_TIPS[tipIdx % LOADING_TIPS.length];
    tipIdx++;
  }, 2000);
  
  // 实际加载资产
  fill.style.width = '30%';
  await assetLoader.loadAll();
  fill.style.width = '100%';
  clearInterval(tipInterval);
  
  setTimeout(() => {
    document.getElementById('loading-screen').classList.add('hidden');
    // 注入UI面板共享上下文
    initPanelContext({
      renderer,
      bestiary,
      combatHistory,
      get chapter() { return chapter; },
      get currentFloorIndex() { return currentFloorIndex; },
      get entities() { return entities; },
      loreTracker,
      milestoneTracker,
    });
    showMainMenu();
  }, 500);
});

// ── 里程碑弹窗 ──
let _milestoneTimeout = null;
function showMilestonePopup(milestone) {
  if (_milestoneTimeout) return; // 已有弹窗
  const popup = document.createElement('div');
  popup.style.cssText = `
    position: fixed; top: 60px; right: 20px; z-index: 9999;
    background: rgba(10,10,20,0.95); border: 1px solid ${milestone.color};
    border-radius: 12px; padding: 16px 24px; min-width: 200px;
    box-shadow: 0 0 30px ${milestone.color}44;
    transform: translateX(300px); transition: transform 0.4s ease;
    font-family: "Microsoft YaHei", sans-serif;
  `;
  popup.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;">
      <span style="font-size:28px;">${milestone.icon}</span>
      <div>
        <div style="color:${milestone.color};font-weight:bold;font-size:14px;letter-spacing:2px;">🏆 成就解锁</div>
        <div style="color:#e0e0e0;font-size:16px;margin-top:2px;">${milestone.name}</div>
        <div style="color:#888;font-size:12px;margin-top:2px;">${milestone.desc}</div>
      </div>
    </div>
  `;
  document.body.appendChild(popup);
  requestAnimationFrame(() => { popup.style.transform = 'translateX(0)'; });
  _milestoneTimeout = setTimeout(() => {
    popup.style.transform = 'translateX(300px)';
    setTimeout(() => { popup.remove(); _milestoneTimeout = null; }, 400);
  }, 3000);
}

function showMainMenu() {
  menuState = 'title';
  gameState.setState(GAME_STATE.MAIN_MENU);

  const overlay = document.getElementById('ui-overlay');
  overlay.innerHTML = `
    <div style="
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      background: url('/assets/scenes/1-1_列车醒来_背景.jpg') center/cover no-repeat;
    ">
    <div style="
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      background: radial-gradient(ellipse at center, rgba(10,10,20,0.75) 0%, rgba(5,5,10,0.95) 100%);
    "></div>
    <div style="position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center;">
      <h1 style="
        font-size: 64px; color: #ff4444; letter-spacing: 12px;
        text-shadow: 0 0 40px rgba(255,68,68,0.4), 0 0 80px rgba(255,68,68,0.2);
        margin-bottom: 8px; font-weight: 900;
      ">无限恐怖</h1>
      <p style="
        font-size: 22px; color: #666; letter-spacing: 8px; margin-bottom: 60px;
      ">中 洲 轮 回</p>

      <button id="btn-new-game" style="
        background: transparent; border: 1px solid #ff4444; color: #ff4444;
        font-size: 18px; padding: 14px 60px; cursor: pointer; letter-spacing: 4px;
        transition: all 0.3s; margin-bottom: 16px; font-family: inherit;
      " onmouseover="this.style.background='rgba(255,68,68,0.15)'"
         onmouseout="this.style.background='transparent'">
        新的轮回
      </button>

      <button id="btn-continue" style="
        background: transparent; border: 1px solid #444; color: #666;
        font-size: 16px; padding: 10px 50px; cursor: pointer; letter-spacing: 4px;
        transition: all 0.3s; font-family: inherit;
      " onmouseover="this.style.borderColor='#888';this.style.color='#aaa'"
         onmouseout="this.style.borderColor='#444';this.style.color='#666'">
        继续轮回
      </button>

      <button id="btn-chapter-select" style="
        background: transparent; border: 1px solid #335; color: #558;
        font-size: 14px; padding: 8px 40px; cursor: pointer; letter-spacing: 3px;
        transition: all 0.3s; font-family: inherit; margin-top: 8px;
      " onmouseover="this.style.borderColor='#66aaff';this.style.color='#88bbff'"
         onmouseout="this.style.borderColor='#335';this.style.color='#558'">
        📖 章节选择
      </button>

      <button id="btn-credits" style="
        background: transparent; border: 1px solid #222; color: #444;
        font-size: 12px; padding: 6px 30px; cursor: pointer; letter-spacing: 2px;
        transition: all 0.3s; font-family: inherit; margin-top: 4px;
      " onmouseover="this.style.color='#888'"
         onmouseout="this.style.color='#444'">
        制作信息
      </button>

      <div style="display:flex; gap:10px; margin-top: 16px;">
        <button id="btn-daily-challenge" style="
          background: transparent; border: 1px solid #ffaa00; color: #ffaa0088;
          font-size: 12px; padding: 6px 20px; cursor: pointer; letter-spacing: 2px;
          transition: all 0.3s; font-family: inherit; border-radius: 6px;
        " onmouseover="this.style.color='#ffaa00';this.style.borderColor='#ffcc44'"
           onmouseout="this.style.color='#ffaa0088';this.style.borderColor='#ffaa00'">
          🎯 每日挑战
        </button>
        <button id="btn-abyss-mode" style="
          background: transparent; border: 1px solid #8844ff; color: #8844ff88;
          font-size: 12px; padding: 6px 20px; cursor: pointer; letter-spacing: 2px;
          transition: all 0.3s; font-family: inherit; border-radius: 6px;
        " onmouseover="this.style.color='#8844ff';this.style.borderColor='#aa66ff'"
           onmouseout="this.style.color='#8844ff88';this.style.borderColor='#8844ff'">
          🕳 无尽深渊
        </button>
      </div>

      <div id="menu-difficulty" style="margin-top: 24px; display: flex; gap: 8px;"></div>

    </div>
      <p style="
        position: absolute; bottom: 30px; font-size: 12px; color: #444;
        letter-spacing: 2px; z-index: 1;
      ">WASD移动 · 碰撞敌人战斗 · 空格互动/对话 · 鼠标悬停查看信息</p>
    </div>
  `;

  
  // ── 标题画面特效 ──
  {
    const titleContainer = overlay.querySelector('div');
    if (titleContainer) {
      const titleH1 = titleContainer.querySelector('h1');
      if (titleH1) titleH1.classList.add('title-fx-glow');
      const subtitle = titleContainer.querySelector('p');
      if (subtitle) subtitle.classList.add('title-fx-subtitle');
      // 按钮逐个延迟出现
      const buttons = titleContainer.querySelectorAll('button');
      buttons.forEach((btn, i) => {
        btn.classList.add('title-fx-btn');
        btn.style.animationDelay = `${0.8 + i * 0.15}s`;
      });
      // 粒子效果
      if (typeof window._titleFXCleanup === 'function') window._titleFXCleanup();
      window._titleFXCleanup = initTitleFX(overlay.firstElementChild);
    }
  }

document.getElementById('btn-new-game').addEventListener('click', () => {
    showOpeningCutscene(() => startNewGame());
  });

  // 章节选择
  document.getElementById('btn-chapter-select')?.addEventListener('click', () => {
    _showChapterSelectMenu();
  });
  // 制作信息
  document.getElementById('btn-credits')?.addEventListener('click', _showCredits);
  
  // 每日挑战
  document.getElementById('btn-daily-challenge')?.addEventListener('click', () => {
    _showDailyChallengeMenu();
  });
  
  // 无尽深渊
  document.getElementById('btn-abyss-mode')?.addEventListener('click', () => {
    _showAbyssMenu();
  });
  // Check if save exists and update continue button
  const saveKey = 'infinite_horror_save_0';
  const saveData = localStorage.getItem(saveKey);
  
  // 难度选择按钮 — 渲染+绑定
  const diffContainer = document.getElementById('menu-difficulty');
  if (diffContainer) {
    function renderDiffButtons() {
      diffContainer.innerHTML = Object.entries(DIFFICULTY_CONFIG).map(([id, cfg]) => {
        const active = getDifficulty() === id;
        return '<button class="diff-btn" data-diff="' + id + '" style="' +
          'background:' + (active ? 'rgba(255,255,255,0.1)' : 'transparent') + ';' +
          'border:1px solid ' + (active ? cfg.color : '#333') + ';' +
          'color:' + (active ? cfg.color : '#555') + ';' +
          'font-size:12px;padding:6px 14px;cursor:pointer;' +
          'border-radius:4px;font-family:inherit;transition:all 0.2s;' +
          '">' + cfg.icon + ' ' + cfg.name + '</button>';
      }).join('');
      diffContainer.querySelectorAll('.diff-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          setDifficulty(btn.dataset.diff);
          renderDiffButtons();
        });
      });
    }
    renderDiffButtons();
  }

  const btnCont = document.getElementById('btn-continue');
  if (saveData) {
    try {
      const save = JSON.parse(saveData);
      const chapterFloors = {
        1: ['列车醒来', '蜂巢入口', '红后机房', '激光通道', '丧尸巢穴', '六小时回归'],
        2: ['飞船封锁', '新人分队', '通风管潜行', '抱脸虫隔离', '巢穴救援', '皇后与撤离'],
        3: ['宅邸触发诅咒', '第一夜分散', '佛经线索', '新人冲突', '楚轩录像', '七波诅咒终战'],
        4: ['沙漠车队', '开罗情报', '陵墓机关', '印洲队伏击', '复活真经争夺', '伊莫顿与团战终局'],
        5: ['高速巴士异变', '连锁事故救援', '死神征兆分析', '队友被精神控制', '郑吒对全队考验', '张杰告别与队长确认'],
        6: ['实验船醒来', '新人筛选', '感染隔离', '水下通道', '程啸救援', '新生异形与逃生艇'],
        7: ['浣熊市降临', '保护剧情人物', '恶魔队信号', '分队撤离', '团灭危机', '郑吒复活与誓言'],
        8: ['返回陵墓', '复活楚轩', '侏罗纪降临', '新人罗甘道', '暴龙与撤离', '巨龙血战与负点结算'],
        9: ['陵墓复活仪式', '主神十日整备', '军事基地', '虫潮守线', '多队博弈', '脑虫捕获撤离'],
        10: ['偷袭生化取样', '三人复活', '魔戒会议', '五队接触', '魔多战场', '团战结算'],
        11: ['变形金刚与罗甘道之死', '猛鬼街梦层', '郑吒自杀破心魔', '神鬼复活仪式', '天煞队长再确认', '龙骑士与完美风暴整备'],
        12: ['最终规则公布', '楚轩分队布局', '亚当补全战线', '队员接力牺牲', '郑吒对复制体', '三人存活与结局'],
      };
      const ch = save.chapter || 1;
      const floors = chapterFloors[ch] || chapterFloors[1];
      const floorName = floors[save.nodeIndex] || '未知';
      btnCont.innerHTML = '继续轮回<br><span style="font-size:11px;color:#888;">' + ch + '-' + (save.nodeIndex + 1) + ' ' + floorName + ' · Lv.' + save.player.level + '</span>';
      btnCont.style.borderColor = '#888';
      btnCont.style.color = '#aaa';
    } catch(e) {}
  }

  btnCont.addEventListener('click', () => {
    if (gameState.load(0)) {
      try { const ms = localStorage.getItem('ih_milestones'); if (ms) milestoneTracker.fromJSON(JSON.parse(ms)); } catch {}
      try { const lr = localStorage.getItem('ih_lore'); if (lr) loreTracker.fromJSON(JSON.parse(lr)); } catch {}
      try { const tt = localStorage.getItem('ih_tutorial'); if (tt) tutorialManager.fromJSON(JSON.parse(tt)); } catch {}
      try { if (window._miniMap) { const mm = localStorage.getItem('ih_minimap'); if (mm) window._miniMap.fromJSON(JSON.parse(mm)); } } catch {}
      try { const br = localStorage.getItem('ih_bestiary'); if (br) bestiary.fromJSON(JSON.parse(br)); } catch {}
      try { const ng = localStorage.getItem('ih_ngplus'); if (ng) ngPlusState.fromJSON(JSON.parse(ng)); } catch {}
      try { const st = localStorage.getItem('ih_stance'); if (st) restoreStance(st); } catch {}
      try { const cs = localStorage.getItem('ih_challenge'); if (cs) challengeState.fromJSON(JSON.parse(cs)); } catch {}
      try { const ks = localStorage.getItem('ih_streak'); if (ks) killStreak.fromJSON(JSON.parse(ks)); } catch {}
      try { const fg = localStorage.getItem('ih_fog'); if (fg) fogOfWar.fromJSON(JSON.parse(fg)); } catch {}
      // 设置恢复：难度 + 音量
      try {
        const st = localStorage.getItem('ih_settings');
        if (st) {
          const settings = JSON.parse(st);
          if (settings.difficulty) setDifficulty(settings.difficulty);
          if (settings.volume !== undefined && audioEngine.masterGain) {
            try { audioEngine.masterGain.gain.value = settings.volume; } catch {}
          }
        }
      } catch {}
      // 随机遭遇恢复
      try {
        const enc = localStorage.getItem('ih_encounters');
        if (enc) randomEncounterManager.fromJSON(JSON.parse(enc));
      // 成就恢复
      try {
        const ach = localStorage.getItem('ih_achievements');
        if (ach) achievementTracker.fromJSON(JSON.parse(ach));
      } catch {}
    // 装备仓库恢复
    try {
      const stashData = localStorage.getItem('ih_equip_stash');
      if (stashData) deserializeStash(JSON.parse(stashData));
    } catch {}
    try { const _eliteData = localStorage.getItem('ih_elite'); if (_eliteData) deserializeEliteStats(JSON.parse(_eliteData)); } catch {}
    try { const _bhData = localStorage.getItem('ih_battle_history'); if (_bhData) deserializeBattleHistory(JSON.parse(_bhData)); } catch {}
    try { const _seData = localStorage.getItem('ih_status_effects'); if (_seData) deserializeEffects(JSON.parse(_seData)); } catch {}
    try { const _ddData = localStorage.getItem('ih_dynamic_diff'); if (_ddData) deserializeDynamicDifficulty(JSON.parse(_ddData)); } catch {}
    try { const _grData = localStorage.getItem('ih_growth'); if (_grData) deserializeGrowth(JSON.parse(_grData)); } catch {}
    try { const _abData = localStorage.getItem('ih_abyss'); if (_abData) deserializeAbyss(JSON.parse(_abData)); } catch {}
    try { const _dlData = localStorage.getItem('ih_daily'); if (_dlData) deserializeDaily(JSON.parse(_dlData));    } catch {}
      } catch {}
      const chapterGens = { 1: generateChapter1, 2: generateChapter2, 3: generateChapter3, 4: generateChapter4, 5: generateChapter5, 6: generateChapter6, 7: generateChapter7, 8: generateChapter8, 9: generateChapter9, 10: generateChapter10, 11: generateChapter11, 12: generateChapter12 };
      const gen = chapterGens[gameState.chapter] || generateChapter1;

      // 显示"上回轮回"回顾
      const recapHTML = generateRecapHTML(gameState.chapter, gameState.choices);
      if (recapHTML) {
        const overlay = document.getElementById('ui-overlay');
        overlay.innerHTML = `
          <div style="position:absolute;top:0;left:0;right:0;bottom:0;
            display:flex;flex-direction:column;align-items:center;justify-content:center;
            background:rgba(0,0,0,0.95);overflow-y:auto;padding:40px 20px;
            animation:cutsceneFadeIn 0.8s ease;">
            ${recapHTML}
            <button id="btn-resume-game" style="
              margin-top:24px;background:transparent;border:1px solid #ff4444;
              color:#ff4444;padding:12px 50px;cursor:pointer;font-size:16px;
              letter-spacing:4px;font-family:inherit;border-radius:8px;
              transition:all 0.3s;"
              onmouseover="this.style.background='rgba(255,68,68,0.15)'"
              onmouseout="this.style.background='transparent'">
              继续轮回
            </button>
          </div>
          <style>@keyframes cutsceneFadeIn{from{opacity:0}to{opacity:1}}</style>
        `;
        document.getElementById('btn-resume-game').addEventListener('click', () => {
          audioEngine.init();
          audioEngine.resume();
          audioEngine.startAmbience();
          menuState = 'playing';
          overlay.innerHTML = '';
          combatAnimator = new CombatAnimator(renderer);

  // 迷你地图
  if (!window._miniMap) {
    window._miniMap = new MiniMap();
    window._miniMap.init(document.getElementById('game-container') || document.body);
  }
  window._miniMap.reset();
          chapter = gen();
          currentFloorIndex = gameState.nodeIndex || 0;
          loadFloor(currentFloorIndex);
          gameState.setState(GAME_STATE.EXPLORING);
          gameStarted = true;
          if (!gameLoopRunning) { gameLoopRunning = true; gameLoop(); }
        });
      } else {
        audioEngine.init();
        audioEngine.resume();
        audioEngine.startAmbience();
        menuState = 'playing';
        document.getElementById('ui-overlay').innerHTML = '';
        combatAnimator = new CombatAnimator(renderer);
        chapter = gen();
        currentFloorIndex = gameState.nodeIndex || 0;
        loadFloor(currentFloorIndex);
        gameState.setState(GAME_STATE.EXPLORING);
        gameStarted = true;
        if (!gameLoopRunning) { gameLoopRunning = true; gameLoop(); }
      }
    } else {
      showOpeningCutscene(() => startNewGame());
    }
  });

  // 主菜单也要渲染背景
  requestAnimationFrame(menuLoop);
}

function menuLoop() {
  if (menuState !== 'title') return;
  renderer.render(null, []);
  requestAnimationFrame(menuLoop);
}

function startNewGame() {
  gameState._chapterClearCounted = false;
  // 重置状态
  gameState.reset();

  // ── NG+ 继承：将上一周目数据应用到新角色 ──
  let ngCarry = null;
  try { const raw = localStorage.getItem('ih_ngplus_carry'); if (raw) ngCarry = JSON.parse(raw); } catch {}
  if (ngCarry && ngCarry.cycle > 0) {
    const p = gameState.player;
    // 等级继承 — 加经验让角色升到继承等级
    if (ngCarry.level > 1) {
      p.level = ngCarry.level;
      p.exp = ngCarry.exp || 0;
      p.expToNext = ngCarry.expToNext || (20 + (ngCarry.level - 1) * 15);
      // 使用 calculateNewGamePlus 预算的属性
      if (ngCarry.maxHp) { p.maxHp = ngCarry.maxHp; p.hp = ngCarry.hp || ngCarry.maxHp; }
      if (ngCarry.atk) p.atk = ngCarry.atk;
      if (ngCarry.def) p.def = ngCarry.def;
    }
    // 金币继承
    if (ngCarry.gold > 0) p.gold = ngCarry.gold;
    // 血统继承
    if (ngCarry.bloodline) p.bloodline = ngCarry.bloodline;
    // 基因锁继承
    if (ngCarry.geneLock > 0) p.geneLock = ngCarry.geneLock;
    // 天赋点继承（重置分配，保留点数）
    if (ngCarry.talentPoints > 0) {
      if (!gameState.talents) gameState.talents = {};
      gameState.talents.points = ngCarry.talentPoints;
    }
    // 武器继承
    if (ngCarry.weapon) p.weapon = ngCarry.weapon;
    // 清除继承数据（只用一次）
    try { localStorage.removeItem('ih_ngplus_carry'); } catch {}
  }

  // 恢复图鉴（NG+保留）
  if (ngCarry && ngCarry.keepBestiary) {
    // bestiary already loaded from localStorage during init, don't reset
  } else {
    // 重置图鉴和难度
    bestiary.fromJSON({});
    try { localStorage.removeItem('ih_bestiary'); } catch {}
  }
  // 恢复线索（NG+保留）
  if (ngCarry && ngCarry.keepLore) {
    // loreTracker already loaded, don't reset
  } else {
    // 重置线索收集
    loreTracker.fromJSON({ discovered: [] });
    try { localStorage.removeItem("ih_lore"); } catch {}
  }

  // 初始道具
  giveStarterConsumables();

  // 初始化音频
  audioEngine.init();
  audioEngine.resume();
  audioEngine.startAmbience();

  // 添加初始队友并建立初始关系
  gameState.addCompanion({ id: 'zhang_jie', name: '张杰', role: '战术领队', alive: true });
  gameState.addCompanion({ id: 'zhan_lan', name: '詹岚', role: '情报分析', alive: true });
  gameState.addCompanion({ id: 'li_xiaoyi', name: '李萧毅', role: '机动支援', alive: true });
  gameState.addCompanion({ id: 'mou_gang', name: '牟钢', role: '防线坚守', alive: true });
  // 初始关系：张杰作为队长+15，其余同伴+5
  changeRelationship('zhang_jie', 'good_decision', gameState.relationships);
  changeRelationship('zhang_jie', 'share_item', gameState.relationships);
  changeRelationship('zhan_lan', 'share_item', gameState.relationships);
  changeRelationship('li_xiaoyi', 'share_item', gameState.relationships);
  changeRelationship('mou_gang', 'share_item', gameState.relationships);

  startGame();
}

function startGame() {
  menuState = 'playing';
  // 新手引导
  tutorialManager.trigger('game_start');
  document.getElementById('ui-overlay').innerHTML = '';
  combatAnimator = new CombatAnimator(renderer);

  chapter = generateChapter1();
  // 初始化大气效果
  atmosphereRenderer.setChapter(1);
  currentFloorIndex = gameState.nodeIndex || 0;
  loadFloor(currentFloorIndex);

  gameState.setState(GAME_STATE.EXPLORING);
  gameStarted = true;

  // 监听升级音效（只注册一次）
  if (!window._levelupListenerRegistered) {
    window._levelupListenerRegistered = true;
    eventBus.on('player:levelup', () => {
      audioEngine.playLevelUp();
      autoSave('升级到Lv.' + gameState.player.level);
      tutorialManager.trigger('first_level_up');
      try { checkGrowthMilestones(milestoneTracker, gameState.player); } catch {}
      const p = gameState.player;
      renderer.addFloatText('LEVEL UP!', p.x, p.y - 1.5, 'rgb(255, 215, 0)');
      renderer.addFloatText('Lv.' + p.level, p.x, p.y - 2, 'rgb(255, 255, 150)');
      renderer.addParticle(
        p.x * TILE_SIZE + TILE_SIZE / 2,
        p.y * TILE_SIZE + TILE_SIZE / 2,
        'rgb(255, 215, 0)', 20
      );
      renderer.shake(4, 300);
      renderer.flash('rgba(255, 215, 0)', 300);
      renderer.notify(
        'Lv.' + p.level + ' 升级！HP+' + Math.floor(8 + p.level * 1.5) + ' ATK+2 DEF+1',
        'rgb(255, 215, 0)', 120
      );
    });
  }

  // 关系变化通知
  if (!window._relationshipListenerRegistered) {
    window._relationshipListenerRegistered = true;
    
  // ── 挑战副本入口 ──
  eventBus.on('challenge:request', (data) => {
    const { challenge } = data;
    const overlay = document.getElementById('ui-overlay');
    if (!overlay) return;

    const enemy = challengeState.startChallenge(
      challenge.type, gameState.chapter
    );
    if (!enemy) return;

    // 显示挑战战前面板
    _showChallengePreBattle(overlay, enemy, challenge);
  });

  eventBus.on('challenge:end', (data) => {
    // 结算奖励
    const p = gameState.player;
    p.exp += data.rewards.exp;
    p.rewardPoints = (p.rewardPoints || 0) + data.rewards.rewardPoints;
    gameState.player.gold = (gameState.player.gold || 0) + data.rewards.gold;
    gameState.stats.goldEarned = (gameState.stats.goldEarned || 0) + data.rewards.gold;

    // 检查升级
    while (p.exp >= p.expToNext) {
      p.exp -= p.expToNext;
      p.level++;
      p.expToNext = 20 + (p.level - 1) * 15;
      p.maxHp += 12;
      p.hp = p.maxHp;
      p.atk += 2;
      p.def += 1;
    }

    try { localStorage.setItem('ih_challenge', JSON.stringify(challengeState.toJSON()));
    localStorage.setItem('ih_elite', JSON.stringify(serializeEliteStats()));
    localStorage.setItem('ih_battle_history', JSON.stringify(serializeBattleHistory()));
    localStorage.setItem('ih_status_effects', JSON.stringify(serializeEffects()));
    localStorage.setItem('ih_dynamic_diff', JSON.stringify(serializeDynamicDifficulty()));
    localStorage.setItem('ih_growth', JSON.stringify(serializeGrowth())); } catch {}
    try { localStorage.setItem('ih_streak', JSON.stringify(killStreak.toJSON())); } catch {}
    localStorage.setItem('ih_abyss', JSON.stringify(serializeAbyss()));
    localStorage.setItem('ih_daily', JSON.stringify(serializeDaily()));    try { localStorage.setItem('ih_fog', JSON.stringify(fogOfWar.toJSON())); } catch {}
  });

  eventBus.on('relationship:change', (data) => {
      if (data.levelChanged) {
        const color = getRelationshipLevel(data.newValue).color;
        const profile = COMPANION_PROFILES[data.companionId];
        const name = profile?.name || data.companionId;
        renderer.addFloatText(`${name} → ${data.newLevel}`, gameState.player.x, gameState.player.y - 2, color);
        if (data.newLevel === '羁绊') {
          renderer.shake(6, 500);
          renderer.flash('rgba(255, 170, 0, 0.3)', 500);
          renderer.notify(`✦ ${name}的羁绊回忆已解锁！`, '#ffaa00', 180);
        }
      }
    });
  }

  // 里程碑通知轮询
  if (!window._milestonePollerRegistered) {
    window._milestonePollerRegistered = true;
    setInterval(() => {
      if (milestoneTracker.hasNotifications()) {
        const ms = milestoneTracker.getNextNotification();
        if (ms) showMilestonePopup(ms);
      }
    }, 1500);
  }

  // 启动游戏循环
  if (!gameLoopRunning) {
    gameLoopRunning = true;
    requestAnimationFrame(gameLoop);
  }
}

function loadFloor(index, isAdvancing) {
  if (isAdvancing && index > 0) gameState.stats.floorsCleared++;
  if (index >= chapter.floors.length) {
    // 所有层完成 — 进入主神空间
    showChapterComplete();
    return;
  }

  // 屏幕过渡
  if (renderer) renderer.fadeOut(0.08);
  try {
    const floorInfo = chapter.floors[index];
    if (floorInfo) floorTransition(document.getElementById("ui-overlay"), {
      floorName: floorInfo.name || (""),
      duration: 1000,
    });
  } catch {}

  currentFloorIndex = index;
  gameState.nodeIndex = index;
  const floor = chapter.floors[index];
  try { if (floor.theme) atmosphereRenderer.setFloorTheme(floor.theme); } catch {}

  // ── 环境叙事文本（进入新楼层时触发） ──
  try {
    const ch = gameState.chapter || 1;
    const ambientTexts = {
      1: ['空气中弥漫着刺鼻的化学气味...', '墙壁上的灯管不断闪烁', '远处传来低沉的咆哮声', '地面上有拖拽痕迹', 'T病毒的气息无处不在'],
      2: ['飞船的金属走廊发出轻微的振动', '黏液从天花板上缓缓滴落', '通风管道中传来窸窣的爬行声', '异形的酸血腐蚀出的印记随处可见'],
      3: ['走廊尽头隐约传来孩童的哭声', '墙上的日历停在了那个不祥的日子', '空气突然变得冰冷刺骨', '黑暗中似乎有什么在注视着你'],
      4: ['古老的符文在墙壁上微微发光', '沙尘从裂缝中不断涌入', '棺椁上的封印已经破损', '法老的诅咒如影随形'],
      5: ['黑色的死神之翼掠过天际', '命运之书上的文字在变化', '无数灵魂在虚空中哀嚎', '时间在这里仿佛静止了'],
      6: ['异形的巢穴比之前更加庞大', '进化后的异形留下了更深的爪痕', '墙壁在蠕动，像是活着的组织'],
      7: ['地狱之门的裂隙在扩大', '恶魔的低语在脑海中回响', '魔法的余波扭曲着现实'],
      8: ['中洲的废墟上开始生长新芽', '风中带着希望的气息', '但和平的表象下暗流涌动'],
      9: ['星际飞船的引擎发出低沉的轰鸣', '舷窗外是无尽的星海', '未知的信号从深空传来'],
      10: ['五支轮回小队的气息交织在一起', '空气中充满了杀意和警惕', '同盟和背叛只在一念之间'],
      11: ['心魔的低语越来越清晰', '你的恐惧在这里具象化了', '突破的时刻即将到来'],
      12: ['最终的战场在眼前展开', '所有的轮回在此刻汇聚', '主神的真相即将揭开'],
    };
    const texts = ambientTexts[ch] || ambientTexts[1];
    const text = texts[Math.floor(Math.random() * texts.length)];
    setTimeout(() => {
      try { renderer.notify(text, 'rgb(120, 120, 100)', 200); } catch {}
    }, 500);
  } catch {}
  gameState.player.x = floor.playerStart.x;
  gameState.player.y = floor.playerStart.y;

  // 实例化实体（保留原始maxHp，过滤已移除的）
  const removedIds = gameState.getRemovedEntityIds(index);
  entities = floor.entities
    .filter(e => !removedIds.has(e.id))
    .map(e => {
      let clone = { ...e };
      if (clone.hp !== undefined) clone._maxHp = clone.hp;
      // 精英怪物升级
      if (clone.type === ENTITY_TYPE.ENEMY && !clone.isBoss && !clone.boss) {
        clone = tryUpgradeToElite(clone, gameState.chapter || 1, getDifficulty());
        if (clone._eliteTier) clone._maxHp = clone.hp;
      }
      return clone;
    });

  // 恢复已破坏的密道状态（存档持久化）
  restoreBrokenSecrets(floor, gameState.chapter, index);

  // 自动保存 — 进入新楼层
  if (index > 0) autoSave('进入 ' + (floor.name || ('第' + (index+1) + '层')));

  // 更新迷雾视野
  fogOfWar.updateVision(index, floor.playerStart.x, floor.playerStart.y);
  // 延迟淡入
  setTimeout(() => { if (renderer) renderer.fadeIn(0.04); }, 500);

  // 显示楼层标题
  showFloorTitle(floor);
}

function showFloorTitle(floor) {
  const sceneBgMap = {
    '1-1': '/assets/scenes/1-1_列车醒来_背景.jpg',
    '1-2': '/assets/scenes/1-2_蜂巢入口_背景.jpg',
    '1-3': '/assets/scenes/1-3_红后机房_背景.jpg',
    '1-4': '/assets/scenes/1-4_激光走廊_背景.jpg',
    '1-5': '/assets/scenes/1-5_终端控制室_背景.jpg',
    '1-6': '/assets/scenes/1-6_六小时回归_背景.jpg',
    // Ch2 placeholder backgrounds (uses default dark bg if not found)
    '2-1': '', '2-2': '', '2-3': '', '2-4': '', '2-5': '', '2-6': '',
  };
  const bgUrl = sceneBgMap[floor.id] || '';
  const overlay = document.getElementById('ui-overlay');
  overlay.innerHTML = `
    <div id="floor-title" style="
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      background: ${bgUrl ? `url('${bgUrl}') center/cover no-repeat` : 'rgba(0,0,0,0.85)'};
      animation: fadeIn 0.8s;
    ">
      <div style="
        position: absolute; top: 0; left: 0; right: 0; bottom: 0;
        background: radial-gradient(ellipse at center, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.9) 100%);
      "></div>
      <div style="position: relative; z-index: 1; text-align: center;">
        <p style="font-size: 14px; color: #ff4444; letter-spacing: 6px; margin-bottom: 8px;
          text-shadow: 0 0 20px rgba(255,68,68,0.5);">
          ${chapter.name || '第' + gameState.chapter + '章'}
        </p>
        <h2 style="font-size: 42px; color: #e0e0e0; letter-spacing: 8px; margin-bottom: 16px;
          text-shadow: 0 0 30px rgba(255,255,255,0.2);">
          ${floor.id} ${floor.name}
        </h2>
        <div style="width: 200px; height: 1px; background: linear-gradient(90deg, transparent, #ff4444, transparent); margin: 0 auto 16px;"></div>
        <p style="font-size: 16px; color: #aaa; max-width: 600px; text-align: center; line-height: 1.8;
          text-shadow: 0 0 10px rgba(0,0,0,0.8);">
          ${floor.subtitle}
        </p>
      </div>
    </div>
    <style>
      @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
    </style>
  `;
  setTimeout(() => {
    const el = document.getElementById('floor-title');
    if (el) {
      el.style.transition = 'opacity 1s';
      el.style.opacity = '0';
      setTimeout(() => { overlay.innerHTML = ''; }, 1000);
    }
  }, 2500);
}

// ── 游戏失败处理 ──
eventBus.on('player:death', () => {
    // ── 深渊模式死亡 — 显示深渊结算 ──
    if (gameState._abyssActive && isAbyssActive()) {
      const abyssResult = endAbyss('death');
      gameState._abyssActive = false;
      gameStarted = false;
      setTimeout(() => {
        _showAbyssEndScreen(abyssResult);
      }, 500);
      return;
    }
    try { ddRecordDeath(); } catch {}
    killStreak.recordDeath();
  gameStarted = false;
  audioEngine.playDamage();
  renderer.shake(10, 800);

  setTimeout(() => {
    const overlay = document.getElementById('ui-overlay');
    const p = gameState.player;
    const ratingStats = getRatingStats();
    const deathTips = [
      '试试在战前使用回复药剂，满血迎战更有胜算。',
      '切换战斗姿态可以改变战局。防御姿态适合高攻敌人。',
      '别忘了在主神空间购买属性强化和消耗品。',
      '装备词缀中的吸血和荆棘效果可以改变对撞结果。',
      '如果敌人太强，先去探索其他房间收集道具和经验。',
      '连杀加成会随每次击杀提升，保持连胜获得更多收益。',
      '隐藏房间中往往藏着大量属性提升和稀有道具。',
      '注意敌人的弱点属性，携带对应元素装备事半功倍。',
      '基因锁的主动技能有强力Buff效果，记得在主神空间升级。',
      '天赋树的投资会显著改变战斗风格，找到适合你的路线。',
    ];
    const tip = deathTips[Math.floor(Math.random() * deathTips.length)];
    const lastBattle = combatHistory.length > 0 ? combatHistory[combatHistory.length - 1] : null;
    const deathQuotes = [
      '"死亡不过是另一种开始。在主神的世界里，每一次失败都是通往更强大的你的阶梯。"',
      '"只要还有恐惧，就还没有真正的死亡。" —— 楚轩',
      '"人只有在接近死亡时，才能触碰到那个极限。" —— 张杰',
      '"主神空间不养废物，但每个幸存者都曾是废物。" —— 郑吒',
      '"恐惧是最好的老师，它教会你活下去。"',
      '"在这里死去，只是暂时的。真正的死亡，是放弃。"',
    ];
    const quote = deathQuotes[Math.floor(Math.random() * deathQuotes.length)];

    overlay.innerHTML = `
      <div style="
        position: absolute; top: 0; left: 0; right: 0; bottom: 0;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        background: rgba(80, 0, 0, 0.85);
        animation: fadeIn 0.5s;
        overflow-y: auto;
      ">
        <h1 style="font-size: 56px; color: #ff2222; letter-spacing: 8px;
          text-shadow: 0 0 40px rgba(255,34,34,0.6); margin-bottom: 8px;">
          轮 回 终 结
        </h1>
        <p style="color: #cc8888; font-size: 18px; margin-bottom: 24px;">
          郑吒在${chapter.floors[currentFloorIndex]?.name || '未知区域'}中陨落...
        </p>

        <!-- 详细战斗报告 -->
        <div style="display:flex; gap:12px; max-width:520px; width:92%; margin-bottom:16px; flex-wrap:wrap; justify-content:center;">
          <div style="flex:1; min-width:140px; background:rgba(0,0,0,0.5); border:1px solid #aa333360; border-radius:8px; padding:12px; text-align:center;">
            <p style="color:#aa6666; font-size:10px; letter-spacing:2px; margin-bottom:6px;">⚔ 战斗数据</p>
            <p style="color:#ff8866; font-size:20px; font-weight:bold;">${gameState.stats.enemiesKilled}</p>
            <p style="color:#886666; font-size:11px;">敌人击杀</p>
            <p style="color:#cc8888; font-size:12px; margin-top:4px;">${gameState.stats.turnsPlayed} 回合</p>
            ${ratingStats.total > 0 ? '<p style="color:#ffcc44; font-size:11px;">' + ratingStats.S + '个S评级 · 均分' + ratingStats.avgScore + '</p>' : ''}
          </div>
          <div style="flex:1; min-width:140px; background:rgba(0,0,0,0.5); border:1px solid #aa333360; border-radius:8px; padding:12px; text-align:center;">
            <p style="color:#aa6666; font-size:10px; letter-spacing:2px; margin-bottom:6px;">📊 角色状态</p>
            <p style="color:#6699ff; font-size:20px; font-weight:bold;">Lv.${p.level}</p>
            <p style="color:#886666; font-size:11px;">ATK ${p.atk} · DEF ${p.def}</p>
            <p style="color:#886666; font-size:11px;">${p.activeBloodline !== 'none' ? p.activeBloodline : '无血统'} · 基因锁${p.geneLock || 0}阶</p>
            <p style="color:#ffcc44; font-size:11px;">${p.gold || 0}G · ${gameState.stats.goldEarned || 0}G累计</p>
          </div>
          <div style="flex:1; min-width:140px; background:rgba(0,0,0,0.5); border:1px solid #aa333360; border-radius:8px; padding:12px; text-align:center;">
            <p style="color:#aa6666; font-size:10px; letter-spacing:2px; margin-bottom:6px;">🗺 探索进度</p>
            <p style="color:#44cc88; font-size:20px; font-weight:bold;">${gameState.chapter}-${currentFloorIndex + 1}</p>
            <p style="color:#886666; font-size:11px;">第${gameState.chapter}章 · 第${currentFloorIndex + 1}层</p>
            <p style="color:#886666; font-size:11px;">${gameState.stats.floorsCleared || 0}层已通过</p>
            <p style="color:#886666; font-size:11px;">死亡 ${gameState.stats.deathCount} 次</p>
          </div>
        </div>

        ${lastBattle ? '<div style="background:rgba(0,0,0,0.4); border:1px solid #ff444430; border-radius:8px; padding:10px 16px; max-width:400px; margin-bottom:12px;">' +
          '<p style="color:#ff6644; font-size:11px; margin-bottom:4px;">最后一战: vs ' + lastBattle.enemy + '</p>' +
          '<p style="color:#886666; font-size:11px;">' + lastBattle.rounds + '回合 · ' + (lastBattle.victory ? '✓胜利' : '✗落败') +
          (lastBattle.rating ? ' · <span style="color:' + lastBattle.rating.color + '">' + lastBattle.rating.grade + '级</span>' : '') + '</p></div>' : ''}

        <!-- 战斗提示 -->
        <div style="background:rgba(0,50,100,0.2); border:1px solid #336699; border-radius:8px; padding:10px 16px; max-width:400px; margin-bottom:16px;">
          <p style="color:#6699ff; font-size:11px;">💡 轮回指南: ${tip}</p>
        </div>

        <p style="color: #664444; font-size: 13px; max-width: 500px; text-align: center; line-height: 1.6; margin-bottom: 16px; font-style: italic;">
          ${quote}
        </p>
        <div style="display: flex; gap: 16px; flex-wrap: wrap; justify-content: center;">
          <button id="btn-load" style="
            background: transparent; border: 1px solid #4488ff; color: #6699ff;
            padding: 12px 30px; cursor: pointer; font-size: 14px;
            letter-spacing: 3px; font-family: inherit; border-radius: 8px;
          ">读取存档 (F9)</button>
          <button id="btn-retry" style="
            background: transparent; border: 2px solid #ff4444; color: #ff4444;
            padding: 14px 40px; cursor: pointer; font-size: 16px;
            letter-spacing: 4px; font-family: inherit; border-radius: 8px;
            transition: all 0.3s;
          " onmouseover="this.style.background='rgba(255,68,68,0.2)'"
             onmouseout="this.style.background='transparent'">
            当前节点重试
          </button>
          <button id="btn-restart" style="
            background: transparent; border: 1px solid #666; color: #888;
            padding: 14px 40px; cursor: pointer; font-size: 16px;
            letter-spacing: 4px; font-family: inherit; border-radius: 8px;
          ">从头开始</button>
        </div>
        <p style="color: #664444; font-size: 12px; margin-top: 24px;">
          "死亡不是终点，只要主神还需要你。" —— 张杰
        </p>
      </div>
      <style>@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }</style>
    `;

    document.getElementById('btn-load')?.addEventListener('click', () => {
      overlay.innerHTML = '';
      if (gameState.load(0)) {
        const chapterGens = { 1: generateChapter1, 2: generateChapter2, 3: generateChapter3, 4: generateChapter4, 5: generateChapter5, 6: generateChapter6, 7: generateChapter7, 8: generateChapter8, 9: generateChapter9, 10: generateChapter10, 11: generateChapter11, 12: generateChapter12 };
        const gen = chapterGens[gameState.chapter] || generateChapter1;
        chapter = gen();
        currentFloorIndex = gameState.nodeIndex || 0;
        loadFloor(currentFloorIndex);
        gameStarted = true;
        if (!gameLoopRunning) { gameLoopRunning = true; requestAnimationFrame(gameLoop); }
        renderer.notify('💾 存档已加载', '#44aaff', 90);
      } else {
        renderer.notify('❌ 无存档可加载', '#ff4444', 60);
      }
    });

    document.getElementById('btn-retry').addEventListener('click', () => {
      overlay.innerHTML = '';
      // 恢复到当前层入口状态（清除本层已移除实体，重新开始）
      const p = gameState.player;
      p.hp = Math.floor(p.maxHp * 0.5); // 复活50% HP
      p.stamina = p.maxStamina;
      // 重置本层的实体移除记录（敌人重新出现）
      if (gameState.removedEntityIds[currentFloorIndex]) {
        gameState.removedEntityIds[currentFloorIndex] = new Set();
      }
      loadFloor(currentFloorIndex);
      gameStarted = true;
      if (!gameLoopRunning) { gameLoopRunning = true; requestAnimationFrame(gameLoop); }
    });

    document.getElementById('btn-restart').addEventListener('click', () => {
      overlay.innerHTML = '';
      startNewGame();
    });
  }, 500);
});

// ── 游戏主循环 ──

// ── 战斗视觉反馈 ──
eventBus.on('combat:boss_phase', () => {
  const canvas = document.getElementById('game-canvas');
  if (canvas) screenShake(canvas, 8, 400);
});
eventBus.on('combat:critical', (data) => {
  const canvas = document.getElementById('game-canvas');
  if (canvas) {
    screenShake(canvas, 4, 200);
    screenFlash(canvas.parentElement || document.body, '#ff444466', 150);
  }
});
eventBus.on('combat:player_hurt', (data) => {
  const canvas = document.getElementById('game-canvas');
  if (canvas) screenFlash(canvas.parentElement || document.body, '#ff000033', 100);
});

function gameLoop() {
  if (!gameStarted) { gameLoopRunning = false; return; }

  const floor = chapter.floors[currentFloorIndex];
  renderer.render(floor, entities, hoveredEntity, dialogueState, combatResult, currentFloorIndex);

  // 迷你地图
  if (window._miniMap && window._miniMap.visible) {
    try { window._miniMap.draw(floor, gameState.player, entities); } catch {}
  }

  // 任务追踪HUD
  if (gameState.state === GAME_STATE.EXPLORING && !dialogueState && !combatResult) {
    try { drawQuestHUD(renderer.ctx, renderer.canvas.width, renderer.canvas.height); } catch {}
  }

  requestAnimationFrame(gameLoop);
}

// ── 输入处理 ──
document.addEventListener('keydown', (e) => {
  // 潜行 Shift 追踪
  if (e.key === 'Shift') setShiftHeld(true);
  if (!gameStarted) return;

  // 对话模式
  if (dialogueState) {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      advanceDialogue();
    }
    return;
  }

  // 战斗结果模式
  if (combatResult) {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      combatResult = null;
    }
    return;
  }

  // 选择模式
  if (choiceState) {
    const num = parseInt(e.key);
    if (num >= 1 && num <= choiceState.choices.length) {
      e.preventDefault();
      resolveChoice(num - 1);
    }
    return;
  }

  // 快捷保存/读档 (任何状态下可用)
  if (e.key === 'F5') {
    e.preventDefault();
    gameState.save(0);
    try { localStorage.setItem('ih_milestones', JSON.stringify(milestoneTracker.toJSON())); } catch {}
    try { localStorage.setItem('ih_lore', JSON.stringify(loreTracker.toJSON())); } catch {}
    try { localStorage.setItem('ih_tutorial', JSON.stringify(tutorialManager.toJSON())); } catch {}
    try { if (window._miniMap) localStorage.setItem('ih_minimap', JSON.stringify(window._miniMap.toJSON())); } catch {}
    try { localStorage.setItem('ih_ngplus', JSON.stringify(ngPlusState.toJSON())); } catch {}
    try { localStorage.setItem('ih_stance', getStanceId()); } catch {}
    try { localStorage.setItem('ih_challenge', JSON.stringify(challengeState.toJSON()));
    localStorage.setItem('ih_elite', JSON.stringify(serializeEliteStats()));
    localStorage.setItem('ih_battle_history', JSON.stringify(serializeBattleHistory()));
    localStorage.setItem('ih_status_effects', JSON.stringify(serializeEffects()));
    localStorage.setItem('ih_dynamic_diff', JSON.stringify(serializeDynamicDifficulty()));
    localStorage.setItem('ih_growth', JSON.stringify(serializeGrowth())); } catch {}
    renderer.notify('💾 手动存档完成', '#44ff88', 90);
    return;
    localStorage.setItem('ih_abyss', JSON.stringify(serializeAbyss()));
    localStorage.setItem('ih_daily', JSON.stringify(serializeDaily()));  }
  if (e.key === 'F9') {
    e.preventDefault();
    if (gameState.load(0)) {
      // 根据存档章节加载对应地图
      const chapterGens = { 1: generateChapter1, 2: generateChapter2, 3: generateChapter3, 4: generateChapter4, 5: generateChapter5, 6: generateChapter6, 7: generateChapter7, 8: generateChapter8, 9: generateChapter9, 10: generateChapter10, 11: generateChapter11, 12: generateChapter12 };
      const gen = chapterGens[gameState.chapter] || generateChapter1;
      chapter = gen();
      currentFloorIndex = gameState.nodeIndex || 0;
      loadFloor(currentFloorIndex);
      renderer.notify('💾 存档已加载', '#44aaff', 90);
    } else {
      renderer.notify('❌ 无存档', '#ff4444', 60);
    }
    return;
  }

  // 探索模式
  if (gameState.state === GAME_STATE.EXPLORING) {
    let dx = 0, dy = 0;
    switch (e.key.toLowerCase()) {
      case 'w': case 'arrowup':    dy = -1; break;
      case 's': case 'arrowdown':  dy = 1; break;
      case 'a': case 'arrowleft':  dx = -1; break;
      case 'd': case 'arrowright': dx = 1; break;
      case ' ':
        e.preventDefault();
        interactAdjacent();
        return;
      case 'g':
        // 激活/关闭基因锁
        toggleGeneLock();
        return;
      case 'i':
        // 打开背包/状态面板
        showInventoryPanel();
        return;
      case 'x':
        // 统计面板
        showStatsPanel();
        return;
      case 'n':
        // 怪物图鉴
        showBestiaryPanel();
        return;
      case 'r':
        // 同伴关系面板
        showRelationshipPanel();
        return;
            case 'tab':
        // 迷你地图开关
        e.preventDefault();
        if (window._miniMap) window._miniMap.toggle();
        return;
case 'h': case '?':
        // 帮助面板
        showHelpPanel();
        return;
      case 'l':
        // 战斗日志
        showCombatLog();
        return;
      case 'm':
        // 全地图视图
        showFullMap();
        return;
      case 'q':
        // 快捷道具面板
        _showExplorationItemPanel();
        return;
      case 'j':
        // 成就面板
        showAchievementPanel();
        return;
      case 'b':
        // 装备仓库
        openEquipmentStash();
        return;
      case 't':
        // 战斗统计
        _showCombatStatsPanel();
        return;
      case 'c':
        // 知识典籍
        openCodex();
        return;
      case 'f':
        // 战斗回放历史
        showBattleHistoryPanel();
        return;
      case 'p':
        // 设置面板
        showSettingsPanel();
        return;
      case 'y':
        // 成长轨迹
        _showGrowthPanel();
        return;
      case 'escape':
        // 暂停菜单
        _showPauseMenu();
        return;
      default: return;
    }
    if (dx !== 0 || dy !== 0) {
      e.preventDefault();
      movePlayer(dx, dy);
    }
  }
});





// ── 深渊结算画面 ──
function _showAbyssEndScreen(result) {
  const overlay = document.getElementById('ui-overlay');
  const p = gameState.player;
  
  overlay.innerHTML = `
    <div style="
      position:absolute;top:0;left:0;right:0;bottom:0;
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      background:rgba(20,0,40,0.92);animation:fadeIn 0.5s;
    ">
      <h1 style="font-size:40px;color:#aa66ff;letter-spacing:8px;
        text-shadow:0 0 40px rgba(170,102,255,0.5);margin-bottom:8px;">
        深 渊 终 结
      </h1>
      <p style="color:#8866aa;font-size:16px;margin-bottom:24px;">
        在深渊第${result.floor}层陨落
      </p>
      
      <div style="display:flex;gap:16px;margin-bottom:24px;flex-wrap:wrap;justify-content:center;">
        <div style="background:rgba(0,0,0,0.5);border:1px solid #8844ff40;border-radius:8px;padding:16px 24px;text-align:center;">
          <p style="color:#8866aa;font-size:10px;letter-spacing:2px;">最深层数</p>
          <p style="color:#aa66ff;font-size:32px;font-weight:bold;">${result.floor}</p>
        </div>
        <div style="background:rgba(0,0,0,0.5);border:1px solid #8844ff40;border-radius:8px;padding:16px 24px;text-align:center;">
          <p style="color:#8866aa;font-size:10px;letter-spacing:2px;">得分</p>
          <p style="color:#ffcc44;font-size:32px;font-weight:bold;">${result.score}</p>
        </div>
        <div style="background:rgba(0,0,0,0.5);border:1px solid #8844ff40;border-radius:8px;padding:16px 24px;text-align:center;">
          <p style="color:#8866aa;font-size:10px;letter-spacing:2px;">最高分</p>
          <p style="color:#ffaa00;font-size:32px;font-weight:bold;">${result.highScore}</p>
        </div>
      </div>
      
      <div style="display:flex;gap:12px;">
        <button id="btn-abyss-retry" style="
          background:rgba(136,68,255,0.15);border:1px solid #8844ff;color:#aa66ff;
          padding:12px 30px;cursor:pointer;font-size:14px;font-family:inherit;border-radius:8px;
        ">再次挑战</button>
        <button id="btn-abyss-return" style="
          background:transparent;border:1px solid #444;color:#888;
          padding:10px 24px;cursor:pointer;font-size:13px;font-family:inherit;border-radius:6px;
        ">返回主菜单</button>
      </div>
    </div>
  `;
  
  document.getElementById('btn-abyss-retry')?.addEventListener('click', () => {
    overlay.innerHTML = '';
    _showAbyssMenu();
  });
  document.getElementById('btn-abyss-return')?.addEventListener('click', () => {
    overlay.innerHTML = '';
    showMainMenu();
  });
}

// ── 深渊模式楼层加载 ──
function _loadAbyssFloor(floorData) {
  const floorObj = {
    id: floorData.id,
    name: floorData.name,
    width: floorData.width,
    height: floorData.height,
    tiles: floorData.tiles,
    entities: floorData.entities,
    theme: floorData.theme,
    playerStart: floorData.playerStart,
  };
  
  // Update entities reference
  entities.length = 0;
  for (const e of floorData.entities) entities.push(e);
  
  // Update current floor reference
  if (!chapter.floors) chapter.floors = [];
  chapter.floors[currentFloorIndex] = floorObj;
  
  // Reset fog for new floor
  try { fogOfWar.resetFloor(currentFloorIndex); } catch {}
  fogOfWar.updateVision(currentFloorIndex, gameState.player.x, gameState.player.y);
  
  // Update atmosphere
  try { if (floorData.theme) atmosphereRenderer.setFloorTheme(floorData.theme); } catch {}
  
  gameState.setState(GAME_STATE.EXPLORING);
  renderer.notify('🕳 ' + floorData.name, '#aa66ff', 100);
}

// ── 成长轨迹面板 ──
function _showGrowthPanel() {
  if (gameState.state !== GAME_STATE.EXPLORING) return;
  gameState.setState(GAME_STATE.INVENTORY);
  const overlay = document.getElementById('ui-overlay');
  
  const growthContent = renderGrowthPanel();
  
  overlay.innerHTML = `
    <div style="
      position:absolute;top:0;left:0;right:0;bottom:0;
      display:flex;align-items:center;justify-content:center;
      background:rgba(0,0,0,0.8);
    " id="growth-backdrop">
      <div style="
        background:rgba(10,10,20,0.97);border:1px solid #ffcc4440;border-radius:16px;
        padding:24px;max-width:450px;width:90%;max-height:80vh;overflow-y:auto;
      ">
        <h2 style="color:#ffcc44;text-align:center;letter-spacing:4px;margin-bottom:16px;font-size:16px;">
          📈 成长轨迹
        </h2>
        ${growthContent}
        <div style="text-align:center;margin-top:16px;">
          <button id="btn-close-growth" style="
            background:transparent;border:1px solid #444;color:#888;
            padding:6px 24px;cursor:pointer;font-size:12px;font-family:inherit;border-radius:6px;
          ">关闭 (Y/Esc)</button>
        </div>
      </div>
    </div>
  `;
  
  const close = () => {
    overlay.innerHTML = '';
    gameState.setState(GAME_STATE.EXPLORING);
  };
  document.getElementById('btn-close-growth')?.addEventListener('click', close);
  document.getElementById('growth-backdrop')?.addEventListener('click', (e) => {
    if (e.target.id === 'growth-backdrop') close();
  });
  const kh = (e) => {
    if (e.key === 'Escape' || e.key.toLowerCase() === 'y') {
      close();
      document.removeEventListener('keydown', kh);
    }
  };
  document.addEventListener('keydown', kh);
}

// ── 每日挑战菜单 ──
function _showDailyChallengeMenu() {
  const overlay = document.getElementById('ui-overlay');
  const today = new Date().toISOString().split('T')[0];
  const challenge = generateDailyChallenge(today);
  const completed = isDailyCompleted(today);
  const record = getDailyRecord(today);
  
  overlay.innerHTML = `
    <div style="
      position:absolute;top:0;left:0;right:0;bottom:0;
      display:flex;align-items:center;justify-content:center;
      background:rgba(0,0,0,0.85);
    " id="daily-backdrop">
      <div style="
        background:rgba(15,12,5,0.97);border:1px solid #ffaa00;border-radius:16px;
        padding:30px;max-width:450px;width:90%;
      ">
        <h2 style="color:#ffcc44;text-align:center;letter-spacing:4px;margin-bottom:20px;">
          🎯 每日挑战
        </h2>
        <p style="color:#888;text-align:center;font-size:12px;margin-bottom:16px;">
          ${today} · 种子: ${challenge.seed}
        </p>
        
        <div style="background:rgba(255,170,0,0.05);border:1px solid #ffaa0030;border-radius:8px;padding:12px;margin-bottom:16px;">
          <p style="color:#ffaa00;font-size:14px;font-weight:bold;margin-bottom:8px;">
            ${challenge.name || '今日试炼'}
          </p>
          <p style="color:#999;font-size:12px;">章节: 第${challenge.chapter || 1}章</p>
          <p style="color:#999;font-size:12px;">难度: ${challenge.difficulty || '普通'}</p>
          ${challenge.modifiers ? '<p style="color:#cc8800;font-size:11px;margin-top:6px;">特殊规则: ' + (challenge.modifiers.map(m => m.name || m).join('、')) + '</p>' : ''}
        </div>
        
        ${completed ? '<p style="color:#44ff88;text-align:center;font-size:14px;margin-bottom:16px;">✅ 今日已完成！' + (record ? ' 用时: ' + record.time + 's 得分: ' + record.score : '') + '</p>' : ''}
        
        <div style="text-align:center;display:flex;gap:10px;justify-content:center;">
          ${!completed ? '<button id="btn-start-daily" style="background:rgba(255,170,0,0.15);border:1px solid #ffaa00;color:#ffcc44;padding:10px 30px;cursor:pointer;font-size:14px;font-family:inherit;border-radius:8px;">开始挑战</button>' : ''}
          <button id="btn-close-daily" style="background:transparent;border:1px solid #444;color:#888;padding:8px 24px;cursor:pointer;font-size:13px;font-family:inherit;border-radius:6px;">返回</button>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('btn-start-daily')?.addEventListener('click', () => {
    overlay.innerHTML = '';
    // Start a special daily challenge game
    const ch = challenge.chapter || 1;
    startNewGame(ch);
    // Mark daily challenge active
    gameState._dailyChallengeActive = true;
    gameState._dailyChallengeStart = Date.now();
  });
  
  const closeFn = () => { overlay.innerHTML = ''; showMainMenu(); };
  document.getElementById('btn-close-daily')?.addEventListener('click', closeFn);
  document.getElementById('daily-backdrop')?.addEventListener('click', (e) => {
    if (e.target.id === 'daily-backdrop') closeFn();
  });
}


// ── 无尽深渊菜单 ──
function _showAbyssMenu() {
  const overlay = document.getElementById('ui-overlay');
  const state = getAbyssState();
  
  overlay.innerHTML = `
    <div style="
      position:absolute;top:0;left:0;right:0;bottom:0;
      display:flex;align-items:center;justify-content:center;
      background:rgba(0,0,0,0.85);
    " id="abyss-backdrop">
      <div style="
        background:rgba(5,5,15,0.97);border:1px solid #8844ff;border-radius:16px;
        padding:30px;max-width:450px;width:90%;
      ">
        <h2 style="color:#aa66ff;text-align:center;letter-spacing:4px;margin-bottom:20px;">
          🕳 无尽深渊
        </h2>
        <p style="color:#666;text-align:center;font-size:12px;margin-bottom:16px;">
          通关后解锁的无限挑战模式 — 层层递增的敌人强度
        </p>
        
        <div style="background:rgba(136,68,255,0.05);border:1px solid #8844ff30;border-radius:8px;padding:12px;margin-bottom:16px;">
          <p style="color:#888;font-size:12px;">最深层数: <span style="color:#aa66ff;">${state.bestFloor || 0}</span></p>
          <p style="color:#888;font-size:12px;">总击杀: <span style="color:#aa66ff;">${state.totalKills || 0}</span></p>
          <p style="color:#888;font-size:12px;">总金币: <span style="color:#ffcc44;">${state.totalGold || 0}</span></p>
        </div>
        
        <p style="color:#555;font-size:11px;text-align:center;margin-bottom:16px;">
          ⚠ 深渊模式使用当前存档角色，死亡不影响主线存档
        </p>
        
        <div style="text-align:center;display:flex;gap:10px;justify-content:center;">
          <button id="btn-start-abyss" style="background:rgba(136,68,255,0.15);border:1px solid #8844ff;color:#aa66ff;padding:10px 30px;cursor:pointer;font-size:14px;font-family:inherit;border-radius:8px;">深入深渊</button>
          <button id="btn-close-abyss" style="background:transparent;border:1px solid #444;color:#888;padding:8px 24px;cursor:pointer;font-size:13px;font-family:inherit;border-radius:6px;">返回</button>
        </div>
      </div>
    </div>
  `;
  
  document.getElementById('btn-start-abyss')?.addEventListener('click', () => {
    overlay.innerHTML = '';
    // Check if player has a save
    const saveKey = 'infinite_horror_save_0';
    const saveData = localStorage.getItem(saveKey);
    if (!saveData) {
      overlay.innerHTML = '<div style="position:absolute;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.8);"><p style="color:#ff4444;font-size:16px;">需要先完成至少一章主线才能进入深渊</p></div>';
      setTimeout(() => { overlay.innerHTML = ''; showMainMenu(); }, 2000);
      return;
    }
    try {
      loadGame(0);
      const abyssFloorData = startAbyss();
      gameState._abyssActive = true;
      overlay.innerHTML = '';
      gameStarted = true;
      _loadAbyssFloor(abyssFloorData);
      gameState.player.x = abyssFloorData.playerStart.x;
      gameState.player.y = abyssFloorData.playerStart.y;
      renderer.notify('🕳 深渊模式开始！', '#aa66ff', 120);
    } catch (err) {
      console.error('Abyss start error:', err);
      overlay.innerHTML = '';
      showMainMenu();
    }
  });
  
  const closeFn = () => { overlay.innerHTML = ''; showMainMenu(); };
  document.getElementById('btn-close-abyss')?.addEventListener('click', closeFn);
  document.getElementById('abyss-backdrop')?.addEventListener('click', (e) => {
    if (e.target.id === 'abyss-backdrop') closeFn();
  });
}



// ════════════════════════════════════════════════════════════════
// 浏览器关闭/切换自动存档
// ════════════════════════════════════════════════════════════════
window.addEventListener('beforeunload', () => {
  try {
    if (gameStarted) autoSave('浏览器关闭前存档');
  } catch {}
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden && gameStarted) {
    try { autoSave('切后台存档'); } catch {}
  }
});

// 每5分钟定时存档
setInterval(() => {
  if (gameStarted) {
    try { autoSave('定时存档'); } catch {}
  }
}, 300000);

// ════════════════════════════════════════════════════════════════
// 触摸控制 — 滑动移动 + 点击互动
// ════════════════════════════════════════════════════════════════
(() => {
  let touchStartX = 0, touchStartY = 0, touchStartTime = 0;
  const MIN_SWIPE = 30;   // 最小滑动距离
  const TAP_MAX = 200;     // 点击最大时间 ms
  const TAP_DIST = 15;     // 点击最大位移

  document.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
    touchStartTime = Date.now();
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const elapsed = Date.now() - touchStartTime;

    // 短按 = 点击/互动/确认
    if (dist < TAP_DIST && elapsed < TAP_MAX) {
      // 模拟空格键（互动/对话推进/关闭结果）
      document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space' }));
      return;
    }

    // 滑动 = 移动
    if (dist >= MIN_SWIPE) {
      let key;
      if (Math.abs(dx) > Math.abs(dy)) {
        key = dx > 0 ? 'd' : 'a';
      } else {
        key = dy > 0 ? 's' : 'w';
      }
      document.dispatchEvent(new KeyboardEvent('keydown', { key, code: key.toUpperCase() }));
    }
  }, { passive: true });

  // 双指捏合 = 缩放迷你地图
  document.addEventListener('touchmove', (e) => {
    if (e.touches.length >= 2) {
      e.preventDefault(); // 防止浏览器缩放
    }
  }, { passive: false });
})();

// 移动端虚拟摇杆（触摸屏设备可见）
(() => {
  const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (!isTouchDevice) return;
  
  const pad = document.createElement('div');
  pad.id = 'touch-dpad';
  pad.style.cssText = 'position:fixed;bottom:20px;left:20px;z-index:9999;opacity:0.5;user-select:none;-webkit-user-select:none;';
  pad.innerHTML = `
    <div style="display:grid;grid-template-columns:50px 50px 50px;grid-template-rows:50px 50px 50px;gap:4px;">
      <div></div>
      <button data-key="w" style="background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.2);border-radius:8px;color:#aaa;font-size:18px;cursor:pointer;">▲</button>
      <div></div>
      <button data-key="a" style="background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.2);border-radius:8px;color:#aaa;font-size:18px;cursor:pointer;">◀</button>
      <button data-key=" " style="background:rgba(255,200,68,0.2);border:1px solid rgba(255,200,68,0.3);border-radius:8px;color:#ffcc44;font-size:12px;cursor:pointer;">互动</button>
      <button data-key="d" style="background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.2);border-radius:8px;color:#aaa;font-size:18px;cursor:pointer;">▶</button>
      <div></div>
      <button data-key="s" style="background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.2);border-radius:8px;color:#aaa;font-size:18px;cursor:pointer;">▼</button>
      <div></div>
    </div>
  `;
  document.body.appendChild(pad);
  
  // 快捷按钮
  const quickBtns = document.createElement('div');
  quickBtns.style.cssText = 'position:fixed;bottom:20px;right:20px;z-index:9999;opacity:0.5;display:flex;flex-direction:column;gap:6px;';
  quickBtns.innerHTML = `
    <button data-key="i" style="background:rgba(100,150,255,0.2);border:1px solid rgba(100,150,255,0.3);border-radius:8px;color:#6699ff;padding:8px 16px;font-size:12px;cursor:pointer;">背包</button>
    <button data-key="m" style="background:rgba(100,255,150,0.2);border:1px solid rgba(100,255,150,0.3);border-radius:8px;color:#66ff99;padding:8px 16px;font-size:12px;cursor:pointer;">地图</button>
    <button data-key="h" style="background:rgba(255,200,68,0.2);border:1px solid rgba(255,200,68,0.3);border-radius:8px;color:#ffcc44;padding:8px 16px;font-size:12px;cursor:pointer;">帮助</button>
  `;
  document.body.appendChild(quickBtns);
  
  // 绑定所有触摸按钮
  for (const btn of [...pad.querySelectorAll('button'), ...quickBtns.querySelectorAll('button')]) {
    btn.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const key = btn.dataset.key;
      if (key) document.dispatchEvent(new KeyboardEvent('keydown', { key, code: key.toUpperCase() }));
      btn.style.opacity = '0.8';
      btn.style.transform = 'scale(0.95)';
    }, { passive: false });
    btn.addEventListener('touchend', (e) => {
      e.preventDefault();
      btn.style.opacity = '1';
      btn.style.transform = 'scale(1)';
    }, { passive: false });
  }
})();

// Shift 释放
document.addEventListener('keyup', (e) => {
  if (e.key === 'Shift') setShiftHeld(false);
});

// 鼠标悬停
document.addEventListener('mousemove', (e) => {
  if (!gameStarted || !chapter) return;
  const canvas = document.getElementById('game-canvas');
  const rect = canvas.getBoundingClientRect();
  const scaleX = CANVAS_W / rect.width;
  const scaleY = CANVAS_H / rect.height;
  const mouseX = (e.clientX - rect.left) * scaleX;
  const mouseY = (e.clientY - rect.top) * scaleY;

  // 屏幕坐标转世界坐标
  const p = gameState.player;
  const camX = p.x * TILE_SIZE - CANVAS_W / 2 + TILE_SIZE / 2;
  const camY = p.y * TILE_SIZE - CANVAS_H / 2 + TILE_SIZE / 2;
  const worldX = Math.floor((mouseX + camX) / TILE_SIZE);
  const worldY = Math.floor((mouseY + camY) / TILE_SIZE);

  hoveredEntity = entities.find(en => en.x === worldX && en.y === worldY) || null;
});

// 点击
document.addEventListener('click', () => {
  if (dialogueState) {
    advanceDialogue();
  } else if (combatResult) {
    combatResult = null;
  }
});

// ── 移动与碰撞 ──
function movePlayer(dx, dy) {
  const p = gameState.player;
  // 死亡状态不允许移动
  if (p.hp <= 0) return;
  const nx = p.x + dx;
  const ny = p.y + dy;
  const floor = chapter.floors[currentFloorIndex];

  // 边界检查
  if (ny < 0 || ny >= floor.height || nx < 0 || nx >= floor.width) return;

  const tile = floor.tiles[ny][nx];

  // 墙壁 — 检查是否是密道
  if (tile === TILE.WALL || tile === TILE.VOID) {
    const floor = chapter.floors[currentFloorIndex];
    if (floor?._secrets) {
      const secret = floor._secrets.find(s => s.x === nx && s.y === ny && !s.broken);
      if (secret) {
        const ch = gameState.chapter || 1;
        const result = tryBreakSecret(secret, p, ch, gameState.chapter, currentFloorIndex);
        if (result.success) {
          // 打通墙壁：修改地图数据
          floor.map[ny][nx] = 0; // 变成地板
          if (floor.tiles) floor.tiles[ny][nx] = 0;
          renderer.shake(6, 300);
          renderer.flash('rgba(255, 200, 100)', 200);
          renderer.addParticle(nx * 48 + 24, ny * 48 + 24, 'rgba(255, 220, 150, 0.9)', 15);
          audioEngine.playDamage();
          // 添加密室奖励消耗品（通过事件）
          if (result.reward?.type === 'consumable') {
            try { addConsumable(result.reward.id, result.reward.count || 1); } catch {}
          }
          startDialogue([
            { text: result.message, speaker: '系统' },
            { text: '密道已打通，可以通过了。', speaker: '旁白' },
          ]);
          return;
        } else {
          // 提示但不能打开
          renderer.addFloatText(secret.hint || '...', p.x, p.y - 1, 'rgb(180, 180, 140)');
          return;
        }
      }
    }
    return;
  }

  // 岩浆/激光 - 造成伤害但可以走
  if (tile === TILE.LAVA) {
    const lavaDmg = Math.floor(p.maxHp * 0.15);
    gameState.damagePlayer(lavaDmg, 'fire');
    renderer.addFloatText(`-${lavaDmg}`, nx, ny, 'rgb(255, 80, 40)');
    renderer.shake(4, 200);
  }

  // 检查实体碰撞
  const entity = entities.find(e => e.x === nx && e.y === ny);

  if (entity) {
    // 敌人 → 战前确认
    if (entity.type === ENTITY_TYPE.ENEMY || entity.type === ENTITY_TYPE.BOSS) {
      // Ch2 巡逻异形：未惊动时可穿过
      if (entity.patrol && !isPatrolAlerted(entity, nx, ny)) {
        renderer.notify('潜行通过...异形未察觉', 'rgb(80,200,120)', 80);
        p.x = nx;
        p.y = ny;
        onPlayerMove();
        decayNoise();
        return;
      }
      showCombatConfirm(entity);
      return;
    }

    // NPC/队友 → 对话（首次自动触发，之后可穿过）
    if (entity.type === ENTITY_TYPE.COMPANION || entity.type === ENTITY_TYPE.NPC) {
      // 商人NPC → 打开商店
      if (entity.merchant) {
        openMerchantShop(entity.name, gameState.chapter);
        return;
      }
      if (entity.dialogue && !entity._dialogueShown) {
        entity._dialogueShown = true;
        startDialogue(entity.dialogue, entity);
        return;
      }
      // 已对话过的队友可以穿过
      p.x = nx;
      p.y = ny;
      return;
    }

    // 物品 → 拾取
    if (entity.type === ENTITY_TYPE.ITEM) {
      const consumed = pickupItem(entity);
      if (consumed === false) return; // 门打不开，不移动
      // 拾取后移动到物品位置
      p.x = nx;
      p.y = ny;
      return;
    }

    // 事件 → 触发
    if (entity.type === ENTITY_TYPE.EVENT || entity.type === ENTITY_TYPE.TRAP) {
      triggerEvent(entity);
      p.x = nx;
      p.y = ny;
      return;
    }
  }

  // 楼梯 → 检查是否可以下一层
  if (tile === TILE.STAIRS) {
    // ── 深渊模式楼层切换 ──
    if (gameState._abyssActive && isAbyssActive()) {
      const abyssState = getAbyssState();
      const bossEntities = entities.filter(e => e.type === ENTITY_TYPE.BOSS);
      if (bossEntities.length > 0) {
        startDialogue([{ text: '前方的路还没有打通。先消灭深渊守护者！', speaker: '系统' }]);
        return;
      }
      renderer.flash('rgba(136,68,255,0.3)', 300);
      renderer.notify('深渊第' + (abyssState.currentFloor + 1) + '层...', '#aa66ff', 80);
      const nextFloor = nextAbyssFloor();
      _loadAbyssFloor(nextFloor);
      p.x = nextFloor.playerStart.x;
      p.y = nextFloor.playerStart.y;
      return;
    }
    const floor = chapter.floors[currentFloorIndex];
    if (floor.onClear) {
      // 检查是否有需要先击败boss的条件
      const bossEntities = entities.filter(e => e.type === ENTITY_TYPE.BOSS);
      if (bossEntities.length > 0) {
        startDialogue([{ text: '前方的路还没有打通。先消灭挡路的强敌吧。', speaker: '系统' }]);
        return;
      }
      // 检查楼层特定的剧情前置条件
      if (floor.clearRequires) {
        for (const req of floor.clearRequires) {
          if (!gameState.hasFlag(req.flag)) {
            startDialogue([{ text: req.message || '还有重要的事情没有完成。', speaker: '系统' }]);
            return;
          }
        }
      }
      startDialogue([{ text: floor.onClear.message, speaker: '旁白' }], null, () => {
        tutorialManager.trigger('first_stairs');
        loadFloor(currentFloorIndex + 1, true);
      });
      p.x = nx;
      p.y = ny;
      return;
    }
  }

  // 正常移动
  p.facing = dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up';
  p.x = nx;
  p.y = ny;
  gameState.turn++;
  gameState.stats.turnsPlayed++;
  fogOfWar.updateVision(currentFloorIndex, gameState.player.x, gameState.player.y);
  gameState.stats.stepsWalked = (gameState.stats.stepsWalked || 0) + 1;
  if (gameState.stats.stepsWalked === 1) tutorialManager.trigger("first_move");

  // 随机遭遇检测
  const encounter = randomEncounterManager.onStep(gameState.chapter);
  if (encounter) {
    _showRandomEncounter(encounter);
  }

  // 潜行系统 — 移动噪音 + 噪音衰减
  onPlayerMove();
  decayNoise();

  // 前几回合的教学提示
  if (gameState.turn === 1) {
    renderer.notify('WASD或方向键移动 · 空格互动', 'rgb(150,150,180)', 120);
  } else if (gameState.turn === 3) {
    renderer.notify('走向敌人即可自动战斗 · 悬停鼠标预览', 'rgb(150,150,180)', 120);
  } else if (gameState.turn === 6) {
    renderer.notify('按 M 查看全地图 · 按 I 查看装备', 'rgb(150,150,180)', 100);
  }

  // 自动恢复少量体力
  if (p.stamina < p.maxStamina) {
    p.stamina = Math.min(p.maxStamina, p.stamina + 1);
  }
}

// ── 随机遭遇UI ──
function _showRandomEncounter(encounter) {
  const overlay = document.getElementById('ui-overlay');
  gameState.setState(GAME_STATE.DIALOGUE);

  if (encounter.type === 'choice') {
    // 选择型遭遇
    const choicesHtml = encounter.choices
      .filter(c => !c.condition || c.condition(gameState.player))
      .map((c, i) => `<button class="enc-choice" data-idx="${i}" style="
        background: rgba(255,255,255,0.05); border: 1px solid #555; color: #ccc;
        padding: 10px 20px; cursor: pointer; font-size: 13px; font-family: inherit;
        border-radius: 8px; transition: all 0.2s; min-width: 120px;
      " onmouseover="this.style.borderColor='#ffcc44';this.style.color='#ffcc44'"
         onmouseout="this.style.borderColor='#555';this.style.color='#ccc'">
        ${c.label}<br><span style="font-size:10px;color:#888;">${c.desc}</span>
      </button>`).join('');

    overlay.innerHTML = `
      <div style="position:absolute;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.7);animation:fadeIn 0.2s;" id="enc-backdrop">
        <div style="background:rgba(10,10,20,0.97);border:1px solid #ffcc4440;border-radius:14px;padding:24px;max-width:440px;width:90%;text-align:center;">
          <p style="font-size:24px;margin-bottom:8px;">${encounter.icon}</p>
          <h3 style="color:#ffcc44;letter-spacing:3px;margin-bottom:12px;">${encounter.name}</h3>
          <p style="color:#aaa;font-size:13px;line-height:1.6;margin-bottom:16px;">${encounter.text}</p>
          <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
            ${choicesHtml}
          </div>
        </div>
      </div>
    `;

    document.querySelectorAll('.enc-choice').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.idx);
        const validChoices = encounter.choices.filter(c => !c.condition || c.condition(gameState.player));
        const choice = validChoices[idx];
        if (choice) {
          const result = choice.execute(gameState.player, gameState.chapter);
          overlay.innerHTML = `
            <div style="position:absolute;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.7);" id="enc-result">
              <div style="background:rgba(10,10,20,0.97);border:1px solid ${result.color}40;border-radius:14px;padding:24px;max-width:400px;width:90%;text-align:center;">
                <p style="color:${result.color};font-size:15px;line-height:1.6;">${result.text}</p>
                <button id="enc-ok" style="margin-top:16px;background:transparent;border:1px solid #444;color:#888;padding:8px 24px;cursor:pointer;font-size:13px;font-family:inherit;border-radius:6px;">继续探索</button>
              </div>
            </div>
          `;
          document.getElementById('enc-ok').addEventListener('click', () => {
            overlay.innerHTML = '';
            gameState.setState(GAME_STATE.EXPLORING);
          });
          document.getElementById('enc-result').addEventListener('click', (e) => {
            if (e.target.id === 'enc-result') { overlay.innerHTML = ''; gameState.setState(GAME_STATE.EXPLORING); }
          });
        }
      });
    });
  } else if (encounter.type === 'narrative') {
    // 叙事型 — 随机选一条文本
    const narr = encounter.narratives[Math.floor(Math.random() * encounter.narratives.length)];
    renderer.notify(encounter.icon + ' ' + narr, '#aaaacc', 150);
    gameState.setState(GAME_STATE.EXPLORING);
  } else {
    // 奖励/危险型 — 直接执行并显示结果
    const result = encounter.execute(gameState.player, gameState.chapter);
    renderer.addFloatText(encounter.icon + ' ' + result.text, gameState.player.x, gameState.player.y - 1, result.color);
    renderer.notify(encounter.icon + ' ' + encounter.name + ': ' + result.text, result.color, 100);
    gameState.setState(GAME_STATE.EXPLORING);
  }
}

// ── 战前确认 ──
function showCombatConfirm(enemy) {
  tutorialManager.trigger('first_combat_confirm');
  const p = gameState.player;
  // 难度缩放：根据章节动态调整敌人属性 + 动态难度
  // 一次性构造最终敌人快照，预判和实战共用同一份
  const scaledEnemy = applyDynamicScaling(scaleEnemy(enemy, gameState.chapter));
  const preview = previewBattle(p, scaledEnemy);
  
  gameState.setState(GAME_STATE.DIALOGUE);
  const overlay = document.getElementById('ui-overlay');
  
  const canWinColor = preview.canWin ? '#44ff88' : '#ff4444';
  const canWinIcon = preview.canWin ? '✓' : '✗';
  const canWinText = preview.canWin 
    ? `${preview.turnsNeeded}回合击败 · 受伤${preview.totalDamage}` 
    : '无法击败 — 建议撤退';
  const hpAfterText = preview.canWin ? `战后HP: ${preview.hpAfter}/${p.maxHp}` : `预计受伤: ${preview.totalDamage}+`;
  const effectiveAtk = getEffectiveAtk(p);
  const effectiveDef = getEffectiveDef(p);
  const yourDmg = preview.playerDmgPerHit;
  const theirDmg = preview.enemyDmgPerHit;
  const descText = enemy.description ? `<p style="color:#666;font-size:11px;line-height:1.4;margin-top:8px;max-height:48px;overflow:hidden;">${enemy.description}</p>` : '';
  const traitNames = { thorns:'🌿荆棘', regen:'💚再生', undying:'💀不死', swift:'⚡迅捷', enrage:'🔥狂怒', evasive:'💨闪避', shield:'🛡护盾', poisonous:'☠剧毒', armored:'🛡重甲', vampiric:'🩸吸血' };
  const traitsHtml = (scaledEnemy.traits || []).length > 0 
    ? '<div style="display:flex;gap:4px;justify-content:center;flex-wrap:wrap;margin-bottom:6px;">' + scaledEnemy.traits.map(t => '<span style="color:#ff8844;background:rgba(255,136,68,0.1);padding:1px 6px;border-radius:3px;font-size:10px;">' + (traitNames[t]||t) + '</span>').join('') + '</div>' 
    : '';
  // 精英怪物词缀显示
  const eliteHtml = (() => {
    if (!enemy._eliteTier) return '';
    const tier = enemy._eliteTierData;
    const affixes = enemy._eliteAffixes || [];
    let h = '<div style="margin-top:4px;padding:4px 6px;background:rgba(' + (tier.color === '#4488ff' ? '68,136,255' : tier.color === '#aa44ff' ? '170,68,255' : '255,136,0') + ',0.08);border:1px solid ' + tier.color + '30;border-radius:4px;text-align:center;">';
    h += '<span style="color:' + tier.color + ';font-size:10px;font-weight:bold;">' + tier.icon + ' ' + tier.name + '</span> ';
    for (const a of affixes) h += '<span style="color:' + a.color + ';font-size:9px;margin:0 2px;">' + a.icon + a.name + '</span>';
    h += '<p style="color:#888;font-size:9px;margin-top:2px;">' + affixes.map(a => a.desc).join(' \u00b7 ') + '</p>';
    h += '<p style="color:#ffcc44;font-size:9px;">\u5956\u52b1 \u00d7' + tier.rewardMul + '</p></div>';
    return h;
  })();
  
  overlay.innerHTML = `
    <div style="
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      display: flex; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.65);
      animation: fadeIn 0.15s ease;
    " id="combat-confirm">
      <div style="
        background: rgba(10,10,20,0.97); border: 2px solid #ff444466;
        border-radius: 14px; padding: 20px 24px; max-width: 460px; width: 92%;
        box-shadow: 0 0 40px rgba(255,68,68,0.1);
      ">
        <p style="color: #ff4444; font-size: 11px; letter-spacing: 6px; text-align:center; margin-bottom: 10px;">⚔ 遭 遇 敌 人 ⚔</p>
        
        <!-- 双栏对比 -->
        <div style="display:flex; gap:12px; margin-bottom: 12px;">
          <!-- 左：玩家 -->
          <div id="preview-player-stats" style="flex:1; background:rgba(68,136,255,0.06); border:1px solid rgba(68,136,255,0.15); border-radius:8px; padding:10px; text-align:center;">
            <p style="color:#6699ff; font-size:11px; letter-spacing:2px; margin-bottom:4px;">郑吒 Lv.${p.level}</p>
            <p style="color:#eee; font-size:13px;">HP <span style="color:#44ff88">${p.hp}</span>/${p.maxHp}</p>
            <p style="color:#ff8866; font-size:12px;">ATK ${effectiveAtk}${p.weapon ? ' <span style="color:#665533;font-size:10px;">(+' + (p.weapon.atk||0) + ')</span>' : ''}</p>
            <p style="color:#6688ff; font-size:12px;">DEF ${effectiveDef}${p.armor ? ' <span style="color:#334466;font-size:10px;">(+' + (p.armor.def||0) + ')</span>' : ''}</p>
            ${(() => { const efx = getActiveEffects(); return efx.length > 0 ? '<div style="margin-top:4px;display:flex;gap:2px;flex-wrap:wrap;justify-content:center;">' + efx.map(e => '<span style="color:' + e.type.color + ';font-size:9px;padding:1px 3px;border:1px solid ' + e.type.color + '30;border-radius:2px;">' + e.type.icon + (e.value > 0 ? '+' : '') + e.value + '</span>').join('') + '</div>' : ''; })()}
          </div>
          <!-- 中：VS -->
          <div style="display:flex; align-items:center; justify-content:center;">
            <span style="color:#555; font-size:16px; font-weight:bold;">VS</span>
          </div>
          <!-- 右：敌人（显示缩放后数值） -->
          <div style="flex:1; background:rgba(255,68,68,0.06); border:1px solid ${scaledEnemy.affix ? scaledEnemy.affix.color || '#ff4444' : 'rgba(255,68,68,0.15)'}; border-radius:8px; padding:10px; text-align:center;">
            <p style="color:${scaledEnemy.affix?.color || enemy.color || '#ff4444'}; font-size:11px; letter-spacing:2px; margin-bottom:4px;">${scaledEnemy.name}</p>
            <p style="color:#eee; font-size:13px;">HP <span style="color:#ff6666">${scaledEnemy.hp}</span></p>
            <p style="color:#ff8866; font-size:12px;">ATK ${scaledEnemy.atk}</p>
            <p style="color:#6688ff; font-size:12px;">DEF ${scaledEnemy.def}</p>
            ${scaledEnemy.affix ? '<p style="color:' + (scaledEnemy.affix.color || '#ffaa00') + ';font-size:10px;font-weight:bold;">⚠ ' + scaledEnemy.affix.icon + ' ' + scaledEnemy.affix.name + ' — ' + scaledEnemy.affix.desc + '</p>' : ''}
            ${scaledEnemy.weaknesses?.length ? '<p style="color:#ff8833;font-size:10px;">弱点: ' + scaledEnemy.weaknesses.map(w => ({fire:'🔥火',ice:'❄冰',poison:'☠毒',psychic:'🧠念',dark:'🌑暗',holy:'✦圣'}[w]||w)).join(' ') + '</p>' : ''}
            ${scaledEnemy.res ? '<p style="color:#8888aa;font-size:10px;">法抗: ' + scaledEnemy.res + '%</p>' : ''}
          </div>
        </div>
        
        <!-- 伤害预测 -->
        <div id="preview-damage-calc" style="display:flex; gap:8px; margin-bottom: 10px; text-align:center;">
          <div style="flex:1; background:rgba(255,170,0,0.08); border-radius:6px; padding:6px;">
            <p style="color:#ffaa44; font-size:10px;">你的伤害/回合</p>
            <p style="color:#ffcc44; font-size:16px; font-weight:bold;">${yourDmg}</p>
          </div>
          <div style="flex:1; background:rgba(255,68,68,0.08); border-radius:6px; padding:6px;">
            <p style="color:#ff6666; font-size:10px;">受到伤害/回合</p>
            <p style="color:${theirDmg > 0 ? '#ff4444' : '#44ff88'}; font-size:16px; font-weight:bold;">${theirDmg}</p>
          </div>
        </div>
        
        <!-- 结果预判 -->
        <div style="
          background: rgba(${preview.canWin ? '40,80,40' : '80,30,30'},0.25);
          border: 1px solid ${canWinColor}22; border-radius: 8px;
          padding: 10px; margin-bottom: 12px; text-align:center;
        ">
          <p style="color: ${canWinColor}; font-size: 14px; font-weight: bold;">${canWinIcon} ${canWinText}</p>
          <p style="color: #999; font-size: 11px; margin-top: 3px;">${hpAfterText}</p>
        </div>
        
        ${traitsHtml}
        ${descText}
        
        <!-- Build特效提示 + 精英词缀警告 -->
        ${(() => {
          const tags = [];
          // 精英词缀警告标签
          if (scaledEnemy.affix) {
            const af = scaledEnemy.affix;
            if (af.dodgeChance) tags.push('<span style="color:#8844aa;background:rgba(136,68,170,0.15);padding:2px 8px;border-radius:4px;font-size:11px;">🌑 闪避' + Math.round(af.dodgeChance*100) + '%</span>');
            if (af.reflectPct) tags.push('<span style="color:#44ff44;background:rgba(68,255,68,0.1);padding:2px 8px;border-radius:4px;font-size:11px;">🌿 反刺' + Math.round(af.reflectPct*100) + '%</span>');
            if (af.lifeSteal) tags.push('<span style="color:#ff4488;background:rgba(255,68,136,0.1);padding:2px 8px;border-radius:4px;font-size:11px;">🩸 敌方吸血' + Math.round(af.lifeSteal*100) + '%</span>');
            if (af.poisonDmg) tags.push('<span style="color:#88ff00;background:rgba(136,255,0,0.1);padding:2px 8px;border-radius:4px;font-size:11px;">☠ 毒伤' + Math.round(af.poisonDmg*100) + '%HP/回合</span>');
          }
          if (preview.isDouble) tags.push('<span style="color:#ffcc44;background:rgba(255,204,68,0.1);padding:2px 8px;border-radius:4px;font-size:11px;">⚡ 二连击</span>');
          if (preview.burnDmg > 0) tags.push('<span style="color:#ff6633;background:rgba(255,102,51,0.1);padding:2px 8px;border-radius:4px;font-size:11px;">🔥 灼烧+' + preview.burnDmg + '/回合</span>');
          if (preview.reflectDmg > 0) tags.push('<span style="color:#6699ff;background:rgba(102,153,255,0.1);padding:2px 8px;border-radius:4px;font-size:11px;">🛡 反伤' + preview.reflectDmg + '</span>');
          if (preview.isDaoist) tags.push('<span style="color:#aa66ff;background:rgba(170,102,255,0.1);padding:2px 8px;border-radius:4px;font-size:11px;">✦ 法术+' + preview.spellDmgEst + '</span>');
          if (preview.lifeStealPerHit > 0) tags.push('<span style="color:#ff4466;background:rgba(255,68,102,0.1);padding:2px 8px;border-radius:4px;font-size:11px;">🩸 吸血+' + preview.lifeStealPerHit + '/击</span>');
          if (preview.hasIceChip) tags.push('<span style="color:#66ccff;background:rgba(102,204,255,0.1);padding:2px 8px;border-radius:4px;font-size:11px;">❄ 冰冻减攻</span>');
          if (preview.acidDmg > 0) tags.push('<span style="color:#88ff33;background:rgba(136,255,51,0.1);padding:2px 8px;border-radius:4px;font-size:11px;">☠ 酸血反噬-' + preview.acidDmg + '</span>');
          return tags.length > 0 ? '<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin-top:8px;">' + tags.join('') + '</div>' : '';
        })()}
        
        <!-- 加成明细 -->
        <div id="preview-bonus-info" style="text-align:center;margin-bottom:6px;min-height:14px;"></div>

        <!-- 姿态选择 -->
        <div style="display:flex;gap:6px;justify-content:center;margin-top:8px;flex-wrap:wrap;" id="stance-selector">
          ${getAvailableStances().map(s => {
            const active = getCurrentStance().id === s.id;
            return '<button class="stance-btn" data-stance="' + s.id + '" style="' +
              'background:' + (active ? 'rgba(255,255,255,0.1)' : 'transparent') + ';' +
              'border:1px solid ' + (active ? s.color : '#33333380') + ';' +
              'color:' + (active ? s.color : '#666') + ';' +
              'padding:4px 10px;cursor:pointer;font-size:11px;border-radius:6px;' +
              'font-family:inherit;transition:all 0.2s;' +
              (active ? 'box-shadow:0 0 8px ' + s.color + '33;' : '') +
              '"title="' + s.desc + '">' + s.icon + ' ' + s.name + '</button>';
          }).join('')}
        </div>
        
        <!-- 待生效增益提示 -->
        <div id="pending-buffs-preview" style="text-align:center;margin-top:6px;min-height:16px;"></div>
        
        <!-- 按钮 -->
        <div style="display: flex; gap: 12px; justify-content: center; margin-top: 12px;">
          <button id="btn-fight" style="
            background: rgba(255,68,68,0.15); border: 2px solid #ff4444; color: #ff4444;
            padding: 10px 30px; cursor: pointer; font-size: 15px; font-weight: bold;
            font-family: inherit; border-radius: 8px; transition: all 0.2s;
          ">⚔ 战斗</button>
          <button id="btn-use-item" style="
            background: rgba(68,200,100,0.12); border: 1px solid #44cc66; color: #44cc66;
            padding: 10px 20px; cursor: pointer; font-size: 13px;
            font-family: inherit; border-radius: 8px; transition: all 0.2s;
          ">📦 道具</button>
          <button id="btn-retreat" style="
            background: rgba(100,100,100,0.1); border: 1px solid #555; color: #888;
            padding: 10px 30px; cursor: pointer; font-size: 14px;
            font-family: inherit; border-radius: 8px; transition: all 0.2s;
          ">← 撤退</button>
        </div>
        <p style="color:#444; font-size:10px; text-align:center; margin-top:8px;">空格/F = 战斗 · Q = 道具 · Esc/R = 撤退</p>
      </div>
    </div>
  `;
  
  document.getElementById('btn-fight').addEventListener('click', () => {
    overlay.innerHTML = '';
    gameState.setState(GAME_STATE.EXPLORING);
    startCombat(enemy, scaledEnemy);
  });
  
  document.getElementById('btn-retreat').addEventListener('click', () => {
    overlay.innerHTML = '';
    gameState.setState(GAME_STATE.EXPLORING);
  });
  
  // ── 战前道具面板 ──
  document.getElementById('btn-use-item').addEventListener('click', () => {
    _showPreBattleItemPanel(overlay, scaledEnemy, enemy);
  });
  
  // 姿态切换事件 — 切换时实时重算预测
  document.querySelectorAll('.stance-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const sid = btn.dataset.stance;
      if (setStance(sid)) {
        // 更新UI高亮
        document.querySelectorAll('.stance-btn').forEach(b => {
          const s = getAvailableStances().find(st => st.id === b.dataset.stance);
          const isActive = b.dataset.stance === sid;
          b.style.background = isActive ? 'rgba(255,255,255,0.1)' : 'transparent';
          b.style.borderColor = isActive ? (s?.color || '#fff') : '#33333380';
          b.style.color = isActive ? (s?.color || '#fff') : '#666';
          b.style.boxShadow = isActive ? '0 0 8px ' + (s?.color || '#fff') + '33' : 'none';
        });
        // 实时重算战斗预测
        _updateBattlePreviewNumbers(scaledEnemy);
      }
    });
  });
  
  // 显示已有增益和加成明细
  _updatePendingBuffsPreview();
  _updateBattlePreviewNumbers(scaledEnemy);
  
  // Keyboard shortcuts
  const kh = (e) => {
    if (e.key === ' ' || e.key === 'Enter' || e.key === 'f') {
      overlay.innerHTML = '';
      gameState.setState(GAME_STATE.EXPLORING);
      startCombat(enemy, scaledEnemy);
      document.removeEventListener('keydown', kh);
    } else if (e.key === 'q') {
      _showPreBattleItemPanel(overlay, scaledEnemy, enemy);
      document.removeEventListener('keydown', kh);
    } else if (e.key === 'Escape' || e.key === 'r') {
      overlay.innerHTML = '';
      gameState.setState(GAME_STATE.EXPLORING);
      document.removeEventListener('keydown', kh);
    }
  };
  document.addEventListener('keydown', kh);
}

// ── 战斗 ──
// ── 战前道具子面板 ──
function _updateBattlePreviewNumbers(scaledEnemy) {
  const p = gameState.player;
  const newPreview = previewBattle(p, scaledEnemy);
  const newEffAtk = getEffectiveAtk(p);
  const newEffDef = getEffectiveDef(p);
  const stanceInfo = getCurrentStance();
  const streakBonus = killStreak.getBonus();

  // 更新玩家属性栏
  const playerPanel = document.getElementById('preview-player-stats');
  if (playerPanel) {
    playerPanel.innerHTML =
      `<p style="color:#6699ff; font-size:11px; letter-spacing:2px; margin-bottom:4px;">郑吒 Lv.${p.level}</p>` +
      `<p style="color:#eee; font-size:13px;">HP <span style="color:#44ff88">${p.hp}</span>/${p.maxHp}</p>` +
      `<p style="color:#ff8866; font-size:12px;">ATK ${newEffAtk}${p.weapon ? ' <span style="color:#665533;font-size:10px;">(+' + (p.weapon.atk||0) + ')</span>' : ''}</p>` +
      `<p style="color:#6688ff; font-size:12px;">DEF ${newEffDef}${p.armor ? ' <span style="color:#334466;font-size:10px;">(+' + (p.armor.def||0) + ')</span>' : ''}</p>` +
      `<p style="color:${stanceInfo.color}; font-size:10px;">${stanceInfo.icon} ${stanceInfo.name}</p>`;
  }

  // 更新伤害预测栏
  const dmgPanel = document.getElementById('preview-damage-calc');
  if (dmgPanel) {
    const canWinColor = newPreview.canWin ? '#44ff88' : '#ff4444';
    const canWinIcon = newPreview.canWin ? '✓' : '✗';
    const canWinText = newPreview.canWin
      ? `${newPreview.turnsNeeded}回合击败 · 受伤${newPreview.totalDamage}`
      : '无法击败 — 建议撤退';
    dmgPanel.innerHTML =
      `<div style="flex:1;text-align:center;"><p style="color:#ff8866;font-size:11px;">你的伤害</p><p style="color:#ffaa66;font-size:16px;font-weight:bold;">${newPreview.playerDmgPerHit}${newPreview.isDouble ? ' ×2' : ''}</p></div>` +
      `<div style="flex:1;text-align:center;"><p style="color:#6688ff;font-size:11px;">敌方伤害</p><p style="color:#6688ff;font-size:16px;font-weight:bold;">${newPreview.enemyDmgPerHit}</p></div>` +
      `<div style="flex:1;text-align:center;"><p style="color:${canWinColor};font-size:11px;">${canWinIcon} 预测</p><p style="color:${canWinColor};font-size:12px;">${canWinText}</p></div>`;
  }

  // 更新连杀/词缀加成栏
  const bonusPanel = document.getElementById('preview-bonus-info');
  if (bonusPanel) {
    const parts = [];
    if (streakBonus.atkPct > 0) parts.push('<span style="color:#ff6644;font-size:10px;">🔥连杀 ATK+' + streakBonus.atkPct + '%</span>');
    if (streakBonus.crt > 0) parts.push('<span style="color:#ffaa44;font-size:10px;">⚡连杀 CRT+' + streakBonus.crt + '</span>');
    const affixFx = getAllAffixEffects(p);
    if (affixFx.flatAtk > 0) parts.push('<span style="color:#ff8833;font-size:10px;">⚔词缀 ATK+' + affixFx.flatAtk + '</span>');
    if (affixFx.flatDef > 0) parts.push('<span style="color:#6688ff;font-size:10px;">🛡词缀 DEF+' + affixFx.flatDef + '</span>');
    if (affixFx.lifesteal > 0) parts.push('<span style="color:#ff4488;font-size:10px;">🩸吸血' + Math.round(affixFx.lifesteal*100) + '%</span>');
    if (affixFx.thorns > 0) parts.push('<span style="color:#44ff44;font-size:10px;">🌿荆棘' + Math.round(affixFx.thorns*100) + '%</span>');
    bonusPanel.innerHTML = parts.length > 0 ? parts.join(' · ') : '';
  }
}

function _updatePendingBuffsPreview() {
  const el = document.getElementById('pending-buffs-preview');
  if (!el) return;
  const buffs = gameState._pendingBuffs || [];
  if (buffs.length === 0) { el.innerHTML = ''; return; }
  el.innerHTML = buffs.map(b => {
    const def = CONSUMABLE_DEFS[b.source];
    return '<span style="color:#44cc66;font-size:11px;background:rgba(68,204,102,0.1);padding:2px 8px;border-radius:4px;margin:0 2px;">' +
      (def?.icon || '⚔') + ' ' + (def?.name || b.stat) + '</span>';
  }).join('');
}

// ── 探索中道具面板（Q键） ──



// ── 制作信息 ──
function _showCredits() {
  const overlay = document.getElementById('ui-overlay');
  overlay.innerHTML = `
    <div style="position:absolute;top:0;left:0;right:0;bottom:0;
      display:flex;align-items:center;justify-content:center;
      background:rgba(0,0,0,0.95);" id="credits-backdrop">
      <div style="max-width:500px;width:90%;text-align:center;animation:fadeIn 1s;">
        <h1 style="color:#ff4444;font-size:40px;letter-spacing:8px;
          text-shadow:0 0 40px rgba(255,68,68,0.4);margin-bottom:8px;">
          无限恐怖
        </h1>
        <p style="color:#666;font-size:16px;letter-spacing:6px;margin-bottom:40px;">中 洲 轮 回</p>
        
        <div style="color:#888;font-size:13px;line-height:2.2;">
          <p style="color:#aaa;font-size:14px;margin-bottom:16px;">— 制作信息 —</p>
          <p>原著 <span style="color:#ddd;">《无限恐怖》 · zhttty</span></p>
          <p>游戏设计与开发 <span style="color:#ddd;">AI Codex Agent</span></p>
          <p>策划监督 <span style="color:#ddd;">肖钒</span></p>
          <p style="margin-top:20px;color:#555;">───────</p>
          <p style="margin-top:16px;">本作基于同名小说改编</p>
          <p>采用2D Canvas魔塔式战斗系统</p>
          <p style="color:#555;margin-top:16px;">
            ${new Date().getFullYear()} · Made with ❤
          </p>
          <p style="color:#444;font-size:11px;margin-top:12px;">
            技术栈: Vite + Canvas2D + 程序化生成
          </p>
          <p style="color:#444;font-size:11px;">
            62个源文件 · 22000+行代码 · 12章72层
          </p>
        </div>
        
        <button id="btn-close-credits" style="
          margin-top:30px;background:transparent;border:1px solid #333;
          color:#666;padding:8px 30px;cursor:pointer;font-size:14px;
          font-family:inherit;border-radius:6px;">返回</button>
      </div>
    </div>
  `;
  
  document.getElementById('btn-close-credits')?.addEventListener('click', () => {
    overlay.innerHTML = '';
  });
  document.getElementById('credits-backdrop')?.addEventListener('click', (e) => {
    if (e.target.id === 'credits-backdrop') overlay.innerHTML = '';
  });
  const kh = (e) => {
    if (e.key === 'Escape') { overlay.innerHTML = ''; document.removeEventListener('keydown', kh); }
  };
  document.addEventListener('keydown', kh);
}

// ── 暂停菜单 (Esc) ──
function _showPauseMenu() {
  if (gameState.state !== GAME_STATE.EXPLORING) return;
  const overlay = document.getElementById('ui-overlay');
  const p = gameState.player;
  
  overlay.innerHTML = `
    <div style="position:absolute;top:0;left:0;right:0;bottom:0;
      display:flex;align-items:center;justify-content:center;
      background:rgba(0,0,0,0.75);" id="pause-backdrop">
      <div style="background:rgba(8,8,18,0.98);border:1px solid #444;border-radius:16px;
        padding:30px;max-width:400px;width:90%;text-align:center;">
        <h2 style="color:#888;letter-spacing:6px;font-size:20px;margin-bottom:24px;">
          ⏸ 暂 停
        </h2>
        <p style="color:#555;font-size:12px;margin-bottom:20px;">
          第${gameState.chapter}章 · Lv.${p.level} · HP ${p.hp}/${p.maxHp}
        </p>
        <div style="display:flex;flex-direction:column;gap:10px;max-width:240px;margin:0 auto;">
          <button class="pause-btn" id="pause-resume" style="
            background:rgba(68,255,136,0.1);border:1px solid #44ff8844;color:#44ff88;
            padding:12px;cursor:pointer;font-size:15px;font-family:inherit;
            border-radius:8px;letter-spacing:2px;">▶ 继续游戏</button>
          <button class="pause-btn" id="pause-save" style="
            background:rgba(68,136,255,0.08);border:1px solid #4488ff33;color:#4488ff;
            padding:10px;cursor:pointer;font-size:13px;font-family:inherit;
            border-radius:8px;letter-spacing:2px;">💾 手动存档</button>
          <button class="pause-btn" id="pause-settings" style="
            background:rgba(255,204,68,0.08);border:1px solid #ffcc4433;color:#ffcc44;
            padding:10px;cursor:pointer;font-size:13px;font-family:inherit;
            border-radius:8px;letter-spacing:2px;">⚙ 设置</button>
          <button class="pause-btn" id="pause-help" style="
            background:rgba(100,100,100,0.08);border:1px solid #55555533;color:#888;
            padding:10px;cursor:pointer;font-size:13px;font-family:inherit;
            border-radius:8px;letter-spacing:2px;">❓ 操作帮助</button>
          <button class="pause-btn" id="pause-quit" style="
            background:rgba(255,68,68,0.06);border:1px solid #ff444422;color:#ff6666;
            padding:10px;cursor:pointer;font-size:13px;font-family:inherit;
            border-radius:8px;letter-spacing:2px;">🏠 回到主菜单</button>
        </div>
        <p style="color:#333;font-size:10px;margin-top:16px;">Esc 继续</p>
      </div>
    </div>
  `;
  
  const close = () => { overlay.innerHTML = ''; };
  
  document.getElementById('pause-resume')?.addEventListener('click', close);
  document.getElementById('pause-save')?.addEventListener('click', () => {
    autoSave('手动存档');
    renderer.notify('💾 已手动存档', '#44aaff', 90);
    close();
  });
  document.getElementById('pause-settings')?.addEventListener('click', () => {
    close();
    showSettingsPanel();
  });
  document.getElementById('pause-help')?.addEventListener('click', () => {
    close();
    showHelpPanel();
  });
  document.getElementById('pause-quit')?.addEventListener('click', () => {
    autoSave('退出前存档');
    close();
    showMainMenu();
  });
  document.getElementById('pause-backdrop')?.addEventListener('click', (e) => {
    if (e.target.id === 'pause-backdrop') close();
  });
  
  const kh = (e) => {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', kh); }
  };
  document.addEventListener('keydown', kh);
}

// ── 战斗统计面板 (T键) ──
function _showCombatStatsPanel() {
  if (gameState.state !== GAME_STATE.EXPLORING) return;
  const overlay = document.getElementById('ui-overlay');
  const p = gameState.player;
  const s = gameState.stats;
  const companions = gameState.companions || [];
  const aliveComps = companions.filter(c => c.alive).length;
  const totalComps = companions.length;
  const playTime = Math.floor((Date.now() - (s.startTime || Date.now())) / 60000);
  const kd = s.deathCount > 0 ? (s.enemiesKilled / s.deathCount).toFixed(1) : s.enemiesKilled;
  const avgDmgPerKill = s.enemiesKilled > 0 ? Math.floor(s.damageDealt / s.enemiesKilled) : 0;
  const ratingStats = getRatingStats();
  
  overlay.innerHTML = `
    <div style="position:absolute;top:0;left:0;right:0;bottom:0;
      display:flex;align-items:center;justify-content:center;
      background:rgba(0,0,0,0.88);" id="stats-backdrop">
      <div style="background:rgba(8,8,18,0.98);border:1px solid #445566;border-radius:16px;
        padding:24px;max-width:580px;width:96%;max-height:85vh;overflow-y:auto;">
        <h2 style="color:#44aaff;letter-spacing:4px;font-size:18px;text-align:center;margin-bottom:16px;">
          📊 战斗统计
        </h2>
        
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
          <div style="background:rgba(255,68,68,0.05);border:1px solid #ff444422;border-radius:8px;padding:12px;">
            <p style="color:#ff6644;font-size:11px;letter-spacing:2px;">⚔ 战斗</p>
            <p style="color:#ff8866;font-size:24px;font-weight:bold;">${s.enemiesKilled}</p>
            <p style="color:#666;font-size:10px;">敌人击杀</p>
            <p style="color:#888;font-size:10px;margin-top:4px;">Boss: ${s.bossesKilled || 0} · K/D: ${kd}</p>
          </div>
          <div style="background:rgba(68,255,136,0.05);border:1px solid #44ff8822;border-radius:8px;padding:12px;">
            <p style="color:#44ff88;font-size:11px;letter-spacing:2px;">💰 经济</p>
            <p style="color:#ffcc44;font-size:24px;font-weight:bold;">${p.gold || 0}G</p>
            <p style="color:#666;font-size:10px;">当前金币</p>
            <p style="color:#888;font-size:10px;margin-top:4px;">总收入: ${s.goldEarned || 0}G · 支出: ${s.goldSpent || 0}G</p>
          </div>
          <div style="background:rgba(68,136,255,0.05);border:1px solid #4488ff22;border-radius:8px;padding:12px;">
            <p style="color:#4488ff;font-size:11px;letter-spacing:2px;">📈 伤害</p>
            <p style="color:#aabbff;font-size:24px;font-weight:bold;">${s.damageDealt || 0}</p>
            <p style="color:#666;font-size:10px;">总输出伤害</p>
            <p style="color:#888;font-size:10px;margin-top:4px;">受伤: ${s.damageTaken || 0} · 单次最高: ${s.maxSingleHit || 0}</p>
            <p style="color:#888;font-size:10px;">暴击: ${s.criticalHits || 0}次 · 均伤: ${avgDmgPerKill}/杀</p>
          </div>
          <div style="background:rgba(255,204,68,0.05);border:1px solid #ffcc4422;border-radius:8px;padding:12px;">
            <p style="color:#ffcc44;font-size:11px;letter-spacing:2px;">🗺 探索</p>
            <p style="color:#ccaa44;font-size:24px;font-weight:bold;">${s.floorsCleared || 0}</p>
            <p style="color:#666;font-size:10px;">层数通过</p>
            <p style="color:#888;font-size:10px;margin-top:4px;">步数: ${s.stepsWalked || 0} · 回合: ${s.turnsPlayed || 0}</p>
            <p style="color:#888;font-size:10px;">章节: ${s.chaptersCleared || 0}/12 · 线索: ${s.loreFound || 0}</p>
          </div>
        </div>
        
        ${ratingStats.total > 0 ? `
        <div style="background:rgba(255,204,68,0.05);border:1px solid #ffcc4422;border-radius:8px;padding:10px;margin-bottom:12px;">
          <p style="color:#ffcc44;font-size:11px;letter-spacing:2px;margin-bottom:4px;">🏆 战斗评级</p>
          <p style="color:#888;font-size:11px;">
            S级: <span style="color:#ffcc44">${ratingStats.S}</span> · 
            A级: <span style="color:#44ff88">${ratingStats.A || 0}</span> · 
            均分: <span style="color:#aaa">${ratingStats.avgScore}</span> · 
            总计: ${ratingStats.total}场
          </p>
        </div>` : ''}
        
        ${(() => { try { const es = getEliteStats(); const t = es.rare + es.elite + es.legendary; return t > 0 ? `
        <div style="background:rgba(170,68,255,0.05);border:1px solid #aa44ff22;border-radius:8px;padding:10px;margin-bottom:12px;">
          <p style="color:#aa44ff;font-size:11px;letter-spacing:2px;margin-bottom:4px;">◆ 精英怪物</p>
          <p style="color:#888;font-size:11px;">
            稀有: <span style="color:#4488ff">${es.rare}</span> · 
            精英: <span style="color:#aa44ff">${es.elite}</span> · 
            传说: <span style="color:#ff8800">${es.legendary}</span> · 
            总计: <span style="color:#ccc">${t}</span>
          </p>
        </div>` : ''; } catch { return ''; } })()}
        <div style="background:rgba(68,136,255,0.04);border:1px solid #4488ff22;border-radius:8px;padding:10px;margin-bottom:12px;">
          <p style="color:#4488ff;font-size:11px;letter-spacing:2px;margin-bottom:4px;">👥 队伍</p>
          <p style="color:#888;font-size:11px;">
            同伴: ${aliveComps}/${totalComps}存活 · 
            Lv.${p.level} · 
            死亡: ${s.deathCount}次 · 
            游玩: ${playTime}分钟
          </p>
        </div>

        <div style="text-align:center;margin-top:12px;">
          <button id="btn-close-stats-panel" style="
            background:transparent;border:1px solid #444;color:#888;
            padding:8px 30px;cursor:pointer;font-size:14px;font-family:inherit;
            border-radius:6px;">关闭 (T/Esc)</button>
        </div>
      </div>
    </div>
  `;
  
  const close = () => { overlay.innerHTML = ''; };
  document.getElementById('btn-close-stats-panel')?.addEventListener('click', close);
  document.getElementById('stats-backdrop')?.addEventListener('click', (e) => {
    if (e.target.id === 'stats-backdrop') close();
  });
  const kh = (e) => {
    if (e.key === 't' || e.key === 'Escape') { close(); document.removeEventListener('keydown', kh); }
  };
  document.addEventListener('keydown', kh);
}

function _showExplorationItemPanel() {
  if (gameState.state !== GAME_STATE.EXPLORING) return;
  gameState.setState(GAME_STATE.INVENTORY);
  const items = getInventoryList();
  const overlay = document.getElementById('ui-overlay');

  const itemsHtml = items.length === 0
    ? '<p style="color:#555;text-align:center;font-size:12px;">无可用道具</p>'
    : items.map(item => {
      const canUse = item.category !== 'escape'; // 烟雾弹仅战斗时可用
      return '<div style="display:flex;justify-content:space-between;align-items:center;' +
        'background:rgba(255,255,255,0.03);border:1px solid #33333380;' +
        'border-radius:6px;padding:8px 12px;margin-bottom:4px;">' +
        '<div style="flex:1;">' +
        '<span style="font-size:14px;">' + item.icon + '</span> ' +
        '<span style="color:#ddd;font-size:13px;">' + item.name + '</span>' +
        '<span style="color:#888;font-size:10px;margin-left:4px;">×' + item.count + '</span>' +
        '<p style="color:#666;font-size:10px;margin-top:2px;">' + item.desc + '</p>' +
        '</div>' +
        (canUse ? '<button class="explore-use-btn" data-cid="' + item.id + '" style="' +
        'background:rgba(68,204,136,0.12);border:1px solid #44cc88;' +
        'color:#44cc88;padding:5px 14px;cursor:pointer;font-size:12px;' +
        'border-radius:4px;font-family:inherit;">使用</button>' : 
        '<span style="color:#555;font-size:10px;">仅战斗</span>') +
        '</div>';
    }).join('');

  overlay.innerHTML = '<div style="' +
    'position:absolute;top:0;left:0;right:0;bottom:0;' +
    'display:flex;align-items:center;justify-content:center;' +
    'background:rgba(0,0,0,0.8);" id="item-backdrop">' +
    '<div style="' +
    'background:rgba(10,10,20,0.97);border:1px solid #44cc88;border-radius:14px;' +
    'padding:24px;max-width:450px;width:90%;max-height:75vh;overflow-y:auto;">' +
    '<h3 style="color:#44cc88;text-align:center;letter-spacing:4px;margin-bottom:14px;">📦 道具背包</h3>' +
    itemsHtml +
    '<div style="text-align:center;margin-top:16px;">' +
    '<button id="btn-close-items" style="' +
    'background:transparent;border:1px solid #444;color:#888;' +
    'padding:8px 30px;cursor:pointer;font-size:13px;font-family:inherit;border-radius:6px;">关闭 (Q)</button>' +
    '</div></div></div>';

  const closeItems = () => { overlay.innerHTML = ''; gameState.setState(GAME_STATE.EXPLORING); };

  document.getElementById('btn-close-items').addEventListener('click', closeItems);
  document.getElementById('item-backdrop').addEventListener('click', (e) => {
    if (e.target.id === 'item-backdrop') closeItems();
  });

  // 使用按钮
  overlay.querySelectorAll('.explore-use-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const cid = btn.dataset.cid;
      const result = useConsumable(cid);
      if (result.success) {
        const def = CONSUMABLE_DEFS[cid];
        renderer.addFloatText(result.effect, gameState.player.x, gameState.player.y - 1, 'rgb(100, 255, 150)');
        
        // 特殊效果处理
        if (def?.effect?.revealTraps) {
          // 揭示当前层所有陷阱
          for (const e of entities) {
            if (e.type === ENTITY_TYPE.TRAP) e.visible = true;
          }
          renderer.addFloatText('🔍 陷阱已揭示!', gameState.player.x, gameState.player.y - 2, 'rgb(68, 204, 255)');
        }
        
        // 刷新面板
        _showExplorationItemPanel();
      }
    });
  });

  const kh = (e) => {
    if (e.key === 'q' || e.key === 'Escape') { closeItems(); document.removeEventListener('keydown', kh); }
  };
  document.addEventListener('keydown', kh);
}

function _rebindPreBattleButtons(overlay, scaledEnemy, enemy) {
  const fightBtn = document.getElementById('btn-fight');
  const retreatBtn = document.getElementById('btn-retreat');
  const itemBtn = document.getElementById('btn-use-item');
  
  if (fightBtn) fightBtn.addEventListener('click', () => {
    overlay.innerHTML = '';
    gameState.setState(GAME_STATE.EXPLORING);
    startCombat(enemy, scaledEnemy);
  });
  if (retreatBtn) retreatBtn.addEventListener('click', () => {
    overlay.innerHTML = '';
    gameState.setState(GAME_STATE.EXPLORING);
  });
  if (itemBtn) itemBtn.addEventListener('click', () => {
    _showPreBattleItemPanel(overlay, scaledEnemy, enemy);
  });
  _updatePendingBuffsPreview();
  // 重新绑定姿态按钮
  document.querySelectorAll('.stance-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const sid = btn.dataset.stance;
      setStance(sid);
      document.querySelectorAll('.stance-btn').forEach(b => {
        const s = getAvailableStances().find(st => st.id === b.dataset.stance);
        const isActive = b.dataset.stance === sid;
        b.style.borderColor = isActive ? (s?.color || '#888') : '#333';
        b.style.background = isActive ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)';
      });
    });
  });

  // 键盘快捷键
  const kh = (e) => {
    if (e.key === ' ' || e.key === 'Enter' || e.key === 'f') {
      overlay.innerHTML = '';
      gameState.setState(GAME_STATE.EXPLORING);
      startCombat(enemy, scaledEnemy);
      document.removeEventListener('keydown', kh);
    } else if (e.key === 'q') {
      _showPreBattleItemPanel(overlay, scaledEnemy, enemy);
      document.removeEventListener('keydown', kh);
    } else if (e.key === 'Escape' || e.key === 'r') {
      overlay.innerHTML = '';
      gameState.setState(GAME_STATE.EXPLORING);
      document.removeEventListener('keydown', kh);
    }
  };
  document.addEventListener('keydown', kh);
}

function _showPreBattleItemPanel(overlay, scaledEnemy, enemy) {
  const items = getInventoryList();
  const usableItems = items.filter(i => i.category === 'heal' || i.category === 'buff' || i.category === 'cure');
  
  if (usableItems.length === 0) {
    // 闪烁提示无可用道具
    const btn = document.getElementById('btn-use-item');
    if (btn) { btn.style.borderColor = '#ff4444'; btn.style.color = '#ff4444'; setTimeout(() => { btn.style.borderColor = '#44cc66'; btn.style.color = '#44cc66'; }, 500); }
    return;
  }

  const itemsHtml = usableItems.map(item => {
    const isHeal = item.category === 'heal' || item.category === 'cure';
    const isBuff = item.category === 'buff';
    return '<div style="display:flex;justify-content:space-between;align-items:center;' +
      'background:rgba(255,255,255,0.03);border:1px solid ' + (isBuff ? '#44cc66' : '#44aaff') + '33;' +
      'border-radius:8px;padding:8px 12px;margin-bottom:4px;">' +
      '<div style="flex:1;">' +
      '<span style="font-size:14px;">' + item.icon + '</span> ' +
      '<span style="color:#ddd;font-size:13px;">' + item.name + '</span>' +
      '<span style="color:#888;font-size:11px;margin-left:6px;">×' + item.count + '</span>' +
      '<p style="color:#666;font-size:10px;margin-top:2px;">' + item.desc + '</p>' +
      '</div>' +
      '<button class="prebattle-use-btn" data-item-id="' + item.id + '" style="' +
      'background:' + (isBuff ? 'rgba(68,204,102,0.15)' : 'rgba(68,170,255,0.15)') + ';' +
      'border:1px solid ' + (isBuff ? '#44cc66' : '#44aaff') + ';' +
      'color:' + (isBuff ? '#44cc66' : '#44aaff') + ';' +
      'padding:6px 14px;cursor:pointer;font-size:12px;border-radius:6px;' +
      'font-family:inherit;white-space:nowrap;transition:all 0.2s;' +
      '">使用</button>' +
      '</div>';
  }).join('');

  // 替换 overlay 内容为道具子面板
  const savedHtml = overlay.innerHTML;
  overlay.innerHTML = '<div style="' +
    'position:absolute;top:0;left:0;right:0;bottom:0;' +
    'display:flex;align-items:center;justify-content:center;' +
    'background:rgba(0,0,0,0.85);">' +
    '<div style="' +
    'background:rgba(10,10,20,0.97);border:1px solid #44cc66;border-radius:14px;' +
    'padding:24px;max-width:450px;width:90%;max-height:70vh;overflow-y:auto;">' +
    '<h3 style="color:#44cc66;text-align:center;letter-spacing:4px;margin-bottom:14px;">📦 战前备战</h3>' +
    '<p style="color:#666;text-align:center;font-size:11px;margin-bottom:12px;">使用恢复/增益道具，效果立即或下场战斗生效</p>' +
    itemsHtml +
    '<div style="text-align:center;margin-top:14px;">' +
    '<button id="btn-back-battle" style="' +
    'background:transparent;border:1px solid #555;color:#888;' +
    'padding:8px 30px;cursor:pointer;font-size:13px;font-family:inherit;border-radius:6px;">返回战斗确认</button>' +
    '</div></div></div>';

  // 使用按钮事件
  overlay.querySelectorAll('.prebattle-use-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const itemId = btn.dataset.itemId;
      const result = useConsumable(itemId);
      if (result.success) {
        renderer.addFloatText(result.effect, gameState.player.x, gameState.player.y - 1, 'rgb(100, 255, 150)');
        // 刷新面板
        _showPreBattleItemPanel(overlay, scaledEnemy, enemy);
      }
    });
  });

  // 返回按钮 — 恢复战前确认面板
  document.getElementById('btn-back-battle').addEventListener('click', () => {
    overlay.innerHTML = savedHtml;
    // 重新绑定战前面板事件
    _rebindPreBattleButtons(overlay, scaledEnemy, enemy);
  });
}

function startCombat(enemy, preScaledEnemy) {
  // 战斗发起闪光
  renderer.flash('rgba(255, 50, 50)', 150);
  renderer.shake(3, 150);
  audioEngine.playDamage();
  
  // 使用预缩放敌人（从战前确认传入），避免二次随机缩放导致数值不一致
  const scaledEnemy = applyDynamicScaling(preScaledEnemy || scaleEnemy(enemy, gameState.chapter));
  
  // ── 消耗品战斗增益 ──
  const pendingBuffs = consumePendingBuffs();
  const p = gameState.player;
  const savedStats = { atk: p.atk, def: p.def, crt: p.crt || 0 };
  for (const buff of pendingBuffs) {
    if (buff.stat === 'atk' && buff.multiplier) p.atk = Math.floor(p.atk * buff.multiplier);
    if (buff.stat === 'def' && buff.multiplier) p.def = Math.floor(p.def * buff.multiplier);
    if (buff.stat === 'crt' && buff.bonus) p.crt = (p.crt || 0) + buff.bonus;
    if (buff.penalty) {
      if (buff.penalty.stat === 'def' && buff.penalty.multiplier) p.def = Math.floor(p.def * buff.penalty.multiplier);
      if (buff.penalty.stat === 'atk' && buff.penalty.multiplier) p.atk = Math.floor(p.atk * buff.penalty.multiplier);
    }
  }
  
  const hpBeforeCombat = p.hp;
  const result = executeBattle(scaledEnemy);
  
  // 恢复临时buff修改的基础属性
  if (pendingBuffs.length > 0) {
    p.atk = savedStats.atk;
    p.def = savedStats.def;
    p.crt = savedStats.crt;
  }

  if (result.victory) {
    // 移除被击败的敌人并记录
    const idx = entities.indexOf(enemy);
    if (idx >= 0) entities.splice(idx, 1);
    gameState.markEntityRemoved(currentFloorIndex, enemy.id);
    
        // 记录怪物图鉴
    try { const actualDamageTaken = Math.max(0, hpBeforeCombat - gameState.player.hp); bestiary.record(scaledEnemy, { victory: true, damageDealt: scaledEnemy.hp, damageTaken: actualDamageTaken }); } catch {}
    try { localStorage.setItem('ih_bestiary', JSON.stringify(bestiary.toJSON())); } catch {}

// 连杀记录
    killStreak.recordKill();
    // 成就追踪: 击杀
    try {
      const nearDeath = gameState.player.hp <= gameState.player.maxHp * 0.1;
      achievementTracker.recordKill(scaledEnemy || enemy, { playerHp: gameState.player.hp, nearDeath });
      achievementTracker.recordStreak(killStreak.kills || 0);
    } catch {}
    const streakDisplay = killStreak.getDisplay();
    if (streakDisplay) {
      renderer.addFloatText(streakDisplay.icon + ' ' + streakDisplay.name + ' x' + streakDisplay.kills, gameState.player.x, gameState.player.y - 2, streakDisplay.color);
    }

    // 连杀经验加成
    const streakBonus = killStreak.getBonus();
    if (streakBonus.expPct > 0 && result.rewards?.exp) {
      const bonusExp = Math.floor(result.rewards.exp * streakBonus.expPct / 100);
      gameState.player.exp += bonusExp;
      if (bonusExp > 0) renderer.addFloatText('+' + bonusExp + ' 连杀EXP', gameState.player.x + 1, gameState.player.y - 1.5, '#ffaa44');
    }

    // 连杀回血
    if (streakBonus.healPct > 0) {
      const healAmt = Math.floor(gameState.player.maxHp * streakBonus.healPct / 100);
      gameState.player.hp = Math.min(gameState.player.maxHp, gameState.player.hp + healAmt);
      if (healAmt > 0) renderer.addFloatText('+' + healAmt + ' HP', gameState.player.x - 1, gameState.player.y - 1, '#44ff88');
    }

    // 并肩作战 → 存活同伴关系+3
    for (const c of gameState.companions.filter(c => c.alive)) {
      changeRelationship(c.id, 'fight_together', gameState.relationships);
    }
  }

  // 暴露玩家位置给战斗动画
  window._gamePlayerX = gameState.player.x;
  window._gamePlayerY = gameState.player.y;

  // 播放战斗动画序列
  combatAnimator.playCombatSequence(result, enemy, () => {
    combatResult = result;
    // 记录图鉴（含战败）
    if (!result.victory) { try { bestiary.record(scaledEnemy || enemy, { victory: false }); localStorage.setItem("ih_bestiary", JSON.stringify(bestiary.toJSON())); } catch {} }
    
    // 战斗评级 — 只计算一次
    const battleRating = result.victory ? rateBattle(result, gameState.player) : null;
    if (battleRating) { recordRating(battleRating); result.rating = battleRating; }
      // 成就追踪: 战斗评级
      try { if (battleRating && (battleRating.grade === 'S' || battleRating.grade === 'SS')) achievementTracker.stats.sRatings++; achievementTracker.checkStats(); } catch {}

    // 记录战斗历史
    combatHistory.push({
      enemy: enemy.name,
      victory: result.victory,
      rounds: result.rounds,
      log: result.log,
      floor: chapter.floors[currentFloorIndex]?.id || '?',
      turn: gameState.turn,
      rating: battleRating,
    });
    if (combatHistory.length > 20) combatHistory.shift();
    // 递减持续效果
    const expiredEffects = tickEffects();
    for (const eff of expiredEffects) { renderer.notify(eff.name + ' \u5df2\u6d88\u9000', '#888', 60); } // 保留最近20场
    // 记录到战斗回放系统
    try { recordBattle({ enemy, victory: result.victory, rounds: result.rounds, rating: battleRating, log: result.log, playerHpBefore: hpBeforeCombat, playerHpAfter: p.hp, playerMaxHp: p.maxHp, playerAtk: p.atk, playerDef: p.def, enemyMaxHp: enemy._maxHp || enemy.hp, enemyAtk: enemy.atk, enemyDef: enemy.def, totalDamageDealt: result.totalDamageDealt || 0, totalDamageTaken: result.totalDamageTaken || 0, critCount: result.critCount || 0 }); } catch(err) {}

    if (result.victory) {
      try { victoryFlash(document.getElementById('ui-overlay')); } catch {}
      // 动态难度记录胜利
      try { const hpLostPct = 1 - (p.hp / p.maxHp); ddRecordVictory(hpLostPct); } catch {}
      renderer.addFloatText(battleRating.icon + ' ' + battleRating.grade, gameState.player.x, gameState.player.y - 2.5, battleRating.color);
      renderer.addFloatText(`+${scaledEnemy.rewards?.exp || 0} EXP`, enemy.x, enemy.y - 1, 'rgb(170, 136, 255)');
      if (scaledEnemy.rewards?.gold) renderer.addFloatText(`+${scaledEnemy.rewards.gold}G`, enemy.x, enemy.y - 0.4, 'rgb(255, 204, 68)');
      // 词缀金币/经验加成
      const affixBonus = getAllAffixEffects(gameState.player);
      if (affixBonus.goldBonus > 0 && scaledEnemy.rewards?.gold) {
        const extraGold = Math.floor(scaledEnemy.rewards.gold * affixBonus.goldBonus / 100);
        gameState.player.gold = (gameState.player.gold || 0) + extraGold;
        if (extraGold > 0) renderer.addFloatText('+' + extraGold + 'G(词缀)', enemy.x + 1, enemy.y - 0.5, 'rgb(255, 200, 100)');
      }
      if (affixBonus.expBonus > 0 && scaledEnemy.rewards?.exp) {
        const extraExp = Math.floor(scaledEnemy.rewards.exp * affixBonus.expBonus / 100);
        gameState.player.exp += extraExp;
        if (extraExp > 0) renderer.addFloatText('+' + extraExp + 'EXP(词缀)', enemy.x - 1, enemy.y - 0.5, 'rgb(200, 170, 255)');
      }
      if (scaledEnemy.rewards?.rewardPoints) renderer.addFloatText(`+${scaledEnemy.rewards.rewardPoints}RP`, enemy.x + 0.5, enemy.y - 1.5, 'rgb(255, 170, 0)');

      // 里程碑：战斗成就
      try { checkCombatMilestones(milestoneTracker, gameState.stats, enemy, result); } catch {}
      // 里程碑：成长成就（战斗后可能升级/进阶）
      try { checkGrowthMilestones(milestoneTracker, gameState.player); } catch {}

      // Boss击杀特效 + 战斗总结
      if (scaledEnemy.bossId || scaledEnemy.type === 'boss') {
        renderer.shake(8, 600);
        renderer.flash('rgba(255, 200, 0)', 300);
        const actualDmg = Math.max(0, hpBeforeCombat - gameState.player.hp);
        const combatTime = result.rounds || 0;
        const hpPercent = Math.round((gameState.player.hp / gameState.player.maxHp) * 100);
        const ratingStars = hpPercent >= 80 ? '★★★' : hpPercent >= 50 ? '★★☆' : hpPercent >= 20 ? '★☆☆' : '☆☆☆';
        const ratingText = hpPercent >= 80 ? '完美击杀' : hpPercent >= 50 ? '漂亮！' : hpPercent >= 20 ? '险胜' : '惨胜';
        // 暂停探索防止输入穿透
        gameState.setState(GAME_STATE.DIALOGUE);
        setTimeout(() => {
          const overlay = document.getElementById('ui-overlay');
          overlay.innerHTML = `
            <div style="
              position:absolute;top:0;left:0;right:0;bottom:0;
              display:flex;align-items:center;justify-content:center;
              background:rgba(0,0,0,0.75);animation:fadeIn 0.3s;
            ">
              <div style="
                background:rgba(10,10,20,0.97);border:2px solid #ffcc44;
                border-radius:14px;padding:24px;max-width:420px;width:90%;
                box-shadow:0 0 40px rgba(255,204,68,0.2);text-align:center;
              ">
                <p style="color:#ffcc44;font-size:11px;letter-spacing:6px;margin-bottom:4px;">🏆 BOSS DEFEATED 🏆</p>
                <h2 style="color:#ff4444;font-size:22px;margin-bottom:12px;text-shadow:0 0 10px rgba(255,68,68,0.4);">${scaledEnemy.name}</h2>
                <div style="color:#ffcc44;font-size:28px;margin-bottom:8px;">${ratingStars}</div>
                <p style="color:#eee;font-size:16px;margin-bottom:16px;">${ratingText}</p>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px;">
                  <div style="background:rgba(255,255,255,0.05);border-radius:6px;padding:8px;">
                    <p style="color:#888;font-size:10px;">战斗回合</p>
                    <p style="color:#ffcc44;font-size:18px;font-weight:bold;">${combatTime}</p>
                  </div>
                  <div style="background:rgba(255,255,255,0.05);border-radius:6px;padding:8px;">
                    <p style="color:#888;font-size:10px;">受到伤害</p>
                    <p style="color:#ff4444;font-size:18px;font-weight:bold;">${actualDmg}</p>
                  </div>
                  <div style="background:rgba(255,255,255,0.05);border-radius:6px;padding:8px;">
                    <p style="color:#888;font-size:10px;">剩余HP</p>
                    <p style="color:#44ff88;font-size:18px;font-weight:bold;">${hpPercent}%</p>
                  </div>
                  <div style="background:rgba(255,255,255,0.05);border-radius:6px;padding:8px;">
                    <p style="color:#888;font-size:10px;">奖励点</p>
                    <p style="color:#ffaa44;font-size:18px;font-weight:bold;">+${scaledEnemy.rewards?.rewardPoints || scaledEnemy.rewards?.gold || 0}</p>
                  </div>
                </div>
                <button id="btn-boss-ok" style="
                  background:rgba(255,204,68,0.1);border:1px solid #ffcc44;color:#ffcc44;
                  padding:10px 40px;cursor:pointer;font-size:14px;letter-spacing:3px;
                  font-family:inherit;border-radius:8px;transition:all 0.2s;
                " onmouseover="this.style.background='rgba(255,204,68,0.2)'"
                   onmouseout="this.style.background='rgba(255,204,68,0.1)'">继续</button>
              </div>
            </div>
            <style>@keyframes fadeIn{from{opacity:0}to{opacity:1}}</style>
          `;
          const closeBossPanel = () => {
            overlay.innerHTML = '';
            document.removeEventListener('keydown', bkh);
            autoSave('击败Boss: ' + (enemy.name || 'unknown'));
            // 触发boss击败事件和对话
            if (enemy.onDefeat) {
              if (enemy.onDefeat.flag) gameState.setFlag(enemy.onDefeat.flag);
              startDialogue(enemy.onDefeat.lines);
            } else {
              gameState.setState(GAME_STATE.EXPLORING);
            }
          };
          document.getElementById('btn-boss-ok').addEventListener('click', closeBossPanel);
          // 也允许空格/回车关闭
          const bkh = (e) => { if (e.key === ' ' || e.key === 'Enter') closeBossPanel(); };
          document.addEventListener('keydown', bkh);
        }, 800);
      } else {
        // 非Boss战斗简报（只在消耗较大的战斗后显示）
        const actualDmg = Math.max(0, hpBeforeCombat - gameState.player.hp);
        const hpLostPct = Math.round(actualDmg / gameState.player.maxHp * 100);
        if (hpLostPct >= 20 || result.rounds >= 4) {
          // 有意义的战斗，显示简短总结
          const summaryColor = hpLostPct < 30 ? '#44ff88' : hpLostPct < 60 ? '#ffcc44' : '#ff6644';
          renderer.notify(
            `⚔ ${scaledEnemy.name} · ${result.rounds}回合 · -${actualDmg}HP (${hpLostPct}%)`,
            summaryColor, 150
          );
        }
        
        if (enemy.onDefeat) {
          // 非Boss的特殊击败事件
          setTimeout(() => {
            if (enemy.onDefeat.flag) gameState.setFlag(enemy.onDefeat.flag);
            startDialogue(enemy.onDefeat.lines);
          }, 300);
        }
      }
    }

    gameState.save(0); // 自动存档
    try { renderer.showSaveIndicator(); } catch {}
  });
}

// ── 物品拾取 ──
function pickupItem(item) {
  const p = gameState.player;
  audioEngine.playPickup();
  if (item.itemType !== 'key') tutorialManager.trigger('first_item');

  switch (item.itemType) {
    case 'lore':
      if (item.loreId) {
        const discovered = loreTracker.discover(item.loreId);
        if (discovered) {
          gameState.stats.loreFound++;
          const entry = LORE_ENTRIES[item.loreId];
          if (entry) {
            // Show lore popup as a dialogue
            startDialogue([{
              text: entry.text,
              speaker: entry.title,
            }]);
            renderer.addFloatText('线索发现！', item.x, item.y - 1, 'rgb(255, 204, 68)');
            renderer.addParticle(item.x * 48 + 24, item.y * 48 + 24, 'rgb(255, 204, 68)', 8);
          }
        }
      }
      break;
    case 'consumable':
      gameState.stats.itemsUsed++;
      if (item.effect.heal) {
        const healed = gameState.healPlayer(item.effect.heal);
        renderer.addParticle(item.x * TILE_SIZE + TILE_SIZE/2, item.y * TILE_SIZE + TILE_SIZE/2, 'rgb(68, 255, 136)', 6);
        if (healed > 0) {
          renderer.addFloatText(`+${healed} HP`, item.x, item.y, 'rgb(68, 255, 136)');
        } else {
          renderer.addFloatText('HP已满', item.x, item.y, 'rgb(150, 200, 150)');
        }
      }
      break;

    case 'stat_boost':
      if (item.effect.atk) { p.atk += item.effect.atk; renderer.addFloatText(`ATK+${item.effect.atk}`, item.x, item.y, 'rgb(255, 100, 68)'); }
      if (item.effect.def) { p.def += item.effect.def; renderer.addFloatText(`DEF+${item.effect.def}`, item.x, item.y, 'rgb(68, 136, 255)'); }
      if (item.effect.spd) { p.spd += item.effect.spd; renderer.addFloatText(`SPD+${item.effect.spd}`, item.x, item.y, 'rgb(68, 255, 170)'); }
      if (item.effect.crt) { p.crt += item.effect.crt; renderer.addFloatText(`CRT+${item.effect.crt}%`, item.x, item.y, 'rgb(255, 204, 68)'); }
      break;

    case 'weapon':
      if (p.weapon) {
        _showEquipCompare(p.weapon, item.weapon, 'weapon', item);
      } else {
        p.weapon = item.weapon;
        renderer.addFloatText(`装备: ${item.weapon.name}`, item.x, item.y, 'rgb(255, 170, 0)');
        renderer.addParticle(item.x * TILE_SIZE + TILE_SIZE/2, item.y * TILE_SIZE + TILE_SIZE/2, 'rgb(255, 170, 0)', 8);
      }
      break;

    case 'armor':
      if (p.armor) {
        _showEquipCompare(p.armor, item.armor, 'armor', item);
      } else {
        p.armor = item.armor;
        renderer.addFloatText(`装备: ${item.armor.name}`, item.x, item.y, 'rgb(100, 136, 255)');
        renderer.addParticle(item.x * TILE_SIZE + TILE_SIZE/2, item.y * TILE_SIZE + TILE_SIZE/2, 'rgb(100, 136, 255)', 8);
      }
      break;

    case 'accessory':
      if (p.accessory) {
        _showEquipCompare(p.accessory, item.accessory, 'accessory', item);
      } else {
        p.accessory = item.accessory;
        renderer.addFloatText(`装备: ${item.accessory.name}`, item.x, item.y, 'rgb(170, 136, 255)');
        renderer.addParticle(item.x * TILE_SIZE + TILE_SIZE/2, item.y * TILE_SIZE + TILE_SIZE/2, 'rgb(170, 136, 255)', 8);
      }
      break;

    case 'chip':
      if (p.chips.length < p.maxChips) {
        p.chips.push(item.chip);
        renderer.addFloatText(`芯片: ${item.chip.name}`, item.x, item.y, 'rgb(170, 68, 255)');
        renderer.addParticle(item.x * TILE_SIZE + TILE_SIZE/2, item.y * TILE_SIZE + TILE_SIZE/2, 'rgb(170, 68, 255)', 8);
      } else {
        renderer.addFloatText('芯片槽已满', item.x, item.y, 'rgb(150, 100, 100)');
        return false;
      }
      break;

    case 'key':
      p.keys[item.keyColor] = (p.keys[item.keyColor] || 0) + 1;
      renderer.addFloatText(`+1 ${item.keyColor === 'yellow' ? '黄色' : item.keyColor === 'blue' ? '蓝色' : '红色'}钥匙`, item.x, item.y, 'rgb(255, 204, 68)');
      tutorialManager.trigger('first_key');
      break;

    case 'ammo':
      reloadAmmo(item.effect.ammo || 10);
      renderer.addFloatText(`+${item.effect.ammo} 弹药`, item.x, item.y, 'rgb(170, 221, 255)');
      renderer.addParticle(item.x * TILE_SIZE + TILE_SIZE/2, item.y * TILE_SIZE + TILE_SIZE/2, 'rgb(170, 221, 255)', 6);
      break;

    case 'door':
      if (p.keys[item.doorColor] > 0) {
        p.keys[item.doorColor]--;
        renderer.addFloatText('门已打开', item.x, item.y, 'rgb(136, 102, 68)');
      } else {
        startDialogue([{ text: `需要 ${item.doorColor === 'yellow' ? '黄色' : item.doorColor === 'blue' ? '蓝色' : '红色'} 门卡才能打开。`, speaker: '系统' }]);
        return false; // 不移除门，不允许移动
      }
      break;
  }

  // 移除已拾取的物品并记录
  const idx = entities.indexOf(item);
  if (idx >= 0) entities.splice(idx, 1);
  gameState.markEntityRemoved(currentFloorIndex, item.id);

  eventBus.emit('item:pickup', item);
  return true;
}

// ── 事件触发 ──
function triggerEvent(entity) {
  const evt = entity.event;
  if (!evt) return;

  // ── 陷阱事件 ──
  if (evt.isTrap && evt.trapType) {
    const result = fireTrap(evt.trapType, gameState.chapter || 1);
    const p = gameState.player;
    if (result.dodged) {
      renderer.addFloatText('💨 闪避!', p.x, p.y - 1, 'rgb(100, 255, 200)');
      renderer.addParticle(p.x * 48 + 24, p.y * 48 + 24, 'rgba(100,255,200,0.6)', 6);
      audioEngine.playPickup();
    } else {
      renderer.addFloatText(`-${result.damage}`, p.x, p.y - 1, 'rgb(255, 80, 80)');
      renderer.shake(4, 200);
      renderer.flash('rgba(255, 50, 50)', 150);
      audioEngine.playDamage();
    }
    // 移除已触发陷阱
    const idx = entities.indexOf(entity);
    if (idx >= 0) entities.splice(idx, 1);
    startDialogue([{ text: result.effect, speaker: '系统' }]);
    return;
  }

  // ── 陷阱探测器效果（全局处理） ──
  // (通过道具使用事件在事件总线上处理)

  // ── 宝箱事件 ──
  if (evt.isChest && evt.chestType) {
    const result = openChest(evt.chestType, gameState.chapter || 1);
    const p = gameState.player;
    if (!result.success) {
      startDialogue([{ text: result.message, speaker: '系统' }]);
      return;
    }
    audioEngine.playPickup();
    if (result.trapResult && !result.trapResult.dodged) {
      renderer.shake(3, 150);
      renderer.flash('rgba(255, 100, 0)', 100);
    }
    // 显示奖励浮字
    result.loot.forEach((item, i) => {
      const text = item.type === 'gold' ? `+${item.value}G` : item.type === 'exp' ? `+${item.value}EXP` : item.type === 'heal' ? `+${item.value}HP` : `+${item.stat || item.type}`;
      const color = item.type === 'gold' ? 'rgb(255,204,68)' : item.type === 'exp' ? 'rgb(170,136,255)' : 'rgb(100,255,150)';
      renderer.addFloatText(text, p.x + i * 0.3, p.y - 1 - i * 0.4, color);
    });
    // 移除已开宝箱
    const idx = entities.indexOf(entity);
    if (idx >= 0) entities.splice(idx, 1);
    startDialogue([{ text: result.message, speaker: '系统' }]);
    return;
  }

  audioEngine.playDialogue();

  // 检查是否已触发
  if (evt.flag && gameState.hasFlag(evt.flag)) return;

  // 检查前置条件
  if (evt.requires && !gameState.hasFlag(evt.requires)) {
    startDialogue([{ text: '现在还不能操作这个。还有其他事情需要先完成。', speaker: '系统' }]);
    return;
  }

  const onComplete = () => {
    // 设置标记
    if (evt.flag) gameState.setFlag(evt.flag);
    // 成就追踪: 剧情标记
    try { if (evt.flag) achievementTracker.recordFlag(evt.flag); } catch {}

    // 奖励
    if (evt.rewards) {
      if (evt.rewards.exp) {
        gameState.addExp(evt.rewards.exp);
        try { checkGrowthMilestones(milestoneTracker, gameState.player); } catch {}
      }
      if (evt.rewards.gold) gameState.player.gold += evt.rewards.gold;
    gameState.stats.goldEarned += (evt.rewards.gold);
          // NG+ 变异器: 诅咒黄金 — 拾取金币扣1HP
          if (getActiveMutators().some(m => m.id === 'cursed_gold') && evt.rewards.gold > 0) {
            gameState.player.hp = Math.max(1, gameState.player.hp - 1);
            renderer.addFloatText('💀 -1 HP', gameState.player.x, gameState.player.y - 0.5, 'rgb(255, 100, 100)');
          }
      if (evt.rewards.rewardPoints) gameState.player.rewardPoints += evt.rewards.rewardPoints;
      if (evt.rewards.keys) {
        for (const [color, count] of Object.entries(evt.rewards.keys)) {
          gameState.player.keys[color] = (gameState.player.keys[color] || 0) + count;
        }
      }
    }

    // 基因锁效果
    if (evt.effect?.geneLock) {
      gameState.player.geneLock = evt.effect.geneLock;
      renderer.shake(6, 500);
      // 里程碑：基因锁
      try { checkGrowthMilestones(milestoneTracker, gameState.player); } catch {}
    }

    // 移除队友
    if (evt.removeCompanion) {
      gameState.removeCompanion(evt.removeCompanion);
      // 也从地图实体移除
      const compIdx = entities.findIndex(e => e.id === evt.removeCompanion);
      if (compIdx >= 0) entities.splice(compIdx, 1);
    }

    // 固定死亡事件 — 队友阵亡（不可逆）
    if (evt.companionDeath) {
      const comp = gameState.companions.find(c => c.id === evt.companionDeath);
      if (comp) {
        comp.alive = false;
        changeRelationship(evt.companionDeath, 'sacrifice', gameState.relationships);
        renderer.shake(8, 600);
        renderer.flash('rgba(255, 0, 0)', 500);
        renderer.addFloatText(`${comp.name} 阵亡`, gameState.player.x, gameState.player.y - 1, 'rgb(255, 0, 0)');
        // 阵亡特写通知
        const profile = COMPANION_PROFILES[comp.id];
        const farewell = profile?.deathQuote || profile?.quote || '"……"';
        // 全屏悼念效果
        setTimeout(() => {
          const memorialOverlay = document.getElementById('ui-overlay');
          const prevHtml = memorialOverlay.innerHTML;
          memorialOverlay.innerHTML = '<div style="position:absolute;top:0;left:0;right:0;bottom:0;display:flex;flex-direction:column;align-items:center;justify-content:center;background:rgba(0,0,0,0.95);animation:fadeIn 1s;">' +
            '<p style="color:#ff222266;font-size:48px;margin-bottom:12px;">\u2020</p>' +
            '<h2 style="color:#ff4444;font-size:24px;letter-spacing:8px;margin-bottom:16px;">' + comp.name + '</h2>' +
            '<p style="color:#aa6666;font-size:14px;font-style:italic;max-width:400px;text-align:center;line-height:1.8;">\u201c' + farewell + '\u201d</p>' +
            '<p style="color:#443333;font-size:11px;margin-top:20px;">\u2500\u2500 \u6c38\u8fdc\u79bb\u5f00\u4e86\u961f\u4f0d \u2500\u2500</p>' +
            '<p style="color:#333;font-size:10px;margin-top:24px;">\u70b9\u51fb\u4efb\u610f\u5904\u7ee7\u7eed</p></div>';
          const dismiss = () => { memorialOverlay.innerHTML = prevHtml || ''; memorialOverlay.removeEventListener('click', dismiss); document.removeEventListener('keydown', dismissK); };
          const dismissK = () => dismiss();
          memorialOverlay.addEventListener('click', dismiss);
          document.addEventListener('keydown', dismissK);
          setTimeout(() => { try { dismiss(); } catch {} }, 8000);
        }, 800);
        try { recordMilestone(comp.name + ' \u9635\u4ea1', gameState.chapter, 'companion_death'); } catch {}
      }
      // 也从地图实体移除队友图标
      const compEntIdx = entities.findIndex(e => e.id === evt.companionDeath);
      if (compEntIdx >= 0) entities.splice(compEntIdx, 1);
      gameState.markEntityRemoved(currentFloorIndex, evt.companionDeath);
    }

    // 批量同伴死亡（数组）
    if (evt.companionDeaths && Array.isArray(evt.companionDeaths)) {
      for (const cid of evt.companionDeaths) {
        const comp = gameState.companions.find(c => c.id === cid);
        if (comp) comp.alive = false;
        const compEntIdx = entities.findIndex(e => e.id === cid);
        if (compEntIdx >= 0) entities.splice(compEntIdx, 1);
        gameState.markEntityRemoved(currentFloorIndex, cid);
      }
      renderer.shake(12, 800);
    }

    // 全队阵亡（标记所有存活同伴死亡）
    if (evt.killAllCompanions) {
      for (const comp of gameState.companions) {
        if (comp.alive) {
          comp.alive = false;
          renderer.addFloatText(`${comp.name} 阵亡`, gameState.player.x, gameState.player.y - 1, 'rgb(255, 0, 0)');
        }
      }
      renderer.shake(16, 1000);
    }

    // 复活同伴
    if (evt.reviveCompanion) {
      const comp = gameState.companions.find(c => c.id === evt.reviveCompanion);
      if (comp) {
        comp.alive = true;
        // 复活队友 → 救命之恩
        changeRelationship(evt.reviveCompanion, 'save_life', gameState.relationships);
        renderer.addFloatText(`${comp.name} 复活！`, gameState.player.x, gameState.player.y - 1, 'rgb(68, 255, 136)');
      }
    }
    if (evt.reviveCompanions && Array.isArray(evt.reviveCompanions)) {
      for (const cid of evt.reviveCompanions) {
        const comp = gameState.companions.find(c => c.id === cid);
        if (comp) {
          comp.alive = true;
          renderer.addFloatText(`${comp.name} 复活！`, gameState.player.x, gameState.player.y - 1, 'rgb(68, 255, 136)');
        }
      }
    }

    // 事件中添加同伴
    if (evt.addCompanion) {
      const existing = gameState.companions.find(c => c.id === evt.addCompanion.id);
      if (!existing) {
        gameState.addCompanion(evt.addCompanion);
        // 新队友加入 → 初始好感
        changeRelationship(evt.addCompanion.id, 'honest_talk', gameState.relationships);
        renderer.addFloatText(`${evt.addCompanion.name} 加入！`, gameState.player.x, gameState.player.y - 1, 'rgb(68, 255, 200)');
        tutorialManager.trigger('first_companion');
      }
    }

    // 生成新敌人
    if (evt.spawnEnemies) {
      for (const spawn of evt.spawnEnemies) {
        entities.push({
          type: ENTITY_TYPE.ENEMY,
          id: `spawned_${Date.now()}_${Math.random()}`,
          ...spawn,
          _maxHp: spawn.hp,
        });
      }
    }

    // 章节结束
    if (evt.type === 'chapter_end') {
      // 通关奖励由 evt.rewards.rewardPoints 统一处理（在上方 evt.rewards 块）
      const rp = evt.rewards?.rewardPoints || 1000;
      renderer.addFloatText(`+${rp} 奖励点 (通关)`, gameState.player.x, gameState.player.y - 1, 'rgb(255, 170, 0)');
      // 里程碑：章节通关
      // 成就追踪: 章节完成
      try { achievementTracker.recordChapterComplete(gameState.chapter); } catch {}
      try { checkChapterMilestones(milestoneTracker, gameState.chapter); } catch {}
      try { checkChapterMilestones(milestoneTracker, gameState.chapter); } catch {}
      setTimeout(() => showChapterComplete(), 800);
    }

    // 移除事件实体并记录
    const idx = entities.indexOf(entity);
    if (idx >= 0) entities.splice(idx, 1);
    gameState.markEntityRemoved(currentFloorIndex, entity.id);

    gameState.save(0);
  };

  // 选择型事件
  if (evt.type === 'choice' && evt.choices) {
    startDialogue(evt.lines, null, () => {
      showChoiceUI(evt.choices, (choiceIdx) => {
        const choice = evt.choices[choiceIdx];
        gameState.addChoice(evt.flag, choice.id);

        if (choice.effect) {
          const p = gameState.player;
          if (choice.effect.healFull) { p.hp = p.maxHp; renderer.addFloatText('HP全恢复！', p.x, p.y - 1, 'rgb(68, 255, 136)'); }
          if (choice.effect.atk) { p.atk += choice.effect.atk; renderer.addFloatText(`ATK+${choice.effect.atk}`, p.x, p.y - 1, 'rgb(255, 100, 68)'); }
          if (choice.effect.def) { p.def += choice.effect.def; renderer.addFloatText(`DEF+${choice.effect.def}`, p.x, p.y - 1, 'rgb(68, 136, 255)'); }
          if (choice.effect.spd) { p.spd += choice.effect.spd; renderer.addFloatText(`SPD+${choice.effect.spd}`, p.x, p.y - 1, 'rgb(68, 255, 170)'); }
          if (choice.effect.crt) { p.crt += choice.effect.crt; renderer.addFloatText(`CRT+${choice.effect.crt}%`, p.x, p.y - 1, 'rgb(255, 204, 68)'); }
          if (choice.effect.hp) { p.maxHp += choice.effect.hp; p.hp += choice.effect.hp; renderer.addFloatText(`MaxHP+${choice.effect.hp}`, p.x, p.y - 1, 'rgb(68, 255, 136)'); }
          if (choice.effect.flag) gameState.setFlag(choice.effect.flag);
          // 成就追踪: 抉择标记
          try { if (choice.effect.flag) achievementTracker.recordFlag(choice.effect.flag); } catch {}
          if (choice.effect.description) renderer.notify(choice.effect.description, '#ffcc44', 120);
          // 关系变化
          if (choice.effect.relationship) {
            for (const [companionId, eventId] of Object.entries(choice.effect.relationship)) {
              const r = changeRelationship(companionId, eventId, gameState.relationships);
              if (r && r.levelChanged) {
                const profile = COMPANION_PROFILES[companionId];
                const name = profile?.name || companionId;
                renderer.addFloatText(`${name} → ${r.newLevelName}`, gameState.player.x, gameState.player.y - 2, getRelationshipLevel(r.newValue).color);
              }
            }
          }
          // 全队正面/负面事件
          if (choice.effect.allRelationship) {
            for (const c of gameState.companions.filter(c => c.alive)) {
              changeRelationship(c.id, choice.effect.allRelationship, gameState.relationships);
            }
          }
        }

        startDialogue([{ text: `选择了"${choice.text}"`, speaker: '系统' }], null, onComplete);
      });
    });
    return;
  }

  // 普通对话/事件
  startDialogue(evt.lines, null, onComplete);
}

// ── 对话系统 ──
function startDialogue(lines, entity = null, onComplete = null) {
  dialogueState = { lines, currentLine: 0, entity, onComplete };
  gameState.setState(GAME_STATE.DIALOGUE);
}

function advanceDialogue() {
  if (!dialogueState) return;
  dialogueState.currentLine++;
  if (dialogueState.currentLine >= dialogueState.lines.length) {
    const callback = dialogueState.onComplete;
    dialogueState = null;
    gameState.setState(GAME_STATE.EXPLORING);
    if (callback) callback();
  }
}

// ── 选择UI ──
function showChoiceUI(choices, callback) {
  const overlay = document.getElementById('ui-overlay');
  overlay.innerHTML = `
    <div style="
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.7);
    ">
      <div style="
        background: rgba(10,10,20,0.95); border: 1px solid #ff8844;
        border-radius: 12px; padding: 30px; max-width: 500px; width: 90%;
      ">
        <h3 style="color: #ffcc44; text-align: center; margin-bottom: 20px; letter-spacing: 4px;">
          ？ 做出选择 ？
        </h3>
        ${choices.map((c, i) => `
          <button class="choice-btn" data-idx="${i}" style="
            display: block; width: 100%; margin: 8px 0; padding: 12px 20px;
            background: rgba(255,255,255,0.05); border: 1px solid #444; color: #e0e0e0;
            font-size: 15px; cursor: pointer; border-radius: 8px; text-align: left;
            transition: all 0.2s; font-family: inherit;
          " onmouseover="this.style.borderColor='#ff8844';this.style.background='rgba(255,136,68,0.1)'"
             onmouseout="this.style.borderColor='#444';this.style.background='rgba(255,255,255,0.05)'">
            ${i + 1}. ${c.text}
          </button>
        `).join('')}
        <p style="color: #666; font-size: 12px; text-align: center; margin-top: 16px;">
          点击选项或按数字键选择
        </p>
      </div>
    </div>
  `;

  choiceState = { choices, callback };

  // 绑定点击
  overlay.querySelectorAll('.choice-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      resolveChoice(parseInt(btn.dataset.idx));
    });
  });
}

function resolveChoice(index) {
  if (!choiceState) return;
  const { callback } = choiceState;
  choiceState = null;
  document.getElementById('ui-overlay').innerHTML = '';
  callback(index);
}


// ── 章节选择菜单 ──
function _showChapterSelectMenu() {
  const overlay = document.getElementById('ui-overlay');
  const chapterNames = {
    1: '名为生化', 2: '异形杀戮', 3: '咒怨阴影', 4: '神鬼秘宝',
    5: '死神绝境', 6: '异形再临', 7: '恶魔初临', 8: '重建中洲',
    9: '星河远征', 10: '五队大战', 11: '心魔与终战前奏', 12: '生化终战'
  };
  const chapterIcons = {
    1: '🧬', 2: '👽', 3: '👻', 4: '🏺', 5: '💀', 6: '🛸',
    7: '😈', 8: '⚔', 9: '🚀', 10: '🏰', 11: '🧠', 12: '🔥'
  };
  const chapterColors = {
    1: '#44ff44', 2: '#4488ff', 3: '#aa66ff', 4: '#ffcc44',
    5: '#888888', 6: '#4488ff', 7: '#ff4444', 8: '#ffaa44',
    9: '#44ccff', 10: '#ff6644', 11: '#aa44ff', 12: '#ff2222'
  };
  
  // Check which chapters are unlocked (cleared or currently on)
  const maxChapter = parseInt(localStorage.getItem('ih_max_chapter') || '1');

  overlay.innerHTML = `
    <div style="position:absolute;top:0;left:0;right:0;bottom:0;
      display:flex;align-items:center;justify-content:center;
      background:rgba(0,0,0,0.92);" id="chapter-select-bg">
      <div style="background:rgba(8,8,18,0.98);border:1px solid #445566;border-radius:16px;
        padding:28px;max-width:650px;width:96%;max-height:85vh;overflow-y:auto;">
        <h2 style="color:#44aaff;letter-spacing:4px;font-size:20px;text-align:center;margin-bottom:20px;">
          📖 章 节 选 择
        </h2>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:10px;">
          ${Object.entries(chapterNames).map(([ch, name]) => {
            const num = parseInt(ch);
            const unlocked = num <= maxChapter;
            const color = chapterColors[num] || '#888';
            const icon = chapterIcons[num] || '📖';
            return '<button class="ch-select-btn" data-ch="' + ch + '" ' +
              (unlocked ? '' : 'disabled') +
              ' style="' +
              'background:' + (unlocked ? 'rgba(255,255,255,0.03)' : 'rgba(30,30,30,0.5)') + ';' +
              'border:1px solid ' + (unlocked ? color + '44' : '#222') + ';' +
              'color:' + (unlocked ? color : '#333') + ';' +
              'padding:14px 10px;cursor:' + (unlocked ? 'pointer' : 'default') + ';' +
              'border-radius:8px;font-family:inherit;font-size:12px;text-align:center;' +
              'transition:all 0.2s;' +
              (unlocked ? '' : 'opacity:0.4;') +
              '">' +
              '<span style="font-size:24px;display:block;margin-bottom:4px;">' + icon + '</span>' +
              '第' + ch + '章<br>' +
              '<span style="font-size:10px;">' + name + '</span>' +
              (unlocked ? '' : '<br><span style="font-size:9px;color:#444;">🔒</span>') +
              '</button>';
          }).join('')}
        </div>
        <div style="text-align:center;margin-top:20px;">
          <button id="btn-close-chapter-select" style="
            background:transparent;border:1px solid #444;color:#888;
            padding:8px 30px;cursor:pointer;font-size:14px;font-family:inherit;
            border-radius:6px;">返回 (Esc)</button>
        </div>
      </div>
    </div>
  `;

  // Handlers
  overlay.querySelectorAll('.ch-select-btn:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => {
      const ch = parseInt(btn.dataset.ch);
      overlay.innerHTML = '';
      _startFromChapter(ch);
    });
    btn.addEventListener('mouseover', () => {
      btn.style.background = 'rgba(255,255,255,0.08)';
      btn.style.transform = 'scale(1.03)';
    });
    btn.addEventListener('mouseout', () => {
      btn.style.background = 'rgba(255,255,255,0.03)';
      btn.style.transform = 'scale(1)';
    });
  });

  document.getElementById('btn-close-chapter-select')?.addEventListener('click', () => {
    overlay.innerHTML = '';
    showMainMenu();
  });
  document.getElementById('chapter-select-bg')?.addEventListener('click', (e) => {
    if (e.target.id === 'chapter-select-bg') {
      overlay.innerHTML = '';
      showMainMenu();
    }
  });
  const kh = (e) => {
    if (e.key === 'Escape') {
      document.removeEventListener('keydown', kh);
      overlay.innerHTML = '';
      showMainMenu();
    }
  };
  document.addEventListener('keydown', kh);
}

// ── 从指定章节开始 ──
function _startFromChapter(chapterNum) {
  startNewGame();
  // Override chapter
  gameState.chapter = chapterNum;
  // Scale player stats for chapter
  const p = gameState.player;
  if (chapterNum > 1) {
    p.level = Math.max(p.level, chapterNum * 3);
    p.atk += chapterNum * 3;
    p.def += chapterNum * 2;
    p.maxHp += chapterNum * 20;
    p.hp = p.maxHp;
    p.gold += chapterNum * 50;
    p.rewardPoints += chapterNum * 30;
    p.exp = 0;
    p.geneLock = Math.min(Math.floor(chapterNum / 3), 4);
    if (chapterNum >= 6) p.geneLock = Math.max(p.geneLock, 2);
    if (chapterNum >= 9) p.geneLock = Math.max(p.geneLock, 3);
  }
  
  // Load appropriate chapter
  const generators = {
    1: generateChapter1, 2: generateChapter2, 3: generateChapter3,
    4: generateChapter4, 5: generateChapter5, 6: generateChapter6,
    7: generateChapter7, 8: generateChapter8, 9: generateChapter9,
    10: generateChapter10, 11: generateChapter11, 12: generateChapter12,
  };
  
  chapter = (generators[chapterNum] || generateChapter1)();
  atmosphereRenderer.setChapter(chapterNum);
  currentFloorIndex = 0;
  loadFloor(0);
  gameState.setState(GAME_STATE.EXPLORING);
}

// ── 空格互动 ──
function interactAdjacent() {
  const p = gameState.player;
  const dirs = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
  for (const dir of dirs) {
    const entity = entities.find(e => e.x === p.x + dir.x && e.y === p.y + dir.y);
    if (entity) {
      // 商人NPC → 打开商店（空格互动）
      if ((entity.type === ENTITY_TYPE.NPC || entity.type === ENTITY_TYPE.COMPANION) && entity.merchant) {
        openMerchantShop(entity.name, gameState.chapter);
        return;
      }
      if (entity.type === ENTITY_TYPE.COMPANION && entity.dialogue) {
        startDialogue(entity.dialogue);
        return;
      }
      if (entity.type === ENTITY_TYPE.NPC && entity.dialogue) {
        startDialogue(entity.dialogue, entity);
        return;
      }
      if (entity.type === ENTITY_TYPE.EVENT || entity.type === ENTITY_TYPE.TRAP) {
        triggerEvent(entity);
        return;
      }
      // 对敌人按空格: 显示战斗预判信息
      if (entity.type === ENTITY_TYPE.ENEMY || entity.type === ENTITY_TYPE.BOSS) {
        const preview = previewBattle(p, entity);
        const msg = preview.canWin
          ? `✓ vs ${entity.name}: ${preview.turnsNeeded}回合可胜 (受伤${preview.totalDamage})`
          : `✗ vs ${entity.name}: 无法击败！需要更强的攻击力`;
        renderer.notify(msg, preview.canWin ? 'rgb(68,255,136)' : 'rgb(255,68,68)', 120);
        return;
      }
    }
  }
}

// ── 基因锁 ──
function toggleGeneLock() {
  const p = gameState.player;
  if (p.geneLock <= GENE_LOCK.LOCKED) {
    renderer.addFloatText('基因锁尚未开启', p.x, p.y - 1, 'rgb(255, 102, 0)');
    return;
  }
  p.geneLockActive = !p.geneLockActive;
  if (p.geneLockActive) {
    renderer.addFloatText(`基因锁${p.geneLock}阶 · 激活！`, p.x, p.y - 1, 'rgb(255, 102, 0)');
    renderer.shake(3, 200);
    renderer.addParticle(p.x * TILE_SIZE + TILE_SIZE / 2, p.y * TILE_SIZE + TILE_SIZE / 2, 'rgb(255, 102, 0)', 8);
    audioEngine.playGeneLock();
  } else {
    renderer.addFloatText('基因锁 · 解除', p.x, p.y - 1, 'rgb(180, 180, 180)');
  }
}

// ── 章节完成 ──
function showChapterComplete() {
  autoSave('章节完成');
  // 记录成长快照
  try { const _p = gameState.player; const _s = gameState.stats; recordChapterSnapshot(gameState.chapter, { level: _p.level, maxHp: _p.maxHp, atk: _p.atk, def: _p.def, spd: _p.spd || 5, crt: _p.crt || 0, gold: _p.gold || 0, geneLock: _p.geneLock || 0, activeBloodline: _p.activeBloodline, _totalKills: _s.enemiesKilled, _totalDeaths: _s.deathCount, weapon: _p.weapon, armor: _p.armor }); } catch {}
  // Save max unlocked chapter
  try {
    const prevMax = parseInt(localStorage.getItem('ih_max_chapter') || '1');
    if (gameState.chapter + 1 > prevMax) {
      localStorage.setItem('ih_max_chapter', String(gameState.chapter + 1));
    }
  } catch {}
  gameStarted = false;
  if (!gameState._chapterClearCounted) { gameState.stats.chaptersCleared++; gameState._chapterClearCounted = true; }
  const p = gameState.player;
  const chapterNum = gameState.chapter;
  const chapterNames = { 1: '名为生化', 2: '异形杀戮', 3: '咒怨阴影', 4: '神鬼秘宝', 5: '死神绝境', 6: '异形再临', 7: '恶魔初临', 8: '重建中洲', 9: '星河远征', 10: '五队大战', 11: '心魔与终战前奏', 12: '生化终战' };
  const chapterRecaps = {
    1: '郑吒从生化危机的世界中活了下来。蜂巢实验室的噩梦还未散去，但主神已经在准备下一场轮回。中洲队初步成型，但前路漫漫。',
    2: '异形飞船上的杀戮结束了。皇后的嘶鸣还在耳畔回荡。这一次，郑吒学会了——恐惧不能消灭你，但恐惧能让你变强。',
    3: '伽椰子的诅咒终于被封印。咒怨的世界教会了中洲队：有些敌人不能用力量击败，需要智慧和牺牲。楚轩的录像带揭示了更大的秘密。',
    4: '复活真经到手，但代价惨重。印洲队的伏击让团队付出了血的教训。在古埃及的沙漠中，郑吒明白了——强大不是一个人的事。',
    5: '死神的世界无处可逃。张杰的告别让每个人都沉默了。但郑吒的选择证明了——真正的队长，是在最黑暗的时刻站出来的人。',
    6: '又一次面对异形，但这次不同了。中洲队更强了。程啸的加入为队伍注入了新的力量。然而，更大的挑战已在前方等待。',
    7: '恶魔队出现了。在浣熊市的废墟中，郑吒见识到了真正的敌人——不是怪物，而是同样来自主神空间的人。郑吒选择了复活，选择了不再逃避。',
    8: '楚轩复活了。中洲队终于再度完整。在侏罗纪世界的磨练中，团队的配合达到了新的高度。前方，是更强大的对手——五队混战。',
    9: '星河远征结束。脑虫被成功捕获。在虫族的星球上，郑吒领悟了战略的重要性。下一个世界，是真正的战场——五队大战。',
    10: '魔戒世界的五队混战终于落幕。联盟与背叛交织，每一步都是生死抉择。幸存下来的中洲队，将迎来最后的考验。',
    11: '心魔被破除，郑吒觉醒了真正的力量。变形金刚、猛鬼街、天煞……每一场试炼都是对心灵的锤炼。现在，该是终结一切的时候了。',
    12: '一切结束了。主神碎片被摧毁，恶魔队被击败。中洲队的轮回之旅画上了句号。但故事并未真正结束——因为恐惧永远存在，而面对恐惧的勇气，也永远不会消失。',
  };
  const nextChapterNames = { 1: '异形一', 2: '咒怨', 3: '神鬼秘宝', 4: '死神绝境', 5: '异形再临', 6: '恶魔初临', 7: '重建中洲', 8: '星河远征', 9: '五队大战', 10: '心魔与终战前奏', 11: '生化终战', 12: '终局' };
  const chapterName = chapterNames[chapterNum] || `第${chapterNum}章`;
  const nextWorld = nextChapterNames[chapterNum];

  const overlay = document.getElementById('ui-overlay');
  overlay.innerHTML = `
    <div style="
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.9);
    ">
      <p style="font-size: 14px; color: #ff4444; letter-spacing: 6px; margin-bottom: 8px;">
        第${chapterNum}章 · ${chapterName}
      </p>
      <h1 style="font-size: 48px; color: #e0e0e0; letter-spacing: 8px; margin-bottom: 30px;">
        — 完 —
      </h1>
      <div style="
        background: rgba(20,20,30,0.9); border: 1px solid #333; border-radius: 12px;
        padding: 30px; max-width: 500px; width: 90%;
      ">
        <p style="color:#888;font-size:12px;line-height:1.8;margin-bottom:16px;font-style:italic;
        border-left:2px solid #ff444433;padding-left:12px;">
        ${chapterRecaps[chapterNum] || '又一次轮回结束了。'}
      </p>
      <h3 style="color: #ffcc44; margin-bottom: 16px;">轮回结算</h3>
        <p style="color: #aaa; line-height: 1.8;">
          ⚔ 击杀: ${p.stats?.enemiesKilled || gameState.stats.enemiesKilled}<br>
          💀 死亡: ${gameState.stats.deathCount}<br>
          📊 等级: Lv.${p.level}<br>
          💰 获得金币: ${p.gold}G<br>
          ⬡ 奖励点: ${p.rewardPoints}<br>
          🧬 基因锁: ${p.geneLock > 0 ? p.geneLock + '阶' : '未开启'}<br>
          📝 回合数: ${gameState.stats.turnsPlayed}
        </p>
        <hr style="border-color: #333; margin: 16px 0;">
        <p style="color: #888; font-size: 14px; line-height: 1.6;">
          存活: ${gameState.companions.filter(c=>c.alive).map(c=>c.name).join('、') || '无'}
          ${gameState.companions.filter(c=>!c.alive).length > 0 ? '<br>阵亡: ' + gameState.companions.filter(c=>!c.alive).map(c=>c.name).join('、') : ''}
        </p>
        ${(() => {
          try {
            const relSummary = getRelationshipSummary(gameState.relationships);
            if (relSummary.length === 0) return '';
            const bondCount = relSummary.filter(r => r.value >= 71).length;
            const friendCount = relSummary.filter(r => r.value >= 11 && r.value < 71).length;
            return '<div style="margin-top:8px;padding:8px;background:rgba(255,170,0,0.05);border:1px solid rgba(255,170,0,0.15);border-radius:6px;">' +
              '<p style="color:#ffaa00;font-size:11px;margin-bottom:4px;">同伴羁绊</p>' +
              relSummary.slice(0,6).map(r =>
                '<span style="color:' + r.color + ';font-size:11px;margin-right:8px;">' + r.name + ' ' + r.level + '(' + r.value + ')</span>'
              ).join('') +
              (bondCount > 0 ? '<p style="color:#ffaa00;font-size:10px;margin-top:4px;">✦ ' + bondCount + '个羁绊已达成</p>' : '') +
            '</div>';
          } catch { return ''; }
        })()}
        <p style="color:#555;font-size:12px;margin-top:8px;font-style:italic;">
          ${chapterNum >= 12 ? '"这不是结束。只要记忆还在，我们就不会真正消亡。"' : '"欢迎回到主神空间。十天后，你们将前往下一个世界。"'}
        </p>
      </div>
      <button id="btn-enter-hub" style="
        margin-top: 30px; background: transparent; border: 1px solid #444;
        color: #ffffff; padding: 14px 50px; cursor: pointer; font-size: 18px;
        letter-spacing: 6px; font-family: inherit; border-radius: 8px;
        transition: all 0.3s;
      " onmouseover="this.style.borderColor='#ffffff';this.style.background='rgba(255,255,255,0.1)'"
         onmouseout="this.style.borderColor='#444';this.style.background='transparent'">
        进入主神空间
      </button>
    </div>
  `;

  document.getElementById('btn-enter-hub').addEventListener('click', () => {
    renderLordGodSpace(() => {
      // 从主神空间离开 — 进入下一章或结束
      // 每日挑战完成检测
      if (gameState._dailyChallengeActive) {
        try {
          const today = new Date().toISOString().split('T')[0];
          const elapsed = Math.floor((Date.now() - (gameState._dailyChallengeStart || Date.now())) / 1000);
          const score = gameState.stats.enemiesKilled * 10 + (gameState.player.level || 1) * 50;
          completeDailyChallenge(today, elapsed, score);
          gameState._dailyChallengeActive = false;
        } catch {}
      }      const nextChapter = gameState.chapter + 1;
      const chapterGenerators = { 2: generateChapter2, 3: generateChapter3, 4: generateChapter4, 5: generateChapter5, 6: generateChapter6, 7: generateChapter7, 8: generateChapter8, 9: generateChapter9, 10: generateChapter10, 11: generateChapter11, 12: generateChapter12 };
      const gen = chapterGenerators[nextChapter];

      if (gen) {
        // 有下一章 — 过渡画面后直接开始
        overlay.innerHTML = `
          <div style="
            position: absolute; top: 0; left: 0; right: 0; bottom: 0;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            background: rgba(0,0,0,0.95);
          ">
            <p style="color: #888; font-size: 14px; letter-spacing: 4px; margin-bottom: 16px;">十天后</p>
            <h2 style="color: #e0e0e0; letter-spacing: 6px; margin-bottom: 16px;">
              白色光柱将你们送往了下一个世界
            </h2>
            <p style="color: #ff8844; font-size: 28px; font-weight: bold; letter-spacing: 8px; margin-bottom: 30px;">
              ${nextWorld || '未知世界'}
            </p>
            <button id="btn-next-chapter" style="
              background: transparent; border: 2px solid #ff4444; color: #ff4444;
              padding: 14px 50px; cursor: pointer; font-size: 18px;
              letter-spacing: 6px; font-family: inherit; border-radius: 8px;
              transition: all 0.3s;
            " onmouseover="this.style.background='rgba(255,68,68,0.15)'"
               onmouseout="this.style.background='transparent'">
              开始轮回
            </button>
          </div>
        `;
        document.getElementById('btn-next-chapter').addEventListener('click', () => {
          // 播放下一章过场动画
          const cutscenes = { 2: showChapter2Cutscene, 3: showChapter3Cutscene, 4: showChapter4Cutscene, 5: showChapter5Cutscene, 6: showChapter6Cutscene, 7: showChapter7Cutscene, 8: showChapter8Cutscene, 9: showChapter9Cutscene, 10: showChapter10Cutscene, 11: showChapter11Cutscene, 12: showChapter12Cutscene };
          const cutsceneFn = cutscenes[nextChapter];
          const doStart = () => {
          gameState.chapter = nextChapter;
          gameState._chapterClearCounted = false;
          gameState.nodeIndex = 0;
          // 清除已移除实体（新章节新地图）
          gameState.removedEntityIds = {};

          // 根据章节添加新队友
          if (nextChapter === 2) {
            // Ch2新人：楚轩、零点、霸王、李帅西
            const existingIds = gameState.companions.map(c => c.id);
            const ch2Companions = [
              { id: 'chuxuan', name: '楚轩', role: '军师/战略家', alive: true },
              { id: 'lingdian', name: '零点', role: '狙击手', alive: true },
              { id: 'bawang', name: '霸王', role: '近战强手', alive: true },
              { id: 'lishuaixi', name: '李帅西', role: '新人', alive: true },
            ];
            for (const c of ch2Companions) {
              if (!existingIds.includes(c.id)) gameState.addCompanion(c);
            }
            // 按原著：牟钢在Ch1已死，Ch2李萧毅仍存活到异形世界
          }

          if (nextChapter === 3) {
            // Ch3新人：赵樱空、齐腾一、铭烟薇
            const existingIds = gameState.companions.map(c => c.id);
            const ch3Companions = [
              { id: 'zhao_yingkong', name: '赵樱空', role: '精神感应', alive: true },
              { id: 'qi_tengyi', name: '齐腾一', role: '远程射手', alive: true },
              { id: 'ming_yanwei', name: '铭烟薇', role: '新人', alive: true },
            ];
            for (const c of ch3Companions) {
              if (!existingIds.includes(c.id)) gameState.addCompanion(c);
            }
          }

          if (nextChapter === 4) {
            // Ch4新人：张恒、萧宏律
            const existingIds = gameState.companions.map(c => c.id);
            const ch4Companions = [
              { id: 'zhang_heng', name: '张恒', role: '古武高手', alive: true },
              { id: 'xiao_honglv', name: '萧宏律', role: '鼓舞师', alive: true },
            ];
            for (const c of ch4Companions) {
              if (!existingIds.includes(c.id)) gameState.addCompanion(c);
            }
          }

          if (nextChapter === 5) {
            const existingIds = gameState.companions.map(c => c.id);
            const ch5Companions = [
              { id: 'wang_xia', name: '王侠', role: '国家计划', alive: true },
            ];
            for (const c of ch5Companions) {
              if (!existingIds.includes(c.id)) gameState.addCompanion(c);
            }
          }

          if (nextChapter === 6) {
            const existingIds = gameState.companions.map(c => c.id);
            if (!existingIds.includes('cheng_xiao')) gameState.addCompanion({ id: 'cheng_xiao', name: '程啸', role: '武器专家', alive: true });
          }

          // Ch7恶魔初临：无新队友加入（恶魔队对战章节）

          chapter = gen();
          gameState.worldName = chapter.world;
          currentFloorIndex = 0;
          overlay.innerHTML = '';
          loadFloor(0);
          gameStarted = true;
          if (!gameLoopRunning) { gameLoopRunning = true; gameLoop(); }
          gameState.save(0);
          };
          if (cutsceneFn) cutsceneFn(doStart);
          else doStart();
        });
      } else {
        // 无更多章节 — 游戏通关
        const isGameComplete = chapterNum >= 12;
        if (isGameComplete) {
          // ── Ch12 通关结算 ──
          overlay.innerHTML = `
            <div style="
              position: absolute; top: 0; left: 0; right: 0; bottom: 0;
              display: flex; flex-direction: column; align-items: center; justify-content: center;
              background: linear-gradient(180deg, rgba(0,0,0,0.98) 0%, rgba(10,5,15,0.95) 50%, rgba(0,0,0,0.98) 100%);
              animation: fadeIn 2s ease;
            ">
              <p style="color: #666; font-size: 14px; letter-spacing: 6px; margin-bottom: 20px;">THE END</p>
              <h1 style="
                color: #ff4444; font-size: 48px; letter-spacing: 10px;
                text-shadow: 0 0 30px rgba(255,68,68,0.3);
                margin-bottom: 8px;
              ">无限恐怖</h1>
              <p style="color: #888; letter-spacing: 6px; margin-bottom: 40px;">中 洲 轮 回 · 完</p>
              <div style="color: #666; max-width: 500px; text-align: center; line-height: 2; margin-bottom: 40px;">
                <p>最终幸存者：<span style="color: #e0c080;">郑吒、刘郁、林俊天</span></p>
                <br>
                <p style="font-size: 13px;">十二个世界。无数次生死。</p>
                <p style="font-size: 13px;">他们用生命换来了——活着的权利。</p>
                <br>
                <p style="color: #555; font-size: 12px; font-style: italic;">
                  "只要活着，就有希望。" —— 郑吒
                </p>
              </div>
              <div style="color: #444; font-size: 11px; letter-spacing: 2px; margin-bottom: 30px;">
                <p>通关等级: Lv.${p.level} · 总奖励点: ${p.rewardPoints}</p>
                <p>存活同伴: ${gameState.companions.filter(c=>c.alive).length} / ${gameState.companions.length}</p>
                <p>击杀: ${gameState.stats.enemiesKilled} · 死亡: ${gameState.stats.deathCount} · 回合: ${gameState.stats.turnsPlayed}</p>
              </div>

              <!-- 角色追忆 -->
              <div style="max-width:500px;margin-bottom:24px;animation:scrollCredits 15s ease-in-out;">
                <div style="text-align:center;margin-bottom:16px;">
                  <p style="color:#ffcc44;font-size:12px;letter-spacing:4px;margin-bottom:12px;">中 洲 队 全 员</p>
                  ${gameState.companions.map(c => {
                    const alive = c.alive;
                    const color = alive ? '#44ff88' : '#664444';
                    const icon = alive ? '●' : '✝';
                    return '<p style="color:' + color + ';font-size:12px;line-height:2;">' + icon + ' ' + c.name + (c.role ? ' — ' + c.role : '') + '</p>';
                  }).join('')}
                  <p style="color:#44aaff;font-size:12px;line-height:2;margin-top:4px;">● 郑吒 — 主角·队长</p>
                </div>
                <hr style="border:none;border-top:1px solid #222;margin:12px 0;">
                <div style="text-align:center;color:#444;font-size:10px;letter-spacing:2px;line-height:1.8;">
                  <p>原著: 无限恐怖 · zhttty</p>
                  <p>改编制作: AI Game Studio</p>
                  <p>引擎: HTML5 Canvas · Vite</p>
                  <br>
                  <p style="color:#555;">感谢每一位坚持到最后的玩家。</p>
                  <p style="color:#555;">无限恐怖的故事，在你心中延续。</p>
                </div>
              </div>
              <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center;">
                <button id="btn-ng-plus" style="
                  background: transparent; border: 2px solid #ffcc44; color: #ffcc44;
                  padding: 14px 40px; cursor: pointer; font-size: 16px;
                  letter-spacing: 4px; font-family: inherit; border-radius: 8px;
                  transition: all 0.3s;
                " onmouseover="this.style.background='rgba(255,204,68,0.1)'"
                   onmouseout="this.style.background='transparent'">🔄 开始下一周目</button>
                <button onclick="location.reload()" style="
                  background: transparent; border: 1px solid #555; color: #888;
                  padding: 14px 40px; cursor: pointer; font-size: 14px;
                  letter-spacing: 4px; font-family: inherit; border-radius: 8px;
                  transition: all 0.3s;
                " onmouseover="this.style.background='rgba(100,100,100,0.1)'"
                   onmouseout="this.style.background='transparent'">返回标题</button>
              </div>
            </div>
            <style>@keyframes fadeIn{from{opacity:0}to{opacity:1}}@keyframes scrollCredits{0%{opacity:0;transform:translateY(20px)}20%{opacity:1;transform:translateY(0)}80%{opacity:1}100%{opacity:0.8}}</style>
          `;
          // ── NG+ 结算逻辑 ──
          setTimeout(() => {
            const ngBtn = document.getElementById('btn-ng-plus');
            if (ngBtn) {
              ngBtn.addEventListener('click', () => {
                const ngData = ngPlusState.completeClear(gameState.player, gameState.stats);
                try { localStorage.setItem('ih_ngplus', JSON.stringify(ngPlusState.toJSON())); } catch {}
                try { localStorage.setItem('ih_ngplus_carry', JSON.stringify(ngData)); } catch {}
                try { localStorage.setItem('ih_bestiary', JSON.stringify(bestiary.toJSON())); } catch {}
                const clearHtml = formatClearScreen(ngData, gameState.stats);
                overlay.innerHTML = `
                  <div style="
                    position:absolute;top:0;left:0;right:0;bottom:0;
                    display:flex;flex-direction:column;align-items:center;justify-content:center;
                    background:rgba(0,0,0,0.98);overflow-y:auto;padding:40px 20px;
                  ">
                    ${clearHtml}
                    <div style="margin-top:30px;color:#666;font-size:12px;">
                      <p>继承数据已保存。下一周目敌人将更加强大……</p>
                    </div>
                    <button onclick="location.reload()" style="
                      margin-top:20px;background:transparent;border:2px solid #ffcc44;color:#ffcc44;
                      padding:14px 50px;cursor:pointer;font-size:16px;letter-spacing:6px;
                      font-family:inherit;border-radius:8px;transition:all 0.3s;
                    " onmouseover="this.style.background='rgba(255,204,68,0.1)'"
                       onmouseout="this.style.background='transparent'">进入下一周目</button>
                  </div>
                `;
              });
            }
          }, 100);
        } else {
          // 非终章 — 章节结算
          overlay.innerHTML = `
            <div style="
              position: absolute; top: 0; left: 0; right: 0; bottom: 0;
              display: flex; flex-direction: column; align-items: center; justify-content: center;
              background: rgba(0,0,0,0.95);
            ">
              <h2 style="color: #e0e0e0; letter-spacing: 6px; margin-bottom: 16px;">
                第${chapterNum}章 · 完
              </h2>
              <p style="color: #888; max-width: 500px; text-align: center; line-height: 1.8; margin-bottom: 30px;">
                郑吒用十天时间整备完毕。但前方的世界——<br>
                <strong style="color: #ff8844;">${nextWorld || '更多恐怖'}</strong><br><br>
                <em style="color: #555;">即将到来...</em>
              </p>
              <button onclick="location.reload()" style="
                background: transparent; border: 1px solid #444; color: #888;
                padding: 12px 40px; cursor: pointer; font-size: 16px;
                letter-spacing: 4px; font-family: inherit; border-radius: 8px;
              ">返回主菜单</button>
            </div>
          `;
        }
      }
    });
  });
}
