const PORTRAITS = Object.freeze({
  楚轩: '/assets/characters/chuxuan.svg',
  零点: '/assets/characters/lingdian.svg',
  詹岚: '/assets/characters/zhan_lan.jpg',
  赵樱空: '/assets/characters/zhao_yingkong.svg',
});

const LAYOUTS = Object.freeze({
  'curse-house': {
    region:'佐伯宅 · 潮湿玄关', objective:'与队员确认诅咒源，调查自行播放的录像，再进入怨灵盘踞的楼梯间。',
    visualStyle:{id:'saeki-entry',floor:'#211e27',wall:'#554b5f',glow:'#d8a1ff',ambient:'#8d73a8'},
    tiles:['#################','#...............#','#.###.#####.###.#','#...............#','#.###.#...#.###.#','#.....#...#.....#','###.###...###.###','#...............#','#.#####.#####...#','#...............#','#################'],
    decorations:[{x:1,y:1,w:3,kind:'tatami',label:'玄关'},{x:6,y:1,w:3,kind:'shoji'},{x:11,y:1,w:3,kind:'shoji'},{x:2,y:3,w:2,kind:'shoe'},{x:7,y:5,w:2,kind:'tape',label:'PLAY'},{x:11,y:5,w:3,kind:'hair'},{x:3,y:7,w:3,kind:'stain'},{x:13,y:7,kind:'curse-eye'}],
    playerStart:{x:1,y:9}, npcs:[
      {name:'赵樱空',x:3,y:9,dialogue:[{speaker:'赵樱空',text:'屋里没有活人的呼吸，但每一扇纸门后都有人在注视我们。'},{speaker:'郑吒',text:'别独自追进去。先找出诅咒借什么东西锁定我们。'}]},
      {name:'楚轩',x:9,y:7,dialogue:[{speaker:'楚轩',text:'黑纹增长速度与录像播放次数同步。媒介不是房子，而是被看见的记忆。'},{speaker:'郑吒',text:'那就停止播放，记下规律，再一起面对它。'}]},
    ],
    required:{x:5,y:5,name:'自行播放的录像机',icon:'像',dialogue:[{speaker:'旁白',text:'雪花画面里，白衣女人从楼梯顶端倒着爬下，距离镜头越来越近。'},{speaker:'楚轩',text:'不要关闭电源。先记录她每一次显形的间隔，这是唯一可量化的窗口。'}]},
    clue:{x:13,y:3,name:'驱邪盐线',icon:'盐',dialogue:[{speaker:'赵樱空',text:'盐线在楼梯口断了一段。补全以后，灵体穿过时形体会短暂凝实。'},{speaker:'郑吒',text:'把缺口补上。我们要的不是安全感，是能真正击中它的机会。'}],battleEffect:{note:'驱邪盐线完成：敌方防御 -2、速度 -2。',enemies:{def:-2,spd:-2}}},
    supply:{x:12,y:9},battle:{x:14,y:5,name:'宅邸怨灵'},exit:{x:15,y:1,name:'二层楼梯'},
  },
  'night-scatter': {
    region:'佐伯宅 · 第一夜回廊', objective:'在熄灯后的宅邸找回失散队员，调查呼唤姓名的柜门，重新建立队形。',
    visualStyle:{id:'blackout-corridor',floor:'#181b24',wall:'#444958',glow:'#91b6ff',ambient:'#64718d'},
    tiles:['#################','#.......#.......#','#.###...#...###.#','#.......#.......#','###.###...###.###','#...............#','#.###.#####.###.#','#...............#','#...###.###.###.#','#...............#','#################'],
    decorations:[{x:1,y:1,w:3,kind:'shoji'},{x:10,y:1,w:3,kind:'shoji'},{x:6,y:3,kind:'lantern'},{x:2,y:5,w:3,kind:'tatami'},{x:7,y:5,w:2,kind:'hair'},{x:11,y:5,w:3,kind:'tatami'},{x:3,y:7,w:2,kind:'footprint'},{x:14,y:7,kind:'curse-eye'},{x:13,y:9,kind:'stain'}],
    playerStart:{x:1,y:9}, npcs:[
      {name:'詹岚',x:3,y:9,dialogue:[{speaker:'詹岚',text:'铭烟薇在东侧，她一直听见柜子里有人叫她的名字。'},{speaker:'郑吒',text:'告诉所有人不要回应。声音只是诅咒确认位置的办法。'}]},
      {name:'赵樱空',x:10,y:7,dialogue:[{speaker:'赵樱空',text:'黑暗里有东西沿天花板移动。它在等我们再次分散。'},{speaker:'郑吒',text:'背靠背推进。每个人都必须看见左右两名队员。'}]},
    ],
    required:{x:7,y:3,name:'呼名壁橱',icon:'柜',dialogue:[{speaker:'铭烟薇的声音',text:'郑吒……我就在里面。打开门，快一点。'},{speaker:'詹岚',text:'铭烟薇还在东侧。这声音读到了我们的记忆，绝不能回应。'}]},
    clue:{x:13,y:1,name:'宅邸配电图',icon:'灯',dialogue:[{speaker:'赵樱空',text:'备用回路能让回廊每隔三秒亮起一次，足够看清袭击方向。'},{speaker:'郑吒',text:'接通它。黑暗属于它，节奏必须属于我们。'}],battleEffect:{note:'脉冲照明启动：全队防御 +3。',party:{def:3}}},
    supply:{x:5,y:5},battle:{x:14,y:3,name:'黑暗长发怨灵'},exit:{x:15,y:9,name:'地下佛堂入口'},
  },
  'sutra-clue': {
    region:'地下佛堂 · 七波祭坛', objective:'守住佛堂入口，调查残缺经卷，确认伽椰子第七波显形的唯一窗口。',
    visualStyle:{id:'underground-sutra',floor:'#28231d',wall:'#665a46',glow:'#ffc86c',ambient:'#a98b5b'},
    tiles:['#################','#...............#','#.#####...#####.#','#.#...........#.#','#.#.###...###.#.#','#...............#','#.#.###...###.#.#','#.#...........#.#','#.#####...#####.#','#...............#','#################'],
    decorations:[{x:1,y:1,w:3,kind:'sutra',label:'般若'},{x:6,y:1,w:3,kind:'incense'},{x:11,y:1,w:3,kind:'sutra'},{x:3,y:3,w:2,kind:'candle'},{x:7,y:3,w:3,kind:'altar'},{x:12,y:3,w:2,kind:'candle'},{x:3,y:7,w:3,kind:'tatami'},{x:10,y:7,w:3,kind:'seal'},{x:14,y:9,kind:'lantern'}],
    playerStart:{x:1,y:9}, npcs:[
      {name:'楚轩',x:4,y:9,dialogue:[{speaker:'楚轩',text:'经卷中的七不是象征，而是怨念完成循环所需的次数。前六波攻击没有意义。'},{speaker:'郑吒',text:'那就把力量留到第七波，但在那之前一个人也不能倒下。'}]},
      {name:'詹岚',x:10,y:7,dialogue:[{speaker:'詹岚',text:'我的精神力能暂时固定经卷，可每次冲击都会让结界更薄。'},{speaker:'郑吒',text:'你只管维持结界。外面的东西交给我们。'}]},
    ],
    required:{x:8,y:5,name:'残缺佛经笔记',icon:'经',dialogue:[{speaker:'佛经笔记',text:'怨念七返，第七次真身临世；金刚经火，灵弹贯心。'},{speaker:'楚轩',text:'显形持续不超过十秒。零点负责终结，其他人负责让他活到开枪。'}]},
    clue:{x:13,y:7,name:'镇魂香炉',icon:'香',dialogue:[{speaker:'詹岚',text:'香灰能稳定精神屏障，怨灵的哭声会被压低。'},{speaker:'郑吒',text:'点燃所有余香。先保护队伍，再谈封印。'}],battleEffect:{note:'镇魂香稳定结界：敌方攻击 -3。',enemies:{atk:-3}}},
    supply:{x:2,y:5},battle:{x:14,y:5,name:'佛堂地缚灵'},exit:{x:15,y:1,name:'西侧安全屋'},
  },
  'fear-conflict': {
    region:'西侧安全屋 · 破裂阵线', objective:'制止新人冲突，调查铭烟薇跌入的黑门，在怨恨吞没队伍前重整阵线。',
    visualStyle:{id:'fear-breach',floor:'#251d22',wall:'#624653',glow:'#ff7895',ambient:'#a65c72'},
    tiles:['#################','#.....#.........#','#....##..####...#','#.....#.........#','#.####....###...#','#...............#','#...####..#####.#','#...............#','#.#####..####...#','#...............#','#################'],
    decorations:[{x:1,y:1,w:3,kind:'barricade'},{x:8,y:1,w:3,kind:'shoji'},{x:12,y:1,w:2,kind:'hair'},{x:2,y:3,w:3,kind:'footprint'},{x:8,y:5,w:3,kind:'blacktide'},{x:12,y:5,w:2,kind:'stain'},{x:3,y:7,w:2,kind:'shoe'},{x:11,y:7,w:3,kind:'tatami'},{x:14,y:9,kind:'curse-eye'}],
    playerStart:{x:1,y:9}, npcs:[
      {name:'詹岚',x:3,y:9,dialogue:[{speaker:'詹岚',text:'恐惧正在放大每个人最坏的念头。再争下去，不需要鬼动手。'},{speaker:'郑吒',text:'所有人放下武器。谁再把同伴推向黑暗，就先面对我。'}]},
      {name:'赵樱空',x:8,y:7,dialogue:[{speaker:'赵樱空',text:'门后没有房间，只有不断重复坠落的怨念。她还在那里。'},{speaker:'郑吒',text:'记住铭烟薇的名字。我们不能让她只剩下一段恐惧。'}]},
    ],
    required:{x:4,y:5,name:'铭烟薇的发卡',icon:'忆',dialogue:[{speaker:'旁白',text:'发卡卡在门槛裂缝里，沾着血，旁边是被拖向黑暗的五道指痕。'},{speaker:'郑吒',text:'不是怨灵先杀了她，是我们先放弃了她。这笔账由我记住。'}]},
    clue:{x:13,y:3,name:'怨灵移动残痕',icon:'痕',dialogue:[{speaker:'赵樱空',text:'黑潮总沿着人的视线死角移动。保持三角阵型，它就无法同时隐藏。'},{speaker:'郑吒',text:'重新编队。让每个人的背后都有同伴。'}],battleEffect:{note:'三角警戒阵型建立：全队速度 +3、防御 +2。',party:{spd:3,def:2}}},
    supply:{x:4,y:3},battle:{x:14,y:5,name:'复仇怨灵群'},exit:{x:15,y:1,name:'阁楼暗梯'},
  },
  'chuxuan-tape': {
    region:'佐伯宅 · 封闭阁楼', objective:'找到楚轩留下的录像，确认最终战术，在黑潮吞没阁楼前保存情报。',
    visualStyle:{id:'attic-recording',floor:'#17171e',wall:'#464552',glow:'#a69bff',ambient:'#77718f'},
    tiles:['#################','#...............#','####...#####...##','#...............#','#..###.....###..#','#...............#','#.###.#####.###.#','#...............#','##...#####...####','#...............#','#################'],
    decorations:[{x:1,y:1,w:3,kind:'beamwood'},{x:6,y:1,w:3,kind:'tape',label:'REC'},{x:11,y:1,w:3,kind:'beamwood'},{x:2,y:3,w:3,kind:'box'},{x:7,y:3,w:2,kind:'monitor',label:'00:07'},{x:11,y:5,w:3,kind:'hair'},{x:2,y:7,w:3,kind:'blacktide'},{x:8,y:7,w:2,kind:'stain'},{x:14,y:7,kind:'curse-eye'}],
    playerStart:{x:1,y:9}, npcs:[
      {name:'楚轩',x:4,y:9,dialogue:[{speaker:'楚轩',text:'如果你看到这段录像，说明我已经没有余裕亲口解释。不要因此改变计划。'},{speaker:'郑吒',text:'我会执行计划，但我不会接受你把自己写成必然损耗。'}]},
      {name:'零点',x:10,y:7,dialogue:[{speaker:'零点',text:'灵类弹匣只剩最后一组。第七波出现前，我不会开枪。'},{speaker:'郑吒',text:'你只需要那一枪。活到最后，然后把它送进伽椰子心口。'}]},
    ],
    required:{x:8,y:5,name:'楚轩的录像带',icon:'录',dialogue:[{speaker:'楚轩（录像）',text:'第七波后，郑吒压制，赵樱空固定，零点完成终结。误差窗口九点六秒。'},{speaker:'楚轩（录像）',text:'至于我的选择——不要浪费时间哀悼，把结果带回主神空间。'}]},
    clue:{x:13,y:3,name:'灵类弹道标记',icon:'弹',dialogue:[{speaker:'零点',text:'楚轩标出了伽椰子显形时的核心位置，和佛经记录完全一致。'},{speaker:'郑吒',text:'把标记刻进瞄准镜。第七波时，我们替你争取九秒。'}],battleEffect:{note:'灵类弹道完成校准：全队攻击 +3，敌方防御 -3。',party:{atk:3},enemies:{def:-3}}},
    supply:{x:3,y:5},battle:{x:14,y:5,name:'阁楼黑潮'},exit:{x:15,y:1,name:'七波封印场'},
  },
  'seven-curse-seal': {
    region:'终末佛堂 · 七波封印场', objective:'完成七处封印，与赵樱空、零点确认终结阵位，等待伽椰子真身显形。',
    visualStyle:{id:'seven-wave-seal',floor:'#261f2d',wall:'#654f70',glow:'#f2a1ff',ambient:'#a06caf'},
    tiles:['#################','#...............#','#.####.....####.#','#.#...........#.#','#.#.###...##..#.#','#...............#','#.#.##.....##.#.#','#.#...........#.#','#.#####...#####.#','#...............#','#################'],
    decorations:[{x:1,y:1,w:3,kind:'sutra',label:'第一波'},{x:6,y:1,w:3,kind:'altar',label:'第七波'},{x:11,y:1,w:3,kind:'sutra',label:'终结'},{x:3,y:3,w:2,kind:'candle'},{x:7,y:3,w:3,kind:'seal'},{x:12,y:3,w:2,kind:'candle'},{x:3,y:7,w:2,kind:'blacktide'},{x:7,y:7,w:3,kind:'hair'},{x:12,y:7,w:2,kind:'blacktide'},{x:14,y:9,kind:'lantern'}],
    playerStart:{x:1,y:9}, npcs:[
      {name:'赵樱空',x:4,y:9,dialogue:[{speaker:'赵樱空',text:'第七波时我能固定她十秒，之后精神屏障会彻底崩溃。'},{speaker:'郑吒',text:'不需要第十一秒。完成压制后立刻撤回我身后。'}]},
      {name:'零点',x:11,y:7,dialogue:[{speaker:'零点',text:'弹道、距离、显形位置都已确认。只差目标真正出现。'},{speaker:'郑吒',text:'前六波我们替你守住枪线。第七波，把所有人的坚持变成那一枪。'}]},
    ],
    required:{x:8,y:5,name:'七波封印祭坛',icon:'封',dialogue:[{speaker:'詹岚',text:'七处经文已经连成闭环。每承受一波，中心封印就会亮起一层。'},{speaker:'郑吒',text:'所有人记住自己的位置。我们不是等死，是在等唯一的反击时刻。'}]},
    clue:{x:3,y:3,name:'楚轩终结阵图',icon:'阵',dialogue:[{speaker:'楚轩（记录）',text:'三角防线保护零点；郑吒位于中心承受主冲击；赵樱空在第七波固定目标。'},{speaker:'郑吒',text:'按阵图执行，但任何位置崩溃都先救人。活着完成，才是中洲队的答案。'}],battleEffect:{note:'终结阵图部署：全队攻击 +3、防御 +3。',party:{atk:3,def:3}}},
    supply:{x:14,y:9},battle:{x:13,y:5,name:'伽椰子真身'},exit:{x:15,y:1,name:'主神回归光柱'},
  },
});

function supplyFor(encounter, layout) {
  const medkit = Number(encounter.chapterOrder || 0) % 2 === 1;
  return {id:encounter.id+'-supply',type:'item',...layout.supply,name:medkit?'战术急救包':'群体止血喷雾',itemId:medkit?'first_aid':'team_spray',visual:medkit?'medkit':'spray',quantity:1,icon:medkit?'十':'雾',color:'#79e6a3'};
}

export function createChapterThreeExplorationScenario(encounter, theme) {
  const layout=LAYOUTS[encounter?.id];
  if(!layout)return null;
  const npcIds=layout.npcs.map((_,index)=>encounter.id+'-npc-'+(index+1));
  const requiredObject=encounter.id+'-required-object';
  return {
    id:encounter.id,title:encounter.title,subtitle:encounter.subtitle,region:layout.region,width:17,height:11,
    tiles:[...layout.tiles],playerStart:{...layout.playerStart},background:encounter.background,
    theme:{...theme,floor:layout.visualStyle.floor,wall:layout.visualStyle.wall,glow:layout.visualStyle.glow,label:layout.region},
    visualStyle:{...layout.visualStyle},decorations:layout.decorations.map(item=>({...item})),objective:layout.objective,
    entities:[
      ...layout.npcs.map((npc,index)=>({id:npcIds[index],type:'npc',x:npc.x,y:npc.y,required:true,name:npc.name,portrait:PORTRAITS[npc.name],dialogue:npc.dialogue.map(beat=>({...beat})),icon:index?'队':'人',color:index?'#d9a5ff':'#83d8ff'})),
      {id:requiredObject,type:'object',...layout.required,required:true,color:'#ffd16f'},
      {id:encounter.id+'-tactical-clue',type:'object',...layout.clue,clue:true,required:false,color:'#d6b4ff'},
      supplyFor(encounter,layout),
      {id:encounter.id+'-battle',type:'battle',...layout.battle,encounterId:encounter.id,requires:[...npcIds,requiredObject],icon:'怨',color:'#ff6f91',lockedText:'队伍尚未汇合，诅咒规律也没有确认。分散接触怨灵只会扩大伤亡。'},
      {id:encounter.id+'-exit',type:'exit',...layout.exit,icon:'出',color:'#ffd16f',lockedText:'怨灵仍在封锁退路，无法安全撤离。'},
    ],
  };
}
