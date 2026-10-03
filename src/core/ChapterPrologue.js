// ═══════════════════════════════════════════════════════════════
// 章节序章系统 — 以小说式的叙事拉开每章帷幕
// ═══════════════════════════════════════════════════════════════
//
// 每章开始前展示一段沉浸式的文字叙述，配以逐字显示和氛围音效
// 参考原著《无限恐怖》各关卡的开场描写
// ═══════════════════════════════════════════════════════════════

import { eventBus } from './EventBus.js';
import { audioEngine } from './AudioEngine.js';

const PROLOGUES = {
  1: {
    title: '第一章·生化蜂巢',
    subtitle: '── 异形 ──',
    lines: [
      '白光消退的瞬间，郑吒感到一阵剧烈的眩晕。',
      '空气中弥漫着金属与硫磺的气味。四周是冰冷的钢铁走廊，头顶的应急灯明灭不定。',
      '「欢迎来到主神空间的第一次试炼。」',
      '一个没有感情的声音在脑海中响起——',
      '「任务：在蜂巢实验室中生存。时限：72小时。」',
      '远处传来金属撞击声和某种生物的嘶嘶声。郑吒紧握双拳，这一刻，他还不知道自己即将面对的是怎样的恐怖……',
    ],
    bgColor: '#0a0808',
    textColor: '#cc8866',
    quoteColor: '#ff6644',
  },
  2: {
    title: '第二章·异形飞船',
    subtitle: '── 太空中无人能听到你的尖叫 ──',
    lines: [
      '飞船的引擎低沉地轰鸣着，整个船体在微微震动。',
      '郑吒睁开眼时，发现自己身处LV-426星球轨道上的殖民飞船「苏拉科号」。',
      '墙壁上的酸蚀痕迹说明了一切——异形已经在这里筑巢。',
      '楚轩推了推眼镜，冷静地分析：「根据飞船结构图，巢穴应该在C层以下。我们需要从上往下清扫。」',
      '零点已经架好了狙击枪，透过瞄准镜观察着黑暗的通风管道。',
      '「动了。」他低声说。',
    ],
    bgColor: '#050810',
    textColor: '#88aacc',
    quoteColor: '#44ff88',
  },
  3: {
    title: '第三章·咒怨',
    subtitle: '── 诅咒不会因为不信而消失 ──',
    lines: [
      '东京，下午三点。阳光明媚得像是什么坏事都不会发生。',
      '但当郑吒踏入那栋公寓的瞬间，温度骤降了十度。',
      '楼梯间的灯泡啪地碎了一个。黑暗中，有什么东西在移动。',
      '「不要回头。」詹岚的声音在精神链接中传来，带着微微的颤抖，「她……就在你身后。」',
      '郑吒感觉到了。脖子后面冰凉的气息。一根根冰冷手指正在慢慢贴上他的脊背。',
      '他深吸一口气，打开了基因锁。',
    ],
    bgColor: '#080808',
    textColor: '#999999',
    quoteColor: '#666688',
  },
  4: {
    title: '第四章·神鬼秘宝',
    subtitle: '── 古老的诅咒从未消散 ──',
    lines: [
      '撒哈拉沙漠的烈日下，古墓入口像一个巨大的深渊，吞噬着所有的光线。',
      '金字塔内部的空气干燥而闷热，带着千年不散的香料气味。',
      '壁画上的法老们面无表情地注视着每一个入侵者。',
      '「伊莫顿就在最深处。」齐腾一翻译着象形文字，「这里写着——亵渎者必受永恒的诅咒。」',
      '赵樱空的手已经摸上了腰间的短刀：「那就让他知道什么叫现代人的力量。」',
    ],
    bgColor: '#100a04',
    textColor: '#ccaa66',
    quoteColor: '#ffcc44',
  },
  5: {
    title: '第五章·死神来了',
    subtitle: '── 命运的齿轮不可阻挡 ──',
    lines: [
      '「你们即将进入的世界有一个特殊规则——」主神的声音不带任何温度。',
      '「死神的名单上写着你们每个人的名字。唯一的存活方式，是让别人替你们死。」',
      '张杰沉默了很久，然后看向郑吒：「记住，郑吒，有些事情必须由你来做决定。」',
      '这是张杰第一次叫他的名字而不是"小子"。郑吒隐约感觉到，这句话背后藏着告别的意味。',
      '窗外的天空变成了血红色。死神的游戏，开始了。',
    ],
    bgColor: '#0a0404',
    textColor: '#cc6666',
    quoteColor: '#ff4444',
  },
  6: {
    title: '第六章·异形再临',
    subtitle: '── 更强大，更恐怖 ──',
    lines: [
      '没有人想再回到这个地方。',
      '但主神不在乎你的意愿。当白光再次消散，熟悉的酸蚀走廊再次出现在眼前。',
      '只是这一次，异形们……进化了。',
      '「新型异形的外骨骼更厚，酸血浓度更高。」楚轩的分析一如既往地冷静，「但最大的问题不是异形。」',
      '他指了指雷达上的另一组信号：「是它们——另一支轮回队。」',
      '郑吒握紧了拳头。作为新任队长，这是他第一次面对人类之间的生死较量。',
    ],
    bgColor: '#040810',
    textColor: '#88ccaa',
    quoteColor: '#44ff88',
  },
  7: {
    title: '第七章·恶魔初临',
    subtitle: '── 地狱空了，恶魔在人间 ──',
    lines: [
      '他们说地狱是没有的。',
      '但当恶魔队出现的那一刻，所有人都知道——地狱确实存在，只是换了一种形式。',
      '复制体郑吒站在废墟之上，脸上挂着和郑吒一模一样的表情，却透着完全不同的冰冷。',
      '「终于见面了，原版。」他说，声音和郑吒分毫不差。',
      '中洲队的成员们一个接一个倒下。这不是战斗，这是屠杀。',
      '直到最后一刻，詹岚将重生十字勋章按在了郑吒胸口——',
      '「活下去。把我们都带回来。」',
    ],
    bgColor: '#0a0404',
    textColor: '#cc8888',
    quoteColor: '#ff6644',
  },
  8: {
    title: '第八章·重建中洲',
    subtitle: '── 一个人的军团 ──',
    lines: [
      '只剩下一个人了。',
      '郑吒站在主神空间的中央大厅，看着身旁空荡荡的二十扇门。',
      '手里握着复活真经。心里装着一个计划——楚轩生前留下的最后一个计划。',
      '「先复活楚轩。有了军师，才有可能复活其他人。」',
      '他走向光球，将复活真经插入兑换槽。',
      '金色的光芒中，一个戴眼镜的身影渐渐凝聚成形——',
      '「你花了多久？」楚轩睁开眼睛，第一句话就是这个。',
      '「三个世界。」郑吒微笑，「欢迎回来，军师。」',
    ],
    bgColor: '#080808',
    textColor: '#bbbbcc',
    quoteColor: '#ffcc44',
  },
  9: {
    title: '第九章·星河远征',
    subtitle: '── 虫族与星辰 ──',
    lines: [
      '「星河战队」。一个人类在星际尺度上对抗虫族的世界。',
      '郑吒带着复活归来的楚轩、霸王和王侠，踏上了一场注定充满风险的远征。',
      '楚轩看着外太空中铺天盖地的脑虫战舰，推了推眼镜：',
      '「好消息是，我已经算出了它们的弱点。」',
      '「坏消息呢？」郑吒问。',
      '「坏消息是，需要有人冲进母舰核心，和脑虫面对面。」',
      '霸王扛起了他的重型武器：「那还等什么？」',
    ],
    bgColor: '#040408',
    textColor: '#8888cc',
    quoteColor: '#44aaff',
  },
  10: {
    title: '第十章·五队大战',
    subtitle: '── 魔戒世界，轮回者的终极试炼 ──',
    lines: [
      '中土世界。魔戒的故事正在上演。',
      '但对轮回者来说，真正的敌人不是索伦——而是其他四支轮回队。',
      '天神队。恶魔队。东洋队。迷雾队。再加上重建后的中洲队。',
      '五支队伍，五种战术理念，一场没有退路的大混战。',
      '楚轩展开了他画满标注的地图：「战争的关键不在于我们能打败多少队，而在于我们能团结多少人。」',
      '郑吒看着地图上密密麻麻的标记，做出了决定：',
      '「我们不是来打仗的。我们是来回家的。」',
    ],
    bgColor: '#060804',
    textColor: '#aacc88',
    quoteColor: '#88ff44',
  },
  11: {
    title: '第十一章·心魔与终战前奏',
    subtitle: '── 最强大的敌人，是自己 ──',
    lines: [
      '在梦境深处，郑吒面对的不是任何外部敌人。',
      '镜中的另一个自己，眼中没有任何情感，却拥有和他一样强大的力量。',
      '「你一直在逃避。」心魔说，「逃避自己内心最黑暗的那个部分。」',
      '郑吒闭上眼睛。脑海中闪过无数画面——牺牲的队友、无法挽回的遗憾、永远不会愈合的伤痕。',
      '「但正是因为这些伤痕，」他睁开双眼，声音平静而坚定——',
      '「我才成为了现在的我。」',
      '心魔碎裂的瞬间，基因锁第四阶的光芒照亮了整个空间。',
    ],
    bgColor: '#080408',
    textColor: '#cc88cc',
    quoteColor: '#ff88ff',
  },
  12: {
    title: '第十二章·终局',
    subtitle: '── 这是我们的故事 ──',
    lines: [
      '「最终一战。」主神的声音第一次有了一丝波动。',
      '「消灭主神空间的创造者——或者，被永远困在轮回中。」',
      '中洲队全员集结。每个人的眼中都燃烧着不同的光芒，但指向同一个方向。',
      '楚轩计算了所有可能的结局。霸王清点了所有弹药。零点校准了瞄准镜。赵樱空磨亮了短刀。',
      '郑吒站在队伍最前面，回头看了一眼身后的同伴们。',
      '「不管结果如何——能和你们一起战斗，是我这辈子最庆幸的事。」',
      '「我们走。」',
      '',
      '最终之门缓缓开启。门后，是无尽的光。',
    ],
    bgColor: '#060406',
    textColor: '#cccccc',
    quoteColor: '#ffcc44',
  },
};

/**
 * 显示章节序章
 * @param {number} chapter - 章节号
 * @param {Function} onComplete - 完成回调
 */
export function showChapterPrologue(chapter, onComplete) {
  const prologue = PROLOGUES[chapter];
  if (!prologue) { if (onComplete) onComplete(); return; }
  
  // Node.js test environment
  if (typeof document === 'undefined') { if (onComplete) onComplete(); return; }
  
  const overlay = document.createElement('div');
  overlay.id = 'chapter-prologue';
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 300;
    background: ${prologue.bgColor || '#000'};
    display: flex; align-items: center; justify-content: center;
    opacity: 0; transition: opacity 0.8s;
  `;
  
  const content = document.createElement('div');
  content.style.cssText = `
    max-width: 600px; width: 90%; padding: 40px 30px; text-align: center;
  `;
  
  // Title
  content.innerHTML = `
    <h1 style="
      color: ${prologue.textColor}; font-size: 24px; letter-spacing: 8px;
      margin-bottom: 4px; opacity: 0;
      animation: prologue-fade-in 1.2s ease forwards 0.5s;
    ">${prologue.title}</h1>
    <p style="
      color: ${prologue.quoteColor}55; font-size: 12px; letter-spacing: 4px;
      margin-bottom: 32px; opacity: 0;
      animation: prologue-fade-in 1.2s ease forwards 0.8s;
    ">${prologue.subtitle}</p>
    <div id="prologue-text" style="
      color: ${prologue.textColor}; font-size: 14px; line-height: 2.2;
      text-align: left; min-height: 200px;
    "></div>
    <p id="prologue-skip" style="
      color: #444; font-size: 10px; letter-spacing: 3px;
      margin-top: 32px; opacity: 0;
      animation: prologue-fade-in 1s ease forwards 3s;
      cursor: pointer;
    ">按任意键或点击继续</p>
    <style>
      @keyframes prologue-fade-in {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes prologue-char {
        from { opacity: 0; }
        to { opacity: 1; }
      }
    </style>
  `;
  
  overlay.appendChild(content);
  document.body.appendChild(overlay);
  
  // Fade in
  requestAnimationFrame(() => { overlay.style.opacity = '1'; });
  
  // Typewriter effect
  const textContainer = content.querySelector('#prologue-text');
  let lineIdx = 0;
  let charIdx = 0;
  let currentSpan = null;
  let typeTimer = null;
  let allDone = false;
  
  function typeNextChar() {
    if (lineIdx >= prologue.lines.length) {
      allDone = true;
      return;
    }
    
    const line = prologue.lines[lineIdx];
    
    if (charIdx === 0) {
      const p = document.createElement('p');
      const isQuote = line.startsWith('「') || line.startsWith('"');
      p.style.cssText = `
        color: ${isQuote ? prologue.quoteColor : prologue.textColor};
        margin-bottom: 8px; font-size: ${isQuote ? '13px' : '14px'};
        ${isQuote ? 'font-style: italic;' : ''}
        ${line === '' ? 'height: 16px;' : ''}
      `;
      currentSpan = p;
      textContainer.appendChild(p);
    }
    
    if (charIdx < line.length) {
      currentSpan.textContent += line[charIdx];
      charIdx++;
      typeTimer = setTimeout(typeNextChar, 40 + Math.random() * 20);
    } else {
      lineIdx++;
      charIdx = 0;
      typeTimer = setTimeout(typeNextChar, 300);
    }
  }
  
  // Start typing after title animation
  setTimeout(typeNextChar, 1200);
  
  // Skip / continue
  const finish = () => {
    if (typeTimer) clearTimeout(typeTimer);
    if (!allDone) {
      // Show all text immediately
      textContainer.innerHTML = '';
      for (const line of prologue.lines) {
        const p = document.createElement('p');
        const isQuote = line.startsWith('「') || line.startsWith('"');
        p.style.cssText = `
          color: ${isQuote ? prologue.quoteColor : prologue.textColor};
          margin-bottom: 8px; font-size: ${isQuote ? '13px' : '14px'};
          ${isQuote ? 'font-style: italic;' : ''}
          ${line === '' ? 'height: 16px;' : ''}
        `;
        p.textContent = line;
        textContainer.appendChild(p);
      }
      allDone = true;
      return;
    }
    
    // Fade out and remove
    overlay.style.opacity = '0';
    document.removeEventListener('keydown', keyHandler);
    setTimeout(() => {
      overlay.remove();
      if (onComplete) onComplete();
    }, 800);
  };
  
  const keyHandler = (e) => { finish(); };
  overlay.addEventListener('click', finish);
  document.addEventListener('keydown', keyHandler);
}

export { PROLOGUES };
