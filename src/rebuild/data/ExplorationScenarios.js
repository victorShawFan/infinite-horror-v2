import { createChapterOneExplorationScenario } from './ChapterOneExploration.js';
import { createChapterTwoExplorationScenario } from './ChapterTwoExploration.js';
import { createChapterThreeExplorationScenario } from './ChapterThreeExploration.js';
import { createChapterFourExplorationScenario } from './ChapterFourExploration.js';

const THEMES = Object.freeze({
  1: { id:'bio', floor:'#202a2d', wall:'#4d5f5e', glow:'#ff5757', label:'蜂巢设施' },
  2: { id:'alien', floor:'#142329', wall:'#31504f', glow:'#86ff9f', label:'异形飞船' },
  3: { id:'curse', floor:'#24202b', wall:'#554862', glow:'#d99cff', label:'咒怨宅邸' },
  4: { id:'tomb', floor:'#3a2a18', wall:'#7b6137', glow:'#ffc861', label:'死亡之城' },
});

function gridForVariant(variant) {
  const rows = [
    '#################',
    '#...............#',
    '#...............#',
    '#...............#',
    '#...............#',
    '#...............#',
    '#...............#',
    '#...............#',
    '#...............#',
    '#...............#',
    '#################',
  ].map(row => row.split(''));
  const walls = [
    [[4,2],[4,3],[4,4],[8,6],[9,6],[10,6],[12,2],[12,3]],
    [[3,5],[4,5],[5,5],[9,2],[9,3],[9,4],[12,7],[13,7]],
    [[6,2],[6,3],[6,4],[6,5],[10,5],[11,5],[12,5],[13,5]],
  ][variant % 3];
  for (const [x,y] of walls) rows[y][x] = '#';
  return rows.map(row => row.join(''));
}

function dialogueFor(encounter, start, end) {
  return (encounter.intro || []).slice(start, end).map(beat => ({ speaker: beat.speaker, text: beat.text }));
}

export function createExplorationScenario(encounter) {
  const chapter = Number(encounter.chapterNumber || 1);
  const theme = THEMES[chapter] || THEMES[1];
  const chapterOneScenario = createChapterOneExplorationScenario(encounter, theme);
  if (chapterOneScenario) return chapterOneScenario;
  const chapterTwoScenario = createChapterTwoExplorationScenario(encounter, theme);
  if (chapterTwoScenario) return chapterTwoScenario;
  const chapterThreeScenario = createChapterThreeExplorationScenario(encounter, theme);
  if (chapterThreeScenario) return chapterThreeScenario;
  const chapterFourScenario = createChapterFourExplorationScenario(encounter, theme);
  if (chapterFourScenario) return chapterFourScenario;
  const npcOne = `${encounter.id}-npc-1`;
  const npcTwo = `${encounter.id}-npc-2`;
  return {
    id: encounter.id, title: encounter.title, subtitle: encounter.subtitle,
    width: 17, height: 11, tiles: gridForVariant(encounter.chapterOrder || encounter.order || 0),
    playerStart: { x:1, y:9 }, background: encounter.background, theme,
    objective: '与队友汇合并调查现场，然后接触威胁目标。',
    entities: [
      { id:npcOne, type:'npc', x:3, y:9, required:true, name:encounter.intro?.[0]?.speaker || '中洲队员', dialogue:dialogueFor(encounter,0,2), icon:'人', color:'#79d9ff' },
      { id:npcTwo, type:'npc', x:7, y:8, required:true, name:encounter.intro?.[2]?.speaker || '中洲队员', dialogue:dialogueFor(encounter,2,4), icon:'队', color:theme.glow },
      { id:`${encounter.id}-supply`, type:'item', x:10, y:8, name:(encounter.order%2?'战术急救包':'群体止血喷雾'), itemId:(encounter.order%2?'first_aid':'team_spray'), visual:(encounter.order%2?'medkit':'spray'), quantity:1, icon:(encounter.order%2?'十':'雾'), color:'#79e6a3' },
      { id:`${encounter.id}-battle`, type:'battle', x:14, y:3, encounterId:encounter.id, requires:[npcOne,npcTwo], name:'威胁源', icon:'敌', color:'#ff5959', lockedText:'队伍尚未汇合，贸然接敌会打乱阵线。' },
      { id:`${encounter.id}-exit`, type:'exit', x:15, y:1, name:'任务出口', icon:'出', color:'#ffd16f', lockedText:'战斗目标尚未完成，撤离通道仍被封锁。' },
    ],
  };
}
