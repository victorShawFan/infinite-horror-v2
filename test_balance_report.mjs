/**
 * 数值平衡报告 — 模拟12章全通关并跟踪基因锁进阶时机
 */
globalThis.localStorage = { _data: {}, getItem(k) { return this._data[k] || null; }, setItem(k,v) { this._data[k] = v; }, removeItem(k) { delete this._data[k]; } };

import { generateChapter1 } from './src/core/MapGenerator.js';
import { generateChapter2 } from './src/core/MapGenerator_Ch2.js';
import { generateChapter3 } from './src/core/MapGenerator_Ch3.js';
import { generateChapter4 } from './src/core/MapGenerator_Ch4.js';
import { generateChapter5 } from './src/core/MapGenerator_Ch5.js';
import { generateChapter6 } from './src/core/MapGenerator_Ch6.js';
import { generateChapter7 } from './src/core/MapGenerator_Ch7.js';
import { generateChapter8 } from './src/core/MapGenerator_Ch8.js';
import { generateChapter9 } from './src/core/MapGenerator_Ch9.js';
import { generateChapter10 } from './src/core/MapGenerator_Ch10.js';
import { generateChapter11 } from './src/core/MapGenerator_Ch11.js';
import { generateChapter12 } from './src/core/MapGenerator_Ch12.js';
import { gameState } from './src/core/GameState.js';
import { executeBattle, previewBattle, getEffectiveAtk, getEffectiveDef } from './src/core/CombatSystem.js';
import { ENTITY_TYPE } from './src/core/constants.js';
import { getGeneLockProgress, checkGeneLockAdvancement, advanceGeneLock } from './src/core/GeneLockSystem.js';
import { getAvailableSkills } from './src/core/SkillSystem.js';
import { scaleEnemy } from './src/core/DifficultyScaler.js';

gameState.reset();
const p = gameState.player;

const chapters = [
  generateChapter1(), generateChapter2(), generateChapter3(),
  generateChapter4(), generateChapter5(), generateChapter6(),
  generateChapter7(), generateChapter8(), generateChapter9(),
  generateChapter10(), generateChapter11(), generateChapter12(),
];

let totalDefeats = 0;
let geneLockAdvances = [];

console.log('═══════════════════════════════════════════════════════');
console.log(' 无限恐怖 · 数值平衡报告');
console.log('═══════════════════════════════════════════════════════');

for (let ci = 0; ci < chapters.length; ci++) {
  const ch = chapters[ci];
  const chNum = ci + 1;
  let chDefeats = 0;
  let chEnemies = 0;
  let chMinHpMargin = Infinity;
  let chBossName = '';

  for (const f of ch.floors) {
    // 拾取道具
    for (const e of f.entities.filter(e => e.type === ENTITY_TYPE.ITEM)) {
      if (e.effect?.heal) p.hp = Math.min(p.maxHp, p.hp + e.effect.heal);
      if (e.effect?.atk) p.atk += e.effect.atk;
      if (e.effect?.def) p.def += e.effect.def;
      if (e.effect?.spd) p.spd += e.effect.spd;
      if (e.effect?.maxHp) { p.maxHp += e.effect.maxHp; p.hp += e.effect.maxHp; }
      if (e.effect?.crt) p.crt = (p.crt || 0) + e.effect.crt;
      if (e.itemType === 'weapon' && e.weapon) p.weapon = e.weapon;
      if (e.itemType === 'armor' && e.armor) p.armor = e.armor;
      if (e.itemType === 'accessory' && e.accessory) p.accessory = e.accessory;
      if (e.itemType === 'chip' && e.chip && p.chips.length < p.maxChips) p.chips.push(e.chip);
      if (e.itemType === 'stat_boost' && e.effect) {
        if (e.effect.atk) p.atk += e.effect.atk;
        if (e.effect.def) p.def += e.effect.def;
        if (e.effect.spd) p.spd += e.effect.spd;
        if (e.effect.maxHp) { p.maxHp += e.effect.maxHp; p.hp += e.effect.maxHp; }
        if (e.effect.crt) p.crt = (p.crt || 0) + e.effect.crt;
      }
    }

    // 战斗
    for (const e of f.entities.filter(e => e.type === ENTITY_TYPE.ENEMY || e.type === ENTITY_TYPE.BOSS)) {
      chEnemies++;
      const scaled = scaleEnemy(e, chNum);
      const preview = previewBattle(p, scaled);
      if (!preview.canWin) {
        chDefeats++;
        totalDefeats++;
        continue;
      }

      const hpBefore = p.hp;
      await executeBattle({...scaled});
      const hpAfter = p.hp;
      const margin = hpAfter;

      if (margin < chMinHpMargin) chMinHpMargin = margin;
      if (e.type === ENTITY_TYPE.BOSS) chBossName = e.name;

      // 检查基因锁进阶
      const glCheck = checkGeneLockAdvancement(p);
      if (glCheck.advanced) {
        const before = p.geneLock;
        advanceGeneLock(p);
        geneLockAdvances.push({ chapter: chNum, floor: f.id, stage: p.geneLock });
      }
    }
  }

  // 章节结算 - 给予奖励点
  p.rewardPoints += 1000;

  const glProg = getGeneLockProgress(p);
  const skills = getAvailableSkills(p);

  console.log(`\nCh${String(chNum).padStart(2,'0')} ${ch.name}`);
  console.log(`  Lv${p.level} | ATK ${getEffectiveAtk(p)} DEF ${getEffectiveDef(p)} | HP ${p.hp}/${p.maxHp}`);
  console.log(`  敌人 ${chEnemies} | 不可胜 ${chDefeats} | 最低HP余量 ${chMinHpMargin === Infinity ? 'N/A' : chMinHpMargin}`);
  console.log(`  基因锁 ${glProg.currentStage}阶 充能${glProg.charge}/${glProg.nextThreshold||'MAX'} | 技能${skills.length}个`);
  if (chBossName) console.log(`  Boss: ${chBossName}`);
}

console.log('\n═══════════════════════════════════════════════════════');
console.log(' 基因锁突破时刻:');
for (const adv of geneLockAdvances) {
  console.log(`  第${adv.stage}阶 — 第${adv.chapter}章 ${adv.floor}`);
}
console.log(`\n最终: Lv${p.level} | ATK ${getEffectiveAtk(p)} DEF ${getEffectiveDef(p)} | HP ${p.hp}/${p.maxHp}`);
console.log(`总不可胜: ${totalDefeats}`);
console.log('═══════════════════════════════════════════════════════');

if (totalDefeats === 0) console.log('✅ 数值平衡：全程可通关');
else { console.log(`⚠ ${totalDefeats}个敌人无法击败`); process.exit(1); }
