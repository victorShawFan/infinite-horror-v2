// ═══════════════════════════════════════════════════════════════
// 开场过场动画系统
// ═══════════════════════════════════════════════════════════════

const SCENES = [
  {
    bg: '/assets/scenes/lord_god_space.jpg',
    text: '在那个平凡无奇的夜晚，郑吒只是想看一场午夜电影。',
    duration: 3500,
  },
  {
    bg: '/assets/scenes/lord_god_space.jpg',
    text: '"想不想回到那些惊心动魄的电影世界里去？"\n——这个声音改变了一切。',
    duration: 4000,
  },
  {
    bg: '/assets/scenes/lord_god_space.jpg',
    text: '主神：一个超越理解的存在。\n它将普通人投入由经典恐怖电影构成的轮回世界。\n活下来，获得奖励。死亡，永远消失。',
    duration: 5000,
  },
  {
    bg: '/assets/scenes/1-1_列车醒来_背景.jpg',
    text: '你在一列疾驰的列车上醒来。\n窗外是无尽的黑暗隧道。\n身边是几个同样困惑的陌生人。',
    duration: 4500,
  },
  {
    bg: '/assets/scenes/1-1_列车醒来_背景.jpg',
    speaker: '主神',
    text: '"各位，欢迎来到主神空间。你们即将进入的世界是——\n《生化危机》。"',
    duration: 4000,
  },
  {
    bg: '/assets/scenes/1-1_列车醒来_背景.jpg',
    speaker: '主神',
    text: '任务目标：在蜂巢实验室中生存。\n在暴君苏醒前撤离到列车。\n违反剧情角色规则者，将被主神惩罚。',
    duration: 4500,
  },
  {
    bg: '/assets/scenes/1-2_蜂巢入口_背景.jpg',
    text: '第一章',
    type: 'title',
    duration: 2000,
  },
  {
    bg: '/assets/scenes/1-2_蜂巢入口_背景.jpg',
    text: '名 为 生 化',
    type: 'subtitle',
    duration: 2500,
  },
];

export function showOpeningCutscene(onFinish) {
  const overlay = document.getElementById('ui-overlay');
  let sceneIdx = 0;

  // Escape to skip entire cutscene
  const skipHandler = (e) => {
    if (e.key === 'Escape') {
      document.removeEventListener('keydown', skipHandler);
      overlay.innerHTML = '';
      onFinish();
    }
  };
  document.addEventListener('keydown', skipHandler);
  
  function renderScene() {
    if (sceneIdx >= SCENES.length) {
      document.removeEventListener('keydown', skipHandler);
      overlay.innerHTML = '';
      onFinish();
      return;
    }

    const s = SCENES[sceneIdx];
    const isTitle = s.type === 'title';
    const isSubtitle = s.type === 'subtitle';
    const isSpecial = isTitle || isSubtitle;

    const bgOverlay = isSpecial
      ? 'radial-gradient(ellipse at center, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.9) 100%)'
      : 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.95) 100%)';

    let textHtml = '';
    if (s.speaker) {
      textHtml += '<p style="font-size:14px;color:#ff4444;letter-spacing:4px;margin-bottom:12px;text-shadow:0 0 15px rgba(255,68,68,0.4);">' + s.speaker + '</p>';
    }
    if (isTitle) {
      textHtml += '<p style="font-size:16px;color:#ff4444;letter-spacing:8px;text-shadow:0 0 20px rgba(255,68,68,0.5);">' + s.text + '</p>';
    } else if (isSubtitle) {
      textHtml += '<h1 style="font-size:56px;color:#e0e0e0;letter-spacing:12px;text-shadow:0 0 40px rgba(255,255,255,0.2);font-family:\'ZCOOL QingKe HuangYou\',\'Noto Serif SC\',serif;">' + s.text + '</h1>';
    } else {
      const lines = s.text.replace(/\n/g, '<br>');
      textHtml += '<p style="font-size:20px;color:#d0d0d8;line-height:2;letter-spacing:2px;text-shadow:0 2px 8px rgba(0,0,0,0.8);font-family:\'Noto Serif SC\',serif;">' + lines + '</p>';
    }

    overlay.innerHTML =
      '<div id="cutscene-panel" style="' +
        'position:absolute;top:0;left:0;right:0;bottom:0;' +
        'background:url(\'' + s.bg + '\') center/cover no-repeat;' +
        'display:flex;flex-direction:column;align-items:center;justify-content:center;' +
        'animation:cutsceneFadeIn 0.8s ease;cursor:pointer;">' +
        '<div style="position:absolute;top:0;left:0;right:0;bottom:0;background:' + bgOverlay + ';"></div>' +
        '<div style="position:relative;z-index:1;max-width:700px;padding:0 40px;text-align:center;">' +
          textHtml +
        '</div>' +
        '<p style="position:absolute;bottom:30px;font-size:12px;color:rgba(255,255,255,0.3);letter-spacing:2px;z-index:1;">点击继续</p>' +
      '</div>' +
      '<style>@keyframes cutsceneFadeIn{from{opacity:0}to{opacity:1}}</style>';

    const panel = document.getElementById('cutscene-panel');
    let advanced = false;
    const advance = () => {
      if (advanced) return;
      advanced = true;
      sceneIdx++;
      renderScene();
    };
    panel.addEventListener('click', advance);
    setTimeout(() => advance(), s.duration);
  }

  renderScene();
}


const SCENES_CH2 = [
  {
    bg: '/assets/scenes/lord_god_space.jpg',
    text: '主神空间的十天转瞬即逝。\n白色光柱再次降临。',
    duration: 3500,
  },
  {
    bg: '/assets/scenes/lord_god_space.jpg',
    speaker: '主神',
    text: '"下一个世界——\n《异形》。"',
    duration: 3000,
  },
  {
    bg: '/assets/scenes/lord_god_space.jpg',
    text: '你注意到队伍中多了几张新面孔。\n一个戴眼镜的男人正在计算什么——楚轩。\n一个冷峻的狙击手站在角落——零点。',
    duration: 4500,
  },
  {
    bg: '/assets/scenes/lord_god_space.jpg',
    text: '光柱将你们投射到了一艘巨大的太空飞船内部。\n空气中弥漫着金属和机油的味道。\n某处传来金属刮擦的声音。',
    duration: 4500,
  },
  {
    bg: '/assets/scenes/lord_god_space.jpg',
    speaker: '主神',
    text: '任务目标：在LV-426轨道的"苏拉科"号上生存。\n消灭异形皇后。\n在飞船自毁前撤离。',
    duration: 4500,
  },
  {
    bg: '/assets/scenes/lord_god_space.jpg',
    text: '第二章',
    type: 'title',
    duration: 2000,
  },
  {
    bg: '/assets/scenes/lord_god_space.jpg',
    text: '异 形 杀 戮',
    type: 'subtitle',
    duration: 2500,
  },
];

export function showChapter2Cutscene(onFinish) {
  const overlay = document.getElementById('ui-overlay');
  let sceneIdx = 0;

  const skipHandler = (e) => {
    if (e.key === 'Escape') {
      document.removeEventListener('keydown', skipHandler);
      overlay.innerHTML = '';
      onFinish();
    }
  };
  document.addEventListener('keydown', skipHandler);

  function renderScene() {
    if (sceneIdx >= SCENES_CH2.length) {
      document.removeEventListener('keydown', skipHandler);
      overlay.innerHTML = '';
      onFinish();
      return;
    }

    const s = SCENES_CH2[sceneIdx];
    const isTitle = s.type === 'title';
    const isSubtitle = s.type === 'subtitle';
    const bgOverlay = (isTitle || isSubtitle)
      ? 'radial-gradient(ellipse at center, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.9) 100%)'
      : 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.95) 100%)';

    let textHtml = '';
    if (s.speaker) {
      textHtml += '<p style="font-size:14px;color:#ff4444;letter-spacing:4px;margin-bottom:12px;">' + s.speaker + '</p>';
    }
    if (isTitle) {
      textHtml += '<p style="font-size:16px;color:#4488ff;letter-spacing:8px;">' + s.text + '</p>';
    } else if (isSubtitle) {
      textHtml += '<h1 style="font-size:56px;color:#e0e0e0;letter-spacing:12px;font-family:serif;">' + s.text + '</h1>';
    } else {
      textHtml += '<p style="font-size:20px;color:#d0d0d8;line-height:2;letter-spacing:2px;font-family:serif;">' + s.text.replace(/\n/g, '<br>') + '</p>';
    }

    overlay.innerHTML = `
      <div id="cutscene-panel" style="
        position:absolute;top:0;left:0;right:0;bottom:0;
        background:url('${s.bg}') center/cover no-repeat;
        display:flex;flex-direction:column;align-items:center;justify-content:center;
        animation:cutsceneFadeIn 0.8s ease;cursor:pointer;">
        <div style="position:absolute;top:0;left:0;right:0;bottom:0;background:${bgOverlay};"></div>
        <div style="position:relative;z-index:1;max-width:700px;padding:0 40px;text-align:center;">
          ${textHtml}
        </div>
        <p style="position:absolute;bottom:30px;font-size:12px;color:rgba(255,255,255,0.3);letter-spacing:2px;z-index:1;">点击继续 · Esc跳过</p>
      </div>
      <style>@keyframes cutsceneFadeIn{from{opacity:0}to{opacity:1}}</style>
    `;

    const panel = document.getElementById('cutscene-panel');
    let advanced = false;
    const advance = () => {
      if (advanced) return;
      advanced = true;
      sceneIdx++;
      renderScene();
    };
    panel.addEventListener('click', advance);
    setTimeout(() => advance(), s.duration);
  }

  renderScene();
}

// ═══ 第三章 过场：主神空间→咒怨世界 ═══
const SCENES_CH3 = [
  {
    bg: '/assets/scenes/lord_god_space.jpg',
    text: '又是十天。\n主神空间里的时光平静得像暴风雨前的海面。',
    duration: 3500,
  },
  {
    bg: '/assets/scenes/lord_god_space.jpg',
    text: '队伍变得更大了。\n赵樱空、齐腾一、铭烟薇……还有一些不太愿意自我介绍的新人。',
    duration: 4000,
  },
  {
    bg: '/assets/scenes/lord_god_space.jpg',
    speaker: '楚轩',
    text: '"根据我的分析，下一个世界的威胁等级将大幅提升。\n物理手段可能不再有效。请做好准备。"',
    duration: 4500,
  },
  {
    bg: '/assets/scenes/lord_god_space.jpg',
    speaker: '主神',
    text: '"下一个世界——\n《咒怨》。"',
    duration: 3000,
  },
  {
    bg: '/assets/scenes/lord_god_space.jpg',
    text: '白光消散时，你站在一条阴暗的日本住宅街上。\n空气中弥漫着潮湿、陈旧的气息。\n远处，一栋老旧的日式宅邸静静矗立着。',
    duration: 4500,
  },
  {
    bg: '/assets/scenes/lord_god_space.jpg',
    speaker: '主神',
    text: '任务目标：在伽椰子的诅咒中存活七天。\n找到破解诅咒的方法。\n封印或压制伽椰子的怨念。',
    duration: 4500,
  },
  {
    bg: '/assets/scenes/lord_god_space.jpg',
    text: '第三章',
    type: 'title',
    duration: 2000,
  },
  {
    bg: '/assets/scenes/lord_god_space.jpg',
    text: '咒 怨 阴 影',
    type: 'subtitle',
    duration: 2500,
  },
];

export function showChapter3Cutscene(onFinish) {
  const overlay = document.getElementById('ui-overlay');
  let sceneIdx = 0;

  const skipHandler = (e) => {
    if (e.key === 'Escape') {
      document.removeEventListener('keydown', skipHandler);
      overlay.innerHTML = '';
      onFinish();
    }
  };
  document.addEventListener('keydown', skipHandler);

  function renderScene() {
    if (sceneIdx >= SCENES_CH3.length) {
      document.removeEventListener('keydown', skipHandler);
      overlay.innerHTML = '';
      onFinish();
      return;
    }

    const s = SCENES_CH3[sceneIdx];
    const isTitle = s.type === 'title';
    const isSubtitle = s.type === 'subtitle';
    const bgOverlay = (isTitle || isSubtitle)
      ? 'radial-gradient(ellipse at center, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.9) 100%)'
      : 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.95) 100%)';

    overlay.innerHTML = `
      <div style="
        width: 100%; height: 100%;
        background-image: ${bgOverlay};
        background-size: cover;
        display: flex; align-items: ${isTitle || isSubtitle ? 'center' : 'flex-end'};
        justify-content: center;
        animation: fadeIn 0.8s ease;
      ">
        <div style="
          ${isTitle ? 'font-size: 56px; letter-spacing: 12px; color: #e0d8f0; text-shadow: 0 0 30px rgba(128, 80, 200, 0.6);' : ''}
          ${isSubtitle ? 'font-size: 36px; letter-spacing: 20px; color: #ccaaee; text-shadow: 0 0 20px rgba(128, 80, 200, 0.4);' : ''}
          ${!isTitle && !isSubtitle ? `
            max-width: 700px; padding: 30px 40px; margin-bottom: 60px;
            background: rgba(0, 0, 0, 0.6); border-radius: 12px;
            border-left: 3px solid rgba(128, 80, 200, 0.5);
          ` : ''}
          font-family: "Microsoft YaHei", sans-serif;
        ">
          ${s.speaker ? `<p style="color: #ccaaee; font-size: 14px; margin-bottom: 8px; letter-spacing: 2px;">${s.speaker}</p>` : ''}
          ${!isTitle && !isSubtitle ? `<p style="color: #e8e8f0; font-size: 18px; line-height: 1.8; white-space: pre-line;">${s.text}</p>` : s.text}
        </div>
      </div>
      <style>@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }</style>
    `;
  }

  function advance() {
    sceneIdx++;
    renderScene();
    if (sceneIdx < SCENES_CH3.length) {
      setTimeout(() => advance(), SCENES_CH3[sceneIdx]?.duration || 3000);
    }
  }

  renderScene();
  if (SCENES_CH3.length > 0) {
    setTimeout(() => advance(), SCENES_CH3[0].duration);
  }
}

// ═══ 第四章 过场：主神空间→神鬼传奇世界 ═══
const SCENES_CH4 = [
  {
    bg: '/assets/scenes/lord_god_space.jpg',
    text: '十天整备期结束了。\n主神空间的光柱再次笼罩所有人。',
    duration: 3500,
  },
  {
    bg: '/assets/scenes/lord_god_space.jpg',
    text: '这一次队伍更大了。张恒——一个眼神锐利的青年。\n萧宏律——一个看似普通却出人意料的胖子。',
    duration: 4000,
  },
  {
    bg: '/assets/scenes/lord_god_space.jpg',
    speaker: '赵樱空',
    text: '"我感应到了。这次不只是怪物——\n另一支主神队伍也会进入同一个世界。"',
    duration: 4000,
  },
  {
    bg: '/assets/scenes/lord_god_space.jpg',
    speaker: '主神',
    text: '"下一个世界——\n《神鬼传奇》。\n特殊任务：取得复活真经。\n警告：印洲队将争夺同一目标。"',
    duration: 4500,
  },
  {
    bg: '/assets/scenes/lord_god_space.jpg',
    text: '灼热的光芒消散后，滚烫的沙漠热浪扑面而来。\n远处是无尽的黄沙，以及一支缓缓前行的骆驼商队。\n哈姆纳塔——死亡之城。',
    duration: 4500,
  },
  {
    bg: '/assets/scenes/lord_god_space.jpg',
    text: '第四章',
    type: 'title',
    duration: 2000,
  },
  {
    bg: '/assets/scenes/lord_god_space.jpg',
    text: '神 鬼 秘 宝',
    type: 'subtitle',
    duration: 2500,
  },
];

export function showChapter4Cutscene(onFinish) {
  const overlay = document.getElementById('ui-overlay');
  let sceneIdx = 0;

  const skipHandler = (e) => {
    if (e.key === 'Escape') {
      document.removeEventListener('keydown', skipHandler);
      overlay.innerHTML = '';
      onFinish();
    }
  };
  document.addEventListener('keydown', skipHandler);

  function renderScene() {
    if (sceneIdx >= SCENES_CH4.length) {
      document.removeEventListener('keydown', skipHandler);
      overlay.innerHTML = '';
      onFinish();
      return;
    }

    const s = SCENES_CH4[sceneIdx];
    const isTitle = s.type === 'title';
    const isSubtitle = s.type === 'subtitle';
    const bgOverlay = (isTitle || isSubtitle)
      ? 'radial-gradient(ellipse at center, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.9) 100%)'
      : 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.95) 100%)';

    overlay.innerHTML = `
      <div style="
        width: 100%; height: 100%;
        background-image: ${bgOverlay};
        background-size: cover;
        display: flex; align-items: ${isTitle || isSubtitle ? 'center' : 'flex-end'};
        justify-content: center;
        animation: fadeIn 0.8s ease;
      ">
        <div style="
          ${isTitle ? 'font-size: 56px; letter-spacing: 12px; color: #f0d888; text-shadow: 0 0 30px rgba(200, 160, 40, 0.6);' : ''}
          ${isSubtitle ? 'font-size: 36px; letter-spacing: 20px; color: #ddbb66; text-shadow: 0 0 20px rgba(200, 160, 40, 0.4);' : ''}
          ${!isTitle && !isSubtitle ? `
            max-width: 700px; padding: 30px 40px; margin-bottom: 60px;
            background: rgba(0, 0, 0, 0.6); border-radius: 12px;
            border-left: 3px solid rgba(200, 160, 40, 0.5);
          ` : ''}
          font-family: "Microsoft YaHei", sans-serif;
        ">
          ${s.speaker ? `<p style="color: #ddbb66; font-size: 14px; margin-bottom: 8px; letter-spacing: 2px;">${s.speaker}</p>` : ''}
          ${!isTitle && !isSubtitle ? `<p style="color: #e8e0d0; font-size: 18px; line-height: 1.8; white-space: pre-line;">${s.text}</p>` : s.text}
        </div>
      </div>
      <style>@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }</style>
    `;
  }

  function advance() {
    sceneIdx++;
    renderScene();
    if (sceneIdx < SCENES_CH4.length) {
      setTimeout(() => advance(), SCENES_CH4[sceneIdx]?.duration || 3000);
    }
  }

  renderScene();
  if (SCENES_CH4.length > 0) {
    setTimeout(() => advance(), SCENES_CH4[0].duration);
  }
}
