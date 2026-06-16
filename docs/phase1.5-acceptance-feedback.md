# Phase 1.5 验收反馈文档

日期：2026-06-16  
项目：Labyrinth Composer  
结论：Phase 1.5 暂不建议直接通过。当前 UI/UX 和工作台可用性已明显改善，但真实桌面文件打开/保存能力仍未完成，这是 Phase 1.5 完成定义中的 P1 阻塞项。

## 1. 总体验收结论

Phase 1.5 已经把 Phase 1 的“架构原型”推进到了更接近可用 MVP 工作台的状态：

- Dashboard 已实现，用户不再直接进入空白画布。
- 模板入口已实现，当前有 7 个模板。
- Inspector 已补齐 Space、Connection、Gate、Token、Puzzle、Beat 的编辑入口。
- Graph Canvas 已能表达 Space、Token、Puzzle，Connection 以边呈现。
- Diagnostics 已移动到底部 Validation Panel，右侧 Inspector 不再被诊断内容挤占。
- 桌面宽屏与 390px 窄屏抽查均无横向溢出。
- 工程验证链全绿。

但 Phase 1.5 的完成定义要求“可以打开和保存真实本地 `.lcproj.json`”。当前实现仍然是 sample/demo adapter，未接入 Tauri 文件命令，因此不能判定 Phase 1.5 完整通过。

建议状态：

```text
Phase 1.5: 有条件未通过
是否进入 Phase 2: 暂不建议
建议动作: 先完成 Phase 1.5 Fix，再复验
```

## 2. 机器验收结果

本次验收运行了项目既有 workflow wrapper：

```text
EnvCheck.cmd
Validate.cmd
Smoke.cmd
StartDevServer.cmd / StopDevServer.cmd
```

结果：

```text
EnvCheck passed
Validate passed
Smoke passed
git status clean
```

Validate 覆盖：

- lint passed
- typecheck passed
- build passed
- test passed：9 files / 30 tests
- architecture:check passed
- docs:check passed

Smoke 覆盖：

- smoke:cli passed
- smoke:desktop passed

非阻塞警告：

```text
Vite warns that one JS chunk is larger than 500 kB after minification.
```

该警告不阻塞 Phase 1.5，但后续 UI 继续增长时建议考虑 code splitting 或手动 chunk。

## 3. 实际 UI 抽查结果

使用本地 Vite dev server 与 Playwright 抽查：

桌面视口：1440 x 960

- Dashboard 可以正常进入。
- Dashboard 模板数量为 7。
- “Open sample project” 可见。
- 选择 “Horror Puzzle” 后进入工作台。
- 工作台无横向溢出。
- Graph 中可见 9 个节点：
  - 5 个 Space 节点
  - 3 个 Token 节点
  - 1 个 Puzzle 节点
- Diagnostics 数量为 0。
- Inspector / Validation Panel / Graph 区域布局稳定。

窄屏视口：390 x 844

- Dashboard 无横向溢出。
- 工作台无横向溢出。
- 页面允许纵向滚动，这符合窄屏下工具型界面的基本预期。
- 右侧 Inspector 与底部 Validation Panel 在窄屏下变为纵向排列。

交互抽查：

- 从 Dashboard 进入 Start Blank。
- 创建 Puzzle 后，画布出现 Start、Token、Puzzle 节点。
- Puzzle Inspector 可编辑 required tokens / output tokens 等字段。

备注：当前新建 Puzzle 默认使用同一个 token 作为 input 与 output，校验器不会报错。该行为不阻塞 Phase 1.5，但从设计体验上看，后续可以改成更明确的“待配置”状态，避免用户误以为已经设计出有效谜题循环。

## 4. 阻塞项

### P1：真实桌面文件打开/保存仍未实现

位置：

- `apps/desktop/src/bootstrap/createDesktopAdapters.ts`
- `apps/desktop/src-tauri/src/main.rs`

当前问题：

- `openText()` 固定返回内置 `horror-clinic` sample。
- `saveText()` 只返回目标路径，没有写入磁盘。
- `saveTextAs()` 使用 browser Blob download fallback。
- `src-tauri` 没有注册 open/save/save-as command。

影响：

- 用户不能打开真实本地 `.lcproj.json`。
- 用户不能保存当前项目到原路径。
- 用户不能另存为真实本地文件。
- 保存后重新打开并通过 schema parse 的闭环无法成立。
- 不满足 Phase 1.5 完成定义。

修复要求：

- 在 Tauri 层实现受控 open project file command。
- 在 Tauri 层实现 save project command。
- 在 Tauri 层实现 save project as command。
- 文件类型限制为 `.lcproj.json` 或明确 JSON 文件。
- Renderer 继续通过 adapter 调用，不直接访问文件系统。
- 保存输出应使用稳定 JSON 格式。
- 打开文件后必须走 schema parse，不允许绕过 `ProjectRepository`。

验收标准：

- 用户可以从本地选择 `.lcproj.json` 打开。
- 打开非法 JSON 或 schema 不匹配文件时，UI 有明确错误反馈。
- 用户可以保存当前项目到原路径。
- 用户可以另存为新 `.lcproj.json`。
- 保存后的文件可以重新打开，并通过 schema parse。
- Renderer 不直接引入 Node fs/path/process。

## 5. 架构风险

### P2：架构检查脚本未覆盖 `.tsx`

位置：

- `scripts/check-architecture.mjs`

当前问题：

```text
collectFiles() only includes files ending with .ts
```

这会漏掉大部分 React UI 文件，例如：

- `packages/editor-ui/src/components/AppShell.tsx`
- `packages/editor-ui/src/components/InspectorPanel.tsx`
- `packages/editor-ui/src/graph/GraphCanvas.tsx`
- `apps/desktop/src/App.tsx`

当前人工抽查未发现明显脏依赖，但机器 guard 存在盲区。Phase 2 会继续扩展 UI 与规则表达，如果 `.tsx` 不纳入架构检查，后续很容易把领域规则、Tauri 能力或 React Flow 内部对象错误写入不该进入的层。

修复要求：

- `collectFiles()` 同时收集 `.ts` 与 `.tsx`。
- 保持测试文件可被检查，除非明确有合理例外。
- 修复后重新运行 `architecture:check` 与完整 `Validate.cmd`。

验收标准：

- `.tsx` 文件中的 forbidden import 能被发现。
- `packages/workbench` 仍不能依赖 React、React Flow、Tauri、DOM、Node 文件系统。
- `packages/core` 仍不能依赖 UI、Workbench、Tauri、Node 文件系统。
- `packages/editor-ui` 不直接依赖 Tauri 或 Node 文件系统。

## 6. 已通过项

### Dashboard 与模板入口

当前已满足 Phase 1.5 对启动体验的主要要求：

- 启动后先进入 Dashboard。
- 支持从模板开始。
- 支持打开 sample project。
- 模板覆盖传统迷宫、Zelda Mini Dungeon、Horror Puzzle、Narrative Labyrinth、Metroidvania Loop、Escape Room、Start Blank。

建议后续增强：

- 增加最近项目列表。
- 增加模板分类筛选。
- 将 Dashboard 与真实 open file command 接起来。

### Inspector

当前已明显补齐：

- SpaceInspector
- ConnectionInspector
- GateInspector
- TokenInspector
- PuzzleInspector
- BeatInspector

Inspector 的职责边界基本健康：展示和编辑对象属性，通过回调进入 workbench/app 层更新，没有在 UI 内重新实现核心验证规则。

建议后续增强：

- 对 required/output token 这类关系字段增加更清晰的空状态。
- 对无效引用或危险结构增加非侵入提示，但语义必须来自 core diagnostics。
- 将复杂 Inspector 拆分为更小的 feature 文件，避免单文件继续膨胀。

### Graph Canvas

当前已从 Space-only 原型推进为可表达更多实体的图：

- Space 节点可见。
- Token 节点可见。
- Puzzle 节点可见。
- Connection 以边呈现。
- 诊断选中/实体选中通路基本成立。

后续差距：

- Gate 仍主要作为 connection edge label，而不是独立可视对象。
- Beat 尚未进入主图表达。
- Progression View / Reachability Simulator 尚未实现。

这些不是 Phase 1.5 阻塞项，但应进入 Phase 2 UI 计划。

### Validation Panel

当前 Diagnostics 已移动到底部区域，方向正确：

- Inspector 专注对象属性。
- Validation Panel 专注验证结果。
- 这比 Phase 1 时把诊断塞在右侧更符合 UI/UX 文档。

后续建议：

- 增加按 severity / entity kind 过滤。
- 增加点击诊断后更明显的 graph 高亮。
- 增加 “why / fix hint” 展开信息，但不要在 UI 内推断领域语义。

## 7. 是否可以进入 Phase 2

当前不建议直接进入 Phase 2。

原因不是 UI 方向不对，而是 Phase 1.5 的 P1 文件能力仍未完成。Phase 2 预计会引入更复杂的规则包、模拟、导出、可能还有更多项目工作流。如果在真实 open/save 仍是 stub 的情况下进入 Phase 2，会导致后续所有功能都建立在不可真实落盘的假闭环上。

建议先做一个小的 Phase 1.5 Fix：

1. 实现 Tauri open/save/save-as。
2. 修复 architecture check 对 `.tsx` 的覆盖。
3. 对文件能力补最小测试或 smoke。
4. 跑完整 `Validate.cmd` 与 `Smoke.cmd`。
5. 手动验证打开、保存、另存为、重新打开。

完成后可以重新验收。若上述全部通过，则 Phase 1.5 可以判定通过，并进入 Phase 2。

## 8. 给后续开发 AI 的执行清单

优先级 P1：

- 实现 Tauri 文件 open/save/save-as command。
- 更新 `createDesktopAdapters.ts`，让它调用 Tauri command，而不是返回 sample 或 browser download。
- 保留 browser fallback 只作为明确 Web/demo fallback，不作为 desktop 主路径。
- 确保 `.lcproj.json` 打开后通过 `ProjectRepository` 解析。
- 确保保存使用 canonical ProjectGraph，不保存 selection、hover、viewport、panel state、React Flow nodes/edges。

优先级 P2：

- 修改 `scripts/check-architecture.mjs`，扫描 `.tsx`。
- 补一个架构检查反例测试或脚本用例，确保 `.tsx` forbidden import 会失败。
- 将过大的 Inspector 文件逐步拆分为对象级 inspector 文件。
- 优化新建 Puzzle 的默认状态，避免 input/output 使用同一个 token 带来的体验歧义。

复验命令：

```powershell
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\Validate.cmd
C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\Smoke.cmd
```

人工复验流程：

1. 启动桌面或 dev server。
2. 从 Dashboard 新建模板项目。
3. 保存为本地 `.lcproj.json`。
4. 关闭或返回 Dashboard。
5. 重新打开刚保存的文件。
6. 修改 Space / Gate / Token / Puzzle 任一字段。
7. 保存到原路径。
8. 再次打开并确认修改仍存在。
9. 打开非法 JSON，确认 UI 有明确错误反馈。
10. 运行 Validate，确认诊断仍来自 core/workbench，不来自 UI 重写逻辑。

## 9. 最终判定

```text
机器验证: 通过
UI/UX 改善: 通过
架构边界: 基本通过，但 guard 需补 .tsx
真实文件工作流: 未通过
Phase 1.5 总体验收: 暂不通过
进入 Phase 2: 暂缓
```

当前项目已经很接近 Phase 1.5 目标。只要把 Tauri 文件能力补实，并让架构检查覆盖 `.tsx`，就可以把 Phase 1.5 收口，然后进入 Phase 2。
