# Phase 4 产品化发布与真实使用闭环执行文档

日期：2026-06-17

项目：Labyrinth Composer

状态：待执行

适用对象：接手 Phase 4 的开发 AI 或开发者

## 0. 先读结论

这是归一后的 Phase 4，不是历史上的 `docs/phase4-architecture-implementation.md` 所代表的 beta hardening，也不是继续往 Phase 5 / Phase 6 / Phase 7 拆新阶段。

原始 roadmap 的 Phase 0-3 已完成。当前阶段统一叫：

```text
Phase 4: 产品化发布与真实使用闭环
```

Phase 4 的目标不是继续扩张功能，而是把已有 MVP、规则分析、生产接入、`.lcproj`、导出、个人自查备注、RC gate 和文档收束成一个单人独立游戏开发者可以真实使用的本地产品候选版本。

Phase 4 完成后，不自动进入新的 Phase 5。后续只允许三种方向：

1. `release candidate trial`：本地 RC 试用、安装包、签名和正式发布准备。
2. `product iteration`：基于真实使用反馈做一轮体验、规则、UI 打磨。
3. `new product direction review`：单独评估 AI、深度引擎插件、云同步等大方向。

## 1. 产品定位

Labyrinth Composer 是一个单人的、本地优先的空间谜题设计与验证工具，服务对象是独立游戏开发者。

后续实现必须优先服务一个人完成这些事情：

- 设计 Space / Connection / Gate / Token / Puzzle / Beat 组成的空间谜题逻辑。
- 验证可达性、依赖、回溯、提示距离和节奏问题。
- 给自己留下设计备注、自查记录和待修复点。
- 导出 Engine JSON、Markdown report、JSON report，供自己的引擎项目或个人仓库使用。
- 通过 CLI / CI 稳定复现检查结果。
- 本地保存、打开、打包 `.lcproj`，并保持文件可读、可 diff、可离线使用。

## 2. 明确不做

以下内容不属于 Phase 4，也不应通过“实验”“prototype”“候选计划”绕回主线：

- 实时多人协作。
- Collaboration Lab UI、provider、presence、cursor、room、peer、多人在线入口。
- 账号、权限、团队工作区、邀请成员、评论通知、任务分配。
- 在线团队评审流程。现有 review/comment 只能解释为个人自查备注。
- 云同步和服务端。
- AI 自动生成关卡。
- 完整 2D/3D 地图编辑器。
- 完整 Unity/Godot/Unreal 官方插件与双向同步。
- Web/PWA 产品版。
- SQLite 或数据库项目真相。
- 完整资产管理器、二进制 blob 资源库。
- telemetry / usage reporting。
- 正式签名发布、自动更新、商店/Steam/CDN 上传。
- 新大型规则域的无限扩张。

如果实现时发现某个需求会引入上述方向，必须停下并把它记录为单独的 `new product direction review` 候选，不要放进 Phase 4。

## 3. 当前基线

Phase 4 已完成的前置清理：

- `packages/collaboration-prototype` 已删除。
- Phase 6 / Phase 7 协作产品化文档已删除。
- `pnpm-lock.yaml` 不再保留 `yjs`。
- `scripts/check-docs.mjs` 不再要求协作文档。
- `scripts/check-architecture.mjs` 会阻止协作包、协作文档、provider、presence、cursor、session 字段回流。
- `docs/roadmap-status-and-next-phase.md` 和 `docs/product-scope-confirmation.md` 已作为产品口径入口。

开发前必须确认：

```powershell
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\Validate.cmd
```

当前基线要求：

- build/typecheck/test 通过。
- architecture check 通过。
- docs check 通过。
- ci workflow check 通过。

## 4. 架构原则

### 4.1 ProjectGraph 仍是唯一项目真相

允许进入 `ProjectGraph`：

- Space、Connection、Gate、Token、Puzzle、Beat。
- rulePresetId、ruleOverrides、diagnosticExceptions。
- 个人自查备注结构：reviewThreads / comments。
- 明确可迁移、可 diff、可离线审查的领域配置。

禁止进入 `ProjectGraph`：

- React Flow nodes / edges / viewport / selection。
- UI panel state、tab state、hover、focus。
- validation result、report text、engine export text。
- `.lcproj` package 中的 exports / reports / cache。
- recent files、window state、preferences、local absolute path。
- release manifest、build artifact、installer artifact。
- provider、presence、cursor、room、session、sync state。

### 4.2 Workbench 是唯一编辑入口

所有项目修改必须走：

```text
UI action -> Workbench command -> ProjectGraph update -> validation/report/export view model
```

禁止：

- UI component 直接深改 ProjectGraph。
- Desktop/Tauri adapter 修改领域数据。
- exporter 回写项目真相。
- validation worker 持有另一份项目状态。

### 4.3 Export / Report 是派生产物

Engine JSON、Markdown report、JSON report 都从 `ProjectGraph + ValidationResult + RulePreset` 派生。

要求：

- exporter 仍是纯函数。
- Desktop/CLI 只负责文件读写。
- Unity/Godot 示例只消费导出 JSON。
- exporter target 不反向定义 schema。

### 4.4 `.lcproj` 是 package，不是第二套模型

推荐结构：

```text
MyProject.lcproj/
  project.json
  exports/
  reports/
  assets/
  cache/
```

规则：

- `project.json` 是唯一 canonical project data。
- `exports/`、`reports/`、`cache/` 是可再生成 artifact。
- `assets/` 只能通过轻量 `AssetRef` 引用，不存 blob。
- 删除 `exports/`、`reports/`、`cache/` 后项目仍应能打开。
- package manifest 如存在，只能描述 package，不能优先于 `project.json`。

### 4.5 App-local state 留在宿主层

recent files、last directory、window preference、logs 只能存在于 `apps/desktop` / Tauri app-local storage。

禁止写入：

- `.lcproj/project.json`
- `.lcproj.json`
- package manifest 的 portable truth
- schema/core/workbench

## 5. 执行轮次

### 轮次 1：真实单人路径 E2E

目标：证明一个独立开发者可以从创建项目到导出交付完整跑通。

任务：

- 建立或补齐 Playwright E2E。
- 覆盖从 Dashboard 创建或打开项目。
- 选择模板或空项目，形成 10-20 节点项目。
- 编辑 Space / Connection / Gate / Token / Puzzle / Beat。
- 运行 Validate。
- 查看 Diagnostics、Rule Preset、Timeline、Report。
- 添加个人自查备注。
- 导出 Engine JSON。
- 导出 Markdown report 和 JSON report。
- 保存为 `.lcproj` 或当前稳定项目格式。
- 重新打开并确认领域数据一致。

架构要求：

- E2E 只能通过 UI 和公开宿主能力执行，不直接改 store。
- 保存/打开不能依赖 test-only mock 绕过真实路径。
- 导出和报告不能回写 ProjectGraph。

验收：

- E2E 通过。
- 保存后重新打开不丢失领域数据。
- 失败时错误状态清晰，不能误清 dirty state。

### 轮次 2：`.lcproj` 与资产引用硬化

目标：让 package 路径可以承受真实用户文件损坏和缺失场景。

任务：

- 增加损坏 `.lcproj/project.json` 的打开测试。
- 增加缺失 `exports/`、`reports/`、`cache/` 的打开测试。
- 增加损坏 generated artifact 不影响 validation 的测试。
- 增加 missing AssetRef 或未知 asset kind 的行为测试。
- 明确 package manifest 是否存在；如果存在，它只描述 package，不参与 validation truth。
- 更新 `docs/user/package-format.md` 与实际行为一致。

架构要求：

- 文件系统读写只在 CLI/Desktop adapter。
- schema 定义 contract，但不读文件。
- workbench 可以生成 package view model，但不碰文件系统。
- AssetRef 使用 package-relative path，不使用绝对路径。

验收：

- 删除 generated artifact 后项目仍能打开。
- missing asset 最多产生 warning，不导致 schema parse 崩溃。
- package format 文档可供用户理解。

### 轮次 3：导出合同与现有规则稳定

目标：冻结个人生产接入需要的导出和规则行为。

任务：

- 为 Engine JSON 增加或确认 golden fixture。
- 确认 `engine-json` export 完全兼容现有 DTO。
- 确认 Unity / Godot importer examples 消费同一 export contract。
- 确认 examples 不 import workspace packages。
- 确认 CLI `validate/report/export` JSON 输出稳定。
- 稳定 `maze.standard`、`zelda.mini-dungeon`、`horror.clinic`，不新增大型规则域。

架构要求：

- exporter 不读写文件。
- exporter 不重新计算 validation。
- target-specific DTO 不进入 ProjectGraph。
- 新规则调整不能污染 schema 或 UI。

验收：

- importer contract tests 通过。
- CLI JSON 输出有 fixture 或快照。
- `engine-json` golden test 不回归。

### 轮次 4：个人自查语义与 UI 打磨

目标：把 Review 从团队评审暗示收敛成个人 Notes / Self Review。

任务：

- 梳理 UI 中 `Review`、`Thread`、`Comment` 等可见文案。
- 将用户可见文案逐步转向 `Notes`、`Self Review` 或中文“自查/备注”语义。
- 保持 schema / command 名称可兼容，不为文案改动破坏已有项目。
- 改善 Diagnostics、Report、Export、Notes 的扫描顺序。
- 检查右侧面板信息密度。
- 检查 1440x1000 与 390x844 视口。
- 修复按钮文字溢出、面板重叠、水平 overflow。

架构要求：

- UI 组件接收 view model 和 callbacks。
- UI 不解释 ruleset 语义。
- UI 不生成 report/export 领域内容。
- 不引入团队评审、账号、通知、任务分配入口。

验收：

- Notes/Report/Export/Diagnostics 都能完成关键动作。
- 小视口无明显重叠和横向溢出。
- UI 不暗示在线团队协作。
- 视觉保持 light-only、低干扰、工具型工作台。

### 轮次 5：RC dry-run 与发布边界收口

目标：让本地候选版本可验证，但不执行真实发布。

任务：

- 确认 `ReleaseDryRun.cmd` 可重复运行。
- 确认 release artifact 位于 ignored output 目录。
- 确认生成物不被 git 跟踪。
- 确认 manifest 足够支持人工验收。
- 更新 `docs/release/rc-checklist.md` 和 `docs/release/artifact-policy.md`。

架构要求：

- release script 不读写 ProjectGraph。
- release script 不 import domain packages 重新实现逻辑。
- release script 只能调用已有 build/test/validate/e2e/package 能力。
- 不签名、不发布、不上传。

验收：

- `ReleaseDryRun.cmd` 通过。
- `artifacts/release-candidate/manifest.json` 可审查。
- git status 不包含 build/installer artifact。

### 轮次 6：Phase 4 验收文档

目标：明确 Phase 4 是否可以进入本地 RC 试用。

任务：

- 输出 `docs/phase4-productization-acceptance-review.md`。
- 记录真实单人路径 E2E 结果。
- 记录 `.lcproj` 打开/保存/损坏场景结果。
- 记录 export/report/CLI 合同稳定性。
- 记录 UI smoke 结果。
- 记录 RC dry-run 结果。
- 记录残余风险。
- 明确下一步三选一：`release candidate trial`、`product iteration`、`new product direction review`。

验收：

- 本地完整 gate 通过。
- 远端 GitHub Actions 通过。
- 验收文档可让下一个开发者判断项目是否能进入试用。

## 6. 必须运行的验证

Phase 4 验收前必须运行：

```powershell
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\Validate.cmd
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\Smoke.cmd
npx --yes pnpm@11.7.0 e2e
cargo fmt --check --manifest-path apps/desktop/src-tauri/Cargo.toml
cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\ReleaseDryRun.cmd
```

验收文档中必须记录每条命令的结果。不能在命令失败时写 Pass。

## 7. 必须更新的文档

Phase 4 执行中涉及行为变化时，必须同步更新：

- `docs/roadmap-status-and-next-phase.md`
- `docs/product-scope-confirmation.md`
- `docs/user/getting-started.md`
- `docs/user/cli-ci.md`
- `docs/user/package-format.md`
- `docs/export-targets.md`
- `docs/lcproj-package-assets.md`
- `docs/release/rc-checklist.md`
- `docs/release/artifact-policy.md`
- `docs/phase4-productization-acceptance-review.md`

如新增 canonical 文档，必须更新 `scripts/check-docs.mjs`。

## 8. 红线

出现以下任一情况，Phase 4 不应验收通过：

- 阶段编号继续扩散到 Phase 5、Phase 6、Phase 7、Phase 8。
- 实时协作、provider、presence、cursor、room、peer 回到产品主线。
- `ProjectGraph` 增加 UI/session/provider/release/generated artifact 字段。
- `.lcproj/project.json` 保存 exports/reports/cache/recent files/provider state。
- Workbench import React、Tauri、DOM、filesystem、Yjs 或 collaboration provider。
- Editor UI 重新实现 domain algorithm。
- release script 重新实现 validation/export 领域逻辑。
- Unity/Godot 示例 import workspace package。
- E2E 只覆盖 mock path，不覆盖真实用户路径。
- CI 或 RC gate 失败仍写 Pass。
- 为了 UI 文案迁移破坏旧项目兼容性。

## 9. 给开发 AI 的最短提示

```text
这是归一后的 Phase 4，不是继续拆 Phase 5/6/7。
项目定位是单人、本地优先、服务独立游戏开发者。
只收口真实单人路径、.lcproj、导出合同、现有规则包、个人自查备注、UI 打磨、RC dry-run 和验收文档。
不要做实时协作、云、账号、权限、团队工作区、在线评审、AI 生成、完整地图编辑器、完整引擎插件、Web/PWA、数据库真相、完整资产管理器、telemetry 或正式发布。
ProjectGraph 只保存领域真相；exports/reports/cache 是 artifact；preferences 是宿主状态；release 只验证不发布。
最终输出 docs/phase4-productization-acceptance-review.md，并确认本地完整 gate 与远端 GitHub Actions 都通过。
```
