# Phase 2 架构与实施说明

日期：2026-06-16  
项目：Labyrinth Composer  
目标阶段：Phase 2 - 专业规则包与体验分析  
前置状态：Phase 1.5 Fix 已通过验收，可以进入 Phase 2。

## 1. Phase 2 目标

Phase 2 的目标不是继续堆 UI，而是让 Labyrinth Composer 从“能搭建并验证空间谜题结构”走向“真的能帮助关卡设计师分析体验质量”。

本阶段核心交付：

- 通用迷宫、Zelda Mini Dungeon、Horror Puzzle 三类规则包。
- 回溯成本分析：Token 获取点到使用点距离、回程压力、新捷径建议。
- 提示距离分析：关键 Gate 是否提前展示、Token 用途间隔是否过长。
- Experience Timeline：Beat 标注、强度曲线、节奏单调诊断。
- Rule Preset 配置与阈值编辑。
- 诊断例外标记：用户可以确认某些 warning/info 是有意设计。
- 设计报告导出：Markdown 与 JSON 诊断摘要。

Phase 2 的成功标准不是“看起来更复杂”，而是：

```text
同一份 ProjectGraph 经过不同规则包，可以得到确定、可解释、可测试、可复现的分析结果。
```

## 2. 绝对架构原则

Phase 2 会引入规则包、分析器、Timeline、报告导出和更多 UI 面板，是最容易把 Phase 1 架构写脏的阶段。请严格守住以下边界。

### 2.1 Core 仍是唯一规则真相

所有规则判断、体验分析、诊断生成、阈值解释都必须位于纯 TypeScript 领域层。

允许：

- `packages/core` 实现通用分析算法。
- `packages/rulesets` 提供规则包配置、默认阈值和启用规则列表。
- `packages/test-fixtures` 提供规则包 fixture 与 expected diagnostics。

禁止：

- 在 `packages/editor-ui` 中判断“这个 Gate 是否提示过晚”。
- 在 `apps/desktop` 中计算回溯距离、强度曲线或规则包诊断。
- 在 React component 中根据 `Diagnostic.message` 解析语义。
- 在 report/exporter 中重新实现验证规则。

### 2.2 ProjectGraph 仍是 canonical source of truth

`.lcproj.json` 只保存领域数据，不保存 React Flow 内部对象和临时 UI 状态。

可以持久化：

- `rulePresetId`
- 规则阈值覆盖项
- 诊断例外
- Beat / Timeline 领域字段

不能持久化：

- selected entity
- hovered entity
- panel open state
- viewport transform
- React Flow nodes / edges
- validation panel filter
- report preview scroll position

### 2.3 UI 只消费 ViewModel

`packages/editor-ui` 只负责显示、表单输入和用户操作，不拥有领域语义。

规则：

- UI 组件接收 `workbench` selectors 输出的 ViewModel。
- UI 事件只 dispatch command 或调用 app/workbench callback。
- UI 不直接 import `@labyrinth/core`。
- UI 不直接 import `@labyrinth/rulesets`，除非只是展示静态名称也应优先由 workbench 投影。
- UI 不直接访问 Tauri、Node 文件系统或导出文件路径。

### 2.4 Desktop 只负责受控宿主能力

`apps/desktop` 可以组合 UI、workbench 和 Tauri adapter，但不得变成业务规则层。

允许：

- open/save/save-as 项目文件。
- save exported report。
- 显示桌面错误消息。

禁止：

- 在 Tauri command 中分析 ProjectGraph。
- 在 desktop app 中生成诊断。
- 在 desktop app 中手写 Markdown 报告内容。

## 3. 推荐包结构

Phase 2 建议在现有结构上增量扩展，不推翻 Phase 1。

```text
packages/
  schema/
    src/
      entities.ts
      diagnostics.ts
      rulesets.ts              # 新增：RulePreset/RuleException/RuleOverride 类型
      jsonSchema/project.schema.json
      migrations/

  core/
    src/
      validation/
        validateProject.ts
        validateProjectWithRules.ts   # 新增：带 ruleset/options 的入口
      analysis/
        backtracking.ts               # 可迁移或复用现有 metrics/backtracking
        hintDistance.ts
        timeline.ts
      rules/
        registry.ts                   # 规则执行注册，不放 UI 文案
        ruleContext.ts

  rulesets/
    src/
      presets/
        maze.ts
        zelda.ts
        horror.ts
      index.ts
    package.json

  exporters/
    src/
      reportModel.ts
      markdownReport.ts
      jsonReport.ts
      index.ts
    package.json

  workbench/
    src/
      selectors/
        rulePresetSelectors.ts
        timelineSelectors.ts
        reportSelectors.ts
      commands/
        commandTypes.ts
        commandHandlers.ts

  editor-ui/
    src/
      components/
        RulePresetPanel.tsx
        TimelinePanel.tsx
        ReportPanel.tsx
```

说明：

- `packages/core` 只依赖 `schema`，不依赖 `rulesets` 时也必须能运行默认验证。
- `packages/rulesets` 可以依赖 `schema`，尽量不要依赖 `core`。它提供配置，不执行算法。
- `packages/exporters` 可以依赖 `schema` 和 `workbench` 的纯 ViewModel 类型；若依赖 `workbench` 会形成文档导出层与应用层耦合，优先选择依赖 `schema` 与独立 `ReportModel`。
- `packages/workbench` 可以依赖 `core`、`schema`、`rulesets`、`exporters`，负责把领域输出投影给 UI。
- `packages/editor-ui` 依赖 `schema` 类型与 `workbench` ViewModel，不依赖 `core`、`rulesets`、`exporters`。
- `apps/desktop` 依赖 `editor-ui`、`workbench` 和 Tauri adapter。

## 4. 数据模型设计

### 4.1 RulePreset

Phase 2 应把“规则包”设计成配置，不要把每个规则包写成一套独立验证器。

建议类型：

```ts
export type RulePreset = {
  id: RulePresetId;
  name: string;
  description?: string;
  enabledRuleIds: string[];
  thresholds: Record<string, number>;
  severityOverrides?: Record<string, DiagnosticSeverity>;
};
```

规则包示例：

- `maze.standard`
- `zelda.mini-dungeon`
- `horror.clinic`

### 4.2 Rule Overrides

用户应该可以在项目中覆盖规则阈值，但不要把整个规则包复制进项目文件。

建议：

```ts
export type RulePresetOverride = {
  ruleId: string;
  thresholdOverrides?: Record<string, number>;
  severity?: DiagnosticSeverity;
  disabled?: boolean;
};
```

项目文件保存：

```ts
rulePresetId?: RulePresetId;
ruleOverrides?: RulePresetOverride[];
```

### 4.3 Diagnostic Exceptions

Phase 2 验收要求用户可以标记例外。例外应是结构化数据，不能只靠隐藏某条 message。

建议：

```ts
export type DiagnosticException = {
  id: string;
  ruleId: string;
  entityRefs: EntityRef[];
  reason?: string;
  createdAt?: string;
};
```

匹配策略：

- 优先使用 `ruleId + affectedEntities`。
- 不要依赖 `Diagnostic.message`。
- 若诊断 ID 会随阈值变化，不要把 ID 作为唯一匹配依据。

### 4.4 Beat / Timeline 扩展

当前 `Beat` 已有 `spaceId`、`intensity`、`description`。Phase 2 不要一次性扩成复杂剧情系统。

最小扩展建议：

```ts
export type BeatKind = 'discovery' | 'threat' | 'relief' | 'puzzle' | 'reward';

export type Beat = {
  id: BeatId;
  name: string;
  spaceId?: SpaceId;
  kind?: BeatKind;
  intensity?: number;
  order?: number;
  description?: string;
};
```

如果需要更多体验字段，必须先解释分析器如何使用它们，并补 schema migration 与 fixtures。

## 5. Core 设计

### 5.1 Validation Entry

保留当前入口：

```ts
validateProject(project)
```

新增带规则上下文的入口：

```ts
validateProjectWithRules(project, options)
```

建议：

```ts
export type ValidationOptions = {
  preset?: RulePreset;
  overrides?: RulePresetOverride[];
  exceptions?: DiagnosticException[];
};
```

原则：

- `validateProject(project)` 是默认规则入口，保持向后兼容。
- `validateProjectWithRules()` 组合默认验证、规则包分析、例外过滤或例外标注。
- 例外不要从结果中静默删除；建议保留并标记为 `suppressed` 或生成独立 `exceptionMatches`，让 UI 可解释。

### 5.2 分析器职责

每个分析器应是纯函数：

```ts
analyzeBacktracking(project, context): Diagnostic[]
analyzeHintDistance(project, context): Diagnostic[]
analyzeTimelinePacing(project, context): Diagnostic[]
```

每个分析器必须：

- 输入 `ProjectGraph` 与规则上下文。
- 输出结构化 `Diagnostic[]` 或明确的 analysis model。
- 不读写文件。
- 不引用 React、Tauri、DOM。
- 不产生随机结果。
- 对同一输入稳定排序。

### 5.3 规则 ID

Phase 2 需要扩展 `RULE_IDS`，命名要稳定。

建议：

```text
backtracking.long-token-return
hint.gate-too-late
hint.token-use-too-late
timeline.intensity-flat
timeline.intensity-spike
ruleset.disabled-required-rule
```

不要把规则 ID 设计成 UI 文案。规则 ID 是测试、例外、报告和 CI 的契约。

## 6. Rulesets 设计

`packages/rulesets` 只提供配置。

### 6.1 Maze Preset

关注：

- 关键目标可达。
- 过长死路或无意义回溯 warning。
- 单向连接是否导致不可返回区域。
- 可选 shortcut 建议。

默认阈值示例：

```text
maxBacktrackDistance = 5
maxDeadEndDepth = 4
```

### 6.2 Zelda Preset

关注：

- item / ability gate 的获取与使用顺序。
- Token 获取点到 Gate 使用点距离。
- Gate 是否在获得 Token 前被提前展示。
- Puzzle output 是否形成清晰 progression chain。

默认阈值示例：

```text
maxTokenUseDistance = 4
minGatePreviewDistance = 1
maxUnspentTokenDistance = 6
```

### 6.3 Horror Preset

关注：

- knowledge/state gate 的信息揭示顺序。
- 强度曲线是否过平或连续过高。
- 关键线索是否在 Gate 前有足够铺垫。
- 回程是否带来新事件或新信息。

默认阈值示例：

```text
maxClueToUseDistance = 5
maxConsecutiveHighIntensityBeats = 3
minReliefAfterSpike = 1
```

## 7. Workbench 设计

Workbench 是 Phase 2 的应用层，不做规则判断，但可以做投影、组合和 command。

### 7.1 Snapshot

当前 `WorkbenchSnapshot` 包含：

```ts
project
validation
status
dirty
```

Phase 2 可以扩展：

```ts
rulePreset
analysis
reportPreview
```

注意：

- snapshot 可以缓存派生结果。
- canonical 数据仍只在 `project` 中。
- 不要把 `analysis` 写回 `.lcproj.json`。

### 7.2 Commands

Phase 2 新增 command 必须可序列化、可测试回放。

建议 command：

```text
SetRulePreset
UpdateRuleOverride
AddDiagnosticException
RemoveDiagnosticException
UpdateBeat
ReorderBeat
```

禁止：

- command payload 携带 React event。
- command payload 携带函数。
- command payload 携带 React Flow node。
- command handler 访问 DOM 或 Tauri。

### 7.3 Selectors

新增 selectors：

- `createRulePresetViewModel`
- `createTimelineViewModel`
- `createReportViewModel`
- `createDiagnosticFilterViewModel`

UI 只能拿这些 ViewModel 渲染，不直接拼规则包或分析器输出。

## 8. UI 设计

Phase 2 UI 不要做成新的大而全页面。应在当前工作台上增加三块能力：

1. Rule Preset Panel
2. Timeline Panel
3. Report Panel

### 8.1 Rule Preset Panel

位置建议：

- Dashboard 中可选默认规则包。
- Workbench 顶部或左侧提供当前 preset 切换。
- Inspector 中不要塞完整规则包编辑器。

功能：

- 选择 Maze / Zelda / Horror。
- 显示启用规则和阈值。
- 允许编辑少量关键阈值。
- 显示规则包说明。

禁止：

- 在 UI 中实现“某规则是否命中”。
- 让 UI 根据阈值自己筛 diagnostics。

### 8.2 Timeline Panel

Timeline Panel 是 Beat 的体验投影，不是剧情编辑器。

最小功能：

- 展示 Beat 顺序。
- 展示 intensity 曲线。
- 点击 Beat 定位到 Space。
- 高亮 timeline diagnostics。
- 支持编辑 Beat kind/intensity/order。

实现边界：

- Timeline 曲线 ViewModel 由 workbench selector 生成。
- 节奏单调、强度 spike、缺少 relief 等诊断由 core 生成。
- UI 只渲染曲线和交互。

### 8.3 Report Panel

Report Panel 用于预览和导出，不负责生成诊断。

功能：

- 预览 Markdown report。
- 导出 Markdown。
- 导出 JSON report。
- 展示当前 preset、诊断摘要、例外项。

边界：

- report model 由 `packages/exporters` 或 workbench service 生成。
- desktop 只负责把 report text 写到文件。
- browser fallback 可以 download Blob，但不是 canonical desktop 文件能力。

## 9. Exporters 设计

`packages/exporters` 输出面向评审和 CI 的 artifact。

### 9.1 JSON Report

应包含：

- project metadata
- schemaVersion
- rulePresetId
- validation summary
- diagnostics
- exceptions
- analysis metrics
- generatedAt

不得包含：

- React component state
- viewport
- selected entity
- local absolute file path，除非用户明确选择导出且该字段有产品需求

### 9.2 Markdown Report

结构建议：

```text
# Labyrinth Composer Report

## Project
## Rule Preset
## Summary
## Errors
## Warnings
## Info
## Exceptions
## Timeline
## Suggested Fixes
```

Markdown 只格式化已有结构化数据，不重新判断规则。

## 10. 测试要求

Phase 2 必须测试先行，尤其是规则包。

### 10.1 Fixtures

每个规则包至少 10 个 fixture：

```text
packages/test-fixtures/cases/ruleset.maze.*
packages/test-fixtures/cases/ruleset.zelda.*
packages/test-fixtures/cases/ruleset.horror.*
```

每个 fixture 包含：

- `.lcproj.json`
- `.expected.json`

expected 应稳定记录：

- diagnostics
- reachableSpaces
- acquiredTokens
- openedGates
- solvedPuzzles
- timeline analysis summary，如适用

### 10.2 Unit Tests

至少覆盖：

- rule preset resolution
- threshold override
- disabled rule
- diagnostic exception match
- markdown report generation
- JSON report generation
- timeline pacing analysis
- hint distance analysis

### 10.3 UI Tests

最小 UI 测试：

- 选择规则包后 diagnostics 更新。
- 调整阈值后 diagnostics 更新。
- 标记 exception 后 Validation Panel 明确显示 suppressed/exception。
- Timeline 点击 Beat 后 Inspector 切到对应 Beat。
- Report preview 包含当前项目名、preset、diagnostics。

## 11. 架构检查要求

更新 `scripts/check-architecture.mjs`，新增包边界。

建议边界：

```text
packages/schema      -> no core/workbench/editor-ui/desktop/rulesets/exporters
packages/core        -> schema only
packages/rulesets    -> schema only
packages/exporters   -> schema, maybe rulesets types only
packages/workbench   -> schema, core, rulesets, exporters
packages/editor-ui   -> schema, workbench, React, React Flow
apps/desktop         -> editor-ui, workbench, schema, Tauri
apps/cli             -> schema, core, rulesets, exporters
```

禁止边界：

- `packages/core` import `@labyrinth/rulesets`
- `packages/core` import `@labyrinth/workbench`
- `packages/rulesets` import `@labyrinth/core`
- `packages/exporters` import React 或 Tauri
- `packages/editor-ui` import `@labyrinth/core`
- `packages/editor-ui` import `@labyrinth/rulesets`
- `packages/editor-ui` import `@tauri-apps/*`
- `packages/workbench` import React、React Flow、Tauri、DOM、Node fs/path/process

验收时必须证明 `.tsx` 文件仍在检查范围内。

## 12. 实施轮次

### 轮次 1：Schema 与规则包契约

目标：先把规则包、阈值、例外的数据契约定稳。

任务：

- 新增 `RulePreset`、`RulePresetOverride`、`DiagnosticException` 类型。
- 更新 JSON Schema。
- 添加 migration 占位或 v0.1 兼容策略。
- 新增 `packages/rulesets`。
- 添加 Maze / Zelda / Horror preset 配置。
- 更新 architecture check。

验收：

- schema tests 通过。
- architecture check 通过。
- 三个 preset 可被静态导入并列出。
- 旧项目文件仍可打开。

### 轮次 2：Core 规则上下文与分析器

目标：建立 `validateProjectWithRules()`，并把 Phase 2 分析放入 core。

任务：

- 新增 validation options。
- 实现 preset resolution。
- 实现 hint distance analysis。
- 扩展 backtracking threshold。
- 实现 timeline pacing analysis。
- 支持 diagnostic exception match。

验收：

- `validateProject(project)` 旧行为不破。
- `validateProjectWithRules(project, options)` 能按 preset 产生不同 warning/info。
- 每个新增 rule 有正反例测试。

### 轮次 3：Fixtures 与规则包测试矩阵

目标：让规则包不是文案，而是可验证契约。

任务：

- 每个规则包至少 10 个 fixture。
- expected diagnostics 精确匹配。
- 添加 fixture runner 对 preset 维度运行。
- 保持诊断排序稳定。

验收：

- 至少 30 个 ruleset fixture。
- 所有 expected 精确匹配。
- 修改阈值会导致明确测试变化。

### 轮次 4：Workbench Commands 与 Selectors

目标：把规则包能力接到应用层，但不让 UI 直接碰规则。

任务：

- 新增 SetRulePreset / UpdateRuleOverride / AddDiagnosticException commands。
- 扩展 WorkbenchSnapshot。
- 新增 rule preset、timeline、report selectors。
- 更新 project save/load 对新增字段的处理。

验收：

- command 可测试回放。
- undo/redo 对规则包编辑可用。
- selector 输出稳定 ViewModel。

### 轮次 5：UI 面板

目标：实现 Phase 2 的最小可用界面。

任务：

- Rule Preset Panel。
- Timeline Panel。
- Diagnostics filter 与 exception 操作。
- Report Panel 预览入口。
- Dashboard 支持选择初始规则包。

验收：

- 用户能切换规则包并看到诊断变化。
- 用户能调整阈值。
- 用户能标记 exception。
- Timeline 能显示 Beat/intensity。
- UI 不 import core/rulesets/exporters。

### 轮次 6：报告导出

目标：让分析结果能用于团队评审。

任务：

- 新增 `packages/exporters`。
- 实现 Markdown report。
- 实现 JSON report。
- Desktop 接入 Save Report As。
- CLI 支持 report 输出。

验收：

- 报告包含项目、preset、summary、diagnostics、exceptions、timeline。
- Markdown 与 JSON golden tests 通过。
- Desktop 可导出真实文件。
- CLI 可用于 CI 生成报告。

### 轮次 7：收口与体验验证

目标：进入 Phase 3 前清理架构与产品闭环。

任务：

- 完整 Validate / Smoke。
- 手动搭建 10-20 节点 Zelda 样例并跑分析。
- 手动搭建 Horror 样例并检查 timeline。
- 检查 chunk warning，必要时做 code splitting。
- 更新 Phase 2 验收文档。

验收：

- 设计师可以用规则包分析一个 10-20 节点项目。
- 报告可用于团队评审。
- 架构检查覆盖所有新增包和 `.tsx`。
- 无 UI 复制规则逻辑。

## 13. Phase 2 完成定义

完成 Phase 2 后，应满足：

- 三个规则包可用：Maze、Zelda、Horror。
- 每个规则包至少 10 个 fixture。
- 规则包诊断支持 error/warning/info。
- 用户可以设置规则包和阈值覆盖。
- 用户可以标记诊断例外，且例外有结构化保存。
- Backtracking、Hint Distance、Timeline 至少各有一类可解释诊断。
- Timeline Panel 可以展示 Beat 与 intensity 曲线。
- Report Panel 可以预览 Markdown report。
- Desktop 可以导出 Markdown/JSON report 到真实文件。
- CLI 可以输出 report。
- `Validate.cmd`、`Smoke.cmd`、`cargo check` 通过。
- 架构检查覆盖 `.ts`、`.tsx` 和新增 package 边界。
- UI 没有复制 core 规则。
- ProjectGraph 没有保存 React Flow 或临时 UI 状态。

## 14. 架构红线

以下情况出现任意一条，Phase 2 不应验收通过：

- `packages/editor-ui` 直接 import `@labyrinth/core`。
- `packages/editor-ui` 直接 import `@labyrinth/rulesets` 并自行解释规则。
- `packages/workbench` 依赖 React、React Flow、DOM、Tauri 或 Node 文件系统。
- `packages/core` 依赖 rulesets、workbench、editor-ui、desktop、CLI、React、Tauri、Node 文件系统。
- `packages/rulesets` 开始执行验证算法。
- `packages/exporters` 重新计算 diagnostics。
- 诊断例外通过 `message` 字符串匹配。
- report 生成逻辑散落在 React component 里。
- `.lcproj.json` 写入 selection、viewport、panel state 或 React Flow nodes。
- 新增规则没有 fixture。
- 新增 UI 功能绕过 Command Bus 直接深改 ProjectGraph。

## 15. 给开发 AI 的最短执行提示

如果只读一段，请读这一段：

```text
Phase 2 可以新增规则包、分析器、Timeline 和报告，但不能把规则写进 UI。

Schema 定契约。
Core 做规则和分析。
Rulesets 只放配置。
Workbench 做 command、selector 和 ViewModel。
Editor UI 只渲染和发起操作。
Desktop 只做文件能力。
Exporters 只格式化已有结构化结果。

每个新增规则必须有 fixture。
每个新增边界必须进 architecture check。
```

守住这条线，Phase 2 可以放心扩展；破掉这条线，Phase 3 的引擎接入、CI、协作和报告都会被拖进返工。
