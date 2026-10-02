// ═══════════════════════════════════════════════════════════════
// 任务追踪系统 — 每章主线目标 + 支线目标 + HUD显示
// ═══════════════════════════════════════════════════════════════
import { gameState } from './GameState.js';
import { eventBus } from './EventBus.js';

// ── 每章任务定义 ──
const CHAPTER_QUESTS = {
  1: {
    main: '在蜂巢实验室中生存，在暴君苏醒前撤离',
    sub: [
      { id: 'ch1_rescue', text: '与新人队员汇合', check: () => true },
      { id: 'ch1_weapon', text: '获得第一把武器', check: () => !!gameState.player.weapon },
      { id: 'ch1_survive', text: '通过6层楼层', check: () => (gameState.stats.floorsCleared || 0) >= 6 },
    ],
  },
  2: {
    main: '在异形飞船上生存，消灭异形皇后',
    sub: [
      { id: 'ch2_flamer', text: '找到火焰喷射器', check: () => gameState.player.weapon?.name?.includes('火焰') },
      { id: 'ch2_queen', text: '击败异形皇后', check: () => (gameState.stats.bossesKilled || 0) >= 2 },
    ],
  },
  3: {
    main: '在伽椰子的诅咒中存活七天，找到破解方法',
    sub: [
      { id: 'ch3_sutra', text: '发现退魔佛经', check: () => (gameState.stats.loreFound || 0) >= 2 },
      { id: 'ch3_kayako', text: '封印伽椰子', check: () => (gameState.stats.bossesKilled || 0) >= 3 },
    ],
  },
  4: {
    main: '取得复活真经，击败印洲队',
    sub: [
      { id: 'ch4_tomb', text: '进入陵墓深处', check: () => true },
      { id: 'ch4_imhotep', text: '击败伊莫顿', check: () => (gameState.stats.bossesKilled || 0) >= 4 },
    ],
  },
  5: {
    main: '在死神世界中寻找生机',
    sub: [
      { id: 'ch5_pattern', text: '分析死亡征兆', check: () => (gameState.stats.loreFound || 0) >= 4 },
      { id: 'ch5_test', text: '通过郑吒的考验', check: () => (gameState.stats.bossesKilled || 0) >= 5 },
    ],
  },
  6: {
    main: '再次面对异形威胁，保护程啸',
    sub: [
      { id: 'ch6_cheng', text: '营救程啸', check: () => true },
      { id: 'ch6_newborn', text: '击败新生异形', check: () => (gameState.stats.bossesKilled || 0) >= 6 },
    ],
  },
  7: {
    main: '在浣熊市抵御恶魔队',
    sub: [
      { id: 'ch7_npc', text: '保护剧情人物', check: () => true },
      { id: 'ch7_survive', text: '全队存活撤离', check: () => true },
    ],
  },
  8: {
    main: '重建中洲队，复活楚轩',
    sub: [
      { id: 'ch8_chuxuan', text: '使用真经复活楚轩', check: () => (gameState.companions || []).some(c => c.id === 'chu_xuan') },
      { id: 'ch8_dino', text: '在侏罗纪世界生存', check: () => (gameState.stats.bossesKilled || 0) >= 8 },
    ],
  },
  9: {
    main: '星河远征，捕获脑虫',
    sub: [
      { id: 'ch9_base', text: '建立军事基地', check: () => true },
      { id: 'ch9_brainbug', text: '捕获脑虫撤离', check: () => (gameState.stats.bossesKilled || 0) >= 9 },
    ],
  },
  10: {
    main: '五队大战：争夺魔戒',
    sub: [
      { id: 'ch10_alliance', text: '与其他队伍周旋', check: () => true },
      { id: 'ch10_mordor', text: '通过魔多战场', check: () => (gameState.stats.bossesKilled || 0) >= 10 },
    ],
  },
  11: {
    main: '破除心魔，觉醒真正力量',
    sub: [
      { id: 'ch11_dream', text: '在梦境中战斗', check: () => true },
      { id: 'ch11_heart', text: '击败心魔', check: () => (gameState.stats.bossesKilled || 0) >= 11 },
    ],
  },
  12: {
    main: '最终一战：击败恶魔队，摧毁主神',
    sub: [
      { id: 'ch12_demon', text: '击败恶魔队主力', check: () => true },
      { id: 'ch12_final', text: '摧毁主神碎片', check: () => (gameState.stats.bossesKilled || 0) >= 12 },
    ],
  },
};

// ── 获取当前章节任务 ──
export function getCurrentQuests() {
  const ch = gameState.chapter || 1;
  return CHAPTER_QUESTS[ch] || CHAPTER_QUESTS[1];
}

// ── HUD渲染 (Canvas绘制) ──
export function drawQuestHUD(ctx, canvasW, canvasH) {
  const quests = getCurrentQuests();
  if (!quests) return;

  const x = 8;
  const y = canvasH - 90;
  const alpha = 0.7;

  // 背景
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = 'rgba(5,5,15,0.6)';
  ctx.fillRect(x, y, 220, 80);

  ctx.globalAlpha = 1;

  // 主线标题
  ctx.font = 'bold 10px "Microsoft YaHei"';
  ctx.fillStyle = '#ffcc44';
  ctx.textAlign = 'left';
  ctx.fillText('📋 ' + quests.main.substring(0, 18) + (quests.main.length > 18 ? '...' : ''), x + 8, y + 14);

  // 支线
  ctx.font = '9px "Microsoft YaHei"';
  let dy = 28;
  for (const sub of quests.sub.slice(0, 3)) {
    const done = sub.check();
    ctx.fillStyle = done ? '#44ff88' : '#666';
    ctx.fillText((done ? '✓ ' : '○ ') + sub.text, x + 12, y + dy);
    dy += 15;
  }

  ctx.restore();
}

// ── 格式化任务面板HTML ──
export function formatQuestPanelHTML() {
  const quests = getCurrentQuests();
  if (!quests) return '';

  let html = `<div style="margin-bottom:12px;">
    <p style="color:#ffcc44;font-size:14px;font-weight:bold;margin-bottom:8px;">
      📋 第${gameState.chapter}章 · 主线任务
    </p>
    <p style="color:#ddd;font-size:13px;padding:8px;background:rgba(255,204,68,0.05);
      border:1px solid #ffcc4422;border-radius:6px;">${quests.main}</p>
  </div>`;

  if (quests.sub.length > 0) {
    html += '<p style="color:#aaa;font-size:12px;margin-bottom:6px;">支线目标</p>';
    for (const sub of quests.sub) {
      const done = sub.check();
      html += `<p style="color:${done ? '#44ff88' : '#888'};font-size:12px;margin-bottom:4px;">
        ${done ? '✓' : '○'} ${sub.text}
      </p>`;
    }
  }

  return html;
}
