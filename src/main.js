// ═══════════════════════════════════════════════════════════════
// 无限恐怖：中洲轮回 — 主入口
// 2D俯视角 Roguelike + 魔塔式数值战斗 + 叙事选择
// ═══════════════════════════════════════════════════════════════

import { TILE, TILE_SIZE, ENTITY_TYPE, GAME_STATE, GENE_LOCK, COLORS, CANVAS_W, CANVAS_H } from './core/constants.js';
import { eventBus } from './core/EventBus.js';
import { gameState } from './core/GameState.js';
import { Renderer } from './core/Renderer.js';
import { executeBattle, previewBattle } from './core/CombatSystem.js';
import { generateChapter1 } from './core/MapGenerator.js';
import { audioEngine } from './core/AudioEngine.js';
import { renderLordGodSpace } from './core/LordGodSpace.js';
import { CombatAnimator } from './core/CombatAnimation.js';

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

// ── 初始化 ──
window.addEventListener('load', () => {
  const canvas = document.getElementById('game-canvas');
  renderer = new Renderer(canvas);

  // 加载动画
  const fill = document.querySelector('#loading-bar .fill');
  let progress = 0;
  const loadInterval = setInterval(() => {
    progress += 5 + Math.random() * 10;
    if (progress >= 100) {
      progress = 100;
      clearInterval(loadInterval);
      fill.style.width = '100%';
      setTimeout(() => {
        document.getElementById('loading-screen').classList.add('hidden');
        showMainMenu();
      }, 500);
    }
    fill.style.width = `${progress}%`;
  }, 80);
});

function showMainMenu() {
  menuState = 'title';
  gameState.setState(GAME_STATE.MAIN_MENU);

  const overlay = document.getElementById('ui-overlay');
  overlay.innerHTML = `
    <div style="
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      background: radial-gradient(ellipse at center, #0f0f1a 0%, #050508 100%);
    ">
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

      <p style="
        position: absolute; bottom: 30px; font-size: 12px; color: #333;
        letter-spacing: 2px;
      ">WASD移动 · 碰撞敌人战斗 · 空格互动/对话 · 鼠标悬停查看信息</p>
    </div>
  `;

  document.getElementById('btn-new-game').addEventListener('click', startNewGame);
  document.getElementById('btn-continue').addEventListener('click', () => {
    if (gameState.load(0)) {
      startGame();
    } else {
      startNewGame();
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
  Object.assign(gameState, new (gameState.constructor)());

  // 初始化音频
  audioEngine.init();
  audioEngine.resume();
  audioEngine.startAmbience();

  // 添加初始队友
  gameState.addCompanion({ id: 'zhang_jie', name: '张杰', role: '战术领队', alive: true });
  gameState.addCompanion({ id: 'zhan_lan', name: '詹岚', role: '情报分析', alive: true });
  gameState.addCompanion({ id: 'li_xiaoyi', name: '李萧毅', role: '机动支援', alive: true });
  gameState.addCompanion({ id: 'mou_gang', name: '牟钢', role: '防线坚守', alive: true });

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

  // 监听升级音效
  eventBus.on('player:levelup', () => {
    audioEngine.playLevelUp();
    renderer.addFloatText('LEVEL UP!', gameState.player.x, gameState.player.y - 1.5, 'rgb(255, 215, 0)');
    renderer.addParticle(
      gameState.player.x * TILE_SIZE + TILE_SIZE / 2,
      gameState.player.y * TILE_SIZE + TILE_SIZE / 2,
      'rgb(255, 215, 0)', 15
    );
  });

  // 启动游戏循环
  requestAnimationFrame(gameLoop);
}

function loadFloor(index) {
  if (index >= chapter.floors.length) {
    // 所有层完成 — 进入主神空间
    showChapterComplete();
    return;
  }
  currentFloorIndex = index;
  gameState.nodeIndex = index;
  const floor = chapter.floors[index];
  gameState.player.x = floor.playerStart.x;
  gameState.player.y = floor.playerStart.y;

  // 实例化实体（保留原始maxHp）
  entities = floor.entities.map(e => {
    const clone = { ...e };
    if (clone.hp !== undefined) clone._maxHp = clone.hp;
    return clone;
  });

  // 显示楼层标题
  showFloorTitle(floor);
}

function showFloorTitle(floor) {
  const overlay = document.getElementById('ui-overlay');
  overlay.innerHTML = `
    <div id="floor-title" style="
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.85);
      animation: fadeIn 0.5s;
    ">
      <p style="font-size: 14px; color: #ff4444; letter-spacing: 6px; margin-bottom: 8px;">
        第一章 · 名为生化
      </p>
      <h2 style="font-size: 36px; color: #e0e0e0; letter-spacing: 6px; margin-bottom: 16px;">
        ${floor.id} ${floor.name}
      </h2>
      <p style="font-size: 16px; color: #888; max-width: 600px; text-align: center; line-height: 1.6;">
        ${floor.subtitle}
      </p>
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
        <div style="display: flex; gap: 20px;">
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

    document.getElementById('btn-retry').addEventListener('click', () => {
      overlay.innerHTML = '';
      // 恢复到当前层入口状态
      const p = gameState.player;
      p.hp = Math.floor(p.maxHp * 0.5); // 复活50% HP
      p.stamina = p.maxStamina;
      loadFloor(currentFloorIndex);
      gameStarted = true;
      requestAnimationFrame(gameLoop);
    });

    document.getElementById('btn-restart').addEventListener('click', () => {
      overlay.innerHTML = '';
      startNewGame();
    });
  }, 500);
});

// ── 游戏主循环 ──
function gameLoop() {
  if (!gameStarted) return;

  const floor = chapter.floors[currentFloorIndex];
  renderer.render(floor, entities, hoveredEntity, dialogueState, combatResult);

  requestAnimationFrame(gameLoop);
}

// ── 输入处理 ──
document.addEventListener('keydown', (e) => {
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
      case 'h': case '?':
        // 帮助面板
        showHelpPanel();
        return;
      default: return;
    }
    if (dx !== 0 || dy !== 0) {
      e.preventDefault();
      movePlayer(dx, dy);
    }
  }
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
    // 敌人 → 战斗
    if (entity.type === ENTITY_TYPE.ENEMY || entity.type === ENTITY_TYPE.BOSS) {
      startCombat(entity);
      return;
    }

    // NPC/队友 → 对话
    if (entity.type === ENTITY_TYPE.COMPANION || entity.type === ENTITY_TYPE.NPC) {
      if (entity.dialogue) {
        startDialogue(entity.dialogue, entity);
      }
      return;
    }

    // 物品 → 拾取
    if (entity.type === ENTITY_TYPE.ITEM) {
      pickupItem(entity);
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
      startDialogue([{ text: floor.onClear.message, speaker: '旁白' }], null, () => {
        loadFloor(currentFloorIndex + 1);
      });
      p.x = nx;
      p.y = ny;
      return;
    }
  }

  // 正常移动
  p.x = nx;
  p.y = ny;
  gameState.turn++;
  gameState.stats.turnsPlayed++;

  // 自动恢复少量体力
  if (p.stamina < p.maxStamina) {
    p.stamina = Math.min(p.maxStamina, p.stamina + 1);
  }
}

// ── 战斗 ──
function startCombat(enemy) {
  const result = executeBattle(enemy);

  if (result.victory) {
    // 移除被击败的敌人
    const idx = entities.indexOf(enemy);
    if (idx >= 0) entities.splice(idx, 1);
  }

  // 暴露玩家位置给战斗动画
  window._gamePlayerX = gameState.player.x;
  window._gamePlayerY = gameState.player.y;

  // 播放战斗动画序列
  combatAnimator.playCombatSequence(result, enemy, () => {
    combatResult = result;

    if (result.victory) {
      renderer.addFloatText(`+${enemy.rewards?.exp || 0} EXP`, enemy.x, enemy.y - 1, 'rgb(170, 136, 255)');

      // 检查boss特殊事件
      if (enemy.onDefeat) {
        setTimeout(() => {
          if (enemy.onDefeat.flag) gameState.setFlag(enemy.onDefeat.flag);
          startDialogue(enemy.onDefeat.lines);
        }, 300);
      }
    }

    gameState.save(0); // 自动存档
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
        renderer.addFloatText(`+${healed} HP`, item.x, item.y, 'rgb(68, 255, 136)');
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
      break;

    case 'key':
      p.keys[item.keyColor] = (p.keys[item.keyColor] || 0) + 1;
      renderer.addFloatText(`+1 ${item.keyColor}钥匙`, item.x, item.y, 'rgb(255, 204, 68)');
      break;

    case 'door':
      if (p.keys[item.doorColor] > 0) {
        p.keys[item.doorColor]--;
        renderer.addFloatText('门已打开', item.x, item.y, 'rgb(136, 102, 68)');
      } else {
        startDialogue([{ text: `需要 ${item.doorColor === 'yellow' ? '黄色' : item.doorColor === 'blue' ? '蓝色' : '红色'} 门卡才能打开。`, speaker: '系统' }]);
        return; // 不移除门
      }
      break;
  }

  // 移除已拾取的物品
  const idx = entities.indexOf(item);
  if (idx >= 0) entities.splice(idx, 1);

  eventBus.emit('item:pickup', item);
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
      if (evt.rewards.exp) gameState.addExp(evt.rewards.exp);
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
    }

    // 移除队友
    if (evt.removeCompanion) {
      gameState.removeCompanion(evt.removeCompanion);
      // 也从地图实体移除
      const compIdx = entities.findIndex(e => e.id === evt.removeCompanion);
      if (compIdx >= 0) entities.splice(compIdx, 1);
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
      setTimeout(() => showChapterComplete(), 500);
    }

    // 移除事件实体
    const idx = entities.indexOf(entity);
    if (idx >= 0) entities.splice(idx, 1);

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
              <tr><td>等级</td><td style="text-align: right; color: #ffcc44;">Lv.${p.level}</td></tr>
              <tr><td>❤ 生命</td><td style="text-align: right; color: #44cc44;">${p.hp} / ${p.maxHp}</td></tr>
              <tr><td>⚔ 攻击</td><td style="text-align: right; color: #ff8866;">${p.atk}${p.weapon ? ` (+${p.weapon.atk})` : ''}</td></tr>
              <tr><td>🛡 防御</td><td style="text-align: right; color: #6688ff;">${p.def}${p.armor ? ` (+${p.armor.def})` : ''}</td></tr>
              <tr><td>💨 速度</td><td style="text-align: right; color: #44ffaa;">${p.spd}</td></tr>
              <tr><td>✦ 暴击</td><td style="text-align: right; color: #ffcc44;">${p.crt}%</td></tr>
              <tr><td>🔑 钥匙</td><td style="text-align: right;">黄${p.keys.yellow} 蓝${p.keys.blue} 红${p.keys.red}</td></tr>
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
              🩸 血统: <span style="color: #ff4488">${p.activeBloodline !== 'none' ? p.activeBloodline : '未觉醒'}</span><br>
              🧬 基因锁: <span style="color: #ff6600">${p.geneLock > 0 ? p.geneLock + '阶' + (p.geneLockActive ? ' ●激活' : ' ○待机') : '未开启'}</span>
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

            <h3 style="color: #44ff88; margin-top: 16px; margin-bottom: 8px;">队友</h3>
            ${gameState.companions.map(c => `
              <p style="color: ${c.alive ? '#aaa' : '#664444'}; font-size: 13px;">
                ${c.alive ? '●' : '✝'} ${c.name} · ${c.role} ${c.alive ? '' : '（阵亡）'}
              </p>
            `).join('')}
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
        </table>
        <hr style="border-color: #333; margin: 16px 0;">
        <h3 style="color: #ff4444; margin-bottom: 8px;">战斗提示</h3>
        <ul style="color: #999; font-size: 13px; line-height: 1.8; padding-left: 20px;">
          <li>碰怪前<strong style="color: #eee">先用鼠标悬停</strong>查看能否打赢</li>
          <li>显示 <span style="color: #44ff88">✓</span> 表示可以击败，<span style="color: #ff4444">✗</span> 表示打不过</li>
          <li>收集<strong style="color: #ff8866">力量晶石</strong>和<strong style="color: #6688ff">坚韧晶石</strong>提升属性</li>
          <li>合理使用<strong style="color: #ff4488">急救物品</strong>补充HP</li>
          <li>基因锁激活后攻防大幅提升，关键战斗前记得开启</li>
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

// ── 章节完成 ──
function showChapterComplete() {
  gameStarted = false;
  const p = gameState.player;

  const overlay = document.getElementById('ui-overlay');
  overlay.innerHTML = `
    <div style="
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      display: flex; flex-direction: column; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.9);
    ">
      <p style="font-size: 14px; color: #ff4444; letter-spacing: 6px; margin-bottom: 8px;">
        第一章 · 名为生化
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
          存活者：张杰、郑吒、詹岚、李萧毅<br>
          阵亡者：牟钢、其他新人<br><br>
          <em>"欢迎回到主神空间。十天后，你们将前往下一个世界。"</em>
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
      // 从主神空间离开后回主菜单
      overlay.innerHTML = `
        <div style="
          position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          background: rgba(0,0,0,0.95);
        ">
          <h2 style="color: #e0e0e0; letter-spacing: 6px; margin-bottom: 16px;">
            第一章 · 完
          </h2>
          <p style="color: #888; max-width: 500px; text-align: center; line-height: 1.8; margin-bottom: 30px;">
            郑吒用十天时间整备完毕。白色的光柱将他们送往了下一个世界——<br>
            <strong style="color: #ff8844;">异形一</strong><br><br>
            <em style="color: #555;">第二章 · 即将到来...</em>
          </p>
          <button onclick="location.reload()" style="
            background: transparent; border: 1px solid #444; color: #888;
            padding: 12px 40px; cursor: pointer; font-size: 16px;
            letter-spacing: 4px; font-family: inherit; border-radius: 8px;
          ">返回主菜单</button>
        </div>
      `;
    });
  });
}
