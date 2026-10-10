const XENO = '/assets/enemies/alien_drone.svg';
const FACEHUGGER = '/assets/enemies/facehugger.svg';
const QUEEN = '/assets/enemies/alien_queen.svg';
const EGG_CLUSTER = '/assets/enemies/alien_egg_cluster.svg';

const enemy = (data) => ({
  mp: 0, maxMp: 0, crit: 4, skills: [], portrait: XENO, attackRange: 'melee',
  ...data,
});

export const CHAPTER_TWO_ENCOUNTERS = Object.freeze([
  {
    id: 'ship-lockdown', order: 7, chapterOrder: 1, chapterNumber: 2, chapter: '第二章 · 异形杀戮',
    title: '飞船封锁 · 黑暗中的刮擦声', threat: '中危',
    subtitle: '苏拉科号的日光灯逐盏熄灭，通风管里有什么正沿着队伍移动。',
    briefing: '识别抱脸虫的高速行动，并避免用近战完成异形终结一击。',
    background: '/assets/scenes/2-1_飞船封锁.svg',
    intro: [
      { speaker: '主神', text: '任务目标：在苏拉科号自毁前消灭异形皇后，并找到撤离舱。' },
      { speaker: '楚轩', text: '酸血是它们真正的武器。近距离完成击杀的人，会和猎物一起被腐蚀。' },
      { speaker: '零点', text: '最后一击交给枪口。只要它出现在射界里，我不会浪费子弹。' },
      { speaker: '郑吒', text: '全队压低声音。我们不是来证明谁更勇敢，是要把所有人带回去。' },
    ],
    victory: { title: '第一次听见蜂巢', text: '最后一只工蜂倒下后，整艘飞船都传来低沉震动——那不是机器，而是某种巨物的呼吸。' },
    rewards: { exp: 460, points: 520 }, repeatRewards: { exp: 115, points: 130 },
    enemies: [
      enemy({ id: 'facehugger-a', name: '抱脸虫α', role: '高速寄生', portrait: FACEHUGGER, hp: 54, maxHp: 54, atk: 23, def: 4, spd: 21, onDefeatDamage: 4 }),
      enemy({ id: 'xeno-drone', name: '异形工蜂', role: '酸血猎杀', hp: 118, maxHp: 118, atk: 28, def: 10, spd: 13, onDefeatDamage: 8 }),
      enemy({ id: 'facehugger-b', name: '抱脸虫β', role: '高速寄生', portrait: FACEHUGGER, hp: 54, maxHp: 54, atk: 23, def: 4, spd: 20, onDefeatDamage: 4 }),
    ],
  },
  {
    id: 'split-corridor', order: 8, chapterOrder: 2, chapterNumber: 2, chapter: '第二章 · 异形杀戮',
    title: '新人分队 · 两条死亡路线', threat: '中危',
    subtitle: '控制室与动力舱同时告急，而通风管里的猎手正在逼迫队伍分开。',
    briefing: '先处理速度更快的侦察兵，再突破筑巢者的重甲。',
    background: '/assets/scenes/2-2_新人分队.svg',
    intro: [
      { speaker: '楚轩', text: '必须分队。控制室能锁住舱门，动力舱能切断孵化区供电。两条路都不能放弃。' },
      { speaker: '李帅西', text: '我不想死……我只是想活着回去，这也有错吗？' },
      { speaker: '詹岚', text: '没有人觉得你有错。跟紧我，别离开灯光。' },
      { speaker: '郑吒', text: '张杰带上新人，我去动力舱。十分钟后，无论发生什么都在这里汇合。' },
    ],
    victory: { title: '没人能计算所有牺牲', text: '密封门重新闭合，李帅西却没能回来。金属地板上那道血迹，让“最优路线”第一次显得如此刺眼。' },
    rewards: { exp: 520, points: 580 }, repeatRewards: { exp: 130, points: 145 },
    enemies: [
      enemy({ id: 'xeno-scout', name: '异形侦察兵', role: '蜂巢示警', hp: 104, maxHp: 104, atk: 30, def: 8, spd: 19, onDefeatDamage: 7 }),
      enemy({ id: 'xeno-builder', name: '异形筑巢者', role: '重甲纠缠', hp: 152, maxHp: 152, atk: 28, def: 15, spd: 8, onDefeatDamage: 10 }),
    ],
  },
  {
    id: 'vent-hunt', order: 9, chapterOrder: 3, chapterNumber: 2, chapter: '第二章 · 异形杀戮',
    title: '通风管潜行 · 猎手与猎物', threat: '高危',
    subtitle: '狭窄管道放大每一次呼吸，黑暗中看不见的尾刃正等待错误发生。',
    briefing: '在追猎警报周期内快速减员，避免战斗拖入环境伤害轮次。',
    background: '/assets/scenes/2-3_通风管潜行.svg',
    intro: [
      { speaker: '主神', text: '警告：通风管结构不稳定。每三轮触发一次蜂巢追猎。' },
      { speaker: '零点', text: '左侧二十米，两只。第三只没有声音，它在等我们经过。' },
      { speaker: '楚轩', text: '真正的伏击者从不制造声源。郑吒，抬头。' },
      { speaker: '郑吒', text: '所有人趴下！它在天花板上！' },
    ],
    victory: { title: '黑暗也会留下轨迹', text: '零点在最后一声刮擦结束前扣下扳机。异形从头顶坠落，中洲队第一次学会在看不见敌人时战斗。' },
    rewards: { exp: 590, points: 650 }, repeatRewards: { exp: 148, points: 165 },
    rules: { roundHazard: { id: 'hive-hunt', name: '蜂巢追猎', interval: 3, damage: 11, targetSide: 'party' } },
    enemies: [
      enemy({ id: 'vent-patrol-a', name: '巡逻异形α', role: '无声巡猎', hp: 112, maxHp: 112, atk: 31, def: 10, spd: 16, onDefeatDamage: 8 }),
      enemy({ id: 'vent-ambusher', name: '伏击异形', role: '天花猎杀', hp: 148, maxHp: 148, atk: 35, def: 12, spd: 18, crit: 9, onDefeatDamage: 10 }),
      enemy({ id: 'vent-patrol-b', name: '巡逻异形β', role: '无声巡猎', hp: 112, maxHp: 112, atk: 31, def: 10, spd: 15, onDefeatDamage: 8 }),
    ],
  },
  {
    id: 'quarantine-lab', order: 10, chapterOrder: 4, chapterNumber: 2, chapter: '第二章 · 异形杀戮',
    title: '抱脸虫隔离 · 孵化倒计时', threat: '高危',
    subtitle: '隔离舱里的卵瓣缓缓张开，生命监测器上却显示着霸王的心跳。',
    briefing: '优先摧毁抱脸虫，再击破受其保护的孵化卵囊。',
    background: '/assets/scenes/2-4_抱脸虫隔离.svg',
    intro: [
      { speaker: '霸王', text: '这东西……像是在呼吸。里面是不是还有活人？' },
      { speaker: '郑吒', text: '别靠近那个——霸王，退后！' },
      { speaker: '旁白', text: '卵瓣在零点几秒内炸开。抱脸虫越过枪线，死死扣住了霸王的面部。' },
      { speaker: '楚轩', text: '已经来不及了。摧毁剩下的卵，否则这里会变成第二个蜂巢。' },
    ],
    victory: { title: '来不及说出口的名字', text: '火焰吞没最后一枚卵。郑吒没有回头看隔离舱，只把霸王的身份牌握得更紧。' },
    rewards: { exp: 680, points: 740 }, repeatRewards: { exp: 170, points: 185 },
    rules: { roundHazard: { id: 'hatch-pulse', name: '孵化脉冲', interval: 3, damage: 10, targetSide: 'party' } },
    enemies: [
      enemy({ id: 'lab-facehugger-a', name: '抱脸虫α', role: '寄生突袭', portrait: FACEHUGGER, hp: 72, maxHp: 72, atk: 29, def: 5, spd: 23, onDefeatDamage: 5 }),
      enemy({ id: 'egg-cluster', name: '异形卵囊群', role: '持续孵化', portrait: EGG_CLUSTER, hp: 178, maxHp: 178, atk: 25, def: 13, spd: 6, protectedBy: ['lab-facehugger-a', 'lab-facehugger-b'], protectionReduction: 0.55 }),
      enemy({ id: 'lab-facehugger-b', name: '抱脸虫β', role: '寄生突袭', portrait: FACEHUGGER, hp: 72, maxHp: 72, atk: 29, def: 5, spd: 22, onDefeatDamage: 5 }),
    ],
  },
  {
    id: 'hive-rescue', order: 11, chapterOrder: 5, chapterNumber: 2, chapter: '第二章 · 异形杀戮',
    title: '巢穴救援 · 基因锁二阶', threat: '极危',
    subtitle: '有机质覆盖整层甲板，失踪新人的装备散落在粘液与残骸之间。',
    briefing: '利用群攻清理战士，集中资源突破禁卫异形的高防御。',
    background: '/assets/scenes/2-5_巢穴救援.svg',
    intro: [
      { speaker: '楚轩', text: '他们不是被杀死，而是被带回来作为宿主。蜂巢需要的是繁殖效率。' },
      { speaker: '詹岚', text: '别再说效率了……那些都是和我们一起醒来的人。' },
      { speaker: '零点', text: '三只战士正在靠近。争论留到活下来以后。' },
      { speaker: '郑吒', text: '我不会再丢下任何还活着的人。基因锁——给我打开！' },
    ],
    victory: { title: '肌肉记住了活下去的方法', text: '面对蜂巢禁卫，郑吒第一次精确控制每一束肌肉。力量不再只是爆发，而成为可以掌握的选择。' },
    rewards: { exp: 790, points: 860 }, repeatRewards: { exp: 198, points: 215 },
    enemies: [
      enemy({ id: 'hive-warrior-a', name: '异形战士α', role: '尾刃突击', hp: 164, maxHp: 164, atk: 36, def: 13, spd: 15, onDefeatDamage: 11 }),
      enemy({ id: 'hive-elite', name: '禁卫异形', role: '皇后近卫', hp: 228, maxHp: 228, atk: 39, def: 18, spd: 13, crit: 8, onDefeatDamage: 14 }),
      enemy({ id: 'hive-warrior-b', name: '异形战士β', role: '尾刃突击', hp: 164, maxHp: 164, atk: 36, def: 13, spd: 14, onDefeatDamage: 11 }),
    ],
  },
  {
    id: 'queen-evacuation', order: 12, chapterOrder: 6, chapterNumber: 2, chapter: '第二章 · 异形杀戮',
    title: '皇后与撤离 · 自毁前三分钟', threat: '首领', boss: true,
    subtitle: '异形皇后的头冠遮住应急灯，自毁倒计时在尖啸中归零。',
    briefing: '先击破护卫，再压低皇后生命；二阶段保留治疗并承受蜂巢尖啸。',
    background: '/assets/scenes/2-6_皇后与撤离.svg',
    intro: [
      { speaker: '异形皇后', text: '——嘶——！' },
      { speaker: '楚轩', text: '它不是野兽。所有异形都在共享它的愤怒，杀死它，蜂巢才会停止。' },
      { speaker: '主神', text: '飞船自毁剩余时间：三分钟。撤离舱将在倒计时结束后脱离。' },
      { speaker: '郑吒', text: '零点，掩护出口。楚轩，别碰那些样本。我们一起回去。' },
    ],
    victory: { title: '人不是可以舍弃的数字', text: '逃生舱弹射的瞬间，楚轩放下了手中的异形样本。爆炸照亮他的镜片，却没有照出他究竟做了怎样的选择。' },
    epilogue: {
      chapterLabel: 'CHAPTER TWO COMPLETE', title: '异形杀戮', suffix: '完',
      quote: '“存活者：郑吒、张杰、詹岚、楚轩、零点。”',
      text: '中洲队带着新的同伴回到主神空间，也带回了无法被奖励点抹平的名字。楚轩开始理解牺牲不是数学，郑吒则第一次看见自己必须成为怎样的队长。',
      stats: ['第二章任务 6 / 6', '基因锁二阶觉醒', '下一世界：咒怨'],
    },
    rewards: { exp: 980, points: 1200, sideStories: { C: 1 } }, repeatRewards: { exp: 245, points: 300 },
    rules: { roundHazard: { id: 'self-destruct', name: '自毁冲击', interval: 2, damage: 14, targetSide: 'party' } },
    enemies: [
      enemy({ id: 'queen-guard-a', name: '皇后护卫α', role: '近卫封锁', hp: 168, maxHp: 168, atk: 36, def: 14, spd: 16, onDefeatDamage: 11 }),
      enemy({
        id: 'alien-queen', name: '异形皇后', role: '蜂巢母体', portrait: QUEEN, hp: 380, maxHp: 380, mp: 44, maxMp: 44, atk: 42, def: 19, spd: 12, crit: 10,
        skills: ['queen_impale', 'queen_screech'], boss: true, phase: 1, phaseThreshold: 0.5, phaseAtkBonus: 9, onDefeatDamage: 18,
      }),
      enemy({ id: 'queen-guard-b', name: '皇后护卫β', role: '近卫封锁', hp: 168, maxHp: 168, atk: 36, def: 14, spd: 15, onDefeatDamage: 11 }),
    ],
  },
]);
