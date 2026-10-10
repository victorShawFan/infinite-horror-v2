const LAYOUTS = Object.freeze({
  'train-awakening': {
    region: '封闭列车 · 后部车厢',
    objective: '唤醒队友，检查破损车门，在感染者闯入前完成战斗准备。',
    tiles: [
      '#################',
      '#...............#',
      '#..#####.#####..#',
      '#...............#',
      '#.#####...#####.#',
      '#...............#',
      '#..#####.#####..#',
      '#...............#',
      '#.#####...#####.#',
      '#...............#',
      '#################',
    ],
    playerStart: { x: 1, y: 9 },
    npcNames: ['张杰', '郑吒'],
    npcPositions: [{ x: 3, y: 9 }, { x: 7, y: 7 }],
    required: { x: 3, y: 1, name: '破损车门', icon: '门', dialogue: [
      { speaker: '郑吒', text: '门锁是从外侧被撞断的。它们不是偶然闯进来，而是在追逐这列车。' },
      { speaker: '张杰', text: '记住这个声音。下一次撞击之后，它们就会扑进来。' },
    ] },
    clue: { x: 13, y: 1, name: '乘务员录音', icon: '录', dialogue: [
      { speaker: '乘务员录音', text: '感染者会被列车广播吸引……请关闭后部扩音器。' },
      { speaker: '詹岚', text: '把声音引向另一节车厢，它们的包围会慢下来。' },
    ], battleEffect: { note: '广播诱导生效：敌方速度 -2。', enemies: { spd: -2 } } },
    supply: { x: 9, y: 9 }, battle: { x: 14, y: 3, name: '破门感染者' }, exit: { x: 15, y: 1, name: '前部车厢' },
  },
  'hive-platform': {
    region: '蜂巢站台 · 封锁层',
    objective: '与队伍汇合，检查封锁闸机，选择是否启动站台广播制造突破口。',
    tiles: [
      '#################',
      '#...............#',
      '#..#...#...#....#',
      '#..#...#...#....#',
      '#......#........#',
      '#.####.#.####...#',
      '#......#........#',
      '#..#.......#....#',
      '#..#.#####.#....#',
      '#...............#',
      '#################',
    ],
    playerStart: { x: 1, y: 9 },
    npcNames: ['张杰', '郑吒'],
    npcPositions: [{ x: 3, y: 9 }, { x: 9, y: 7 }],
    required: { x: 4, y: 4, name: '封锁闸机', icon: '闸', dialogue: [
      { speaker: '詹岚', text: '闸机只剩一条机械传动臂。强行开启后，我们没有第二次机会。' },
      { speaker: '郑吒', text: '那就等所有人到齐，再一起冲过去。' },
    ] },
    clue: { x: 13, y: 6, name: '站台广播台', icon: '播', dialogue: [
      { speaker: '张杰', text: '广播还能用。把警报切到东侧，尸群会露出短暂的空档。' },
      { speaker: '郑吒', text: '不是硬冲。先让它们朝错误的方向看。' },
    ], battleEffect: { note: '尸群阵线被广播撕开：全队攻击 +2。', party: { atk: 2 } } },
    supply: { x: 5, y: 7 }, battle: { x: 14, y: 2, name: '封锁尸群' }, exit: { x: 15, y: 9, name: '蜂巢入口' },
  },
  'red-queen-core': {
    region: '红后机房 · 主控环廊',
    objective: '确认断路原因，读取防卫结构，关闭红后的杀戮节点。',
    tiles: [
      '#################',
      '#......#........#',
      '#.####.#.####...#',
      '#......#........#',
      '###.#######.#####',
      '#...............#',
      '#.#####.#####...#',
      '#.....#.#.......#',
      '#.....#.#.#####.#',
      '#...............#',
      '#################',
    ],
    playerStart: { x: 1, y: 9 },
    npcNames: ['詹岚', '郑吒'],
    npcPositions: [{ x: 4, y: 9 }, { x: 9, y: 7 }],
    required: { x: 3, y: 5, name: '断路配电箱', icon: '电', dialogue: [
      { speaker: '詹岚', text: '不是故障。红后主动切断了人工控制，她在把我们赶向主机房。' },
      { speaker: '张杰', text: '既然她想让我们进去，就得先找出她藏好的杀招。' },
    ] },
    clue: { x: 13, y: 3, name: '冷却结构图', icon: '图', dialogue: [
      { speaker: '詹岚', text: '防卫节点共用一条冷却管。击穿接头，装甲会因过热主动展开。' },
      { speaker: '郑吒', text: '那不是墙，是一处还没被利用的弱点。' },
    ], battleEffect: { note: '冷却弱点已标记：敌方防御 -2。', enemies: { def: -2 } } },
    supply: { x: 2, y: 7 }, battle: { x: 14, y: 5, name: '红后防卫节点' }, exit: { x: 15, y: 1, name: '激光走廊' },
  },
  'laser-corridor': {
    region: '激光走廊 · 三段杀阵',
    objective: '检查遇难者留下的痕迹，判断激光循环，再穿过安保杀阵。',
    tiles: [
      '#################',
      '#...............#',
      '#######...#######',
      '#...............#',
      '###.........#####',
      '#...............#',
      '#######...#######',
      '#...............#',
      '###.........#####',
      '#...............#',
      '#################',
    ],
    playerStart: { x: 1, y: 9 },
    npcNames: ['张杰', '郑吒'],
    npcPositions: [{ x: 4, y: 9 }, { x: 10, y: 7 }],
    required: { x: 3, y: 5, name: '焦黑遗骸', icon: '骸', dialogue: [
      { speaker: '郑吒', text: '切口没有任何挣扎痕迹……上一秒还活着，下一秒就结束了。' },
      { speaker: '张杰', text: '恐惧会让你盯着尸体。活下去的人，要盯着光束从哪里来。' },
    ] },
    clue: { x: 8, y: 1, name: '激光控制台', icon: '控', dialogue: [
      { speaker: '詹岚', text: '循环是低位、交叉、全幅。每次全幅扫描后有零点八秒空档。' },
      { speaker: '郑吒', text: '记住节奏。它快，我们就比它更早一步。' },
    ], battleEffect: { note: '激光循环已破解：全队速度 +3，敌方攻击 -2。', party: { spd: 3 }, enemies: { atk: -2 } } },
    supply: { x: 13, y: 9 }, battle: { x: 13, y: 3, name: '激光安保阵列' }, exit: { x: 15, y: 1, name: '终端控制室' },
  },
  'crawler-outbreak': {
    region: '终端控制室 · 培养区',
    objective: '调查培养槽破裂原因，利用残存设施削弱爬行者。',
    tiles: [
      '#################',
      '#...............#',
      '#.##..##..##..#.#',
      '#.##..##..##..#.#',
      '#...............#',
      '#...###...###...#',
      '#...............#',
      '#.##..##..##..#.#',
      '#.##..##..##..#.#',
      '#...............#',
      '#################',
    ],
    playerStart: { x: 1, y: 9 },
    npcNames: ['詹岚', '郑吒'],
    npcPositions: [{ x: 4, y: 9 }, { x: 8, y: 6 }],
    required: { x: 3, y: 4, name: '破裂培养槽', icon: '槽', dialogue: [
      { speaker: '詹岚', text: '内壁上的爪痕在外侧。不是它自己逃出来的，有人提前释放了实验体。' },
      { speaker: '张杰', text: '先别找凶手。看看周围还有什么能让这些东西慢下来。' },
    ] },
    clue: { x: 12, y: 6, name: '镇静剂管线', icon: '剂', dialogue: [
      { speaker: '詹岚', text: '管线还有压力。把镇静剂雾化，它们的肌肉爆发会受到抑制。' },
      { speaker: '郑吒', text: '打开阀门。我们不需要公平，只需要所有人活着出去。' },
    ], battleEffect: { note: '镇静剂雾化完成：敌方攻击 -3。', enemies: { atk: -3 } } },
    supply: { x: 14, y: 9 }, battle: { x: 14, y: 4, name: '爬行者群' }, exit: { x: 15, y: 1, name: '回归列车通道' },
  },
  'tyrant-final': {
    region: '回归列车 · 最终站台',
    objective: '启动回归列车，确认暴君资料，在倒计时归零前突破追猎。',
    tiles: [
      '#################',
      '#...............#',
      '#.#####...#####.#',
      '#.#...........#.#',
      '#.#.###...###.#.#',
      '#...#.......#...#',
      '#.#.###...###.#.#',
      '#.#...........#.#',
      '#.#####...#####.#',
      '#...............#',
      '#################',
    ],
    playerStart: { x: 1, y: 9 },
    npcNames: ['詹岚', '郑吒'],
    npcPositions: [{ x: 5, y: 9 }, { x: 11, y: 7 }],
    required: { x: 8, y: 5, name: '列车启动台', icon: '启', dialogue: [
      { speaker: '红后', text: '回归列车启动。三分钟后封锁全部通道。' },
      { speaker: '郑吒', text: '三分钟不是死期，是我们必须一起抵达的终点。' },
    ] },
    clue: { x: 3, y: 3, name: 'T-002实验报告', icon: '档', dialogue: [
      { speaker: '詹岚', text: '它会优先攻击最接近列车的人。报告建议用重叠阵型分散冲击。' },
      { speaker: '张杰', text: '听她的。活下来靠的不是谁更勇敢，而是谁愿意替队友守住位置。' },
    ], battleEffect: { note: '暴君冲击模式已预判：全队防御 +3。', party: { def: 3 } } },
    supply: { x: 14, y: 9 }, battle: { x: 13, y: 5, name: '暴君 T-002' }, exit: { x: 15, y: 1, name: '主神光柱' },
  },
});

function dialogueSlice(encounter, start, end) {
  return (encounter.intro || []).slice(start, end).map(beat => ({ speaker: beat.speaker, text: beat.text }));
}

export function createChapterOneExplorationScenario(encounter, theme) {
  const layout = LAYOUTS[encounter?.id];
  if (!layout) return null;
  const npcOne = `${encounter.id}-npc-1`;
  const npcTwo = `${encounter.id}-npc-2`;
  const requiredObject = `${encounter.id}-required-object`;
  const [npcOnePosition, npcTwoPosition] = layout.npcPositions;
  return {
    id: encounter.id, title: encounter.title, subtitle: encounter.subtitle, region: layout.region,
    width: 17, height: 11, tiles: [...layout.tiles], playerStart: { ...layout.playerStart },
    background: encounter.background, theme: { ...theme, label: layout.region }, objective: layout.objective,
    entities: [
      { id: npcOne, type: 'npc', ...npcOnePosition, required: true, name: layout.npcNames[0], dialogue: dialogueSlice(encounter, 0, 2), icon: '人', color: '#79d9ff' },
      { id: npcTwo, type: 'npc', ...npcTwoPosition, required: true, name: layout.npcNames[1], dialogue: dialogueSlice(encounter, 2, 4), icon: '队', color: theme.glow },
      { id: requiredObject, type: 'object', ...layout.required, required: true, color: '#ffd16f' },
      { id: `${encounter.id}-tactical-clue`, type: 'object', ...layout.clue, clue: true, required: false, color: '#8fe7ff' },
      { id: `${encounter.id}-supply`, type: 'item', ...layout.supply, name: encounter.order % 2 ? '战术急救包' : '群体止血喷雾', itemId: encounter.order % 2 ? 'first_aid' : 'team_spray', quantity: 1, icon: '补', color: '#79e6a3' },
      { id: `${encounter.id}-battle`, type: 'battle', ...layout.battle, encounterId: encounter.id, requires: [npcOne, npcTwo, requiredObject], icon: '敌', color: '#ff5959', lockedText: '队伍尚未汇合，现场也没有调查完毕。贸然接敌会让所有人送命。' },
      { id: `${encounter.id}-exit`, type: 'exit', ...layout.exit, icon: '出', color: '#ffd16f', lockedText: '战斗目标尚未完成，撤离通道仍被封锁。' },
    ],
  };
}
