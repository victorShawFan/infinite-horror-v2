// ═══════════════════════════════════════════════════════════════
// UI 面板模块 — 从 main.js 抽离的游戏界面面板
// ═══════════════════════════════════════════════════════════════
//
// 包含: 背包/状态、统计、图鉴、同伴关系、帮助、全地图、战斗日志

import { GAME_STATE } from './constants.js';
import { gameState } from './GameState.js';
import { getEffectiveAtk, getEffectiveDef, getEffectiveSpd, getEffectiveCrt } from './CombatSystem.js';
import { getDifficultyConfig, getDifficulty } from './DifficultySystem.js';
import { getRelationshipLevel, COMPANION_PROFILES } from './RelationshipSystem.js';
import { formatCycleInfo } from './NewGamePlus.js';
import { LORE_ENTRIES } from './LoreSystem.js';
import { getTalentEffects } from './TalentTree.js';
import { formatBestiaryPanel } from './DifficultySystem.js';
import { checkElementalResonance, getPlayerActiveElements } from './ElementalSystem.js';
import { getAvailableSkills } from './SkillSystem.js';
import { getEquipmentDisplayName } from './EquipmentSystem.js';
import { getGeneLockDescription, getGeneLockProgress } from './GeneLockSystem.js';
import { getInventoryList, useConsumable, CONSUMABLE_DEFS } from './ConsumableSystem.js';
import { getAvailableRecipes, forgeRecipe, disassembleEquipment, reforgeAffixes, fuseEquipment, getDisassemblePreview, getFusionCost, QUALITY } from './ForgeSystem.js';
import { achievementTracker, ACHIEVEMENTS } from './AchievementSystem.js';
import { formatCompanionCombatHTML } from './CompanionCombat.js';
import { formatSetBonusHTML } from './EquipmentSystem.js';
import { formatQuestPanelHTML } from './QuestTracker.js';
import { getStashSize } from './EquipmentStash.js';

// 需要从 main.js 注入的共享状态
let _ctx = {};

/**
 * 注入面板所需的共享上下文
 * @param {object} context - { renderer, bestiary, _ctx.combatHistory, getChapter, getFloorIndex, getEntities, loreTracker, milestoneTracker }
 */
export function initPanelContext(context) {
  _ctx = context;
}

function _renderer() { return _ctx.renderer; }
function _bestiary() { return _ctx.bestiary; }
function _combatHistory() { return _ctx.combatHistory || []; }
function _chapter() { return typeof _ctx.getChapter === 'function' ? _ctx.getChapter() : _ctx.chapter; }
function _floorIndex() { return typeof _ctx.getFloorIndex === 'function' ? _ctx.getFloorIndex() : _ctx.currentFloorIndex; }
function _entities() { return typeof _ctx.getEntities === 'function' ? _ctx.getEntities() : _ctx.entities || []; }
function _loreTracker() { return _ctx.loreTracker; }

// ── 背包/状态面板 ──
export function showInventoryPanel() {
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
              <tr><td>等级</td><td style="text-align: right; color: #ffcc44;">Lv.${p.level} <span style="color:#888;font-size:11px;">(${p.exp}/${p.expToNext} EXP)</span></td></tr>
          <tr><td style="color: #44ccff;">S</td><td>游戏统计</td></tr>
          <tr><td style="color: #44cccc;">Tab</td><td>迷你地图</td></tr>
              <tr><td>❤ 生命</td><td style="text-align: right; color: #44cc44;">${p.hp} / ${p.maxHp}</td></tr>
              <tr><td>⚔ 攻击</td><td style="text-align: right; color: #ff8866;">
                <span style="color:#ffcc44;font-weight:bold;">${getEffectiveAtk(p)}</span>
                <span style="color:#665533;font-size:11px;">(${p.atk}${p.weapon ? '+' + (p.weapon.atk||0) : ''}${p.chips.filter(c=>c.stat==='atk').reduce((s,c)=>s+c.value,0) > 0 ? '+' + p.chips.filter(c=>c.stat==='atk').reduce((s,c)=>s+c.value,0) : ''})</span>
              </td></tr>
              <tr><td>🛡 防御</td><td style="text-align: right; color: #6688ff;">
                <span style="color:#88aaff;font-weight:bold;">${getEffectiveDef(p)}</span>
                <span style="color:#334466;font-size:11px;">(${p.def}${p.armor ? '+' + (p.armor.def||0) : ''}${p.chips.filter(c=>c.stat==='def').reduce((s,c)=>s+c.value,0) > 0 ? '+' + p.chips.filter(c=>c.stat==='def').reduce((s,c)=>s+c.value,0) : ''})</span>
              </td></tr>
              <tr><td>💨 速度</td><td style="text-align: right; color: #44ffaa;">${getEffectiveSpd(p)}</td></tr>
              <tr><td>✦ 暴击</td><td style="text-align: right; color: #ffcc44;">
                <span style="font-weight:bold;">${getEffectiveCrt(p)}%</span>
                ${p.accessory?.crt ? '<span style="color:#555;font-size:11px;">(+' + p.accessory.crt + ')</span>' : ''}
              </td></tr>
              <tr><td>🔑 钥匙</td><td style="text-align: right;">黄${p.keys.yellow} 蓝${p.keys.blue} 红${p.keys.red}</td></tr>
              ${p.maxMana > 0 ? '<tr><td>✦ 法力</td><td style="text-align: right; color: #88aaff;">' + (p.mana||0) + '/' + p.maxMana + '</td></tr>' : ''}
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
              🩸 血统: <span style="color: #ff4488">${(() => {
                const bm = { vampire: '血族 · ATK+15% 吸血', ancient_wu: '古武 · ATK+20%', martial: '武修 · DEF+20% 反伤', daoist: '道法 · 法术攻击' };
                return bm[p.activeBloodline] || '未觉醒';
              })()}</span><br>
              🧬 基因锁: <span style="color: #ff6600">${p.geneLock > 0 ? p.geneLock + '阶' + (p.geneLockActive ? ' ●激活' : ' ○待机') : '未开启'}</span>
            </p>

            ${(() => {
              const glProg = getGeneLockProgress(p);
              const glDesc = getGeneLockDescription(glProg.currentStage);
              const skills = getAvailableSkills(p);
              return '<div style="margin-top: 12px;">' +
                (glProg.nextThreshold ? '<div style="margin-bottom: 8px;"><div style="display:flex;justify-content:space-between;color:#888;font-size:11px;margin-bottom:3px;"><span>基因锁充能</span><span>' + glProg.charge + '/' + glProg.nextThreshold + ' (' + glProg.progressPercent + '%)</span></div><div style="background:#1a1a2a;border-radius:3px;height:6px;overflow:hidden;"><div style="background:linear-gradient(90deg,#ff6600,#ff8800);width:' + Math.min(100,glProg.progressPercent) + '%;height:100%;border-radius:3px;"></div></div></div>' : '') +
                '<p style="color:#888;font-size:12px;font-style:italic;margin-bottom:8px;">' + glDesc + '</p>' +
                (skills.length > 0 ? '<h4 style="color:#ff8800;margin-bottom:6px;font-size:13px;">⚔ 已解锁技能</h4>' +
                  skills.map(s => '<p style="color:#ccc;font-size:12px;margin-bottom:3px;">• <span style="color:#ffaa44;">' + s.name + '</span> <span style="color:#666;">— ' + (s.description || s.desc || '') + (s.manaCost ? ' [' + s.manaCost + '法力]' : '') + ' CD' + s.cooldown + '回合</span></p>').join('') : '<p style="color:#555;font-size:12px;">开启基因锁或觉醒血统后将解锁技能</p>') +
              '</div>';
            })()}
            <p style="display:none">
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

            <h3 style="color: #44ff88; margin-top: 16px; margin-bottom: 8px;">队友与羁绊</h3>
            ${gameState.companions.map(c => {
              const bonusMap = { zhang_jie:'ATK+2', zhan_lan:'CRT+3', li_xiaoyi:'ATK+1 DEF+1', mou_gang:'DEF+3', chuxuan:'SPD+3', lingdian:'ATK+3 CRT+5', bawang:'ATK+2 DEF+2', lishuaixi:'ATK+1' };
              const bonus = bonusMap[c.id] || '';
              const relVal = gameState.relationships[c.id] || 0;
              const relLevel = typeof getRelationshipLevel === 'function' ? getRelationshipLevel(relVal) : { name: '中立', color: '#888' };
              const profile = typeof COMPANION_PROFILES !== 'undefined' ? COMPANION_PROFILES[c.id] : null;
              const quote = profile?.quote || '';
              const isBond = relVal >= 71;
              const memoir = isBond && profile?.memoir ? profile.memoir : '';
              return '<div style="margin-bottom:6px;padding:6px 8px;background:rgba(255,255,255,0.02);border-left:2px solid ' + (c.alive ? relLevel.color : '#333') + ';border-radius:0 4px 4px 0;">' +
                '<div style="display:flex;justify-content:space-between;align-items:center;">' +
                '<span style="color:' + (c.alive ? '#ccc' : '#664444') + ';font-size:13px;">' + (c.alive ? '●' : '✝') + ' ' + c.name + ' · ' + c.role + '</span>' +
                '<span style="color:' + relLevel.color + ';font-size:11px;">' + relLevel.name + ' (' + relVal + ')' + (isBond ? ' ✦' : '') + '</span>' +
                '</div>' +
                (c.alive && bonus ? '<span style="color:#44ff88;font-size:10px;">' + bonus + '</span>' : '') +
                (c.alive ? '' : ' <span style="color:#664444;font-size:10px;">（阵亡）</span>') +
                (isBond ? '<div style="margin-top:4px;padding:4px 6px;background:rgba(255,170,0,0.08);border:1px solid rgba(255,170,0,0.2);border-radius:4px;"><span style="color:#ffaa00;font-size:10px;">✦ 羁绊回忆</span><p style="color:#aa8844;font-size:10px;font-style:italic;margin-top:2px;line-height:1.4;">' + memoir + '</p></div>' : '') +
                (!isBond && quote ? '<p style="color:#555;font-size:10px;font-style:italic;margin-top:2px;">' + quote + '</p>' : '') +
              '</div>';
            }).join('')}
          </div>
        </div>


        <!-- 天赋树 + 装备 + 元素 -->
        <div style="margin-top: 20px; border-top: 1px solid #333; padding-top: 16px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div>
              <h3 style="color: #ffdd44; margin-bottom: 10px;">🌟 天赋 <span style="color:#888;font-size:11px;">(点数: ${gameState.talents.points})</span></h3>
              ${Object.entries(TALENT_PATHS).map(([id, path]) => {
                const alloc = gameState.talents.allocated[id] || 0;
                return '<div style="margin-bottom:6px;"><span style="color:' + path.color + ';font-size:12px;">' + path.icon + ' ' + path.name + ': ' + alloc + '/10</span> <div style="background:#1a1a2a;border-radius:3px;height:4px;overflow:hidden;display:inline-block;width:80px;vertical-align:middle;"><div style="background:' + path.color + ';width:' + (alloc*10) + '%;height:100%;"></div></div></div>';
              }).join('')}
              ${(() => {
                const fx = getTalentEffects(gameState.talents);
                const active = [
                  fx.atk > 0 ? 'ATK+'+fx.atk : '',
                  fx.def > 0 ? 'DEF+'+fx.def : '',
                  fx.spd > 0 ? 'SPD+'+fx.spd : '',
                  fx.crt > 0 ? 'CRT+'+fx.crt+'%' : '',
                  fx.maxHp > 0 ? 'HP+'+fx.maxHp : '',
                  fx.dodgeChance > 0 ? '闪避'+Math.floor(fx.dodgeChance*100)+'%' : '',
                  fx.blockChance > 0 ? '格挡'+Math.floor(fx.blockChance*100)+'%' : '',
                  fx.deathSave ? '重生' : '',
                ].filter(Boolean);
                return active.length > 0 ? '<p style="color:#aaa;font-size:11px;margin-top:4px;">加成: ' + active.join(' | ') + '</p>' : '';
              })()}
            </div>
            <div>
              <h3 style="color: #ff6644; margin-bottom: 10px;">🔨 装备强化</h3>
              ${[['⚔ 武器', p.weapon], ['🛡 护甲', p.armor], ['💍 饰品', p.accessory]].map(([label, item]) => {
                if (!item) return '<p style="color:#555;font-size:12px;">' + label + ': 无</p>';
                const dn = typeof getEquipmentDisplayName === 'function' ? getEquipmentDisplayName(item) : item.name;
                return '<p style="color:#ccc;font-size:12px;">' + label + ': <span style="color:#ffaa44;">' + dn + '</span></p>';
              }).join('')}
              ${(() => {
                const elems = typeof getPlayerActiveElements === 'function' ? getPlayerActiveElements(p) : [];
                if (elems.length === 0) return '';
                const elemStr = elems.map(e => { const info = ELEMENT_INFO[e]; return info ? '<span style="color:' + info.color + ';">' + info.icon + info.name + '</span>' : e; }).join(' ');
                const resonances = typeof checkElementalResonance === 'function' ? checkElementalResonance(elems) : [];
                const resStr = resonances.length > 0 ? '<br><span style="color:#ffcc44;font-size:11px;">共鸣: ' + resonances.map(r => r.icon + r.name).join(' ') + '</span>' : '';
                return '<div style="margin-top:8px;"><span style="color:#888;font-size:11px;">元素: </span>' + elemStr + resStr + '</div>';
              })()}
              ${(() => {
                const gems = gameState.gemInventory || [];
                return gems.length > 0 ? '<p style="color:#aa88ff;font-size:11px;margin-top:6px;">💎 宝石库: ' + gems.length + '个</p>' : '';
              })()}
            </div>
          </div>
        </div>


        <!-- 背包 -->
        <div style="margin-top: 16px; border-top: 1px solid #333; padding-top: 12px;">
          <h3 style="color: #ffcc44; margin-bottom: 10px;">📦 背包 (${(p.inventory||[]).length}/${p.maxInventory||20})</h3>
          <div id="inv-items-container" style="max-height: 150px; overflow-y: auto;"></div>
        </div>

        <div style="margin-top: 16px; border-top: 1px solid #333; padding-top: 12px;">
          <h3 style="color: #ffaa00; margin-bottom: 10px;">🏆 成就 (${_ctx.milestoneTracker.getUnlockedCount()}/${_ctx.milestoneTracker.getTotalCount()})</h3>
          <div style="display: flex; flex-wrap: wrap; gap: 4px;">
            ${Object.entries(MILESTONES).map(([id, ms]) => {
              const unlocked = _ctx.milestoneTracker.unlocked.has(id);
              return '<div style="padding:3px 8px;border-radius:4px;font-size:10px;' +
                (unlocked 
                  ? 'background:rgba(255,170,0,0.1);border:1px solid ' + ms.color + '33;color:' + ms.color 
                  : 'background:rgba(30,30,40,0.5);border:1px solid #222;color:#444') +
                ';" title="' + ms.desc + '">' +
                ms.icon + ' ' + ms.name +
              '</div>';
            }).join('')}
          </div>
        </div>


        
        <!-- 周目信息 -->
        ${formatCycleInfo()}

<!-- 线索收集 -->
        <div style="margin-top: 20px; border-top: 1px solid #333; padding-top: 16px;">
          <h3 style="color: #ffcc44; margin-bottom: 10px;">📖 环境线索 <span style="color:#888;font-size:11px;">(${_ctx.loreTracker.getDiscoveredCount()}/${_ctx.loreTracker.getTotalCount()})</span></h3>
          ${(() => {
            const discovered = _ctx.loreTracker.getDiscoveredCount();
            const total = _ctx.loreTracker.getTotalCount();
            const pct = total > 0 ? Math.floor(discovered / total * 100) : 0;
            const chapters = [1,2,3,4,5,7,10,12];
            let html = '<div style="margin-bottom:8px;"><div style="background:#1a1a2a;border-radius:3px;height:6px;overflow:hidden;"><div style="background:linear-gradient(90deg,#ffcc44,#ff8800);width:' + pct + '%;height:100%;border-radius:3px;"></div></div><p style="color:#666;font-size:10px;text-align:right;margin-top:2px;">' + pct + '% 收集</p></div>';
            html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;">';
            for (const ch of chapters) {
              const found = _ctx.loreTracker.getDiscoveredByChapter(ch);
              const chTotal = Object.entries(LORE_ENTRIES).filter(([,e]) => e.chapter === ch).length;
              const chLabel = '第' + ch + '章';
              if (found.length > 0) {
                html += found.map(f => '<div style="padding:4px 8px;background:rgba(255,204,68,0.08);border:1px solid rgba(255,204,68,0.2);border-radius:4px;"><span style="font-size:12px;">' + (f.icon||'📖') + '</span> <span style="color:#ddc866;font-size:11px;">' + f.title + '</span><p style="color:#776633;font-size:10px;margin-top:2px;">' + chLabel + '</p></div>').join('');
              } else if (chTotal > 0) {
                html += '<div style="padding:4px 8px;background:rgba(255,255,255,0.02);border:1px solid #333;border-radius:4px;"><span style="color:#555;font-size:11px;">❓ ' + chLabel + ' — 未发现</span></div>';
              }
            }
            html += '</div>';
            return html;
          })()}
        </div>

        <!-- 消耗品背包 -->
        <div style="margin-top: 20px;">
          <h3 style="color: #44cc88; margin-bottom: 10px;">📦 消耗品</h3>
          <div id="consumables-list" style="max-height:180px;overflow-y:auto;">
            ${(() => {
              const items = getInventoryList();
              if (items.length === 0) return '<p style="color:#555;text-align:center;font-size:12px;">无可用道具</p>';
              return items.map(item => 
                '<div style="display:flex;justify-content:space-between;align-items:center;' +
                'background:rgba(255,255,255,0.03);border:1px solid #33333380;' +
                'border-radius:6px;padding:6px 10px;margin-bottom:3px;">' +
                '<div>' +
                '<span style="font-size:13px;">' + item.icon + '</span> ' +
                '<span style="color:#ddd;font-size:12px;">' + item.name + '</span>' +
                '<span style="color:#888;font-size:10px;margin-left:4px;">×' + item.count + '</span>' +
                '<span style="color:#555;font-size:10px;margin-left:6px;">' + item.desc + '</span>' +
                '</div>' +
                '<button class="inv-use-consumable" data-cid="' + item.id + '" style="' +
                'background:rgba(68,204,136,0.12);border:1px solid #44cc88;' +
                'color:#44cc88;padding:3px 10px;cursor:pointer;font-size:11px;' +
                'border-radius:4px;font-family:inherit;">使用</button>' +
                '</div>'
              ).join('');
            })()}
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

  // ── 背包物品管理 ──
  function renderInventoryItems() {
    const inv = document.getElementById('inv-items-container');
    if (!inv) return;
    const items = p.inventory || [];
    if (items.length === 0) {
      inv.innerHTML = '<p style="color:#555;text-align:center;">背包为空</p>';
      return;
    }
    inv.innerHTML = items.map((item, idx) => {
      if (item.type === 'consumable') {
        return `<div class="inv-item" data-idx="${idx}" style="display:flex;justify-content:space-between;align-items:center;background:rgba(255,255,255,0.03);border:1px solid #444;border-radius:8px;padding:8px 12px;margin-bottom:4px;cursor:pointer;">
          <span style="color:#ccc;font-size:13px;">📦 ${item.name}</span>
          <span style="color:#888;font-size:11px;">${item.desc || ''}</span>
          <button class="btn-use-item" data-idx="${idx}" style="background:#44cc44;border:none;color:#000;padding:4px 10px;border-radius:4px;font-size:11px;cursor:pointer;">使用</button>
        </div>`;
      } else if (item.type === 'equipment') {
        const e = item.equipment;
        const stats = [];
        if (e.atk) stats.push('ATK+'+e.atk);
        if (e.def) stats.push('DEF+'+e.def);
        if (e.spd) stats.push('SPD+'+e.spd);
        if (e.crt) stats.push('CRT+'+e.crt);
        return `<div class="inv-item" data-idx="${idx}" style="display:flex;justify-content:space-between;align-items:center;background:rgba(255,255,255,0.03);border:1px solid ${e.rarityColor||'#444'};border-radius:8px;padding:8px 12px;margin-bottom:4px;">
          <span style="color:${e.rarityColor||'#ccc'};font-size:13px;">⚔ ${e.name} <span style="color:#888;font-size:11px;">(${stats.join(', ')})</span></span>
          <button class="btn-equip-item" data-idx="${idx}" data-slot="${e.slot}" style="background:#4488ff;border:none;color:#fff;padding:4px 10px;border-radius:4px;font-size:11px;cursor:pointer;">装备</button>
        </div>`;
      }
      return '';
    }).join('');
    
    // 使用消耗品
    inv.querySelectorAll('.btn-use-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.idx);
        const item = p.inventory[idx];
        if (!item) return;
        if (item.effect?.healPercent) {
          const heal = Math.floor(p.maxHp * item.effect.healPercent);
          p.hp = Math.min(p.maxHp, p.hp + heal);
        }
        if (item.effect?.manaRestore) {
          p.mana = Math.min(p.maxMana, (p.mana||0) + item.effect.manaRestore);
        }
        p.inventory.splice(idx, 1);
        renderInventoryItems();
      });
    });
    
    // 装备
    inv.querySelectorAll('.btn-equip-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.idx);
        const item = p.inventory[idx];
        if (!item?.equipment) return;
        const slot = item.equipment.slot;
        // 如果已有装备，放回背包
        if (p[slot]) {
          p.inventory.push({ type: 'equipment', equipment: p[slot] });
        }
        p[slot] = item.equipment;
        p.inventory.splice(idx, 1);
        renderInventoryItems();
      });
    });
  }

  // 初始化背包视图
  const invContainer = document.getElementById('inv-items-container');
  if (invContainer) renderInventoryItems();

  const close = () => {
    overlay.innerHTML = '';
    gameState.setState(GAME_STATE.EXPLORING);
  };
  document.getElementById('btn-close-inv').addEventListener('click', close);
  document.getElementById('inv-backdrop').addEventListener('click', (e) => {
    if (e.target.id === 'inv-backdrop') close();
  });
  
  // 消耗品使用按钮
  document.querySelectorAll('.inv-use-consumable').forEach(btn => {
    btn.addEventListener('click', () => {
      const cid = btn.dataset.cid;
      const result = useConsumable(cid);
      if (result.success) {
        // 刷新消耗品列表
        const listEl = document.getElementById('consumables-list');
        if (listEl) {
          const items = getInventoryList();
          if (items.length === 0) {
            listEl.innerHTML = '<p style="color:#555;text-align:center;font-size:12px;">无可用道具</p>';
          } else {
            listEl.innerHTML = items.map(item => 
              '<div style="display:flex;justify-content:space-between;align-items:center;' +
              'background:rgba(255,255,255,0.03);border:1px solid #33333380;' +
              'border-radius:6px;padding:6px 10px;margin-bottom:3px;">' +
              '<div>' +
              '<span style="font-size:13px;">' + item.icon + '</span> ' +
              '<span style="color:#ddd;font-size:12px;">' + item.name + '</span>' +
              '<span style="color:#888;font-size:10px;margin-left:4px;">×' + item.count + '</span>' +
              '</div>' +
              '<button class="inv-use-consumable" data-cid="' + item.id + '" style="' +
              'background:rgba(68,204,136,0.12);border:1px solid #44cc88;' +
              'color:#44cc88;padding:3px 10px;cursor:pointer;font-size:11px;' +
              'border-radius:4px;font-family:inherit;">使用</button>' +
              '</div>'
            ).join('');
            // 重新绑定事件
            listEl.querySelectorAll('.inv-use-consumable').forEach(b2 => {
              b2.addEventListener('click', () => btn.click()); // Delegate up
            });
          }
        }
      }
    });
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

// ── 游戏统计面板 ──
export function showStatsPanel() {
  if (gameState.state !== GAME_STATE.EXPLORING) return;
  gameState.setState(GAME_STATE.INVENTORY);
  const overlay = document.getElementById('ui-overlay');
  const s = gameState.stats;
  const playMs = (s.totalPlayTime || 0) + (Date.now() - (s.startTime || Date.now()));
  const playMin = Math.floor(playMs / 60000);
  const playSec = Math.floor((playMs % 60000) / 1000);

  overlay.innerHTML = `
    <div style="
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      display: flex; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.8);
    " id="stats-backdrop">
      <div style="
        background: rgba(10,10,20,0.97); border: 1px solid #444; border-radius: 16px;
        padding: 30px; max-width: 700px; width: 90%; max-height: 80vh; overflow-y: auto;
      ">
        <h2 style="color: #44ccff; text-align: center; letter-spacing: 4px; margin-bottom: 20px;">
          📊 轮回统计
        </h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div style="background:rgba(255,255,255,0.03);border:1px solid #333;border-radius:8px;padding:12px;">
            <h3 style="color:#ff8866;font-size:13px;margin-bottom:8px;">⚔ 战斗</h3>
            <table style="width:100%;color:#aaa;font-size:12px;line-height:2;">
              <tr><td>击杀总数</td><td style="text-align:right;color:#ff8866;">${s.enemiesKilled}</td></tr>
              <tr><td>Boss击杀</td><td style="text-align:right;color:#ff4444;">${s.bossesKilled || 0}</td></tr>
              <tr><td>总伤害</td><td style="text-align:right;color:#ffaa44;">${s.damageDealt}</td></tr>
              <tr><td>最高单击</td><td style="text-align:right;color:#ffcc44;">${s.maxSingleHit || 0}</td></tr>
              <tr><td>暴击次数</td><td style="text-align:right;color:#ff8844;">${s.criticalHits || 0}</td></tr>
              <tr><td>受到伤害</td><td style="text-align:right;color:#cc4444;">${s.damageTaken}</td></tr>
              <tr><td>死亡次数</td><td style="text-align:right;color:#ff2222;">${s.deathCount}</td></tr>
            </table>
          </div>
          <div style="background:rgba(255,255,255,0.03);border:1px solid #333;border-radius:8px;padding:12px;">
            <h3 style="color:#44ff88;font-size:13px;margin-bottom:8px;">🗺 探索</h3>
            <table style="width:100%;color:#aaa;font-size:12px;line-height:2;">
              <tr><td>步数</td><td style="text-align:right;color:#44ffaa;">${s.stepsWalked || 0}</td></tr>
              <tr><td>层数</td><td style="text-align:right;color:#44aaff;">${s.floorsCleared || 0}</td></tr>
              <tr><td>章数</td><td style="text-align:right;color:#44ccff;">${s.chaptersCleared || 0}</td></tr>
              <tr><td>线索</td><td style="text-align:right;color:#ffcc44;">${s.loreFound || 0}</td></tr>
              <tr><td>宝箱开启</td><td style="text-align:right;color:#ffaa44;">${s.chestsOpened || 0}</td></tr>
              <tr><td>密道发现</td><td style="text-align:right;color:#ffd700;">${s.secretsFound || 0}</td></tr>
              <tr><td>陷阱触发</td><td style="text-align:right;color:#ff6644;">${s.trapsTriggered || 0}</td></tr>
              <tr><td>陷阱闪避</td><td style="text-align:right;color:#44ff88;">${s.trapsEvaded || 0}</td></tr>
              <tr><td>回合数</td><td style="text-align:right;color:#888;">${s.turnsPlayed}</td></tr>
              <tr><td>游戏时间</td><td style="text-align:right;color:#888;">${playMin}分${playSec}秒</td></tr>
            </table>
          </div>
          <div style="background:rgba(255,255,255,0.03);border:1px solid #333;border-radius:8px;padding:12px;">
            <h3 style="color:#ffcc44;font-size:13px;margin-bottom:8px;">💰 经济</h3>
            <table style="width:100%;color:#aaa;font-size:12px;line-height:2;">
              <tr><td>金币获得</td><td style="text-align:right;color:#ffcc44;">${s.goldEarned || 0}G</td></tr>
              <tr><td>奖励点消费</td><td style="text-align:right;color:#cc8844;">${s.goldSpent || 0}RP</td></tr>
              <tr><td>物品使用</td><td style="text-align:right;color:#aaa;">${s.itemsUsed}</td></tr>
              <tr><td>消耗品</td><td style="text-align:right;color:#44cc88;">${s.consumablesUsed || 0}</td></tr>
              <tr><td>技能使用</td><td style="text-align:right;color:#aa88ff;">${s.skillsUsed || 0}</td></tr>
            </table>
          </div>
          <div style="background:rgba(255,255,255,0.03);border:1px solid #333;border-radius:8px;padding:12px;">
            <h3 style="color:#aa88ff;font-size:13px;margin-bottom:8px;">🏆 效率</h3>
            <table style="width:100%;color:#aaa;font-size:12px;line-height:2;">
              <tr><td>每步伤害</td><td style="text-align:right;color:#ffaa44;">${s.stepsWalked > 0 ? (s.damageDealt / s.stepsWalked).toFixed(1) : '0'}</td></tr>
              <tr><td>击杀/死亡</td><td style="text-align:right;color:#ff8866;">${s.deathCount > 0 ? (s.enemiesKilled / s.deathCount).toFixed(1) : '∞'}</td></tr>
              <tr><td>伤害效率</td><td style="text-align:right;color:#44ff88;">${s.damageTaken > 0 ? (s.damageDealt / s.damageTaken).toFixed(1) + ':1' : '∞'}</td></tr>
            </table>
          </div>
        </div>

        <!-- 套装效果 -->
        <div style="margin-top:12px;border-top:1px solid #333;padding-top:10px;">
          <h3 style="color:#ffcc44;font-size:13px;margin-bottom:6px;">🛡 套装效果</h3>
          \${formatSetBonusHTML(gameState.player)}
        </div>
        
        <!-- 当前任务 -->
        <div style="margin-top:12px;border-top:1px solid #333;padding-top:10px;">
          \${formatQuestPanelHTML()}
        </div>

        <div style="text-align: center; margin-top: 24px;">
          <button id="btn-close-stats" style="
            background: transparent; border: 1px solid #444; color: #888;
            padding: 8px 30px; cursor: pointer; font-size: 14px; font-family: inherit;
            border-radius: 6px;
          ">关闭 (S)</button>
        </div>
      </div>
    </div>
  `;

  const close = () => {
    overlay.innerHTML = '';
    gameState.setState(GAME_STATE.EXPLORING);
  };
  document.getElementById('btn-close-stats').addEventListener('click', close);
  document.getElementById('stats-backdrop').addEventListener('click', (e) => {
    if (e.target.id === 'stats-backdrop') close();
  });
  const kh = (e) => {
    if (e.key === 's' || e.key === 'Escape') { close(); document.removeEventListener('keydown', kh); }
  };
  document.addEventListener('keydown', kh);
}

// ── 怪物图鉴面板 ──
export function showBestiaryPanel() {
  if (gameState.state !== GAME_STATE.EXPLORING) return;
  gameState.setState(GAME_STATE.INVENTORY);
  const overlay = document.getElementById('ui-overlay');
  const diffCfg = getDifficultyConfig();

  overlay.innerHTML = `
    <div style="
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      display: flex; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.8);
    " id="bestiary-backdrop">
      <div style="
        background: rgba(10,10,20,0.97); border: 1px solid #444; border-radius: 16px;
        padding: 30px; max-width: 700px; width: 90%; max-height: 80vh; overflow-y: auto;
      ">
        <h2 style="color: #ff8866; text-align: center; letter-spacing: 4px; margin-bottom: 8px;">
          📖 怪物图鉴
        </h2>
        <p style="color: #666; text-align: center; font-size: 11px; margin-bottom: 16px;">
          已发现 ${_ctx.bestiary.getDiscoveredCount()} 种怪物 · 
          当前难度: <span style="color:${diffCfg.color};">${diffCfg.icon} ${diffCfg.name}</span>
        </p>
        ${formatBestiaryPanel()}
        <div style="text-align: center; margin-top: 24px;">
          <button id="btn-close-bestiary" style="
            background: transparent; border: 1px solid #444; color: #888;
            padding: 8px 30px; cursor: pointer; font-size: 14px; font-family: inherit;
            border-radius: 6px;
          ">关闭 (B)</button>
        </div>
      </div>
    </div>
  `;

  const close = () => {
    overlay.innerHTML = '';
    gameState.setState(GAME_STATE.EXPLORING);
  };
  document.getElementById('btn-close-bestiary').addEventListener('click', close);
  document.getElementById('bestiary-backdrop').addEventListener('click', (e) => {
    if (e.target.id === 'bestiary-backdrop') close();
  });
  const kh = (e) => {
    if (e.key === 'b' || e.key === 'Escape') { close(); document.removeEventListener('keydown', kh); }
  };
  document.addEventListener('keydown', kh);
}

// ── 同伴关系面板 ──
export function showRelationshipPanel() {
  if (gameState.state !== GAME_STATE.EXPLORING) return;
  gameState.setState(GAME_STATE.INVENTORY);
  const overlay = document.getElementById('ui-overlay');
  const companions = gameState.companions || [];

  let companionHTML = '';
  if (companions.length === 0) {
    companionHTML = '<p style="color:#666;text-align:center;">尚无同伴</p>';
  } else {
    for (const c of companions) {
      const relVal = gameState.relationships[c.id] || 0;
      const relLevel = getRelationshipLevel(relVal);
      const profile = COMPANION_PROFILES[c.id];
      const isBond = relVal >= 71;
      const barWidth = Math.max(0, (relVal + 100) / 200 * 100);
      
      companionHTML += '<div style="margin-bottom:12px;padding:10px 12px;background:rgba(255,255,255,0.02);border-left:3px solid ' + (c.alive ? relLevel.color : '#333') + ';border-radius:0 8px 8px 0;">';
      companionHTML += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">';
      companionHTML += '<span style="color:' + (c.alive ? '#e0e0e0' : '#664444') + ';font-size:14px;font-weight:bold;">';
      companionHTML += (c.alive ? '●' : '✝') + ' ' + c.name;
      if (profile?.title) companionHTML += ' <span style="color:#888;font-size:11px;">· ' + profile.title + '</span>';
      companionHTML += '</span>';
      companionHTML += '<span style="color:' + relLevel.color + ';font-size:13px;font-weight:bold;">' + relLevel.name + ' (' + relVal + ')' + (isBond ? ' ✦' : '') + '</span>';
      companionHTML += '</div>';
      // Bar
      companionHTML += '<div style="height:4px;background:#222;border-radius:2px;margin-bottom:6px;">';
      companionHTML += '<div style="height:100%;width:' + barWidth + '%;background:' + relLevel.color + ';border-radius:2px;"></div></div>';
      // Combat bonus
      companionHTML += '<span style="color:#888;font-size:10px;">战斗加成: ' + (relLevel.combatBonus > 0 ? '+' : '') + Math.floor(relLevel.combatBonus * 100) + '%</span>';
      if (!c.alive) companionHTML += ' <span style="color:#664444;font-size:10px;">（阵亡）</span>';
      // Personality
      if (profile?.personality) companionHTML += '<p style="color:#777;font-size:10px;margin:4px 0 0 0;">性格: ' + profile.personality + '</p>';
      // Quote
      if (profile?.quote) companionHTML += '<p style="color:#555;font-size:10px;font-style:italic;margin:2px 0 0 0;">' + profile.quote + '</p>';
      // Bond memoir
      if (isBond && profile?.memoir) {
        companionHTML += '<div style="margin-top:6px;padding:6px 8px;background:rgba(255,170,0,0.06);border:1px solid rgba(255,170,0,0.15);border-radius:4px;">';
        companionHTML += '<span style="color:#ffaa00;font-size:10px;">✦ 羁绊回忆</span>';
        companionHTML += '<p style="color:#aa8844;font-size:10px;font-style:italic;margin-top:2px;line-height:1.5;">' + profile.memoir + '</p></div>';
      }
      companionHTML += '</div>';
    }
  }

  overlay.innerHTML = '<div style="position:absolute;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.85);" id="rel-backdrop">' +
    '<div style="background:rgba(10,10,20,0.97);border:1px solid #444;border-radius:16px;padding:30px;max-width:650px;width:90%;max-height:80vh;overflow-y:auto;">' +
    '<h2 style="color:#ffaa00;text-align:center;letter-spacing:4px;margin-bottom:20px;">✦ 同伴关系</h2>' +
    '<p style="color:#666;text-align:center;font-size:11px;margin-bottom:16px;">关系影响: 战斗加成 · 对话台词 · 羁绊回忆 · 危难救援 · 团队士气</p>' +
    companionHTML +
    '<div style="text-align:center;margin-top:20px;">' +
    '<div style="margin-top:16px;border-top:1px solid #333;padding-top:12px;">' +
    '<h3 style="color:#44aaff;font-size:14px;margin-bottom:8px;">⚔ 同伴战斗支援</h3>' +
    formatCompanionCombatHTML() +
    '</div>' +
    '<div style="text-align:center;margin-top:16px;">' +
    '<button id="btn-close-rel" style="background:transparent;border:1px solid #444;color:#888;padding:8px 30px;cursor:pointer;font-size:14px;font-family:inherit;border-radius:6px;">关闭 (R)</button>' +
    '</div></div></div>';

  const close = () => { overlay.innerHTML = ''; gameState.setState(GAME_STATE.EXPLORING); };
  document.getElementById('btn-close-rel').addEventListener('click', close);
  document.getElementById('rel-backdrop').addEventListener('click', (e) => {
    if (e.target.id === 'rel-backdrop') close();
  });
  const kh = (e) => {
    if (e.key === 'r' || e.key === 'Escape') { close(); document.removeEventListener('keydown', kh); }
  };
  document.addEventListener('keydown', kh);
}

// ── 帮助面板 ──
export function showHelpPanel() {
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
          <tr><td style="color: #ff8866;">B</td><td>装备仓库</td></tr>
          <tr><td style="color: #ffcc44;">H / ?</td><td>帮助</td></tr>
          <tr><td style="color: #ff6644;">N</td><td>怪物图鉴</td></tr>
          <tr><td style="color: #4488ff;">T</td><td>战斗统计</td></tr>
          <tr><td style="color: #44ff88;">鼠标悬停</td><td>查看敌人/物品详情</td></tr>
          <tr><td style="color: #ff8866;">L</td><td>战斗日志回顾</td></tr>
          <tr><td style="color: #ffcc44;">J</td><td>成就面板</td></tr>
          <tr><td style="color: #ddaa44;">C</td><td>知识典籍</td></tr>
          <tr><td style="color: #44ccaa;">V</td><td>迷雾开关</td></tr>
          <tr><td style="color: #44ffff;">M</td><td>全地图视图</td></tr>
          <tr><td style="color: #44cc88;">Q</td><td>道具背包</td></tr>
          <tr><td style="color: #888888;">P</td><td>设置 (音量/难度/迷雾)</td></tr>
          <tr><td style="color: #44ff88;">F5</td><td>快速存档</td></tr>
          <tr><td style="color: #44aaff;">F9</td><td>快速读档</td></tr>
        </table>
        <hr style="border-color: #333; margin: 16px 0;">
        <h3 style="color: #ff4444; margin-bottom: 8px;">战斗提示</h3>
        <ul style="color: #999; font-size: 13px; line-height: 1.8; padding-left: 20px;">
          <li>碰怪前<strong style="color: #eee">先用鼠标悬停</strong>查看能否打赢</li>
          <li>显示 <span style="color: #44ff88">✓</span> 表示可以击败，<span style="color: #ff4444">✗</span> 表示打不过</li>
          <li>收集<strong style="color: #ff8866">力量晶石</strong>和<strong style="color: #6688ff">坚韧晶石</strong>提升属性</li>
          <li>战前按<strong style="color: #44cc88">Q</strong>使用增益药剂，战斗中自动生效</li>
          <li>合理使用<strong style="color: #ff4488">急救物品</strong>补充HP</li>
          <li>基因锁激活后攻防大幅提升，关键战斗前记得开启</li>
          <li>按 <strong style="color: #ff8866">L</strong> 查看战斗日志</li>
          <li>按 <strong style="color: #44ffff">M</strong> 查看全地图</li>
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

// ── 全地图视图 ──
export function showFullMap() {
  if (gameState.state !== GAME_STATE.EXPLORING) return;
  const floor = _ctx.chapter.floors[_ctx.currentFloorIndex];
  const p = gameState.player;
  const overlay = document.getElementById('ui-overlay');
  
  // Create a canvas for the map
  const mapScale = Math.min(600 / floor.width, 500 / floor.height);
  const mapW = Math.floor(floor.width * mapScale);
  const mapH = Math.floor(floor.height * mapScale);
  
  const mapCanvas = document.createElement('canvas');
  mapCanvas.width = mapW;
  mapCanvas.height = mapH;
  const mctx = mapCanvas.getContext('2d');
  
  // Draw tiles
  for (let y = 0; y < floor.height; y++) {
    for (let x = 0; x < floor.width; x++) {
      const tile = floor.tiles[y][x];
      const mx = x * mapScale;
      const my = y * mapScale;
      switch (tile) {
        case 0: mctx.fillStyle = '#000000'; break; // VOID
        case 1: mctx.fillStyle = '#2a2a3a'; break; // FLOOR
        case 2: mctx.fillStyle = '#444455'; break; // WALL
        case 3: mctx.fillStyle = '#886644'; break; // DOOR
        case 4: mctx.fillStyle = '#44ffff'; break; // STAIRS
        case 6: mctx.fillStyle = '#ff3322'; break; // LAVA
        default: mctx.fillStyle = '#1a1a28'; break;
      }
      mctx.fillRect(mx, my, mapScale, mapScale);
      // Grid lines
      mctx.strokeStyle = 'rgba(60, 60, 80, 0.3)';
      mctx.lineWidth = 0.5;
      mctx.strokeRect(mx, my, mapScale, mapScale);
    }
  }
  
  // Draw _ctx.entities
  for (const e of _ctx.entities) {
    const mx = e.x * mapScale + mapScale / 2;
    const my = e.y * mapScale + mapScale / 2;
    const r = mapScale * 0.35;
    mctx.beginPath();
    mctx.arc(mx, my, r, 0, Math.PI * 2);
    if (e.type === 'enemy' || e.type === 'boss') mctx.fillStyle = '#ff4444';
    else if (e.type === 'companion') mctx.fillStyle = '#4488ff';
    else if (e.type === 'item') mctx.fillStyle = '#ffcc44';
    else if (e.type === 'event') mctx.fillStyle = '#ffffff';
    else mctx.fillStyle = '#888888';
    mctx.fill();
  }
  
  // Draw player (blinking)
  mctx.fillStyle = '#44aaff';
  mctx.beginPath();
  mctx.arc(p.x * mapScale + mapScale / 2, p.y * mapScale + mapScale / 2, mapScale * 0.45, 0, Math.PI * 2);
  mctx.fill();
  mctx.strokeStyle = '#88ccff';
  mctx.lineWidth = 2;
  mctx.stroke();
  
  const dataUrl = mapCanvas.toDataURL();
  
  overlay.innerHTML = '<div style="' +
    'position:absolute;top:0;left:0;right:0;bottom:0;' +
    'display:flex;flex-direction:column;align-items:center;justify-content:center;' +
    'background:rgba(0,0,0,0.85);"' +
    ' id="map-backdrop">' +
    '<h2 style="color:#44ffff;letter-spacing:4px;margin-bottom:16px;font-family:Noto Serif SC,serif;">' +
    '🗺 ' + floor.id + ' ' + floor.name + '</h2>' +
    '<img src="' + dataUrl + '" style="border:2px solid #333;border-radius:8px;image-rendering:pixelated;" />' +
    '<div style="display:flex;gap:20px;margin-top:16px;font-size:12px;color:#888;">' +
    '<span>🔵 玩家</span><span style="color:#ff4444">🔴 敌人</span>' +
    '<span style="color:#4488ff">🔵 队友</span><span style="color:#ffcc44">🟡 物品</span>' +
    '<span style="color:#44ffff">⬜ 楼梯</span>' +
    '</div>' +
    '<button id="btn-close-map" style="' +
    'margin-top:16px;background:transparent;border:1px solid #444;color:#888;' +
    'padding:8px 30px;cursor:pointer;font-size:14px;font-family:inherit;border-radius:6px;">' +
    '关闭 (M)</button>' +
    '</div>';

  const close = () => { overlay.innerHTML = ''; };
  document.getElementById('btn-close-map').addEventListener('click', close);
  document.getElementById('map-backdrop').addEventListener('click', (e) => {
    if (e.target.id === 'map-backdrop') close();
  });
  const kh = (e) => {
    if (e.key === 'm' || e.key === 'Escape') { close(); document.removeEventListener('keydown', kh); }
  };
  document.addEventListener('keydown', kh);
}

// ── 战斗日志面板 ──
export function showCombatLog() {
  if (gameState.state !== GAME_STATE.EXPLORING) return;
  const overlay = document.getElementById('ui-overlay');
  
  const logs = _combatHistory().slice().reverse();
  // 战斗统计摘要
  const totalBattles = logs.length;
  const wins = logs.filter(e => e.victory).length;
  const losses = totalBattles - wins;
  const avgRounds = totalBattles > 0 ? Math.round(logs.reduce((s,e) => s + e.rounds, 0) / totalBattles) : 0;
  const sCount = logs.filter(e => e.rating?.grade === 'S').length;
  const summaryHtml = totalBattles > 0 ? `
    <div style="display:flex; gap:8px; margin-bottom:12px; justify-content:center; flex-wrap:wrap;">
      <span style="background:rgba(68,255,136,0.1); border:1px solid #44ff8830; border-radius:6px; padding:4px 12px; color:#44ff88; font-size:12px;">✓ ${wins}胜</span>
      <span style="background:rgba(255,68,68,0.1); border:1px solid #ff444430; border-radius:6px; padding:4px 12px; color:#ff4444; font-size:12px;">✗ ${losses}败</span>
      <span style="background:rgba(255,204,68,0.1); border:1px solid #ffcc4430; border-radius:6px; padding:4px 12px; color:#ffcc44; font-size:12px;">⌀ ${avgRounds}回合</span>
      ${sCount > 0 ? '<span style="background:rgba(255,221,0,0.1); border:1px solid #ffdd0030; border-radius:6px; padding:4px 12px; color:#ffdd00; font-size:12px;">⭐ ' + sCount + '个S</span>' : ''}
    </div>
  ` : '';

  const logHtml = logs.length === 0 
    ? '<p style="color: #666; text-align: center; margin: 20px;">尚无战斗记录</p>'
    : summaryHtml + logs.map((entry, i) => `
      <div style="
        background: rgba(${entry.victory ? '40,80,40' : '80,30,30'}, 0.3);
        border: 1px solid ${entry.victory ? '#44884433' : '#884444'};
        border-radius: 8px; padding: 12px; margin-bottom: 8px;
      ">
        <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
          <span style="color: ${entry.victory ? '#44ff88' : '#ff4444'}; font-weight: bold;">
            ${entry.victory ? '✓ 胜利' : '✗ 败北'} vs ${entry.enemy}
          </span>
          <span style="color: #666; font-size: 12px;">${entry.floor} · ${entry.rounds}回合${entry.rating ? ' · <span style="color:' + entry.rating.color + '">' + entry.rating.grade + '</span>' : ''}</span>
        </div>
        <div style="color: #aaa; font-size: 12px; line-height: 1.6;">
          ${entry.log.slice(-10).map(l => {
            let c = '#999';
            if (l.type === 'attack') c = '#ffcc88';
            if (l.type === 'critical') c = '#ffaa00';
            if (l.type === 'enemy_attack') c = '#ff6644';
            if (l.type === 'enemy_critical') c = '#ff3322';
            if (l.type === 'victory') c = '#44ff88';
            if (l.type === 'reward') c = '#ffcc44';
            if (l.type === 'heal') c = '#88ffaa';
            if (l.type === 'spell') c = '#cc88ff';
            if (l.type === 'skill') c = '#44ddff';
            if (l.type === 'burn') c = '#ff8833';
            if (l.type === 'poison') c = '#88ff00';
            if (l.type === 'freeze') c = '#88ccff';
            if (l.type === 'reflect') c = '#6699ff';
            if (l.type === 'buff') c = '#66ccff';
            if (l.type === 'debuff') c = '#ff8888';
            if (l.type === 'status') c = '#aa88cc';
            if (l.type === 'dodge') c = '#aaddff';
            if (l.type === 'block') c = '#88aacc';
            if (l.type === 'counter') c = '#ffaa88';
            if (l.type === 'death_save') c = '#ffdd00';
            if (l.type === 'execute') c = '#ff0000';
            const icon = { skill: '🧬', spell: '✦', burn: '🔥', poison: '☠', freeze: '❄', dodge: '💨', block: '🛡', counter: '⚡', death_save: '💀', execute: '☠' }[l.type] || '';
            return '<span style="color:' + c + '">' + icon + (icon ? ' ' : '') + l.text + '</span>';
          }).join('<br>')}
        </div>
      </div>
    `).join('');


  // 统计概要
  const totalUnlocked = unlocked.size;
  const totalMilestones = allMilestones.length;
  const pct = Math.floor(totalUnlocked / totalMilestones * 100);

  overlay.innerHTML = `
    <div style="
      position: absolute; top: 0; left: 0; right: 0; bottom: 0;
      display: flex; align-items: center; justify-content: center;
      background: rgba(0,0,0,0.85);
    " id="ach-backdrop">
      <div style="
        background: rgba(10,10,20,0.97); border: 1px solid #444; border-radius: 16px;
        padding: 24px; max-width: 650px; width: 92%; max-height: 85vh; overflow-y: auto;
      ">
        <h2 style="color: #ffcc44; text-align: center; letter-spacing: 4px; margin-bottom: 6px;">
          🏆 成就
        </h2>
        <p style="color: #888; text-align: center; font-size: 13px; margin-bottom: 16px;">
          ${totalUnlocked}/${totalMilestones} (${pct}%) · 
          战斗评级 S:${ratingStats.S} A:${ratingStats.A} B:${ratingStats.B} · 
          连杀最高: ${killStreak.best}
        </p>
        
        <div style="
          background: rgba(255,204,68,0.08); border-radius: 6px; height: 8px;
          margin-bottom: 20px; overflow: hidden;
        ">
          <div style="
            background: linear-gradient(90deg, #ffcc44, #ff8844);
            height: 100%; width: ${pct}%;
            border-radius: 6px; transition: width 0.5s;
          "></div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          ${milestoneHTML}
        </div>

        <div style="text-align: center; margin-top: 16px;">
          <button id="btn-close-ach" style="
            background: transparent; border: 1px solid #444; color: #888;
            padding: 8px 30px; cursor: pointer; font-size: 14px; font-family: inherit;
            border-radius: 6px;
          ">关闭 (J)</button>
        </div>
      </div>
    </div>
  `;

  const close = () => { overlay.innerHTML = ''; };
  document.getElementById('btn-close-ach').addEventListener('click', close);
  document.getElementById('ach-backdrop').addEventListener('click', (e) => {
    if (e.target.id === 'ach-backdrop') close();
  });
  const kh = (e) => {
    if (e.key === 'j' || e.key === 'Escape') { close(); document.removeEventListener('keydown', kh); }
  };
  document.addEventListener('keydown', kh);
}

// ── 设置面板 ──
import { audioEngine } from './AudioEngine.js';
import { fogOfWar } from './FogOfWar.js';
import { setDifficulty, DIFFICULTY } from './DifficultySystem.js';

export function showSettingsPanel() {
  if (gameState.state !== GAME_STATE.EXPLORING) return;
  gameState.setState(GAME_STATE.INVENTORY);
  const overlay = document.getElementById('ui-overlay');
  
  const currentVol = Math.round((audioEngine.masterGain?.gain?.value ?? 0.5) * 200);
  const fogEnabled = fogOfWar.enabled !== false;
  const diff = getDifficulty();
  const diffNames = { easy: '简单', normal: '普通', hard: '困难', nightmare: '噩梦' };
  
  const _render = () => {
    const vol = Math.round((audioEngine.masterGain?.gain?.value ?? 0.5) * 200);
    const fog = fogOfWar.enabled !== false;
    const d = getDifficulty();
    
    overlay.innerHTML = `
      <div style="
        position: absolute; top: 0; left: 0; right: 0; bottom: 0;
        display: flex; align-items: center; justify-content: center;
        background: rgba(0,0,0,0.8);
      " id="settings-backdrop">
        <div style="
          background: rgba(10,10,20,0.97); border: 1px solid #444; border-radius: 16px;
          padding: 30px; max-width: 420px; width: 90%;
        ">
          <h2 style="color: #888; text-align: center; letter-spacing: 4px; margin-bottom: 24px;">
            ⚙ 设置
          </h2>
          
          <!-- 音量 -->
          <div style="margin-bottom: 20px;">
            <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
              <span style="color:#aaa;font-size:13px;">🔊 音量</span>
              <span style="color:#ffcc44;font-size:13px;" id="vol-display">${vol}%</span>
            </div>
            <input type="range" id="vol-slider" min="0" max="100" value="${vol}" style="
              width:100%; accent-color:#ffcc44; cursor:pointer;
            "/>
          </div>
          
          <!-- 迷雾 -->
          <div style="margin-bottom: 20px; display:flex; justify-content:space-between; align-items:center;">
            <span style="color:#aaa;font-size:13px;">🌫 战争迷雾</span>
            <button id="fog-toggle" style="
              background:${fog ? 'rgba(68,255,136,0.15)' : 'rgba(255,68,68,0.15)'};
              border:1px solid ${fog ? '#44ff88' : '#ff4444'};
              color:${fog ? '#44ff88' : '#ff4444'};
              padding:6px 16px; cursor:pointer; font-size:12px;
              font-family:inherit; border-radius:6px;
            ">${fog ? '✓ 开启' : '✗ 关闭'}</button>
          </div>
          
          <!-- 难度 -->
          <div style="margin-bottom: 20px;">
            <span style="color:#aaa;font-size:13px;display:block;margin-bottom:8px;">⚔ 难度</span>
            <div style="display:flex;gap:8px;justify-content:center;">
              ${Object.entries(diffNames).map(([key, name]) => `
                <button class="diff-btn" data-diff="${key}" style="
                  background:${d === key ? 'rgba(255,204,68,0.15)' : 'transparent'};
                  border:1px solid ${d === key ? '#ffcc44' : '#333'};
                  color:${d === key ? '#ffcc44' : '#666'};
                  padding:6px 14px; cursor:pointer; font-size:12px;
                  font-family:inherit; border-radius:6px;
                ">${name}</button>
              `).join('')}
            </div>
          </div>
          
          <!-- 快捷键提示 -->
          <div style="background:rgba(255,255,255,0.03);border:1px solid #222;border-radius:8px;padding:10px;margin-bottom:16px;">
            <p style="color:#555;font-size:11px;text-align:center;">
              F5 存档 · F9 读档 · H 帮助 · V 迷雾 · Tab 小地图 · M 全图
            </p>
          </div>
          
          <div style="text-align: center;">
            <button id="btn-close-settings" style="
              background: transparent; border: 1px solid #444; color: #888;
              padding: 8px 30px; cursor: pointer; font-size: 14px; font-family: inherit;
              border-radius: 6px;
            ">关闭 (Esc)</button>
          </div>
        </div>
      </div>
    `;
    
    // Volume slider
    document.getElementById('vol-slider')?.addEventListener('input', (e) => {
      const v = parseInt(e.target.value) / 100;
      try { if (audioEngine.masterGain) audioEngine.masterGain.gain.value = v / 2; } catch {}
      const display = document.getElementById('vol-display');
      if (display) display.textContent = e.target.value + '%';
    });
    
    // Fog toggle
    document.getElementById('fog-toggle')?.addEventListener('click', () => {
      fogOfWar.enabled = !fogOfWar.enabled;
      _render();
    });
    
    // Difficulty buttons
    document.querySelectorAll('.diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        try { setDifficulty(btn.dataset.diff); } catch {}
        _render();
      });
    });
    
    // Close
    const close = () => {
      overlay.innerHTML = '';
      gameState.setState(GAME_STATE.EXPLORING);
    };
    document.getElementById('btn-close-settings')?.addEventListener('click', close);
    document.getElementById('settings-backdrop')?.addEventListener('click', (e) => {
      if (e.target.id === 'settings-backdrop') close();
    });
    const kh = (e) => {
      if (e.key === 'Escape' || e.key === 'p') { close(); document.removeEventListener('keydown', kh); }
    };
    document.addEventListener('keydown', kh);
  };
  
  _render();
}

// ═══════════════════════════════════════════════════════════════
// 锻造台面板 — 主神空间可用的装备制造系统
// ═══════════════════════════════════════════════════════════════
export function showForgePanel() {
  if (gameState.state !== GAME_STATE.EXPLORING && gameState.state !== GAME_STATE.LORD_GOD_SPACE) return;
  const prevState = gameState.state;
  gameState.setState(GAME_STATE.INVENTORY);
  const overlay = document.getElementById('ui-overlay');
  
  let tab = 'recipes'; // recipes | disassemble | reforge
  
  function _render() {
    const p = gameState.player;
    const fragments = p.soulFragments || 0;
    const recipes = getAvailableRecipes(gameState.chapter);
    
    const tabStyle = (t) => `
      background:${tab === t ? 'rgba(255,204,68,0.15)' : 'transparent'};
      border:1px solid ${tab === t ? '#ffcc44' : '#333'};
      color:${tab === t ? '#ffcc44' : '#666'};
      padding:8px 18px;cursor:pointer;font-size:13px;font-family:inherit;
      border-radius:6px;
    `;
    
    let contentHTML = '';
    
    if (tab === 'recipes') {
      if (recipes.length === 0) {
        contentHTML = '<p style="color:#666;text-align:center;padding:20px;">暂无可用配方。继续冒险以解锁更多。</p>';
      } else {
        contentHTML = recipes.map(r => {
          const qualityColors = { common:'#999', fine:'#44cc44', rare:'#4488ff', epic:'#aa44ff', legendary:'#ff8800' };
          const qColor = qualityColors[r.quality] || '#999';
          const canAfford = fragments >= r.cost;
          const statsStr = Object.entries(r.baseStats).map(([k,v]) => `${k.toUpperCase()}${v>0?'+':''}${v}`).join(' ');
          return `
            <div style="background:rgba(255,255,255,0.03);border:1px solid ${qColor}33;border-radius:10px;
                        padding:14px;margin-bottom:10px;position:relative;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                  <span style="color:${qColor};font-size:15px;font-weight:bold;">${r.name}</span>
                  <span style="color:#555;font-size:11px;margin-left:8px;">[${r.type === 'weapon' ? '武器' : r.type === 'armor' ? '护甲' : '饰品'}]</span>
                </div>
                <button class="forge-btn" data-recipe="${r.id}" style="
                  background:${canAfford ? 'rgba(255,204,68,0.15)' : 'rgba(100,100,100,0.1)'};
                  border:1px solid ${canAfford ? '#ffcc44' : '#333'};
                  color:${canAfford ? '#ffcc44' : '#555'};
                  padding:6px 16px;cursor:${canAfford ? 'pointer' : 'default'};
                  font-size:12px;font-family:inherit;border-radius:6px;
                  ${canAfford ? '' : 'opacity:0.5;'}
                ">锻造 (${r.cost}💎)</button>
              </div>
              <p style="color:#888;font-size:12px;margin-top:6px;">${r.description}</p>
              <p style="color:#aaa;font-size:11px;margin-top:4px;">属性: ${statsStr} · 宝石槽: ${r.maxGemSlots || 2}</p>
            </div>
          `;
        }).join('');
      }
    } else if (tab === 'disassemble') {
      const equipList = [
        p.weapon ? { ...p.weapon, slot: 'weapon', slotName: '武器' } : null,
        p.armor ? { ...p.armor, slot: 'armor', slotName: '护甲' } : null,
        p.accessory ? { ...p.accessory, slot: 'accessory', slotName: '饰品' } : null,
      ].filter(Boolean);
      
      if (equipList.length === 0) {
        contentHTML = '<p style="color:#666;text-align:center;padding:20px;">没有可分解的装备。</p>';
      } else {
        contentHTML = equipList.map(eq => {
          const preview = getDisassemblePreview(eq);
          return `
            <div style="background:rgba(255,255,255,0.03);border:1px solid #33333366;border-radius:10px;
                        padding:14px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;">
              <div>
                <span style="color:#ddd;font-size:14px;">${getEquipmentDisplayName(eq)}</span>
                <span style="color:#555;font-size:11px;margin-left:8px;">[${eq.slotName}]</span>
                <p style="color:#888;font-size:11px;margin-top:4px;">
                  预计获得: ${preview.fragments}💎 灵魂碎片${preview.returnedGems > 0 ? ` + ${preview.returnedGems}颗宝石` : ''}
                </p>
              </div>
              <button class="disasm-btn" data-slot="${eq.slot}" style="
                background:rgba(255,68,68,0.1);border:1px solid #ff444466;
                color:#ff6644;padding:6px 16px;cursor:pointer;
                font-size:12px;font-family:inherit;border-radius:6px;
              ">分解</button>
            </div>
          `;
        }).join('');
      }
    } else if (tab === 'reforge') {
      const equipList = [
        p.weapon ? { ...p.weapon, slot: 'weapon', slotName: '武器' } : null,
        p.armor ? { ...p.armor, slot: 'armor', slotName: '护甲' } : null,
        p.accessory ? { ...p.accessory, slot: 'accessory', slotName: '饰品' } : null,
      ].filter(Boolean);
      
      if (equipList.length === 0) {
        contentHTML = '<p style="color:#666;text-align:center;padding:20px;">没有可重铸的装备。</p>';
      } else {
        contentHTML = `
          <p style="color:#888;font-size:12px;text-align:center;margin-bottom:12px;">
            重铸将随机替换装备的词缀，保留强化等级和宝石。
          </p>` + equipList.map(eq => {
          const cost = 50 + ({'common':0,'fine':1,'rare':2,'epic':3,'legendary':4}[eq.quality||'common']||0) * 30;
          const canAfford = fragments >= cost;
          const affixStr = (eq.affixes || []).map(a => a.name || a.id).join(', ') || '无词缀';
          return `
            <div style="background:rgba(255,255,255,0.03);border:1px solid #33333366;border-radius:10px;
                        padding:14px;margin-bottom:10px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                  <span style="color:#ddd;font-size:14px;">${getEquipmentDisplayName(eq)}</span>
                  <p style="color:#777;font-size:11px;margin-top:4px;">当前词缀: ${affixStr}</p>
                </div>
                <button class="reforge-btn" data-slot="${eq.slot}" style="
                  background:${canAfford ? 'rgba(170,68,255,0.1)' : 'rgba(100,100,100,0.1)'};
                  border:1px solid ${canAfford ? '#aa44ff66' : '#333'};
                  color:${canAfford ? '#bb77ff' : '#555'};
                  padding:6px 16px;cursor:${canAfford ? 'pointer' : 'default'};
                  font-size:12px;font-family:inherit;border-radius:6px;
                  ${canAfford ? '' : 'opacity:0.5;'}
                ">重铸 (${cost}💎)</button>
              </div>
            </div>
          `;
        }).join('');
      }
    }
    
    overlay.innerHTML = `
      <div style="
        position:absolute;top:0;left:0;right:0;bottom:0;
        display:flex;align-items:center;justify-content:center;
        background:rgba(0,0,0,0.85);
      " id="forge-backdrop">
        <div style="
          background:rgba(10,10,20,0.97);border:1px solid #444;border-radius:16px;
          padding:24px;max-width:520px;width:95%;max-height:80vh;overflow-y:auto;
        ">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
            <h2 style="color:#ffcc44;letter-spacing:4px;font-size:18px;">🔨 锻造台</h2>
            <span style="color:#aa88ff;font-size:13px;">💎 ${fragments} 灵魂碎片</span>
          </div>
          
          <div style="display:flex;gap:8px;margin-bottom:16px;justify-content:center;">
            <button class="tab-btn" data-tab="recipes" style="${tabStyle('recipes')}">📜 配方锻造</button>
            <button class="tab-btn" data-tab="disassemble" style="${tabStyle('disassemble')}">💥 分解</button>
            <button class="tab-btn" data-tab="reforge" style="${tabStyle('reforge')}">🔄 重铸</button>
          </div>
          
          <div style="min-height:120px;">${contentHTML}</div>
          
          <div style="text-align:center;margin-top:16px;">
            <button id="btn-close-forge" style="
              background:transparent;border:1px solid #444;color:#888;
              padding:8px 30px;cursor:pointer;font-size:14px;font-family:inherit;
              border-radius:6px;
            ">关闭 (Esc)</button>
          </div>
        </div>
      </div>
    `;
    
    // Tab switching
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => { tab = btn.dataset.tab; _render(); });
    });
    
    // Forge recipe
    document.querySelectorAll('.forge-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const result = forgeRecipe(btn.dataset.recipe, gameState.player);
        if (result.success) {
          // Auto-equip if slot is empty
          const eq = result.equipment;
          if (eq.type === 'weapon' && !gameState.player.weapon) gameState.player.weapon = eq;
          else if (eq.type === 'armor' && !gameState.player.armor) gameState.player.armor = eq;
          else if (eq.type === 'accessory' && !gameState.player.accessory) gameState.player.accessory = eq;
          // Otherwise, show message
          _render();
        }
      });
    });
    
    // Disassemble
    document.querySelectorAll('.disasm-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const slot = btn.dataset.slot;
        const eq = gameState.player[slot];
        if (eq) {
          const result = disassembleEquipment(eq, gameState.player);
          if (result.success) {
            gameState.player[slot] = null;
            _render();
          }
        }
      });
    });
    
    // Reforge
    document.querySelectorAll('.reforge-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const slot = btn.dataset.slot;
        const eq = gameState.player[slot];
        if (eq) {
          const result = reforgeAffixes(eq, gameState.player);
          if (result.success) _render();
        }
      });
    });
    
    // Close
    const close = () => { overlay.innerHTML = ''; gameState.setState(prevState); };
    document.getElementById('btn-close-forge')?.addEventListener('click', close);
    document.getElementById('forge-backdrop')?.addEventListener('click', (e) => {
      if (e.target.id === 'forge-backdrop') close();
    });
    const kh = (e) => { if (e.key === 'Escape') { document.removeEventListener('keydown', kh); close(); } };
    document.addEventListener('keydown', kh);
  }
  
  _render();
}


// ═══════════════════════════════════════════════════════════════
// 成就面板 — J键打开
// ═══════════════════════════════════════════════════════════════
export function showAchievementPanel() {
  if (gameState.state !== GAME_STATE.EXPLORING) return;
  gameState.setState(GAME_STATE.INVENTORY);
  const overlay = document.getElementById('ui-overlay');
  
  let activeCat = 'combat';
  const categories = [
    { key: 'combat',  name: '⚔ 战斗', color: '#ff4444' },
    { key: 'explore', name: '🗺 探索', color: '#44ff88' },
    { key: 'growth',  name: '📈 成长', color: '#ffcc44' },
    { key: 'story',   name: '📖 剧情', color: '#aa88ff' },
    { key: 'collect',  name: '📦 收集', color: '#ff8844' },
  ];
  
  function _render() {
    const { unlocked, total } = achievementTracker.getUnlockRate();
    const items = achievementTracker.getByCategory(activeCat);
    
    const tabHTML = categories.map(c => `
      <button class="ach-tab" data-cat="${c.key}" style="
        background:${activeCat === c.key ? c.color + '22' : 'transparent'};
        border:1px solid ${activeCat === c.key ? c.color : '#333'};
        color:${activeCat === c.key ? c.color : '#666'};
        padding:6px 14px;cursor:pointer;font-size:12px;font-family:inherit;
        border-radius:6px;
      ">${c.name}</button>
    `).join('');
    
    const listHTML = items.map(a => {
      if (!a.visible) return `
        <div style="background:rgba(255,255,255,0.02);border:1px solid #222;border-radius:8px;
                    padding:12px;margin-bottom:6px;opacity:0.4;">
          <span style="color:#555;font-size:14px;">❓ 隐藏成就</span>
        </div>`;
      return `
        <div style="background:${a.unlocked ? 'rgba(255,204,68,0.05)' : 'rgba(255,255,255,0.02)'};
                    border:1px solid ${a.unlocked ? '#ffcc4433' : '#222'};
                    border-radius:8px;padding:12px;margin-bottom:6px;
                    display:flex;align-items:center;gap:12px;">
          <span style="font-size:24px;${a.unlocked ? '' : 'filter:grayscale(1);opacity:0.4;'}">${a.icon}</span>
          <div style="flex:1;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <span style="color:${a.unlocked ? '#e8d8c0' : '#666'};font-size:14px;font-weight:bold;">
                ${a.name}
              </span>
              ${a.unlocked ? '<span style="color:#44ff88;font-size:11px;">✓ 已解锁</span>' : ''}
            </div>
            <p style="color:${a.unlocked ? '#aaa' : '#555'};font-size:12px;margin-top:4px;">${a.desc}</p>
          </div>
        </div>`;
    }).join('');
    
    overlay.innerHTML = `
      <div style="position:absolute;top:0;left:0;right:0;bottom:0;
                  display:flex;align-items:center;justify-content:center;
                  background:rgba(0,0,0,0.85);" id="ach-backdrop">
        <div style="background:rgba(10,10,20,0.97);border:1px solid #444;border-radius:16px;
                    padding:24px;max-width:520px;width:95%;max-height:80vh;overflow-y:auto;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
            <h2 style="color:#ffcc44;letter-spacing:4px;font-size:18px;">🏆 成就</h2>
            <span style="color:#888;font-size:13px;">${unlocked}/${total} 已解锁</span>
          </div>
          
          <!-- 进度条 -->
          <div style="background:#222;border-radius:8px;height:8px;margin-bottom:16px;overflow:hidden;">
            <div style="background:linear-gradient(90deg,#ffcc44,#ff8844);height:100%;
                        width:${Math.round(unlocked/total*100)}%;border-radius:8px;
                        transition:width 0.3s ease;"></div>
          </div>
          
          <div style="display:flex;gap:6px;margin-bottom:16px;justify-content:center;flex-wrap:wrap;">
            ${tabHTML}
          </div>
          
          <div style="min-height:100px;">${listHTML}</div>
          
          <div style="text-align:center;margin-top:16px;">
            <button id="btn-close-ach" style="
              background:transparent;border:1px solid #444;color:#888;
              padding:8px 30px;cursor:pointer;font-size:14px;font-family:inherit;
              border-radius:6px;
            ">关闭 (Esc)</button>
          </div>
        </div>
      </div>
    `;
    
    document.querySelectorAll('.ach-tab').forEach(btn => {
      btn.addEventListener('click', () => { activeCat = btn.dataset.cat; _render(); });
    });
    
    const close = () => { overlay.innerHTML = ''; gameState.setState(GAME_STATE.EXPLORING); };
    document.getElementById('btn-close-ach')?.addEventListener('click', close);
    document.getElementById('ach-backdrop')?.addEventListener('click', e => {
      if (e.target.id === 'ach-backdrop') close();
    });
    const kh = (e) => { if (e.key === 'Escape') { document.removeEventListener('keydown', kh); close(); } };
    document.addEventListener('keydown', kh);
  }
  
  _render();
}
