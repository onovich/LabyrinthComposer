# Phase 1 架构与实施说明

状态：交付给开发的 Phase 1 任务文档  
日期：2026-06-16  
目标：在 Phase 0 领域内核之上构建本地可用的空间谜题设计工作台，同时保持 UI、应用状态、领域核心和桌面壳边界清晰。

## 1. Phase 1 目标

Phase 1 的目标是把 Phase 0 的 `ProjectGraph`、`validateProject()` 和 CLI 验证能力变成一个可交互的本地 MVP 工作台。

完成后，设计师应能：

1. 打开一个 `.lcproj.json` 项目。
2. 在节点视图中创建和编辑 Space、Connection、Gate、Token、Puzzle、Beat。
3. 用 Inspector 编辑选中实体属性。
4. 点击 Validate，看到可达空间、获得 Token、打开 Gate、已解 Puzzle 和 Diagnostics。
5. 在图上定位诊断涉及的实体。
6. 保存项目为 `.lcproj.json`。
7. 使用基础撤销/重做回退编辑操作。

Phase 1 的成功标准不是功能多，而是工作台真正复用 Phase 0 的领域核心，不在 UI 里复制规则。

## 2. Phase 1 前置条件

进入正式 Phase 1 UI 开发前，建议先完成 Phase 0.5：

- fixture 测试精确匹配诊断集合，而不是只断言 expected diagnostics 存在。
- 明确诊断去噪策略，避免 reference / anchor error 触发大量次生 reachability 错误。
- 当前 5 个 strict mismatch 变成稳定 expected 输出。
- 完整验证链继续通过。

如果 Phase 0.5 暂时未完成，Phase 1 可以先搭工作台骨架、Project Store、Command Bus 和基础画布，但不要完成 Diagnostics Panel 的最终交互设计。

## 3. 明确不做

Phase 1 不做以下事项：

- 不做完整 2D/3D 地图编辑器。
- 不做云同步、账号、权限、团队协作。
- 不做 SQLite 项目索引，除非只是 Tauri 运行时实验且不进入主路径。
- 不做 Unity/Godot/Unreal 深度双向同步。
- 不做 AI 自动生成。
- 不做复杂规则包编辑器。
- 不做资源消耗、敌人状态、门重新关闭等非单调状态证明。
- 不把布局坐标、面板状态、React Flow 临时状态写进 Phase 0 的领域实体。
- 不在 React 组件里实现可达性、死锁、循环依赖或诊断判断。

## 4. 架构原则

### 4.1 Core 仍然是唯一规则来源

UI 只能调用 `packages/core` 的公开 API，例如 `validateProject(project)`。  
任何图上高亮、诊断列表、状态摘要都必须来自 `ValidationResult`。

禁止：

- 在 React component 中重新推断 reachable spaces。
- 在 React Flow edge/node renderer 中判断 Gate 是否打开。
- 在 Inspector 中自己写 deadlock 判断。
- 通过解析 `Diagnostic.message` 来决定 UI 行为。

要求：

- 图上高亮使用 `affectedEntities`、`causeChain`、`reachableSpaces`、`acquiredTokens`、`openedGates`。
- 文案可以在 UI 层格式化，但语义判断来自结构化字段。
- 后续需要新诊断时，先改 `packages/core` 和测试夹具，再改 UI 展示。

### 4.2 UI 状态不是 ProjectGraph

Phase 1 会出现大量 UI 状态：selection、viewport、panel open state、hovered entity、draft form、React Flow drag state。

这些状态不属于 `.lcproj.json` 的 canonical data。

要求：

- `ProjectGraph` 只保存领域实体。
- 临时 UI 状态放在 Workbench Store 的 UI slice。
- 可持久化布局如果必须保存，应放入独立 `views` 或 `layout` 扩展字段，并通过 Schema 明确管理；不要偷偷塞进 Space/Gate/Token 基础字段。
- 保存项目时只写 canonical ProjectGraph，不写 React 内部对象。

### 4.3 所有领域修改走 Command Bus

Phase 1 不允许 UI 直接深改 `ProjectGraph`。

所有编辑操作应封装为可序列化 Command：

```ts
type Command =
  | { type: 'CreateSpace'; payload: CreateSpacePayload }
  | { type: 'UpdateSpace'; payload: UpdateSpacePayload }
  | { type: 'DeleteSpace'; payload: DeleteSpacePayload }
  | { type: 'ConnectSpaces'; payload: ConnectSpacesPayload }
  | { type: 'AddGate'; payload: AddGatePayload }
  | { type: 'AssignGateToConnection'; payload: AssignGateToConnectionPayload }
  | { type: 'CreateToken'; payload: CreateTokenPayload }
  | { type: 'MoveToken'; payload: MoveTokenPayload }
  | { type: 'CreatePuzzle'; payload: CreatePuzzlePayload }
  | { type: 'UpdateBeat'; payload: UpdateBeatPayload }
```

Command Bus 的价值：

- 支持撤销/重做。
- 支持测试回放。
- 支持命令回放、测试复现和脚本化复用同一套变更语义。
- 支持 CLI 或脚本化生成复用同一套变更语义。

### 4.4 Desktop Shell 只是权限边界

Tauri 只负责桌面壳和受控文件能力：

- open file
- save file
- save as
- recent files
- window/menu integration

Renderer 不直接访问文件系统、shell 或任意 Node API。

即使 Phase 1 使用 Vite dev server，文件读写也要通过 Tauri command 或明确的 browser fallback adapter，不要把 Node 文件访问塞进 React app。

## 5. 推荐包结构

在现有 Phase 0 结构上新增：

```text
apps/
  desktop/
    package.json
    src/
      main.tsx
      App.tsx
      bootstrap/
        createDesktopAdapters.ts
      tauri/
        commands.ts
    src-tauri/
      tauri.conf.json
      src/
        main.rs
packages/
  workbench/
    package.json
    src/
      index.ts
      commands/
        commandTypes.ts
        commandBus.ts
        commandHandlers.ts
        commandHistory.ts
      store/
        createWorkbenchStore.ts
        projectSlice.ts
        selectionSlice.ts
        validationSlice.ts
        uiSlice.ts
      selectors/
        graphSelectors.ts
        diagnosticSelectors.ts
      services/
        validationService.ts
        projectRepository.ts
  editor-ui/
    package.json
    src/
      index.ts
      styles/
        tokens.css
        workbench.css
      components/
        AppShell.tsx
        TopBar.tsx
        Sidebar.tsx
        InspectorPanel.tsx
        DiagnosticsPanel.tsx
      graph/
        GraphCanvas.tsx
        nodes/
          SpaceNode.tsx
          TokenBadge.tsx
        edges/
          ConnectionEdge.tsx
      inspector/
        SpaceInspector.tsx
        GateInspector.tsx
        TokenInspector.tsx
        PuzzleInspector.tsx
        BeatInspector.tsx
  graph-layout/
    package.json
    src/
      index.ts
      elkLayout.ts
      layoutTypes.ts
```

Phase 1 可以先只创建 `apps/desktop`、`packages/workbench`、`packages/editor-ui`。  
`packages/graph-layout` 如果暂时不用 ELK，可以只保留轻量布局接口，等节点数量上来再接。

## 6. 依赖方向

允许的依赖方向：

```text
apps/desktop -> packages/editor-ui
apps/desktop -> packages/workbench
apps/desktop -> packages/schema

packages/editor-ui -> packages/workbench
packages/editor-ui -> packages/schema

packages/workbench -> packages/core
packages/workbench -> packages/schema

packages/graph-layout -> packages/schema

packages/core -> packages/schema
```

禁止：

```text
packages/core -> packages/workbench
packages/core -> packages/editor-ui
packages/schema -> packages/core
packages/schema -> packages/workbench
packages/workbench -> apps/desktop
packages/editor-ui -> apps/desktop
```

`packages/workbench` 是应用层，不能依赖 Tauri、React Flow 或浏览器 DOM。  
`packages/editor-ui` 是 React 展示层，可以依赖 React、React Flow 和图形组件库，但不要写领域规则。

## 7. 数据流设计

推荐数据流：

```text
User Action
  -> UI dispatches Command
  -> Workbench Command Bus validates command shape
  -> Command Handler applies immutable ProjectGraph patch
  -> Project Store updates canonical project
  -> Validation Service calls packages/core.validateProject(project)
  -> Validation slice stores ValidationResult
  -> UI renders graph, inspector, diagnostics from selectors
  -> Save adapter serializes ProjectGraph to .lcproj.json
```

注意：

- Command Handler 可以做基础引用完整性保护，例如禁止连接不存在的 Space。
- 复杂语义判断仍交给 `packages/core`。
- Validation 可以先同步执行；如果交互卡顿，再迁移到 Web Worker。
- Worker 化时也只能把 `ProjectGraph` 发给 Core，不得创建第二套验证器。

## 8. Workbench Store

建议用 Zustand + Immer 或等价轻量状态方案。

Store 分为四类 slice：

| Slice | 内容 | 可保存到项目文件 |
| --- | --- | --- |
| `projectSlice` | 当前 `ProjectGraph`、dirty flag、file path | 只保存 ProjectGraph |
| `selectionSlice` | selected entity、hovered entity、focused panel | 否 |
| `validationSlice` | `ValidationResult`、last validated revision、running state | 否 |
| `uiSlice` | panels、viewport、modal、tool mode | 否 |

不要把 `ValidationResult` 写回 ProjectGraph。  
不要把 React Flow node object 当成 Space。  
不要把表单 draft 直接绑定到实体对象引用。

## 9. Command Bus 设计

Command Handler 应满足：

- 输入 Command，输出新的 ProjectGraph。
- 不修改原 ProjectGraph。
- 每个 Command 有可测试的最小行为。
- 每个 Command 能生成 undo patch 或 inverse command。
- Command payload 使用实体 ID，不传 React component state。

Phase 1 至少实现：

| Command | 说明 |
| --- | --- |
| `LoadProject` | 从 parsed ProjectGraph 初始化 store |
| `CreateSpace` | 创建 Space |
| `UpdateSpace` | 更新 Space 基础字段 |
| `DeleteSpace` | 删除 Space，并处理相关引用策略 |
| `ConnectSpaces` | 创建 Connection |
| `UpdateConnection` | 更新 directed、gateId 等字段 |
| `CreateGate` | 创建 Gate |
| `UpdateGate` | 更新 Gate kind、requiredTokenIds |
| `CreateToken` | 创建 Token |
| `MoveToken` | 改变 Token locationSpaceId |
| `CreatePuzzle` | 创建 Puzzle |
| `UpdatePuzzle` | 更新 Puzzle location、requirements、outputs |
| `UpdateBeat` | 更新 Beat |

删除策略必须显式：

- Phase 1 可以先禁止删除有引用的实体，并提示用户先移除引用。
- 不要静默级联删除，除非 Command 名称和测试明确表达。

## 10. Project Repository

Phase 1 项目读写建议抽象为 `ProjectRepository`：

```ts
type ProjectRepository = {
  openProject(): Promise<ProjectOpenResult>
  saveProject(project: ProjectGraph, target?: SaveTarget): Promise<ProjectSaveResult>
  saveProjectAs(project: ProjectGraph): Promise<ProjectSaveResult>
}
```

Desktop 实现：

- 通过 Tauri command 打开文件。
- 读取 JSON。
- 调用 `parseProjectGraph()`。
- 必要时调用 migration。
- 保存时使用稳定 JSON 格式，例如 2-space indentation。

Web fallback 实现：

- 可用 `<input type="file">` 和 download blob。
- 仅用于 demo，不作为 Phase 1 核心文件能力。

## 11. 视图与组件

### 11.1 App Shell

第一版布局：

- 左侧 216px 侧边栏：项目名称、样例入口、实体 outline。
- 顶部 40px 工具栏：Open、Save、Validate、Undo、Redo、视图切换。
- 中央 Graph Canvas：Progression / Spatial 共享画布基础。
- 右侧 Inspector + Diagnostics：可折叠。

### 11.2 Graph Canvas

React Flow 只负责图交互和渲染，不负责领域真相。

节点/边来源：

```text
ProjectGraph + ValidationResult + UI Selection
  -> graphSelectors
  -> React Flow nodes/edges
```

React Flow node data 应是 view model：

```ts
type SpaceNodeViewModel = {
  entityRef: { kind: 'space'; id: string }
  title: string
  badges: NodeBadge[]
  validationState: 'reachable' | 'unreachable' | 'affected' | 'neutral'
}
```

禁止把 React Flow node data 当 canonical entity 存回项目文件。

### 11.3 Inspector

Inspector 通过 selection 选择实体类型，展示对应 form。

要求：

- 表单 draft 与 ProjectGraph 解耦。
- Apply / blur / Enter 时 dispatch Command。
- 所有引用字段使用 ID picker，不允许自由输入造成悬挂引用。
- 引用选择数据来自 selectors。

### 11.4 Diagnostics Panel

Diagnostics Panel 只消费 `Diagnostic[]`。

要求：

- 按 severity 排序。
- 点击 Diagnostic 高亮 `affectedEntities`。
- 展开后显示 `causeChain` 和 `suggestions`。
- 不解析 message 文本。
- 如果 Phase 0.5 未完成，应明显标记次生诊断，避免把噪声当主因。

## 12. 视觉规范

Phase 1 视觉参考 `docs/inscape-visual-design-system.md` 的工作台气质：

- light-only 暖白纸面。
- 暖黑正文。
- 低饱和橄榄灰强调。
- 顶栏、状态、路径、计数默认退后，hover/focus 后增强。
- 节点图浅色 grid canvas。
- 节点轻边框、低阴影、克制 hover。
- 诊断清晰但不喧宾夺主。

禁止：

- 深色赛博、霓虹渐变、玻璃拟态。
- 重型 IDE 多面板常亮。
- 卡片套卡片。
- 把预览做成最终游戏 UI。
- 用高饱和颜色表达普通状态。

建议先建立 `packages/editor-ui/src/styles/tokens.css`：

```css
:root {
  --page: #fbfbfa;
  --sidebar: #f6f6f4;
  --surface: #ffffff;
  --surface-soft: #fbfbf9;
  --graph-canvas: #fbfaf7;
  --text: #27241f;
  --muted: #938b7d;
  --muted-strong: #655f54;
  --accent: #6a6d57;
  --danger: #a55e52;
  --warning: #98753b;
}
```

所有 feature CSS 消费 token，不要在组件里随手写新颜色。

## 13. 测试策略

Phase 1 至少需要：

- Command handler unit tests。
- Store selector tests。
- Project repository parse/save tests。
- React component smoke tests。
- CLI/Core 既有测试继续保留。
- Playwright 或等价 E2E：打开样例、创建节点、连接、Validate、显示 Diagnostic、保存。

建议命令：

```powershell
npx --yes pnpm@11.7.0 lint
npx --yes pnpm@11.7.0 typecheck
npx --yes pnpm@11.7.0 build
npx --yes pnpm@11.7.0 test
npx --yes pnpm@11.7.0 architecture:check
npx --yes pnpm@11.7.0 docs:check
npx --yes pnpm@11.7.0 smoke:cli
npx --yes pnpm@11.7.0 smoke:desktop
```

如果 Phase 1 引入 Playwright，应新增可重复的本地 smoke：

```text
open desktop/web workbench
load horror-clinic sample
run validate
assert diagnostics panel shows 0 diagnostics
create an unreachable target
run validate
assert target-unreachable appears and affected node is highlighted
```

## 14. 架构检查更新

Phase 1 必须更新 `scripts/check-architecture.mjs`，加入新边界：

- `packages/core` 不得依赖 React、Tauri、Workbench、Editor UI。
- `packages/schema` 不得依赖 Core、Workbench、Editor UI。
- `packages/workbench` 不得依赖 Tauri、React Flow、DOM。
- `packages/editor-ui` 不得依赖 `apps/desktop`。
- `apps/desktop` 可以依赖 UI/Workbench，但业务规则仍来自 Core。

建议 docs check 也新增：

- `docs/phase1-architecture-implementation.md` 必须存在。
- Phase 1 README 或 package docs 必须说明命令和边界。

## 15. 实施顺序

建议拆成 7 轮开发：

### 轮次 1：Phase 0.5 诊断契约修正

- 精确匹配 fixture expected diagnostics。
- 处理当前 5 个 strict mismatch。
- 明确 primary/secondary 或 suppression 策略。
- 更新测试和 Phase 0 验收记录。

验收：严格 fixture 对比通过，完整 Validate 通过。

### 轮次 2：Phase 1 工程骨架

- 创建 `apps/desktop`。
- 创建 `packages/workbench`、`packages/editor-ui`。
- 配置 Vite、React、Tauri。
- 更新 workspace、tsconfig、lint、build、architecture check。
- 渲染空 App Shell。

验收：desktop app 能启动；build/typecheck/lint/test 通过。

### 轮次 3：Project Store 与 Command Bus

- 实现 Workbench Store。
- 实现 Command 类型、handler、history。
- 实现 LoadProject、CreateSpace、UpdateSpace、ConnectSpaces。
- 添加 command unit tests。

验收：命令可测试回放，撤销/重做基础可用。

### 轮次 4：项目打开、保存与样例加载

- 实现 ProjectRepository。
- Desktop file open/save 通过 Tauri command。
- 支持加载 test-fixtures sample。
- 保存输出稳定 JSON。

验收：打开 sample、保存副本、重新解析成功。

### 轮次 5：Graph Canvas 与 Inspector

- 用 React Flow 渲染 Space 和 Connection。
- 选中节点显示 Inspector。
- Inspector dispatch Command 更新实体。
- 支持创建 Space、Connection、Gate、Token、Puzzle 的最小交互。

验收：能从空项目创建 10-20 节点结构。

### 轮次 6：Validation 与 Diagnostics Panel

- 接入 `validateProject()`。
- 显示 reachable spaces、tokens、opened gates、solved puzzles。
- Diagnostics Panel 展示 severity、affectedEntities、causeChain、suggestions。
- 点击诊断高亮图上实体。

验收：能复现 Phase 0 样例诊断并定位实体。

### 轮次 7：MVP 打磨与 E2E Smoke

- 补齐 Undo/Redo UI。
- 补齐 dirty state、保存提示、错误边界。
- 加 Playwright 或等价 smoke。
- 视觉 token 和布局整理。
- 更新 README 和 ops workflow。

验收：设计师可在 30 分钟内搭建一个 10-20 节点样例并运行验证。

## 16. Phase 1 完成定义

Phase 1 完成时，应满足：

- 桌面工作台可启动。
- 能打开和保存 `.lcproj.json`。
- 能创建/编辑 Space、Connection、Gate、Token、Puzzle、Beat。
- 能运行 Phase 0 验证器。
- 能展示 Diagnostics、causeChain、suggestions。
- 能点击诊断定位图上实体。
- 基础撤销/重做可用。
- 完整 lint/typecheck/build/test/architecture/docs/smoke 通过。
- UI 没有复制领域规则。
- Workbench Store 没有把 UI 临时状态写进 ProjectGraph。

## 17. 架构红线

以下情况必须退回重做：

- React 组件直接修改 ProjectGraph。
- React Flow nodes/edges 被当作项目真相保存。
- UI 内重新实现 reachability、deadlock、dependency cycle。
- Diagnostics Panel 通过解析 message 字符串判断行为。
- `packages/workbench` 依赖 Tauri、React Flow 或 DOM。
- `packages/core` 依赖 UI、Workbench、Tauri、Node 文件系统。
- 保存文件时写入 selection、hover、panel、viewport 等临时状态。
- 删除实体时静默产生悬挂引用。
- 新 UI 功能绕过 Command Bus。
- Tauri command 暴露任意文件系统或 shell 能力。

## 18. 给开发者的最终提醒

Phase 1 是最容易把架构写脏的阶段，因为 UI 很诱人，demo 很快就能跑起来。请守住三条线：

1. ProjectGraph 是唯一项目真相。
2. Core 是唯一规则真相。
3. Command Bus 是唯一编辑入口。

只要这三条线不破，Phase 1 的工作台可以大胆迭代；如果为了交互方便让 React Flow、Inspector 或 Diagnostics Panel 开始承载领域语义，Phase 2 的规则包、Timeline、个人自查和引擎集成都会被拖进返工。
