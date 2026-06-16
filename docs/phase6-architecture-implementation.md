# Phase 6 架构与实施说明

日期：2026-06-16
项目：Labyrinth Composer
目标阶段：Phase 6 - Collaboration Productization Decision 与会话协作边界
前置状态：Phase 5 Fix 已通过，RC gate 本地与远端均通过。

## 1. Phase 6 目标

Phase 6 的目标不是直接发布多人协作，而是把 Phase 3/5 留下的 collaboration prototype 推进到可决策、可审计、可隔离的产品化候选状态。

本阶段必须回答：

1. Labyrinth Composer 是否真的需要实时多人协作进入主产品路径？
2. 如果需要，协作状态如何保持为 session state，而不是污染 `ProjectGraph`？
3. Yjs/provider/presence/conflict UI 如何被约束在 adapter 和 host 层？
4. Workbench 的 Command Bus 是否足够稳定，可以作为协作事件的唯一写入入口？
5. 如果本阶段只保留实验，后续开发如何避免把实验代码偷偷接入主路径？

Phase 6 应完成：

- 修正 Phase 5 验收中发现的 collaboration decision gate 语义风险。
- 明确 presence、cursor、peer id、provider state、connection status、retry queue 都不能写入 `ProjectGraph`。
- 建立 session collaboration contract：协作只能通过可序列化 command/event 进入项目编辑流程。
- 固化 conflict semantics 和 deterministic replay 规则。
- 让 collaboration package 或 prototype 成为单向 adapter：它可以消费 workbench command contract，但 workbench/schema/core/editor-ui 不反向依赖它。
- 如需 UI，只允许 feature-flagged lab 或 explicit opt-in host path，不得默认加载 provider。
- 增加 architecture guard，阻止 `yjs`、collaboration provider、presence state 进入主包。
- 输出产品化决策文档：继续实验、进入 Phase 7 产品化，或明确延期。

一句话原则：

```text
Collaboration is a session adapter over commands, not a new project truth.
Presence is ephemeral, provider state is host state, and ProjectGraph remains portable domain data.
```

## 2. Phase 6 非目标

本阶段不应做：

- 默认启用多人协作。
- 引入真实服务器、账号系统、权限系统或云同步。
- 把 `Y.Doc`、provider state、presence、remote cursor 写入 `ProjectGraph`。
- 让 `packages/workbench`、`packages/schema`、`packages/core` 依赖 `yjs` 或 collaboration package。
- 为协作重写 Command Bus、validation、report、export 逻辑。
- 把协作日志、同步队列、连接状态写入 `.lcproj/project.json`。
- 为了演示把 feature flag 写成默认开启。
- 把协作当作 release gate 的前置条件。

如果团队要进入真实多人产品化，应另开 Phase 7 或 release-collaboration 阶段，并明确 provider、身份、权限、隐私、回滚和离线策略。

## 3. 必须优先修正的建议项

Phase 5 复验时发现一个非阻塞但必须在 Phase 6 处理的语义风险：

当前 `packages/collaboration-prototype/src/decisionGate.ts` 中的 `canEnableCollaborationByDefault` 需要 `mayPersistPresenceInProjectGraph` 为 `true` 才会返回 true。

这会给未来开发者一个错误暗示：想产品化协作，就要允许 presence 进入 `ProjectGraph`。

Phase 6 第一轮必须修正这个语义。

推荐方向：

```ts
export type CollaborationPresencePolicy = 'session-only';

export type CollaborationDecisionGate = {
  status: 'experiment-only' | 'candidate-session-collaboration' | 'accepted-for-productization';
  decisionRecordPath: string;
  prototypePackage: '@labyrinth/collaboration-prototype';
  mayLoadInMainDesktop: boolean;
  workbenchRemainsCollaborationFree: boolean;
  presencePolicy: CollaborationPresencePolicy;
  providerStatePolicy: 'host-session-only';
  projectGraphStoresPresence: false;
  requiredBeforeProductization: string[];
};
```

或者更小的改法：

- 删除 `mayPersistPresenceInProjectGraph`。
- 增加 `mustKeepPresenceOutOfProjectGraph: true`。
- `canEnableCollaborationByDefault` 必须检查 presence 被禁止持久化，而不是检查它可以持久化。
- 补测试：即使 status 是 `accepted-for-productization`，只要尝试允许 ProjectGraph 存 presence，就必须失败。

验收标准：

- 任何让 `ProjectGraph` 存 presence 的 gate 配置都无法通过测试。
- 决策文档明确 presence/session/provider state 的位置。
- architecture check 继续阻止主路径依赖 `yjs` 或 collaboration package。

## 4. 核心架构原则

### 4.1 ProjectGraph 仍是单人可重放的项目真相

`ProjectGraph` 只能保存领域数据：

- spaces
- connections
- gates
- tokens
- puzzles
- beats
- rule presets / overrides
- diagnostic exceptions
- review threads
- portable asset refs

不允许保存：

- peer id
- user session id
- cursor
- selection
- viewport
- online/offline state
- provider URL
- retry queue
- Yjs update
- CRDT metadata
- sync clock
- local absolute path

### 4.2 协作只能消费 Command Bus，不得绕过它

协作事件进入项目的唯一方式应是现有 command contract。

允许：

- append command record
- replay command record
- reject invalid command
- attach actor/timestamp to session event
- map remote command to existing `applyCommand`

禁止：

- remote update 直接 patch `ProjectGraph`
- provider 直接调用 validation internals
- collaboration adapter 重新实现 command handlers
- collaboration adapter 保存一份新的 canonical project graph
- UI 组件直接解析 Yjs document

### 4.3 Workbench 不感知 provider

`packages/workbench` 应保持单机、同步、确定性。

允许 workbench 提供：

- command type exports
- command replay helper
- deterministic snapshot tests
- command rejection diagnostics

禁止 workbench 依赖：

- `yjs`
- websocket provider
- browser storage
- Tauri
- DOM
- auth/session sdk
- collaboration package

### 4.4 Collaboration package 是 adapter，不是核心

Phase 6 可以继续使用 `packages/collaboration-prototype`，也可以新建 `packages/collaboration-session`，但必须保持单向依赖。

推荐依赖方向：

```text
schema/core/rulesets/exporters/workbench/editor-ui
  do not import collaboration

collaboration adapter
  may import schema types and workbench command contracts

desktop lab host
  may import collaboration adapter behind explicit flag
```

如果当前 architecture check 与这个方向不一致，应先修正 guard 的意图，再接入实现。不要为了让 check 通过而复制 command type 或 duplicate domain logic。

### 4.5 Presence 只属于 session

Presence 的生命周期是会话级的。

可以存在于：

- in-memory provider state
- collaboration adapter runtime
- optional lab UI state
- transient debug log

不可以存在于：

- `ProjectGraph`
- `.lcproj/project.json`
- package manifest
- validation result
- report/export output
- review thread model

### 4.6 Conflict semantics 必须先于 UI

不要先做多人 UI，再回头补冲突规则。

Phase 6 必须先定义：

- 两人同时编辑同一实体时如何排序。
- 删除实体与远端编辑实体冲突时如何处理。
- command replay 失败时如何反馈。
- remote command 是否进入 undo/redo。
- actor attribution 是否只在 session 层展示。
- 离线重连后的 command order 如何稳定。

如果不能给出 deterministic replay 测试，就不能进入主路径 UI。

## 5. 推荐目录与文件

可新增或修改：

```text
docs/
  phase6-acceptance-review.md
  collaboration/
    phase6-productization-decision.md
    session-state-policy.md
    conflict-semantics.md

packages/collaboration-prototype/src/
  decisionGate.ts
  decisionGate.test.ts
  session/
    commandEnvelope.ts
    commandEnvelope.test.ts
    replayPolicy.ts
    replayPolicy.test.ts
    presencePolicy.ts
    presencePolicy.test.ts

apps/desktop/src/
  collaborationLab/        # optional, feature-flagged only

scripts/
  check-architecture.mjs   # update guards for phase6 boundaries
  check-docs.mjs           # add required phase6 docs if created
```

不要新增：

```text
packages/workbench/src/collaboration/
packages/schema/src/presence.ts
packages/schema/src/provider.ts
packages/core/src/collaboration/
```

除非 Phase 6 先输出新的 ADR 并证明这些目录不会承载 provider/session 状态。

## 6. 实施轮次

### 轮次 1：修正 collaboration decision gate 语义

任务：

- 修改 `packages/collaboration-prototype/src/decisionGate.ts`。
- 删除或替换 `mayPersistPresenceInProjectGraph`。
- 增加 session-only presence policy。
- 调整 `canEnableCollaborationByDefault`。
- 增加测试覆盖 accepted 状态下仍禁止 presence 持久化。
- 更新 `docs/collaboration-decision-record.md` 或新增 Phase 6 决策文档。

架构要求：

- gate 的通过条件必须强化 ProjectGraph 纯净性。
- 不能为了产品化协作而放松红线。
- gate 测试应表达：presence 永远不是 project truth。

验收：

- `pnpm test` 通过。
- `architecture:check` 通过。
- 文档明确：协作产品化不等于 ProjectGraph CRDT 化。

### 轮次 2：建立 session command envelope

任务：

- 定义协作命令包络，例如 `CollaborationCommandEnvelope`。
- 字段应包含 session-local metadata：id、actorId、createdAt、command。
- 明确 metadata 不进入 `ProjectGraph`。
- 为 command envelope 增加 clone/serialize/parse 测试。
- 确保 command 仍由 workbench command handler 应用。

推荐形态：

```ts
export type CollaborationCommandEnvelope = {
  id: string;
  actorId?: string;
  createdAt?: string;
  command: Command;
};
```

架构要求：

- envelope 是 session event，不是 schema project field。
- command 的领域语义仍归 workbench。
- adapter 不复制 command handler。

验收：

- envelope 可以 JSON serialize。
- envelope replay 后 ProjectGraph 与单机 command replay 一致。
- actorId 缺失不影响项目编辑。

### 轮次 3：定义 conflict semantics 与 deterministic replay

任务：

- 输出 `docs/collaboration/conflict-semantics.md`。
- 增加测试覆盖同一实体并发编辑。
- 增加测试覆盖删除实体后远端编辑。
- 增加测试覆盖 command replay 失败。
- 决定 remote command 是否进入 undo/redo，先文档化，再实现。

推荐策略：

- 最小阶段采用 append-only command log。
- 顺序由 provider delivery order + deterministic tie-breaker 决定。
- 删除后编辑已删除实体应产生 session-level rejection，不应 silent recreate。
- replay failure 只影响该 command，不应破坏本地 project。

架构要求：

- conflict handling 不得写入 validation rules。
- validation 仍只验证 resulting ProjectGraph。
- session rejection 可以进入 session log，但不进入 project file。

验收：

- 同一 command log 重放结果稳定。
- 冲突 command 有可解释 rejection。
- validation 不读取 session log。

### 轮次 4：抽象 provider adapter，继续保持实验隔离

任务：

- 定义 provider-neutral adapter interface。
- 保留 Yjs 作为一个实现或继续只在 prototype 中使用。
- 不要让 desktop 默认加载 provider。
- 不要把 provider URL 或 auth token 写进 project/package。
- 如果需要 provider config，只能存 app-local preferences 或环境变量，并且默认关闭。

推荐接口：

```ts
export type CollaborationProviderAdapter = {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  publish(envelope: CollaborationCommandEnvelope): Promise<void>;
  subscribe(listener: (envelope: CollaborationCommandEnvelope) => void): () => void;
};
```

架构要求：

- provider adapter 不在 schema/core/workbench 中出现。
- provider adapter 不拥有 ProjectGraph。
- provider adapter 不决定 validation result。

验收：

- fake provider 单测通过。
- Yjs provider 或 prototype 测试仍在 collaboration package 内。
- architecture check 阻止主包 import provider。

### 轮次 5：可选 Collaboration Lab UI

任务：

- 如需 UI，只做 lab entry 或 feature flag。
- Lab UI 只展示 session status、remote command log、presence preview。
- 默认桌面主路径不加载 provider。
- 不把 lab UI 状态写入 project save。
- UI 文案保持工具型、低干扰，不做营销页面。

架构要求：

- `AppShell` 不应默认依赖 collaboration adapter。
- 如果必须接入 desktop，应通过 host adapter 和 explicit flag。
- editor-ui 可接收纯 view model，但不能 import provider/Yjs。

验收：

- 未启用 flag 时 bundle/path 不执行 provider connect。
- 启用 lab 时仍通过保存/打开/验证/导出主流程。
- ProjectGraph serialize 后无 session/presence 字段。

### 轮次 6：隐私、日志与本地状态策略

任务：

- 输出 `docs/collaboration/session-state-policy.md`。
- 定义哪些协作数据可记录到 app-local log。
- 明确日志默认策略和清理策略。
- provider URL、room id、actor display name 等敏感字段不得进入 `.lcproj`。
- 如果出现 telemetry 或 usage log，必须默认关闭。

架构要求：

- app-local state 仍留在 `apps/desktop` / Tauri host。
- collaboration package 不直接写文件。
- log 写入能力由 host adapter 提供。

验收：

- app-local logs ignored/untracked。
- corrupted app-local collaboration settings 不影响项目打开。
- `.lcproj/project.json` 不包含本机或会话字段。

### 轮次 7：Phase 6 验收与产品化决策

任务：

- 输出 `docs/phase6-acceptance-review.md`。
- 输出或更新 `docs/collaboration/phase6-productization-decision.md`。
- 结论必须是三选一：
  - continue experiment
  - accept session-collaboration candidate for Phase 7
  - defer collaboration
- 跑完整验证链路。
- 确认远端 GitHub Actions 通过。

验收：

- `Validate.cmd` 通过。
- `Smoke.cmd` 通过。
- `ReleaseDryRun.cmd` 通过。
- `npx --yes pnpm@11.7.0 e2e` 通过。
- `cargo fmt --check --manifest-path apps/desktop/src-tauri/Cargo.toml` 通过。
- `cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml` 通过。
- GitHub Actions `Labyrinth RC Gate` 成功。
- `architecture:check` 覆盖 Phase 6 新边界。

## 7. 测试要求

### Unit Tests

必须覆盖：

- collaboration gate 默认不可启用。
- accepted 状态仍禁止 presence 写入 ProjectGraph。
- command envelope serialize/clone。
- command replay deterministic。
- conflicting commands rejection。
- provider adapter fake implementation。
- main packages 不依赖 collaboration package。

### Integration Tests

必须覆盖：

- remote command 通过 command bus 应用。
- failed remote command 不破坏本地 project。
- ProjectGraph 保存后不包含 session metadata。
- `.lcproj` package 打开时忽略 collaboration session/cache/log。
- app-local collaboration settings 损坏时恢复默认。

### E2E / Smoke

如实现 lab UI，必须覆盖：

- 默认未连接 provider。
- 显式开启 lab 后能显示 session status。
- 本地编辑和远端模拟 command 不破坏 save/open/validate/export。
- 小视口无严重 layout overflow。

如果不实现 lab UI，则 E2E 不应被强行绑定协作。

## 8. UI 设计要求

Phase 6 UI 仍保持工具型、light-only、低干扰。

允许：

- status icon 或短状态文本。
- lab panel 展示 session command log。
- opt-in 开关。
- remote actor 颜色标识。
- conflict/rejection 的可解释提示。

禁止：

- 默认显示多人协作入口抢占主工作流。
- 大面积在线状态装饰。
- presence/cursor 覆盖主画布导致编辑干扰。
- 用不可关闭的 banner 推销协作能力。
- 把 raw Yjs update 或 provider debug dump 展示给普通用户。

UI 只展示 session view model。不要让 UI 组件直接读写 provider 或 Yjs document。

## 9. Architecture Check 必须更新

Phase 6 修改后，应更新 `scripts/check-architecture.mjs`，至少守住：

```text
packages/schema                 -> no yjs, no provider, no presence/session state
packages/core                   -> no yjs, no provider, no collaboration adapter
packages/workbench              -> no yjs, no provider, no collaboration package import
packages/editor-ui              -> no yjs, no provider; pure view models only
packages/collaboration-prototype -> adapter/prototype only; no file IO; no app host deps
apps/desktop                    -> may host optional lab; default path no provider connect
apps/cli                        -> no collaboration provider
scripts/release-*               -> no collaboration/product domain logic
```

建议新增静态 guard：

- 主 package manifests 不得依赖 `yjs`。
- 主 package manifests 不得依赖 `@labyrinth/collaboration-prototype`。
- `ProjectGraph` / JSON Schema 不得出现 presence、cursor、peer、provider、room、connectionStatus 等字段。
- desktop 默认入口不得 import collaboration provider。
- examples 不得 import workspace packages。
- release scripts 不得 import domain packages。

如果确实决定新建 productized `packages/collaboration-session`，必须同步更新 guard：

- main packages 仍不能依赖它。
- desktop 只能在 explicit opt-in host path 引入。
- workbench 不反向依赖它。

## 10. Phase 6 红线

出现以下任一情况，Phase 6 不应验收通过：

- `ProjectGraph` 增加 presence/cursor/peer/provider/session 字段。
- `.lcproj/project.json` 保存 actor id、room id、provider URL、connection status。
- WorkbenchStore 默认依赖 Yjs 或 provider。
- Desktop 启动时默认连接 collaboration provider。
- editor-ui 直接 import Yjs/provider。
- validation/report/export 读取 collaboration session log。
- collaboration adapter 重新实现 command handlers。
- remote update 直接 patch ProjectGraph。
- conflict command silent fail 或 silent recreate deleted entity。
- 协作日志、cache、provider queue 被 git 跟踪。
- architecture check 未覆盖新增依赖边界。
- CI/RC gate 失败仍写 Pass 验收结论。

## 11. Phase 6 完成定义

Phase 6 完成时应满足：

- collaboration gate 语义已修正，不再暗示 presence 可进入 ProjectGraph。
- 产品化决策文档明确下一步是继续实验、进入 Phase 7，还是延期。
- command envelope 和 replay policy 有测试。
- conflict semantics 有文档和单测。
- provider adapter 仍被隔离，不污染主路径。
- 若有 lab UI，它默认关闭且不影响主流程。
- `ProjectGraph`、schema、core、workbench 保持协作无关。
- architecture check 覆盖 Phase 6 红线。
- 本地完整 gate 和远端 GitHub Actions 均通过。
- 输出 `docs/phase6-acceptance-review.md`。

## 12. 给开发 AI 的最短执行提示

```text
Phase 6 是协作产品化决策与会话边界阶段，不是直接做多人在线功能。
先修正 decisionGate 的语义风险：presence 必须 session-only，不能作为 ProjectGraph 持久化条件。
协作只能通过 command envelope 和 Command Bus 进入项目编辑；Yjs/provider/presence 只能留在 collaboration adapter 或 explicit opt-in lab host。
schema/core/workbench/editor-ui 不得依赖 collaboration package 或 yjs。
先写 conflict semantics、session state policy 和 architecture guard，再做任何 UI。
最终输出 phase6 acceptance review，并确认本地 gate 与 GitHub Actions 都通过。
```

新增字段或依赖前，先回答：

1. 这是项目真相、会话状态、宿主状态，还是生成物？
2. 它是否能离线 diff 和版本控制？
3. 它是否会把 provider/session/presence 反向写进核心模型？
4. 它是否能通过 command replay 推导，而不是成为第二份 ProjectGraph？
5. 它是否已经被 architecture check 和测试守住？

答案不清楚时，不要进入主路径。
