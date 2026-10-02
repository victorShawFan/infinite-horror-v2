# 无限恐怖：中洲轮回

> 2D 俯视角 Roguelike + 魔塔式数值战斗 + 叙事选择 RPG

基于网络小说《无限恐怖》，以主角郑吒为视角，经历十二个恐怖电影世界的轮回之旅。

## 🎮 游戏特色

- **十二章完整剧情** — 从生化危机到魔戒，从咒怨到星河战队
- **魔塔式战斗预判** — 碰撞即战斗，战前可预览胜负
- **深度成长系统** — 等级、装备、芯片、血统、基因锁 Build
- **叙事驱动** — 固定死亡、同伴复活、队伍管理、剧情选择
- **主神空间** — 章节间整备、商店、强化、血统兑换
- **26种视觉主题** — 每个世界都有独特的色彩和氛围

## 🕹️ 操作说明

| 按键 | 功能 |
|------|------|
| WASD / 方向键 | 移动 |
| 空格 | 互动/确认/跳过对话 |
| Shift + 移动 | 潜行（第二章起） |
| R | 装弹 |
| 鼠标悬停 | 查看敌人信息/战斗预判 |

## 🏗️ 技术栈

- **Canvas2D** — 像素风 48x48 格子渲染
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
node test_full_game.mjs         # Ch1-12 战斗通关模拟
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
