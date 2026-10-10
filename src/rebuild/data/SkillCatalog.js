import { TARGET_KIND } from '../core/TurnBattleEngine.js';

export const SKILL_CATALOG = Object.freeze({
  heavy_slash: {
    id: 'heavy_slash', name: '蓄势重斩', icon: '刃', school: '近战', tier: 1,
    target: TARGET_KIND.SINGLE_ENEMY, power: 1.55, mpCost: 5, cooldown: 1, cost: 0,
    desc: '将力量集中于一点，对单个敌人造成高额物理伤害。',
  },
  arc_sweep: {
    id: 'arc_sweep', name: '弧光横扫', icon: '弧', school: '近战', tier: 2,
    target: TARGET_KIND.ALL_ENEMIES, power: 0.82, mpCost: 10, cooldown: 2, cost: 350,
    prerequisite: 'heavy_slash',
    desc: '横向挥击形成冲击波，对全体敌人造成物理伤害。',
  },
  blood_burst: {
    id: 'blood_burst', name: '血炎爆发', icon: '血', school: '血统', tier: 3,
    target: TARGET_KIND.ALL_ENEMIES, power: 1.12, mpCost: 18, cooldown: 3, cost: 720,
    prerequisite: 'arc_sweep',
    desc: '燃烧血能席卷敌阵，对全体敌人造成强力血炎伤害。',
  },
  red_flame: {
    id:'red_flame',name:'红炎',icon:'炎',school:'血统',tier:2,exchangeOnly:true,
    target:TARGET_KIND.ALL_ENEMIES,power:.9,mpCost:12,cooldown:2,cost:0,damageType:'fire',
    desc:'以意志将血族能量引出体外，化为克制灵体的血色火焰。',
  },
  inner_burst: {
    id:'inner_burst',name:'内力爆发',icon:'气',school:'内力',tier:2,exchangeOnly:true,
    target:TARGET_KIND.SINGLE_ENEMY,power:1.7,mpCost:9,cooldown:2,cost:0,
    desc:'沿经脉瞬间释放内力，对单一目标造成强力近战冲击。',
  },
  psychic_lance: {
    id: 'psychic_lance', name: '精神穿刺', icon: '念', school: '精神', tier: 1,
    target: TARGET_KIND.SINGLE_ENEMY, power: 1.35, mpCost: 7, cooldown: 1, cost: 220,
    range: 'ranged',
    desc: '凝聚精神力攻击一个目标，无视部分常规防御。',
  },
  mind_storm: {
    id: 'mind_storm', name: '心灵风暴', icon: '暴', school: '精神', tier: 2,
    target: TARGET_KIND.ALL_ENEMIES, power: 0.72, mpCost: 13, cooldown: 2, cost: 460,
    range: 'ranged',
    prerequisite: 'psychic_lance',
    desc: '精神波动覆盖敌阵，对全体敌人造成伤害。',
  },
  emergency_heal: {
    id: 'emergency_heal', name: '紧急治疗', icon: '愈', school: '辅助', tier: 1,
    target: TARGET_KIND.SINGLE_ALLY, healPower: 1.8, mpCost: 8, cooldown: 1, cost: 260,
    desc: '为一名队员恢复生命。',
  },
  precision_shot: {
    id: 'precision_shot', name: '弱点点射', icon: '准', school: '枪械', tier: 1,
    target: TARGET_KIND.SINGLE_ENEMY, power: 1.42, mpCost: 6, cooldown: 1, cost: 0,
    range: 'ranged',
    desc: '张杰锁定敌人弱点，进行一次高精度射击。',
  },
  suppressive_fire: {
    id: 'suppressive_fire', name: '扇面压制', icon: '火', school: '枪械', tier: 2,
    target: TARGET_KIND.ALL_ENEMIES, power: 0.68, mpCost: 11, cooldown: 2, cost: 0,
    range: 'ranged',
    desc: '向敌方阵线倾泻火力，对全体敌人造成伤害。',
  },
  tactical_burst: {
    id: 'tactical_burst', name: '三点战术射', icon: '算', school: '枪械', tier: 2,
    target: TARGET_KIND.SINGLE_ENEMY, power: 1.38, mpCost: 6, cooldown: 1, cost: 0, learnable: false,
    range: 'ranged',
    desc: '楚轩根据敌人运动轨迹计算提前量，连续命中结构弱点。',
  },
  sniper_execution: {
    id: 'sniper_execution', name: '视界终结', icon: '狙', school: '枪械', tier: 3,
    target: TARGET_KIND.SINGLE_ENEMY, power: 1.72, mpCost: 8, cooldown: 1, cost: 0, learnable: false,
    range: 'ranged',
    desc: '零点屏住呼吸，将全部注意力压缩为一发致命狙击。',
  },
  crossfire: {
    id: 'crossfire', name: '交叉火力', icon: '网', school: '枪械', tier: 2,
    target: TARGET_KIND.ALL_ENEMIES, power: 0.62, mpCost: 12, cooldown: 2, cost: 0, learnable: false,
    range: 'ranged',
    desc: '零点与张杰建立交叉射界，压制敌方全体。',
  },
  spirit_sniper: {
    id: 'spirit_sniper', name: '灵类狙杀', icon: '灵', school: '灵能', tier: 3,
    target: TARGET_KIND.SINGLE_ENEMY, power: 1.58, mpCost: 7, cooldown: 1, cost: 0, learnable: false,
    range: 'ranged', damageType: 'spirit',
    desc: '零点以灵力弹锁定怨念核心，穿透灵体的物理减伤。',
  },
  soul_sever: {
    id: 'soul_sever', name: '断魂刃', icon: '断', school: '灵能', tier: 3,
    target: TARGET_KIND.SINGLE_ENEMY, power: 1.52, mpCost: 7, cooldown: 1, cost: 0, learnable: false,
    damageType: 'spirit',
    desc: '赵樱空以精神感应捕捉怨念缝隙，斩断灵体核心。',
  },
  ward_break: {
    id: 'ward_break', name: '破邪结界', icon: '界', school: '灵能', tier: 3,
    target: TARGET_KIND.ALL_ENEMIES, power: 0.7, mpCost: 12, cooldown: 2, cost: 0, learnable: false,
    range: 'ranged', damageType: 'spirit',
    desc: '赵樱空展开精神结界，对所有灵体造成灵类伤害。',
  },
  spirit_volley: {
    id: 'spirit_volley', name: '符弹连射', icon: '符', school: '灵能', tier: 2,
    target: TARGET_KIND.ALL_ENEMIES, power: 0.62, mpCost: 11, cooldown: 2, cost: 0, learnable: false,
    range: 'ranged', damageType: 'spirit',
    desc: '齐腾一以符文弹药覆盖战场，压制成群怨灵。',
  },
  kayako_grasp: {
    id: 'kayako_grasp', name: '怨发缠杀', icon: '发', school: '诅咒', tier: 4,
    target: TARGET_KIND.SINGLE_ENEMY, power: 1.42, mpCost: 8, cooldown: 1, cost: 0, learnable: false,
    range: 'ranged', damageType: 'spirit',
    desc: '黑发从阴影中涌出，扼住生命最微弱的人。',
  },
  curse_howl: {
    id: 'curse_howl', name: '七日哀鸣', icon: '怨', school: '诅咒', tier: 4,
    target: TARGET_KIND.ALL_ENEMIES, power: 0.6, mpCost: 13, cooldown: 2, cost: 0, learnable: false,
    range: 'ranged', damageType: 'spirit',
    desc: '伽椰子的哀鸣穿透墙壁，对所有活人造成精神冲击。',
  },
  sacred_flame: {
    id: 'sacred_flame', name: '太阳圣焰', icon: '焰', school: '圣火', tier: 3,
    target: TARGET_KIND.SINGLE_ENEMY, power: 1.62, mpCost: 7, cooldown: 1, cost: 0, learnable: false,
    range: 'ranged', damageType: 'fire',
    desc: '张恒引燃刻有太阳神纹的火炬，对木乃伊造成弱点伤害。',
  },
  sunfire_arc: {
    id: 'sunfire_arc', name: '圣火环流', icon: '阳', school: '圣火', tier: 3,
    target: TARGET_KIND.ALL_ENEMIES, power: 0.68, mpCost: 12, cooldown: 2, cost: 0, learnable: false,
    range: 'ranged', damageType: 'fire',
    desc: '太阳纹火焰沿地面扩散，焚烧所有亡者。',
  },
  sand_spear: {
    id: 'sand_spear', name: '沙矛穿心', icon: '沙', school: '亡灵', tier: 4,
    target: TARGET_KIND.SINGLE_ENEMY, power: 1.45, mpCost: 8, cooldown: 1, cost: 0, learnable: false,
    range: 'ranged', damageType: 'dark',
    desc: '伊莫顿将沙尘凝成尖矛，刺向生命最微弱的人。',
  },
  plague_wind: {
    id: 'plague_wind', name: '瘟疫风暴', icon: '疫', school: '亡灵', tier: 4,
    target: TARGET_KIND.ALL_ENEMIES, power: 0.62, mpCost: 13, cooldown: 2, cost: 0, learnable: false,
    range: 'ranged', damageType: 'dark',
    desc: '伊莫顿召唤腐败风暴，对全队造成黑暗伤害。',
  },
  tyrant_crush: {
    id: 'tyrant_crush', name: '粉碎重击', icon: '碎', school: '生化', tier: 3,
    target: TARGET_KIND.SINGLE_ENEMY, power: 1.45, mpCost: 8, cooldown: 1, cost: 0, learnable: false,
    desc: '暴君锁定受伤最重的目标，发动势大力沉的粉碎攻击。',
  },
  tyrant_roar: {
    id: 'tyrant_roar', name: '毁灭咆哮', icon: '吼', school: '生化', tier: 4,
    target: TARGET_KIND.ALL_ENEMIES, power: 0.7, mpCost: 14, cooldown: 2, cost: 0, learnable: false,
    desc: '狂暴阶段释放冲击波，对中洲队全体造成伤害。',
  },
  queen_impale: {
    id: 'queen_impale', name: '尾刃贯穿', icon: '刺', school: '异形', tier: 4,
    target: TARGET_KIND.SINGLE_ENEMY, power: 1.5, mpCost: 8, cooldown: 1, cost: 0, learnable: false,
    desc: '异形皇后以尾刃锁定最虚弱的猎物，发动贯穿攻击。',
  },
  queen_screech: {
    id: 'queen_screech', name: '蜂巢尖啸', icon: '啸', school: '异形', tier: 4,
    target: TARGET_KIND.ALL_ENEMIES, power: 0.72, mpCost: 14, cooldown: 2, cost: 0, learnable: false,
    range: 'ranged',
    desc: '二阶段以蜂巢意志冲击所有敌人的神经。',
  },
});

