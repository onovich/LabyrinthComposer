# Phase 1 验收结论与 UI/UX 调整计划

日期：2026-06-16  
项目：Labyrinth Composer  
结论：Phase 1 的工程架构基本通过，但产品 UI/UX 闭环尚未完整通过。建议不要直接进入 Phase 2，先执行 Phase 1.5：补齐可用工作台与 UI/UX 对齐。

## 1. 验收结论

Phase 1 当前完成了桌面工作台的工程骨架：

- `apps/desktop` 已存在。
- `packages/workbench` 已实现 Command Bus、Store、selectors、ProjectRepository 抽象。
- `packages/editor-ui` 已实现 App Shell、Graph Canvas、Inspector、Diagnostics Panel 和基础视觉 token。
- 当前 UI 可以加载内置样例、创建 Space/Connection/Gate/Token/Puzzle、运行验证、展示 Diagnostics、撤销/重做基础编辑。
- 架构边界总体清晰，UI 没有把 core/schema 规则明显写脏。

但当前实现更像 Phase 1 架构原型，而不是 UI/UX 文档定义的完整 MVP 工作台。

建议状态：有条件通过 Phase 1 架构验收，但产品体验进入 Phase 1.5 后再继续 Phase 2。

## 2. 机器验收结果

完整验证链已通过：

```text
lint passed
typecheck passed
build passed
test passed: 9 files / 29 tests
architecture:check passed
docs:check passed
smoke:cli passed
smoke:desktop passed
```

构建警告：

```text
Vite warns that one chunk is larger than 500 kB after minification.
```

该警告不阻塞验收，但后续引入更多 UI 功能后，应考虑 code splitting 或手动 chunk。

## 3. 架构验收

当前通过项：

- `packages/core` 仍只依赖 `packages/schema`。
- `packages/schema` 没有反向依赖 core/workbench/editor-ui。
- `packages/workbench` 没有依赖 React、React Flow、Tauri、DOM 或 Node 文件系统。
- `packages/editor-ui` 作为 React 展示层，消费 workbench selectors 和 schema types。
- `apps/desktop` 组合 editor-ui 与 workbench，当前未把领域规则写入 UI。
- `scripts/check-architecture.mjs` 已扩展到 Phase 1 边界。

核心边界是健康的：

```text
apps/desktop -> packages/editor-ui
apps/desktop -> packages/workbench
packages/editor-ui -> packages/workbench
packages/workbench -> packages/core
packages/core -> packages/schema
```

Phase 0.5 的诊断噪声问题也基本修正：fixture 测试已精确匹配诊断集合。额外严格脚本只发现 1 个 `affectedEntities` 顺序差异，不是多报诊断问题。

## 4. UI/UX 文档要点

已阅读 `docs/Labyrinth_Composer_UI_UX_设计文档_v0.1.pdf`。

文档对 MVP UI/UX 的要求明显高于当前实现。它定义的 MVP 包括：

- 项目首页。
- 新建项目向导。
- 模板选择。
- Progression View。
- 基础 Spatial View。
- 右侧 Inspector。
- 底部 Validation Panel。
- Reachability Simulator。
- 模板库。
- JSON 导出。
- 设计文档导出。

文档中的核心定位是：

```text
用户不是在单纯画地图，而是在设计并验证玩家如何探索、受阻、获得解法、回溯、解锁，并重新认识空间。
```

后续 UI 应围绕这个定位调整，而不是停留在“节点画布 + 右侧诊断”的原型状态。

## 5. 当前 UI 与 UI/UX 文档差距

### P1：桌面文件能力仍是 demo adapter

位置：

- [apps/desktop/src/bootstrap/createDesktopAdapters.ts](D:/LabProjects/LabyrinthComposer/apps/desktop/src/bootstrap/createDesktopAdapters.ts:25)

当前 `openText()` 只返回内置 `horror-clinic` sample。  
当前 `saveTextAs()` 使用 browser blob download。  
`src-tauri` 没有实现 open/save/save-as 文件命令。

影响：

- 不满足 Phase 1 文档的本地 `.lcproj.json` 打开/保存要求。
- 不满足 UI/UX 文档的“打开最近项目 / JSON 导出 / 项目文件工作流”基础。

### P1：Inspector 只支持 Space 名称编辑

位置：

- [packages/editor-ui/src/components/InspectorPanel.tsx](D:/LabProjects/LabyrinthComposer/packages/editor-ui/src/components/InspectorPanel.tsx:31)

当前选中 Connection、Gate、Token、Puzzle 时只显示 `kind:id`，不能编辑属性。

UI/UX 文档要求 Inspector 至少支持：

- Space：名称、类型、角色、所属区域、是否主线、放置内容、情绪强度。
- Connection：连接类型、是否单向、是否隐藏、是否有 Gate、锁定范围、回溯距离。
- Gate：阻碍类型、需要条件、可见性、阻挡范围、锁前提示、验证结果。
- Token：类型、获得位置、用途、获得条件、回溯距离。
- Puzzle：输入、输出、位置、线索来源、解法验证。
- Beat：类型、空间、情绪、强度、目标、触发条件。

当前只完成了 Space 的极小子集。

### P2：Graph 只渲染 Space / Connection

位置：

- [packages/editor-ui/src/graph/GraphCanvas.tsx](D:/LabProjects/LabyrinthComposer/packages/editor-ui/src/graph/GraphCanvas.tsx:13)

当前画布只渲染 Space node 和 Connection edge。  
Token、Gate、Puzzle、Beat 没有视觉实体。

影响：

- Token/Puzzle/Gate 相关诊断无法在图上完整定位。
- Dependency View、Token Chip、Gate Label、Puzzle Node 还没有成型。
- 创建 Puzzle 自循环后，Diagnostics 能显示错误，但图上无法高亮 Puzzle/Token。

### P2：样例图布局和 fitView 不稳定

位置：

- [packages/editor-ui/src/graph/GraphCanvas.tsx](D:/LabProjects/LabyrinthComposer/packages/editor-ui/src/graph/GraphCanvas.tsx:33)
- [packages/editor-ui/src/styles/workbench.css](D:/LabProjects/LabyrinthComposer/packages/editor-ui/src/styles/workbench.css:197)

实测问题：

- 加载 `horror-clinic` sample 后，右侧节点会被裁切。
- Edge 和 Gate label 比较拥挤。
- CSS 中 `.lc-flow-node` 预期宽度为 `156px`，但实际 React Flow 默认节点渲染截图约为 `312px x 108px`，尺寸不一致。

影响：

- 设计师无法稳定阅读中等规模图。
- 后续节点增多后，画布可用性会快速下降。

### P2：移动 / 窄屏有横向溢出

位置：

- [packages/editor-ui/src/styles/workbench.css](D:/LabProjects/LabyrinthComposer/packages/editor-ui/src/styles/workbench.css:407)

390px viewport 实测：

```text
overflowX = true
topbar width > viewport
graph width > viewport
```

项目桌面优先，该问题不阻塞 Phase 1，但 UI/UX 文档要求基础响应式，应在后续修正。

### P2：当前入口是空画布，不是项目首页 / 模板向导

位置：

- [apps/desktop/src/App.tsx](D:/LabProjects/LabyrinthComposer/apps/desktop/src/App.tsx:11)

当前启动后直接进入 `Untitled Labyrinth`，只有一个 `Start` 节点。  
UI/UX 文档明确要求首次进入不要直接给空白画布，而应先选择设计类型和模板。

影响：

- 新用户不容易理解 Space / Gate / Token / Puzzle / Simulator 的关系。
- MVP 首次用户流程没有落地。

## 6. 美术风格判断

当前 UI 的基础视觉方向是可保留的：

- 暖白背景。
- 暖黑文字。
- 低饱和橄榄灰强调。
- 轻量顶栏。
- 浅色 grid canvas。
- 克制诊断卡片。

这与 `docs/inscape-visual-design-system.md` 的工作台气质兼容。

UI/UX PDF 中提出“推荐默认深色主题，同时提供浅色主题”。这一点不建议在当前项目直接采用为默认路线。原因：

- 项目已有美术参考要求 light-only 暖白纸面。
- 当前工具处于专业设计工作台阶段，暖白低干扰更利于长时间编辑和文档化输出。
- 深色主题可以进入后续主题系统，但不应打断 Phase 1.5 的可用性补齐。

建议：

- 默认继续使用浅色暖白主题。
- 保留 PDF 中的状态色语义，但降饱和处理。
- 红色只用于严重错误 / 死锁 / 主线不可通关。
- 赭黄用于风险 / warning。
- 橄榄或灰绿用于验证通过。
- 蓝灰用于可达空间。
- 青灰用于 Token。
- 紫灰用于 Knowledge / Narrative Fact。
- 橙棕用于 Gate / 阻碍。

## 7. Phase 1.5 任务建议

Phase 1.5 目标：把当前工程骨架推进成符合 UI/UX 文档的可用 MVP 工作台。

### 任务 1：真正接入 Tauri 文件能力

交付：

- Tauri command: open project file。
- Tauri command: save project。
- Tauri command: save project as。
- 仅允许 `.lcproj.json` 或明确 JSON 文件。
- Renderer 通过 adapter 调用，不直接访问文件系统。

验收：

- 用户能打开任意本地 `.lcproj.json`。
- 用户能保存当前项目到原路径。
- 用户能另存为新文件。
- 保存后重新打开能通过 schema parse。

### 任务 2：补全 Inspector

交付：

- SpaceInspector。
- ConnectionInspector。
- GateInspector。
- TokenInspector。
- PuzzleInspector。
- BeatInspector。

最低字段：

- Space: name, description, tags。
- Connection: directed, gateId, description。
- Gate: name, kind, requiredTokenIds, description。
- Token: name, kind, locationSpaceId, description。
- Puzzle: name, locationSpaceId, requiredTokenIds, outputTokenIds, description。
- Beat: name, spaceId, intensity, description。

要求：

- 引用字段使用 selector / picker，不允许自由输入造成悬挂引用。
- 所有修改 dispatch Command。
- 不直接深改 ProjectGraph。

### 任务 3：建立 Project Dashboard 与模板入口

交付：

- 启动页 / Dashboard。
- 模板卡片：传统迷宫、Zelda、恐怖解谜、叙事迷宫、Metroidvania、密室逃脱、从空白开始。
- 每个模板至少加载一个 sample 或生成基础 ProjectGraph。
- 提供“打开项目”入口。

验收：

- 首次进入不再直接面对空白画布。
- 用户可从模板进入工作台。
- 模板项目加载后立即可验证。

### 任务 4：升级 Graph Canvas 的对象表达

交付：

- Space Node。
- Gate Label，贴在 Connection 上。
- Token Chip，可显示在 Space 内或作为 overlay。
- Puzzle Node，至少在 Dependency View 或 Progression overlay 中可见。
- 诊断点击后能高亮 Space / Connection / Gate / Token / Puzzle。

要求：

- React Flow node/edge 仍是 view model，不是 canonical data。
- 图上状态来自 `ValidationResult` 和 selectors。
- 不解析 diagnostic message。

### 任务 5：增加基础视图切换

交付：

- Progression View。
- Spatial View。
- Dependency View 的最小版本。
- Reachability Simulator 的最小版本。

可以先共用同一个 graph renderer，但 selectors 必须按视图生成不同 view model。

最低要求：

- Progression View：展示 Space / Connection / Gate / Token 放置关系。
- Spatial View：展示空间连接和 reachable / unreachable。
- Dependency View：展示 Gate / Token / Puzzle 依赖。
- Simulator：展示 reachable spaces、acquired tokens、opened gates、solved puzzles 和不可达原因。

### 任务 6：重构 Validation UX

交付：

- 底部 Problems / Validation Panel。
- 右侧 Inspector 专注对象属性。
- 点击问题卡片高亮图上实体。
- 问题卡片包含：是什么、为什么、影响什么、如何修复。

保留：

- 顶栏常驻健康状态。
- 右侧可以有对象级验证摘要。

不要：

- 把所有诊断长期塞在右侧 Inspector 下方，挤占属性编辑空间。

### 任务 7：修复布局与响应式

交付：

- 修正 React Flow node 实际尺寸与 CSS 预期不一致。
- 样例图加载后完整 fit 到画布。
- Gate label 不遮挡主要节点文本。
- 390px viewport 不产生横向页面滚动。
- 大图至少提供 fit / center / zoom controls。

建议：

- 引入明确 node dimensions。
- 后续接 ELK.js 或 graph-layout 包。
- 先实现 deterministic grid / layered layout，避免纯索引位置导致裁切。

### 任务 8：更新测试与 smoke

交付：

- ProjectRepository desktop adapter tests。
- Inspector command tests。
- Graph selector tests 覆盖 Token/Gate/Puzzle view model。
- Diagnostics click highlight test。
- Playwright smoke：
  - 打开 Dashboard。
  - 选择 horror template。
  - 进入工作台。
  - 运行 Validate。
  - 创建一个错误。
  - 点击 Diagnostic。
  - 确认图上实体高亮。
  - 保存项目。

## 8. Phase 1.5 完成定义

完成 Phase 1.5 后，应满足：

- 可以打开和保存真实本地 `.lcproj.json`。
- 用户不再从空画布开始，而是可以通过 Dashboard / template / open project 进入。
- Inspector 可以编辑 Space、Connection、Gate、Token、Puzzle、Beat。
- Graph 可以表达 Space、Connection、Gate、Token、Puzzle 的基本关系。
- Diagnostics 能定位所有 affected entity 类型，而不仅是 Space / Connection。
- Validation UX 从“右侧列表”升级为接近 IDE Problems / Validation Center 的结构。
- 样例项目首屏不会裁切关键节点。
- 基础窄屏无横向溢出。
- 架构检查继续通过。
- UI 没有复制 core 规则。

## 9. 是否进入 Phase 2

当前不建议直接进入 Phase 2。

原因：

- Phase 2 要做专业规则包、体验分析、Timeline、导出报告。
- 当前 UI 尚未完成核心对象编辑、真实文件读写、诊断定位和模板入口。
- 如果直接进入 Phase 2，复杂规则和 Timeline 会叠在未完成的工作台骨架上，后续返工成本高。

建议路径：

```text
Phase 1.5: 可用工作台与 UI/UX 对齐
  -> Phase 2: 专业规则包、Timeline、设计分析、导出报告
```

## 10. 给后续 AI 的工作准则

后续实现时必须继续守住三条线：

1. `ProjectGraph` 是唯一项目真相。
2. `packages/core` 是唯一规则真相。
3. `Command Bus` 是唯一编辑入口。

具体要求：

- 不在 React component 中写可达性、死锁、循环依赖判断。
- 不把 React Flow nodes/edges 保存为项目文件。
- 不把 selection、hover、viewport、panel state 写进 ProjectGraph。
- 不通过解析 `Diagnostic.message` 做 UI 判断。
- 新增状态色必须进入 token，不要在组件内硬编码。
- 新增视图必须通过 selectors 消费 ProjectGraph 和 ValidationResult。

当前工程基础是可继续扩展的；真正需要补的是产品工作流与对象表达，不是推翻现有架构。
