# Roadmap Status And Next Phase Plan

日期：2026-06-17

项目：Labyrinth Composer

状态：路线归一、产品定位修正、下一阶段交接文档

## 0. 产品定位

Labyrinth Composer 是一个单人的、本地优先的空间谜题设计与验证工具，服务对象是独立游戏开发者。

它不是团队协作平台，不是云服务，不是账号/权限系统，也不是完整地图编辑器。

后续功能必须优先服务一个人完成这些事情：

- 设计 Space / Connection / Gate / Token / Puzzle / Beat 组成的空间谜题逻辑。
- 验证可达性、依赖、回溯、提示距离和节奏问题。
- 给自己留下设计备注、自查记录和待修复点。
- 导出 Engine JSON、Markdown/JSON report，供自己的引擎项目或个人仓库使用。
- 通过 CLI / CI 稳定复现检查结果。
- 本地保存、打开、打包 `.lcproj`，并保持文件可读、可 diff、可离线使用。

## 1. 当前真实进度

最初主线 roadmap 只有 Phase 0 到 Phase 3。它们已经完成：

```text
Phase 0: 领域内核原型                  已完成
Phase 1: 本地 MVP 工作台                已完成，含 Phase 1.5 可用性修补
Phase 2: 专业规则包与体验分析           已完成
Phase 3: 生产接入与个人自查准备         已完成
Phase 4: 产品化发布与真实使用闭环        下一阶段
```

历史上的 Phase 4 / Phase 5 是 Phase 3 之后的 beta hardening 与 RC gate，已经完成并保留为验收证据。历史上的 Phase 6 / Phase 7 来自对实时多人协作方向的误拆分；该方向已取消，相关代码和协作文档不再作为产品计划保留。

后续不再继续创建 Phase 8、Phase 9，也不把“多做一个治理主题”包装成新的主线 phase。下一阶段统一叫：

```text
Phase 4: 产品化发布与真实使用闭环
```

## 2. 已移除的不合适方向

以下方向不适合当前“单人独立开发者本地工具”的定位，默认不进入产品计划：

- 实时多人协作、Collaboration Lab、provider、presence、cursor、room、peer、多人在线入口。
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

仓库层面的清理原则：

- 删除 `packages/collaboration-prototype`。
- 删除 Phase 6 / Phase 7 协作产品化文档。
- 从 docs check 中移除协作文档必需项。
- 保留 architecture check 对 `yjs`、collaboration package、presence/cursor/session 字段回流主路径的禁止。

## 3. 适合当前定位的功能计划

下一阶段应把已经存在的能力收口成一个独立开发者能长期使用的本地产品。

### 3.1 真实单人使用路径

- 从模板或空项目创建一个 10-20 节点谜题项目。
- 编辑 Space、Connection、Gate、Token、Puzzle、Beat。
- 运行 Validate 并查看 Diagnostics。
- 切换规则预设并查看规则包差异。
- 查看 Timeline / pacing / hint distance / backtracking 结果。
- 添加个人自查备注，记录为什么某个谜题设计需要修改。
- 导出 Engine JSON、Markdown report、JSON report。
- 保存为 `.lcproj`，重新打开后确认项目真相一致。

### 3.2 本地项目与 `.lcproj` 稳定性

- `.lcproj/project.json` 继续作为唯一 canonical project data。
- `exports/`、`reports/`、`cache/` 只能是可再生成 artifact。
- 缺失 cache、损坏 report、缺失 generated export 不应阻止项目打开。
- `AssetRef` 如继续存在，只能是轻量引用，不管理二进制内容。
- 本机路径、recent files、window state、preferences 不写入 ProjectGraph。

### 3.3 导出与生产接入合同

- 冻结 Engine JSON 的兼容性 fixture。
- Unity / Godot 示例只消费导出 JSON，不 import workspace packages，不反向定义 schema。
- CLI `validate/report/export` 的 JSON 输出保持稳定。
- exporter 仍是纯函数，不读写文件，不重新计算 validation。

### 3.4 规则与诊断体验

- 先稳定现有 `maze.standard`、`zelda.mini-dungeon`、`horror.clinic`。
- 不新增大型规则域，除非有真实使用案例。
- 继续打磨 deterministic diagnostics 和 rule-based suggestions。
- 不做 AI 生成，不把 suggestion 变成自动关卡设计。

### 3.5 UI 与个人工作台

- 保持 light-only、低干扰、工具型桌面工作台。
- 把 Review 的产品语义收敛为 Notes / Self Review / 自查备注。
- 改善 Diagnostics、Report、Export、Notes 的扫描顺序。
- 检查 1440x1000 与 390x844 视口下无重叠、无按钮文字溢出。
- 不做营销式 hero、不做装饰性背景、不用深色重装饰或紫蓝渐变重做视觉系统。

### 3.6 RC dry-run 与文档

- `ReleaseDryRun.cmd` 只验证，不发布、不签名、不上传。
- release artifact 必须在 ignored output 目录。
- 用户文档覆盖：getting started、CLI/CI、package format、export target、RC artifact policy。
- 验收文档记录机器验证、人工 smoke、残余风险和是否可进入本地试用。

## 4. Phase 4 实施范围

### 轮次 1：路线归一与仓库清理

任务：

- 以本文作为后续开发入口。
- 删除不属于产品计划的实时协作原型和协作文档。
- 更新 docs check 与 architecture check。
- 确认 lockfile 不再保留 `yjs`。

验收：

- `packages/collaboration-prototype` 不存在。
- docs check 不再要求 Phase 6 / Phase 7 协作文档。
- main packages 不依赖 `yjs` 或 collaboration package。

### 轮次 2：真实单人路径 E2E

任务：

- 建立或补齐 Playwright E2E，覆盖创建/打开项目、编辑、验证、自查备注、导出、保存、重新打开。
- 不绕过 UI 直接改 store。
- 保存后重新打开必须验证领域数据一致。

验收：

- E2E 覆盖真实用户路径。
- export/report 不回写 ProjectGraph。
- 失败时错误状态清晰，不误清 dirty state。

### 轮次 3：`.lcproj` 与资产引用硬化

任务：

- 补齐损坏包、缺失 generated artifact、未知 AssetRef 的测试。
- 明确 package manifest 只描述 package，不参与 validation truth。
- 确认 package save 只写 canonical project data，除非用户主动导出 artifact。

验收：

- 删除 `exports/`、`reports/`、`cache/` 后项目仍能打开。
- 缺失资产最多产生 warning，不导致 schema parse 崩溃。
- package format 文档与实际行为一致。

### 轮次 4：导出合同与规则稳定

任务：

- 冻结 Engine JSON fixture。
- 确认 Unity/Godot importer 示例消费同一 export contract。
- 确认 CLI report/export 输出稳定。
- 稳定现有三类规则包，不扩张新规则域。

验收：

- importer contract tests 通过。
- CLI JSON 输出有 fixture 或快照。
- 新增规则调整不污染 ProjectGraph。

### 轮次 5：UI 打磨与个人自查语义

任务：

- 将 Review 文案和入口逐步收敛为个人 Notes / Self Review 语义。
- 改善右侧面板信息密度和扫描顺序。
- 进行桌面和小视口截图 smoke。
- 修复重叠、溢出、按钮不可读等问题。

验收：

- Notes/Report/Export/Diagnostics 都能完成关键动作。
- 视觉仍符合现有 Inscape 参考的克制工具风格。
- UI 不暗示团队评审或在线协作。

### 轮次 6：RC gate 与验收文档

任务：

- 运行完整本地 gate。
- 运行 release dry-run。
- 输出 `docs/phase4-productization-acceptance-review.md`。
- 明确下一步是本地 RC 试用、产品体验迭代，还是新的产品方向评审。

必须运行：

```powershell
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\Validate.cmd
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\Smoke.cmd
npx --yes pnpm@11.7.0 e2e
cargo fmt --check --manifest-path apps/desktop/src-tauri/Cargo.toml
cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\ReleaseDryRun.cmd
```

验收：

- 本地完整 gate 通过。
- GitHub Actions `Labyrinth RC Gate` 通过。
- 生成物不被 git 跟踪。
- 验收文档说明残余风险。

## 5. Phase 4 红线

出现以下任一情况，Phase 4 不应通过：

- 阶段编号继续扩散到 Phase 8、Phase 9。
- 实时协作、provider、presence、cursor、room、peer 回到产品主线。
- `ProjectGraph` 增加 UI/session/provider/release/generated artifact 字段。
- `.lcproj/project.json` 保存 exports/reports/cache/recent files/provider state。
- Workbench import React、Tauri、DOM、filesystem、Yjs 或 collaboration provider。
- Editor UI 重新实现 domain algorithm。
- release script 重新实现 validation/export 领域逻辑。
- Unity/Godot 示例 import workspace package。
- E2E 只覆盖 mock path，不覆盖真实用户路径。
- CI 或 RC gate 失败仍写 Pass。

## 6. 给开发 AI 的最短执行提示

```text
不要继续按 Phase 6/7/8 推进。原始 roadmap 只有 Phase 0-3，它们已经完成；下一阶段统一叫 Phase 4：产品化发布与真实使用闭环。
项目定位是单人、本地优先、服务独立游戏开发者。
下一阶段只收口真实单人路径、.lcproj、导出合同、现有规则包、个人自查备注、UI 打磨、RC dry-run 和文档。
实时协作、云、账号、权限、团队工作区、在线评审、AI 生成、完整地图编辑器、完整引擎插件、Web/PWA、数据库真相、完整资产管理器、telemetry、正式发布都不默认进入计划。
继续守住 ProjectGraph、Workbench、Editor UI、Desktop host、release artifact 的边界。
最终输出 docs/phase4-productization-acceptance-review.md，并确认本地完整 gate 与远端 Labyrinth RC Gate 都通过。
```
