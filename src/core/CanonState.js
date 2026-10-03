// ═══════════════════════════════════════════════════════════════
// 正史状态机 (CanonState)
// ──────────────────────────────────────────────────────────────
// 设计约束：
//   1. canon_state 是人物生死与队长身份的唯一权威
//   2. 战斗 HP 归零 ≠ 正史死亡；只有剧情事件才能写入死亡
//   3. 固定死亡不能通过高评分、刷点或读档分支取消
//   4. 正史存档与非正史模拟存档完全分离
// ═══════════════════════════════════════════════════════════════

const CHARACTER_DB = {
  zheng_zha:     { name: '郑吒', role: 'protagonist', joinChapter: 1 },
  zhang_jie:     { name: '张杰', role: 'captain',     joinChapter: 1 },
  zhan_lan:      { name: '詹岚', role: 'member',      joinChapter: 1 },
  li_xiaoyi:     { name: '李萧毅', role: 'member',    joinChapter: 1 },
  chu_xuan:      { name: '楚轩', role: 'strategist',  joinChapter: 2 },
  ling_dian:     { name: '零点', role: 'sniper',      joinChapter: 2 },
  zhao_yingkong: { name: '赵樱空', role: 'assassin',  joinChapter: 3 },
  qi_tengyi:     { name: '齐腾一', role: 'scholar',   joinChapter: 3 },
  ming_yanwei:   { name: '铭烟薇', role: 'member',    joinChapter: 3 },
  ba_wang:       { name: '霸王', role: 'heavy',       joinChapter: 2 },
  zhang_heng:    { name: '张恒', role: 'support',     joinChapter: 4 },
  xiao_honglv:   { name: '萧宏律', role: 'analyst',   joinChapter: 4 },
  wang_xia:      { name: '王侠', role: 'explosive',   joinChapter: 5 },
  cheng_xiao:    { name: '程啸', role: 'medic',       joinChapter: 6 },
  luo_gandao:    { name: '罗甘道', role: 'pilot',     joinChapter: 8 },
};

// 正史死亡时间线 — 不可逆、不可通过游戏表现改变
const CANON_DEATHS = {
  // Ch1
  mou_gang:        { chapter: 1, floor: 5, event: '爬行者围攻', irrevocable: true },
  // Ch2
  li_xiaoyi:       { chapter: 2, floor: 5, event: '抱脸虫酸血', irrevocable: true },
  ba_wang_ch2:     { chapter: 2, floor: 6, event: '异形围攻掩护撤离', irrevocable: true },
  // Ch3
  ming_yanwei:     { chapter: 3, floor: 4, event: '恐惧暴走', irrevocable: true },
  chu_xuan_ch3:    { chapter: 3, floor: 5, event: '伽椰子预留情报牺牲', irrevocable: true },
  // Ch4
  qi_tengyi:       { chapter: 4, floor: 4, event: '印洲队精神袭击', irrevocable: true },
  ling_dian_ch4:   { chapter: 4, floor: 6, event: '伊莫顿战斗中阵亡', irrevocable: true },
  // Ch5
  wang_xia_ch5:    { chapter: 5, floor: 4, event: '固定死亡线', irrevocable: true },
  zhang_jie:       { chapter: 5, floor: 6, event: '张杰牺牲·不可复活', irrevocable: true, noResurrect: true },
  // Ch7 — 团灭后只有郑吒经十字勋章复活
  // Ch8 — 复活楚轩等
  luo_gandao:      { chapter: 8, floor: 6, event: '负点被主神抹杀', irrevocable: true },
};

// 队长交接时间线
const CAPTAIN_TRANSITIONS = [
  { chapter: 1, captain: 'zhang_jie', event: '张杰是初始队长' },
  { chapter: 5, floor: 6, captain: 'zheng_zha', event: '张杰牺牲后郑吒成为队长' },
];

// 复活时间线（Ch8-9）
const RESURRECTIONS = {
  chu_xuan:      { chapter: 8, floor: 2, cost: '奖励点', event: '楚轩复活仪式' },
  ba_wang:       { chapter: 8, floor: 3, cost: '奖励点', event: '侏罗纪中复活' },
  wang_xia:      { chapter: 8, floor: 3, cost: '奖励点', event: '侏罗纪中复活' },
  ling_dian:     { chapter: 9, floor: 1, cost: '奖励点', event: '陵墓复活仪式' },
  zhan_lan:      { chapter: 9, floor: 1, cost: '奖励点', event: '陵墓复活仪式' },
  luo_gandao:    { chapter: 9, floor: 2, cost: '奖励点', event: '主神十日整备' },
  zhao_yingkong: { chapter: 10, floor: 2, cost: '支线', event: '三人复活' },
  zhang_heng:    { chapter: 10, floor: 2, cost: '支线', event: '三人复活' },
  cheng_xiao:    { chapter: 10, floor: 2, cost: '支线', event: '三人复活' },
};

class CanonState {
  constructor() {
    this.characters = {};
    this.captain = 'zhang_jie';
    this.chapter = 0;
    this.events = []; // 正史事件日志
    this._init();
  }

  _init() {
    for (const [id, info] of Object.entries(CHARACTER_DB)) {
      this.characters[id] = {
        id,
        name: info.name,
        role: info.role,
        alive: true,
        joinChapter: info.joinChapter,
        deathChapter: null,
        deathEvent: null,
        resurrected: false,
        noResurrect: false,
      };
    }
  }

  /**
   * 推进到指定章节和楼层 — 自动执行所有应生效的正史事件
   */
  advanceTo(chapter, floor) {
    this.chapter = chapter;
    
    // 执行正史死亡
    for (const [charId, death] of Object.entries(CANON_DEATHS)) {
      // 解析角色ID（去掉 _chN 后缀获取真实ID）
      const realId = charId.replace(/_ch\d+$/, '');
      const char = this.characters[realId];
      if (!char) continue;
      
      if (chapter > death.chapter || (chapter === death.chapter && floor >= death.floor)) {
        if (char.alive && !char.resurrected) {
          char.alive = false;
          char.deathChapter = death.chapter;
          char.deathEvent = death.event;
          if (death.noResurrect) char.noResurrect = true;
          this.events.push({
            type: 'death',
            characterId: realId,
            characterName: char.name,
            chapter: death.chapter,
            floor: death.floor,
            event: death.event,
            irrevocable: true,
          });
        }
      }
    }
    
    // 执行复活
    for (const [charId, res] of Object.entries(RESURRECTIONS)) {
      const char = this.characters[charId];
      if (!char) continue;
      
      if (chapter > res.chapter || (chapter === res.chapter && floor >= res.floor)) {
        if (!char.alive && !char.noResurrect && !char.resurrected) {
          char.alive = true;
          char.resurrected = true;
          this.events.push({
            type: 'resurrection',
            characterId: charId,
            characterName: char.name,
            chapter: res.chapter,
            floor: res.floor,
            event: res.event,
          });
        }
      }
    }
    
    // 队长交接
    for (const transition of CAPTAIN_TRANSITIONS) {
      if (chapter > transition.chapter || (chapter === transition.chapter && (transition.floor === undefined || floor >= transition.floor))) {
        if (this.captain !== transition.captain) {
          const prevCaptain = this.captain;
          this.captain = transition.captain;
          this.events.push({
            type: 'captain_change',
            from: prevCaptain,
            to: transition.captain,
            chapter: transition.chapter,
            event: transition.event,
          });
        }
      }
    }
  }

  /** 获取当前存活角色列表 */
  getAlive() {
    return Object.values(this.characters).filter(c => c.alive);
  }

  /** 获取当前死亡角色列表 */
  getDead() {
    return Object.values(this.characters).filter(c => !c.alive);
  }

  /** 获取当前队长 */
  getCaptain() {
    return this.characters[this.captain];
  }

  /** 查询角色是否可复活 */
  canResurrect(charId) {
    const char = this.characters[charId];
    if (!char || char.alive || char.noResurrect) return false;
    return charId in RESURRECTIONS;
  }

  /** 与 GameState 同步 — 将正史状态写入运行时 companions */
  syncToGameState(gameState) {
    if (!gameState.companions) return;
    for (const comp of gameState.companions) {
      const canon = this.characters[comp.id];
      if (canon) {
        comp.alive = canon.alive;
      }
    }
    gameState.captain = this.captain;
  }

  /** 序列化 */
  toJSON() {
    return {
      characters: this.characters,
      captain: this.captain,
      chapter: this.chapter,
      events: this.events,
    };
  }

  /** 反序列化 */
  fromJSON(data) {
    if (!data) return;
    if (data.characters) this.characters = data.characters;
    if (data.captain) this.captain = data.captain;
    if (data.chapter !== undefined) this.chapter = data.chapter;
    if (data.events) this.events = data.events;
  }
}

// 单例
let _instance = null;

export function getCanonState() {
  if (!_instance) _instance = new CanonState();
  return _instance;
}

export function resetCanonState() {
  _instance = new CanonState();
  return _instance;
}

export { CHARACTER_DB, CANON_DEATHS, CAPTAIN_TRANSITIONS, RESURRECTIONS };
