# Phase 3 Acceptance Review

Date: 2026-06-16

Phase 3 moves Labyrinth Composer from local analysis toward production handoff while keeping `ProjectGraph` as the canonical source of truth.

## Round Summary

- Round 1: Engine export contract and CLI export command.
  Commit: `b524caf feat: add phase 3 engine export`
- Round 2: Unity and Godot importer examples consuming shared engine JSON.
  Commit: `79a8080 feat: add phase 3 engine importer examples`
- Round 3: CI-mode CLI behavior, strict exit-code tests, JSON artifacts, and workflow example.
  Commit: `2332a25 test: add phase 3 ci workflow coverage`
- Round 4: Review threads, comments, commands, selectors, service, and Review Panel.
  Commit: `c809997 feat: add phase 3 review data workflow`
- Round 5: `.lcproj` package prototype, package artifact paths, CLI package read/write smoke, and migration-risk notes.
  Commit: `f38676c feat: add phase 3 lcproj package prototype`
- Round 6: Experimental Yjs command adapter with two-client replay tests and architecture guard coverage.
  Commit: `9830b35 feat: add phase 3 collaboration prototype`
- Round 7: Desktop engine JSON export service, Export Panel, Tauri save adapter, final validation, and acceptance review.

## Acceptance Matrix

| Requirement                                                                          | Result | Evidence                                                                                                                                              |
| ------------------------------------------------------------------------------------ | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Engine export JSON is generated from `ProjectGraph + ValidationResult + RulePreset`  | Pass   | `packages/exporters/src/engineExportModel.ts`, CLI `export`, workbench `createEngineExportText`                                                       |
| Engine export is stable and excludes UI state                                        | Pass   | `packages/exporters/src/engineExportModel.test.ts`                                                                                                    |
| CLI can validate/report/export with CI-safe JSON and exit codes                      | Pass   | `apps/cli/src/cli.test.ts`, `.github/workflows/labyrinth-validate.yml.example`                                                                        |
| Unity and Godot examples can locate Space/Gate/Token from shared export JSON         | Pass   | `examples/importer-contract.test.ts`, `examples/unity-importer`, `examples/godot-importer`                                                            |
| Review data is structured, saved in project data, and targets `EntityRef`            | Pass   | `packages/schema/src/review.ts`, `packages/schema/src/project.test.ts`                                                                                |
| Review editing goes through undoable Workbench commands                              | Pass   | `packages/workbench/src/commands/commandBus.test.ts`                                                                                                  |
| Review does not participate in core validation                                       | Pass   | `packages/workbench/src/store/createWorkbenchStore.test.ts`                                                                                           |
| `.lcproj` package keeps only `project.json` canonical                                | Pass   | `packages/schema/src/lcprojPackage.ts`, `docs/lcproj-package-prototype.md`                                                                            |
| CLI can read `.lcproj/project.json` and write package artifacts                      | Pass   | `apps/cli/src/projectSource.ts`, `apps/cli/src/cli.test.ts`                                                                                           |
| Collaboration prototype proves Command to Yjs update and replay back to ProjectGraph | Pass   | `packages/collaboration-prototype/src/entityGraphAdapter.test.ts`                                                                                     |
| Main desktop/workbench/core/schema do not depend on Yjs                              | Pass   | `scripts/check-architecture.mjs`                                                                                                                      |
| Desktop can save engine JSON without generating export content in the adapter        | Pass   | `packages/workbench/src/services/engineExportService.ts`, `apps/desktop/src/bootstrap/createDesktopAdapters.ts`, `apps/desktop/src-tauri/src/main.rs` |

## Final Verification

- `Validate.cmd`: passed.
- `Smoke.cmd`: passed.
- `cargo check` in `apps/desktop/src-tauri`: passed.
- `architecture:check`: passed.
- CLI smoke:
  - `validate --strict --format json`: passed on `horror-clinic`.
  - `report --format json --out`: wrote JSON artifact.
  - `export --target engine-json --out`: wrote engine JSON artifact.
- Browser smoke:
  - Dashboard opens.
  - Workbench opens from `Start Blank`.
  - Export Panel renders with `Engine JSON`.
  - Review and Report panels remain present in the right panel flow.

## Architecture Review

- `packages/core` still has no dependency on exporters, workbench, editor UI, desktop, CLI, Yjs, Unity, or Godot.
- `packages/schema` holds contracts only and has no runtime dependency on app/UI/workbench/exporter layers.
- `packages/exporters` remains pure and does not read or write files.
- `packages/workbench` composes schema/core/rulesets/exporters and does not import React, DOM, Tauri, Node, or Yjs.
- `packages/editor-ui` imports schema/workbench/React UI dependencies only.
- `packages/collaboration-prototype` is experimental. Architecture checks forbid other packages from importing it.
- `examples/unity-importer` and `examples/godot-importer` consume generated JSON and do not import workspace packages.

## Residual Risks

- `.lcproj` is still a prototype and is not the default save format.
- Collaboration is an adapter proof, not a product feature. It has no presence model, conflict UI, or persistence policy.
- Desktop `.lcproj` directory open is still optional; CLI package read/write is the implemented minimum path.
- Engine export currently has one stable JSON target. Unity/Godot-specific shaping remains deliberately outside the main schema.

## Decision

Phase 3 passes acceptance. The production handoff surfaces are present, tested, and guarded by architecture checks without changing the core project truth model.
