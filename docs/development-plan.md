# Labyrinth Composer 开发计划

状态：v0.1 项目启动计划  
日期：2026-06-15  
依据：`Labyrinth_Composer_空间谜题设计工具_研发设计文档_v0.1.docx` 与 `inscape-visual-design-system.md`

## 1. 项目定位

Labyrinth Composer 的第一阶段目标不是做完整地图编辑器，而是做一个本地优先的空间谜题逻辑编辑器与可达性验证器。

核心产品闭环：

1. 设计师创建 Space、Connection、Gate、Token、Puzzle、Beat。
2. 工具把关卡抽象为 Progression Graph、Spatial Graph、Puzzle Dependency Graph 和 Experience Timeline。
3. 验证器即时输出可达性、死锁、循环依赖、提示缺失、回溯成本和节奏问题。
4. 设计师根据诊断链和修复建议调整结构。
5. 项目保存为可版本控制的 JSON，并可导出给引擎或评审流程。

## 2. 研发原则

- 先设计可达性，再设计地图：MVP 解决玩家能到哪里、为什么不能去、如何解锁，不追求最终几何地图。
- 核心正确性来自确定性验证器：AI、自动生成和建议功能只能作为辅助层。
- 领域核心独立于 UI：验证器、Schema、迁移、规则包和测试夹具放在独立包中。
- 本地优先：项目文件可读、可 diff、可离线使用，协作和云端后置。
- 诊断必须可解释：每条错误需要 affectedEntities、causeChain 和 suggestions。
- 视觉参考 Inscape，但只继承工作台气质：暖白纸面、低干扰工具层、克制节点图和清晰诊断，不照搬叙事编辑器的具体业务界面。

## 3. 技术架构决策

推荐从 TypeScript monorepo 起步：

```text
apps/
  desktop/          Tauri shell + React workbench
  web/              Web/PWA demo and review build
packages/
  core/             domain model, validators, graph algorithms
  schema/           JSON Schema, migrations, sample projects
  editor-ui/        React components, panels, design tokens
  graph-layout/     ELK.js wrappers and layout cache
  rulesets/         maze, zelda, horror presets
  exporters/        JSON/Unity/Godot export adapters
  test-fixtures/    canonical puzzle graphs and expected diagnostics
docs/
  development-plan.md
```

初始技术栈：

| 层面 | 选择 | 说明 |
| --- | --- | --- |
| 前端 | TypeScript + React + Vite | 适合复杂工具 UI 和类型驱动开发 |
| 桌面 | Tauri 2 | 小体积、安全边界清晰；保留 Web 构建 |
| 节点图 | React Flow / xyflow | MVP 快速搭建交互图 |
| 布局 | ELK.js | 用于进度图、依赖图和自动整理 |
| 状态 | Zustand + Immer | 适合命令流、归一化实体图和撤销/重做 |
| 验证 | TypeScript 纯函数 + Web Worker | 先保证迭代速度和测试覆盖 |
| 测试 | Vitest + Playwright | 核心算法单测，编辑器走端到端回放 |
| 数据 | 版本化 JSON，SQLite 后置 | MVP 先以 JSON 为 canonical source of truth |

Rust/WASM 不进入 MVP 主路径。只有当单项目达到数千节点、资源门状态搜索复杂化或插件沙箱成为真实需求时，再迁移热点模块。

## 4. 阶段路线

### Phase 0：项目骨架与领域内核

目标：让项目从文档进入可运行、可测试、可验证的最小工程形态。

交付：

- 初始化 monorepo、包管理、lint、format、test、build。
- 定义 v0 `ProjectGraph`、Space、Connection、Gate、Token、Puzzle、Beat、Diagnostic 类型。
- 定义 `.lcproj.json` 初版 Schema。
- 建立 3 个样例项目：Zelda 小地牢、恐怖解谜流程、叙事知识锁案例。
- 实现验证器 CLI：读取项目 JSON，输出 PASS/FAIL、reachable spaces、tokens、diagnostics。
- 建立 20-30 个测试夹具，覆盖 deadlock、circular dependency、missing input、basic backtracking。

验收：

- `npm test` 能稳定验证核心算法。
- CLI 能对样例项目输出可解释诊断。
- Schema 变更有 migration 占位机制。

### Phase 1：可交互 MVP 工作台

目标：做出本地可用的空间谜题设计工作台。

交付：

- Tauri + React/Vite 桌面壳。
- Progression View：节点创建、连接、Gate 绑定、锁定区域高亮。
- Spatial View：空间节点、真实连接、捷径、单向连接。
- Inspector：编辑 Space/Gate/Token/Puzzle/Beat 属性。
- Reachability Simulator：Validate 按钮、阶段/状态视图、可达/不可达高亮。
- Diagnostics Panel：错误列表、causeChain、affectedEntities 图上定位、修复建议。
- 项目保存/打开、JSON 导入/导出。
- 基础撤销/重做，所有 UI 修改通过 Command Bus。

验收：

- 能搭建文档里的三类参考关卡并发现关键错误。
- 设计师可以在 30 分钟内完成一个 10-20 节点样例并运行验证。
- 所有编辑命令可序列化并能被测试回放。

### Phase 2：专业规则包与体验分析

目标：从“能验证”走向“真的能帮关卡设计”。

交付：

- 通用迷宫、Zelda、恐怖解谜 3 个规则包。
- 回溯成本分析：Token 获取点到使用点距离、回程事件、新捷径建议。
- 提示距离分析：关键 Gate 是否被提前展示、Token 用途间隔是否过长。
- Experience Timeline：Beat 标注、强度曲线、节奏单调诊断。
- Rule Preset 配置文件和阈值编辑。
- 设计报告导出：Markdown/JSON 诊断摘要。

验收：

- 每个规则包有至少 10 个测试夹具。
- 诊断可分为 error/warning/info，且可被用户标记例外。
- 输出报告能用于团队评审。

### Phase 3：生产接入与协作准备

目标：让工具能进入真实游戏团队流程。

交付：

- Unity/Godot JSON importer 示例。
- CLI 验证器支持 CI 模式和稳定退出码。
- `.lcproj` 包结构探索：project.json、assets、exports、cache。
- 评论/评审数据结构。
- 协作前置设计：Yjs entity graph adapter 原型，不进入主路径。

验收：

- 示例项目能通过导出数据在引擎里定位 Space/Gate/Token。
- CI 能在提交中阻止不可通关的关卡数据。
- 本地项目文件仍然是可审查、可迁移的稳定真相。

## 5. 近期执行清单

第一轮开发建议按以下顺序推进：

1. 创建 TypeScript monorepo 和基础工具链。
2. 写 `packages/schema` 的实体类型与 JSON Schema。
3. 写 `packages/core` 的 reachability fixed-point validator。
4. 添加 3 个样例项目和第一批诊断夹具。
5. 写 CLI 验证器，先不做 UI。
6. 用 React Flow 搭 Progression View 原型。
7. 接入 Validate 按钮，把 Worker/CLI 同源验证结果显示到 UI。
8. 再补 Inspector、保存/打开和基础导出。

## 6. 视觉方向

当前 UI 应参考 Inscape 的工作台气质，而不是复刻其业务布局。

应保持：

- light-only 暖白纸面、暖黑正文、低饱和橄榄灰强调。
- 顶栏、状态、路径、计数默认退后，hover/focus 后增强。
- 节点图使用浅色 grid canvas、轻边框、低阴影和真实 port edge。
- 诊断面板清晰但不喧宾夺主，错误显式，不用“漂亮假内容”遮盖契约失败。
- 不做深色赛博、霓虹渐变、玻璃拟态、重型 IDE、多层卡片套卡片。

第一版工作台建议布局：

- 左侧 216px 项目/视图/样例索引。
- 顶部 40px 轻量工具栏，包含 Save、Validate、视图切换。
- 主区默认 Progression/Spatial 双用途节点画布。
- 右侧 Inspector + Diagnostics，可折叠。
- 后续再增加 Timeline 面板。

## 7. 核心风险与处理

| 风险 | 处理 |
| --- | --- |
| 模型太抽象，像普通流程图 | 用真实样例、规则包和诊断建议驱动设计 |
| MVP 编辑成本过高 | 只保留核心实体，高级概念隐藏在规则包 |
| 诊断误报 | 支持 severity、例外标记、causeChain 和测试夹具 |
| 图规模变大后卡顿 | Worker 化、脏区增量验证、布局缓存 |
| 引擎集成过早拖慢 | MVP 只承诺稳定 JSON Schema 和 CLI |
| 视觉过度装饰 | 使用 Inscape 的低干扰约束，优先工具效率 |

## 8. 下一次开发任务建议

下一次代码任务应直接进入 Phase 0：

1. 初始化 Vite/TypeScript monorepo。
2. 建立 `packages/core`、`packages/schema`、`packages/test-fixtures`。
3. 实现第一版 `validateReachability(project)`。
4. 添加 CLI：`labyrinth validate examples/horror-clinic.lcproj.json`。
5. 用 Vitest 固化至少 10 个核心诊断测试。
