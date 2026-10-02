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
import { initPanelContext, showInventoryPanel, showStatsPanel, showBestiaryPanel, showRelationshipPanel, showHelpPanel, showFullMap, showCombatLog } from './core/UIPanels.js';
import { ngPlusState, formatClearScreen, formatCycleInfo, TITLES, getActiveMutators } from './core/NewGamePlus.js';
import { fadeBlackTransition, chapterIntroTransition, floorTransition, victoryFlash } from './core/TransitionSystem.js';
import { MiniMap } from './core/MiniMap.js';
import { atmosphereRenderer } from './core/AtmosphereSystem.js';
import { tutorialManager } from './core/TutorialSystem.js';

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
let gameLoopRunning = false; // 防止gameLoop重复启动

// ── 初始化 ──
window.addEventListener('load', async () => {
  const canvas = document.getElementById('game-canvas');
  renderer = new Renderer(canvas);

  const fill = document.querySelector('#loading-bar .fill');
  
  // 实际加载资产
  fill.style.width = '30%';
  await assetLoader.loadAll();
  fill.style.width = '100%';
  
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

      <div id="menu-difficulty" style="margin-top: 24px; display: flex; gap: 8px;"></div>

    </div>
      <p style="
        position: absolute; bottom: 30px; font-size: 12px; color: #444;
        letter-spacing: 2px; z-index: 1;
      ">WASD移动 · 碰撞敌人战斗 · 空格互动/对话 · 鼠标悬停查看信息</p>
    </div>
  `;

  document.getElementById('btn-new-game').addEventListener('click', () => {
    showOpeningCutscene(() => startNewGame());
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
  gameState.player.x = floor.playerStart.x;
  gameState.player.y = floor.playerStart.y;

  // 实例化实体（保留原始maxHp，过滤已移除的）
  const removedIds = gameState.getRemovedEntityIds(index);
  entities = floor.entities
    .filter(e => !removedIds.has(e.id))
    .map(e => {
      const clone = { ...e };
      if (clone.hp !== undefined) clone._maxHp = clone.hp;
      return clone;
    });

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
  gameStarted = false;
  audioEngine.playDamage();
  renderer.shake(10, 800);

  setTimeout(() => {
    const overlay = document.getElementById('ui-overlay');
    overlay.innerHTML = `
      <div style="
        position: absolute; top: 0; left: 0; right: 0; bottom: 0;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        background: rgba(80, 0, 0, 0.85);
        animation: fadeIn 0.5s;
      ">
        <h1 style="font-size: 56px; color: #ff2222; letter-spacing: 8px;
          text-shadow: 0 0 40px rgba(255,34,34,0.6); margin-bottom: 16px;">
          轮 回 终 结
        </h1>
        <p style="color: #cc8888; font-size: 18px; margin-bottom: 40px;">
          郑吒在${chapter.floors[currentFloorIndex]?.name || '未知区域'}中陨落...
        </p>
        <div style="background: rgba(0,0,0,0.4); border-radius: 10px; padding: 16px 24px; margin-bottom: 20px; max-width: 400px;">
          <p style="color: #aa6666; font-size: 12px; letter-spacing: 3px; margin-bottom: 8px;">轮回记录</p>
          <p style="color: #cc8888; font-size: 13px; line-height: 1.8;">
            等级 Lv.${gameState.player.level} · 击杀 ${gameState.stats.enemiesKilled} · 
            回合 ${gameState.stats.turnsPlayed} · 死亡 ${gameState.stats.deathCount}<br>
            ${gameState.player.activeBloodline !== 'none' ? '血统: ' + gameState.player.activeBloodline + ' · ' : ''}
            ${gameState.player.geneLock > 0 ? '基因锁' + gameState.player.geneLock + '阶' : ''}
          </p>
        </div>
        <p style="color: #664444; font-size: 13px; max-width: 500px; text-align: center; line-height: 1.6; margin-bottom: 20px; font-style: italic;">
          "死亡不过是另一种开始。在主神的世界里，每一次失败都是通往更强大的你的阶梯。"
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
function gameLoop() {
  if (!gameStarted) { gameLoopRunning = false; return; }

  const floor = chapter.floors[currentFloorIndex];
  renderer.render(floor, entities, hoveredEntity, dialogueState, combatResult);

  // 迷你地图
  if (window._miniMap && window._miniMap.visible) {
    try { window._miniMap.draw(floor, gameState.player, entities); } catch {}
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
    renderer.notify('💾 手动存档完成', '#44ff88', 90);
    return;
  }
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
      case 's':
        // 统计面板
        showStatsPanel();
        return;
      case 'b':
        // 怪物图鉴
        showBestiaryPanel();
        return;
      case 'r':
        // 同伴关系面板
        showRelationshipPanel();
        return;
            case 'Tab':
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
      default: return;
    }
    if (dx !== 0 || dy !== 0) {
      e.preventDefault();
      movePlayer(dx, dy);
    }
  }
});

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

  // 墙壁
  if (tile === TILE.WALL || tile === TILE.VOID) return;

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
  gameState.stats.stepsWalked = (gameState.stats.stepsWalked || 0) + 1;
  if (gameState.stats.stepsWalked === 1) tutorialManager.trigger("first_move");

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

// ── 战前确认 ──
function showCombatConfirm(enemy) {
  tutorialManager.trigger('first_combat_confirm');
  const p = gameState.player;
  // 难度缩放：根据章节动态调整敌人属性
  const scaledEnemy = scaleEnemy(enemy, gameState.chapter);
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
          <div style="flex:1; background:rgba(68,136,255,0.06); border:1px solid rgba(68,136,255,0.15); border-radius:8px; padding:10px; text-align:center;">
            <p style="color:#6699ff; font-size:11px; letter-spacing:2px; margin-bottom:4px;">郑吒 Lv.${p.level}</p>
            <p style="color:#eee; font-size:13px;">HP <span style="color:#44ff88">${p.hp}</span>/${p.maxHp}</p>
            <p style="color:#ff8866; font-size:12px;">ATK ${effectiveAtk}${p.weapon ? ' <span style="color:#665533;font-size:10px;">(+' + (p.weapon.atk||0) + ')</span>' : ''}</p>
            <p style="color:#6688ff; font-size:12px;">DEF ${effectiveDef}${p.armor ? ' <span style="color:#334466;font-size:10px;">(+' + (p.armor.def||0) + ')</span>' : ''}</p>
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
        <div style="display:flex; gap:8px; margin-bottom: 10px; text-align:center;">
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
        
        <!-- 按钮 -->
        <div style="display: flex; gap: 12px; justify-content: center; margin-top: 12px;">
          <button id="btn-fight" style="
            background: rgba(255,68,68,0.15); border: 2px solid #ff4444; color: #ff4444;
            padding: 10px 30px; cursor: pointer; font-size: 15px; font-weight: bold;
            font-family: inherit; border-radius: 8px; transition: all 0.2s;
          ">⚔ 战斗</button>
          <button id="btn-retreat" style="
            background: rgba(100,100,100,0.1); border: 1px solid #555; color: #888;
            padding: 10px 30px; cursor: pointer; font-size: 14px;
            font-family: inherit; border-radius: 8px; transition: all 0.2s;
          ">← 撤退</button>
        </div>
        <p style="color:#444; font-size:10px; text-align:center; margin-top:8px;">空格/F = 战斗 · Esc/R = 撤退</p>
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
  
  // Keyboard shortcuts
  const kh = (e) => {
    if (e.key === ' ' || e.key === 'Enter' || e.key === 'f') {
      overlay.innerHTML = '';
      gameState.setState(GAME_STATE.EXPLORING);
      startCombat(enemy, scaledEnemy);
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
function startCombat(enemy, preScaledEnemy) {
  // 战斗发起闪光
  renderer.flash('rgba(255, 50, 50)', 150);
  renderer.shake(3, 150);
  audioEngine.playDamage();
  
  // 使用预缩放敌人（从战前确认传入），避免二次随机缩放导致数值不一致
  const scaledEnemy = preScaledEnemy || scaleEnemy(enemy, gameState.chapter);
  const hpBeforeCombat = gameState.player.hp;
  const result = executeBattle(scaledEnemy);

  if (result.victory) {
    // 移除被击败的敌人并记录
    const idx = entities.indexOf(enemy);
    if (idx >= 0) entities.splice(idx, 1);
    gameState.markEntityRemoved(currentFloorIndex, enemy.id);
    
        // 记录怪物图鉴
    try { const actualDamageTaken = Math.max(0, hpBeforeCombat - gameState.player.hp); bestiary.record(scaledEnemy, { victory: true, damageDealt: scaledEnemy.hp, damageTaken: actualDamageTaken }); } catch {}
    try { localStorage.setItem('ih_bestiary', JSON.stringify(bestiary.toJSON())); } catch {}

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
    
    // 记录战斗历史
    combatHistory.push({
      enemy: enemy.name,
      victory: result.victory,
      rounds: result.rounds,
      log: result.log,
      floor: chapter.floors[currentFloorIndex]?.id || '?',
      turn: gameState.turn,
    });
    if (combatHistory.length > 20) combatHistory.shift(); // 保留最近20场

    if (result.victory) {
      try { victoryFlash(document.getElementById('ui-overlay')); } catch {}
      renderer.addFloatText(`+${scaledEnemy.rewards?.exp || 0} EXP`, enemy.x, enemy.y - 1, 'rgb(170, 136, 255)');
      if (scaledEnemy.rewards?.gold) renderer.addFloatText(`+${scaledEnemy.rewards.gold}G`, enemy.x, enemy.y - 0.4, 'rgb(255, 204, 68)');
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
          document.getElementById('btn-boss-ok').addEventListener('click', () => {
            overlay.innerHTML = '';
            // 触发boss击败事件和对话
            if (enemy.onDefeat) {
              if (enemy.onDefeat.flag) gameState.setFlag(enemy.onDefeat.flag);
              startDialogue(enemy.onDefeat.lines);
            }
          });
          // 也允许空格/回车关闭
          const bkh = (e) => { if (e.key === ' ' || e.key === 'Enter') { document.getElementById('btn-boss-ok')?.click(); document.removeEventListener('keydown', bkh); } };
          document.addEventListener('keydown', bkh);
        }, 800);
      } else if (enemy.onDefeat) {
        // 非Boss的特殊击败事件
        setTimeout(() => {
          if (enemy.onDefeat.flag) gameState.setFlag(enemy.onDefeat.flag);
          startDialogue(enemy.onDefeat.lines);
        }, 300);
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
      p.weapon = item.weapon;
      renderer.addFloatText(`装备: ${item.weapon.name}`, item.x, item.y, 'rgb(255, 170, 0)');
      renderer.addParticle(item.x * TILE_SIZE + TILE_SIZE/2, item.y * TILE_SIZE + TILE_SIZE/2, 'rgb(255, 170, 0)', 8);
      break;

    case 'armor':
      p.armor = item.armor;
      renderer.addFloatText(`装备: ${item.armor.name}`, item.x, item.y, 'rgb(100, 136, 255)');
      renderer.addParticle(item.x * TILE_SIZE + TILE_SIZE/2, item.y * TILE_SIZE + TILE_SIZE/2, 'rgb(100, 136, 255)', 8);
      break;

    case 'accessory':
      p.accessory = item.accessory;
      renderer.addFloatText(`装备: ${item.accessory.name}`, item.x, item.y, 'rgb(170, 136, 255)');
      renderer.addParticle(item.x * TILE_SIZE + TILE_SIZE/2, item.y * TILE_SIZE + TILE_SIZE/2, 'rgb(170, 136, 255)', 8);
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
        setTimeout(() => {
          renderer.notify(`✝ ${comp.name} 永远离开了队伍`, '#ff2222', 120);
          setTimeout(() => renderer.notify(`"${farewell}" —— ${comp.name}`, '#aa6666', 150), 2000);
        }, 800);
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

// ── 空格互动 ──
function interactAdjacent() {
  const p = gameState.player;
  const dirs = [{ x: 0, y: -1 }, { x: 0, y: 1 }, { x: -1, y: 0 }, { x: 1, y: 0 }];
  for (const dir of dirs) {
    const entity = entities.find(e => e.x === p.x + dir.x && e.y === p.y + dir.y);
    if (entity) {
      if (entity.type === ENTITY_TYPE.COMPANION && entity.dialogue) {
        startDialogue(entity.dialogue);
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
  gameStarted = false;
  if (!gameState._chapterClearCounted) { gameState.stats.chaptersCleared++; gameState._chapterClearCounted = true; }
  const p = gameState.player;
  const chapterNum = gameState.chapter;
  const chapterNames = { 1: '名为生化', 2: '异形杀戮', 3: '咒怨阴影', 4: '神鬼秘宝', 5: '死神绝境', 6: '异形再临', 7: '恶魔初临', 8: '重建中洲', 9: '星河远征', 10: '五队大战', 11: '心魔与终战前奏', 12: '生化终战' };
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
      const nextChapter = gameState.chapter + 1;
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
            <style>@keyframes fadeIn{from{opacity:0}to{opacity:1}}</style>
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
