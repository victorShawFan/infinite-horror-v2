# 无限恐怖：中洲轮回 · 回合制重构

> 队伍回合制战斗 + 主神空间技能构筑 + 恐怖世界叙事 RPG

基于网络小说《无限恐怖》，以主角郑吒为视角，经历十二个恐怖电影世界的轮回之旅。

## 当前开发状态

默认入口现为回合制重构首章切片：玩家在主神空间消耗奖励点学习技能并装入
技能栏，依次推进从“列车醒来”到“暴君追猎”的六场完整任务；每个我方回合
主动选择普通攻击、单体技能、群体技能、治疗或防御，并可看到速度行动序列、
敌方真实技能意图和Boss阶段变化。暴君会在半血后进入狂暴并解锁群体技能；
战斗奖励会写回主神空间并解锁下一场任务。

旧版完整 12 章代码、地图、剧情和系统仍保留，用于逐步迁移：

- 默认新版：`http://localhost:3000/`
- 旧版存档：`http://localhost:3000/legacy.html`
- 重构设计：`docs/rebuild/2026-10-10-turn-based-rebuild-design.md`

## 🎮 游戏特色

- **十二章完整剧情** — 从生化危机到魔戒，从咒怨到星河战队
- **主动回合制战斗** — 速度排序、选择目标、单体/群体技能、独立冷却、防御和敌方意图
- **结构化战斗演出** — 攻击位移、受击震动、暴击飘字、治疗光效和Boss阶段警报
- **程序化战斗音效** — 按钮、攻击、暴击、治疗、防御、胜负和Boss狂暴均有独立反馈
- **技能构筑闭环** — 主神空间学习技能、奖励点消费、前置技能和有限技能栏
- **真实等级成长** — 战斗EXP写入档案，升级提升郑吒HP、MP、攻击与防御并进入后续战斗
- **深度成长系统** — 等级、装备、芯片、血统、基因锁 Build 将逐步迁移到新核心
- **叙事驱动** — 固定死亡、同伴复活、队伍管理、剧情选择
- **首章剧情闭环** — 六场任务均有角色简报、战后叙事，并以暴君终战终章卡收束
- **关卡专属规则** — 红后主控拥有节点保护，激光走廊按轮次扫射且可用防御减伤
- **主神空间** — 章节间整备、商店、强化、血统兑换
- **26种视觉主题** — 每个世界都有独特的色彩和氛围

## 🕹️ 操作说明

新版使用鼠标完成主神空间强化、战斗指令和目标选择。普通攻击与单体技能需要
选择一个敌人；群体技能会自动命中所有存活敌人。

## 🏗️ 技术栈

- **DOM/CSS 电影化战斗界面** — 新版队伍回合战斗
- **Canvas2D** — 旧版俯视探索与 12 章内容迁移来源
- **Vite** — 构建工具
- **纯 JavaScript ES Modules** — 零依赖
- **Web Audio API** — 程序化音效
- **localStorage** — 存档系统

## 📦 安装运行

```bash
cd games/无限恐怖_1
npm install
npm run dev      # 开发模式 (http://localhost:5173)
npm run build    # 生产构建 → dist/
```

## 📊 项目数据

- 12 章 / 72 楼层 / 28 模块
- 9,000+ 行源码 / 2,000+ 行测试
- 20 个测试文件 / 31 项战斗模拟
- 26 套视觉主题 / 19 角色外观 / 20 敌人类型
- 12 段过场动画 / 完整通关结局

## 📖 章节一览

| 章 | 名称 | 世界 | Boss |
|----|------|------|------|
| 1 | 名为生化 | 生化危机 | 暴君 T-002 |
| 2 | 异形杀戮 | 异形 | 异形皇后 |
| 3 | 咒怨阴影 | 咒怨 | 伽椰子 |
| 4 | 神鬼秘宝 | 木乃伊 | 伊莫顿 |
| 5 | 死神绝境 | 死神来了 | 张杰考验 |
| 6 | 异形再临 | 异形四 | 新生异形 |
| 7 | 恶魔初临 | 生化危机二 | 复制体郑吒 |
| 8 | 重建中洲 | 侏罗纪公园 | 远古巨龙 |
| 9 | 星河远征 | 星河战队 | 脑虫 |
| 10 | 五队大战 | 魔戒 | 天神队先锋 |
| 11 | 心魔与终战前奏 | 猛鬼街/天煞 | 弗莱迪 |
| 12 | 生化终战 | 最终一战 | 复制体郑吒·终极 |

## 🧪 测试

```bash
# 全量测试
for t in test_*.mjs; do node "$t" || exit 1; done

# 单项测试
node test_rebuild_turn_battle.mjs    # 新回合制引擎
node test_rebuild_skill_learning.mjs # 主神空间技能学习
node test_rebuild_campaign.mjs       # 首章任务解锁与奖励
node test_rebuild_chapter_playthrough.mjs # 首章三战完整通关
node test_rebuild_enemy_ai.mjs       # 敌方技能与意图策略
node test_full_playthrough.mjs       # 旧版 Ch1-12 通关回归
node test_entity_placement.mjs  # 实体位置 + Renderer契约
node test_bfs_ch7.mjs           # 单章 BFS 可达性
node test_combat_builds.mjs     # 战斗Build差异化
node test_game_logic.mjs        # 模块语法 + 数值验证
```

## 📁 项目结构

```
src/
├── main.js              # 主入口、游戏循环、事件处理
├── core/
│   ├── constants.js     # 常量定义
│   ├── GameState.js     # 状态管理 + 存档
│   ├── Renderer.js      # Canvas2D 渲染器
│   ├── SpriteRenderer.js # 精灵渲染 + 视觉主题
│   ├── CombatSystem.js  # 战斗引擎 + 预判
│   ├── CombatAnimation.js # 战斗动画
│   ├── StealthSystem.js # 潜行 + 弹药系统
│   ├── LordGodSpace.js  # 主神空间 + 商店
│   ├── AudioEngine.js   # Web Audio 音效
│   ├── AssetLoader.js   # 资产加载
│   ├── Cutscene.js      # 12段过场动画
│   ├── EventBus.js      # 事件总线
│   ├── MapGenerator.js  # Ch1 地图生成
│   └── MapGenerator_Ch2-12.js # Ch2-12 地图生成
```

## 📜 授权

本项目基于网络小说《无限恐怖》（作者：zhttty）创作的同人游戏。
