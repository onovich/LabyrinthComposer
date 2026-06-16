# Phase 4 Acceptance Review

Date: 2026-06-16

Phase 4 hardens the existing Phase 0-3 product path into a beta-ready workflow without expanding the canonical project truth beyond `ProjectGraph`.

## Round Summary

- Round 1: Unified CLI and Workbench validation semantics, including ruleset-aware strict mode and CI artifact examples.
  Commit: `1fec809 feat: unify validation semantics`
- Round 2: Hardened `.lcproj` package open/save behavior so only `project.json` remains canonical.
  Commit: `6264eeb feat: harden lcproj package path`
- Round 3: Improved desktop save reliability with staged writes, backup restore, save-failure tests, and migration placeholders.
  Commit: `ab73a7b feat: harden project save reliability`
- Round 4: Added deferred validation worker flow, stale result protection, large project fixture, and performance smoke coverage.
  Commit: `3c86e98 feat: add deferred validation worker`
- Round 5: Reordered the workbench production panels, added responsive layout protection, and verified desktop/mobile viewport behavior.
  Commit: `190a89d feat: harden workbench layout`
- Round 6: Added Playwright E2E workflow coverage, local release dry-run checks, ops workflow wiring, and this acceptance review.

## Acceptance Matrix

| Requirement                                                        | Result | Evidence                                                                                                                  |
| ------------------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------- |
| CLI and Workbench use the same validation composition              | Pass   | `packages/workbench/src/services/validationService.ts`, `apps/cli/src/commands/validate.ts`, `apps/cli/src/cli.test.ts`   |
| Ruleset warnings fail strict CLI validation consistently           | Pass   | `apps/cli/src/cli.test.ts`, `.github/workflows/labyrinth-validate.yml.example`                                            |
| `.lcproj` package opens from `project.json` only                   | Pass   | `packages/schema/src/lcprojPackage.ts`, `apps/desktop/src-tauri/src/main.rs`, `packages/schema/src/lcprojPackage.test.ts` |
| Generated package artifacts do not participate in validation truth | Pass   | `apps/cli/src/cli.test.ts`, package corruption validation test                                                            |
| Desktop save failure does not falsely clear dirty state            | Pass   | `packages/workbench/src/services/projectRepository.test.ts`, Tauri staged-write tests                                     |
| Validation worker is an app adapter, not a duplicate rules engine  | Pass   | `apps/desktop/src/workers/validationWorker.ts`, `packages/workbench/src/services/validationService.ts`                    |
| Large project validation has a beta smoke baseline                 | Pass   | `packages/test-fixtures/src/largeProject.ts`, `packages/workbench/src/services/validationService.test.ts`                 |
| UI remains light-only, scan-friendly, and responsive               | Pass   | `packages/editor-ui/src/components/AppShell.tsx`, `packages/editor-ui/src/styles/workbench.css`, Browser viewport smoke   |
| Playwright E2E covers the beta user path through UI only           | Pass   | `tests/e2e/desktop-workflow.spec.ts`, `playwright.config.ts`                                                              |
| Release dry-run is repeatable and does not publish                 | Pass   | `.codex/project-ops-workflow.json`, `scripts/release-dry-run.mjs`                                                         |
| Build artifacts are ignored and untracked                          | Pass   | `.gitignore`, `scripts/release-dry-run.mjs`                                                                               |

## Final Verification

- `Validate.cmd`: passed.
  - Latest test run: 38 test files, 109 tests.
  - Large validation smoke observed at approximately 19-22 ms for the 80-space fixture.
- `Smoke.cmd`: passed.
  - CLI validation smoke passed on `horror-clinic`.
  - Desktop Vite bundle smoke passed.
- `npx --yes pnpm@11.7.0 architecture:check`: passed.
- `npx --yes pnpm@11.7.0 e2e`: passed.
  - Open dashboard.
  - Select `Horror Puzzle`.
  - Create and rename a space.
  - Run Validate.
  - Add a review thread, add a comment, resolve the thread.
  - Download Engine JSON.
  - Download Markdown and JSON reports.
- `cargo fmt --check --manifest-path apps/desktop/src-tauri/Cargo.toml`: passed.
- `cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml`: passed.
- `npx --yes pnpm@11.7.0 release:dry-run`: passed.
  - Desktop bundle exists.
  - Tauri `frontendDist` points to `apps/desktop/dist`.
  - JS and CSS assets exist.
  - `apps/desktop/dist`, `apps/desktop/src-tauri/gen`, and `apps/desktop/src-tauri/target` are ignored and untracked.
- `ReleaseDryRun.cmd`: passed as the combined local release gate.

## Browser Smoke

- In-app Browser at 1440x1000:
  - Loaded `Horror Puzzle`.
  - Right panel order: Export, Review, Report, Rule Preset, Timeline, Inspector.
  - Graph, right panel, topbar, and diagnostics did not overlap.
  - Desktop shell stayed at viewport height while the right panel scrolled independently.
- In-app Browser at 390x844:
  - Sidebar, topbar, graph, right panel, and diagnostics stacked vertically.
  - No horizontal overflow was detected for buttons, controls, inputs, or panels.
  - Review `Thread` action created a thread.
  - Engine JSON and Markdown report actions were clickable.
- Screenshot artifacts:
  - `C:\Users\ADMINI~1\AppData\Local\Temp\phase4-round5-desktop.png`
  - `C:\Users\ADMINI~1\AppData\Local\Temp\phase4-round5-mobile.png`

## Architecture Review

- `ProjectGraph` remains the only canonical project truth.
- No React Flow node positions, viewport, selection, validation result, report text, engine export text, worker cache, or layout cache were added to `ProjectGraph`.
- `.lcproj/project.json` remains the only package truth. `exports`, `reports`, and `cache` are treated as generated artifacts.
- `packages/core` still owns validation algorithms and does not depend on rulesets, workbench, exporters, UI, desktop, CLI, Tauri, React, Node filesystem APIs, or collaboration providers.
- `packages/schema` remains a contract layer and does not import app, UI, workbench, exporter, ruleset, or core runtime logic.
- `packages/workbench` composes schema/core/rulesets/exporters services and remains free of React, DOM, Tauri, Worker, and filesystem dependencies.
- `apps/desktop` owns host capabilities: worker lifecycle, file dialogs, package open/save, export save-as, and browser download fallback.
- `packages/editor-ui` renders view models and emits callbacks only; it does not generate report/export domain content or interpret ruleset semantics.
- `tests/e2e` is now covered by architecture check and may only import `@playwright/test`.
- Real-time collaboration is not part of the product path. Architecture checks continue to forbid collaboration provider dependencies in main packages.

## Residual Risks

- Playwright uses system Chrome locally when bundled Playwright Chromium is not installed. CI should either install Playwright browsers or set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.
- The release dry-run verifies local bundle inputs and Tauri compile readiness; it does not create a signed installer.
- `.lcproj/assets` remains opaque and intentionally outside validation/migration truth.
- Layout is deterministic and view-model-derived today. No persistent layout cache was introduced in Phase 4.

## Decision

Phase 4 passes acceptance for the beta hardening target. A designer can open a sample, edit, validate, review, export engine JSON, export reports, and use the desktop package/save path while CLI/CI receive the same validation semantics. The architecture guardrails still keep UI, worker, generated artifacts, and host capabilities out of the canonical domain model.
