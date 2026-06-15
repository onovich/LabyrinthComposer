# Phase 0 架构与实施说明

状态：交付给开发的 Phase 0 任务文档  
日期：2026-06-15  
目标：建立可运行、可测试、可扩展的空间谜题领域内核，避免在项目最早阶段写脏架构。

## 1. Phase 0 目标

Phase 0 只做一件事：把 Labyrinth Composer 的核心领域模型和验证器立起来。

完成后，项目应具备：

- 一个 TypeScript monorepo。
- 稳定的 v0 项目数据模型与 JSON Schema。
- 纯函数形式的可达性验证器。
- CLI 验证入口。
- 3 个代表性样例项目。
- 20-30 个测试夹具。
- 可解释 Diagnostic 输出，包括 `affectedEntities`、`causeChain` 和 `suggestions`。

Phase 0 的成功标准不是界面好看，而是领域边界清楚、验证结果可信、测试夹具能稳定保护后续开发。

## 2. 明确不做

Phase 0 不做以下事项：

- 不做 Tauri 桌面壳。
- 不做 React Flow 工作台。
- 不做完整地图编辑器。
- 不接入 SQLite。
- 不做实时协作、云同步、账号、权限。
- 不做 AI 自动生成。
- 不做 Unity/Godot/Unreal 深度插件。
- 不引入 Rust/WASM。
- 不允许 UI 状态、布局状态、临时编辑状态污染领域核心。

可以保留接口位置，但不要实现重型能力。Phase 0 的架构要为后续阶段留门，而不是提前把门打开一半。

## 3. 架构原则

### 3.1 Domain Core 是唯一语义来源

`packages/core` 是空间谜题语义的唯一实现位置。它只接受规范化 Project Graph，输出验证结果、指标和诊断。

禁止：

- 在 CLI、样例加载器或未来 UI 中重复实现可达性规则。
- 在验证器内部读取文件系统。
- 在领域函数中依赖 React、Tauri、Node process、SQLite、浏览器 API。
- 在领域函数中修改传入对象。

要求：

- 所有领域函数是可测试的纯函数。
- 输入和输出都使用 `packages/schema` 导出的类型。
- 验证器输出必须可序列化。

### 3.2 Schema 是跨阶段契约

`packages/schema` 定义项目文件与内部领域对象的公共契约。

要求：

- `schemaVersion` 必须存在。
- 实体引用必须显式，例如 `EntityRef`。
- 所有 ID 使用字符串，不把数组下标当身份。
- 核心项目数据用归一化结构，不用深层嵌套地图。
- Schema 变更必须通过 migration 占位机制表达。

Phase 0 可以只有 `0.1.0` 一个版本，但目录和 API 要为后续迁移留好位置。

### 3.3 CLI 只是外壳

CLI 的职责是读取文件、调用 Schema 解析、调用 Core 验证、格式化输出、设置退出码。

禁止：

- CLI 自己推断谜题规则。
- CLI 自己修正损坏项目。
- CLI 和 Core 共享隐式全局状态。

### 3.4 Tests 先于 UI

Phase 0 的测试夹具就是项目真正的护城河。

要求：

- 每个诊断规则至少有正例和反例。
- 每个样例项目必须有预期验证结果。
- 关键算法需要覆盖空图、断连图、循环依赖、缺失 Token、合法解锁链。

## 4. 推荐仓库结构

Phase 0 建议使用 `pnpm` workspace：

```text
.
├─ package.json
├─ pnpm-workspace.yaml
├─ tsconfig.base.json
├─ vitest.config.ts
├─ apps/
│  └─ cli/
│     ├─ package.json
│     └─ src/
│        ├─ index.ts
│        ├─ commands/
│        │  └─ validate.ts
│        └─ formatters/
│           ├─ jsonFormatter.ts
│           └─ textFormatter.ts
├─ packages/
│  ├─ schema/
│  │  ├─ package.json
│  │  └─ src/
│  │     ├─ index.ts
│  │     ├─ project.ts
│  │     ├─ entities.ts
│  │     ├─ diagnostics.ts
│  │     ├─ schemaVersion.ts
│  │     ├─ jsonSchema/
│  │     │  └─ project.schema.json
│  │     └─ migrations/
│  │        └─ index.ts
│  ├─ core/
│  │  ├─ package.json
│  │  └─ src/
│  │     ├─ index.ts
│  │     ├─ graph/
│  │     │  ├─ adjacency.ts
│  │     │  ├─ references.ts
│  │     │  └─ traversal.ts
│  │     ├─ validation/
│  │     │  ├─ validateProject.ts
│  │     │  ├─ reachability.ts
│  │     │  ├─ dependencies.ts
│  │     │  ├─ diagnostics.ts
│  │     │  └─ rules.ts
│  │     └─ metrics/
│  │        └─ backtracking.ts
│  └─ test-fixtures/
│     ├─ package.json
│     ├─ samples/
│     │  ├─ zelda-mini-dungeon.lcproj.json
│     │  ├─ horror-clinic.lcproj.json
│     │  └─ narrative-knowledge-lock.lcproj.json
│     └─ cases/
│        ├─ deadlock/
│        ├─ circular-dependency/
│        ├─ missing-input/
│        └─ backtracking/
└─ docs/
   ├─ development-plan.md
   └─ phase0-architecture-implementation.md
```

Phase 0 不需要 `apps/desktop`、`apps/web`、`packages/editor-ui`。这些目录等 Phase 1 再创建。

## 5. 包职责

| 包 | 职责 | 不允许做 |
| --- | --- | --- |
| `packages/schema` | 类型、JSON Schema、版本号、迁移入口、基础解析结果类型 | 不写验证算法，不依赖 Core |
| `packages/core` | 纯领域算法、可达性、依赖检查、诊断生成、基础指标 | 不读写文件，不依赖 CLI/UI/Node |
| `packages/test-fixtures` | 样例项目、失败案例、预期输出 | 不放业务算法 |
| `apps/cli` | 文件读取、命令参数、输出格式、退出码 | 不重新实现领域规则 |

依赖方向必须保持：

```text
apps/cli -> packages/core -> packages/schema
apps/cli -> packages/schema
packages/test-fixtures -> packages/schema
```

禁止反向依赖。

## 6. v0 领域模型

Phase 0 只保留核心实体：

```ts
type ProjectGraph = {
  schemaVersion: '0.1.0'
  project: ProjectMetadata
  startSpaceId: SpaceId
  targetSpaceIds: SpaceId[]
  spaces: Record<SpaceId, Space>
  connections: Record<ConnectionId, Connection>
  gates: Record<GateId, Gate>
  tokens: Record<TokenId, Token>
  puzzles: Record<PuzzleId, Puzzle>
  beats: Record<BeatId, Beat>
  rulePresetId?: RulePresetId
}
```

核心实体建议：

- `Space`：空间、房间、区域、楼层、记忆片段。
- `Connection`：空间之间的连接，可绑定 `gateId`。
- `Gate`：门、能力门、知识门、状态门、资源门。
- `Token`：物品、能力、知识、世界状态、关系、心理状态、资源。
- `Puzzle`：把输入 Token 转换为输出 Token。
- `Beat`：体验节拍，Phase 0 只存储，不做复杂节奏验证。
- `Diagnostic`：验证器输出的一等对象。

ID 类型应使用 branded string 或明确别名，避免普通字符串到处混用：

```ts
type SpaceId = string
type GateId = string
type TokenId = string
type PuzzleId = string
type EntityKind = 'space' | 'connection' | 'gate' | 'token' | 'puzzle' | 'beat'

type EntityRef = {
  kind: EntityKind
  id: string
}
```

## 7. Diagnostic 契约

诊断不是 UI 文案，而是后续图高亮、报告导出和修复建议的结构化数据。

```ts
type DiagnosticSeverity = 'error' | 'warning' | 'info'

type Diagnostic = {
  id: string
  ruleId: string
  severity: DiagnosticSeverity
  message: string
  affectedEntities: EntityRef[]
  causeChain: CauseStep[]
  suggestions: FixSuggestion[]
}

type CauseStep = {
  entity: EntityRef
  message: string
}

type FixSuggestion = {
  kind: 'move_token' | 'add_connection' | 'remove_requirement' | 'add_hint' | 'mark_exception'
  message: string
  targetEntities: EntityRef[]
}
```

Phase 0 至少实现这些规则：

| ruleId | 类型 | 说明 |
| --- | --- | --- |
| `project.missing-start-space` | error | 起点不存在 |
| `project.missing-target-space` | error | 目标不存在 |
| `reference.missing-entity` | error | Connection/Gate/Token/Puzzle 引用不存在 |
| `reachability.target-unreachable` | error | 目标空间不可达 |
| `reachability.token-locked-behind-own-gate` | error | Token 位于自己解锁区域之后 |
| `dependency.circular-token-requirement` | error | Gate/Puzzle/Token 形成循环依赖 |
| `puzzle.missing-input` | warning/error | Puzzle 需要的 Token 永远不可获得 |
| `backtracking.long-token-return` | warning | Token 获取点到使用点距离超过阈值 |

`message` 可以简洁，但 `causeChain` 必须能解释为什么。

## 8. 可达性验证设计

Phase 0 使用单调状态 fixed-point 算法：

```text
state = {
  reachableSpaces,
  acquiredTokens,
  solvedPuzzles,
  openedGates
}

repeat:
  collect tokens located in reachable spaces
  solve puzzles whose location is reachable and requirements are met
  open gates whose requirements are met
  expand reachable spaces through ungated/open connections
until state unchanged
```

要求：

- 算法必须确定性，同样输入得到同样输出顺序。
- 不处理消耗品减少、门重新关闭、复杂敌人状态。
- Resource Gate 在 Phase 0 只做保守标记和 warning。
- 输出需要包含最终状态和每轮扩展事件，方便解释诊断。

建议输出：

```ts
type ValidationResult = {
  ok: boolean
  reachableSpaces: SpaceId[]
  acquiredTokens: TokenId[]
  openedGates: GateId[]
  solvedPuzzles: PuzzleId[]
  diagnostics: Diagnostic[]
  trace: ValidationTraceStep[]
}
```

## 9. CLI 契约

Phase 0 提供一个命令：

```powershell
pnpm labyrinth validate packages/test-fixtures/samples/horror-clinic.lcproj.json
```

可接受参数：

```text
labyrinth validate <project-file> --format text
labyrinth validate <project-file> --format json
labyrinth validate <project-file> --strict
```

退出码：

| 退出码 | 含义 |
| --- | --- |
| `0` | 无 error 级诊断 |
| `1` | 存在 error 级诊断 |
| `2` | 文件读取、JSON 解析、Schema 校验失败 |

CLI JSON 输出必须直接使用 `ValidationResult`，不要为了显示方便改变字段含义。

## 10. 测试策略

Phase 0 至少包含：

- Schema parse tests。
- Reference integrity tests。
- Reachability pass/fail tests。
- Deadlock tests。
- Circular dependency tests。
- Missing input tests。
- Backtracking metric tests。
- CLI smoke tests。

建议测试命令：

```powershell
pnpm test
pnpm typecheck
pnpm lint
pnpm build
pnpm labyrinth validate packages/test-fixtures/samples/horror-clinic.lcproj.json
```

测试夹具命名规则：

```text
cases/<rule-id>/<case-name>.lcproj.json
cases/<rule-id>/<case-name>.expected.json
```

每个 `expected.json` 至少断言：

- `ok`
- `diagnostics[].ruleId`
- `diagnostics[].severity`
- `diagnostics[].affectedEntities`

不要只 snapshot 整个输出。整段 snapshot 容易让无意义文本变化掩盖结构问题。

## 11. 实施顺序

建议拆成 5 轮开发：

### 轮次 1：工程骨架

- 建立 `pnpm` workspace。
- 配置 TypeScript、Vitest、ESLint、Prettier 或等价格式工具。
- 创建 `packages/schema`、`packages/core`、`packages/test-fixtures`、`apps/cli`。
- 写空导出和最小 smoke test。

验收：`pnpm test`、`pnpm typecheck`、`pnpm build` 可以运行。

### 轮次 2：Schema 与样例

- 实现 v0 类型。
- 写 JSON Schema。
- 添加 3 个样例项目。
- 实现 Schema parse / reference integrity。

验收：样例项目能通过 Schema 校验；故意破坏引用会产生结构化错误。

### 轮次 3：可达性验证器

- 实现 fixed-point reachability。
- 输出 `ValidationResult` 和 trace。
- 实现 target unreachable、missing start/target、missing reference。

验收：基础可通关/不可通关夹具稳定通过。

### 轮次 4：核心诊断

- 实现 deadlock、circular dependency、missing input。
- 建立 causeChain 和 suggestions。
- 添加 20-30 个测试夹具。

验收：每条核心规则都有正例和反例；诊断能指向实体。

### 轮次 5：CLI 与文档

- 实现 `labyrinth validate`。
- 支持 text/json 输出和退出码。
- 补充开发 README 或 docs。
- 将项目 ops workflow 配置更新为真实 test/typecheck/build 命令。

验收：CLI 能用于本地和 CI；Phase 1 可直接复用 Core。

## 12. 架构红线

以下情况必须退回重做：

- `packages/core` 依赖了 `apps/cli`、React、Tauri、Node 文件系统或浏览器 API。
- 验证器函数直接修改输入 ProjectGraph。
- 同一条规则在 Core 和 CLI/UI 中各实现一次。
- Diagnostic 只有字符串，没有 `affectedEntities` 和 `causeChain`。
- ProjectGraph 使用数组下标作为实体身份。
- 测试只覆盖成功案例，不覆盖失败原因。
- Phase 0 为了临时方便加入 SQLite、云端、协作或 UI 状态。
- 样例项目无法作为回归测试长期保留。

## 13. Phase 0 完成定义

Phase 0 完成时，应满足：

- 仓库可一键安装、构建、测试。
- `packages/schema` 提供稳定 v0 类型和 JSON Schema。
- `packages/core` 提供纯函数验证 API。
- `apps/cli` 可以验证 `.lcproj.json` 文件。
- 至少 3 个样例项目可运行。
- 至少 20 个测试夹具覆盖核心失败模式。
- 所有 error 级诊断都有 affected entities、cause chain 和修复建议。
- 后续 Phase 1 UI 可以只调用 Core，不需要重写领域规则。

## 14. 给开发者的最终提醒

Phase 0 的价值是把“正确性”做硬，把“边界”做清。不要急着做界面，不要为了 demo 把业务判断写进 CLI 或样例加载器。只要 Core、Schema、Fixtures 站稳，Phase 1 的工作台就会自然长出来；如果 Phase 0 把领域层写脏，后面每一个视图都会开始复制规则，项目会很快失控。
