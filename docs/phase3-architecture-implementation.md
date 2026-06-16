# Phase 3 架构与实施说明

日期：2026-06-16  
项目：Labyrinth Composer  
目标阶段：Phase 3 - 生产接入与协作准备  
前置状态：Phase 2 已通过验收，可以进入 Phase 3。

## 1. Phase 3 目标

Phase 3 的目标是让 Labyrinth Composer 从“设计分析工具”进入真实团队流程，但仍然保持本地优先、文件可审查、核心规则纯净。

本阶段核心交付：

- Unity / Godot JSON importer 示例。
- CLI 验证器进入 CI 流程，退出码、JSON 输出和报告输出稳定。
- Engine Export 数据模型：让游戏引擎能定位 Space、Connection、Gate、Token、Puzzle、Beat。
- `.lcproj` 包结构探索：`project.json`、`exports/`、`reports/`、`assets/`、`cache/`。
- Review / Comment 数据结构：团队评审可以针对实体留言。
- 协作前置设计：Yjs entity graph adapter 原型，但不进入主产品路径。
- Phase 0-2 架构守护升级：新增集成层、导出层和协作实验层的依赖边界检查。

Phase 3 的成功标准：

```text
项目文件仍然是稳定真相；导出、CI、引擎示例、评审和协作原型都围绕 ProjectGraph 与 Command Bus 扩展，而不是改写它们。
```

## 2. Phase 3 最大风险

Phase 3 很容易把架构写脏，因为它会接触真实生产系统：

- 引擎希望拿到自己舒服的数据结构。
- CI 希望快速失败，可能绕过现有验证入口。
- 协作原型希望把 CRDT 状态变成主状态。
- 评审评论希望塞进 UI 层本地状态。
- `.lcproj` 包结构希望把 assets、exports、cache 混成一个真相。

这些都不能反向污染 Phase 1/2 已经建立的边界。

请守住一句话：

```text
Core 负责规则，Schema 负责契约，Workbench 负责命令和投影，Editor UI 负责呈现，Desktop/CLI 负责宿主能力，Integrations 负责适配外部世界。
```

## 3. 架构原则

### 3.1 ProjectGraph 仍是唯一项目真相

`.lcproj.json` 或未来 `.lcproj/project.json` 仍然是项目真相。

允许保存：

- ProjectGraph 领域实体。
- rulePresetId、ruleOverrides、diagnosticExceptions。
- reviewThreads 这类明确的评审数据。
- 可迁移的 engine export 配置。

禁止保存：

- Unity / Godot 场景对象引用作为主数据。
- React Flow nodes / edges。
- selection、hover、viewport、panel state。
- CI 输出缓存。
- generated report text。
- engine export artifact。
- Yjs 内部 document snapshot，除非放在实验目录且不是主项目格式。

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
- 新增 `labyrinth export engine`

禁止：

- 在 CI 脚本中重新实现可达性。
- 在 GitHub Actions workflow 中解析人类文案判断失败。
- 在 CLI 中复制 core 规则。

### 3.4 协作是 adapter，不是主状态

Yjs 原型只能是 Command / Entity adapter。

禁止：

- 让 `ProjectGraph` 直接变成 Yjs document。
- 让 core 依赖 Yjs。
- 让 workbench 必须依赖 Yjs 才能运行。
- 让协作 presence 写入项目文件。

允许：

- 建立实验包 `packages/collaboration-prototype` 或 `experiments/yjs-entity-graph`。
- 把 serializable Command 映射为 CRDT update。
- 把 CRDT update 投影回 Command Bus 或 ProjectGraph patch。
- 只在实验 app / story / test 中验证，不进入主 desktop path。

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
      engineExportModel.ts       # 新增：稳定引擎导出模型
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

  collaboration-prototype/       # 可选，实验包，不进主路径
    src/
      commandToYjs.ts
      yjsToCommand.ts
      entityGraphAdapter.ts

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
- `packages/collaboration-prototype` 若创建，必须在 architecture check 中标记为实验层，不能被 core/workbench/editor-ui 依赖。

## 5. Engine Export 设计

### 5.1 Export Model

建议新增稳定 DTO：

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

### 5.2 Unity / Godot 示例

Unity 示例只证明：

- 能读取 export JSON。
- 能按 ID 找到 Space/Gate/Token。
- 能输出缺失映射。
- 能在示例场景或测试脚本中定位实体。

Godot 示例同理。

禁止：

- Unity importer 修改 `.lcproj.json`。
- Godot importer 生成新的 ProjectGraph。
- 引擎示例要求项目 schema 增加 engine-only 字段。

## 6. CI 设计

### 6.1 CLI Exit Codes

保持并文档化稳定退出码：

```text
0  validation/report/export completed and accepted
1  project is valid JSON/schema but validation failed in strict mode
2  file read, JSON parse, schema validation, argument, or export IO error
```

如果当前 CLI 已有退出码，Phase 3 应补齐文档与测试，不随意改变旧行为。

### 6.2 CI JSON Output

CI 不应解析 text formatter。

要求：

- `validate --format json` 输出结构化结果。
- `report --format json` 输出结构化报告。
- 新增 export 命令时也提供 JSON 结果或 manifest。

### 6.3 GitHub Actions 示例

新增示例 workflow：

```text
.github/workflows/labyrinth-validate.yml.example
```

先放 example，不默认启用阻塞团队 CI，除非项目明确决定。

## 7. `.lcproj` 包结构探索

Phase 3 可以探索包结构，但不能立刻替代 `.lcproj.json` 主路径。

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
- assets 不参与验证，除非未来 schema 明确引用。
- desktop 可以打开包目录，但必须最终读取 `project.json`。

Phase 3 验收不要求 `.lcproj` 包结构成为默认保存格式，只要求设计、原型和迁移风险评估完成。

## 8. Review / Comment 数据结构

评审数据可以进入项目文件，但必须结构化。

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

- Review 不参与 core validation，除非未来有明确 review completeness rule。
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

## 10. Desktop / CLI 设计

### 10.1 Desktop

Desktop 新增能力：

- Export Engine JSON。
- Save CI report JSON。
- Open `.lcproj` package prototype，可选。

边界：

- Desktop adapter 只处理文件对话框和写入。
- Desktop 不生成 export 内容。
- Desktop 不执行验证算法。

### 10.2 CLI

CLI 新增能力：

```text
labyrinth export <project-file> --target engine-json --out file
labyrinth validate <project-file> --strict --format json
labyrinth report <project-file> --format json --out file
```

边界：

- CLI 可以读写文件。
- CLI 可以调用 schema/core/rulesets/exporters。
- CLI 不复制验证规则。

## 11. UI 设计

Phase 3 UI 应保持工具型、克制、可扫描。

新增面板：

- Export Panel：选择导出格式、查看 export summary、执行导出。
- Review Panel：查看实体评论、添加评论、resolve thread。
- CI Panel 可选：显示当前项目是否适合 CI strict mode。

禁止：

- 把导出 JSON 大段塞进主画布。
- 把 Review 做成聊天应用。
- 把 Unity/Godot 专有概念放进核心 Inspector。
- 在 UI 内判断 CI 失败原因。

## 12. 测试要求

### 12.1 Unit Tests

必须覆盖：

- Engine export model 稳定排序。
- Engine export 不包含 UI 状态。
- CLI strict exit code。
- CLI report/export `--out` 写文件。
- Review command undo/redo。
- Review target 引用不存在时的 schema 或 validation 行为。
- `.lcproj` package prototype 读取 `project.json`，如果实现。

### 12.2 Integration Tests

必须覆盖：

- sample project -> engine export -> importer example 能读取关键实体。
- CLI validate 在 CI 模式下对 invalid project 返回非 0。
- Desktop export adapter 可以保存 engine JSON。

### 12.3 Architecture Tests

更新 `scripts/check-architecture.mjs`：

```text
packages/core                 -> schema only
packages/schema               -> no app/UI/workbench/exporter dependency
packages/exporters            -> schema only, or schema + stable report/export model helpers
packages/workbench            -> schema/core/rulesets/exporters
packages/editor-ui            -> schema/workbench/React only
packages/collaboration-*      -> experimental; no package may depend on it
apps/cli                      -> schema/core/rulesets/exporters
apps/desktop                  -> editor-ui/workbench/Tauri
examples/unity-importer       -> no dependency back into packages except generated JSON contract docs
examples/godot-importer       -> no dependency back into packages except generated JSON contract docs
```

## 13. 实施轮次

### 轮次 1：Engine Export Contract

任务：

- 新增 engine export DTO。
- 新增 exporter 纯函数。
- 添加 golden tests。
- CLI 增加 `export` 命令。

验收：

- sample project 可导出 engine JSON。
- 导出结果稳定排序。
- 不包含 UI 状态。

### 轮次 2：Unity / Godot Importer 示例

任务：

- 添加 Unity importer 示例。
- 添加 Godot importer 示例。
- 每个示例读取同一份 engine export JSON。
- 文档说明如何映射 Space/Gate/Token。

验收：

- 示例能定位至少 Space、Gate、Token。
- 示例不修改项目文件。

### 轮次 3：CI 模式

任务：

- 固化 CLI exit code。
- 增加 strict validation tests。
- 增加 GitHub Actions example。
- 增加 JSON report artifact 示例。

验收：

- invalid project 在 strict mode 下返回 1。
- parse/schema/IO 错误返回 2。
- CI 示例只解析 JSON，不解析 text。

### 轮次 4：Review Data

任务：

- 新增 ReviewThread / ReviewComment schema。
- 新增 workbench commands/selectors。
- 新增 Review Panel。
- 支持针对实体打开 thread。

验收：

- 评论可保存到项目。
- 评论 target 使用 EntityRef。
- undo/redo 可用。

### 轮次 5：`.lcproj` Package Prototype

任务：

- 设计包结构。
- 实现读取 `project.json` 的原型。
- 导出 report/export artifact 到 package 子目录。
- 记录迁移风险。

验收：

- `.lcproj.json` 主路径不破。
- `.lcproj/` 目录原型可打开。
- cache/exports/reports 不成为 canonical truth。

### 轮次 6：Collaboration Prototype

任务：

- 新建实验 adapter。
- Command -> Yjs update。
- Yjs update -> Command 或 ProjectGraph patch。
- 两客户端编辑同一小项目的测试。

验收：

- 原型可证明方向。
- 主 desktop 不依赖 Yjs。
- core/schema/workbench 不强制依赖协作层。

### 轮次 7：收口与验收

任务：

- 完整 Validate / Smoke / cargo check。
- 运行 CLI export/report/validate smoke。
- 手动验证 desktop export。
- 更新 Phase 3 acceptance review。

验收：

- 引擎示例、CI、Review、Package prototype、Collaboration prototype 均达到最小闭环。
- 架构检查覆盖新增边界。
- 主项目文件仍可 diff、可迁移、可离线使用。

## 14. Phase 3 完成定义

Phase 3 完成时应满足：

- Engine export JSON 可由 CLI 和 Desktop 生成。
- Unity / Godot importer 示例能读取 export JSON 并定位 Space/Gate/Token。
- CLI strict mode 退出码稳定并有测试。
- GitHub Actions example 可用。
- ReviewThread / ReviewComment 可保存、显示、编辑、resolve。
- `.lcproj` package prototype 有文档和最小读取实现。
- Collaboration prototype 完成，但不进入主路径。
- `Validate.cmd`、`Smoke.cmd`、`cargo check` 通过。
- Architecture check 覆盖新增 packages/examples/experiments 边界。
- `ProjectGraph` 未混入 Unity/Godot/Yjs/React Flow/UI 临时状态。

## 15. 架构红线

以下任意一条出现，Phase 3 不应验收通过：

- core 依赖 exporters、workbench、editor-ui、desktop、CLI、Yjs、Unity、Godot。
- schema 依赖任何运行时包。
- exporters 读取或写入文件。
- exporters 重新实现 validation。
- desktop 生成 engine export 内容。
- CLI 复制 core 验证规则。
- Unity/Godot 示例要求修改 ProjectGraph 以适配引擎。
- Yjs 成为主 WorkbenchStore 的必需依赖。
- `.lcproj` package 中 exports/reports/cache 被当成项目真相。
- Review comment target 使用 DOM/React Flow ID，而不是 EntityRef。
- UI 直接解析 JSON report 来驱动核心状态。

## 16. 给开发 AI 的最短执行提示

```text
Phase 3 是生产接入，不是架构重写。

Engine export 是派生物。
CI 调 CLI，CLI 调 core。
Review 是结构化 EntityRef 数据。
.lcproj package 只有 project.json 是真相。
Collaboration 是实验 adapter，不是主状态。
Unity/Godot 示例只能消费导出 JSON。

不要把外部系统的方便，换成内部架构的污染。
```

如果需要新增字段，请先问：

1. 这是 ProjectGraph 的领域真相，还是某个导出/评审/协作视图的派生数据？
2. 它能否被 schema 迁移？
3. 它是否会迫使 core 或 UI 依赖外部系统？
4. 它是否能被稳定测试？

只有四个答案都清楚，才允许进入主路径。
