// ═══════════════════════════════════════════════════════════════
// 章节任务简报系统 — 轮回开始前的电影式过场
// ═══════════════════════════════════════════════════════════════

import { audioEngine } from './AudioEngine.js';
import { getCanonState } from './CanonState.js';

const BRIEFINGS = {
  1: {
    title: '名为生化',
    subtitle: '第一关 · 生化危机',
    worldDesc: '浣熊市地下蜂巢实验室',
    atmosphere: 'raccoon',
    briefingLines: [
      { speaker: '主神', text: '"欢迎来到主神空间。你们即将进入第一个轮回世界。"', delay: 2000 },
      { speaker: '张杰', text: '"所有人听好——这不是演习。在这个世界里，死亡是真实的。"', delay: 2500 },
      { speaker: '张杰', text: '"跟紧队伍，不要离开安全半径。弹药有限，优先近战。"', delay: 2500 },
      { speaker: '系统', text: '目标：在蜂巢中生存六小时，护送幸存者回列车。', delay: 1500 },
    ],
    objectives: ['完成移动、射击、队伍距离教学', '护送队伍穿过蜂巢', '在激光通道中生存', '坚持到六小时倒计时结束'],
    teamStatus: '张杰（队长）、郑吒、詹岚、李萧毅 + 新人',
    warning: '⚠ 离开剧情人物安全半径将触发主神警告',
  },
  2: {
    title: '异形杀戮',
    subtitle: '第二关 · 异形',
    worldDesc: '深空运输船 · 诺斯托罗莫号',
    atmosphere: 'starship',
    briefingLines: [
      { speaker: '主神', text: '"轮回世界：异形。你们的任务——在飞船中活下来。"', delay: 2000 },
      { speaker: '楚轩', text: '"注意这艘船的结构。通风管是关键——也是最危险的地方。"', delay: 2500 },
      { speaker: '零点', text: '"我需要一个稳定的狙击位。给我30秒准备时间就够了。"', delay: 2000 },
      { speaker: '系统', text: '目标：在飞船中搜集物资，击退异形，护送幸存者撤离。', delay: 1500 },
    ],
    objectives: ['搜集地图、焊枪和基础枪械', '穿过通风管道', '击伤异形皇后', '在真空前撤离'],
    teamStatus: '新增：楚轩、零点、霸王',
    warning: '⚠ 通风管中声音过大将引来异形',
  },
  3: {
    title: '咒怨阴影',
    subtitle: '第三关 · 咒怨',
    worldDesc: '东京都 · 诅咒宅邸',
    atmosphere: 'dark',
    briefingLines: [
      { speaker: '主神', text: '"轮回世界：咒怨。进入宅邸后，诅咒将标记所有人。"', delay: 2000 },
      { speaker: '齐腾一', text: '"灵体无法用物理攻击消灭。我们需要找到佛经——那是唯一的反制手段。"', delay: 3000 },
      { speaker: '赵樱空', text: '"……我来开路。不要回头看。"', delay: 2000 },
      { speaker: '系统', text: '目标：找到佛经，封印诅咒，在七波咒怨中生存。', delay: 1500 },
    ],
    objectives: ['调查五处异常确认诅咒', '取得佛经并守住翻译', '阻止队内冲突', '封印七波咒怨'],
    teamStatus: '新增：赵樱空、齐腾一、铭烟薇',
    warning: '⚠ 伽椰子不可击杀，只能拖延和封路',
  },
  4: {
    title: '神鬼秘宝',
    subtitle: '第四关 · 木乃伊',
    worldDesc: '古埃及 · 哈姆纳塔陵墓',
    atmosphere: 'desert',
    briefingLines: [
      { speaker: '主神', text: '"轮回世界：木乃伊。复活真经在陵墓深处。"', delay: 2000 },
      { speaker: '楚轩', text: '"印洲队也在这里。分三组行动——太阳金经、亡灵圣经、陵墓入口。时间有限。"', delay: 3000 },
      { speaker: '张恒', text: '"我来负责远程清障。沙漠里视野好，正适合我。"', delay: 2000 },
      { speaker: '系统', text: '目标：取得复活真经，击退印洲队，活着离开。', delay: 1500 },
    ],
    objectives: ['穿过沙暴与伏击', '翻译石板解开陵墓机关', '在三方混战中取得真经', '击败伊莫顿'],
    teamStatus: '新增：张恒、萧宏律',
    warning: '⚠ 印洲队精神屏蔽，需要零点找到射击窗口',
  },
  5: {
    title: '死神绝境',
    subtitle: '第五关 · 死神来了',
    worldDesc: '现代美国 · 连锁灾难现场',
    atmosphere: 'urban',
    briefingLines: [
      { speaker: '主神', text: '"轮回世界：死神来了。危险来自环境，而非怪物。"', delay: 2000 },
      { speaker: '萧宏律', text: '"死气……我感应到了。环境中的每一个物体都可能成为凶器。"', delay: 3000 },
      { speaker: '张杰', text: '"所有人，这一关之后……我有事要告诉你们。"', delay: 2500 },
      { speaker: '系统', text: '目标：拆除因果链，保护队友，完成队长交接。', delay: 1500 },
    ],
    objectives: ['在三地拆除因果链', '解除被精神控制的队友', '完成郑吒的队长考验', '与张杰告别'],
    teamStatus: '王侠展示爆破能力',
    warning: '⚠ 张杰的牺牲不可逆转。这是正史。',
  },
  6: {
    title: '异形再临',
    subtitle: '第六关 · 异形续篇',
    worldDesc: '军事实验船 · 奥利加号',
    atmosphere: 'starship',
    briefingLines: [
      { speaker: '主神', text: '"轮回世界：异形（续）。这次，你是队长。"', delay: 2000 },
      { speaker: '郑吒', text: '"（第一次以队长身份指挥……）听我的命令。"', delay: 2500 },
      { speaker: '程啸', text: '"我是军医。只要你们能把伤员带到我面前，我就能救。"', delay: 2500 },
      { speaker: '系统', text: '目标：指挥队伍穿越实验船，保护程啸完成手术。', delay: 1500 },
    ],
    objectives: ['筛选并组织新人', '隔离感染区域', '保护程啸完成手术', '击退进化异形并撤离'],
    teamStatus: '郑吒首次完整指挥 · 新增：程啸',
    warning: '取得重生十字勋章（重要道具）',
  },
  7: {
    title: '恶魔初临',
    subtitle: '第七关 · 生化危机三',
    worldDesc: '浣熊市废墟 · 恶魔队领地',
    atmosphere: 'raccoon_city',
    briefingLines: [
      { speaker: '主神', text: '"轮回世界：生化危机（续）。本次任务存在其他轮回队伍。"', delay: 2000 },
      { speaker: '楚轩', text: '"恶魔队……他们有我的复制体。小心他的计策。"', delay: 2500 },
      { speaker: '詹岚', text: '"信号显示他们就在附近。人数……至少十人。"', delay: 2000 },
      { speaker: '系统', text: '目标：保护剧情人物，在团战中生存。', delay: 1500 },
    ],
    objectives: ['确认恶魔队存在', '保护剧情人物转移', '在分队伏击中生存', '用十字勋章复活'],
    teamStatus: '中洲队 VS 恶魔队',
    warning: '⚠ 本关结束时除郑吒外全队阵亡。这是正史。',
  },
  8: {
    title: '重建中洲',
    subtitle: '第八关 · 侏罗纪公园',
    worldDesc: '侏罗纪世界 · 恐龙栖息地',
    atmosphere: 'jurassic',
    briefingLines: [
      { speaker: '郑吒', text: '"我回来了。这一次，我要把所有人带回来。"', delay: 2500 },
      { speaker: '系统', text: '复活仪式开始——楚轩将第一个回归。', delay: 2000 },
      { speaker: '楚轩', text: '"（复活）……感谢你，郑吒。我已经计算好了接下来的路线。"', delay: 3000 },
      { speaker: '系统', text: '目标：完成复活仪式，在侏罗纪世界重建中洲队。', delay: 1500 },
    ],
    objectives: ['复活楚轩', '在侏罗纪中复活霸王和王侠', '训练罗甘道完成协同', '击败巨龙取得龙族细胞'],
    teamStatus: '郑吒 → 楚轩 → 霸王 + 王侠 + 罗甘道',
    warning: '⚠ 罗甘道因负点将被主神抹杀',
  },
  9: {
    title: '星河远征',
    subtitle: '第九关 · 星河战队',
    worldDesc: '虫族星球 · 克伦达苏',
    atmosphere: 'starship',
    briefingLines: [
      { speaker: '主神', text: '"轮回世界：星河战队。目标：捕获脑虫。"', delay: 2000 },
      { speaker: '楚轩', text: '"先复活零点和詹岚。我们需要完整的侦察和狙击能力。"', delay: 2500 },
      { speaker: '零点', text: '"（复活）……给我一把枪。"', delay: 1500 },
      { speaker: '系统', text: '目标：建立阵地，防守虫潮，捕获脑虫。', delay: 1500 },
    ],
    objectives: ['复活零点和詹岚', '取得联邦装备', '守住三段防线', '捕获脑虫并撤离'],
    teamStatus: '复活：零点、詹岚、罗甘道',
    warning: '⚠ 其他轮回队伍也在这个世界',
  },
  10: {
    title: '五队大战',
    subtitle: '第十关 · 魔戒',
    worldDesc: '中土世界 · 刚铎',
    atmosphere: 'medieval',
    briefingLines: [
      { speaker: '主神', text: '"轮回世界：魔戒。五支队伍将在此决战。"', delay: 2000 },
      { speaker: '楚轩', text: '"先回生化世界取样本。然后复活赵樱空、张恒、程啸。"', delay: 3000 },
      { speaker: '郑吒', text: '"中洲队，集合。这次……我们全员到齐。"', delay: 2500 },
      { speaker: '系统', text: '目标：完成三人复活，在五队混战中生存。', delay: 1500 },
    ],
    objectives: ['取得强化样本', '复活赵樱空、张恒、程啸', '在魔戒会议中交换情报', '五队混战中取胜'],
    teamStatus: '中洲队全员归队',
    warning: '⚠ 天神队是最强对手',
  },
  11: {
    title: '心魔与终战前奏',
    subtitle: '第十一关 · 多世界试炼',
    worldDesc: '变形金刚 / 猛鬼街 / 天煞',
    atmosphere: 'dark',
    briefingLines: [
      { speaker: '主神', text: '"最终试炼开始。破除心魔，才能面对最后的敌人。"', delay: 2000 },
      { speaker: '郑吒', text: '"每个人都有自己的心魔。但我们不是一个人在战斗。"', delay: 2500 },
      { speaker: '楚轩', text: '"这是主神的最后测试。通过之后，就是终局。"', delay: 2500 },
      { speaker: '系统', text: '目标：在多个世界中破除心魔，觉醒真正的力量。', delay: 1500 },
    ],
    objectives: ['在变形金刚世界中战斗', '在猛鬼街中直面恐惧', '在天煞世界中觉醒', '破除心魔'],
    teamStatus: '全员接受试炼',
    warning: '觉醒后的力量将决定终战的胜负',
  },
  12: {
    title: '生化终战',
    subtitle: '最终关 · 终局之战',
    worldDesc: '主神空间 · 一切的起点与终点',
    atmosphere: 'final_war',
    briefingLines: [
      { speaker: '主神', text: '"最终轮回。击败恶魔队，摧毁主神碎片。"', delay: 2000 },
      { speaker: '郑吒', text: '"兄弟们……这是最后一战了。我们一起回家。"', delay: 3000 },
      { speaker: '楚轩', text: '"一切都在计划之中。信我。"', delay: 2000 },
      { speaker: '系统', text: '目标：击败恶魔队，摧毁主神碎片，结束轮回。', delay: 1500 },
    ],
    objectives: ['击败恶魔队核心成员', '摧毁主神碎片', '保护所有队友存活', '回家'],
    teamStatus: '中洲队全员 VS 恶魔队全员',
    warning: '最终之战。没有退路。',
  },
};

/**
 * 显示章节任务简报
 * @returns {Promise} 简报完成后resolve
 */
export function showChapterBriefing(chapterNum) {
  return new Promise((resolve) => {
    const briefing = BRIEFINGS[chapterNum];
    if (!briefing) { resolve(); return; }
    
    const canon = getCanonState();
    const alive = canon.getAlive().map(c => c.name);
    const captain = canon.getCaptain();
    
    const overlay = document.getElementById('ui-overlay');
    if (!overlay) { resolve(); return; }
    
    // 构建简报HTML
    const objectivesHTML = briefing.objectives.map((obj, i) => 
      `<div style="display:flex;gap:8px;align-items:flex-start;margin-bottom:6px;">
        <span style="color:#ffcc44;font-size:11px;min-width:20px;">${i + 1}.</span>
        <span style="color:#ccc;font-size:12px;">${obj}</span>
      </div>`
    ).join('');
    
    overlay.innerHTML = `
      <div id="briefing-container" style="
        position:absolute;top:0;left:0;right:0;bottom:0;
        display:flex;flex-direction:column;align-items:center;justify-content:center;
        background:rgba(0,0,0,0.95);
        animation: brief-fadeIn 1.5s;
      ">
        <style>
          @keyframes brief-fadeIn { from { opacity:0 } to { opacity:1 } }
          @keyframes brief-slideUp { from { transform:translateY(20px);opacity:0 } to { transform:translateY(0);opacity:1 } }
          @keyframes brief-typewriter { from { width:0 } to { width:100% } }
          @keyframes brief-glow { 0%,100% { text-shadow:0 0 10px rgba(255,204,68,0.3) } 50% { text-shadow:0 0 20px rgba(255,204,68,0.6) } }
        </style>
        
        <!-- 顶部装饰 -->
        <div style="color:#ff444466;font-size:10px;letter-spacing:12px;margin-bottom:16px;">
          ─── 任 务 简 报 ───
        </div>
        
        <!-- 章节标题 -->
        <h1 style="
          font-size:42px;color:#e0e0e0;letter-spacing:12px;margin-bottom:4px;
          font-family:'Noto Serif SC','Microsoft YaHei',serif;
          animation: brief-glow 3s ease-in-out infinite;
        ">
          ${briefing.title}
        </h1>
        <p style="color:#888;font-size:13px;letter-spacing:4px;margin-bottom:24px;">
          ${briefing.subtitle}
        </p>
        
        <!-- 世界描述 -->
        <div style="
          background:rgba(20,15,10,0.8);border:1px solid #aa884420;border-radius:12px;
          padding:20px 30px;max-width:520px;width:90%;margin-bottom:20px;
        ">
          <p style="color:#aa8844;font-size:10px;letter-spacing:4px;margin-bottom:12px;">
            ◆ 轮回世界
          </p>
          <p style="color:#ccc;font-size:14px;margin-bottom:16px;">${briefing.worldDesc}</p>
          
          <!-- 对话 -->
          <div id="briefing-dialogue" style="
            min-height:80px;border-left:2px solid #ff444433;padding-left:12px;margin-bottom:16px;
          ">
            <p style="color:#555;font-size:12px;font-style:italic;">正在连接轮回通道...</p>
          </div>
          
          <!-- 任务目标 -->
          <p style="color:#ffcc44;font-size:10px;letter-spacing:4px;margin-bottom:8px;">
            ◆ 任务目标
          </p>
          ${objectivesHTML}
          
          <!-- 队伍状态 -->
          <div style="margin-top:12px;padding-top:10px;border-top:1px solid #ffffff08;">
            <p style="color:#66aacc;font-size:10px;letter-spacing:2px;margin-bottom:4px;">
              队伍：${briefing.teamStatus}
            </p>
            ${captain ? `<p style="color:#888;font-size:10px;">队长：${captain.name}</p>` : ''}
          </div>
          
          <!-- 警告 -->
          ${briefing.warning ? `
            <div style="
              margin-top:12px;padding:8px 12px;
              background:rgba(255,68,68,0.05);border:1px solid rgba(255,68,68,0.2);
              border-radius:6px;
            ">
              <p style="color:#ff6644;font-size:11px;">${briefing.warning}</p>
            </div>
          ` : ''}
        </div>
        
        <!-- 开始按钮 -->
        <button id="btn-start-mission" style="
          margin-top:10px;background:transparent;border:1px solid #ffcc4444;
          color:#ffcc44;padding:12px 50px;cursor:pointer;font-size:16px;
          letter-spacing:6px;font-family:inherit;border-radius:8px;
          transition:all 0.3s;opacity:0;animation:brief-slideUp 0.5s ease 2s forwards;
        " onmouseover="this.style.borderColor='#ffcc44';this.style.background='rgba(255,204,68,0.1)'"
           onmouseout="this.style.borderColor='#ffcc4444';this.style.background='transparent'">
          进 入 轮 回
        </button>
      </div>
    `;
    
    // 逐行显示对话
    const dialogueBox = document.getElementById('briefing-dialogue');
    if (dialogueBox && briefing.briefingLines.length > 0) {
      let lineIdx = 0;
      let totalDelay = 500;
      
      const showLine = () => {
        if (lineIdx >= briefing.briefingLines.length) return;
        const line = briefing.briefingLines[lineIdx];
        const speakerColors = {
          '主神': '#ff4444', '系统': '#ffcc44',
          '张杰': '#4488ff', '郑吒': '#44ff88', '楚轩': '#cc88ff',
          '零点': '#88ccff', '詹岚': '#ff88cc', '赵樱空': '#ff6688',
          '齐腾一': '#88ff88', '萧宏律': '#aaccff', '张恒': '#88aaff',
          '程啸': '#cc8844', '霸王': '#ff8844', '王侠': '#ffaa44',
        };
        const color = speakerColors[line.speaker] || '#888';
        
        if (lineIdx === 0) dialogueBox.innerHTML = '';
        
        const lineEl = document.createElement('div');
        lineEl.style.cssText = `margin-bottom:8px;opacity:0;animation:brief-slideUp 0.4s ease forwards;`;
        lineEl.innerHTML = `
          <span style="color:${color};font-size:11px;font-weight:bold;">[${line.speaker}]</span>
          <span style="color:#bbb;font-size:12px;line-height:1.6;margin-left:6px;">${line.text}</span>
        `;
        dialogueBox.appendChild(lineEl);
        lineIdx++;
        
        if (lineIdx < briefing.briefingLines.length) {
          setTimeout(showLine, line.delay || 2000);
        }
      };
      
      setTimeout(showLine, 800);
    }
    
    // 点击或按键跳过
    const startBtn = document.getElementById('btn-start-mission');
    const cleanup = () => {
      overlay.innerHTML = '';
      document.removeEventListener('keydown', keySkip);
      resolve();
    };
    
    if (startBtn) {
      startBtn.addEventListener('click', cleanup);
    }
    
    const keySkip = (e) => {
      if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
        e.preventDefault();
        cleanup();
      }
    };
    document.addEventListener('keydown', keySkip);
  });
}

export { BRIEFINGS };
