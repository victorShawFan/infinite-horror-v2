// ═══════════════════════════════════════════════════════════════
// 统一过场动画引擎 — 全12章精装版
// ═══════════════════════════════════════════════════════════════
// 特性：
// - 统一 playCutscene() 引擎驱动所有章节
// - 支持 title / subtitle / dialogue 三种场景类型
// - 渐变背景、说话者标签、打字机效果(可选)
// - Esc 跳过 / 点击推进 / 空格-Enter推进 / 自动计时
// - 每章独立色调和粒子效果
// - onFinish 防重入保护
// ═══════════════════════════════════════════════════════════════

// ── 粒子效果生成器 ──
function generateParticleCSS(theme) {
  const particles = {
    blood:   { color: '#ff2222', shadow: 'rgba(255,0,0,0.4)',   char: '•', count: 20 },
    alien:   { color: '#44ff88', shadow: 'rgba(0,255,100,0.3)', char: '◆', count: 15 },
    curse:   { color: '#8844cc', shadow: 'rgba(100,0,200,0.4)', char: '✦', count: 18 },
    sand:    { color: '#ddaa44', shadow: 'rgba(200,160,40,0.4)',char: '⬥', count: 12 },
    death:   { color: '#8899bb', shadow: 'rgba(100,120,160,0.4)',char: '†', count: 10 },
    space:   { color: '#6688ff', shadow: 'rgba(80,100,255,0.4)',char: '✧', count: 22 },
    demon:   { color: '#ff4444', shadow: 'rgba(255,40,40,0.5)', char: '🔥', count: 16 },
    jungle:  { color: '#88cc44', shadow: 'rgba(100,200,40,0.3)',char: '🍃', count: 14 },
    star:    { color: '#aaccff', shadow: 'rgba(140,180,255,0.3)',char: '★', count: 20 },
    war:     { color: '#ffaa22', shadow: 'rgba(255,160,20,0.4)',char: '⚔', count: 18 },
    dream:   { color: '#cc66ff', shadow: 'rgba(180,60,255,0.4)',char: '◉', count: 15 },
    final:   { color: '#ff6644', shadow: 'rgba(255,80,40,0.5)', char: '💀', count: 25 },
  };
  const p = particles[theme] || particles.blood;
  let css = '';
  for (let i = 0; i < p.count; i++) {
    const x = Math.random() * 100;
    const delay = Math.random() * 6;
    const dur = 4 + Math.random() * 6;
    const size = 8 + Math.random() * 16;
    css += `
      .cs-particle-${i} {
        position: absolute;
        left: ${x}%;
        bottom: -20px;
        font-size: ${size}px;
        color: ${p.color};
        text-shadow: 0 0 8px ${p.shadow};
        opacity: 0;
        pointer-events: none;
        animation: csFloat ${dur}s ${delay}s infinite ease-out;
      }`;
  }
  return { css, html: Array.from({length: p.count}, (_, i) => 
    `<span class="cs-particle-${i}">${p.char}</span>`
  ).join(''), keyframes: `
    @keyframes csFloat {
      0%   { transform: translateY(0) rotate(0deg); opacity: 0; }
      10%  { opacity: 0.6; }
      90%  { opacity: 0.1; }
      100% { transform: translateY(-100vh) rotate(360deg); opacity: 0; }
    }
  `};
}

// ── 统一过场引擎 ──
function playCutscene(scenes, themeConfig, onFinish) {
  const overlay = document.getElementById('ui-overlay');
  if (!overlay) { onFinish(); return; }
  
  let idx = 0;
  let finished = false;
  let autoTimer = null;
  
  const { 
    titleColor = '#e8d8c0',
    titleShadow = 'rgba(200,180,140,0.5)',
    subtitleColor = '#aabbcc',
    speakerColor = '#8899bb',
    textColor = '#d0d0d8',
    dialogBorder = 'rgba(100,120,160,0.5)',
    bgGradient = 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.95) 100%)',
    titleGradient = 'radial-gradient(ellipse at center, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.9) 100%)',
    particleTheme = 'blood',
    accentGlow = 'rgba(200,100,100,0.15)'
  } = themeConfig;

  const particles = generateParticleCSS(particleTheme);

  function finish() {
    if (finished) return;
    finished = true;
    if (autoTimer) clearTimeout(autoTimer);
    document.removeEventListener('keydown', keyHandler);
    overlay.innerHTML = '';
    onFinish();
  }

  function keyHandler(e) {
    if (e.key === 'Escape') { finish(); return; }
    if (e.key === ' ' || e.key === 'Enter') { advance(); }
  }

  function advance() {
    if (autoTimer) clearTimeout(autoTimer);
    idx++;
    if (idx >= scenes.length) { finish(); return; }
    renderScene();
  }

  function renderScene() {
    if (idx >= scenes.length) { finish(); return; }
    const s = scenes[idx];
    const isTitle = s.type === 'title';
    const isSubtitle = s.type === 'subtitle';
    const bg = isTitle || isSubtitle ? titleGradient : bgGradient;
    
    // 构建标题/副标题/对话样式
    let contentStyle = '';
    let contentHTML = '';
    
    if (isTitle) {
      contentStyle = `
        font-size: 56px; letter-spacing: 14px; 
        color: ${titleColor}; 
        text-shadow: 0 0 40px ${titleShadow}, 0 2px 20px rgba(0,0,0,0.8);
        animation: csTitlePulse 3s ease-in-out infinite;
        text-align: center;
      `;
      contentHTML = s.text;
    } else if (isSubtitle) {
      contentStyle = `
        font-size: 32px; letter-spacing: 20px; 
        color: ${subtitleColor}; 
        text-shadow: 0 0 20px ${titleShadow};
        text-align: center; opacity: 0;
        animation: csSubFadeIn 1.2s 0.3s ease forwards;
      `;
      contentHTML = s.text;
    } else {
      // 对话场景
      contentStyle = `
        max-width: 720px; padding: 28px 36px; margin-bottom: 60px;
        background: rgba(0,0,0,0.65); border-radius: 14px;
        border-left: 3px solid ${dialogBorder};
        box-shadow: 0 0 40px ${accentGlow};
        animation: csDialogSlide 0.6s ease;
      `;
      const speakerTag = s.speaker ? `
        <p style="color:${speakerColor};font-size:13px;margin-bottom:10px;
                   letter-spacing:3px;font-weight:bold;
                   text-shadow: 0 0 10px ${speakerColor};">
          ◆ ${s.speaker}
        </p>` : '';
      contentHTML = `${speakerTag}
        <p style="color:${textColor};font-size:17px;line-height:2;
                   white-space:pre-line;letter-spacing:0.5px;">
          ${s.text}
        </p>`;
    }

    // 底部提示
    const hint = `<div style="position:absolute;bottom:16px;width:100%;text-align:center;">
      <span style="color:rgba(255,255,255,0.2);font-size:11px;letter-spacing:2px;">
        点击 / 空格 继续 · Esc 跳过
      </span>
    </div>`;

    // 场景编号指示器
    const progress = `<div style="position:absolute;top:16px;right:20px;">
      <span style="color:rgba(255,255,255,0.15);font-size:11px;">
        ${idx + 1} / ${scenes.length}
      </span>
    </div>`;

    overlay.innerHTML = `
      <div id="cs-backdrop" style="
        position:absolute;top:0;left:0;right:0;bottom:0;
        background:${bg};
        display:flex;align-items:${isTitle||isSubtitle?'center':'flex-end'};
        justify-content:center;cursor:pointer;
        overflow:hidden;
      ">
        ${particles.html}
        <div style="${contentStyle}font-family:'Microsoft YaHei','PingFang SC',sans-serif;">
          ${contentHTML}
        </div>
        ${hint}
        ${progress}
      </div>
      <style>
        ${particles.css}
        ${particles.keyframes}
        @keyframes csTitlePulse {
          0%, 100% { text-shadow: 0 0 40px ${titleShadow}, 0 2px 20px rgba(0,0,0,0.8); }
          50% { text-shadow: 0 0 60px ${titleShadow}, 0 0 80px ${titleShadow}, 0 2px 20px rgba(0,0,0,0.8); }
        }
        @keyframes csSubFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes csDialogSlide {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      </style>
    `;

    // 点击推进
    document.getElementById('cs-backdrop')?.addEventListener('click', advance);

    // 自动推进
    autoTimer = setTimeout(advance, s.duration || 4000);
  }

  document.addEventListener('keydown', keyHandler);
  renderScene();
}

// ═══════════════════════════════════════════════════════════════
// 各章主题配色
// ═══════════════════════════════════════════════════════════════

const THEME_CH1 = {
  titleColor: '#e8c8a0', titleShadow: 'rgba(200,160,100,0.5)',
  subtitleColor: '#aa9977', speakerColor: '#cc9944', textColor: '#d8d0c0',
  dialogBorder: 'rgba(180,140,80,0.5)', particleTheme: 'blood',
  bgGradient: 'linear-gradient(180deg, rgba(20,10,5,0.4) 0%, rgba(15,8,3,0.8) 50%, rgba(10,5,0,0.97) 100%)',
  titleGradient: 'radial-gradient(ellipse at center, rgba(30,15,5,0.5), rgba(10,5,0,0.95))',
  accentGlow: 'rgba(180,100,40,0.12)',
};

const THEME_CH2 = {
  titleColor: '#a0d8a0', titleShadow: 'rgba(80,200,100,0.5)',
  subtitleColor: '#66aa66', speakerColor: '#44cc88', textColor: '#c8d8c8',
  dialogBorder: 'rgba(60,180,80,0.5)', particleTheme: 'alien',
  bgGradient: 'linear-gradient(180deg, rgba(0,15,5,0.4) 0%, rgba(0,10,3,0.8) 50%, rgba(0,5,0,0.97) 100%)',
  titleGradient: 'radial-gradient(ellipse at center, rgba(0,20,10,0.5), rgba(0,8,3,0.95))',
  accentGlow: 'rgba(40,180,80,0.12)',
};

const THEME_CH3 = {
  titleColor: '#c8a0d8', titleShadow: 'rgba(160,80,200,0.5)',
  subtitleColor: '#9966aa', speakerColor: '#aa66cc', textColor: '#d0c8d8',
  dialogBorder: 'rgba(140,60,180,0.5)', particleTheme: 'curse',
  bgGradient: 'linear-gradient(180deg, rgba(15,5,20,0.4) 0%, rgba(10,3,15,0.8) 50%, rgba(5,0,10,0.97) 100%)',
  titleGradient: 'radial-gradient(ellipse at center, rgba(20,5,30,0.5), rgba(8,0,12,0.95))',
  accentGlow: 'rgba(140,40,200,0.12)',
};

const THEME_CH4 = {
  titleColor: '#e8d090', titleShadow: 'rgba(200,180,80,0.5)',
  subtitleColor: '#ccaa55', speakerColor: '#ddbb44', textColor: '#d8d0b8',
  dialogBorder: 'rgba(180,160,60,0.5)', particleTheme: 'sand',
  bgGradient: 'linear-gradient(180deg, rgba(20,15,5,0.4) 0%, rgba(15,10,3,0.8) 50%, rgba(10,8,0,0.97) 100%)',
  titleGradient: 'radial-gradient(ellipse at center, rgba(30,20,5,0.5), rgba(12,8,0,0.95))',
  accentGlow: 'rgba(200,160,40,0.12)',
};

const THEME_CH5 = {
  titleColor: '#c0c8d8', titleShadow: 'rgba(140,160,200,0.5)',
  subtitleColor: '#8899bb', speakerColor: '#6688aa', textColor: '#d0d4dc',
  dialogBorder: 'rgba(100,130,180,0.5)', particleTheme: 'death',
  bgGradient: 'linear-gradient(180deg, rgba(5,8,15,0.4) 0%, rgba(3,5,12,0.8) 50%, rgba(0,3,8,0.97) 100%)',
  titleGradient: 'radial-gradient(ellipse at center, rgba(8,12,25,0.5), rgba(3,5,12,0.95))',
  accentGlow: 'rgba(80,110,180,0.12)',
};

const THEME_CH6 = {
  titleColor: '#88bbff', titleShadow: 'rgba(80,140,255,0.5)',
  subtitleColor: '#6699cc', speakerColor: '#6699cc', textColor: '#d0d8e0',
  dialogBorder: 'rgba(80,120,200,0.5)', particleTheme: 'alien',
  bgGradient: 'linear-gradient(180deg, rgba(0,8,20,0.4) 0%, rgba(0,5,15,0.8) 50%, rgba(0,3,10,0.97) 100%)',
  titleGradient: 'radial-gradient(ellipse at center, rgba(0,12,30,0.5), rgba(0,5,15,0.95))',
  accentGlow: 'rgba(60,100,200,0.12)',
};

const THEME_CH7 = {
  titleColor: '#ff8866', titleShadow: 'rgba(255,100,60,0.6)',
  subtitleColor: '#cc6644', speakerColor: '#ff6644', textColor: '#e0d0c8',
  dialogBorder: 'rgba(200,80,40,0.5)', particleTheme: 'demon',
  bgGradient: 'linear-gradient(180deg, rgba(25,5,0,0.4) 0%, rgba(18,3,0,0.8) 50%, rgba(12,0,0,0.97) 100%)',
  titleGradient: 'radial-gradient(ellipse at center, rgba(35,8,0,0.5), rgba(15,3,0,0.95))',
  accentGlow: 'rgba(255,60,30,0.15)',
};

const THEME_CH8 = {
  titleColor: '#aade66', titleShadow: 'rgba(120,200,60,0.5)',
  subtitleColor: '#88bb44', speakerColor: '#66aa33', textColor: '#d0d8c0',
  dialogBorder: 'rgba(100,180,40,0.5)', particleTheme: 'jungle',
  bgGradient: 'linear-gradient(180deg, rgba(8,15,3,0.4) 0%, rgba(5,10,2,0.8) 50%, rgba(3,8,0,0.97) 100%)',
  titleGradient: 'radial-gradient(ellipse at center, rgba(12,22,5,0.5), rgba(5,10,2,0.95))',
  accentGlow: 'rgba(80,200,40,0.12)',
};

const THEME_CH9 = {
  titleColor: '#aaccff', titleShadow: 'rgba(120,160,255,0.5)',
  subtitleColor: '#88aadd', speakerColor: '#6699ee', textColor: '#d0d8e8',
  dialogBorder: 'rgba(80,120,220,0.5)', particleTheme: 'star',
  bgGradient: 'linear-gradient(180deg, rgba(3,5,18,0.4) 0%, rgba(2,3,14,0.8) 50%, rgba(0,2,10,0.97) 100%)',
  titleGradient: 'radial-gradient(ellipse at center, rgba(5,8,30,0.5), rgba(2,3,14,0.95))',
  accentGlow: 'rgba(80,120,255,0.12)',
};

const THEME_CH10 = {
  titleColor: '#ffcc44', titleShadow: 'rgba(255,180,40,0.6)',
  subtitleColor: '#ddaa33', speakerColor: '#eebb44', textColor: '#e0d8c0',
  dialogBorder: 'rgba(200,160,40,0.5)', particleTheme: 'war',
  bgGradient: 'linear-gradient(180deg, rgba(15,12,3,0.4) 0%, rgba(10,8,2,0.8) 50%, rgba(8,5,0,0.97) 100%)',
  titleGradient: 'radial-gradient(ellipse at center, rgba(25,18,5,0.5), rgba(10,8,2,0.95))',
  accentGlow: 'rgba(200,160,40,0.15)',
};

const THEME_CH11 = {
  titleColor: '#cc88ff', titleShadow: 'rgba(180,100,255,0.6)',
  subtitleColor: '#aa66dd', speakerColor: '#bb77ee', textColor: '#d8d0e0',
  dialogBorder: 'rgba(160,80,220,0.5)', particleTheme: 'dream',
  bgGradient: 'linear-gradient(180deg, rgba(15,5,20,0.4) 0%, rgba(10,3,15,0.8) 50%, rgba(8,0,12,0.97) 100%)',
  titleGradient: 'radial-gradient(ellipse at center, rgba(22,8,30,0.5), rgba(10,3,15,0.95))',
  accentGlow: 'rgba(160,60,220,0.15)',
};

const THEME_CH12 = {
  titleColor: '#ff4433', titleShadow: 'rgba(255,50,30,0.7)',
  subtitleColor: '#dd3322', speakerColor: '#ff5544', textColor: '#e8d0c8',
  dialogBorder: 'rgba(220,40,20,0.6)', particleTheme: 'final',
  bgGradient: 'linear-gradient(180deg, rgba(25,3,0,0.4) 0%, rgba(18,2,0,0.8) 50%, rgba(12,0,0,0.97) 100%)',
  titleGradient: 'radial-gradient(ellipse at center, rgba(40,5,0,0.5), rgba(18,2,0,0.95))',
  accentGlow: 'rgba(255,40,20,0.18)',
};

// ═══════════════════════════════════════════════════════════════
// 第一章 · 生化危机
// ═══════════════════════════════════════════════════════════════
const SCENES_CH1 = [
  { text: '在那个平凡无奇的夜晚，郑吒只是想看一场午夜电影。', duration: 3500 },
  { text: '"想不想回到那些惊心动魄的电影世界里去？"\n——这个声音改变了一切。', duration: 4000 },
  { text: '主神：一个超越理解的存在。\n它将普通人投入由经典恐怖电影构成的轮回世界。\n活下来，获得奖励。死亡，永远消失。', duration: 5000 },
  { text: '你在一列疾驰的列车上醒来。\n窗外是无尽的黑暗隧道。\n身边是几个同样困惑的陌生人。', duration: 4500 },
  { speaker: '主神', text: '"各位，欢迎来到主神空间。你们即将进入的世界是——\n《生化危机》。"', duration: 4000 },
  { speaker: '主神', text: '任务目标：在蜂巢实验室中生存。\n在暴君苏醒前撤离到列车。\n违反剧情角色规则者，将被主神惩罚。', duration: 4500 },
  { text: '第一章', type: 'title', duration: 2000 },
  { text: '名 为 生 化', type: 'subtitle', duration: 2500 },
];

// ═══════════════════════════════════════════════════════════════
// 第二章 · 异形杀戮
// ═══════════════════════════════════════════════════════════════
const SCENES_CH2 = [
  { text: '主神空间的十天转瞬即逝。\n白色光柱再次降临。', duration: 3500 },
  { speaker: '主神', text: '"下一个世界——\n《异形》。"', duration: 3000 },
  { text: '你注意到队伍中多了几张新面孔。\n一个戴眼镜的男人正在计算什么——楚轩。\n一个冷峻的狙击手站在角落——零点。', duration: 4500 },
  { text: '光柱将你们投射到了一艘巨大的太空飞船内部。\n空气中弥漫着金属和机油的味道。\n某处传来金属刮擦的声音。', duration: 4500 },
  { speaker: '主神', text: '任务目标：在LV-426轨道的"苏拉科"号上生存。\n消灭异形皇后。\n在飞船自毁前撤离。', duration: 4500 },
  { text: '第二章', type: 'title', duration: 2000 },
  { text: '异 形 杀 戮', type: 'subtitle', duration: 2500 },
];

// ═══════════════════════════════════════════════════════════════
// 第三章 · 咒怨阴影
// ═══════════════════════════════════════════════════════════════
const SCENES_CH3 = [
  { text: '又是十天。\n主神空间里的时光平静得像暴风雨前的海面。', duration: 3500 },
  { text: '队伍变得更大了。\n赵樱空、齐腾一、铭烟薇……还有一些不太愿意自我介绍的新人。', duration: 4000 },
  { speaker: '楚轩', text: '"根据我的分析，下一个世界的威胁等级将大幅提升。\n物理手段可能不再有效。请做好准备。"', duration: 4500 },
  { speaker: '主神', text: '"下一个世界——\n《咒怨》。"', duration: 3000 },
  { text: '白光消散时，你站在一条阴暗的日本住宅街上。\n空气中弥漫着潮湿、陈旧的气息。\n远处，一栋老旧的日式宅邸静静矗立着。', duration: 4500 },
  { speaker: '主神', text: '任务目标：在伽椰子的诅咒中存活七天。\n找到破解诅咒的方法。\n封印或压制伽椰子的怨念。', duration: 4500 },
  { text: '第三章', type: 'title', duration: 2000 },
  { text: '咒 怨 阴 影', type: 'subtitle', duration: 2500 },
];

// ═══════════════════════════════════════════════════════════════
// 第四章 · 神鬼秘宝
// ═══════════════════════════════════════════════════════════════
const SCENES_CH4 = [
  { text: '十天整备期结束了。\n主神空间的光柱再次笼罩所有人。', duration: 3500 },
  { text: '这一次队伍更大了。张恒——一个眼神锐利的青年。\n萧宏律——一个看似普通却出人意料的胖子。', duration: 4000 },
  { speaker: '赵樱空', text: '"我感应到了。这次不只是怪物——\n另一支主神队伍也会进入同一个世界。"', duration: 4000 },
  { speaker: '主神', text: '"下一个世界——\n《神鬼传奇》。\n特殊任务：取得复活真经。\n警告：印洲队将争夺同一目标。"', duration: 4500 },
  { text: '灼热的光芒消散后，滚烫的沙漠热浪扑面而来。\n远处是无尽的黄沙，以及一支缓缓前行的骆驼商队。\n哈姆纳塔——死亡之城。', duration: 4500 },
  { text: '第四章', type: 'title', duration: 2000 },
  { text: '神 鬼 秘 宝', type: 'subtitle', duration: 2500 },
];

// ═══════════════════════════════════════════════════════════════
// 第五章 · 死神绝境
// ═══════════════════════════════════════════════════════════════
const SCENES_CH5 = [
  { text: '十天。又是十天。\n每一次从主神空间出发，都意味着可能再也回不来。', duration: 3500 },
  { text: '少了零点和齐腾一的队伍显得空荡荡的。\n但新面孔王侠——一个沉默的女人——加入了。', duration: 4000 },
  { speaker: '张杰', text: '"下一个世界没有怪物。但它比任何怪物都危险。\n因为……死神会用环境本身来杀死你。"', duration: 4500 },
  { speaker: '主神', text: '"下一个世界——\n《死神来了》。\n任务：在因果连锁中存活。"', duration: 3500 },
  { text: '白光消散时，你们坐在一辆疾驰的高速巴士上。\n窗外的世界看似平常——但死亡的征兆已经悄然展开。', duration: 4500 },
  { text: '第五章', type: 'title', duration: 2000 },
  { text: '死 神 绝 境', type: 'subtitle', duration: 2500 },
];

// ═══════════════════════════════════════════════════════════════
// 第六章 · 异形再临
// ═══════════════════════════════════════════════════════════════
const SCENES_CH6 = [
  { text: '第三次回到异形世界。\n但这一次，郑吒以队长身份站在队伍最前方。', duration: 3500 },
  { text: '新人程啸——自称武器专家——\n用一种奇怪的自信感染着周围的人。', duration: 3500 },
  { speaker: '主神', text: '"下一个世界——\n《异形4：浴火重生》。\n实验船上的异形已经进化。\n获取重生十字勋章。"', duration: 4500 },
  { text: '第六章', type: 'title', duration: 2000 },
  { text: '异 形 再 临', type: 'subtitle', duration: 2500 },
];

// ═══════════════════════════════════════════════════════════════
// 第七章 · 恶魔初临 ★全新丰富版
// ═══════════════════════════════════════════════════════════════
const SCENES_CH7 = [
  { text: '从异形世界归来后，主神空间陷入了前所未有的沉默。\n光柱的颜色不再是白色——而是猩红。', duration: 4000 },
  { speaker: '赵樱空', text: '"我感应到了……不对，不是一支队伍。\n是一支恶魔。他们和我们一样来自主神空间。\n但他们……他们是我们的复制体。"', duration: 5000 },
  { text: '恶魔队。主神创造的另一支中洲队。\n拥有一样的能力，一样的记忆——\n但截然不同的信念。', duration: 4500 },
  { speaker: '楚轩', text: '"复制体楚轩的智力与我相当，但他没有人性的约束。\n我们必须假设他已经算到了我们的每一步。"', duration: 5000 },
  { speaker: '主神', text: '"下一个世界——\n《生化危机2》。\n特殊条件：恶魔队已在世界中等候。\n杀死对方队长，或完成主线任务。"', duration: 5000 },
  { text: '浣熊市的街道上尸横遍野。\n远处的爆炸声此起彼伏。\n但最危险的不是丧尸——\n是那些长着你队友脸庞的人。', duration: 5000 },
  { speaker: '郑吒', text: '"面对自己的复制体……\n就像面对镜子里最黑暗的那个自己。\n但这一次，我不会退缩。"', duration: 4500 },
  { text: '第七章', type: 'title', duration: 2500 },
  { text: '恶 魔 初 临', type: 'subtitle', duration: 3000 },
];

// ═══════════════════════════════════════════════════════════════
// 第八章 · 重建中洲 ★全新丰富版
// ═══════════════════════════════════════════════════════════════
const SCENES_CH8 = [
  { text: '恶魔队退走了。但代价是惨重的。\n队伍残缺。士气低迷。\n楚轩的分析只有一个结论：必须变强。', duration: 4500 },
  { speaker: '楚轩', text: '"我计算过了。如果要在最终决战中活下来，\n我们至少需要——复活三个人。\n张恒。赵樱空。程啸。\n以及获得更强的基因锁进化。"', duration: 5500 },
  { text: '主神空间中，楚轩展开了一张庞大的计划图。\n神鬼世界的复活真经。侏罗纪的龙族基因。\n每一步都是赌上性命的豪赌。', duration: 5000 },
  { speaker: '主神', text: '"下一个世界——\n《侏罗纪公园》。\n获取龙族细胞。\n警告：此世界存在远古变异生物。"', duration: 4500 },
  { text: '热带雨林的湿热空气扑面而来。\n远处传来低沉的咆哮声，\n大地在某种巨大生物的脚步下微微震动。\n恐龙的时代，重新降临。', duration: 5000 },
  { speaker: '郑吒', text: '"无论如何，这一次我们的目标不只是活下去——\n而是让中洲队重新完整。\n为了那些已经牺牲的人。"', duration: 4500 },
  { text: '第八章', type: 'title', duration: 2500 },
  { text: '重 建 中 洲', type: 'subtitle', duration: 3000 },
];

// ═══════════════════════════════════════════════════════════════
// 第九章 · 星河远征 ★全新丰富版
// ═══════════════════════════════════════════════════════════════
const SCENES_CH9 = [
  { text: '侏罗纪世界归来。\n霸王复活了。王侠也回来了。\n但罗甘道——没能撑过结算。', duration: 4500 },
  { text: '主神空间里少了一个人。\n那个总是嘻嘻哈哈的人消失了。\n被主神的规则无情地抹消。', duration: 4000 },
  { speaker: '楚轩', text: '"不要为逝者悲伤太久。\n下一个世界的威胁等级——S。\n这是我们第一次面对外星文明级别的敌人。"', duration: 5000 },
  { speaker: '主神', text: '"下一个世界——\n《星河战队》。\n任务：捕获脑虫。\n此任务为五队联合作战前的最终演习。"', duration: 5000 },
  { text: '太空——最终的前沿。\n飞船舷窗外是无尽的星海。\n但虫族的巢穴就在星球表面，\n密密麻麻的虫群等待着入侵者的到来。', duration: 5000 },
  { speaker: '郑吒', text: '"如果我们连虫子都打不过，\n怎么面对天神队？\n打起精神来——这是我们的练兵场。"', duration: 4500 },
  { text: '第九章', type: 'title', duration: 2500 },
  { text: '星 河 远 征', type: 'subtitle', duration: 3000 },
];

// ═══════════════════════════════════════════════════════════════
// 第十章 · 五队大战 ★全新丰富版
// ═══════════════════════════════════════════════════════════════
const SCENES_CH10 = [
  { text: '接下来的任务更加紧迫。\n复活赵樱空、张恒和程啸——\n楚轩的计划终于完成了最关键的一步。', duration: 4500 },
  { text: '但消息传来：五支队伍将在同一个世界正面交锋。\n中洲队。恶魔队。天神队。印洲队。自由联盟。\n这是主神安排的——终极试炼。', duration: 5500 },
  { speaker: '赵樱空', text: '"天神队的队长——亚当。\n传说他已经完成了第四阶基因锁的全部进化。\n我们之中，没有人是他的对手。"', duration: 5000 },
  { speaker: '楚轩', text: '"别担心。我已经有了方案。\n真正危险的不是实力——是信息。\n谁先暴露，谁先死。\n联盟与背叛，将决定一切。"', duration: 5500 },
  { speaker: '主神', text: '"下一个世界——\n《魔戒：护戒远征》。\n五队同场。\n获取至尊之戒者，将获得终极奖励。"', duration: 5000 },
  { text: '中土世界的壮阔风景展开在眼前。\n但五支队伍的旗帜已经在地平线上升起。\n联盟在形成。暗杀在酝酿。\n这是一场真正的——世界大战。', duration: 5500 },
  { speaker: '郑吒', text: '"不管对手有多强……\n我们是中洲队。我们的信念，是活下去。\n不只是我——是所有人，一起活下去。"', duration: 5000 },
  { text: '第十章', type: 'title', duration: 2500 },
  { text: '五 队 大 战', type: 'subtitle', duration: 3000 },
];

// ═══════════════════════════════════════════════════════════════
// 第十一章 · 心魔与终战前奏 ★全新丰富版
// ═══════════════════════════════════════════════════════════════
const SCENES_CH11 = [
  { text: '五队大战的硝烟散去。\n但战争留下的伤痕远比想象中深。\n有些人再也不会回来了。', duration: 4500 },
  { text: '变形金刚的世界。猛鬼街的梦境。天煞的考验。\n连续三个世界，没有喘息的机会。\n主神似乎在刻意加速——\n加速走向最终的结局。', duration: 5500 },
  { speaker: '弗莱迪', text: '"嘿嘿嘿……欢迎来到我的梦境，小英雄们。\n在这里，你最害怕的东西——\n会变成最真实的存在。"', duration: 5000 },
  { text: '猛鬼街的梦境中，每个人都看到了自己的心魔。\n赵樱空看到了孤独的童年。\n楚轩看到了感情的空白。\n而郑吒……', duration: 5000 },
  { speaker: '心魔·郑吒', text: '"你以为你能保护所有人？\n看看那些死去的人。张杰。齐腾一。铭烟薇。\n他们的死——全都是因为你的软弱。"', duration: 5500 },
  { text: '面对自己最深的恐惧，\n郑吒做出了一个所有人都没有预料到的选择——\n他刺穿了自己的心脏。', duration: 4500 },
  { speaker: '郑吒', text: '"我不再恐惧死亡。\n因为比死更可怕的事情，我已经全部经历过了。\n从今以后——\n我不会再让任何队友牺牲。"', duration: 6000 },
  { text: '第四阶基因锁——开启。\n郑吒的瞳孔中燃起了金色的光芒。\n最终决战的号角，已经吹响。', duration: 4500 },
  { text: '第十一章', type: 'title', duration: 2500 },
  { text: '心 魔 终 破', type: 'subtitle', duration: 3000 },
];

// ═══════════════════════════════════════════════════════════════
// 第十二章 · 生化终战 ★全新丰富版
// ═══════════════════════════════════════════════════════════════
const SCENES_CH12 = [
  { text: '一切的起点。\n生化危机——\n郑吒第一次踏入主神世界的地方。\n如今，他将在这里结束一切。', duration: 5000 },
  { text: '中洲队 vs 恶魔队。\n原版 vs 复制体。\n这不仅是实力的对决——\n更是信念的碰撞。', duration: 4500 },
  { speaker: '复制体楚轩', text: '"郑吒，你的善良就是你最大的弱点。\n你不舍得牺牲任何人——\n而我的队伍里，每个人都可以是棋子。"', duration: 5000 },
  { speaker: '楚轩', text: '"他说得没错。但他忘了一件事——\n正是因为不舍得牺牲，\n我们才有了比他更多的王牌。\n最后一个计划——已经启动了。"', duration: 5500 },
  { text: '楚轩的最终计划。\n赵樱空的心灵之光。\n郑吒的洪荒之力。\n三者合一——', duration: 4000 },
  { speaker: '赵樱空', text: '"郑吒……我一直想告诉你——\n不管结局如何，遇见你……\n是我在所有轮回世界中，最幸运的事。"', duration: 5000 },
  { text: '不是所有人都能活着走出去。\n但这就是——无限恐怖。\n在恐惧中寻找勇气。\n在绝望中创造希望。\n在死亡的轮回中——\n书写属于人类的传奇。', duration: 6000 },
  { speaker: '郑吒', text: '"让我们……一起活着回去。\n所有人。一个都不能少。"', duration: 4500 },
  { text: '最终章', type: 'title', duration: 3000 },
  { text: '生 化 终 战', type: 'subtitle', duration: 3500 },
];

// ═══════════════════════════════════════════════════════════════
// 导出函数
// ═══════════════════════════════════════════════════════════════

export function showOpeningCutscene(onFinish) {
  playCutscene(SCENES_CH1, THEME_CH1, onFinish);
}

export function showChapter2Cutscene(onFinish) {
  playCutscene(SCENES_CH2, THEME_CH2, onFinish);
}

export function showChapter3Cutscene(onFinish) {
  playCutscene(SCENES_CH3, THEME_CH3, onFinish);
}

export function showChapter4Cutscene(onFinish) {
  playCutscene(SCENES_CH4, THEME_CH4, onFinish);
}

export function showChapter5Cutscene(onFinish) {
  playCutscene(SCENES_CH5, THEME_CH5, onFinish);
}

export function showChapter6Cutscene(onFinish) {
  playCutscene(SCENES_CH6, THEME_CH6, onFinish);
}

export function showChapter7Cutscene(onFinish) {
  playCutscene(SCENES_CH7, THEME_CH7, onFinish);
}

export function showChapter8Cutscene(onFinish) {
  playCutscene(SCENES_CH8, THEME_CH8, onFinish);
}

export function showChapter9Cutscene(onFinish) {
  playCutscene(SCENES_CH9, THEME_CH9, onFinish);
}

export function showChapter10Cutscene(onFinish) {
  playCutscene(SCENES_CH10, THEME_CH10, onFinish);
}

export function showChapter11Cutscene(onFinish) {
  playCutscene(SCENES_CH11, THEME_CH11, onFinish);
}

export function showChapter12Cutscene(onFinish) {
  playCutscene(SCENES_CH12, THEME_CH12, onFinish);
}
