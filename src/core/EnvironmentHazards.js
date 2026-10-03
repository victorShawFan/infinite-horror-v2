// ═══════════════════════════════════════════════════════════════
// 环境危害与互动系统 — 地图环境影响战斗和探索
// ═══════════════════════════════════════════════════════════════
//
// 每个章节的地图有特定的环境效果：
// 1. 生化危机 → 毒气区域，感染风险
// 2. 异形 → 酸液池，通风管道
// 3. 木乃伊 → 沙暴，古墓陷阱
// 4. 侏罗纪 → 沼泽，暴雨减速
// 5. 电锯惊魂 → 机关房间，铁丝网
// 6. 咒怨 → 黑暗区域，恐惧值
// 7. 指环王 → 浓雾，魔法屏障
// 8. 星际 → 失重，辐射区
// 9. 死神来了 → 连锁事故，环境杀
// 10. 黑客帝国 → 代码异常，现实扭曲
// 11. 迷雾 → 浓雾，未知恐惧
// 12. 最终 → 空间裂隙，时间异常
// ═══════════════════════════════════════════════════════════════

import { eventBus } from './EventBus.js';

// ── 章节环境定义 ──
export const CHAPTER_ENVIRONMENTS = {
  1: {
    name: '拉昆市废墟',
    hazards: [
      { id: 'toxic_gas', name: '毒气泄漏', icon: '☣', desc: '空气中弥漫着T-病毒残余',
        effect: { hpLossPerTurn: 2, chance: 0.2 }, color: '#44cc44' },
      { id: 'barricade', name: '路障', icon: '🚧', desc: '可以推开，但会发出噪音吸引敌人',
        effect: { alertEnemy: true }, color: '#cc8844' },
    ],
    ambient: { fog: 0.2, darkness: 0.3, color: '#224422' },
    narrative: '腐败的气息弥漫在空气中，远处传来不明的嘶吼声。',
  },
  2: {
    name: '诺斯卓莫号',
    hazards: [
      { id: 'acid_pool', name: '酸液', icon: '🧪', desc: '异形血液形成的酸液池',
        effect: { hpLossFlat: 15, chance: 0.15 }, color: '#88ff44' },
      { id: 'vent_shaft', name: '通风管道', icon: '🕳', desc: '可以潜入但空间狭小',
        effect: { shortcut: true, spdPenalty: -2 }, color: '#666666' },
    ],
    ambient: { fog: 0.1, darkness: 0.5, color: '#112233' },
    narrative: '金属走廊回荡着不规则的滴水声，空调系统发出低沉的嗡鸣。',
  },
  3: {
    name: '哈姆纳塔遗迹',
    hazards: [
      { id: 'sandstorm', name: '沙暴', icon: '🌪', desc: '能见度下降，移动困难',
        effect: { spdPenalty: -3, crtPenalty: -10, chance: 0.25 }, color: '#ccaa66' },
      { id: 'curse_trap', name: '诅咒机关', icon: '⚱', desc: '触发古老的守墓诅咒',
        effect: { atkPenalty: -5, duration: 3, chance: 0.2 }, color: '#886644' },
    ],
    ambient: { fog: 0.3, darkness: 0.2, color: '#332211' },
    narrative: '沙粒在风中飞舞，古老的象形文字在火把映照下若隐若现。',
  },
  4: {
    name: '努布拉岛',
    hazards: [
      { id: 'swamp', name: '沼泽', icon: '🌿', desc: '泥泞地形减缓行动',
        effect: { spdPenalty: -4, chance: 0.3 }, color: '#446644' },
      { id: 'stampede', name: '恐龙群奔', icon: '🦕', desc: '远处传来震动，群体奔跑即将到来',
        effect: { hpLossFlat: 20, dodgeable: true, chance: 0.1 }, color: '#886644' },
    ],
    ambient: { fog: 0.15, darkness: 0.15, color: '#223322' },
    narrative: '热带雨林茂密得几乎遮蔽了天空，远处传来令人不安的低吼。',
  },
  5: {
    name: '竖锯迷宫',
    hazards: [
      { id: 'tripwire', name: '绊线装置', icon: '🪤', desc: '触发后释放机关',
        effect: { hpLossFlat: 25, dodgeable: true, chance: 0.25 }, color: '#cc4444' },
      { id: 'poison_gas', name: '神经毒气', icon: '💨', desc: '竖锯的"考验"之一',
        effect: { hpLossPerTurn: 5, duration: 2, chance: 0.15 }, color: '#884488' },
    ],
    ambient: { fog: 0.1, darkness: 0.6, color: '#221111' },
    narrative: '"我想跟你玩个游戏。"——录音机的声音从黑暗中传来。',
  },
  6: {
    name: '伽椰子之家',
    hazards: [
      { id: 'dark_zone', name: '绝对黑暗', icon: '🌑', desc: '完全无光区域，恐惧值上升',
        effect: { fearIncrease: 15, blindChance: 0.3 }, color: '#111111' },
      { id: 'cold_spot', name: '灵异冷点', icon: '❄', desc: '温度骤降，灵体出没',
        effect: { spdPenalty: -2, extraEncounterChance: 0.2 }, color: '#4444aa' },
    ],
    ambient: { fog: 0.05, darkness: 0.7, color: '#0a0a1a' },
    narrative: '空气冰冷刺骨，走廊尽头似乎有什么东西在注视着你。',
  },
  7: {
    name: '中土世界',
    hazards: [
      { id: 'corrupted_land', name: '堕落之地', icon: '🌫', desc: '邪恶力量腐蚀大地',
        effect: { defPenalty: -3, hpLossPerTurn: 1, chance: 0.2 }, color: '#443322' },
      { id: 'magic_barrier', name: '魔法屏障', icon: '✨', desc: '需要足够的力量才能通过',
        effect: { requireAtk: 30 }, color: '#8844cc' },
    ],
    ambient: { fog: 0.4, darkness: 0.3, color: '#1a2a1a' },
    narrative: '古老的森林低语着被遗忘的秘密，远方的火山喷出暗红色的光芒。',
  },
  8: {
    name: '深空站',
    hazards: [
      { id: 'radiation', name: '辐射区', icon: '☢', desc: '持续造成辐射伤害',
        effect: { hpLossPerTurn: 3, maxHpReduce: 5, chance: 0.2 }, color: '#cccc44' },
      { id: 'zero_gravity', name: '零重力区', icon: '🌀', desc: '失重环境改变战斗方式',
        effect: { spdBonus: 5, defPenalty: -5 }, color: '#4488cc' },
    ],
    ambient: { fog: 0, darkness: 0.4, color: '#0a0a2e' },
    narrative: '星舰的警报声不断响起，透过舷窗可以看到无垠的星空——和逼近的威胁。',
  },
  9: {
    name: '命运之网',
    hazards: [
      { id: 'chain_accident', name: '连锁事故', icon: '⚡', desc: '一系列看似巧合的致命事件',
        effect: { hpLossFlat: 30, multiHit: 2, dodgeable: true, chance: 0.15 }, color: '#ff4444' },
      { id: 'premonition', name: '预感', icon: '👁', desc: '死神的气息让你预见危险',
        effect: { dodgeBonus: 0.15, duration: 2 }, color: '#ffcc44' },
    ],
    ambient: { fog: 0.15, darkness: 0.25, color: '#221a22' },
    narrative: '空气中弥漫着不详的预感，仿佛死亡就在下一个转角等待。',
  },
  10: {
    name: '矩阵',
    hazards: [
      { id: 'code_glitch', name: '代码异常', icon: '🟢', desc: '现实出现故障，属性随机变化',
        effect: { randomStatChange: true, range: [-5, 10], chance: 0.2 }, color: '#00cc00' },
      { id: 'bullet_time', name: '子弹时间', icon: '⏱', desc: '时间减慢，获得额外行动机会',
        effect: { extraAction: true, chance: 0.1 }, color: '#88ff88' },
    ],
    ambient: { fog: 0, darkness: 0.2, color: '#001a00' },
    narrative: '绿色的代码雨无处不在。你开始质疑这个世界的真实性。',
  },
  11: {
    name: '迷雾之境',
    hazards: [
      { id: 'deep_fog', name: '浓雾', icon: '🌫', desc: '能见度几乎为零',
        effect: { crtPenalty: -15, blindChance: 0.4, chance: 0.35 }, color: '#888888' },
      { id: 'unseen_horror', name: '迷雾中的恐怖', icon: '👻', desc: '看不见的敌人在迷雾中游荡',
        effect: { ambushChance: 0.25, fearIncrease: 20 }, color: '#666666' },
    ],
    ambient: { fog: 0.8, darkness: 0.5, color: '#1a1a1a' },
    narrative: '白色的迷雾吞噬了一切。你只能听到自己的呼吸声，和迷雾深处传来的……某种东西。',
  },
  12: {
    name: '终焉之地',
    hazards: [
      { id: 'space_rift', name: '空间裂隙', icon: '🌀', desc: '时空扭曲，一切规则失效',
        effect: { allStatsPenalty: -3, trueDamagePerTurn: 5, chance: 0.2 }, color: '#cc44cc' },
      { id: 'time_anomaly', name: '时间异常', icon: '⏰', desc: '时间加速或减慢',
        effect: { randomSpeedChange: true, chance: 0.15 }, color: '#4444cc' },
    ],
    ambient: { fog: 0.3, darkness: 0.6, color: '#1a000a' },
    narrative: '这里是一切的终点，也是一切的起点。空间在你身边碎裂又重组，时间失去了意义。',
  },
};

// ── 获取当前章节环境 ──
export function getChapterEnvironment(chapter) {
  return CHAPTER_ENVIRONMENTS[chapter] || CHAPTER_ENVIRONMENTS[1];
}

// ── 检查环境危害 ──
export function checkEnvironmentHazard(chapter, floor) {
  const env = getChapterEnvironment(chapter);
  const triggered = [];
  
  for (const hazard of env.hazards) {
    const chance = hazard.effect.chance || 0.2;
    if (Math.random() < chance) {
      triggered.push({
        ...hazard,
        chapter,
        floor,
      });
    }
  }
  
  return triggered;
}

// ── 应用环境效果到玩家 ──
export function applyEnvironmentEffect(hazard, player) {
  const effect = hazard.effect;
  const changes = [];
  
  if (effect.hpLossFlat) {
    const dodge = effect.dodgeable && Math.random() < (player.dodgeChance || 0);
    if (!dodge) {
      player.hp = Math.max(1, player.hp - effect.hpLossFlat);
      changes.push({ stat: 'hp', value: -effect.hpLossFlat, text: `${hazard.icon} ${hazard.name}: HP -${effect.hpLossFlat}` });
    } else {
      changes.push({ stat: 'dodge', value: 0, text: `${hazard.icon} ${hazard.name}: 闪避成功！` });
    }
  }
  
  if (effect.hpLossPerTurn) {
    player.hp = Math.max(1, player.hp - effect.hpLossPerTurn);
    changes.push({ stat: 'hp', value: -effect.hpLossPerTurn, text: `${hazard.icon} 环境伤害: HP -${effect.hpLossPerTurn}` });
  }
  
  if (effect.spdPenalty) {
    player._envSpd = (player._envSpd || 0) + effect.spdPenalty;
    changes.push({ stat: 'spd', value: effect.spdPenalty, text: `${hazard.icon} SPD ${effect.spdPenalty}` });
  }
  
  if (effect.atkPenalty) {
    player._envAtk = (player._envAtk || 0) + effect.atkPenalty;
    changes.push({ stat: 'atk', value: effect.atkPenalty, text: `${hazard.icon} ATK ${effect.atkPenalty}` });
  }
  
  if (effect.defPenalty) {
    player._envDef = (player._envDef || 0) + effect.defPenalty;
    changes.push({ stat: 'def', value: effect.defPenalty, text: `${hazard.icon} DEF ${effect.defPenalty}` });
  }
  
  if (effect.crtPenalty) {
    player._envCrt = (player._envCrt || 0) + effect.crtPenalty;
    changes.push({ stat: 'crt', value: effect.crtPenalty, text: `${hazard.icon} CRT ${effect.crtPenalty}%` });
  }
  
  return changes;
}

// ── 清除环境效果 ──
export function clearEnvironmentEffects(player) {
  delete player._envSpd;
  delete player._envAtk;
  delete player._envDef;
  delete player._envCrt;
}

// ── 渲染环境信息 ──
export function renderEnvironmentInfo(chapter) {
  const env = getChapterEnvironment(chapter);
  
  let html = `
    <div style="padding:10px;background:linear-gradient(135deg,${env.ambient.color}88,#00000088);
      border-radius:8px;border-left:3px solid ${env.hazards[0]?.color || '#888'};">
      <div style="color:#ddd;font-size:12px;font-weight:bold;margin-bottom:4px;">
        📍 ${env.name}
      </div>
      <p style="color:#888;font-size:10px;font-style:italic;margin:0 0 8px;">
        ${env.narrative}
      </p>
      <div style="display:flex;flex-direction:column;gap:4px;">
  `;
  
  for (const hazard of env.hazards) {
    html += `
      <div style="display:flex;align-items:center;gap:6px;padding:3px 6px;
        background:${hazard.color}11;border-radius:4px;">
        <span style="font-size:14px;">${hazard.icon}</span>
        <span style="color:${hazard.color};font-size:10px;font-weight:bold;">${hazard.name}</span>
        <span style="color:#888;font-size:9px;">${hazard.desc}</span>
      </div>
    `;
  }
  
  html += `</div></div>`;
  return html;
}

// ── 获取环境叙事（楼层加载时显示） ──
export function getFloorNarrative(chapter, floorIndex) {
  const env = getChapterEnvironment(chapter);
  const narratives = _FLOOR_NARRATIVES[chapter] || [];
  return narratives[floorIndex % narratives.length] || env.narrative;
}

// ── 楼层叙事文本 ──
const _FLOOR_NARRATIVES = {
  1: [
    '推开铁门，腐臭的气息扑面而来。墙上的血迹已经干涸。',
    '走廊尽头传来玻璃破碎的声音。是风——还是别的什么。',
    '实验室的灯光忽明忽暗，培养液中似乎有什么在蠕动。',
    '地面散落着弹壳和急救箱。看来之前有人在这里战斗过。',
    '安全室的门紧锁着，但墙上刻着几个大字："别相信任何人。"',
    '下水道的水面泛着绿光，这不是正常的颜色。',
  ],
  2: [
    '金属走廊笔直延伸，紧急照明投下诡异的红色光芒。',
    '运输舱的低温让你的呼吸凝结成白雾。墙壁上有爪痕。',
    '医疗舱一片狼藉，手术台上留下的不是人类的血液。',
    '船员休息区空无一人，但桌上的咖啡还是温的。',
    '动力核心发出不安的嗡鸣，雷达上有多个移动信号。',
    '逃生舱的指示灯亮着，但你知道现在逃跑还为时过早。',
  ],
  5: [
    '房间中央放着一台老旧的电视机，屏幕上只有雪花。',
    '铁门缓缓关闭，天花板上的倒计时器开始运行。',
    '地上散落着拼图碎片，每一块都沾着……不，别想了。',
    '镜子里映出的不是你的脸，而是一个戴着猪头面具的身影。',
    '"你每天都在浪费自己的生命。"——墙上的文字触目惊心。',
    '两扇门前各有一个按钮。选错了，就没有第二次机会。',
  ],
  12: [
    '空间在你面前扭曲折叠，远处和近处的概念已经模糊。',
    '主神空间的残影在四周浮现又消散，仿佛无数平行世界在重叠。',
    '你听到了自己的声音——来自另一个时间线的你，在呼喊着什么。',
    '光与暗交织的走廊，每一步都可能踏入未知的维度。',
    '这是最后的战场。所有的轮回、所有的成长，都指向这一刻。',
    '主神的意志如山岳般压来。但你，已经不再是当初那个普通人了。',
  ],
};

// 为没有定义专属叙事的章节生成通用叙事
for (let ch = 1; ch <= 12; ch++) {
  if (!_FLOOR_NARRATIVES[ch]) {
    const env = CHAPTER_ENVIRONMENTS[ch];
    _FLOOR_NARRATIVES[ch] = [
      env?.narrative || '你继续深入探索。',
      '这一层的气氛与之前截然不同。',
      '空气中弥漫着紧张的气氛，敌人可能随时出现。',
      '你发现了一些前人留下的痕迹。',
      '前方的道路变得更加曲折复杂。',
      '你感觉离真相越来越近了。',
    ];
  }
}
