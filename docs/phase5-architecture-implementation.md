# Phase 5 架构与实施说明

日期：2026-06-16
项目：Labyrinth Composer
目标阶段：Phase 5 - Release Candidate 与扩展治理
前置状态：Phase 4 已通过验收，可进入 Phase 5。

## 1. Phase 5 目标

Phase 5 的目标是把 Phase 4 的 Beta 主路径推进到 Release Candidate，并为后续真实团队使用建立受控扩展边界。

本阶段不是“加更多功能”，而是回答三个问题：

1. 这个工具能不能被稳定打包、验证、交付？
2. `.lcproj`、assets、export targets、CI、用户文档是否有可长期维护的契约？
3. 后续扩展、协作、引擎集成是否会污染 `ProjectGraph`、core、schema、workbench 的边界？

本阶段应完成：

- 将 release gate 从本地 dry-run 推进到可重复的 Release Candidate 流程。
- 让 GitHub Actions 或等价 CI 能安装浏览器、运行 validate/smoke/e2e/release dry-run。
- 明确桌面打包 artifact 的产物、命名、校验与签名占位策略。
- 把 `.lcproj` package 的 manifest/assets 策略设计清楚，必要时实现最小 AssetRef，但不把 generated artifact 变成真相。
- 建立 exporter target / integration contract 的扩展治理，不让 Unity/Godot 或未来引擎字段进入 `ProjectGraph`。
- 补齐 app-local preferences、recent files、日志等宿主状态边界，不写进项目文件。
- 对 collaboration prototype 做产品化决策门：要么继续实验，要么进入新阶段，不在 Phase 5 偷偷并入主路径。
- 输出面向开发和设计师的最小使用文档、release notes、验收文档。

Phase 5 的完成定义：

```text
项目可以产生可审查的 RC artifact；
CI/release gate 能重复运行；
项目文件和 package 仍然只有一个真相；
扩展点有契约、有测试、有 architecture guard；
协作和外部引擎集成仍然不能反向定义核心模型。
```

## 2. 最大风险

Phase 5 最大的风险是“发布压力”与“扩展欲望”一起出现。

典型错误：

- 为了发布方便，把 release/build artifact 加入 git。
- 为了 installer 或 auto-update，把真实发布动作塞进 dry-run。
- 为了 Unity/Godot 适配，把 engine-only 字段加入 ProjectGraph。
- 为了 assets 方便，把二进制文件、绝对路径、导入缓存写进 `project.json`。
- 为了 recent files，把用户本机路径写进 `.lcproj.json`。
- 为了协作演示，把 Yjs/presence 默认接入 WorkbenchStore。
- 为了插件扩展，让 plugin 直接 import core internals 或 UI component。

Phase 5 的一句话原则：

```text
Release 是流程，extensions 是 adapter，assets 是引用，collaboration 是决策门；它们都不能成为新的项目真相。
```

## 3. 核心架构原则

### 3.1 Release gate 只能验证，不发布

Phase 4 已有 `ReleaseDryRun.cmd` 和 `release:dry-run`。Phase 5 可以增强它，但默认仍是验证流程。

允许：

- 构建 desktop bundle。
- 运行 `Validate.cmd`、`Smoke.cmd`、E2E、cargo fmt/check。
- 检查 Tauri config、dist assets、ignored artifacts。
- 可选地运行 Tauri build 生成本地 unsigned artifact。
- 上传 CI artifacts 到 workflow artifact。

禁止：

- 自动发布 GitHub Release。
- 自动上传商店、Steam、网盘、CDN。
- 默认签名或使用真实证书。
- 绕过 architecture check。
- 将 `apps/desktop/dist`、`target`、installer 输出提交到 git。

如果要加入真实发布，必须新开显式 release 阶段，并要求用户确认发布目标、证书、版本号、artifact 保留策略。

### 3.2 CI 是 gate，不是开发环境替身

CI 应当复现项目验证链，不应在 workflow 里复制业务判断。

允许：

- 将 `.github/workflows/labyrinth-validate.yml.example` 提升为实际 workflow。
- 安装 Playwright browsers 或配置 `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`。
- 上传 validation/report/export artifacts。
- 上传 desktop bundle 或 installer artifact。

禁止：

- 在 YAML 中解析 text diagnostics。
- 在 YAML 中重写 reachability/ruleset 逻辑。
- 在 CI 中生成并提交文件。
- 在 PR workflow 中执行真实 release。

推荐 workflow 分层：

```text
validate:
  pnpm install
  pnpm build
  pnpm test
  pnpm architecture:check
  pnpm docs:check

e2e:
  install playwright browser
  pnpm e2e

release-dry-run:
  ReleaseDryRun.cmd equivalent on supported OS
  upload local artifacts only
```

### 3.3 `.lcproj` package 仍然只有 `project.json` 是真相

Phase 5 可以补 package manifest 和 assets，但必须区分：

- project truth：`project.json`
- package metadata：manifest
- user assets：`assets/`
- generated artifacts：`exports/`、`reports/`、`cache/`

允许：

- `package.json` 或 `manifest.json` 记录 package version、createdBy、artifact paths、asset inventory。
- `ProjectGraph` 中引入可迁移的 `AssetRef`，前提是它是领域需要，而不是缓存需要。
- `assets/` 存放用户导入的参考图、音频、文档等文件。
- `cache/` 保存 layout 或 preview cache。

禁止：

- validation 读取 `exports/`、`reports/`、`cache/`。
- migration 从 generated artifacts 恢复项目。
- AssetRef 使用绝对路径作为项目真相。
- 把 binary blob 直接塞进 `project.json`。
- 让 missing cache 阻止项目打开。
- 让 manifest 优先级高于 `project.json`。

如果实现 AssetRef，建议最小形态：

```ts
export type AssetRef = {
  id: string;
  kind: 'image' | 'audio' | 'document' | 'other';
  packagePath: string;
  label?: string;
  mimeType?: string;
};
```

注意：

- `packagePath` 必须是 package 内相对路径，例如 `assets/map-sketch.png`。
- AssetRef 是引用，不是文件内容。
- Asset validation 只检查引用格式和可选存在性，不参与 reachability/ruleset 语义。

### 3.4 Export targets 是派生产物，不是 schema 分叉

Phase 3/4 已有 stable engine JSON。Phase 5 可以建立更多 target 或 target registry，但扩展目标不能反向污染项目模型。

允许：

- 在 `packages/exporters` 中增加 target registry。
- 增加 `unity-json` / `godot-json` 这类 target-specific DTO。
- 在 `examples/` 中继续放引擎 importer。
- CLI 增加 `labyrinth export --target <id>`。

禁止：

- `ProjectGraph` 加 Unity-only 或 Godot-only 字段。
- exporter 读取/写入文件。
- exporter 重新计算 validation。
- importer 反向定义 schema。
- `packages/core` 依赖 exporter。
- `packages/schema` 依赖 exporter。

推荐接口：

```ts
export type ExportTargetId = 'engine-json' | 'unity-json' | 'godot-json';

export type ExportTarget = {
  id: ExportTargetId;
  label: string;
  extension: 'json' | 'md';
  create(project, validation, rulePreset): string;
};
```

文件写入仍在 CLI/Desktop adapter；生成仍在 exporters/workbench service。

### 3.5 App-local state 必须留在宿主层

Phase 5 可能会需要 recent files、window size、last opened path、theme choice、telemetry opt-in、logs。

这些都不是项目真相。

允许：

- `apps/desktop` 或 Tauri app data 存 recent files。
- local settings 记录 window size、last directory、E2E-only flags。
- logs 进入 app-local log directory。

禁止：

- recent files 写入 `.lcproj.json` 或 `project.json`。
- 本机绝对路径写入 package manifest 作为 portable truth。
- UI selection、viewport、panel state 进入 ProjectGraph。
- telemetry 默认开启。

如果需要 preference service，建议放在：

```text
apps/desktop/src/preferences/
apps/desktop/src-tauri/src/preferences.rs
```

不要放在 schema/core/workbench。

### 3.6 Collaboration 需要决策门

Phase 5 不默认产品化 collaboration。它必须通过明确决策门：

- 是否有真实需求？
- 是否需要 server/provider？
- presence 是否只存在于会话层？
- conflict UI 如何表达？
- 离线编辑和同步失败如何处理？
- 是否影响 project file truth？

允许：

- 输出 `docs/collaboration-decision-record.md`。
- 增强 `packages/collaboration-prototype` 的实验测试。
- 增加 feature-flagged demo，不接入主 desktop path。

禁止：

- WorkbenchStore 默认依赖 Yjs。
- ProjectGraph 直接存 Y.Doc。
- presence/cursor/user session 写入项目文件。
- desktop 默认加载 collaboration provider。

如果团队决定产品化协作，应单独开 Phase 6 或独立协作阶段，不应混在 Phase 5 release hardening 中。

## 4. 推荐目录调整

Phase 5 可按需要新增：

```text
.github/workflows/
  labyrinth-validate.yml          # 可选：从 example 提升为真实 workflow
  labyrinth-release-rc.yml         # 可选：只生成 artifact，不真实发布

docs/
  phase5-acceptance-review.md
  release/
    rc-checklist.md
    artifact-policy.md
  user/
    getting-started.md
    cli-ci.md
    package-format.md
  collaboration-decision-record.md # 可选，决策门产物

packages/schema/src/
  assets.ts                        # 可选，AssetRef contract

packages/exporters/src/
  targets/
    registry.ts                    # 可选，target registry
    unityJson.ts                   # 可选，target-specific DTO
    godotJson.ts                   # 可选，target-specific DTO

apps/desktop/src/
  preferences/                     # app-local state only

apps/desktop/src-tauri/src/
  preferences.rs                   # app-local host storage only
```

新增目录必须同步：

- `tsconfig` references 或 package exports。
- `scripts/check-architecture.mjs`。
- unit/integration/E2E tests。
- ops workflow 配置。
- docs check 必要文档。

## 5. 实施轮次

### 轮次 1：CI 与 Playwright browser 固化

任务：

- 将 CI example 提升为真实 workflow，或新增 RC workflow example。
- 在 CI 中明确安装 Playwright browsers。
- 保留 `labyrinth-validate.yml.example` 的教学价值，或迁移为 `.yml` 后更新文档。
- 上传 validation/report/export JSON artifact。
- 确保 CI 不执行真实发布。

架构要求：

- CI 只调用 repo scripts 和 CLI。
- CI 不重新实现 validation。
- CI 不提交生成文件。

验收：

- CI workflow 包含 build/test/architecture/docs/e2e。
- E2E 在无系统 Chrome 的机器上也能跑。
- Workflow artifact 包含 validation/report/export。
- PR/push workflow 不发布 release。

### 轮次 2：RC artifact 与桌面打包策略

任务：

- 增强 `release:dry-run`，可选加入 Tauri build unsigned artifact 检查。
- 定义 artifact 命名：应用名、版本、平台、commit。
- 增加 `docs/release/rc-checklist.md`。
- 增加 `docs/release/artifact-policy.md`。
- 检查 generated artifacts ignored/untracked。

架构要求：

- release scripts 不读写 ProjectGraph。
- release scripts 不调用业务 internals。
- signing/publish 只能是占位，不默认执行。

验收：

- ReleaseDryRun 在本机可重复通过。
- 如果生成 installer/portable artifact，它位于 ignored output 目录。
- artifact policy 明确哪些文件能上传，哪些不能提交。
- `git status` 干净。

### 轮次 3：Package manifest 与 AssetRef 决策

任务：

- 决定 Phase 5 是否实现 AssetRef。
- 如果实现，先更新 schema 类型、JSON Schema、migration placeholder、fixtures。
- 设计 package manifest，仅描述 package，不参与 validation truth。
- Desktop/CLI 只在宿主层读写 asset 文件。
- 增加损坏/missing asset 的打开行为测试。

架构要求：

- `assets/` 不参与 reachability/ruleset validation。
- AssetRef 使用 package-relative path。
- schema 定义 contract，但不读文件。
- workbench 可以展示 asset view model，但不拥有文件系统能力。

验收：

- `.lcproj/project.json` 仍是唯一 canonical project data。
- 删除 `exports/reports/cache` 不影响打开。
- missing asset 不导致项目 schema parse 崩溃，最多产生可解释 warning。
- AssetRef fixtures 可迁移、可 diff。

### 轮次 4：Exporter target registry

任务：

- 设计 exporter target registry。
- 保持 `engine-json` 完全兼容。
- 可选增加 Unity/Godot target-specific JSON。
- CLI 支持列出 targets 或明确错误。
- Desktop Export Panel 可以显示 target list，但不生成内容。

架构要求：

- exporters 仍是纯函数。
- Desktop/CLI 只负责文件写入。
- target-specific DTO 不进入 ProjectGraph。
- examples 仍不能 import workspace packages。

验收：

- `engine-json` golden test 不回归。
- 新 target 有 golden test。
- CLI `export --target unknown` 返回稳定错误。
- architecture check 覆盖新 target 目录。

### 轮次 5：App-local preferences 与日志

任务：

- 设计 recent files、last directory、window preference、logs 的 app-local 存储。
- 增加 preference service 或 Tauri command。
- UI 只显示 recent files，不把它们写进项目。
- 增加 reset/ignore corrupted preferences 的行为。

架构要求：

- preferences 只在 `apps/desktop` / Tauri host。
- workbench/schema/core 不依赖 preferences。
- 绝对路径不写进 portable package truth。

验收：

- corrupted preferences 不影响项目打开。
- recent files 不出现在 serialized ProjectGraph。
- preferences 相关文件不被 git 跟踪。

### 轮次 6：Collaboration 决策门

任务：

- 输出 collaboration decision record。
- 列出产品化协作的最低条件。
- 如果保留实验，明确实验目录和禁止主路径依赖。
- 可选补一个 collaboration prototype smoke，但不接入主 desktop。

架构要求：

- 不把 Yjs 引入 WorkbenchStore。
- 不把 presence 写入 project file。
- 不默认启用 provider。

验收：

- 主 desktop path 不加载 collaboration provider。
- architecture check 继续禁止主包依赖 collaboration prototype。
- 决策文档说明 Phase 6 是否需要协作阶段。

### 轮次 7：用户文档与 RC 验收

任务：

- 输出设计师 getting started。
- 输出 CLI/CI 使用文档。
- 输出 package format 文档。
- 输出 release notes draft。
- 输出 `docs/phase5-acceptance-review.md`。

验收：

- `Validate.cmd` 通过。
- `Smoke.cmd` 通过。
- `ReleaseDryRun.cmd` 通过。
- `npx --yes pnpm@11.7.0 e2e` 通过。
- `cargo fmt --check` / `cargo check` 通过。
- CI/RC artifact 流程文档可执行。
- docs check 覆盖新增必要文档。

## 6. 测试要求

### 6.1 Unit Tests

必须覆盖：

- release dry-run artifact policy。
- exporter target registry。
- unknown export target error。
- AssetRef schema / migration，如果实现。
- package manifest 不参与 validation。
- preference corruption fallback，如果实现。
- collaboration prototype 不进入主包依赖。

### 6.2 Integration Tests

必须覆盖：

- `.lcproj` package + assets + generated artifacts 的打开/保存行为。
- CLI export 多 target。
- CI artifact JSON 结构。
- Desktop package save 后仍只有 `project.json` 作为项目 truth。

### 6.3 E2E / Smoke

应扩展现有 E2E：

- 打开或另存 `.lcproj` package。
- Export target 选择。
- Recent file UI，如果实现。
- Favicon/console noise 清理。
- 小视口 smoke 保持无水平 overflow。

## 7. UI 设计要求

Phase 5 UI 仍保持工具型、light-only、低干扰。

允许：

- 增加 Export target selector。
- 增加 Recent Projects 入口。
- 增加 RC/release 状态只读提示。
- 增加 asset list 或 attachment panel，如果 AssetRef 进入 schema。

禁止：

- 把 release/CI 状态做成占主屏的营销面板。
- 在 UI 中展示大段 raw JSON。
- 把 importer-specific 控件塞进核心 Inspector。
- 用深色、渐变、玻璃拟态或多层卡片重做视觉系统。

UI 文案应短、工具化、可扫描。不要用可见说明文字替代清楚的控件设计。

## 8. Architecture Check 必须更新

如果新增 release、assets、preferences、export targets，需要更新 `scripts/check-architecture.mjs`。

目标边界：

```text
packages/schema                 -> contracts only, no runtime app dependencies
packages/core                   -> schema only
packages/rulesets               -> schema only
packages/exporters              -> schema only
packages/workbench              -> schema/core/rulesets/exporters
packages/editor-ui              -> schema/workbench/React/React Flow only
packages/collaboration-prototype -> experimental; no main package may depend on it
apps/cli                        -> schema/core/rulesets/exporters/workbench service only
apps/desktop                    -> editor-ui/workbench/Tauri/browser host/preferences
examples                        -> no workspace package import
tests/e2e                       -> Playwright only
scripts/release-*               -> build/package checks only, no domain logic
```

新增任何 dependency 前必须回答：

1. 它是否属于领域真相？
2. 它是否会让 schema/core 依赖应用层？
3. 它是否会让 export target 反向定义 ProjectGraph？
4. 它是否会让 generated artifact 参与 validation/migration？
5. 它是否能被 architecture check 自动守住？

## 9. Phase 5 红线

出现以下任一情况，Phase 5 不应验收通过：

- release 脚本执行真实发布或上传。
- build/installer artifacts 被 git 跟踪。
- `ProjectGraph` 增加 Unity/Godot-only 字段。
- `ProjectGraph` 增加本机路径、recent files、window size、selection、viewport。
- binary asset 内容进入 `project.json`。
- validation 读取 `exports/reports/cache`。
- schema/core 依赖 Tauri、React、Playwright、Yjs、Node 文件系统。
- workbench 依赖 DOM、Worker、Tauri、filesystem、preferences。
- Desktop 重新实现 validation/report/export 语义。
- exporter 读写文件或重新计算 validation。
- examples/importers 依赖 workspace package。
- Yjs/presence 默认进入主 desktop path。
- CI YAML 复制业务规则。

## 10. Phase 5 完成定义

Phase 5 完成时应满足：

- RC release gate 可重复运行，并清楚区分 dry-run 与真实发布。
- CI 能运行 validate/build/test/architecture/docs/e2e。
- Playwright browser 依赖在 CI 中明确处理。
- `.lcproj` package manifest/assets 策略清晰，且不改变唯一 truth。
- exporter targets 有 registry、测试和 CLI 错误语义。
- app-local preferences/logs 不污染项目文件。
- collaboration 有明确决策记录，不偷偷并入主路径。
- 用户文档覆盖打开项目、保存 package、CLI/CI、export、release artifact。
- `Validate.cmd`、`Smoke.cmd`、`ReleaseDryRun.cmd`、E2E、cargo fmt/check 全部通过。
- 输出 `docs/phase5-acceptance-review.md`。

## 11. 给开发 AI 的最短执行提示

```text
Phase 5 是 Release Candidate 与扩展治理，不是功能膨胀。
把 CI、RC artifact、package manifest/assets、export target registry、app-local preferences、collaboration decision record 做成受控边界。
ProjectGraph 仍然只保存领域真相；release 只验证不发布；assets 是引用不是 blob；export targets 是派生物；preferences 是宿主状态；collaboration 仍需决策门。
新增能力前先更新边界和测试，再接 UI。
```

如果想新增字段、目录或依赖，先问：

1. 这是项目真相、package metadata、generated artifact，还是 app-local state？
2. 它是否可迁移、可 diff、可离线审查？
3. 它是否可以由 ProjectGraph 派生？
4. 它是否会让外部引擎、发布系统或协作系统反向污染核心？
5. 它是否已有测试与 architecture guard？

答案不清楚时，不要进入主路径。
