# Phase 4 架构与实施说明

日期：2026-06-16  
项目：Labyrinth Composer  
目标阶段：Phase 4 - Beta 硬化与可发布主路径  
前置状态：Phase 3 已通过验收，可进入 Phase 4。

## 1. Phase 4 目标

Phase 4 的目标不是继续扩大概念范围，而是把 Phase 0-3 已有能力收束成可稳定交付的 Beta 主路径。

本阶段应完成：

- CLI / Workbench / Desktop 的验证语义一致化，尤其是 CI strict mode 与规则包诊断的一致性。
- `.lcproj` package 从 prototype 走向可用主路径，但仍保持 `project.json` 为唯一项目真相。
- 桌面保存、打开、导出、失败恢复与错误提示进入 Beta 可用状态。
- 中大型项目下的验证、布局、图视图交互不阻塞主线程。
- UI 按现有 Inscape 风格参考继续收敛为工具型工作台，而不是另起一套视觉系统。
- 建立 Playwright 级别的关键用户路径回归，覆盖打开样例、编辑、验证、review、report、engine export。
- Tauri 桌面打包与本地 release dry-run 可重复执行。

Phase 4 的完成定义：

```text
一个设计师可以用桌面端打开或保存项目，完成编辑、验证、评审、报告和引擎导出；
同一个项目可以在 CLI/CI 中得到一致诊断；
项目文件仍然可 diff、可迁移、可离线审查；
核心架构没有被 UI、Tauri、实时协作 session、Unity/Godot 或 package artifact 污染。
```

## 2. 本阶段最大风险

Phase 4 很容易把架构写脏，因为它会把 prototype 变成真实产品路径。

主要风险：

- 为了 CI 方便，在 CLI 中重新实现一份规则诊断逻辑。
- 为了桌面保存方便，把 `.lcproj/exports`、`reports`、`cache` 当成项目真相。
- 为了 UI 性能，把 React Flow nodes、viewport、selection、panel state 塞进 `ProjectGraph`。
- 为了 worker 化，把 core 验证逻辑复制到 UI worker。
- 为了 release，绕过现有 Validate/Smoke/architecture check。
- 为了已取消的实时协作方向预留，把 session、presence 或 provider 状态引入 Workbench 主路径。

Phase 4 的一句话原则：

```text
产品路径可以变得更完整，但真相模型不能变多；宿主能力可以增强，但领域规则不能下沉到宿主层。
```

## 3. 架构原则

### 3.1 ProjectGraph 仍是唯一项目真相

允许进入 `ProjectGraph` 的数据：

- 领域实体：Space、Connection、Gate、Token、Puzzle、Beat。
- 规则配置：rulePresetId、ruleOverrides、diagnosticExceptions。
- 结构化评审：reviewThreads。
- 明确可迁移、可审查的未来项目配置。

禁止进入 `ProjectGraph` 的数据：

- React Flow nodes / edges / viewport。
- 当前选中项、hover、panel collapse、tab state。
- validation result、report text、engine export text。
- `.lcproj` package 中的 generated artifacts。
- worker cache、layout cache、performance trace。
- provider state、client presence、remote cursor、session sync state。
- Unity / Godot 场景对象引用。

如果 Phase 4 需要保存布局或 UI 偏好，必须先明确它是：

- `ProjectGraph` 的领域真相；
- `.lcproj/cache` 的可再生成缓存；
- app-local preference；
- 或者完全不应该持久化。

不要用“先塞进项目文件以后再迁移”的方式推进。

### 3.2 验证语义只能来自 core + rulesets

Phase 4 需要补齐 CLI strict mode 与 Workbench 规则包诊断的一致性。

允许：

- 让 CLI `validate` 调用 `validateProjectWithRules`。
- 让 CLI 根据项目中的 `rulePresetId` 读取 `getRulePreset`。
- 增加 `--ruleset <id>` 覆盖参数，前提是行为和文档清晰。
- 让 CI workflow 调 CLI，并保存 JSON artifact。

禁止：

- 在 CLI 中复制 backtracking、hintDistance、timeline 等规则算法。
- 在 GitHub Actions YAML 中解析 text 输出判断失败。
- 在 UI 中通过 report JSON 反推当前验证状态。
- 让 `packages/core` 依赖 `packages/rulesets`。

建议抽象：

```text
packages/workbench
  services/
    validationService.ts  # 组合 core + rulesets，返回 ValidationResult

apps/cli
  commands/
    validate.ts           # 读取文件、解析参数、调用同一套 validation composition
```

注意：组合层可以在 Workbench 或 CLI 内，但算法仍在 core，规则配置仍在 rulesets。

### 3.3 `.lcproj` 是 package，不是第二套模型

Phase 3 已实现 `.lcproj/project.json` 最小读取与 artifact 写入。Phase 4 可以把它提升为可用路径，但不能把 package 目录里的文件混成项目真相。

推荐结构仍为：

```text
MyProject.lcproj/
  project.json
  exports/
    engine-export.json
    report.md
  reports/
    latest-report.json
  assets/
    README.md
  cache/
    layout-cache.json
```

规则：

- `project.json` 是唯一 canonical project data。
- `exports/`、`reports/`、`cache/` 都是可再生成 artifact。
- `assets/` 暂时是 opaque files，除非 schema 明确引用。
- Desktop 打开 package 时必须只读 `project.json`。
- Desktop 保存 package 时默认只写 `project.json`，除非用户主动导出 artifact。
- cache 文件缺失或损坏不能导致项目打不开。

禁止：

- validation 读取 `exports/`、`reports/` 或 `cache/`。
- migration 从 generated artifact 反推项目。
- 把 package manifest 当成比 `project.json` 更高优先级的真相。

### 3.4 Worker 和性能优化是 adapter，不是新领域层

Phase 4 可以引入 worker 化验证和布局缓存，但 worker 只是执行环境。

允许：

- 在 app 层创建 validation worker。
- worker 内调用已构建的 core/workbench validation composition。
- 使用 request id 处理乱序返回。
- 为大型 fixture 建立性能基线。

禁止：

- worker 内复制验证规则。
- worker 返回 UI-only 状态并写入 `ProjectGraph`。
- 为了 worker 方便改变 core API 的领域语义。
- 让 `packages/workbench` 依赖 DOM Worker API。

建议边界：

```text
packages/core       -> pure validation algorithms
packages/rulesets   -> rule preset config
packages/workbench  -> validation service contract and view models
apps/desktop        -> worker host, lifecycle, cancellation, fallback
packages/editor-ui  -> loading state and result rendering only
```

### 3.5 Graph layout 可以缓存，但不能污染实体

如果 Phase 4 引入布局缓存或 `packages/graph-layout`，必须保持可再生成。

推荐：

```text
packages/graph-layout
  src/
    layoutTypes.ts
    simpleLayout.ts
    layoutCache.ts
```

依赖边界：

- `graph-layout` 可依赖 `schema`。
- `graph-layout` 不依赖 React、React Flow、DOM、Tauri。
- `editor-ui` 可以把 layout model 投影为 React Flow nodes。
- `cache/layout-cache.json` 可以保存 layout cache，但不是项目真相。

禁止：

- Space 或 Connection 上直接增加 React Flow position。
- 把 viewport、zoom、selection 保存为领域数据。
- 在 `packages/core` 里引入布局算法。

### 3.6 Desktop adapter 只处理宿主能力

Desktop 可以打开、保存、另存为、选择目录、写文件、打包发布。

Desktop 不应该：

- 生成 engine export 内容。
- 计算 report model。
- 执行验证算法。
- 解释 ruleset 阈值。
- 持有 Workbench 之外的项目编辑状态。

正确流向：

```text
UI click
  -> App callback
  -> Workbench service creates text/model
  -> Desktop adapter asks Tauri to write file
```

### 3.7 实时协作方向已取消

Phase 4 不把 collaboration 做成产品主线，也不保留协作原型作为候选方向。

要求：

- 删除 `packages/collaboration-prototype`。
- 删除 Phase 6 / Phase 7 协作产品化文档。
- 在 architecture check 中继续禁止主包依赖 collaboration package 或 provider。

禁止：

- WorkbenchStore 依赖实时协作 provider。
- ProjectGraph 存 session、presence、cursor、room 或 provider state。
- Desktop 默认加载 collaboration provider。
- 新增 Collaboration Lab、多人在线入口或冲突合并 UI。

## 4. 推荐目录调整

Phase 4 可以新增这些位置：

```text
packages/
  graph-layout/                    # 可选，纯布局模型与 cache helper
    src/
      layoutTypes.ts
      simpleLayout.ts
      layoutCache.ts

packages/workbench/
  src/
    services/
      validationService.ts          # 组合 core + rulesets 的统一入口
      packageProjectService.ts      # 可选，纯 package manifest/view model，不读写文件
    selectors/
      ciSelectors.ts                # 可选，CI readiness view model

apps/desktop/
  src/
    workers/
      validationWorker.ts           # 可选，worker host 专用
    bootstrap/
      createDesktopAdapters.ts      # 扩展 package open/save host 能力

apps/desktop/src-tauri/
  src/
    main.rs                         # 只扩展文件/目录 dialog 与安全写入

tests/
  e2e/                              # 可选，若引入 Playwright project
    desktop-workflow.spec.ts
```

新增 package 时必须同步：

- `tsconfig` references。
- `package.json` workspace build/test scripts。
- `scripts/check-architecture.mjs` 边界。
- package public exports。
- 最小单元测试。

## 5. 轮次拆解

### 轮次 1：验证与 CI 语义一致化

任务：

- 梳理 CLI `validate`、Workbench validation、report/export 使用的验证入口。
- 让 CLI strict mode 覆盖 ruleset-specific diagnostics。
- 如需增加 `--ruleset`，必须定义和项目内 `rulePresetId` 的优先级。
- 更新 `.github/workflows/labyrinth-validate.yml.example`。
- 增加 CLI 测试，覆盖基础 validation warning、ruleset warning、strict exit code。

架构要求：

- CLI 只能组合 core + rulesets，不复制算法。
- core 不依赖 rulesets。
- Workbench 和 CLI 的 validation composition 行为要有共享测试或相同 fixture。

验收：

- `labyrinth validate horror-clinic --strict --format json` 与 Workbench 对同一项目的 diagnostics 一致。
- ruleset warning 在 strict mode 下返回 1。
- parse/schema/IO 仍返回 2。
- `Validate.cmd`、`Smoke.cmd` 通过。

### 轮次 2：`.lcproj` package 主路径硬化

任务：

- Desktop 支持打开 `.lcproj` 目录并读取 `project.json`。
- Desktop 支持另存为 `.lcproj` package。
- 保存 package 时只写 canonical `project.json`。
- report/export 仍作为用户主动动作写入 package artifact。
- 增加 package 读写失败的错误文案与测试。
- 明确 package manifest 是否写入。如果写入，它只能描述 package，不参与 validation truth。

架构要求：

- package 文件系统读写只在 CLI/Desktop adapter。
- schema 可以定义 package contract，但不读写文件。
- workbench service 可以生成 package view model，但不碰文件系统。

验收：

- CLI 和 Desktop 都能打开 `.lcproj/project.json`。
- package 中删除 `exports/`、`reports/`、`cache/` 后项目仍能打开。
- 损坏的 generated artifact 不影响 validation。
- `.lcproj.json` 原路径不回归。

### 轮次 3：保存可靠性、恢复与迁移占位

任务：

- 桌面保存采用安全写入策略，避免写一半损坏项目。
- 保存失败时保持 dirty 状态，不误报成功。
- 增加“另存为”和“当前路径保存”的一致测试。
- 梳理 migration 占位：当前 schema version 不变时不做伪迁移。
- 可选：增加 app-local 最近打开项目列表，但不要写入 ProjectGraph。

架构要求：

- atomic write 只属于 Desktop/CLI 文件层。
- migration 只属于 schema 层。
- App-local preference 不进入 `.lcproj.json` 或 `project.json`。

验收：

- save failure 有测试覆盖。
- cancel save 不改变 dirty 状态。
- schema parse/migration error 能被清晰显示。
- `ProjectGraph` 未新增 UI preference 字段。

### 轮次 4：验证 worker 与大项目性能

任务：

- 增加一个 50-100 节点的大型 fixture 或生成器。
- 测量当前 validation/report/export 时间，写入测试或 smoke 说明。
- 引入 validation worker 或异步验证队列。
- 处理快速连续编辑时的过期结果，使用 request id 或 revision。
- UI 增加 validating 状态，但不阻塞编辑。

架构要求：

- worker 不复制 core 算法。
- Workbench snapshot 仍由 command bus 驱动。
- UI 只显示 status，不拥有 validation truth。

验收：

- 连续编辑不会显示旧 validation result。
- 大 fixture 下验证可完成且不阻塞主要交互。
- worker 不引入 DOM/Tauri 依赖到 workbench/core。
- architecture check 覆盖新增 worker/graph-layout 边界。

### 轮次 5：Graph layout 与 UI 工作台打磨

任务：

- 根据现有 UI/UX 文档和 Inscape 风格参考，收敛右侧面板的信息密度。
- 改善 Export、Review、Report、Diagnostics 的扫描顺序。
- 如果引入 layout cache，写入 `.lcproj/cache/layout-cache.json` 或 app-local cache，不写实体字段。
- 增加移动或小窗口下的基本布局保护，避免按钮文字和面板重叠。
- 保持 light-only、低干扰、工具型界面，不做营销式 hero 或装饰性背景。

架构要求：

- UI 组件接收 view model 和 callbacks。
- 不在 component 中解释 ruleset 语义。
- 不在 UI 中生成 report/export 领域内容。
- layout cache 可丢弃、可再生成。

验收：

- Playwright 打开 1440x1000 与 390x844 两个视口，不出现明显重叠。
- Review/Report/Export 面板仍可完成关键动作。
- Graph 视图选择实体后 Inspector、Review、Diagnostics 联动正常。
- CSS 未退回深色重装饰、紫蓝渐变或多层卡片堆叠风格。

### 轮次 6：端到端回归与桌面 release dry-run

任务：

- 建立 Playwright E2E smoke，覆盖：
  - 打开 Dashboard。
  - 选择 Horror Puzzle。
  - 创建实体或修改实体字段。
  - Validate。
  - Add review thread/comment/resolve。
  - Export Engine JSON。
  - Export Markdown/JSON report。
- 增加 Tauri release dry-run 或本地 bundle 验证脚本。
- 检查 build artifact 不被 git 跟踪。
- 更新 Phase 4 acceptance review 文档。

架构要求：

- E2E 只验证用户路径，不绕过 UI 直接改 store。
- release 脚本不能执行真实发布。
- package/release 命令必须走 ops workflow 配置。

验收：

- `Validate.cmd` 通过。
- `Smoke.cmd` 通过。
- `cargo fmt --check` 和 `cargo check` 通过。
- Playwright E2E smoke 通过。
- Tauri bundle 或 release dry-run 可重复运行。
- git status 干净。

## 6. 测试要求

### 6.1 单元测试

必须覆盖：

- CLI validate 的 ruleset-aware strict exit code。
- Workbench validation service 对 rulePresetId、overrides、exceptions 的处理。
- `.lcproj` package path resolution。
- Desktop adapter package open/save 行为。
- save cancel、save failure、export cancel。
- layout cache 的可丢弃与不参与 validation。
- worker request id 防止旧结果覆盖新结果。

### 6.2 集成测试

必须覆盖：

- sample project -> validate -> report -> engine export 的一致链路。
- `.lcproj` package -> validate/report/export artifact。
- Desktop adapter 保存 project/report/export 的路径与扩展名限制。
- 大 fixture validation 不超出可接受时间。

### 6.3 E2E / Smoke

建议建立：

```text
tests/e2e/desktop-workflow.spec.ts
```

最低覆盖：

- Dashboard 进入样例。
- 选择实体。
- 添加 Review comment。
- Resolve/Reopen thread。
- 导出 Engine JSON。
- 导出 Report JSON / Markdown。
- 验证页面无 console error。

## 7. UI 设计要求

Phase 4 UI 的方向是“可长期工作的桌面工具”，不是展示页。

保持：

- 暖白纸面、低饱和强调色、轻边框、清晰状态。
- 顶部工具栏紧凑，按钮使用图标加短文本。
- 右侧信息面板适合扫描，标题和内容字号克制。
- Diagnostics 明确但不喧宾夺主。
- Review 像评审注释，不像聊天应用。
- Export/Report 像生产动作，不像营销卡片。

避免：

- 大面积深色、玻璃拟态、渐变背景。
- 多层 card 套 card。
- 大号 hero 字体进入工具界面。
- 用说明文字解释功能，而不是把控件设计清楚。
- UI 内大段展示 JSON export。

## 8. Architecture Check 必须更新

如果 Phase 4 新增 package 或测试目录，必须更新 `scripts/check-architecture.mjs`。

目标边界：

```text
packages/schema                 -> no core/workbench/editor-ui/desktop/rulesets/exporters
packages/core                   -> schema only
packages/rulesets               -> schema only
packages/exporters              -> schema only
packages/graph-layout           -> schema only
packages/workbench              -> schema/core/rulesets/exporters/(graph-layout optional)
packages/editor-ui              -> schema/workbench/React/React Flow only
collaboration packages/providers -> not planned; no package may depend on them
apps/cli                        -> schema/core/rulesets/exporters/workbench service only if no React/DOM
apps/desktop                    -> editor-ui/workbench/Tauri/browser host
examples                        -> no workspace package import except generated JSON samples
tests/e2e                       -> may depend on Playwright and app URL only
```

任何新增依赖都必须回答：

1. 这个依赖是否把外部运行时带进领域层？
2. 这个依赖是否让 schema/core 反向依赖应用层？
3. 这个依赖是否导致 generated artifact 变成项目真相？
4. 这个依赖是否能通过 architecture check 自动守住？

## 9. Phase 4 红线

出现以下任一情况，Phase 4 不应验收通过：

- `packages/core` 依赖 rulesets、workbench、exporters、editor-ui、desktop、CLI、Tauri、React、Yjs 或 Node 文件系统。
- `packages/schema` 依赖任何运行时应用层。
- CLI 复制 core validation 算法。
- Desktop 生成 report/export 内容，而不是调用 workbench/exporter service。
- `.lcproj` package 的 exports/reports/cache 参与 validation 或 migration truth。
- UI component 直接修改 ProjectGraph，而不是发 command/callback。
- React Flow layout 数据写入 Space/Connection/Gate/Token/Puzzle/Beat。
- worker 内维护另一份项目状态。
- Yjs 进入 WorkbenchStore 主路径。
- Unity/Godot importer 反向定义 schema。
- release 脚本跳过 Validate/Smoke/architecture check。

## 10. Phase 4 完成定义

Phase 4 完成时应满足：

- CLI validate/report/export 与 Workbench 对同一项目的结果一致。
- `.lcproj` package 可在 CLI 和 Desktop 主路径打开，且 `project.json` 仍是唯一真相。
- 桌面保存/另存为/导出失败时状态可靠。
- 大型项目验证不会阻塞主要 UI 交互。
- Graph layout 或 cache 不污染领域实体。
- Playwright E2E 覆盖关键用户路径。
- Tauri 本地 release dry-run 或 bundle 验证可重复执行。
- Architecture check 覆盖 Phase 4 新增边界。
- `Validate.cmd`、`Smoke.cmd`、`cargo fmt --check`、`cargo check` 全部通过。
- 输出 `docs/phase4-acceptance-review.md`，记录机器验证、人工 smoke、架构审查和残余风险。

## 11. 给开发 AI 的最短执行提示

```text
Phase 4 是 Beta 硬化，不是重写架构。
统一 CLI/Workbench 验证语义，提升 .lcproj package 为可用主路径，补保存可靠性、worker 性能、UI 回归和 release dry-run。
ProjectGraph 仍是唯一项目真相；exports/reports/cache 仍是 artifact；UI 仍只渲染 view model；Desktop/CLI 只做宿主读写；worker 只是执行环境；实时协作方向已取消，只保留架构守卫防止回流。
每新增一个能力，先写边界和测试，再接 UI。
```

如果要新增字段或依赖，先停下来问：

1. 它是不是领域真相？
2. 它能不能被 schema 迁移？
3. 它能不能被 deterministic test 覆盖？
4. 它会不会让 core/schema/workbench 依赖宿主、UI 或外部引擎？
5. 它是否可以由已有 ProjectGraph 派生？

只有这些问题都有清晰答案，才允许进入主路径。
