import { TurnBattleEngine, ACTION_KIND, TARGET_KIND } from './core/TurnBattleEngine.js';
import { learnSkill, equipSkill, unequipSkill } from './core/SkillLearning.js';
import { createCampaignProgress, canLaunchEncounter, settleEncounter, getCampaignStatus } from './core/CampaignProgress.js';
import { chooseEnemyAction, describeEnemyIntent } from './core/EnemyTurnAI.js';
import { buildPresentationCues } from './core/BattlePresentation.js';
import { RebuildAudio, getAudioCueForPresentation } from './core/RebuildAudio.js';
import { applyExperience, experienceToNextLevel } from './core/PlayerProgression.js';
import { ITEM_CATALOG, purchaseItem, syncInventoryFromCombatant } from './core/ItemSystem.js';
import { SKILL_CATALOG } from './data/SkillCatalog.js';
import { DEFAULT_PROFILE, CHAPTER_ONE_ENCOUNTERS } from './data/ChapterOneBattle.js';
import {
  ALL_REBUILD_ENCOUNTERS,
  createRebuildEncounter,
  createRebuildParty,
} from './data/RebuildCampaign.js';

const app = document.getElementById('rebuild-app');
const STORAGE_KEY = 'ih_rebuild_profile_v1';
const AUDIO_KEY = 'ih_rebuild_audio_muted';
const rebuildAudio = new RebuildAudio({ muted: localStorage.getItem(AUDIO_KEY) });

let profile = loadProfile();
let engine = null;
let encounter = null;
let selectedAction = null;
let logs = [];
let resultRecorded = false;
let enemyBusy = false;
let presentationBusy = false;

function loadProfile() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (saved) return {
      ...DEFAULT_PROFILE,
      ...saved,
      learnedSkills: [...(saved.learnedSkills || DEFAULT_PROFILE.learnedSkills)],
      equippedSkills: [...(saved.equippedSkills || DEFAULT_PROFILE.equippedSkills)],
      inventory: { ...DEFAULT_PROFILE.inventory, ...(saved.inventory || {}) },
      campaign: createCampaignProgress(saved, ALL_REBUILD_ENCOUNTERS),
    };
  } catch {}
  const fresh = {
    ...DEFAULT_PROFILE,
    learnedSkills: [...DEFAULT_PROFILE.learnedSkills],
    equippedSkills: [...DEFAULT_PROFILE.equippedSkills],
    inventory: { ...DEFAULT_PROFILE.inventory },
  };
  return { ...fresh, campaign: createCampaignProgress(fresh, ALL_REBUILD_ENCOUNTERS) };
}

function saveProfile() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

function toast(message, tone = 'normal') {
  document.querySelector('.toast')?.remove();
  const node = document.createElement('div');
  node.className = 'toast';
  node.style.borderColor = tone === 'error' ? 'rgba(255,76,76,.55)' : tone === 'good' ? 'rgba(121,230,163,.55)' : 'rgba(255,255,255,.2)';
  node.textContent = message;
  document.body.appendChild(node);
  setTimeout(() => node.remove(), 2200);
}

function createAudioToggle() {
  const button = document.createElement('button');
  button.className = 'audio-toggle';
  button.type = 'button';
  button.setAttribute('aria-label', '切换声音');
  const refresh = () => { button.textContent = rebuildAudio.muted ? '声音：关' : '声音：开'; };
  refresh();
  button.onclick = () => {
    rebuildAudio.init();
    rebuildAudio.toggleMuted();
    localStorage.setItem(AUDIO_KEY, String(rebuildAudio.muted));
    refresh();
    if (!rebuildAudio.muted) rebuildAudio.play('click');
  };
  document.body.appendChild(button);
}

function renderTitle() {
  app.innerHTML = [
    '<section class="screen title-screen">',
    '  <div class="title-wrap">',
    '    <div class="title-mark"></div>',
    '    <div class="eyebrow">Project Rebirth · Turn-Based Role Playing</div>',
    '    <h1>无限<span>恐怖</span></h1>',
    '    <p class="title-copy">在主神的倒计时中学习力量、编排技能，与中洲队共同面对无法逃避的恐怖世界。每一次行动都由你决定，每一次代价都会被记住。</p>',
    '    <div class="title-actions">',
    '      <button class="primary" id="enter-hub">进入主神空间</button>',
    '      <button class="secondary" id="quick-battle">直接体验回合战斗</button>',
    '    </div>',
    '    <p class="version-note">回合制重构 · 四章二十四场完整任务</p>',
    '  </div>',
    '</section>',
  ].join('');
  document.getElementById('enter-hub').onclick = renderHub;
  document.getElementById('quick-battle').onclick = () => showBriefing(getCampaignStatus(profile.campaign, ALL_REBUILD_ENCOUNTERS).nextEncounter?.id || ALL_REBUILD_ENCOUNTERS[0].id);
}

function schoolColor(school) {
  return { '近战': '#ff6a64', '血统': '#bd4bff', '精神': '#69ddff', '辅助': '#79e6a3', '枪械': '#ffc967' }[school] || '#ff6a64';
}

function renderHub() {
  const equipped = profile.equippedSkills.map(id => SKILL_CATALOG[id]).filter(Boolean);
  const skills = Object.values(SKILL_CATALOG).filter(skill => skill.learnable !== false && !['precision_shot', 'suppressive_fire'].includes(skill.id));
  const campaignStatus = getCampaignStatus(profile.campaign, ALL_REBUILD_ENCOUNTERS);
  const nextLevelExp = experienceToNextLevel(profile.level);
  const items = Object.values(ITEM_CATALOG);
  app.innerHTML = [
    '<section class="screen hub-screen">',
    '  <header class="topbar">',
    '    <div><div class="eyebrow">Lord God Space / 00:09:42:17</div><h1>强化大厅 <span class="accent">·</span> 技能兑换</h1></div>',
    '    <div class="currency glass">⬡ 奖励点 <strong>' + profile.rewardPoints + '</strong></div>',
    '  </header>',
    '  <div class="hub-grid">',
    '    <aside class="profile-panel glass">',
    '      <div class="profile-hero"><img src="/assets/characters/zheng_zha.jpg" alt="郑吒"><div><div class="eyebrow">中洲队 · 近战核心</div><h2>郑吒 <small>Lv.' + profile.level + '</small></h2><p style="color:#8390a3;font-size:11px;line-height:1.7">主神不会替你选择道路。进入恐怖片前，决定这一次要带上哪些力量。</p></div></div>',
    '      <div class="level-progress"><span>轮回经验</span><div class="level-bar"><i style="width:' + Math.min(100, profile.exp / nextLevelExp * 100) + '%"></i></div><strong>' + profile.exp + ' / ' + nextLevelExp + '</strong></div>',
    '      <div class="eyebrow" style="margin-top:20px">已装备技能 ' + equipped.length + ' / ' + profile.skillSlots + '</div>',
    '      <div class="build-list">' + Array.from({ length: profile.skillSlots }, (_, index) => {
      const skill = equipped[index];
      return '<div class="build-slot"><span>' + (skill ? skill.icon + ' · ' + skill.name : '空技能槽') + '</span><small>' + (skill ? (skill.target === TARGET_KIND.ALL_ENEMIES ? '群体' : '单体') + ' / MP ' + skill.mpCost : '等待装备') + '</small></div>';
    }).join('') + '</div>',
    '      <div style="display:flex;justify-content:space-between;color:#8190a6;font-size:10px"><span>章节推进</span><strong style="color:#dbe3ee">' + campaignStatus.completedCount + ' / ' + campaignStatus.totalCount + '</strong></div>',
    '      <div class="mission-list">' + renderMissionGroups() + '</div>',
    campaignStatus.completed ? '<div class="chapter-clear">前四章已完成 · 第五章「死神来了」迁移中</div>' : '',
    '      <button class="secondary hub-launch" id="back-title">返回标题</button>',
    '    </aside>',
    '    <section class="skills-panel glass">',
    '      <div class="eyebrow">Skill Archive / 技能并非自动生效，需要学习并装入技能栏</div>',
    '      <h2 style="margin:6px 0 18px">可兑换技能</h2>',
    '      <div class="skill-tree">' + skills.map(skill => renderLearnCard(skill)).join('') + '</div>',
    '      <div class="supply-heading"><div><div class="eyebrow">Survival Supplies / 消耗品会带入下一场战斗</div><h2>轮回补给</h2></div><span>库存会在战斗结算后保存</span></div>',
    '      <div class="supply-shop">' + items.map(renderSupplyCard).join('') + '</div>',
    '    </section>',
    '  </div>',
    '</section>',
  ].join('');

  document.getElementById('back-title').onclick = renderTitle;
  document.querySelectorAll('[data-encounter]').forEach(button => {
    button.onclick = () => showBriefing(button.dataset.encounter);
  });
  document.querySelectorAll('[data-learn]').forEach(button => {
    button.onclick = () => handleLearn(button.dataset.learn);
  });
  document.querySelectorAll('[data-equip]').forEach(button => {
    button.onclick = () => handleEquip(button.dataset.equip);
  });
  document.querySelectorAll('[data-buy-item]').forEach(button => {
    button.onclick = () => handlePurchaseItem(button.dataset.buyItem);
  });
}

function renderMissionGroups() {
  const groups = [
    { number: 1, name: '第一章 · 名为生化' },
    { number: 2, name: '第二章 · 异形杀戮' },
    { number: 3, name: '第三章 · 咒怨阴影' },
    { number: 4, name: '第四章 · 神鬼秘宝' },
  ];
  return groups.map(group => {
    const missions = ALL_REBUILD_ENCOUNTERS.filter(item => Number(item.chapterNumber || 1) === group.number);
    const cleared = missions.filter(item => profile.campaign.completed.includes(item.id)).length;
    return [
      '<div class="mission-group-head"><span>' + group.name + '</span><strong>' + cleared + ' / ' + missions.length + '</strong></div>',
      missions.map(renderMissionCard).join(''),
    ].join('');
  }).join('');
}

function renderSupplyCard(item) {
  const count = profile.inventory?.[item.id] || 0;
  const affordable = profile.rewardPoints >= item.cost;
  return [
    '<article class="supply-card">',
    '  <span class="supply-icon">' + item.icon + '</span>',
    '  <div class="supply-copy"><div><b>' + item.name + '</b><strong>持有 ×' + count + '</strong></div><p>' + item.desc + '</p></div>',
    '  <button class="secondary supply-buy" data-buy-item="' + item.id + '" ' + (!affordable ? 'disabled' : '') + '>⬡ ' + item.cost + ' · 购买</button>',
    '</article>',
  ].join('');
}

function handlePurchaseItem(itemId) {
  const result = purchaseItem(profile, itemId, 1, ITEM_CATALOG);
  if (!result.ok) {
    toast(result.error === 'insufficient_points' ? '奖励点不足' : '无法购买该补给', 'error');
    return;
  }
  profile = result.profile;
  saveProfile();
  renderHub();
  toast('已购买「' + result.item.name + '」×' + result.quantity, 'good');
}

function showBriefing(encounterId) {
  if (!canLaunchEncounter(profile.campaign, encounterId, ALL_REBUILD_ENCOUNTERS)) {
    toast('该任务尚未解锁', 'error');
    return;
  }
  const mission = createRebuildEncounter(encounterId);
  app.innerHTML = [
    '<section class="screen briefing-screen" style="--briefing-bg:url(\'' + mission.background + '\')">',
    '  <div class="briefing-layout">',
    '    <div class="briefing-heading"><div class="eyebrow">MISSION 0' + mission.order + ' · ' + mission.threat + '</div><h1>' + mission.title + '</h1><p>' + mission.briefing + '</p></div>',
    '    <div class="briefing-dialogue glass">' + mission.intro.map((beat, index) => [
      '<div class="story-beat"><span>0' + (index + 1) + '</span><div><b>' + beat.speaker + '</b><p>' + beat.text + '</p></div></div>',
    ].join('')).join('') + '</div>',
    '    <div class="briefing-footer">',
    '      <div class="mission-reward">首通奖励 <strong>EXP +' + mission.rewards.exp + '</strong><strong>⬡ +' + mission.rewards.points + '</strong></div>',
    '      <div><button class="secondary" id="briefing-back">返回整备</button><button class="primary" id="briefing-start">开始任务</button></div>',
    '    </div>',
    '  </div>',
    '</section>',
  ].join('');
  document.getElementById('briefing-back').onclick = renderHub;
  document.getElementById('briefing-start').onclick = () => startBattle(encounterId);
}

function renderMissionCard(encounter) {
  const unlocked = canLaunchEncounter(profile.campaign, encounter.id, ALL_REBUILD_ENCOUNTERS);
  const completed = profile.campaign.completed.includes(encounter.id);
  return [
    '<button class="mission-card ' + (completed ? 'complete ' : '') + (!unlocked ? 'locked' : '') + '" data-encounter="' + encounter.id + '" ' + (!unlocked ? 'disabled' : '') + '>',
    '  <span class="mission-order">' + String(encounter.chapterOrder || encounter.order).padStart(2, '0') + '</span>',
    '  <span class="mission-copy"><b>' + encounter.title + '</b><small>' + encounter.briefing + '</small></span>',
    '  <span class="mission-state">' + (!unlocked ? '锁定' : completed ? '重返' : encounter.threat) + '</span>',
    '</button>',
  ].join('');
}

function renderLearnCard(skill) {
  const learned = profile.learnedSkills.includes(skill.id);
  const equipped = profile.equippedSkills.includes(skill.id);
  const prerequisite = skill.prerequisite ? SKILL_CATALOG[skill.prerequisite]?.name : null;
  const action = learned
    ? '<span class="skill-cost">' + (equipped ? '点击卸下' : '点击装备') + '</span>'
    : '<span class="skill-cost">⬡ ' + skill.cost + '</span>';
  return [
    '<button class="learn-btn ' + (learned ? 'learned ' : '') + (equipped ? 'equipped' : '') + '" style="--school:' + schoolColor(skill.school) + '" ' + (learned ? 'data-equip' : 'data-learn') + '="' + skill.id + '">',
    '  <div class="skill-head"><span class="skill-icon">' + skill.icon + '</span><span class="skill-name">' + skill.name + '</span>' + action + '</div>',
    '  <div class="skill-meta">' + skill.school + ' · ' + (skill.target === TARGET_KIND.ALL_ENEMIES ? '群体攻击' : skill.healPower ? '单体治疗' : '单体攻击') + ' · MP ' + skill.mpCost + (prerequisite ? ' · 前置 ' + prerequisite : '') + '</div>',
    '  <div class="skill-desc">' + skill.desc + '</div>',
    '</button>',
  ].join('');
}

function handleLearn(skillId) {
  const result = learnSkill(profile, skillId, SKILL_CATALOG);
  if (!result.ok) {
    const messages = { prerequisite_missing: '尚未学会前置技能', insufficient_points: '奖励点不足', already_learned: '已经掌握该技能' };
    toast(messages[result.error] || '无法学习该技能', 'error');
    return;
  }
  profile = result.profile;
  const equip = equipSkill(profile, skillId);
  if (equip.ok) profile = equip.profile;
  saveProfile();
  renderHub();
  toast('已学会 ' + result.skill.name + (equip.ok ? '，并装入技能栏' : ''), 'good');
}

function handleEquip(skillId) {
  if (profile.equippedSkills.includes(skillId)) {
    const result = unequipSkill(profile, skillId);
    if (!result.ok) {
      toast('无法卸下该技能', 'error');
      return;
    }
    profile = result.profile;
    saveProfile();
    renderHub();
    toast('技能已从技能栏卸下');
    return;
  }
  const result = equipSkill(profile, skillId);
  if (!result.ok) {
    toast(result.error === 'slots_full' ? '技能栏已满' : '无法装备', 'error');
    return;
  }
  profile = result.profile;
  saveProfile();
  renderHub();
  toast('技能已装备', 'good');
}

function startBattle(encounterId = ALL_REBUILD_ENCOUNTERS[0].id) {
  if (!canLaunchEncounter(profile.campaign, encounterId, ALL_REBUILD_ENCOUNTERS)) {
    toast('该任务尚未解锁', 'error');
    return;
  }
  encounter = createRebuildEncounter(encounterId);
  engine = new TurnBattleEngine({
    party: createRebuildParty(profile, encounter),
    enemies: encounter.enemies,
    skills: SKILL_CATALOG,
    items: ITEM_CATALOG,
    rewards: previewEncounterRewards(encounter),
    rules: encounter.rules,
  });
  logs = [encounter.title + '。敌方生命信号 × ' + encounter.enemies.length + '。', '战斗开始：请选择当前角色的行动。'];
  selectedAction = null;
  resultRecorded = false;
  enemyBusy = false;
  renderBattle();
  runEnemyTurns();
}

function previewEncounterRewards(targetEncounter) {
  return profile.campaign.completed.includes(targetEncounter.id)
    ? { ...targetEncounter.repeatRewards }
    : { ...targetEncounter.rewards };
}

function renderBattle() {
  const current = engine.getCurrentActor();
  const party = engine.combatants.filter(unit => unit.side === 'party');
  const enemies = engine.combatants.filter(unit => unit.side === 'enemy');
  app.innerHTML = [
    '<section class="screen battle-screen" style="--battle-bg:url(\'' + encounter.background + '\')">',
    '  <header class="battle-header">',
    '    <div class="battle-title"><div class="eyebrow">' + encounter.chapter + '</div><h1>' + encounter.title + '</h1><p>' + encounter.subtitle + '</p></div>',
    '    <div class="timeline">' + engine.turnOrder.map(unit => '<div class="turn-chip ' + (current?.id === unit.id ? 'active' : '') + ' ' + (unit.hp <= 0 ? 'dead' : '') + '"><img src="' + unit.portrait + '" alt="' + unit.name + '"></div>').join('') + '</div>',
    '  </header>',
    '  <div class="arena">',
    '    <div class="formation party ' + (party.length > 3 ? 'party-large' : '') + '">' + party.map(unit => renderUnit(unit, current)).join('') + '</div>',
    '    <div class="versus"><div class="round-num">ROUND ' + engine.round + '</div>' + renderRuleStatus() + '<strong>VS</strong><div class="intent">敌方意图<br>' + enemyIntentText(enemies) + '</div></div>',
    '    <div class="formation enemies">' + enemies.map(unit => renderUnit(unit, current)).join('') + '</div>',
    '  </div>',
    '  <div id="battle-fx-layer"></div>',
    '  <footer class="battle-console">',
    '    <div class="combat-log glass">' + logs.slice(-8).map(line => '<div>' + line + '</div>').join('') + '</div>',
    '    <div class="command-panel glass">' + renderCommands(current) + '</div>',
    '  </footer>',
    '</section>',
    renderResult(),
  ].join('');
  bindBattleControls();
}

function renderRuleStatus() {
  const rule = engine.rules?.curseWave;
  if (!rule) return '';
  return '<div class="curse-counter"><span>CURSE</span><b>' + engine.ruleState.curseLevel + ' / ' + (rule.maxLevel || 7) + '</b><i style="--curse-progress:' + (engine.ruleState.curseLevel / (rule.maxLevel || 7) * 100) + '%"></i></div>';
}

function renderUnit(unit, current) {
  const selectable = selectedAction && unit.hp > 0 && isValidTarget(unit, selectedAction);
  return [
    '<article class="unit-card ' + unit.side + ' ' + (unit.boss ? 'boss ' : '') + (current?.id === unit.id ? 'actor ' : '') + (selectable ? 'selectable ' : '') + (unit.hp <= 0 ? 'dead' : '') + '" data-target="' + unit.id + '">',
    unit.guarding ? '<span class="guard-tag">防御中</span>' : '',
    unit.curseSealed ? '<span class="curse-seal-tag">封印中</span>' : '',
    '  <img class="unit-portrait" src="' + unit.portrait + '" alt="' + unit.name + '">',
    '  <div class="unit-info"><div class="unit-name"><span>' + unit.name + '</span><span>SPD ' + unit.spd + '</span></div><div class="unit-role">' + (unit.role || (unit.side === 'enemy' ? '敌对单位' : '中洲队')) + '</div>',
    '    <div class="bar" style="--value:' + Math.max(0, unit.hp / unit.maxHp * 100) + '%"><i></i></div><div class="unit-stats"><span>HP ' + unit.hp + ' / ' + unit.maxHp + '</span><span>ATK ' + unit.atk + '</span></div>',
    unit.maxMp > 0 ? '<div class="bar mp" style="--value:' + Math.max(0, unit.mp / unit.maxMp * 100) + '%"><i></i></div><div class="unit-stats"><span>MP ' + unit.mp + ' / ' + unit.maxMp + '</span><span>DEF ' + unit.def + '</span></div>' : '',
    '  </div>',
    '</article>',
  ].join('');
}

function renderCommands(actor) {
  if (!actor || engine.status !== 'active') return '<div class="command-title"><span>战斗已经结束</span></div>';
  if (actor.side === 'enemy' || enemyBusy || presentationBusy) return '<div class="command-title"><span>行动演算中……</span><span>' + actor.name + '</span></div>';
  if (selectedAction) {
    const label = selectedAction.skill?.name || selectedAction.item?.name || '普通攻击';
    return '<div class="command-title"><span class="target-hint">为「' + label + '」选择目标</span><button class="secondary" id="cancel-target">取消</button></div>';
  }
  const skills = actor.skills.map(id => SKILL_CATALOG[id]).filter(Boolean);
  const items = Object.values(ITEM_CATALOG).filter(item => (actor.inventory?.[item.id] || 0) > 0);
  const hasInjuredAlly = engine.getLiving(actor.side).some(unit => unit.hp < unit.maxHp);
  return [
    '<div class="command-title"><span><strong>' + actor.name + '</strong> 的行动回合</span><span>请选择指令</span></div>',
    '<div class="command-grid">',
    '  <button class="command-btn" id="basic-attack"><b>普通攻击</b><span>零消耗 · 单体' + (actor.damageType === 'spirit' ? '灵类' : '物理') + '攻击</span></button>',
    skills.map(skill => {
      const cooldown = actor.cooldowns?.[skill.id] || 0;
      const disabled = actor.mp < skill.mpCost || cooldown > 0;
      return '<button class="skill-card" data-skill="' + skill.id + '" ' + (disabled ? 'disabled' : '') + '><b>' + skill.icon + ' · ' + skill.name + (cooldown > 0 ? '<em>CD ' + cooldown + '</em>' : '') + '</b><span class="tag">' + (skill.target === TARGET_KIND.ALL_ENEMIES ? '群体' : skill.healPower ? '治疗' : '单体') + ' · MP ' + skill.mpCost + ' · 冷却 ' + skill.cooldown + '</span><span>' + skill.desc + '</span></button>';
    }).join(''),
    items.map(item => '<button class="skill-card item-card" data-item="' + item.id + '" ' + (!hasInjuredAlly ? 'disabled title="全队生命值已满"' : '') + '><b>' + item.icon + ' · ' + item.name + '<em>×' + actor.inventory[item.id] + '</em></b><span class="tag">补给 · ' + (item.target === TARGET_KIND.ALL_ALLIES ? '我方全体' : '我方单体') + '</span><span>' + item.desc + '</span></button>').join(''),
    '  <button class="command-btn" id="defend"><b>防御</b><span>承受伤害降低50%，持续到下一次行动</span></button>',
    '</div>',
  ].join('');
}

function bindBattleControls() {
  document.getElementById('basic-attack')?.addEventListener('click', () => {
    selectedAction = { kind: ACTION_KIND.ATTACK, target: TARGET_KIND.SINGLE_ENEMY };
    renderBattle();
  });
  document.getElementById('defend')?.addEventListener('click', () => executePlayerAction({ kind: ACTION_KIND.DEFEND }));
  document.getElementById('cancel-target')?.addEventListener('click', () => { selectedAction = null; renderBattle(); });
  document.querySelectorAll('[data-skill]').forEach(button => {
    button.addEventListener('click', () => chooseSkill(button.dataset.skill));
  });
  document.querySelectorAll('[data-item]').forEach(button => {
    button.addEventListener('click', () => chooseItem(button.dataset.item));
  });
  document.querySelectorAll('[data-target]').forEach(card => {
    card.addEventListener('click', () => {
      if (!selectedAction) return;
      const target = engine.getCombatant(card.dataset.target);
      if (!target || !isValidTarget(target, selectedAction)) return;
      executePlayerAction({
        kind: selectedAction.kind,
        skillId: selectedAction.skill?.id,
        itemId: selectedAction.item?.id,
        targetId: target.id,
      });
    });
  });
  document.getElementById('claim-result')?.addEventListener('click', claimBattleResult);
}

function chooseSkill(skillId) {
  const skill = SKILL_CATALOG[skillId];
  if (!skill) return;
  if (skill.target === TARGET_KIND.ALL_ENEMIES || skill.target === TARGET_KIND.ALL_ALLIES || skill.target === TARGET_KIND.SELF) {
    executePlayerAction({ kind: ACTION_KIND.SKILL, skillId });
    return;
  }
  selectedAction = { kind: ACTION_KIND.SKILL, skill, target: skill.target };
  renderBattle();
}

function chooseItem(itemId) {
  const item = ITEM_CATALOG[itemId];
  const actor = engine.getCurrentActor();
  if (!item || !actor || (actor.inventory?.[itemId] || 0) <= 0) return;
  if (item.target === TARGET_KIND.ALL_ALLIES) {
    executePlayerAction({ kind: ACTION_KIND.ITEM, itemId });
    return;
  }
  selectedAction = { kind: ACTION_KIND.ITEM, item, target: item.target };
  renderBattle();
}

function isValidTarget(unit, action) {
  const actor = engine.getCurrentActor();
  const expected = action.target === TARGET_KIND.SINGLE_ALLY ? actor.side : actor.side === 'party' ? 'enemy' : 'party';
  if (action.kind === ACTION_KIND.ITEM) return unit.side === expected && unit.hp < unit.maxHp;
  return unit.side === expected;
}

async function executePlayerAction(action) {
  const actor = engine.getCurrentActor();
  if (!actor || actor.side !== 'party' || presentationBusy) return;
  const result = engine.act({ actorId: actor.id, ...action });
  if (!result.ok) {
    toast('行动失败：' + result.error, 'error');
    return;
  }
  selectedAction = null;
  appendEvents(result.events);
  presentationBusy = true;
  renderBattle();
  await playPresentation(result.events);
  presentationBusy = false;
  renderBattle();
  runEnemyTurns();
}

async function runEnemyTurns() {
  if (enemyBusy || engine.status !== 'active') return;
  enemyBusy = true;
  while (engine.status === 'active' && engine.getCurrentActor()?.side === 'enemy') {
    renderBattle();
    await delay(520);
    const actor = engine.getCurrentActor();
    const action = chooseEnemyAction({ actor, round: engine.round, opponents: engine.getLiving('party'), skills: SKILL_CATALOG });
    const result = engine.act(action);
    appendEvents(result.events);
    presentationBusy = true;
    renderBattle();
    await playPresentation(result.events);
    presentationBusy = false;
    renderBattle();
    await delay(180);
  }
  enemyBusy = false;
  renderBattle();
}

async function playPresentation(events) {
  const cues = buildPresentationCues(events);
  for (const cue of cues) {
    const audioCue = getAudioCueForPresentation(cue);
    if (audioCue) rebuildAudio.play(audioCue);
    const actorCard = cue.actorId ? document.querySelector('[data-target="' + cue.actorId + '"]') : null;
    const targetCard = cue.targetId ? document.querySelector('[data-target="' + cue.targetId + '"]') : null;
    if (cue.type === 'attack' || cue.type === 'cast' || cue.type === 'item') {
      actorCard?.classList.add(cue.type === 'cast' ? 'fx-cast' : 'fx-attack');
      await delay(150);
      actorCard?.classList.remove('fx-cast', 'fx-attack');
    } else if (cue.type === 'hit') {
      targetCard?.classList.add(cue.intensity === 'critical' ? 'fx-critical-hit' : 'fx-hit');
      await delay(cue.intensity === 'critical' ? 210 : 150);
      targetCard?.classList.remove('fx-hit', 'fx-critical-hit');
    } else if (cue.type === 'heal') {
      targetCard?.classList.add('fx-heal');
      await delay(180);
      targetCard?.classList.remove('fx-heal');
    } else if (cue.type === 'guard') {
      actorCard?.classList.add('fx-guard');
      await delay(170);
      actorCard?.classList.remove('fx-guard');
    } else if (cue.type === 'protection') {
      targetCard?.classList.add('fx-protected');
      await delay(190);
      targetCard?.classList.remove('fx-protected');
    } else if (cue.type === 'resistance' || cue.type === 'curse_seal') {
      targetCard?.classList.add(cue.type === 'resistance' ? 'fx-spirit-resist' : 'fx-curse-seal');
      await delay(190);
      targetCard?.classList.remove('fx-spirit-resist', 'fx-curse-seal');
    } else if (cue.type === 'weakness') {
      targetCard?.classList.add('fx-weakness');
      await delay(190);
      targetCard?.classList.remove('fx-weakness');
    } else if (cue.type === 'hazard' || cue.type === 'retaliation') {
      targetCard?.classList.add('fx-hazard');
      if (cue.hazardId === 'laser') document.querySelector('.battle-screen')?.classList.add('fx-laser-screen');
      await delay(210);
      targetCard?.classList.remove('fx-hazard');
      document.querySelector('.battle-screen')?.classList.remove('fx-laser-screen');
    } else if (cue.type === 'boss_phase') {
      actorCard?.classList.add('fx-boss-phase');
      document.querySelector('.battle-screen')?.classList.add('fx-danger-screen');
      await delay(360);
      actorCard?.classList.remove('fx-boss-phase');
      document.querySelector('.battle-screen')?.classList.remove('fx-danger-screen');
    } else if (cue.type === 'curse_reveal') {
      actorCard?.classList.add('fx-curse-break');
      document.querySelector('.battle-screen')?.classList.add('fx-curse-screen');
      await delay(420);
      actorCard?.classList.remove('fx-curse-break');
      document.querySelector('.battle-screen')?.classList.remove('fx-curse-screen');
    } else if (cue.type === 'popup' && targetCard) {
      const popup = document.createElement('span');
      popup.className = 'combat-popup ' + cue.tone;
      popup.textContent = cue.text;
      targetCard.appendChild(popup);
      await delay(230);
      popup.remove();
    } else if (cue.type === 'banner') {
      const banner = document.createElement('div');
      banner.className = 'battle-banner ' + cue.tone;
      banner.textContent = cue.text;
      document.querySelector('.battle-screen')?.appendChild(banner);
      await delay(420);
      banner.remove();
    }
  }
}

function appendEvents(events) {
  for (const event of events) {
    if (event.type === 'damage') {
      const actor = engine.getCombatant(event.actorId);
      const target = engine.getCombatant(event.targetId);
      const skill = event.skillId ? SKILL_CATALOG[event.skillId] : null;
      logs.push('<strong>' + actor.name + '</strong> 使用' + (skill ? '「' + skill.name + '」' : '普通攻击') + '，对 <strong>' + target.name + '</strong> 造成 <span class="accent">' + event.amount + '</span> 伤害' + (event.critical ? '（暴击）' : '') + (event.defeated ? '，目标倒下' : '') + '。');
    } else if (event.type === 'heal') {
      const actor = engine.getCombatant(event.actorId);
      const target = engine.getCombatant(event.targetId);
      logs.push('<strong>' + actor.name + '</strong> 为 <strong>' + target.name + '</strong> 恢复 <span style="color:var(--green)">' + event.amount + '</span> HP。');
    } else if (event.type === 'item_use') {
      const actor = engine.getCombatant(event.actorId);
      const item = ITEM_CATALOG[event.itemId];
      logs.push('<strong>' + actor.name + '</strong> 使用补给「' + (item?.name || event.itemId) + '」。');
    } else if (event.type === 'item_heal') {
      const target = engine.getCombatant(event.targetId);
      logs.push('<strong>' + target.name + '</strong> 恢复 <span style="color:var(--green)">' + event.amount + '</span> HP。');
    } else if (event.type === 'guard') {
      logs.push('<strong>' + engine.getCombatant(event.actorId).name + '</strong> 架起防御，等待敌方冲击。');
    } else if (event.type === 'protection') {
      const target = engine.getCombatant(event.targetId);
      logs.push('<strong>' + target.name + '</strong> 受到防卫节点保护，本次伤害被大幅削减。');
    } else if (event.type === 'hazard_damage') {
      const target = engine.getCombatant(event.targetId);
      logs.push('<strong class="accent">' + event.hazardName + '</strong> 命中 <strong>' + target.name + '</strong>，造成 ' + event.amount + ' 环境伤害。');
    } else if (event.type === 'retaliation_damage') {
      const source = engine.getCombatant(event.sourceId);
      const target = engine.getCombatant(event.targetId);
      logs.push('<strong>' + source.name + '</strong> 的酸血溅中 <strong>' + target.name + '</strong>，造成 <span class="acid-text">' + event.amount + '</span> 反噬伤害。');
    } else if (event.type === 'resistance') {
      const target = engine.getCombatant(event.targetId);
      logs.push('<strong>' + target.name + '</strong> 的灵体本质削减了 ' + Math.round(event.reduction * 100) + '% 物理伤害。');
    } else if (event.type === 'curse_seal') {
      const target = engine.getCombatant(event.targetId);
      logs.push('<strong>' + target.name + '</strong> 尚未显形，诅咒封印吞没了本次攻击。');
    } else if (event.type === 'curse_wave') {
      logs.push('<strong class="curse-text">第 ' + event.level + ' 波诅咒降临。</strong> 灵体攻击力继续增强。');
    } else if (event.type === 'curse_reveal') {
      logs.push('<strong class="curse-text">第七波结束，' + event.actorName + '真身显形！封印已经解除。</strong>');
    } else if (event.type === 'weakness') {
      const target = engine.getCombatant(event.targetId);
      logs.push('<strong class="weakness-text">命中 ' + target.name + ' 的「' + event.damageType + '」弱点，伤害倍率 ×' + Number(event.multiplier).toFixed(2) + '。</strong>');
    } else if (event.type === 'regeneration') {
      const target = engine.getCombatant(event.targetId);
      logs.push('<strong>' + target.name + '</strong> 从沙尘中复生，恢复 <span class="regeneration-text">' + event.amount + '</span> HP。');
    } else if (event.type === 'boss_phase') {
      const boss = engine.getCombatant(event.actorId);
      logs.push('<strong class="accent">' + boss.name + '进入狂暴阶段！</strong> 肌肉组织突破限制，ATK +' + event.atkBonus + '。');
    } else if (event.type === 'battle_end') {
      logs.push(event.result === 'victory' ? '<strong>敌方战线崩溃，任务目标已完成。</strong>' : '<strong>中洲队失去战斗能力。</strong>');
      rebuildAudio.play(event.result === 'victory' ? 'victory' : 'defeat');
    }
  }
}

function enemyIntentText(enemies) {
  const living = enemies.filter(enemy => enemy.hp > 0);
  if (!living.length) return '无生命信号';
  const opponents = engine.getLiving('party');
  return living.map(enemy => {
    const action = chooseEnemyAction({ actor: enemy, round: engine.round, opponents, skills: SKILL_CATALOG });
    return describeEnemyIntent(action, enemy, opponents, SKILL_CATALOG);
  }).join('<br>');
}

function renderResult() {
  if (!engine || engine.status === 'active') return '';
  const victory = engine.status === 'victory';
  const rewards = victory ? previewEncounterRewards(encounter) : { exp: 0, points: 0 };
  return [
    '<div class="result-overlay"><div class="result-card glass">',
    '  <div class="eyebrow">Battle Result</div>',
    '  <h2 style="color:' + (victory ? 'var(--amber)' : 'var(--red)') + '">' + (victory ? encounter.victory.title : '轮回终止') + '</h2>',
    '  <p>' + (victory ? encounter.victory.text : '这一次选择没能让所有人活下来。调整技能构筑，再次进入战斗。') + '</p>',
    victory ? '<div class="reward-row"><div class="reward-pill">EXP +' + rewards.exp + '</div><div class="reward-pill">⬡ +' + rewards.points + '</div></div>' : '',
    '  <button class="primary" id="claim-result">' + (victory ? '领取奖励并返回主神空间' : '返回主神空间整备') + '</button>',
    '</div></div>',
  ].join('');
}

function claimBattleResult() {
  if (resultRecorded) return;
  const result = engine.claimResult();
  if (!result.ok) return;
  resultRecorded = true;
  const settlement = settleEncounter(profile.campaign, encounter.id, result.result, ALL_REBUILD_ENCOUNTERS);
  if (!settlement.ok) {
    resultRecorded = false;
    toast('任务结算失败：' + settlement.error, 'error');
    return;
  }
  profile.campaign = settlement.progress;
  profile = syncInventoryFromCombatant(profile, engine.getCombatant('zheng'));
  let progression = null;
  if (result.result === 'victory') {
    profile.rewardPoints += settlement.rewards.points || 0;
    profile.battlesWon += 1;
    progression = applyExperience(profile, settlement.rewards.exp || 0);
    profile = progression.profile;
  }
  saveProfile();
  if (settlement.firstClear && encounter.epilogue) renderChapterEpilogue(encounter.epilogue);
  else renderHub();
  const rewardMessage = progression?.levelsGained > 0
    ? '等级提升至 Lv.' + profile.level + '，属性成长已写入战斗档案'
    : result.result === 'victory' ? '奖励与经验已写入轮回档案' : '已返回主神空间';
  toast(rewardMessage, result.result === 'victory' ? 'good' : 'normal');
}

function renderChapterEpilogue(epilogue) {
  const chapterLabel = epilogue.chapterLabel || 'CHAPTER ONE COMPLETE';
  const title = epilogue.title || '名为生化';
  const stats = epilogue.stats || [
    '第一章任务 ' + CHAPTER_ONE_ENCOUNTERS.length + ' / ' + CHAPTER_ONE_ENCOUNTERS.length,
    '中洲队存活 3',
    '下一世界：异形',
  ];
  app.innerHTML = [
    '<section class="screen epilogue-screen">',
    '  <div class="epilogue-card glass">',
    '    <div class="eyebrow">' + chapterLabel + '</div>',
    '    <h1>' + title + ' <span>· ' + (epilogue.suffix || '完') + '</span></h1>',
    '    <blockquote>' + epilogue.quote + '</blockquote>',
    '    <p>' + epilogue.text + '</p>',
    '    <div class="epilogue-stats">' + stats.map(stat => '<span>' + stat + '</span>').join('') + '</div>',
    '    <button class="primary" id="epilogue-return">返回主神空间</button>',
    '  </div>',
    '</section>',
  ].join('');
  document.getElementById('epilogue-return').onclick = renderHub;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

renderTitle();
createAudioToggle();
document.addEventListener('pointerdown', event => {
  if (!event.target.closest('button') || event.target.closest('.audio-toggle')) return;
  rebuildAudio.init();
  rebuildAudio.play('click');
}, { capture: true });
