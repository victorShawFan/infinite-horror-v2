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

