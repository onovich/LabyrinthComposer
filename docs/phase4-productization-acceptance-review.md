# Phase 4 Productization Acceptance Review

Date: 2026-06-17

Status: Pass for local Release Candidate trial after local gate.

## Scope

This review covers the unified Phase 4 productization plan: a solo, local-first puzzle design and validation workflow for an independent game developer. It does not continue the cancelled collaboration direction, and it does not authorize signing, publishing, cloud sync, accounts, telemetry, AI generation, or store upload.

## Acceptance Matrix

| Area | Status | Evidence |
| ---- | ------ | -------- |
| Productized single-user E2E | Pass | `tests/e2e/desktop-workflow.spec.ts` covers template start, editing, validation, self-review note, save-as JSON, Engine JSON export, Markdown report export, JSON report export, and viewport checks. |
| `.lcproj` package hardening | Pass | `apps/cli/src/cli.test.ts`, `packages/schema/src/project.test.ts`, and `docs/user/package-format.md` cover corrupted `project.json`, missing generated directories, corrupted generated artifacts, manifest boundary, and AssetRef behavior. |
| Export contract stability | Pass | `packages/exporters/src/engineExportModel.test.ts` compares `createEngineExport` with `examples/engine-export/sample-engine-export.json`; `examples/importer-contract.test.ts` keeps Unity and Godot examples on the same JSON DTO. |
| CLI/report/export contract | Pass | CLI tests cover validation JSON, warning/strict semantics, report generation, export generation, target listing, and package output behavior. |
| Existing ruleset stability | Pass | Validate gate covers `maze.standard`, `zelda.mini-dungeon`, and `horror.clinic` fixtures without adding a new large rule domain. |
| Personal self-review UI semantics | Pass | User-visible copy now presents `Self Review`, `Notes`, and note-oriented actions while preserving compatible schema/command names. |
| UI viewport smoke | Pass | Playwright verifies the workbench at `1440x1000` and `390x844`, including no horizontal overflow in the productized workflow. |
| RC dry-run boundary | Pass | `ReleaseDryRun.cmd` writes `artifacts/release-candidate/manifest.json` in an ignored output directory, keeps publish/signing disabled, and does not upload or sign artifacts. |
| Architecture boundaries | Pass | `architecture:check` blocks collaboration/provider/presence/cursor/session regressions and keeps Workbench, Editor UI, exporters, CLI, Desktop host, and release scripts within their responsibilities. |

## Local Gate

Verification on 2026-06-17:

| Command | Result |
| ------- | ------ |
| `C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\Validate.cmd` | Pass. Lint, typecheck, build, 40 unit test files / 129 tests, architecture check, docs check, and CI workflow check passed. |
| `C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\Smoke.cmd` | Pass. CLI validation smoke passed on `horror-clinic`; desktop Vite bundle smoke passed. |
| `npx --yes pnpm@11.7.0 e2e` | Pass. 2 Playwright tests passed: full productized desktop workflow and mobile acceptance viewport. |
| `cargo fmt --check --manifest-path apps/desktop/src-tauri/Cargo.toml` | Pass. |
| `cargo check --manifest-path apps/desktop/src-tauri/Cargo.toml` | Pass. |
| `C:\Users\Administrator\.codex\skills\project-ops-workflow\scripts\ops\ReleaseDryRun.cmd` | Pass. Re-ran Validate, Smoke, E2E, Rust checks, and `release:dry-run`; wrote `artifacts/release-candidate/manifest.json`. |

The latest dry-run manifest contains:

- `dryRun: true`
- `publish.enabled: false`
- `signing.enabled: false`
- `artifact.baseName: Labyrinth-Composer-0.1.0-windows-x64-84d8ab68bf05`
- `desktop.assetCount: 7`

## Self-Review

Bug self-check found one active productization wording issue after the first RC dry-run: the generated manifest still said `Phase 5 release gate verifies artifacts only and does not publish.` This was corrected to `Phase 4 productization gate verifies artifacts only and does not publish.` A unit assertion was added in `scripts/release-dry-run-policy.test.mjs`, then the relevant test, architecture check, and full `ReleaseDryRun.cmd` passed.

Architecture self-check passed:

- `ProjectGraph` remains the only canonical project truth.
- `.lcproj/project.json` remains the only package truth; generated `exports/`, `reports/`, and `cache/` do not participate in validation truth.
- Export/report outputs remain derived artifacts and do not write back into `ProjectGraph`.
- Exporters remain pure; Desktop and CLI own IO.
- Workbench remains free of React, DOM, Tauri, filesystem, workers, and collaboration providers.
- Editor UI renders view models and callbacks instead of implementing domain algorithms.
- Release dry-run inspects build outputs and git artifact policy; it does not reimplement validation/export logic and does not publish.

## Residual Risks

- The dry-run verifies local release readiness but does not produce a signed installer.
- Playwright uses the configured local browser environment; CI still needs its normal browser setup.
- AssetRef remains a portable reference contract. Missing files are allowed, while unknown asset kinds are rejected by schema.
- Historical Phase 4 and Phase 5 docs remain as completed evidence, but the active next-stage product plan is this unified Phase 4 productization track.
- Remote GitHub Actions must be confirmed after the final push for the pushed commit.

## Decision

Phase 4 productization passes the local acceptance gate and is ready to enter `release candidate trial`.

Recommended next step: run a local RC trial with real project files and installation/package review. `product iteration` should follow only from real usage feedback, and `new product direction review` should remain separate from this release path.
