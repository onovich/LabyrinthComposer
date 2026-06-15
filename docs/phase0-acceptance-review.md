# Phase 0 验收结论

日期：2026-06-16  
项目：Labyrinth Composer  
结论：可以进入 Phase 1，但建议先完成一个小型 Phase 0.5 修正，降低诊断噪声并收紧测试契约。

## 1. 总体结论

Phase 0 的核心目标已经基本达成：项目具备 TypeScript monorepo、Schema、领域核心、验证器、CLI、样例项目、测试夹具和架构边界检查。

当前可以进入 Phase 1 的 UI 工作台开发，但不建议马上把 Diagnostics Panel 建在现有诊断输出之上。进入 UI 前，应先修正诊断去噪与 fixture 精确匹配问题，否则 Phase 1 的诊断面板会把连带错误放大，影响设计师判断。

## 2. 已通过验收项

完整验证链已通过：

```text
lint ✅
typecheck ✅
build ✅
test ✅ 4 files / 15 tests
architecture:check ✅
docs:check ✅
CLI smoke ✅
```

CLI smoke 输出确认验证器可通过构建产物运行：

```text
PASS Labyrinth validation
reachable spaces: basement, maintenance, operating-theater, records-office, waiting-room
acquired tokens: basement-code, fuse, power-restored
opened gates: basement-code-gate, power-restored-gate
solved puzzles: repair-breaker
diagnostics: 0
```

`--strict` 退出码也符合契约：warning-only 项目普通输出为 PASS，但 `--strict` 会返回 `1`，可用于后续 CI 策略收紧。

## 3. 架构验收

当前架构边界总体干净：

- `packages/schema` 负责类型、JSON Schema、解析、migration 占位。
- `packages/core` 只依赖 `schema`，没有混入 CLI、UI、Node 文件系统或浏览器 API。
- `apps/cli` 只做文件读取、参数解析、格式化输出和退出码。
- `packages/test-fixtures` 只存样例项目和回归案例。
- `validateProject()` 是领域验证聚合入口。
- CLI 没有重复实现领域规则。

依赖方向符合 Phase 0 文档要求：

```text
apps/cli -> packages/core -> packages/schema
apps/cli -> packages/schema
packages/test-fixtures -> packages/schema
```

未发现会阻碍 Phase 1 的脏依赖或核心/UI 耦合。

## 4. 交付物检查

Phase 0 当前交付物：

- workspace 与包管理配置已存在。
- `packages/schema` 已有 v0 类型、JSON Schema、parse API、migration 占位。
- `packages/core` 已有可达性验证、依赖检查、deadlock、missing input、backtracking warning 等核心诊断。
- `apps/cli` 已提供 `labyrinth validate`。
- `packages/test-fixtures` 有 3 个 sample。
- `packages/test-fixtures/cases` 有 17 个 case。
- 总项目夹具数量为 20 个，达到 Phase 0 下限。
- ops workflow 已配置真实命令：lint、typecheck、build、test、architecture check、docs check、CLI smoke。

## 5. 主要问题

### P1：Fixture 测试没有锁住“不能多报”

位置：

- [packages/core/src/fixture-validation.test.ts](D:/LabProjects/LabyrinthComposer/packages/core/src/fixture-validation.test.ts:79)
- [packages/core/src/validation/validateProject.ts](D:/LabProjects/LabyrinthComposer/packages/core/src/validation/validateProject.ts:17)

当前 fixture 测试只断言 expected diagnostics “存在”，没有断言“没有额外诊断”。

额外严格对比发现 5 个 case 会多报连带诊断：

- `dependency.circular-token-requirement/gate-token-behind-gate.lcproj.json`
- `dependency.circular-token-requirement/puzzle-self-output.lcproj.json`
- `reachability.token-locked-behind-own-gate/key-behind-own-gate.lcproj.json`
- `reference.missing-entity/missing-gate.lcproj.json`
- `reference.missing-entity/missing-token-required-by-gate.lcproj.json`

典型表现：

- missing reference 后又报 `reachability.target-unreachable`。
- token locked behind own gate 同时又报 circular dependency 和 target unreachable。
- puzzle self-output cycle 同时又报 missing input warning。

这不是架构污染，但会影响 Phase 1 的 Diagnostics Panel。用户会看到一串次生错误，首因不够清楚。

## 6. Phase 0.5 修正建议

进入 Phase 1 UI 前，建议先完成以下小修：

1. 让 fixture 测试精确匹配诊断集合，至少完整匹配 `ruleId`、`severity`、`affectedEntities`。
2. 设计诊断去噪策略：
   - reference / anchor error 出现时，是否抑制 reachability 次生错误；
   - 或给诊断增加 `primary` / `secondary`；
   - 或增加 `causedBy` / `suppressedBy` 关系。
3. 将当前 5 个 strict mismatch 变成明确、稳定、可解释的 expected 输出。
4. 再次运行完整验证链：

```powershell
npx --yes pnpm@11.7.0 lint
npx --yes pnpm@11.7.0 typecheck
npx --yes pnpm@11.7.0 build
npx --yes pnpm@11.7.0 test
npx --yes pnpm@11.7.0 architecture:check
npx --yes pnpm@11.7.0 docs:check
npx --yes pnpm@11.7.0 smoke:cli
```

## 7. 是否进入 Phase 1

结论：有条件放行。

可以开始 Phase 1 的工程准备，例如 UI 技术选型、Tauri/React 工作台骨架设计、视图结构设计、设计 token 规划。

但在正式实现 Diagnostics Panel、图上高亮、错误定位和修复建议交互之前，应先完成 Phase 0.5 的诊断去噪与测试契约修正。

## 8. 给 Phase 1 的架构提醒

Phase 1 UI 应只调用 `packages/core` 的验证 API，不要在 UI 内重新推断可达性、死锁或依赖规则。

建议 Phase 1 保持以下边界：

- UI 可以维护 selection、viewport、panel state、temporary draft。
- UI 不应成为第二份 ProjectGraph 真相。
- 所有项目变更应逐步收敛到 Command Bus。
- Diagnostics Panel 只渲染 `Diagnostic`，不要解析 message 文本来判断规则。
- 图上高亮应使用 `affectedEntities` 和 `causeChain`。
- 保存/打开应继续以 `.lcproj.json` 为 canonical source of truth。

Phase 0 的地基是稳的；修掉诊断噪声后，Phase 1 可以比较放心地往工作台体验上推进。
