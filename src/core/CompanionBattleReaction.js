// ═══════════════════════════════════════════════════════════════
// 同伴战后反应系统 — 队友对战斗表现的即时评价
// ═══════════════════════════════════════════════════════════════
//
// 在重要战斗后（Boss击杀、险胜、连杀、首次使用新技能等）
// 随机选择一名存活同伴发表评价，增强队伍感和叙事性
// 同伴台词根据角色性格定制

import { gameState } from './GameState.js';
import { eventBus } from './EventBus.js';

// ── 同伴台词库 ──
const COMPANION_LINES = {
  // 楚轩 — 冷静理性
  chu_xuan: {
    boss_victory: [
      '「正如计算的那样。下次如果按我的布阵来，伤亡可以再少37%。」',
      '「不错的表现。但还有优化空间。」',
      '「战斗数据已记录。你的成长速度超出了我的预测模型。」',
    ],
    close_call: [
      '「太冒险了。下次听我的，先观察再行动。」',
      '「这种险胜不可持续。我们需要更完善的计划。」',
      '「概率论告诉我，你不该活着。好在现实不只有数字。」',
    ],
    high_rating: [
      '「完美的战术执行。这次的数据值得存档分析。」',
      '「效率惊人。你开始理解"在必要时果断出手"的含义了。」',
    ],
    quick_kill: [
      '「速战速决，这是正确的选择。」',
      '「时间是最稀缺的资源。你用得很好。」',
    ],
  },
  
  // 零点 — 沉默寡言的狙击手
  ling_dian: {
    boss_victory: [
      '「……不错。」',
      '「目标消灭。」',
      '「做得好，队长。」',
    ],
    close_call: [
      '「……太危险了。」',
      '「下次我会找更好的掩护位置。」',
    ],
    high_rating: [
      '「精准。像一颗完美的子弹。」',
      '「……很干净利落。」',
    ],
    quick_kill: [
      '「够快。」',
      '「一击必杀才是最好的。」',
    ],
  },
  
  // 张杰 — 坚毅的队长
  zhang_jie: {
    boss_victory: [
      '「大家做得很好！这就是中洲队的力量。」',
      '「只要团结一心，就没有过不去的关。」',
      '「记住这份勇气。它会在未来帮助你。」',
    ],
    close_call: [
      '「只要活着，就是胜利。记住了，活着比什么都重要。」',
      '「太险了……但你做到了。」',
    ],
    high_rating: [
      '「出色的表现！这就是我看好你的原因，郑吒。」',
      '「你已经不再是那个怯懦的少年了。」',
    ],
    quick_kill: [
      '「干净利落！继续保持！」',
      '「效率很高，省下的时间可以让大家休整。」',
    ],
  },
  
  // 詹岚 — 温柔关切
  zhan_lan: {
    boss_victory: [
      '「太好了……你没受伤吧？」',
      '「赢了！我就知道你可以的。」',
    ],
    close_call: [
      '「吓死我了……你再这样冒险我真的会生气的。」',
      '「别再这样了，好吗？大家都很担心你。」',
    ],
    high_rating: [
      '「哇……你变强了好多。」',
      '「这么厉害，让人有点不敢相认呢。」',
    ],
    quick_kill: [
      '「好快！你们男生打架都这么利索吗？」',
    ],
  },
  
  // 赵樱空 — 冷淡暗杀者
  zhao_yingkong: {
    boss_victory: [
      '「……结束了。」',
      '「杀意……已经消退。」',
      '「你变强了。不再需要我保护了。」',
    ],
    close_call: [
      '「危险……你的杀气太弱了。」',
      '「生与死之间，你选择了活。这很好。」',
    ],
    high_rating: [
      '「锋利得像一把刀。……像我的刀。」',
      '「你的眼神变了。更加……冷酷了。」',
    ],
    quick_kill: [
      '「干脆。」',
      '「一刀致命。这是最仁慈的方式。」',
    ],
  },
  
  // 霸王 — 直率热血
  ba_wang: {
    boss_victory: [
      '「哈哈！痛快！再来十个也不怕！」',
      '「这就是中洲队的实力！让那些家伙见识见识！」',
    ],
    close_call: [
      '「呸！差点就……嘿嘿，还是赢了！」',
      '「险胜也是胜！男人就得有这股狠劲！」',
    ],
    high_rating: [
      '「漂亮！我就知道跟着你没错！」',
      '「好家伙，你这一手太帅了！」',
    ],
    quick_kill: [
      '「秒了！连热身都不够！」',
      '「太快了吧？我还没开始享受呢！」',
    ],
  },
  
  // 程啸 — 幽默医生
  cheng_xiao: {
    boss_victory: [
      '「赢了赢了！呼……可以收摊了。诶等等，你身上有伤让我看看。」',
      '「Boss倒了！作为队医，我表示——终于不用再缝伤口了。」',
    ],
    close_call: [
      '「你的HP刚才跟我的心跳一样低。拜托下次别这样了。」',
      '「作为医生，我建议你——少打这种仗。」',
    ],
    high_rating: [
      '「完美手术——哦不对，完美战斗！」',
      '「这效率比我缝伤口还快。」',
    ],
    quick_kill: [
      '「还没来得及准备急救包就结束了？」',
    ],
  },
  
  // 王侠 — 爆裂狂人
  wang_xia: {
    boss_victory: [
      '「轰！漂亮的爆炸！——等等那是你打的不是我。」',
      '「干得好！下次试试我的C4，效果更震撼。」',
    ],
    close_call: [
      '「差点就要上大炸弹了。还好你扛住了。」',
    ],
    high_rating: [
      '「这伤害输出，堪比我的TNT！」',
    ],
    quick_kill: [
      '「比炸弹还快！佩服佩服。」',
    ],
  },
};

/**
 * 判断是否需要触发同伴反应
 */
function _shouldTrigger(result, rating) {
  if (!result.victory) return false;
  // Boss战必触发
  if (result._isBoss) return true;
  // 高评级触发
  if (rating && (rating.grade === 'S' || rating.grade === 'SS')) return true;
  // 险胜触发
  if (gameState.player.hp < gameState.player.maxHp * 0.15) return true;
  // 快速击杀（3回合内）
  if (result.rounds <= 3) return true;
  // 普通战斗 20% 概率
  return Math.random() < 0.2;
}

/**
 * 选择反应类型
 */
function _getReactionType(result, rating) {
  if (result._isBoss) return 'boss_victory';
  if (gameState.player.hp < gameState.player.maxHp * 0.2) return 'close_call';
  if (rating && (rating.grade === 'S' || rating.grade === 'SS')) return 'high_rating';
  if (result.rounds <= 3) return 'quick_kill';
  return 'boss_victory'; // fallback
}

/**
 * 选择一名存活同伴并返回台词
 */
export function getCompanionReaction(result, rating) {
  if (!_shouldTrigger(result, rating)) return null;
  
  const companions = (gameState.companions || []).filter(c => c.alive);
  if (companions.length === 0) return null;
  
  const reactionType = _getReactionType(result, rating);
  
  // 随机选一名有台词的同伴
  const candidates = companions.filter(c => {
    const lines = COMPANION_LINES[c.id];
    return lines && lines[reactionType] && lines[reactionType].length > 0;
  });
  
  if (candidates.length === 0) return null;
  
  const chosen = candidates[Math.floor(Math.random() * candidates.length)];
  const lines = COMPANION_LINES[chosen.id][reactionType];
  const line = lines[Math.floor(Math.random() * lines.length)];
  
  return {
    companionId: chosen.id,
    companionName: chosen.name,
    line,
    reactionType,
  };
}

/**
 * 渲染同伴反应气泡
 */
export function showCompanionReaction(reaction) {
  if (!reaction) return;
  
  const bubble = document.createElement('div');
  bubble.id = 'companion-reaction';
  bubble.style.cssText = 'position:fixed;bottom:100px;left:50%;transform:translateX(-50%);z-index:180;' +
    'background:rgba(10,15,30,0.92);border:1px solid #44aaff40;border-radius:12px;' +
    'padding:12px 20px;max-width:400px;text-align:center;' +
    'box-shadow:0 4px 20px rgba(0,0,0,0.4);' +
    'animation:bubbleIn 0.4s ease-out;';
  
  bubble.innerHTML = `
    <p style="color:#44aaff;font-size:10px;letter-spacing:2px;margin-bottom:4px;">
      ${reaction.companionName}
    </p>
    <p style="color:#ccc;font-size:13px;line-height:1.6;font-style:italic;">
      ${reaction.line}
    </p>
    <style>
      @keyframes bubbleIn{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}
    </style>
  `;
  
  document.body.appendChild(bubble);
  
  // 3秒后消失
  setTimeout(() => {
    bubble.style.transition = 'opacity 0.5s';
    bubble.style.opacity = '0';
    setTimeout(() => { try { bubble.remove(); } catch {} }, 500);
  }, 3000);
}
