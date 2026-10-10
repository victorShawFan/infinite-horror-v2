const DESERT = '/assets/enemies/desert_raider.svg';
const MUMMY = '/assets/enemies/mummy_guard.svg';
const IMHOTEP = '/assets/enemies/imhotep.svg';

const foe = data => ({ mp:0,maxMp:0,crit:5,skills:[],portrait:DESERT,attackRange:'melee',...data });
const mummy = data => foe({ portrait:MUMMY, weaknesses:['fire','holy'], ...data });

export const CHAPTER_FOUR_ENCOUNTERS = Object.freeze([
 {
  id:'desert-caravan',order:19,chapterOrder:1,chapterNumber:4,chapter:'第四章 · 神鬼秘宝',title:'沙漠车队 · 哈姆纳塔方向',threat:'高危',
  subtitle:'灼热地平线上，商队与巨蝎同时出现；更远处还有另一支主神队伍。',briefing:'保护车队，优先击破高速毒蝎，避免沙暴轮次拖垮全队。',background:'/assets/scenes/4-1_沙漠车队.svg',
  rules:{roundHazard:{id:'sandstorm',name:'沙暴侵蚀',interval:3,damage:12,targetSide:'party'}},
  intro:[{speaker:'主神',text:'特殊任务：取得复活真经。警告：印洲队将争夺同一目标。'},{speaker:'张恒',text:'张恒。古武和火器都会一点，别问过去。'},{speaker:'萧宏律',text:'先说好，我不是累赘。我只是比较擅长让别人以为我是累赘。'},{speaker:'赵樱空',text:'沙丘后有三组生命信号。不是商人——准备战斗。'}],
  victory:{title:'死亡之城的坐标',text:'车队在落日前穿过沙暴，老人用颤抖的手指向哈姆纳塔。另一串脚印却早已通往同一方向。'},rewards:{exp:2040,points:2050},repeatRewards:{exp:510,points:515},
  enemies:[foe({id:'sand-scorpion',name:'巨型沙蝎',role:'钳击压制',hp:188,maxHp:188,atk:38,def:13,spd:14}),foe({id:'venom-scorpion',name:'毒蝎',role:'高速毒刺',hp:142,maxHp:142,atk:40,def:9,spd:20}),foe({id:'desert-raider',name:'沙匪头目',role:'车队劫掠',hp:206,maxHp:206,atk:39,def:14,spd:13})]
 },
 {
  id:'cairo-intel',order:20,chapterOrder:2,chapterNumber:4,chapter:'第四章 · 神鬼秘宝',title:'开罗情报 · 被跟踪的地图',threat:'高危',
  subtitle:'开罗市场人声鼎沸，印洲队斥候在屋顶之间交换着跟踪手势。',briefing:'击败斥候与窃贼，在情报被送出前确认印洲队路线。',background:'/assets/scenes/4-2_开罗情报.svg',
  intro:[{speaker:'情报商',text:'哈姆纳塔不欢迎活人。更不欢迎两支同时寻找它的队伍。'},{speaker:'赵樱空',text:'印洲队队长达帕拉，擅长精神与暗杀。他们已经先行半天。'},{speaker:'萧宏律',text:'屋顶那个人听到名字后就走了。说明情报是真的。'},{speaker:'郑吒',text:'截住他。不能让印洲队知道我们拿到了地图。'}],
  victory:{title:'情报从来不是免费的',text:'斥候倒下时捏碎了通讯器。中洲队拿到陵墓入口，也让达帕拉知道敌人已经来了。'},rewards:{exp:2160,points:2180},repeatRewards:{exp:540,points:545},
  enemies:[foe({id:'india-scout',name:'印洲队斥候',role:'情报传递',faction:'india',hp:212,maxHp:212,atk:41,def:14,spd:19,attackRange:'ranged'}),foe({id:'cairo-thief',name:'开罗窃贼',role:'烟幕偷袭',hp:166,maxHp:166,atk:36,def:10,spd:17})]
 },
 {
  id:'tomb-machinery',order:21,chapterOrder:3,chapterNumber:4,chapter:'第四章 · 神鬼秘宝',title:'陵墓机关 · 太阳鹰蛇甲虫',threat:'极危',
  subtitle:'象形文字在火光中转动，选错一步就会唤醒整条甬道的亡者。',briefing:'利用张恒的圣火攻击木乃伊弱点，并在圣甲虫包围前完成机关。',background:'/assets/scenes/4-3_陵墓机关.svg',
  intro:[{speaker:'赵樱空',text:'太阳、鹰、蛇、甲虫。按照亡灵之书的次序触碰。'},{speaker:'萧宏律',text:'地砖下面全是空的。答错的话，我们会和机关一起掉下去。'},{speaker:'张恒',text:'棺椁开了。都站到火炬后面，它们怕火。'},{speaker:'主神',text:'元素弱点激活：火焰攻击木乃伊时造成额外伤害。'}],
  victory:{title:'活人的火穿过死者长廊',text:'圣火烧尽绷带与诅咒，机关在众人身后永久闭合。复活真经的金光从更深处透来。'},rewards:{exp:2320,points:2350},repeatRewards:{exp:580,points:590},
  enemies:[mummy({id:'mummy-guard',name:'木乃伊守卫',role:'重甲复苏',hp:238,maxHp:238,atk:42,def:18,spd:10}),mummy({id:'mummy-archer',name:'木乃伊弓手',role:'诅咒箭雨',hp:184,maxHp:184,atk:43,def:12,spd:16,attackRange:'ranged'}),foe({id:'scarab-swarm',name:'圣甲虫群',role:'吞噬血肉',portrait:MUMMY,hp:156,maxHp:156,atk:39,def:8,spd:21,weaknesses:['fire']})]
 },
 {
  id:'india-ambush',order:22,chapterOrder:4,chapterNumber:4,chapter:'第四章 · 神鬼秘宝',title:'印洲队伏击 · 团战第一次流血',threat:'极危',teamBattle:true,
  subtitle:'十字墓道的四面同时亮起武器冷光，主神终于让两支队伍正面相撞。',briefing:'优先处理高速刺客与法师，避免后排被集中击穿。',background:'/assets/scenes/4-4_印洲队伏击.svg',
  intro:[{speaker:'达帕拉',text:'欢迎来到哈姆纳塔，中洲队。你们替我们解开机关，做得很好。'},{speaker:'齐腾一',text:'左侧刺客交给我。队长，别让那个法师完成施法。'},{speaker:'郑吒',text:'这不是积分游戏。所有人互相看住，不许有人掉队！'},{speaker:'主神',text:'团队战开始。击败敌对轮回者可获得额外奖励点。'}],
  victory:{title:'团战没有真正的赢家',text:'印洲队撤入墓道深处，齐腾一却再也没有站起来。他最后一发符弹仍钉在刺客胸口。'},rewards:{exp:2500,points:2700},repeatRewards:{exp:625,points:675},
  enemies:[foe({id:'india-warrior',name:'印洲队·战士',role:'正面强攻',faction:'india',hp:246,maxHp:246,atk:45,def:17,spd:14}),foe({id:'india-assassin',name:'印洲队·刺客',role:'后排猎杀',faction:'india',hp:198,maxHp:198,atk:49,def:12,spd:22,crit:12}),foe({id:'india-mage',name:'印洲队·法师',role:'黑暗术法',faction:'india',hp:186,maxHp:186,atk:46,def:10,spd:17,attackRange:'ranged',damageType:'dark'})]
 },
 {
  id:'resurrection-scripture',order:23,chapterOrder:5,chapterNumber:4,chapter:'第四章 · 神鬼秘宝',title:'复活真经 · 零点最后一枪',threat:'极危',afterQiSacrifice:true,
  subtitle:'真经已经到手，达帕拉却截断撤退路线；零点独自留在最后一个射击位。',briefing:'突破印洲精锐与祭司，保护复活真经撤出内殿。',background:'/assets/scenes/4-5_复活真经.svg',
  intro:[{speaker:'赵樱空',text:'就是它。复活真经——能让已经牺牲的人重新回来。'},{speaker:'零点',text:'拿上书先走。我留下看住达帕拉。'},{speaker:'郑吒',text:'不行，我们一起撤。已经没有人可以再被留下！'},{speaker:'零点',text:'队长，这次不是被留下。是我选择这个位置。'}],
  victory:{title:'枪声留在坍塌的内殿',text:'零点最后一枪击中达帕拉，自己也消失在落石后。郑吒抱紧真经，那重量像所有死者的名字。'},rewards:{exp:2680,points:2900},repeatRewards:{exp:670,points:725},
  enemies:[foe({id:'india-elite',name:'印洲队·精锐',role:'真经夺取',faction:'india',hp:278,maxHp:278,atk:48,def:18,spd:17}),mummy({id:'mummy-priest',name:'木乃伊祭司',role:'亡者召唤',hp:244,maxHp:244,atk:46,def:15,spd:13,attackRange:'ranged',damageType:'dark'})]
 },
 {
  id:'imhotep-final',order:24,chapterOrder:6,chapterNumber:4,chapter:'第四章 · 神鬼秘宝',title:'伊莫顿 · 沙尘复生终局',threat:'首领',boss:true,postDualSacrifice:true,
  subtitle:'棺椁开启，大祭司化作沙尘重组；印洲残部仍在暗处等待最后机会。',briefing:'先清除近卫；用圣火克制伊莫顿的沙化，并压过每轮复生。',background:'/assets/scenes/4-6_伊莫顿终局.svg',
  rules:{roundHazard:{id:'tomb-collapse',name:'陵墓崩塌',interval:3,damage:13,targetSide:'party'}},
  intro:[{speaker:'伊莫顿',text:'三千年过去，活人的贪欲仍把祭品送到我的棺前。'},{speaker:'张恒',text:'近卫交给我。圣火能烧穿他的沙化，但别让他有喘息时间。'},{speaker:'詹岚',text:'印洲队还在附近。我们必须在陵墓彻底坍塌前结束。'},{speaker:'郑吒',text:'为了齐腾一和零点——真经和活着的人，我都要带回去！'}],
  victory:{title:'真经记住所有牺牲者',text:'伊莫顿在圣火中化作失去意志的黄沙。夕阳下，复活真经翻开第一页，死者的名字终于有了归路。'},
  epilogue:{chapterLabel:'CHAPTER FOUR COMPLETE',title:'神鬼秘宝',suffix:'完',quote:'“只要真经还在，他们就不只是回忆。”',text:'齐腾一和零点倒在真经近旁，张恒与萧宏律第一次真正成为中洲队的一员。郑吒带回的不只是一本书，而是未来向死亡讨回同伴的可能。',stats:['第四章任务 6 / 6','复活真经已取得','下一世界：死神来了']},
  rewards:{exp:3200,points:3500},repeatRewards:{exp:800,points:875},
  enemies:[mummy({id:'mummy-elite-a',name:'木乃伊近卫α',role:'棺椁守卫',hp:224,maxHp:224,atk:43,def:18,spd:13}),foe({id:'imhotep',name:'伊莫顿',role:'不死大祭司',portrait:IMHOTEP,hp:560,maxHp:560,mp:56,maxMp:56,atk:45,def:18,spd:14,crit:9,skills:['sand_spear','plague_wind'],boss:true,phase:1,phaseThreshold:.45,phaseAtkBonus:6,physicalResist:.3,weaknesses:['fire','holy'],roundRegen:18,damageType:'dark',attackRange:'ranged'}),mummy({id:'mummy-elite-b',name:'木乃伊近卫β',role:'棺椁守卫',hp:224,maxHp:224,atk:43,def:18,spd:12})]
 }
]);
