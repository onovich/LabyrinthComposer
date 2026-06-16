# Product Scope Confirmation List

日期：2026-06-17

项目：Labyrinth Composer

状态：产品定位已确认，越界方向已从主计划移除

## 0. 产品定位

Labyrinth Composer 是一个单人的、本地优先的工具，服务对象是独立游戏开发者。

默认用户画像：

- 一个人设计、验证、整理和导出空间谜题逻辑。
- 项目文件可读、可 diff、可离线保存。
- 工具帮助用户自查关卡逻辑、节奏、提示和导出合同。
- 工具可以进入个人仓库和 CI，但不要求多人在线或云服务。

一句话边界：

```text
Build for a solo indie developer first. Collaboration, cloud, accounts, and team workflows are not the product.
```

## 1. 适合当前定位的功能

这些功能应进入后续计划或继续打磨：

- 空间谜题逻辑图：Space、Connection、Gate、Token、Puzzle、Beat。
- 本地打开、保存、另存为、`.lcproj` package。
- 规则验证：可达性、依赖、回溯、提示距离、gate preview、timeline pacing。
- 现有规则预设：maze、zelda、horror。
- 个人自查备注：Notes / Self Review / 本地注释。
- Engine JSON export。
- Markdown / JSON report。
- CLI validate/report/export。
- GitHub Actions / CI 示例。
- Unity / Godot importer examples。
- RC dry-run、本地 unsigned artifact 检查、release artifact policy。
- getting started、CLI/CI、package format、export targets 文档。
- 轻量 AssetRef，仅作为 package 内相对路径引用。
- app-local recent files / preferences，仅存宿主状态，不进入项目真相。

## 2. 已明确移除或取消

| 项目 | 当前结论 | 后续处理 |
| --- | --- | --- |
| 实时多人协作 / real-time collaboration | 取消，无产品计划 | 删除 prototype 和产品化文档；保留架构守卫禁止回流 |
| 协作产品化 Phase 6 / Phase 7 | 作废 | 不再作为下一阶段入口 |
| Collaboration Lab UI | 取消 | 不做 provider、presence、cursor、room、peer |
| 团队工作区 / team workspace | 取消 | 不做成员、邀请、权限、通知、在线任务分配 |
| 在线团队评审流程 | 取消 | 现有 review/comment 只解释为个人自查备注 |
| 云同步、账号、权限 | 取消默认计划 | 除非 owner 后续单独重开产品方向评审 |
| AI 自动生成关卡 | 不进入默认计划 | 保留 deterministic diagnostics 和 rule-based suggestions |
| 完整 2D/3D 地图编辑器 | 不进入默认计划 | 只做逻辑图表达 |
| 完整引擎插件与双向同步 | 不进入默认计划 | 只保留 JSON export + importer examples |
| Web/PWA 产品版 | 不进入默认计划 | 桌面优先，Vite web build 仅作为前端构建基础 |
| 数据库项目真相 | 不进入默认计划 | JSON / `.lcproj/project.json` 继续是唯一项目真相 |
| 完整资产管理器 | 不进入默认计划 | 只保留轻量 AssetRef |
| telemetry / usage reporting | 不进入默认计划 | 本地日志只用于本机排查 |
| 正式签名发布/自动更新/上传渠道 | 不进入默认计划 | 下一阶段只做 RC dry-run 和本地试用准备 |
| 新大型规则域 | 不进入默认计划 | 先稳定现有三类规则包 |

## 3. 仍需守住的高风险边界

### 3.1 Review / Comment

当前代码已有 review thread / comment 数据模型和 UI。它保留，但产品含义必须收敛为：

- 个人自查备注。
- 设计检查记录。
- 单机可保存注释。

不允许膨胀为：

- 在线 review。
- 审批流程。
- 评论通知。
- 任务分配。
- 账号权限。

后续 UI 文案应逐步从 `Review` 转向 `Notes`、`Self Review` 或中文“自查/备注”。

### 3.2 `.lcproj` 与项目真相

`ProjectGraph` / `.lcproj/project.json` 仍是唯一项目真相。

不允许写入：

- exports / reports / cache。
- recent files / local absolute path。
- window state / UI selection / viewport。
- provider / presence / cursor / session。
- release artifact。

### 3.3 Export 与引擎接入

Engine JSON、Unity/Godot target、reports 都是派生产物。

不允许：

- exporter 读写文件。
- importer 反向定义 schema。
- ProjectGraph 增加 Unity-only / Godot-only 字段。
- examples import workspace packages。

### 3.4 发布流程

Release dry-run 只能验证，不发布。

不允许：

- 自动签名。
- 自动上传 GitHub Release、商店、Steam、CDN。
- 把 build/installer artifact 提交进 git。
- 跳过 Validate / Smoke / architecture check。

## 4. 默认下一阶段口径

下一阶段只做：

- 单人独立开发者的真实用户路径闭环。
- 本地项目保存/打开可靠性。
- `.lcproj` 包边界。
- Engine JSON / report / CLI 合同稳定。
- 现有规则包稳定。
- 个人自查备注语义收敛。
- UI 工具型打磨。
- RC dry-run 和文档。
- 已取消协作方向的代码与文档清理。

不要默认做：

- 实时协作
- 云
- 账号
- 权限
- 团队工作区
- 在线评审流程
- AI 生成
- Web/PWA 产品版
- 完整引擎插件
- 完整资产管理器
- telemetry
- 正式签名发布
- 新大型规则域

## 5. 给后续开发 AI 的提示

```text
Labyrinth Composer 是单人、本地优先、服务独立游戏开发者的工具。
如果一个功能需要账号、权限、server、多人在线、通知、任务分配、云同步、provider、presence、cursor、room，它默认不属于当前产品。
如果一个功能可以解释为个人工作流，也可以解释为团队工作流，默认按个人工作流实现。
新增任何功能前先判断它是 ProjectGraph 真相、package metadata、generated artifact、app-local state，还是完全不应该进入主线。
```
