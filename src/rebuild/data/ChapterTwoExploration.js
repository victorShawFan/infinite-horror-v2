const PORTRAITS = Object.freeze({
  楚轩: '/assets/characters/chuxuan.svg',
  零点: '/assets/characters/lingdian.svg',
  詹岚: '/assets/characters/zhan_lan.jpg',
  张杰: '/assets/characters/zhang_jie.jpg',
});

const LAYOUTS = Object.freeze({
  'ship-lockdown': {
    region: '苏拉科号 · 冷冻休眠甲板',
    objective: '与楚轩、零点汇合，检查失压舱门，再决定如何穿过异形封锁。',
    visualStyle: { id: 'sulaco-lockdown', floor: '#102329', wall: '#38535a', glow: '#8dffb2', ambient: '#65cad2' },
    tiles: [
      '#################', '#.....#.........#', '#.....#..#####..#', '#.....#.........#',
      '#.#####..####...#', '#...............#', '#...####..#####.#', '#...............#',
      '#.#####..####...#', '#...............#', '#################',
    ],
    decorations: [
      { x:1,y:1,w:3,kind:'cryo',label:'CRYO 04' }, { x:8,y:1,w:3,kind:'monitor',label:'LIFE SIG' },
      { x:12,y:1,w:2,kind:'vent' }, { x:2,y:5,w:4,kind:'deckline' },
      { x:8,y:5,w:3,kind:'cable' }, { x:12,y:7,w:2,kind:'acid' },
      { x:14,y:5,kind:'alarm' }, { x:14,y:9,kind:'bulkhead',label:'A-17' },
    ],
    playerStart: { x:1, y:9 },
    npcs: [
      { name:'楚轩', x:3, y:9, dialogue:[
        { speaker:'楚轩', text:'酸血让近距离击杀变成等价交换。我们需要交叉射界，而不是勇气。' },
        { speaker:'郑吒', text:'告诉我路线。最后一击交给能活着扣动扳机的人。' },
      ] },
      { name:'零点', x:8, y:7, dialogue:[
        { speaker:'零点', text:'通风管里至少三只。它们在灯灭的时候移动，亮起时停下。' },
        { speaker:'郑吒', text:'你守住长廊，我带其他人把它们赶进射界。' },
      ] },
    ],
    required: { x:4,y:5,name:'失压舱门',icon:'舱',dialogue:[
      { speaker:'詹岚', text:'门边没有爆炸痕迹，是从内部被利爪反复切开的。' },
      { speaker:'楚轩', text:'它们已经学会绕过感应锁。这里不是封锁线，是狩猎场的入口。' },
    ] },
    clue: { x:13,y:1,name:'动态感应器',icon:'波',dialogue:[
      { speaker:'零点', text:'感应器还能标出高速小型目标。抱脸虫一进入射界就会暴露。' },
      { speaker:'郑吒', text:'接入战术频道。别让它们抢到第一次行动。' },
    ],battleEffect:{ note:'动态感应器接入：敌方速度 -3。', enemies:{ spd:-3 } } },
    supply:{ x:4,y:3 }, battle:{ x:14,y:5,name:'封锁异形群' }, exit:{ x:15,y:1,name:'中央升降梯' },
  },
  'split-corridor': {
    region: '双岔走廊 · 动力分配层',
    objective: '确认两支小队的汇合点，检查分区电网，阻止猎手逐个击破新人。',
    visualStyle: { id:'split-power-deck', floor:'#162126', wall:'#4c5358', glow:'#ffd166', ambient:'#78a7b8' },
    tiles: [
      '#################', '#.......#.......#', '#.###...#...###.#', '#.......#.......#',
      '#..#####.#####..#', '#...............#', '#..###.....###..#', '#.......#.......#',
      '#.#####.#.#####.#', '#...............#', '#################',
    ],
    decorations: [
      { x:1,y:1,w:4,kind:'deckline',label:'CONTROL' }, { x:10,y:1,w:4,kind:'deckline',label:'REACTOR' },
      { x:7,y:3,kind:'junction',label:'A/B' }, { x:3,y:5,w:3,kind:'cable' },
      { x:10,y:5,w:3,kind:'pipe' }, { x:1,y:7,w:2,kind:'barricade' },
      { x:13,y:7,kind:'vent' }, { x:15,y:9,kind:'signal' },
    ],
    playerStart:{ x:1,y:9 },
    npcs:[
      { name:'詹岚',x:3,y:9,dialogue:[
        { speaker:'詹岚',text:'新人不是负担。把他们留在黑暗里，才是在替异形选择猎物。' },
        { speaker:'郑吒',text:'你带他们走控制室，我去动力舱。十分钟后这里汇合。' },
      ] },
      { name:'楚轩',x:12,y:7,dialogue:[
        { speaker:'楚轩',text:'两条路线都必须有人执行。区别只在于我们是否提前准备退路。' },
        { speaker:'郑吒',text:'可以计算风险，但别把任何一个人先写进死亡名单。' },
      ] },
    ],
    required:{ x:8,y:5,name:'分区电网',icon:'电',dialogue:[
      { speaker:'楚轩',text:'电力被人为切成两路。恢复一边，另一边的密封门就会失效。' },
      { speaker:'詹岚',text:'那就维持低功率，让两边的人都能看见回来的路。' },
    ] },
    clue:{ x:14,y:3,name:'应急照明总线',icon:'灯',dialogue:[
      { speaker:'詹岚',text:'把灯光按区段依次点亮，异形会被迫从阴影里退出来。' },
      { speaker:'郑吒',text:'很好。我们不分散火力，让它们分散。' },
    ],battleEffect:{ note:'分区照明诱导成功：全队防御 +2，敌方防御 -1。', party:{ def:2 }, enemies:{ def:-1 } } },
    supply:{ x:6,y:7 }, battle:{ x:14,y:1,name:'走廊猎手' }, exit:{ x:15,y:9,name:'动力舱梯井' },
  },
  'vent-hunt': {
    region: '维护通风管 · 无光区',
    objective: '跟随零点标记的安全线，检查失踪小队痕迹，找到伏击异形的位置。',
    visualStyle: { id:'ventilation-hunt', floor:'#0d181b', wall:'#344247', glow:'#b6f4ff', ambient:'#668b96' },
    tiles: [
      '#################', '#...............#', '#.#.#.#.#.#.#.#.#', '#...............#',
      '###.###.###.###.#', '#...............#', '#.###.#####.###.#', '#...............#',
      '#.#.#.#.#.#.#.#.#', '#...............#', '#################',
    ],
    decorations:[
      { x:1,y:1,w:4,kind:'duct',label:'VENT 12' }, { x:7,y:1,w:3,kind:'fan' },
      { x:12,y:1,w:3,kind:'duct' }, { x:3,y:3,w:3,kind:'scratch' },
      { x:8,y:5,w:3,kind:'cable' }, { x:12,y:7,w:2,kind:'acid' },
      { x:2,y:9,kind:'signal' }, { x:14,y:7,kind:'vent' },
    ],
    playerStart:{ x:1,y:9 },
    npcs:[
      { name:'零点',x:2,y:9,dialogue:[
        { speaker:'零点',text:'左侧二十米，两只。第三只没有声音，它在我们头顶等着。' },
        { speaker:'郑吒',text:'你标记射界。听到我的口令，所有人一起压低身体。' },
      ] },
      { name:'楚轩',x:8,y:7,dialogue:[
        { speaker:'楚轩',text:'温度分布不对。冷凝水绕开了天花板的一块区域。' },
        { speaker:'郑吒',text:'因为那里趴着一只活物。找到它了。' },
      ] },
    ],
    required:{ x:3,y:5,name:'失踪小队信标',icon:'标',dialogue:[
      { speaker:'零点',text:'信标还在循环发送撤退坐标，人却没有离开这里。' },
      { speaker:'楚轩',text:'拖痕向上消失。异形把他们带进了管道夹层。' },
    ] },
    clue:{ x:13,y:3,name:'热成像维修镜',icon:'热',dialogue:[
      { speaker:'零点',text:'镜片能分辨管壁后的余热。伏击者再安静也藏不住轮廓。' },
      { speaker:'郑吒',text:'先锁定它，再进入交火。把猎手变成靶子。' },
    ],battleEffect:{ note:'热成像锁定伏击者：全队暴击 +6。', party:{ crit:6 } } },
    supply:{ x:11,y:9 }, battle:{ x:14,y:7,name:'通风管伏击者' }, exit:{ x:15,y:1,name:'隔离层舱口' },
  },
  'quarantine-lab': {
    region: '生物隔离舱 · 孵化实验室',
    objective: '封闭孵化舱，调查霸王留下的生命信号，烧毁未破裂的异形卵。',
    visualStyle: { id:'quarantine-incubation', floor:'#12231f', wall:'#3d5c50', glow:'#a6ff72', ambient:'#4ed2a0' },
    tiles: [
      '#################', '#..##...#...##..#', '#..##...#...##..#', '#...............#',
      '#.####.....####.#', '#...............#', '#.##...###...##.#', '#...............#',
      '#..##...#...##..#', '#...............#', '#################',
    ],
    decorations:[
      { x:1,y:1,w:2,h:2,kind:'egg',label:'OVUM' }, { x:5,y:1,w:2,h:2,kind:'tank',label:'HOST' },
      { x:10,y:1,w:2,h:2,kind:'egg' }, { x:13,y:1,w:2,h:2,kind:'tank' },
      { x:4,y:5,w:3,kind:'fluid' }, { x:9,y:5,w:3,kind:'pipe' },
      { x:2,y:7,w:2,kind:'acid' }, { x:14,y:4,kind:'alarm' },
    ],
    playerStart:{ x:1,y:9 },
    npcs:[
      { name:'詹岚',x:4,y:9,dialogue:[
        { speaker:'詹岚',text:'霸王的生命信号还在，但已经不是一个人的心跳频率。' },
        { speaker:'郑吒',text:'把剩下的卵全部烧掉。至少别让更多人经历同样的事。' },
      ] },
      { name:'楚轩',x:10,y:7,dialogue:[
        { speaker:'楚轩',text:'抱脸虫会保护完整卵囊。火焰能迫使它们提前脱离掩体。' },
        { speaker:'郑吒',text:'这一次按你的方案来，但撤退时一个人都不能少。' },
      ] },
    ],
    required:{ x:4,y:4,name:'霸王生命监测器',icon:'心',dialogue:[
      { speaker:'詹岚',text:'他的心跳下面还有第二组脉冲……有什么东西正在回应。' },
      { speaker:'楚轩',text:'寄生已经完成。关闭这块屏幕，我们现在能救的是其他人。' },
    ] },
    clue:{ x:12,y:3,name:'焚化喷淋终端',icon:'焰',dialogue:[
      { speaker:'楚轩',text:'喷淋管保存着高温净化剂，可以同时灼烧整片孵化区。' },
      { speaker:'郑吒',text:'启动。先削弱所有卵囊，再让队伍进入。' },
    ],battleEffect:{ note:'高温净化剂覆盖孵化区：敌方生命 -12，防御 -2。', enemies:{ hp:-12, maxHp:-12, def:-2 } } },
    supply:{ x:2,y:6 }, battle:{ x:14,y:4,name:'孵化卵囊群' }, exit:{ x:15,y:9,name:'蜂巢下降井' },
  },
  'hive-rescue': {
    region: '异形巢穴 · 宿主收容层',
    objective: '辨认尚存生命迹象的宿主，与詹岚、零点建立救援阵线。',
    visualStyle: { id:'organic-hive-rescue', floor:'#182018', wall:'#4c5940', glow:'#d2ff67', ambient:'#7da357' },
    tiles: [
      '#################', '#...............#', '#..####...####..#', '#..#.........#..#',
      '#..#.#######.#..#', '#...............#', '#..#.#######.#..#', '#..#.........#..#',
      '#..####...####..#', '#...............#', '#################',
    ],
    decorations:[
      { x:1,y:1,w:3,kind:'resin',label:'HIVE' }, { x:6,y:1,w:2,kind:'cocoon' },
      { x:10,y:1,w:2,kind:'cocoon' }, { x:13,y:3,w:2,kind:'resin' },
      { x:3,y:5,w:3,kind:'acid' }, { x:8,y:5,w:3,kind:'vein' },
      { x:2,y:7,kind:'egg' }, { x:14,y:7,kind:'egg' }, { x:14,y:9,kind:'signal' },
    ],
    playerStart:{ x:1,y:9 },
    npcs:[
      { name:'詹岚',x:3,y:9,dialogue:[
        { speaker:'詹岚',text:'右侧两个茧还有意识。他们不是繁殖效率，是和我们一起醒来的人。' },
        { speaker:'郑吒',text:'那就先救人。谁想让他们留下，先从我这里过去。' },
      ] },
      { name:'零点',x:8,y:7,dialogue:[
        { speaker:'零点',text:'禁卫在更深处。它每隔十二秒经过一次主通道。' },
        { speaker:'郑吒',text:'第一轮齐射打断它。我会在第二轮冲进去。' },
      ] },
    ],
    required:{ x:8,y:5,name:'新人宿主茧',icon:'茧',dialogue:[
      { speaker:'詹岚',text:'还能听见我吗？坚持住，我们带你离开这里。' },
      { speaker:'旁白',text:'茧内的手指轻轻敲了两下。那是仍然活着的回答。' },
    ] },
    clue:{ x:12,y:3,name:'禁卫蜕壳',icon:'壳',dialogue:[
      { speaker:'零点',text:'蜕壳腹侧比正面薄得多。它转身扑击时会露出这条接缝。' },
      { speaker:'郑吒',text:'记住位置。等它扑向我，所有火力打同一点。' },
    ],battleEffect:{ note:'禁卫甲壳弱点已确认：敌方防御 -4。', enemies:{ def:-4 } } },
    supply:{ x:6,y:3 }, battle:{ x:14,y:5,name:'蜂巢禁卫' }, exit:{ x:15,y:1,name:'皇后产卵室' },
  },
  'queen-evacuation': {
    region: '皇后产卵室 · 自毁撤离层',
    objective: '启动逃生舱，确认自毁剩余时间，在皇后封死出口前完成撤离。',
    visualStyle: { id:'queen-self-destruct', floor:'#211c19', wall:'#604a3d', glow:'#ff704f', ambient:'#c99153' },
    tiles: [
      '#################', '#...............#', '#.#####...#####.#', '#.#...........#.#',
      '#.#.##.....##.#.#', '#...............#', '#.#.##.....##.#.#', '#.#...........#.#',
      '#.#####...#####.#', '#...............#', '#################',
    ],
    decorations:[
      { x:1,y:1,w:4,kind:'countdown',label:'03:00' }, { x:10,y:1,w:4,kind:'pod',label:'ESCAPE' },
      { x:3,y:3,w:2,kind:'egg' }, { x:7,y:3,w:3,kind:'ovipositor' },
      { x:12,y:3,w:2,kind:'egg' }, { x:5,y:7,w:2,kind:'acid' },
      { x:10,y:7,w:3,kind:'resin' }, { x:13,y:5,kind:'alarm' }, { x:14,y:9,kind:'signal' },
    ],
    playerStart:{ x:1,y:9 },
    npcs:[
      { name:'楚轩',x:4,y:9,dialogue:[
        { speaker:'楚轩',text:'样本能解释蜂巢通讯，但携带它会让皇后持续追踪逃生舱。' },
        { speaker:'郑吒',text:'放下样本。知识以后还能找，人死了就回不来了。' },
      ] },
      { name:'零点',x:11,y:7,dialogue:[
        { speaker:'零点',text:'出口射界确认。护卫交给我，皇后只能由你拖住。' },
        { speaker:'郑吒',text:'倒计时结束前一起进舱。不是你掩护我们撤退，是我们一起撤退。' },
      ] },
    ],
    required:{ x:8,y:5,name:'逃生舱启动台',icon:'启',dialogue:[
      { speaker:'主神',text:'飞船自毁剩余时间：三分钟。逃生舱即将进入脱离程序。' },
      { speaker:'郑吒',text:'锁定全队生命信号。最后一个人进舱之前，不准发射。' },
    ] },
    clue:{ x:3,y:3,name:'液氮装卸臂',icon:'氮',dialogue:[
      { speaker:'楚轩',text:'装卸臂残留液氮足以冻结皇后的关节，持续时间不会超过十秒。' },
      { speaker:'郑吒',text:'十秒够了。先冻住它，再把所有人送到出口。' },
    ],battleEffect:{ note:'液氮喷射命中皇后阵线：敌方攻击 -3、速度 -3。', enemies:{ atk:-3, spd:-3 } } },
    supply:{ x:14,y:9 }, battle:{ x:13,y:5,name:'异形皇后' }, exit:{ x:15,y:1,name:'逃生舱' },
  },
});

function supplyFor(encounter, layout) {
  const medkit = Number(encounter.chapterOrder || 0) % 2 === 1;
  return {
    id: encounter.id + '-supply', type:'item', ...layout.supply,
    name: medkit ? '战术急救包' : '群体止血喷雾',
    itemId: medkit ? 'first_aid' : 'team_spray', visual: medkit ? 'medkit' : 'spray',
    quantity:1, icon: medkit ? '十' : '雾', color:'#79e6a3',
  };
}

export function createChapterTwoExplorationScenario(encounter, theme) {
  const layout = LAYOUTS[encounter?.id];
  if (!layout) return null;
  const npcIds = layout.npcs.map((_, index) => encounter.id + '-npc-' + (index + 1));
  const requiredObject = encounter.id + '-required-object';
  return {
    id:encounter.id, title:encounter.title, subtitle:encounter.subtitle, region:layout.region,
    width:17, height:11, tiles:[...layout.tiles], playerStart:{...layout.playerStart},
    background:encounter.background,
    theme:{ ...theme, floor:layout.visualStyle.floor, wall:layout.visualStyle.wall, glow:layout.visualStyle.glow, label:layout.region },
    visualStyle:{...layout.visualStyle}, decorations:layout.decorations.map(item=>({...item})),
    objective:layout.objective,
    entities:[
      ...layout.npcs.map((npc,index)=>({ id:npcIds[index],type:'npc',x:npc.x,y:npc.y,required:true,name:npc.name,portrait:PORTRAITS[npc.name],dialogue:npc.dialogue.map(beat=>({...beat})),icon:index?'狙':'智',color:index?'#8fe7ff':'#d8ff88' })),
      { id:requiredObject,type:'object',...layout.required,required:true,color:'#ffd16f' },
      { id:encounter.id+'-tactical-clue',type:'object',...layout.clue,clue:true,required:false,color:'#8fe7ff' },
      supplyFor(encounter,layout),
      { id:encounter.id+'-battle',type:'battle',...layout.battle,encounterId:encounter.id,requires:[...npcIds,requiredObject],icon:'敌',color:'#ff5959',lockedText:'队员尚未汇合，异形活动规律也没有确认。现在接敌只会被逐个猎杀。' },
      { id:encounter.id+'-exit',type:'exit',...layout.exit,icon:'出',color:'#ffd16f',lockedText:'异形威胁尚未清除，撤离通道仍被封锁。' },
    ],
  };
}
