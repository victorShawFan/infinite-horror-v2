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

  function renderScene() {
    if (sceneIdx >= SCENES.length) {
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
