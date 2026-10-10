const PORTRAITS=Object.freeze({
  张恒:'/assets/characters/zhang_heng.svg',萧宏律:'/assets/characters/xiao_honglv.svg',
  赵樱空:'/assets/characters/zhao_yingkong.svg',詹岚:'/assets/characters/zhan_lan.jpg',
  零点:'/assets/characters/lingdian.svg',齐腾一:'/assets/characters/qi_tengyi.svg',
});

const LAYOUTS=Object.freeze({
  'desert-caravan':{
    region:'撒哈拉商道 · 沙暴前线',objective:'与新队员汇合，检查受损车队，确认穿越沙暴抵达哈姆纳塔的安全方向。',
    visualStyle:{id:'sahara-caravan',floor:'#3b2b1b',wall:'#81643b',glow:'#ffc861',ambient:'#c89349'},
    tiles:['#################','#...............#','#..###.....###..#','#...............#','#.###..###..###.#','#...............#','#..###.....###..#','#...............#','#.#####...#####.#','#...............#','#################'],
    decorations:[{x:1,y:1,w:3,kind:'dune',label:'西风'},{x:6,y:1,w:3,kind:'sun'},{x:11,y:1,w:3,kind:'dune'},{x:2,y:3,w:3,kind:'wagon'},{x:7,y:3,w:2,kind:'track'},{x:11,y:5,w:3,kind:'sandvortex'},{x:3,y:7,w:2,kind:'crate'},{x:8,y:7,w:3,kind:'dune'},{x:14,y:7,kind:'beacon'}],
    playerStart:{x:1,y:9},npcs:[
      {name:'张恒',x:3,y:9,dialogue:[{speaker:'张恒',text:'火器和古武都能用。沙丘后的生命信号不是普通商人。'},{speaker:'郑吒',text:'先保护车队。你的火留给真正靠近的人。'}]},
      {name:'萧宏律',x:9,y:7,dialogue:[{speaker:'萧宏律',text:'三条车辙里只有中间那条没有被风抹掉，说明有人刚走过。'},{speaker:'郑吒',text:'印洲队已经在前面。我们追踪，但不能把商队丢在沙暴里。'}]},
    ],
    required:{x:5,y:5,name:'破损领航车',icon:'车',dialogue:[{speaker:'车队老人',text:'罗盘在沙暴里失灵了，只有死亡之城的双峰能指示方向。'},{speaker:'萧宏律',text:'太阳偏角和车辙吻合。印洲队也在朝同一个入口移动。'}]},
    clue:{x:13,y:3,name:'沙蝎蜕壳',icon:'蝎',dialogue:[{speaker:'张恒',text:'腹部甲片很薄。它们钻出沙面时会短暂翻身。'},{speaker:'郑吒',text:'等它们出沙再攻击，别把力量浪费在甲壳上。'}],battleEffect:{note:'沙蝎腹甲弱点确认：敌方防御 -3。',enemies:{def:-3}}},
    supply:{x:4,y:3},battle:{x:14,y:5,name:'沙蝎与劫掠者'},exit:{x:15,y:1,name:'哈姆纳塔商道'},
  },
  'cairo-intel':{
    region:'开罗旧城 · 屋顶集市',objective:'穿过被监视的集市，确认陵墓地图真伪，在斥候传出消息前封锁屋顶路线。',
    visualStyle:{id:'cairo-rooftops',floor:'#35251d',wall:'#77523b',glow:'#ff9b61',ambient:'#b36f4c'},
    tiles:['#################','#.....#.........#','#.....#..#####..#','#...............#','#.####...####...#','#...............#','#...####...####.#','#...............#','#.#####...#####.#','#...............#','#################'],
    decorations:[{x:1,y:1,w:3,kind:'awning',label:'香料'},{x:8,y:1,w:3,kind:'awning',label:'古物'},{x:12,y:1,w:2,kind:'minaret'},{x:2,y:3,w:3,kind:'market'},{x:7,y:5,w:2,kind:'laundry'},{x:10,y:5,w:3,kind:'awning'},{x:3,y:7,w:2,kind:'crate'},{x:12,y:7,w:2,kind:'footprint'},{x:14,y:9,kind:'beacon'}],
    playerStart:{x:1,y:9},npcs:[
      {name:'赵樱空',x:3,y:9,dialogue:[{speaker:'赵樱空',text:'屋顶有三名观察者，其中一个在重复达帕拉的手势。'},{speaker:'郑吒',text:'切断最高处的退路，其他人保护情报商。'}]},
      {name:'萧宏律',x:9,y:7,dialogue:[{speaker:'萧宏律',text:'情报商说谎了两次，但提到双狮入口时脉搏没有变化。'},{speaker:'郑吒',text:'地图可以用。现在别让印洲队知道我们相信哪一部分。'}]},
    ],
    required:{x:5,y:5,name:'哈姆纳塔地图',icon:'图',dialogue:[{speaker:'情报商',text:'双狮之间的阴影只在落日前出现，那是死亡之城真正的门。'},{speaker:'萧宏律',text:'纸张比墨迹老三十年，路线却刚被补画。有人故意留下可追踪的假出口。'}]},
    clue:{x:13,y:3,name:'斥候通讯记号',icon:'讯',dialogue:[{speaker:'赵樱空',text:'三短一长代表目标已确认。擦掉最后一笔，他们会误判这里仍安全。'},{speaker:'郑吒',text:'反过来利用它。让斥候以为我们还在市场下面。'}],battleEffect:{note:'斥候情报被误导：敌方速度 -3、攻击 -2。',enemies:{spd:-3,atk:-2}}},
    supply:{x:3,y:3},battle:{x:14,y:5,name:'印洲斥候'},exit:{x:15,y:1,name:'死亡之城入口'},
  },
  'tomb-machinery':{
    region:'哈姆纳塔 · 太阳甬道',objective:'读取太阳鹰蛇甲虫机关，检查棺椁封印，利用圣火打开通往真经的墓道。',
    visualStyle:{id:'solar-tomb',floor:'#302419',wall:'#725b35',glow:'#ffd36b',ambient:'#b48b4e'},
    tiles:['#################','#...............#','#.###..###..###.#','#.#...........#.#','#.#.##.....##.#.#','#...............#','#.#.###...###.#.#','#.#...........#.#','#.#####...#####.#','#...............#','#################'],
    decorations:[{x:1,y:1,w:3,kind:'hieroglyph',label:'太阳'},{x:6,y:1,w:3,kind:'hieroglyph',label:'鹰'},{x:11,y:1,w:3,kind:'hieroglyph',label:'蛇'},{x:3,y:3,w:2,kind:'torch'},{x:7,y:3,w:3,kind:'sarcophagus'},{x:12,y:3,w:2,kind:'torch'},{x:3,y:7,w:2,kind:'scarab'},{x:8,y:7,w:3,kind:'hieroglyph',label:'甲虫'},{x:14,y:9,kind:'beacon'}],
    playerStart:{x:1,y:9},npcs:[
      {name:'张恒',x:4,y:9,dialogue:[{speaker:'张恒',text:'棺椁里的东西怕火，但圣火储量有限，得留给祭司。'},{speaker:'郑吒',text:'普通守卫由我们拖住，你只打最关键的目标。'}]},
      {name:'赵樱空',x:10,y:7,dialogue:[{speaker:'赵樱空',text:'机关次序是太阳、鹰、蛇、甲虫。错一步，地板就会全部翻开。'},{speaker:'郑吒',text:'所有人踩我走过的位置，不许碰其他石砖。'}]},
    ],
    required:{x:8,y:5,name:'四象转轮机关',icon:'轮',dialogue:[{speaker:'赵樱空',text:'鹰指向太阳，蛇咬住鹰翼，甲虫托起太阳。顺序不是文字，是动作。'},{speaker:'萧宏律',text:'逆转最后一格，机关会把木乃伊封在另一侧甬道。'}]},
    clue:{x:13,y:7,name:'祭司焚烧记录',icon:'焰',dialogue:[{speaker:'张恒',text:'记录写着亡者惧怕净化火焰。圣火能穿透绷带和诅咒。'},{speaker:'郑吒',text:'标出祭司位置。开战后第一轮就让它失去施法能力。'}],battleEffect:{note:'圣火攻击窗口确认：全队攻击 +3，敌方防御 -2。',party:{atk:3},enemies:{def:-2}}},
    supply:{x:2,y:5},battle:{x:14,y:5,name:'甬道亡者'},exit:{x:15,y:1,name:'十字墓道'},
  },
  'india-ambush':{
    region:'十字墓道 · 团战伏击圈',objective:'识别印洲队火力位，检查齐腾一留下的符弹阵线，突破四面合围。',
    visualStyle:{id:'team-battle-crossroads',floor:'#2c201d',wall:'#695044',glow:'#ff655f',ambient:'#a96a58'},
    tiles:['#################','#.......#.......#','#.##....#....##.#','#.......#.......#','#..####...####..#','#...............#','#..###.....###..#','#.......#.......#','#.#####.#.#####.#','#...............#','#################'],
    decorations:[{x:1,y:1,w:3,kind:'hieroglyph'},{x:10,y:1,w:3,kind:'hieroglyph'},{x:7,y:3,w:2,kind:'crossroad',label:'伏击'},{x:2,y:5,w:3,kind:'barricade'},{x:7,y:5,w:2,kind:'blood'},{x:11,y:5,w:3,kind:'barricade'},{x:3,y:7,w:2,kind:'rune'},{x:12,y:7,w:2,kind:'weapon'},{x:15,y:9,kind:'beacon'}],
    playerStart:{x:1,y:9},npcs:[
      {name:'齐腾一',x:3,y:9,dialogue:[{speaker:'齐腾一',text:'左侧刺客身上有灵体护符，普通子弹打不穿。我来处理。'},{speaker:'郑吒',text:'打完立刻换位，不要留在交叉火力里。'}]},
      {name:'赵樱空',x:12,y:7,dialogue:[{speaker:'赵樱空',text:'右侧法师每次施法前会先看向祭坛。他在借墓室放大术式。'},{speaker:'郑吒',text:'我压住战士，你越过中线切断法师。'}]},
    ],
    required:{x:8,y:5,name:'印洲伏击标记',icon:'敌',dialogue:[{speaker:'萧宏律',text:'四面墙上的刻痕不是墓室符号，是印洲队刚画的射界边界。'},{speaker:'郑吒',text:'他们以为我们会走中心。改变队形，从两侧同时突破。'}]},
    clue:{x:13,y:3,name:'齐腾一符弹阵',icon:'符',dialogue:[{speaker:'齐腾一',text:'符弹落点可以连成临时封灵阵，能压住刺客的护符几秒。'},{speaker:'郑吒',text:'几秒足够。等他们进入交叉点再启动。'}],battleEffect:{note:'封灵符弹阵启动：敌方防御 -3，全队速度 +2。',enemies:{def:-3},party:{spd:2}}},
    supply:{x:5,y:7},battle:{x:14,y:1,name:'印洲队伏击'},exit:{x:15,y:9,name:'真经内殿'},
  },
  'resurrection-scripture':{
    region:'真经内殿 · 坍塌前线',objective:'取得复活真经，确认撤离石门状态，与零点建立最后射击位。',
    visualStyle:{id:'resurrection-sanctum',floor:'#30271a',wall:'#75623b',glow:'#ffe68a',ambient:'#c8a85d'},
    tiles:['#################','#...............#','###....#####....#','#...............#','#...##.....##...#','#...............#','#.###.#####.###.#','#...............#','##...#####...####','#...............#','#################'],
    decorations:[{x:1,y:1,w:3,kind:'hieroglyph'},{x:6,y:1,w:3,kind:'scripture',label:'复活'},{x:11,y:1,w:3,kind:'hieroglyph'},{x:2,y:3,w:3,kind:'sarcophagus'},{x:7,y:3,w:2,kind:'altar'},{x:11,y:5,w:3,kind:'collapse'},{x:2,y:7,w:3,kind:'gold'},{x:8,y:7,w:2,kind:'blood'},{x:14,y:7,kind:'torch'}],
    playerStart:{x:1,y:9},npcs:[
      {name:'零点',x:4,y:9,dialogue:[{speaker:'零点',text:'达帕拉会从西侧高台追上来。那里只有一个人能留下射界。'},{speaker:'郑吒',text:'没有谁必须留下。拿到真经后一起撤。'}]},
      {name:'赵樱空',x:10,y:7,dialogue:[{speaker:'赵樱空',text:'内殿承重柱已经断了两根。下一次术法冲击会让屋顶全部落下。'},{speaker:'郑吒',text:'先拿真经，再从东侧石门出去。速度比战斗更重要。'}]},
    ],
    required:{x:8,y:5,name:'复活真经',icon:'经',dialogue:[{speaker:'旁白',text:'金色经卷没有尘埃，翻开的第一页浮现出已经牺牲者的名字。'},{speaker:'郑吒',text:'齐腾一、楚轩、铭烟薇……把它带回去。一个名字都不能丢。'}]},
    clue:{x:13,y:3,name:'零点狙击测距',icon:'狙',dialogue:[{speaker:'零点',text:'石柱间距六十七码，风向稳定。达帕拉进入中线后只有一次横移机会。'},{speaker:'郑吒',text:'记住撤离路线。开枪以后立刻跟上，不准回头。'}],battleEffect:{note:'狙击射界完成测定：全队暴击 +7。',party:{crit:7}}},
    supply:{x:3,y:5},battle:{x:14,y:5,name:'真经争夺者'},exit:{x:15,y:1,name:'伊莫顿棺室'},
  },
  'imhotep-final':{
    region:'不死棺室 · 沙化终局',objective:'检查伊莫顿复生仪式，与张恒、詹岚确认圣火与精神压制位置，终结大祭司。',
    visualStyle:{id:'imhotep-sanctum',floor:'#291e13',wall:'#6e5129',glow:'#ffca55',ambient:'#b88a3f'},
    tiles:['#################','#...............#','#.###..#.#..###.#','#.#...........#.#','#.#..##...##..#.#','#...............#','#.#.##.....##.#.#','#.#...........#.#','#.#####...#####.#','#...............#','#################'],
    decorations:[{x:1,y:1,w:3,kind:'hieroglyph',label:'永生'},{x:6,y:1,w:3,kind:'sarcophagus',label:'祭司'},{x:11,y:1,w:3,kind:'hieroglyph',label:'死亡'},{x:3,y:3,w:2,kind:'torch'},{x:7,y:3,w:3,kind:'sandvortex'},{x:12,y:3,w:2,kind:'torch'},{x:3,y:7,w:2,kind:'mummywrap'},{x:7,y:7,w:3,kind:'scripture'},{x:12,y:7,w:2,kind:'sandvortex'},{x:14,y:9,kind:'beacon'}],
    playerStart:{x:1,y:9},npcs:[
      {name:'张恒',x:4,y:9,dialogue:[{speaker:'张恒',text:'圣火可以烧穿沙化，但必须在他重新聚成人形的瞬间命中核心。'},{speaker:'郑吒',text:'我逼他现形，你只负责最关键的一击。'}]},
      {name:'詹岚',x:11,y:7,dialogue:[{speaker:'詹岚',text:'印洲队的精神印记还藏在棺椁后面，他们想等我们两败俱伤。'},{speaker:'郑吒',text:'锁住印记。伊莫顿倒下前，不给任何人偷袭机会。'}]},
    ],
    required:{x:8,y:5,name:'伊莫顿复生祭坛',icon:'祭',dialogue:[{speaker:'伊莫顿',text:'活人把渴望写进经卷，却把代价埋进别人的棺椁。'},{speaker:'郑吒',text:'我们确实付出了代价。所以今天会带着真经和活着的人一起离开。'}]},
    clue:{x:3,y:3,name:'圣火聚焦铜镜',icon:'镜',dialogue:[{speaker:'张恒',text:'铜镜能把圣火集中到祭坛中心，沙化重组时核心会暴露得更久。'},{speaker:'郑吒',text:'调整角度。让每一次复生都变成他的弱点。'}],battleEffect:{note:'圣火铜镜完成聚焦：全队攻击 +4，敌方防御 -3。',party:{atk:4},enemies:{def:-3}}},
    supply:{x:14,y:9},battle:{x:13,y:5,name:'伊莫顿与近卫'},exit:{x:15,y:1,name:'主神回归光柱'},
  },
});

function supplyFor(encounter,layout){const medkit=Number(encounter.chapterOrder||0)%2===1;return{id:encounter.id+'-supply',type:'item',...layout.supply,name:medkit?'战术急救包':'群体止血喷雾',itemId:medkit?'first_aid':'team_spray',visual:medkit?'medkit':'spray',quantity:1,icon:medkit?'十':'雾',color:'#79e6a3'};}

export function createChapterFourExplorationScenario(encounter,theme){
  const layout=LAYOUTS[encounter?.id];if(!layout)return null;
  const npcIds=layout.npcs.map((_,index)=>encounter.id+'-npc-'+(index+1));const requiredObject=encounter.id+'-required-object';
  return{id:encounter.id,title:encounter.title,subtitle:encounter.subtitle,region:layout.region,width:17,height:11,tiles:[...layout.tiles],playerStart:{...layout.playerStart},background:encounter.background,
    theme:{...theme,floor:layout.visualStyle.floor,wall:layout.visualStyle.wall,glow:layout.visualStyle.glow,label:layout.region},visualStyle:{...layout.visualStyle},decorations:layout.decorations.map(x=>({...x})),objective:layout.objective,
    entities:[...layout.npcs.map((npc,index)=>({id:npcIds[index],type:'npc',x:npc.x,y:npc.y,required:true,name:npc.name,portrait:PORTRAITS[npc.name],dialogue:npc.dialogue.map(x=>({...x})),icon:index?'队':'人',color:index?'#ffce70':'#8fd9ff'})),
      {id:requiredObject,type:'object',...layout.required,required:true,color:'#ffd16f'},{id:encounter.id+'-tactical-clue',type:'object',...layout.clue,clue:true,required:false,color:'#8fe7ff'},supplyFor(encounter,layout),
      {id:encounter.id+'-battle',type:'battle',...layout.battle,encounterId:encounter.id,requires:[...npcIds,requiredObject],icon:'敌',color:'#ff5959',lockedText:'队伍尚未汇合，路线与敌情也没有确认。贸然进入只会落入伏击。'},
      {id:encounter.id+'-exit',type:'exit',...layout.exit,icon:'出',color:'#ffd16f',lockedText:'当前威胁尚未清除，撤离通道仍被封锁。'}]};
}
