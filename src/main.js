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
  // 重置状态
  gameState.reset();

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
  document.getElementById('ui-overlay').innerHTML = '';
  combatAnimator = new CombatAnimator(renderer);

  chapter = generateChapter1();
  currentFloorIndex = gameState.nodeIndex || 0;
  loadFloor(currentFloorIndex);

  gameState.setState(GAME_STATE.EXPLORING);
  gameStarted = true;

  // 监听升级音效（只注册一次）
  if (!window._levelupListenerRegistered) {
    window._levelupListenerRegistered = true;
    eventBus.on('player:levelup', () => {
      audioEngine.playLevelUp();
      try { checkGrowthMilestones(milestoneTracker, gameState.player); } catch {}
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

function loadFloor(index) {
  if (index >= chapter.floors.length) {
    // 所有层完成 — 进入主神空间
    showChapterComplete();
    return;
  }

  // 屏幕过渡
  if (renderer) renderer.fadeOut(0.08);

  currentFloorIndex = index;
  gameState.nodeIndex = index;
  const floor = chapter.floors[index];
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
      case 'r':
        // 同伴关系面板
        showRelationshipPanel();
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
        loadFloor(currentFloorIndex + 1);
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
          <!-- 右：敌人 -->
          <div style="flex:1; background:rgba(255,68,68,0.06); border:1px solid rgba(255,68,68,0.15); border-radius:8px; padding:10px; text-align:center;">
            <p style="color:${enemy.color || '#ff4444'}; font-size:11px; letter-spacing:2px; margin-bottom:4px;">${enemy.name}</p>
            <p style="color:#eee; font-size:13px;">HP <span style="color:#ff6666">${enemy.hp}</span></p>
            <p style="color:#ff8866; font-size:12px;">ATK ${enemy.atk}</p>
            <p style="color:#6688ff; font-size:12px;">DEF ${enemy.def}</p>
            ${enemy.weaknesses?.length ? '<p style="color:#ff8833;font-size:10px;">弱点: ' + enemy.weaknesses.map(w => ({fire:'🔥火',ice:'❄冰',poison:'☠毒',psychic:'🧠念',dark:'🌑暗',holy:'✦圣'}[w]||w)).join(' ') + '</p>' : ''}
            ${enemy.res ? '<p style="color:#8888aa;font-size:10px;">法抗: ' + enemy.res + '%</p>' : ''}
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
        
        ${descText}
        
        <!-- Build特效提示 -->
        ${(() => {
          const tags = [];
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
    startCombat(enemy);
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
      startCombat(enemy);
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
function startCombat(enemy) {
  // 战斗发起闪光
  renderer.flash('rgba(255, 50, 50)', 150);
  renderer.shake(3, 150);
  audioEngine.playDamage();
  
  // 难度缩放
  const scaledEnemy = scaleEnemy(enemy, gameState.chapter);
  const result = executeBattle(scaledEnemy);

  if (result.victory) {
    // 移除被击败的敌人并记录
    const idx = entities.indexOf(enemy);
    if (idx >= 0) entities.splice(idx, 1);
    gameState.markEntityRemoved(currentFloorIndex, enemy.id);
    
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
      renderer.addFloatText(`+${enemy.rewards?.exp || 0} EXP`, enemy.x, enemy.y - 1, 'rgb(170, 136, 255)');

      // 里程碑：战斗成就
      try { checkCombatMilestones(milestoneTracker, gameState.stats, enemy, result); } catch {}
      // 里程碑：成长成就（战斗后可能升级/进阶）
      try { checkGrowthMilestones(milestoneTracker, gameState.player); } catch {}

      // 检查boss特殊事件
      if (enemy.onDefeat) {
        setTimeout(() => {
          if (enemy.onDefeat.flag) gameState.setFlag(enemy.onDefeat.flag);
          startDialogue(enemy.onDefeat.lines);
        }, 300);
      }
    }

    gameState.save(0); // 自动存档
    renderer.notify('💾 自动存档', '#888888', 60);
  });
}

// ── 物品拾取 ──
function pickupItem(item) {
  const p = gameState.player;
  audioEngine.playPickup();

  switch (item.itemType) {
    case 'consumable':
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
        // 队友牺牲 → 关系大幅提升（铭记）
        changeRelationship(evt.companionDeath, 'sacrifice', gameState.relationships);
        renderer.shake(8, 600);
        renderer.addFloatText(`${comp.name} 阵亡`, gameState.player.x, gameState.player.y - 1, 'rgb(255, 0, 0)');
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

// ── 背包/状态面板 ──
function showInventoryPanel() {
  if (gameState.state !== GAME_STATE.EXPLORING) return;
  gameState.setState(GAME_STATE.INVENTORY);
  const p = gameState.player;
  const overlay = document.getElementById('ui-overlay');

  overlay.innerHTML = `
    <div style="
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      display: flex; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.8);
    " id="inv-backdrop">
      <div style="
        background: rgba(10,10,20,0.97); border: 1px solid #444; border-radius: 16px;
        padding: 30px; max-width: 700px; width: 90%; max-height: 80vh; overflow-y: auto;
      ">
        <h2 style="color: #44aaff; text-align: center; letter-spacing: 4px; margin-bottom: 20px;">
          ⚙ 郑吒 · 状态 ⚙
        </h2>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
          <!-- 左列：属性 -->
          <div>
            <h3 style="color: #ff8866; margin-bottom: 10px;">战斗属性</h3>
            <table style="width: 100%; color: #ccc; font-size: 14px; line-height: 2;">
              <tr><td>等级</td><td style="text-align: right; color: #ffcc44;">Lv.${p.level} <span style="color:#888;font-size:11px;">(${p.exp}/${p.expToNext} EXP)</span></td></tr>
              <tr><td>❤ 生命</td><td style="text-align: right; color: #44cc44;">${p.hp} / ${p.maxHp}</td></tr>
              <tr><td>⚔ 攻击</td><td style="text-align: right; color: #ff8866;">
                <span style="color:#ffcc44;font-weight:bold;">${getEffectiveAtk(p)}</span>
                <span style="color:#665533;font-size:11px;">(${p.atk}${p.weapon ? '+' + (p.weapon.atk||0) : ''}${p.chips.filter(c=>c.stat==='atk').reduce((s,c)=>s+c.value,0) > 0 ? '+' + p.chips.filter(c=>c.stat==='atk').reduce((s,c)=>s+c.value,0) : ''})</span>
              </td></tr>
              <tr><td>🛡 防御</td><td style="text-align: right; color: #6688ff;">
                <span style="color:#88aaff;font-weight:bold;">${getEffectiveDef(p)}</span>
                <span style="color:#334466;font-size:11px;">(${p.def}${p.armor ? '+' + (p.armor.def||0) : ''}${p.chips.filter(c=>c.stat==='def').reduce((s,c)=>s+c.value,0) > 0 ? '+' + p.chips.filter(c=>c.stat==='def').reduce((s,c)=>s+c.value,0) : ''})</span>
              </td></tr>
              <tr><td>💨 速度</td><td style="text-align: right; color: #44ffaa;">${getEffectiveSpd(p)}</td></tr>
              <tr><td>✦ 暴击</td><td style="text-align: right; color: #ffcc44;">
                <span style="font-weight:bold;">${getEffectiveCrt(p)}%</span>
                ${p.accessory?.crt ? '<span style="color:#555;font-size:11px;">(+' + p.accessory.crt + ')</span>' : ''}
              </td></tr>
              <tr><td>🔑 钥匙</td><td style="text-align: right;">黄${p.keys.yellow} 蓝${p.keys.blue} 红${p.keys.red}</td></tr>
              ${p.maxMana > 0 ? '<tr><td>✦ 法力</td><td style="text-align: right; color: #88aaff;">' + (p.mana||0) + '/' + p.maxMana + '</td></tr>' : ''}
              <tr><td>💰 金币</td><td style="text-align: right; color: #ffcc44;">${p.gold}G</td></tr>
              <tr><td>⬡ 奖励点</td><td style="text-align: right; color: #ff8844;">${p.rewardPoints}</td></tr>
            </table>
          </div>

          <!-- 右列：装备&技能 -->
          <div>
            <h3 style="color: #aa88ff; margin-bottom: 10px;">装备 & 血统</h3>
            <p style="color: #aaa; font-size: 13px; line-height: 2;">
              ⚔ 武器: <span style="color: #ffaa44">${p.weapon?.name || '无'}</span><br>
              🛡 护甲: <span style="color: #6688ff">${p.armor?.name || '无'}</span><br>
              💍 饰品: <span style="color: #aa88ff">${p.accessory?.name || '无'}</span><br>
              🩸 血统: <span style="color: #ff4488">${(() => {
                const bm = { vampire: '血族 · ATK+15% 吸血', ancient_wu: '古武 · ATK+20%', martial: '武修 · DEF+20% 反伤', daoist: '道法 · 法术攻击' };
                return bm[p.activeBloodline] || '未觉醒';
              })()}</span><br>
              🧬 基因锁: <span style="color: #ff6600">${p.geneLock > 0 ? p.geneLock + '阶' + (p.geneLockActive ? ' ●激活' : ' ○待机') : '未开启'}</span>
            </p>

            ${(() => {
              const glProg = getGeneLockProgress(p);
              const glDesc = getGeneLockDescription(glProg.currentStage);
              const skills = getAvailableSkills(p);
              return '<div style="margin-top: 12px;">' +
                (glProg.nextThreshold ? '<div style="margin-bottom: 8px;"><div style="display:flex;justify-content:space-between;color:#888;font-size:11px;margin-bottom:3px;"><span>基因锁充能</span><span>' + glProg.charge + '/' + glProg.nextThreshold + ' (' + glProg.progressPercent + '%)</span></div><div style="background:#1a1a2a;border-radius:3px;height:6px;overflow:hidden;"><div style="background:linear-gradient(90deg,#ff6600,#ff8800);width:' + Math.min(100,glProg.progressPercent) + '%;height:100%;border-radius:3px;"></div></div></div>' : '') +
                '<p style="color:#888;font-size:12px;font-style:italic;margin-bottom:8px;">' + glDesc + '</p>' +
                (skills.length > 0 ? '<h4 style="color:#ff8800;margin-bottom:6px;font-size:13px;">⚔ 已解锁技能</h4>' +
                  skills.map(s => '<p style="color:#ccc;font-size:12px;margin-bottom:3px;">• <span style="color:#ffaa44;">' + s.name + '</span> <span style="color:#666;">— ' + (s.description || s.desc || '') + (s.manaCost ? ' [' + s.manaCost + '法力]' : '') + ' CD' + s.cooldown + '回合</span></p>').join('') : '<p style="color:#555;font-size:12px;">开启基因锁或觉醒血统后将解锁技能</p>') +
              '</div>';
            })()}
            <p style="display:none">
            </p>

            ${p.chips.length > 0 ? `
              <h3 style="color: #aa44ff; margin-top: 16px; margin-bottom: 8px;">技能芯片 (${p.chips.length}/${p.maxChips})</h3>
              <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                ${p.chips.map(c => `
                  <span style="
                    background: rgba(170,68,255,0.15); border: 1px solid #aa44ff44;
                    padding: 4px 12px; border-radius: 6px; font-size: 13px; color: #cc88ff;
                  ">${c.name} (${c.stat}+${c.value})</span>
                `).join('')}
              </div>
            ` : ''}

            <h3 style="color: #44ff88; margin-top: 16px; margin-bottom: 8px;">队友与羁绊</h3>
            ${gameState.companions.map(c => {
              const bonusMap = { zhang_jie:'ATK+2', zhan_lan:'CRT+3', li_xiaoyi:'ATK+1 DEF+1', mou_gang:'DEF+3', chuxuan:'SPD+3', lingdian:'ATK+3 CRT+5', bawang:'ATK+2 DEF+2', lishuaixi:'ATK+1' };
              const bonus = bonusMap[c.id] || '';
              const relVal = gameState.relationships[c.id] || 0;
              const relLevel = typeof getRelationshipLevel === 'function' ? getRelationshipLevel(relVal) : { name: '中立', color: '#888' };
              const profile = typeof COMPANION_PROFILES !== 'undefined' ? COMPANION_PROFILES[c.id] : null;
              const quote = profile?.quote || '';
              const isBond = relVal >= 71;
              const memoir = isBond && profile?.memoir ? profile.memoir : '';
              return '<div style="margin-bottom:6px;padding:6px 8px;background:rgba(255,255,255,0.02);border-left:2px solid ' + (c.alive ? relLevel.color : '#333') + ';border-radius:0 4px 4px 0;">' +
                '<div style="display:flex;justify-content:space-between;align-items:center;">' +
                '<span style="color:' + (c.alive ? '#ccc' : '#664444') + ';font-size:13px;">' + (c.alive ? '●' : '✝') + ' ' + c.name + ' · ' + c.role + '</span>' +
                '<span style="color:' + relLevel.color + ';font-size:11px;">' + relLevel.name + ' (' + relVal + ')' + (isBond ? ' ✦' : '') + '</span>' +
                '</div>' +
                (c.alive && bonus ? '<span style="color:#44ff88;font-size:10px;">' + bonus + '</span>' : '') +
                (c.alive ? '' : ' <span style="color:#664444;font-size:10px;">（阵亡）</span>') +
                (isBond ? '<div style="margin-top:4px;padding:4px 6px;background:rgba(255,170,0,0.08);border:1px solid rgba(255,170,0,0.2);border-radius:4px;"><span style="color:#ffaa00;font-size:10px;">✦ 羁绊回忆</span><p style="color:#aa8844;font-size:10px;font-style:italic;margin-top:2px;line-height:1.4;">' + memoir + '</p></div>' : '') +
                (!isBond && quote ? '<p style="color:#555;font-size:10px;font-style:italic;margin-top:2px;">' + quote + '</p>' : '') +
              '</div>';
            }).join('')}
          </div>
        </div>


        <!-- 天赋树 + 装备 + 元素 -->
        <div style="margin-top: 20px; border-top: 1px solid #333; padding-top: 16px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <h3 style="color: #ffdd44; margin-bottom: 10px;">🌟 天赋 <span style="color:#888;font-size:11px;">(点数: ${gameState.talents.points})</span></h3>
              ${Object.entries(TALENT_PATHS).map(([id, path]) => {
                const alloc = gameState.talents.allocated[id] || 0;
                return '<div style="margin-bottom:6px;"><span style="color:' + path.color + ';font-size:12px;">' + path.icon + ' ' + path.name + ': ' + alloc + '/10</span> <div style="background:#1a1a2a;border-radius:3px;height:4px;overflow:hidden;display:inline-block;width:80px;vertical-align:middle;"><div style="background:' + path.color + ';width:' + (alloc*10) + '%;height:100%;"></div></div></div>';
              }).join('')}
              ${(() => {
                const fx = getTalentEffects(gameState.talents);
                const active = [
                  fx.atk > 0 ? 'ATK+'+fx.atk : '',
                  fx.def > 0 ? 'DEF+'+fx.def : '',
                  fx.spd > 0 ? 'SPD+'+fx.spd : '',
                  fx.crt > 0 ? 'CRT+'+fx.crt+'%' : '',
                  fx.maxHp > 0 ? 'HP+'+fx.maxHp : '',
                  fx.dodgeChance > 0 ? '闪避'+Math.floor(fx.dodgeChance*100)+'%' : '',
                  fx.blockChance > 0 ? '格挡'+Math.floor(fx.blockChance*100)+'%' : '',
                  fx.deathSave ? '重生' : '',
                ].filter(Boolean);
                return active.length > 0 ? '<p style="color:#aaa;font-size:11px;margin-top:4px;">加成: ' + active.join(' | ') + '</p>' : '';
              })()}
            </div>
            <div>
              <h3 style="color: #ff6644; margin-bottom: 10px;">🔨 装备强化</h3>
              ${[['⚔ 武器', p.weapon], ['🛡 护甲', p.armor], ['💍 饰品', p.accessory]].map(([label, item]) => {
                if (!item) return '<p style="color:#555;font-size:12px;">' + label + ': 无</p>';
                const dn = typeof getEquipmentDisplayName === 'function' ? getEquipmentDisplayName(item) : item.name;
                return '<p style="color:#ccc;font-size:12px;">' + label + ': <span style="color:#ffaa44;">' + dn + '</span></p>';
              }).join('')}
              ${(() => {
                const elems = typeof getPlayerActiveElements === 'function' ? getPlayerActiveElements(p) : [];
                if (elems.length === 0) return '';
                const elemStr = elems.map(e => { const info = ELEMENT_INFO[e]; return info ? '<span style="color:' + info.color + ';">' + info.icon + info.name + '</span>' : e; }).join(' ');
                const resonances = typeof checkElementalResonance === 'function' ? checkElementalResonance(elems) : [];
                const resStr = resonances.length > 0 ? '<br><span style="color:#ffcc44;font-size:11px;">共鸣: ' + resonances.map(r => r.icon + r.name).join(' ') + '</span>' : '';
                return '<div style="margin-top:8px;"><span style="color:#888;font-size:11px;">元素: </span>' + elemStr + resStr + '</div>';
              })()}
              ${(() => {
                const gems = gameState.gemInventory || [];
                return gems.length > 0 ? '<p style="color:#aa88ff;font-size:11px;margin-top:6px;">💎 宝石库: ' + gems.length + '个</p>' : '';
              })()}
            </div>
          </div>
        </div>


        <!-- 背包 -->
        <div style="margin-top: 16px; border-top: 1px solid #333; padding-top: 12px;">
          <h3 style="color: #ffcc44; margin-bottom: 10px;">📦 背包 (${(p.inventory||[]).length}/${p.maxInventory||20})</h3>
          <div id="inv-items-container" style="max-height: 150px; overflow-y: auto;"></div>
        </div>

        <div style="margin-top: 16px; border-top: 1px solid #333; padding-top: 12px;">
          <h3 style="color: #ffaa00; margin-bottom: 10px;">🏆 成就 (${milestoneTracker.getUnlockedCount()}/${milestoneTracker.getTotalCount()})</h3>
          <div style="display: flex; flex-wrap: wrap; gap: 4px;">
            ${Object.entries(MILESTONES).map(([id, ms]) => {
              const unlocked = milestoneTracker.unlocked.has(id);
              return '<div style="padding:3px 8px;border-radius:4px;font-size:10px;' +
                (unlocked 
                  ? 'background:rgba(255,170,0,0.1);border:1px solid ' + ms.color + '33;color:' + ms.color 
                  : 'background:rgba(30,30,40,0.5);border:1px solid #222;color:#444') +
                ';" title="' + ms.desc + '">' +
                ms.icon + ' ' + ms.name +
              '</div>';
            }).join('')}
          </div>
        </div>

        <div style="text-align: center; margin-top: 24px;">
          <button id="btn-close-inv" style="
            background: transparent; border: 1px solid #444; color: #888;
            padding: 8px 30px; cursor: pointer; font-size: 14px; font-family: inherit;
            border-radius: 6px;
          ">关闭 (I)</button>
        </div>
      </div>
    </div>
  `;

  // ── 背包物品管理 ──
  function renderInventoryItems() {
    const inv = document.getElementById('inv-items-container');
    if (!inv) return;
    const items = p.inventory || [];
    if (items.length === 0) {
      inv.innerHTML = '<p style="color:#555;text-align:center;">背包为空</p>';
      return;
    }
    inv.innerHTML = items.map((item, idx) => {
      if (item.type === 'consumable') {
        return `<div class="inv-item" data-idx="${idx}" style="display:flex;justify-content:space-between;align-items:center;background:rgba(255,255,255,0.03);border:1px solid #444;border-radius:8px;padding:8px 12px;margin-bottom:4px;cursor:pointer;">
          <span style="color:#ccc;font-size:13px;">📦 ${item.name}</span>
          <span style="color:#888;font-size:11px;">${item.desc || ''}</span>
          <button class="btn-use-item" data-idx="${idx}" style="background:#44cc44;border:none;color:#000;padding:4px 10px;border-radius:4px;font-size:11px;cursor:pointer;">使用</button>
        </div>`;
      } else if (item.type === 'equipment') {
        const e = item.equipment;
        const stats = [];
        if (e.atk) stats.push('ATK+'+e.atk);
        if (e.def) stats.push('DEF+'+e.def);
        if (e.spd) stats.push('SPD+'+e.spd);
        if (e.crt) stats.push('CRT+'+e.crt);
        return `<div class="inv-item" data-idx="${idx}" style="display:flex;justify-content:space-between;align-items:center;background:rgba(255,255,255,0.03);border:1px solid ${e.rarityColor||'#444'};border-radius:8px;padding:8px 12px;margin-bottom:4px;">
          <span style="color:${e.rarityColor||'#ccc'};font-size:13px;">⚔ ${e.name} <span style="color:#888;font-size:11px;">(${stats.join(', ')})</span></span>
          <button class="btn-equip-item" data-idx="${idx}" data-slot="${e.slot}" style="background:#4488ff;border:none;color:#fff;padding:4px 10px;border-radius:4px;font-size:11px;cursor:pointer;">装备</button>
        </div>`;
      }
      return '';
    }).join('');
    
    // 使用消耗品
    inv.querySelectorAll('.btn-use-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.idx);
        const item = p.inventory[idx];
        if (!item) return;
        if (item.effect?.healPercent) {
          const heal = Math.floor(p.maxHp * item.effect.healPercent);
          p.hp = Math.min(p.maxHp, p.hp + heal);
        }
        if (item.effect?.manaRestore) {
          p.mana = Math.min(p.maxMana, (p.mana||0) + item.effect.manaRestore);
        }
        p.inventory.splice(idx, 1);
        renderInventoryItems();
      });
    });
    
    // 装备
    inv.querySelectorAll('.btn-equip-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.idx);
        const item = p.inventory[idx];
        if (!item?.equipment) return;
        const slot = item.equipment.slot;
        // 如果已有装备，放回背包
        if (p[slot]) {
          p.inventory.push({ type: 'equipment', equipment: p[slot] });
        }
        p[slot] = item.equipment;
        p.inventory.splice(idx, 1);
        renderInventoryItems();
      });
    });
  }

  // 初始化背包视图
  const invContainer = document.getElementById('inv-items-container');
  if (invContainer) renderInventoryItems();

  const close = () => {
    overlay.innerHTML = '';
    gameState.setState(GAME_STATE.EXPLORING);
  };
  document.getElementById('btn-close-inv').addEventListener('click', close);
  document.getElementById('inv-backdrop').addEventListener('click', (e) => {
    if (e.target.id === 'inv-backdrop') close();
  });
  // 也可以按 I 或 ESC 关闭
  const keyHandler = (e) => {
    if (e.key === 'i' || e.key === 'Escape') {
      close();
      document.removeEventListener('keydown', keyHandler);
    }
  };
  document.addEventListener('keydown', keyHandler);
}

// ── 同伴关系面板 ──
function showRelationshipPanel() {
  if (gameState.state !== GAME_STATE.EXPLORING) return;
  gameState.setState(GAME_STATE.INVENTORY);
  const overlay = document.getElementById('ui-overlay');
  const companions = gameState.companions || [];

  let companionHTML = '';
  if (companions.length === 0) {
    companionHTML = '<p style="color:#666;text-align:center;">尚无同伴</p>';
  } else {
    for (const c of companions) {
      const relVal = gameState.relationships[c.id] || 0;
      const relLevel = getRelationshipLevel(relVal);
      const profile = COMPANION_PROFILES[c.id];
      const isBond = relVal >= 71;
      const barWidth = Math.max(0, (relVal + 100) / 200 * 100);
      
      companionHTML += '<div style="margin-bottom:12px;padding:10px 12px;background:rgba(255,255,255,0.02);border-left:3px solid ' + (c.alive ? relLevel.color : '#333') + ';border-radius:0 8px 8px 0;">';
      companionHTML += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">';
      companionHTML += '<span style="color:' + (c.alive ? '#e0e0e0' : '#664444') + ';font-size:14px;font-weight:bold;">';
      companionHTML += (c.alive ? '●' : '✝') + ' ' + c.name;
      if (profile?.title) companionHTML += ' <span style="color:#888;font-size:11px;">· ' + profile.title + '</span>';
      companionHTML += '</span>';
      companionHTML += '<span style="color:' + relLevel.color + ';font-size:13px;font-weight:bold;">' + relLevel.name + ' (' + relVal + ')' + (isBond ? ' ✦' : '') + '</span>';
      companionHTML += '</div>';
      // Bar
      companionHTML += '<div style="height:4px;background:#222;border-radius:2px;margin-bottom:6px;">';
      companionHTML += '<div style="height:100%;width:' + barWidth + '%;background:' + relLevel.color + ';border-radius:2px;"></div></div>';
      // Combat bonus
      companionHTML += '<span style="color:#888;font-size:10px;">战斗加成: ' + (relLevel.combatBonus > 0 ? '+' : '') + Math.floor(relLevel.combatBonus * 100) + '%</span>';
      if (!c.alive) companionHTML += ' <span style="color:#664444;font-size:10px;">（阵亡）</span>';
      // Personality
      if (profile?.personality) companionHTML += '<p style="color:#777;font-size:10px;margin:4px 0 0 0;">性格: ' + profile.personality + '</p>';
      // Quote
      if (profile?.quote) companionHTML += '<p style="color:#555;font-size:10px;font-style:italic;margin:2px 0 0 0;">' + profile.quote + '</p>';
      // Bond memoir
      if (isBond && profile?.memoir) {
        companionHTML += '<div style="margin-top:6px;padding:6px 8px;background:rgba(255,170,0,0.06);border:1px solid rgba(255,170,0,0.15);border-radius:4px;">';
        companionHTML += '<span style="color:#ffaa00;font-size:10px;">✦ 羁绊回忆</span>';
        companionHTML += '<p style="color:#aa8844;font-size:10px;font-style:italic;margin-top:2px;line-height:1.5;">' + profile.memoir + '</p></div>';
      }
      companionHTML += '</div>';
    }
  }

  overlay.innerHTML = '<div style="position:absolute;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.85);" id="rel-backdrop">' +
    '<div style="background:rgba(10,10,20,0.97);border:1px solid #444;border-radius:16px;padding:30px;max-width:650px;width:90%;max-height:80vh;overflow-y:auto;">' +
    '<h2 style="color:#ffaa00;text-align:center;letter-spacing:4px;margin-bottom:20px;">✦ 同伴关系</h2>' +
    '<p style="color:#666;text-align:center;font-size:11px;margin-bottom:16px;">关系影响: 战斗加成 · 对话台词 · 羁绊回忆 · 危难救援 · 团队士气</p>' +
    companionHTML +
    '<div style="text-align:center;margin-top:20px;">' +
    '<button id="btn-close-rel" style="background:transparent;border:1px solid #444;color:#888;padding:8px 30px;cursor:pointer;font-size:14px;font-family:inherit;border-radius:6px;">关闭 (R)</button>' +
    '</div></div></div>';

  const close = () => { overlay.innerHTML = ''; gameState.setState(GAME_STATE.EXPLORING); };
  document.getElementById('btn-close-rel').addEventListener('click', close);
  document.getElementById('rel-backdrop').addEventListener('click', (e) => {
    if (e.target.id === 'rel-backdrop') close();
  });
  const kh = (e) => {
    if (e.key === 'r' || e.key === 'Escape') { close(); document.removeEventListener('keydown', kh); }
  };
  document.addEventListener('keydown', kh);
}

// ── 帮助面板 ──
function showHelpPanel() {
  if (gameState.state !== GAME_STATE.EXPLORING) return;
  const overlay = document.getElementById('ui-overlay');
  overlay.innerHTML = `
    <div style="
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      display: flex; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.8);
    " id="help-backdrop">
      <div style="
        background: rgba(10,10,20,0.97); border: 1px solid #444; border-radius: 16px;
        padding: 30px; max-width: 500px; width: 90%;
      ">
        <h2 style="color: #ffcc44; text-align: center; letter-spacing: 4px; margin-bottom: 20px;">
          操 作 指 南
        </h2>
        <table style="width: 100%; color: #ccc; font-size: 14px; line-height: 2.2;">
          <tr><td style="color: #44aaff;">WASD / 方向键</td><td>移动</td></tr>
          <tr><td style="color: #44aaff;">碰撞敌人</td><td>自动战斗（魔塔式）</td></tr>
          <tr><td style="color: #44aaff;">空格 / Enter</td><td>对话 / 互动 / 推进剧情</td></tr>
          <tr><td style="color: #ff6600;">G</td><td>激活/关闭基因锁</td></tr>
          <tr><td style="color: #aa88ff;">I</td><td>打开状态/背包</td></tr>
          <tr><td style="color: #ffcc44;">H / ?</td><td>帮助</td></tr>
          <tr><td style="color: #44ff88;">鼠标悬停</td><td>查看敌人/物品详情</td></tr>
          <tr><td style="color: #ff8866;">L</td><td>战斗日志回顾</td></tr>
          <tr><td style="color: #44ffff;">M</td><td>全地图视图</td></tr>
          <tr><td style="color: #44ff88;">F5</td><td>快速存档</td></tr>
          <tr><td style="color: #44aaff;">F9</td><td>快速读档</td></tr>
        </table>
        <hr style="border-color: #333; margin: 16px 0;">
        <h3 style="color: #ff4444; margin-bottom: 8px;">战斗提示</h3>
        <ul style="color: #999; font-size: 13px; line-height: 1.8; padding-left: 20px;">
          <li>碰怪前<strong style="color: #eee">先用鼠标悬停</strong>查看能否打赢</li>
          <li>显示 <span style="color: #44ff88">✓</span> 表示可以击败，<span style="color: #ff4444">✗</span> 表示打不过</li>
          <li>收集<strong style="color: #ff8866">力量晶石</strong>和<strong style="color: #6688ff">坚韧晶石</strong>提升属性</li>
          <li>合理使用<strong style="color: #ff4488">急救物品</strong>补充HP</li>
          <li>基因锁激活后攻防大幅提升，关键战斗前记得开启</li>
          <li>按 <strong style="color: #ff8866">L</strong> 查看战斗日志</li>
          <li>按 <strong style="color: #44ffff">M</strong> 查看全地图</li>
        </ul>
        <div style="text-align: center; margin-top: 20px;">
          <button id="btn-close-help" style="
            background: transparent; border: 1px solid #444; color: #888;
            padding: 8px 30px; cursor: pointer; font-size: 14px; font-family: inherit;
            border-radius: 6px;
          ">知道了</button>
        </div>
      </div>
    </div>
  `;
  const close = () => { overlay.innerHTML = ''; };
  document.getElementById('btn-close-help').addEventListener('click', close);
  document.getElementById('help-backdrop').addEventListener('click', (e) => {
    if (e.target.id === 'help-backdrop') close();
  });
  const keyHandler = (e) => {
    if (e.key === 'h' || e.key === '?' || e.key === 'Escape') {
      close();
      document.removeEventListener('keydown', keyHandler);
    }
  };
  document.addEventListener('keydown', keyHandler);
}

// ── 全地图视图 ──
function showFullMap() {
  if (gameState.state !== GAME_STATE.EXPLORING) return;
  const floor = chapter.floors[currentFloorIndex];
  const p = gameState.player;
  const overlay = document.getElementById('ui-overlay');
  
  // Create a canvas for the map
  const mapScale = Math.min(600 / floor.width, 500 / floor.height);
  const mapW = Math.floor(floor.width * mapScale);
  const mapH = Math.floor(floor.height * mapScale);
  
  const mapCanvas = document.createElement('canvas');
  mapCanvas.width = mapW;
  mapCanvas.height = mapH;
  const mctx = mapCanvas.getContext('2d');
  
  // Draw tiles
  for (let y = 0; y < floor.height; y++) {
    for (let x = 0; x < floor.width; x++) {
      const tile = floor.tiles[y][x];
      const mx = x * mapScale;
      const my = y * mapScale;
      switch (tile) {
        case 0: mctx.fillStyle = '#000000'; break; // VOID
        case 1: mctx.fillStyle = '#2a2a3a'; break; // FLOOR
        case 2: mctx.fillStyle = '#444455'; break; // WALL
        case 3: mctx.fillStyle = '#886644'; break; // DOOR
        case 4: mctx.fillStyle = '#44ffff'; break; // STAIRS
        case 6: mctx.fillStyle = '#ff3322'; break; // LAVA
        default: mctx.fillStyle = '#1a1a28'; break;
      }
      mctx.fillRect(mx, my, mapScale, mapScale);
      // Grid lines
      mctx.strokeStyle = 'rgba(60, 60, 80, 0.3)';
      mctx.lineWidth = 0.5;
      mctx.strokeRect(mx, my, mapScale, mapScale);
    }
  }
  
  // Draw entities
  for (const e of entities) {
    const mx = e.x * mapScale + mapScale / 2;
    const my = e.y * mapScale + mapScale / 2;
    const r = mapScale * 0.35;
    mctx.beginPath();
    mctx.arc(mx, my, r, 0, Math.PI * 2);
    if (e.type === 'enemy' || e.type === 'boss') mctx.fillStyle = '#ff4444';
    else if (e.type === 'companion') mctx.fillStyle = '#4488ff';
    else if (e.type === 'item') mctx.fillStyle = '#ffcc44';
    else if (e.type === 'event') mctx.fillStyle = '#ffffff';
    else mctx.fillStyle = '#888888';
    mctx.fill();
  }
  
  // Draw player (blinking)
  mctx.fillStyle = '#44aaff';
  mctx.beginPath();
  mctx.arc(p.x * mapScale + mapScale / 2, p.y * mapScale + mapScale / 2, mapScale * 0.45, 0, Math.PI * 2);
  mctx.fill();
  mctx.strokeStyle = '#88ccff';
  mctx.lineWidth = 2;
  mctx.stroke();
  
  const dataUrl = mapCanvas.toDataURL();
  
  overlay.innerHTML = '<div style="' +
    'position:absolute;top:0;left:0;right:0;bottom:0;' +
    'display:flex;flex-direction:column;align-items:center;justify-content:center;' +
    'background:rgba(0,0,0,0.85);"' +
    ' id="map-backdrop">' +
    '<h2 style="color:#44ffff;letter-spacing:4px;margin-bottom:16px;font-family:Noto Serif SC,serif;">' +
    '🗺 ' + floor.id + ' ' + floor.name + '</h2>' +
    '<img src="' + dataUrl + '" style="border:2px solid #333;border-radius:8px;image-rendering:pixelated;" />' +
    '<div style="display:flex;gap:20px;margin-top:16px;font-size:12px;color:#888;">' +
    '<span>🔵 玩家</span><span style="color:#ff4444">🔴 敌人</span>' +
    '<span style="color:#4488ff">🔵 队友</span><span style="color:#ffcc44">🟡 物品</span>' +
    '<span style="color:#44ffff">⬜ 楼梯</span>' +
    '</div>' +
    '<button id="btn-close-map" style="' +
    'margin-top:16px;background:transparent;border:1px solid #444;color:#888;' +
    'padding:8px 30px;cursor:pointer;font-size:14px;font-family:inherit;border-radius:6px;">' +
    '关闭 (M)</button>' +
    '</div>';

  const close = () => { overlay.innerHTML = ''; };
  document.getElementById('btn-close-map').addEventListener('click', close);
  document.getElementById('map-backdrop').addEventListener('click', (e) => {
    if (e.target.id === 'map-backdrop') close();
  });
  const kh = (e) => {
    if (e.key === 'm' || e.key === 'Escape') { close(); document.removeEventListener('keydown', kh); }
  };
  document.addEventListener('keydown', kh);
}

// ── 战斗日志面板 ──
function showCombatLog() {
  if (gameState.state !== GAME_STATE.EXPLORING) return;
  const overlay = document.getElementById('ui-overlay');
  
  const logs = combatHistory.slice().reverse();
  const logHtml = logs.length === 0 
    ? '<p style="color: #666; text-align: center; margin: 20px;">尚无战斗记录</p>'
    : logs.map((entry, i) => `
      <div style="
        background: rgba(${entry.victory ? '40,80,40' : '80,30,30'}, 0.3);
        border: 1px solid ${entry.victory ? '#44884433' : '#884444'};
        border-radius: 8px; padding: 12px; margin-bottom: 8px;
      ">
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
          <span style="color: ${entry.victory ? '#44ff88' : '#ff4444'}; font-weight: bold;">
            ${entry.victory ? '✓ 胜利' : '✗ 败北'} vs ${entry.enemy}
          </span>
          <span style="color: #666; font-size: 12px;">${entry.floor} · ${entry.rounds}回合</span>
        </div>
        <div style="color: #aaa; font-size: 12px; line-height: 1.6;">
          ${entry.log.slice(-8).map(l => {
            let c = '#999';
            if (l.type === 'attack') c = '#ffcc88';
            if (l.type === 'critical') c = '#ffaa00';
            if (l.type === 'enemy_attack') c = '#ff6644';
            if (l.type === 'victory') c = '#44ff88';
            if (l.type === 'reward') c = '#ffcc44';
            if (l.type === 'heal') c = '#88ffaa';
            if (l.type === 'spell') c = '#cc88ff';
            if (l.type === 'burn') c = '#ff8833';
            if (l.type === 'reflect') c = '#6699ff';
            if (l.type === 'buff') c = '#66ccff';
            return '<span style="color:' + c + '">' + l.text + '</span>';
          }).join('<br>')}
        </div>
      </div>
    `).join('');

  overlay.innerHTML = `
    <div style="
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      display: flex; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.8);
    " id="log-backdrop">
      <div style="
        background: rgba(10,10,20,0.97); border: 1px solid #444; border-radius: 16px;
        padding: 30px; max-width: 600px; width: 90%; max-height: 80vh; overflow-y: auto;
      ">
        <h2 style="color: #ff8866; text-align: center; letter-spacing: 4px; margin-bottom: 16px;">
          ⚔ 战斗日志 ⚔
        </h2>
        ${logHtml}
        <div style="text-align: center; margin-top: 16px;">
          <button id="btn-close-log" style="
            background: transparent; border: 1px solid #444; color: #888;
            padding: 8px 30px; cursor: pointer; font-size: 14px; font-family: inherit;
            border-radius: 6px;
          ">关闭 (L)</button>
        </div>
      </div>
    </div>
  `;

  const close = () => { overlay.innerHTML = ''; };
  document.getElementById('btn-close-log').addEventListener('click', close);
  document.getElementById('log-backdrop').addEventListener('click', (e) => {
    if (e.target.id === 'log-backdrop') close();
  });
  const kh = (e) => {
    if (e.key === 'l' || e.key === 'Escape') { close(); document.removeEventListener('keydown', kh); }
  };
  document.addEventListener('keydown', kh);
}

// ── 章节完成 ──
function showChapterComplete() {
  gameStarted = false;
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
        overlay.innerHTML = isGameComplete ? `
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
            <button onclick="location.reload()" style="
              background: transparent; border: 1px solid #ff4444; color: #ff4444;
              padding: 14px 50px; cursor: pointer; font-size: 16px;
              letter-spacing: 6px; font-family: inherit; border-radius: 8px;
              transition: all 0.3s;
            " onmouseover="this.style.background='rgba(255,68,68,0.1)'"
               onmouseout="this.style.background='transparent'">重新轮回</button>
          </div>
          <style>@keyframes fadeIn{from{opacity:0}to{opacity:1}}</style>
        ` : `
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
    });
  });
}
