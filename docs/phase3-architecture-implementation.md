# Phase 3 架构与实施说明

日期：2026-06-16  
项目：Labyrinth Composer  
目标阶段：Phase 3 - 生产接入与个人自查准备  
前置状态：Phase 2 已通过验收，可以进入 Phase 3。

## 1. Phase 3 目标

Phase 3 的目标是让 Labyrinth Composer 从“设计分析工具”进入独立开发者的真实生产流程，同时保持本地优先、文件可审查、核心规则纯净。

本阶段核心交付：

- Unity / Godot JSON importer 示例。
- CLI 验证器进入 CI 流程，退出码、JSON 输出和报告输出稳定。
- Engine Export 数据模型：让游戏引擎能定位 Space、Connection、Gate、Token、Puzzle、Beat。
- `.lcproj` 包结构探索：`project.json`、`exports/`、`reports/`、`assets/`、`cache/`。
- Review / Comment 数据结构：作为个人自查备注和设计复盘记录。
- Phase 0-2 架构守护升级：新增集成层、导出层、包结构和个人自查数据的依赖边界检查。

Phase 3 的成功标准：

```text
项目文件仍然是稳定真相；导出、CI、引擎示例、报告和个人自查备注都围绕 ProjectGraph 与 Command Bus 扩展，而不是改写它们。
```

## 2. Phase 3 最大风险

Phase 3 很容易把架构写脏，因为它会接触真实生产系统：

- 引擎希望拿到自己舒服的数据结构。
- CI 希望快速失败，可能绕过现有验证入口。
- 个人备注可能被误做成团队评审或在线协作流程。
- `.lcproj` 包结构可能把 assets、exports、cache 混成一个真相。
- 桌面宿主可能为了保存/导出方便复制领域逻辑。

这些都不能反向污染 Phase 1/2 已经建立的边界。

请守住一句话：

```text
Core 负责规则，Schema 负责契约，Workbench 负责命令和投影，Editor UI 负责呈现，Desktop/CLI 负责宿主能力，Integrations 负责适配外部世界。
```

## 3. 架构原则

### 3.1 ProjectGraph 仍是唯一项目真相

`.lcproj.json` 或 `.lcproj/project.json` 仍然是项目真相。

允许保存：

- ProjectGraph 领域实体。
- rulePresetId、ruleOverrides、diagnosticExceptions。
- reviewThreads 这类明确的个人自查备注数据。
- 可迁移的 engine export 配置。

禁止保存：

- Unity / Godot 场景对象引用作为主数据。
- React Flow nodes / edges。
- selection、hover、viewport、panel state。
- CI 输出缓存。
- generated report text。
- engine export artifact。
- 实时协作 session、presence、cursor、provider state、CRDT update。

### 3.2 Engine Export 是派生物

引擎导出数据必须从 `ProjectGraph + ValidationResult + RulePreset` 派生。

禁止：

- 在 ProjectGraph 中加入 Unity-only 字段。
- 在 ProjectGraph 中加入 Godot-only 字段。
- 让 exporter 修改项目数据。
- 让 importer 示例反向定义 schema。

允许：

- 在 `packages/exporters` 中生成稳定的 engine export DTO。
- 在 `examples/unity-importer` 和 `examples/godot-importer` 中消费导出 JSON。
- 在 CLI/Desktop 中保存导出 artifact。

### 3.3 CI 是 CLI 的使用场景，不是新验证器

CI 必须调用现有 core 验证入口。

允许：

- `labyrinth validate --strict --format json`
- `labyrinth report --format json`
- `labyrinth export <project-file> --target engine-json --out file`

禁止：

- 在 CI 脚本中重新实现可达性。
- 在 GitHub Actions workflow 中解析人类文案判断失败。
- 在 CLI 中复制 core 规则。

### 3.4 个人自查不是团队协作

Review / Comment 数据可以进入项目文件，但产品语义是个人自查备注，不是在线团队评审。

允许：

- 针对实体留下设计备注。
- 标记 open / resolved。
- 在 report 中体现自查摘要。
- 通过 Workbench command 修改，支持 undo/redo。

禁止：

- 账号、权限、通知、任务分配。
- 在线评论流。
- 多人 presence、cursor、room、provider。
- 把 review 状态做成会话状态或远端同步状态。

### 3.5 实时协作不属于产品计划

实时多人协作已被产品 owner 明确排除。Phase 3 不创建协作原型，不引入 `yjs`，不保留 collaboration package。

架构检查应继续禁止：

- main packages 依赖 `@labyrinth/collaboration-prototype` 或 `@labyrinth/collaboration-session`。
- main packages 依赖 `yjs`、`y-websocket`、`y-webrtc`。
- `ProjectGraph` 增加 presence、cursor、provider、room、session 等字段。

## 4. 推荐目录结构

```text
packages/
  schema/
    src/
      project.ts
      review.ts                 # ReviewThread / ReviewComment 类型
      engineExport.ts           # Engine export DTO 类型，可选

  core/
    src/
      validation/
      analysis/
      review/                   # 只放纯 review 数据校验，如需要

  exporters/
    src/
      reportModel.ts
      markdownReport.ts
      jsonReport.ts
      engineExportModel.ts       # 稳定引擎导出模型
      unityExport.ts             # 可选：Unity-friendly JSON shaping
      godotExport.ts             # 可选：Godot-friendly JSON shaping

  workbench/
    src/
      commands/
      selectors/
      services/
        engineExportService.ts
        reviewService.ts

  editor-ui/
    src/
      components/
        ExportPanel.tsx
        ReviewPanel.tsx

apps/
  cli/
    src/
      commands/
        validate.ts
        report.ts
        export.ts

  desktop/
    src/
      bootstrap/
        createDesktopAdapters.ts

examples/
  unity-importer/
  godot-importer/
```

说明：

- `packages/exporters` 可以生成 engine export DTO，但不能依赖 Unity/Godot runtime。
- Unity/Godot 示例放在 `examples/`，不进入 monorepo TypeScript build 主路径。
- 不再新增 `packages/collaboration-prototype`。

## 5. Engine Export 设计

建议稳定 DTO：

```ts
export type EngineExport = {
  exportVersion: '0.1.0';
  generatedAt: string;
  sourceProject: {
    id: string;
    name: string;
    schemaVersion: string;
    rulePresetId?: string;
  };
  validation: {
    ok: boolean;
    diagnostics: EngineDiagnostic[];
  };
  spaces: EngineSpace[];
  connections: EngineConnection[];
  gates: EngineGate[];
  tokens: EngineToken[];
  puzzles: EnginePuzzle[];
  beats: EngineBeat[];
};
```

原则：

- ID 必须稳定，使用项目内实体 ID。
- 导出可包含冗余索引，方便引擎消费。
- 导出不能包含 UI 状态。
- 导出不能成为下一次保存项目的输入真相。

## 6. CLI / CI 设计

稳定退出码：

```text
0  validation/report/export completed and accepted
1  project is valid JSON/schema but validation failed in strict mode
2  file read, JSON parse, schema validation, argument, or export IO error
```

CI 不应解析 text formatter。

要求：

- `validate --format json` 输出结构化结果。
- `report --format json` 输出结构化报告。
- `export` 命令提供稳定 JSON 文件输出。

## 7. `.lcproj` 包结构探索

建议原型：

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
- `exports/` 和 `reports/` 是可再生成 artifact。
- `cache/` 可删除。
- assets 不参与验证，除非 schema 明确引用。
- desktop 可以打开包目录，但必须最终读取 `project.json`。

## 8. Review / Comment 数据结构

自查备注数据可以进入项目文件，但必须结构化。

建议类型：

```ts
export type ReviewThread = {
  id: string;
  target: EntityRef;
  status: 'open' | 'resolved';
  comments: ReviewComment[];
};

export type ReviewComment = {
  id: string;
  author?: string;
  body: string;
  createdAt?: string;
};
```

边界：

- Review 不参与 core validation，除非未来有明确 self-review completeness rule。
- Review UI 通过 workbench command 修改。
- Review Panel 不直接深改 ProjectGraph。
- Comment target 必须是 EntityRef，不使用 DOM selector 或 React Flow node ID。

## 9. Workbench 设计

新增 command：

```text
AddReviewThread
UpdateReviewThreadStatus
AddReviewComment
RemoveReviewComment
SetEngineExportOptions
```

新增 selector：

```text
createExportViewModel
createReviewThreadViewModels
createCiSummaryViewModel
```

新增 service：

```text
createEngineExportText(snapshot, options)
createReviewSummary(project)
```

要求：

- 所有 command 可序列化。
- 所有 command 可 undo/redo。
- service 只组合已有 schema/core/exporters 输出，不写文件。

## 10. UI 设计

Phase 3 UI 应保持工具型、克制、可扫描。

新增面板：

- Export Panel：选择导出格式、查看 export summary、执行导出。
- Review Panel：查看实体自查备注、添加备注、resolve thread。
- CI Panel 可选：显示当前项目是否适合 CI strict mode。

禁止：

- 把导出 JSON 大段塞进主画布。
- 把 Review 做成聊天应用。
- 把 Unity/Godot 专有概念放进核心 Inspector。
- 在 UI 内判断 CI 失败原因。

## 11. 测试要求

必须覆盖：

- Engine export model 稳定排序。
- Engine export 不包含 UI 状态。
- CLI strict exit code。
- CLI report/export `--out` 写文件。
- Review command undo/redo。
- Review target 引用不存在时的 schema 或 validation 行为。
- `.lcproj` package prototype 读取 `project.json`，如果实现。
- architecture check 禁止协作依赖和 session 字段回流。

## 12. 实施轮次

### 轮次 1：Engine Export Contract

- 新增 engine export DTO。
- 新增 exporter 纯函数。
- 添加 golden tests。
- CLI 增加 `export` 命令。

### 轮次 2：Unity / Godot Importer 示例

- 添加 Unity importer 示例。
- 添加 Godot importer 示例。
- 每个示例读取同一份 engine export JSON。
- 文档说明如何映射 Space/Gate/Token。

### 轮次 3：CI 模式

- 固化 CLI exit code。
- 增加 strict validation tests。
- 增加 GitHub Actions example。
- 增加 JSON report artifact 示例。

### 轮次 4：Review Data

- 新增 ReviewThread / ReviewComment schema。
- 新增 workbench commands/selectors。
- 新增 Review Panel。
- 支持针对实体打开 thread。

### 轮次 5：`.lcproj` Package Prototype

- 设计包结构。
- 实现读取 `project.json` 的原型。
- 导出 report/export artifact 到 package 子目录。
- 记录迁移风险。

### 轮次 6：协作方向清理核查

- 不新增协作原型。
- 确认主路径没有 `yjs`、collaboration package、presence/cursor/session 字段。
- 确认旧协作计划不在 docs check 中作为必需文档。

### 轮次 7：收口与验收

- 完整 Validate / Smoke / cargo check。
- 运行 CLI export/report/validate smoke。
- 手动验证 desktop export。
- 更新 Phase 3 acceptance review。

## 13. Phase 3 完成定义

Phase 3 完成时应满足：

- Engine export JSON 可由 CLI 和 Desktop 生成。
- Unity / Godot importer 示例能读取 export JSON 并定位 Space/Gate/Token。
- CLI strict mode 退出码稳定并有测试。
- GitHub Actions example 可用。
- ReviewThread / ReviewComment 可保存、显示、编辑、resolve。
- `.lcproj` package prototype 有文档和最小读取实现。
- 实时协作不进入主路径，相关 prototype 不保留为产品计划。
- `Validate.cmd`、`Smoke.cmd`、`cargo check` 通过。
- Architecture check 覆盖新增 packages/examples/experiments 边界。
- `ProjectGraph` 未混入 Unity/Godot/React Flow/UI/session 临时状态。

## 14. 架构红线

以下任意一条出现，Phase 3 不应验收通过：

- core 依赖 exporters、workbench、editor-ui、desktop、CLI、Unity、Godot。
- schema 依赖任何运行时包。
- exporters 读取或写入文件。
- exporters 重新实现 validation。
- desktop 生成 engine export 内容。
- CLI 复制 core 验证规则。
- Unity/Godot 示例要求修改 ProjectGraph 以适配引擎。
- `.lcproj` package 中 exports/reports/cache 被当成项目真相。
- Review comment target 使用 DOM/React Flow ID，而不是 EntityRef。
- UI 直接解析 JSON report 来驱动核心状态。
- `yjs`、provider、presence、cursor、room、session 进入主路径。

## 15. 给开发 AI 的最短执行提示

```text
Phase 3 是生产接入与个人自查准备，不是架构重写。
Engine export 是派生物。
CI 调 CLI，CLI 调 core。
Review 是结构化 EntityRef 自查备注。
.lcproj package 只有 project.json 是真相。
Unity/Godot 示例只能消费导出 JSON。
实时协作不属于产品计划，不要新增 Yjs 或 collaboration package。
不要把外部系统的方便，换成内部架构的污染。
```

如果需要新增字段，请先问：

1. 这是 ProjectGraph 的领域真相，还是某个导出/自查视图的派生数据？
2. 它能否被 schema 迁移？
3. 它是否会迫使 core 或 UI 依赖外部系统？
4. 它是否能被稳定测试？

只有四个答案都清楚，才允许进入主路径。
